/* ============================================================================
   SALVAMENTO — a partida sobrevive a fechar a aba.
   Salva sozinho a cada 15 s, ao fechar a página e depois de eventos
   importantes. Ao abrir, retoma de onde parou. Guardado no próprio navegador
   (localStorage), então é por computador/navegador — não vai para a nuvem.
   Se o navegador bloquear o armazenamento (alguns bloqueiam em file://), o
   jogo continua funcionando normalmente, só sem salvar — e avisa uma vez.
   ============================================================================ */

const SAVE_KEY = "artnexus_save_v1";
const SAVE_VERSAO = 1;

const Save = {
  bloqueado: false,
  ultimo: 0,

  montar(){
    return {
      versao: SAVE_VERSAO, salvoEm: Date.now(),
      cash: State.cash, reputation: State.reputation, knowledge: State.knowledge,
      attemptsLeft: State.attemptsLeft, speedSecPerDay: State.speedSecPerDay,
      nextOwnedId: State.nextOwnedId, nextExpoId: State.nextExpoId,
      collection: State.collection,
      // a exposição aponta para a obra da coleção: guardamos só o ownedId e
      // religamos ao carregar (senão viraria uma cópia solta da obra)
      exhibitions: State.exhibitions.filter(e=>!e.ended).map(e=>{
        const { work, _sala, ...resto } = e; return { ...resto, ownedId: e.ownedId };
      }),
      agenda: State.agenda, salas: State.salas || {}, emprestimos: State.emprestimos || [],
      sede: State.sede || null, quizGabaritos: State.quizGabaritos || 0, estudo: State.estudo || null,
      seenIds: [...(State.seenIds || [])],
      mercado: { mult: Market.mult, hist: Market.hist, day: Market.day },
      missoes: State.missoes || null, album: State.album || null, metricas: State.metricas || null,
    };
  },

  salvar(){
    if(this.bloqueado) return false;
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.montar()));
      this.ultimo = Date.now();
      return true;
    } catch(e){
      this.bloqueado = true;
      toast("⚠️ Este navegador bloqueou o salvamento — a partida não será guardada ao fechar.");
      return false;
    }
  },

  existe(){
    try{ return !!localStorage.getItem(SAVE_KEY); } catch(e){ return false; }
  },

  carregar(){
    let d;
    try{ d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch(e){ return false; }
    if(!d || d.versao !== SAVE_VERSAO) return false;

    Object.assign(State, {
      cash:d.cash, reputation:d.reputation, knowledge:d.knowledge, attemptsLeft:d.attemptsLeft,
      speedSecPerDay:d.speedSecPerDay || 6, nextOwnedId:d.nextOwnedId, nextExpoId:d.nextExpoId,
      collection:d.collection || [], agenda:d.agenda || {}, salas:d.salas || {},
      emprestimos:d.emprestimos || [], sede:d.sede, quizGabaritos:d.quizGabaritos || 0, estudo:d.estudo || null,
      seenIds:new Set(d.seenIds || []), missoes:d.missoes, album:d.album, metricas:d.metricas,
    });
    // religa cada exposição à obra da coleção; quem estava no ar pousa na hora
    State.exhibitions = (d.exhibitions || []).map(e=>{
      const work = State.collection.find(o=>o.ownedId===e.ownedId);
      return work ? { ...e, work, chegada: e.chegada ? Date.now()-1 : e.chegada } : null;
    }).filter(Boolean);
    State.voos = [];
    if(d.mercado){ Market.mult = d.mercado.mult || {}; Market.hist = d.mercado.hist || {}; Market.day = d.mercado.day || 0; }
    return true;
  },

  apagar(){ try{ localStorage.removeItem(SAVE_KEY); } catch(e){} },

  iniciar(){
    setInterval(()=>this.salvar(), 15000);
    window.addEventListener("beforeunload", ()=>this.salvar());
  },
};

function novoJogo(){
  if(!confirm("Começar uma partida nova? O progresso atual será apagado.")) return;
  Save.apagar();
  Save.bloqueado = true;          // não deixa o beforeunload regravar a partida antiga
  location.reload();
}
