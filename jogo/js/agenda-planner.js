/* ============================================================================
   PLANEJADOR DE AGENDA
   Gera roteiros de várias paradas para uma obra, cobrindo até o ano inteiro:
     - Rota curta: sempre para o país mais perto de onde a obra está agora —
       prioriza logística, menos tempo voando, mais tempo exposta.
     - Rota longa: passa por todos os países antes de repetir qualquer um —
       prioriza variedade, uma volta ao mundo da coleção.
   O jogador ainda pode montar a fila manualmente (perna por perna) na seção
   de agenda que já existe no cartão da exposição e na ficha da obra.
   ============================================================================ */

const DIAS_ANO = 360;  // "o ano inteiro" em dias de jogo (12 × 30)

function distanciaPaises(a, b){
  const ca = coordCidade(a, cidadePrincipal(a)), cb = coordCidade(b, cidadePrincipal(b));
  if(!ca || !cb) return 9999;
  return Math.hypot(ca[0]-cb[0], ca[1]-cb[1]);
}

// De onde a obra parte para a primeira perna do roteiro: a última parada já
// agendada (se houver fila), senão onde ela está agora (em exibição ou na sede).
function origemDoRoteiro(o){
  const fila = filaAgenda(o.ownedId);
  if(fila.length) return fila[fila.length-1].country;
  const emAndamento = State.exhibitions.find(e=>!e.ended && e.ownedId===o.ownedId && !e.fixa);
  if(emAndamento) return emAndamento.country;
  return (State.sede ? State.sede.pais : o.pais);
}

function gerarRotaCurta(o, diasAlvo, duracaoLeg){
  const legs = [];
  let atual = origemDoRoteiro(o), dias = 0;
  while(dias < diasAlvo){
    const candidatos = PAISES_JOGO.filter(p=>p!==atual).sort((a,b)=>distanciaPaises(atual,a)-distanciaPaises(atual,b));
    const proximo = candidatos[0];
    legs.push({ country: proximo, salaId: salaPadraoPais(proximo).id, duration: duracaoLeg, seguro: true });
    atual = proximo; dias += duracaoLeg;
  }
  return legs;
}

function gerarRotaLonga(o, diasAlvo, duracaoLeg){
  const legs = [];
  let atual = origemDoRoteiro(o), dias = 0;
  let restantes = shuffle(PAISES_JOGO.filter(p=>p!==atual));
  while(dias < diasAlvo){
    if(!restantes.length) restantes = shuffle(PAISES_JOGO.filter(p=>p!==atual));
    const proximo = restantes.shift();
    legs.push({ country: proximo, salaId: salaPadraoPais(proximo).id, duration: duracaoLeg, seguro: true });
    atual = proximo; dias += duracaoLeg;
  }
  return legs;
}

/* -------------------------------------------------------------------- tela */
let planoAtual = { ownedId: null, ids: [], modo: "curta", paisFixo: "França", duracaoLeg: 30, dias: DIAS_ANO, preview: [] };

function obrasParaAgenda(){
  // qualquer obra móvel sua — livre ou já circulando — pode receber um roteiro
  return State.collection.filter(o=>!o.fixa && !o.penhorada);
}
function custoRoteiro(obra, legs){
  return legs.reduce((s,leg)=>{
    const sala = salaInfo(leg.salaId), c = COUNTRIES[leg.country], valor = Market.valueOf(obra);
    const seguro = leg.seguro ? Math.round((1500+valor*0.00015*leg.duration*(1.6-sala.attrs.seg/100))/10)*10 : 0;
    return s + seguro + (sala.dono?0:sala.aluguel*leg.duration) + c.staff*leg.duration + c.transport;
  }, 0);
}
function gerarRoteiroFixo(pais, diasAlvo, duracaoLeg){
  const n = Math.max(1, Math.floor(diasAlvo/duracaoLeg));
  return Array.from({length:n}, ()=>({ country:pais, salaId:salaPadraoPais(pais).id, duration:duracaoLeg, seguro:true }));
}

function renderAgendaPlanner(){
  const el = document.getElementById("view-agenda");
  const obras = obrasParaAgenda();
  if(!obras.length){
    el.innerHTML = `<div class="view-inner"><h1 class="page-title">Agenda de Exposições</h1>
      <div class="empty-state"><div class="icon">📅</div><p>Você precisa de ao menos uma obra móvel na Coleção para planejar um roteiro.</p></div></div>`;
    return;
  }
  // seleção múltipla: mantém só obras que ainda existem; ao menos uma
  planoAtual.ids = planoAtual.ids.filter(id=>obras.some(o=>o.ownedId===id));
  if(!planoAtual.ids.length) planoAtual.ids = [ (obras.find(o=>o.ownedId===planoAtual.ownedId) || obras[0]).ownedId ];
  planoAtual.ownedId = planoAtual.ids[0];
  const selecionadas = obras.filter(o=>planoAtual.ids.includes(o.ownedId));
  const obra = selecionadas[0];
  const custoTotal = selecionadas.reduce((s,o)=>s + custoRoteiro(o, planoAtual.preview), 0);
  const porMes = planoAtual.duracaoLeg === 30 && planoAtual.preview.length;

  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Agenda de Exposições</h1>
      <p class="page-sub">Planeje o ano de uma ou várias obras — o jogo abre e encerra cada parada sozinho, na hora certa.
        Obras livres que seguem o mesmo roteiro viajam juntas, no mesmo transporte.</p>

      <div class="panel">
        <div class="sel-head">
          <strong style="font-size:13px;color:var(--parchment-dim)">OBRAS <span class="sel-cont">${selecionadas.length} selecionada(s)</span></strong>
          <span><button class="btn btn-outline btn-sm" id="ag-todas">Selecionar todas</button></span>
        </div>
        <div class="ag-obras">${obras.map(o=>`
          <button class="pick-tile ${planoAtual.ids.includes(o.ownedId)?'selected':''}" data-obra="${o.ownedId}">
            <span class="sel-check">${planoAtual.ids.includes(o.ownedId)?"✓":""}</span>
            <img src="${imgSrc(o)}"><div class="name">${o.titulo}</div>
            <div class="sub">${o.exhibiting?'em exibição':filaAgenda(o.ownedId).length?filaAgenda(o.ownedId).length+' parada(s) na fila':'livre'}</div>
          </button>`).join("")}</div>

        <strong style="font-size:13px;color:var(--parchment-dim)">TIPO DE ROTEIRO</strong>
        <div class="filters">
          <button class="chip ${planoAtual.modo==='curta'?'selected':''}" data-modo="curta">📍 Rota curta — logística</button>
          <button class="chip ${planoAtual.modo==='longa'?'selected':''}" data-modo="longa">🌍 Rota longa — mundo</button>
          <button class="chip ${planoAtual.modo==='fixo'?'selected':''}" data-modo="fixo">🏛️ Mesmo museu todo mês</button>
        </div>
        <p class="sec-body" style="font-size:12px;color:var(--parchment-dim);margin:-4px 0 12px;">
          ${planoAtual.modo==='curta' ? "Cada parada vai para o país mais perto da anterior — menos tempo viajando, mais tempo exposta."
            : planoAtual.modo==='longa' ? "Passa por todos os países antes de repetir qualquer um — uma volta ao mundo da sua coleção."
            : "As obras ficam em cartaz no mesmo país, renovando a exposição a cada mês."}
        </p>

        <div class="ag-linha">
          ${planoAtual.modo==='fixo' ? `<label>País
            <select id="ag-pais">${Object.keys(COUNTRIES).map(c=>`<option value="${c}" ${c===planoAtual.paisFixo?'selected':''}>${COUNTRIES[c].flag} ${c}</option>`).join("")}</select></label>` : ""}
          <label>Duração de cada parada
            <select id="ag-duracao"><option value="1" ${planoAtual.duracaoLeg===1?'selected':''}>1 dia</option><option value="30" ${planoAtual.duracaoLeg===30?'selected':''}>30 dias (1 mês)</option></select>
          </label>
          <label>Cobrir
            <select id="ag-periodo">
              <option value="90" ${planoAtual.dias===90?'selected':''}>3 meses</option>
              <option value="180" ${planoAtual.dias===180?'selected':''}>6 meses</option>
              <option value="${DIAS_ANO}" ${planoAtual.dias===DIAS_ANO?'selected':''}>o ano inteiro</option>
            </select>
          </label>
          <button class="btn btn-outline" id="btn-gerar-roteiro">Gerar roteiro</button>
        </div>

        ${planoAtual.preview.length ? `
          <strong style="font-size:13px;color:var(--parchment-dim)">PRÉVIA — ${planoAtual.preview.length} parada(s) para ${selecionadas.length} obra(s)</strong>
          ${porMes ? `<div class="ag-calendario">${planoAtual.preview.map((leg,i)=>`
              <div class="ag-mes"><small>Mês ${i+1}</small><span class="ag-mes-flag">${COUNTRIES[leg.country].flag}</span>
                <b>${leg.country}</b><em>${salaInfo(leg.salaId).cidade}</em></div>`).join("")}</div>`
            : `<div class="ag-preview">${planoAtual.preview.map((leg,i)=>`
              <span class="ag-prev-chip">${i+1}. ${COUNTRIES[leg.country].flag} ${leg.country}<small>${leg.duration}d</small></span>`).join('<span class="ag-seta">→</span>')}</div>`}
          <div class="ag-custo">Custo estimado do roteiro inteiro: <b>${fmtMoney(custoTotal)}</b>
            ${State.cash<custoTotal ? `<span class="ag-aviso">— seu saldo atual não cobre tudo de uma vez; o jogo vai processando conforme você for tendo caixa</span>` : ""}</div>
          <div class="action-row"><button class="btn btn-gold" id="btn-confirmar-roteiro">Confirmar e agendar ${selecionadas.length>1 ? `para as ${selecionadas.length} obras` : `as ${planoAtual.preview.length} paradas`}</button></div>
        ` : ""}
      </div>

      ${renderFilasAtivasHTML(obras)}
    </div>`;

  el.querySelectorAll("[data-obra]").forEach(b=>b.addEventListener("click", ()=>{
    const id = Number(b.dataset.obra);
    if(planoAtual.ids.includes(id)){ if(planoAtual.ids.length > 1) planoAtual.ids = planoAtual.ids.filter(x=>x!==id); }
    else planoAtual.ids.push(id);
    planoAtual.preview = []; AudioFX.click(); renderAgendaPlanner();
  }));
  document.getElementById("ag-todas").addEventListener("click", ()=>{
    planoAtual.ids = obras.map(o=>o.ownedId); planoAtual.preview = []; AudioFX.click(); renderAgendaPlanner();
  });
  el.querySelectorAll("[data-modo]").forEach(b=>b.addEventListener("click", ()=>{
    planoAtual.modo = b.dataset.modo; planoAtual.preview = [];
    AudioFX.click(); renderAgendaPlanner();
  }));
  const selPais = document.getElementById("ag-pais");
  if(selPais) selPais.addEventListener("change", e=>{ planoAtual.paisFixo = e.target.value; planoAtual.preview = []; });
  document.getElementById("ag-duracao").addEventListener("change", (e)=>{ planoAtual.duracaoLeg = Number(e.target.value); });
  document.getElementById("ag-periodo").addEventListener("change", (e)=>{ planoAtual.dias = Number(e.target.value); });
  document.getElementById("btn-gerar-roteiro").addEventListener("click", ()=>{
    const dur = Number(document.getElementById("ag-duracao").value);
    const dias = Number(document.getElementById("ag-periodo").value);
    planoAtual.duracaoLeg = dur; planoAtual.dias = dias;
    planoAtual.preview = planoAtual.modo === "fixo" ? gerarRoteiroFixo(planoAtual.paisFixo, dias, dur)
      : (planoAtual.modo === "curta" ? gerarRotaCurta : gerarRotaLonga)(obra, dias, dur);
    AudioFX.click(); renderAgendaPlanner();
  });
  const confirmar = document.getElementById("btn-confirmar-roteiro");
  if(confirmar) confirmar.addEventListener("click", ()=>{
    selecionadas.forEach(o=>planoAtual.preview.forEach(leg=>agendarLeg(o.ownedId, { ...leg })));
    toast(`📅 ${planoAtual.preview.length} parada(s) agendada(s) para ${selecionadas.length>1 ? `${selecionadas.length} obras` : `"${obra.titulo}"`}`);
    planoAtual.preview = [];
    AudioFX.success();
    processarAgenda();
    renderAgendaPlanner();
  });
  wireAgenda(el, null, ()=>renderAgendaPlanner());   // liga os botões "✕" das filas já agendadas
}

function renderFilasAtivasHTML(obras){
  const comFila = obras.filter(o=>filaAgenda(o.ownedId).length);
  if(!comFila.length) return "";
  return `<div class="panel">
    <strong style="font-size:13px;color:var(--parchment-dim)">ROTEIROS AGENDADOS</strong>
    ${comFila.map(o=>`
      <div class="ag-fila-obra">
        <img src="${imgSrc(o)}" alt=""><b>${o.titulo}</b>
        <div class="agenda-fila">${filaAgenda(o.ownedId).map((leg,i)=>`
          <span class="agenda-chip">${COUNTRIES[leg.country].flag} ${leg.country} · ${leg.duration}d
            <button data-rm-agenda="${o.ownedId}:${i}" title="Remover">✕</button></span>`).join("")}</div>
      </div>`).join("")}
  </div>`;
}
