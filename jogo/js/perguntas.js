/* ============================================================================
   PERGUNTAS — monta as perguntas na hora a partir do acervo.
   Cada gerador devolve { tipo, texto, opcoes, certa, explicacao, obra, ... }
   ou null quando a obra não tem o dado necessário (assim nunca sai pergunta
   com resposta duvidosa). Quando o jogador escolhe um PAÍS, não perguntamos
   o país da obra — perguntamos cidade, ano, técnica, museu, curiosidades...
   ============================================================================ */

const NIVEIS = {
  iniciante:    { nome:"Iniciante",     mult:1,   opcoes:4, vidas:3, limite:0,  desc:"Sem limite de tempo" },
  intermediario:{ nome:"Intermediário", mult:1.5, opcoes:4, vidas:3, limite:0,  desc:"Bônus por rapidez" },
  avancado:     { nome:"Avançado",      mult:2,   opcoes:4, vidas:3, limite:25, desc:"25 s por pergunta" },
  especialista: { nome:"Especialista",  mult:3,   opcoes:5, vidas:2, limite:15, desc:"15 s · só 2 vidas" },
};
// peso de cada tipo por nível (0 = não aparece)
const PESOS = {
  iniciante:    { autor:4, titulo:3, zoom:3, movimento:2, seculo:3, cidade:2, fato:3 },
  intermediario:{ autor:3, titulo:3, zoom:3, movimento:3, decada:3, cidade:3, museu:2, fato:3, cronologia:2 },
  avancado:     { autor:2, titulo:3, zoom:3, movimento:3, decada:3, cidade:3, museu:3, fato:4, cronologia:3, edeste:2 },
  especialista: { autor:2, titulo:3, zoom:3, movimento:3, ano:4, cidade:3, museu:3, fato:4, cronologia:4, edeste:2 },
};
const ROMANOS = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];
const CIDADES_ARTE = ["Paris","Florença","Roma","Veneza","Madri","Amsterdã","Londres","Viena","Berlim","Milão","Haia","Bruges","Antuérpia","Toledo","Sevilha","Munique","Dresden","Barcelona","Nova York","Delft"];

function embaralhar(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function unicos(arr, excluir){ return [...new Set(arr.filter(v=>v!=null && v!=="" && String(v)!==String(excluir)))]; }
// n valores diferentes de `certo`, preferindo os de `perto`
function distratores(certo, todos, n, perto=[]){
  const a = embaralhar(unicos(perto, certo));
  const b = embaralhar(unicos(todos, certo).filter(v=>!a.includes(v)));
  return [...a, ...b].slice(0, n);
}

/* Grupo visual provável de um título: evita opções absurdas (montanha x autorretrato) */
const GRUPOS_TITULO = [
  ["natureza", /natureza[- ]morta|cr[âa]nios?|caveira|flores|girass|vaso|ma[cç]ãs|frutas|cesta|buqu[eê]|lírios|íris|ir[ií]s/i],
  ["pessoas", /retrato|autorretrato|auto-retrato|jogadores|banhistas?|m[uú]sicos?|dan[cç]a|bailarina|jovem|menina|menino|mulher|homem|dama|senhor|senhora|crian[cç]a|camponês|camponesa|pastor|madona|virgem|cristo|anuncia[cç][aã]o|ceia|crucifica|ador[aã][cç][aã]o|davi|pietà|pieta|gioconda|monalisa|mona lisa|leiteira|aula de anatomia|ronda|noiva|tocador|comedores|cabeça|beijo|abra[cç]o|família/i],
  ["paisagem", /monte|montanha|paisagem|rio\b|ponte|campo|campos|mar\b|vista|jardim|colina|catedral|estrada|floresta|c[eé]u|noite estrelada|lago|nin[fé]|álamos|palheiro|trigo|celeiro|igreja|porto|praia|cais|neve/i],
];
/* revelação progressiva: grade 3x4 com algumas peças abertas; abrem mais com o tempo */
function novaRevelacao(){ const cols = 3, rows = 4, total = cols*rows; return { cols, rows, total, inicial:3, ordem:embaralhar(Array.from({length:total},(_,i)=>i)) }; }
function grupoTitulo(t){ t = String(t||""); for(const [g,re] of GRUPOS_TITULO) if(re.test(t)) return g; return null; }
function titulosCompativeis(certo, lista){
  const g = grupoTitulo(certo);
  if(!g) return lista;
  const mesmo = lista.filter(t=>grupoTitulo(t)===g);
  if(mesmo.length >= 6) return mesmo;            // de preferência só títulos do mesmo tipo de imagem
  return lista.filter(t=>{ const x = grupoTitulo(t); return !x || x===g; });
}

const Perguntas = {
  /* escopo: {tipo:"pais"|"pintor"|"misto"|"diario", valor} */
  obrasDo(esc){
    const o = Acervo.obras;
    if(esc.tipo==="pais")   return o.filter(w=>w.pais===esc.valor);
    if(esc.tipo==="pintor") return o.filter(w=>w.artista===esc.valor);
    return o;
  },

  // escolhe as obras da rodada: metade (ou mais) curadas, para haver variedade de perguntas
  selecionar(esc, qtd, rnd=Math.random){
    let pool = this.obrasDo(esc);
    // com um pintor escolhido só entram obras com pergunta possível (não perguntamos o autor)
    if(esc.tipo==="pintor") pool = pool.filter(w=>w.rica || w.tituloOk);
    const mistura = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
    // acervos grandes de um único artista (ex.: Dalí, mais de mil obras) não podem dominar rodadas de país ou mistas
    if(esc.tipo!=="pintor"){
      const grupos = {}; pool.forEach(w=>{ (grupos[w.artista] = grupos[w.artista] || []).push(w); });
      const nG = Object.keys(grupos).length, K = Math.max(6, Math.ceil(qtd*2/Math.max(1,nG)));
      pool = Object.values(grupos).flatMap(g=>mistura(g).slice(0,K));
    }
    const ricas = mistura(pool.filter(w=>w.rica)), outras = mistura(pool.filter(w=>!w.rica));
    const nRicas = Math.min(ricas.length, Math.ceil(qtd*0.65));
    let sel = [...ricas.slice(0,nRicas), ...outras.slice(0, qtd-nRicas)];
    if(sel.length < qtd) sel = [...sel, ...ricas.slice(nRicas, nRicas + qtd - sel.length)];
    return mistura(sel).slice(0, qtd);
  },

  fila(esc, nivel, qtd, rnd=Math.random){
    if(esc.tipo==="conceitos") return Conceitos.fila(nivel, qtd);
    if(esc.tipo==="mestre") return Mestres.get(esc.mestre).fila(esc, nivel, qtd);
    const obras = this.selecionar(esc, qtd, rnd);
    const contagem = {};
    const out = [];
    obras.forEach(o=>{
      const q = this.montar(o, esc, nivel, contagem, rnd);
      if(q){ contagem[q.tipo] = (contagem[q.tipo]||0)+1; out.push(q); }
    });
    return out;
  },

  montar(o, esc, nivel, contagem, rnd=Math.random){
    const pesos = { ...PESOS[nivel] };
    delete pesos.edeste;    // "Esta obra é de X?" também pergunta o autor: fora
    if(esc.tipo==="pintor"){   // o jogador já escolheu o artista: nada de "quem pintou?"
      pesos.autor = 0; pesos.zoom = 0; pesos.movimento = 0; pesos.zoomtitulo = 3;
    }
    // evita repetir muito o mesmo tipo na rodada
    const tipos = Object.keys(pesos).filter(t=>pesos[t]>0 && (contagem[t]||0) < 4);
    let bag = [];
    tipos.forEach(t=>{ for(let i=0;i<pesos[t];i++) bag.push(t); });
    bag = embaralhar(bag);
    const tentados = new Set();
    for(const t of bag){
      if(tentados.has(t)) continue; tentados.add(t);
      const q = this.gerar(t, o, esc, nivel);
      if(q) return { ...q, tipo:t, obra:o };
    }
    return null;
  },

  gerar(t, o, esc, nivel){
    const N = NIVEIS[nivel], n = N.opcoes - 1, todas = Acervo.obras, ricas = todas.filter(w=>w.rica);
    const mk = (texto, certa, erradas, extra={})=> erradas.length>=2 ? { texto, certa, opcoes:embaralhar([certa, ...erradas]), ...extra } : null;
    switch(t){
      case "autor": {
        const perto = todas.filter(w=>w.pais===o.pais || (o.movimento && w.movimento===o.movimento)).map(w=>w.artista);
        return mk(`Quem ${Acervo.verboDe(o)} esta obra?`, o.artista, distratores(o.artista, todas.map(w=>w.artista), n, perto), { imagem:true });
      }
      case "zoom": {
        const perto = todas.filter(w=>w.pais===o.pais || (o.movimento && w.movimento===o.movimento)).map(w=>w.artista);
        return mk(`Que artista ${Acervo.verboDe(o)} esta obra? (a imagem vai se revelando)`, o.artista, distratores(o.artista, todas.map(w=>w.artista), n, perto),
          { imagem:true, revela:novaRevelacao() });
      }
      case "titulo": {
        if(o.nuvem && !o.tituloOk) return null;
        const mesmo = titulosCompativeis(o.titulo, todas.filter(w=>w.artista===o.artista && w.id!==o.id && (w.rica || w.tituloOk)).map(w=>w.titulo));
        const outros = titulosCompativeis(o.titulo, todas.filter(w=>(w.rica || w.tituloOk) && w.id!==o.id).map(w=>w.titulo));
        return mk("Qual é o título desta obra?", o.titulo, distratores(o.titulo, outros, n, mesmo), { imagem:true });
      }
      case "zoomtitulo": {
        if(o.nuvem && !o.tituloOk) return null;
        const mesmo = titulosCompativeis(o.titulo, todas.filter(w=>w.artista===o.artista && w.id!==o.id && (w.rica || w.tituloOk)).map(w=>w.titulo));
        const outros = titulosCompativeis(o.titulo, todas.filter(w=>(w.rica || w.tituloOk) && w.id!==o.id).map(w=>w.titulo));
        return mk("Qual é o título desta obra? (a imagem vai se revelando)", o.titulo, distratores(o.titulo, outros, n, mesmo),
          { imagem:true, longo:true, revela:novaRevelacao() });
      }
      case "movimento": {
        if(!o.movimento) return null;
        return mk("A que movimento artístico esta obra pertence?", o.movimento, distratores(o.movimento, todas.map(w=>w.movimento), n), { imagem:true });
      }
      case "seculo": {
        if(!o.rica || !o.ano) return null;
        const s = Math.ceil(o.ano/100);
        const cand = [s-3,s-2,s-1,s+1,s+2].filter(v=>v>=11 && v<=21).map(v=>"Século "+ROMANOS[v]);
        return mk("Em que século esta obra foi criada?", "Século "+ROMANOS[s], embaralhar(cand).slice(0,n), { imagem:true });
      }
      case "decada": {
        if(!o.rica || !o.ano) return null;
        const d = Math.floor(o.ano/10)*10;
        const cand = [-60,-50,-40,-30,-20,-10,10,20,30,40,50,60].map(k=>d+k).filter(v=>v>=1000 && v<=2020);
        return mk("Em que década esta obra foi criada?", `${d}s`, embaralhar(cand).slice(0,n).map(v=>`${v}s`), { imagem:true });
      }
      case "ano": {
        if(!o.rica || !o.ano || !o.anoPreciso) return null;
        const y = o.ano, base = [-30,-20,-15,-10,-7,-4,-2,2,4,7,10,15,20,30].map(k=>y+k).filter(v=>v>=1000 && v<=2020);
        return mk("Em que ano esta obra foi criada?", String(y), embaralhar(base).slice(0,n).map(String), { imagem:true });
      }
      case "tecnica": {
        if(!o.rica || !o.tecnica) return null;
        return mk("Qual é a técnica desta obra?", o.tecnica, distratores(o.tecnica, ricas.map(w=>w.tecnica), n), { imagem:true });
      }
      case "cidade": {
        if(!o.rica || !o.cidade) return null;
        const pool = ricas.map(w=>w.cidade).concat(CIDADES_ARTE);
        return mk("Esta obra está ligada a qual cidade?", o.cidade, distratores(o.cidade, pool, n), { imagem:true, dica:"cidade onde foi criada ou onde está hoje" });
      }
      case "museu": {
        if(!o.rica || !o.museu) return null;
        return mk("Onde esta obra está hoje?", o.museu, distratores(o.museu, ricas.map(w=>w.museu), n), { imagem:true });
      }
      case "fato": {
        if(!o.rica || !o.fatos.length) return null;
        const certa = embaralhar(o.fatos)[0];
        const mesmo = ricas.filter(w=>w.artista===o.artista && w.id!==o.id).flatMap(w=>w.fatos);
        const outros = ricas.filter(w=>w.id!==o.id).flatMap(w=>w.fatos);
        return mk(`Qual destes fatos é sobre esta obra, «${o.titulo}»?`, certa, distratores(certa, outros, n, mesmo), { imagem:true, longo:true });
      }
      case "cronologia": {
        if(!o.rica || !o.ano || !o.anoPreciso) return null;
        const outras = embaralhar(ricas.filter(w=>w.id!==o.id && w.anoPreciso && Math.abs(w.ano-o.ano)>=25));
        const escolhidas = [];
        for(const w of outras){ if(escolhidas.every(x=>Math.abs(x.ano-w.ano)>=25)) escolhidas.push(w); if(escolhidas.length>=Math.min(n,3)) break; }
        if(escolhidas.length < 2) return null;
        const grupo = [o, ...escolhidas], antiga = Math.random() < 0.5;
        const alvo = grupo.reduce((a,b)=> (antiga ? b.ano<a.ano : b.ano>a.ano) ? b : a);
        return { texto: antiga ? "Qual destas obras é a mais antiga?" : "Qual destas obras é a mais recente?",
          certa: alvo.titulo, opcoes: embaralhar(grupo.map(w=>w.titulo)),
          detalhe: grupo.slice().sort((a,b)=>a.ano-b.ano).map(w=>`${w.titulo} (${w.ano})`).join(" → "), semObra:true };
      }
      case "edeste": {
        const certa = o.artista===esc.valor ? "Sim" : "Não";
        return { texto:`Esta obra é de ${esc.valor}?`, certa, opcoes:["Sim","Não"], imagem:true };
      }
    }
    return null;
  },

  explicar(q){
    const o = q.obra, p = [];
    if(q.semObra){ return q.detalhe; }
    if(q.custom){ return q.detalhe + (o && o.titulo ? `<br>🖼 <b>${o.titulo}</b>${o.anoTxt ? " · "+o.anoTxt : ""}` : ""); }
    p.push(`<b>${o.titulo}</b> — ${o.artista} (${PAISES[o.pais].flag} ${o.pais})`);
    const meta = [o.anoTxt && o.rica ? o.anoTxt : "", o.movimento, o.tecnica].filter(Boolean).join(" · ");
    if(meta) p.push(meta);
    if(q.detalhe) p.push(q.detalhe);
    if(o.localTxt) p.push("📍 " + o.localTxt);
    if(o.museu) p.push("🏛 " + o.museu);
    if(o.fatos && o.fatos.length) p.push("✦ " + (q.tipo==="fato" ? q.certa : o.fatos[0]));
    return p.join("<br>");
  },
};
