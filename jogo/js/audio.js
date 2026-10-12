/* ============================================================================
   ART NEXUS — ÁUDIO (SFX sintetizados + voz do navegador com sotaque por país)
   ============================================================================ */

const AudioFX = (() => {
  let ctx = null;
  function ensureCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type="sine", peak=0.15){
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(c.destination);
    const t0 = c.currentTime + start;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  return {
    click(){ tone(720,0,0.05,"square",0.08); },
    diceRoll(){
      for(let i=0;i<5;i++) tone(180 + Math.random()*400, i*0.06, 0.05, "square", 0.06);
    },
    coin(){ tone(880,0,0.08,"triangle",0.12); tone(1318,0.06,0.14,"triangle",0.12); },
    success(){ tone(523,0,0.1,"triangle",0.14); tone(659,0.08,0.1,"triangle",0.14); tone(784,0.16,0.2,"triangle",0.16); },
    error(){ tone(220,0,0.14,"sawtooth",0.12); tone(160,0.1,0.2,"sawtooth",0.12); },
    applause(){
      for(let i=0;i<18;i++) tone(300+Math.random()*900, Math.random()*0.6, 0.04, "square", 0.03);
    },
    alert(){ tone(200,0,0.12,"sawtooth",0.14); tone(200,0.16,0.12,"sawtooth",0.14); },
    tick(){ tone(500,0,0.04,"square",0.06); },
    // ronco de turbina subindo: ruído grave com frequência em rampa
    decolagem(){
      const c = ensureCtx();
      const t0 = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(70, t0);
      osc.frequency.exponentialRampToValueAtTime(260, t0 + 1.6);
      f.type = "lowpass"; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
      osc.connect(f); f.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + 2);
    },
  };
})();

const Voice = (() => {
  let voices = [];
  function loadVoices(){ voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; }
  if(window.speechSynthesis){
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  function pickVoice(lang){
    if(!voices.length) return null;
    let v = voices.find(v => v.lang === lang);
    if(!v) v = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    return v || null;
  }
  return {
    speak(text, lang){
      if(!window.speechSynthesis) return false;
      try{
        const u = new SpeechSynthesisUtterance(text);
        const v = pickVoice(lang);
        if(v) u.voice = v;
        u.lang = lang;
        u.rate = 0.98;
        u.pitch = 1.0;
        window.speechSynthesis.speak(u);
        return !!v;
      }catch(e){ return false; }
    },
    available(lang){ return !!pickVoice(lang); }
  };
})();
