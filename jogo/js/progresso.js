/* ============================================================================
   PROGRESSO — pontos (XP), patente, estrelas por país, domínio por pintor,
   álbum de obras conhecidas, sequência de dias e medalhas. Tudo fica salvo no
   próprio aparelho (localStorage).
   ============================================================================ */
const SAVE_KEY = "artnexus_quiz_v1";
const PATENTES = [
  { xp:0,     nome:"Aprendiz" },
  { xp:1500,  nome:"Visitante de museu" },
  { xp:5000,  nome:"Estudante de arte" },
  { xp:12000, nome:"Crítico" },
  { xp:25000, nome:"Curador" },
  { xp:50000, nome:"Mestre" },
  { xp:100000,nome:"Lenda da arte" },
];
const MEDALHAS = [
  { id:"primeira",  icone:"🎟️", nome:"Primeiros passos", desc:"Termine sua primeira rodada",       ok:P=>P.rodadas>=1 },
  { id:"gabarito",  icone:"🎯", nome:"Gabarito",         desc:"Acerte as 10 perguntas de uma rodada", ok:P=>P.gabaritos>=1 },
  { id:"seq10",     icone:"🔥", nome:"Em chamas",        desc:"10 acertos seguidos",                ok:P=>P.melhorSeq>=10 },
  { id:"viajante",  icone:"🧳", nome:"Viajante",         desc:"Jogue em 4 países",                  ok:P=>Object.keys(P.paises).length>=4 },
  { id:"mundo",     icone:"🌍", nome:"Cidadão do mundo", desc:"Jogue nos 8 países",                 ok:P=>Object.keys(P.paises).length>=8 },
  { id:"estrelas",  icone:"⭐", nome:"Constelação",      desc:"Junte 12 estrelas",                  ok:P=>totalEstrelas(P)>=12 },
  { id:"album",     icone:"🖼️", nome:"Colecionador",     desc:"Conheça 50 obras",                   ok:P=>Object.keys(P.vistas).length>=50 },
  { id:"especial",  icone:"🎓", nome:"Especialista",     desc:"Termine uma rodada no nível Especialista", ok:P=>P.especialista>=1 },
  { id:"vg3",       icone:"🌻", nome:"Aprendiz de Vincent", desc:"Conclua 3 capítulos da trilha Van Gogh", ok:P=>Object.values(P.vg||{}).filter(x=>x.estrelas>=1).length>=3 },
  { id:"dias7",     icone:"📅", nome:"Hábito de arte",   desc:"7 dias seguidos jogando",            ok:P=>P.dias.melhor>=7 },
];

// uma medalha por trilha concluída + "estudioso" (3 mestres começados)
Mestres.lista.forEach(t=>{ if(t.cfg.medalhaFim) MEDALHAS.push({ ...t.cfg.medalhaFim, ok:()=>t.completo() }); });
MEDALHAS.push({ id:"teorico", icone:"📘", nome:"Teórico da arte", desc:"Conheça 12 conceitos do Guia de arte", ok:()=>Conceitos.totalVistos()>=12 });
MEDALHAS.push({ id:"estudioso", icone:"📚", nome:"Estudioso", desc:"Conclua capítulos de 3 mestres diferentes", ok:()=>Mestres.lista.filter(t=>t.concluidos()>=1).length>=3 });

function progressoNovo(){
  return { xp:0, rodadas:0, acertos:0, perguntas:0, melhorSeq:0, gabaritos:0, especialista:0, nivel:"iniciante",
           paises:{}, pintores:{}, vg:{}, conceitos:{}, vistas:{}, dias:{ ultimo:"", seq:0, melhor:0 }, diario:{ data:"", pontos:0 }, medalhas:{}, tipos:{} };
}
function totalEstrelas(P){ return Object.values(P.paises).reduce((s,x)=>s+(x.estrelas||0),0); }
function patenteDe(xp){ let i = 0; PATENTES.forEach((p,k)=>{ if(xp>=p.xp) i = k; }); return { i, atual:PATENTES[i], prox:PATENTES[i+1] || null }; }
function hoje(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

const Prog = {
  P: progressoNovo(),
  carregar(){
    try{ const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if(d) this.P = { ...progressoNovo(), ...d, dias:{ ...progressoNovo().dias, ...(d.dias||{}) } }; }catch(e){}
  },
  salvar(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.P)); }catch(e){} },

  dominioPais(pais){
    const obras = Acervo.obras.filter(o=>o.pais===pais); if(!obras.length) return 0;
    return Math.round(100 * obras.filter(o=>this.P.vistas[o.id]).length / obras.length);
  },
  dominioPintor(nome){
    const obras = Acervo.obras.filter(o=>o.artista===nome); if(!obras.length) return 0;
    return Math.round(100 * obras.filter(o=>this.P.vistas[o.id]).length / obras.length);
  },

  // registra o fim de uma rodada; devolve novidades (patente nova, medalhas novas, estrelas)
  concluir(r){
    const P = this.P, antes = patenteDe(P.xp).i, medalhasAntes = { ...P.medalhas };
    P.xp += r.pontos; P.rodadas++; P.acertos += r.acertos; P.perguntas += r.respondidas;
    P.melhorSeq = Math.max(P.melhorSeq, r.melhorSeq);
    if(r.acertos===r.total && r.respondidas===r.total) P.gabaritos++;
    if(r.nivel==="especialista") P.especialista++;
    r.tiposAcertos.forEach(t=>{ P.tipos[t] = (P.tipos[t]||0)+1; });
    r.vistas.forEach(id=>{ P.vistas[id] = (P.vistas[id]||0)+1; });
    const esc = r.escopo;
    if(esc.tipo==="pais"){
      const x = P.paises[esc.valor] || (P.paises[esc.valor] = { estrelas:0, melhor:0, jogadas:0 });
      x.jogadas++; x.melhor = Math.max(x.melhor, r.pontos); x.estrelas = Math.max(x.estrelas, r.estrelas);
    }
    if(esc.tipo==="mestre"){
      const k = Mestres.get(esc.mestre).chave(esc.valor);
      const x = P.vg[k] || (P.vg[k] = { estrelas:0, melhor:0, jogadas:0 });
      x.jogadas++; x.melhor = Math.max(x.melhor, r.pontos); x.estrelas = Math.max(x.estrelas, r.estrelas);
    }
    if(esc.tipo==="pintor"){
      const x = P.pintores[esc.valor] || (P.pintores[esc.valor] = { acertos:0, total:0 });
      x.acertos += r.acertos; x.total += r.respondidas;
    }
    // sequência de dias
    const h = hoje();
    if(P.dias.ultimo !== h){
      const ontem = new Date(Date.now()-864e5), o = `${ontem.getFullYear()}-${String(ontem.getMonth()+1).padStart(2,"0")}-${String(ontem.getDate()).padStart(2,"0")}`;
      P.dias.seq = P.dias.ultimo===o ? P.dias.seq+1 : 1; P.dias.ultimo = h; P.dias.melhor = Math.max(P.dias.melhor, P.dias.seq);
    }
    if(esc.tipo==="diario") P.diario = { data:h, pontos:r.pontos };
    const novas = [];
    MEDALHAS.forEach(m=>{ if(!P.medalhas[m.id] && m.ok(P)){ P.medalhas[m.id] = h; novas.push(m); } });
    this.salvar();
    const depois = patenteDe(P.xp);
    return { novaPatente: depois.i > antes ? depois.atual : null, medalhas:novas };
  },
};
