const path=require('path');const {preparer,sleep}=require('./commun');
(async()=>{
 const t=await preparer(8767,'parcours');const {p,ok,OUT:out}=t;
 const shot=async n=>{await p.screenshot({path:path.join(out,n+'.png')});};
 const clic=s=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('absent '+s);e.click();},s);
 await p.goto(t.url);await sleep(700);
 await shot('01-jour');await p.screenshot({path:path.join(out,'01-jour-full.png'),fullPage:true});
 // autres jours
 await p.evaluate(()=>{document.querySelectorAll('.chip')[1].click()});await sleep(500);await shot('02-boxe');
 await p.evaluate(()=>{document.querySelectorAll('.chip')[2].click()});await sleep(500);await shot('03-repos');
 await p.evaluate(()=>{document.querySelectorAll('.chip')[6].click()});await sleep(500);await shot('04-dim');
 await p.evaluate(()=>{document.querySelectorAll('.chip')[0].click()});await sleep(400);
 // boxe : check-in, ressenti
 await p.evaluate(()=>{UI.jour=iso(addD(fromISO(auj()),-2));rendre();});await sleep(200);
 const bx=await p.evaluate(()=>!!document.querySelector('[data-a="boxe"][data-v="fait"]'));ok('boxe passée : bouton présence',bx);
 await clic('[data-a="boxe"][data-v="fait"]');await sleep(200);await p.evaluate(()=>document.querySelectorAll('.rpe button')[6].click());await sleep(300);await shot('05-boxe-rpe');
 ok('ressenti sauvé',await p.evaluate(()=>DB.days[UI.jour].boxe.rpe===7&&DB.days[UI.jour].boxe.st==='fait'));
 await p.evaluate(()=>{UI.jour=auj();rendre();});await sleep(200);
 // séance
 await clic('[data-a="go-salle"]');await sleep(900);await shot('06-seance');
 await p.evaluate(()=>{document.querySelector('#seance').scrollTop=document.querySelector('.ex').offsetTop-70;});await sleep(500);await shot('07-exo');
 // validation d'une série
 const rows=await p.evaluate(()=>{const r=document.querySelectorAll('.serie')[0];const id=r.dataset.ex;const kg=r.querySelector('input[data-f="kg"]');if(kg)kg.value='40';r.querySelector('input[data-f="r"]').value='3';r.querySelector('.ok-b').click();return id;});
 await sleep(500);await shot('08-serie-ok');
 ok('série enregistrée',await p.evaluate(id=>{const s=DB.days[auj()].gym.ex[id][0];return s.ok===1&&s.r===3;},rows));
 ok('repos lancé',await p.evaluate(()=>Repos.actif&&document.querySelector('#repos').classList.contains('on')));
 const a1=await p.evaluate(()=>document.querySelector('#repos-t').textContent);await sleep(1300);const a2=await p.evaluate(()=>document.querySelector('#repos-t').textContent);ok('repos décompte '+a1+'→'+a2,a1!==a2);
 await p.evaluate(()=>document.querySelector('[data-a="repos-plus"]').click());await sleep(300);const a3=await p.evaluate(()=>document.querySelector('#repos-t').textContent);ok('+15 s → '+a3,a3!==a2);await shot('09-repos');
 await p.evaluate(()=>{Repos.fin=Date.now()+200});await sleep(800);ok('repos sonne',await p.evaluate(()=>document.querySelector('#repos').classList.contains('fin')));await shot('10-repos-fin');
 await p.evaluate(()=>Repos.stop());await sleep(900);ok('repos caché',await p.evaluate(()=>!document.querySelector('#repos').classList.contains('on')));
 // dé-valider, express, onglets tech, pause
 await p.evaluate(()=>document.querySelectorAll('.serie')[0].querySelector('.ok-b').click());await sleep(100);await p.evaluate(()=>document.querySelectorAll('.serie')[0].querySelector('.ok-b').click());await sleep(200);await p.evaluate(()=>Repos.stop());
 await p.evaluate(()=>document.querySelector('[data-a="express"][data-v="1"]').click());await sleep(500);ok('express',await p.evaluate(()=>DB.days[auj()].gym.express===1));
 await p.evaluate(()=>document.querySelector('[data-a="express"][data-v="0"]').click());await sleep(500);
 await p.evaluate(()=>document.querySelector('[data-a="tech"][data-t="erreurs"]').click());await sleep(250);
 await p.evaluate(()=>document.querySelector('[data-a="serie+"]').click());await sleep(200);
 await p.evaluate(()=>document.querySelector('[data-a="histo"]').click());await sleep(600);await shot('11-histo');await p.evaluate(()=>fermerFeuille());await sleep(600);ok('feuille fermée',await p.evaluate(()=>!document.querySelector('#feuille').classList.contains('on')));
 // fin
 await p.evaluate(()=>document.querySelector('[data-a="finir"]').click());await sleep(1300);await shot('12-bilan');
 ok('séance finie',await p.evaluate(()=>DB.days[auj()].gym.done===1));
 // geste sheet tactile
 const box=await p.evaluate(()=>{const r=document.querySelector('.feuille').getBoundingClientRect();return[r.left+r.width/2,r.top+20];});
 const cdp=await p.createCDPSession();const tp=(type,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:box[0],y}]});
 await tp('touchStart',box[1]);for(let i=1;i<=8;i++){await tp('touchMove',box[1]+i*22);await sleep(16);}
 const tr=await p.evaluate(()=>document.querySelector('#feuille').style.transform);ok('feuille suit le doigt : '+tr,/translateY\([0-9]{2,3}/.test(tr));
 await tp('touchEnd');await sleep(700);ok('lancer ferme la feuille',await p.evaluate(()=>!document.querySelector('#feuille').classList.contains('on')));
 await p.evaluate(()=>{fermerCouche()});await sleep(800);ok('couche fermée',await p.evaluate(()=>!document.querySelector('#seance').classList.contains('on')));
 await shot('13-jour-fait');
 // onglets
 for(const[t,i]of[['onair',14],['chrono',15],['progres',16]]){await p.evaluate(t=>aller(t),t);await sleep(350);await shot(i+'-'+t);await p.screenshot({path:path.join(out,i+'-'+t+'-full.png'),fullPage:true});}
 // on air
 await clic('[data-tab="onair"]');await sleep(200);await clic('[data-a="go-onair"][data-id="B"]');await sleep(800);await shot('18-oa-seance');
 await p.evaluate(()=>{document.querySelector('#seance').scrollTop=1500});await sleep(400);await shot('19-oa-stations');
 await p.evaluate(()=>document.querySelector('[data-a="bloc-ok"]').click());await sleep(100);
 await p.evaluate(()=>document.querySelector('[data-a="ring-bloc"]').click());await sleep(800);await shot('20-ring-prep');
 await p.evaluate(()=>document.querySelector('[data-a="ring-skip"]').click());await sleep(500);await shot('21-ring-work');ok('ring work',await p.evaluate(()=>Ring.segs[Ring.i].k==='work'));
 await p.evaluate(()=>document.querySelector('[data-a="ring-pause"]').click());await sleep(100);await p.evaluate(()=>document.querySelector('[data-a="ring-pause"]').click());
 await p.evaluate(()=>document.querySelector('[data-a="ring-stop"]').click());await sleep(700);ok('ring fermé',await p.evaluate(()=>!document.querySelector('#ring').classList.contains('on')));
 await p.evaluate(()=>{document.querySelectorAll('.rpe button')[4].click();document.querySelector('[data-a="fin-oa"]').click();});await sleep(800);ok('on air fini',await p.evaluate(()=>onairFait(DB.days[auj()].onair)));
 // persistance
 await p.evaluate(()=>flush());await p.reload();await sleep(600);ok('données après rechargement',await p.evaluate(()=>DB.days[auj()].gym.done===1&&!!DB.days[auj()].onair.done));
 // sauvegarde
 await clic('[data-tab="progres"]');await sleep(200);await p.evaluate(()=>aller('plan'));await sleep(200);await p.evaluate(()=>document.querySelector('[data-a="import"]').click());await sleep(500);await shot('22-import');await p.evaluate(()=>fermerFeuille());await sleep(500);
 ok('export/import : JSON relu',await p.evaluate(()=>{const avant=Object.keys(DB.days).length;importer(JSON.stringify(DB));return Object.keys(DB.days).length===avant;}));
 ok('clé de stockage inchangée',await p.evaluate(()=>LS==='camp-farhad.v1'&&!!localStorage.getItem(LS)));
 // cibles tactiles sur Jour et séance
 const petites=await p.evaluate(()=>{const res=[];const test=()=>document.querySelectorAll('button,a,input,label.btn').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.height&&(r.height<40||r.width<40))res.push((e.className||e.tagName)+'|'+(e.dataset.a||e.dataset.tab||'')+'|'+Math.round(r.width)+'x'+Math.round(r.height));});document.querySelector('[data-tab="jour"]').click();test();return[...new Set(res)];});
 ok('cibles tactiles assez grandes',petites.length===0,petites);
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
