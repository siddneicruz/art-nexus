/* Atualização automática (OTA) — só no app Android.
   Ao abrir, consulta _ota/versao.json no Supabase; se houver pacote novo, baixa e deixa pronto para a próxima abertura.
   Qualquer falha é ignorada: o app segue com os arquivos que já tem. */
(function(){
  const cap = window.Capacitor, plug = cap && cap.Plugins && cap.Plugins.CapacitorUpdater;
  if(!cap || !cap.isNativePlatform || !cap.isNativePlatform() || !plug) return;
  const avisar = t => { try{ if(typeof toast === "function") toast(t); }catch(e){} };
  (async () => {
    try{
      await plug.notifyAppReady();     // confirma que este pacote abriu bem (senão o plugin volta ao anterior)
      const r = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/object/public/Obras de Arte/_ota/versao.json?t=${Date.now()}`, { cache:"no-store" });
      if(!r.ok) return;
      const m = await r.json();
      if(!m.versao || !m.url || m.versao === window.APP_VERSAO) return;
      let pronta = ""; try{ pronta = localStorage.getItem("ota_pronta") || ""; }catch(e){}
      if(pronta === m.versao) return;
      const b = await plug.download({ url:m.url, version:m.versao });
      await plug.next({ id:b.id });
      try{ localStorage.setItem("ota_pronta", m.versao); }catch(e){}
      avisar("Atualização baixada. Feche e abra o app para usar a versão nova.");
    }catch(e){ console.warn("OTA:", e); }
  })();
})();
