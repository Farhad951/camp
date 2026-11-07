/* Avec la vraie sauvegarde (tests/fixtures/sauvegarde-test.json), un samedi 7 novembre au soir :
   import, Bouffe sur des repas aux macros à virgule, suppression, rattrapage selon le jour raté, On Air bloc par bloc, bascule Complète / Légère dans le minuteur. */
const {preparer,sleep}=require('./commun');const path=require('path'),fs=require('fs');
const FIX=path.join(__dirname,'fixtures','sauvegarde-test.json');
/* la sauvegarde est personnelle : elle reste sur le PC (ignorée par Git). Sans elle, la suite est sautée. */
if(!fs.existsSync(FIX)){console.log('SAUTÉ : pas de tests/fixtures/sauvegarde-test.json sur ce poste');console.log('TOUT PASSE');process.exit(0);}
const TXT=fs.readFileSync(FIX,'utf8'),SRC=JSON.parse(TXT);
(async()=>{
 const t=await preparer(8804,'sauvegarde',[],{date:'2026-11-07T19:00:00'});const {p,ev,ok,OUT}=t;
 await p.goto(t.url,{waitUntil:'load'});await sleep(800);
 const clic=s=>ev(s=>document.querySelector(s).click(),s),texte=s=>ev(s=>document.querySelector(s).textContent,s);
 const secours=()=>ev(()=>[...document.querySelectorAll('.vue')].some(v=>/n’a pas pu s’afficher/.test(v.textContent)));

 /* --- import complet */
 await ev(async x=>{await importer(x);},TXT);await sleep(300);
 ok('import : les 5 jours de la sauvegarde',await ev(d=>d.every(k=>!!DB.days[k]),Object.keys(SRC.days)),Object.keys(SRC.days));
 ok('import : macros à virgule intactes',await ev(()=>DB.days['2026-11-03'].repas[0].items[0].m[0]===9.166666666666666&&DB.days['2026-11-03'].repas.length===2));
 ok('import : routine de peau et objectif gardés',await ev(()=>DB.prefs.peau.produits.length===5&&DB.prefs.nutri.obj==='seche'&&DB.prefs.custom.w===180));
 for(const tab of['jour','onair','bouffe','visage','progres']){await ev(x=>aller(x),tab);await sleep(250);ok('onglet '+tab+' : s’affiche avec tes données',!await secours());}

 /* --- rattrapage : le texte suit le jour raté */
 await ev(()=>aller('jour'));await sleep(300);
 const hero=await texte('#hero');
 ok('samedi raté : « le soir même, sinon dimanche »',/Raté samedi : le soir même, sinon dimanche en version légère/.test(hero)&&!/mardi/.test(hero),hero.slice(0,400));
 const R=await ev(()=>({
   mar0:quandRattraper('2026-11-03','2026-11-03'),mar1:quandRattraper('2026-11-03','2026-11-04'),
   jeu0:quandRattraper('2026-11-05','2026-11-05'),jeu1:quandRattraper('2026-11-05','2026-11-06'),
   sam0:quandRattraper('2026-11-07','2026-11-07'),sam1:quandRattraper('2026-11-07','2026-11-08'),
   vieux:quandRattraper('2026-11-03','2026-11-07'),lundi:quandRattraper('2026-11-02','2026-11-02')}));
 ok('mardi : le soir même, sinon mercredi',R.mar0==='Raté mardi : le soir même, sinon mercredi. Le vendredi reste un vrai repos.',R.mar0);
 ok('mardi, le lendemain : aujourd’hui',/^Raté mardi : c’est aujourd’hui/.test(R.mar1)&&!/légère/.test(R.mar1),R.mar1);
 ok('jeudi : sinon vendredi, en légère',/^Raté jeudi : le soir même, sinon vendredi en version légère \(samedi, c’est sparring\)\.$/.test(R.jeu0),R.jeu0);
 ok('jeudi, le lendemain : légère',/aujourd’hui.*légère.*sparring/.test(R.jeu1),R.jeu1);
 ok('samedi : sinon dimanche, en légère',/^Raté samedi : le soir même, sinon dimanche en version légère/.test(R.sam0),R.sam0);
 ok('samedi, le lendemain : aujourd’hui',/^Raté samedi : c’est aujourd’hui/.test(R.sam1),R.sam1);
 ok('quatre jours après : plus de « le soir même »',/bon moment est passé/.test(R.vieux)&&!/soir même/.test(R.vieux),R.vieux);
 ok('jour sans boxe : rien',R.lundi==='');
 ok('page On Air : la règle du samedi',await ev(()=>{aller('onair');return /Samedi raté/.test(document.querySelector('#v-onair').textContent)&&/mardi ou samedi/.test(document.querySelector('#v-onair').textContent);}));

 /* --- Bouffe sur le mardi 3 novembre (tes deux pains perdus) */
 await ev(()=>{aller('bouffe');});await sleep(200);
 for(let i=0;i<4;i++){await clic('[data-a="b-jour"][data-v="-1"]');await sleep(120);}
 ok('Bouffe, mardi 3 : tes deux repas, sans plantage',await ev(()=>bJour()==='2026-11-03'&&document.querySelectorAll('.rp').length===2)&&!await secours());
 const lignes=await ev(()=>[...document.querySelectorAll('.rp .repas')].map(b=>b.textContent));
 ok('chiffres arrondis à l’affichage',lignes.every(l=>/Pain perdu complet/.test(l)&&!/\d[.,]\d{2,}/.test(l)),lignes);
 const bilan=await texte('.b-bilan');ok('bilan du jour sans décimales folles',!/\d[.,]\d{3,}/.test(bilan));
 await p.screenshot({path:path.join(OUT,'bouffe-mardi.png')});
 const avant=await ev(()=>JSON.stringify(DB.days['2026-11-03'].repas));
 await ev(()=>document.querySelectorAll('.rp-poub')[1].click());await sleep(300);
 ok('corbeille sur ta ligne de 21:58',await ev(()=>DB.days['2026-11-03'].repas.length===1&&DB.days['2026-11-03'].repas[0].h==='08:00'));
 await clic('[data-a="toast-action"]');await sleep(300);
 ok('Annuler : repas et macros identiques au bit près',await ev(a=>JSON.stringify(DB.days['2026-11-03'].repas)===a,avant));
 /* glisser jusqu'au bout, au doigt */
 const b=await ev(()=>{const r=document.querySelectorAll('.rp')[0];r.scrollIntoView({block:'center'});const q=r.getBoundingClientRect();return{x:q.x+q.width-30,y:q.y+q.height/2,w:q.width};});
 await p.touchscreen.touchStart(b.x,b.y);for(let s=1;s<=25;s++){await p.touchscreen.touchMove(b.x-s*12,b.y);await sleep(16);}await p.touchscreen.touchEnd();await sleep(700);
 ok('glissement sur ta ligne de 08:00 : supprimée',await ev(()=>DB.days['2026-11-03'].repas.length===1&&DB.days['2026-11-03'].repas[0].h==='21:58'));
 await clic('[data-a="toast-action"]');await sleep(300);ok('… et rétablie',await ev(a=>JSON.stringify(DB.days['2026-11-03'].repas)===a,avant));
 /* export puis réimport : rien ne bouge */
 const exp=await ev(()=>JSON.stringify(DB));await ev(async x=>{localStorage.clear();DB.days={};await importer(x);},exp);await sleep(300);
 ok('export → import : tes jours identiques',await ev(d=>Object.keys(d).every(k=>JSON.stringify(DB.days[k].repas||null)===JSON.stringify(d[k].repas||null)),SRC.days));
 await ev(()=>flush());await p.reload({waitUntil:'load'});await sleep(800);
 ok('après relance : toujours là',await ev(()=>DB.days['2026-11-03'].repas.length===2&&DB.days['2026-11-04'].onair.blocs.shadow===1));

 /* --- On Air : un bloc par écran */
 await ev(()=>{aller('jour');});await sleep(200);
 await clic('[data-a="go-onair"]');await sleep(900);
 const vue=await ev(()=>{const P=document.querySelector('#oa-pages'),pg=[...P.children],W=innerWidth;return{n:pg.length,vis:pg.filter(x=>{const r=x.getBoundingClientRect();return r.right>8&&r.left<W-8;}).length,go:document.querySelector('#oa-go').textContent,page:UI.s.page,pour:jour(UI.s.k).onair.pour};});
 ok('On Air A : 4 blocs + la fin, un seul à l’écran',vue.n===5&&vue.vis===1,vue);
 ok('le minuteur est en bas, pour le bloc affiché',/Minuteur, bloc 1/.test(vue.go)&&vue.pour==='2026-11-07',vue);
 ok('la bascule Complète / Légère reste en haut, toujours visible',await ev(()=>!!document.querySelector('.s-top .segment [data-a="leger"]')));
 await clic('[data-a="oa-page"][data-v="1"]');await sleep(700);
 ok('Suivant : bloc 2',await ev(()=>UI.s.page===1&&/bloc 2/.test(document.querySelector('#oa-go').textContent)));
 /* au doigt : glisser vers la gauche passe au bloc suivant */
 const P=await ev(()=>{const r=document.querySelector('#oa-pages').getBoundingClientRect();return{x:r.x+r.width-40,y:r.y+120};});
 await p.touchscreen.touchStart(P.x,P.y);for(let s=1;s<=14;s++){await p.touchscreen.touchMove(P.x-s*20,P.y+s*.5);await sleep(16);}await p.touchscreen.touchEnd();await sleep(1000);
 ok('glisser : bloc 3',await ev(()=>UI.s.page===2),await ev(()=>UI.s.page));
 await p.screenshot({path:path.join(OUT,'onair-bloc.png')});
 await ev(()=>document.querySelector('#bloc-sac [data-a="bloc-ok"]').click());await sleep(1100);
 ok('« Marquer fait » : on passe au bloc suivant',await ev(()=>UI.s.page===3&&document.querySelectorAll('#oa-pts i.ok').length===1));
 await clic('[data-a="oa-page"][data-v="1"]');await sleep(700);
 ok('dernière page : la fin, avec ressenti et Terminer en bas',await ev(()=>UI.s.page===4&&document.querySelector('#oa-go').dataset.a==='fin-oa'&&!!document.querySelector('.oa-bilan .rpe')&&/Sac lourd/.test(document.querySelector('#oa-recap .ok').textContent)));
 await ev(()=>document.querySelector('#oa-recap [data-v="0"]').click());await sleep(700);ok('la fin renvoie au bloc à faire',await ev(()=>UI.s.page===0));

 /* --- minuteur : Complète → Légère en plein bloc (sac : 6 rounds, 4 en légère) */
 await ev(()=>{OAP.aller(2,true);});await sleep(200);await ev(()=>{const o=jour(UI.s.k).onair;o.blocs.sac=0;});
 await clic('#oa-go');await sleep(500);
 ok('minuteur : la bascule est là',await ev(()=>!document.querySelector('#r-version').hidden&&document.querySelector('#r-version .on').dataset.v==='0'));
 for(let i=0;i<5;i++){await clic('[data-a="ring-skip"]');await sleep(80);}  /* prép, R1, repos, R2, repos → R3 */
 ok('round 3 sur 6',/Round 3 sur 6/.test(await texte('#r-round')));
 await clic('[data-a="ring-version"][data-v="1"]');await sleep(250);
 ok('→ Légère : toujours round 3, sur 4',/Round 3 sur 4/.test(await texte('#r-round'))&&await ev(()=>jour(UI.s.k).onair.leger===1&&Ring.actif));
 ok('la séance derrière suit, ce qui est fait reste fait',await ev(()=>document.querySelector('.s-top .segment button.on').dataset.v==='1')&&await ev(()=>document.querySelectorAll('#bloc-sac .rounds li.off').length===2));
 await clic('[data-a="ring-version"][data-v="0"]');await sleep(250);
 ok('→ Complète : les rounds reviennent, round 3 sur 6',/Round 3 sur 6/.test(await texte('#r-round'))&&await ev(()=>jour(UI.s.k).onair.leger===0));
 for(let i=0;i<4;i++){await clic('[data-a="ring-skip"]');await sleep(80);}  /* → R5 */
 ok('round 5 sur 6',/Round 5 sur 6/.test(await texte('#r-round')));
 await clic('[data-a="ring-version"][data-v="1"]');await sleep(300);
 ok('→ Légère au round 5 : les 4 rounds sont faits, bloc terminé',await ev(()=>!Ring.actif&&document.querySelector('#ring').dataset.ph==='fin'&&jour(UI.s.k).onair.blocs.sac===1));
 await clic('[data-a="ring-pause"]');await sleep(600);
 ok('fermé : on est au bloc suivant',await ev(()=>UI.s.page===3));
 /* en pause, le temps restant ne saute pas */
 await clic('#oa-go');await sleep(400);await clic('[data-a="ring-skip"]');await sleep(100);await clic('[data-a="ring-pause"]');await sleep(100);
 await clic('[data-a="ring-version"][data-v="0"]');await sleep(200);
 ok('en pause, la bascule garde la pause',await ev(()=>Ring.pause&&Ring.actif&&/Round 1 sur 6/.test(document.querySelector('#r-round').textContent)));
 await clic('[data-a="ring-stop"]');await sleep(500);
 /* le mercredi 4 : On Air A en légère, corde et shadow faits → ouvre sur le sac */
 await ev(()=>{fermerCouche();});await sleep(500);await ev(()=>ouvrirOnAir('A','2026-11-04'));await sleep(800);
 ok('mercredi 4 : reprend au premier bloc pas fait (sac)',await ev(()=>UI.s.page===2&&document.querySelector('.s-top .segment button.on').dataset.v==='1'));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
