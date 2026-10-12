/* ============================================================================
   ART NEXUS — DADOS DE JOGO (países, economia, frases de crítica)
   ============================================================================ */

const COUNTRIES = {
  "Itália":       { flag:"🇮🇹", lang:"it-IT", ticket:18, visitors:220, transport:4000, staff:300, insuranceRate:0.00022 },
  "Holanda":      { flag:"🇳🇱", lang:"nl-NL", ticket:16, visitors:180, transport:3500, staff:280, insuranceRate:0.00020 },
  "França":       { flag:"🇫🇷", lang:"fr-FR", ticket:17, visitors:240, transport:3800, staff:320, insuranceRate:0.00022 },
  "Espanha":      { flag:"🇪🇸", lang:"es-ES", ticket:14, visitors:160, transport:3000, staff:250, insuranceRate:0.00018 },
  "Alemanha":     { flag:"🇩🇪", lang:"de-DE", ticket:15, visitors:170, transport:3200, staff:260, insuranceRate:0.00019 },
  "Reino Unido":  { flag:"🇬🇧", lang:"en-GB", ticket:20, visitors:250, transport:4500, staff:350, insuranceRate:0.00025 },
  "Áustria":      { flag:"🇦🇹", lang:"de-AT", ticket:13, visitors:120, transport:2800, staff:220, insuranceRate:0.00016 },
  "Brasil":       { flag:"🇧🇷", lang:"pt-BR", ticket:8,  visitors:140, transport:800,  staff:150, insuranceRate:0.00012 },
};

const TIER_LABELS = {1:"Emergente",2:"Promissor",3:"Reconhecido",4:"Mestre",5:"Raro",6:"Lendário"};
const TIER_COLORS = {1:"#7c9473",2:"#7c9473",3:"#c9a13b",4:"#c9a13b",5:"#b5484f",6:"#b5484f"};

const PLAYER_SHARE = 0.35;      // parte do ingresso que fica com o jogador
const KNOWLEDGE_PER_DAY = 1;    // conhecimento ganho por dia de exposição
const KNOWLEDGE_PER_ACQUISITION_VIEW = 2; // ao abrir a ficha de uma obra nova

// Multiplicador de atração de público por faixa de valor: uma obra lendária
// enche a galeria e justifica ingresso mais caro, enquanto uma obra de artista
// emergente atrai pouca gente. Sem isso, obras caras só acumulariam seguro
// sem trazer retorno, e não haveria razão para subir de faixa.
const TIER_DRAW = { 1:0.55, 2:0.75, 3:1.0, 4:1.45, 5:2.1, 6:3.2 };
// Obras de mais prestígio também sustentam ingresso mais caro.
const TIER_TICKET_MULT = { 1:0.7, 2:0.85, 3:1.0, 4:1.2, 5:1.5, 6:1.9 };

// Frases curtas e originais (não são citações de ninguém real) usadas pelos
// "visitantes" e "críticos" durante a exposição — variam por evento, não por país,
// mas são faladas com a voz/sotaque do idioma do país via SpeechSynthesis.
const CRITIC_LINES = {
  elogio: [
    "Que composição extraordinária.",
    "A luz nesta obra é simplesmente hipnotizante.",
    "Uma peça que honra a coleção deste ano.",
    "Os visitantes não param de comentar esta tela.",
    "Um verdadeiro triunfo de técnica e sensibilidade.",
    "Esta exposição está sendo um sucesso absoluto.",
  ],
  critica: [
    "Esperava uma curadoria mais ousada.",
    "A iluminação da sala prejudica um pouco a obra.",
    "Já vi retrospectivas mais bem organizadas.",
    "O preço do ingresso parece alto para o que se vê.",
    "Achei o espaço pequeno para uma obra desse porte.",
  ],
};

const EVENT_LABELS = { it:"Crítico Italiano", nl:"Visitante Holandês", fr:"Crítica Francesa",
  es:"Colecionador Espanhol", de:"Curador Alemão", en:"Jornalista Britânico",
  at:"Visitante Austríaco", pt:"Visitante Local" };

function langCodeShort(lang){ return lang.split("-")[0]; }

// Embaralhamento Fisher-Yates, usado pelo quiz e pelos leilões.
// Devolve uma cópia; não altera o array original.
function shuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ----------------------------------------------------------------------------
   MERCADO DE ARTE
   O valor das obras oscila diariamente. Obras de artistas consagrados são mais
   voláteis (sobem e descem mais forte); obras de emergentes andam de lado.
   Há ainda uma valorização estrutural lenta, que premia segurar boas obras.
   ---------------------------------------------------------------------------- */

// Volatilidade diária por faixa (desvio da oscilação aleatória)
const TIER_VOLATILITY = { 1:0.004, 2:0.008, 3:0.014, 4:0.022, 5:0.032, 6:0.045 };
// Valorização estrutural diária: obra consagrada aprecia mais no longo prazo
const TIER_DRIFT      = { 1:0.00025, 2:0.00035, 3:0.00050, 4:0.00070, 5:0.00090, 6:0.00115 };
// Força que puxa o preço de volta à tendência, para o mercado não disparar
const MEAN_REVERSION = 0.010;
// Teto natural de valorização de cada faixa (âncora da reversão)
const TIER_ANCHOR = { 1:1.10, 2:1.15, 3:1.25, 4:1.40, 5:1.55, 6:1.75 };
// Limites para o valor não disparar nem virar pó
const MARKET_FLOOR = 0.45, MARKET_CEIL = 4.0;
// Comissão da casa de leilões ao vender
const SALE_COMMISSION = 0.10;

// Manchetes de valorização (destaque do artista) e de roubo
const NEWS_GOOD = [
  { titulo:"RETROSPECTIVA LOTA MUSEU", texto:"Mostra dedicada a {artista} bate recorde de público e reacende a disputa por suas obras." },
  { titulo:"CRÍTICA REAVALIA MESTRE", texto:"Nova leitura da obra de {artista} domina os cadernos de cultura e pressiona os preços." },
  { titulo:"LEILÃO SURPREENDE", texto:"Peça de {artista} supera a estimativa em Londres e puxa toda a produção do artista." },
  { titulo:"MUSEU ANUNCIA AQUISIÇÃO", texto:"Instituição confirma compra de um {artista} e aquece o mercado para o período." },
  { titulo:"DOCUMENTÁRIO REVELA ARQUIVO", texto:"Cartas inéditas de {artista} viram filme e renovam o interesse de colecionadores." },
];
const NEWS_BAD = [
  { titulo:"ROUBO EM GALERIA", texto:"Obras desapareceram de um acervo em {pais}. Seguradoras reavaliam o risco da praça." },
  { titulo:"FURTO ABALA O SETOR", texto:"Assalto a museu em {pais} derruba a confiança e trava negócios na região." },
  { titulo:"ESCÂNDALO DE FALSIFICAÇÃO", texto:"Peritos apontam falsos em circulação em {pais}; compradores recuam." },
];

/* ----------------------------------------------------------------------------
   OBRAS FIXAS (patrimônio tombado, não podem ser deslocadas — ex: esculturas
   monumentais do Aleijadinho). Em vez de "expor em outro país", o jogador
   organiza excursões ou fecha acordos de visitação no próprio local da obra.
   ---------------------------------------------------------------------------- */
const AGREEMENT_TYPES = {
  "Excursão Turística": { icon:"🚌", groupSize:60, ticket:26, sessionCost:520, freqLabel:"por dia", knowledgeBonus:1 },
  "Acordo com Escolas": { icon:"🎒", groupSize:95, ticket:11, sessionCost:300, freqLabel:"por dia letivo", knowledgeBonus:4 },
  "Convênio Empresarial": { icon:"🏢", groupSize:34, ticket:58, sessionCost:640, freqLabel:"por evento", knowledgeBonus:1 },
};


/* ============================================================================
   SALAS DE EXPOSIÇÃO
   Cada país tem três salas: uma modesta, uma intermediária e uma de prestígio.
   Nomes de salas são fictícios; as cidades são reais.
   Atributos de 0 a 100. O Prestígio é a média ponderada dos quatro e define as
   estrelas. Salas alugadas têm atributos fixos; salas compradas podem receber
   upgrades até 5 estrelas.
   ============================================================================ */
const SALA_CIDADES = {
  "Itália":["Florença","Milão","Roma"],          "Holanda":["Delft","Haia","Amsterdã"],
  "França":["Arles","Lyon","Paris"],             "Espanha":["Sevilha","Barcelona","Madri"],
  "Alemanha":["Leipzig","Dresden","Berlim"],     "Reino Unido":["Bath","Edimburgo","Londres"],
  "Áustria":["Salzburgo","Graz","Viena"],        "Brasil":["Ouro Preto","Rio de Janeiro","São Paulo"],
};
const SALA_MODELOS = [
  { tipo:"Ateliê",   attrs:{ ilum:40, clima:35, seg:25, cap:50 }, aluguel:300,  preco:150000 },
  { tipo:"Galeria",  attrs:{ ilum:65, clima:60, seg:55, cap:70 }, aluguel:1200, preco:900000 },
  { tipo:"Palacete", attrs:{ ilum:95, clima:90, seg:90, cap:88 }, aluguel:4200, preco:3800000 },
];
const SALA_PESOS = { ilum:.30, clima:.25, seg:.25, cap:.20 };
const SALA_ATTR_NOMES = { ilum:"Iluminação museológica", clima:"Climatização e conservação", seg:"Segurança e anti-furto", cap:"Capacidade e conforto" };
// custo-base de cada upgrade (+20 pontos); cresce com o nível atual e o país
const SALA_UPGRADE_BASE = { ilum:12000, clima:18000, seg:25000, cap:15000 };
// limites de prestígio para cada estrela
const ESTRELA_LIMITES = [0, 40, 55, 70, 85];          // 1★ <40, 2★ 40–54 ... 5★ ≥85
// bônus sobre a receita de ingressos, por estrela (sorteado dia a dia na faixa)
const ESTRELA_BONUS = { 1:[.10,.25], 2:[.26,.45], 3:[.46,.70], 4:[.71,1.00], 5:[1.01,1.50] };
const CLASSE_MIN_5_ESTRELAS = 35;                      // reputação exigida para expor em 5★

/* ============================================================================
   CLASSES DE REPUTAÇÃO (1 a 50) — a reputação vai de 0 a 100
   ============================================================================ */
const CLASSE_TITULOS = [
  [1,"Aprendiz de marchand"], [11,"Marchand regional"], [21,"Galerista"],
  [31,"Colecionador internacional"], [41,"Mecenas lendário"],
];

/* ============================================================================
   BANCOS — juros ao mês, reduzidos conforme a classe de reputação
   ============================================================================ */
const BANCOS = [
  { id:"coop",   nome:"Banco Cooperativo",          icone:"🤝", juros:.018, limite:300000,   classeMin:1,
    desc:"Crédito pequeno e juros moderados. Porta de entrada para quem está começando." },
  { id:"nac",    nome:"Comercial Nacional",         icone:"🏦", juros:.022, limite:1500000,  classeMin:10,
    desc:"Limite maior, juros de mercado. Exige histórico mínimo." },
  { id:"elite",  nome:"Investimento de Elite",      icone:"💎", juros:.009, limite:12000000, classeMin:30,
    desc:"Os menores juros e os maiores limites. Só para colecionadores de peso." },
  { id:"penhor", nome:"Fundo de Penhor de Arte",    icone:"🖼️", juros:.015, limite:null,     classeMin:1,
    desc:"Empresta até 60% do valor de uma obra sua, que fica como garantia. Atrasar duas parcelas custa a obra." },
  { id:"sombra", nome:"Mercado Sombra",             icone:"🕶️", juros:.065, limite:2000000,  classeMin:1,
    desc:"Factoring clandestino: dinheiro rápido, sem perguntas e juros altíssimos. Atraso queima muita reputação." },
];
const PARCELA_A_CADA_DIAS = 30;     // uma parcela a cada 30 dias de mercado
