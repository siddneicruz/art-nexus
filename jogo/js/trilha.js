/* ============================================================================
   TRILHAS DE MESTRES — motor genérico. Cada mestre (Van Gogh, Leonardo, Monet,
   Rembrandt, Vermeer) é um objeto de dados registrado em Mestres.registrar().
   Estrutura: capítulos de vida e obra + 3 modos extras (Galeria, Estilo, Jornada).
   Escopo do jogo: { tipo:"mestre", mestre:"vangogh", valor:"arles" }
   ============================================================================ */

class Trilha {
  constructor(cfg){
    this.cfg = cfg; this.id = cfg.id; this.capitulos = cfg.capitulos;
  }

  /* modos extras: a galeria só aparece quando há obras com imagem; o catálogo quando a trilha tem lista em texto */
  get extras(){
    const c = this.cfg, out = [];
    if(Object.keys(this.galeriaMapa()).some(id=>Acervo.porId[id])) out.push({ id:"galeria", icone:"🖼️", titulo:"Galeria de obras", desc:"Reconheça títulos, anos e fases em obras do acervo" });
    if(c.catalogo) out.push({ id:"catalogo", icone:"📚", titulo:"Catálogo de obras", desc:"Fases e títulos das obras" });
    out.push({ id:"estilo", icone:"💬", titulo:c.estiloTitulo || "Estilo e método", desc:c.estiloDesc || "Técnica e pensamento" });
    out.push({ id:"jornada", icone:"🧭", titulo:"Jornada completa", desc:"Toda a vida e obra, misturadas" });
    return out;
  }
  /* galeria escrita à mão + obras do acervo cujo título bate com o catálogo (ex.: imagens que o usuário enviar) */
  galeriaMapa(){
    const g = { ...(this.cfg.galeria || {}) };
    if(this.cfg.catalogo){
      const norm = t => String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
      const porTitulo = new Map(this.cfg.catalogo.map(o=>[norm(o.t), o]));
      Acervo.obras.filter(o=>o.artista === this.cfg.artista && !g[o.id]).forEach(o=>{
        const e = porTitulo.get(norm(o.titulo)); if(e) g[o.id] = { ano:e.ano, fase:e.fase || undefined };
      });
    }
    /* galeriaTodas: toda obra do pintor no acervo entra na galeria (reconhecer o título), mesmo fora do catálogo */
    if(this.cfg.galeriaTodas) Acervo.obras.filter(o=>o.artista === this.cfg.artista && !g[o.id]).forEach(o=>{
      /* faseDoAno (opcional): deriva a fase do ano; só vale para ano preciso */
      const precisa = o.anoPreciso && o.ano;
      g[o.id] = this.cfg.faseDoAno ? { ano:precisa ? o.ano : undefined, fase:precisa ? this.cfg.faseDoAno(o.ano) : undefined, onde:o.museu || undefined, tecnica:o.tecnica || undefined } : {};
    });
    return g;
  }

  /* ---------- progresso ---------- */
  chave(id){ return this.id === "vangogh" ? id : `${this.id}:${id}`; }
  estado(){ return (Prog.P.vg || (Prog.P.vg = {})); }
  estrelas(id){ return (this.estado()[this.chave(id)] || {}).estrelas || 0; }
  totalEstrelas(){ return this.capitulos.reduce((s,c)=>s+this.estrelas(c.id),0); }
  concluidos(){ return this.capitulos.filter(c=>this.estrelas(c.id)>=1).length; }
  completo(){ return this.concluidos() === this.capitulos.length; }

  cap(id){ return this.capitulos.find(c=>c.id===id); }
  nomeDe(id){ const c = this.cap(id); if(c) return `${c.icone} ${c.titulo}`; const e = this.extras.find(x=>x.id===id); return e ? `${e.icone} ${e.titulo}` : this.cfg.nomeCurto; }
  liberado(id){
    const i = this.capitulos.findIndex(c=>c.id===id);
    if(i === 0) return true;
    if(i > 0) return this.estrelas(this.capitulos[i-1].id) >= 1;
    return this.concluidos() >= (this.cfg.liberaExtras || 3);
  }
  proximo(id){ const i = this.capitulos.findIndex(c=>c.id===id); return i>=0 ? this.capitulos[i+1] || null : null; }
  linhaDoCapitulo(id){ return this.cfg.eventos.filter(e=>e.cap===id).sort((a,b)=>a.ano-b.ano); }
  obrasNoAcervo(){ return Acervo.obras.filter(o=>o.artista === this.cfg.artista).length; }

  /* ---------- geração ---------- */
  montarEscrita(d, nivel){
    const n = NIVEIS[nivel].opcoes - 1;
    const obra = d.obra ? Acervo.porId[d.obra] : null;
    if(d.obra && !obra) return null;
    const opcoes = embaralhar([d.c, ...embaralhar(d.e).slice(0, n)]);
    return { tipo:"vg-"+d.t, texto:d.q, certa:d.c, opcoes, detalhe:d.d, custom:true,
      obra, imagem:!!obra, semObra:!obra, longo: opcoes.some(o=>o.length>34) };
  }
  anosProximos(ano, qtd){
    const lo = Math.min(this.cfg.anoMin, ano-12), hi = Math.max(this.cfg.anoMax, ano+12), set = new Set();
    for(const k of embaralhar([-1,1,-2,2,-3,3,-4,4,-5,5,-7,7,-9,9,-12,12])){
      const v = ano + k; if(v>=lo && v<=hi) set.add(v);
      if(set.size >= qtd) break;
    }
    return [...set];
  }
  perguntaAnoEvento(ev, nivel){
    const n = NIVEIS[nivel].opcoes - 1;
    const errados = this.anosProximos(ev.ano, n).map(String);
    return { tipo:"vg-linha", texto:ev.q, certa:String(ev.ano), opcoes:embaralhar([String(ev.ano), ...errados]), custom:true, semObra:true,
      detalhe:`${ev.ano}: ${ev.curto}.` };
  }
  perguntaOrdem(lista, rotulo, ano, nivel, texto){
    const n = Math.min(NIVEIS[nivel].opcoes, 4);
    const vistos = new Set(), unicos = [];
    embaralhar(lista).forEach(x=>{ if(!vistos.has(ano(x))){ vistos.add(ano(x)); unicos.push(x); } });
    if(unicos.length < 3) return null;
    const grupo = unicos.slice(0, n), primeiro = Math.random() < 0.5;
    const alvo = grupo.reduce((a,b)=> (primeiro ? ano(b)<ano(a) : ano(b)>ano(a)) ? b : a);
    return { tipo:"vg-linha", texto:texto(primeiro), certa:rotulo(alvo), opcoes:embaralhar(grupo.map(rotulo)), custom:true, semObra:true,
      detalhe: grupo.slice().sort((a,b)=>ano(a)-ano(b)).map(x=>`${ano(x)} — ${rotulo(x)}`).join("<br>"), longo:true };
  }
  ordemEventos(evs, nivel){
    return this.perguntaOrdem(evs, e=>e.curto, e=>e.ano, nivel, p=>p ? "Qual destes acontecimentos veio primeiro?" : "Qual destes acontecimentos veio por último?");
  }
  ordemObras(obras, nivel){
    const w = this.cfg.iniciada || "pintada";
    return this.perguntaOrdem(obras, o=>o.t, o=>o.a, nivel, p=>p ? `Qual destas obras foi ${w} primeiro?` : `Qual destas obras foi ${w} por último?`);
  }
  obraDeAno(nivel){
    const n = NIVEIS[nivel].opcoes - 1, obras = this.cfg.obras;
    if(obras.length < 4) return null;
    const alvo = embaralhar(obras)[0];
    const outras = embaralhar(obras.filter(o=>o.a !== alvo.a)).slice(0, n);
    if(outras.length < 2) return null;
    return { tipo:"vg-linha", texto:`Qual destas obras ${this.cfg.nomeCurto} ${this.cfg.verbo} em ${alvo.a}?`, certa:alvo.t, opcoes:embaralhar([alvo.t, ...outras.map(o=>o.t)]),
      custom:true, semObra:true, detalhe:`${alvo.t} é de ${alvo.a}.`, longo:true };
  }
  galeria(nivel){
    const { nomeCurto, verbo } = this.cfg, galeria = this.galeriaMapa(), n = NIVEIS[nivel].opcoes - 1;
    const ids = Object.keys(galeria).filter(id=>Acervo.porId[id]);
    const todos = ids.map(id=>Acervo.porId[id]);
    const ondes = [...new Set(ids.map(id=>galeria[id].onde).filter(Boolean))];
    const tecnicas = [...new Set(ids.map(id=>galeria[id].tecnica).filter(Boolean))];
    const out = [];
    ids.forEach(id=>{
      const o = Acervo.porId[id], g = galeria[id];
      const extra = [g.ano ? String(g.ano) : "", g.onde ? `🏛 ${g.onde}` : ""].filter(Boolean).join(" · ");
      out.push({ tipo:"vg-obra", texto:`Qual é o título desta obra de ${nomeCurto}?`, certa:o.titulo,
        opcoes:embaralhar([o.titulo, ...embaralhar(titulosCompativeis(o.titulo, todos.filter(x=>x.id!==id).map(x=>x.titulo))).slice(0,n)]),
        custom:true, obra:o, imagem:true, longo:true, detalhe:`${o.titulo}${extra ? " — "+extra : ""}` });
      if(g.ano) out.push({ tipo:"vg-obra", texto:`Em que ano ${nomeCurto} ${verbo} esta obra?`, certa:String(g.ano),
        opcoes:embaralhar([String(g.ano), ...this.anosProximos(g.ano, n).map(String)]),
        custom:true, obra:o, imagem:true, detalhe:`${o.titulo} é de ${g.ano}.` });
      if(g.fase) out.push({ tipo:"vg-obra", texto:this.cfg.textoFase, certa:g.fase,
        opcoes:embaralhar([g.fase, ...embaralhar((this.cfg.fases||[]).filter(f=>f!==g.fase)).slice(0,n)]),
        custom:true, obra:o, imagem:true, detalhe:`${o.titulo} foi feita em ${g.fase}${g.ano ? ", em "+g.ano : ""}.` });
      if(g.onde && ondes.length > n) out.push({ tipo:"vg-obra", texto:"Onde esta obra está hoje?", certa:g.onde,
        opcoes:embaralhar([g.onde, ...embaralhar(ondes.filter(x=>x!==g.onde)).slice(0,n)]),
        custom:true, obra:o, imagem:true, longo:true, detalhe:`${o.titulo} está em ${g.onde}.` });
      if(g.tecnica && tecnicas.length > n) out.push({ tipo:"vg-obra", texto:"Qual é a técnica desta obra?", certa:g.tecnica,
        opcoes:embaralhar([g.tecnica, ...embaralhar(tecnicas.filter(x=>x!==g.tecnica)).slice(0,n)]),
        custom:true, obra:o, imagem:true, longo:true, detalhe:`${o.titulo}: ${g.tecnica}.` });
    });
    return out.filter(q=>q.opcoes.length >= 3);   // título sem opções compatíveis é descartado
  }
  /* catálogo em texto: a que fase pertence cada obra / qual obra é de cada fase */
  catalogo(nivel){
    const cat = (this.cfg.catalogo || []).filter(o=>o.fase), n = NIVEIS[nivel].opcoes - 1, out = [];
    const fases = [...new Set(cat.map(o=>o.fase))];
    cat.forEach(o=>{
      const outras = embaralhar(fases.filter(f=>f!==o.fase)).slice(0,n);
      if(outras.length >= 2) out.push({ tipo:"vg-obra", texto:`A que fase de ${this.cfg.nomeCurto} pertence a obra «${o.t}»?`, certa:o.fase, opcoes:embaralhar([o.fase, ...outras]),
        custom:true, semObra:true, detalhe:`${o.t} é da fase ${o.fase}${o.ano ? " ("+o.ano+")" : ""}.` });
      const erradas = embaralhar(cat.filter(x=>x.fase!==o.fase)).slice(0,n);
      if(erradas.length >= 2) out.push({ tipo:"vg-obra", texto:`Qual destas obras é da fase ${o.fase}?`, certa:o.t, opcoes:embaralhar([o.t, ...erradas.map(x=>x.t)]),
        custom:true, semObra:true, longo:true, detalhe:`${o.t} é da fase ${o.fase}${o.ano ? " ("+o.ano+")" : ""}.` });
    });
    return out;
  }
  doCapitulo(id, nivel){
    const out = [];
    (this.cfg.perguntas[id] || []).forEach(d=>{ const q = this.montarEscrita(d, nivel); if(q) out.push(q); });
    this.linhaDoCapitulo(id).forEach(e=>out.push(this.perguntaAnoEvento(e, nivel)));
    const i = this.capitulos.findIndex(c=>c.id===id), ant = (this.capitulos[i-1]||{}).id;
    const o1 = this.ordemEventos(this.cfg.eventos.filter(e=>e.cap===id || e.cap===ant), nivel); if(o1) out.push(o1);
    const o2 = this.ordemObras(this.cfg.obras.filter(o=>o.cap===id || o.cap===ant), nivel); if(o2) out.push(o2);
    const cap = this.cap(id), gal = this.galeria(nivel).filter(q=>(cap.obras||[]).includes(q.obra.id) || (cap.faixa && q.obra.anoPreciso && q.obra.ano >= cap.faixa[0] && q.obra.ano <= cap.faixa[1]));
    embaralhar(gal).slice(0, cap.nGaleria || 3).forEach(q=>out.push(q));
    // conceitos ensinados no cartão de abertura do capítulo
    embaralhar(Conceitos.perguntas(Conceitos.doCapitulo(this.id, id), nivel)).slice(0,2).forEach(q=>out.push(q));
    return out;
  }

  /* fila para o motor do jogo (esc = {tipo:"mestre", mestre, valor}) */
  fila(esc, nivel, qtd){
    let pool = [];
    const v = esc.valor;
    if(this.cap(v)) pool = this.doCapitulo(v, nivel);
    else if(v === "galeria") pool = this.galeria(nivel);
    else if(v === "catalogo") pool = this.catalogo(nivel);
    else if(v === "estilo"){
      pool = this.cfg.estilo.map(d=>this.montarEscrita(d, nivel)).filter(Boolean);
      const ids = [...new Set(this.capitulos.flatMap(c=>Conceitos.doCapitulo(this.id, c.id)))];
      embaralhar(Conceitos.perguntas(ids, nivel)).slice(0,6).forEach(q=>pool.push(q));
    }
    else {
      this.capitulos.forEach(c=>{ embaralhar(this.doCapitulo(c.id, nivel)).slice(0,5).forEach(q=>pool.push(q)); });
      embaralhar(this.cfg.estilo).slice(0,4).forEach(d=>{ const q = this.montarEscrita(d, nivel); if(q) pool.push(q); });
      if(this.cfg.catalogo) embaralhar(this.catalogo(nivel)).slice(0,3).forEach(q=>pool.push(q));
      const o = this.ordemEventos(this.cfg.eventos, nivel); if(o) pool.push(o);
      const o2 = this.ordemObras(this.cfg.obras, nivel); if(o2) pool.push(o2);
      const o3 = this.obraDeAno(nivel); if(o3) pool.push(o3);
    }
    const vistos = new Set();
    pool = embaralhar(pool).filter(q=>{ const k = q.texto+"|"+q.certa+"|"+(q.obra ? q.obra.id : ""); if(vistos.has(k)) return false; vistos.add(k); return true; });
    return pool.slice(0, qtd);
  }
}

const Mestres = {
  lista:[], porId:{},
  registrar(cfg){
    cfg.artista = cfg.artista || cfg.nome;
    const t = new Trilha(cfg); this.lista.push(t); this.porId[cfg.id] = t;
  },
  get(id){ return this.porId[id] || this.lista[0]; },
};
