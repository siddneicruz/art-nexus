/* ============================================================================
   MAPA — o palco do jogo, sobre tiles do OpenStreetMap (via Leaflet).
   Quatro camadas, que seguem o zoom:
     1 Continentes (z≤3)  ·  2 Países (z 4–5)  ·  3 Estados (z 6–8)  ·  4 Cidades (z≥9)
   As fronteiras de estados e as cidades vêm embutidas (Natural Earth), então o
   mapa continua navegável mesmo sem internet — só sem as imagens do OSM.
   ============================================================================ */

const CONT_DO_PAIS = { "Brasil":"América do Sul" };
const contDoPais = p => CONT_DO_PAIS[p] || "Europa";
const PAISES_JOGO = Object.keys(COUNTRIES);
const casaLeilaoCidade = p => SALA_CIDADES[p][2];
const cidadePrincipal = p => SALA_CIDADES[p][2];
const CIDADE_TOMBADAS = { pais:"Brasil", cidade:"Congonhas" };
const ICONE_MUSEU = `<svg class="mk-predio-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 20h18M4.5 20v-8M9.5 20v-8M14.5 20v-8M19.5 20v-8"/><path d="M2.5 9.5 12 4l9.5 5.5z"/></svg>`;
const ICONE_LEILAO = `<svg class="mk-predio-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.8 3.6 20 8.8l-2.1 2.1-5.2-5.2z"/><path d="M11.6 6.8 4 14.4l2.1 2.1 7.6-7.6"/><path d="M3 20.5h9"/></svg>`;

const OSM_ATTR = '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ESRI_ATTR = 'Tiles &copy; <a href="https://www.esri.com">Esri</a> &middot; dados &copy; OpenStreetMap';

/* Fundos do mapa. Todos são gratuitos e sem chave de API.
   Importante: os servidores do OpenStreetMap recusam (403) páginas abertas
   como arquivo local, por não conseguirem identificar a aplicação — é a
   política de uso deles, não uma chave. Por isso o padrão é o Esri, que
   funciona também em file://; o OSM fica disponível para quem servir o jogo
   por HTTP (por exemplo `python3 -m http.server`). Se um fundo falhar, o
   jogo troca sozinho para o próximo e avisa. */
const FUNDOS = {
  esriEscuro: { nome:"Escuro", url:"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                attr:ESRI_ATTR, max:16 },
  esriRuas:   { nome:"Ruas",   url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                attr:ESRI_ATTR, max:17 },
  esriSat:    { nome:"Satélite", url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                attr:ESRI_ATTR, max:17 },
  osm:        { nome:"OSM padrão", url:"https://tile.openstreetmap.org/{z}/{x}/{y}.png", attr:OSM_ATTR, max:18, filtro:true },
  nenhum:     { nome:"Sem imagens", url:null, attr:"Fronteiras: Natural Earth", max:14 },
};
const ORDEM_FUNDOS = ["esriEscuro","esriRuas","esriSat","osm","nenhum"];

/* --------------------------------------------------------------- índices */
const CIDX = {}, EIDX = {};
Object.entries(GEO.ESTADOS).forEach(([pais, lista])=>{
  lista.forEach(e=>{
    EIDX[e.id] = { ...e, pais };
    (GEO.CIDADES[e.id] || []).forEach(c=>{ CIDX[pais+"|"+c.nome] = { ...c, pais, estado:e.id }; });
  });
});
function cidade(pais, nome){ return CIDX[pais+"|"+nome] || null; }
function coordCidade(pais, nome){
  const c = cidade(pais, nome) || cidade(pais, cidadePrincipal(pais));
  return c ? [c.lat, c.lng] : null;
}
function dentroDoAnel(lat, lng, anel){       // ponto em polígono (ray casting)
  let dentro = false;
  for(let i=0, j=anel.length-1; i<anel.length; j=i++){
    const [yi,xi] = anel[i], [yj,xj] = anel[j];
    if((yi>lat) !== (yj>lat) && lng < (xj-xi)*(lat-yi)/(yj-yi)+xi) dentro = !dentro;
  }
  return dentro;
}
function estadoEm(pais, lat, lng){
  return (GEO.ESTADOS[pais] || []).find(e =>
    lat>=e.bbox[0][0] && lat<=e.bbox[1][0] && lng>=e.bbox[0][1] && lng<=e.bbox[1][1] &&
    e.aneis.some(a=>dentroDoAnel(lat, lng, a)));
}
function paisEm(lat, lng){
  return PAISES_JOGO.find(p=>{ const b = GEO.BBOX_PAIS[p];
    return lat>=b[0][0] && lat<=b[1][0] && lng>=b[0][1] && lng<=b[1][1]; });
}

/* ---------------------------------------------- onde as coisas acontecem */
function cidadeDaExposicao(ex){
  if(ex.fixa) return CIDADE_TOMBADAS;
  const s = salaInfo(ex.salaId || salaId(ex.country, 1));
  return { pais:s.pais, cidade:s.cidade };
}
function presenca(){
  const P = { cidade:{}, estado:{}, pais:{}, cont:{} };
  const soma = (pais, nome, campo)=>{
    const c = cidade(pais, nome); if(!c) return;
    [["cidade", pais+"|"+nome], ["estado", c.estado], ["pais", pais], ["cont", contDoPais(pais)]]
      .forEach(([n,k])=>{ const o = P[n][k] || (P[n][k] = {expos:0,pregoes:0,salas:0,sede:0}); o[campo]++; });
  };
  State.exhibitions.filter(e=>!e.ended).forEach(e=>{ const l = cidadeDaExposicao(e); soma(l.pais, l.cidade, "expos"); });
  if(typeof Auction !== "undefined"){ Auction.garantirConvites(); Auction.convites.forEach(c=>soma(c.pais, casaLeilaoCidade(c.pais), "pregoes")); }
  Object.entries(State.salas || {}).forEach(([id, st])=>{ if(st.dono){ const s = salaInfo(id); soma(s.pais, s.cidade, "salas"); } });
  if(State.sede) soma(State.sede.pais, State.sede.cidade, "sede");
  return P;
}
function selosHTML(o){
  if(!o) return "";
  return [o.sede?`<span class="ms ms-sede">🏛</span>`:"", o.expos?`<span class="ms ms-expo">🖼 ${o.expos}</span>`:"",
          o.pregoes?`<span class="ms ms-pregao">🔨 ${o.pregoes}</span>`:"", o.salas?`<span class="ms ms-sala">🏢 ${o.salas}</span>`:""].join("");
}

/* ----------------------------------------------------------------- motor */
// faixas de zoom usadas quando o jogador explora livremente com a roda
const nivelPorZoom = z => z < 4.5 ? 1 : z < 6.5 ? 2 : z < 9 ? 3 : 4;

const Mapa = {
  map:null, nivel:1, cont:null, pais:null, estado:null, cidadeSel:null,
  camadas:{}, seguindoVoo:false,

  // Navegação explícita manda na camada: guardamos o zoom que a animação vai
  // atingir, e só voltamos a deduzir a camada pelo zoom quando o jogador
  // realmente muda o zoom por conta própria.
  voarPara(bounds, padding, maxZoom){
    this.navAte = Date.now() + 1500;          // enquanto voa, a camada escolhida manda
    this.map.flyToBounds(bounds, { duration:.9, padding:[padding,padding], maxZoom });
  },
  irMundo(){ this.nivel=this.nivelNav=1; this.cont=this.pais=this.estado=null; this.cidadeSel=null; fecharCartao();
    this.navAte = Date.now()+1500; this.map.flyTo([20,0], 2, {duration:.9}); this.redesenhar(); },
  irContinente(nome){
    const c = GEO.CONTINENTES.find(x=>x.nome===nome); if(!c) return;
    if(!c.ativo){ toast(`${nome}: ainda não há mercado de arte aberto aqui`); return; }
    this.nivel=this.nivelNav=2; this.cont=nome; this.pais=this.estado=null; this.cidadeSel=null; fecharCartao();
    this.voarPara(c.bbox, 20); this.redesenhar();
  },
  irPais(pais){
    if(!PAISES_JOGO.includes(pais)){ toast(`${pais}: você ainda não opera neste país`); return; }
    this.nivel=this.nivelNav=3; this.cont=contDoPais(pais); this.pais=pais; this.estado=null; this.cidadeSel=null; fecharCartao();
    this.voarPara(GEO.BBOX_PAIS[pais], 30); this.redesenhar();
  },
  irEstado(id){
    const e = EIDX[id]; if(!e) return;
    this.nivel=this.nivelNav=4; this.pais=e.pais; this.cont=contDoPais(e.pais); this.estado=id; this.cidadeSel=null; fecharCartao();
    this.voarPara(e.bbox, 40, 10); this.redesenhar();
  },
  irCidade(pais, nome){
    const c = cidade(pais, nome); if(!c) return;
    this.nivel=this.nivelNav=4; this.pais=pais; this.cont=contDoPais(pais); this.estado=c.estado; this.cidadeSel=pais+"|"+nome;
    this.navAte = Date.now() + 1500;
    this.map.flyTo([c.lat, c.lng], Math.max(this.map.getZoom(), 9), {duration:.8});
    this.redesenhar(); mostrarCartaoCidade(pais, nome);
  },
  subir(){
    if(this.cidadeSel){ this.cidadeSel=null; fecharCartao(); this.redesenhar(); return; }
    if(this.nivel===4) this.irPais(this.pais);
    else if(this.nivel===3) this.irContinente(this.cont);
    else if(this.nivel===2) this.irMundo();
  },
  focarRota(a, b){
    this.seguindoVoo = true; this.cidadeSel=null; fecharCartao();
    this.voarPara([a, b], 80, 7);
    desenharMigalhas();
  },
  redesenhar(){ desenharCamadas(); desenharMigalhas(); },
};

/* ------------------------------------------------------------- montagem */
function montarMapa(){
  const palco = document.getElementById("palco");
  ["mapa-migalhas","mapa-cartao","mapa-aviso"].forEach(id=>{
    if(!document.getElementById(id)){ const d = document.createElement("div"); d.id = id; palco.appendChild(d); }
  });

  // preferência de fundo; se o navegador bloquear o armazenamento, usa o escuro
  const fundo = (()=>{ try{ return localStorage.getItem("artnexus_fundo") || (window.FUNDO_PADRAO || "esriEscuro"); }catch(e){ return (window.FUNDO_PADRAO || "esriEscuro"); } })();
  const map = L.map("mundo", { zoomControl:false, minZoom:2, maxZoom:14, worldCopyJump:true,
    attributionControl:true, zoomSnap:.5 }).setView([20,0], 2);
  Mapa.map = map;
  L.control.zoom({ position:"bottomright" }).addTo(map);
  ["estados","cidades","paises","voos","sede"].forEach(k=>{ Mapa.camadas[k] = L.layerGroup().addTo(map); });

  // seletor de fundo do mapa
  const Seletor = L.Control.extend({ options:{position:"bottomright"},
    onAdd(){ const d = L.DomUtil.create("div", "ctrl-fundo"); d.id = "ctrl-fundo";
      L.DomEvent.disableClickPropagation(d); return d; } });
  map.addControl(new Seletor());
  aplicarFundo(FUNDOS[fundo] ? fundo : "esriEscuro");
  desenharControleFundo();

  // Os prédios encolhem em zooms mais afastados (camada de estados, onde
  // várias cidades ficam perto umas das outras) e crescem ao aproximar —
  // uma var CSS herdada por todos os .mk-predio-3d de uma vez, atualizada a
  // cada evento de zoom (inclusive durante a animação).
  const ajustarEscalaPredios = ()=>{
    const z = map.getZoom();
    const escala = Math.max(0.42, Math.min(1.15, (z - 5) / 4));
    document.getElementById("mundo").style.setProperty("--predio-escala", escala.toFixed(2));
  };
  map.on("zoom", ajustarEscalaPredios);
  map.on("zoomend moveend", agendarDeclutter);
  ajustarEscalaPredios();

  // o zoom manda na camada: explorar com a roda muda de nível sozinho
  map.on("zoomend moveend", ()=>{
    if(Mapa.seguindoVoo && !State.voos.length) Mapa.seguindoVoo = false;
    // durante uma navegação, a camada escolhida prevalece (uma animação
    // interrompida no meio não deve rebaixar a camada)
    if(Mapa.navAte && Date.now() < Mapa.navAte){
      Mapa.zoomNav = map.getZoom();
      if(Mapa.nivelNav && Mapa.nivel !== Mapa.nivelNav){ Mapa.nivel = Mapa.nivelNav; Mapa.redesenhar(); }
      return;
    }
    // zoom parado no valor em que a navegação terminou: nada a fazer
    if(Mapa.zoomNav != null && Math.abs(map.getZoom() - Mapa.zoomNav) < 0.26) return;
    Mapa.nivelNav = null;
    const n = nivelPorZoom(map.getZoom());
    if(n === Mapa.nivel && !(n>=3 && !Mapa.pais)) return;
    const c = map.getCenter();
    Mapa.nivel = n;
    if(n >= 3){
      const p = paisEm(c.lat, c.lng) || Mapa.pais;
      if(p){ Mapa.pais = p; Mapa.cont = contDoPais(p); }
      if(n === 4 && Mapa.pais){ const e = estadoEm(Mapa.pais, c.lat, c.lng); if(e) Mapa.estado = e.id; }
    } else if(n === 2 && !Mapa.cont){
      Mapa.cont = (GEO.CONTINENTES.find(k=>c.lat>=k.bbox[0][0] && c.lat<=k.bbox[1][0] && c.lng>=k.bbox[0][1] && c.lng<=k.bbox[1][1]) || {}).nome || null;
    }
    Mapa.redesenhar();
  });

  window.addEventListener("keydown", (ev)=>{
    if(ev.key !== "Escape" || document.querySelector(".view.active")) return;
    if(document.getElementById("modal-overlay")?.classList.contains("active")) return;
    Mapa.subir();
  });

  Mapa.redesenhar();
  requestAnimationFrame(quadroVoos);
  if(!State.sede) mostrarBoasVindas();
}

// contornos dos países embutidos (js/mundo-data.js): o mapa continua parecendo mapa sem internet
function fundoPaises(ligar){
  if(Mapa.paisesBase){ Mapa.map.removeLayer(Mapa.paisesBase); Mapa.paisesBase = null; }
  if(!ligar || !window.MUNDO_POLIGONOS) return;
  if(!Mapa.map.getPane("paisesBase")){
    const pn = Mapa.map.createPane("paisesBase"); pn.style.zIndex = 190; pn.style.pointerEvents = "none";
  }
  const copias = [];
  for(const off of [-360, 0, 360])
    for(const poly of window.MUNDO_POLIGONOS)
      copias.push(poly.map(anel=>anel.map(p=>[p[1], p[0] + off])));
  Mapa.paisesBase = L.polygon(copias, {
    pane:"paisesBase", interactive:false, smoothFactor:1.2, className:"pais-base",
    renderer:L.svg({ pane:"paisesBase", padding:0.5 })
  }).addTo(Mapa.map);
}

function aplicarFundo(chave){
  const f = FUNDOS[chave] || FUNDOS.esriEscuro;
  Mapa.fundoAtual = chave;
  try{ localStorage.setItem("artnexus_fundo", chave); }catch(e){}
  if(Mapa.camadas.tiles){ Mapa.map.removeLayer(Mapa.camadas.tiles); Mapa.camadas.tiles = null; }
  const el = document.getElementById("mundo");
  el.classList.toggle("tiles-escuros", !!f.filtro);
  el.classList.toggle("fundo-claro", chave === "esriRuas");
  el.classList.toggle("sem-tiles", chave === "nenhum");
  fundoPaises(chave === "nenhum");
  if(!f.url){ Mapa.map.attributionControl.setPrefix(f.attr); return; }
  const camada = L.tileLayer(f.url, { attribution:f.attr, maxZoom:14, maxNativeZoom:f.max });
  // se muitos tiles falharem (403, offline), cai para o próximo fundo
  let falhas = 0, t0 = Date.now();
  camada.on("tileerror", ()=>{
    if(Date.now() - t0 > 6000){ falhas = 0; t0 = Date.now(); }
    if(++falhas === 6 && Mapa.fundoAtual === chave){
      const prox = ORDEM_FUNDOS[ORDEM_FUNDOS.indexOf(chave) + 1] || "nenhum";
      // a cadeia de reserva é silenciosa; só avisa quando acabam as opções (ex.: sem internet), uma vez por sessão
      if(prox === "nenhum" && !Mapa.avisouSemMapa){ Mapa.avisouSemMapa = true; toast("Mapas de fundo indisponíveis agora (sem internet ou bloqueados) — usando só as fronteiras do jogo. Dá para trocar no botão 🗺."); }
      aplicarFundo(prox);
      desenharControleFundo();
    }
  });
  camada.addTo(Mapa.map);
  Mapa.camadas.tiles = camada;
}

// compatibilidade: alterna para o próximo fundo da lista
function trocarFundo(){
  const i = ORDEM_FUNDOS.indexOf(Mapa.fundoAtual);
  aplicarFundo(ORDEM_FUNDOS[(i + 1) % ORDEM_FUNDOS.length]);
  desenharControleFundo();
}

function desenharControleFundo(){
  const c = document.getElementById("ctrl-fundo"); if(!c) return;
  // no celular só aparece um botão compacto; tocar nele abre a lista de fundos
  c.innerHTML = `<button class="bf-abrir" type="button" aria-label="Fundo do mapa" title="Fundo do mapa">🗺 <span>${FUNDOS[Mapa.fundoAtual].nome}</span></button>` +
    ORDEM_FUNDOS.map(k=>
      `<button class="bf ${k===Mapa.fundoAtual?'sel':''}" data-fundo="${k}">${FUNDOS[k].nome}</button>`).join("");
  c.querySelector(".bf-abrir").addEventListener("click", (ev)=>{ ev.stopPropagation(); AudioFX.click(); c.classList.toggle("aberto"); });
  c.querySelectorAll("[data-fundo]").forEach(b=>b.addEventListener("click", (ev)=>{
    ev.stopPropagation(); AudioFX.click(); aplicarFundo(b.dataset.fundo); c.classList.remove("aberto"); desenharControleFundo();
  }));
}

/* ------------------------------------------------------------- camadas */
function etiqueta(cls, html, opts={}){
  const { titulo, ...resto } = opts;
  return L.divIcon({ className:"mk-wrap", html:`<div class="mk ${cls}"${titulo ? ` title="${titulo}"` : ""}>${html}</div>`, iconSize:null, ...resto });
}

/* ------------------------------------------------------ rótulos sobrepostos
   Quando dois nomes disputam o mesmo espaço, fica o de maior prioridade
   (museu em cartaz > pregão > país > sala ociosa > cidade comum).
   · marcador comum que perde: esconde o nome (o prédio segue clicável e o
     nome volta ao passar o mouse);
   · museu em cartaz que colide com outro museu: perde primeiro o chip ao vivo
     (que vira dica ao passar o mouse) e, se ainda assim colidir, o nome.
   O prédio de um museu em cartaz nunca some. */
const bateRetangulo = (r, a)=>!(r.right <= a.left || r.left >= a.right || r.bottom <= a.top || r.top >= a.bottom);

// itens: [{ id, prio, r (nome+chip), rNome? (só o nome) }]
// devolve Map id -> "tudo" | "nome" | "nada"
function decidirRotulos(itens){
  const aceitos = [], decisao = new Map();
  [...itens].sort((a,b)=>b.prio - a.prio).forEach(it=>{
    if(!aceitos.some(a=>bateRetangulo(it.r, a))){ aceitos.push(it.r); decisao.set(it.id, "tudo"); return; }
    if(it.prio === 5 && it.rNome && !aceitos.some(a=>bateRetangulo(it.rNome, a))){
      aceitos.push(it.rNome); decisao.set(it.id, "nome"); return;
    }
    decisao.set(it.id, "nada");
  });
  return decisao;
}
// compatibilidade: conjunto dos que mantêm ao menos o nome
function escolherRotulosVisiveis(itens){
  const d = decidirRotulos(itens);
  return new Set([...d].filter(([, v])=>v !== "nada").map(([k])=>k));
}
let declutterTimer = null;
function agendarDeclutter(){ clearTimeout(declutterTimer); declutterTimer = setTimeout(decluttarMarcadores, 60); }
const uniao = qs => ({ left:Math.min(...qs.map(q=>q.left)), right:Math.max(...qs.map(q=>q.right)), top:Math.min(...qs.map(q=>q.top)), bottom:Math.max(...qs.map(q=>q.bottom)) });
function decluttarMarcadores(){
  const els = [...document.querySelectorAll("#mundo .mk-cidade, #mundo .mk-pais")];
  els.forEach(e=>e.classList.remove("sem-rotulo", "sem-chip"));
  const itens = [];
  els.forEach((e, i)=>{
    const b = e.querySelector("b"); if(!b) return;
    const rb = b.getBoundingClientRect(); if(!rb.width) return;
    const chip = e.querySelector(".mk-live"), rc = chip ? chip.getBoundingClientRect() : null;
    const prio = e.classList.contains("museu") ? 5 : e.querySelector(".leilao") ? 4 : e.classList.contains("mk-pais") ? 3 : e.classList.contains("esp") ? 2 : 1;
    itens.push({ id:i, prio, r: uniao(rc && rc.width ? [rb, rc] : [rb]), rNome: uniao([rb]) });
  });
  const d = decidirRotulos(itens);
  itens.forEach(it=>{
    const v = d.get(it.id), e = els[it.id];
    if(v === "nome") e.classList.add("sem-chip");
    if(v === "nada"){ e.classList.add("sem-rotulo"); if(e.classList.contains("museu")) e.classList.add("sem-chip"); }
  });
}

function desenharCamadas(){
  const P = presenca();
  const { estados, cidades, paises, sede } = Mapa.camadas;
  [estados, cidades, paises, sede].forEach(c=>c.clearLayers());

  // --- camada 1: continentes (a etiqueta já é o alvo do clique; sem caixa)
  if(Mapa.nivel === 1){
    GEO.CONTINENTES.forEach(c=>{
      const o = P.cont[c.nome];
      L.marker(c.centro, { icon:etiqueta("mk-cont"+(c.ativo?"":" inativo"),
        `<b>${c.nome}</b>${c.ativo ? `<span class="mk-sub">${c.nome==="Europa"?"7 países":"Brasil"}</span>${selosHTML(o)}` : `<span class="mk-sub">em breve</span>`}`) })
        .on("click", ()=>{ AudioFX.click(); Mapa.irContinente(c.nome); }).addTo(paises);
    });
  }
  // --- camada 2: países do jogo, com o contorno real (soma dos estados),
  // não uma caixa — a Itália precisa parecer uma bota, não um retângulo.
  if(Mapa.nivel === 2){
    PAISES_JOGO.filter(p=>!Mapa.cont || contDoPais(p)===Mapa.cont).forEach(p=>{
      const b = GEO.BBOX_PAIS[p];
      const pecas = GEO.ESTADOS[p].map(e=>
        L.polygon(e.aneis, { className:"pais-shape" }).addTo(paises));
      pecas.forEach(poly=>{
        poly.on("click", ()=>{ AudioFX.click(); Mapa.irPais(p); });
        poly.on("mouseover", ()=>pecas.forEach(x=>x.getElement()?.classList.add("hov")));
        poly.on("mouseout",  ()=>pecas.forEach(x=>x.getElement()?.classList.remove("hov")));
      });
      L.marker([(b[0][0]+b[1][0])/2, (b[0][1]+b[1][1])/2], { icon:etiqueta("mk-pais",
        `<b>${COUNTRIES[p].flag} ${p}</b>${selosHTML(P.pais[p])}`) })
        .on("click", ()=>{ AudioFX.click(); Mapa.irPais(p); }).addTo(paises);
    });
  }
  // --- camadas 3 e 4: estados do país
  if(Mapa.nivel >= 3 && Mapa.pais){
    GEO.ESTADOS[Mapa.pais].forEach(e=>{
      const o = P.estado[e.id], sel = e.id === Mapa.estado;
      const cls = ["pe", sel?"sel":"", o&&o.expos?"com-expo":"", o&&(o.pregoes||o.salas||o.sede)?"com-algo":""].join(" ");
      L.polygon(e.aneis, { className:cls }).on("click", ()=>{ AudioFX.click(); Mapa.irEstado(e.id); })
        .bindTooltip(e.nome, { sticky:true, className:"tt" }).addTo(estados);
      if(Mapa.nivel === 3){
        // cidades-estado (Berlim, Hamburgo, Viena...) têm o centro do estado
        // quase no mesmo ponto da própria cidade — sem essa checagem os dois
        // rótulos ficam um em cima do outro
        const coincideComCidade = Object.values(CIDX).some(city =>
          city.pais === Mapa.pais && city.esp &&
          Math.hypot(city.lat - e.c[0], city.lng - e.c[1]) < 0.15);   // só colisões de verdade (Berlim, Viena, Londres...)
        if(!coincideComCidade)
          L.marker(e.c, { icon:etiqueta("mk-estado"+(o?" ativo":""), `<b>${e.nome}</b>${selosHTML(o)}`) })
            .on("click", ()=>{ AudioFX.click(); Mapa.irEstado(e.id); }).addTo(estados);
      }
    });
  }
  // --- cidades com sala: já aparecem na camada 2 (países), para dar para
  // ver vários museus ao mesmo tempo sem entrar em cada país, e continuam
  // nas camadas 3/4. Uma cidade com exposição ativa vira um prédio de museu
  // (mostra a própria obra e os números do dia); com pregão aberto, uma casa
  // de leilões.
  if(Mapa.nivel >= 2 && (Mapa.pais || Mapa.nivel === 2)){
    const paisesNaTela = Mapa.nivel === 2
      ? PAISES_JOGO.filter(p=>!Mapa.cont || contDoPais(p)===Mapa.cont)
      : [Mapa.pais];
    const lista = Mapa.nivel === 4 && Mapa.estado
      ? (GEO.CIDADES[Mapa.estado] || []).map(c=>({...c, pais:Mapa.pais}))
      : Object.values(CIDX).filter(c=>c.esp && paisesNaTela.includes(c.pais));
    lista.forEach(c=>desenharMarcadorCidade(c, P.cidade[c.pais+"|"+c.nome], cidades));
  }
  // --- a sede, com o avatar, em todas as camadas
  if(State.sede){
    const c = cidade(State.sede.pais, State.sede.cidade);
    if(c) L.marker([c.lat, c.lng], { icon:etiqueta("mk-sede",
      `<div class="mk-avatar">${typeof AVATAR_SVG!=="undefined"?AVATAR_SVG:"🏛"}</div><span>Sede</span>`), zIndexOffset:600 })
      .on("click", ()=>{ AudioFX.click(); Mapa.irCidade(State.sede.pais, State.sede.cidade); }).addTo(sede);
  }
  agendarDeclutter();
}
function atualizarMapa(){ if(Mapa.map) desenharCamadas(); }

function desenharMarcadorCidade(c, o, camada){
  const k = c.pais + "|" + c.nome;
  const exposAqui = State.exhibitions.filter(e=>!e.ended).filter(e=>{
    const l = cidadeDaExposicao(e); return l.pais===c.pais && l.cidade===c.nome;
  });
  const ex = exposAqui[0];
  const noAr = ex && ex.chegada && Date.now() < ex.chegada;
  const valoresHoje = ex ? (typeof valoresHojeAoVivo==="function" ? valoresHojeAoVivo(ex) : {receita:ex.diaReceita||0, visitantes:ex.diaVisitantes||0}) : null;
  const corpo = (ex && !noAr) ? `
      <div class="mk-predio-3d museu">
        <div class="mp-pediment"></div>
        <div class="mp-corpo">
          <img class="mp-obra" src="${imgSrc(ex.work)}" alt="">
          <div class="mp-colunas"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="mp-degrau d2"></div><div class="mp-degrau d1"></div>
      </div>
      <b>${c.nome}</b>
      <div class="mk-live" data-mk-ex="${ex.id}" title="${c.nome}: dia ${ex.dayIndex} de ${ex.durationDays} · faturamento e público de hoje">
        <span class="ml-dia">${ex.dayIndex}/${ex.durationDays}d</span>
        <span id="mk-rec-${ex.id}" class="ml-rec">€${valoresHoje.receita.toLocaleString("pt-BR")}</span>
        <span id="mk-vis-${ex.id}" class="ml-vis">${valoresHoje.visitantes} vis.</span>
      </div>`
    : (o && o.pregoes) ? `
      <div class="mk-predio-3d leilao">
        <div class="mp-pediment"></div>
        <div class="mp-corpo"><div class="mp-emblema">${ICONE_LEILAO}</div><div class="mp-colunas"><i></i><i></i><i></i><i></i><i></i></div></div>
        <div class="mp-degrau d2"></div><div class="mp-degrau d1"></div>
      </div>
      <b>${c.nome}</b><div class="mk-live"><span>🔨 ${o.pregoes} pregão${o.pregoes>1?"s":""}</span></div>`
    : c.esp ? `
      <div class="mk-predio-3d ocioso">
        <div class="mp-pediment"></div>
        <div class="mp-corpo"><div class="mp-colunas"><i></i><i></i><i></i><i></i><i></i></div></div>
        <div class="mp-degrau d2"></div><div class="mp-degrau d1"></div>
      </div>
      <b>${c.nome}</b>${selosHTML(o)}`
    : `<i class="pt"></i><b>${c.nome}</b>${selosHTML(o)}`;
  L.marker([c.lat, c.lng], {
    icon:etiqueta("mk-cidade"+(c.esp?" esp":"")+(o?" ativo":"")+(Mapa.cidadeSel===k?" sel":"")+(ex&&!noAr?" museu":""), corpo, { titulo: c.nome }),
    zIndexOffset: (ex && !noAr) ? 500 : 400,
  }).on("click", ()=>{
    AudioFX.click();
    if(ex && !noAr && typeof SalaVisao !== "undefined") SalaVisao.abrir(ex);
    else Mapa.irCidade(c.pais, c.nome);
  }).addTo(camada);
}

/* ------------------------------------------------------------------ voos */
function pontoArco(a, b, t){
  // arco simples: interpola e afasta perpendicularmente no meio do caminho
  const lat = a[0] + (b[0]-a[0])*t, lng = a[1] + (b[1]-a[1])*t;
  const dx = b[1]-a[1], dy = b[0]-a[0], d = Math.hypot(dx, dy) || 1;
  const alt = Math.sin(Math.PI*t) * d * 0.16;
  return [lat + (dx/d)*alt*0.6, lng - (dy/d)*alt*0.6];
}
function linhaVoo(a, b, t0, t1){
  const pts = []; const n = 28;
  for(let i=0;i<=n;i++){ const t = t0 + (t1-t0)*i/n; pts.push(pontoArco(a, b, t)); }
  return pts;
}
function iniciarAnimacaoVoos(){ /* o laço já roda; nada a fazer */ }

function atualizarRotulosAoVivo(){
  if(typeof valoresHojeAoVivo !== "function") return;
  State.exhibitions.filter(e=>!e.ended && !e.fixa).forEach(ex=>{
    const rEl = document.getElementById("mk-rec-"+ex.id);
    const vEl = document.getElementById("mk-vis-"+ex.id);
    if(!rEl && !vEl) return;
    const v = valoresHojeAoVivo(ex);
    if(rEl) rEl.textContent = "€"+v.receita.toLocaleString("pt-BR");
    if(vEl) vEl.textContent = v.visitantes+" vis.";
  });
}

const SVG_AVIAO = `<svg viewBox="-13 -11 26 22"><path d="M12,0 L6.5,-1.8 L2,-1.8 L-2.7,-10 L-5.5,-10 L-2.4,-1.8 L-8,-1.8 L-10.3,-5 L-12,-5 L-11,0 L-12,5 L-10.3,5 L-8,1.8 L-2.4,1.8 L-5.5,10 L-2.7,10 L2,1.8 L6.5,1.8 Z"/></svg>`;
// van de transporte de arte vista de cima, apontando para a direita (leste)
const SVG_VAN = `<svg viewBox="-13 -8 26 16"><rect x="-12" y="-6.5" width="19" height="13" rx="2.5" class="van-bau"/>
  <rect x="6" y="-6" width="6" height="12" rx="2.5" class="van-cabine"/><rect x="8.5" y="-4.5" width="2.2" height="9" rx="1" class="van-vidro"/>
  <rect x="-10" y="-1" width="15" height="2" rx="1" class="van-faixa"/></svg>`;

function ease(t){ return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
function pontoPerna(p, e){
  return p.modo === "aviao" ? pontoArco(p.a, p.b, e) : [p.a[0]+(p.b[0]-p.a[0])*e, p.a[1]+(p.b[1]-p.a[1])*e];
}
function desenharViagem(g, v, agora){
  const decorrido = Math.max(0, agora - v.inicio);
  const pernas = v.pernas || [{ modo:"aviao", a:v.a, b:v.b, dur:v.duracao, ini:0 }];
  const cor = v.tipo === "volta" ? "#8fb0d8" : v.tipo === "compra" ? "#9dbf90" : "#e8c766";
  // trajeto completo (tracejado) e o que já foi percorrido (cheio)
  pernas.forEach(p=>{
    const pts = p.modo === "aviao" ? linhaVoo(p.a, p.b, 0, 1) : [p.a, p.b];
    L.polyline(pts, { className: p.modo === "aviao" ? "rota-voo" : "rota-estrada", interactive:false }).addTo(g);
    const e = Math.min(1, Math.max(0, (decorrido - p.ini) / p.dur));
    if(e > 0.005){
      const feito = p.modo === "aviao" ? linhaVoo(p.a, p.b, 0, ease(e)) : [p.a, pontoPerna(p, ease(e))];
      L.polyline(feito, { color:cor, weight: p.modo === "aviao" ? 2.5 : 3, opacity:.95, dashArray: p.modo === "aviao" ? null : "1 5", lineCap:"round", interactive:false }).addTo(g);
    }
  });
  // aeroportos marcados quando a viagem tem trecho aéreo
  pernas.filter(p=>p.modo==="aviao").forEach(p=>{
    [p.a, p.b].forEach(pt=>L.marker(pt, { interactive:false, icon:L.divIcon({ className:"mk-wrap", iconSize:null,
      html:`<div class="aero-mk" title="Aeroporto">✈</div>` }) }).addTo(g));
  });
  // veículo do trecho atual
  let atual = pernas.find(p=>decorrido < p.ini + p.dur) || pernas[pernas.length-1];
  const e = ease(Math.min(1, Math.max(0, (decorrido - atual.ini) / atual.dur)));
  const pos = pontoPerna(atual, e), prox = pontoPerna(atual, Math.min(1, e + 0.01));
  const ang = -Math.atan2(prox[0]-pos[0], prox[1]-pos[1]) * 180/Math.PI;
  const fimTotal = decorrido >= v.duracao ? Math.min(1, (decorrido - v.duracao)/1500) : 0;
  const obras = v.obras || [v.obra];
  const carga = obras.slice(0,3).map((o,i)=>`<img class="voo-carga" style="margin-left:${i? -9 : 0}px;z-index:${3-i}" src="${o.imagem}" alt="">`).join("");
  L.marker(pos, { interactive:false, zIndexOffset:900, icon:L.divIcon({ className:"mk-wrap", iconSize:null,
    html:`<div class="voo-mk ${atual.modo}" style="opacity:${(1-fimTotal).toFixed(2)}">
            <div class="${atual.modo === "aviao" ? "voo-aviao" : "voo-van"}" style="transform:rotate(${ang.toFixed(1)}deg)">${atual.modo === "aviao" ? SVG_AVIAO : SVG_VAN}</div>
            <div class="voo-cargas">${carga}${obras.length > 1 ? `<span class="voo-qtd">×${obras.length}</span>` : ""}</div>
          </div>` }) }).addTo(g);
}

function quadroVoos(){
  const g = Mapa.camadas.voos;
  if(g){
    const agora = Date.now();
    const antes = State.voos.length;
    State.voos = State.voos.filter(v => agora < v.inicio + v.duracao + 1500);
    if(State.voos.length !== antes){ updateHUD(); if(!State.voos.length) Mapa.seguindoVoo = false; }
    g.clearLayers();
    State.voos.forEach(v=>desenharViagem(g, v, agora));
  }
  atualizarRotulosAoVivo();
  requestAnimationFrame(quadroVoos);
}

/* --------------------------------------------------------- trilha (migalhas) */
function desenharMigalhas(){
  const el = document.getElementById("mapa-migalhas"); if(!el) return;
  const passos = [["Mundo", ()=>Mapa.irMundo()]];
  if(Mapa.cont) passos.push([Mapa.cont, ()=>Mapa.irContinente(Mapa.cont)]);
  if(Mapa.pais && Mapa.nivel>=3) passos.push([`${COUNTRIES[Mapa.pais].flag} ${Mapa.pais}`, ()=>Mapa.irPais(Mapa.pais)]);
  if(Mapa.estado && Mapa.nivel>=4) passos.push([EIDX[Mapa.estado].nome, ()=>Mapa.irEstado(Mapa.estado)]);
  if(Mapa.cidadeSel) passos.push([Mapa.cidadeSel.split("|")[1], null]);
  const nomes = ["", "Continentes", "Países", "Estados e regiões", "Cidades"];
  el.innerHTML = `${passos.length>1 ? `<button class="mg-voltar" title="Voltar (Esc)">⟵</button>` : ""}
    ${passos.map((p,i)=>`<button class="mg-passo ${i===passos.length-1?'atual':''}" data-i="${i}">${p[0]}</button>`).join('<span class="mg-sep">›</span>')}
    <span class="mg-camada">${Mapa.seguindoVoo ? "Acompanhando voo" : `Camada ${Mapa.nivel} · ${nomes[Mapa.nivel]}`}</span>`;
  el.querySelectorAll(".mg-passo").forEach(b=>b.addEventListener("click", ()=>{
    const f = passos[+b.dataset.i][1]; if(f){ AudioFX.click(); f(); }
  }));
  el.querySelector(".mg-voltar")?.addEventListener("click", ()=>{ AudioFX.click(); Mapa.subir(); });
}

/* ------------------------------------------------------- cartão da cidade */
function fecharCartao(){ const c = document.getElementById("mapa-cartao"); if(c){ c.classList.remove("aberto"); c.innerHTML=""; } }
function posicionarCartao(){ /* o cartão é fixo no canto; nada a reposicionar */ }

function mostrarCartaoCidade(pais, nome){
  const box = document.getElementById("mapa-cartao"); if(!box) return;
  const c = cidade(pais, nome), est = EIDX[c.estado];
  const ehSede = State.sede && State.sede.pais===pais && State.sede.cidade===nome;
  const iSala = SALA_CIDADES[pais] ? SALA_CIDADES[pais].indexOf(nome) : -1;
  const sala = iSala >= 0 ? salaInfo(salaId(pais, iSala)) : null;
  const ehLeilao = casaLeilaoCidade(pais) === nome;
  const convites = ehLeilao && typeof Auction!=="undefined" ? (Auction.garantirConvites(), Auction.convites.filter(v=>v.pais===pais)) : [];
  const expos = State.exhibitions.filter(e=>!e.ended).filter(e=>{ const l = cidadeDaExposicao(e); return l.pais===pais && l.cidade===nome; });
  const acervo = State.allArtworks.filter(w=>w.museu && w.museu.includes(nome));
  const tombadas = pais===CIDADE_TOMBADAS.pais && nome===CIDADE_TOMBADAS.cidade ? State.allArtworks.filter(w=>w.fixa) : [];
  const custoMudar = 50000;

  let html = `<button class="mc-x" title="Fechar">✕</button>
    <div class="mc-head"><span class="mc-flag">${COUNTRIES[pais].flag}</span>
      <div><div class="mc-nome">${nome}</div><div class="mc-sub">${est.nome}, ${pais}${c.pop ? ` · ${c.pop/1e6>=1 ? (c.pop/1e6).toFixed(1)+" mi" : Math.round(c.pop/1000)+" mil"} hab.` : ""}</div></div></div>`;

  if(ehSede) html += `<div class="mc-sec"><h4>🏛 Sua sede</h4><p>Suas obras ficam guardadas aqui entre uma exposição e outra.</p>
      <button class="btn btn-gold btn-sm" data-acao="entrar-sede">Entrar na sede</button></div>`;
  else html += `<div class="mc-sec"><h4>🏛 Sede</h4>
      <p>${State.sede ? `Sua sede fica em ${State.sede.cidade}. Mudar para cá custa ${fmtMoney(custoMudar)}.` : "Fixe aqui sua residência e galeria principal. As obras que você comprar viajam para cá."}</p>
      <button class="btn ${State.sede?'btn-outline':'btn-gold'} btn-sm" data-acao="sede" ${State.sede && State.cash<custoMudar?"disabled":""}>${State.sede?"Mudar sede para cá":"Fixar minha sede aqui"}</button></div>`;

  if(sala) html += `<div class="mc-sec"><h4>🏢 ${sala.nome} <span class="mc-est">${estrelasTxt(estrelas(sala.attrs))}</span></h4>
      <p>${sala.dono ? "Sala sua — sem aluguel" : `Aluguel ${fmtMoney(sala.aluguel)}/dia · compra ${fmtMoney(sala.preco)}`} · segurança ${sala.attrs.seg}% · rentabilidade ${faixaBonus(estrelas(sala.attrs))}</p>
      <button class="btn btn-gold btn-sm" data-acao="expor">Expor aqui</button>
      <button class="btn btn-outline btn-sm" data-acao="salas">${sala.dono?"Upgrades":"Ver ficha / comprar"}</button></div>`;

  if(ehLeilao) html += `<div class="mc-sec"><h4>🔨 Casa de leilões de ${nome}</h4>
      ${convites.length ? convites.map(v=>`<div class="mc-linha"><span>${v.titulo} · ${v.lotes.length} lotes</span>
        <button class="btn btn-gold btn-sm" data-pregao="${v.id}">Entrar</button></div>`).join("") : `<p>Nenhum pregão aberto agora.</p>`}</div>`;

  if(expos.length) html += `<div class="mc-sec"><h4>🖼 Exposições suas aqui</h4>${expos.map(e=>`
      <div class="mc-linha"><img src="${imgSrc(e.work)}" alt=""><span>${e.work.titulo}<small>${e.chegada && Date.now()<e.chegada ? "✈ em voo" : `dia ${e.dayIndex}/${e.durationDays} · ${fmtMoney(e.revenueAccum)}`}</small></span></div>`).join("")}
      <button class="btn btn-outline btn-sm" data-acao="expos">Ver exposições</button></div>`;

  if(tombadas.length) html += `<div class="mc-sec"><h4>⛪ Santuário do Bom Jesus de Matosinhos</h4>
      <p>${tombadas.length} obras tombadas do Aleijadinho: os 12 Profetas e os Passos da Paixão.</p></div>`;

  if(acervo.length) html += `<div class="mc-sec"><h4>🏛 Acervos desta cidade</h4><p>Obras do jogo guardadas em museus de ${nome} na vida real:</p>
      <div class="mc-chips">${acervo.slice(0,8).map(w=>`<button class="mc-chip" data-obra="${w.id}">${w.titulo}</button>`).join("")}</div></div>`;

  if(!sala && !ehLeilao && !expos.length && !acervo.length && !tombadas.length)
    html += `<p class="mc-vazio">Ainda não há galerias do jogo nesta cidade.</p>`;

  box.innerHTML = html;
  box.classList.add("aberto");
  if(ehFone()) document.getElementById("mapa-aviso")?.classList.remove("aberto");
  if(typeof L !== "undefined") L.DomEvent.disableClickPropagation(box), L.DomEvent.disableScrollPropagation(box);
  box.querySelector(".mc-x").addEventListener("click", ()=>{ Mapa.cidadeSel=null; fecharCartao(); Mapa.redesenhar(); if(ehFone() && !State.sede) mostrarBoasVindas(); });
  box.querySelectorAll("[data-acao]").forEach(b=>b.addEventListener("click", ()=>{
    AudioFX.click(); const a = b.dataset.acao;
    if(a==="entrar-sede") switchView("menu");
    if(a==="sede") fixarSede(pais, nome, State.sede ? custoMudar : 0);
    if(a==="expor"){ expoSetup.country=pais; expoSetup.salaId=sala.id; State.expoShowSetup=true; switchView("exposicao"); }
    if(a==="salas"){ salasPaisFiltro=pais; switchView("salas"); }
    if(a==="expos") switchView("exposicao");
  }));
  box.querySelectorAll("[data-pregao]").forEach(b=>b.addEventListener("click", ()=>{ AudioFX.click(); switchView("auction"); Auction.entrar(b.dataset.pregao); }));
  box.querySelectorAll("[data-obra]").forEach(b=>b.addEventListener("click", ()=>openWorkModal(State.allArtworks.find(w=>w.id===b.dataset.obra))));
}

function fixarSede(pais, nome, custo){
  if(custo && State.cash < custo) return;
  State.cash -= custo;
  State.sede = { pais, cidade:nome };
  AudioFX.success(); toast(`🏛 Sua sede agora é ${nome}`);
  document.getElementById("mapa-aviso")?.classList.remove("aberto");
  updateHUD(); Mapa.redesenhar(); mostrarCartaoCidade(pais, nome);
}

// celular: tela estreita, ou deitado (largura grande, altura minúscula) com toque
function ehFone(){ return !!(window.matchMedia && matchMedia("(max-width:760px), (max-height:520px) and (pointer:coarse)").matches); }

function mostrarBoasVindas(){
  const el = document.getElementById("mapa-aviso"); if(!el) return;
  el.innerHTML = `<div class="av-tit">Bem-vindo, marchand!</div>
    <p>Comece escolhendo a cidade da sua <b>sede</b>: é onde suas obras ficam guardadas.
    <span class="so-pc">Navegue pelo mapa — continente, país, estado, cidade — e clique em <b>Fixar minha sede aqui</b>. Ou vá direto a uma capital da arte:</span>
    <span class="so-fone">Toque numa capital da arte — ou navegue pelo mapa e toque em <b>Fixar minha sede aqui</b>:</span></p>
    <div class="av-atalhos">${PAISES_JOGO.map(p=>`<button class="chip" data-p="${p}">${COUNTRIES[p].flag} ${cidadePrincipal(p)}</button>`).join("")}</div>`;
  el.classList.add("aberto");
  if(typeof L !== "undefined") L.DomEvent.disableClickPropagation(el);
  el.querySelectorAll("[data-p]").forEach(b=>b.addEventListener("click", ()=>{
    AudioFX.click(); Mapa.irCidade(b.dataset.p, cidadePrincipal(b.dataset.p));
  }));
}
