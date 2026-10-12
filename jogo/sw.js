/* Art Nexus — service worker (só funciona quando o jogo é aberto por http/https).
   · telas, scripts e estilos: rede primeiro (você sempre recebe a versão nova), cache só como reserva offline;
   · fotos das obras: cache primeiro (baixam uma vez só);
   · mapas e fontes (outros domínios): direto da rede, sem cache. */
const VERSAO = "artnexus-v1";
// Na instalação guarda a base do app (index, estilos, scripts, mapa, ícones), lida do próprio index.html —
// assim a lista nunca fica desatualizada quando entra um script novo. As fotos entram no cache conforme aparecem.
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    let html = "";
    try { html = await (await fetch("index.html", { cache: "reload" })).text(); } catch(_) {}
    const urls = ["./", "index.html", ...[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|data:)/.test(u))];
    await Promise.all([...new Set(urls)].map(u => cache.add(new Request(u, { cache: "reload" })).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  const guardar = r => { if(r && r.ok){ const c = r.clone(); caches.open(VERSAO).then(ca => ca.put(req, c)); } return r; };
  if(/\.(jpe?g|png|webp|svg|mp3)$/i.test(url.pathname)){
    e.respondWith(caches.match(req).then(c => c || fetch(req).then(guardar)));
  } else {
    e.respondWith(fetch(req).then(guardar).catch(() => caches.match(req).then(c => c || caches.match("index.html"))));
  }
});
