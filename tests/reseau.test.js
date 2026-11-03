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
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
