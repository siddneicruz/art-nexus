/* ============================================================================
   CARREIRA — dá direção, memória e recompensa ao jogo.
   · Missões em capítulos: sempre há um próximo passo claro, com prêmio.
   · Álbum de artistas: cada obra que passa pelas suas mãos (compra, leilão,
     troca ou gabarito no Teste do Curador) revela seu artista; completar
     todas as obras de um artista dá prêmio. Aprender vira colecionar.
   · Painel: patrimônio ao longo do tempo, lucro por exposição, recordes.
   · Celebração quando o jogador sobe de classe.
   Os ganchos envolvem funções já existentes (sem reescrevê-las).
   ============================================================================ */

function patrimonio(){
  const obras = State.collection.reduce((s,o)=>s+Market.valueOf(o), 0);
  const divida = typeof Banco !== "undefined" ? Banco.divida() : 0;
  return Math.round(State.cash + obras - divida);
}
function metricas(){
  if(!State.metricas) State.metricas = { patrimonioHist:[], exposicoesIniciadas:0, exposicoesConcluidas:0,
    receitaTotal:0, lucroExposicoes:0, publicoTotal:0, arremates:0, acertosQuiz:0, melhorExpo:null, historico:[] };
  return State.metricas;
}
function album(){
  if(!State.album) State.album = { obras:{}, artistasCompletos:{} };
  return State.album;
}

/* ------------------------------------------------------------------ álbum */
function descobrirObra(w, origem){
  if(!w || !w.id) return;
  const A = album();
  if(A.obras[w.id]) return;
  A.obras[w.id] = origem || "coleção";
  const doArtista = State.allArtworks.filter(x=>x.artista===w.artista);
  const descobertas = doArtista.filter(x=>A.obras[x.id]).length;
  if(descobertas === doArtista.length && !A.artistasCompletos[w.artista]){
    A.artistasCompletos[w.artista] = true;
    const premio = 20000 * doArtista.length;
    State.cash += premio;
    State.reputation = Math.min(100, State.reputation + 2);
    celebrar("🎨", `Artista completo: ${w.artista}`, `Você conheceu todas as ${doArtista.length} obra(s) do acervo. Prêmio: ${fmtMoney(premio)} e +2 de reputação.`);
  } else if(descobertas === 1){
    toast(`🎨 Novo artista no seu Álbum: ${w.artista}`);
  }
}
function artistasDoAcervo(){
  const mapa = {};
  State.allArtworks.forEach(w=>{ (mapa[w.artista] = mapa[w.artista] || []).push(w); });
  return Object.entries(mapa).map(([nome, obras])=>({ nome, obras,
    descobertas: obras.filter(w=>album().obras[w.id]).length })).sort((a,b)=>b.descobertas-a.descobertas || a.nome.localeCompare(b.nome));
}

/* ---------------------------------------------------------------- missões */
const CAPITULOS = [
  { nome:"Primeiros passos", missoes:[
    { id:"sede",   txt:"Fixe a cidade da sua sede no mapa", prog:()=>[State.sede?1:0, 1], premio:{cash:20000} },
    { id:"obra1",  txt:"Compre sua primeira obra", prog:()=>[Math.min(1,State.collection.length),1], premio:{cash:30000} },
    { id:"expo1",  txt:"Inicie sua primeira exposição", prog:()=>[Math.min(1,metricas().exposicoesIniciadas),1], premio:{cash:40000, rep:2} },
    { id:"quiz2",  txt:"Acerte 3 perguntas no Teste do Curador", prog:()=>[Math.min(3,metricas().acertosQuiz),3], premio:{cash:30000, rep:2} },
  ]},
  { nome:"Marchand em ascensão", missoes:[
    { id:"paises3",txt:"Tenha obras de 3 países diferentes na coleção", prog:()=>[Math.min(3,new Set(State.collection.map(o=>o.pais)).size),3], premio:{cash:80000} },
    { id:"expo2p", txt:"Exponha em 2 países ao mesmo tempo", prog:()=>[Math.min(2,new Set(State.exhibitions.filter(e=>!e.ended&&!e.fixa).map(e=>e.country)).size),2], premio:{cash:100000, rep:3} },
    { id:"leilao1",txt:"Arremate uma obra em leilão", prog:()=>[Math.min(1,metricas().arremates),1], premio:{cash:120000, rep:2} },
    { id:"pat1m",  txt:"Alcance € 1 milhão de patrimônio", prog:()=>[Math.min(1e6,patrimonio()),1e6], premio:{cash:150000, rep:3}, dinheiro:true },
  ]},
  { nome:"Colecionador internacional", missoes:[
    { id:"artista",txt:"Complete todas as obras de um artista no Álbum", prog:()=>[Math.min(1,Object.keys(album().artistasCompletos).length),1], premio:{cash:250000, rep:3} },
    { id:"sala1",  txt:"Compre uma sala de exposição", prog:()=>[Object.values(State.salas||{}).some(s=>s.dono)?1:0,1], premio:{cash:300000} },
    { id:"lucro5", txt:"Some € 500 mil de lucro em exposições", prog:()=>[Math.max(0,Math.min(5e5,metricas().lucroExposicoes)),5e5], premio:{cash:300000, rep:4}, dinheiro:true },
    { id:"classe30",txt:"Chegue à classe 30", prog:()=>[Math.min(30,classeDe(State.reputation)),30], premio:{cash:400000} },
  ]},
  { nome:"Lenda do mercado", missoes:[
    { id:"artistas20",txt:"Descubra 20 artistas no Álbum", prog:()=>[Math.min(20,artistasDoAcervo().filter(a=>a.descobertas).length),20], premio:{cash:500000, rep:4} },
    { id:"lendaria",txt:"Possua uma obra Lendária", prog:()=>[State.collection.some(o=>o.tier===6)?1:0,1], premio:{cash:600000} },
    { id:"pat10m", txt:"Alcance € 10 milhões de patrimônio", prog:()=>[Math.min(1e7,patrimonio()),1e7], premio:{cash:1000000, rep:5}, dinheiro:true },
    { id:"classe45",txt:"Chegue à classe 45 — Mecenas lendário", prog:()=>[Math.min(45,classeDe(State.reputation)),45], premio:{cash:2000000} },
  ]},
];
function estadoMissoes(){ if(!State.missoes) State.missoes = { feitas:{} }; return State.missoes; }
function capituloAtual(){
  const M = estadoMissoes();
  const i = CAPITULOS.findIndex(c=>c.missoes.some(m=>!M.feitas[m.id]));
  return i === -1 ? CAPITULOS.length : i;
}
function checarMissoes(){
  const M = estadoMissoes();
  const cap = CAPITULOS[capituloAtual()];
  if(!cap) return;
  cap.missoes.forEach(m=>{
    if(M.feitas[m.id]) return;
    const [a, meta] = m.prog();
    if(a >= meta){
      M.feitas[m.id] = Date.now();
      State.cash += m.premio.cash || 0;
      if(m.premio.rep) State.reputation = Math.min(100, State.reputation + m.premio.rep);
      AudioFX.success();
      toast(`🏅 Missão cumprida: ${m.txt} (+${fmtMoney(m.premio.cash||0)})`);
      if(cap.missoes.every(x=>M.feitas[x.id])){
        const prox = CAPITULOS[capituloAtual()];
        celebrar("📜", `Capítulo concluído: ${cap.nome}`, prox ? `Próximo capítulo: ${prox.nome}.` : "Você completou a carreira inteira. Lenda!");
      }
      updateHUD();
      if(typeof Save !== "undefined") Save.salvar();
    }
  });
  desenharRastreador();
}
function premioTxt(p){ return [p.cash?fmtMoney(p.cash):"", p.rep?`+${p.rep} rep.`:""].filter(Boolean).join(" · "); }
function progTxt(m){
  const [a, meta] = m.prog();
  return m.dinheiro ? `${fmtMoney(a)} / ${fmtMoney(meta)}` : `${a}/${meta}`;
}

// rastreador de missão no canto do mapa (como o "quest tracker" de RPGs)
function desenharRastreador(){
  let el = document.getElementById("rastreador");
  if(!el){
    const palco = document.getElementById("palco"); if(!palco) return;
    el = document.createElement("div"); el.id = "rastreador"; palco.appendChild(el);
    el.addEventListener("click", ()=>{ AudioFX.click(); carreiraAba = "missoes"; switchView("carreira"); });
  }
  const iCap = capituloAtual(), cap = CAPITULOS[iCap];
  if(!cap){ el.innerHTML = `<div class="rt-cap">Carreira completa 🏆</div>`; return; }
  const M = estadoMissoes();
  const m = cap.missoes.find(x=>!M.feitas[x.id]);
  const [a, meta] = m.prog();
  const feitas = cap.missoes.filter(x=>M.feitas[x.id]).length;
  el.innerHTML = `<div class="rt-cap">Capítulo ${iCap+1} · ${cap.nome} <span>${feitas}/${cap.missoes.length}</span></div>
    <div class="rt-txt">${m.txt}</div>
    <div class="rt-barra"><span style="width:${Math.min(100, a/meta*100).toFixed(1)}%"></span></div>
    <div class="rt-rodape"><span>${progTxt(m)}</span><span>🎁 ${premioTxt(m.premio)}</span></div>`;
}

/* ------------------------------------------------------------ celebração */
function celebrar(icone, titulo, texto){
  // um cartão dourado no canto, junto das outras mensagens — não cobre a tela
  AudioFX.success();
  Eventos.mostrar({ icone, titulo, corpo: texto, classeExtra: "conquista", decisao: false,
    acoes: [{ label:"OK", classe:"btn-outline", onClick:()=>{} }], duracaoMs: Math.max(8000, Config.duracaoMs() || 0) || undefined });
}

/* ------------------------------------------------------------- tela única */
let carreiraAba = "missoes";
function renderCarreira(){
  const el = document.getElementById("view-carreira"); if(!el) return;
  const abas = [["missoes","🏅 Medalhas"],["album","🎨 Álbum de artistas"],["painel","📊 Painel"]];
  el.innerHTML = `<div class="view-inner">
    <h1 class="page-title">Carreira</h1>
    <div class="filters" id="car-abas">${abas.map(([k,t])=>`<button class="chip ${k===carreiraAba?'selected':''}" data-aba="${k}">${t}</button>`).join("")}</div>
    <div id="car-corpo"></div></div>`;
  el.querySelectorAll("[data-aba]").forEach(b=>b.addEventListener("click", ()=>{ carreiraAba=b.dataset.aba; AudioFX.click(); renderCarreira(); }));
  const corpo = document.getElementById("car-corpo");
  if(carreiraAba === "missoes") corpo.innerHTML = htmlMissoes();
  if(carreiraAba === "album") { corpo.innerHTML = htmlAlbum(); ligarAlbum(corpo); }
  if(carreiraAba === "painel") corpo.innerHTML = htmlPainel();
}

const METAIS = [
  { nome:"Bronze",  a:"#e0a36a", b:"#8a4f24", fita:["#7a1f30","#c9a13b"] },
  { nome:"Prata",   a:"#f2f2f2", b:"#8e9aa3", fita:["#2e3f5c","#c0c7cf"] },
  { nome:"Ouro",    a:"#ffe69a", b:"#b8862b", fita:["#6a1f2c","#e8c766"] },
  { nome:"Platina", a:"#e6fbff", b:"#7fb3c2", fita:["#1f3a4a","#bfe8f0"] },
];
const ICONE_MISSAO = { sede:"🏛", obra1:"🖼", expo1:"🎨", quiz2:"📜", paises3:"🌍", expo2p:"✈", leilao1:"🔨", pat1m:"💰",
  artista:"⭐", sala1:"🏢", lucro5:"📈", classe30:"🎖", artistas20:"🖌", lendaria:"👑", pat10m:"💎", classe45:"🏆" };

function medalhaSVG(metal, icone, estado, frac, id){
  const m = METAIS[metal], R = 30, C = 2*Math.PI*(R+5);
  const gid = `mg-${id}`;
  const cinza = estado !== "feita";
  return `<svg class="medalha-svg" viewBox="0 0 80 104">
    <defs><radialGradient id="${gid}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${cinza?"#5a5448":m.a}"/><stop offset="1" stop-color="${cinza?"#2a2620":m.b}"/></radialGradient></defs>
    <path d="M22,0 L38,0 L46,40 L30,40 Z" fill="${cinza?"#3a3530":m.fita[0]}"/>
    <path d="M58,0 L42,0 L34,40 L50,40 Z" fill="${cinza?"#4a443c":m.fita[1]}"/>
    ${estado==="andamento" ? `<circle cx="40" cy="66" r="${R+5}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="4"/>
      <circle cx="40" cy="66" r="${R+5}" fill="none" stroke="${m.a}" stroke-width="4" stroke-linecap="round"
        stroke-dasharray="${(C*frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 40 66)"/>` : ""}
    <circle cx="40" cy="66" r="${R}" fill="url(#${gid})" stroke="${cinza?"#1a1714":m.b}" stroke-width="2"/>
    <circle cx="40" cy="66" r="${R-6}" fill="none" stroke="${cinza?"rgba(255,255,255,.06)":"rgba(255,255,255,.35)"}" stroke-width="1.5" stroke-dasharray="2 3"/>
    <text x="40" y="74" text-anchor="middle" font-size="22" ${cinza?'opacity=".35"':""}>${estado==="bloqueada" ? "🔒" : icone}</text>
  </svg>`;
}

function htmlMissoes(){
  const M = estadoMissoes(), atual = capituloAtual();
  const todas = CAPITULOS.flatMap(c=>c.missoes), feitas = todas.filter(m=>M.feitas[m.id]).length;
  const dataTxt = ts => new Date(ts).toLocaleDateString("pt-BR");
  return `<div class="med-resumo"><b>${feitas}</b> de ${todas.length} medalhas conquistadas
      <div class="rt-barra"><span style="width:${(feitas/todas.length*100).toFixed(1)}%"></span></div></div>
    ${CAPITULOS.map((cap, i)=>{
      const bloqueado = i > atual, completo = i < atual, metal = METAIS[i];
      return `<div class="vitrine ${bloqueado?'bloq':''} ${completo?'completa':''}">
        <div class="vit-cab"><span class="vit-metal" style="background:linear-gradient(135deg,${metal.a},${metal.b})"></span>
          <b>Capítulo ${i+1} · ${cap.nome}</b><small>Medalhas de ${metal.nome.toLowerCase()}</small>
          ${completo ? `<span class="vit-trofeu" title="Capítulo concluído">🏆</span>` : ""}</div>
        <div class="vit-prateleira">${cap.missoes.map(m=>{
          const feita = M.feitas[m.id], [a, meta] = m.prog();
          const estado = feita ? "feita" : bloqueado ? "bloqueada" : "andamento";
          return `<div class="medalha ${estado}">
            ${medalhaSVG(i, ICONE_MISSAO[m.id]||"🏅", estado, Math.min(1, a/meta), m.id)}
            <div class="med-nome">${bloqueado ? "???" : m.txt}</div>
            <div class="med-info">${feita ? `Conquistada em ${dataTxt(feita)}` : bloqueado ? "Capítulo bloqueado" : progTxt(m)}</div>
            ${!bloqueado && !feita ? `<div class="med-premio">🎁 ${premioTxt(m.premio)}</div>` : ""}
          </div>`;
        }).join("")}</div>
      </div>`;
    }).join("")}`;
}

function vidaArtista(w){
  const ano = t => ((t||"").match(/\b(1[0-9]{3}|20[0-9]{2})\b/)||[])[0];
  const n = ano(w.nascimento), f = ano(w.falecimento);
  return n ? `${n}${f?` – ${f}`:""}` : "";
}
function htmlAlbum(){
  const lista = artistasDoAcervo();
  const conhecidos = lista.filter(a=>a.descobertas).length;
  const obrasTot = State.allArtworks.length, obrasDesc = Object.keys(album().obras).length;
  return `<p class="page-sub">Toda obra que passa pelas suas mãos — compra, leilão, troca ou gabarito no Teste do Curador —
      entra no álbum. Complete todas as obras de um artista para ganhar um prêmio.</p>
    <div class="alb-resumo"><b>${conhecidos}</b> de ${lista.length} artistas · <b>${obrasDesc}</b> de ${obrasTot} obras descobertas
      <div class="rt-barra"><span style="width:${(obrasDesc/obrasTot*100).toFixed(1)}%"></span></div></div>
    <div class="alb-grade">${lista.map(a=>{
      const w0 = a.obras.find(w=>album().obras[w.id]) || a.obras[0];
      const completo = album().artistasCompletos[a.nome];
      const oculto = !a.descobertas;
      return `<div class="alb-card ${oculto?'oculto':''} ${completo?'completo':''}">
        <div class="alb-nome">${oculto ? "Artista desconhecido" : a.nome}${completo?' ⭐':''}</div>
        <div class="alb-meta">${oculto ? `${a.obras.length} obra(s) a descobrir` : `${w0.pais} · ${vidaArtista(w0)} · ${w0.movimento||""}`}</div>
        <div class="alb-obras">${a.obras.map(w=> album().obras[w.id]
          ? `<img src="${imgSrc(w)}" title="${w.titulo}" data-alb-obra="${w.id}" alt="">`
          : `<span class="alb-vaga" title="Obra ainda não descoberta">?</span>`).join("")}</div>
        <div class="alb-prog">${a.descobertas}/${a.obras.length}</div>
      </div>`;
    }).join("")}</div>`;
}
function ligarAlbum(corpo){
  corpo.querySelectorAll("[data-alb-obra]").forEach(img=>img.addEventListener("click", ()=>{
    openWorkModal(State.allArtworks.find(w=>w.id===img.dataset.albObra));
  }));
}

function htmlPainel(){
  const M = metricas();
  const h = M.patrimonioHist;
  let grafico = `<p class="car-sub">O gráfico aparece depois de alguns dias de mercado.</p>`;
  if(h.length >= 3){
    const vals = h.map(p=>p.v), min = Math.min(...vals), max = Math.max(...vals), W=600, H=140;
    const pts = vals.map((v,i)=>`${(i/(vals.length-1)*W).toFixed(1)},${(H-8-(max===min?.5:(v-min)/(max-min))*(H-16)).toFixed(1)}`).join(" ");
    const subiu = vals[vals.length-1] >= vals[0];
    grafico = `<svg class="grafico-preco" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:140px">
      <polyline points="${pts}" fill="none" stroke="${subiu?'#7c9473':'#c15a5a'}" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>
      <div class="gp-legenda"><span>mín. ${fmtMoney(min)}</span><span>${h.length} dias registrados</span><span>máx. ${fmtMoney(max)}</span></div>`;
  }
  const roi = M.historico.length ? M.historico.reduce((s,x)=>s+x.lucro,0) / Math.max(1, M.historico.reduce((s,x)=>s+x.custo,0)) * 100 : 0;
  const kpi = (rot, val, cls="") => `<div class="kpi ${cls}"><small>${rot}</small><b>${val}</b></div>`;
  return `<div class="kpis">
      ${kpi("Patrimônio líquido", fmtMoney(patrimonio()))}
      ${kpi("Lucro com exposições", fmtMoney(M.lucroExposicoes), M.lucroExposicoes>=0?"up":"down")}
      ${kpi("Retorno médio (ROI)", `${roi>=0?"+":""}${roi.toFixed(0)}%`, roi>=0?"up":"down")}
      ${kpi("Público total", M.publicoTotal.toLocaleString("pt-BR"))}
      ${kpi("Exposições concluídas", M.exposicoesConcluidas)}
      ${kpi("Arremates em leilão", M.arremates)}
    </div>
    <div class="panel"><strong style="font-size:13px;color:var(--parchment-dim)">PATRIMÔNIO AO LONGO DO TEMPO</strong>${grafico}</div>
    ${M.melhorExpo ? `<div class="panel"><strong style="font-size:13px;color:var(--parchment-dim)">🏆 MELHOR EXPOSIÇÃO</strong>
      <p style="margin-top:6px">${M.melhorExpo.titulo} em ${M.melhorExpo.pais}: lucro de <b class="mkt-up">${fmtMoney(M.melhorExpo.lucro)}</b></p></div>` : ""}
    ${M.historico.length ? `<div class="panel"><strong style="font-size:13px;color:var(--parchment-dim)">ÚLTIMAS EXPOSIÇÕES</strong>
      ${M.historico.slice(-8).reverse().map(x=>`<div class="car-hist"><span>${x.titulo} · ${x.pais} · ${x.dias} dia(s)</span>
        <b class="${x.lucro>=0?'mkt-up':'mkt-down'}">${x.lucro>=0?'+':''}${fmtMoney(x.lucro)}</b></div>`).join("")}</div>` : ""}`;
}

/* ----------------------------------------------------------------- ganchos */
function ligarGanchosCarreira(){
  const _add = addToCollection;
  addToCollection = function(w, preco){ const r = _add(w, preco); if(r) descobrirObra(w, "coleção"); return r; };

  const _start = startExhibition;
  startExhibition = function(){ const antes = State.exhibitions.length; _start(); metricas().exposicoesIniciadas += Math.max(0, State.exhibitions.length - antes); checarMissoes(); };
  const _agenda = processarAgenda;
  processarAgenda = function(){ const antes = State.exhibitions.length; _agenda(); metricas().exposicoesIniciadas += Math.max(0, State.exhibitions.length - antes); };

  const _fim = finalizeExhibition;
  finalizeExhibition = function(ex, outcome, extra){
    const M = metricas();
    const receita = ex.revenueAccum || 0, custo = ex.costTotal || 0, lucro = receita - custo;
    M.exposicoesConcluidas++; M.receitaTotal += receita; M.lucroExposicoes += lucro; M.publicoTotal += ex.visitorsAccum || 0;
    const reg = { titulo: ex.work.titulo, pais: ex.country, dias: ex.dayIndex, lucro, custo };
    M.historico.push(reg); if(M.historico.length > 60) M.historico.shift();
    if(!M.melhorExpo || lucro > M.melhorExpo.lucro) M.melhorExpo = reg;
    _fim(ex, outcome, extra);
    checarMissoes();
  };

  if(typeof Auction !== "undefined"){
    const _mart = Auction.martelar.bind(Auction);
    Auction.martelar = function(){
      const l = this.sessao && this.sessao.lote;
      const tinha = l && State.collection.some(o=>o.id===l.obra.id);
      _mart();
      if(l && !tinha && State.collection.some(o=>o.id===l.obra.id)) metricas().arremates++;
    };
  }
  if(typeof Quiz !== "undefined"){
    const _fin = Quiz.finalizar.bind(Quiz);
    Quiz.finalizar = function(){
      const acertos = (this.respostas||[]).filter(r=>r.acertou).length;
      metricas().acertosQuiz += acertos;
      if(this.perguntas && acertos === this.perguntas.length) descobrirObra(this.obra, "teste");
      _fin();
    };
  }

  // celebração ao subir de classe
  let classeAnterior = classeDe(State.reputation);
  const _hud = updateHUD;
  updateHUD = function(){
    _hud();
    const c = classeDe(State.reputation);
    if(c > classeAnterior && Math.floor(c/5) > Math.floor(classeAnterior/5))
      celebrar("⭐", `Classe ${c} — ${tituloClasse(c)}`, "Juros menores nos bancos, lances de maior prestígio e salas mais nobres ao seu alcance.");
    classeAnterior = c;
  };
}

const Carreira = {
  iniciar(){
    // obras que o jogador já possui (partida carregada) entram no álbum
    State.collection.forEach(o=>{ if(!album().obras[o.id]) album().obras[o.id] = "coleção"; });
    ligarGanchosCarreira();
    const amostrar = ()=>{ const h = metricas().patrimonioHist; h.push({ d: Market.day, v: patrimonio() }); if(h.length > 240) h.shift(); };
    amostrar();
    setInterval(amostrar, 9000);
    setInterval(checarMissoes, 2000);
    checarMissoes();
  },
};
