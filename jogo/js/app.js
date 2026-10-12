/* ============================================================================
   APP — navegação, mapa dos países, pintores, trilha Van Gogh, diário, perfil.
   ============================================================================ */
const $ = id => document.getElementById(id);
let viewAtual = "mapa", mapa = null, marcadores = {}, avisoNuvem = "";

function toast(msg){ const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(()=>t.classList.remove("on"), 2600); }
function estrelasHtml(n, max=3){ return `<span class="estrelas">${Array.from({length:max},(_,i)=>`<span class="${i<n?"on":""}">★</span>`).join("")}</span>`; }

function updateTopo(){
  const pt = patenteDe(Prog.P.xp);
  const pct = pt.prox ? Math.round(100*(Prog.P.xp - pt.atual.xp)/(pt.prox.xp - pt.atual.xp)) : 100;
  $("pt-nome").textContent = pt.atual.nome;
  $("pt-xp").textContent = pt.prox ? `${Prog.P.xp.toLocaleString("pt-BR")} / ${pt.prox.xp.toLocaleString("pt-BR")} XP` : `${Prog.P.xp.toLocaleString("pt-BR")} XP`;
  $("pt-barra").style.width = pct + "%";
}

function renderNiveis(){
  $("nivelbar").innerHTML = Object.entries(NIVEIS).map(([k,n])=>`<button class="chip ${Prog.P.nivel===k?"on":""}" data-n="${k}" title="${n.desc}">${n.nome} · ${n.desc}</button>`).join("");
  $("nivelbar").querySelectorAll(".chip").forEach(b=>b.addEventListener("click", ()=>{ Prog.P.nivel = b.dataset.n; Prog.salvar(); AudioFX.click(); renderNiveis(); }));
}

/* ---------------- ficha da obra ---------------- */
function abrirFicha(o){
  if(!o) return;
  const m = $("modal");
  const meta = [o.anoTxt, o.movimento, o.tecnica].filter(Boolean).join(" · ");
  m.innerHTML = `<div class="caixa">
    <img src="${Acervo.imgSrc(o)}" alt="">
    <h3>${o.titulo || "Obra sem título"}</h3>
    <div class="art">${o.artista} · ${PAISES[o.pais] ? PAISES[o.pais].flag+" " : ""}${o.pais}</div>
    ${meta ? `<p>${meta}</p>` : ""}
    ${o.localTxt ? `<p>📍 ${o.localTxt}</p>` : ""}${o.museu ? `<p>🏛 ${o.museu}</p>` : ""}
    ${o.fatos && o.fatos.length ? `<ul>${o.fatos.map(f=>`<li>${f}</li>`).join("")}</ul>` : (o.nuvem ? `<p class="art">Obra do acervo na nuvem — a ficha completa chega em breve.</p>` : "")}
    <div class="jg-fb-btns" style="margin-top:12px"><button class="btn ouro" id="fecha-ficha">Fechar</button></div></div>`;
  m.classList.add("aberto");
  m.onclick = e => { if(e.target===m || e.target.id==="fecha-ficha") m.classList.remove("aberto"); };
}

/* ---------------- navegação ---------------- */
function irPara(v){
  viewAtual = v;
  document.querySelectorAll(".view").forEach(e=>e.classList.toggle("ativa", e.id==="v-"+v));
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("ativa", b.dataset.v===v));
  fecharFolha();
  renderTudo();
  if(v==="mapa" && mapa) setTimeout(()=>mapa.invalidateSize(), 60);
}
function fecharFolha(){ $("folha").classList.remove("aberta"); }

function renderTudo(){
  updateTopo(); renderNiveis();
  if(viewAtual==="mapa") renderMapa();
  if(viewAtual==="vangogh") renderVG();
  if(viewAtual==="pintores") renderPintores();
  if(viewAtual==="diario") renderDiario();
  if(viewAtual==="perfil") renderPerfil();
}

/* ---------------- mapa ---------------- */
function iniciarMapa(){
  if(mapa || typeof L === "undefined") return;
  mapa = L.map("mundo", { zoomControl:false, minZoom:2, maxZoom:6, worldCopyJump:true, attributionControl:false }).setView([40,10], 3);
  // contornos embutidos (funcionam sem internet) + fundo escuro opcional
  const pol = window.MUNDO_POLIGONOS || [];
  pol.forEach(poly=>{
    L.polygon(poly.map(anel=>anel.map(p=>[p[1],p[0]])), { color:"#5a4a2a", weight:.6, fillColor:"#241d15", fillOpacity:1, interactive:false }).addTo(mapa);
  });
  const camada = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom:6, opacity:.85 });
  let erros = 0; camada.on("tileerror", ()=>{ if(++erros===3 && mapa.hasLayer(camada)) mapa.removeLayer(camada); });
  camada.addTo(mapa);
  mapa.on("click", fecharFolha);
  mapa.fitBounds(Object.values(PAISES).map(p=>[p.lat,p.lng]), { padding:[40,60], maxZoom:4 });
}
function renderMapa(){
  iniciarMapa(); if(!mapa) return;
  Object.entries(PAISES).forEach(([nome, p])=>{
    const n = Acervo.obras.filter(o=>o.pais===nome).length;
    const est = (Prog.P.paises[nome]||{}).estrelas || 0;
    const html = `<div class="pin"><b>${p.flag}</b><span>${"★".repeat(est)}${"☆".repeat(3-est)}</span></div>`;
    const icone = L.divIcon({ html, className:"", iconSize:[0,0] });
    if(marcadores[nome]) marcadores[nome].setIcon(icone);
    else marcadores[nome] = L.marker([p.lat,p.lng], { icon:icone }).addTo(mapa).on("click", e=>{ L.DomEvent.stopPropagation(e); abrirPais(nome); });
    marcadores[nome].options.alt = nome + " " + n;
  });
  $("aviso-mapa").textContent = avisoNuvem || "Toque num país para começar o desafio";
}
function abrirPais(nome){
  const p = PAISES[nome], obras = Acervo.obras.filter(o=>o.pais===nome);
  const artistas = new Set(obras.map(o=>o.artista)).size, est = (Prog.P.paises[nome]||{}).estrelas || 0, dom = Prog.dominioPais(nome);
  const f = $("folha");
  f.innerHTML = `<h3>${p.flag} ${nome}</h3>
    <div class="meta">${obras.length} obras · ${artistas} artistas · ${NIVEIS[Prog.P.nivel].nome}</div>
    <div>${estrelasHtml(est)} <span class="meta" style="margin-left:8px">domínio ${dom}%</span></div>
    <div class="barra" style="margin-top:6px"><i style="width:${dom}%"></i></div>
    <p class="sub" style="margin-top:10px">Perguntas sobre autores, títulos, anos, técnicas, cidades, museus e curiosidades — sem perguntar o país, porque você já o escolheu.</p>
    <div class="linha"><button class="btn ouro" id="f-jogar">Jogar</button><button class="btn ghost" id="f-fechar">Fechar</button></div>`;
  f.classList.add("aberta");
  $("f-jogar").onclick = ()=>{ fecharFolha(); Jogo.comecar({ tipo:"pais", valor:nome }); };
  $("f-fechar").onclick = fecharFolha;
}

/* ---------------- pintores ---------------- */
let filtroPintor = "";
function renderPintores(){
  const el = $("v-pintores");
  const mapaA = {};
  Acervo.obras.forEach(o=>{ (mapaA[o.artista] = mapaA[o.artista] || { nome:o.artista, pais:o.pais, obras:[] }).obras.push(o); });
  let lista = Object.values(mapaA).filter(a=>a.obras.length>=3).sort((a,b)=>b.obras.length-a.obras.length);
  const q = Acervo.norm(filtroPintor);
  if(q) lista = lista.filter(a=>Acervo.norm(a.nome).includes(q));
  el.innerHTML = `<h2 class="sec">Pintores</h2><p class="sub">Escolha um artista e treine para reconhecer as obras dele — e as que parecem ser dele, mas não são.</p>
    <input class="busca" id="busca-pintor" placeholder="Buscar pintor..." value="${escapeAttr(filtroPintor)}">
    ${lista.map((a,i)=>`<button class="pintor" data-i="${i}"><img src="${Acervo.imgSrc(a.obras[0])}" alt="" loading="lazy"><div style="flex:1"><div class="nm">${PAISES[a.pais].flag} ${a.nome}</div><small>${a.obras.length} obras · domínio ${Prog.dominioPintor(a.nome)}%</small><div class="barra"><i style="width:${Prog.dominioPintor(a.nome)}%"></i></div></div></button>`).join("") || `<p class="sub">Nenhum pintor encontrado.</p>`}`;
  const busca = $("busca-pintor");
  busca.addEventListener("input", ()=>{ filtroPintor = busca.value; const pos = busca.selectionStart; renderPintores(); const b = $("busca-pintor"); b.focus(); b.setSelectionRange(pos,pos); });
  el.querySelectorAll(".pintor").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); Jogo.comecar({ tipo:"pintor", valor:lista[+b.dataset.i].nome }); }));
}

/* ---------------- trilha Van Gogh ---------------- */
function renderVG(){
  const el = $("v-vangogh"), tot = Vangogh.totalEstrelas();
  const obras = Acervo.obras.filter(o=>/gogh/i.test(o.artista)).length;
  el.innerHTML = `<div class="vg-heroi"><h2>🌻 Vincent van Gogh</h2>
      <p>Da aldeia de Zundert aos campos de trigo de Auvers: viva a vida do artista capítulo a capítulo, com linha do tempo, obras, técnica e frases das cartas a Theo.</p>
      <div class="prog">${Vangogh.concluidos()}/9 capítulos · ${tot}/27 ★ · ${obras} obras no acervo</div></div>
    <div class="sep">Vida e obra</div>
    ${Vangogh.capitulos.map(c=>{
      const lib = Vangogh.liberado(c.id), est = Vangogh.estrelas(c.id);
      return `<button class="cap ${lib?"":"trava"} ${lib && !est ? "novo":""}" data-id="${c.id}"><div class="ic">${lib ? c.icone : "🔒"}</div>
        <div><b>${c.n}. ${c.titulo}</b><small>${c.anos} · ${c.lugar}</small></div>
        <div class="est">${lib ? estrelasHtml(est) : ""}</div></button>`; }).join("")}
    <div class="sep">Modos especiais ${Vangogh.concluidos()<3 ? "· libere concluindo 3 capítulos" : ""}</div>
    ${Vangogh.extras.map(x=>{
      const lib = Vangogh.liberado(x.id), est = Vangogh.estrelas(x.id);
      return `<button class="cap ${lib?"":"trava"}" data-id="${x.id}"><div class="ic">${lib ? x.icone : "🔒"}</div>
        <div><b>${x.titulo}</b><small>${x.desc}</small></div><div class="est">${lib ? estrelasHtml(est) : ""}</div></button>`; }).join("")}`;
  el.querySelectorAll(".cap").forEach(b=>b.addEventListener("click", ()=>{
    const id = b.dataset.id;
    if(!Vangogh.liberado(id)) return toast("Conclua o capítulo anterior (5 acertos ou mais) para liberar este.");
    AudioFX.click(); Jogo.comecar({ tipo:"vangogh", valor:id });
  }));
}

/* ---------------- diário ---------------- */
function renderDiario(){
  const el = $("v-diario"), P = Prog.P, feito = P.diario.data === hoje();
  el.innerHTML = `<h2 class="sec">Desafio do dia</h2>
    <p class="sub">Uma rodada igual para todo mundo, escolhida pela data de hoje. A primeira vez de cada dia vale pontos em dobro.</p>
    <div class="card"><div style="font-size:15px;margin-bottom:8px">${feito ? `✅ Feito hoje: <b>${P.diario.pontos.toLocaleString("pt-BR")}</b> pontos` : "📅 Ainda não jogado hoje"}</div>
      <div class="meta" style="font-size:12.5px;color:var(--dim);margin-bottom:12px">🔥 Sequência: ${P.dias.seq} ${P.dias.seq===1?"dia":"dias"} · recorde ${P.dias.melhor}</div>
      <button class="btn ouro" id="d-jogar">${feito ? "Jogar de novo (sem bônus)" : "Jogar agora · pontos em dobro"}</button></div>`;
  $("d-jogar").onclick = ()=>Jogo.comecar({ tipo:"diario", valor:hoje() });
}

/* ---------------- perfil ---------------- */
function renderPerfil(){
  const P = Prog.P, pt = patenteDe(P.xp), el = $("v-perfil");
  const precisao = P.perguntas ? Math.round(100*P.acertos/P.perguntas) : 0;
  const vistas = Object.keys(P.vistas).map(id=>Acervo.porId[id]).filter(Boolean);
  el.innerHTML = `<h2 class="sec">${pt.atual.nome}</h2><p class="sub">${P.xp.toLocaleString("pt-BR")} XP${pt.prox ? ` · faltam ${(pt.prox.xp-P.xp).toLocaleString("pt-BR")} para ${pt.prox.nome}` : ""}</p>
    <div class="grade"><div><b>${P.rodadas}</b><small>rodadas</small></div><div><b>${precisao}%</b><small>precisão</small></div><div><b>${P.melhorSeq}</b><small>melhor sequência</small></div></div>
    <div class="sep">Países</div>
    ${Object.entries(PAISES).map(([n,p])=>{ const x = P.paises[n]||{}; return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px"><span>${p.flag} ${n}</span><span>${estrelasHtml(x.estrelas||0)} <small style="color:var(--dim);margin-left:6px">${Prog.dominioPais(n)}%</small></span></div>`; }).join("")}
    <div class="sep">Medalhas</div>
    <div class="medalhas">${MEDALHAS.map(m=>`<div class="medalha ${P.medalhas[m.id]?"ok":""}" title="${m.desc}"><b>${m.icone}</b>${m.nome}</div>`).join("")}</div>
    <div class="sep">Álbum · ${vistas.length} obras conhecidas</div>
    ${vistas.length ? `<div class="album">${vistas.slice(-40).reverse().map(o=>`<img src="${Acervo.imgSrc(o)}" data-id="${o.id}" alt="" loading="lazy">`).join("")}</div>` : `<p class="sub">Acerte perguntas para completar seu álbum.</p>`}`;
  el.querySelectorAll(".album img").forEach(i=>i.addEventListener("click", ()=>abrirFicha(Acervo.porId[i.dataset.id])));
}

/* ---------------- início ---------------- */
async function iniciar(){
  Acervo.iniciar(); Prog.carregar();
  document.querySelectorAll("#nav button").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); irPara(b.dataset.v); }));
  irPara("mapa");
  try{
    const n = await Acervo.carregarNuvem();
    avisoNuvem = n ? `${Acervo.obras.length} obras no acervo (${n} da nuvem)` : "";
  }catch(e){ avisoNuvem = ""; }
  renderTudo();
}
window.addEventListener("DOMContentLoaded", iniciar);
