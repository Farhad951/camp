/* Camp — service worker : tout est mis en cache au premier lancement,
   l'appli s'ouvre ensuite sans réseau. Les mises à jour se téléchargent
   en arrière-plan et s'appliquent au lancement suivant. */
const CACHE='camp-37c3577716';
const FICHIERS=['./','./index.html','./manifest.webmanifest','./clips.js','./polices/outfit.woff2','./polices/fira-code.woff2','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./favicon-64.png'];
/* un réseau figé ne doit pas bloquer l'appli : au bout de 30 s, on considère le fichier indisponible */
const ATTENTE=30000;
const limite=(p,a)=>Promise.race([p,new Promise((_,non)=>setTimeout(()=>{if(a)a.abort();non(new Error('délai dépassé'));},ATTENTE))]);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FICHIERS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('camp-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  /* vidéos : cache à part, conservé d'une version à l'autre. Safari demande des plages d'octets : on répond en 206. */
  if(url.pathname.includes('/videos/')){e.respondWith(caches.open('videos-1').then(async c=>{
    let r=await c.match(url.href);
    if(!r){const a=new AbortController();r=await limite(fetch(url.href,{signal:a.signal}).then(async x=>{if(x&&x.ok&&x.type==='basic')await c.put(url.href,x.clone());return x;}),a);}
    const m=/bytes=(\d+)-(\d*)/.exec(req.headers.get('range')||'');
    if(!m||!r.ok)return r;
    const buf=await r.arrayBuffer(),d=+m[1],f=m[2]?Math.min(+m[2],buf.byteLength-1):buf.byteLength-1;
    return new Response(buf.slice(d,f+1),{status:206,headers:{'Content-Type':r.headers.get('content-type')||'video/mp4','Content-Range':'bytes '+d+'-'+f+'/'+buf.byteLength,'Accept-Ranges':'bytes','Content-Length':String(f-d+1)}});
  }));return;}
  
const nav=req.mode==='navigate';
  e.respondWith(caches.open(CACHE).then(async c=>{
    const cle=nav?'./index.html':req;
    const enCache=await c.match(cle,{ignoreSearch:true});
    const reseau=limite(fetch(req).then(r=>{if(r&&r.ok&&r.type==='basic')c.put(cle,r.clone());return r;})).catch(()=>null);
    if(enCache){e.waitUntil(reseau);return enCache;}
    const r=await reseau;return r||(nav?c.match('./index.html'):Response.error());
  }));
});
