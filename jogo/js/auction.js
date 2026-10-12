/* ============================================================================
   CASA DE LEILÕES
   O jogador recebe convites conforme a reputação, entra no pregão e disputa
   lote a lote contra concorrentes que têm orçamento e temperamento próprios.
   ============================================================================ */

const BUYER_PREMIUM = 0.15;        // comissão do comprador sobre o martelo
const AUCTION_REFRESH_MS = 4 * 60 * 1000;  // novos convites a cada 4 min
const CALL_MS = 2600;              // tempo de cada batida do martelo

// Concorrentes: teto é multiplicador sobre o valor de mercado do lote.
const RIVALS = [
  { nome:"Fundação Vasari",      tetoMin:0.85, tetoMax:1.15, agress:0.70, cor:"#c9a13b" },
  { nome:"Galeria Lumière",      tetoMin:0.90, tetoMax:1.30, agress:0.80, cor:"#7c9473" },
  { nome:"Colecionador anônimo", tetoMin:0.70, tetoMax:1.45, agress:0.55, cor:"#c15a5a" },
  { nome:"Museu Van Aerden",     tetoMin:0.95, tetoMax:1.20, agress:0.85, cor:"#6f8fb5" },
  { nome:"Herdeiros Lederer",    tetoMin:0.80, tetoMax:1.35, agress:0.60, cor:"#a678b4" },
  { nome:"Instituto Bandeirante",tetoMin:0.75, tetoMax:1.10, agress:0.65, cor:"#cf8a4a" },
];

const AUCTION_THEMES = [
  { nome:"Sessão Mestres do Norte", filtro:w=>["Holanda","Alemanha"].includes(w.pais) },
  { nome:"Noite Italiana",          filtro:w=>w.pais==="Itália" },
  { nome:"Pregão Francês",          filtro:w=>w.pais==="França" },
  { nome:"Leilão de Obras sobre Papel", filtro:w=>/papel|linho/i.test(w.tecnica) },
  { nome:"Sessão de Gala",          filtro:w=>w.tier>=5 },
  { nome:"Pregão Aberto",           filtro:()=>true },
];

const Auction = {
  convites: [],
  ultimoRefresh: 0,
  sessao: null,      // leilão em andamento
  handle: null,

  // A reputação abre portas: mais convites e lotes melhores.
  gerarConvites(){
    const rep = State.reputation;
    const qtd = rep >= 70 ? 3 : rep >= 40 ? 2 : 1;
    const temas = shuffle(AUCTION_THEMES).slice(0, qtd);
    const jaLoteado = new Set();          // uma obra só pode estar num pregão
    this.convites = temas.map((tema, i)=>{
      let pool = State.allArtworks.filter(tema.filtro)
        .filter(w=>!State.collection.some(o=>o.id===w.id) && !jaLoteado.has(w.id));
      // reputação baixa não recebe os lotes mais cobiçados
      if(rep < 40) pool = pool.filter(w=>w.tier <= 4);
      else if(rep < 70) pool = pool.filter(w=>w.tier <= 5);
      const lotes = shuffle(pool).slice(0, 3 + Math.floor(Math.random()*2));
      lotes.forEach(w=>jaLoteado.add(w.id));
      return {
        id: "auc"+Date.now()+"_"+i,
        titulo: tema.nome,
        lotes,
        prestigio: lotes.length ? Math.round(lotes.reduce((s,w)=>s+w.tier,0)/lotes.length) : 1,
        // o pregão acontece no país de onde vem a maioria dos lotes
        pais: (()=>{
          const cont = {};
          lotes.forEach(w=>{ cont[w.pais] = (cont[w.pais]||0) + 1; });
          return Object.keys(cont).sort((a,b)=>cont[b]-cont[a])[0] || "Reino Unido";
        })(),
      };
    }).filter(c=>c.lotes.length >= 2);
    this.ultimoRefresh = Date.now();
  },

  // Obra que passou a ser sua sai dos convites que ainda não começaram.
  // (O lote em disputa no pregão atual é tratado em abrirLote/martelar.)
  retirarObra(id){
    this.convites.forEach(c=>{ c.lotes = c.lotes.filter(w=>w.id!==id); });
    this.convites = this.convites.filter(c=>c.lotes.length >= 1);
  },

  garantirConvites(){
    if(!this.convites.length || Date.now()-this.ultimoRefresh > AUCTION_REFRESH_MS){
      this.gerarConvites();
    }
  },

  entrar(conviteId){
    const conv = this.convites.find(c=>c.id===conviteId);
    if(!conv) return;
    this.sessao = {
      convite: conv,
      indice: 0,
      arrematados: [],
      perdidos: [],
      lote: null,
    };
    this.convites = this.convites.filter(c=>c.id!==conviteId);
    this.abrirLote();
  },

  abrirLote(){
    const s = this.sessao;
    if(!s) return;
    if(s.indice >= s.convite.lotes.length){ this.encerrarSessao(); return; }
    // lote que virou seu (comprado por outra via) é retirado do pregão
    while(s.indice < s.convite.lotes.length && State.collection.some(o=>o.id===s.convite.lotes[s.indice].id)){
      s.indice++;
    }
    if(s.indice >= s.convite.lotes.length){ this.encerrarSessao(); return; }
    const obra = s.convite.lotes[s.indice];
    const mercado = Market.valueOf(obra);

    // Dois a três concorrentes, cada um com seu teto secreto
    const participantes = shuffle(RIVALS).slice(0, 2 + Math.floor(Math.random()*2)).map(r=>({
      ...r,
      teto: Math.round(mercado * (r.tetoMin + Math.random()*(r.tetoMax-r.tetoMin))),
      fora: false,
    }));

    s.lote = {
      obra,
      mercado,
      // abertura entre 55% e 70% do valor de mercado
      preco: Math.round(mercado * (0.55 + Math.random()*0.15) / 100) * 100,
      arrematante: null,      // null = ninguém ainda; "voce" ou nome do rival
      participantes,
      batidas: 0,             // 0..3 -> "uma", "duas", "vendido"
      encerrado: false,
      log: [],
    };
    this.registrar("O leiloeiro abre o lote.", "info");
    renderAuction();
    this.agendarBatida();
  },

  incremento(){
    const p = this.sessao.lote.preco;
    const passo = p < 100000 ? 0.08 : p < 1000000 ? 0.06 : 0.04;
    return Math.max(1000, Math.round(p * passo / 500) * 500);
  },

  registrar(texto, cls){
    const l = this.sessao && this.sessao.lote;
    if(l) l.log.push({ texto, cls });
  },

  // Lance do jogador
  lanceJogador(){
    const l = this.sessao && this.sessao.lote;
    if(!l || l.encerrado) return;
    const novo = l.arrematante === null ? l.preco : l.preco + this.incremento();
    const custoFinal = Math.round(novo * (1 + BUYER_PREMIUM)) + logisticaCompra(l.obra, this.sessao.convite.pais, novo).total;
    if(State.cash < custoFinal){
      this.registrar(`Saldo insuficiente: com a comissão daria ${fmtMoney(custoFinal)}.`, "bad");
      renderAuction();
      return;
    }
    l.preco = novo;
    l.arrematante = "voce";
    l.batidas = 0;
    AudioFX.click();
    this.registrar(`Você deu ${fmtMoney(novo)}.`, "voce");
    renderAuction();
    this.agendarResposta();
  },

  passar(){
    const l = this.sessao && this.sessao.lote;
    if(!l || l.encerrado) return;
    // Desistir é deixar o martelo correr até o fim
    l.desistiu = true;
    this.registrar("Você passou este lote.", "info");
    renderAuction();
  },

  // Um rival pode cobrir o lance do jogador
  agendarResposta(){
    clearTimeout(this.handle);
    const l = this.sessao.lote;
    const proximo = l.preco + this.incremento();
    const candidatos = l.participantes.filter(r=>!r.fora && r.teto >= proximo);
    if(!candidatos.length){ this.agendarBatida(); return; }

    const r = candidatos[Math.floor(Math.random()*candidatos.length)];
    if(Math.random() > r.agress){ this.agendarBatida(); return; }

    this.handle = setTimeout(()=>{
      if(!this.sessao || l.encerrado) return;
      l.preco = proximo;
      l.arrematante = r.nome;
      l.batidas = 0;
      AudioFX.tick();
      this.registrar(`${r.nome} cobre com ${fmtMoney(proximo)}.`, "rival");
      renderAuction();
      this.agendarBatida();
    }, 900 + Math.random()*1500);
  },

  // Martelo: três batidas sem novo lance e o lote é vendido
  agendarBatida(){
    clearTimeout(this.handle);
    const l = this.sessao && this.sessao.lote;
    if(!l || l.encerrado) return;
    this.handle = setTimeout(()=>{
      if(!this.sessao || l.encerrado) return;
      l.batidas++;
      if(l.batidas >= 3){ this.martelar(); return; }
      AudioFX.tick();
      renderAuction();
      // entre as batidas, um rival ainda pode entrar
      if(l.arrematante !== "voce"){ this.agendarResposta(); }
      else { this.agendarBatida(); }
    }, CALL_MS);
  },

  martelar(){
    const s = this.sessao;
    const l = s.lote;
    l.encerrado = true;
    clearTimeout(this.handle);

    if(l.arrematante === "voce" && State.collection.some(o=>o.id===l.obra.id)){
      this.registrar("Lote cancelado: esta obra já está na sua coleção. Nada foi cobrado.", "info");
    } else if(l.arrematante === "voce"){
      const comissao = Math.round(l.preco * BUYER_PREMIUM);
      const total = l.preco + comissao;
      const log = logisticaCompra(l.obra, s.convite.pais, l.preco);
      State.cash -= total + log.total;
      addToCollection(l.obra, total);
      despacharCompra(l.obra, log);
      AudioFX.success();
      s.arrematados.push({ obra:l.obra, martelo:l.preco, total });
      this.registrar(`Arrematado por você: ${fmtMoney(l.preco)} + ${fmtMoney(comissao)} de comissão.`, "voce");
    } else if(l.arrematante){
      AudioFX.error();
      s.perdidos.push({ obra:l.obra, martelo:l.preco, quem:l.arrematante });
      this.registrar(`Vendido a ${l.arrematante} por ${fmtMoney(l.preco)}.`, "rival");
    } else {
      s.perdidos.push({ obra:l.obra, martelo:0, quem:"— sem lances" });
      this.registrar("Lote retirado: ninguém deu lance.", "info");
    }
    updateHUD();
    renderAuction();
  },

  proximoLote(){
    clearTimeout(this.handle);
    this.sessao.indice++;
    this.abrirLote();
  },

  encerrarSessao(){
    clearTimeout(this.handle);
    const s = this.sessao;
    this.sessao = null;
    renderAuctionResumo(s);
  },

  sair(){
    clearTimeout(this.handle);
    this.sessao = null;
    renderAuction();
  },
};

/* ----------------------------------------------------------------------------
   TELAS
   ---------------------------------------------------------------------------- */
function renderAuction(){
  const el = document.getElementById("view-auction");
  const s = Auction.sessao;

  // ---- lista de convites ----
  if(!s){
    Auction.garantirConvites();
    el.innerHTML = `
      <div class="view-inner">
        <h1 class="page-title">Casa de Leilões</h1>
        <p class="page-sub">Convites chegam conforme sua reputação (${Math.round(State.reputation)}). Comissão do comprador: ${Math.round(BUYER_PREMIUM*100)}% sobre o martelo.</p>
        <div id="auc-list"></div>
      </div>`;
    const list = document.getElementById("auc-list");
    list.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;";
    if(!Auction.convites.length){
      list.innerHTML = `<div class="empty-state"><div class="icon">✉️</div><p>Nenhum convite no momento. Ganhe reputação expondo obras.</p></div>`;
      return;
    }
    Auction.convites.forEach(c=>{
      const card = document.createElement("div");
      card.className = "panel auc-card";
      card.innerHTML = `
        <div class="auc-selo">CONVITE</div>
        <h3 class="auc-titulo">${c.titulo}</h3>
        <div class="auc-sub">${COUNTRIES[c.pais]?.flag || ""} ${c.pais} · ${c.lotes.length} lotes · prestígio ${"★".repeat(Math.max(1,c.prestigio-2))}</div>
        <div class="auc-minis">${c.lotes.slice(0,4).map(w=>`<img src="${imgSrc(w)}" alt="">`).join("")}</div>
        <button class="btn btn-gold" data-enter="${c.id}">Comparecer ao pregão</button>`;
      card.querySelector("[data-enter]").addEventListener("click", ()=>{
        AudioFX.click();
        Auction.entrar(c.id);
      });
      list.appendChild(card);
    });
    return;
  }

  // ---- pregão em andamento ----
  const l = s.lote;
  const chamada = ["", "Dou-lhe uma…", "Dou-lhe duas…", "Vendido!"][l.batidas] || "";
  const inc = Auction.incremento();
  const proximoLance = l.arrematante === null ? l.preco : l.preco + inc;
  const custoComPremio = Math.round(proximoLance * (1+BUYER_PREMIUM)) + logisticaCompra(l.obra, s.convite.pais, proximoLance).total;
  const revendaLiquida = Math.round(l.mercado * (1 - SALE_COMMISSION));
  const resultadoRevenda = revendaLiquida - custoComPremio;
  const venceu = l.encerrado && l.arrematante === "voce";

  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">${s.convite.titulo}</h1>
      <p class="page-sub">Lote ${s.indice+1} de ${s.convite.lotes.length}</p>
      <div class="panel auc-floor">
        <div class="auc-lote">
          <img class="auc-img" src="${imgSrc(l.obra)}" alt="">
          <div class="auc-info">
            <div class="auc-lote-t">${l.obra.titulo}</div>
            <div class="auc-lote-a">${l.obra.artista} · ${l.obra.pais} · ${l.obra.data_obra}</div>
            <div class="auc-est">Estimativa da casa: ${fmtMoney(Math.round(l.mercado*0.9))} – ${fmtMoney(Math.round(l.mercado*1.15))}</div>
            <div class="auc-preco-lbl">${l.arrematante ? "Lance atual" : "Lance de abertura"}</div>
            <div class="auc-preco">${fmtMoney(l.preco)}</div>
            <div class="auc-quem ${l.arrematante==="voce"?"meu":""}">
              ${l.arrematante ? (l.arrematante==="voce" ? "✋ O lance é seu" : `com ${l.arrematante}`) : "aguardando o primeiro lance"}
            </div>
            <div class="auc-chamada ${l.batidas>=3?'final':''}">${chamada}</div>
          </div>
        </div>

        ${l.encerrado ? `
          <div class="auc-resultado ${venceu?'ok':'bad'}">
            ${venceu
              ? `Arrematado! Pagou ${fmtMoney(l.preco)} + ${Math.round(BUYER_PREMIUM*100)}% de comissão.`
              : (l.arrematante ? `Vendido a ${l.arrematante}.` : "Lote retirado sem lances.")}
          </div>
          <div class="action-row" style="justify-content:center;">
            <button class="btn btn-gold" id="auc-next">${s.indice+1 >= s.convite.lotes.length ? "Encerrar pregão" : "Próximo lote"}</button>
          </div>`
        : `
          <div class="action-row" style="justify-content:center;">
            <button class="btn btn-gold" id="auc-bid" ${(l.desistiu||State.cash<custoComPremio)?"disabled":""}>
              ${l.arrematante===null ? `Abrir com ${fmtMoney(proximoLance)}` : `Cobrir: ${fmtMoney(proximoLance)}`}
            </button>
            <button class="btn btn-outline" id="auc-pass" ${l.desistiu?"disabled":""}>Passar</button>
          </div>
          <div class="auc-nota">Com a comissão, o frete e o imposto até a sua sede, seu lance sairia por ${fmtMoney(custoComPremio)}${State.cash<custoComPremio? " — acima do seu saldo" : ""}.</div>
          <div class="auc-nota ${resultadoRevenda>=0?"mkt-up":"mkt-down"}">Se revender pelo mercado (${fmtMoney(l.mercado)} − ${Math.round(SALE_COMMISSION*100)}% = ${fmtMoney(revendaLiquida)}):
            <b>${resultadoRevenda>=0 ? "lucro" : "prejuízo"} de ${fmtMoney(Math.abs(resultadoRevenda))} (${resultadoRevenda>=0?"+":"−"}${Math.abs(resultadoRevenda/custoComPremio*100).toFixed(1)}%)</b>.</div>`}

        <div class="auc-log" id="auc-log"></div>
        <div class="action-row" style="justify-content:center;margin-top:10px;">
          <button class="btn btn-danger btn-sm" id="auc-leave">Deixar o pregão</button>
        </div>
      </div>
    </div>`;

  const log = document.getElementById("auc-log");
  l.log.slice(-7).forEach(it=>{
    const d = document.createElement("div");
    d.className = "auc-log-item " + it.cls;
    d.textContent = it.texto;
    log.prepend(d);
  });

  const bid = document.getElementById("auc-bid");
  if(bid) bid.addEventListener("click", ()=>Auction.lanceJogador());
  const pass = document.getElementById("auc-pass");
  if(pass) pass.addEventListener("click", ()=>Auction.passar());
  const next = document.getElementById("auc-next");
  if(next) next.addEventListener("click", ()=>{ AudioFX.click(); Auction.proximoLote(); });
  document.getElementById("auc-leave").addEventListener("click", ()=>{ AudioFX.click(); Auction.sair(); });
}

function renderAuctionResumo(s){
  const el = document.getElementById("view-auction");
  const gasto = s.arrematados.reduce((a,x)=>a+x.total,0);
  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Fim do pregão</h1>
      <div class="panel" style="text-align:center;">
        <div class="quiz-score">${s.arrematados.length} lote(s) arrematado(s)</div>
        ${gasto? `<div class="quiz-prize pos">${fmtMoney(gasto)} investidos</div>` : `<div class="quiz-prize zero">Você saiu sem comprar</div>`}
        <div class="auc-resumo">
          ${s.arrematados.map(x=>`<div class="qr hit"><div class="qr-q">Arrematado</div>
            <div class="qr-a">${x.obra.titulo} — ${fmtMoney(x.total)} com comissão</div></div>`).join("")}
          ${s.perdidos.map(x=>`<div class="qr miss"><div class="qr-q">Perdido</div>
            <div class="qr-a">${x.obra.titulo} — ${x.quem}${x.martelo? " por "+fmtMoney(x.martelo):""}</div></div>`).join("")}
        </div>
        <div class="action-row" style="justify-content:center;">
          <button class="btn btn-gold" id="auc-done">Voltar aos convites</button>
        </div>
      </div>
    </div>`;
  document.getElementById("auc-done").addEventListener("click", ()=>{ AudioFX.click(); renderAuction(); });
}
