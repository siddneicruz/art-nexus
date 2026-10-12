/* ============================================================================
   TESTE DO CURADOR
   Quatro perguntas sobre uma obra sorteada: ano, país, autoria e nome.
   Cada acerto vale um prêmio em dinheiro. A rodada libera a cada 15 minutos.
   ============================================================================ */

const QUIZ_COOLDOWN_MS = 15 * 60 * 1000;   // 15 minutos entre rodadas
const QUIZ_PRIZE_PER_HIT = 50000;          // prêmio por resposta certa
const QUIZ_KNOWLEDGE_PER_HIT = 4;
const QUIZ_REP_PER_HIT = 1;                // reputação por acerto
const QUIZ_BONUS_A_CADA = 10;              // a cada 10 obras gabaritadas...
const QUIZ_BONUS_VALOR = 1000000;          // ...€ 1 milhão

const Quiz = {
  perguntas: [],
  respostas: [],
  obra: null,
  indice: 0,

  // O cooldown sobrevive a recarregar a página; se o navegador bloquear o
  // armazenamento, o teste simplesmente fica sempre liberado.
  ultimaRodada(){
    try{
      const v = localStorage.getItem("artnexus_quiz_last");
      return v ? Number(v) : 0;
    }catch(e){ return 0; }
  },
  marcarRodada(){
    try{ localStorage.setItem("artnexus_quiz_last", String(Date.now())); }catch(e){}
  },
  msRestantes(){
    const falta = QUIZ_COOLDOWN_MS - (Date.now() - this.ultimaRodada());
    return Math.max(0, falta);
  },
  liberado(){ return this.msRestantes() === 0; },

  // Só entram obras com data de criação confiável — o teste não pode ensinar
  // data errada por causa de um metadado de arquivo.
  // Regras de elegibilidade:
  //  - data de criação confiável (o teste não pode ensinar data errada);
  //  - foto real: o cartão das obras tombadas exibe o próprio título, o que
  //    entregaria a pergunta do nome;
  //  - título sem o nome do artista ("Rembrandt em 1632"), senão a resposta
  //    do nome fica óbvia depois que o autor é revelado.
  elegiveis(){
    return State.allArtworks.filter(w =>
      !w.semQuiz && w.imagem &&
      /\b(1[0-9]{3}|20[0-9]{2})\b/.test(w.data_obra) &&
      !this.tituloEntregaArtista(w));
  },

  tituloEntregaArtista(w){
    const partes = w.artista.split(/[\s,]+/).filter(p => p.length > 3 && !["Velho","Sanzio"].includes(p));
    return partes.some(p => w.titulo.includes(p));
  },

  // Distratores do nome: até dois títulos do mesmo artista (mais difícil e
  // mais instrutivo) e o resto de outras obras; nunca repete um título.
  opcoesDeTitulo(obra){
    const usados = new Set([obra.titulo]);
    const pega = (lista, n) => {
      const out = [];
      for(const w of shuffle(lista)){
        if(out.length >= n) break;
        if(usados.has(w.titulo)) continue;
        usados.add(w.titulo); out.push(w.titulo);
      }
      return out;
    };
    const comFoto = State.allArtworks.filter(w => w.imagem && w.id !== obra.id);
    const mesmoArtista = pega(comFoto.filter(w => w.artista === obra.artista), 2);
    const outros = pega(comFoto.filter(w => w.artista !== obra.artista), 3 - mesmoArtista.length);
    return shuffle([obra.titulo, ...mesmoArtista, ...outros]);
  },

  anoDe(w){
    const m = w.data_obra.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    return m ? Number(m[1]) : null;
  },

  montar(){
    const pool = this.elegiveis();
    const obra = pool[Math.floor(Math.random()*pool.length)];
    this.obra = obra;
    this.respostas = [];
    this.indice = 0;

    const ano = this.anoDe(obra);
    // Distratores de ano: próximos o bastante para exigir conhecimento real
    const offsets = shuffle([ -60, -35, -18, 14, 28, 47 ]).slice(0,3);
    const anos = shuffle([ano, ...offsets.map(o=>ano+o)]);

    // Distratores de país e de artista, tirados do próprio acervo
    const paises = shuffle([...new Set(State.allArtworks.map(w=>w.pais))]
      .filter(p=>p!==obra.pais)).slice(0,3);
    const artistas = shuffle([...new Set(State.allArtworks.map(w=>w.artista))]
      .filter(a=>a!==obra.artista)).slice(0,3);

    this.perguntas = [
      { texto:"Em que ano esta obra foi concebida?",
        opcoes: anos.map(String), certa: String(ano) },
      { texto:"De qual país é o artista desta obra?",
        opcoes: shuffle([obra.pais, ...paises]), certa: obra.pais },
      { texto:"Quem é o autor desta obra?",
        opcoes: shuffle([obra.artista, ...artistas]), certa: obra.artista },
      // por último: se viesse antes, as opções de título poderiam sugerir o autor
      { texto:"Qual é o nome desta obra?",
        opcoes: this.opcoesDeTitulo(obra), certa: obra.titulo },
    ];
  },

  responder(opcao){
    const p = this.perguntas[this.indice];
    this.respostas.push({ pergunta:p, escolha:opcao, acertou: opcao === p.certa });
    if(opcao === p.certa) AudioFX.success(); else AudioFX.error();
    this.indice++;
    if(this.indice >= this.perguntas.length) this.finalizar();
    else renderQuiz();
  },

  finalizar(){
    const acertos = this.respostas.filter(r=>r.acertou).length;
    const premio = acertos * QUIZ_PRIZE_PER_HIT;
    State.cash += premio;
    State.knowledge += acertos * QUIZ_KNOWLEDGE_PER_HIT;
    State.reputation = Math.min(100, State.reputation + acertos * QUIZ_REP_PER_HIT);
    // obra "completamente identificada" = as quatro perguntas certas
    let bonus = 0;
    if(acertos === this.perguntas.length){
      State.quizGabaritos = (State.quizGabaritos || 0) + 1;
      if(State.quizGabaritos % QUIZ_BONUS_A_CADA === 0){
        bonus = QUIZ_BONUS_VALOR;
        State.cash += bonus;
        showNewspaper({ tipo:"alta", titulo:"OLHO DE CURADOR",
          texto:`O marchand identificou ${State.quizGabaritos} obras por completo e recebe o prêmio da Academia.`,
          destaque:`+ ${fmtMoney(bonus)}`, temNaColecao:false });
      }
    }
    this.ultimoBonus = bonus;
    this.marcarRodada();
    updateHUD();
    if(acertos > 0) AudioFX.applause();
    renderQuizResultado(acertos, premio);
  },
};

function fmtTempo(ms){
  const total = Math.ceil(ms/1000);
  const min = Math.floor(total/60), seg = total%60;
  return `${min}min ${String(seg).padStart(2,"0")}s`;
}

let quizCountdown = null;

function renderQuiz(){
  clearInterval(quizCountdown);
  const el = document.getElementById("view-quiz");

  // Rodada em andamento
  if(Quiz.obra && Quiz.indice < Quiz.perguntas.length){
    const p = Quiz.perguntas[Quiz.indice];
    el.innerHTML = `
      <div class="view-inner quiz-wrap">
        <h1 class="page-title">Teste do Curador</h1>
        <p class="page-sub">Pergunta ${Quiz.indice+1} de ${Quiz.perguntas.length} · cada acerto vale ${fmtMoney(QUIZ_PRIZE_PER_HIT)}</p>
        <div class="panel quiz-panel">
          <img class="quiz-img" src="${imgSrc(Quiz.obra)}" alt="obra do teste">
          <div class="quiz-progress">
            ${Quiz.perguntas.map((_,i)=>{
              const r = Quiz.respostas[i];
              const cls = r ? (r.acertou?"hit":"miss") : (i===Quiz.indice?"cur":"");
              return `<span class="qp ${cls}"></span>`;
            }).join("")}
          </div>
          <h2 class="quiz-q">${p.texto}</h2>
          <div class="quiz-options">
            ${p.opcoes.map(o=>`<button class="quiz-opt" data-opt="${escapeXml(o)}">${o}</button>`).join("")}
          </div>
        </div>
      </div>`;
    el.querySelectorAll(".quiz-opt").forEach(b=>{
      b.addEventListener("click", ()=>{
        el.querySelectorAll(".quiz-opt").forEach(x=>x.disabled = true);
        const escolhida = b.dataset.opt;
        // mostra o gabarito por um instante antes de seguir
        el.querySelectorAll(".quiz-opt").forEach(x=>{
          if(x.dataset.opt === p.certa) x.classList.add("correct");
          else if(x.dataset.opt === escolhida) x.classList.add("wrong");
        });
        setTimeout(()=>Quiz.responder(escolhida), 850);
      });
    });
    return;
  }

  // Fora de rodada: liberado ou em espera
  const liberado = Quiz.liberado();
  el.innerHTML = `
    <div class="view-inner quiz-wrap">
      <h1 class="page-title">Teste do Curador</h1>
      <p class="page-sub">Quatro perguntas sobre uma obra do acervo: ano, país, autoria e nome.</p>
      <div class="panel quiz-panel quiz-intro">
        <div class="quiz-badge">📜</div>
        <p class="quiz-regra">Cada resposta certa paga <strong>${fmtMoney(QUIZ_PRIZE_PER_HIT)}</strong>.
        Acertando as quatro, saem <strong>${fmtMoney(QUIZ_PRIZE_PER_HIT*4)}</strong>, e cada acerto dá reputação.
        A cada <strong>${QUIZ_BONUS_A_CADA} obras identificadas por completo</strong>, um prêmio de <strong>${fmtMoney(QUIZ_BONUS_VALOR)}</strong>
        (você tem ${State.quizGabaritos||0}).</p>
        ${liberado
          ? `<button class="btn btn-gold" id="btn-start-quiz">Iniciar rodada</button>`
          : `<div class="quiz-lock">
               <div class="quiz-lock-lbl">Próxima rodada em</div>
               <div class="quiz-timer" id="quiz-timer">${fmtTempo(Quiz.msRestantes())}</div>
             </div>`}
        <p class="quiz-nota">Uma rodada a cada 15 minutos.</p>
      </div>
    </div>`;

  if(liberado){
    document.getElementById("btn-start-quiz").addEventListener("click", ()=>{
      AudioFX.click();
      Quiz.montar();
      renderQuiz();
    });
  } else {
    quizCountdown = setInterval(()=>{
      const t = document.getElementById("quiz-timer");
      if(!t){ clearInterval(quizCountdown); return; }
      if(Quiz.liberado()){ clearInterval(quizCountdown); renderQuiz(); return; }
      t.textContent = fmtTempo(Quiz.msRestantes());
    }, 1000);
  }
}

function renderQuizResultado(acertos, premio){
  const el = document.getElementById("view-quiz");
  const o = Quiz.obra;
  el.innerHTML = `
    <div class="view-inner quiz-wrap">
      <h1 class="page-title">Resultado</h1>
      <div class="panel quiz-panel">
        <div class="quiz-score">${acertos} de ${Quiz.respostas.length}</div>
        <div class="quiz-prize ${premio>0?'pos':'zero'}">${premio>0? "+"+fmtMoney(premio) : "sem prêmio desta vez"}</div>
        ${acertos ? `<div class="quiz-nota" style="margin-top:-8px">+${acertos*QUIZ_REP_PER_HIT} de reputação</div>` : ""}
        ${Quiz.ultimoBonus ? `<div class="quiz-prize pos">🏆 Prêmio da Academia: +${fmtMoney(Quiz.ultimoBonus)}</div>` : ""}
        <div class="quiz-meta">Obras identificadas por completo: <b>${State.quizGabaritos||0}</b> ·
          próximo prêmio de ${fmtMoney(QUIZ_BONUS_VALOR)} em ${QUIZ_BONUS_A_CADA - ((State.quizGabaritos||0) % QUIZ_BONUS_A_CADA)}</div>
        <div class="quiz-review">
          ${Quiz.respostas.map(r=>`
            <div class="qr ${r.acertou?'hit':'miss'}">
              <div class="qr-q">${r.pergunta.texto}</div>
              <div class="qr-a">${r.acertou
                ? `✔ ${r.escolha}`
                : `✘ Você marcou <s>${r.escolha}</s> — era <strong>${r.pergunta.certa}</strong>`}</div>
            </div>`).join("")}
        </div>
        <div class="quiz-obra">
          <img src="${imgSrc(o)}" alt="">
          <div>
            <div class="quiz-obra-t">${o.titulo}</div>
            <div class="quiz-obra-s">${o.artista} · ${o.pais} · ${o.data_obra}</div>
            <button class="btn btn-outline btn-sm" id="btn-quiz-ficha" style="margin-top:8px;">Ver ficha completa</button>
          </div>
        </div>
        <p class="quiz-nota">Próxima rodada liberada em 15 minutos.</p>
      </div>
    </div>`;
  document.getElementById("btn-quiz-ficha").addEventListener("click", ()=>openWorkModal(o));
  Quiz.obra = null;
}
