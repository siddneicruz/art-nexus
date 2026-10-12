/* ============================================================================
   SALA VISTA DE CIMA — perspectiva 3/4 (como em jogos clássicos de visão
   superior): a parede do fundo aparece de frente, com os quadros pendurados;
   o chão aparece em planta, com cavaletes, banco, plantas e visitantes vistos
   de cima (chapéus, bonés, vestidos, calças).
   Escala aproximada: a sala tem ~10 m de largura (100 unidades por metro no
   chão); a parede tem ~3,2 m de altura; uma pessoa tem ~45 cm de ombro; os
   quadros mantêm a proporção real da imagem.
   A velocidade dos visitantes acompanha o slider "1 dia = Xs" do jogo, e
   uma trilha clássica (Mozart, Vivaldi, Beethoven, Wagner) toca ao fundo.
   ============================================================================ */

const SV = { W:1000, H:660, PAREDE:190, M:100 };   // M = unidades por metro no chão

const SalaVisao = {
  aberto:false, ex:null, gente:[], proximoSpawn:0, raf:null, ultimo:0, pontos:[],

  abrir(ex){
    this.ex = ex; this.aberto = true; this.gente = []; this.proximoSpawn = 0.3;
    this.ultimo = performance.now();
    montarSalaVisao(ex);
    if(typeof Musica !== "undefined") Musica.tocar(Math.floor(Math.random()*PECAS.length));
    this.raf = requestAnimationFrame(t=>this.passo(t));
  },

  fechar(){
    this.aberto = false;
    if(this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    if(typeof Musica !== "undefined") Musica.parar();
    document.getElementById("sv-overlay")?.remove();
  },

  passo(agora){
    if(!this.aberto) return;
    const dt = Math.min(0.05, (agora - this.ultimo)/1000);
    this.ultimo = agora;
    const atual = State.exhibitions.find(e=>e.id === this.ex.id);
    if(!atual || atual.ended){ toast("A exposição foi encerrada"); this.fechar(); return; }
    this.ex = atual;
    atualizarCabecalhoSala(atual);
    const vel = 6 / Math.max(2, State.speedSecPerDay);
    if(!atual.paused){
      this.proximoSpawn -= dt*vel;
      if(this.proximoSpawn <= 0 && this.gente.length < 11){
        spawnVisitante(this);
        this.proximoSpawn = Math.max(0.6, 2.6 - (atual.diaVisitantes||0)/320);
      }
      this.gente.forEach(v=>atualizarVisitante(v, dt*vel));
      this.gente = this.gente.filter(v=>!v.saiu);
    }
    this.raf = requestAnimationFrame(t=>this.passo(t));
  },
};

function outrasObrasParaSala(ex){
  const pool = State.allArtworks.filter(w=>w.imagem && w.id !== ex.work.id);
  const doPais = pool.filter(w=>w.pais === ex.work.pais);
  const base = doPais.length >= 4 ? doPais : pool;
  return [...base].sort(()=>Math.random()-0.5).slice(0, 4);
}

/* ------------------------------------------------------------ montagem */
// quadro na parede (vista de frente): moldura dourada, sombra, luz de trilho
function quadroParede(cls, w, cx, baseY, alturaM){
  const h = alturaM * 59;              // 59 unidades por metro na altura da parede
  const lw = h * 0.8;                  // proporção provisória; corrigida quando a imagem carrega
  return `<g class="sv-qp ${cls}" data-cx="${cx}" data-base="${baseY}" data-h="${h}">
    <rect class="sv-qp-sombra" x="${cx-lw/2+4}" y="${baseY-h+6}" width="${lw}" height="${h}"/>
    <rect class="sv-qp-moldura" x="${cx-lw/2-6}" y="${baseY-h-6}" width="${lw+12}" height="${h+12}"/>
    <image class="sv-qp-img" href="${imgSrc(w)}" x="${cx-lw/2}" y="${baseY-h}" width="${lw}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
  </g>`;
}
// cavalete no chão, visto em 3/4: tela de frente, três pernas, sombra
function cavalete(w, cx, cy){
  const h = 0.8*59, lw = h*0.8;
  return `<g class="sv-cav" data-cx="${cx}" data-base="${cy-18}" data-h="${h}">
    <ellipse cx="${cx}" cy="${cy+4}" rx="${lw/2+14}" ry="10" class="sv-sombra-chao"/>
    <line x1="${cx-lw/2+6}" y1="${cy-24}" x2="${cx-lw/2-4}" y2="${cy+4}" class="sv-cav-perna"/>
    <line x1="${cx+lw/2-6}" y1="${cy-24}" x2="${cx+lw/2+4}" y2="${cy+4}" class="sv-cav-perna"/>
    <line x1="${cx}" y1="${cy-40}" x2="${cx}" y2="${cy-8}" class="sv-cav-perna"/>
    <rect class="sv-qp-moldura" x="${cx-lw/2-3}" y="${cy-18-h-3}" width="${lw+6}" height="${h+6}"/>
    <image class="sv-qp-img" href="${imgSrc(w)}" x="${cx-lw/2}" y="${cy-18-h}" width="${lw}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
    <rect x="${cx-lw/2-6}" y="${cy-20}" width="${lw+12}" height="4" rx="1" class="sv-cav-apoio"/>
  </g>`;
}
function planta(cx, cy){
  return `<g class="sv-planta" transform="translate(${cx},${cy})">
    <circle r="22" class="sv-vaso"/><circle r="19" fill="#2f5a34"/><circle cx="-6" cy="-5" r="11" fill="#3e7443"/>
    <circle cx="7" cy="4" r="10" fill="#4a8a4f"/><circle cx="3" cy="-8" r="7" fill="#5ea162"/></g>`;
}

function montarSalaVisao(ex){
  document.getElementById("sv-overlay")?.remove();
  const l = cidadeDaExposicao(ex);
  const outras = outrasObrasParaSala(ex);
  const P = SV.PAREDE;
  // postes do cordão de isolamento na frente da obra principal
  const postes = [390, 450, 550, 610];
  const cordao = postes.slice(0,-1).map((x,i)=>{ const x2 = postes[i+1];
    return `<path class="corda" d="M${x},${P+44} Q${(x+x2)/2},${P+60} ${x2},${P+44}"/>`; }).join("");

  const overlay = document.createElement("div");
  overlay.id = "sv-overlay";
  overlay.innerHTML = `
    <div class="sv-card">
      <button class="sv-x" id="sv-fechar" title="Fechar (Esc)">✕</button>
      <div class="sv-head">
        <img src="${imgSrc(ex.work)}" alt="">
        <div class="sv-head-txt">
          <div class="sv-titulo">${ex.work.titulo}</div>
          <div class="sv-sub">${ex.work.artista} · ${COUNTRIES[l.pais].flag} ${l.cidade}, ${l.pais}</div>
        </div>
        <div class="sv-live">
          <div class="sv-stat"><b id="sv-dia">Dia ${ex.dayIndex}/${ex.durationDays}</b><small>andamento</small></div>
          <div class="sv-stat"><b id="sv-receita">${fmtMoney(valoresHojeAoVivo(ex).receita)}</b><small>hoje</small></div>
          <div class="sv-stat"><b id="sv-vis">${valoresHojeAoVivo(ex).visitantes}</b><small>visitantes hoje</small></div>
        </div>
      </div>
      <div class="sv-sala">
        <svg id="sv-cena" viewBox="0 0 ${SV.W} ${SV.H}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="sv-taco" width="60" height="30" patternUnits="userSpaceOnUse">
              <rect width="60" height="30" fill="#5b3f24"/><rect width="30" height="15" fill="#664728"/>
              <rect x="30" y="15" width="30" height="15" fill="#664728"/>
              <path d="M0 15H60M30 0V15M0 15V30M60 15V30" stroke="#3f2b17" stroke-width="1"/></pattern>
            <linearGradient id="sv-parede-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#2a1216"/><stop offset="1" stop-color="#4a1f26"/></linearGradient>
            <radialGradient id="sv-luz-parede" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff2c9" stop-opacity=".5"/><stop offset="1" stop-color="#fff2c9" stop-opacity="0"/></radialGradient>
            <radialGradient id="sv-luz-chao" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".32"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
            <radialGradient id="sv-vinheta" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
          </defs>
          <!-- parede do fundo, vista de frente -->
          <rect x="0" y="0" width="${SV.W}" height="${P}" fill="url(#sv-parede-g)"/>
          <rect x="0" y="0" width="${SV.W}" height="12" fill="#1a0b0e"/>
          <rect x="0" y="12" width="${SV.W}" height="4" fill="#8a6a2c"/>
          ${[200,500,800].map(x=>`<ellipse cx="${x}" cy="30" rx="120" ry="150" fill="url(#sv-luz-parede)"/>`).join("")}
          ${[200,500,800].map(x=>`<rect x="${x-10}" y="14" width="20" height="7" rx="2" fill="#c9a13b"/>`).join("")}
          ${quadroParede("principal", ex.work, 500, 160, 1.8)}
          ${quadroParede("lateral", outras[0]||ex.work, 200, 150, 0.9)}
          ${quadroParede("lateral", outras[1]||ex.work, 800, 150, 0.9)}
          <rect x="0" y="${P-12}" width="${SV.W}" height="12" fill="#1f0e10"/>
          <rect x="0" y="${P-12}" width="${SV.W}" height="2" fill="#8a6a2c"/>
          <!-- chão em planta -->
          <rect x="28" y="${P}" width="${SV.W-56}" height="${SV.H-P-20}" fill="url(#sv-taco)"/>
          <ellipse cx="500" cy="${P+72}" rx="210" ry="70" fill="url(#sv-luz-chao)"/>
          <ellipse cx="200" cy="${P+55}" rx="110" ry="45" fill="url(#sv-luz-chao)"/>
          <ellipse cx="800" cy="${P+55}" rx="110" ry="45" fill="url(#sv-luz-chao)"/>
          <!-- paredes laterais vistas de cima, com quadros de perfil -->
          <rect x="0" y="${P}" width="28" height="${SV.H-P}" fill="#1a0b0e"/>
          <rect x="${SV.W-28}" y="${P}" width="28" height="${SV.H-P}" fill="#1a0b0e"/>
          ${[300,470].map(y=>`<rect x="26" y="${y}" width="6" height="80" fill="#c9a13b"/><rect x="${SV.W-32}" y="${y}" width="6" height="80" fill="#c9a13b"/>`).join("")}
          <!-- parede de baixo com a porta -->
          <rect x="0" y="${SV.H-20}" width="430" height="20" fill="#1a0b0e"/>
          <rect x="570" y="${SV.H-20}" width="430" height="20" fill="#1a0b0e"/>
          <rect x="430" y="${SV.H-20}" width="140" height="20" fill="#3a2a18"/>
          <!-- cordão de isolamento -->
          <g class="sv-cordao">${cordao}${postes.map(x=>`<circle class="poste" cx="${x}" cy="${P+44}" r="6"/>`).join("")}</g>
          <!-- cavaletes, banco e plantas -->
          ${cavalete(outras[2]||ex.work, 250, 470)}
          ${cavalete(outras[3]||ex.work, 750, 470)}
          <g class="sv-banco"><rect x="430" y="545" width="140" height="34" rx="6" fill="#2a1d12"/><rect x="436" y="549" width="128" height="26" rx="4" fill="#6a1f2c"/></g>
          ${planta(62, P+40)}${planta(SV.W-62, P+40)}${planta(62, SV.H-62)}${planta(SV.W-62, SV.H-62)}
          <!-- poeira flutuando na luz da obra principal -->
          ${Array.from({length:9},(_,i)=>`<circle class="sv-poeira" cx="${430+i*17}" cy="${P+30+(i%3)*18}" r="1.6" style="animation-delay:${i*0.7}s"/>`).join("")}
          <g id="sv-piso"></g>
          <rect x="0" y="0" width="${SV.W}" height="${SV.H}" fill="url(#sv-vinheta)" pointer-events="none"/>
        </svg>
      </div>
      <div class="sv-rodape">
        <div id="sv-musica"><span class="mu-titulo"></span>
          <button class="btn btn-outline btn-sm" id="mu-prox" title="Próxima peça">⏭</button>
          <button class="btn btn-outline btn-sm" id="mu-mudo" title="Ligar/desligar música">🔊</button>
          <button class="btn btn-outline btn-sm" id="sv-comentarios" title="Comentários falados dos visitantes">${comentariosFalados(ex) ? "💬 Comentários: ligados" : "💬 Comentários: mudos"}</button></div>
        <button class="btn btn-outline btn-sm" id="sv-ver-cidade">Ver cidade</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // pontos onde os visitantes param para olhar (e para onde se viram)
  SalaVisao.pontos = [
    { x:470, y:P+82, ang:0, peso:4 }, { x:530, y:P+82, ang:0, peso:4 }, { x:500, y:P+95, ang:0, peso:3 },
    { x:200, y:P+62, ang:0, peso:2 }, { x:800, y:P+62, ang:0, peso:2 },
    { x:250, y:545, ang:0, peso:2 },  { x:750, y:545, ang:0, peso:2 },
    { x:500, y:520, ang:0, peso:1 },
  ];
  ajustarProporcoes(overlay);

  overlay.addEventListener("click", ev=>{ if(ev.target === overlay) SalaVisao.fechar(); });
  document.getElementById("sv-fechar").addEventListener("click", ()=>{ AudioFX.click(); SalaVisao.fechar(); });
  document.getElementById("sv-ver-cidade").addEventListener("click", ()=>{
    AudioFX.click(); SalaVisao.fechar(); if(typeof Mapa !== "undefined") Mapa.irCidade(l.pais, l.cidade);
  });
  document.getElementById("mu-prox").addEventListener("click", ()=>{ if(typeof Musica!=="undefined") Musica.proxima(); });
  document.getElementById("mu-mudo").addEventListener("click", ()=>{ if(typeof Musica!=="undefined") Musica.alternarMudo(); });
  document.getElementById("sv-comentarios").addEventListener("click", (e)=>{
    if(!Config.v.audioComentarios){ toast("Os comentários falados estão desligados nas Configurações"); return; }
    const ligado = alternarComentarios(SalaVisao.ex);
    e.currentTarget.textContent = ligado ? "💬 Comentários: ligados" : "💬 Comentários: mudos";
    AudioFX.click();
  });
  if(typeof atualizarControleMusica === "function") atualizarControleMusica();
}

// Cada quadro assume a proporção real da imagem assim que ela carrega
function ajustarProporcoes(raiz){
  raiz.querySelectorAll(".sv-qp, .sv-cav").forEach(g=>{
    const img = g.querySelector(".sv-qp-img"), src = img.getAttribute("href");
    const tmp = new Image();
    tmp.onload = ()=>{
      if(!tmp.naturalWidth) return;
      const h = Number(g.dataset.h), cx = Number(g.dataset.cx), base = Number(g.dataset.base);
      const w = Math.min(h * tmp.naturalWidth / tmp.naturalHeight, g.classList.contains("principal") ? 300 : 140);
      const hh = w * tmp.naturalHeight / tmp.naturalWidth;
      img.setAttribute("x", cx - w/2); img.setAttribute("y", base - hh); img.setAttribute("width", w); img.setAttribute("height", hh);
      const mol = g.querySelector(".sv-qp-moldura"), pad = g.classList.contains("sv-cav") ? 3 : 6;
      mol.setAttribute("x", cx - w/2 - pad); mol.setAttribute("y", base - hh - pad);
      mol.setAttribute("width", w + pad*2); mol.setAttribute("height", hh + pad*2);
      const sombra = g.querySelector(".sv-qp-sombra");
      if(sombra){ sombra.setAttribute("x", cx - w/2 + 4); sombra.setAttribute("y", base - hh + 6); sombra.setAttribute("width", w); sombra.setAttribute("height", hh); }
    };
    tmp.src = src;
  });
}

function atualizarCabecalhoSala(ex){
  const set = (id, txt)=>{ const el = document.getElementById(id); if(el) el.textContent = txt; };
  const v = valoresHojeAoVivo(ex);
  set("sv-dia", `Dia ${ex.dayIndex}/${ex.durationDays}`);
  set("sv-receita", fmtMoney(v.receita));
  set("sv-vis", v.visitantes);
}

/* ------------------------------------------------------------ visitantes */
const SV_ROUPAS = ["#2e3f5c","#6a1f2c","#3f5a3a","#5a4a3a","#232323","#7a5a2a","#4a3a5c","#8a3a3a","#e0d6c2"];
const SV_PELES  = ["#f1c9a5","#d9a57c","#b07a52","#8a5a3a","#f6dcc0"];
const SV_CABELOS= ["#2a1a10","#5a3a20","#c9a26a","#8a8a8a","#1a1a1a","#7a3a1a"];
const sorteia = a => a[Math.floor(Math.random()*a.length)];

// pessoa vista de cima, olhando "para cima" (norte); a rotação vira o corpo
function pessoaSVG(p){
  const pernas = p.vestido ? "" : `
      <rect class="perna pe-e" x="-11" y="-5" width="9" height="15" rx="4" fill="${p.calca}"/>
      <rect class="perna pe-d" x="2" y="-5" width="9" height="15" rx="4" fill="${p.calca}"/>`;
  const saia = p.vestido ? `<ellipse class="saia" cx="0" cy="3" rx="19" ry="17" fill="${p.roupa}"/>
      <ellipse cx="0" cy="3" rx="19" ry="17" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>` : "";
  let cabeca = `<circle r="9.5" cy="-1" fill="${p.cabelo}"/>`;
  if(p.acessorio === "chapeu") cabeca = `<circle r="16" cy="-1" fill="${p.chapeu}"/><circle r="16" cy="-1" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/>
      <circle r="9" cy="-1" fill="${p.chapeu}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><path d="M-9,-1 A9,9 0 0 1 9,-1" fill="none" stroke="#6a1f2c" stroke-width="2"/>`;
  if(p.acessorio === "bone") cabeca = `<circle r="10" cy="-1" fill="${p.chapeu}"/><path d="M-9,-6 Q0,-19 9,-6 Z" fill="${p.chapeu}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
      <circle r="1.6" cy="-1" fill="rgba(0,0,0,.35)"/>`;
  if(p.acessorio === "coque") cabeca = `<circle r="9.5" cy="-1" fill="${p.cabelo}"/><circle r="5" cy="6" fill="${p.cabelo}" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`;
  return `<g class="sv-pessoa andando" transform="translate(${p.x},${p.y}) rotate(${p.ang})">
    <ellipse class="sv-sombra" cx="4" cy="6" rx="22" ry="16"/>
    ${pernas}${saia}
    <g class="sv-corpo">
      <circle class="braco br-e" cx="-20" cy="0" r="5" fill="${p.roupa}"/><circle class="braco br-d" cx="20" cy="0" r="5" fill="${p.roupa}"/>
      <ellipse cx="0" cy="0" rx="21" ry="10" fill="${p.roupa}"/>
      <ellipse cx="0" cy="-2" rx="21" ry="6" fill="rgba(255,255,255,.08)"/>
      <circle r="4" cy="-9" fill="${p.pele}"/>
      ${cabeca}
    </g></g>`;
}

function spawnVisitante(S){
  const piso = document.getElementById("sv-piso"); if(!piso) return;
  const vestido = Math.random() < 0.42;
  const r = Math.random();
  const p = {
    vestido, roupa:sorteia(SV_ROUPAS), calca:sorteia(["#1f2733","#3a3a3a","#4a3a2a","#2a3a4a","#5a5a5a"]),
    pele:sorteia(SV_PELES), cabelo:sorteia(SV_CABELOS), chapeu:sorteia(["#1a1a1a","#c9b48a","#5a3a20","#2e3f5c","#8a1f2c","#e0d6c2"]),
    acessorio: r < 0.25 ? "chapeu" : r < 0.45 ? "bone" : (vestido && r < 0.7) ? "coque" : "cabelo",
    x: 500 + (Math.random()*60-30), y: SV.H + 10, ang: 0,
  };
  const tmp = document.createElementNS("http://www.w3.org/2000/svg","g");
  tmp.innerHTML = pessoaSVG(p);
  const el = tmp.firstElementChild;
  piso.appendChild(el);
  const alvo = escolherPonto(S);
  const v = { el, x:p.x, y:p.y, ang:0, fase:"indo", alvoX:alvo.x + (Math.random()*16-8), alvoY:alvo.y + (Math.random()*10-5), t:0 };
  posicionarVisitante(v);
  S.gente.push(v);
}
function escolherPonto(S){
  const total = S.pontos.reduce((s,p)=>s+p.peso, 0);
  let r = Math.random()*total;
  for(const p of S.pontos){ r -= p.peso; if(r <= 0) return p; }
  return S.pontos[0];
}

function posicionarVisitante(v){
  v.el.setAttribute("transform", `translate(${v.x.toFixed(1)},${v.y.toFixed(1)}) rotate(${v.ang.toFixed(1)})`);
  v.el.classList.toggle("olhando", v.fase === "olhando");
  v.el.classList.toggle("andando", v.fase !== "olhando");
}

function atualizarVisitante(v, passo){
  const VEL = 1.3 * SV.M;   // ~1,3 m/s, passo de quem passeia num museu (em tempo de jogo)
  if(v.fase === "indo" || v.fase === "saindo"){
    const dx = v.alvoX - v.x, dy = v.alvoY - v.y, d = Math.hypot(dx, dy);
    if(d < 4){
      if(v.fase === "indo"){ v.fase = "olhando"; v.t = 1.6 + Math.random()*2.4; }
      else { v.saiu = true; v.el.remove(); return; }
    } else {
      const k = Math.min(1, VEL*passo/d);
      v.x += dx*k; v.y += dy*k;
      const alvoAng = Math.atan2(dx, -dy) * 180/Math.PI;          // 0° = de frente para a parede do fundo
      let diff = ((alvoAng - v.ang + 540) % 360) - 180;
      v.ang += diff * Math.min(1, passo*8);
    }
  } else if(v.fase === "olhando"){
    let diff = ((0 - v.ang + 540) % 360) - 180;                 // vira-se para a obra
    v.ang += diff * Math.min(1, passo*5);
    v.t -= passo;
    if(v.t <= 0){ v.fase = "saindo"; v.alvoX = 500 + (Math.random()*50-25); v.alvoY = SV.H + 20; }
  }
  posicionarVisitante(v);
}

window.addEventListener("keydown", ev=>{
  if(ev.key === "Escape" && SalaVisao.aberto){ ev.stopImmediatePropagation(); SalaVisao.fechar(); }
}, true);
