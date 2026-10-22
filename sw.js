/* Camp — service worker : tout est mis en cache au premier lancement,
   l'appli s'ouvre ensuite sans réseau. Les mises à jour se téléchargent
   en arrière-plan et s'appliquent au lancement suivant. */
const CACHE='camp-ccb258c4ad';
const FICHIERS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./favicon-64.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FICHIERS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('camp-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  const nav=req.mode==='navigate';
  e.respondWith(caches.open(CACHE).then(async c=>{
    const cle=nav?'./index.html':req;
    const enCache=await c.match(cle,{ignoreSearch:true});
    const reseau=fetch(req).then(r=>{if(r&&r.ok&&r.type==='basic')c.put(cle,r.clone());return r;}).catch(()=>null);
    if(enCache){e.waitUntil(reseau);return enCache;}
    const r=await reseau;return r||(nav?c.match('./index.html'):Response.error());
  }));
});
