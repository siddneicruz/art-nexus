/* ============================================================================
   CONFIGURAÇÕES — o jogador decide o ritmo dos avisos.
   Cada tipo de mensagem tem seu próprio nível de frequência (desligado, raro,
   normal, frequente), a duração dos cartões é ajustável, e tudo é lembrado
   entre partidas (fica em localStorage, separado do salvamento do jogo — ao
   começar uma partida nova, suas preferências continuam).
   Avisos que deixam de aparecer não somem: vão para o histórico.
   ============================================================================ */

const CONFIG_KEY = "artnexus_config_v1";

const TIPOS_AVISO = [
  { id:"compra",    rotulo:"Propostas de compra",   ajuda:"Alguém quer comprar uma obra sua." },
  { id:"venda",     rotulo:"Ofertas de venda",      ajuda:"Um vendedor oferece uma obra fora da roleta." },
  { id:"leilao",    rotulo:"Convites para pregões", ajuda:"Aviso de que há um leilão aberto para participar." },
  { id:"relampago", rotulo:"Pergunta relâmpago",    ajuda:"Uma pergunta sobre uma obra que paga € 100 mil por acerto." },
  { id:"dica",      rotulo:"Dicas de jogo",         ajuda:"Orientações para jogar melhor." },
  { id:"jornal",    rotulo:"Jornal (Correio das Artes)", ajuda:"Notícias de mercado. Mesmo desligado, o efeito no mercado continua e a notícia vai para o histórico." },
];
const NIVEIS_FREQ = [["off","Desligado"],["raro","Raro"],["normal","Normal"],["frequente","Frequente"]];

// [mín, máx] em segundos reais entre uma ocorrência e a próxima
// (no jornal, é o intervalo mínimo entre duas edições na tela)
const INTERVALOS_S = {
  compra:    { raro:[300,420],   normal:[150,240], frequente:[70,110]  },
  venda:     { raro:[300,420],   normal:[150,240], frequente:[70,110]  },
  leilao:    { raro:[420,600],   normal:[240,360], frequente:[120,180] },
  relampago: { raro:[1200,1500], normal:[600,660], frequente:[300,360] },
  dica:      { raro:[720,900],   normal:[360,480], frequente:[180,240] },
  jornal:    { raro:[360,360],   normal:[180,180], frequente:[75,75]   },
};
const DURACOES_AVISO = [["curta","Curta (6 s)",6000],["normal","Normal (12 s)",12000],["longa","Longa (25 s)",25000],["manual","Até eu fechar",0]];
const EXPIRACOES = [["nunca","Nunca expiram",0],["1min","1 minuto",60000],["3min","3 minutos",180000],["5min","5 minutos",300000]];

const CONFIG_PADRAO = {
  duracao:"normal", expira:"nunca",
  freq:{ compra:"normal", venda:"normal", leilao:"normal", relampago:"normal", dica:"raro", jornal:"raro" },
  audioComentarios:true, relatorio:"compacto", vistaExpo:"compacta",
};

const Config = {
  v: JSON.parse(JSON.stringify(CONFIG_PADRAO)),
  persistente: true,

  carregar(){
    try{
      const salvo = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      if(salvo) this.v = { ...CONFIG_PADRAO, ...salvo, freq:{ ...CONFIG_PADRAO.freq, ...(salvo.freq||{}) } };
    } catch(e){ this.persistente = false; }
  },
  salvar(){
    try{ localStorage.setItem(CONFIG_KEY, JSON.stringify(this.v)); } catch(e){ this.persistente = false; }
  },
  definir(chave, valor){
    if(chave.startsWith("freq.")) this.v.freq[chave.slice(5)] = valor; else this.v[chave] = valor;
    this.salvar();
    if(chave.startsWith("freq.") && typeof Eventos !== "undefined") Eventos.reagendar(chave.slice(5));
  },
  restaurar(){
    this.v = JSON.parse(JSON.stringify(CONFIG_PADRAO)); this.salvar();
    if(typeof Eventos !== "undefined") Eventos.reagendarTodos();
  },

  duracaoMs(){ return (DURACOES_AVISO.find(d=>d[0]===this.v.duracao) || DURACOES_AVISO[1])[2]; },
  expiraMs(){ return (EXPIRACOES.find(d=>d[0]===this.v.expira) || EXPIRACOES[0])[2]; },
  // tempo até a próxima ocorrência; null = desligado
  intervaloMs(tipo){
    const nivel = this.v.freq[tipo];
    const faixa = INTERVALOS_S[tipo] && INTERVALOS_S[tipo][nivel];
    if(!faixa) return null;
    return Math.round((faixa[0] + Math.random()*(faixa[1]-faixa[0])) * 1000);
  },
  gapMs(tipo){
    const faixa = INTERVALOS_S[tipo] && INTERVALOS_S[tipo][this.v.freq[tipo]];
    return faixa ? faixa[0]*1000 : Infinity;
  },
};
Config.carregar();

/* ---------------------------------------------------- histórico de avisos */
const Avisos = {
  lista: [], naoLidos: 0,
  registrar(icone, titulo, texto){
    const plano = String(texto || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    this.lista.unshift({ quando: Date.now(), icone, titulo, texto: plano.slice(0, 220) });
    if(this.lista.length > 40) this.lista.pop();
    this.naoLidos++;
    const b = document.getElementById("btn-config");
    if(b) b.dataset.n = this.naoLidos > 9 ? "9+" : String(this.naoLidos);
  },
  limpar(){ this.lista = []; this.naoLidos = 0; document.getElementById("btn-config")?.removeAttribute("data-n"); },
};

/* -------------------------------------------------------------------- tela */
function renderConfig(){
  const el = document.getElementById("view-config"); if(!el) return;
  Avisos.naoLidos = 0; document.getElementById("btn-config")?.removeAttribute("data-n");
  const sel = (chave, opcoes, atual) => `<select data-cfg="${chave}">${opcoes.map(o=>`<option value="${o[0]}" ${o[0]===atual?"selected":""}>${o[1]}</option>`).join("")}</select>`;
  const hora = t => new Date(t).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
  el.innerHTML = `<div class="view-inner">
    <h1 class="page-title">Configurações</h1>
    <p class="page-sub">Ajuste o ritmo das mensagens do jogo. Tudo é lembrado entre partidas${Config.persistente ? "" : " — <b>mas este navegador bloqueou o armazenamento, então só vale até fechar a aba</b>"}.</p>

    <div class="panel cfg-bloco"><h3>Frequência das mensagens</h3>
      ${TIPOS_AVISO.map(t=>`<div class="cfg-linha"><div><b>${t.rotulo}</b><small>${t.ajuda}</small></div>
        ${sel("freq."+t.id, NIVEIS_FREQ, Config.v.freq[t.id])}</div>`).join("")}
    </div>

    <div class="panel cfg-bloco"><h3>Tempo na tela</h3>
      <div class="cfg-linha"><div><b>Avisos informativos</b><small>Quanto tempo ficam abertos (relatórios, conquistas, dicas).</small></div>
        ${sel("duracao", DURACOES_AVISO, Config.v.duracao)}</div>
      <div class="cfg-linha"><div><b>Propostas e ofertas</b><small>Esperam sua decisão. Se preferir, elas expiram sozinhas — com uma barra de tempo no cartão.</small></div>
        ${sel("expira", EXPIRACOES, Config.v.expira)}</div>
    </div>

    <div class="panel cfg-bloco"><h3>Exposições</h3>
      <div class="cfg-linha"><div><b>Comentários falados dos visitantes</b><small>Desliga a voz em todas as exposições. Cada exposição também tem seu botão 🔊.</small></div>
        ${sel("audioComentarios", [["true","Ligados"],["false","Desligados"]], String(Config.v.audioComentarios))}</div>
      <div class="cfg-linha"><div><b>Relatório ao encerrar</b><small>O compacto é um cartão pequeno no canto, com detalhes sob demanda.</small></div>
        ${sel("relatorio", [["compacto","Compacto"],["detalhado","Janela detalhada"]], Config.v.relatorio)}</div>
      <div class="cfg-linha"><div><b>Lista de exposições</b><small>Compacta mostra uma linha por exposição.</small></div>
        ${sel("vistaExpo", [["compacta","Compacta"],["detalhada","Detalhada"]], Config.v.vistaExpo)}</div>
    </div>

    <div class="action-row"><button class="btn btn-outline btn-sm" id="cfg-restaurar">Restaurar padrões</button></div>

    <div class="panel cfg-bloco"><h3>Histórico de avisos <small>(${Avisos.lista.length})</small></h3>
      ${Avisos.lista.length ? Avisos.lista.map(a=>`<div class="cfg-hist"><span class="ch-h">${hora(a.quando)}</span>
        <span class="ch-i">${a.icone}</span><span><b>${a.titulo}</b> ${a.texto ? "— "+a.texto : ""}</span></div>`).join("")
        : `<p class="cfg-vazio">Nada por aqui ainda. Mensagens que você perder ou silenciar aparecem nesta lista.</p>`}
      ${Avisos.lista.length ? `<button class="btn btn-outline btn-sm" id="cfg-limpar" style="margin-top:8px">Limpar histórico</button>` : ""}
    </div></div>`;

  el.querySelectorAll("[data-cfg]").forEach(s=>s.addEventListener("change", ()=>{
    const chave = s.dataset.cfg; let valor = s.value;
    if(chave === "audioComentarios") { valor = valor === "true"; if(!valor && window.speechSynthesis) try{ window.speechSynthesis.cancel(); }catch(e){} }
    Config.definir(chave, valor);
    AudioFX.click();
  }));
  document.getElementById("cfg-restaurar").addEventListener("click", ()=>{ Config.restaurar(); AudioFX.click(); renderConfig(); toast("Padrões restaurados"); });
  document.getElementById("cfg-limpar")?.addEventListener("click", ()=>{ Avisos.limpar(); renderConfig(); });
}
