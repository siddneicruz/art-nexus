/* ============================================================================
   REPERTÓRIO AMPLIADO — temas de domínio público (alemães e franceses) e
   peças instrumentais originais do jogo. Tudo é uma leitura simplificada do
   tema principal, sintetizada pelo navegador.
   Formato: notas [nota, batidas]; "-" = pausa; acomp = linha tocada junto.
   ============================================================================ */
(function(){
  const arp = (a,b,c,d,e)=> { const g=[a,b,c,d,e,c,d,e]; return [...g,...g].map(n=>[n,.25]); };
  const rep = (lista, n)=> Array.from({length:n}).flatMap(()=>lista);
  const q = (...ns)=> ns.map(n=>Array.isArray(n)?n:[n,1]);

  PECAS.push(
  /* ---------- Beethoven ---------- */
  { id:"beethoven-ode", compositor:"Beethoven", titulo:"Ode à Alegria — 9ª Sinfonia (1824)", bpm:112, timbre:"orquestra", notas:[
    ...q("E4","E4","F4","G4","G4","F4","E4","D4","C4","C4","D4","E4",["E4",1.5],["D4",.5],["D4",2]),
    ...q("E4","E4","F4","G4","G4","F4","E4","D4","C4","C4","D4","E4",["D4",1.5],["C4",.5],["C4",2]),
    ["-",1]] },
  { id:"beethoven-elisa", compositor:"Beethoven", titulo:"Für Elise (1810)", bpm:132, timbre:"piano", notas:[
    ...rep([["E5",.5],["D#5",.5]],2),["E5",.5],["B4",.5],["D5",.5],["C5",.5],["A4",1.5],["-",.5],
    ["C4",.5],["E4",.5],["A4",.5],["B4",1.5],["-",.5],["E4",.5],["G#4",.5],["B4",.5],["C5",1.5],["-",.5],
    ["E4",.5],["E5",.5],["D#5",.5],...rep([["E5",.5],["D#5",.5]],1),["E5",.5],["B4",.5],["D5",.5],["C5",.5],["A4",1.5],["-",.5],
    ["C4",.5],["E4",.5],["A4",.5],["B4",1.5],["-",.5],["E4",.5],["C5",.5],["B4",.5],["A4",2.5],["-",1]] },
  { id:"beethoven-luar", compositor:"Beethoven", titulo:"Sonata ao Luar — tema inicial (1801)", bpm:56, timbre:"piano",
    notas: [...rep([["G#3",.5],["C#4",.5],["E4",.5]],8),...rep([["A3",.5],["C#4",.5],["E4",.5]],4),...rep([["G#3",.5],["C4",.5],["D#4",.5]],4),["-",1]],
    acomp:[["C#2",6],["A1",3],["G#1",3]] },

  /* ---------- Mozart ---------- */
  { id:"mozart-turca", compositor:"Mozart", titulo:"Marcha Turca — Sonata nº 11 (1783)", bpm:150, timbre:"piano", notas:[
    ["B4",.25],["A4",.25],["G#4",.25],["A4",.25],["C5",1],["D5",.25],["C5",.25],["B4",.25],["C5",.25],["E5",1],
    ["F5",.25],["E5",.25],["D#5",.25],["E5",.25],["B5",.25],["A5",.25],["G#5",.25],["A5",.25],["B5",.25],["A5",.25],["G#5",.25],["A5",.25],["C6",1],["A5",.5],["C6",.5],["B5",.25],["A5",.25],["G5",.25],["A5",.25],["B5",1],["A5",2],["-",1]] },
  { id:"mozart-ah", compositor:"Mozart", titulo:"Ah! vous dirai-je, maman — Variações (c. 1781)", bpm:104, timbre:"piano", notas:[
    ...q("C5","C5","G5","G5","A5","A5",["G5",2],"F5","F5","E5","E5","D5","D5",["C5",2]),
    ...q("G5","G5","F5","F5","E5","E5",["D5",2],"G5","G5","F5","F5","E5","E5",["D5",2]),
    ...q("C5","C5","G5","G5","A5","A5",["G5",2],"F5","F5","E5","E5","D5","D5",["C5",2]),["-",1]] },

  /* ---------- Bach e barroco alemão ---------- */
  { id:"bach-minueto", compositor:"Bach", titulo:"Minueto em Sol — Caderno de Anna Magdalena", bpm:116, timbre:"cravo", notas:[
    ["D5",1],["G4",.5],["A4",.5],["B4",.5],["C5",.5],["D5",1],["G4",1],["G4",1],
    ["E5",1],["C5",.5],["D5",.5],["E5",.5],["F#5",.5],["G5",1],["G4",1],["G4",1],
    ["C5",1],["D5",.5],["C5",.5],["B4",.5],["A4",.5],["B4",1],["C5",.5],["B4",.5],["A4",.5],["G4",.5],
    ["F#4",1],["G4",.5],["A4",.5],["B4",.5],["G4",.5],["B4",1.5],["A4",2],["-",1]] },
  { id:"bach-preludio", compositor:"Bach", titulo:"Prelúdio em Dó — O Cravo Bem Temperado", bpm:70, timbre:"piano", notas:[
    ...arp("C4","E4","G4","C5","E5"),...arp("C4","D4","A4","D5","F5"),...arp("B3","D4","G4","D5","F5"),...arp("C4","E4","G4","C5","E5"),
    ["C5",4],["-",1]] },
  { id:"pachelbel-canon", compositor:"Pachelbel", titulo:"Cânone em Ré", bpm:60, timbre:"cordas", notas:[
    ...rep([["F#5",2],["E5",2],["D5",2],["C#5",2],["B4",2],["A4",2],["B4",2],["C#5",2]],2),["-",1]],
    acomp:rep([["D3",2],["A3",2],["B3",2],["F#3",2],["G3",2],["D3",2],["G3",2],["A3",2]],2) },

  /* ---------- Romantismo alemão ---------- */
  { id:"brahms-berceuse", compositor:"Brahms", titulo:"Canção de Ninar — Wiegenlied (1868)", bpm:84, timbre:"cordas", notas:[
    ["E4",.5],["E4",.5],["G4",2],["E4",.5],["E4",.5],["G4",2],["E4",.5],["G4",.5],["C5",1.5],["B4",.5],["A4",1],["A4",.5],["G4",2.5],
    ["D4",.5],["E4",.5],["F4",1.5],["D4",.5],["D4",.5],["E4",.5],["F4",1.5],["D4",.5],["F4",.5],["B4",1.5],["A4",.5],["G4",1],["B4",.5],["C5",2.5],["-",1]] },

  /* ---------- França ---------- */
  { id:"bizet-habanera", compositor:"Bizet", titulo:"Habanera — Carmen (1875)", bpm:96, timbre:"cordas", notas:[
    ["A4",1.5],["G#4",.5],["G4",1.5],["F#4",.5],["F4",1.5],["E4",.5],["E4",3],["-",1],
    ["A4",1.5],["G#4",.5],["G4",1.5],["F#4",.5],["F4",1.5],["E4",.5],["D4",3],["-",1]],
    acomp:rep([["D3",1.5],["D3",.5],["A3",1],["D3",1]],4) },
  { id:"frere-jacques", compositor:"Tradicional francesa", titulo:"Frère Jacques", bpm:104, timbre:"flauta", notas:[
    ...q("C5","D5","E5","C5","C5","D5","E5","C5","E5","F5",["G5",2],"E5","F5",["G5",2]),
    ...q(["G5",.5],["A5",.5],["G5",.5],["F5",.5],"E5","C5",["G5",.5],["A5",.5],["G5",.5],["F5",.5],"E5","C5",
    "C5","G4",["C5",2],"C5","G4",["C5",2]),["-",1]] },
  { id:"clair-lune-folk", compositor:"Tradicional francesa", titulo:"Au clair de la lune", bpm:92, timbre:"flauta", notas:[
    ...q("C5","C5","C5","D5",["E5",2],["D5",2],"C5","E5","D5","D5",["C5",4]),
    ...q("C5","C5","C5","D5",["E5",2],["D5",2],"C5","E5","D5","D5",["C5",4]),
    ...q("D5","D5","D5","D5",["A4",2],["A4",2],"D5","C5","B4","A4",["G4",4]),
    ...q("C5","C5","C5","D5",["E5",2],["D5",2],"C5","E5","D5","D5",["C5",4]),["-",1]] },

  /* ---------- instrumentais originais do jogo ---------- */
  { id:"orig-aurora", compositor:"Desafio da Arte", titulo:"Aurora na Galeria (original)", bpm:72, timbre:"harpa", notas:[
    ...q("D5","F#5",["A5",2],"F#5","E5",["D5",2],"B4","D5",["E5",2],["A4",4]),
    ...q("D5","F#5",["A5",2],"B5","A5",["F#5",2],"E5","D5",["B4",2],["D5",4]),["-",1]],
    acomp:[["D3",4],["A3",4],["B3",4],["G3",4],["D3",4],["A3",4],["G3",4],["D3",4]] },
  { id:"orig-pinceladas", compositor:"Desafio da Arte", titulo:"Pinceladas (original)", bpm:100, timbre:"piano", notas:[
    ...rep([["A3",.5],["C4",.5],["E4",.5],["A4",.5],["E4",.5],["C4",.5]],2),
    ...rep([["F3",.5],["A3",.5],["C4",.5],["F4",.5],["C4",.5],["A3",.5]],2),
    ...rep([["G3",.5],["B3",.5],["D4",.5],["G4",.5],["D4",.5],["B3",.5]],2),
    ...rep([["E3",.5],["G#3",.5],["B3",.5],["E4",.5],["B3",.5],["G#3",.5]],2),["-",1]],
    acomp:[["A2",6],["F2",6],["G2",6],["E2",6]] },
  { id:"orig-giverny", compositor:"Desafio da Arte", titulo:"Noite em Giverny (original)", bpm:60, timbre:"flauta", notas:[
    ["D5",2],["F5",1],["E5",1],["D5",2],["B4",2],["C5",2],["E5",1],["D5",1],["A4",4],
    ["D5",2],["G5",1],["F5",1],["E5",2],["C5",2],["D5",3],["A4",1],["D5",4],["-",2]],
    acomp:[["D3",8],["C3",4],["A2",4],["D3",8],["G2",4],["D3",4]] },
  { id:"orig-atelie", compositor:"Desafio da Arte", titulo:"Ateliê de Luz (original)", bpm:88, timbre:"celesta", notas:[
    ...q("C5","E5","G5","F#5",["E5",2],"D5","C5","D5",["G4",2]),
    ...q("E5","G5","B5","A5",["G5",2],"E5","D5","C5",["C5",4]),["-",1]],
    acomp:[["C3",4],["D3",4],["G2",4],["C3",4],["E3",4],["C3",4]] },
  { id:"orig-cores", compositor:"Desafio da Arte", titulo:"Biblioteca de Cores (original)", bpm:80, timbre:"piano", notas:[
    ...rep([["F3",.5],["A3",.5],["C4",.5],["E4",.5],["A4",.5],["E4",.5],["C4",.5],["A3",.5]],2),
    ...rep([["D3",.5],["F3",.5],["A3",.5],["C4",.5],["F4",.5],["C4",.5],["A3",.5],["F3",.5]],2),
    ...rep([["A#2",.5],["D3",.5],["F3",.5],["A3",.5],["D4",.5],["A3",.5],["F3",.5],["D3",.5]],2),
    ...rep([["C3",.5],["E3",.5],["G3",.5],["C4",.5],["E4",.5],["C4",.5],["G3",.5],["E3",.5]],2),["-",1]] },
  { id:"orig-espelhos", compositor:"Desafio da Arte", titulo:"Salão dos Espelhos (original)", bpm:120, timbre:"cravo", notas:[
    ...q(["A4",.5],["C5",.5],["E5",.5],["A5",.5],["G#5",.5],["E5",.5],["B4",.5],["E5",.5],["A4",2]),
    ...q(["D5",.5],["F5",.5],["A5",.5],["D6",.5],["C6",.5],["A5",.5],["E5",.5],["A5",.5],["G#5",2]),
    ...q(["A5",.5],["G#5",.5],["A5",.5],["B5",.5],["C6",1],["B5",1],["A5",.5],["G#5",.5],["E5",.5],["F5",.5],["A5",3]),["-",1]],
    acomp:[["A2",2],["E3",2],["A2",2],["E3",2],["D3",2],["A3",2],["E3",2],["E3",2],["A2",2],["E3",2],["F3",2],["E3",2]] }
  );
})();
