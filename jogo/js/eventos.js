/* ============================================================================
   EVENTOS — o jogo puxa o jogador de volta com mensagens que pedem uma
   decisão: um convite de leilão que acabou de chegar, um comprador querendo
   uma das suas obras, um vendedor oferecendo uma obra fora da roleta, ou uma
   dica de como jogar melhor. Aparecem como um cartão no canto, sem travar a
   tela — o jogador decide ou ignora.
   ============================================================================ */

const DICAS_JOGO = [
  "Salas com iluminação abaixo de 55% geram críticas do público — capriche na Iluminação museológica antes de expor obras caras.",
  "Uma sala seguindo abaixo de 50% de segurança corre risco real de furto. Contrate seguro ou invista em Segurança e anti-furto.",
  "O Teste do Curador libera a cada 15 minutos e paga por acerto — vale a pena conferir sempre que o selo acender no menu.",
  "Empréstimos do Fundo de Penhor de Arte usam uma obra como garantia: ela fica travada até você quitar.",
  "No mapa, arraste para mover e use a roda do mouse para dar zoom — o nível muda sozinho conforme você se aproxima.",
  "Uma obra pode circular por vários museus sozinha: agende as próximas paradas no cartão da exposição ou no \"Planejar o ano\".",
  "Climatização fraca desgasta a obra dia após dia, e isso reduz o valor de mercado dela. Dá para restaurar depois, mas custa caro.",
  "Salas de 5 estrelas exigem uma classe mínima de reputação — suba de classe ganhando reputação em exposições e no Teste do Curador.",
  "Pregões têm concorrentes com teto e temperamento próprios — um lance agressivo demais pode custar bem mais que o valor de mercado.",
  "O ritmo das mensagens é seu: no ⚙ do topo você ajusta a frequência de propostas, ofertas, pregões, dicas e jornal, e o tempo que ficam na tela.",
  "Cada exposição tem um botão 🔊 para silenciar os comentários falados dos visitantes — dá para silenciar todas de uma vez nas Configurações.",
  "Sua sede define de onde as obras partem: mudar de cidade custa uma taxa, mas pode aproximar você dos seus museus favoritos.",
];

// Obra em tela grande, para conferir os detalhes antes de responder.
function ampliarImagem(src, legenda){
  document.getElementById("ev-lightbox")?.remove();
  const el = document.createElement("div");
  el.id = "ev-lightbox";
  el.innerHTML = `<figure><img src="${src}" alt=""><figcaption>${legenda || ""}</figcaption></figure><button class="lb-x" type="button" title="Fechar (Esc)">✕</button>`;
  document.body.appendChild(el);
  const tecla = ev=>{ if(ev.key === "Escape"){ ev.stopImmediatePropagation(); fechar(); } };
  const fechar = ()=>{ el.remove(); window.removeEventListener("keydown", tecla, true); };
  window.addEventListener("keydown", tecla, true);
  el.addEventListener("click", fechar);
  AudioFX.click();
}

// resultado (lucro ou prejuízo) formatado, com cor — usado em todas as propostas
function linhaResultado(rotulo, resultado, base){
  const pct = base ? resultado / base * 100 : 0;
  const pos = resultado >= 0;
  return `<div class="ev-resultado ${pos?"mkt-up":"mkt-down"}">${rotulo}
    <b>${pos ? `lucro de ${fmtMoney(resultado)} (+${pct.toFixed(1)}%)` : `prejuízo de ${fmtMoney(-resultado)} (${pct.toFixed(1)}%)`}</b></div>`;
}

const Eventos = {
  ativo: null,
  timers: {},                // ms restantes até a próxima ocorrência de cada tipo (Infinity = desligado)
  visiveis: [], fila: [],

  iniciar(){
    this.reagendarTodos(true);
    setInterval(()=>this.tick(1000), 1000);
  },
  reagendar(tipo, primeira){
    const ms = Config.intervaloMs(tipo);
    this.timers[tipo] = ms === null ? Infinity : (primeira ? ms * 0.5 : ms);   // a 1ª vez vem mais cedo
  },
  reagendarTodos(primeira){ TIPOS_AVISO.filter(t=>t.id !== "jornal").forEach(t=>this.reagendar(t.id, primeira)); },

  // cada tipo tem seu próprio relógio; ao vencer, só aparece se a tela não estiver cheia
  tick(dtMs){
    if(document.getElementById("modal-overlay")?.classList.contains("active")) return;
    Object.keys(this.timers).forEach(tipo=>{
      if(this.timers[tipo] === Infinity) return;
      this.timers[tipo] -= dtMs;
      if(this.timers[tipo] > 0) return;
      if(this.visiveis.length >= 2 || this.fila.length){ this.timers[tipo] = 15000; return; }   // tenta de novo daqui a pouco
      const mostrou = this.disparar(tipo);
      this.reagendar(tipo, !mostrou);
    });
  },

  // disparar(tipo) exibe aquele tipo; sem tipo, sorteia um entre os possíveis
  // (só se a tela estiver livre). Devolve true se algo apareceu.
  disparar(tipo){
    if(!tipo){
      if(this.visiveis.length || this.fila.length) return false;
      const possiveis = ["dica"];
      if(State.collection.some(o=>!o.exhibiting && !o.penhorada && !o.fixa)) possiveis.push("compra");
      if(State.allArtworks.some(w=>w.imagem && !w.fixa && !State.collection.some(c=>c.id===w.id))) possiveis.push("venda");
      if(typeof Auction !== "undefined"){ Auction.garantirConvites(); if(Auction.convites.length) possiveis.push("leilao"); }
      tipo = possiveis[Math.floor(Math.random()*possiveis.length)];
    }
    if(tipo === "compra"){
      if(!State.collection.some(o=>!o.exhibiting && !o.penhorada && !o.fixa)) return false;
      this.propostaCompra(); return true;
    }
    if(tipo === "venda"){
      if(!State.allArtworks.some(w=>w.imagem && !w.fixa && !State.collection.some(c=>c.id===w.id))) return false;
      this.ofertaVenda(); return true;
    }
    if(tipo === "leilao"){
      if(typeof Auction === "undefined") return false;
      Auction.garantirConvites();
      if(!Auction.convites.length) return false;
      this.avisoLeilao(); return true;
    }
    if(tipo === "relampago"){ this.perguntaRelampago(); return true; }
    if(tipo === "dica"){ this.dica(); return true; }
    return false;
  },

  propostaCompra(){
    const candidatas = State.collection.filter(o=>!o.exhibiting && !o.penhorada && !o.fixa);
    const o = candidatas[Math.floor(Math.random()*candidatas.length)];
    const valor = Market.valueOf(o);
    // ora um pechincheiro (abaixo do mercado), ora um comprador ansioso (acima)
    const mult = Math.random() < 0.5 ? 0.75 + Math.random()*0.15 : 1.1 + Math.random()*0.3;
    const oferta = Math.round(mult * valor / 100) * 100;
    const nome = personaAleatoria(o.pais);
    this.mostrar({
      icone: "🤝", retrato: retratoSVG("marchand", nome.nome.length), titulo: "Proposta de compra",
      imagem: imgSrc(o), destaque: true, legendaFoto: `${o.titulo} — ${o.artista}`,
      corpo: `<b>${nome.nome}</b> quer comprar <b>${o.titulo}</b> por <b class="ev-valor">${fmtMoney(oferta)}</b>
        <span class="ev-mercado">(mercado hoje: ${fmtMoney(valor)} — ${mult>1 ? "acima" : "abaixo"} em ${Math.abs((mult-1)*100).toFixed(0)}%)</span>
        ${linhaResultado(`Você pagou ${fmtMoney(o.boughtPrice)} por ela — se aceitar:`, oferta - o.boughtPrice, o.boughtPrice)}
        <div class="ev-fala">${falaPersona(nome, o.pais, "compra")}</div>`,
      acoes: [
        { label:`Aceitar por ${fmtMoney(oferta)}`, classe:"btn-gold", onClick:()=>{
            State.cash += oferta;
            State.collection = State.collection.filter(x=>x.ownedId!==o.ownedId);
            delete State.agenda[o.ownedId];
            AudioFX.coin(); updateHUD();
            toast(`Vendida: ${o.titulo} por ${fmtMoney(oferta)}`);
            if(document.querySelector(".view.active")?.id === "view-collection") renderCollection();
        }},
        { label:"Recusar", classe:"btn-outline", onClick:()=>{} },
      ],
    });
  },

  ofertaVenda(){
    const candidatas = State.allArtworks.filter(w=>w.imagem && !w.fixa && !State.collection.some(c=>c.id===w.id));
    const w = candidatas[Math.floor(Math.random()*candidatas.length)];
    const valor = Market.valueOf(w);
    const mult = 0.7 + Math.random()*0.35;   // sempre com desconto — é um vendedor querendo fechar rápido
    const preco = Math.round(mult * valor / 100) * 100;
    const log = logisticaCompra(w, w.pais, preco);
    const total = preco + log.total;
    const nome = personaAleatoria(w.pais);
    // resultado se revender já: valor de mercado menos a comissão de venda, contra o custo total
    const revenda = Math.round(valor * (1 - SALE_COMMISSION));
    this.mostrar({
      icone: "🖼️", retrato: retratoSVG("marchand", nome.nome.length+1), titulo: "Oferta de um vendedor", imagem: imgSrc(w), destaque: true, legendaFoto: `${w.titulo} — ${w.artista}`,
      corpo: `<b>${nome.nome}</b> está vendendo <b>${w.titulo}</b> (${w.artista}) por <b class="ev-valor">${fmtMoney(preco)}</b>
        ${log.total ? ` + ${fmtMoney(log.total)} de frete/imposto` : ""}.
        <span class="ev-mercado">(mercado hoje: ${fmtMoney(valor)} — preço ${mult<1 ? "abaixo" : "acima"} em ${Math.abs((mult-1)*100).toFixed(0)}%)</span>
        ${linhaResultado(`Custo total ${fmtMoney(total)}. Se revender hoje (mercado − ${Math.round(SALE_COMMISSION*100)}% de comissão = ${fmtMoney(revenda)}):`, revenda - total, total)}
        <div class="ev-fala">${falaPersona(nome, w.pais, "venda")}</div>`,
      acoes: [
        { label:`Comprar por ${fmtMoney(total)}`, classe:"btn-gold", disabled: State.cash<total || jaPossui(w.id), onClick:()=>{
            if(State.cash < total || jaPossui(w.id)) return;
            State.cash -= total;
            addToCollection(w, preco);
            despacharCompra(w, log);
            AudioFX.coin(); updateHUD();
            toast(`Comprada: ${w.titulo}`);
        }},
        { label:"Dispensar", classe:"btn-outline", onClick:()=>{} },
      ],
    });
  },

  avisoLeilao(){
    const c = Auction.convites[Math.floor(Math.random()*Auction.convites.length)];
    const valores = c.lotes.map(w=>Market.valueOf(w));
    const soma = valores.reduce((a,b)=>a+b,0);
    // as aberturas ficam entre 55% e 70% do mercado; comprar por aí e revender já dá margem
    this.mostrar({
      icone: "🔨", titulo: "Convite para leilão",
      corpo: `A casa de leilões de ${c.pais} tem um pregão aberto: <b>${c.titulo}</b> — ${c.lotes.length} lote(s).
        <div class="ev-resultado mkt-up">Valor de mercado dos lotes: <b>${fmtMoney(soma)}</b>.
          Aberturas costumam ficar entre 55% e 70% disso (${fmtMoney(Math.round(soma*.55))} a ${fmtMoney(Math.round(soma*.7))}); a comissão de compra é de ${Math.round(BUYER_PREMIUM*100)}%.</div>`,
      acoes: [
        { label:"Ver pregão", classe:"btn-gold", onClick:()=>{ switchView("auction"); Auction.entrar(c.id); } },
        { label:"Agora não", classe:"btn-outline", onClick:()=>{} },
      ],
    });
  },

  // Pergunta relâmpago: uma obra, uma pergunta, € 100 mil por acerto
  perguntaRelampago(){
    const pool = (typeof Quiz !== "undefined" ? Quiz.elegiveis() : State.allArtworks.filter(w=>w.imagem));
    if(pool.length < 4) return;
    const obra = pool[Math.floor(Math.random()*pool.length)];
    const tipo = ["autor","titulo","pais"][Math.floor(Math.random()*3)];
    const campo = { autor:"artista", titulo:"titulo", pais:"pais" }[tipo];
    const certa = obra[campo];
    const outras = [...new Set(State.allArtworks.map(w=>w[campo]).filter(v=>v && v!==certa))]
      .sort(()=>Math.random()-0.5).slice(0,3);
    const opcoes = [certa, ...outras].sort(()=>Math.random()-0.5);
    const pergunta = { autor:"Quem pintou esta obra?", titulo:"Qual é o nome desta obra?", pais:"De que país é o artista desta obra?" }[tipo];
    const PREMIO = 100000;
    this.mostrar({
      icone:"⚡", titulo:"Pergunta relâmpago", imagem: imgSrc(obra), decisao:true, destaque:true,
      legendaFoto: tipo==="titulo" ? "" : obra.titulo,
      corpo:`<span class="ev-premio">Vale € 100 mil</span> <b>${pergunta}</b>${tipo!=="titulo" ? `<div class="ev-sub">“${obra.titulo}”</div>` : ""}<div class="ev-resposta"></div>`,
      acoes: opcoes.map(op=>({ label: op, classe:"btn-outline", onClick:(el)=>{
        const ok = op === certa;
        el.querySelectorAll("[data-ev-acao]").forEach(b=>{
          b.disabled = true;
          if(b.textContent === certa) b.classList.add("ev-certa");
          else if(b.textContent === op) b.classList.add("ev-errada");
        });
        el.querySelector(".ev-resposta").innerHTML = ok
          ? `<span class="mkt-up">Acertou! +${fmtMoney(PREMIO)}</span>`
          : `<span class="mkt-down">Não foi dessa vez — era “${certa}”.</span>`;
        if(ok){
          State.cash += PREMIO; AudioFX.success(); updateHUD();
          if(typeof descobrirObra === "function") descobrirObra(obra, "pergunta");
          if(typeof metricas === "function") metricas().acertosQuiz++;
        } else AudioFX.error();
        const fechar = ()=>{ const info = Eventos.visiveis.find(i=>i.titulo.startsWith("Pergunta relâmpago")); if(info) info.fechar(); };
        setTimeout(fechar, 3200);
        return true;   // mantém aberto para mostrar a resposta
      }})),
    });
  },

  dica(){
    const texto = DICAS_JOGO[Math.floor(Math.random()*DICAS_JOGO.length)];
    this.mostrar({
      icone: "💡", titulo: "Dica",
      corpo: texto,
      acoes: [{ label:"Entendi", classe:"btn-outline", onClick:()=>{} }],
      decisao: false,
    });
  },

  // Cartões empilham numa coluna, até 3 visíveis; o excedente espera numa
  // fila (com contador). Decisões (proposta, oferta, pergunta) só fecham
  // quando o jogador responde; avisos informativos fecham sozinhos.
  // Cartões empilham numa coluna que cabe ENTRE o rastreador de missão e a barra
  // de menus. Regras (medidas no layout real, não estimadas):
  //  · no máximo 3 visíveis, e só um cartão grande (com a obra em destaque);
  //  · se um cartão não couber, os pequenos voltam para a fila — o de decisão
  //    sempre aparece inteiro, com os botões à vista;
  //  · decisões só fecham quando o jogador responde (ou quando expiram, se ele
  //    configurou); avisos informativos fecham sozinhos.
  mostrar(info){
    const destaque = !!(info.destaque && info.imagem);
    if(this.visiveis.length >= 3 || (destaque && this.visiveis.some(i=>i.destaque && i.imagem))){
      this.fila.push(info); this.atualizarContador(); return;
    }
    let pilha = document.getElementById("ev-pilha");
    if(!pilha){ pilha = document.createElement("div"); pilha.id = "ev-pilha"; document.body.appendChild(pilha); }
    const decisao = info.decisao ?? info.acoes.length > 1;
    const expira = decisao ? (info.expiraMs ?? Config.expiraMs()) : 0;
    const el = document.createElement("div");
    el.className = "evento-card" + (decisao ? " decisao" : "") + (destaque ? " destaque" : "") + (info.classeExtra ? " " + info.classeExtra : "");
    el.innerHTML = `
      <button class="ev-x" title="${decisao ? "Dispensar" : "Fechar"}">✕</button>
      <div class="ev-head">${info.retrato ? `<span class="ev-retrato">${info.retrato}</span>` : `<span class="ev-icone">${info.icone}</span>`}<b>${info.titulo}</b>
        ${decisao ? `<span class="ev-tag">aguarda você</span>` : ""}</div>
      ${destaque ? `<figure class="ev-foto"><img src="${info.imagem}" alt="${(info.legendaFoto||"").replace(/"/g,"&quot;")}" title="Clique para ampliar">
          <button class="ev-ampliar" type="button">🔍 Ampliar</button></figure>` : ""}
      <div class="ev-corpo">${info.imagem && !destaque ? `<img src="${info.imagem}" alt="">` : ""}<div>${info.corpo}</div></div>
      <div class="ev-acoes">${info.acoes.map((a,i)=>`<button class="btn ${a.classe} btn-sm" data-ev-acao="${i}" ${a.disabled?"disabled":""}>${a.label}</button>`).join("")}</div>
      ${expira ? `<div class="ev-expira" title="Esta mensagem expira sozinha"><span style="animation-duration:${expira}ms"></span></div>` : ""}`;

    let fechado = false, timers = [];
    const limpar = ()=>{ timers.forEach(clearTimeout); timers = []; };
    const fechar = ()=>{
      if(fechado) return; fechado = true; limpar();
      el.classList.remove("show");
      setTimeout(()=>{
        el.remove();
        this.visiveis = this.visiveis.filter(x=>x!==info);
        this.ativo = this.visiveis[this.visiveis.length-1] || null;
        this.drenarFila();
        this.atualizarContador();
      }, 300);
    };
    // devolve o cartão à fila sem "fechar" (não fala com quem o criou): reaparece depois
    info._despejar = ()=>{ fechado = true; limpar(); el.remove(); this.visiveis = this.visiveis.filter(x=>x!==info); };
    info.fechar = fechar;
    info._el = el;

    pilha.appendChild(el);
    this.visiveis.push(info);
    this.ativo = info;
    if(destaque){
      const abrir = ()=>ampliarImagem(info.imagem, info.legendaFoto || "");
      const img = el.querySelector(".ev-foto img");
      img.addEventListener("click", abrir);
      el.querySelector(".ev-ampliar").addEventListener("click", abrir);
      img.addEventListener("load", ()=>this.ajustarPilha());   // a altura real só existe depois de carregar
    }
    // não coube? os pequenos (do mais novo para o mais antigo) voltam para a fila
    if(!this.ajustarPilha(info)) return;

    if(!info._registrado){ info._registrado = true; Avisos.registrar(info.icone || "•", info.titulo, info.corpo); }
    AudioFX.click();
    requestAnimationFrame(()=>el.classList.add("show"));
    el.querySelector(".ev-x").addEventListener("click", ()=>{ if(!fechado && info.aoDispensar) info.aoDispensar(); fechar(); });
    info.acoes.forEach((a,i)=>{
      const btn = el.querySelector(`[data-ev-acao="${i}"]`);
      if(btn) btn.addEventListener("click", ()=>{
        if(btn.disabled) return;
        const manter = a.onClick(el);            // devolver true mantém o cartão aberto (ex.: mostrar resposta)
        if(!manter) fechar();
      });
    });
    if(decisao){
      if(expira) timers.push(setTimeout(()=>{ if(!fechado){ if(info.aoExpirar) info.aoExpirar(); toast("⏳ Uma mensagem expirou"); fechar(); } }, expira));
    } else {
      const dur = info.duracaoMs ?? Config.duracaoMs();      // 0 = fica até o jogador fechar
      if(dur > 0) timers.push(setTimeout(fechar, dur));
    }
    this.atualizarContador();
  },

  drenarFila(){
    const i = this.fila.findIndex(x=>!(x.destaque && x.imagem && this.visiveis.some(v=>v.destaque && v.imagem)));
    if(i >= 0) this.mostrar(this.fila.splice(i, 1)[0]);
  },

  // Mede a pilha de verdade: se passou da altura disponível, tira os cartões
  // pequenos, do mais novo para o mais antigo. Devolve false se `novo` saiu.
  ajustarPilha(novo){
    const pilha = document.getElementById("ev-pilha"); if(!pilha) return true;
    let saiu = false;
    const pequenos = ()=>this.visiveis.filter(i=>!(i.destaque && i.imagem) && i._el && i._el.isConnected);
    this.atualizarContador();
    while(pilha.scrollHeight > pilha.clientHeight + 1){
      const alvo = pequenos().pop();
      if(!alvo) break;                            // só sobrou o cartão grande: ele já é limitado por CSS
      alvo._despejar(); this.fila.unshift(alvo);
      if(alvo === novo) saiu = true;
      this.atualizarContador();                   // o contador aparece/cresce e também ocupa espaço
    }
    return !saiu;
  },

  atualizarContador(){
    let c = document.getElementById("ev-fila");
    const pilha = document.getElementById("ev-pilha"); if(!pilha) return;
    pilha.classList.toggle("com-fila", this.fila.length > 0);   // o contador ocupa espaço: o cartão grande encolhe junto
    if(!this.fila.length){ c?.remove(); return; }
    if(!c){ c = document.createElement("div"); c.id = "ev-fila"; pilha.appendChild(c); }
    pilha.appendChild(c);
    c.textContent = `+${this.fila.length} mensagem(ns) aguardando`;
  },
};

/* -------------------------------------------------------- retratos (SVG) */
// Dois arquétipos (marchand e dono de museu), no mesmo estilo "massinha" do
// avatar do jogador, cada um com 3 variações de cor/acessório — dá para
// distinguir "várias pessoas" sem precisar de dezenas de ilustrações à mão.
function retratoSVG(papel, variante){
  const paletas = [
    { pele:"#f0c9a0", pelo:"#5a3a20", roupa:"#5a3a63", roupa2:"#3d2745" },
    { pele:"#e8a878", pelo:"#241a12", roupa:"#8a4030", roupa2:"#5e2a20" },
    { pele:"#f6dcc0", pelo:"#8a6a3a", roupa:"#2e5a4a", roupa2:"#1e3d32" },
  ][variante % 3];
  const acessorio = papel === "museu"
    ? `<ellipse cx="50" cy="61" rx="15" ry="4" fill="#1a140f" opacity=".85"/>` // monóculo/gravata-borboleta estilizada
    : `<path d="M38,66 Q50,72 62,66" stroke="#1a140f" stroke-width="3" fill="none" stroke-linecap="round"/>`; // bigode do marchand
  return `<svg viewBox="0 0 100 120" class="retrato-svg">
    <ellipse cx="50" cy="112" rx="30" ry="8" fill="#000" opacity=".25"/>
    <path d="M22,120 Q22,78 50,76 Q78,78 78,120 Z" fill="${paletas.roupa}"/>
    <path d="M50,76 L58,88 L50,98 L42,88 Z" fill="#efe6d3"/>
    <path d="M46,88 L54,88 L50,96 Z" fill="${paletas.roupa2}"/>
    <circle cx="50" cy="46" r="26" fill="${paletas.pele}"/>
    <path d="M24,46 Q22,18 50,16 Q78,18 76,46 Q70,30 50,28 Q30,30 24,46 Z" fill="${paletas.pelo}"/>
    ${papel==="museu" ? `<path d="M24,40 Q50,30 76,40" stroke="${paletas.pelo}" stroke-width="6" fill="none"/>` : ""}
    <circle cx="40" cy="48" r="3" fill="#241d15"/><circle cx="60" cy="48" r="3" fill="#241d15"/>
    <path d="M46,58 Q50,61 54,58" stroke="#8a5a40" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${acessorio}
  </svg>`;
}
const RETRATO_POR_PAPEL = { compra:"marchand", venda:"marchand", negociacao:"museu" };

/* --------------------------------------------------------- personas leves */
// Nomes plausíveis por país, só para dar identidade às propostas — não são
// personagens fixos, é um sorteio simples de nome + pronome.
const NOMES_POR_PAIS = {
  "Itália":["Giulia Conti","Marco Rossi","Elena Ferrari"], "França":["Camille Dubois","Julien Moreau","Amélie Laurent"],
  "Holanda":["Sanne de Vries","Willem Bakker","Femke Jansen"], "Espanha":["Lucía Gómez","Javier Ruiz","Marta Serrano"],
  "Alemanha":["Anna Schulz","Lukas Weber","Sophie Fischer"], "Reino Unido":["Emily Clarke","James Whitfield","Charlotte Reed"],
  "Áustria":["Katharina Gruber","Florian Bauer","Marlene Huber"], "Brasil":["Renata Souza","Carlos Andrade","Beatriz Lima"],
};
function negociarExposicao(pais, cidade){
  const nome = personaAleatoria(pais);
  Eventos.mostrar({
    retrato: retratoSVG("museu", nome.nome.length),
    titulo: `Direção do museu — ${cidade}`,
    corpo: `<div class="ev-fala">${falaPersona(nome, pais, "negociacao")}</div>`,
    acoes: [{ label:"Seguir em frente", classe:"btn-gold", onClick:()=>{} }],
    decisao: false,
  });
}

function personaAleatoria(pais){
  const nomes = NOMES_POR_PAIS[pais] || NOMES_POR_PAIS["Itália"];
  return { nome: nomes[Math.floor(Math.random()*nomes.length)], pais };
}

// Uma linha curta no idioma do país + legenda em português — dá sabor sem
// depender de tradução automática; poucas frases, mas corretas.
const FALAS = {
  "Itália":  { compra:["Questa opera mi ha colpito subito.","Farei un'offerta giusta, promesso."],
               venda:["È un affare, creda a me.","Non troverà un prezzo migliore in città."] },
  "França":  { compra:["Cette œuvre me touche vraiment.","Je propose un prix honnête."],
               venda:["C'est une occasion à saisir.","Le prix ne restera pas si bas longtemps."] },
  "Holanda": { compra:["Dit werk past perfect bij mijn collectie.","Ik bied een eerlijke prijs."],
               venda:["Dit is een echte koopje.","Zo'n prijs vindt u nergens anders."] },
  "Espanha": { compra:["Esta obra me ha conquistado.","Ofrezco un precio justo."],
               venda:["Es una ganga, se lo aseguro.","No encontrará un precio mejor."] },
  "Alemanha":{ compra:["Dieses Werk hat mich sofort überzeugt.","Ich biete einen fairen Preis."],
               venda:["Das ist ein echtes Schnäppchen.","Einen besseren Preis finden Sie nicht."] },
  "Reino Unido":{ compra:["This piece truly speaks to me.","I'm offering a fair price."],
               venda:["This is quite a bargain.","You won't find a better price."] },
  "Áustria": { compra:["Dieses Werk hat mich sofort begeistert.","Ich biete einen fairen Preis."],
               venda:["Das ist wirklich günstig.","So einen Preis finden Sie nicht wieder."] },
  "Brasil":  { compra:["Essa obra me conquistou na hora.","Vou fazer uma oferta justa."],
               venda:["É uma pechincha, pode confiar.","Você não vai achar preço melhor."] },
};
const FALAS_NEGOCIACAO = {
  "Itália":["Sarà un onore ospitare quest'opera nella nostra galleria.","Il nostro pubblico l'aspetta con entusiasmo."],
  "França":["Ce sera un honneur d'accueillir cette œuvre chez nous.","Notre public l'attend avec impatience."],
  "Holanda":["Het zal een eer zijn dit werk hier te ontvangen.","Ons publiek verheugt zich erop."],
  "Espanha":["Será un honor recibir esta obra en nuestra galería.","Nuestro público la espera con entusiasmo."],
  "Alemanha":["Es wird uns eine Ehre sein, dieses Werk zu zeigen.","Unser Publikum freut sich schon darauf."],
  "Reino Unido":["It will be an honour to host this piece.","Our visitors are looking forward to it."],
  "Áustria":["Es wird uns eine Ehre sein, dieses Werk zu zeigen.","Unser Publikum freut sich schon sehr darauf."],
  "Brasil":["Será uma honra receber esta obra em nosso museu.","Nosso público está muito animado."],
};
const TRAD_NEGOCIACAO = {
  "Sarà un onore ospitare quest'opera nella nostra galleria.":"Será uma honra receber esta obra em nossa galeria.",
  "Il nostro pubblico l'aspetta con entusiasmo.":"Nosso público está esperando com entusiasmo.",
  "Ce sera un honneur d'accueillir cette œuvre chez nous.":"Será uma honra receber esta obra aqui.",
  "Notre public l'attend avec impatience.":"Nosso público está na expectativa.",
  "Het zal een eer zijn dit werk hier te ontvangen.":"Será uma honra receber esta obra aqui.",
  "Ons publiek verheugt zich erop.":"Nosso público está animado com isso.",
  "Será un honor recibir esta obra en nuestra galería.":"Será uma honra receber esta obra em nossa galeria.",
  "Nuestro público la espera con entusiasmo.":"Nosso público a espera com entusiasmo.",
  "Es wird uns eine Ehre sein, dieses Werk zu zeigen.":"Será uma honra para nós exibir esta obra.",
  "Unser Publikum freut sich schon darauf.":"Nosso público já está na expectativa.",
  "Unser Publikum freut sich schon sehr darauf.":"Nosso público já está bem animado com isso.",
  "It will be an honour to host this piece.":"Será uma honra receber esta obra.",
  "Our visitors are looking forward to it.":"Nossos visitantes estão na expectativa.",
  "Será uma honra receber esta obra em nosso museu.":"Será uma honra receber esta obra em nosso museu.",
  "Nosso público está muito animado.":"Nosso público está muito animado.",
};

function falaPersona(pessoa, pais, tipo){
  if(tipo === "negociacao"){
    const idioma = FALAS_NEGOCIACAO[pais] || FALAS_NEGOCIACAO["Itália"];
    const fala = idioma[Math.floor(Math.random()*idioma.length)];
    return `<span class="ev-idioma">${fala}</span><span class="ev-legenda">"${TRAD_NEGOCIACAO[fala] || fala}"</span>`;
  }
  const idioma = (FALAS[pais] || FALAS["Itália"])[tipo];
  const fala = idioma[Math.floor(Math.random()*idioma.length)];
  // tradução fixa (não é gerada dinamicamente): cada frase acima tem um par 1:1 aqui
  const TRAD = {
    "Questa opera mi ha colpito subito.":"Esta obra me impressionou na hora.",
    "Farei un'offerta giusta, promesso.":"Vou fazer uma oferta justa, prometo.",
    "È un affare, creda a me.":"É um bom negócio, acredite.",
    "Non troverà un prezzo migliore in città.":"Você não vai achar preço melhor na cidade.",
    "Cette œuvre me touche vraiment.":"Esta obra realmente me tocou.",
    "Je propose un prix honnête.":"Estou propondo um preço honesto.",
    "C'est une occasion à saisir.":"É uma oportunidade e tanto.",
    "Le prix ne restera pas si bas longtemps.":"O preço não vai ficar baixo assim por muito tempo.",
    "Dit werk past perfect bij mijn collectie.":"Esta obra combina perfeitamente com minha coleção.",
    "Ik bied een eerlijke prijs.":"Estou oferecendo um preço justo.",
    "Dit is een echte koopje.":"Isto é uma pechincha e tanto.",
    "Zo'n prijs vindt u nergens anders.":"Um preço assim você não acha em outro lugar.",
    "Esta obra me ha conquistado.":"Esta obra me conquistou.",
    "Ofrezco un precio justo.":"Estou oferecendo um preço justo.",
    "Es una ganga, se lo aseguro.":"É uma pechincha, eu garanto.",
    "No encontrará un precio mejor.":"Você não vai encontrar preço melhor.",
    "Dieses Werk hat mich sofort überzeugt.":"Esta obra me convenceu na hora.",
    "Ich biete einen fairen Preis.":"Estou oferecendo um preço justo.",
    "Das ist ein echtes Schnäppchen.":"Isto é uma pechincha e tanto.",
    "Einen besseren Preis finden Sie nicht.":"Você não vai achar preço melhor.",
    "This piece truly speaks to me.":"Esta obra realmente fala comigo.",
    "I'm offering a fair price.":"Estou oferecendo um preço justo.",
    "This is quite a bargain.":"Isto é uma pechincha e tanto.",
    "You won't find a better price.":"Você não vai achar preço melhor.",
    "Dieses Werk hat mich sofort begeistert.":"Esta obra me encantou na hora.",
    "Das ist wirklich günstig.":"Isto é realmente barato.",
    "So einen Preis finden Sie nicht wieder.":"Um preço assim você não encontra de novo.",
    "Essa obra me conquistou na hora.":"Essa obra me conquistou na hora.",
    "Vou fazer uma oferta justa.":"Vou fazer uma oferta justa.",
    "É uma pechincha, pode confiar.":"É uma pechincha, pode confiar.",
    "Você não vai achar preço melhor.":"Você não vai achar preço melhor.",
  };
  const legenda = TRAD[fala] || fala;
  return `<span class="ev-idioma">${fala}</span><span class="ev-legenda">"${legenda}"</span>`;
}
