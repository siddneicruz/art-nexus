/* ============================================================================
   VINCENT VAN GOGH — trilha de vida e obra
   Base factual: https://www.ebiografia.com/van_gogh/ (datas, lugares, pessoas,
   obras e técnica). Onde a página é contraditória (ex.: "Quarto em Arles"
   1888/1889, "Pai Tanguy" 1887/1888) a pergunta usa só a data mais aceita ou
   nem entra. Frases marcadas como "carta" são trechos de cartas a Theo em
   tradução livre.
   Estrutura: 9 capítulos (juventude → morte) + 3 modos extras.
   ============================================================================ */

const VG_CAPITULOS = [
  { id:"zundert", n:1, icone:"🌾", titulo:"Zundert", anos:"1853–1869", lugar:"Zundert, Países Baixos",
    resumo:"Vincent Willem van Gogh nasce em 30 de março de 1853, numa pequena aldeia holandesa, filho de um pastor calvinista. Criança rebelde e pouco sociável, ganha na infância o irmão que será o amor da sua vida: Theo.",
    obras:[] },
  { id:"goupil", n:2, icone:"🏛️", titulo:"A galeria Goupil", anos:"1869–1876", lugar:"Haia · Bruxelas · Londres · Paris",
    resumo:"Aos 16 anos vai trabalhar com o tio na Goupil, empresa de comércio de obras de arte e livros. Passa por Haia, Bruxelas, Londres e Paris — vendendo arte antes de pintá-la — até ser demitido, em 1876, após desentendimentos com clientes.",
    obras:[] },
  { id:"fe", n:3, icone:"✝️", titulo:"Fé e crise", anos:"1876–1879", lugar:"Inglaterra · Dordrecht · Amsterdã · Borinage",
    resumo:"Professor primário, livreiro, aspirante a pastor: Vincent procura um propósito. Reprovado no seminário, vai pregar entre os mineiros de Borinage, na Bélgica, onde se dedica demais aos doentes e às crianças — e é demitido. Nessa época surgem a depressão e as crises nervosas.",
    obras:[] },
  { id:"artista", n:4, icone:"✏️", titulo:"Nasce o artista", anos:"1880–1883", lugar:"Bruxelas · Haia",
    resumo:"Com o dinheiro enviado por Theo, estuda anatomia e perspectiva e passa os dias desenhando. Em Haia é acolhido pelo pintor Mauve, faz aquarelas de marinheiros, pescadores e camponeses e, em julho de 1882, pinta o primeiro óleo.",
    frase:"“Eu não quero pintar quadros, eu quero pintar a vida.”", obras:["art-0049"] },
  { id:"nuenen", n:5, icone:"🥔", titulo:"Nuenen e Antuérpia", anos:"1884–1886", lugar:"Nuenen · Antuérpia",
    resumo:"Em Nuenen pinta a vida dura do campo: A Igreja em Nuenen (1884) e Os Comedores de Batata (1885), de ambiente sombrio, tons escuros e pinceladas espessas. O pai morre de repente em 1885; em novembro Vincent segue para Antuérpia e, em janeiro de 1886, entra na Academia.",
    obras:[] },
  { id:"paris", n:6, icone:"🗼", titulo:"Paris", anos:"1886–1888", lugar:"Paris, França",
    resumo:"Acolhido por Theo, que dirige a Goupil, Vincent mergulha na capital da arte: conhece Pissarro, Degas, Gauguin e Seurat e pinta cerca de 200 quadros em dois anos. Cansado e doente, segue o conselho de Toulouse-Lautrec e vai para o campo.",
    obras:["art-0072"] },
  { id:"arles", n:7, icone:"🌻", titulo:"Arles", anos:"1888–1889", lugar:"Arles, Provença",
    resumo:"Em fevereiro de 1888 chega a Arles e passa a pintar ao ar livre: mais de 100 quadros, cores vivas, camadas grossas de tinta, pinceladas fortes. É a fase de Girassóis, do Quarto em Arles e do sonho de um ateliê com Gauguin — que termina em crise, no fim do ano.",
    frase:"“Não sei nada com certeza, mas a visão das estrelas me faz sonhar.” (carta a Theo)",
    obras:["art-0060","art-0062","art-0071","art-0058","art-0061","art-0069","art-0077","art-0078"] },
  { id:"saintremy", n:8, icone:"🌌", titulo:"Saint-Rémy", anos:"1889–1890", lugar:"Saint-Rémy-de-Provence",
    resumo:"Em maio de 1889 pede ao irmão que o interne no hospital de Saint-Rémy e transforma o quarto em ateliê: mais de 200 quadros e centenas de desenhos, entre eles A Noite Estrelada. Signac visita, a crítica começa a elogiá-lo, e A Vinha Vermelha é o único quadro vendido em vida.",
    obras:["art-0068","art-0063","art-0054","art-0044"] },
  { id:"auvers", n:9, icone:"🌾", titulo:"Auvers", anos:"1890", lugar:"Auvers-sur-Oise, França",
    resumo:"Em maio de 1890 chega a Auvers, aos cuidados do Dr. Gachet, e em pouco mais de dois meses pinta mais de 40 quadros e faz mais de 200 desenhos — Trigal com Corvos, o Retrato do Dr. Gachet, A Igreja de Auvers. Morre em 29 de julho, aos 37 anos. A fama só viria depois.",
    obras:["art-0043","art-0066"] },
];

// Acontecimentos datados (linha do tempo). cap = capítulo; q = pergunta "em que ano"; curto = rótulo.
const VG_EVENTOS = [
  { ano:1853, cap:"zundert",   curto:"Nasce em Zundert",                              q:"Em que ano Vincent van Gogh nasceu?" },
  { ano:1869, cap:"goupil",    curto:"Começa na Galeria Goupil, em Haia",             q:"Em que ano Vincent começou a trabalhar na Galeria Goupil, em Haia?" },
  { ano:1875, cap:"goupil",    curto:"É transferido para Paris",                      q:"Em que ano Vincent conseguiu a transferência da Goupil para Paris?" },
  { ano:1876, cap:"goupil",    curto:"É demitido da Goupil",                          q:"Em que ano Vincent foi demitido da Goupil?" },
  { ano:1877, cap:"fe",        curto:"Trabalha numa livraria em Dordrecht",           q:"Em que ano Vincent trabalhou numa livraria em Dordrecht?" },
  { ano:1879, cap:"fe",        curto:"É demitido de missionário em Borinage",        q:"Em que ano Vincent foi demitido do posto de pregador nas minas de Borinage?" },
  { ano:1880, cap:"artista",   curto:"Estuda anatomia e perspectiva em Bruxelas",    q:"Em que ano Vincent foi para Bruxelas estudar anatomia e perspectiva com a ajuda de Theo?" },
  { ano:1881, cap:"artista",   curto:"É acolhido pelo pintor Mauve, em Haia",        q:"Em que ano Vincent foi acolhido pelo pintor Mauve, em Haia?" },
  { ano:1882, cap:"artista",   curto:"Pinta seu primeiro óleo",                       q:"Em que ano Vincent pintou seu primeiro quadro a óleo?" },
  { ano:1884, cap:"nuenen",    curto:"Pinta A Igreja em Nuenen",                      q:"Em que ano Vincent pintou A Igreja em Nuenen?" },
  { ano:1885, cap:"nuenen",    curto:"Pinta Os Comedores de Batata",                  q:"Em que ano Vincent pintou Os Comedores de Batata?" },
  { ano:1886, cap:"nuenen",    curto:"Estuda na Academia de Antuérpia",               q:"Em que ano Vincent começou a estudar na Academia de Antuérpia?" },
  { ano:1887, cap:"paris",     curto:"Pinta o retrato do Pai Tanguy",                 q:"Em que ano Vincent pintou o retrato do Pai Tanguy?" },
  { ano:1888, cap:"arles",     curto:"Muda-se para Arles",                            q:"Em que ano Vincent se mudou para Arles?" },
  { ano:1889, cap:"saintremy", curto:"Interna-se em Saint-Rémy",                      q:"Em que ano Vincent pediu para ser internado no hospital de Saint-Rémy?" },
  { ano:1889, cap:"saintremy", curto:"Pinta A Noite Estrelada",                       q:"Em que ano Vincent pintou A Noite Estrelada?" },
  { ano:1890, cap:"auvers",    curto:"Vai para Auvers, ao cuidado do Dr. Gachet",     q:"Em que ano Vincent foi para Auvers, aos cuidados do Dr. Gachet?" },
  { ano:1890, cap:"auvers",    curto:"Morre em Auvers",                               q:"Em que ano Vincent van Gogh morreu?" },
];

// Obras citadas na biografia (só as de data consistente) — para "qual veio primeiro / de que ano"
const VG_OBRAS = [
  { t:"A Igreja em Nuenen", a:1884, cap:"nuenen" },
  { t:"Os Comedores de Batata", a:1885, cap:"nuenen" },
  { t:"Pai Tanguy", a:1887, cap:"paris" },
  { t:"Autorretrato com Chapéu de Palha", a:1887, cap:"paris" },
  { t:"Terraço do Café na Praça do Fórum", a:1888, cap:"arles" },
  { t:"A Casa Amarela", a:1888, cap:"arles" },
  { t:"Girassóis", a:1888, cap:"arles" },
  { t:"Quarto em Arles", a:1888, cap:"arles" },
  { t:"A Vinha Vermelha", a:1888, cap:"arles" },
  { t:"A Noite Estrelada", a:1889, cap:"saintremy" },
  { t:"Oliveiras", a:1889, cap:"saintremy" },
  { t:"Os Ciprestes", a:1889, cap:"saintremy" },
  { t:"Amendoeiras", a:1890, cap:"saintremy" },
  { t:"Trigal com Corvos", a:1890, cap:"auvers" },
  { t:"Retrato do Dr. Gachet", a:1890, cap:"auvers" },
  { t:"A Igreja de Auvers", a:1890, cap:"auvers" },
];

// Obras do acervo (com imagem) cuja data e cidade são confiáveis
const VG_GALERIA = {
  "art-0049": { ano:1882, fase:"Haia" },
  "art-0072": { ano:1887, fase:"Paris" },
  "art-0060": { ano:1888, fase:"Arles" },
  "art-0062": { ano:1888, fase:"Arles" },
  "art-0071": { ano:1888, fase:"Arles" },
  "art-0058": { ano:1888, fase:"Arles" },
  "art-0061": { ano:1888, fase:"Arles" },
  "art-0077": { ano:1889, fase:"Arles" },
  "art-0068": { ano:1889, fase:"Saint-Rémy" },
  "art-0063": { ano:1889, fase:"Saint-Rémy" },
  "art-0054": { ano:1889, fase:"Saint-Rémy" },
  "art-0043": { ano:1890, fase:"Auvers" },
};
const VG_FASES = ["Haia","Nuenen","Paris","Arles","Saint-Rémy","Auvers"];

/* ---- perguntas escritas à mão ----
   t: vida | pessoas | obra | tecnica | frase | carta
   c: certa · e: erradas (4) · d: explicação · obra: id do acervo (mostra a imagem) */
const VG_PERGUNTAS = {
  zundert: [
    { t:"vida", q:"Em que aldeia Vincent van Gogh nasceu?", c:"Zundert", e:["Arles","Haia","Auvers","Antuérpia"], d:"Nasceu em Zundert, pequena aldeia holandesa, em 30 de março de 1853." },
    { t:"vida", q:"Em que país fica a aldeia de Zundert, onde Vincent nasceu?", c:"Países Baixos (Holanda)", e:["Bélgica","França","Alemanha","Inglaterra"], d:"Zundert fica na Holanda, perto da fronteira com a Bélgica." },
    { t:"vida", q:"Em que dia e mês Vincent van Gogh nasceu?", c:"30 de março", e:["15 de maio","1.º de janeiro","29 de julho","12 de outubro"], d:"Nasceu em 30 de março de 1853." },
    { t:"vida", q:"Qual é o nome completo do pintor?", c:"Vincent Willem van Gogh", e:["Vincent Theodorus van Gogh","Vincent Paul van Gogh","Willem Vincent van Gogh","Johannes Vincent van Gogh"], d:"Vincent Willem van Gogh (1853–1890)." },
    { t:"pessoas", q:"Qual era a profissão do pai de Vincent?", c:"Pastor calvinista", e:["Pintor","Comerciante de arte","Médico","Professor primário"], d:"Filho de um pastor calvinista, Vincent chegou a tentar seguir a carreira do pai." },
    { t:"vida", q:"Como Vincent é descrito na infância?", c:"Rebelde e insociável", e:["Sociável e brincalhão","Tímido e obediente","Um prodígio do desenho","Líder entre os colegas"], d:"A infância é lembrada como a de uma criança rebelde e pouco sociável." },
    { t:"pessoas", q:"Como se chamava o irmão mais novo de Vincent, seu maior confidente?", c:"Theo", e:["Paul","Anton","Willem","Hendrik"], d:"Theo foi o principal interlocutor de Vincent: o único com quem ele se sentia compreendido." },
    { t:"vida", q:"Qual era a nacionalidade de Van Gogh?", c:"Holandesa", e:["Francesa","Belga","Alemã","Inglesa"], d:"Van Gogh é um pintor holandês (1853–1890), grande nome do pós-impressionismo." },
    { t:"pessoas", q:"Quem era o único com quem Vincent se sentia realmente compreendido?", c:"O irmão Theo", e:["O pai","O tio da Goupil","Paul Gauguin","O Dr. Gachet"], d:"Os dois trocaram cerca de 750 cartas, que documentam grande parte da vida do artista." },
  ],
  goupil: [
    { t:"vida", q:"Para qual empresa Vincent foi trabalhar aos 16 anos, em Haia, com o tio?", c:"Galeria Goupil", e:["Uma livraria de Dordrecht","Uma mina de carvão","A Academia de Antuérpia","Um banco de Londres"], d:"A Goupil era uma empresa de comércio de obras de arte e livros — o primeiro contato de Vincent com o mundo da arte." },
    { t:"vida", q:"O que a Galeria Goupil negociava?", c:"Obras de arte e livros", e:["Tintas e pincéis","Joias","Mapas e instrumentos de navegação","Grãos e especiarias"], d:"A Goupil comercializava obras de arte e livros, com filiais em várias cidades." },
    { t:"vida", q:"Depois de Haia, para qual cidade Vincent foi transferido pela Goupil?", c:"Bruxelas", e:["Paris","Arles","Amsterdã","Antuérpia"], d:"Ordem na Goupil: Haia → Bruxelas → Londres → Paris." },
    { t:"vida", q:"Para onde Vincent conseguiu transferência em 1875, esperando se libertar de suas frustrações?", c:"Paris", e:["Londres","Haia","Roma","Bruxelas"], d:"Em 1875 foi para Paris, mas a esperança de alívio não se confirmou." },
    { t:"vida", q:"Por que Vincent foi demitido da Goupil, em abril de 1876?", c:"Desentendimentos com clientes", e:["Furto de dinheiro","A galeria fechou","Vendia pouco por ficar pintando","Pediu para estudar teologia"], d:"A demissão veio após desentendimentos com clientes." },
    { t:"vida", q:"Depois de sair da Goupil, que cargo Vincent aceitou na Inglaterra?", c:"Professor de escola primária", e:["Pregador missionário","Retratista","Bibliotecário","Marinheiro"], d:"Em 1876 foi professor numa escola primária de uma pequena cidade inglesa." },
    { t:"vida", q:"Para qual cidade Vincent foi, em dezembro de 1876, reencontrar a família?", c:"Etten", e:["Zundert","Nuenen","Arles","Borinage"], d:"Em Etten reencontrou a família, mas as relações foram difíceis." },
  ],
  fe: [
    { t:"vida", q:"Em que cidade Vincent trabalhou numa livraria, em 1877?", c:"Dordrecht", e:["Haia","Bruxelas","Etten","Amsterdã"], d:"Em 1877, na livraria de Dordrecht, decidiu seguir a carreira religiosa do pai." },
    { t:"vida", q:"Por que Vincent não entrou no Seminário Teológico de Amsterdã?", c:"Foi reprovado por falta de base", e:["Foi expulso por indisciplina","Desistiu por doença","Não tinha dinheiro","O pai não permitiu"], d:"Reprovado em Amsterdã, entrou então na Escola Evangélica de Bruxelas." },
    { t:"vida", q:"Onde Vincent trabalhou como pregador missionário?", c:"Nas minas de carvão de Borinage", e:["No porto de Antuérpia","Nas fábricas de Londres","Nos campos de Auvers","No hospital de Arles"], d:"Borinage, região de minas de carvão na Bélgica, onde conviveu com mineiros." },
    { t:"vida", q:"Por que Vincent foi demitido do posto de pregador, em 1879?", c:"Pregava pouco e se preocupava demais com doentes e crianças", e:["Pregava demais e incomodava o bispo","Brigou com os mineiros","Foi pego pintando durante o culto","Adoeceu e abandonou o posto"], d:"Os superiores consideraram que ele pregava pouco e se dedicava demais aos doentes e às crianças." },
    { t:"vida", q:"Que dificuldades de saúde passaram a marcar Vincent nessa época?", c:"Depressão e crises nervosas", e:["Cegueira parcial","Surdez","Amnésia","Paralisia nas mãos"], d:"Depressão, crises nervosas e longos períodos de solidão o acompanhariam pelo resto da vida." },
    { t:"vida", q:"Que carreira Vincent decidiu seguir, como o pai, depois de trabalhar na livraria?", c:"A carreira religiosa", e:["Medicina","A marinha","Professor de desenho","O exército"], d:"Ele quis ser pastor — por isso tentou o seminário e, depois, a missão em Borinage." },
    { t:"vida", q:"Em que país ficam as minas de Borinage?", c:"Bélgica", e:["França","Países Baixos","Alemanha","Inglaterra"], d:"Borinage fica na Bélgica, região de mineração de carvão." },
    { t:"vida", q:"Que escola Vincent frequentou em Bruxelas ao tentar se preparar para o ministério?", c:"Escola Evangélica", e:["Academia de Belas-Artes","Escola Militar","Conservatório","Escola de Comércio"], d:"A passagem pela Escola Evangélica precedeu o posto de missionário em Borinage." },
  ],
  artista: [
    { t:"vida", q:"O que Vincent estudou em Bruxelas, em 1880, com o dinheiro enviado por Theo?", c:"Anatomia e perspectiva", e:["Gravura em metal","Teologia","Música","Química das tintas"], d:"Passava os dias desenhando e estudando anatomia e perspectiva — começava ali a vida de artista." },
    { t:"pessoas", q:"Quem sustentava Vincent com dinheiro enquanto ele aprendia a desenhar?", c:"Theo", e:["O tio da Goupil","Mauve","Gauguin","O pai"], d:"Theo enviou ajuda financeira durante praticamente toda a vida artística do irmão." },
    { t:"pessoas", q:"Que pintor acolheu Vincent em Haia, em 1881?", c:"Mauve", e:["Gauguin","Seurat","Signac","Pissarro"], d:"Em Haia, Mauve acolheu Vincent, que passou a pintar aquarelas." },
    { t:"obra", q:"Que temas Vincent retratou nas aquarelas de Haia?", c:"Marinheiros, pescadores e camponeses", e:["Reis e nobres","Deuses mitológicos","Batalhas","Flores em vasos"], d:"Já nos primeiros trabalhos o interesse era a gente comum e o trabalho." },
    { t:"frase", q:"Complete a frase escrita a Theo: «Eu não quero pintar quadros, eu quero…»", c:"pintar a vida", e:["pintar a luz","vender mais","pintar sonhos","pintar o mar"], d:"A frase resume sua busca: não a pintura como objeto, mas a vida como tema." },
    { t:"carta", q:"Complete (carta a Theo): «Grandes coisas são feitas por uma série de ___ reunidas.»", c:"pequenas coisas", e:["acasos felizes","grandes ideias","sacrifícios","talentos"], d:"Um trecho sobre persistência — a obra de Vincent nasceu de um desenho atrás do outro." },
    { t:"obra", q:"Esta obra é de novembro de 1882, época em que Vincent vivia em Haia. Em qual cidade ela foi feita?", c:"Haia", e:["Paris","Arles","Auvers","Nuenen"], d:"Em Haia, em 1882, Vincent pintou seu primeiro óleo e fez estudos de figuras humildes.", obra:"art-0049" },
  ],
  nuenen: [
    { t:"obra", q:"Qual destas obras Vincent pintou em 1885, em Nuenen?", c:"Os Comedores de Batata", e:["Girassóis","A Noite Estrelada","Trigal com Corvos","Quarto em Arles"], d:"Os Comedores de Batata (1885) mostra uma família camponesa sob uma luz pobre." },
    { t:"obra", q:"Como é o ambiente de «Os Comedores de Batata»?", c:"Sombrio, de tons escuros e pinceladas espessas", e:["Luminoso, de tons vibrantes","Feito de pequenos pontos de cor","Delicado, de contornos finos e claros","Dourado e festivo"], d:"A paleta escura e as pinceladas empastadas ainda estão longe das cores de Arles." },
    { t:"pessoas", q:"O que aconteceu com o pai de Vincent em 1885?", c:"Morreu repentinamente", e:["Foi morar em Paris","Tornou-se pintor","Adoeceu e se aposentou","Mudou-se para Arles"], d:"A morte repentina do pai, em 1885, antecedeu a partida para Antuérpia." },
    { t:"vida", q:"Para onde Vincent viajou em novembro de 1885?", c:"Antuérpia", e:["Paris","Arles","Bruxelas","Haia"], d:"Em Antuérpia, a partir de janeiro de 1886, estudou na Academia local." },
    { t:"vida", q:"Que instituição Vincent frequentou em Antuérpia, a partir de janeiro de 1886?", c:"A Academia local", e:["O Seminário Teológico","A Escola Evangélica","A Goupil","O Hospital de Saint-Paul"], d:"Foi seu primeiro contato com ensino formal de arte." },
    { t:"obra", q:"Qual obra de 1884 retrata um templo da aldeia onde Vincent vivia?", c:"A Igreja em Nuenen", e:["A Casa Amarela","Terraço do Café","Amendoeiras","Os Ciprestes"], d:"A Igreja em Nuenen é de 1884; A Casa Paroquial de Nuenen, de 1885." },
  ],
  paris: [
    { t:"pessoas", q:"Quem acolheu Vincent em Paris, em fevereiro de 1886?", c:"Theo, que dirigia a Galeria Goupil", e:["Gauguin","Seurat","Mauve","Pissarro"], d:"Theo recebeu o irmão em sua casa e abriu-lhe as portas do meio artístico." },
    { t:"pessoas", q:"Qual destes artistas Vincent conheceu em Paris?", c:"Georges Seurat", e:["Rembrandt","Michelangelo","Vermeer","Velázquez"], d:"Em Paris encontrou Pissarro, Degas, Gauguin e Seurat." },
    { t:"pessoas", q:"Quem aconselhou Vincent, por causa da saúde, a deixar Paris e ir para o campo?", c:"Toulouse-Lautrec", e:["Pissarro","Degas","Seurat","Signac"], d:"Seguindo o conselho de Toulouse-Lautrec, Vincent partiu para o sul da França." },
    { t:"obra", q:"Quantos quadros Vincent pintou em Paris, em cerca de dois anos?", c:"Cerca de 200", e:["Cerca de 20","Cerca de 50","Cerca de 700","Mais de 2.000"], d:"Uma produção intensa, influenciada pelos artistas que conheceu." },
    { t:"obra", q:"Qual retrato de 1887 mostra um conhecido vendedor de tintas parisiense?", c:"Pai Tanguy", e:["Retrato do Dr. Gachet","Eugène Boch","La Mousmé","Augustine Roulin"], d:"Pai Tanguy é um dos retratos mais conhecidos do período parisiense." },
    { t:"obra", q:"Esta obra de 1887 foi pintada em qual cidade?", c:"Paris", e:["Arles","Haia","Saint-Rémy","Auvers"], d:"Ameixeira em Flor foi pintada em Paris, em Montmartre, em 1887.", obra:"art-0072" },
    { t:"vida", q:"Quanto tempo, aproximadamente, Vincent ficou em Paris?", c:"Cerca de dois anos", e:["Seis meses","Cerca de dez anos","Uma semana","Mais de vinte anos"], d:"De fevereiro de 1886 a fevereiro de 1888, quando partiu para Arles." },
  ],
  arles: [
    { t:"vida", q:"Para onde Vincent foi em fevereiro de 1888, para pintar ao ar livre?", c:"Arles", e:["Auvers","Saint-Rémy","Antuérpia","Nuenen"], d:"Em Arles passou a pintar ao ar livre e fez mais de 100 quadros." },
    { t:"tecnica", q:"Em «Girassóis» (1888), o que é trabalhado por meio de modulações de luz?", c:"Uma única tonalidade", e:["Contrastes de preto e branco","Pontos de cores opostas","Tons de azul e verde","Linhas finas e escuras"], d:"A força do quadro vem de variações de luz sobre uma só cor: o amarelo." },
    { t:"tecnica", q:"Nos autorretratos e paisagens de Arles, como as emoções aparecem?", c:"Em cores vivas, camadas grossas de tinta e pinceladas fortes", e:["Em tons terrosos suaves e acabamento liso","Em contornos finos sem cor","Em pontos minúsculos de cor pura","Em claro-escuro dramático"], d:"É a fase de suas obras mais impressionantes." },
    { t:"pessoas", q:"Que amigo pintor Vincent convidou para trabalhar com ele em Arles?", c:"Paul Gauguin", e:["Georges Seurat","Camille Pissarro","Paul Signac","Edgar Degas"], d:"A convivência com Gauguin terminou em crise, no fim de 1888." },
    { t:"obra", q:"Esta cadeira vazia, de 1888, faz referência a qual amigo pintor?", c:"Gauguin", e:["Seurat","Pissarro","Degas","Signac"], d:"A Cadeira de Gauguin (1888) retrata o lugar do amigo no ateliê de Arles.", obra:"art-0071" },
    { t:"obra", q:"Qual obra de 1888 mostra o próprio ambiente íntimo onde Vincent dormia?", c:"Quarto em Arles", e:["A Casa Paroquial de Nuenen","Os Ciprestes","Amendoeiras","A Igreja de Auvers"], d:"O Quarto em Arles é de 1888 e uma das imagens mais reconhecíveis do pintor." },
    { t:"obra", q:"Qual obra de 1888 retrata a casa onde Vincent morava em Arles?", c:"A Casa Amarela", e:["A Casa Paroquial de Nuenen","A Igreja de Auvers","Terraço do Café","Oliveiras"], d:"A Casa Amarela (1888), em Arles, seria o ateliê compartilhado com Gauguin." },
    { t:"obra", q:"O que aparece enfaixado neste autorretrato, pintado depois da crise de dezembro de 1888?", c:"A orelha", e:["A mão","O pé","A testa","O ombro"], d:"Depois da crise em Arles, Vincent foi internado e se retratou com a orelha enfaixada.", obra:"art-0069" },
    { t:"frase", q:"Complete (carta a Theo): «Não sei nada com certeza, mas a visão das ___ me faz sonhar.»", c:"estrelas", e:["flores","montanhas","cidades","pessoas"], d:"O olhar para o céu noturno já ocupava Vincent em Arles — antes de A Noite Estrelada." },
    { t:"frase", q:"Complete (carta a Theo): «O que é feito com ___ é bem feito.»", c:"amor", e:["pressa","paciência","talento","dinheiro"], d:"Um dos pensamentos mais citados de Vincent sobre o trabalho." },
  ],
  saintremy: [
    { t:"vida", q:"O que Vincent pediu ao irmão em maio de 1889?", c:"Que o internasse no hospital de Saint-Rémy", e:["Que o levasse a Paris","Dinheiro para uma viagem","Que o apresentasse a Monet","Que vendesse seus quadros"], d:"Ele mesmo pediu para ser internado — e seguiu pintando." },
    { t:"vida", q:"Em que Vincent transformou o quarto do hospital de Saint-Rémy?", c:"Em ateliê", e:["Em biblioteca","Em capela","Em galeria de vendas","Em sala de música"], d:"Ali produziu mais de 200 quadros e centenas de desenhos." },
    { t:"obra", q:"Quantos quadros Vincent produziu em Saint-Rémy?", c:"Mais de 200", e:["Cerca de 20","Cerca de 50","Apenas 5","Mais de 2.000"], d:"Além de centenas de desenhos — uma das fases mais produtivas." },
    { t:"pessoas", q:"Por que Theo não pôde visitar Vincent em Saint-Rémy?", c:"A esposa esperava o primeiro filho", e:["Estava preso","Morava em outro continente","Estava doente","Brigou com o irmão"], d:"Theo pediu a Signac que visitasse Vincent em seu lugar." },
    { t:"pessoas", q:"Que amigo pintor visitou Vincent a pedido de Theo?", c:"Signac", e:["Gauguin","Seurat","Degas","Pissarro"], d:"Impressionado, Signac levou amigos à casa de Theo para ver os quadros." },
    { t:"vida", q:"Qual publicação francesa elogiou o trabalho de Vincent nessa época?", c:"Mercure de France", e:["Le Figaro","L'Illustration","La Gazette de Paris","Le Petit Journal"], d:"O elogio da revista Mercure de France foi um dos primeiros sinais de reconhecimento." },
    { t:"obra", q:"Segundo a biografia, qual foi o único quadro que Vincent vendeu em vida?", c:"A Vinha Vermelha", e:["Girassóis","A Noite Estrelada","Os Comedores de Batata","Trigal com Corvos"], d:"Foi exposto em Bruxelas; era o único vendido durante a vida do artista." },
    { t:"obra", q:"Em que ano Vincent pintou esta obra, uma das mais famosas da pintura ocidental?", c:"1889", e:["1885","1888","1890","1886"], d:"A Noite Estrelada foi pintada em junho de 1889, em Saint-Rémy.", obra:"art-0068" },
    { t:"obra", q:"Qual destas obras é de 1889, da fase de Saint-Rémy?", c:"Oliveiras", e:["Os Comedores de Batata","Trigal com Corvos","Pai Tanguy","A Igreja em Nuenen"], d:"Oliveiras e Os Ciprestes são de 1889." },
  ],
  auvers: [
    { t:"vida", q:"Para onde Vincent foi em maio de 1890, ao deixar Saint-Rémy?", c:"Auvers", e:["Arles","Paris","Bruxelas","Haia"], d:"Em Auvers ficou sob os cuidados do Dr. Gachet." },
    { t:"pessoas", q:"Qual médico cuidou de Vincent em Auvers?", c:"Dr. Gachet", e:["Dr. Rey","Dr. Peyron","Dr. Tanguy","Dr. Mauve"], d:"Gachet avaliou sua situação como grave e foi retratado por Vincent em 1890." },
    { t:"obra", q:"Cerca de quantos desenhos Vincent fez em Auvers, em pouco mais de dois meses?", c:"Mais de 200", e:["Cerca de 20","Cerca de 60","Apenas 5","Mais de 2.000"], d:"Também pintou mais de 40 quadros — um ritmo impressionante." },
    { t:"obra", q:"Qual obra de 1890 mostra um campo de trigo sob um céu carregado, com aves?", c:"Trigal com Corvos", e:["Girassóis","Quarto em Arles","Pai Tanguy","A Casa Amarela"], d:"Trigal com Corvos (1890) é uma das últimas grandes obras de Vincent." },
    { t:"obra", q:"Esta obra de 1890 foi pintada em qual cidade?", c:"Auvers", e:["Arles","Paris","Haia","Saint-Rémy"], d:"Rosas (1890) foi pintada em Auvers-sur-Oise e hoje está na National Gallery of Art, em Washington.", obra:"art-0043" },
    { t:"vida", q:"Em que data Vincent van Gogh morreu?", c:"29 de julho de 1890", e:["30 de março de 1890","29 de julho de 1891","1.º de janeiro de 1889","15 de maio de 1890"], d:"Morreu em Auvers, aos 37 anos." },
    { t:"vida", q:"Que idade Vincent tinha quando morreu?", c:"37 anos", e:["29 anos","33 anos","42 anos","50 anos"], d:"Nasceu em 1853 e morreu em 1890." },
    { t:"vida", q:"Quando Van Gogh passou a ser reconhecido?", c:"Só depois de morrer", e:["Ainda criança","Durante a temporada em Paris","Em Arles, ao lado de Gauguin","Em vida, em todo o país"], d:"Segundo a biografia, cerca de 700 quadros estavam sem comprador no sótão da Goupil, em Paris, no dia da sua morte." },
    { t:"pessoas", q:"Cerca de quantas cartas Vincent escreveu ao irmão Theo?", c:"Cerca de 750", e:["Cerca de 75","Cerca de 7.500","Cerca de 20","Cerca de 2.000"], d:"As cartas documentam grande parte da sua vida e a forte ligação entre os irmãos." },
  ],
};

// Modo "Estilo e pensamento": técnica, frases e cartas
const VG_ESTILO = [
  { t:"tecnica", q:"A que movimento artístico Van Gogh é associado?", c:"Pós-impressionismo", e:["Barroco","Realismo","Cubismo","Surrealismo"], d:"Van Gogh é um dos grandes nomes da pintura pós-impressionista." },
  { t:"tecnica", q:"O que caracteriza o empaste (impasto) tão presente em Van Gogh?", c:"Camadas grossas de tinta", e:["Tinta bem diluída, quase transparente","Superfícies lisas, sem marcas de pincel","Pontos minúsculos de cor","Contornos pretos e finos"], d:"As camadas grossas e as pinceladas fortes dão relevo e movimento às telas." },
  { t:"tecnica", q:"Como Van Gogh transmitia emoção nas suas telas?", c:"Pela cor e pela pincelada", e:["Pelo tema religioso","Pela perspectiva geométrica","Pelo realismo fotográfico","Pelo uso de ouro"], d:"Nos autorretratos e paisagens, as emoções aparecem em cores vivas e pinceladas fortes." },
  { t:"tecnica", q:"Quais eram os assuntos mais frequentes na fase madura de Van Gogh?", c:"Autorretratos e paisagens", e:["Cenas de batalha","Retratos de reis","Mitologia","Arquitetura clássica"], d:"Pintou muitos autorretratos e paisagens, boa parte ao ar livre." },
  { t:"tecnica", q:"Onde Van Gogh passou a pintar a partir de Arles?", c:"Ao ar livre", e:["Só em ateliês fechados","Apenas de memória, à noite","Em igrejas","Em fábricas"], d:"Em Arles, em 1888, passou a pintar ao ar livre." },
  { t:"frase", q:"Complete: «Eu não quero pintar quadros, eu quero…»", c:"pintar a vida", e:["pintar a luz","pintar o mar","ficar famoso","ensinar pintura"], d:"Frase atribuída a uma carta ao irmão Theo, por volta de 1881." },
  { t:"frase", q:"Complete (carta a Theo): «O que é feito com ___ é bem feito.»", c:"amor", e:["pressa","paciência","talento","coragem"], d:"Um pensamento sobre o valor do cuidado no trabalho." },
  { t:"frase", q:"Complete (carta a Theo): «Não sei nada com certeza, mas a visão das ___ me faz sonhar.»", c:"estrelas", e:["flores","cidades","montanhas","nuvens"], d:"O céu noturno inspirou A Noite Estrelada (1889)." },
  { t:"frase", q:"Complete (carta a Theo): «Grandes coisas são feitas por uma série de ___ reunidas.»", c:"pequenas coisas", e:["acasos","sacrifícios","talentos","viagens"], d:"Persistência: o desenho de hoje constrói a obra de amanhã." },
  { t:"carta", q:"Qual era o principal registro escrito da vida e das ideias de Van Gogh?", c:"Cerca de 750 cartas ao irmão Theo", e:["Um diário publicado em vida","Um tratado sobre cores","Artigos em revistas","Um livro de memórias"], d:"As cartas a Theo revelam sua rotina, seus planos e a forte ligação entre os irmãos." },
  { t:"carta", q:"Qual era o objetivo expresso por Van Gogh ao dizer «eu quero pintar a vida»?", c:"Retratar a vida e as pessoas, mais que simples quadros", e:["Pintar só paisagens de luxo","Agradar aos críticos de Paris","Copiar mestres antigos","Ficar rico com a pintura"], d:"Do início, o interesse era a vida cotidiana: pescadores, camponeses, mineiros." },
  { t:"carta", q:"A quem eram dirigidas as cartas que hoje documentam a vida de Van Gogh?", c:"Ao irmão Theo", e:["Ao pai","A Gauguin","Ao Dr. Gachet","A Mauve"], d:"Theo foi seu confidente e apoio financeiro durante a vida de artista." },
];

const Vangogh = {
  capitulos: VG_CAPITULOS,
  extras: [
    { id:"galeria", icone:"🖼️", titulo:"Galeria de obras", desc:"Reconheça títulos, anos e fases em telas do acervo" },
    { id:"estilo",  icone:"💬", titulo:"Estilo e pensamento", desc:"Técnica, frases e cartas a Theo" },
    { id:"jornada", icone:"🧭", titulo:"Jornada completa", desc:"Toda a vida e obra, misturadas" },
  ],

  cap(id){ return VG_CAPITULOS.find(c=>c.id===id); },
  nomeDe(id){ const c = this.cap(id); if(c) return `${c.icone} ${c.titulo}`; const e = this.extras.find(x=>x.id===id); return e ? `${e.icone} ${e.titulo}` : "Van Gogh"; },
  estado(){ return (Prog.P.vg || (Prog.P.vg = {})); },
  estrelas(id){ return (this.estado()[id] || {}).estrelas || 0; },
  totalEstrelas(){ return VG_CAPITULOS.reduce((s,c)=>s+this.estrelas(c.id),0); },
  concluidos(){ return VG_CAPITULOS.filter(c=>this.estrelas(c.id)>=1).length; },
  liberado(id){
    const i = VG_CAPITULOS.findIndex(c=>c.id===id);
    if(i === 0) return true;
    if(i > 0) return this.estrelas(VG_CAPITULOS[i-1].id) >= 1;
    return this.concluidos() >= 3; // extras
  },
  proximo(id){ const i = VG_CAPITULOS.findIndex(c=>c.id===id); return i>=0 ? VG_CAPITULOS[i+1] || null : null; },
  linhaDoCapitulo(id){ return VG_EVENTOS.filter(e=>e.cap===id).sort((a,b)=>a.ano-b.ano); },
  obrasDo(id){ const c = this.cap(id); return c ? c.obras.map(i=>Acervo.porId[i]).filter(Boolean) : []; },

  /* ---------- geração ---------- */
  montarEscrita(d, nivel){
    const n = NIVEIS[nivel].opcoes - 1;
    const obra = d.obra ? Acervo.porId[d.obra] : null;
    if(d.obra && !obra) return null;
    const erradas = embaralhar(d.e).slice(0, n);
    const opcoes = embaralhar([d.c, ...erradas]);
    return { tipo:"vg-"+d.t, texto:d.q, certa:d.c, opcoes, detalhe:d.d, custom:true,
      obra, imagem:!!obra, semObra:!obra, longo: opcoes.some(o=>o.length>34) };
  },
  anosProximos(ano, qtd){
    const set = new Set();
    for(const k of embaralhar([-1,1,-2,2,-3,3,-4,4,-5,5,-7,7,-9,9,-12,12])){
      const v = ano + k; if(v>=1850 && v<=1892) set.add(v);
      if(set.size >= qtd) break;
    }
    return [...set];
  },
  perguntaAnoEvento(ev, nivel){
    const n = NIVEIS[nivel].opcoes - 1;
    const errados = this.anosProximos(ev.ano, n).map(String);
    return { tipo:"vg-linha", texto:ev.q, certa:String(ev.ano), opcoes:embaralhar([String(ev.ano), ...errados]), custom:true, semObra:true,
      detalhe:`${ev.ano}: ${ev.curto}.` };
  },
  perguntaOrdem(lista, rotulo, ano, nivel, rotuloDet){
    // lista de itens {ano, rotulo}; devolve "qual veio primeiro/por último"
    const n = Math.min(NIVEIS[nivel].opcoes, 4);
    const vistos = new Set(), unicos = [];
    embaralhar(lista).forEach(x=>{ if(!vistos.has(ano(x))){ vistos.add(ano(x)); unicos.push(x); } });
    if(unicos.length < 3) return null;
    const grupo = unicos.slice(0, n), primeiro = Math.random() < 0.5;
    const alvo = grupo.reduce((a,b)=> (primeiro ? ano(b)<ano(a) : ano(b)>ano(a)) ? b : a);
    return { tipo:"vg-linha", texto:rotuloDet(primeiro), certa:rotulo(alvo), opcoes:embaralhar(grupo.map(rotulo)), custom:true, semObra:true,
      detalhe: grupo.slice().sort((a,b)=>ano(a)-ano(b)).map(x=>`${ano(x)} — ${rotulo(x)}`).join("<br>"), longo:true };
  },
  ordemEventos(evs, nivel){
    return this.perguntaOrdem(evs, e=>e.curto, e=>e.ano, nivel, p=>p ? "Qual destes acontecimentos veio primeiro?" : "Qual destes acontecimentos veio por último?");
  },
  ordemObras(obras, nivel){
    return this.perguntaOrdem(obras, o=>o.t, o=>o.a, nivel, p=>p ? "Qual destas obras foi pintada primeiro?" : "Qual destas obras foi pintada por último?");
  },
  obraDeAno(nivel){
    const n = NIVEIS[nivel].opcoes - 1, alvo = embaralhar(VG_OBRAS)[0];
    const outras = embaralhar(VG_OBRAS.filter(o=>o.a !== alvo.a)).slice(0, n);
    return { tipo:"vg-linha", texto:`Qual destas obras Van Gogh pintou em ${alvo.a}?`, certa:alvo.t, opcoes:embaralhar([alvo.t, ...outras.map(o=>o.t)]), custom:true, semObra:true,
      detalhe:`${alvo.t} é de ${alvo.a}.` , longo:true };
  },
  galeria(nivel){
    const ids = Object.keys(VG_GALERIA).filter(id=>Acervo.porId[id]);
    const out = [];
    const n = NIVEIS[nivel].opcoes - 1;
    const todos = ids.map(id=>Acervo.porId[id]);
    ids.forEach(id=>{
      const o = Acervo.porId[id], g = VG_GALERIA[id];
      // título
      out.push({ tipo:"vg-obra", texto:"Qual é o título desta obra de Van Gogh?", certa:o.titulo,
        opcoes:embaralhar([o.titulo, ...embaralhar(todos.filter(x=>x.id!==id).map(x=>x.titulo)).slice(0,n)]),
        custom:true, obra:o, imagem:true, longo:true,
        detalhe:`${o.titulo} — ${g.ano}${o.museu ? ` · 🏛 ${o.museu}` : ""}` });
      // ano
      out.push({ tipo:"vg-obra", texto:"Em que ano Van Gogh pintou esta obra?", certa:String(g.ano),
        opcoes:embaralhar([String(g.ano), ...this.anosProximos(g.ano, n).map(String)]),
        custom:true, obra:o, imagem:true, detalhe:`${o.titulo} é de ${g.ano}.` });
      // fase/cidade
      out.push({ tipo:"vg-obra", texto:"Em que cidade ou fase da vida de Van Gogh esta obra foi pintada?", certa:g.fase,
        opcoes:embaralhar([g.fase, ...embaralhar(VG_FASES.filter(f=>f!==g.fase)).slice(0,n)]),
        custom:true, obra:o, imagem:true, detalhe:`${o.titulo} foi pintada em ${g.fase}, em ${g.ano}.` });
    });
    return out;
  },
  doCapitulo(id, nivel){
    const out = [];
    (VG_PERGUNTAS[id] || []).forEach(d=>{ const q = this.montarEscrita(d, nivel); if(q) out.push(q); });
    const evs = this.linhaDoCapitulo(id);
    evs.forEach(e=>out.push(this.perguntaAnoEvento(e, nivel)));
    // ordem entre acontecimentos: usa o capítulo e o anterior
    const i = VG_CAPITULOS.findIndex(c=>c.id===id);
    const vizinhos = VG_EVENTOS.filter(e=>[id, (VG_CAPITULOS[i-1]||{}).id].includes(e.cap));
    const o1 = this.ordemEventos(vizinhos, nivel); if(o1) out.push(o1);
    const obrasCap = VG_OBRAS.filter(o=>o.cap===id);
    if(obrasCap.length >= 1){
      const o2 = this.ordemObras(VG_OBRAS.filter(o=>[id, (VG_CAPITULOS[i-1]||{}).id].includes(o.cap)), nivel); if(o2) out.push(o2);
    }
    // obras do acervo deste capítulo (título/ano/fase)
    const galeria = this.galeria(nivel).filter(q=>this.cap(id).obras.includes(q.obra.id));
    embaralhar(galeria).slice(0,2).forEach(q=>out.push(q));
    return out;
  },

  /* fila para o motor do jogo (esc = {tipo:"vangogh", valor:id}) */
  fila(esc, nivel, qtd){
    let pool = [];
    if(this.cap(esc.valor)) pool = this.doCapitulo(esc.valor, nivel);
    else if(esc.valor === "galeria") pool = this.galeria(nivel);
    else if(esc.valor === "estilo") pool = VG_ESTILO.map(d=>this.montarEscrita(d, nivel)).filter(Boolean);
    else { // jornada
      VG_CAPITULOS.forEach(c=>{ embaralhar(this.doCapitulo(c.id, nivel)).slice(0,5).forEach(q=>pool.push(q)); });
      embaralhar(VG_ESTILO).slice(0,4).forEach(d=>{ const q = this.montarEscrita(d, nivel); if(q) pool.push(q); });
      const o = this.ordemEventos(VG_EVENTOS, nivel); if(o) pool.push(o);
      const o2 = this.ordemObras(VG_OBRAS, nivel); if(o2) pool.push(o2);
      pool.push(this.obraDeAno(nivel));
    }
    // sem repetir texto; mistura os tipos
    const vistos = new Set();
    pool = embaralhar(pool).filter(q=>{ const k = q.texto+"|"+q.certa+"|"+(q.obra ? q.obra.id : ""); if(vistos.has(k)) return false; vistos.add(k); return true; });
    return pool.slice(0, qtd);
  },
};
