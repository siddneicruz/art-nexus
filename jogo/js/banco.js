/* ============================================================================
   BANCOS — empréstimos com juros que caem conforme a classe de reputação
   Parcelas fixas (tabela Price), cobradas a cada 30 dias de mercado.
   Atraso: multa, perda de reputação e — no penhor — perda da obra.
   ============================================================================ */

const Banco = {
  // juros ao mês para a classe atual (o Mercado Sombra não dá desconto)
  jurosPara(banco){
    if(banco.id === "sombra") return banco.juros;
    const c = classeDe(State.reputation);
    return banco.juros * (1 - (c-1)/49 * 0.5);          // classe 50 paga metade
  },
  limitePara(banco){
    if(banco.id === "penhor") return null;
    const c = classeDe(State.reputation);
    return Math.round(banco.limite * (0.5 + c/100) / 1000) * 1000;
  },
  parcela(principal, i, n){ return Math.round(principal * i / (1 - Math.pow(1+i, -n))); },
  saldoDevedor(e){
    // valor presente das parcelas que faltam
    return Math.round(e.valorParcela * (1 - Math.pow(1+e.juros, -e.restantes)) / e.juros);
  },
  ativos(){ return (State.emprestimos || []).filter(e=>e.restantes > 0); },
  divida(){ return this.ativos().reduce((s,e)=>s+this.saldoDevedor(e)+(e.multa||0), 0); },

  contratar(bancoId, valor, parcelas, garantiaOwnedId){
    const b = BANCOS.find(x=>x.id===bancoId);
    if(!b || classeDe(State.reputation) < b.classeMin) return false;
    if(this.ativos().some(e=>e.bancoId===bancoId)) return false;      // um contrato por banco
    if(b.id === "penhor"){
      const o = State.collection.find(x=>x.ownedId===garantiaOwnedId);
      if(!o || o.exhibiting || o.penhorada) return false;
      valor = Math.round(Market.valueOf(o) * 0.6 / 100) * 100;
      o.penhorada = true;
    } else if(valor <= 0 || valor > this.limitePara(b)) return false;
    const juros = this.jurosPara(b);
    if(!State.emprestimos) State.emprestimos = [];
    State.emprestimos.push({
      id: "emp" + Date.now(), bancoId, principal: valor, juros, parcelas,
      restantes: parcelas, valorParcela: this.parcela(valor, juros, parcelas),
      diasParaParcela: PARCELA_A_CADA_DIAS, atrasos: 0, vencida: false, multa: 0,
      garantia: b.id === "penhor" ? garantiaOwnedId : null,
    });
    State.cash += valor;
    AudioFX.coin();
    toast(`${b.icone} ${b.nome}: ${fmtMoney(valor)} creditados`);
    updateHUD();
    return true;
  },

  quitar(id){
    const e = this.ativos().find(x=>x.id===id);
    if(!e) return false;
    const total = this.saldoDevedor(e) + (e.multa||0);
    if(State.cash < total) return false;
    State.cash -= total;
    this.encerrar(e);
    AudioFX.success();
    toast("Empréstimo quitado");
    updateHUD();
    return true;
  },

  encerrar(e){
    e.restantes = 0; e.vencida = false;
    if(e.garantia){
      const o = State.collection.find(x=>x.ownedId===e.garantia);
      if(o) o.penhorada = false;
    }
  },

  // um dia de mercado
  tickDia(){
    this.ativos().forEach(e=>{
      const b = BANCOS.find(x=>x.id===e.bancoId);
      if(!e.vencida){
        e.diasParaParcela--;
        if(e.diasParaParcela > 0) return;
        e.diasParaParcela = PARCELA_A_CADA_DIAS;
        e.vencida = true;
      }
      // tenta cobrar a parcela (e a multa, se houver)
      const devido = e.valorParcela + (e.multa||0);
      if(State.cash >= devido){
        State.cash -= devido;
        const parcelasPagas = 1 + Math.floor((e.diasAtraso||0) / PARCELA_A_CADA_DIAS);
        e.multa = 0; e.vencida = false; e.diasAtraso = 0;
        e.restantes = Math.max(0, e.restantes - parcelasPagas);
        if(e.restantes === 0){ this.encerrar(e); toast(`${b.icone} Última parcela paga ao ${b.nome}`); }
        updateHUD();
        return;
      }
      // sem saldo: atraso
      if(!e.emAtraso){
        e.emAtraso = true; e.atrasos++;
        e.multa = (e.multa||0) + Math.round(e.valorParcela * 0.02);
        const perda = b.id === "sombra" ? 6 : 3;
        State.reputation = Math.max(0, State.reputation - perda);
        showNewspaper({ tipo:"baixa", titulo:"PARCELA EM ATRASO",
          texto:`O ${b.nome} registrou atraso no seu pagamento. O mercado comenta.`,
          destaque:`Reputação −${perda}`, temNaColecao:false });
        if(b.id === "penhor" && e.atrasos >= 2) this.executarPenhor(e, b);
      } else {
        // cada dia de atraso continua pesando na reputação...
        State.reputation = Math.max(0, State.reputation - (b.id === "sombra" ? 0.5 : 0.2));
        // ...e a cada 30 dias sem pagar, vence mais uma parcela (novo atraso)
        e.diasAtraso = (e.diasAtraso||0) + 1;
        if(e.diasAtraso % PARCELA_A_CADA_DIAS === 0){
          e.atrasos++;
          e.multa += Math.round(e.valorParcela * 1.02);    // a parcela nova entra na conta, com multa
          State.reputation = Math.max(0, State.reputation - (b.id === "sombra" ? 6 : 3));
          if(b.id === "penhor" && e.atrasos >= 2) this.executarPenhor(e, b);
        }
      }
      updateHUD();
    });
    this.ativos().forEach(e=>{ if(!e.vencida) e.emAtraso = false; });
    if(document.querySelector(".view.active")?.id === "view-banco") renderBanco();
  },

  executarPenhor(e, b){
    const o = State.collection.find(x=>x.ownedId===e.garantia);
    if(o){
      State.collection = State.collection.filter(x=>x.ownedId!==o.ownedId);
      showNewspaper({ tipo:"baixa", titulo:"OBRA EXECUTADA POR DÍVIDA",
        texto:`Após dois atrasos, o ${b.nome} tomou "${o.titulo}" como pagamento.`,
        destaque:`Perdida: ${o.titulo}`, temNaColecao:true });
    }
    e.restantes = 0; e.vencida = false; e.multa = 0;
  },
};

/* ---------------------------------------------------------------- tela */
let bancoForm = { bancoId:null, valor:0, parcelas:12, garantia:null };

function renderBanco(){
  const el = document.getElementById("view-banco");
  if(!el) return;
  const classe = classeDe(State.reputation);
  const ativos = Banco.ativos();
  const penhoraveis = State.collection.filter(o=>!o.exhibiting && !o.penhorada);

  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Bancos</h1>
      <p class="page-sub">Classe <b>${classe}</b> · ${tituloClasse(classe)} — quanto maior a classe, menores os juros e maiores os limites.
        Parcelas a cada ${PARCELA_A_CADA_DIAS} dias de mercado (cerca de 4,5 min).</p>

      ${ativos.length ? `<div class="panel">
        <strong style="font-size:13px;color:var(--parchment-dim)">SEUS EMPRÉSTIMOS · dívida total ${fmtMoney(Banco.divida())}</strong>
        ${ativos.map(e=>{
          const b = BANCOS.find(x=>x.id===e.bancoId);
          const saldo = Banco.saldoDevedor(e) + (e.multa||0);
          const garantia = e.garantia ? State.collection.find(o=>o.ownedId===e.garantia) : null;
          return `<div class="emp-linha ${e.vencida?'atraso':''}">
            <span class="emp-ic">${b.icone}</span>
            <span class="emp-info"><b>${b.nome}</b>
              <small>${e.restantes}/${e.parcelas} parcelas de ${fmtMoney(e.valorParcela)} · ${(e.juros*100).toFixed(2)}% a.m.
              ${garantia ? ` · garantia: ${garantia.titulo}` : ""}</small>
              <small class="${e.vencida?'emp-alerta':''}">${e.vencida ? `⚠️ Parcela vencida${e.multa?` + multa ${fmtMoney(e.multa)}`:""} — deposite saldo para regularizar` : `próxima parcela em ${e.diasParaParcela} dia(s)`}</small>
            </span>
            <span class="emp-saldo">${fmtMoney(saldo)}<small>para quitar</small></span>
            <button class="btn btn-outline btn-sm" data-quitar="${e.id}" ${State.cash<saldo?"disabled":""}>Quitar</button>
          </div>`;
        }).join("")}
      </div>` : ""}

      <div class="bancos-grid">
        ${BANCOS.map(b=>{
          const liberado = classe >= b.classeMin;
          const temAtivo = ativos.some(e=>e.bancoId===b.id);
          const juros = Banco.jurosPara(b), limite = Banco.limitePara(b);
          const aberto = bancoForm.bancoId === b.id && liberado && !temAtivo;
          let form = "";
          if(aberto){
            if(b.id === "penhor"){
              if(!bancoForm.garantia && penhoraveis[0]) bancoForm.garantia = penhoraveis[0].ownedId;
              const g = penhoraveis.find(o=>o.ownedId===bancoForm.garantia);
              const v = g ? Math.round(Market.valueOf(g)*0.6/100)*100 : 0;
              form = penhoraveis.length ? `<div class="bk-form">
                <label>Obra em garantia <select id="bk-garantia">${penhoraveis.map(o=>`<option value="${o.ownedId}" ${o.ownedId===bancoForm.garantia?"selected":""}>${o.titulo} — ${fmtMoney(Market.valueOf(o))}</option>`).join("")}</select></label>
                ${formParcelas(v, juros)}
                <button class="btn btn-gold" id="bk-contratar">Receber ${fmtMoney(v)}</button>
                <small class="bk-nota">A obra fica penhorada: não pode ser vendida nem exposta até a quitação.</small></div>`
                : `<div class="bk-form"><small class="bk-nota">Você precisa de uma obra livre (fora de exposição) para penhorar.</small></div>`;
            } else {
              if(!bancoForm.valor || bancoForm.valor > limite) bancoForm.valor = Math.round(limite/2/1000)*1000;
              form = `<div class="bk-form">
                <label>Valor: <b id="bk-valor-txt">${fmtMoney(bancoForm.valor)}</b>
                  <input type="range" id="bk-valor" min="10000" max="${limite}" step="10000" value="${bancoForm.valor}"></label>
                ${formParcelas(bancoForm.valor, juros)}
                <button class="btn btn-gold" id="bk-contratar">Contratar</button></div>`;
            }
          }
          return `<div class="panel banco-card ${liberado?'':'bloq'}">
            <div class="bk-head"><span class="bk-ic">${b.icone}</span>
              <div><b>${b.nome}</b><small>${b.desc}</small></div></div>
            <div class="bk-nums">
              <span>Juros <b>${(juros*100).toFixed(2)}% a.m.</b></span>
              <span>Limite <b>${limite ? fmtMoney(limite) : "60% da obra"}</b></span>
            </div>
            ${!liberado ? `<div class="bk-req">🔒 Exige classe ${b.classeMin} (você: ${classe})</div>`
              : temAtivo ? `<div class="bk-req">Contrato em andamento</div>`
              : aberto ? form : `<button class="btn btn-outline" data-abrir="${b.id}">Simular empréstimo</button>`}
          </div>`;
        }).join("")}
      </div>
    </div>`;

  el.querySelectorAll("[data-abrir]").forEach(x=>x.addEventListener("click", ()=>{
    bancoForm = { bancoId:x.dataset.abrir, valor:0, parcelas:12, garantia:null }; AudioFX.click(); renderBanco();
  }));
  el.querySelectorAll("[data-quitar]").forEach(x=>x.addEventListener("click", ()=>{ if(Banco.quitar(x.dataset.quitar)) renderBanco(); }));
  const val = document.getElementById("bk-valor");
  if(val) val.addEventListener("input", ()=>{ bancoForm.valor = Number(val.value); renderBanco(); });
  const gar = document.getElementById("bk-garantia");
  if(gar) gar.addEventListener("change", ()=>{ bancoForm.garantia = Number(gar.value); renderBanco(); });
  el.querySelectorAll("[data-parc]").forEach(x=>x.addEventListener("click", ()=>{ bancoForm.parcelas = Number(x.dataset.parc); renderBanco(); }));
  const ok = document.getElementById("bk-contratar");
  if(ok) ok.addEventListener("click", ()=>{
    if(Banco.contratar(bancoForm.bancoId, bancoForm.valor, bancoForm.parcelas, bancoForm.garantia)){
      bancoForm = { bancoId:null, valor:0, parcelas:12, garantia:null }; renderBanco();
    }
  });
}

function formParcelas(valor, juros){
  const p = Banco.parcela(valor, juros, bancoForm.parcelas);
  return `<div class="bk-parc">
    ${[6,12].map(n=>`<button class="chip ${n===bancoForm.parcelas?'selected':''}" data-parc="${n}">${n} parcelas</button>`).join("")}
  </div>
  <div class="bk-sim">${bancoForm.parcelas}× ${fmtMoney(p)} · total ${fmtMoney(p*bancoForm.parcelas)}
    <small>(${fmtMoney(p*bancoForm.parcelas - valor)} de juros)</small></div>`;
}
