/* Préchargement des clips : en parallèle, sans se laisser bloquer par un fichier. */
const {preparer,sleep}=require('./commun');
(async()=>{
 const t=await preparer(8779,'reseau');const {p,ev,ok,reseau}=t;
 reseau.delai=400;
 await p.goto(t.url);await sleep(800);await ev(()=>navigator.serviceWorker.ready);await sleep(300);await p.reload();await sleep(600);
 /* --- 16 : parallèle, 3 à la fois */
 await ev(()=>caches.delete('videos-1'));reseau.max=0;reseau.servis=[];
 const t0=Date.now();await ev(()=>Clips.precharger());const duree=Date.now()-t0;
 const n=await ev(()=>caches.open('videos-1').then(c=>c.keys()).then(k=>k.length));
 ok('tous les clips sont en cache',n===16,n);
 ok('3 téléchargements au plus à la fois',reseau.max===3,reseau.max);
 ok('plus rapide qu’un par un',duree<16*400*.6,duree);
 const avant=reseau.servis.length;await ev(()=>Clips.precharger());
 ok('déjà en cache : rien à retélécharger',reseau.servis.length===avant);
 /* --- un fichier introuvable n'arrête pas les autres */
 await ev(()=>caches.delete('videos-1'));
 const absent=await ev(async()=>{CLIPS.__absent={f:'absent-000'};VIDEOS.add('__absent');await Clips.precharger();VIDEOS.delete('__absent');delete CLIPS.__absent;return (await (await caches.open('videos-1')).keys()).length;});
 ok('un fichier en échec n’arrête pas les autres',absent===16,absent);
 /* --- 12 : un fichier qui ne répond jamais */
 const fichierBloque=await ev(()=>'/videos/'+CLIPS[[...VIDEOS][0]].f+'.mp4');reseau.delai=0;reseau.bloque={test:p=>p===fichierBloque};
 const fige=await ev(async()=>{await caches.delete('videos-1');Clips.attente=1200;const t0=Date.now();await Clips.precharger();Clips.attente=30000;const n=(await (await caches.open('videos-1')).keys()).map(r=>r.url);return{ms:Date.now()-t0,images:n.filter(u=>u.endsWith('.jpg')).length,clips:n.filter(u=>u.endsWith('.mp4')).length};});
 ok('préchargement figé : abandonne au lieu d’attendre sans fin',fige.ms<12000,fige);
 ok('préchargement figé : les autres fichiers passent quand même',fige.images===8&&fige.clips===7,fige);
 reseau.bloque=null;
 ok('au lancement suivant : tout est repris',await ev(async()=>{await Clips.precharger();return (await (await caches.open('videos-1')).keys()).length===16;}));
 /* serveur muet : l'appli s'ouvre depuis le cache, sans attendre */
 reseau.bloque=/./;
 const t1=Date.now();await p.reload({waitUntil:'domcontentloaded'});await sleep(300);
 ok('serveur muet : l’appli s’ouvre quand même',await ev(()=>!!document.querySelector('#hero'))&&Date.now()-t1<5000,Date.now()-t1);
 /* clip jamais reçu : 30 s plus tard le service worker abandonne et la carte retombe sur le mannequin */
 reseau.bloque=/\/videos\/.*\.mp4$/;
 await ev(async()=>{await caches.delete('videos-1');UI.jour='2026-11-01';rendre();document.querySelector('[data-a="go-salle"]').click();});await sleep(1500);
 await ev(()=>{const c=document.querySelector('#seance');c.scrollTop=document.querySelector('#ex-traction').offsetTop-70;const v=document.querySelector('#ex-traction video');if(v){v.preload='auto';v.load();v.play().catch(()=>{});}});
 await sleep(32000);
 ok('clip figé : la carte retombe sur le mannequin',await ev(()=>{const e=document.querySelector('#ex-traction');return !e.querySelector('video')&&!!e.querySelector('canvas');}));
 reseau.bloque=null;
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
