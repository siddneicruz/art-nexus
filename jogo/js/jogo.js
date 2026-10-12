/* ============================================================================
   JOGO — uma rodada de 10 perguntas com vidas, sequência e pontos.
   ============================================================================ */
const RODADA = 10;

function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1 | a); t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; }; }
function hashTxt(s){ let h = 2166136261; for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const Jogo = {
  esc:null, nivel:"iniciante", fila:[], idx:0, respondidas:0, acertos:0, vidas:3, seq:0, melhorSeq:0, pontos:0,
  historico:[], respondida:false, t0:0, timer:null, bonusDiario:false,

  nomeEscopo(e = this.esc){
    if(!e) return "";
    if(e.tipo==="pais") return `${PAISES[e.valor].flag} ${e.valor}`;
    if(e.tipo==="pintor") return `🎨 ${e.valor}`;
    if(e.tipo==="diario") return "📅 Desafio do dia";
    if(e.tipo==="vangogh") return "🌻 Van Gogh · " + Vangogh.nomeDe(e.valor);
    return "🌍 Tudo misturado";
  },

  comecar(esc, semIntro){
    const nivel = esc.tipo==="diario" ? "intermediario" : Prog.P.nivel;
    const rnd = esc.tipo==="diario" ? mulberry32(hashTxt(hoje())) : Math.random;
    const fila = Perguntas.fila(esc, nivel, RODADA + 6, rnd);
    if(fila.length < 5){ toast("Ainda não há obras suficientes para esse desafio."); return; }
    Object.assign(this, { esc, nivel, fila, idx:0, respondidas:0, acertos:0, vidas:NIVEIS[nivel].vidas, seq:0, melhorSeq:0, pontos:0,
      historico:[], respondida:false, bonusDiario: esc.tipo==="diario" && Prog.P.diario.data !== hoje() });
    document.getElementById("tela-jogo").classList.add("aberta");
    const cap = esc.tipo==="vangogh" ? Vangogh.cap(esc.valor) : null;
    if(cap && !semIntro) this.intro(cap); else this.mostrar();
  },

  // cartão de abertura de um capítulo da trilha Van Gogh
  intro(cap){
    const el = document.getElementById("tela-jogo");
    const linha = Vangogh.linhaDoCapitulo(cap.id);
    el.innerHTML = `
      <div class="jg-topo"><button class="jg-x" id="jg-sair">✕</button><div class="jg-sub" style="margin:0">Capítulo ${cap.n} de 9</div><span></span></div>
      <div class="jg-corpo intro">
        <div class="intro-ico">${cap.icone}</div>
        <h2 class="intro-tit">${cap.titulo}</h2>
        <div class="intro-anos">${cap.anos} · ${cap.lugar}</div>
        <p class="intro-txt">${cap.resumo}</p>
        ${cap.frase ? `<blockquote class="intro-frase">${cap.frase}</blockquote>` : ""}
        ${linha.length ? `<div class="vg-linha">${linha.map(e=>`<div><b>${e.ano}</b><span>${e.curto}</span></div>`).join("")}</div>` : ""}
        <div class="jg-fb-btns" style="justify-content:center;margin-top:18px"><button class="btn ouro" id="intro-ir">Responder ${this.total()} perguntas</button></div>
      </div>`;
    el.querySelector("#jg-sair").addEventListener("click", ()=>this.sair());
    el.querySelector("#intro-ir").addEventListener("click", ()=>{ AudioFX.click(); this.mostrar(); });
  },

  sair(){ clearInterval(this.timer); document.getElementById("tela-jogo").classList.remove("aberta"); renderTudo(); },

  total(){ return Math.min(RODADA, this.fila.length); },

  mostrar(){
    clearInterval(this.timer);
    const el = document.getElementById("tela-jogo"), N = NIVEIS[this.nivel], q = this.fila[this.idx];
    if(!q || this.respondidas >= this.total() || this.vidas <= 0) return this.finalizar();
    this.respondida = false;
    const mult = 1 + Math.min(this.seq, 10) * 0.1;
    el.innerHTML = `
      <div class="jg-topo">
        <button class="jg-x" id="jg-sair" aria-label="Sair">✕</button>
        <div class="jg-vidas">${Array.from({length:N.vidas},(_,i)=>`<span class="${i<this.vidas?"on":"off"}">♥</span>`).join("")}</div>
        <div class="jg-info"><b>${this.pontos.toLocaleString("pt-BR")}</b> pts${this.seq>=2?` <span class="jg-seq">🔥 x${mult.toFixed(1)}</span>`:""}</div>
      </div>
      <div class="jg-prog">${Array.from({length:this.total()},(_,i)=>{ const h = this.historico[i]; return `<i class="${h===true?"hit":h===false?"miss":i===this.respondidas?"cur":""}"></i>`; }).join("")}</div>
      <div class="jg-sub">${this.nomeEscopo()} · ${N.nome} · ${this.respondidas+1}/${this.total()}</div>
      ${N.limite ? `<div class="jg-tempo"><i id="jg-barra"></i></div>` : `<div class="jg-tempo vazio"></div>`}
      <div class="jg-corpo">
        ${q.imagem ? `<div class="jg-img" id="jg-img">${this.htmlImagem(q, false)}</div>` : ""}
        <h2 class="jg-q">${q.texto}</h2>
        ${q.dica ? `<div class="jg-dica">${q.dica}</div>` : ""}
        <div class="jg-ops ${q.opcoes.length===2?"duas":""} ${q.longo?"longas":""}">
          ${q.opcoes.map(o=>`<button class="jg-op" data-op="${escapeAttr(o)}">${o}</button>`).join("")}
        </div>
        <div id="jg-fb"></div>
      </div>`;
    el.querySelector("#jg-sair").addEventListener("click", ()=>{ if(confirm("Sair da rodada? O progresso dela se perde.")) this.sair(); });
    el.querySelectorAll(".jg-op").forEach(b=>b.addEventListener("click", ()=>this.responder(b.dataset.op)));
    const img = el.querySelector("#jg-img img, #jg-img .zoom");
    if(q.imagem){
      // se a imagem da nuvem não carregar (sem internet), pula a pergunta
      const url = Acervo.imgSrc(q.obra), pre = new Image();
      pre.onerror = ()=>{ if(!this.respondida && this.fila[this.idx]===q){ this.idx++; this.mostrar(); } };
      pre.src = url;
    }
    this.t0 = Date.now();
    if(N.limite){
      const barra = el.querySelector("#jg-barra");
      this.timer = setInterval(()=>{
        const f = (Date.now()-this.t0) / (N.limite*1000);
        if(barra) barra.style.width = Math.max(0, 100 - f*100) + "%";
        if(barra) barra.parentElement.classList.toggle("urgente", f>0.7);
        if(f >= 1){ clearInterval(this.timer); this.responder(null); }
      }, 100);
    }
  },

  htmlImagem(q, revelada){
    if(!q.imagem) return `<div class="sem-img">🖼️</div>`;
    const url = Acervo.imgSrc(q.obra);
    if(q.zoom && !revelada) return `<div class="zoom" style="background-image:url('${url}');background-position:${q.zoom.x}% ${q.zoom.y}%"></div>`;
    return `<img src="${url}" alt="obra">`;
  },

  responder(escolha){
    if(this.respondida) return;
    clearInterval(this.timer);
    this.respondida = true;
    const N = NIVEIS[this.nivel], q = this.fila[this.idx], el = document.getElementById("tela-jogo");
    const acertou = escolha === q.certa, seg = (Date.now()-this.t0)/1000;
    let ganho = 0;
    if(acertou){
      this.seq++; this.melhorSeq = Math.max(this.melhorSeq, this.seq); this.acertos++;
      const mult = 1 + Math.min(this.seq-1, 10) * 0.1;
      ganho = Math.round(100 * N.mult * mult + 50 * N.mult * Math.max(0, 1 - seg/20));
      if(this.bonusDiario) ganho *= 2;
      this.pontos += ganho; AudioFX.success();
    } else { this.seq = 0; this.vidas--; AudioFX.error(); }
    this.respondidas++;
    this.historico.push(acertou);
    this.fila[this.idx].resultado = { acertou, escolha, ganho };
    // revela
    el.querySelectorAll(".jg-op").forEach(b=>{
      b.disabled = true;
      if(b.dataset.op === q.certa) b.classList.add("certa"); else if(b.dataset.op === escolha) b.classList.add("errada");
    });
    if(q.zoom && el.querySelector("#jg-img")) el.querySelector("#jg-img").innerHTML = this.htmlImagem(q, true);
    const fim = this.vidas<=0 || this.respondidas>=this.total();
    el.querySelector("#jg-fb").innerHTML = `
      <div class="jg-fb ${acertou?"ok":"erro"}">
        <div class="jg-fb-t">${acertou ? `✔ Correto! <span>+${ganho}</span>` : (escolha===null ? "⏱ Tempo esgotado" : "✘ Não foi dessa vez")}${!acertou && q.certa ? `<small>Resposta: ${q.certa}</small>` : ""}</div>
        <div class="jg-fb-txt">${Perguntas.explicar(q)}</div>
        <div class="jg-fb-btns">
          ${q.semObra ? "" : `<button class="btn ghost" id="jg-ficha">Ver ficha</button>`}
          <button class="btn ouro" id="jg-prox">${fim ? "Ver resultado" : "Próxima"}</button>
        </div>
      </div>`;
    el.querySelector("#jg-ficha")?.addEventListener("click", ()=>abrirFicha(q.obra));
    el.querySelector("#jg-prox").addEventListener("click", ()=>{ AudioFX.click(); this.idx++; this.mostrar(); });
    el.querySelector("#jg-fb").scrollIntoView({ block:"nearest", behavior:"smooth" });
    // atualiza topo (vidas/pontos)
    el.querySelector(".jg-vidas").innerHTML = Array.from({length:N.vidas},(_,i)=>`<span class="${i<this.vidas?"on":"off"}">♥</span>`).join("");
    el.querySelector(".jg-info").innerHTML = `<b>${this.pontos.toLocaleString("pt-BR")}</b> pts`;
  },

  finalizar(){
    clearInterval(this.timer);
    const el = document.getElementById("tela-jogo"), total = this.total();
    const completou = this.respondidas >= total && this.vidas > 0;
    const estrelas = completou ? (this.acertos/total>=0.9 ? 3 : this.acertos/total>=0.7 ? 2 : this.acertos/total>=0.5 ? 1 : 0) : 0;
    const resp = this.fila.filter(q=>q.resultado);
    const novidades = Prog.concluir({
      escopo:this.esc, nivel:this.nivel, pontos:this.pontos, acertos:this.acertos, total, respondidas:this.respondidas,
      melhorSeq:this.melhorSeq, estrelas,
      tiposAcertos: resp.filter(q=>q.resultado.acertou).map(q=>q.tipo),
      vistas: resp.filter(q=>q.resultado.acertou && !q.semObra).map(q=>q.obra.id),
    });
    if(this.acertos>0) AudioFX.applause();
    const pt = patenteDe(Prog.P.xp);
    const pctXp = pt.prox ? Math.round(100*(Prog.P.xp - pt.atual.xp)/(pt.prox.xp - pt.atual.xp)) : 100;
    // o que aprendeu: obras das perguntas (sem repetir)
    const vistas = []; resp.forEach(q=>{ if(!q.semObra && !vistas.includes(q.obra)) vistas.push(q.obra); });
    el.innerHTML = `
      <div class="jg-topo"><button class="jg-x" id="jg-sair">✕</button><div class="jg-sub" style="margin:0">${this.nomeEscopo()} · ${NIVEIS[this.nivel].nome}</div><span></span></div>
      <div class="jg-corpo res">
        <div class="res-estrelas">${[1,2,3].map(i=>`<span class="${i<=estrelas?"on":""}">★</span>`).join("")}</div>
        <h2 class="res-titulo">${this.vidas<=0 ? "Fim das vidas!" : estrelas===3 ? "Perfeito!" : estrelas>=1 ? "Muito bem!" : "Continue estudando"}</h2>
        <div class="res-grade">
          <div><b>${this.acertos}/${this.respondidas}</b><small>acertos</small></div>
          <div><b>${this.pontos.toLocaleString("pt-BR")}</b><small>pontos</small></div>
          <div><b>${this.melhorSeq}</b><small>melhor sequência</small></div>
        </div>
        ${this.bonusDiario ? `<p class="nota">Primeiro desafio do dia: pontos em dobro!</p>` : ""}
        <div class="xp"><div class="xp-top"><span>${pt.atual.nome}</span><span>${pt.prox ? `${(Prog.P.xp).toLocaleString("pt-BR")} / ${pt.prox.xp.toLocaleString("pt-BR")} XP` : "nível máximo"}</span></div><div class="barra"><i style="width:${pctXp}%"></i></div></div>
        ${novidades.novaPatente ? `<div class="novidade">🎖️ Nova patente: <b>${novidades.novaPatente.nome}</b></div>` : ""}
        ${novidades.medalhas.map(m=>`<div class="novidade">${m.icone} Medalha: <b>${m.nome}</b> — ${m.desc}</div>`).join("")}
        ${this.blocoVG(estrelas)}
        <h3 class="res-sec">${vistas.length ? "O que você viu" : ""}</h3>
        <div class="res-obras">${vistas.map((o,i)=>`<button class="res-obra" data-i="${i}"><img src="${Acervo.imgSrc(o)}" alt=""><span><b>${o.titulo||"Obra sem título"}</b><small>${o.artista}</small></span></button>`).join("")}</div>
        <div class="jg-fb-btns" style="justify-content:center;margin-top:18px">
          <button class="btn ouro" id="res-de-novo">Jogar de novo</button>
          <button class="btn ghost" id="res-voltar">Voltar</button>
        </div>
      </div>`;
    el.querySelector("#jg-sair").addEventListener("click", ()=>this.sair());
    el.querySelector("#res-voltar").addEventListener("click", ()=>this.sair());
    el.querySelector("#res-de-novo").addEventListener("click", ()=>{ AudioFX.click(); this.comecar(this.esc, true); });
    el.querySelector("#res-prox")?.addEventListener("click", ()=>{ AudioFX.click(); this.comecar({ tipo:"vangogh", valor:el.querySelector("#res-prox").dataset.id }); });
    el.querySelectorAll(".res-obra").forEach(b=>b.addEventListener("click", ()=>abrirFicha(vistas[+b.dataset.i])));
    updateTopo();
  },
};

Jogo.blocoVG = function(estrelas){
  if(!this.esc || this.esc.tipo!=="vangogh") return "";
  const cap = Vangogh.cap(this.esc.valor);
  if(!cap) return "";
  const linha = Vangogh.linhaDoCapitulo(cap.id), prox = Vangogh.proximo(cap.id);
  return `<div class="vg-fecho">
      <h3 class="res-sec">Linha do tempo · ${cap.titulo}</h3>
      <div class="vg-linha">${linha.map(e=>`<div><b>${e.ano}</b><span>${e.curto}</span></div>`).join("")}</div>
      ${cap.frase ? `<blockquote class="intro-frase">${cap.frase}</blockquote>` : ""}
      ${estrelas>=1 && prox ? `<div class="novidade">🔓 Capítulo ${prox.n} liberado: <b>${prox.titulo}</b> <button class="btn ouro" id="res-prox" data-id="${prox.id}" style="margin-left:8px;padding:6px 12px">Ir</button></div>`
        : estrelas<1 ? `<p class="nota">Acerte 5 ou mais (sem perder todas as vidas) para liberar o próximo capítulo.</p>` : ""}
    </div>`;
};

function escapeAttr(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }
