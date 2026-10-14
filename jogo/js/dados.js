/* ============================================================================
   DADOS — junta o acervo curado (162 obras, js/artworks-data.js) com as obras
   da nuvem (tabela "obras" do Supabase + imagens do bucket público).

   · Obras CURADAS têm ano, técnica, local, museu e curiosidades revisados:
     entram em todos os tipos de pergunta.
   · Obras da NUVEM só têm título, artista e imagem: entram em perguntas de
     reconhecimento (autor, detalhe ampliado, título quando o título é limpo).
   ============================================================================ */

const PAISES = {
  "Itália":      { flag:"🇮🇹", lat:42.5,  lng:12.5 },
  "Holanda":     { flag:"🇳🇱", lat:52.2,  lng:5.3  },
  "França":      { flag:"🇫🇷", lat:46.6,  lng:2.3  },
  "Espanha":     { flag:"🇪🇸", lat:40.3,  lng:-3.7 },
  "Alemanha":    { flag:"🇩🇪", lat:51.1,  lng:10.4 },
  "Reino Unido": { flag:"🇬🇧", lat:54.0,  lng:-2.5 },
  "Áustria":     { flag:"🇦🇹", lat:47.6,  lng:14.1 },
  "Brasil":      { flag:"🇧🇷", lat:-14.2, lng:-51.9 },
  "México":      { flag:"🇲🇽", lat:23.6,  lng:-102.5 },
  "Estados Unidos": { flag:"🇺🇸", lat:39.8, lng:-98.6 },
};

const Acervo = {
  obras: [],
  porId: {},

  norm(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim(); },

  // "1503", "c. 1490", "circa 1483" -> número; intervalos e textos soltos -> aproximado
  anoDe(txt){
    const s = String(txt||"").trim();
    const m = s.match(/\d{4}/);
    if(!m) return { ano:null, preciso:false };
    const y = +m[0];
    return { ano:(y>=1000 && y<=2100) ? y : null, preciso: /^\d{4}\.?$/.test(s) };
  },

  // "Florença, Itália" -> "Florença"; textos longos pegam a cidade no fim
  cidadeDe(local){
    let s = String(local||"").replace(/\([^)]*\)/g,"").trim();
    if(!s) return "";
    const partes = s.split(",").map(p=>p.trim()).filter(Boolean);
    if(!partes.length) return "";
    let c = partes[0];
    if(c.length > 28 && partes.length > 1) c = partes[partes.length-1];
    return c.length <= 28 ? c : "";
  },

  museuLimpo(m){
    const s = String(m||"").trim();
    return (s && s.length <= 70 && !/https?:|wikimedia|commons/i.test(s)) ? s : "";
  },

  tituloLimpo(t, artista){
    const s = String(t||"").trim();
    if(!s || s.length > 55 || /[_]|\d{3,}|\.(jpe?g|png)/i.test(s) || /-.*-/.test(s)) return "";
    // título que repete o nome do artista entrega a resposta
    const sobren = this.norm(artista).split(" ").filter(w=>w.length>3);
    if(sobren.some(w=>this.norm(s).includes(w))) return "";
    return s;
  },

  // "01_The Starry Night.jpg" / "the-starry-night-68.jpg" -> "the starry night"
  chaveArquivo(ref){
    const base = String(ref||"").split("/").pop().replace(/\.[a-z0-9]+$/i,"");
    return this.norm(base).replace(/^\d+\s+/,"").replace(/\s+\d+$/,"");
  },
  chavesDe(titulo, imagem){ return [this.norm(titulo), this.chaveArquivo(imagem)].filter(k=>k.length>3); },

  fotoLocal(o){ return (typeof IMG_EMBUTIDAS !== "undefined" && IMG_EMBUTIDAS[o.imagem]) || o.imagem; },

  urlDoBucket(ref){
    if(!ref || !ref.startsWith("sb:")) return ref || "";
    const c = SUPABASE_CONFIG;
    return `${c.url}/storage/v1/object/public/${encodeURIComponent(c.bucket || "Obras de Arte")}/` +
           ref.slice(3).split("/").map(encodeURIComponent).join("/");
  },

  iniciar(){
    this.obras = []; this.porId = {};
    (typeof ARTWORKS !== "undefined" ? ARTWORKS : []).forEach(o=>{
      if(o.fixa || !o.imagem) return;
      const a = this.anoDe(o.data_obra);
      const fatos = (Array.isArray(o.curiosidades) ? o.curiosidades : []).map(f=>String(f).trim()).filter(f=>f.length>=30 && f.length<=260);
      this.adicionar({
        id:o.id, titulo:o.titulo, artista:o.artista, pais:o.pais, movimento:o.movimento || "",
        ano:a.ano, anoPreciso:a.preciso, anoTxt:o.data_obra || "",
        tecnica:o.tecnica || "", cidade:this.cidadeDe(o.local), localTxt:o.local || "",
        museu:this.museuLimpo(o.museu), fatos, imagem:o.imagem, tier:o.tier, rica:true, ficha:o,
      });
    });
  },

  /* tipo da obra a partir da técnica/título: escultura, desenho ou pintura (define o verbo das perguntas) */
  tipoDe(o){
    const t = this.norm((o.tecnica||"")), ti = this.norm(o.titulo||"");
    if(/escultur|relevo|talha|estatua|busto|bronze|marmore|pedra.sabao|terracota|ceramica|esteatita/.test(t)) return "escultura";
    if(/desenho|esboco|nanquim|carvao|grafite|sanguinea|gravura|agua.forte|litografia|pastel|caneta|tinta ferrosa/.test(t)) return "desenho";
    if(!t && o.artista === "Aleijadinho") return "escultura";
    if(!t && /^(estudo|study|drawing|sketch|desenho|manuscript)/.test(ti)) return "desenho";
    return "pintura";
  },
  verboDe(o, forma){   // forma: "v" (pintou) | "p" (pintada)
    const m = { escultura:["esculpiu","esculpida"], desenho:["desenhou","desenhada"], pintura:["pintou","pintada"] }[o.tipo || "pintura"];
    return forma === "p" ? m[1] : m[0];
  },
  adicionar(o){
    if(!PAISES[o.pais]) return;
    o.tipo = this.tipoDe(o);
    this.obras.push(o); this.porId[o.id] = o;
  },

  // obras da nuvem (linhas da tabela)
  incorporarNuvem(linhas){
    const jaTem = new Set();
    this.obras.forEach(o=>this.chavesDe(o.titulo, o.imagem).forEach(k=>jaTem.add(this.norm(o.artista)+"|"+k)));
    let n = 0;
    (linhas||[]).forEach(r=>{
      if(!r || !r.id || !r.artista || !r.imagem || r.duplicada || this.porId[r.id]) return;
      // títulos vindos da Wikimedia com o rótulo em português embutido: 'Saint Anthony… label QS:Lpt,"Santo Antônio"'
      let tituloOrig = String(r.titulo || "");
      const pt = /label QS:Lpt,"([^"]+)"/.exec(r.titulo || "") || /label QS Lpt\s+(.+)$/.exec(r.titulo || "");
      if(pt){ let e = tituloOrig.split(/\s*label QS/)[0].trim(); const h = e.length / 2; if(h > 3 && e.slice(0, h) === e.slice(h)) e = e.slice(0, h); tituloOrig = e; r = { ...r, titulo:pt[1].trim() }; }
      if(typeof TRAD_TITULOS !== "undefined" && TRAD_TITULOS[r.titulo]){ tituloOrig = r.titulo; r = { ...r, titulo:TRAD_TITULOS[r.titulo] }; }
      if(typeof ORIG_POR_ID !== "undefined" && ORIG_POR_ID[r.id]) tituloOrig = ORIG_POR_ID[r.id];
      const chaves = this.chavesDe(r.titulo, r.imagem).map(k=>this.norm(r.artista)+"|"+k);
      if(chaves.some(k=>jaTem.has(k))) return;     // mesma obra já presente (título em outro idioma, arquivo repetido...)
      chaves.forEach(k=>jaTem.add(k));
      // fichas completas (ano + técnica vindos dos .txt) entram em todos os tipos de pergunta
      const a = this.anoDe(r.data_obra), tec = String(r.tecnica||"").trim(), rica = !!(a.ano && tec);
      this.adicionar({
        id:String(r.id), titulo:this.tituloLimpo(r.titulo, r.artista) || (r.titulo||""), tituloOk:!!this.tituloLimpo(r.titulo, r.artista),
        artista:r.artista, pais:r.pais, movimento:r.movimento || "", ano:a.ano, anoPreciso:a.preciso, anoTxt:r.data_obra || "",
        tecnica:tec, cidade:this.cidadeDe(r.local), localTxt:r.local || "", museu:this.museuLimpo(r.museu), fatos:[], imagem:this.urlDoBucket(r.imagem), tier:r.tier || 3, rica, nuvem:true, tituloOrig,
      });
      n++;
    });
    return n;
  },

  imgSrc(o){ return o.nuvem ? o.imagem : this.fotoLocal(o); },

  async carregarNuvem(){
    const c = (typeof SUPABASE_CONFIG !== "undefined") ? SUPABASE_CONFIG : null;
    if(!c || !c.url || !c.anonKey) return 0;
    let linhas = null;
    try{
      linhas = [];
      for(let ini=0; ini<20000; ini+=1000){
        const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), 15000);
        const r = await fetch(`${c.url}/rest/v1/obras?select=id,titulo,artista,pais,tier,movimento,imagem,duplicada,data_obra,tecnica,local,museu&duplicada=eq.false&order=id.asc`,
          { headers:{ apikey:c.anonKey, Authorization:`Bearer ${c.anonKey}`, Range:`${ini}-${ini+999}`, "Range-Unit":"items" }, signal:ctl.signal });
        clearTimeout(t);
        if(!r.ok) throw new Error("HTTP "+r.status);
        const pag = await r.json(); linhas.push(...pag);
        if(pag.length < 1000) break;
      }
      try{ localStorage.setItem("artnexus_nuvem_v8", JSON.stringify(linhas)); }catch(e){}
    }catch(e){
      try{ linhas = JSON.parse(localStorage.getItem("artnexus_nuvem_v8")); }catch(_){}
    }
    return Array.isArray(linhas) ? this.incorporarNuvem(linhas) : 0;
  },
};
