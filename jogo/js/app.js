/* ============================================================================
   ART NEXUS — MOTOR DO JOGO
   ============================================================================ */

const State = {
  cash: 400000,
  reputation: 30,
  knowledge: 0,
  attemptsLeft: 6,
  acqFilterType: null,
  acqFilterValue: null,
  collection: [],       // obras possuídas {..artwork, ownedId, boughtPrice}
  seenIds: new Set(),
  exhibitions: [],
  voos: [],             // aviões levando/trazendo obras (animação no mapa)
  agenda: {},            // ownedId -> [{country, salaId, duration, seguro}] — próximas paradas automáticas
  expoShowSetup: false,
  speedSecPerDay: 6,
  allArtworks: [],
  nextOwnedId: 1,
  nextExpoId: 1,
};

let currentReveal = null;

/* ----------------------------------------------------------------------------
   INICIALIZAÇÃO
   ---------------------------------------------------------------------------- */
async function init(){
  // Base embutida em js/artworks-data.js — não usa fetch(), então o jogo
  // funciona abrindo o index.html direto do disco (file://), sem servidor.
  State.allArtworks = ARTWORKS;
  const retomou = typeof Save !== "undefined" && Save.carregar();
  if(typeof carregarObrasExtrasSupabase === "function") carregarObrasExtrasSupabase();  // não bloqueia o boot
  wireNav();
  wireModal();
  updateHUD();
  montarMapa();
  document.getElementById("gaveta-x").addEventListener("click", ()=>{ AudioFX.click(); switchView("mapa"); });
  window.addEventListener("keydown", (ev)=>{
    if(ev.key === "Escape" && document.querySelector(".view.active")
       && !document.getElementById("modal-overlay")?.classList.contains("active")) switchView("mapa");
  });
  if(typeof Carreira !== "undefined") Carreira.iniciar();
  if(typeof Save !== "undefined"){
    Save.iniciar();
    if(retomou){ toast("💾 Partida retomada de onde você parou"); if(State.exhibitions.length) ensureExpoRunning(); }
    document.getElementById("btn-config")?.addEventListener("click", ()=>{ AudioFX.click(); switchView("config"); });
    document.getElementById("btn-salvar")?.addEventListener("click", ()=>{ if(Save.salvar()) toast("💾 Partida salva"); });
    document.getElementById("btn-novo-jogo")?.addEventListener("click", novoJogo);
  }
  // instalável na tela inicial e com fotos em cache quando aberto por http/https (em arquivo local não se aplica)
  if("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel="manifest"]')) navigator.serviceWorker.register("sw.js").catch(()=>{});
  medirChrome();
  window.addEventListener("resize", medirChrome);
  window.addEventListener("orientationchange", ()=>setTimeout(medirChrome, 250));
  if(window.ResizeObserver){ const ro = new ResizeObserver(medirChrome); ["hud","nav"].forEach(id=>{ const e = document.getElementById(id); if(e) ro.observe(e); }); }
  Market.start();
  if(typeof Eventos !== "undefined") Eventos.iniciar();
  setInterval(updateHUD, 5000);   // mantém o aviso do teste em dia
  switchView("mapa");
}

function updateHUD(){
  document.getElementById("hud-cash").textContent = fmtMoney(State.cash);
  document.getElementById("hud-rep").textContent = Math.round(State.reputation);
  const cl = document.getElementById("hud-classe");
  if(cl){ const c = classeDe(State.reputation); cl.textContent = `Classe ${c}`; cl.title = tituloClasse(c); }
  document.getElementById("hud-know").textContent = Math.round(State.knowledge);
  // Indicador de exposições em andamento, visível em qualquer tela
  const nav = document.getElementById("nav");
  let badge = document.getElementById("expo-badge");
  const ativas = State.exhibitions.filter(e=>!e.ended);
  const btnExpo = nav.querySelector('button[data-view="exposicao"]');
  if(btnExpo){ if(ativas.length) btnExpo.dataset.n = ativas.length; else btnExpo.removeAttribute("data-n"); }
  if(ativas.length){
    if(!badge){
      badge = document.createElement("button");
      badge.id = "expo-badge";
      badge.style.cssText = "padding:8px 12px;border-radius:6px;font-size:12px;font-weight:700;color:var(--ink);background:var(--gold);margin-left:6px;";
      badge.addEventListener("click", ()=>switchView("exposicao"));
      nav.appendChild(badge);
    }
    badge.textContent = ativas.length === 1
      ? `● Dia ${ativas[0].dayIndex}/${ativas[0].durationDays}`
      : `● ${ativas.length} exposições`;
  } else if(badge){
    badge.remove();
  }
  // Aviso no menu quando há convite de leilão aberto
  const btnLeilao = document.querySelector('#nav button[data-view="auction"]');
  if(btnLeilao && typeof Auction !== "undefined"){
    Auction.garantirConvites();
    const n = Auction.convites.length;
    btnLeilao.querySelector("span").textContent = n ? `Leilões ${n}` : "Leilões";
    btnLeilao.style.color = n ? "var(--gold-bright)" : "";
  }

  // Aviso no menu quando o Teste do Curador está disponível
  const btnQuiz = document.querySelector('#nav button[data-view="quiz"]');
  if(btnQuiz && typeof Quiz !== "undefined"){
    const livre = Quiz.liberado();
    btnQuiz.querySelector("span").textContent = livre ? "Teste ●" : "Teste";
    btnQuiz.style.color = livre ? "var(--gold-bright)" : "";
  }
}
function fmtMoney(n){ return "€ " + Math.round(n).toLocaleString("pt-BR"); }

function escapeXml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

// Obras fixas (patrimônio tombado) não têm foto própria no jogo (as fotos
// disponíveis publicamente são de terceiros com direitos reservados) — em
// vez disso, geramos um cartão ilustrativo que deixa claro que é um bem
// tombado, com o título real da obra.
function fixedWorkSVG(work){
  const title = escapeXml(work.titulo).slice(0,30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380">
    <rect width="300" height="380" fill="#241f18"/>
    <rect x="6" y="6" width="288" height="368" fill="none" stroke="#c9a13b" stroke-width="3"/>
    <text x="150" y="165" font-size="72" text-anchor="middle">🗿</text>
    <text x="150" y="225" font-size="19" fill="#efe6d3" text-anchor="middle" font-family="Georgia,serif">${title}</text>
    <text x="150" y="252" font-size="11.5" fill="#c9a13b" text-anchor="middle" letter-spacing="2">PATRIM${"Ô"}NIO TOMBADO</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
// IMG_EMBUTIDAS só existe na versão de arquivo único (as fotos vão dentro do HTML)
function imgSrc(work){
  const p = work.imagem;
  return (typeof IMG_EMBUTIDAS !== "undefined" && p && IMG_EMBUTIDAS[p]) || p || fixedWorkSVG(work);
}

/* ----------------------------------------------------------------------------
   MERCADO — oscilação diária, valorização e choques por notícia
   ---------------------------------------------------------------------------- */
const Market = {
  mult: {},        // id da obra -> multiplicador sobre o preço base
  day: 0,
  clock: null,

  valueOf(work){
    const m = this.mult[work.id] || 1;
    // obra desgastada vale menos: com 0% de conservação, 40% do valor
    const cons = work.conservacao == null ? 100 : work.conservacao;
    return Math.round(work.preco_base * m * (0.4 + 0.6*cons/100) / 100) * 100;
  },
  hist: {},         // id da obra -> multiplicadores diários (para o gráfico)

  // Variação acumulada da obra desde o início, em %
  changePct(work){
    const m = this.mult[work.id] || 1;
    return (m - 1) * 100;
  },

  // Um dia de pregão: cada obra sofre um passeio aleatório em torno da sua
  // valorização estrutural, com amplitude proporcional à faixa.
  tickDay(){
    this.day++;
    State.allArtworks.forEach(w=>{
      const vol = TIER_VOLATILITY[w.tier] || 0.01;
      const drift = TIER_DRIFT[w.tier] || 0.001;
      const anchor = TIER_ANCHOR[w.tier] || 1.2;
      const atual = this.mult[w.id] || 1;
      // ruído gaussiano aproximado (soma de uniformes) para evitar saltos feios
      const noise = ((Math.random()+Math.random()+Math.random())/1.5 - 1) * vol;
      // puxão de volta à âncora: uma alta forte tende a se corrigir com o tempo
      const pull = (anchor - atual) * MEAN_REVERSION;
      let m = atual * (1 + drift + noise) + pull;
      this.mult[w.id] = Math.min(MARKET_CEIL, Math.max(MARKET_FLOOR, m));
      const h = this.hist[w.id] || (this.hist[w.id] = [1]);
      h.push(this.mult[w.id]); if(h.length > 90) h.shift();
    });
    if(Math.random() < 0.045) this.artistRally();
    if(Math.random() < 0.035) this.countryTheft();
    refreshMarketViews();
  },

  // Notícia boa: um artista entra em alta e todas as obras dele sobem junto.
  artistRally(){
    const owned = State.collection.map(o=>o.artista);
    // dá preferência a um artista que o jogador possui — a notícia tem que importar
    const pool = owned.length && Math.random() < 0.7
      ? owned : State.allArtworks.map(w=>w.artista);
    const artista = pool[Math.floor(Math.random()*pool.length)];
    const obras = State.allArtworks.filter(w=>w.artista===artista);
    if(!obras.length) return;
    const tierMed = obras.reduce((s,w)=>s+w.tier,0)/obras.length;
    const boost = 0.06 + (tierMed/6)*0.22 + Math.random()*0.06; // 6% a 34%
    obras.forEach(w=>{
      this.mult[w.id] = Math.min(MARKET_CEIL, (this.mult[w.id]||1) * (1+boost));
    });
    const n = NEWS_GOOD[Math.floor(Math.random()*NEWS_GOOD.length)];
    showNewspaper({
      tipo:"alta",
      titulo:n.titulo,
      texto:n.texto.replace("{artista}", artista),
      destaque:`${artista} +${Math.round(boost*100)}%`,
      temNaColecao: State.collection.some(o=>o.artista===artista),
    });
  },

  // Notícia ruim: roubo numa praça derruba o valor das obras daquele país.
  countryTheft(){
    const paises = Object.keys(COUNTRIES);
    const pais = paises[Math.floor(Math.random()*paises.length)];
    const obras = State.allArtworks.filter(w=>w.pais===pais);
    if(!obras.length) return;
    const queda = 0.05 + Math.random()*0.12; // 5% a 17%
    obras.forEach(w=>{
      this.mult[w.id] = Math.max(MARKET_FLOOR, (this.mult[w.id]||1) * (1-queda));
    });
    const n = NEWS_BAD[Math.floor(Math.random()*NEWS_BAD.length)];
    showNewspaper({
      tipo:"baixa",
      titulo:n.titulo,
      texto:n.texto.replace("{pais}", pais),
      destaque:`${pais} −${Math.round(queda*100)}%`,
      temNaColecao: State.collection.some(o=>o.pais===pais),
    });
  },

  // O pregão corre sozinho, num ritmo lento, para o mercado ter vida própria.
  start(){
    if(this.clock) return;
    this.clock = setInterval(()=>{ this.tickDay(); if(typeof Banco!=="undefined") Banco.tickDia(); processarAgenda(); }, 9000);
  },
};

// Redesenha o que depende de preço, se estiver na tela
function refreshMarketViews(){
  const ativa = document.querySelector(".view.active");
  if(ativa && ativa.id === "view-collection") renderCollection();
}

/* ----------------------------------------------------------------------------
   JORNAL — alerta visual de valorização/queda
   ---------------------------------------------------------------------------- */
let newsQueue = [];
let newsShowing = false;

// O efeito da notícia no mercado já aconteceu; aqui só se decide se o jornal
// sobe à tela. Respeita o nível de frequência do jogador: fora da janela, a
// notícia não interrompe — vai só para o histórico (Configurações).
let ultimoJornalMs = 0;
function showNewspaper(info){
  Avisos.registrar("📰", info.titulo, info.texto);
  const nivel = Config.v.freq.jornal;
  if(nivel === "off") return;
  if(Date.now() - ultimoJornalMs < Config.gapMs("jornal")) return;
  ultimoJornalMs = Date.now();
  newsQueue.push(info);
  if(!newsShowing) drainNews();
}

let edicaoJornal = 127;
// Cotações do dia: as maiores altas e a maior baixa do mercado agora
function cotacoesDoDia(){
  if(!Market.changePct) return [];
  const lista = State.allArtworks.map(w=>({ w, p: Market.changePct(w) }));
  // um por artista (senão duas obras do mesmo pintor aparecem como se fossem duas notícias)
  const unicos = arr => { const vistos = new Set(); return arr.filter(x=>{ if(vistos.has(x.w.artista)) return false; vistos.add(x.w.artista); return true; }); };
  const altas = unicos([...lista].sort((a,b)=>b.p-a.p)).slice(0,2);
  const baixa = unicos([...lista].sort((a,b)=>a.p-b.p)).find(x=>!altas.some(a=>a.w.artista===x.w.artista));
  return [...altas, baixa].filter(Boolean);
}
function drainNews(){
  if(!newsQueue.length){ newsShowing = false; return; }
  newsShowing = true;
  const info = newsQueue.shift();
  edicaoJornal++;
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  // foto: uma obra do artista citado na notícia, se houver
  const texto = `${info.titulo} ${info.texto}`;
  const foto = State.allArtworks.find(w=>w.imagem && texto.includes(w.artista));
  const editoria = info.tipo === "alta" ? "Mercado · Alta" : "Mercado · Baixa";
  const cot = cotacoesDoDia();
  const el = document.createElement("div");
  el.className = "newspaper jornal " + (info.tipo==="alta" ? "news-up" : "news-down");
  el.innerHTML = `
    <button class="jn-x" title="Fechar">✕</button>
    <div class="jn-topo"><span>Ano III · Nº ${edicaoJornal}</span><span>${hoje}</span><span>€ 2,00</span></div>
    <div class="jn-titulo">O Correio das Artes</div>
    <div class="jn-lema">❦ O diário do mercado de arte desde 1874 ❦</div>
    <div class="jn-fio"></div>
    <div class="jn-editoria">${editoria}</div>
    <div class="jn-manchete">${info.titulo}</div>
    <div class="jn-linha-fina">${info.destaque}</div>
    <div class="jn-corpo">
      ${foto ? `<figure class="jn-foto"><div class="jn-reticula"><img src="${imgSrc(foto)}" alt=""></div>
        <figcaption>${foto.titulo}, de ${foto.artista}</figcaption></figure>` : ""}
      <p class="jn-capitular">${info.texto}</p>
      <p>Galeristas de Londres a Viena acompanham o movimento de perto; marchands consultados pelo <i>Correio</i> recomendam cautela antes de novas aquisições.</p>
    </div>
    ${cot.length ? `<div class="jn-cotacoes"><b>Cotações do dia</b>${cot.map(c=>`
      <span>${c.w.artista.split(" ").slice(-1)[0]} <em class="${c.p>=0?'mkt-up':'mkt-down'}">${c.p>=0?"▲":"▼"} ${Math.abs(c.p).toFixed(1)}%</em></span>`).join("")}</div>` : ""}
    ${info.temNaColecao ? `<div class="np-flag">${info.tipo==="alta" ? "▲ Você tem obras nessa alta" : "▼ Afeta obras da sua coleção"}</div>` : ""}
  `;
  document.body.appendChild(el);
  if(info.tipo==="alta") AudioFX.coin(); else AudioFX.alert();
  requestAnimationFrame(()=>el.classList.add("show"));
  // fica o tempo configurado (mínimo 9 s para dar para ler); passar o mouse
  // pausa a leitura; clicar fecha. "Até eu fechar" não tem contagem.
  const cfgDur = Config.duracaoMs();
  let restante = cfgDur === 0 ? Infinity : Math.max(9000, cfgDur), inicio = Date.now(), timer;
  const fechar = ()=>{ clearTimeout(timer); el.classList.remove("show"); setTimeout(()=>{ el.remove(); drainNews(); }, 400); };
  const armar = ()=>{ inicio = Date.now(); if(restante !== Infinity) timer = setTimeout(fechar, restante); };
  el.addEventListener("mouseenter", ()=>{ clearTimeout(timer); restante -= Date.now() - inicio; });
  el.addEventListener("mouseleave", armar);
  el.querySelector(".jn-x").addEventListener("click", fechar);
  armar();
}

/* ----------------------------------------------------------------------------
   FUNDO TEMÁTICO — parede de galeria com obras do acervo
   ---------------------------------------------------------------------------- */
function montarFundoArte(){
  const parede = document.getElementById("bg-art");
  if(!parede) return;
  // Prioriza obras com ficha completa (as mais conhecidas) e mistura as demais
  const comFoto = State.allArtworks.filter(w=>w.imagem);
  const famosas = shuffle(comFoto.filter(w=>w.analise));
  const outras = shuffle(comFoto.filter(w=>!w.analise));
  const escolha = [...famosas.slice(0,26), ...outras.slice(0,14)];
  // telas grandes pedem mais quadros; repete a seleção embaralhada se preciso
  const alvo = Math.ceil((window.innerWidth+160)/187) * Math.ceil((window.innerHeight+380)/227) + 8;
  const quadros = [];
  while(quadros.length < alvo) quadros.push(...shuffle(escolha));
  parede.innerHTML = quadros.slice(0, alvo)
    .map(w=>`<div class="bg-tile" style="background-image:url('${imgSrc(w)}')"></div>`).join("");
}

/* ----------------------------------------------------------------------------
   NAVEGAÇÃO ENTRE VIEWS
   ---------------------------------------------------------------------------- */
function wireNav(){
  document.querySelectorAll("#nav button[data-view]").forEach(b=>{
    b.addEventListener("click", ()=>{
      AudioFX.click();
      fecharMais();
      switchView(b.dataset.view);
    });
  });
  document.getElementById("nav-mais")?.addEventListener("click", ()=>{ AudioFX.click(); alternarMais(); });
  document.querySelectorAll("[data-goto]").forEach(b=>{
    b.addEventListener("click", ()=>{ AudioFX.click(); switchView(b.dataset.goto); });
  });
}
// O mapa é o palco: "mapa" fecha os painéis; as demais telas abrem um painel
// que sobe por cima dele (e o ✕ ou Esc volta ao mapa).
/* ------------------------------------------------------------------ celular
   A barra de baixo mostra 4 telas + "Mais" (uma folha com as demais). O espaço
   real entre o cabeçalho e a barra é medido e exposto em variáveis CSS, para
   os cartões de decisão caberem sempre — em qualquer tamanho e orientação. */
function medirChrome(){
  const r = document.documentElement.style;
  const alt = id=>{ const e = document.getElementById(id); return e && e.offsetParent !== null ? e.getBoundingClientRect().height : 0; };
  r.setProperty("--hud-h", alt("hud") + "px");
  r.setProperty("--nav-h", alt("nav") + "px");
  r.setProperty("--trk-h", alt("rastreador") + "px");
}
function centralizarNav(){
  const nav = document.getElementById("nav"), a = nav?.querySelector("button.active");
  if(!nav || !a || nav.scrollWidth <= nav.clientWidth + 2) return;
  nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth)/2, behavior: "smooth" });
}
function alternarMais(){ document.getElementById("mais-sheet") ? fecharMais() : abrirMais(); }
function fecharMais(){
  document.getElementById("mais-sheet")?.remove();
  document.getElementById("nav-mais")?.classList.remove("aberto");
}
function abrirMais(){
  const nav = document.getElementById("nav");
  const itens = [...nav.querySelectorAll("button[data-view]:not(.nav-fixo)")].map(b=>({
    view:b.dataset.view, svg:b.querySelector("svg")?.outerHTML || "", nome:b.querySelector("span")?.textContent || b.dataset.view,
  }));
  itens.push({ view:"config", svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/></svg>`, nome:"Ajustes" });
  const sheet = document.createElement("div");
  sheet.id = "mais-sheet";
  sheet.innerHTML = `<div class="mais-fundo"></div><div class="mais-grade">${itens.map(i=>`
      <button type="button" data-mais="${i.view}">${i.svg}<span>${i.nome}</span>${typeof selosDaSala==="function" ? selosDaSala(i.view) : ""}</button>`).join("")}</div>`;
  document.getElementById("app").appendChild(sheet);
  document.getElementById("nav-mais")?.classList.add("aberto");
  sheet.querySelector(".mais-fundo").addEventListener("click", fecharMais);
  sheet.querySelectorAll("[data-mais]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); switchView(b.dataset.mais); }));
}

function switchView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const painel = document.getElementById("view-"+name);
  if(painel) painel.classList.add("active");
  document.getElementById("gaveta-x")?.classList.toggle("visivel", name !== "mapa");
  document.querySelectorAll("#nav button[data-view]").forEach(b=>b.classList.toggle("active", b.dataset.view===name));
  document.body.classList.toggle("com-view", name !== "mapa");
  const fixo = !!document.querySelector(`#nav .nav-fixo[data-view="${name}"]`);
  document.getElementById("nav-mais")?.classList.toggle("active", !fixo && name !== "mapa");
  fecharMais();
  centralizarNav();
  requestAnimationFrame(medirChrome);
  if(name==="mapa" && typeof Mapa!=="undefined"){ Mapa.sujo = true; atualizarMapa(); }
  if(name==="acquisition") renderAcquisitionSetup();
  if(name==="collection") renderCollection();
  if(name==="exposicao") renderExpoSetup();
  if(name==="menu") renderHub();
  if(name==="salas") renderSalas();
  if(name==="banco") renderBanco();
  if(name==="agenda") renderAgendaPlanner();
  if(name==="carreira") renderCarreira();
  if(name==="config") renderConfig();
  if(name==="auction") renderAuction();
  if(name==="quiz") renderQuiz();
}

/* ----------------------------------------------------------------------------
   MODAL GENÉRICO (ficha de obra / ofertas)
   ---------------------------------------------------------------------------- */
function wireModal(){
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e)=>{
    if(e.target.id === "modal-overlay") closeModal();
  });
}
function openModal(html){
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal-overlay").classList.add("active");
}
function closeModal(){
  document.getElementById("modal-overlay").classList.remove("active");
}

/* ----------------------------------------------------------------------------
   ATRIBUTOS DA OBRA (barras de 0 a 100)
   ---------------------------------------------------------------------------- */
const RENOME_POR_TIER = { 6:100, 5:88, 4:74, 3:60, 2:45, 1:30 };
function renomeDoArtista(artista){
  // o renome vem da obra mais importante do artista, não da peça em questão:
  // um esboço de Leonardo continua sendo de um autor de renome máximo
  const tiers = State.allArtworks.filter(w=>w.artista===artista).map(w=>w.tier);
  return RENOME_POR_TIER[Math.max(...tiers, 1)] || 50;
}
function atributosObra(w){
  const var_ = Market.changePct ? Market.changePct(w) : 0;
  return {
    raridade: Math.round(w.tier/6*100),
    renome: renomeDoArtista(w.artista),
    demanda: Math.max(5, Math.min(100, Math.round(50 + var_*0.9))),
    atratividade: Math.min(100, Math.round(((TIER_DRAW[w.tier]||1)/3.2)*85 + (w.analise?12:0) + (w.retratado?5:0))),
    conservacao: w.conservacao == null ? 100 : Math.round(w.conservacao),
  };
}
function fichaAtributosHTML(w){
  const a = atributosObra(w);
  const nivel = (v,alto,medio,baixo)=> v>=70 ? alto : v>=45 ? medio : baixo;
  return `<div class="sec">
    <h3 class="sec-title">📊 Atributos da obra</h3>
    ${barraHTML("Raridade", a.raridade, w.tier_label)}
    ${barraHTML("Renome do autor", a.renome, nivel(a.renome,"aposta certa","consolidado","em formação"))}
    ${barraHTML("Demanda atual", a.demanda, nivel(a.demanda,"alta procura","procura estável","pouca procura"))}
    ${barraHTML("Atratividade visual", a.atratividade, nivel(a.atratividade,"atrai muito público","atrai bem","atrai pouco"))}
    ${barraHTML("Estado de conservação", a.conservacao, a.conservacao>=95?"perfeita":a.conservacao>=75?"bom estado":"desgastada — valor reduzido", a.conservacao<75, [95,75])}
  </div>`;
}
function graficoPrecoHTML(w){
  const h = Market.hist[w.id];
  if(!h || h.length < 3) return `<div class="sec"><h3 class="sec-title">📈 Histórico de preço</h3>
    <p class="sec-body" style="font-size:12.5px;color:var(--parchment-dim)">O gráfico aparece depois de alguns dias de pregão.</p></div>`;
  const vals = h.map(m=>m*w.preco_base);
  const min = Math.min(...vals), max = Math.max(...vals), W = 300, H = 70;
  const pts = vals.map((v,i)=>`${(i/(vals.length-1)*W).toFixed(1)},${(H-4-(max===min?0.5:(v-min)/(max-min))*(H-8)).toFixed(1)}`).join(" ");
  const recente = vals.slice(-10), tend = (recente[recente.length-1]-recente[0])/recente[0]*100;
  const txt = tend > 2 ? "em alta" : tend < -2 ? "em baixa" : "estável";
  return `<div class="sec">
    <h3 class="sec-title">📈 Histórico de preço <small>(${vals.length} dias de pregão)</small></h3>
    <svg class="grafico-preco" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="${tend>=0?'#7c9473':'#c15a5a'}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="gp-legenda"><span>mín. ${fmtMoney(min)}</span><span>Tendência recente: <b>${txt}</b> (${tend>=0?"+":""}${tend.toFixed(1)}% em 10 dias)</span><span>máx. ${fmtMoney(max)}</span></div>
  </div>`;
}

function factSheetHTML(work, extraButtons){
  const tierColor = TIER_COLORS[work.tier];
  let rows = "";
  const add = (k,v) => { if(v) rows += `<div class="fact-row"><span class="k">${k}</span><span class="v">${v}</span></div>`; };
  add("Data da obra", work.data_obra);
  add("Movimento", work.movimento);
  add("Técnica", work.tecnica);
  add("Local", work.local);
  add("Museu / Acervo", work.museu);
  add("País de origem", work.pais);
  if(work.nascimento) add("Nascimento do artista", work.nascimento);
  if(work.falecimento) add("Falecimento do artista", work.falecimento);

  const retratadoHTML = work.retratado ? `
    <div class="sec sec-pessoa">
      <h3 class="sec-title">🎭 Quem está retratado</h3>
      <div class="pessoa-nome">${work.retratado.nome}</div>
      <p class="sec-body">${work.retratado.resumo}</p>
    </div>` : "";

  const analiseHTML = work.analise ? `
    <div class="sec">
      <h3 class="sec-title">👁 O que se vê no quadro</h3>
      <p class="sec-body">${work.analise}</p>
    </div>` : "";

  const curiHTML = (work.curiosidades && work.curiosidades.length) ? `
    <div class="sec">
      <h3 class="sec-title">✦ Você sabia?</h3>
      <ul class="curi-list">${work.curiosidades.map(c=>`<li>${c}</li>`).join("")}</ul>
    </div>` : "";

  return `
    <img class="modal-img" src="${imgSrc(work)}" alt="${work.titulo}">
    <div id="modal-body-inner" style="padding:22px;">
      <span class="tier-badge" style="background:${tierColor}22;color:${tierColor};border:1px solid ${tierColor}55;">${work.tier_label.toUpperCase()}</span>
      <h2>${work.titulo}</h2>
      <div class="modal-artist">${work.artista}</div>
      ${rows}
      ${fichaAtributosHTML(work)}
      ${retratadoHTML}
      ${analiseHTML}
      ${curiHTML}
      ${(work.analise || work.retratado) ? "" : `<div class="historia"${work.arquivoTxt ? ` data-txt="${work.arquivoTxt}"` : ""}>${work.historia}</div>`}
      ${graficoPrecoHTML(work)}
      ${typeof provenienciaHTML === "function" ? provenienciaHTML(work) : ""}
      ${extraButtons || ""}
    </div>
  `;
}

function openWorkModal(work, extraButtons){
  openModal(factSheetHTML(work, extraButtons));
  // obras da nuvem: o texto da ficha vem do arquivo .txt guardado no Supabase
  const hz = document.querySelector("#modal-body-inner .historia[data-txt]");
  if(hz){
    const url = hz.dataset.txt, ch = "artnexus_txt_" + url;
    const mostrar = t => { if(t && hz.isConnected) hz.textContent = t.trim(); };
    try{ const c = sessionStorage.getItem(ch); if(c) mostrar(c); }catch(e){}
    fetch(url).then(r => r.ok ? r.text() : "").then(t => { if(t){ mostrar(t); try{ sessionStorage.setItem(ch, t); }catch(e){} } }).catch(()=>{});
  }
  if(!State.seenIds.has(work.id)){
    State.seenIds.add(work.id);
    // Fichas com análise e curiosidades ensinam mais, então valem mais
    const rica = work.analise || work.retratado;
    const ganho = rica ? KNOWLEDGE_PER_ACQUISITION_VIEW * 3 : KNOWLEDGE_PER_ACQUISITION_VIEW;
    State.knowledge += ganho;
    updateHUD();
  }
}

/* ----------------------------------------------------------------------------
   AQUISIÇÃO — ROLETA DE DADOS
   ---------------------------------------------------------------------------- */
function renderAcquisitionSetup(){
  const el = document.getElementById("view-acquisition");
  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Sala de Aquisições</h1>
      <p class="page-sub">Escolha um filtro e gire a roleta. Você tem até 6 tentativas por campanha.</p>

      <div class="panel" id="acq-setup">
        <strong style="font-size:13px;color:var(--parchment-dim)">FILTRAR POR FAIXA DE VALOR</strong>
        <div class="filters" id="filters-tier">
          ${[1,2,3,4,5,6].map(t=>{
            const n = State.allArtworks.filter(w=>w.tier===t).length;
            return `<button class="chip" data-type="tier" data-value="${t}" ${n?"":"disabled"}>${TIER_LABELS[t]}<span class="chip-n">${n}</span></button>`;
          }).join("")}
        </div>
        <strong style="font-size:13px;color:var(--parchment-dim)">OU POR PAÍS</strong>
        <div class="filters" id="filters-country">
          ${Object.keys(COUNTRIES).map(c=>{
            const n = State.allArtworks.filter(w=>w.pais===c).length;
            return `<button class="chip" data-type="country" data-value="${c}" ${n?"":"disabled"}>${COUNTRIES[c].flag} ${c}<span class="chip-n">${n}</span></button>`;
          }).join("")}
        </div>
        <div class="filters">
          <button class="chip" data-type="any" data-value="">✦ Surpresa (qualquer obra)<span class="chip-n">${State.allArtworks.length}</span></button>
        </div>

        <div id="attempts-track"></div>
        <div class="action-row">
          <button class="btn btn-gold" id="btn-spin" disabled>🎲 Girar a Roleta</button>
          <button class="btn btn-outline" id="btn-new-campaign">Reiniciar campanha (6 tentativas)</button>
        </div>
      </div>

      <div class="panel" id="roulette-stage" style="display:none;">
        <div id="dice-wrap">${diceSVG(1)}</div>
        <div id="roulette-result"></div>
      </div>
    </div>
  `;
  document.querySelectorAll(".chip[data-type]").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      document.querySelectorAll(".chip").forEach(c=>c.classList.remove("selected"));
      chip.classList.add("selected");
      State.acqFilterType = chip.dataset.type;
      State.acqFilterValue = chip.dataset.value;
      document.getElementById("btn-spin").disabled = State.attemptsLeft<=0;
    });
  });
  document.getElementById("btn-spin").addEventListener("click", doSpin);
  document.getElementById("btn-new-campaign").addEventListener("click", ()=>{
    State.attemptsLeft = 6;
    renderAcquisitionSetup();
  });
  renderAttemptsTrack();
}

function renderAttemptsTrack(){
  const track = document.getElementById("attempts-track");
  if(!track) return;
  let html = "";
  for(let i=0;i<6;i++){
    const used = i < (6-State.attemptsLeft);
    const isCurrent = i === (6-State.attemptsLeft) && State.attemptsLeft>0;
    html += `<div class="attempt-dot ${used?'used':''} ${isCurrent?'current':''}">${i+1}</div>`;
  }
  track.innerHTML = html;
  const spinBtn = document.getElementById("btn-spin");
  if(spinBtn) spinBtn.disabled = State.attemptsLeft<=0 || !State.acqFilterType;
}

function diceSVG(face){
  const pipsMap = {
    1:[[50,50]], 2:[[28,28],[72,72]], 3:[[28,28],[50,50],[72,72]],
    4:[[28,28],[72,28],[28,72],[72,72]],
    5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
    6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
  };
  const pips = pipsMap[face].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#14110d"/>`).join("");
  return `<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="16" fill="#efe6d3" stroke="#c9a13b" stroke-width="3"/>${pips}</svg>`;
}

function filterPool(){
  let pool;
  if(State.acqFilterType === "tier") pool = State.allArtworks.filter(w=>w.tier === Number(State.acqFilterValue));
  else if(State.acqFilterType === "country") pool = State.allArtworks.filter(w=>w.pais === State.acqFilterValue);
  else pool = State.allArtworks;
  // obra que já é sua não volta à roleta
  const meus = new Set(State.collection.map(o=>o.id));
  return pool.filter(w=>!meus.has(w.id));
}

// Guarda as últimas obras sorteadas para não repetir enquanto houver
// alternativa. A janela acompanha o tamanho do conjunto: em filtros pequenos
// ela encolhe, senão travaria o sorteio.
function semRepetir(pool){
  if(!State.recentReveals) State.recentReveals = [];
  const janela = Math.min(State.recentReveals.length, Math.max(2, Math.floor(pool.length * 0.6)));
  const recentes = new Set(State.recentReveals.slice(-janela));
  const frescas = pool.filter(w=>!recentes.has(w.id));
  return frescas.length ? frescas : pool;
}

function registrarSorteio(id){
  if(!State.recentReveals) State.recentReveals = [];
  State.recentReveals.push(id);
  if(State.recentReveals.length > 60) State.recentReveals.shift();
}

function doSpin(){
  if(State.attemptsLeft<=0 || !State.acqFilterType) return;
  AudioFX.diceRoll();
  State.attemptsLeft--;
  document.getElementById("roulette-stage").style.display = "flex";
  document.getElementById("btn-spin").disabled = true;
  renderAttemptsTrack();

  const diceEl = document.getElementById("dice-wrap");
  let frames = 0;
  const iv = setInterval(()=>{
    frames++;
    diceEl.innerHTML = diceSVG(1 + Math.floor(Math.random()*6));
    if(frames > 10){
      clearInterval(iv);
      const finalFace = 1 + Math.floor(Math.random()*6);
      diceEl.innerHTML = diceSVG(finalFace);
      revealFromDice(finalFace);
    }
  }, 90);
}

function revealFromDice(face){
  const poolBruto = filterPool();
  if(poolBruto.length === 0){
    const jaTenho = State.acqFilterType === "tier" || State.acqFilterType === "country";
    document.getElementById("roulette-result").innerHTML =
      `<p style="color:var(--parchment-dim)">Nenhuma obra disponível para esse filtro${jaTenho? " — pode ser que você já tenha todas dessa seleção" : ""}.</p>`;
    renderAttemptsTrack();
    return;
  }
  const pool = semRepetir(poolBruto);

  // O dado enviesa a faixa de preço, mas não a trava: ele define uma janela
  // ampla (metade do conjunto) dentro da qual a escolha é aleatória. Assim
  // faces iguais não devolvem sempre as mesmas obras.
  let work;
  if(pool.length >= 8){
    const ordenado = [...pool].sort((a,b)=>Market.valueOf(a)-Market.valueOf(b));
    const janela = Math.max(4, Math.floor(ordenado.length/2));
    const passo = (ordenado.length - janela) / 5;          // 6 faces -> 5 passos
    const inicio = Math.round((face-1) * passo);
    const faixa = ordenado.slice(inicio, inicio + janela);
    work = faixa[Math.floor(Math.random()*faixa.length)];
  } else {
    work = pool[Math.floor(Math.random()*pool.length)];
  }
  registrarSorteio(work.id);
  currentReveal = work;
  AudioFX.success();
  const tierColor = TIER_COLORS[work.tier];
  const isFixed = !!work.fixa;
  const buyLabel = isFixed ? "Assumir concessão" : "Comprar";
  const fixedNote = isFixed
    ? `<div style="font-size:11.5px;color:var(--gold-bright);margin:6px 0;">🏛️ Bem tombado — você não compra a obra, adquire a concessão de gestão da visitação.</div>`
    : "";
  document.getElementById("roulette-result").innerHTML = `
    <div class="reveal-card">
      <img src="${imgSrc(work)}" alt="${work.titulo}">
      <div class="reveal-info">
        <span class="tier-badge" style="background:${tierColor}22;color:${tierColor};border:1px solid ${tierColor}55;">${work.tier_label.toUpperCase()}</span>
        <h3>${work.titulo}</h3>
        <div class="artist">${work.artista} · ${work.pais}</div>
        <div class="meta">${work.data_obra} — ${work.tecnica}</div>
        ${(work.analise||work.retratado) ? `<div class="meta" style="color:var(--gold-bright)">📖 Ficha completa${work.retratado? ": quem está retratado" : ": análise da obra e curiosidades"}</div>` : ""}
        ${fixedNote}
        <div class="price">${fmtMoney(Market.valueOf(work))}</div>
        ${(()=>{ const l = logisticaCompra(work, work.pais, Market.valueOf(work));
          return !State.sede ? `<div class="meta">Sem sede definida: a obra fica em ${cidadePrincipal(work.pais)}.</div>`
            : l.total ? `<div class="meta">+ frete ${fmtMoney(l.frete)}${l.imposto?` e imposto de importação ${fmtMoney(l.imposto)}`:""} até ${l.destino.cidade}</div>` : `<div class="meta">Sem frete: a obra já está na cidade da sua sede.</div>`; })()}
        <div class="mkt-line ${Market.changePct(work)>=0?'mkt-up':'mkt-down'}">${Market.changePct(work)>=0?'▲ +':'▼ '}${Market.changePct(work).toFixed(1)}% no mercado</div>
        <div class="action-row">
          <button class="btn btn-gold" id="btn-buy">${buyLabel}</button>
          ${isFixed? "" : `<button class="btn btn-outline" id="btn-trade">Trocar por obra própria</button>`}
          <button class="btn btn-outline" id="btn-details">Ver ficha</button>
          <button class="btn btn-danger" id="btn-skip">Descartar</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("btn-buy").addEventListener("click", ()=>attemptBuy(work));
  const tradeBtn = document.getElementById("btn-trade");
  if(tradeBtn) tradeBtn.addEventListener("click", ()=>openTradeModal(work));
  document.getElementById("btn-details").addEventListener("click", ()=>openWorkModal(work));
  document.getElementById("btn-skip").addEventListener("click", ()=>{
    AudioFX.click();
    document.getElementById("roulette-result").innerHTML = `<p style="color:var(--parchment-dim)">Obra descartada. ${State.attemptsLeft>0? "Escolha um filtro e gire novamente." : "Campanha encerrada."}</p>`;
    renderAttemptsTrack();
  });
}

function attemptBuy(work){
  if(jaPossui(work.id)){
    AudioFX.error();
    alertInline("Esta obra já está na sua coleção.");
    return;
  }
  const preco = Market.valueOf(work);
  const log = logisticaCompra(work, work.pais, preco);
  if(State.cash < preco + log.total){
    AudioFX.error();
    alertInline(`Saldo insuficiente: com frete e impostos, a compra sai por ${fmtMoney(preco + log.total)}.`);
    return;
  }
  State.cash -= preco + log.total;
  addToCollection(work, preco);
  despacharCompra(work, log);
  AudioFX.coin();
  updateHUD();
  document.getElementById("roulette-result").innerHTML = `<p style="color:var(--sage)">✔ Obra adquirida!${log.destino ? ` Está voando para a sua sede em ${log.destino.cidade}.` : " Ela já está na sua Coleção."}</p>`;
  renderAttemptsTrack();
}

// Cada obra existe uma vez só no mundo: se já é sua, não entra de novo.
function jaPossui(id){ return State.collection.some(o=>o.id===id); }

function addToCollection(work, boughtPrice){
  if(jaPossui(work.id)) return false;
  State.collection.push({ ...work, ownedId: State.nextOwnedId++, boughtPrice, exhibiting:false });
  // a obra sai dos pregões abertos: ninguém mais pode leiloá-la para você
  if(typeof Auction !== "undefined") Auction.retirarObra(work.id);
  return true;
}

function openTradeModal(work){
  if(jaPossui(work.id)){
    AudioFX.error();
    openModal(`<div style="padding:22px;">Esta obra já está na sua coleção.</div>`);
    return;
  }
  if(State.collection.length === 0){
    openModal(`<div style="padding:22px;">Você ainda não possui obras para oferecer em troca.</div>`);
    return;
  }
  const options = State.collection.filter(w=>!w.exhibiting && !w.fixa && !w.penhorada).map(o=>{
    const tradeValue = Math.round(Market.valueOf(o)*0.7);
    return `<button class="pick-tile" data-oid="${o.ownedId}" style="width:100%;text-align:left;display:flex;gap:10px;align-items:center;margin-bottom:8px;">
      <img src="${imgSrc(o)}" style="width:46px;height:56px;object-fit:cover;border-radius:4px;">
      <div><div style="font-size:12.5px;font-weight:600;">${o.titulo}</div>
      <div style="font-size:11px;color:var(--parchment-dim)">Valor de troca: ${fmtMoney(tradeValue)}</div></div>
    </button>`;
  }).join("");
  openModal(`
    <div style="padding:22px;">
      <h2 style="font-family:var(--font-display);margin-bottom:10px;">Oferecer em troca por ${work.titulo}</h2>
      <p style="font-size:12.5px;color:var(--parchment-dim);margin-bottom:14px;">Preço da obra: ${fmtMoney(Market.valueOf(work))}. Sua obra entra com 70% do valor pago; você cobre a diferença em dinheiro.</p>
      ${options}
    </div>
  `);
  document.querySelectorAll("[data-oid]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const oid = Number(btn.dataset.oid);
      const owned = State.collection.find(o=>o.ownedId===oid);
      const tradeValue = Math.round(Market.valueOf(owned)*0.7);
      const log = logisticaCompra(work, work.pais, Market.valueOf(work));
      const diff = Market.valueOf(work) - tradeValue + log.total;
      if(diff > 0 && State.cash < diff){
        AudioFX.error();
        openModal(`<div style="padding:22px;">Diferença necessária: ${fmtMoney(diff)}. Saldo insuficiente.</div>`);
        return;
      }
      State.collection = State.collection.filter(o=>o.ownedId!==oid);
      if(diff > 0) State.cash -= diff;
      addToCollection(work, Market.valueOf(work));
      despacharCompra(work, log);
      AudioFX.coin();
      updateHUD();
      closeModal();
      document.getElementById("roulette-result").innerHTML = `<p style="color:var(--sage)">✔ Troca concluída! A nova obra está na sua Coleção.</p>`;
      renderAttemptsTrack();
    });
  });
}

function alertInline(msg){
  const r = document.getElementById("roulette-result");
  if(r) r.insertAdjacentHTML("beforeend", `<p style="color:var(--rose);margin-top:8px;">${msg}</p>`);
}

/* ----------------------------------------------------------------------------
   COLEÇÃO
   ---------------------------------------------------------------------------- */
// Modo de seleção da Coleção: marcar várias obras e mandá-las juntas para expor
const ColSel = { ativo:false, ids:new Set() };

function renderCollection(){
  const el = document.getElementById("view-collection");
  if(State.collection.length === 0){
    ColSel.ativo = false; ColSel.ids.clear();
    el.innerHTML = `
      <div class="view-inner">
        <h1 class="page-title">Sua Coleção</h1>
        <div class="empty-state">
          <div class="icon">🖼️</div>
          <p>Você ainda não possui obras. Visite a Sala de Aquisições para começar.</p>
        </div>
      </div>`;
    return;
  }
  // descarta seleções que deixaram de valer (obra vendida ou já exposta)
  const livres = new Set(obrasDisponiveis().map(o=>o.ownedId));
  [...ColSel.ids].forEach(id=>{ if(!livres.has(id)) ColSel.ids.delete(id); });

  const patrimonio = State.collection.reduce((s,o)=>s+Market.valueOf(o), 0);
  const custo = State.collection.reduce((s,o)=>s+o.boughtPrice, 0);
  const delta = patrimonio - custo;
  el.innerHTML = `
    <div class="view-inner">
      <div class="col-topo">
        <div>
          <h1 class="page-title">Sua Coleção</h1>
          <p class="page-sub">${State.collection.length} obra(s) · Patrimônio a preço de mercado:
            <strong style="color:var(--gold-bright)">${fmtMoney(patrimonio)}</strong>
            <span class="${delta>=0?'mkt-up':'mkt-down'}">(${delta>=0?'+':''}${fmtMoney(delta)} sobre o que pagou)</span>
          </p>
        </div>
        ${livres.size ? `<button class="btn ${ColSel.ativo?'btn-outline':'btn-gold'}" id="col-modo">
          ${ColSel.ativo ? "Cancelar seleção" : "☑ Selecionar para expor"}</button>` : ""}
      </div>
      ${ColSel.ativo ? `<div class="col-dica">Clique nas obras para marcar. Obras já em exposição não podem ser escolhidas.
        <button class="btn btn-outline btn-sm" id="col-todas">Marcar todas disponíveis</button></div>` : ""}
      <div id="collection-grid" class="${ColSel.ativo?'modo-sel':''}"></div>
    </div>
    ${ColSel.ativo ? `<div class="col-barra" id="col-barra"></div>` : ""}`;

  const grid = document.getElementById("collection-grid");
  State.collection.forEach(o=>{
    const valor = Market.valueOf(o);
    const varPct = ((valor - o.boughtPrice)/o.boughtPrice)*100;
    const cls = varPct>=0 ? "mkt-up" : "mkt-down";
    const seta = varPct>=0 ? "▲" : "▼";
    const marcada = ColSel.ids.has(o.ownedId);
    const tile = document.createElement("button");
    tile.className = "work-thumb" + (marcada ? " marcada" : "") + (ColSel.ativo && o.exhibiting ? " bloqueada" : "");
    tile.innerHTML = `
      ${ColSel.ativo ? `<span class="sel-check">${marcada ? "✓" : ""}</span>` : ""}
      <img src="${imgSrc(o)}" alt="${o.titulo}">
      <div class="wt-info">
        <div class="wt-title">${o.titulo}</div>
        <div class="wt-artist">${o.artista}</div>
        <div class="wt-tag">${o.exhibiting? "🔶 Em exposição" : fmtMoney(valor)}</div>
        <div class="mkt-line ${cls}">${seta} ${varPct>=0?'+':''}${varPct.toFixed(1)}%${(o.analise||o.retratado)? ' · 📖':''}</div>
      </div>`;
    tile.addEventListener("click", ()=>{
      if(!ColSel.ativo){ openOwnedWorkModal(o); return; }
      if(o.exhibiting) return;
      if(marcada) ColSel.ids.delete(o.ownedId); else ColSel.ids.add(o.ownedId);
      AudioFX.click();
      renderCollection();
    });
    grid.appendChild(tile);
  });

  const modo = document.getElementById("col-modo");
  if(modo) modo.addEventListener("click", ()=>{
    ColSel.ativo = !ColSel.ativo;
    if(!ColSel.ativo) ColSel.ids.clear();
    AudioFX.click(); renderCollection();
  });
  const todas = document.getElementById("col-todas");
  if(todas) todas.addEventListener("click", ()=>{
    obrasDisponiveis().forEach(o=>ColSel.ids.add(o.ownedId));
    AudioFX.click(); renderCollection();
  });

  const barra = document.getElementById("col-barra");
  if(barra){
    const n = ColSel.ids.size;
    const valorSel = [...ColSel.ids].reduce((s,id)=>{
      const o = State.collection.find(x=>x.ownedId===id); return s + (o ? Market.valueOf(o) : 0);
    }, 0);
    barra.innerHTML = `
      <span class="cb-n">${n ? `<b>${n}</b> obra(s) marcada(s) · ${fmtMoney(valorSel)} em valor de mercado` : "Nenhuma obra marcada"}</span>
      <span>
        <button class="btn btn-outline btn-sm" id="col-cancelar">Cancelar</button>
        <button class="btn btn-gold" id="col-expor" ${n?"":"disabled"}>Expor ${n>1? n+" obras" : "obra"} →</button>
      </span>`;
    document.getElementById("col-cancelar").addEventListener("click", ()=>{
      ColSel.ativo = false; ColSel.ids.clear(); AudioFX.click(); renderCollection();
    });
    document.getElementById("col-expor").addEventListener("click", ()=>{
      if(!ColSel.ids.size) return;
      expoSetup.workIds = [...ColSel.ids];
      ColSel.ativo = false; ColSel.ids.clear();
      State.expoShowSetup = true;
      AudioFX.click();
      switchView("exposicao");
    });
  }
}

// Ficha da obra própria, com valor de mercado e opções de expor/vender
function openOwnedWorkModal(o){
  const valor = Market.valueOf(o);
  const varPct = ((valor - o.boughtPrice)/o.boughtPrice)*100;
  const liquido = Math.round(valor * (1 - SALE_COMMISSION));
  const cls = varPct>=0 ? "mkt-up" : "mkt-down";
  const bloco = `
    <div style="margin-top:14px;padding:12px 14px;background:var(--panel-2);border-radius:8px;">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;">
        <span style="color:var(--parchment-dim)">Pago na compra</span><span>${fmtMoney(o.boughtPrice)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-top:4px;">
        <span style="color:var(--parchment-dim)">Valor de mercado hoje</span>
        <span class="${cls}"><strong>${fmtMoney(valor)}</strong> (${varPct>=0?'+':''}${varPct.toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-top:4px;">
        <span style="color:var(--parchment-dim)">Líquido na venda (após ${Math.round(SALE_COMMISSION*100)}% de comissão)</span>
        <span style="color:var(--gold-bright)">${fmtMoney(liquido)}</span></div>
    </div>`;
  const cons = o.conservacao == null ? 100 : o.conservacao;
  const custoRest = Math.round(o.preco_base * (Market.mult[o.id]||1) * (100-cons)/100 * 0.25 / 100) * 100;
  const restaurar = (!o.exhibiting && cons < 99) ? `
    <div class="cb-aviso" style="background:rgba(201,161,59,.08);border-color:var(--gold);color:var(--parchment)">
      Conservação em ${Math.round(cons)}%: a obra vale menos. Uma restauração devolve 100%.
      <button class="btn btn-outline btn-sm" id="btn-restaurar" ${State.cash<custoRest?"disabled":""}>Restaurar por ${fmtMoney(custoRest)}</button>
    </div>` : "";
  const acoes = restaurar + (o.penhorada
    ? `<p style="font-size:12px;color:var(--gold-bright);margin-top:12px;">🔒 Obra penhorada no Fundo de Penhor de Arte — quite o empréstimo para expor ou vender.</p>`
    : o.exhibiting
    ? `<p style="font-size:12px;color:var(--parchment-dim);margin-top:12px;">Obra em exposição — encerre para negociá-la.</p>`
    : `<div class="action-row">
         <button class="btn btn-gold" id="btn-goto-expo">${o.fixa? "Organizar visitação" : "Expor esta obra"}</button>
         <button class="btn btn-outline" id="btn-sell">Vender por ${fmtMoney(liquido)}</button>
       </div>`) + (!o.exhibiting && !o.penhorada && !o.fixa ? agendaHTML(o.ownedId, "Roteiro: monte um itinerário de museus") : "");
  openWorkModal(o, bloco + acoes);
  wireAgenda(document.getElementById("modal-body"), o.ownedId, ()=>openOwnedWorkModal(o));
  const rest = document.getElementById("btn-restaurar");
  if(rest) rest.addEventListener("click", ()=>{
    if(State.cash < custoRest) return;
    State.cash -= custoRest; o.conservacao = 100;
    AudioFX.success(); updateHUD(); toast(`🖌️ ${o.titulo} restaurada`);
    openOwnedWorkModal(o); refreshMarketViews();
  });

  const gotoBtn = document.getElementById("btn-goto-expo");
  if(gotoBtn) gotoBtn.addEventListener("click", ()=>{
    closeModal();
    expoSetup.workIds = [o.ownedId];
    State.expoShowSetup = true;
    switchView("exposicao");
  });
  const sellBtn = document.getElementById("btn-sell");
  if(sellBtn) sellBtn.addEventListener("click", ()=>confirmSale(o, valor, liquido));
}

function confirmSale(o, valor, liquido){
  const lucro = liquido - o.boughtPrice;
  openModal(`
    <div style="padding:22px;">
      <h2 style="font-family:var(--font-display);">Confirmar venda</h2>
      <p style="font-size:13.5px;margin:10px 0;">Vender <strong>${o.titulo}</strong> de ${o.artista} por
        <strong style="color:var(--gold-bright)">${fmtMoney(liquido)}</strong> líquidos?</p>
      <p style="font-size:12.5px;color:${lucro>=0?'var(--sage)':'var(--rose)'}">
        Resultado da operação: ${lucro>=0?'+':''}${fmtMoney(lucro)} sobre o que você pagou.</p>
      <div class="action-row">
        <button class="btn btn-gold" id="btn-confirm-sale">Confirmar venda</button>
        <button class="btn btn-outline" id="btn-cancel-sale">Cancelar</button>
      </div>
    </div>`);
  document.getElementById("btn-confirm-sale").addEventListener("click", ()=>{
    State.cash += liquido;
    State.collection = State.collection.filter(x=>x.ownedId!==o.ownedId);
    const tinhaAgenda = filaAgenda(o.ownedId).length > 0;
    delete State.agenda[o.ownedId];   // vendeu a obra: o roteiro futuro dela não existe mais
    if(tinhaAgenda) toast(`📅 O roteiro agendado de "${o.titulo}" foi cancelado — a obra foi vendida.`);
    AudioFX.coin();
    updateHUD();
    closeModal();
    renderCollection();
  });
  document.getElementById("btn-cancel-sale").addEventListener("click", ()=>{
    closeModal();
    openOwnedWorkModal(o);
  });
}

/* ----------------------------------------------------------------------------
   EXPOSIÇÃO — SETUP
   ---------------------------------------------------------------------------- */
// Várias obras podem ser expostas de uma vez: cada uma vira uma exposição
// própria (cartão, relógio e relatório independentes), todas com o mesmo
// destino e a mesma duração. Obras tombadas no grupo usam o acordo de visitação.
// Cada obra pode ter seu próprio destino: expoSetup.country/salaId são o
// "padrão" (o que a grade de países/salas embaixo define); expoSetup.overrides
// guarda só as obras que o jogador customizou individualmente, para poder
// expor várias obras em países diferentes na mesma leva.
let expoSetup = { workIds:[], country:null, duration:1, agreement:null, salaId:null, seguro:true, overrides:{} };

function salaPadraoPais(pais){
  const salas = salasDoPais(pais);
  return salas.find(x=>x.dono) || salas[1];
}
// destino efetivo de UMA obra: a customização dela, ou o padrão da leva
function destinoEfetivo(ownedId){
  return expoSetup.overrides[ownedId] || { country: expoSetup.country, salaId: expoSetup.salaId };
}

// penhorada = garantia de empréstimo: não pode ser exposta nem vendida
function obrasDisponiveis(){ return State.collection.filter(o=>!o.exhibiting && !o.penhorada); }

function renderExpoSetup(){
  // Com exposições rodando, o padrão é o painel; o setup só aparece quando pedido.
  if(State.exhibitions.some(e=>!e.ended) && !State.expoShowSetup){ renderExpoLive(); return; }
  State.expoShowSetup = false;
  const el = document.getElementById("view-exposicao");
  const available = obrasDisponiveis();
  if(available.length === 0){
    el.innerHTML = `
      <div class="view-inner">
        <h1 class="page-title">Galeria Mundo</h1>
        <div class="empty-state"><div class="icon">🌍</div>
        <p>Você precisa de uma obra disponível na Coleção para expor.</p></div>
      </div>`;
    return;
  }
  // mantém só seleções válidas (a obra pode ter sido vendida ou já estar exposta)
  const livres = new Set(available.map(o=>o.ownedId));
  expoSetup.workIds = expoSetup.workIds.filter(id=>livres.has(id));
  if(!expoSetup.workIds.length) expoSetup.workIds = [available[0].ownedId];
  // obras que saíram da seleção não precisam mais de destino customizado
  Object.keys(expoSetup.overrides).forEach(id=>{ if(!expoSetup.workIds.includes(Number(id))) delete expoSetup.overrides[id]; });
  const sel = available.filter(o=>expoSetup.workIds.includes(o.ownedId));
  const temMovel = sel.some(o=>!o.fixa), temFixa = sel.some(o=>o.fixa);
  const moveisSel = sel.filter(o=>!o.fixa);
  if(!expoSetup.country) expoSetup.country = Object.keys(COUNTRIES)[0];
  if(!expoSetup.agreement) expoSetup.agreement = Object.keys(AGREEMENT_TYPES)[0];

  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Nova Exposição</h1>
      <p class="page-sub">Selecione uma ou várias obras, o destino e a duração. Cada obra vira uma exposição própria. Obras tombadas (🏛️) não viajam — para elas você organiza visitação no próprio local.</p>
      ${State.exhibitions.some(e=>!e.ended) ? `<button class="btn btn-outline" id="btn-voltar-painel" style="margin-bottom:14px;">← Voltar às exposições em andamento</button>` : ""}

      <div class="panel">
        <div class="sel-head">
          <strong style="font-size:13px;color:var(--parchment-dim)">OBRAS <span class="sel-cont">${sel.length} de ${available.length} selecionada(s)</span></strong>
          <span>
            <button class="btn btn-outline btn-sm" id="sel-todas">Selecionar todas</button>
            <button class="btn btn-outline btn-sm" id="sel-limpar">Limpar</button>
          </span>
        </div>
        <div id="expo-pick-work"></div>
        <div id="expo-mode-area"></div>
        <strong style="font-size:13px;color:var(--parchment-dim)">DURAÇÃO</strong>
        <div class="duration-row">
          <button class="chip" data-dur="1">1 dia</button>
          <button class="chip" data-dur="30">1 mês (30 dias)</button>
        </div>
        <div id="speed-control">
          <span>Velocidade: 1 dia =</span>
          <input type="range" min="2" max="20" value="${State.speedSecPerDay}" id="speed-slider">
          <span id="speed-val">${State.speedSecPerDay}s</span>
        </div>
        <div class="cost-breakdown" id="cost-breakdown"></div>
        <div class="action-row">
          <button class="btn btn-gold" id="btn-start-expo">${sel.length>1 ? `Iniciar ${sel.length} exposições` : "Iniciar Exposição"}</button>
        </div>
      </div>
    </div>
  `;

  // grade de obras: clique alterna a seleção
  const workGrid = document.getElementById("expo-pick-work");
  available.forEach(o=>{
    const marcada = expoSetup.workIds.includes(o.ownedId);
    const t = document.createElement("button");
    t.className = "pick-tile" + (marcada ? " selected" : "");
    const badge = o.fixa ? `<div class="sub" style="color:var(--gold-bright)">🏛️ Tombada — não viaja</div>` : "";
    t.innerHTML = `<span class="sel-check">${marcada ? "✓" : ""}</span>
      <img src="${imgSrc(o)}"><div class="name">${o.titulo}</div><div class="sub">${o.artista}</div>${badge}`;
    t.addEventListener("click", ()=>{
      if(marcada){
        if(expoSetup.workIds.length === 1) return;          // ao menos uma
        expoSetup.workIds = expoSetup.workIds.filter(id=>id!==o.ownedId);
      } else expoSetup.workIds = [...expoSetup.workIds, o.ownedId];
      AudioFX.click(); renderExpoSetup();
    });
    workGrid.appendChild(t);
  });
  document.getElementById("sel-todas").addEventListener("click", ()=>{
    expoSetup.workIds = available.map(o=>o.ownedId); AudioFX.click(); renderExpoSetup();
  });
  document.getElementById("sel-limpar").addEventListener("click", ()=>{
    expoSetup.workIds = [available[0].ownedId]; AudioFX.click(); renderExpoSetup();
  });

  const modeArea = document.getElementById("expo-mode-area");
  let html = "";
  if(temMovel){
    html += `<strong style="font-size:13px;color:var(--parchment-dim)">PAÍS DE EXPOSIÇÃO${temFixa? " (para as obras móveis)" : ""}</strong><div id="expo-pick-country"></div>`;
    // sala dentro do país escolhido (padrão: uma sala sua, senão a intermediária)
    const salas = salasDoPais(expoSetup.country);
    if(!expoSetup.salaId || !expoSetup.salaId.startsWith(expoSetup.country + "#")){
      expoSetup.salaId = (salas.find(x=>x.dono) || salas[1]).id;
    }
    const sala = salaInfo(expoSetup.salaId);
    const classe = classeDe(State.reputation);
    const bloqueada5 = estrelas(sala.attrs) === 5 && classe < CLASSE_MIN_5_ESTRELAS;
    const risco = Math.round(riscoFurtoPeriodo(sala.attrs.seg, expoSetup.duration)*100);
    html += `
      <strong style="font-size:13px;color:var(--parchment-dim)">SALA EM ${expoSetup.country.toUpperCase()}</strong>
      <div class="salas-pick">
        ${salas.map(x=>`<button class="sala-mini ${x.id===expoSetup.salaId?'selected':''}" data-sala="${x.id}">
          <span class="sm-est">${estrelasTxt(estrelas(x.attrs))}</span>
          <b>${x.nome}</b>
          <small>${x.dono ? "Sua — sem aluguel" : fmtMoney(x.aluguel)+"/dia"} · seg. ${x.attrs.seg}%</small>
        </button>`).join("")}
      </div>
      ${fichaSalaHTML(sala)}
      ${bloqueada5 ? `<div class="cb-aviso">Salas 5★ exigem classe ${CLASSE_MIN_5_ESTRELAS}. Sua classe é ${classe} — escolha outra sala ou ganhe reputação.</div>` : ""}
      <label class="seguro-box ${sala.attrs.seg<50 && !expoSetup.seguro ? 'perigo' : ''}">
        <input type="checkbox" id="expo-seguro" ${expoSetup.seguro?"checked":""}>
        <span><b>Contratar seguro contra furto e avarias</b>
          <small>A partir de € 1.500, conforme o valor da obra, os dias e a segurança da sala. Sem seguro, uma obra furtada é perda total.</small></span>
        ${sala.attrs.seg < 50 ? `<span class="alerta-furto" title="Segurança abaixo de 50%">⚠️ Risco de furto ${risco}% no período</span>` : ""}
      </label>`;
    if(moveisSel.length > 1){
      const nCustom = moveisSel.filter(o=>expoSetup.overrides[o.ownedId]).length;
      html += `
        <div class="destinos-head">
          <strong style="font-size:13px;color:var(--parchment-dim)">CADA OBRA VAI PARA</strong>
          ${nCustom ? `<button class="btn btn-outline btn-sm" id="btn-reset-destinos">Redefinir todas para ${expoSetup.country}</button>` : ""}
        </div>
        <p class="sec-body" style="font-size:12px;color:var(--parchment-dim);margin:-2px 0 10px;">
          Por padrão todas seguem o país acima — troque individualmente para espalhar a coleção por vários países ao mesmo tempo.
        </p>
        <div id="expo-destinos">${moveisSel.map(o=>linhaDestinoObra(o)).join("")}</div>`;
    }
  }
  if(temFixa){
    const fixas = sel.filter(o=>o.fixa);
    html += `
      <div style="font-size:12.5px;color:var(--parchment-dim);margin:4px 0 10px;padding:9px 12px;border-left:2px solid var(--gold);background:rgba(201,161,59,0.06);">
        ${fixas.length>1 ? `${fixas.length} obras selecionadas são patrimônio tombado e ficam` : `"${fixas[0].titulo}" é patrimônio tombado e fica`}
        em <strong>${fixas[0].local || "seu local original"}</strong>. Para elas você organiza a visitação no próprio sítio histórico.
      </div>
      <strong style="font-size:13px;color:var(--parchment-dim)">TIPO DE ACORDO DE VISITAÇÃO</strong>
      <div id="expo-pick-agreement"></div>`;
  }
  modeArea.innerHTML = html;

  if(temMovel){
    const countryGrid = document.getElementById("expo-pick-country");
    Object.keys(COUNTRIES).forEach(c=>{
      const t = document.createElement("button");
      t.className = "pick-tile" + (c===expoSetup.country? " selected":"");
      t.innerHTML = `<div class="flag">${COUNTRIES[c].flag}</div><div class="name">${c}</div><div class="sub">ingresso €${COUNTRIES[c].ticket}</div>`;
      t.addEventListener("click", ()=>{ expoSetup.country = c; expoSetup.salaId = null; renderExpoSetup(); });
      countryGrid.appendChild(t);
    });
    document.querySelectorAll("[data-sala]").forEach(b=>b.addEventListener("click", ()=>{
      expoSetup.salaId = b.dataset.sala; AudioFX.click(); renderExpoSetup();
    }));
    const seg = document.getElementById("expo-seguro");
    if(seg) seg.addEventListener("change", ()=>{ expoSetup.seguro = seg.checked; renderExpoSetup(); });
    // destinos individuais (só existe a seção com 2+ obras móveis)
    document.querySelectorAll(".dr-pais").forEach(dsel=>dsel.addEventListener("change", ()=>{
      const id = Number(dsel.dataset.obra), pais = dsel.value;
      expoSetup.overrides[id] = { country: pais, salaId: salaPadraoPais(pais).id };
      AudioFX.click(); renderExpoSetup();
    }));
    document.querySelectorAll(".dr-sala").forEach(dsel=>dsel.addEventListener("change", ()=>{
      const id = Number(dsel.dataset.obra);
      const atual = destinoEfetivo(id);
      expoSetup.overrides[id] = { country: atual.country, salaId: dsel.value };
      AudioFX.click(); renderExpoSetup();
    }));
    document.querySelectorAll(".dr-reset").forEach(b=>b.addEventListener("click", ()=>{
      delete expoSetup.overrides[Number(b.dataset.obra)]; AudioFX.click(); renderExpoSetup();
    }));
    const resetTodas = document.getElementById("btn-reset-destinos");
    if(resetTodas) resetTodas.addEventListener("click", ()=>{
      expoSetup.overrides = {}; AudioFX.click(); renderExpoSetup();
    });
  }
  if(temFixa){
    const agGrid = document.getElementById("expo-pick-agreement");
    agGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:14px 0 20px;";
    Object.keys(AGREEMENT_TYPES).forEach(k=>{
      const a = AGREEMENT_TYPES[k];
      const t = document.createElement("button");
      t.className = "pick-tile" + (k===expoSetup.agreement? " selected":"");
      t.innerHTML = `<div class="flag">${a.icon}</div><div class="name">${k}</div>
        <div class="sub">~${a.groupSize} pessoas · €${a.ticket}</div>`;
      t.addEventListener("click", ()=>{ expoSetup.agreement = k; renderExpoSetup(); });
      agGrid.appendChild(t);
    });
  }

  document.querySelectorAll("[data-dur]").forEach(b=>{
    if(Number(b.dataset.dur)===expoSetup.duration) b.classList.add("selected");
    b.addEventListener("click", ()=>{ expoSetup.duration = Number(b.dataset.dur); renderExpoSetup(); });
  });
  document.getElementById("speed-slider").addEventListener("input", (e)=>{
    State.speedSecPerDay = Number(e.target.value);
    document.getElementById("speed-val").textContent = State.speedSecPerDay+"s";
  });

  updateCostBreakdown();
  document.getElementById("btn-start-expo").addEventListener("click", startExhibition);
  const voltar = document.getElementById("btn-voltar-painel");
  if(voltar) voltar.addEventListener("click", ()=>{ AudioFX.click(); renderExpoLive(); });

}

function linhaDestinoObra(o){
  const d = destinoEfetivo(o.ownedId);
  const overridden = !!expoSetup.overrides[o.ownedId];
  const salas = salasDoPais(d.country);
  const salaAtual = salaInfo(d.salaId) || salaPadraoPais(d.country);
  const classe = classeDe(State.reputation);
  const bloqueada = estrelas(salaAtual.attrs) === 5 && classe < CLASSE_MIN_5_ESTRELAS;
  return `<div class="destino-row">
    <img src="${imgSrc(o)}" alt="">
    <div class="dr-info"><b>${o.titulo}</b><small>${o.artista}</small></div>
    <select class="dr-pais" data-obra="${o.ownedId}">
      ${Object.keys(COUNTRIES).map(c=>`<option value="${c}" ${c===d.country?"selected":""}>${COUNTRIES[c].flag} ${c}</option>`).join("")}
    </select>
    <select class="dr-sala" data-obra="${o.ownedId}">
      ${salas.map(s=>`<option value="${s.id}" ${s.id===salaAtual.id?"selected":""}>${estrelasTxt(estrelas(s.attrs))} ${s.nome}</option>`).join("")}
    </select>
    ${overridden ? `<button class="dr-reset" data-obra="${o.ownedId}" title="Voltar ao padrão">↺</button>` : `<span class="dr-padrao">padrão</span>`}
    ${bloqueada ? `<span class="dr-alerta">🔒 classe ${CLASSE_MIN_5_ESTRELAS}+</span>` : ""}
  </div>`;
}

// Custo e receita estimada de UMA obra, para o destino/acordo escolhidos
function custoDaObra(work){
  const days = expoSetup.duration;
  if(work.fixa){
    // Obra tombada: sem transporte nem seguro de trânsito. Custos de operação
    // da visitação no sítio — guias, logística e taxa de conservação.
    const ag = AGREEMENT_TYPES[expoSetup.agreement] || Object.values(AGREEMENT_TYPES)[0];
    const operacao = ag.sessionCost * days;
    const conservacao = Math.round(Market.valueOf(work) * 0.000012 * days);
    const guias = 140 * days;
    // estimativa: 2 grupos por dia, na média
    const receitaEstim = Math.round(ag.groupSize * 2 * ag.ticket * PLAYER_SHARE) * days;
    return { work, days, fixa:true, pais:"Brasil", ag, operacao, conservacao, guias,
             total: operacao + conservacao + guias, receitaEstim };
  }
  const d = destinoEfetivo(work.ownedId);
  const c = COUNTRIES[d.country];
  const sala = salaInfo(d.salaId || salaId(d.country, 1));
  const valor = Market.valueOf(work);
  // seguro: € 1.500 fixos + parcela pelo valor, pelos dias e pelo risco da sala
  const seguro = expoSetup.seguro
    ? Math.round((1500 + valor * 0.00015 * days * (1.6 - sala.attrs.seg/100)) / 10) * 10 : 0;
  const aluguel = sala.dono ? 0 : sala.aluguel * days;
  const equipe = c.staff * days;
  const transporte = c.transport;
  const n = estrelas(sala.attrs);
  const bonusMedio = (ESTRELA_BONUS[n][0] + ESTRELA_BONUS[n][1]) / 2;
  const receitaEstim = Math.round(receitaDiariaBase(work, c, sala) * (1 + bonusMedio)) * days;
  return { work, days, fixa:false, pais:d.country, sala, seguro, aluguel, equipe, transporte,
           total: seguro + aluguel + equipe + transporte, receitaEstim };
}

// Custo do conjunto selecionado
function computeCost(){
  const obras = expoSetup.workIds
    .map(id=>State.collection.find(o=>o.ownedId===id))
    .filter(o=>o && !o.exhibiting);
  if(!obras.length) return null;
  const itens = obras.map(custoDaObra);
  return {
    itens,
    total: itens.reduce((s,i)=>s+i.total, 0),
    receita: itens.reduce((s,i)=>s+i.receitaEstim, 0),
  };
}

function updateCostBreakdown(){
  const info = computeCost();
  const box = document.getElementById("cost-breakdown");
  if(!info || !box) return;
  const lucro = info.receita - info.total;

  if(info.itens.length === 1){
    const i = info.itens[0];
    const linhas = i.fixa ? `
      <div><span>Operação da visitação (${i.ag.freqLabel})</span><span>${fmtMoney(i.operacao)}</span></div>
      <div><span>Taxa de conservação do patrimônio</span><span>${fmtMoney(i.conservacao)}</span></div>
      <div><span>Guias e monitores</span><span>${fmtMoney(i.guias)}</span></div>` : `
      <div><span>Transporte da obra</span><span>${fmtMoney(i.transporte)}</span></div>
      <div><span>Aluguel da sala (${i.days} dia(s))</span><span>${i.sala.dono ? "sala sua" : fmtMoney(i.aluguel)}</span></div>
      <div><span>Seguro contra furto</span><span>${i.seguro ? fmtMoney(i.seguro) : "<span style='color:var(--rose)'>sem seguro</span>"}</span></div>
      <div><span>Equipe / curadoria</span><span>${fmtMoney(i.equipe)}</span></div>`;
    box.innerHTML = linhas + `
      <div class="total"><span>Custo total antecipado</span><span>${fmtMoney(i.total)}</span></div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line);display:flex;justify-content:space-between;">
        <span style="color:var(--parchment-dim)">Receita estimada (${i.work.tier_label})</span><span>${fmtMoney(i.receitaEstim)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;color:${lucro>=0?'var(--sage)':'var(--rose)'}">
        <span>Resultado projetado</span><span>${lucro>=0?'+':''}${fmtMoney(lucro)}</span></div>`;
  } else {
    // várias obras: uma linha por obra + totais
    box.innerHTML = `
      <div class="cb-head"><span>Obra</span><span>Destino</span><span>Custo</span><span>Receita est.</span></div>
      ${info.itens.map(i=>`
        <div class="cb-linha">
          <span class="cb-obra"><img src="${imgSrc(i.work)}" alt="">${i.work.titulo}</span>
          <span>${i.fixa ? "🏛️ "+expoSetup.agreement : COUNTRIES[i.pais].flag+" "+i.pais+" · "+i.sala.nome}</span>
          <span>${fmtMoney(i.total)}</span>
          <span>${fmtMoney(i.receitaEstim)}</span>
        </div>`).join("")}
      <div class="total"><span>Custo total antecipado (${info.itens.length} obras)</span><span>${fmtMoney(info.total)}</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:var(--parchment-dim)">Receita estimada total</span><span>${fmtMoney(info.receita)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;color:${lucro>=0?'var(--sage)':'var(--rose)'}">
        <span>Resultado projetado</span><span>${lucro>=0?'+':''}${fmtMoney(lucro)}</span></div>`;
  }
  const falta = info.total - State.cash;
  if(falta > 0) box.insertAdjacentHTML("beforeend",
    `<div class="cb-aviso">Saldo insuficiente: faltam ${fmtMoney(falta)}. Tire alguma obra da seleção.</div>`);
  const btn = document.getElementById("btn-start-expo");
  if(btn) btn.disabled = falta > 0 || salaBloqueada(info);
}

// sala 5★ exige classe mínima de reputação
function salaBloqueada(info){
  return info.itens.some(i=>!i.fixa && estrelas(i.sala.attrs) === 5 && classeDe(State.reputation) < CLASSE_MIN_5_ESTRELAS);
}

// Receita diária esperada de uma obra numa sala, antes do bônus de estrelas
function receitaDiariaBase(work, c, sala){
  const draw = TIER_DRAW[work.tier] || 1;
  const tmult = TIER_TICKET_MULT[work.tier] || 1;
  const capacidade = 0.55 + (sala.attrs.cap/100) * 0.65;          // 50% -> 0,88 · 100% -> 1,2
  return c.visitors * draw * (1 + State.reputation/200) * capacidade * c.ticket * tmult * PLAYER_SHARE;
}

function startExhibition(){
  const info = computeCost();
  if(!info || State.cash < info.total || salaBloqueada(info)) return;
  State.cash -= info.total;

  const criadas = [];
  let voos = 0;
  info.itens.forEach((it)=>{
    const workRef = State.collection.find(o=>o.ownedId===it.work.ownedId);
    workRef.exhibiting = true;
    const nova = {
      id: "ex" + (State.nextExpoId++),
      ownedId: workRef.ownedId,
      work: workRef,
      country: it.pais,
      fixa: !!workRef.fixa,
      agreement: workRef.fixa ? expoSetup.agreement : null,
      salaId: workRef.fixa ? null : it.sala.id,
      segurado: workRef.fixa ? true : it.seguro > 0,
      durationDays: it.days,
      dayIndex: 0, revenueAccum: 0, visitorsAccum: 0, diaReceita: 0, diaVisitantes: 0,
      costTotal: it.total,
      repDelta: 0, log: [], tickProgress: 0, paused: false, ended: false,
    };
    if(!nova.fixa){
      const capacidade = 0.55 + (it.sala.attrs.cap/100) * 0.65;
      nova.diaReceita = Math.round(it.receitaEstim / it.days);
      nova.diaVisitantes = Math.round((COUNTRIES[it.pais].visitors||0) * (TIER_DRAW[workRef.tier]||1) * (1 + State.reputation/200) * capacidade);
    }
    State.exhibitions.push(nova);
    criadas.push(nova);
  });
  // Obras que saem do mesmo lugar para o mesmo museu viajam juntas, num só
  // transporte; a contagem de dias de cada uma só começa quando ela chega.
  const grupos = {};
  criadas.filter(e=>!e.fixa).forEach(e=>{
    const de = localDaObra(e.work), para = cidadeDaExposicao(e);
    const k = `${de.pais}|${de.cidade}>${para.pais}|${para.cidade}`;
    (grupos[k] = grupos[k] || { de, para, expos:[] }).expos.push(e);
  });
  Object.values(grupos).forEach(g=>{
    const voo = embarcarObras(g.expos.map(e=>e.work), g.de, g.para, "ida", voos * 550);
    if(!voo) return;
    voos++;
    g.expos.forEach(e=>{
      e.chegada = voo.inicio + voo.duracao;
      addFeed(e, "info", "Transporte", `${voo.aereo ? "✈" : "🚚"} Obra despachada: ${g.de.cidade} → ${g.para.cidade}${g.expos.length>1 ? ` (junto com mais ${g.expos.length-1})` : ""}.`);
    });
  });
  expoSetup.workIds = [];
  updateHUD();
  AudioFX.click();
  State.expoShowSetup = false;

  // uma negociação por leva (não uma por obra, para não empilhar cartões)
  if(criadas.length && typeof negociarExposicao === "function"){
    const primeira = criadas.find(e=>!e.fixa) || criadas[0];
    if(!primeira.fixa) negociarExposicao(primeira.country, salaInfo(primeira.salaId).cidade);
  }
  if(voos){
    switchView("mapa");
    const v = State.voos[State.voos.length-1];
    Mapa.focarRota(v.a, v.b);                // o mapa acompanha o voo
    toast(voos === 1
      ? `✈ ${criadas.find(e=>e.chegada).work.titulo} embarcou rumo a ${v.para}`
      : `✈ ${voos} obras embarcaram rumo a ${v.para}`);
  } else {
    switchView("exposicao");
  }
  ensureExpoRunning();
}

/* ----------------------------------------------------------------------------
   VOOS — transporte das obras, animado no mapa
   ---------------------------------------------------------------------------- */
// Onde a obra fica guardada: na sede; sem sede, na principal cidade do país dela
function localDaObra(obra){
  return State.sede ? { ...State.sede } : { pais:obra.pais, cidade:cidadePrincipal(obra.pais) };
}

// Distância real (km) entre dois pontos [lat, lng]
function kmEntre(a, b){
  const R = 6371, rad = d=>d*Math.PI/180;
  const dLat = rad(b[0]-a[0]), dLng = rad(b[1]-a[1]);
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
// Aeroporto aproximado: um ponto ~20 km fora do centro, do lado da viagem
function aeroportoDe(p, rumo){
  const dLat = rumo[0]-p[0], dLng = rumo[1]-p[1], d = Math.hypot(dLat, dLng) || 1;
  return [p[0] + dLat/d*0.16 + 0.05, p[1] + dLng/d*0.2];
}

// Uma viagem pode levar várias obras. de/para = { pais, cidade }.
// Até 300 km: vai de caminhão. Acima: carro -> avião -> carro.
function embarcarObras(obras, de, para, tipo, atrasoMs = 0){
  if(!obras.length || !de || !para || (de.pais===para.pais && de.cidade===para.cidade)) return null;
  const a = coordCidade(de.pais, de.cidade), b = coordCidade(para.pais, para.cidade);
  if(!a || !b) return null;
  const km = kmEntre(a, b);
  let pernas;
  if(km < 300){
    pernas = [{ modo:"carro", a, b, dur: Math.round(2600 + km*9) }];
  } else {
    const aa = aeroportoDe(a, b), ab = aeroportoDe(b, a);
    pernas = [
      { modo:"carro", a, b:aa, dur:1500 },
      { modo:"aviao", a:aa, b:ab, dur: Math.round(3800 + Math.min(km, 9000) * 0.55) },
      { modo:"carro", a:ab, b, dur:1700 },
    ];
  }
  let t = 0; pernas.forEach(p=>{ p.ini = t; t += p.dur; });
  const voo = {
    id: "v" + Date.now() + Math.floor(Math.random()*1000),
    de: de.cidade, para: para.cidade, dePais: de.pais, paraPais: para.pais, tipo, a, b, km: Math.round(km),
    obras: obras.map(o=>({ titulo:o.titulo, imagem:imgSrc(o) })),
    pernas, aereo: pernas.some(p=>p.modo==="aviao"),
    inicio: Date.now() + atrasoMs, duracao: t,
  };
  voo.obra = voo.obras[0];
  State.voos.push(voo);
  if(!atrasoMs) (AudioFX.decolagem ? AudioFX.decolagem() : AudioFX.click());
  iniciarAnimacaoVoos();
  return voo;
}
function embarcarObra(obra, de, para, tipo, atrasoMs = 0){ return embarcarObras([obra], de, para, tipo, atrasoMs); }

// Frete e imposto de importação ao comprar uma obra, até a sua sede
function logisticaCompra(obra, origemPais, preco){
  const origem = { pais:origemPais, cidade: origemPais===obra.pais ? cidadePrincipal(origemPais) : casaLeilaoCidade(origemPais) };
  if(!State.sede) return { origem, destino:null, frete:0, imposto:0, total:0 };
  const destino = { ...State.sede };
  const mesmaCidade = origem.pais===destino.pais && origem.cidade===destino.cidade;
  const intercontinental = contDoPais(origem.pais) !== contDoPais(destino.pais);
  const frete = mesmaCidade ? 0 : Math.round(COUNTRIES[origem.pais].transport * (intercontinental ? 2.2 : 1) / 10) * 10;
  const imposto = origem.pais !== destino.pais ? Math.round(preco * 0.015 / 10) * 10 : 0;   // 1,5% ao cruzar fronteira
  return { origem, destino, frete, imposto, total: frete + imposto };
}

// Depois de pagar: a obra voa da origem até a sede
function despacharCompra(obra, logistica){
  if(!logistica.destino) return;
  const voo = embarcarObra(obra, logistica.origem, logistica.destino, "compra");
  if(voo) toast(`✈ ${obra.titulo} a caminho da sua sede em ${logistica.destino.cidade}`);
}

// Avisos empilham numa coluna em vez de nascerem todos no mesmo ponto
// (vários podem chegar juntos: compra + novo artista no álbum + missão).
function toast(msg){
  let pilha = document.getElementById("toast-pilha");
  if(!pilha){ pilha = document.createElement("div"); pilha.id = "toast-pilha"; document.body.appendChild(pilha); }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  pilha.appendChild(t);
  while(pilha.children.length > 4) pilha.firstChild.remove();   // no máximo 4 na tela
  requestAnimationFrame(()=>t.classList.add("show"));
  setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(), 400); }, 3600);
}

/* ----------------------------------------------------------------------------
   EXPOSIÇÃO — AO VIVO
   O relógio da exposição roda no estado, não na tela: o jogador pode navegar
   para Coleção/Aquisições e voltar sem que a contagem pare ou reinicie.
   ---------------------------------------------------------------------------- */
let expoTimerHandle = null;

// Painel com todas as exposições em andamento, lado a lado.
function renderExpoLive(){
  const el = document.getElementById("view-exposicao");
  const ativas = State.exhibitions.filter(e=>!e.ended);
  const disponiveis = State.collection.filter(o=>!o.exhibiting).length;

  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Galeria Mundo</h1>
      <p class="page-sub">${ativas.length} exposição(ões) em andamento${disponiveis? ` · ${disponiveis} obra(s) livre(s) na coleção` : ""}</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">
        <button class="btn btn-gold" id="btn-nova-expo" ${disponiveis? "" : "disabled"}>+ Nova exposição</button>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--parchment-dim)">
          <span>1 dia =</span>
          <input type="range" min="2" max="20" value="${State.speedSecPerDay}" id="expo-speed-slider">
          <span id="expo-speed-val">${State.speedSecPerDay}s</span>
        </div>
      </div>
      ${ativas.length ? `<div class="expo-barra">
        <span class="chips-mini">
          <button class="chip ${Config.v.vistaExpo==="compacta"?"selected":""}" data-vista="compacta">Compacta</button>
          <button class="chip ${Config.v.vistaExpo==="detalhada"?"selected":""}" data-vista="detalhada">Detalhada</button>
        </span>
        ${Config.v.vistaExpo==="compacta" ? `<button class="btn btn-outline btn-sm" id="expo-abrir-todas">${ativas.every(e=>ExpoUI.abertas.has(e.id)) ? "Recolher tudo" : "Expandir tudo"}</button>` : ""}
      </div>` : ""}
      <div id="expo-cards" class="${Config.v.vistaExpo==="compacta" ? "expo-lista" : "expo-grade"}"></div>
    </div>`;

  const wrap = document.getElementById("expo-cards");
  ativas.forEach(ex=>wrap.appendChild(buildExpoCard(ex)));
  document.querySelectorAll("[data-vista]").forEach(b=>b.addEventListener("click", ()=>{
    Config.definir("vistaExpo", b.dataset.vista); AudioFX.click(); renderExpoLive();
  }));
  document.getElementById("expo-abrir-todas")?.addEventListener("click", ()=>{
    const todas = ativas.every(e=>ExpoUI.abertas.has(e.id));
    ativas.forEach(e=> todas ? ExpoUI.abertas.delete(e.id) : ExpoUI.abertas.add(e.id));
    AudioFX.click(); renderExpoLive();
  });

  document.getElementById("btn-nova-expo").addEventListener("click", ()=>{
    AudioFX.click();
    State.expoShowSetup = true;
    renderExpoSetup();
  });

  document.getElementById("expo-speed-slider").addEventListener("input", (evt)=>{
    State.speedSecPerDay = Number(evt.target.value);
    document.getElementById("expo-speed-val").textContent = State.speedSecPerDay + "s";
  });
  ensureExpoRunning();
}

const ExpoUI = { abertas: new Set() };

function localExpo(ex){ return ex.fixa ? `${ex.agreement}` : `${ex.country}${ex.salaId ? " · " + salaInfo(ex.salaId).cidade : ""}`; }

// ligações comuns às duas vistas: pausar, encerrar, mudo, agenda
function ligarAcoesExpo(card, ex){
  wireAgenda(card, ex.ownedId, ()=>renderExpoLive());
  const pausa = card.querySelector(`[data-pause="${ex.id}"]`);
  const rotuloPausa = ()=> card.classList.contains("expo-row") ? (ex.paused ? "▶" : "⏸") : (ex.paused ? "▶ Retomar" : "⏸ Pausar");
  pausa.addEventListener("click", ()=>{
    ex.paused = !ex.paused;
    pausa.textContent = rotuloPausa();
    pausa.title = ex.paused ? "Retomar" : "Pausar";
    if(!ex.paused) ensureExpoRunning();
    AudioFX.click();
  });
  card.querySelector(`[data-end="${ex.id}"]`).addEventListener("click", ()=>{ AudioFX.click(); finalizeExhibition(ex, "completed"); });
  const mudo = card.querySelector(`[data-mudo="${ex.id}"]`);
  mudo.addEventListener("click", ()=>{
    const ligado = alternarComentarios(ex);
    mudo.textContent = ligado ? "🔊" : "🔇";
    mudo.title = ligado ? "Comentários falados ligados — clique para silenciar" : "Comentários silenciados — clique para ligar";
    mudo.classList.toggle("off", !ligado);
    AudioFX.click();
  });
}
function botaoMudoHTML(ex){
  const ligado = comentariosFalados(ex);
  const global = !Config.v.audioComentarios;
  return `<button class="btn-icone ${ligado?"":"off"}" data-mudo="${ex.id}" title="${global ? "Desligados nas Configurações" : ligado ? "Comentários falados ligados — clique para silenciar" : "Comentários silenciados — clique para ligar"}">${ligado?"🔊":"🔇"}</button>`;
}

function buildExpoCard(ex){
  return Config.v.vistaExpo === "compacta" ? buildExpoLinha(ex) : buildExpoCardDetalhado(ex);
}

// Vista compacta: uma linha por exposição; o feed e a agenda abrem sob demanda
function buildExpoLinha(ex){
  const c = COUNTRIES[ex.country];
  const aberta = ExpoUI.abertas.has(ex.id);
  const card = document.createElement("div");
  card.className = "panel expo-row" + (aberta ? " aberta" : "");
  card.dataset.exid = ex.id;
  const totalMs = State.speedSecPerDay * 1000;
  card.innerHTML = `
    <div class="er-main">
      <img class="er-thumb" src="${imgSrc(ex.work)}" alt="">
      <div class="er-info">
        <div class="er-tit">${ex.fixa ? "🏛️" : c.flag} ${ex.work.titulo}</div>
        <div class="er-sub">${ex.work.artista} · ${localExpo(ex)}</div>
        <div class="expo-status" data-status="${ex.id}">${statusExpo(ex)}</div>
      </div>
      <div class="er-prog"><div class="er-barra"><span data-bar="${ex.id}" style="width:${Math.min(100, ((ex.dayIndex + (ex.tickProgress||0)/totalMs) / ex.durationDays)*100).toFixed(1)}%"></span></div>
        <small><span data-day="${ex.id}">${ex.dayIndex}</span>/${ex.durationDays} dias</small></div>
      <div class="er-num"><b data-rev="${ex.id}">${fmtMoney(ex.revenueAccum)}</b><small><span data-vis="${ex.id}">${ex.visitorsAccum}</span> pessoas</small></div>
      <div class="er-btns">
        <button class="btn-icone" data-pause="${ex.id}" title="${ex.paused ? "Retomar" : "Pausar"}">${ex.paused ? "▶" : "⏸"}</button>
        ${botaoMudoHTML(ex)}
        <button class="btn-icone er-seta" data-abrir="${ex.id}" title="Detalhes">${aberta ? "▴" : "▾"}</button>
      </div>
    </div>
    <div class="er-det">
      <div class="er-rep">Reputação: <b data-rep="${ex.id}">${ex.repDelta>=0?"+":""}${ex.repDelta}</b></div>
      <div class="feed-sm" data-feed="${ex.id}"></div>
      ${!ex.fixa ? agendaHTML(ex.ownedId, "Quando esta terminar, mande para:") : ""}
      <div class="action-row" style="margin-top:8px;"><button class="btn btn-danger btn-sm" data-end="${ex.id}">Encerrar agora</button></div>
    </div>`;
  const feed = card.querySelector(`[data-feed="${ex.id}"]`);
  ex.log.slice(-6).forEach(it=>{
    const d = document.createElement("div");
    d.className = "feed-item " + it.cls;
    d.innerHTML = `<div class="who">${it.who}</div>${it.text}`;
    feed.prepend(d);
  });
  card.querySelector(`[data-abrir="${ex.id}"]`).addEventListener("click", (evt)=>{
    const abre = !card.classList.contains("aberta");
    card.classList.toggle("aberta", abre);
    abre ? ExpoUI.abertas.add(ex.id) : ExpoUI.abertas.delete(ex.id);
    evt.currentTarget.textContent = abre ? "▴" : "▾";
    AudioFX.click();
  });
  ligarAcoesExpo(card, ex);
  return card;
}

function buildExpoCardDetalhado(ex){
  const c = COUNTRIES[ex.country];
  const card = document.createElement("div");
  card.className = "panel expo-card";
  card.dataset.exid = ex.id;
  const titulo = ex.fixa ? `🏛️ ${ex.work.titulo}` : `${c.flag} ${ex.work.titulo}`;
  const local = ex.fixa ? `${ex.agreement}` : `${ex.country}`;
  card.innerHTML = `
    <div class="expo-card-head">
      <img src="${imgSrc(ex.work)}" alt="">
      <div>
        <div class="expo-card-title">${titulo}</div>
        <div class="expo-card-sub">${ex.work.artista} · ${local}</div>
        <div class="expo-status" data-status="${ex.id}">${statusExpo(ex)}</div>
      </div>
    </div>
    <div class="expo-card-body">
      <div class="expo-ring-sm">
        <svg viewBox="0 0 100 100">
          <circle class="ring-track" cx="50" cy="50" r="42"></circle>
          <circle class="ring-fill" data-ring="${ex.id}" cx="50" cy="50" r="42" stroke-dasharray="264" stroke-dashoffset="264"></circle>
        </svg>
        <div class="expo-ring-lbl"><span class="num" data-day="${ex.id}">${ex.dayIndex}</span><span class="unit">/${ex.durationDays}d</span></div>
      </div>
      <div class="expo-card-stats">
        <div><span class="k">Receita</span><span class="v" data-rev="${ex.id}">${fmtMoney(ex.revenueAccum)}</span></div>
        <div><span class="k">Público</span><span class="v" data-vis="${ex.id}">${ex.visitorsAccum}</span></div>
        <div><span class="k">Reputação</span><span class="v" data-rep="${ex.id}">${ex.repDelta>=0?"+":""}${ex.repDelta}</span></div>
      </div>
    </div>
    <div class="feed-sm" data-feed="${ex.id}"></div>
    ${!ex.fixa ? agendaHTML(ex.ownedId, "Quando esta terminar, mande para:") : ""}
    <div class="action-row" style="margin-top:10px;">
      <button class="btn btn-outline btn-sm" data-pause="${ex.id}">${ex.paused? "▶ Retomar" : "⏸ Pausar"}</button>
      ${botaoMudoHTML(ex)}
      <button class="btn btn-danger btn-sm" data-end="${ex.id}">Encerrar agora</button>
    </div>`;

  const feed = card.querySelector(`[data-feed="${ex.id}"]`);
  ex.log.slice(-6).forEach(it=>{
    const d = document.createElement("div");
    d.className = "feed-item " + it.cls;
    d.innerHTML = `<div class="who">${it.who}</div>${it.text}`;
    feed.prepend(d);
  });

  ligarAcoesExpo(card, ex);
  paintExpoProgress(ex);
  return card;
}

// Valores "hoje" em tempo real: sobem suavemente conforme o dia avança (o
// alvo é o valor do dia mais recente já conhecido — real, uma vez que o
// primeiro dia fecha; estimado, enquanto o primeiro dia ainda está em curso).
// Quando o dia vira, o placar assume o valor real (que pode variar um pouco)
// e recomeça a subir rumo ao próximo alvo.
function valoresHojeAoVivo(ex){
  const totalMs = Math.max(1000, (State.speedSecPerDay||6) * 1000);
  const emVoo = ex.chegada && Date.now() < ex.chegada;
  const frac = emVoo ? 0 : Math.min(1, (ex.tickProgress||0) / totalMs);
  return {
    receita: Math.round((ex.diaReceita||0) * frac),
    visitantes: Math.round((ex.diaVisitantes||0) * frac),
  };
}

// Markup compacto da agenda de uma obra: fila atual + formulário para
// adicionar mais uma parada. Reaproveitado no cartão de exposição (o que vem
// depois desta) e na ficha da Coleção (montar um roteiro antes mesmo de começar).
function agendaHTML(ownedId, titulo){
  const fila = filaAgenda(ownedId);
  const longa = fila.length > 4;
  return `<div class="agenda-box">
    <div class="agenda-titulo">📅 ${titulo}</div>
    ${longa ? `<div class="agenda-resumo"><span class="ar-flags">${fila.slice(0,16).map(l=>COUNTRIES[l.country].flag).join("")}${fila.length>16?"…":""}</span>
      <b>${fila.length} paradas</b><button class="btn btn-outline btn-sm" data-toggle-fila="${ownedId}">Ver e editar</button></div>` : ""}
    ${fila.length ? `<div class="agenda-fila ${longa ? "recolhida" : ""}">${fila.map((leg,i)=>`
      <span class="agenda-chip">${COUNTRIES[leg.country].flag} ${leg.country} · ${leg.duration}d
        <button data-rm-agenda="${ownedId}:${i}" title="Remover">✕</button></span>`).join("")}</div>` : ""}
    <div class="agenda-form">
      <select class="agenda-pais" data-agenda-pais="${ownedId}">
        ${Object.keys(COUNTRIES).map(c=>`<option value="${c}">${COUNTRIES[c].flag} ${c}</option>`).join("")}
      </select>
      <select class="agenda-dur" data-agenda-dur="${ownedId}">
        <option value="1">1 dia</option><option value="30" selected>30 dias</option>
      </select>
      <label class="agenda-seg"><input type="checkbox" data-agenda-seg="${ownedId}" checked> seguro</label>
      <button class="btn btn-outline btn-sm" data-add-agenda="${ownedId}">+ Adicionar parada</button>
    </div>
  </div>`;
}

function wireAgenda(container, ownedId, aoMudar){
  container.querySelectorAll("[data-toggle-fila]").forEach(b=>b.addEventListener("click", ()=>{
    const fila = b.closest(".agenda-box").querySelector(".agenda-fila");
    const fechada = fila.classList.toggle("recolhida");
    b.textContent = fechada ? "Ver e editar" : "Recolher";
    AudioFX.click();
  }));
  container.querySelectorAll(`[data-rm-agenda]`).forEach(b=>b.addEventListener("click", ()=>{
    const [id, i] = b.dataset.rmAgenda.split(":");
    removerLegAgenda(Number(id), Number(i));
    AudioFX.click(); aoMudar();
  }));
  if(ownedId == null) return;          // sem obra específica: só os botões "✕" acima
  const btn = container.querySelector(`button[data-add-agenda="${ownedId}"]`);
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    const pais = container.querySelector(`select[data-agenda-pais="${ownedId}"]`)?.value;
    if(!SALA_CIDADES[pais]) return;      // país inválido: não agenda nada
    const dur = Number(container.querySelector(`[data-agenda-dur="${ownedId}"]`).value);
    const seguro = container.querySelector(`[data-agenda-seg="${ownedId}"]`).checked;
    agendarLeg(ownedId, { country: pais, salaId: salaPadraoPais(pais).id, duration: dur, seguro });
    AudioFX.click();
    toast(`📅 Adicionado: ${pais} por ${dur} dia(s)`);
    aoMudar();
    processarAgenda();   // se a obra já estiver livre, começa na hora
  });
}

function statusExpo(ex){
  if(ex.chegada && Date.now() < ex.chegada){
    const seg = Math.ceil((ex.chegada - Date.now())/1000);
    return `✈ Em voo para ${ex.country} · pousa em ${seg}s`;
  }
  return ex.paused ? "⏸ Pausada" : "● Em exibição";
}

// Desenha o anel de uma exposição — seguro chamar a qualquer momento.
function paintExpoProgress(ex){
  if(!ex) return;
  const totalMs = State.speedSecPerDay * 1000;
  const frac = Math.min((ex.tickProgress||0)/totalMs, 1);
  const ring = document.querySelector(`[data-ring="${ex.id}"]`);
  if(ring) ring.setAttribute("stroke-dashoffset", String(264*(1-frac)));
  const barra = document.querySelector(`[data-bar="${ex.id}"]`);
  if(barra) barra.style.width = Math.min(100, ((ex.dayIndex + frac) / ex.durationDays) * 100).toFixed(1) + "%";
}

// Um único relógio move todas as exposições ativas.
function ensureExpoRunning(){
  if(expoTimerHandle) return;
  if(!State.exhibitions.some(e=>!e.ended)) return;
  const stepMs = 100;
  expoTimerHandle = setInterval(()=>{
    const ativas = State.exhibitions.filter(e=>!e.ended);
    if(!ativas.length){ stopExpoClock(); return; }
    ativas.forEach(e=>{
      const st = document.querySelector(`[data-status="${e.id}"]`);
      if(st) st.textContent = statusExpo(e);
      if(e.paused) return;
      if(e.chegada && Date.now() < e.chegada) return;   // ainda em trânsito
      if(e.chegada && !e.pousou){
        e.pousou = true;
        addFeed(e, "ok", "Transporte", `Obra pousou em ${e.country} e foi montada na galeria.`);
      }
      e.tickProgress = (e.tickProgress||0) + stepMs;
      paintExpoProgress(e);
      if(e.tickProgress >= State.speedSecPerDay*1000){
        e.tickProgress = 0;
        advanceExpoDay(e);
      }
    });
  }, stepMs);
}

function stopExpoClock(){
  clearInterval(expoTimerHandle);
  expoTimerHandle = null;
}

function advanceExpoDay(ex){
  if(!ex || ex.ended) return;
  ex.dayIndex++;
  const c = COUNTRIES[ex.country];

  let visitors, revenue, knowledgeGain = KNOWLEDGE_PER_DAY;
  if(ex.fixa){
    // Visitação no sítio: o público vem em grupos agendados, com tamanho e
    // preço de ingresso definidos pelo tipo de acordo. Turmas escolares rendem
    // menos dinheiro, mas geram bem mais conhecimento.
    const ag = AGREEMENT_TYPES[ex.agreement] || Object.values(AGREEMENT_TYPES)[0];
    const groups = 1 + Math.floor(Math.random()*3);
    visitors = Math.round(ag.groupSize * groups * (0.85 + Math.random()*0.3));
    revenue = Math.round(visitors * ag.ticket * PLAYER_SHARE);
    knowledgeGain = ag.knowledgeBonus;
  } else {
    const sala = salaInfo(ex.salaId || salaId(ex.country, 1));
    const draw = TIER_DRAW[ex.work.tier] || 1;
    const tmult = TIER_TICKET_MULT[ex.work.tier] || 1;
    const capacidade = 0.55 + (sala.attrs.cap/100) * 0.65;
    visitors = Math.round(c.visitors * draw * (1 + State.reputation/200) * capacidade * (0.8 + Math.random()*0.4));
    // bônus da sala: sorteado na faixa das estrelas
    const [bmin, bmax] = ESTRELA_BONUS[estrelas(sala.attrs)];
    const bonus = bmin + Math.random()*(bmax - bmin);
    revenue = Math.round(visitors * c.ticket * tmult * PLAYER_SHARE * (1 + bonus));
    ex.bonusAccum = (ex.bonusAccum||0) + Math.round(revenue - revenue/(1+bonus));
    // climatização ruim desgasta a obra (e o valor de mercado cai junto)
    if(sala.attrs.clima < 65){
      const perda = (65 - sala.attrs.clima) / 65 * 0.6;
      ex.work.conservacao = Math.max(20, (ex.work.conservacao ?? 100) - perda);
      if(Math.floor((ex.work.conservacao+perda)/5) !== Math.floor(ex.work.conservacao/5))
        addFeed(ex, "bad", "Conservação", `A climatização da sala está desgastando a obra: conservação em ${Math.round(ex.work.conservacao)}%.`);
    }
    ex._sala = sala;
  }
  ex.revenueAccum += revenue;
  ex.visitorsAccum += visitors;
  ex.diaReceita = revenue;         // do dia que acabou de fechar — é o que os rótulos "hoje" mostram
  ex.diaVisitantes = visitors;
  State.cash += revenue;
  State.knowledge += knowledgeGain;
  ex.knowledgeAccum = (ex.knowledgeAccum || 0) + knowledgeGain;

  AudioFX.tick();
  addFeed(ex, "info", "Dia " + ex.dayIndex, `${visitors} visitantes · +${fmtMoney(revenue)} em receita`);
  Market.tickDay();   // o tempo da exposição também é tempo de mercado

  // Avaliações do público: obra atraente em sala bem iluminada gera elogios;
  // iluminação fraca gera críticas (e a mais comum é justamente sobre a luz).
  const ilum = ex._sala ? ex._sala.attrs.ilum : 70;
  const atr = atributosObra(ex.work).atratividade;
  const pElogio = 0.05 + 0.09 * (atr/100) * (ilum/100);
  const pCritica = 0.03 + 0.20 * Math.max(0, (55 - ilum)/55);
  const roll = Math.random();
  if(roll < pElogio){
    const line = CRITIC_LINES.elogio[Math.floor(Math.random()*CRITIC_LINES.elogio.length)];
    ex.repDelta += 2; State.reputation = Math.min(100, State.reputation+2);
    speakEvent(ex, c, line, "ok");
    AudioFX.applause();
  } else if(roll < pElogio + pCritica){
    const sobreLuz = ilum < 55 && Math.random() < 0.6;
    const line = sobreLuz ? "A iluminação da sala prejudica um pouco a obra."
      : CRITIC_LINES.critica[Math.floor(Math.random()*CRITIC_LINES.critica.length)];
    ex.repDelta -= 2; State.reputation = Math.max(0, State.reputation-2);
    speakEvent(ex, c, line, "bad");
  }

  updateHUD();
  paintExpoStats(ex);

  // Obra tombada é patrimônio protegido: não pode ser vendida a particular
  // nem desaparece por furto — esses eventos só valem para obras móveis.
  if(!ex.fixa && ex.dayIndex >= 3 && Math.random() < 0.02){
    offerVIPBuyer(ex);
    return;
  }
  // risco de furto definido pela segurança da sala
  if(!ex.fixa && Math.random() < riscoFurtoDia(ex._sala ? ex._sala.attrs.seg : 55)){
    triggerTheft(ex);
    return;
  }

  if(ex.dayIndex >= ex.durationDays){
    finalizeExhibition(ex, "completed");
  }
}

// Atualiza os números de uma exposição, se o cartão dela estiver na tela.
function paintExpoStats(ex){
  if(!ex) return;
  const set = (sel, val) => { const e = document.querySelector(sel); if(e) e.textContent = val; };
  set(`[data-rev="${ex.id}"]`, fmtMoney(ex.revenueAccum));
  set(`[data-vis="${ex.id}"]`, ex.visitorsAccum);
  set(`[data-rep="${ex.id}"]`, (ex.repDelta>=0?"+":"")+ex.repDelta);
  set(`[data-day="${ex.id}"]`, ex.dayIndex);
  // se o mapa estiver aberto, ele acompanha o andamento
  if(document.querySelector(".view.active")?.id === "view-mapa") atualizarMapa();
}

// Guarda o evento no estado (para sobreviver à troca de telas) e pinta se possível.
function addFeed(ex, cls, who, text){
  if(ex) ex.log.push({ cls, who, text });
  const feed = ex ? document.querySelector(`[data-feed="${ex.id}"]`) : null;
  if(!feed) return;
  const item = document.createElement("div");
  item.className = "feed-item " + cls;
  item.innerHTML = `<div class="who">${who}</div>${text}`;
  feed.prepend(item);
  while(feed.children.length > 6) feed.lastChild.remove();
}

function comentariosFalados(ex){ return Config.v.audioComentarios && !(ex && ex.mudo); }
function alternarComentarios(ex){
  ex.mudo = !ex.mudo;
  if(ex.mudo && window.speechSynthesis){ try{ window.speechSynthesis.cancel(); }catch(e){} }
  return !ex.mudo;
}
function speakEvent(ex, countryCfg, line, cls){
  const spoke = comentariosFalados(ex) ? Voice.speak(line, countryCfg.lang) : false;
  addFeed(ex, cls, (spoke? "🔊 " : "") + "Visitante", `"${line}"`);
}

function offerVIPBuyer(ex){
  ex.paused = true;   // pausa só esta exposição enquanto o jogador decide
  const multiplier = 1.1 + Math.random()*0.5;
  const offer = Math.round(Market.valueOf(ex.work) * multiplier / 100) * 100;
  const pago = ex.work.boughtPrice || 0;
  const retomar = ()=>{ ex.paused = false; ensureExpoRunning(); };
  Eventos.mostrar({
    icone: "💎", titulo: "Colecionador VIP", imagem: imgSrc(ex.work), decisao: true, classeExtra: "vip",
    destaque: true, legendaFoto: `${ex.work.titulo} — ${ex.work.artista}`,
    corpo: `Um colecionador oferece <b class="ev-valor">${fmtMoney(offer)}</b> por <b>${ex.work.titulo}</b>, ainda em exposição
      <span class="ev-mercado">(${Math.round((multiplier-1)*100)}% acima do mercado)</span>.
      ${linhaResultado(`Você pagou ${fmtMoney(pago)} por ela — se vender:`, offer - pago, pago)}
      <small class="ev-nota">A exposição fica pausada até você decidir.</small>`,
    acoes: [
      { label:`Vender por ${fmtMoney(offer)}`, classe:"btn-gold", onClick:()=>{
          State.cash += offer;
          State.collection = State.collection.filter(o=>o.ownedId!==ex.work.ownedId);
          delete State.agenda[ex.work.ownedId];
          AudioFX.coin();
          finalizeExhibition(ex, "sold", offer);
      }},
      { label:"Recusar e continuar", classe:"btn-outline", onClick:()=>{
          addFeed(ex, "ok", "Colecionador", "Oferta recusada. A exposição continua.");
          retomar();
      }},
    ],
    aoExpirar: ()=>{ addFeed(ex, "ok", "Colecionador", "A oferta expirou. A exposição continua."); retomar(); },
    aoDispensar: ()=>{ addFeed(ex, "ok", "Colecionador", "Oferta dispensada. A exposição continua."); retomar(); },
  });
}

function triggerTheft(ex){
  AudioFX.alert();
  // com seguro, a seguradora paga 80% do valor de mercado; sem seguro, perda total
  const payout = ex.segurado ? Math.round(Market.valueOf(ex.work)*0.8) : 0;
  State.cash += payout;
  State.collection = State.collection.filter(o=>o.ownedId!==ex.work.ownedId);
  addFeed(ex, "bad", "Segurança da Galeria", ex.segurado
    ? `Furto durante a madrugada! A obra foi perdida. Seguro pagou ${fmtMoney(payout)}.`
    : `Furto durante a madrugada! A obra foi perdida — e não havia seguro. Prejuízo total.`);
  // Um roubo numa praça respinga no mercado daquele país
  const obrasPais = State.allArtworks.filter(w=>w.pais===ex.country);
  const queda = 0.08 + Math.random()*0.10;
  obrasPais.forEach(w=>{
    Market.mult[w.id] = Math.max(MARKET_FLOOR, (Market.mult[w.id]||1)*(1-queda));
  });
  showNewspaper({
    tipo:"baixa",
    titulo:"OBRA ROUBADA EM EXPOSIÇÃO",
    texto:`Furto durante mostra em ${ex.country} liga o alerta entre seguradoras e colecionadores.`,
    destaque:`${ex.country} −${Math.round(queda*100)}%`,
    temNaColecao: State.collection.some(o=>o.pais===ex.country),
  });
  finalizeExhibition(ex, "stolen", payout);
}

function finalizeExhibition(ex, outcome, extra){
  if(!ex || ex.ended) return;
  ex.ended = true;
  if(outcome === "completed"){
    const workRef = State.collection.find(o=>o.ownedId===ex.ownedId);
    if(workRef) workRef.exhibiting = false;
    if(workRef && !ex.fixa) embarcarObra(workRef, cidadeDaExposicao(ex), localDaObra(workRef), "volta");
  }
  State.exhibitions = State.exhibitions.filter(e=>e.id!==ex.id);
  if(!State.exhibitions.some(e=>!e.ended)) stopExpoClock();
  updateHUD();
  showReport(ex, outcome, extra);
  if(document.querySelector(".view.active")?.id === "view-exposicao") renderExpoSetup();
  processarAgenda();   // a obra pode ter acabado de ficar livre — a agenda já tenta a próxima parada
}

/* ----------------------------------------------------------------------------
   AGENDA — próximas paradas automáticas, por obra
   Cada obra tem uma fila de "pernas" futuras (país, sala, duração, seguro).
   Assim que a obra fica livre (a exposição atual termina) e há saldo, o jogo
   inicia a próxima perna sozinho — sem o jogador precisar voltar e configurar
   tudo de novo. Uma obra pode assim passar por vários museus em sequência.
   ---------------------------------------------------------------------------- */
function agendarLeg(ownedId, leg){
  (State.agenda[ownedId] = State.agenda[ownedId] || []).push(leg);
}
function filaAgenda(ownedId){ return State.agenda[ownedId] || []; }
function removerLegAgenda(ownedId, indice){
  const fila = State.agenda[ownedId]; if(!fila) return;
  fila.splice(indice, 1);
  if(!fila.length) delete State.agenda[ownedId];
}

function processarAgenda(){
  const partidas = [];
  Object.keys(State.agenda).forEach(idStr=>{
    const ownedId = Number(idStr);
    const fila = State.agenda[ownedId];
    if(!fila || !fila.length) { delete State.agenda[ownedId]; return; }
    const o = State.collection.find(x=>x.ownedId===ownedId);
    if(!o){ delete State.agenda[ownedId]; return; }         // obra não existe mais (vendida, roubada...)
    if(o.exhibiting || o.penhorada) return;                 // ainda ocupada — tenta de novo depois

    const leg = fila[0];
    const sala = salaInfo(leg.salaId);
    const c = COUNTRIES[leg.country];
    const valor = Market.valueOf(o);
    const seguro = leg.seguro
      ? Math.round((1500 + valor * 0.00015 * leg.duration * (1.6 - sala.attrs.seg/100)) / 10) * 10 : 0;
    const aluguel = sala.dono ? 0 : sala.aluguel * leg.duration;
    const equipe = c.staff * leg.duration;
    const transporte = c.transport;
    const total = seguro + aluguel + equipe + transporte;

    if(estrelas(sala.attrs) === 5 && classeDe(State.reputation) < CLASSE_MIN_5_ESTRELAS) return; // espera ganhar classe
    if(State.cash < total) return;                          // espera ter saldo — tenta de novo no próximo tick

    State.cash -= total;
    o.exhibiting = true;
    const draw = TIER_DRAW[o.tier] || 1;
    const capacidade = 0.55 + (sala.attrs.cap/100) * 0.65;
    const nova = {
      id: "ex" + (State.nextExpoId++), ownedId:o.ownedId, work:o, country:leg.country, fixa:false,
      agreement:null, salaId:leg.salaId, segurado: seguro > 0,
      durationDays: leg.duration, dayIndex:0, revenueAccum:0, visitorsAccum:0,
      diaReceita: Math.round(receitaDiariaBase(o, c, sala) *
        (1 + (ESTRELA_BONUS[estrelas(sala.attrs)][0]+ESTRELA_BONUS[estrelas(sala.attrs)][1])/2)),
      diaVisitantes: Math.round((c.visitors||0) * draw * (1 + State.reputation/200) * capacidade),
      costTotal: total, repDelta:0, log:[], tickProgress:0, paused:false, ended:false, deAgenda:true,
    };
    State.exhibitions.push(nova);
    removerLegAgenda(ownedId, 0);

    partidas.push({ nova, o, de: localDaObra(o), para: { pais: leg.country, cidade: sala.cidade } });
    updateHUD();
    ensureExpoRunning();
    if(document.querySelector(".view.active")?.id === "view-exposicao") renderExpoLive();
  });
  // quem parte junto, do mesmo lugar para o mesmo museu, vai no mesmo transporte
  const grupos = {};
  partidas.forEach(p=>{ const k = `${p.de.pais}|${p.de.cidade}>${p.para.pais}|${p.para.cidade}`; (grupos[k] = grupos[k] || []).push(p); });
  Object.values(grupos).forEach((g, gi)=>{
    const voo = embarcarObras(g.map(p=>p.o), g[0].de, g[0].para, "ida", gi*550);
    g.forEach(p=>{ if(voo){ p.nova.chegada = voo.inicio + voo.duracao; addFeed(p.nova, "info", "Transporte", `Obra despachada (agenda): rumo a ${p.para.cidade}.`); } });
    toast(`📅 Agenda: ${g.length>1 ? `${g.length} obras partiram juntas` : `"${g[0].o.titulo}" partiu`} para ${g[0].para.cidade}`);
  });

}

function showReport(ex, outcome, extra){
  const net = ex.revenueAccum - ex.costTotal + (extra||0);
  const isPos = net >= 0;
  let outcomeLine = ex.fixa
    ? "O acordo de visitação foi encerrado. A obra permanece em seu sítio original."
    : "A obra retornou à sua Coleção, pronta para nova exposição.";
  if(outcome==="sold") outcomeLine = `A obra foi vendida por ${fmtMoney(extra)} durante a exposição.`;
  if(outcome==="stolen") outcomeLine = ex.segurado
    ? `A obra foi furtada; o seguro pagou ${fmtMoney(extra)}.`
    : `A obra foi furtada e não estava segurada: perda total da peça.`;
  const title = ex.fixa ? "Relatório da Visitação" : "Relatório da Exposição";
  const grade = `<div class="report-grid">
        <div class="item"><div class="k">Dias ${ex.fixa?'de visitação':'expostos'}</div><div class="v">${ex.dayIndex}</div></div>
        <div class="item"><div class="k">Público total</div><div class="v">${ex.visitorsAccum}</div></div>
        <div class="item"><div class="k">Receita de ingressos</div><div class="v">${fmtMoney(ex.revenueAccum)}</div></div>
        <div class="item"><div class="k">Custos</div><div class="v">${fmtMoney(ex.costTotal)}</div></div>
        <div class="item"><div class="k">Δ Reputação</div><div class="v">${ex.repDelta>=0?'+':''}${ex.repDelta}</div></div>
        <div class="item"><div class="k">Conhecimento ganho</div><div class="v">+${ex.knowledgeAccum || 0}</div></div>
      </div>`;

  if(typeof Config !== "undefined" && Config.v.relatorio === "detalhado"){
    openModal(`
    <div id="report-body" style="padding:24px;">
      <h2 style="font-family:var(--font-display);font-size:24px;">${title}</h2>
      <div class="big-profit ${isPos?'pos':'neg'}">${isPos?'+':''}${fmtMoney(net)}</div>
      <p style="font-size:12.5px;color:var(--parchment-dim);">${outcomeLine}</p>
      ${grade}
      <div class="action-row" style="justify-content:center;">
        <button class="btn btn-gold" id="btn-close-report">Concluir</button>
      </div>
    </div>`);
    document.getElementById("btn-close-report").addEventListener("click", closeModal);
    return;
  }
  // compacto: um cartão pequeno no canto, sem escurecer a tela nem trocar de aba
  Eventos.mostrar({
    icone: isPos ? "📊" : "📉", titulo: title, classeExtra: "relatorio", decisao: false,
    imagem: imgSrc(ex.work),
    corpo: `<b>${ex.work.titulo}</b> · ${ex.fixa ? ex.agreement : ex.country}
      <div class="rel-linha ${isPos?'mkt-up':'mkt-down'}"><b>${isPos?'+':''}${fmtMoney(net)}</b>
        <span>${ex.dayIndex} dia(s) · ${ex.visitorsAccum.toLocaleString("pt-BR")} pessoas</span></div>
      <details class="rel-det"><summary>Detalhes</summary><p>${outcomeLine}</p>${grade}</details>`,
    acoes: [{ label:"OK", classe:"btn-outline", onClick:()=>{} }],
  });
}

window.addEventListener("DOMContentLoaded", init);
