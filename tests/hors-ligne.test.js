const path=require('path');const {preparer,sleep}=require('./commun');
(async()=>{
 const t=await preparer(8766,'hors-ligne');const {p,ev,ok,OUT}=t;
 await p.goto('http://localhost:8766/');await sleep(1000);
 await p.reload();await sleep(1000);await ev(()=>navigator.serviceWorker.ready);await sleep(500);
 await p.reload();await sleep(800);
 await ev(()=>Clips.precharger());await sleep(1500);
 const n=await ev(()=>VIDEOS.size);
 const cache=await ev(()=>caches.open('videos-1').then(c=>c.keys()).then(k=>k.length));
 ok('29 clips déclarés',n===29,n);ok('clips et images en cache',cache===n*2,cache);
 const attendu={dim:['traction','incline','latDB','oiseau','curlInc','tricepsOH'],lun:['rowPoulie','facepull']};
 await p.setOfflineMode(true);await p.reload();await sleep(1000);
 ok('appli hors ligne',await ev(()=>!!document.querySelector('#hero')&&VIDEOS.size>=25));
 const seance=async k=>{await ev(k=>{UI.s=null;document.querySelector('#seance').classList.remove('on');UI.jour=k;rendre();document.querySelector('[data-a="go-salle"]').click();},k);await sleep(900);};
 const viser=async id=>{await ev(id=>{const e=document.querySelector('#ex-'+id);document.querySelector('#seance').scrollTop=e.offsetTop-70;},id);await sleep(1300);};
 await seance('2026-11-01');
 for(const id of attendu.dim){await viser(id);const v=await ev(id=>{const x=document.querySelector('#ex-'+id+' video');return x?{t:+x.currentTime.toFixed(2),paused:x.paused,w:x.videoWidth,h:x.videoHeight,err:x.error&&x.error.code}:null;},id);ok('dimanche '+id+' : lu hors ligne',v&&v.t>0&&!v.paused&&v.w===544&&!v.err,v);}
 await viser('tricepsOH');await p.screenshot({path:path.join(OUT,'triceps.png')});
 ok('variante signalée',await ev(()=>/banc incliné/.test(document.querySelector('#ex-curlInc .variante').textContent)));
 ok('crédit et licence',await ev(()=>/Goulart.*wger.*CC BY-SA 4\.0/.test(document.querySelector('#ex-latDB .credit').textContent)));
 await viser('latDB');await p.screenshot({path:path.join(OUT,'latDB.png')});
 ok('bouton pause',await ev(async()=>{const e=document.querySelector('#ex-latDB');e.querySelector('.pause-b').click();await new Promise(r=>setTimeout(r,100));return e.querySelector('video').paused&&e.querySelector('.pause-b').getAttribute('aria-label').startsWith('Lancer');}));
 ok('toucher la vidéo relance',await ev(()=>{const v=document.querySelector('#ex-latDB video');v.click();return !v.paused;}));
 // lecture refusée (mode économie d'énergie)
 await viser('oiseau');
 ok('lecture refusée : icône lecture',await ev(async()=>{const v=document.querySelector('#ex-curlInc video');const o=v.play;v.pause();v.play=()=>Promise.reject(new Error('bloqué'));document.querySelector('#seance').scrollTop=document.querySelector('#ex-curlInc').offsetTop-70;await new Promise(r=>setTimeout(r,700));v.play=o;return document.querySelector('#ex-curlInc .pause-b').getAttribute('aria-label').startsWith('Lancer');}));
 // ajout de série : même vidéo, toujours en lecture
 await viser('latDB');
 ok('ajout de série : vidéo intacte',await ev(()=>{const v=document.querySelector('#ex-latDB video'),t=v.currentTime;document.querySelector('#ex-latDB [data-a="serie+"]').click();const w=document.querySelector('#ex-latDB video');return w===v&&!w.paused&&document.querySelectorAll('#ex-latDB .serie').length===7;}));
 await ev(()=>document.querySelector('#ex-latDB [data-a="serie-"]').click());
 // fin de repos : reste affichée, un toucher ferme
 ok('fin de repos : reste à l’écran',await ev(async()=>{Repos.start(1,'x');await new Promise(r=>setTimeout(r,4800));const e=document.querySelector('#repos');const reste=e.classList.contains('on')&&e.classList.contains('fin');e.querySelector('.txt').click();await new Promise(r=>setTimeout(r,700));return reste&&!e.classList.contains('on');}));
 // enchaînement
 ok('dernière série : défile vers l’exercice suivant',await ev(async()=>{document.querySelector('#seance').scrollTop=document.querySelector('#ex-oiseau').offsetTop;const lignes=[...document.querySelectorAll('#ex-oiseau .serie')];for(const r of lignes){const k=r.querySelector('input[data-f="kg"]');k.value='5';r.querySelector('input[data-f="r"]').value='15';valider(r);}Repos.stop();await new Promise(r=>setTimeout(r,1400));const b=document.querySelector('#ex-curlInc').getBoundingClientRect().top;return b>40&&b<160;}));
 await ev(()=>{const S=SEANCES.dim;});
 await ev(()=>{UI.s=null;document.querySelector('#seance').classList.remove('on');UI.jour='2026-11-01';rendre();});await sleep(500);
 ok('accueil dimanche : clip',await ev(()=>!!document.querySelector('#hero video')));await p.screenshot({path:path.join(OUT,'hero-dim.png')});
 // reprise de séance
 await seance('2026-11-01');
 ok('séance reprise : retour à l’exercice en cours',await ev(()=>{const b=document.querySelector('#ex-traction').getBoundingClientRect();return document.querySelector('#seance').scrollTop===0||b.top<140;}),await ev(()=>document.querySelector('#seance').scrollTop));
 await seance('2026-11-02');
 for(const id of attendu.lun){await viser(id);const v=await ev(id=>{const x=document.querySelector('#ex-'+id+' video');return x?{t:+x.currentTime.toFixed(2),w:x.videoWidth}:null;},id);ok('lundi '+id+' : lu hors ligne',v&&v.t>0,v);}
 const liens=await ev(()=>{const r={};for(const S of Object.values(SEANCES))for(const id of S.ex.flat()){r[id]=lienGeste(id);}return r;});
 ok('20 exercices ont une vidéo directe',Object.keys(liens).length===20&&Object.values(liens).every(u=>/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}(&t=\d+s)?$/.test(u)),Object.keys(liens).length);
 ok('chaque carte du lundi a son bouton',await ev(()=>[...document.querySelectorAll('#seance .ex')].every(e=>{const a=e.querySelector('[data-a="geste"]');return a&&a.textContent==='Voir le geste';})));
 ok('aucune recherche YouTube restante',await ev(()=>!document.documentElement.innerHTML.includes('search_query')));
 ok('programme toujours appliqué',await ev(()=>EX.latDB.series===6&&EX.trapbar.series===3&&EX.boxjump.series===3&&!!EX.sautsLat));
 // fichier illisible : étapes et bouton restent
 await p.setOfflineMode(false);
 await ev(()=>{CLIPS.medball={f:'absent-000'};VIDEOS.add('medball');});await seance('2026-11-02');await viser('medball');await sleep(800);
 ok('clip illisible : étapes et bouton restent',await ev(()=>{const e=document.querySelector('#ex-medball');return !e.querySelector('video')&&!!e.querySelector('.etapes li')&&!!e.querySelector('[data-a="geste"]')&&!!e.querySelector('.tag');}));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
