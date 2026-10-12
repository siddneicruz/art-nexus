/* ============================================================================
   PROVENIÊNCIA — donos anteriores reais das obras mais conhecidas
   Só entram etapas bem documentadas. Onde a cadeia tem lacunas conhecidas,
   a ficha diz isso em vez de inventar. No jogo, a obra pode ser comprada: a
   história real vai até o dono atual, e daí em diante é a partida do jogador.
   ============================================================================ */

const ROYAL_LEONARDO = [
  { periodo:"1519", dono:"Francesco Melzi", nota:"discípulo e herdeiro dos papéis de Leonardo" },
  { periodo:"c. 1580–1608", dono:"Pompeo Leoni", nota:"escultor que comprou os cadernos dos herdeiros de Melzi" },
  { periodo:"séc. XVII", dono:"Thomas Howard, conde de Arundel", nota:"colecionador inglês" },
  { periodo:"desde c. 1690", dono:"Royal Collection", nota:"coleção real britânica, em Windsor" },
];
const ALEIJADINHO_PROV = [
  { periodo:"1796–1805", dono:"Irmandade do Senhor Bom Jesus de Matosinhos", nota:"encomenda para o santuário de Congonhas" },
  { periodo:"1939", dono:"Tombamento pelo IPHAN", nota:"primeiros anos da proteção federal ao patrimônio" },
  { periodo:"1985", dono:"Patrimônio Mundial da UNESCO", nota:"o conjunto do santuário" },
];

const PROVENIENCIA = {
  "A Ronda Noturna":[
    { periodo:"1642–1715", dono:"Kloveniersdoelen", nota:"sede da milícia de arcabuzeiros de Amsterdã, que encomendou o quadro" },
    { periodo:"1715–1808", dono:"Prefeitura de Amsterdã", nota:"ao ser transferido, foi cortado dos quatro lados para caber na parede" },
    { periodo:"desde 1808", dono:"Rijksmuseum (propriedade da cidade de Amsterdã)", nota:"em empréstimo permanente ao museu" },
  ],
  "A leiteira":[
    { periodo:"1696", dono:"Leilão da coleção Dissius, Amsterdã", nota:"vendida com outras 20 telas de Vermeer" },
    { periodo:"séc. XIX", dono:"Família Six, Amsterdã" },
    { periodo:"desde 1908", dono:"Rijksmuseum", nota:"comprada pelo Estado holandês" },
  ],
  "A Noite Estrelada":[
    { periodo:"1889–1891", dono:"Theo van Gogh", nota:"irmão e marchand do pintor" },
    { periodo:"1891–1900", dono:"Jo van Gogh-Bonger", nota:"viúva de Theo, que organizou a obra de Vincent" },
    { periodo:"1900", dono:"Julien Leclercq", nota:"poeta francês" },
    { periodo:"1906–1938", dono:"Georgette van Stolk, Roterdã" },
    { periodo:"1938", dono:"Paul Rosenberg", nota:"marchand, Paris/Nova York" },
    { periodo:"desde 1941", dono:"MoMA, Nova York", nota:"adquirida por troca com obras do legado de Lillie P. Bliss" },
  ],
  "As Meninas":[
    { periodo:"1656–1819", dono:"Coleção real espanhola", nota:"no Alcázar de Madri; sobreviveu ao incêndio de 1734" },
    { periodo:"desde 1819", dono:"Museu do Prado", nota:"no acervo desde a abertura do museu" },
  ],
  "O Jardim das Delícias Terrenas":[
    { periodo:"1517", dono:"Casa de Nassau, Bruxelas", nota:"primeiro registro, no palácio de Henrique III de Nassau" },
    { periodo:"1568", dono:"Confiscado pelo duque de Alba", nota:"das posses de Guilherme de Orange" },
    { periodo:"1591–1593", dono:"Filipe II da Espanha", nota:"comprado em leilão e levado ao Mosteiro do Escorial" },
    { periodo:"desde 1939", dono:"Museu do Prado" },
  ],
  "A Lição de Anatomia do Dr. Tulp":[
    { periodo:"1632–1828", dono:"Guilda dos Cirurgiões de Amsterdã", nota:"encomenda para a sala de anatomia" },
    { periodo:"desde 1828", dono:"Mauritshuis, Haia", nota:"comprado pelo rei Guilherme I quando a guilda vendeu seu acervo" },
  ],
  "Mulher segurando uma balança":[
    { periodo:"1696", dono:"Leilão da coleção Dissius, Amsterdã" },
    { periodo:"séc. XVIII–XIX", dono:"Coleções particulares europeias", nota:"cadeia de donos com lacunas" },
    { periodo:"1911–1942", dono:"Peter A. B. Widener e Joseph Widener, Filadélfia" },
    { periodo:"desde 1942", dono:"National Gallery of Art, Washington", nota:"doação da coleção Widener" },
  ],
  "Moça lendo uma carta à janela":[
    { periodo:"1742", dono:"Augusto III, eleitor da Saxônia", nota:"comprada em Paris como se fosse um Rembrandt" },
    { periodo:"1742–1945", dono:"Galeria dos Mestres Antigos, Dresden", nota:"só reconhecida como Vermeer no século XIX" },
    { periodo:"1945–1955", dono:"Levada para Moscou pelo Exército Vermelho" },
    { periodo:"desde 1955", dono:"Galeria dos Mestres Antigos, Dresden", nota:"devolvida pela União Soviética" },
  ],
  "A Alcoviteira":[
    { periodo:"1741", dono:"Coleção Wallenstein, Dux (Boêmia)" },
    { periodo:"desde 1741", dono:"Galeria dos Mestres Antigos, Dresden", nota:"comprada por Augusto III" },
  ],
  "O Geógrafo":[
    { periodo:"séc. XVIII–XIX", dono:"Coleções particulares na Holanda e na França", nota:"cadeia de donos com lacunas" },
    { periodo:"desde 1885", dono:"Städel Museum, Frankfurt" },
  ],
  "O Beijo":[
    { periodo:"desde 1908", dono:"Estado austríaco — Belvedere, Viena", nota:"comprado na exposição Kunstschau, antes mesmo de concluído" },
  ],
  "Olympia":[
    { periodo:"1863–1883", dono:"Édouard Manet", nota:"a tela não vendeu; ficou com o pintor até a morte" },
    { periodo:"1883–1890", dono:"Suzanne Manet", nota:"viúva do pintor" },
    { periodo:"1890", dono:"Estado francês", nota:"subscrição pública organizada por Claude Monet para comprar e doar a obra" },
    { periodo:"1890–1907", dono:"Museu do Luxemburgo" },
    { periodo:"1907–1986", dono:"Museu do Louvre / Jeu de Paume", nota:"levada ao Louvre por ordem de Clemenceau" },
    { periodo:"desde 1986", dono:"Museu d'Orsay" },
  ],
  "Impressão, nascer do sol":[
    { periodo:"1874", dono:"Ernest Hoschedé", nota:"comprada após a primeira exposição impressionista" },
    { periodo:"1878", dono:"Georges de Bellio", nota:"médico e colecionador" },
    { periodo:"até 1940", dono:"Victorine Donop de Monchy", nota:"filha de Bellio" },
    { periodo:"desde 1940", dono:"Museu Marmottan Monet, Paris", nota:"legado; roubada em 1985 e recuperada em 1990" },
  ],
  "Retrato de Elisabeth Lederer":[
    { periodo:"1914–1916", dono:"Família Lederer, Viena", nota:"encomenda dos maiores mecenas de Klimt" },
    { periodo:"séc. XX", dono:"Coleção Leonard A. Lauder, Nova York", nota:"etapas intermediárias não documentadas no jogo" },
    { periodo:"nov. 2025", dono:"Leilão Sotheby's, Nova York", nota:"US$ 236,4 milhões — recorde para arte moderna em leilão" },
  ],
  "Caçadores na Neve":[
    { periodo:"1565", dono:"Nicolaes Jonghelinck, Antuérpia", nota:"encomendou a série dos meses do ano" },
    { periodo:"1594", dono:"Cidade de Antuérpia", nota:"oferecida ao arquiduque Ernesto da Áustria" },
    { periodo:"desde 1595", dono:"Coleção imperial dos Habsburgo", nota:"hoje no Museu de História da Arte de Viena" },
  ],
  "Torre de Babel":[
    { periodo:"1566", dono:"Nicolaes Jonghelinck, Antuérpia" },
    { periodo:"desde fins do séc. XVI", dono:"Coleção imperial dos Habsburgo", nota:"hoje no Museu de História da Arte de Viena" },
  ],
  "Davi":[
    { periodo:"1501–1504", dono:"Opera del Duomo, Florença", nota:"encomendou a estátua para a catedral" },
    { periodo:"1504–1873", dono:"Piazza della Signoria", nota:"uma comissão decidiu pô-la diante do palácio do governo" },
    { periodo:"desde 1873", dono:"Galleria dell'Accademia, Florença", nota:"na praça ficou uma réplica, desde 1910" },
  ],
  "Moisés":[
    { periodo:"desde 1545", dono:"Basílica de San Pietro in Vincoli, Roma", nota:"no túmulo do papa Júlio II; nunca saiu de lá" },
  ],
  "Retrato de Monsieur Lavoisier e sua esposa":[
    { periodo:"1788–1836", dono:"Marie-Anne Paulze Lavoisier", nota:"escondido durante o Terror" },
    { periodo:"séc. XIX–1924", dono:"Descendentes da família" },
    { periodo:"1924–1977", dono:"Instituto Rockefeller, Nova York" },
    { periodo:"desde 1977", dono:"Metropolitan Museum of Art", nota:"compra com doação de Charles e Jayne Wrightsman" },
  ],
  "A coroação de Napoleão":[
    { periodo:"1808", dono:"Napoleão I", nota:"encomenda oficial" },
    { periodo:"séc. XIX", dono:"Palácio de Versalhes" },
    { periodo:"desde 1889", dono:"Museu do Louvre", nota:"uma segunda versão, do próprio David, está em Versalhes" },
  ],
  "Autorretrato com a Orelha Enfaixada":[
    { periodo:"1928", dono:"Samuel Courtauld", nota:"industrial e colecionador britânico" },
    { periodo:"desde 1948", dono:"Courtauld Gallery, Londres", nota:"legado ao instituto que ele fundou" },
  ],
  "O Café à Noite na Place Lamartine":[
    { periodo:"1908–1918", dono:"Ivan Morozov, Moscou" },
    { periodo:"1918–1933", dono:"Estado soviético", nota:"coleção nacionalizada após a Revolução" },
    { periodo:"1933–1960", dono:"Stephen C. Clark, Nova York", nota:"vendido pelo governo soviético" },
    { periodo:"desde 1961", dono:"Yale University Art Gallery", nota:"legado de Clark" },
  ],
  "Vênus ao Espelho":[
    { periodo:"1651", dono:"Gaspar de Haro, marquês de Heliche", nota:"primeiro registro" },
    { periodo:"fins do séc. XVIII", dono:"Manuel Godoy, primeiro-ministro espanhol" },
    { periodo:"1813–1906", dono:"John Morritt, Rokeby Park (Inglaterra)", nota:"daí o apelido 'Vênus de Rokeby'" },
    { periodo:"desde 1906", dono:"National Gallery, Londres", nota:"campanha pública de arrecadação; atacada a cutelo em 1914" },
  ],
  "Retrato do Papa Júlio II":[
    { periodo:"1513–1591", dono:"Igreja de Santa Maria del Popolo, Roma" },
    { periodo:"séc. XVII", dono:"Coleção Borghese" },
    { periodo:"desde 1824", dono:"National Gallery, Londres", nota:"tida como cópia até 1970, quando foi reconhecida como o original" },
  ],
  "Naufrágio":[
    { periodo:"1806", dono:"Sir John Leicester", nota:"colecionador de pintura britânica" },
    { periodo:"1827–1851", dono:"J. M. W. Turner", nota:"o pintor recomprou a tela" },
    { periodo:"desde 1856", dono:"Tate, Londres", nota:"parte do Legado Turner à nação" },
  ],
  "Erupção do Vesúvio":[
    { periodo:"desde 1977", dono:"Yale Center for British Art", nota:"coleção de Paul Mellon" },
  ],
  "A Anunciação":[
    { periodo:"até 1867", dono:"Convento de San Bartolomeo a Monteoliveto, Florença" },
    { periodo:"desde 1867", dono:"Galeria Uffizi, Florença", nota:"então atribuída a Ghirlandaio" },
  ],
  "Escola de Atenas Detalhe - Autorretrato do autor":[
    { periodo:"desde 1511", dono:"Palácio Apostólico, Vaticano", nota:"afresco na Stanza della Segnatura; nunca saiu da parede" },
  ],
  "Leão X e Átila":[
    { periodo:"desde 1514", dono:"Palácio Apostólico, Vaticano", nota:"afresco na Stanza di Eliodoro" },
  ],
  "O Inferno de Dante":[
    { periodo:"desde o séc. XVII", dono:"Biblioteca Apostólica Vaticana", nota:"a maior parte dos desenhos da série está em Berlim" },
  ],
  "O Milagre do Escravo":[
    { periodo:"1548–1797", dono:"Scuola Grande di San Marco, Veneza", nota:"confraria que encomendou a tela" },
    { periodo:"desde 1815", dono:"Gallerie dell'Accademia, Veneza", nota:"levada a Paris por Napoleão e devolvida" },
  ],
  "A Origem da Via-Láctea":[
    { periodo:"séc. XVII", dono:"Coleção do imperador Rodolfo II, Praga" },
    { periodo:"séc. XVIII", dono:"Coleção Orléans, Paris" },
    { periodo:"desde 1890", dono:"National Gallery, Londres" },
  ],
  "O monge à beira-mar":[
    { periodo:"desde 1810", dono:"Casa real da Prússia", nota:"comprado a pedido do príncipe herdeiro; hoje na Alte Nationalgalerie, Berlim" },
  ],
  "A Guerra":[
    { periodo:"desde 1946", dono:"Estado francês", nota:"no Louvre e, desde 1986, no Museu d'Orsay" },
  ],
  "Eugène Boch":[
    { periodo:"1888–1941", dono:"Eugène Boch", nota:"o próprio retratado, amigo de Van Gogh" },
    { periodo:"desde 1941", dono:"Museu d'Orsay (antes Louvre)", nota:"legado de Boch" },
  ],
  "Às Portas da Eternidade":[
    { periodo:"séc. XX", dono:"Helene Kröller-Müller", nota:"uma das maiores colecionadoras de Van Gogh" },
    { periodo:"desde 1938", dono:"Museu Kröller-Müller, Otterlo" },
  ],
  "A Cadeira de Gauguin":[
    { periodo:"1890–1962", dono:"Família Van Gogh", nota:"Theo, Jo van Gogh-Bonger e o sobrinho Vincent Willem" },
    { periodo:"desde 1962", dono:"Fundação Vincent van Gogh", nota:"exposta no Museu Van Gogh desde 1973" },
  ],
  "La Grenouillère":[
    { periodo:"desde 1929", dono:"Metropolitan Museum of Art", nota:"legado da coleção H. O. Havemeyer" },
  ],
  "Coquelicots, La promenade":[
    { periodo:"desde 1906", dono:"Estado francês", nota:"doação de Étienne Moreau-Nélaton; hoje no Museu d'Orsay" },
  ],
  "O Estúdio do Pintor":[
    { periodo:"desde 1920", dono:"Museu do Louvre / Museu d'Orsay", nota:"comprado por subscrição com a Sociedade dos Amigos do Louvre" },
  ],
};

// Aplicar as listas compartilhadas
["Estudos do feto no útero","Folha de estudos com gatos, dragão e outros animais","Estudos de Leda e um cavalo",
 "Dilúvio sobre uma cidade","Cavalo empinando","Um parque de artilharia","Cabeças de São Tomé e São Tiago Maior",
 "Estudo de cavalos para a Batalha de Anghiari","Cabeça de Leda","Estudo para o monumento Trivulzio"]
  .forEach(t=>{ PROVENIENCIA[t] = ROYAL_LEONARDO; });

// Acervos que faltavam, confirmados junto com a proveniência
const MUSEU_COMPLEMENTO = {
  "A leiteira":"Rijksmuseum, Amsterdã, Países Baixos",
  "A Noite Estrelada":"MoMA — Museu de Arte Moderna, Nova York, EUA",
  "A Alcoviteira":"Galeria de Pinturas dos Mestres Antigos, Dresden, Alemanha",
  "O Geógrafo":"Städel Museum, Frankfurt, Alemanha",
  "O Beijo":"Belvedere, Viena, Áustria",
  "Judite I":"Belvedere, Viena, Áustria",
  "Olympia":"Museu d'Orsay, Paris, França",
  "Impressão, nascer do sol":"Museu Marmottan Monet, Paris, França",
  "Coquelicots, La promenade":"Museu d'Orsay, Paris, França",
  "O Estúdio do Pintor":"Museu d'Orsay, Paris, França",
  "A coroação de Napoleão":"Museu do Louvre, Paris, França",
  "Vênus ao Espelho":"National Gallery, Londres, Reino Unido",
  "Moisés":"Basílica de San Pietro in Vincoli, Roma, Itália",
  "Davi":"Galleria dell'Accademia, Florença, Itália",
  "O monge à beira-mar":"Alte Nationalgalerie, Berlim, Alemanha",
  "Caçadores na Neve":"Museu de História da Arte, Viena, Áustria",
  "Torre de Babel":"Museu de História da Arte, Viena, Áustria",
  "Eugène Boch":"Museu d'Orsay, Paris, França",
  "Às Portas da Eternidade":"Museu Kröller-Müller, Otterlo, Países Baixos",
  "A Cadeira de Gauguin":"Museu Van Gogh, Amsterdã, Países Baixos",
  "Naufrágio":"Tate Britain, Londres, Reino Unido",
  "La Grenouillère":"Metropolitan Museum of Art (Met), Nova York, EUA",
  "Escola de Atenas Detalhe - Autorretrato do autor":"Palácio Apostólico, Vaticano",
  "Leão X e Átila":"Palácio Apostólico, Vaticano",
  "O Inferno de Dante":"Biblioteca Apostólica Vaticana",
  "O Milagre do Escravo":"Gallerie dell'Accademia, Veneza, Itália",
  "A Origem da Via-Láctea":"National Gallery, Londres, Reino Unido",
};
ARTWORKS.forEach(w=>{
  if(!w.museu && MUSEU_COMPLEMENTO[w.titulo]) w.museu = MUSEU_COMPLEMENTO[w.titulo];
  if(w.artista === "Aleijadinho") PROVENIENCIA[w.titulo] = ALEIJADINHO_PROV;
});

function provenienciaHTML(w){
  const etapas = PROVENIENCIA[w.titulo];
  const meu = State.collection.find(o=>o.id===w.id);
  if(!etapas && !meu) return "";
  return `<div class="sec">
    <h3 class="sec-title">📜 Donos anteriores <small>${etapas ? "(proveniência real)" : ""}</small></h3>
    ${etapas ? `<ol class="prov">${etapas.map(e=>`<li><span class="prov-per">${e.periodo}</span>
        <span class="prov-dono">${e.dono}${e.nota ? `<small>${e.nota}</small>` : ""}</span></li>`).join("")}
      </ol>` : `<p class="sec-body" style="font-size:12.5px;color:var(--parchment-dim)">A cadeia de donos desta obra não está documentada no jogo.</p>`}
    ${meu ? `<div class="prov-jogo">🎮 <b>Na sua partida:</b> comprada por você por ${fmtMoney(meu.boughtPrice)}.
      ${etapas ? "Daqui em diante, a história é ficção do jogo." : ""}</div>` : ""}
  </div>`;
}
