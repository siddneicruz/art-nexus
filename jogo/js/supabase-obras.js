/* ============================================================================
   CARREGADOR DE OBRAS DO SUPABASE
   As 162 obras embutidas em artworks-data.js continuam sendo a base garantida
   — o jogo abre e funciona 100% offline, como sempre. Se SUPABASE_CONFIG (em
   js/supabase-config.js) estiver preenchido, o jogo tenta buscar a tabela
   "obras" e SOMA as que ainda não existem localmente (por id) ao acervo —
   é assim que dá para expandir o catálogo sem tocar no código do jogo.
   Se a busca falhar, demorar demais ou não estiver configurada, o jogo segue
   só com as 162 locais, sem travar nem avisar erro nenhum.
   ============================================================================ */

const SUPABASE_TIER_LABEL = { 1:"Emergente", 2:"Promissor", 3:"Reconhecido", 4:"Mestre", 5:"Raro", 6:"Lendário" };
const SUPABASE_PAISES_VALIDOS = ["Itália","Holanda","França","Espanha","Alemanha","Reino Unido","Áustria","Brasil"];

// "sb:Artista/arquivo.jpg" -> URL pública do bucket
function urlDoBucket(ref){
  if(!ref || !ref.startsWith("sb:")) return ref || "";
  const cfg = SUPABASE_CONFIG;
  return `${cfg.url}/storage/v1/object/public/${encodeURIComponent(cfg.bucket || "Obras de Arte")}/` +
         ref.slice(3).split("/").map(encodeURIComponent).join("/");
}
const _normObra = t => String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();

function linhaSupabaseParaObra(row){
  // nomes de coluna do Postgres (snake_case) -> nomes que o jogo já usa
  return {
    id: String(row.id),
    titulo: row.titulo,
    artista: row.artista,
    pais: row.pais,
    tier: row.tier,
    tier_label: row.tier_label || SUPABASE_TIER_LABEL[row.tier] || "Emergente",
    preco_base: row.preco_base,
    data_obra: row.data_obra || "",
    movimento: row.movimento || "",
    nascimento: row.nascimento || "",
    falecimento: row.falecimento || "",
    local: row.local || "",
    tecnica: row.tecnica || "",
    museu: row.museu || "",
    historia: row.historia || "",
    imagem: urlDoBucket(row.imagem),
    arquivoTxt: urlDoBucket(row.arquivo_txt),
    analise: row.analise || "",
    curiosidades: Array.isArray(row.curiosidades) ? row.curiosidades : [],
    retratado: row.retratado || null,
    fixa: !!row.fixa,
    semQuiz: !!row.sem_quiz,
  };
}

function obraSupabaseValida(o){
  return o.id && o.titulo && o.artista && SUPABASE_PAISES_VALIDOS.includes(o.pais) &&
         Number.isInteger(o.tier) && o.tier >= 1 && o.tier <= 6 && Number.isFinite(o.preco_base);
}

// Busca com timeout — se o Supabase não responder rápido (rede lenta, projeto
// pausado, offline), desiste e segue só com o acervo local; nunca trava o boot.
function buscarComPrazo(url, opts, prazoMs){
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error("tempo esgotado")), prazoMs)),
  ]);
}

async function carregarObrasExtrasSupabase(){
  const cfg = typeof SUPABASE_CONFIG !== "undefined" ? SUPABASE_CONFIG : null;
  if(!cfg || !cfg.url || !cfg.anonKey) return;   // não configurado — segue só com o acervo local

  try{
    let linhas;
    try{
      const resp = await buscarComPrazo(
        `${cfg.url}/rest/v1/obras?select=*&limit=5000`,
        { headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` } },
        12000
      );
      if(!resp.ok) throw new Error("HTTP " + resp.status);
      linhas = await resp.json();
      try{ localStorage.setItem("artnexus_obras_cache", JSON.stringify(linhas)); }catch(e){}
    }catch(e){
      // sem internet: usa a última cópia guardada no aparelho, se houver
      let c = null; try{ c = JSON.parse(localStorage.getItem("artnexus_obras_cache")); }catch(_){}
      if(!Array.isArray(c)) throw e;
      linhas = c;
    }

    const existentes = new Set(State.allArtworks.map(a => a.id));
    const jaTem = new Set(State.allArtworks.map(a => _normObra(a.artista) + "|" + _normObra(a.titulo)));
    let novas = 0, invalidas = 0;
    linhas.forEach(row => {
      const o = linhaSupabaseParaObra(row);
      if(existentes.has(o.id)) return;                 // já existe localmente com esse id — não duplica
      const chave = _normObra(o.artista) + "|" + _normObra(o.titulo);
      if(jaTem.has(chave)) return;                     // mesma obra já no acervo local
      if(!obraSupabaseValida(o)){ invalidas++; return; }
      State.allArtworks.push(o); jaTem.add(chave);
      existentes.add(o.id);
      novas++;
    });

    if(novas > 0){
      toast(`☁️ ${novas} obra(s) da nuvem adicionada(s) ao jogo`);
      // telas que já mostram o acervo precisam ser redesenhadas com o total novo
      if(document.querySelector(".view.active")?.id === "view-acquisition") renderAcquisitionSetup();
    }
    if(invalidas > 0){
      console.warn(`Supabase: ${invalidas} linha(s) da tabela "obras" ignorada(s) — confira país/tier/preço.`);
    }
  } catch(erro){
    // rede fora, projeto pausado, tabela ainda vazia, CORS, etc. — o jogo
    // simplesmente continua com as 162 obras locais, sem incomodar ninguém
    console.info("Acervo extra do Supabase não carregado (seguindo só com o local):", erro.message);
  }
}
