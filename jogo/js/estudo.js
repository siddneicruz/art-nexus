/* ============================================================================
   ESTUDO — perguntas e respostas sobre arte
   O jogador escolhe por onde começar (um país, um pintor ou tudo misturado) e
   um nível. Cada acerto rende créditos (€) — os mesmos usados para comprar
   obras nos leilões e na aquisição. As perguntas são montadas na hora a
   partir do acervo (State.allArtworks): artista, país, movimento, época,
   técnica e título. Obras identificadas contam para o "domínio" de cada país
   e de cada pintor.
   ============================================================================ */

const ESTUDO_NIVEIS = {
  iniciante:    { nome:"Iniciante",     premio:1500,  opcoes:4, so_famosas:true  },
  intermediario:{ nome:"Intermediário", premio:3000,  opcoes:4, so_famosas:false },
  avancado:     { nome:"Avançado",      premio:6000,  opcoes:4, so_famosas:false },
  especialista: { nome:"Especialista",  premio:12000, opcoes:5, so_famosas:false },
};
// tipos de pergunta liberados em cada nível (por escopo)
const ESTUDO_TIPOS = {
  geral: {
    iniciante:["artista","pais"],
    intermediario:["artista","pais","movimento","tituloArtista"],
    avancado:["artista","pais","movimento","tituloArtista","tecnica","decada"],
    especialista:["artista","movimento","tituloArtista","tecnica","ano","titulo"],
  },
  pintor: {
    iniciante:["edeste","titulo"],
    intermediario:["edeste","titulo","movimento"],
    avancado:["edeste","titulo","tecnica","decada"],
    especialista:["edeste","titulo","tecnica","ano","movimento"],
  },
};
const ESTUDO_BANDEIRAS = { "Itália":"🇮🇹","Holanda":"🇳🇱","França":"🇫🇷","Espanha":"🇪🇸","Alemanha":"🇩🇪","Reino Unido":"🇬🇧","Áustria":"🇦🇹","Brasil":"🇧🇷" };
const ESTUDO_RODADA = 10;

function estudoEstado(){
  if(!State.estudo) State.estudo = { nivel:"iniciante", vistas:{}, sessoes:0, acertos:0, perguntas:0, melhorSeq:0 };
  return State.estudo;
}
function embaralhar(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function anoDe(o){ const m = String(o.data_obra||"").match(/\d{4}/); const y = m ? +m[0] : NaN; return y>=1000 && y<=2100 ? y : NaN; }
function obrasEstudo(){ return State.allArtworks.filter(o=>!o.fixa && o.imagem); }

// escolhe n valores diferentes de `certo`, dando preferência à lista `perto`
function distratores(certo, todos, n, perto=[]){
  const unico = arr => [...new Set(arr.filter(v=>v!=null && v!=="" && String(v)!==String(certo)))];
  const a = embaralhar(unico(perto)), b = embaralhar(unico(todos).filter(v=>!a.includes(v)));
  return [...a, ...b].slice(0, n);
}

const Estudo = {
  aba: "pais",            // pais | pintor | misto
  filtro: "",
  escopo: null,           // {tipo:"pais"|"pintor"|"misto", valor}
  perguntas: [], indice: 0, acertos: 0, seq: 0, melhorSeq: 0, respondida: false,

  nivel(){ return ESTUDO_NIVEIS[estudoEstado().nivel] || ESTUDO_NIVEIS.iniciante; },

  obrasDoEscopo(esc){
    const todas = obrasEstudo();
    if(esc.tipo === "pais") return todas.filter(o=>o.pais===esc.valor);
    if(esc.tipo === "pintor") return todas.filter(o=>o.artista===esc.valor);
    return todas;
  },

  dominio(obras){
    if(!obras.length) return 0;
    const v = estudoEstado().vistas;
    return Math.round(100 * obras.filter(o=>v[o.id]>0).length / obras.length);
  },

  /* ---------- montagem das perguntas ---------- */
  comecar(esc){
    this.escopo = esc;
    const niv = this.nivel(), todas = obrasEstudo();
    let pool = this.obrasDoEscopo(esc);
    let escolhidas;
    if(esc.tipo === "pintor"){
      // treino de identificação: obras do pintor misturadas a "sósias" do mesmo movimento
      const dele = embaralhar(pool);
      const movs = new Set(dele.map(o=>o.movimento).filter(Boolean));
      const outros = embaralhar(todas.filter(o=>o.artista!==esc.valor && (movs.has(o.movimento) || movs.size===0)));
      const nDele = Math.min(dele.length, Math.ceil(ESTUDO_RODADA*0.6));
      escolhidas = embaralhar([...dele.slice(0,nDele), ...outros.slice(0, ESTUDO_RODADA-nDele)]);
      // pintor com poucas obras: repete as dele para completar a rodada
      while(escolhidas.length < ESTUDO_RODADA && dele.length) escolhidas.push(dele[escolhidas.length % dele.length]);
    } else {
      if(niv.so_famosas){ const f = pool.filter(o=>o.tier>=4); if(f.length >= ESTUDO_RODADA) pool = f; }
      escolhidas = embaralhar(pool).slice(0, ESTUDO_RODADA);
    }
    const tipos = (ESTUDO_TIPOS[esc.tipo==="pintor" ? "pintor" : "geral"])[estudoEstado().nivel];
    this.perguntas = escolhidas.map(o=>this.montar(o, tipos, esc)).filter(Boolean);
    this.indice = 0; this.acertos = 0; this.seq = 0; this.melhorSeq = 0; this.respondida = false;
    if(!this.perguntas.length){ toast("Não há obras suficientes para essa escolha."); this.escopo = null; }
    renderEstudo();
  },

  montar(o, tipos, esc){
    const n = this.nivel().opcoes - 1;
    for(const t of embaralhar(tipos)){
      const q = this.gerar(t, o, n, esc);
      if(q) return { ...q, obra:o, tipo:t };
    }
    return null;
  },

  gerar(t, o, n, esc){
    const todas = obrasEstudo();
    const mesmo = (campo)=>todas.filter(w=>w[campo]===o[campo]);
    const op = (certa, erradas)=> erradas.length >= 1 ? { opcoes: embaralhar([certa, ...erradas]), certa } : null;
    switch(t){
      case "artista": {
        const perto = [...mesmo("pais"), ...(o.movimento ? mesmo("movimento") : [])].map(w=>w.artista);
        const q = op(o.artista, distratores(o.artista, todas.map(w=>w.artista), n, perto));
        return q && { texto:"Quem pintou esta obra?", ...q };
      }
      case "pais": {
        const q = op(o.pais, distratores(o.pais, Object.keys(ESTUDO_BANDEIRAS), n));
        return q && { texto:"De que país é o artista desta obra?", ...q };
      }
      case "movimento": {
        if(!o.movimento) return null;
        const q = op(o.movimento, distratores(o.movimento, todas.map(w=>w.movimento), n));
        return q && { texto:"A que movimento artístico esta obra pertence?", ...q };
      }
      case "tecnica": {
        if(!o.tecnica) return null;
        const q = op(o.tecnica, distratores(o.tecnica, todas.map(w=>w.tecnica), n));
        return q && { texto:"Qual é a técnica desta obra?", ...q };
      }
      case "titulo": {
        const perto = todas.filter(w=>w.artista===o.artista).map(w=>w.titulo);
        const q = op(o.titulo, distratores(o.titulo, todas.map(w=>w.titulo), n, perto));
        return q && { texto:"Qual é o título desta obra?", ...q };
      }
      case "tituloArtista": {
        const perto = mesmo("pais").map(w=>w.artista);
        const q = op(o.artista, distratores(o.artista, todas.map(w=>w.artista), n, perto));
        return q && { texto:`Quem pintou «${o.titulo}»?`, escondeImagem:true, ...q };
      }
      case "decada": {
        const y = anoDe(o); if(isNaN(y)) return null;
        const d = Math.floor(y/10)*10, cand = [-50,-40,-30,-20,-10,10,20,30,40,50].map(k=>d+k).filter(v=>v>=1000);
        const q = op(`${d}s`, embaralhar(cand).slice(0,n).map(v=>`${v}s`));
        return q && { texto:"Em que década esta obra foi concebida?", ...q };
      }
      case "ano": {
        const y = anoDe(o); if(isNaN(y)) return null;
        const cand = [-12,-9,-6,-4,-2,2,4,6,9,12].map(k=>y+k);
        const q = op(String(y), embaralhar(cand).slice(0,n).map(String));
        return q && { texto:"Em que ano esta obra foi concebida?", ...q };
      }
      case "edeste": {
        const nome = esc.valor, certa = o.artista===nome ? "Sim" : "Não";
        return { texto:`Esta obra é de ${nome}?`, opcoes:["Sim","Não"], certa };
      }
    }
    return null;
  },

  explicar(q){
    const o = q.obra;
    const partes = [`<b>${o.titulo}</b> — ${o.artista} (${o.pais})`];
    const meta = [anoDe(o) ? o.data_obra : "", o.movimento, o.tecnica].filter(Boolean).join(" · ");
    if(meta) partes.push(meta);
    if(o.curiosidades && o.curiosidades[0]) partes.push(`✦ ${o.curiosidades[0]}`);
    return partes.join("<br>");
  },

  responder(escolha){
    if(this.respondida) return;
    const q = this.perguntas[this.indice], E = estudoEstado();
    this.respondida = true;
    q.escolha = escolha; q.acertou = escolha === q.certa;
    E.perguntas++;
    if(q.acertou){
      this.acertos++; this.seq++; this.melhorSeq = Math.max(this.melhorSeq, this.seq);
      E.acertos++; E.vistas[q.obra.id] = (E.vistas[q.obra.id] || 0) + 1;
      AudioFX.success();
    } else { this.seq = 0; AudioFX.error(); }
    renderEstudo();
  },

  proxima(){
    this.indice++; this.respondida = false;
    if(this.indice >= this.perguntas.length) this.finalizar(); else renderEstudo();
  },

  finalizar(){
    const E = estudoEstado(), niv = this.nivel();
    const bonus = this.melhorSeq >= 5 ? 0.25 : 0;
    const premio = Math.round(this.acertos * niv.premio * (1 + bonus));
    State.cash += premio;
    State.knowledge += this.acertos * 2;
    State.reputation = Math.min(100, State.reputation + this.acertos * 0.15);
    E.sessoes++; E.melhorSeq = Math.max(E.melhorSeq || 0, this.melhorSeq);
    this.resultado = { acertos:this.acertos, total:this.perguntas.length, premio, bonus, seq:this.melhorSeq };
    this.indice = this.perguntas.length;
    updateHUD();
    if(typeof Save !== "undefined") Save.salvar();
    if(this.acertos > 0) AudioFX.applause();
    renderEstudo();
  },
};

/* ------------------------------------------------------------------ telas */
function barraDominio(pct){ return `<div class="es-bar"><i style="width:${pct}%"></i></div>`; }

function renderEstudo(){
  const el = document.getElementById("view-estudo"); if(!el) return;
  const E = estudoEstado(), niv = Estudo.nivel();

  // ----- rodada em andamento -----
  if(Estudo.escopo && Estudo.indice < Estudo.perguntas.length){
    const q = Estudo.perguntas[Estudo.indice], resp = Estudo.respondida;
    const mostrarImg = !q.escondeImagem || resp;
    el.innerHTML = `
      <div class="view-inner quiz-wrap">
        <h1 class="page-title">Estudar arte</h1>
        <p class="page-sub">${Estudo.escopoNome()} · ${niv.nome} · pergunta ${Estudo.indice+1} de ${Estudo.perguntas.length} · ${fmtMoney(niv.premio)} por acerto</p>
        <div class="panel quiz-panel">
          ${mostrarImg ? `<img class="quiz-img" src="${imgSrc(q.obra)}" alt="obra">` : `<div class="quiz-img es-oculta">🖼️</div>`}
          <div class="quiz-progress">
            ${Estudo.perguntas.map((p,i)=>`<span class="qp ${p.acertou===true?"hit":p.acertou===false?"miss":(i===Estudo.indice?"cur":"")}"></span>`).join("")}
          </div>
          <h2 class="quiz-q">${q.texto}</h2>
          <div class="quiz-options ${q.opcoes.length===2?"duas":""}">
            ${q.opcoes.map(o=>{
              const cls = resp ? (o===q.certa ? "correct" : (o===q.escolha ? "wrong" : "")) : "";
              return `<button class="quiz-opt ${cls}" data-opt="${escapeXml(o)}" ${resp?"disabled":""}>${o}</button>`;
            }).join("")}
          </div>
          ${resp ? `
            <div class="es-feedback ${q.acertou?"ok":"erro"}">
              <div class="es-fb-t">${q.acertou ? "✔ Correto!" : "✘ Não foi dessa vez"}</div>
              <div class="es-fb-txt">${Estudo.explicar(q)}</div>
              <div class="es-fb-btns">
                <button class="btn btn-outline btn-sm" id="es-ficha">Ver ficha</button>
                <button class="btn btn-gold" id="es-prox">${Estudo.indice+1>=Estudo.perguntas.length?"Ver resultado":"Próxima"}</button>
              </div>
            </div>` : ""}
          <button class="btn btn-outline btn-sm es-sair" id="es-sair">Sair da rodada</button>
        </div>
      </div>`;
    el.querySelectorAll(".quiz-opt").forEach(b=>b.addEventListener("click", ()=>Estudo.responder(b.dataset.opt)));
    el.querySelector(".es-feedback")?.scrollIntoView({ block:"nearest", behavior:"smooth" });
    el.querySelector("#es-ficha")?.addEventListener("click", ()=>openWorkModal(q.obra));
    el.querySelector("#es-prox")?.addEventListener("click", ()=>{ AudioFX.click(); Estudo.proxima(); });
    el.querySelector("#es-sair").addEventListener("click", ()=>{ if(confirm("Sair da rodada? Os acertos de hoje não rendem prêmio.")){ Estudo.escopo = null; renderEstudo(); } });
    return;
  }

  // ----- resultado -----
  if(Estudo.escopo && Estudo.resultado){
    const r = Estudo.resultado;
    el.innerHTML = `
      <div class="view-inner quiz-wrap">
        <h1 class="page-title">Resultado</h1>
        <p class="page-sub">${Estudo.escopoNome()} · ${niv.nome}</p>
        <div class="panel quiz-panel">
          <div class="quiz-score">${r.acertos} / ${r.total}</div>
          <div class="quiz-prize ${r.premio?"pos":"zero"}">${r.premio ? "+ "+fmtMoney(r.premio) : "Sem prêmio desta vez"}</div>
          ${r.bonus ? `<p class="quiz-nota">Sequência de ${r.seq} acertos: bônus de 25%.</p>` : (r.seq>1?`<p class="quiz-nota">Melhor sequência: ${r.seq}. Com 5 seguidas há bônus de 25%.</p>`:"")}
          <div class="quiz-review">
            ${Estudo.perguntas.map(p=>`
              <div class="qr ${p.acertou?"hit":"miss"}">
                <div class="qr-q">${p.texto}</div>
                <div class="qr-a">${p.acertou ? `✔ <strong>${p.certa}</strong>` : `✘ Você marcou <s>${p.escolha}</s> — era <strong>${p.certa}</strong>`}</div>
              </div>`).join("")}
          </div>
          <div class="es-fb-btns" style="margin-top:16px;justify-content:center">
            <button class="btn btn-gold" id="es-denovo">Jogar de novo</button>
            <button class="btn btn-outline" id="es-voltar">Escolher outro</button>
          </div>
        </div>
      </div>`;
    el.querySelector("#es-denovo").addEventListener("click", ()=>{ AudioFX.click(); Estudo.resultado = null; Estudo.comecar(Estudo.escopo); });
    el.querySelector("#es-voltar").addEventListener("click", ()=>{ AudioFX.click(); Estudo.resultado = null; Estudo.escopo = null; renderEstudo(); });
    return;
  }

  // ----- escolha do ponto de partida -----
  const todas = obrasEstudo();
  const identificadas = todas.filter(o=>E.vistas[o.id]>0).length;
  const paises = Object.keys(ESTUDO_BANDEIRAS).map(p=>{ const os = todas.filter(o=>o.pais===p); return { p, n:os.length, dom:Estudo.dominio(os) }; }).filter(x=>x.n);
  const pintores = [...new Set(todas.map(o=>o.artista))].map(a=>{ const os = todas.filter(o=>o.artista===a); return { a, n:os.length, pais:os[0].pais, dom:Estudo.dominio(os) }; })
    .sort((x,y)=>y.n-x.n || x.a.localeCompare(y.a));
  const f = Estudo.filtro.trim().toLowerCase();
  const lista = f ? pintores.filter(p=>p.a.toLowerCase().includes(f)) : pintores;

  el.innerHTML = `
    <div class="view-inner quiz-wrap">
      <h1 class="page-title">Estudar arte</h1>
      <p class="page-sub">Escolha por onde começar. Cada acerto rende créditos para comprar obras.
        Você já identificou <b>${identificadas}</b> de ${todas.length} obras · ${E.acertos} acertos em ${E.perguntas} perguntas.</p>

      <div class="es-chips" id="es-niveis">
        ${Object.entries(ESTUDO_NIVEIS).map(([k,v])=>`<button class="es-chip ${E.nivel===k?"sel":""}" data-nivel="${k}">${v.nome}<small>${fmtMoney(v.premio)}</small></button>`).join("")}
      </div>
      <div class="es-abas" id="es-abas">
        <button class="${Estudo.aba==="pais"?"sel":""}" data-aba="pais">Por país</button>
        <button class="${Estudo.aba==="pintor"?"sel":""}" data-aba="pintor">Por pintor</button>
        <button class="${Estudo.aba==="misto"?"sel":""}" data-aba="misto">Tudo misturado</button>
      </div>

      ${Estudo.aba==="pais" ? `<div class="es-grid">${paises.map(x=>`
        <button class="es-card" data-pais="${x.p}">
          <span class="es-flag">${ESTUDO_BANDEIRAS[x.p]}</span>
          <b>${x.p}</b><small>${x.n} obras · domínio ${x.dom}%</small>${barraDominio(x.dom)}
        </button>`).join("")}</div>` : ""}

      ${Estudo.aba==="pintor" ? `
        <input id="es-busca" class="es-busca" type="search" placeholder="Buscar pintor…" value="${escapeXml(Estudo.filtro)}">
        <div class="es-lista">${lista.map(x=>`
          <button class="es-linha" data-pintor="${escapeXml(x.a)}">
            <span><b>${x.a}</b><small>${ESTUDO_BANDEIRAS[x.pais]||""} ${x.pais} · ${x.n} obra${x.n>1?"s":""}</small></span>
            <span class="es-dom">${x.dom}%${barraDominio(x.dom)}</span>
          </button>`).join("") || `<p class="quiz-nota">Nenhum pintor encontrado.</p>`}</div>` : ""}

      ${Estudo.aba==="misto" ? `
        <div class="panel quiz-panel"><p class="quiz-regra">Perguntas sobre obras de todos os países e pintores.</p>
        <button class="btn btn-gold" id="es-misto">Começar</button></div>` : ""}
    </div>`;

  el.querySelectorAll("[data-nivel]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); E.nivel = b.dataset.nivel; renderEstudo(); }));
  el.querySelectorAll("[data-aba]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); Estudo.aba = b.dataset.aba; renderEstudo(); }));
  el.querySelectorAll("[data-pais]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); Estudo.resultado = null; Estudo.comecar({ tipo:"pais", valor:b.dataset.pais }); }));
  el.querySelectorAll("[data-pintor]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); Estudo.resultado = null; Estudo.comecar({ tipo:"pintor", valor:b.dataset.pintor }); }));
  el.querySelector("#es-misto")?.addEventListener("click", ()=>{ AudioFX.click(); Estudo.resultado = null; Estudo.comecar({ tipo:"misto", valor:"" }); });
  const busca = el.querySelector("#es-busca");
  if(busca) busca.addEventListener("input", ()=>{
    Estudo.filtro = busca.value; const pos = busca.selectionStart; renderEstudo();
    const nb = document.getElementById("es-busca"); nb.focus(); nb.setSelectionRange(pos,pos);
  });
}

Estudo.escopoNome = function(){
  const e = this.escopo; if(!e) return "";
  return e.tipo==="pais" ? `${ESTUDO_BANDEIRAS[e.valor]||""} ${e.valor}` : e.tipo==="pintor" ? e.valor : "Tudo misturado";
};
