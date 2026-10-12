/* ============================================================================
   SALAS DE EXPOSIÇÃO — aluguel, compra, upgrades e estrelas
   Toda exposição de obra móvel acontece numa sala. A sala define:
     Iluminação   -> avaliações do público (luz ruim gera críticas)
     Climatização -> desgaste da obra (conservação cai e o valor junto)
     Segurança    -> risco diário de furto
     Capacidade   -> teto de visitantes pagantes
     Prestígio    -> média ponderada; define as estrelas e o bônus de receita
   ============================================================================ */

function salaId(pais, i){ return pais + "#" + i; }

// Estado das salas é criado sob demanda a partir dos modelos
function estadoSala(id){
  if(!State.salas) State.salas = {};
  if(!State.salas[id]){
    const i = Number(id.split("#")[1]);
    State.salas[id] = { dono:false, attrs:{ ...SALA_MODELOS[i].attrs } };
  }
  return State.salas[id];
}

function fatorPais(pais){ return (COUNTRIES[pais]?.ticket || 15) / 15; }

function salaInfo(id){
  if(typeof id !== "string" || !id.includes("#")){
    console.error("salaInfo chamado com id inválido:", id, new Error().stack);
    window.__salaInfoBug = window.__salaInfoBug || [];
    window.__salaInfoBug.push({ id, stack: new Error().stack });
    throw new Error("salaInfo: id inválido -> " + JSON.stringify(id));
  }
  const [pais, iStr] = id.split("#");
  const i = Number(iStr);
  const m = SALA_MODELOS[i], st = estadoSala(id), f = fatorPais(pais);
  const cidade = SALA_CIDADES[pais][i];
  return {
    id, pais, cidade, nivel:i,
    nome: `${m.tipo} de ${cidade}`,
    attrs: st.attrs, dono: st.dono,
    aluguel: Math.round(m.aluguel * f / 10) * 10,
    preco: Math.round(m.preco * f / 1000) * 1000,
  };
}

function salasDoPais(pais){ return SALA_MODELOS.map((_,i)=>salaInfo(salaId(pais,i))); }

function prestigio(a){
  return Math.round(a.ilum*SALA_PESOS.ilum + a.clima*SALA_PESOS.clima + a.seg*SALA_PESOS.seg + a.cap*SALA_PESOS.cap);
}
function estrelas(a){
  const p = prestigio(a);
  let n = 1;
  ESTRELA_LIMITES.forEach((lim, i)=>{ if(p >= lim) n = i+1; });
  return n;
}
function estrelasTxt(n){ return "★".repeat(n) + "☆".repeat(5-n); }
function faixaBonus(n){ const [a,b] = ESTRELA_BONUS[n]; return `+${Math.round(a*100)}% a +${Math.round(b*100)}%`; }

function custoUpgrade(sala, attr){
  const atual = sala.attrs[attr];
  if(atual >= 100) return null;
  // curva quadrática: os primeiros níveis são baratos, os últimos custam caro,
  // para que evoluir uma sala modesta não saia mais barato que comprar um palacete
  return Math.round(SALA_UPGRADE_BASE[attr] * Math.pow(1 + atual/40, 2) * fatorPais(sala.pais) / 100) * 100;
}

// Risco diário de furto: cai com o quadrado da segurança
function riscoFurtoDia(seg){ return 0.001 + 0.018 * Math.pow(1 - seg/100, 2); }
function riscoFurtoPeriodo(seg, dias){ return 1 - Math.pow(1 - riscoFurtoDia(seg), dias); }

/* ---------------------------------------------------------- classes 1–50 */
function classeDe(rep){ return Math.max(1, Math.min(50, Math.ceil(rep/2))); }
function tituloClasse(c){
  let t = CLASSE_TITULOS[0][1];
  CLASSE_TITULOS.forEach(([min, nome])=>{ if(c >= min) t = nome; });
  return t;
}

/* ------------------------------------------------------ barras de atributo */
// limites = [verde a partir de, dourado a partir de]
function barraHTML(rotulo, valor, detalhe, alerta, limites=[70,45]){
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const cor = v >= limites[0] ? "alta" : v >= limites[1] ? "media" : "baixa";
  return `<div class="barra-attr${alerta ? " alerta" : ""}">
    <span class="ba-rot">${rotulo}</span>
    <span class="ba-trilho"><span class="ba-fill ${cor}" style="width:${v}%"></span></span>
    <span class="ba-val">${v}%</span>
    ${detalhe ? `<span class="ba-det">${detalhe}</span>` : ""}
  </div>`;
}

/* --------------------------------------------------- ficha da sala (HTML) */
function fichaSalaHTML(sala, opts={}){
  const n = estrelas(sala.attrs), p = prestigio(sala.attrs);
  const prox = n < 5 ? ESTRELA_LIMITES[n] - p : 0;
  const seg = sala.attrs.seg;
  const linhas = ["ilum","clima","seg","cap"].map(k=>{
    let det = "";
    if(k === "seg"){
      const r = Math.round(riscoFurtoDia(seg)*1000)/10;
      det = seg < 50 ? `⚠️ risco de furto ${r}%/dia` : `risco ${r}%/dia`;
    }
    if(k === "clima" && sala.attrs.clima < 65) det = "desgasta as obras";
    if(k === "ilum" && sala.attrs.ilum < 55) det = "gera críticas";
    if(opts.upgrades && sala.dono){
      const c = custoUpgrade(sala, k);
      det += c ? `<button class="btn btn-outline btn-xs" data-up="${sala.id}|${k}" ${State.cash<c?"disabled":""}>+20 · ${fmtMoney(c)}</button>` : ` <span class="ba-max">máximo</span>`;
    }
    return barraHTML(SALA_ATTR_NOMES[k], sala.attrs[k], det, k==="seg" && seg<50);
  }).join("");
  return `<div class="ficha-sala">
    <div class="fs-head">
      <div>
        <div class="fs-nome">${sala.nome}</div>
        <div class="fs-sub">${COUNTRIES[sala.pais].flag} ${sala.cidade}, ${sala.pais} · ${sala.dono ? "<b class='fs-sua'>Sua</b>" : `aluguel ${fmtMoney(sala.aluguel)}/dia`}</div>
      </div>
      <div class="fs-estrelas" title="Prestígio ${p}%">${estrelasTxt(n)}</div>
    </div>
    <div class="fs-rent">Rentabilidade da sala: <b>${faixaBonus(n)}</b> sobre a receita de ingressos, por dia
      ${n === 5 ? `<span class="fs-req">· exige classe ${CLASSE_MIN_5_ESTRELAS}+</span>` : ""}</div>
    ${linhas}
    ${barraHTML("Prestígio do local", p, n < 5 ? `faltam ${prox}% para ${n+1}★` : "prestígio máximo")}
  </div>`;
}

/* ------------------------------------------------------- compra e upgrade */
function comprarSala(id){
  const s = salaInfo(id);
  if(s.dono || State.cash < s.preco) return false;
  State.cash -= s.preco;
  estadoSala(id).dono = true;
  AudioFX.coin();
  toast(`🏢 ${s.nome} agora é sua`);
  updateHUD();
  return true;
}

function upgradeSala(id, attr){
  const s = salaInfo(id);
  const custo = custoUpgrade(s, attr);
  if(!s.dono || !custo || State.cash < custo) return false;
  const antes = estrelas(s.attrs);
  State.cash -= custo;
  const st = estadoSala(id);
  st.attrs[attr] = Math.min(100, st.attrs[attr] + 20);
  const depois = estrelas(st.attrs);
  AudioFX.success();
  if(depois > antes) toast(`⭐ ${s.nome} subiu para ${depois} estrelas!`);
  updateHUD();
  return true;
}

/* -------------------------------------------------------------- tela Salas */
let salasPaisFiltro = null;

function renderSalas(){
  const el = document.getElementById("view-salas");
  const paises = Object.keys(COUNTRIES);
  if(!salasPaisFiltro) salasPaisFiltro = paises[0];
  const minhas = paises.flatMap(salasDoPais).filter(s=>s.dono);

  el.innerHTML = `
    <div class="view-inner">
      <h1 class="page-title">Salas de Exposição</h1>
      <p class="page-sub">Alugue salas por dia ao expor, ou compre e faça upgrades até 5 estrelas. Você tem ${minhas.length} sala(s).</p>
      <div class="filters" id="salas-paises">
        ${paises.map(p=>{
          const n = salasDoPais(p).filter(s=>s.dono).length;
          return `<button class="chip ${p===salasPaisFiltro?'selected':''}" data-sp="${p}">${COUNTRIES[p].flag} ${p}${n?`<span class="chip-n">${n}</span>`:""}</button>`;
        }).join("")}
      </div>
      <div class="salas-grid">
        ${salasDoPais(salasPaisFiltro).map(s=>`
          <div class="panel sala-card ${s.dono?'minha':''}">
            ${fichaSalaHTML(s, { upgrades:true })}
            <div class="action-row">
              ${s.dono
                ? `<span class="fs-dono">✔ Sala sua — sem aluguel ao expor</span>`
                : `<button class="btn btn-gold" data-comprar="${s.id}" ${State.cash<s.preco?"disabled":""}>Comprar por ${fmtMoney(s.preco)}</button>`}
            </div>
          </div>`).join("")}
      </div>
    </div>`;

  el.querySelectorAll("[data-sp]").forEach(b=>b.addEventListener("click", ()=>{
    salasPaisFiltro = b.dataset.sp; AudioFX.click(); renderSalas();
  }));
  el.querySelectorAll("[data-comprar]").forEach(b=>b.addEventListener("click", ()=>{
    if(comprarSala(b.dataset.comprar)) renderSalas();
  }));
  el.querySelectorAll("[data-up]").forEach(b=>b.addEventListener("click", ()=>{
    const [id, attr] = b.dataset.up.split("|");
    if(upgradeSala(id, attr)) renderSalas();
  }));
}
