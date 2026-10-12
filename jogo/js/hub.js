/* ============================================================================
   SAGUÃO — o avatar do jogador (um marchand) anda pelo corredor da galeria e
   entra nas salas: cada porta leva a uma parte do jogo.
   Controles: ← → (ou A/D) para andar, Enter/↑ para entrar; ou clique numa
   porta (ele caminha até ela e entra) ou no chão (ele caminha até ali).
   ============================================================================ */

const AVATAR_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 140 220\"> <defs> <radialGradient id=\"av-pele\" cx=\"42%\" cy=\"35%\" r=\"70%\"> <stop offset=\"0\" stop-color=\"#ffe3cc\"/><stop offset=\".6\" stop-color=\"#f4c7a4\"/><stop offset=\"1\" stop-color=\"#df9f7c\"/> </radialGradient> <radialGradient id=\"av-cabelo\" cx=\"40%\" cy=\"25%\" r=\"80%\"> <stop offset=\"0\" stop-color=\"#9a6238\"/><stop offset=\".7\" stop-color=\"#6e4122\"/><stop offset=\"1\" stop-color=\"#4f2c15\"/> </radialGradient> <linearGradient id=\"av-terno\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"> <stop offset=\"0\" stop-color=\"#4a5d93\"/><stop offset=\".55\" stop-color=\"#34467a\"/><stop offset=\"1\" stop-color=\"#222f55\"/> </linearGradient> <linearGradient id=\"av-lapela\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"> <stop offset=\"0\" stop-color=\"#5a6ea6\"/><stop offset=\"1\" stop-color=\"#3a4c82\"/> </linearGradient> <linearGradient id=\"av-calca\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"> <stop offset=\"0\" stop-color=\"#3a3f4f\"/><stop offset=\".5\" stop-color=\"#2b2f3c\"/><stop offset=\"1\" stop-color=\"#1f222c\"/> </linearGradient> <radialGradient id=\"av-sapato\" cx=\"40%\" cy=\"30%\" r=\"80%\"> <stop offset=\"0\" stop-color=\"#8a5634\"/><stop offset=\"1\" stop-color=\"#4b2a14\"/> </radialGradient> <linearGradient id=\"av-gravata\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"> <stop offset=\"0\" stop-color=\"#b8394f\"/><stop offset=\"1\" stop-color=\"#7a1f30\"/> </linearGradient> <linearGradient id=\"av-maleta\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"> <stop offset=\"0\" stop-color=\"#a86a3c\"/><stop offset=\"1\" stop-color=\"#6b3f1f\"/> </linearGradient> </defs> <ellipse class=\"av-sombra\" cx=\"70\" cy=\"211\" rx=\"38\" ry=\"6\" fill=\"#000\" opacity=\".35\"/> <g class=\"av-corpo\"> <g class=\"perna tras\"> <rect x=\"55\" y=\"150\" width=\"17\" height=\"46\" rx=\"8\" fill=\"url(#av-calca)\"/> <ellipse cx=\"62\" cy=\"199\" rx=\"13\" ry=\"7.5\" fill=\"url(#av-sapato)\"/> <ellipse cx=\"58\" cy=\"196.5\" rx=\"5\" ry=\"2\" fill=\"#fff\" opacity=\".25\"/> </g> <g class=\"braco tras\"> <rect x=\"93\" y=\"103\" width=\"17\" height=\"44\" rx=\"8.5\" fill=\"#2b3a66\"/> <circle cx=\"101.5\" cy=\"150\" r=\"8\" fill=\"url(#av-pele)\"/> </g> <path d=\"M40,108 Q40,95 55,93 L85,93 Q100,95 100,108 L102,150 Q102,158 94,158 L46,158 Q38,158 38,150 Z\" fill=\"url(#av-terno)\"/> <path d=\"M58,93 L70,120 L82,93 Z\" fill=\"#f4f1ea\"/> <path d=\"M66.5,97 L73.5,97 L72,102 L68,102 Z\" fill=\"url(#av-gravata)\"/> <path d=\"M68,102 L72,102 L75,124 L70,131 L65,124 Z\" fill=\"url(#av-gravata)\"/> <path d=\"M69,104 L71,104 L72.5,116 L70,119 Z\" fill=\"#fff\" opacity=\".18\"/> <path d=\"M55,93 L58,93 L70,122 L62,116 L52,103 Z\" fill=\"url(#av-lapela)\"/> <path d=\"M85,93 L82,93 L70,122 L78,116 L88,103 Z\" fill=\"url(#av-lapela)\"/> <path d=\"M83,112 L92,112 L91,116 L84,116 Z\" fill=\"#2b3a66\"/> <path d=\"M84,112 L86,108 L88,111 L90,108 L91,112 Z\" fill=\"#e8c766\"/> <circle cx=\"70\" cy=\"136\" r=\"2.3\" fill=\"#e8c766\"/> <circle cx=\"70\" cy=\"146\" r=\"2.3\" fill=\"#e8c766\"/> <ellipse cx=\"52\" cy=\"103\" rx=\"8\" ry=\"4\" fill=\"#fff\" opacity=\".13\" transform=\"rotate(-25 52 103)\"/> <g class=\"perna frente\"> <rect x=\"68\" y=\"150\" width=\"17\" height=\"46\" rx=\"8\" fill=\"url(#av-calca)\"/> <ellipse cx=\"78\" cy=\"199\" rx=\"13\" ry=\"7.5\" fill=\"url(#av-sapato)\"/> <ellipse cx=\"74\" cy=\"196.5\" rx=\"5\" ry=\"2\" fill=\"#fff\" opacity=\".25\"/> </g> <g class=\"braco frente\"> <rect x=\"30\" y=\"103\" width=\"17\" height=\"44\" rx=\"8.5\" fill=\"url(#av-terno)\"/> <rect x=\"18\" y=\"152\" width=\"34\" height=\"24\" rx=\"4\" fill=\"url(#av-maleta)\"/> <path d=\"M28,152 Q28,145 35,145 Q42,145 42,152\" fill=\"none\" stroke=\"#4b2a14\" stroke-width=\"3\"/> <rect x=\"32\" y=\"159\" width=\"6\" height=\"4\" rx=\"1\" fill=\"#e8c766\"/> <rect x=\"18\" y=\"163\" width=\"34\" height=\"1.5\" fill=\"#4b2a14\" opacity=\".5\"/> <circle cx=\"38.5\" cy=\"150\" r=\"8\" fill=\"url(#av-pele)\"/> </g> <g class=\"cabeca\"> <circle cx=\"32\" cy=\"58\" r=\"8\" fill=\"url(#av-pele)\"/> <circle cx=\"108\" cy=\"58\" r=\"8\" fill=\"url(#av-pele)\"/> <circle cx=\"33\" cy=\"58\" r=\"3.5\" fill=\"#df9f7c\" opacity=\".6\"/> <circle cx=\"107\" cy=\"58\" r=\"3.5\" fill=\"#df9f7c\" opacity=\".6\"/> <ellipse cx=\"70\" cy=\"56\" rx=\"37\" ry=\"38\" fill=\"url(#av-pele)\"/> <path d=\"M33,52 Q30,22 60,16 Q92,12 105,32 Q110,42 107,54 Q100,40 88,36 Q74,31 60,38 Q46,44 41,56 Q37,58 33,52 Z\" fill=\"url(#av-cabelo)\"/> <path d=\"M60,38 Q74,24 96,29\" fill=\"none\" stroke=\"#b07a4c\" stroke-width=\"2.5\" stroke-linecap=\"round\" opacity=\".7\"/> <path d=\"M44,34 Q52,24 66,22\" fill=\"none\" stroke=\"#b07a4c\" stroke-width=\"2\" stroke-linecap=\"round\" opacity=\".55\"/> <path d=\"M47,48 Q54,43 61,47\" fill=\"none\" stroke=\"#5a3219\" stroke-width=\"3.6\" stroke-linecap=\"round\"/> <path d=\"M79,47 Q86,43 93,48\" fill=\"none\" stroke=\"#5a3219\" stroke-width=\"3.6\" stroke-linecap=\"round\"/> <g class=\"olhos\"> <ellipse cx=\"54\" cy=\"59\" rx=\"7.5\" ry=\"8.5\" fill=\"#fff\"/> <ellipse cx=\"86\" cy=\"59\" rx=\"7.5\" ry=\"8.5\" fill=\"#fff\"/> <circle cx=\"55\" cy=\"60\" r=\"4.6\" fill=\"#2a1d14\"/> <circle cx=\"87\" cy=\"60\" r=\"4.6\" fill=\"#2a1d14\"/> <circle cx=\"56.6\" cy=\"58\" r=\"1.6\" fill=\"#fff\"/> <circle cx=\"88.6\" cy=\"58\" r=\"1.6\" fill=\"#fff\"/> </g> <ellipse cx=\"70\" cy=\"69\" rx=\"4.5\" ry=\"3.8\" fill=\"#e5a882\"/> <ellipse cx=\"68.5\" cy=\"67.8\" rx=\"1.6\" ry=\"1\" fill=\"#fff\" opacity=\".45\"/> <ellipse cx=\"45\" cy=\"73\" rx=\"7\" ry=\"4.5\" fill=\"#f19a9a\" opacity=\".55\"/> <ellipse cx=\"95\" cy=\"73\" rx=\"7\" ry=\"4.5\" fill=\"#f19a9a\" opacity=\".55\"/> <path d=\"M59,78 Q70,88 81,78\" fill=\"none\" stroke=\"#8a3f2c\" stroke-width=\"3\" stroke-linecap=\"round\"/> <ellipse cx=\"58\" cy=\"38\" rx=\"9\" ry=\"4\" fill=\"#fff\" opacity=\".18\" transform=\"rotate(-15 58 38)\"/> </g> </g> </svg>";

const SALAS = [
  { view:"acquisition", icone:"🎲", nome:"Aquisições",      dica:"Roleta de obras" },
  { view:"collection",  icone:"🖼️", nome:"Coleção",         dica:"Suas obras" },
  { view:"exposicao",   icone:"🏛️", nome:"Galeria Mundo",   dica:"Exposições" },
  { view:"salas",       icone:"🏢", nome:"Salas",           dica:"Alugue, compre, melhore" },
  { view:"mapa",        icone:"🗺️", nome:"Mapa-Múndi",      dica:"Voos e pregões" },
  { view:"auction",     icone:"🔨", nome:"Casa de Leilões", dica:"Dê seus lances" },
  { view:"banco",       icone:"🏦", nome:"Bancos",          dica:"Crédito por reputação" },
  { view:"quiz",        icone:"📜", nome:"Teste do Curador",dica:"€ 50 mil por acerto" },
];

const HUB_ESPACO = 175;          // distância entre portas
const HUB_MARGEM = 120;
const HUB_VEL = 250;             // px por segundo
const HUB_ALCANCE = 48;          // quão perto da porta para poder entrar

const Hub = {
  x: null, dir: 1, tecla: 0, alvo: null, portaAlvo: null,
  entrando: false, loop: null, ultimo: 0, ultimaPorta: null, jaAjudou: false,

  largura(){ return HUB_MARGEM*2 + HUB_ESPACO*(SALAS.length-1); },
  xPorta(i){ return HUB_MARGEM + i*HUB_ESPACO; },

  portaPerto(){
    let melhor = null, dist = Infinity;
    SALAS.forEach((s,i)=>{
      const d = Math.abs(this.xPorta(i) - this.x);
      if(d < dist){ dist = d; melhor = i; }
    });
    return dist <= HUB_ALCANCE ? melhor : null;
  },

  irAte(x, porta=null){
    if(this.entrando) return;
    this.alvo = Math.max(40, Math.min(this.largura()-40, x));
    this.portaAlvo = porta;
    this.iniciar();
  },

  entrar(i){
    if(this.entrando || i === null) return;
    this.entrando = true;
    this.tecla = 0; this.alvo = null; this.portaAlvo = null;
    this.ultimaPorta = i;
    const porta = document.querySelector(`[data-porta="${i}"]`);
    const av = document.getElementById("hub-avatar");
    if(porta) porta.classList.add("aberta");
    if(av){ av.classList.remove("andando"); av.classList.add("entrando"); }
    AudioFX.click();
    setTimeout(()=>{
      this.entrando = false;
      switchView(SALAS[i].view);
    }, 650);
  },

  iniciar(){
    if(this.loop) return;
    this.ultimo = performance.now();
    const passo = (agora)=>{
      if(document.querySelector(".view.active")?.id !== "view-menu"){ this.loop = null; return; }
      const dt = Math.min(0.05, (agora - this.ultimo)/1000);
      this.ultimo = agora;
      this.atualizar(dt);
      this.loop = requestAnimationFrame(passo);
    };
    this.loop = requestAnimationFrame(passo);
  },

  atualizar(dt){
    const av = document.getElementById("hub-avatar");
    if(!av || this.entrando) return;
    let mov = 0;
    if(this.tecla){ mov = this.tecla; this.alvo = null; this.portaAlvo = null; }
    else if(this.alvo !== null){
      const falta = this.alvo - this.x;
      if(Math.abs(falta) < 3){
        this.x = this.alvo; this.alvo = null;
        if(this.portaAlvo !== null){ const p = this.portaAlvo; this.portaAlvo = null; this.entrar(p); return; }
      } else mov = Math.sign(falta);
    }
    if(mov){
      this.dir = mov;
      this.x = Math.max(40, Math.min(this.largura()-40, this.x + mov*HUB_VEL*dt));
    }
    av.classList.toggle("andando", !!mov);
    av.style.transform = `translateX(${this.x.toFixed(1)}px)`;
    av.querySelector(".hub-avatar-arte").style.transform = `scaleX(${this.dir < 0 ? -1 : 1})`;

    // destaca a porta mais próxima e mostra a dica de entrada
    const perto = this.portaPerto();
    document.querySelectorAll("[data-porta]").forEach(p=>p.classList.toggle("perto", Number(p.dataset.porta) === perto));
    const balao = document.getElementById("hub-balao");
    if(balao){
      if(perto !== null){
        balao.innerHTML = `${SALAS[perto].icone} <b>${SALAS[perto].nome}</b><small>Enter ou clique para entrar</small>`;
        balao.classList.add("mostra");
      } else if(!this.ajudaAtiva){
        balao.classList.remove("mostra");
      }
      balao.style.transform = `translateX(${this.x.toFixed(1)}px)`;
    }

    // a câmera acompanha o avatar quando o corredor é mais largo que a tela
    const vp = document.getElementById("hub-janela");
    if(vp && vp.scrollWidth > vp.clientWidth){
      const alvoScroll = this.x - vp.clientWidth/2;
      vp.scrollLeft += (alvoScroll - vp.scrollLeft) * Math.min(1, dt*6);
    }
  },
};

function selosDaSala(view){
  if(view === "auction" && typeof Auction !== "undefined"){
    Auction.garantirConvites();
    return Auction.convites.length ? `<span class="hub-selo">${Auction.convites.length}</span>` : "";
  }
  if(view === "quiz" && typeof Quiz !== "undefined" && Quiz.liberado()) return `<span class="hub-selo">!</span>`;
  if(view === "exposicao"){
    const n = State.exhibitions.filter(e=>!e.ended).length;
    return n ? `<span class="hub-selo verde">${n}</span>` : "";
  }
  if(view === "collection" && State.collection.length) return `<span class="hub-selo azul">${State.collection.length}</span>`;
  if(view === "mapa" && State.voos.length) return `<span class="hub-selo">✈</span>`;
  if(view === "salas"){ const n = Object.values(State.salas||{}).filter(x=>x.dono).length; return n ? `<span class="hub-selo azul">${n}</span>` : ""; }
  if(view === "banco" && typeof Banco!=="undefined"){
    const a = Banco.ativos(); if(a.some(e=>e.vencida)) return `<span class="hub-selo" style="background:var(--rose)">!</span>`;
    return a.length ? `<span class="hub-selo">${a.length}</span>` : "";
  }
  return "";
}

function renderHub(){
  const el = document.getElementById("view-menu");
  const W = Hub.largura();
  const saindo = Hub.ultimaPorta !== null;
  if(Hub.x === null) Hub.x = Hub.xPorta(0) - 70;
  if(saindo) Hub.x = Hub.xPorta(Hub.ultimaPorta);

  el.innerHTML = `
    <div class="view-inner view-wide">
      <h1 class="page-title">Galeria Art Nexus</h1>
      <div class="hub-saudacao"><div class="hs-av">${AVATAR_SVG}</div><div><b>Olá, marchand!</b><small>Para qual sala vamos?</small></div></div>
      <p class="page-sub">Ande pelo corredor e entre na sala que quiser. <span class="hub-teclas">← → para andar · Enter para entrar · ou clique numa porta</span></p>
      <div class="hub-janela" id="hub-janela">
        <div class="hub-mundo" id="hub-mundo" style="width:${W}px">
          <div class="hub-parede"></div>
          <div class="hub-rodape"></div>
          ${SALAS.map((s,i)=>`
            ${i>0 ? `<div class="hub-arandela" style="left:${Hub.xPorta(i)-HUB_ESPACO/2}px"></div>` : ""}
            <button class="hub-porta" data-porta="${i}" style="left:${Hub.xPorta(i)}px" aria-label="Entrar em ${s.nome}">
              <div class="hub-placa"><span class="hub-icone">${s.icone}</span>${selosDaSala(s.view)}
                <b>${s.nome}</b><small>${s.dica}</small></div>
              <div class="hub-vao">
                <div class="hub-luz"></div>
                <div class="hub-folha esq"></div><div class="hub-folha dir"></div>
              </div>
              <div class="hub-tapete"></div>
            </button>`).join("")}
          <div class="hub-piso" id="hub-piso"></div>
          <div class="hub-balao" id="hub-balao"></div>
          <div class="hub-avatar ${saindo? "saindo" : ""}" id="hub-avatar">
            <div class="hub-avatar-fx"><div class="hub-avatar-arte">${AVATAR_SVG}</div></div>
            <div class="hub-cracha">Marchand</div>
          </div>
        </div>
      </div>
      <div class="hub-atalhos" aria-label="Atalhos">${SALAS.map(s=>`
        <button type="button" class="hub-atalho" data-atalho="${s.view}">
          <span class="ha-icone">${s.icone}</span>${selosDaSala(s.view)}
          <b>${s.nome}</b><small>${s.dica}</small>
        </button>`).join("")}</div>
    </div>`;

  // atalhos em cartões: o caminho principal no celular (o corredor continua como cenário)
  el.querySelectorAll("[data-atalho]").forEach(b=>b.addEventListener("click", ()=>{
    AudioFX.click(); Hub.parar && Hub.parar(); switchView(b.dataset.atalho);
  }));
  el.querySelectorAll("[data-porta]").forEach(p=>{
    p.addEventListener("click", ()=>{
      const i = Number(p.dataset.porta);
      if(Math.abs(Hub.xPorta(i) - Hub.x) <= HUB_ALCANCE) Hub.entrar(i);
      else Hub.irAte(Hub.xPorta(i), i);
    });
  });
  document.getElementById("hub-piso").addEventListener("click", (ev)=>{
    const r = document.getElementById("hub-mundo").getBoundingClientRect();
    Hub.irAte(ev.clientX - r.left);
  });

  // ao voltar de uma sala, o avatar sai pela mesma porta
  if(saindo){
    const porta = el.querySelector(`[data-porta="${Hub.ultimaPorta}"]`);
    if(porta) porta.classList.add("aberta");
    setTimeout(()=>{
      if(porta) porta.classList.remove("aberta");
      document.getElementById("hub-avatar")?.classList.remove("saindo");
    }, 700);
  }

  // dica de boas-vindas na primeira visita
  if(!Hub.jaAjudou){
    Hub.jaAjudou = true;
    Hub.ajudaAtiva = true;
    const b = document.getElementById("hub-balao");
    b.innerHTML = `Olá! Para qual sala vamos?<small>← → para andar · Enter para entrar</small>`;
    b.classList.add("mostra");
    setTimeout(()=>{ Hub.ajudaAtiva = false; }, 4500);
  }
  Hub.atualizar(0);
  const vp = document.getElementById("hub-janela");
  if(vp) vp.scrollLeft = Hub.x - vp.clientWidth/2;
  Hub.iniciar();
}

// Teclado: só age no saguão e sem janela (modal) aberta
window.addEventListener("keydown", (e)=>{
  if(document.querySelector(".view.active")?.id !== "view-menu") return;
  if(document.getElementById("modal-overlay")?.classList.contains("active")) return;
  const k = e.key;
  if(k === "ArrowLeft" || k === "a" || k === "A"){ Hub.tecla = -1; e.preventDefault(); Hub.iniciar(); }
  else if(k === "ArrowRight" || k === "d" || k === "D"){ Hub.tecla = 1; e.preventDefault(); Hub.iniciar(); }
  else if(k === "Enter" || k === "ArrowUp" || k === "w" || k === "W" || k === " "){
    const p = Hub.portaPerto();
    if(p !== null){ e.preventDefault(); Hub.entrar(p); }
  }
});
window.addEventListener("keyup", (e)=>{
  if(["ArrowLeft","ArrowRight","a","A","d","D"].includes(e.key)) Hub.tecla = 0;
});
