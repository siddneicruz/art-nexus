/* ============================================================================
   TRILHA SONORA DA GALERIA
   Temas famosos de Mozart, Vivaldi, Beethoven e Wagner — composições em
   domínio público — sintetizados na hora pelo navegador (Web Audio), com
   reverberação de salão. Não é uma orquestra gravada: é uma leitura dos
   temas com timbres sintetizados.
   Para usar gravações de verdade, coloque arquivos de domínio público em
   assets/musica/ com os nomes abaixo (ex.: assets/musica/mozart.mp3). O jogo
   tenta o arquivo primeiro e, se não existir, cai para a síntese.
   Boas fontes de gravações em domínio público: Musopen e Wikimedia Commons.
   ============================================================================ */

// notas em batidas: [nota, duração]. "-" = pausa
const PECAS = [
  { id:"mozart", compositor:"Mozart", titulo:"Eine kleine Nachtmusik (1787)", bpm:132, timbre:"cordas", notas:[
    ["G4",1],["D4",.5],["G4",1],["D4",.5],["G4",.5],["D4",.5],["G4",.5],["B4",.5],["D5",2],
    ["C5",1],["A4",.5],["C5",1],["A4",.5],["C5",.5],["A4",.5],["F#4",.5],["A4",.5],["D4",2],
    ["G4",.5],["G4",.5],["B4",.5],["A4",.5],["G4",.5],["G4",.5],["F#4",.5],["F#4",.5],
    ["A4",.5],["C5",.5],["F#4",.5],["A4",.5],["G4",2],["-",1],
  ]},
  { id:"vivaldi", compositor:"Vivaldi", titulo:"As Quatro Estações — Primavera (1725)", bpm:112, timbre:"cravo", notas:[
    ["E5",.5],["G#5",.5],["G#5",.5],["G#5",.5],["F#5",.25],["E5",.25],["B5",1.5],
    ["B5",.25],["A5",.25],["G#5",.5],["G#5",.5],["G#5",.5],["F#5",.25],["E5",.25],["B5",1.5],
    ["B5",.25],["A5",.25],["G#5",.5],["A5",.5],["B5",.5],["A5",.5],["G#5",.5],["F#5",.5],["E5",1.5],["-",1],
  ]},
  { id:"beethoven", compositor:"Beethoven", titulo:"Sinfonia nº 5 (1808)", bpm:108, timbre:"orquestra", notas:[
    ["G4",.5],["G4",.5],["G4",.5],["D#4",2.5],["-",.5],
    ["F4",.5],["F4",.5],["F4",.5],["D4",3],["-",.5],
    ["G4",.5],["G4",.5],["G4",.5],["D#4",.5],["G#4",.5],["G#4",.5],["G#4",.5],["G4",.5],
    ["D#5",.5],["D#5",.5],["D#5",.5],["C5",3],["-",1],
  ]},
  { id:"wagner", compositor:"Wagner", titulo:"A Cavalgada das Valquírias (1856)", bpm:100, timbre:"metais", notas:[
    ["B4",.375],["F#4",.125],["B4",.5],["D5",1.5],["B4",1.5],
    ["D5",.375],["B4",.125],["D5",.5],["F#5",1.5],["D5",1.5],
    ["F#5",.375],["D5",.125],["F#5",.5],["A5",1.5],["A4",1.5],
    ["D5",.375],["A4",.125],["D5",.5],["F#5",3],["-",1],
  ]},
];

const NOTA_IDX = { C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11 };
function freqNota(n){
  const m = n.match(/^([A-G]#?)(\d)$/); if(!m) return 0;
  const midi = (Number(m[2]) + 1) * 12 + NOTA_IDX[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const Musica = {
  ctx:null, saida:null, fontes:[], timer:null, audio:null, indice:0, tocando:false,
  mudo:false,

  contexto(){
    if(this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    this.ctx = new AC();
    this.saida = this.ctx.createGain();
    this.saida.gain.setValueAtTime(0.22, this.ctx.currentTime);
    // reverberação de salão: resposta de impulso feita de ruído decrescente
    if(this.ctx.createConvolver && this.ctx.createBuffer){
      const conv = this.ctx.createConvolver(), seg = 2.6, sr = this.ctx.sampleRate || 44100;
      const buf = this.ctx.createBuffer(2, Math.floor(sr*seg), sr);
      for(let c=0;c<2;c++){ const d = buf.getChannelData(c);
        for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2.8); }
      conv.buffer = buf;
      const seco = this.ctx.createGain(), molhado = this.ctx.createGain();
      seco.gain.setValueAtTime(0.75, this.ctx.currentTime); molhado.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.saida.connect(seco); seco.connect(this.ctx.destination);
      this.saida.connect(conv); conv.connect(molhado); molhado.connect(this.ctx.destination);
    } else this.saida.connect(this.ctx.destination);
    return this.ctx;
  },

  atual(){ return PECAS[this.indice % PECAS.length]; },

  tocar(indice){
    this.parar(); this.voltas = 0;
    if(typeof indice === "number") this.indice = indice;
    this.tocando = true;
    if(this.mudo) return;
    const peca = this.atual();
    // começa a síntese na hora (sem silêncio de espera); se existir uma
    // gravação real em assets/musica/, ela assume assim que puder tocar
    this.sintetizar(peca);
    try{
      if(typeof IMG_EMBUTIDAS !== "undefined") throw 0;     // arquivo único: não há pasta de gravações para procurar
      const a = new Audio(`assets/musica/${peca.id}.mp3`);
      a.loop = true; a.volume = 0.5;
      a.addEventListener("canplaythrough", ()=>{
        if(!this.tocando || this.mudo || this.atual() !== peca) return;
        const p = a.play();
        const assumir = ()=>{ clearTimeout(this.timer); this.fontes.forEach(o=>{ try{ o.stop(); }catch(e){} }); this.fontes = []; this.audio = a; };
        if(p && p.then) p.then(assumir).catch(()=>{}); else assumir();
      }, { once:true });
      this.audioTentativa = a;
    } catch(e){ /* sem suporte a <audio>: segue só com a síntese */ }
    atualizarControleMusica();
  },

  sintetizar(peca){
    const ctx = this.contexto(); if(!ctx) return;
    if(ctx.resume) ctx.resume();
    const batida = 60 / peca.bpm, inicio = ctx.currentTime + 0.08;
    let t = inicio, total = 0;
    peca.notas.forEach(([n, dur])=>{
      const d = dur * batida;
      if(n !== "-") this.nota(freqNota(n), t, d, peca.timbre);
      t += d; total += d;
    });
    if(peca.acomp){ let ta = inicio; peca.acomp.forEach(([n, dur])=>{ const d = dur * batida; if(n !== "-" && ta < inicio + total) this.nota(freqNota(n), ta, d, "cordas", .55); ta += d; }); }
    // toca a peça duas vezes e passa para a próxima do repertório
    this.voltas = (this.voltas || 0) + 1;
    this.timer = setTimeout(()=>{
      if(!this.tocando || this.mudo || this.audio) return;
      if(this.voltas >= 2){ this.voltas = 0; this.tocar((this.indice + 1) % PECAS.length); }
      else this.sintetizar(peca);
    }, (total + 0.8) * 1000);
  },

  nota(f, t, d, timbre, vol=1){
    const ctx = this.ctx;
    const T = {
      cordas:   { tipo:"sawtooth", tons:[[1,.45],[.5,.18]], lp:1400, ataque:.06, sustenta:true },
      orquestra:{ tipo:"sawtooth", tons:[[1,.5],[.5,.35],[2,.12]], lp:1400, ataque:.03, sustenta:true },
      metais:   { tipo:"sawtooth", tons:[[1,.5],[.5,.3]], lp:900, abre:2200, ataque:.03, sustenta:true },
      cravo:    { tipo:"square", tons:[[1,.45],[2,.12]], lp:2400, ataque:.005, queda:.5 },
      piano:    { tipo:"triangle", tons:[[1,.55],[2,.16],[3,.06]], lp:3200, ataque:.008, queda:1.6 },
      harpa:    { tipo:"triangle", tons:[[1,.5],[2,.1]], lp:3600, ataque:.004, queda:1.4 },
      celesta:  { tipo:"sine", tons:[[1,.45],[4,.12]], lp:5000, ataque:.004, queda:1.2 },
      flauta:   { tipo:"sine", tons:[[1,.5],[2,.1]], lp:2800, ataque:.08, sustenta:true },
    }[timbre] || { tipo:"sawtooth", tons:[[1,.45]], lp:1400, ataque:.05, sustenta:true };
    const fim = T.sustenta ? d * .95 : Math.max(Math.min(d * 1.5, T.queda), .2);
    T.tons.forEach(([m, v0])=>{
      const vv = v0 * vol;
      const o = ctx.createOscillator(), g = ctx.createGain(), fil = ctx.createBiquadFilter();
      o.type = T.tipo;
      o.frequency.setValueAtTime(f * m, t);
      fil.type = "lowpass";
      fil.frequency.setValueAtTime(T.lp, t);
      if(T.abre) fil.frequency.linearRampToValueAtTime(T.abre, t + Math.min(d, .25));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vv, t + T.ataque);
      if(T.sustenta){ g.gain.setValueAtTime(vv * .85, t + Math.max(T.ataque, fim - .08)); g.gain.linearRampToValueAtTime(0.0001, t + fim); }
      else g.gain.exponentialRampToValueAtTime(0.0001, t + fim);
      o.connect(fil); fil.connect(g); g.connect(this.saida);
      o.start(t); o.stop(t + fim + .05);
      this.fontes.push(o);
    });
  },

  parar(){
    this.tocando = false;
    clearTimeout(this.timer); this.timer = null;
    this.fontes.forEach(o=>{ try{ o.stop(); }catch(e){} });
    this.fontes = [];
    if(this.audio){ try{ this.audio.pause(); }catch(e){} this.audio = null; }
    if(this.audioTentativa){ try{ this.audioTentativa.pause(); }catch(e){} this.audioTentativa = null; }
  },

  proxima(){ this.tocar((this.indice + 1) % PECAS.length); },
  alternarMudo(){
    this.mudo = !this.mudo;
    if(this.mudo){ const eraTocando = this.tocando; this.parar(); this.tocando = eraTocando; }
    else if(this.tocando) this.tocar(this.indice);
    atualizarControleMusica();
  },
};

function atualizarControleMusica(){
  const el = document.getElementById("sv-musica"); if(!el) return;
  const p = Musica.atual();
  el.querySelector(".mu-titulo").innerHTML = Musica.mudo ? "Música desligada" : `♪ <b>${p.compositor}</b> — ${p.titulo}`;
  el.querySelector("#mu-mudo").textContent = Musica.mudo ? "🔇" : "🔊";
}
