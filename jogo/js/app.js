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
  // dados extras vindos das trilhas dos mestres (ano, fase, onde está, técnica) e da linha do tempo
  let g = null, T = null;
  Mestres.lista.forEach(t=>{ if(t.cfg.galeria && t.cfg.galeria[o.id]){ g = t.cfg.galeria[o.id]; T = t; } });
  if(!T) T = Mestres.lista.find(t=>t.cfg.artista===o.artista) || null;
  const ano = o.anoTxt || (g && g.ano ? String(g.ano) : "");
  const tecnica = o.tecnica || (g && g.tecnica) || "";
  const onde = o.museu || (g && g.onde) || "";
  const meta = [ano, o.movimento, tecnica].filter(Boolean).join(" · ");
  const anoNum = o.ano || (g && g.ano) || null;
  const eventos = T && anoNum ? T.cfg.eventos.filter(e=>Math.abs(e.ano-anoNum)<=1).sort((x,y)=>x.ano-y.ano) : [];
  const conceitos = Conceitos.deObra(o).slice(0,2).map(id=>Conceitos.get(id));
  const outras = Acervo.obras.filter(x=>x.artista===o.artista && x.id!==o.id).slice(0,8);
  m.innerHTML = `<div class="caixa">
    <img src="${Acervo.imgSrc(o)}" alt="">
    <h3>${o.titulo || "Obra sem título"}</h3>
    <div class="art">${o.artista} · ${PAISES[o.pais] ? PAISES[o.pais].flag+" " : ""}${o.pais}</div>
    ${meta ? `<p>${meta}</p>` : ""}
    ${g && g.fase ? `<p>🖌 Fase: ${g.fase}</p>` : ""}
    ${o.localTxt ? `<p>📍 ${o.localTxt}</p>` : ""}${onde ? `<p>🏛 ${onde}</p>` : ""}
    ${o.fatos && o.fatos.length ? `<ul>${o.fatos.map(f=>`<li>${f}</li>`).join("")}</ul>` : ""}
    ${eventos.length ? `<div class="cn-tit" style="margin-top:10px">🕰 Na vida de ${T.cfg.nomeCurto} nessa época</div><div class="vg-linha">${eventos.map(e=>`<div><b>${e.ano}</b><span>${e.curto}</span></div>`).join("")}</div>` : ""}
    ${conceitos.length ? `<div class="cn-bloco"><div class="cn-tit">📘 Para entender esta obra</div>${conceitos.map(c=>{ Conceitos.visto(c.id); return `<details class="cn-det"><summary>${c.icone} ${c.nome} <small>${c.quando}</small></summary>${Conceitos.cartao(c)}</details>`; }).join("")}</div>` : ""}
    ${!(o.fatos && o.fatos.length) && !eventos.length && !conceitos.length ? `<p class="art">Ainda não temos mais detalhes desta obra.</p>` : ""}
    ${outras.length ? `<div class="cn-tit" style="margin-top:10px">🎨 Mais de ${o.artista}</div><div class="album" id="ficha-outras">${outras.map(x=>`<img src="${Acervo.imgSrc(x)}" data-id="${x.id}" alt="" loading="lazy">`).join("")}</div>` : ""}
    <div class="jg-fb-btns" style="margin-top:12px"><button class="btn ouro" id="fecha-ficha">Fechar</button></div></div>`;
  m.classList.add("aberto");
  m.onclick = e => { if(e.target===m || e.target.id==="fecha-ficha") m.classList.remove("aberto"); };
  m.querySelectorAll("#ficha-outras img").forEach(i=>i.addEventListener("click", ()=>{ abrirFicha(Acervo.porId[i.dataset.id]); m.querySelector(".caixa").scrollTop = 0; }));
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
  if(viewAtual==="mestres") renderMestres();
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

/* ---------------- mestres (trilhas de vida e obra) ---------------- */
let mestreAberto = null;
function renderMestres(){
  const el = $("v-mestres");
  if(!mestreAberto){
    el.innerHTML = `<h2 class="sec">Mestres</h2><p class="sub">Trilhas com a vida e a obra de grandes pintores: capítulos, linha do tempo, obras e curiosidades. Cada capítulo concluído libera o próximo.</p>
      <div class="cn-atalhos"><button class="chip" id="guia-arte">📘 Guia de arte <small>${Conceitos.totalVistos()}/${Conceitos.lista.length}</small></button><button class="chip" id="praticar-cn">🧠 Praticar conceitos</button></div>
      ${Mestres.lista.map(t=>{ const c = t.cfg, n = t.capitulos.length, h = c.hero;
        return `<button class="vg-heroi" data-m="${c.id}" style="display:block;width:100%;text-align:left;background:${h.fundo}"><h2 style="color:${h.cor}">${c.icone} ${c.nome}</h2><p>${h.texto}</p>
          <div class="prog" style="color:${h.cor}">${t.concluidos()}/${n} capítulos · ${t.totalEstrelas()}/${n*3} ★ · ${t.obrasNoAcervo()} obras no acervo</div></button>`; }).join("")}`;
    $("guia-arte").onclick = ()=>{ AudioFX.click(); abrirGuia(); };
    $("praticar-cn").onclick = ()=>{ AudioFX.click(); Jogo.comecar({ tipo:"conceitos", valor:"conceitos" }); };
    el.querySelectorAll("[data-m]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); mestreAberto = b.dataset.m; el.scrollTop = 0; renderMestres(); }));
    return;
  }
  const T = Mestres.get(mestreAberto), c = T.cfg, n = T.capitulos.length, lim = c.liberaExtras || 3;
  el.innerHTML = `<button class="chip" id="m-voltar" style="margin-bottom:10px">← Todos os mestres</button>
    <div class="vg-heroi" style="background:${c.hero.fundo}"><h2 style="color:${c.hero.cor}">${c.icone} ${c.nome}</h2><p>${c.hero.texto}</p>
      <div class="prog" style="color:${c.hero.cor}">${T.concluidos()}/${n} capítulos · ${T.totalEstrelas()}/${n*3} ★ · ${T.obrasNoAcervo()} obras no acervo</div></div>
    <div class="sep">Vida e obra</div>
    ${T.capitulos.map(k=>{
      const lib = T.liberado(k.id), est = T.estrelas(k.id);
      return `<button class="cap ${lib?"":"trava"} ${lib && !est ? "novo":""}" data-id="${k.id}"><div class="ic">${lib ? k.icone : "🔒"}</div>
        <div><b>${k.n}. ${k.titulo}</b><small>${k.anos} · ${k.lugar}</small></div>
        <div class="est">${lib ? estrelasHtml(est) : ""}</div></button>`; }).join("")}
    <div class="sep">Modos especiais ${T.concluidos()<lim ? `· libere concluindo ${lim} capítulo${lim>1?"s":""}` : ""}</div>
    ${T.extras.map(x=>{
      const lib = T.liberado(x.id), est = T.estrelas(x.id);
      return `<button class="cap ${lib?"":"trava"}" data-id="${x.id}"><div class="ic">${lib ? x.icone : "🔒"}</div>
        <div><b>${x.titulo}</b><small>${x.desc}</small></div><div class="est">${lib ? estrelasHtml(est) : ""}</div></button>`; }).join("")}`;
  $("m-voltar").onclick = ()=>{ mestreAberto = null; renderMestres(); };
  el.querySelectorAll(".cap").forEach(b=>b.addEventListener("click", ()=>{
    const id = b.dataset.id;
    if(!T.liberado(id)) return toast("Conclua o capítulo anterior (metade de acertos ou mais) para liberar este.");
    AudioFX.click(); Jogo.comecar({ tipo:"mestre", mestre:T.id, valor:id });
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
/* aptidão: mistura precisão e rapidez das últimas respostas */
function blocoAptidao(P){
  const tp = P.tempo; if(!tp || tp.recente.length < 8) return `<div class="sep">Aptidão</div><p class="sub">Responda mais algumas perguntas: o jogo mede a sua rapidez e precisão para dizer o quanto você está afiado.</p>`;
  const rec = tp.recente, med = a => a.reduce((s,x)=>s+x,0)/a.length;
  const meio = Math.floor(rec.length/2), ant = rec.slice(0,meio), atu = rec.slice(meio);
  const prec = a => med(a.map(x=>x[1])), seg = a => med(a.map(x=>x[0]));
  const nota = a => Math.round(100 * (0.7*prec(a) + 0.3*Math.max(0, 1 - seg(a)/20)));
  const n = nota(rec), d = nota(atu) - nota(ant);
  const nivel = n>=85 ? "Afiadíssimo" : n>=70 ? "Afiado" : n>=50 ? "Pegando o ritmo" : "Aquecendo";
  return `<div class="sep">Aptidão</div>
    <div class="grade"><div><b>${n}</b><small>${nivel}</small></div><div><b>${seg(rec).toFixed(1).replace(".",",")} s</b><small>tempo médio</small></div><div><b>${d>0?"▲":d<0?"▼":"="} ${Math.abs(d)}</b><small>vs. antes</small></div></div>
    <p class="sub">Calculada com as suas últimas ${rec.length} respostas (70% acertos, 30% rapidez).</p>`;
}
function renderPerfil(){
  const P = Prog.P, pt = patenteDe(P.xp), el = $("v-perfil");
  const precisao = P.perguntas ? Math.round(100*P.acertos/P.perguntas) : 0;
  const vistas = Object.keys(P.vistas).map(id=>Acervo.porId[id]).filter(Boolean);
  el.innerHTML = `<h2 class="sec">${pt.atual.nome}</h2><p class="sub">${P.xp.toLocaleString("pt-BR")} XP${pt.prox ? ` · faltam ${(pt.prox.xp-P.xp).toLocaleString("pt-BR")} para ${pt.prox.nome}` : ""}</p>
    <div class="grade"><div><b>${P.rodadas}</b><small>rodadas</small></div><div><b>${precisao}%</b><small>precisão</small></div><div><b>${P.melhorSeq}</b><small>melhor sequência</small></div></div>
    ${blocoAptidao(P)}
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
  // música das exposições: começa no primeiro toque (o navegador exige um gesto); preferência de silêncio fica salva
  try{ Musica.mudo = localStorage.getItem("artnexus_mudo")==="1"; }catch(e){}
  atualizarControleMusica();
  const ligar = ()=>{ document.removeEventListener("pointerdown", ligar); if(!Musica.tocando && !Musica.mudo) Musica.tocar(0); else Musica.tocando = true; atualizarControleMusica(); };
  document.addEventListener("pointerdown", ligar);
  $("mu-mudo").addEventListener("click", ()=>{ if(!Musica.tocando) Musica.tocando = true; Musica.alternarMudo(); try{ localStorage.setItem("artnexus_mudo", Musica.mudo?"1":"0"); }catch(e){} });
  $("mu-prox").addEventListener("click", ()=>{ if(Musica.mudo){ Musica.mudo = false; try{ localStorage.setItem("artnexus_mudo","0"); }catch(e){} } Musica.proxima(); });
  document.querySelectorAll("#nav button").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); irPara(b.dataset.v); }));
  irPara("mapa");
  try{
    const n = await Acervo.carregarNuvem();
    avisoNuvem = n ? `${Acervo.obras.length} obras no acervo (${n} da nuvem)` : "";
  }catch(e){ avisoNuvem = ""; }
  renderTudo();
}
window.addEventListener("DOMContentLoaded", iniciar);
