/* Vidéos partout, onglet Bouffe (analyse simulée), onglet Visage (signaux, corrélations, photos). */
const {preparer,sleep}=require('./commun');const path=require('path');
const PLAT={pas_un_plat:false,plat:'Poulet karahi et riz',sel_eleve:false,confiance:'moyenne',note:'L’huile du fond de plat ne se voit pas.',aliments:[{nom:'Poulet karahi',type:'viande',grammes:220,proteines:44,glucides:9,lipides:24},{nom:'Riz basmati',type:'feculent',grammes:300,proteines:8,glucides:84,lipides:1},{nom:'<img src=x onerror=alert(1)>',type:'inconnu',grammes:99999,proteines:-5,glucides:'x',lipides:2}]};
(async()=>{
 const t=await preparer(8795,'bouffe-visage',['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);const {p,ev,ok,OUT}=t;
 /* faux services d'IA : aucune clé réelle, aucun appel réseau sortant */
 const appels=[];let mode='ok';await p.setRequestInterception(true);
 p.on('request',q=>{const u=q.url();
  if(/api\.anthropic\.com|generativelanguage\.googleapis\.com/.test(u)){
   const h={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'};
   if(q.method()==='OPTIONS'){q.respond({status:204,headers:h});return;}
   appels.push({u,h:q.headers(),b:JSON.parse(q.postData())});
   if(mode==='401'){q.respond({status:401,headers:h,body:'{}'});return;}
   if(mode==='refus'){q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify({stop_reason:'refusal',content:[]})});return;}
   const txt=JSON.stringify(mode==='vide'?{pas_un_plat:true,aliments:[]}:PLAT);
   q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify(/anthropic/.test(u)?{stop_reason:'end_turn',content:[{type:'thinking',thinking:''},{type:'text',text:txt}]}:{candidates:[{content:{parts:[{text:'```json\n'+txt+'\n```'}]}}]})});return;}
  q.continue();});
 p.on('dialog',d=>{t.ok('aucune alerte injectée',false,d.message());d.dismiss();});
 await p.goto(t.url,{waitUntil:'load'});await sleep(1300);
 const clic=s=>ev(s=>document.querySelector(s).click(),s);
 const ong=async n=>{await clic('[data-tab="'+n+'"]');await sleep(250);};

 /* --- vidéos */
 ok('plus aucun mannequin',await ev(()=>typeof ANIMS==='undefined'&&typeof Demo==='undefined'&&!document.querySelector('canvas')));
 const manque=await ev(()=>{const ids=[...Object.keys(EX),...Object.keys(GESTES)];return ids.filter(i=>!clipDe(i)||!ETAPES[i]);});
 ok('chaque exercice et bloc a un clip et des étapes',manque.length===0,manque);
 await ev(()=>{UI.jour='2026-11-02';rendre();document.querySelector('[data-a="go-salle"]').click();});await sleep(1200);
 ok('carte : vidéo, étapes dessous, puis Voir le geste',await ev(()=>[...document.querySelectorAll('#seance .ex')].every(e=>{const v=e.querySelector('.scene video'),l=e.querySelector('.scene + .etapes'),b=e.querySelector('[data-a="geste"]');return v&&l&&l.children.length>0&&b&&(l.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);})));
 ok('variante signalée sur un clip en photos',await ev(()=>/deux positions/.test(document.querySelector('#ex-trapbar .variante').textContent)));
 await ev(()=>{document.querySelector('#seance').scrollTop=document.querySelector('#ex-boxjump').offsetTop-70;});await sleep(900);await p.screenshot({path:path.join(OUT,'carte-video.png')});
 await ev(()=>document.querySelector('[data-a="fermer"]').click());await sleep(500);
 await ev(()=>{UI.s=null;document.querySelector('#seance').classList.remove('on');});
 await ong('onair');ok('On Air : un clip par séance',await ev(()=>document.querySelectorAll('.carte-oa video').length===2));
 await clic('[data-a="go-onair"][data-id="B"]');await sleep(900);
 ok('stations : un clip chacune',await ev(()=>[...document.querySelectorAll('.station')].every(s=>s.querySelector('video'))));
 ok('blocs On Air : étapes sous la vidéo',await ev(()=>[...document.querySelectorAll('.bloc-oa')].filter(b=>b.querySelector('.scene')).every(b=>b.querySelector('.scene + .etapes'))));
 await p.screenshot({path:path.join(OUT,'onair.png')});
 await ev(()=>{Lecteur.ferme();document.querySelector('[data-a="fermer"]').click();});await sleep(500);

 /* --- onglets */
 ok('six onglets, Plan rangé sous Progrès',await ev(()=>[...document.querySelectorAll('.tabs button')].map(b=>b.dataset.tab).join()==='jour,onair,chrono,bouffe,visage,progres'));
 await p.setViewport({width:320,height:640,deviceScaleFactor:2,isMobile:true,hasTouch:true});await sleep(200);
 ok('320 px : six onglets sur une ligne, labels entiers',await ev(()=>{const l=[...document.querySelectorAll('.tabs button')],y=l[0].getBoundingClientRect().top;return l.every(b=>b.getBoundingClientRect().top===y&&b.scrollWidth<=b.clientWidth+1&&b.getBoundingClientRect().width>=44);}));
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});await sleep(200);
 await ong('progres');await clic('[data-a="aller"][data-v="plan"]');await sleep(200);
 ok('Plan accessible, Progrès reste allumé',await ev(()=>UI.tab==='plan'&&document.querySelector('.tabs button.on').dataset.tab==='progres'&&!!document.querySelector('[data-a="export"]')));

 /* --- bouffe */
 await ong('bouffe');await p.screenshot({path:path.join(OUT,'bouffe.png'),fullPage:true});
 const cible=await ev(()=>cibleDu('2026-11-02'));
 ok('objectif du programme un jour de salle',cible.kc===2600&&cible.p===160&&cible.l===65,cible);
 ok('jour de repos : 2 450 kcal',await ev(()=>cibleDu('2026-11-04').kc===2450));
 ok('jamais sous le plancher',await ev(()=>{nutri().bonus=-300;const c=cibleDu('2026-11-04').kc;nutri().bonus=0;return c===2300;}));
 ok('équivalences sans balance',await ev(()=>equivalence('viande',110)==='environ 1 paume'&&equivalence('noix',30)==='environ 1 poignée'&&equivalence('viande',170)==='environ 1,5 paume'&&equivalence('feculent',300)==='environ 2 poings'));
 ok('tous les repas types existent dans la base',await ev(()=>REPAS.every(r=>r.i.every(x=>itemAl(x[0])))));
 ok('suggestions pour ce moment',await ev(()=>suggestions(auj()).length>0&&document.querySelectorAll('[data-a="repas-idee"]').length>=3));
 ok('sans clé : invitation à activer',await ev(()=>!!document.querySelector('.b-cle')));
 const photo=path.join(__dirname,'..','icon-512.png');
 const envoyer=async()=>{const i=await p.$('#photo-galerie');await i.uploadFile(photo);};
 /* sans clé : on peut quand même noter à la main */
 await envoyer();await sleep(500);
 ok('photo sans clé : saisie à la main',await ev(()=>UI.r.statut==='sanscle'&&!!document.querySelector('#rech-al')));
 await ev(()=>{const r=document.querySelector('#rech-al');r.value='naan';r.dispatchEvent(new Event('input',{bubbles:true}));});
 ok('recherche sans accent ni casse',await ev(()=>{const r=document.querySelector('#rech-al');r.value='OEUFS';r.dispatchEvent(new Event('input',{bubbles:true}));const a=document.querySelectorAll('#rech-res button').length;r.value='naan';r.dispatchEvent(new Event('input',{bubbles:true}));return document.querySelectorAll('#rech-res button').length===2;}));
 await clic('[data-a="fermer-feuille"]');await sleep(400);
 /* clé refusée si le format est inconnu */
 await clic('[data-a="ia-regler"]');await sleep(300);
 await ev(()=>{document.querySelector('#cle-ia').value='nimporte';document.querySelector('[data-a="ia-ok"]').click();});await sleep(100);
 ok('clé inconnue refusée',await ev(()=>!IA.cle()));
 await p.screenshot({path:path.join(OUT,'cle.png')});
 await ev(()=>{document.querySelector('#cle-ia').value='AIza-test';document.querySelector('[data-a="ia-ok"]').click();});await sleep(400);
 /* Gemini */
 await envoyer();await sleep(1200);
 ok('Gemini : appel direct avec la clé en en-tête',appels.length===1&&/gemini-flash-latest:generateContent$/.test(appels[0].u)&&appels[0].h['x-goog-api-key']==='AIza-test'&&!appels[0].u.includes('AIza'),appels[0]&&appels[0].u);
 ok('photo réduite et envoyée en JPEG',!!appels[0].b.contents[0].parts[0].inlineData.data&&appels[0].b.contents[0].parts[0].inlineData.mimeType==='image/jpeg');
 const res=await ev(()=>({st:UI.r.statut,n:UI.r.items.length,nom:UI.r.nom,g:UI.r.items[2].g,neg:UI.r.items[2].m,html:document.querySelector('.als').innerHTML.includes('<img')}));
 ok('résultat lu',res.st==='ok'&&res.n===3&&res.nom==='Poulet karahi et riz',res);
 ok('valeurs folles bornées',res.g===2000&&res.neg[0]===0&&res.neg[1]===0,res);
 ok('texte renvoyé jamais interprété',!res.html);
 await p.screenshot({path:path.join(OUT,'analyse.png'),fullPage:false});
 ok('macros et équivalence affichées',await ev(()=>{const a=document.querySelector('.al');return /220 g/.test(a.textContent)&&/2 paumes/.test(a.textContent)&&/kcal/.test(a.textContent);}));
 const avant=await ev(()=>document.querySelector('#r-tot').textContent);
 ok('curseur : grammes, équivalence et total suivent',await ev(()=>{const r=document.querySelector('[data-al="0"]');r.value=110;r.dispatchEvent(new Event('input',{bubbles:true}));const a=document.querySelector('.al');return /110 g/.test(a.textContent)&&/environ 1 paume/.test(a.textContent);})&&avant!==await ev(()=>document.querySelector('#r-tot').textContent));
 await ev(()=>document.querySelector('[data-a="al-retire"][data-i="2"]').click());await sleep(100);
 await clic('[data-a="repas-ok"]');await sleep(500);
 const b=await ev(()=>bilanDu(auj()));
 ok('au journal : proteines justes',Math.round(b.p)===30,b);
 ok('photo non conservée',await ev(()=>{const r=DB.days[auj()].repas[0];return !r.photo&&!JSON.stringify(DB).includes('base64');}));
 ok('la clé n’entre pas dans la sauvegarde',await ev(()=>!JSON.stringify(DB).includes('AIza')));
 await p.screenshot({path:path.join(OUT,'bouffe-journal.png'),fullPage:true});
 /* modifier, supprimer */
 await clic('[data-a="repas-voir"]');await sleep(300);
 ok('un repas se rouvre',await ev(()=>UI.r.i===0&&document.querySelectorAll('.al').length===2));
 await clic('[data-a="repas-suppr"]');await sleep(400);ok('un repas se supprime',await ev(()=>repasDu(auj()).length===0));
 /* erreurs */
 for(const[m,re]of[['401',/refusée/],['vide',/pas de nourriture/]]){mode=m;await envoyer();await sleep(800);const x=await ev(()=>({s:UI.r.statut,t:document.querySelector('#feuille').textContent}));ok('erreur '+m+' : message clair',x.s==='erreur'&&re.test(x.t),x.s);await clic('[data-a="fermer-feuille"]');await sleep(350);}
 mode='ok';
 /* Claude */
 appels.length=0;await ev(()=>IA.poser('sk-ant-test'));await envoyer();await sleep(1000);
 const c=appels[0];
 ok('Claude : modèle, en-têtes, sortie structurée',c&&/api\.anthropic\.com\/v1\/messages$/.test(c.u)&&c.b.model==='claude-opus-5-5'&&c.h['x-api-key']==='sk-ant-test'&&c.h['anthropic-dangerous-direct-browser-access']==='true'&&c.b.output_config.format.type==='json_schema'&&c.b.fallbacks==='default'&&c.h['anthropic-beta']==='server-side-fallback-2026-07-01'&&c.b.messages[0].content[0].source.media_type==='image/jpeg');
 ok('Claude : réponse lue malgré le bloc de réflexion',await ev(()=>UI.r.statut==='ok'&&UI.r.items.length===3));
 await clic('[data-a="fermer-feuille"]');await sleep(350);
 mode='refus';await envoyer();await sleep(800);ok('refus du service : message',await ev(()=>/refusé/.test(document.querySelector('#feuille').textContent)));mode='ok';await clic('[data-a="fermer-feuille"]');await sleep(350);
 await p.setOfflineMode(true);await ev(()=>Object.defineProperty(navigator,'onLine',{value:false,configurable:true}));await envoyer();await sleep(500);ok('hors ligne : saisie à la main',await ev(()=>UI.r.statut==='horsligne'));await clic('[data-a="fermer-feuille"]');await sleep(350);await ev(()=>delete navigator.onLine);await p.setOfflineMode(false);
 /* repas salé repris dans le visage du lendemain */
 await ev(()=>{const k=iso(addD(fromISO(auj()),-1));jour(k).repas=[{nom:'Pizza',h:'20:00',sel:0,items:[itemAl('Pizza')]}];});

 /* --- visage */
 await ong('visage');await sleep(300);await p.screenshot({path:path.join(OUT,'visage-depart.png'),fullPage:true});
 ok('avant le lancement : le chemin et la date de fin',await ev(()=>/taux de gras/.test(document.querySelector('#v-visage').textContent)&&!!document.querySelector('[data-a="vis-go"]')));
 ok('sel de la veille repris des repas',await ev(()=>visDu(auj()).sel===1));
 await ev(()=>{const a=[66.8,66.6,66.5,66.3,66.1,66,65.9,65.7,65.6,65.5,65.3,65.2,65.1,65];DB.poids.list=a.map((kg,i)=>({d:iso(addD(fromISO(auj()),i-13)),kg}));});
 await clic('[data-a="vis-go"]');await sleep(300);
 ok('phase lancée en sèche',await ev(()=>vP().debut===auj()&&nutri().obj==='seche'));
 /* semaine 3, perte de 0,7 kg par semaine : trop vite */
 await ev(()=>{vP().debut=iso(addD(fromISO(auj()),-16));const a=[];for(let i=0;i<22;i++)a.push({d:iso(addD(fromISO(auj()),i-21)),kg:Math.round((67-i*.1)*10)/10});DB.poids.list=a;rendre();});await sleep(300);
 const r=await ev(()=>rythmes());ok('rythme calculé sur moyennes',Math.abs(r.v1-.7)<.01,r);
 ok('trop vite : conseille +200 kcal',await ev(()=>signaux().some(s=>s.a&&s.a[0]==='vis-200')));
 ok('semaine 3 : plateau expliqué',await ev(()=>/plateau/i.test(document.querySelector('#v-visage .hero').textContent)&&/Semaine 3/.test(document.querySelector('#v-visage .hero').textContent)));
 await p.screenshot({path:path.join(OUT,'visage-phase.png'),fullPage:true});
 await clic('[data-a="vis-200"]');await sleep(200);
 ok('+200 appliqué à l’objectif de Bouffe, sans redemander',await ev(()=>cibleDu('2026-11-02').kc===2800&&!signaux().some(s=>s.a&&s.a[0]==='vis-200')));
 /* charges qui baissent 3 semaines de suite */
 await ev(()=>{[21,14,7,0].forEach((n,i)=>{const k=iso(addD(fromISO(auj()),-n));jour(k).gym={ex:{incline:[{ok:1,kg:30-i*2,r:8}]}};});});
 ok('charges en baisse : signal d’arrêt',await ev(()=>chargesBaissent()&&signaux().some(s=>s.n==='stop'&&/charges/.test(s.t))));
 await ev(()=>{[21,14,7,0].forEach(n=>{delete DB.days[iso(addD(fromISO(auj()),-n))].gym;});});
 ok('sans baisse : pas de signal',await ev(()=>!chargesBaissent()));
 /* matins et corrélations */
 await ev(()=>{for(let i=1;i<=10;i++){const k=iso(addD(fromISO(auj()),-i)),s=i%2;jour(k).vis={g:s?4:2,so:7.5,eau:3,sel:s,alc:0,fat:0};}rendre();});await sleep(300);
 const E=await ev(()=>effets(checks(90).filter(v=>v.g)));
 ok('repas salé : écart mesuré sur ses matins',E.length===1&&E[0].d===2&&/salé/.test(E[0].nom),E);
 ok('pas de conclusion sans assez de matins',await ev(()=>effets(checks(90).filter(v=>v.g).slice(0,3)).length===0));
 ok('conclusion affichée',await ev(()=>/te gonfle/.test(document.querySelector('#v-visage').textContent)));
 await clic('[data-a="vis-note"][data-v="2"]');await sleep(200);ok('note du matin enregistrée',await ev(()=>DB.days[auj()].vis.g===2&&document.querySelector('.echelle button.on').textContent.startsWith('2')));
 const so=await ev(()=>visDu(auj()).so);await clic('[data-a="vis-pas"][data-f="so"][data-v=".5"]');await sleep(150);ok('sommeil au pas de 30 min',await ev(()=>visDu(auj()).so)===so+.5);
 /* fatigue répétée */
 await ev(()=>{for(let i=0;i<4;i++){const k=iso(addD(fromISO(auj()),-i));jour(k).vis=Object.assign(visDu(k),{fat:1});}});
 ok('froid et fatigue répétés : signal d’arrêt',await ev(()=>signaux().some(s=>s.n==='stop'&&/Froid/.test(s.t))));
 await ev(()=>{for(let i=0;i<4;i++)jour(iso(addD(fromISO(auj()),-i))).vis.fat=0;rendre();});await sleep(200);
 /* photos */
 await p.waitForSelector('[data-a="cam-go"]');
 await clic('[data-a="cam-go"]');await p.waitForSelector('#cam video',{timeout:15000}).catch(async e=>{console.log('DIAG',await ev(()=>({toast:document.querySelector('#toast').textContent,flux:!!Cam.flux,md:!!navigator.mediaDevices,hid:document.hidden})));throw e;});await sleep(700);await p.screenshot({path:path.join(OUT,'camera.png')});
 ok('caméra : image reçue',await ev(()=>document.querySelector('#cam video').videoWidth>0));
 await clic('[data-a="cam-prise"]');await p.waitForFunction(()=>!document.querySelector('#cam'),{timeout:10000});await sleep(400);
 ok('photo gardée, flux coupé',await ev(async()=>(await Photos.tout()).length===1&&!document.querySelector('#cam')&&!Cam.flux));
 await sleep(200);
 await ev(()=>{const b=document.querySelector('[data-a="cam-go"]');b.click();b.click();});await p.waitForSelector('#cam video',{timeout:25000}).catch(async e=>{console.log('DIAG',await ev(()=>({toast:document.querySelector('#toast').textContent,flux:!!Cam.flux,err:Cam.erreur})));throw e;});await sleep(500);
 ok('double appui : une seule caméra',await ev(()=>document.querySelectorAll('#cam').length===1));
 ok('l’ancienne photo sert de calque',await ev(()=>!!document.querySelector('.cam-g')));
 await clic('[data-a="cam-prise"]');await p.waitForSelector('#comp',{timeout:10000});
 const pos=await ev(async()=>{const c=document.querySelector('#comp');c.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,100));const r=c.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};});
 await p.mouse.move(pos.x+pos.w*.5,pos.y+pos.h*.5);await p.mouse.down();await p.mouse.move(pos.x+pos.w*.2,pos.y+pos.h*.5,{steps:4});
 ok('comparateur : le trait suit le doigt',await ev(()=>{const c=document.querySelector('#comp');return Math.abs(c.__p-20)<2&&/inset\(0(px)? 0(px)? 0(px)? 20/.test(document.querySelector('.apres').style.clipPath);}));await p.mouse.up();
 await p.screenshot({path:path.join(OUT,'comparateur.png')});
 ok('les photos restent hors des sauvegardes',await ev(()=>!JSON.stringify(DB).includes('blob')));
 ok('photo : Exporter ne contient que les données',await ev(()=>!('photos' in DB)));
 await clic('[data-a="vis-regard"][data-v="fatigue"]');await sleep(300);ok('« plus fatigué » : signal d’arrêt',await ev(()=>signaux().some(s=>/fatigué/.test(s.t))));
 await p.waitForSelector('[data-a="vis-fin"]');await clic('[data-a="vis-fin"]');await sleep(300);
 ok('fin de phase : entretien, sans bonus',await ev(()=>nutri().obj==='entretien'&&!nutri().bonus&&!!vP().fin));
 ok('6 semaines d’entretien avant de recommencer',await ev(()=>!document.querySelector('[data-a="vis-go"]')&&/Entretien jusqu/.test(document.querySelector('#v-visage').textContent)));
 await ev(()=>{jour(auj()).vis=null;});await ev(()=>{vP().fin=iso(addD(fromISO(auj()),-42));rendre();});await sleep(200);ok('après 6 semaines : relançable',await ev(()=>!!document.querySelector('[data-a="vis-go"]')));
 /* tout effacer vide aussi les photos */
 await ev(()=>{document.querySelector('[data-tab="progres"]').click();aller('plan');document.querySelector('[data-a="reset"]').click();});await sleep(300);await clic('[data-a="reset-ok"]');await sleep(500);
 ok('Tout effacer : photos comprises',await ev(async()=>(await Photos.tout()).length===0));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
