/* ============================================================================
   SINCRONIZAÇÃO do progresso com o Supabase, sem login.
   Cada aparelho tem um código secreto; usando o mesmo código em outro aparelho,
   o progresso é unido (maior valor / união das coleções). Tudo via funções
   sync_get/sync_put (a tabela não é acessível diretamente).
   ============================================================================ */
const Sync = {
  CH: "artnexus_sync_codigo", ST: "artnexus_sync_ult", codigo: "", ult: "", msg: "", _t: null, _busy: false,
  ativo(){ return typeof SUPABASE_CONFIG !== "undefined" && SUPABASE_CONFIG && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey; },
  iniciar(){
    try{ this.codigo = localStorage.getItem(this.CH) || ""; this.ult = localStorage.getItem(this.ST) || ""; }catch(e){}
    if(!this.codigo){ this.codigo = this.novoCodigo(); try{ localStorage.setItem(this.CH, this.codigo); }catch(e){} }
    const orig = Prog.salvar.bind(Prog);
    Prog.salvar = () => { orig(); this.agendar(); };
    this.sincronizar(true);
  },
  novoCodigo(){
    const al = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", b = new Uint8Array(16);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_,i)=>b[i]=Math.floor(Math.random()*256));
    const s = [...b].map(x=>al[x%al.length]).join("");
    return s.replace(/(.{4})(?=.)/g, "$1-");
  },
  limpar(c){ return String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"").replace(/(.{4})(?=.)/g,"$1-"); },
  async rpc(fn, corpo){
    const c = SUPABASE_CONFIG, r = await fetch(`${c.url}/rest/v1/rpc/${fn}`, { method:"POST",
      headers:{ apikey:c.anonKey, Authorization:"Bearer "+c.anonKey, "Content-Type":"application/json" }, body: JSON.stringify(corpo) });
    if(!r.ok) throw new Error("http "+r.status);
    const t = await r.text(); return t ? JSON.parse(t) : null;
  },
  unir(a, b){
    if(a === undefined || a === null) return b;
    if(b === undefined || b === null) return a;
    if(typeof a === "number" && typeof b === "number") return Math.max(a, b);
    if(typeof a === "string" && typeof b === "string") return a >= b ? a : b;
    if(Array.isArray(a) && Array.isArray(b)) return b.length > a.length ? b : a;
    if(typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)){
      const o = {}; new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k=>o[k] = this.unir(a[k], b[k])); return o;
    }
    return a;
  },
  agendar(){ if(!this.ativo()) return; clearTimeout(this._t); this._t = setTimeout(()=>this.sincronizar(false), 6000); },
  async sincronizar(silencioso){
    if(!this.ativo() || this._busy) return false;
    this._busy = true;
    try{
      const remoto = await this.rpc("sync_get", { p_codigo: this.codigo });
      if(remoto) Prog.P = { ...progressoNovo(), ...this.unir(Prog.P, remoto) };
      try{ localStorage.setItem(SAVE_KEY, JSON.stringify(Prog.P)); }catch(e){}
      await this.rpc("sync_put", { p_codigo: this.codigo, p_dados: Prog.P });
      this.ult = new Date().toLocaleString("pt-BR");
      try{ localStorage.setItem(this.ST, this.ult); }catch(e){}
      this.msg = remoto ? "Sincronizado e unido com a nuvem." : "Progresso enviado para a nuvem.";
      return true;
    }catch(e){ this.msg = "Sem conexão agora. Tentaremos de novo depois."; return false; }
    finally{ this._busy = false; }
  },
  async usarCodigo(c){
    const n = this.limpar(c);
    if(n.replace(/-/g,"").length < 12) { this.msg = "Código inválido."; return false; }
    this.codigo = n; try{ localStorage.setItem(this.CH, n); }catch(e){}
    return this.sincronizar(false);
  },
};
