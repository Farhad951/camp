/* Scénarios extrêmes, comme sur l'iPhone : image de démarrage, coupure réseau totale puis synchro au retour,
   import corrompu, appli ouverte pendant minuit, clé Gemini refusée, quota épuisé, choix des modèles,
   et les règles de progression du programme. Gemini et le stockage en ligne sont simulés dans la page. */
const {preparer,sleep}=require('./commun');const path=require('path'),fs=require('fs');
const DEBUT='2026-11-01T23:58:20';/* dimanche soir : minuit arrive pendant la suite */
(async()=>{
 const t=await preparer(8806,'extremes',[],{date:DEBUT});const {p,b,ev,ok,OUT}=t;

 /* --- 1. image de démarrage : identique au premier frame de l'ouverture */
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const liens=[...html.matchAll(/<link rel="apple-touch-startup-image" media="\(device-width:(\d+)px\) and \(device-height:(\d+)px\) and \(-webkit-device-pixel-ratio:(\d)\) and \(orientation:portrait\)" href="(demarrage\/[\dx]+\.png)">/g)];
 ok('13 images de démarrage, en portrait, iPhone Air compris',liens.length===13&&liens.some(l=>l[4].includes('1260x2736')),liens.length);
 const taille=f=>{const x=fs.readFileSync(path.join(__dirname,'..',f));return x.readUInt32BE(16)+'x'+x.readUInt32BE(20);};
 ok('chaque image a la taille exacte de son écran',liens.every(l=>taille(l[4])===(l[1]*l[3])+'x'+(l[2]*l[3])),liens.filter(l=>taille(l[4])!==(l[1]*l[3])+'x'+(l[2]*l[3])).map(l=>l[4]));
 const q=await b.newPage();
 for(const [w,h,r] of [[390,844,3],[402,874,3],[430,932,3]]){
  await q.setViewport({width:w,height:h,deviceScaleFactor:r});await q.goto(t.url,{waitUntil:'domcontentloaded'});
  await q.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;}));await sleep(150);
  const shot=(await q.screenshot({encoding:'base64'}));
  const d=await q.evaluate(async(a,u)=>{const charge=s=>new Promise((ok,non)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=non;i.src=s;});
    const [x,y]=await Promise.all([charge('data:image/png;base64,'+a),charge(u)]);if(x.width!==y.width||x.height!==y.height)return{diff:1,dim:[x.width,x.height,y.width,y.height]};
    const c=document.createElement('canvas');c.width=x.width;c.height=x.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(x,0,0);const A=g.getImageData(0,0,c.width,c.height).data;g.clearRect(0,0,c.width,c.height);g.drawImage(y,0,0);const B=g.getImageData(0,0,c.width,c.height).data;
    let n=0,clairs=0;for(let i=0;i<A.length;i+=4){if(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2])>24)n++;if(B[i]>200)clairs++;}return{diff:n/(A.length/4),clairs};},shot,t.url+'demarrage/'+(w*r)+'x'+(h*r)+'.png');
  ok('démarrage '+w+'×'+h+' : l’image est le premier frame (CAMP visible)',d.diff<0.001&&d.clairs>500,d);
 }
 await q.evaluate(()=>{});
 /* après le splash, CAMP reste là : aucune lettre ne monte depuis le vide */
 const f0=await q.evaluate(()=>{const s=document.querySelector('.ouv-mots>.ouv-mot');return{op:getComputedStyle(s).opacity,anims:document.getAnimations().filter(a=>a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest('.ouv-mots>.ouv-mot')).length};});
 ok('le mot ne bouge pas à la sortie du splash',f0.op==='1'&&f0.anims===0,f0);
 await q.close();

 /* --- simulations : Gemini et le stockage en ligne, dans la page */
 await p.evaluateOnNewDocument(()=>{
  const S=JSON.parse(sessionStorage.getItem('sim')||'{}');window.__sim=S;S.appels=S.appels||[];S.nuage=S.nuage||{};
  const garde=()=>sessionStorage.setItem('sim',JSON.stringify(S));window.__garde=garde;
  const rep=(st,o)=>new Response(typeof o==='string'?o:JSON.stringify(o),{status:st,headers:{'content-type':'application/json'}});
  const f0=window.fetch.bind(window);
  window.fetch=async(u,o)=>{u=String(u);if(!/generativelanguage/.test(u))return f0(u,o);if(navigator.onLine===false)throw new TypeError('Failed to fetch');
   const m=(u.match(/models\/([^:?]+):/)||[])[1]||'liste',corps=o&&o.body?JSON.parse(o.body):null;S.appels.push({m,th:corps&&corps.generationConfig&&corps.generationConfig.thinkingConfig||null});garde();
   const mode=S.mode||'ok';
   if(m==='liste'){if(mode==='cle')return rep(400,{error:{code:400,message:'API key not valid. Please pass a valid API key.',status:'INVALID_ARGUMENT',details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'API_KEY_INVALID'}]}});
    return rep(200,{models:(S.modeles||[]).map(n=>({name:'models/'+n,supportedGenerationMethods:/tts/.test(n)?['generateContent']:['generateContent','countTokens']}))});}
   if(mode==='cle')return rep(400,{error:{code:400,message:'API key not valid. Please pass a valid API key.',status:'INVALID_ARGUMENT',details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'API_KEY_INVALID'}]}});
   if(mode==='acces')return rep(403,{error:{code:403,message:'Generative Language API has not been used in project 123 before or it is disabled.',status:'PERMISSION_DENIED',details:[{reason:'SERVICE_DISABLED'}]}});
   if(mode==='jour')return rep(429,{error:{code:429,message:'Quota exceeded for metric: generate_content_free_tier_requests, limit: 20, model: x. GenerateRequestsPerDayPerProjectPerModel-FreeTier',status:'RESOURCE_EXHAUSTED'}});
   if(mode==='sature'&&m===S.sature)return rep(503,{error:{code:503,message:'high demand',status:'UNAVAILABLE'}});
   if(mode==='reflexion'&&corps.generationConfig.thinkingConfig)return rep(400,{error:{code:400,message:'Thinking level is not supported for this model.',status:'INVALID_ARGUMENT'}});
   return rep(200,{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(S.reponse||{})}]}}]});};
  /* stockage en ligne : refuse tout pendant la coupure, comme le vrai */
  const err=()=>Object.assign(new Error('hors ligne'),{code:'unavailable'});
  window.claude={use:async n=>n==='user'?{id:async()=>'farhad'}:{collection:()=>({onSnapshot:ok=>setTimeout(()=>ok({docs:[]}),30),doc:id=>({set:async v=>{if(navigator.onLine===false)throw err();S.nuage[id]=v;garde();},delete:async()=>{if(navigator.onLine===false)throw err();delete S.nuage[id];garde();}})})}};
 });
 const sim=f=>ev(f);
 await p.goto(t.url,{waitUntil:'load'});await sleep(900);
 await ev(()=>navigator.serviceWorker.ready);await p.reload({waitUntil:'load'});await sleep(900);
 ok('service worker actif : l’appli est servie par le cache',await ev(()=>!!navigator.serviceWorker.controller));

 /* --- 2. coupure réseau totale */
 await p.setOfflineMode(true);await p.reload({waitUntil:'load'});await sleep(1200);
 ok('hors ligne : l’appli s’ouvre sur le bon jour',await ev(()=>!!document.querySelector('#hero')&&UI.jour==='2026-11-01'&&navigator.onLine===false));
 await ev(()=>{document.querySelector('[data-a="go-salle"]').click();});await sleep(900);
 await ev(()=>{for(let i=0;i<2;i++)document.querySelectorAll('#ex-traction .ok-b')[i].click();});await sleep(500);
 await ev(()=>flush());
 ok('hors ligne : 2 séries de tractions notées',await ev(()=>(DB.days['2026-11-01'].gym.ex.traction||[]).filter(s=>s&&s.ok).length===2));
 ok('hors ligne : rien n’est parti en ligne, tout attend',await ev(()=>!__sim.nuage['j-2026-11-01']&&Cloud.q.size+(Cloud.busy?1:0)>0));
 /* photo de repas gardée pour plus tard */
 await ev(async()=>{IA.poser('AQ.cle-de-test-pour-les-extremes');const c=document.createElement('canvas');c.width=c.height=64;c.getContext('2d').fillRect(0,0,64,64);const bl=await new Promise(r=>c.toBlob(r,'image/jpeg'));await Photos.ajouter({d:'2026-11-01',h:'20:30',t:'repas-att',blob:bl});});
 await ev(()=>{__sim.reponse={pas_un_plat:false,plat:'Karahi de poulet',sel_eleve:false,confiance:'moyenne',note:'',conseil:'',halal_doute:'',aliments:[{nom:'Poulet karahi',type:'viande',grammes:250,proteines:50,glucides:10,lipides:28}]};__garde();});
 await ev(()=>{UI.s=null;document.querySelector('#seance').classList.remove('on');});
 await p.reload({waitUntil:'load'});await sleep(1500);
 ok('hors ligne, après relance : les séries sont toujours là',await ev(()=>(DB.days['2026-11-01'].gym.ex.traction||[]).filter(s=>s&&s.ok).length===2));
 ok('hors ligne : aucun appel à Gemini tenté',await ev(()=>!__sim.appels.some(a=>a.m!=='liste')));
 /* retour du réseau */
 await p.setOfflineMode(false);await sleep(5000);
 const nuage=await ev(()=>__sim.nuage['j-2026-11-01']);
 ok('retour du réseau : la séance part en ligne toute seule',!!nuage&&(nuage.gym.ex.traction||[]).filter(s=>s&&s.ok).length===2,nuage&&Object.keys(nuage));
 ok('retour du réseau : la photo gardée est analysée et devient un repas',await ev(()=>repasDu('2026-11-01').some(r=>r.nom==='Karahi de poulet'&&r.h==='20:30')));
 ok('… et la photo en attente est retirée',await ev(async()=>!(await Photos.tout()).some(x=>x.t==='repas-att')));

 /* --- 3. import d'un fichier abîmé */
 const avant=await ev(()=>JSON.stringify(DB.days));
 const fichier=async(nom,txt)=>{const f=path.join(OUT,nom);fs.writeFileSync(f,txt);await ev(()=>feuilleImport());await sleep(300);const i=await p.$('#imp-f');await i.uploadFile(f);await sleep(700);return ev(()=>document.querySelector('#toast').textContent);};
 const cas=[['coupe.json','{"days":{"2026-11-01":{"u":1,"gym":{"ex":'],['pas-camp.json','{"nom":"autre appli","items":[1,2,3]}'],['jours-faux.json','{"days":"abc","poids":5}'],['binaire.json','\u0000\u0001PNG\u0002garbage'],['vide.json','']];
 for(const [nom,txt] of cas){const msg=await fichier(nom,txt);ok('import « '+nom+' » : refusé avec un message clair',/pas une sauvegarde|ne vient pas d’une sauvegarde/.test(msg),msg);await ev(()=>fermerFeuille());await sleep(250);}
 ok('import abîmé : tes données n’ont pas bougé',await ev(a=>JSON.stringify(DB.days)===a,avant));
 /* types piégés à l'intérieur d'une sauvegarde valide */
 const piege=JSON.stringify({days:{'2026-10-20':{u:5,repas:'x',gym:{ex:{traction:'oups',latDB:[null,{ok:1,kg:'abc',r:'12'}]}},boxe:7},'pas-une-date':{u:1}},poids:{u:1,list:'non'},prefs:{u:1,nutri:{obj:'inconnu'},peau:'x'}});
 await fichier('piege.json',piege);await ev(()=>fermerFeuille());await sleep(300);
 let plante=[];for(const o of ['jour','onair','bouffe','visage','progres']){const r=await ev(o=>{try{aller(o);return!!document.querySelector('.vue.on')&&!/n’a pas pu s’afficher/.test(document.querySelector('.vue.on').textContent);}catch(e){return false;}},o);if(!r)plante.push(o);}
 ok('sauvegarde piégée : les 5 onglets s’affichent',plante.length===0,plante);
 await ev(()=>{UI.jour='2026-10-20';aller('jour');});await sleep(300);
 ok('sauvegarde piégée : le jour piégé s’affiche aussi',await ev(()=>!!document.querySelector('#hero')));
 await ev(()=>{UI.jour=auj();aller('jour');});

 /* --- 4. clé Gemini refusée, quota, accès */
 await ev(()=>{__sim.mode='cle';__sim.appels=[];__garde();aller('progres');});await sleep(300);
 await ev(()=>{const b=document.querySelector('[data-a="coach"]');b.scrollIntoView();b.click();});await sleep(800);
 const tc=await ev(()=>document.querySelector('#v-progres').textContent);
 ok('clé invalide : le message dit quoi faire',/Bilan impossible/.test(tc)&&/ne reconnaît pas ta clé Gemini/.test(tc)&&/aistudio\.google\.com\/apikey/.test(tc),tc.match(/Bilan impossible[^.]*\.[^.]*\./)&&tc.match(/Bilan impossible[^.]*\.[^.]*\./)[0]);
 ok('clé invalide : un seul essai, pas de cascade inutile',await ev(()=>__sim.appels.filter(a=>a.m!=='liste').length===1),await ev(()=>__sim.appels.map(a=>a.m)));
 await p.screenshot({path:path.join(OUT,'cle-invalide.png')});
 /* saisie d'une clé que Google refuse */
 await ev(()=>{feuilleCle();});await sleep(300);
 await ev(()=>{document.querySelector('#cle-ia').value='AQ.une-cle-recopiee-de-travers-123456';document.querySelector('[data-a="ia-ok"]').click();});await sleep(600);
 ok('clé refusée à la saisie : message précis, clé pas gardée',/ne reconnaît pas ta clé/.test(await ev(()=>document.querySelector('#toast').textContent))&&await ev(()=>IA.cle()==='AQ.cle-de-test-pour-les-extremes'));
 await ev(()=>fermerFeuille());await sleep(300);
 await ev(()=>{__sim.mode='acces';__garde();UI.coach=null;document.querySelector('[data-a="coach"]').click();});await sleep(800);
 ok('API désactivée sur le projet : on le dit',/n’a pas accès à l’API Gemini/.test(await ev(()=>document.querySelector('#v-progres').textContent)));
 await ev(()=>{__sim.mode='jour';__sim.appels=[];__garde();UI.coach=null;document.querySelector('[data-a="coach"]').click();});await sleep(1200);
 ok('quota du jour épuisé : on essaie chaque modèle, puis on dit quand ça revient',/quota gratuit du jour est épuisé/.test(await ev(()=>document.querySelector('#v-progres').textContent))&&await ev(()=>__sim.appels.filter(a=>a.m!=='liste').length===4));

 /* --- 5. modèles : la liste de Google, l'effort selon la demande */
 await ev(()=>{__sim.mode='ok';__sim.appels=[];__sim.modeles=['gemini-2.5-flash','gemini-3.5-flash','gemini-3.6-flash','gemini-3.7-flash','gemini-3.8-flash','gemini-3.8-flash-tts','gemini-3.1-pro-preview','gemini-3-flash-preview','gemini-3.5-flash-lite','gemini-3.1-flash-lite','gemini-flash-latest'];__garde();IA.oublierModeles();});
 await ev(()=>{__sim.reponse={titre:'Semaine régulière',constats:['2 séries de tractions.'],priorites:[{action:'Note tes repas',pourquoi:'1 seul jour noté.'}],ajustements:[{exercice:'Élévations latérales haltères',changement:'+1 série dimanche',pourquoi:'3 séances au même poids.'}]};__garde();UI.coach=null;document.querySelector('[data-a="coach"]').click();});await sleep(1200);
 const ap=await ev(()=>__sim.appels);
 ok('bilan : le Flash le plus récent, réflexion poussée',ap[1]&&ap[1].m==='gemini-3.8-flash'&&ap[1].th&&ap[1].th.thinkingLevel==='high',ap);
 ok('jamais de Pro (payant), de TTS ni de préversion',await ev(()=>{const o=JSON.parse(localStorage.getItem('camp-farhad.ia-modeles'));return o.f.join()==='gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash'&&o.l.join()==='gemini-3.5-flash-lite,gemini-3.1-flash-lite';}));
 const tp=await ev(()=>document.querySelector('#v-progres').textContent);
 ok('bilan : les ajustements de programme sont proposés',/À ajuster dans le programme/.test(tp)&&/\+1 série dimanche/.test(tp)&&/ne change pas tout seul/.test(tp));
 await p.screenshot({path:path.join(OUT,'coach.png'),fullPage:true});
 await ev(()=>{__sim.appels=[];__sim.reponse={lisible:true,code_barres:'',nom:'Skyr',proteines_100g:10,glucides_100g:4,lipides_100g:0,portion_g:150};__garde();});
 await ev(()=>IA.produit('data:image/jpeg;base64,AAAA'));
 ok('lire un emballage : Flash-Lite d’abord, réflexion légère',await ev(()=>__sim.appels[0].m==='gemini-3.5-flash-lite'&&__sim.appels[0].th.thinkingLevel==='low'),await ev(()=>__sim.appels));
 await ev(()=>{__sim.appels=[];__sim.mode='sature';__sim.sature='gemini-3.8-flash';__sim.reponse={pas_un_plat:false,plat:'Dal',sel_eleve:false,confiance:'moyenne',note:'',conseil:'',halal_doute:'',aliments:[{nom:'Dal',type:'feculent',grammes:250,proteines:15,glucides:40,lipides:8}]};__garde();});
 const pl=await ev(async()=>{try{return await IA.analyser({items:[],precision:'un bol de dal'});}catch(e){return{err:e.message};}});
 ok('analyse de repas : Flash saturé, le suivant répond',!pl.err&&await ev(()=>__sim.appels.map(a=>a.m).join()==='gemini-3.8-flash,gemini-3.7-flash'&&__sim.appels[0].th.thinkingLevel==='medium'),await ev(()=>__sim.appels.map(a=>a.m)));
 await ev(()=>{__sim.appels=[];__sim.mode='reflexion';__garde();});
 const pr=await ev(async()=>{try{return await IA.analyser({items:[],precision:'un bol de dal'});}catch(e){return{err:e.message};}});
 ok('réglage de réflexion refusé : même modèle, sans le réglage',!pr.err&&await ev(()=>__sim.appels.length===2&&__sim.appels[0].m===__sim.appels[1].m&&!!__sim.appels[0].th&&!__sim.appels[1].th),await ev(()=>__sim.appels));
 await ev(()=>{__sim.mode='ok';__garde();});

 /* --- 6. programme : règles de progression */
 const cons=await ev(()=>{delete DB.days['2026-10-20'];const dj=['2026-10-11','2026-10-18','2026-10-25'];dj.forEach(d=>{DB.days[d]={u:1,gym:{sid:'dim',ex:{latDB:[1,2,3,4,5].map(()=>({ok:1,kg:10,r:14}))}}};});
  const a=conseil(EX.latDB,precedent('latDB','2026-11-01'),'latDB','2026-11-01').txt;
  DB.days['2026-10-26']={u:1,gym:{sid:'lun',ex:{medball:[1,2,3,4].map(()=>({ok:1,kg:5,r:4})),cou:[{ok:1,kg:2.5,r:15}]}}};
  const b=conseil(EX.medball,precedent('medball','2026-11-02'),'medball','2026-11-02').txt;
  DB.days['2026-10-25'].gym.ex.latDB[0].r=16;const c=conseil(EX.latDB,precedent('latDB','2026-11-01'),'latDB','2026-11-01').txt;
  return{a,b,c};});
 ok('3 séances au même poids sans progrès : repartir 10 % plus bas',/Trois séances à 10 kg/.test(cons.a)&&/Repars à 9 kg/.test(cons.a),cons.a);
 ok('… mais pas si les reps montent',!/Repars/.test(cons.c),cons.c);
 ok('médecine-ball : plafonné à 5 kg, on progresse en vitesse',/Garde 5 kg/.test(cons.b)&&!/6 kg/.test(cons.b),cons.b);
 const prog=await ev(()=>({dim:itemsSeance(SEANCES.dim,false,'2026-11-08',null).map(o=>o.id),lun1:itemsSeance(SEANCES.lun,false,'2026-11-02',null).map(o=>o.id),lun2:itemsSeance(SEANCES.lun,false,'2026-11-09',null).map(o=>o.id),ancien:itemsSeance(SEANCES.lun,false,'2026-10-26',DB.days['2026-10-26'].gym).map(o=>o.id)}));
 ok('cou chaque dimanche, en fin de séance',prog.dim[prog.dim.length-1]==='cou',prog.dim);
 ok('Copenhague chaque lundi, plus de cou le lundi',[prog.lun1,prog.lun2].every(l=>l.includes('copenhague')&&!l.includes('cou')),prog);
 ok('un ancien lundi avec du cou le garde dans l’historique',prog.ancien.includes('cou'),prog.ancien);
 ok('volumes : latérales 5 + 4, face pull 3, rowing poulie 3',await ev(()=>EX.latDB.series===5&&EX.latCable.series===4&&EX.facepull.series===3&&EX.rowPoulie.series===3));

 /* --- 7. minuit, appli restée ouverte */
 await ev(()=>{['2026-10-11','2026-10-18','2026-10-25','2026-10-26','2026-10-20'].forEach(d=>delete DB.days[d]);UI.jour=auj();aller('jour');});await sleep(300);
 ok('avant minuit : dimanche affiché',await ev(()=>UI.jour==='2026-11-01'&&/Dimanche/i.test(document.querySelector('#top-titre').textContent)));
 const reste=await ev(()=>new Date(2026,10,2).getTime()-Date.now());
 if(reste>0)await sleep(reste+500);
 ok('minuit passé (horloge simulée)',await ev(()=>auj()==='2026-11-02'));
 await p.waitForFunction(()=>UI.jour==='2026-11-02',{timeout:65000}).catch(()=>{});
 ok('appli laissée ouverte : à minuit, l’écran passe au lundi tout seul',await ev(()=>UI.jour==='2026-11-02'&&/Puissance/.test(document.querySelector('#hero').textContent)&&document.querySelector('.chip.auj').dataset.d==='2026-11-02'));
 ok('… et le titre suit',await ev(()=>/Lundi/i.test(document.querySelector('#top-titre').textContent)),await ev(()=>document.querySelector('#top-titre').textContent));
 /* téléphone en veille : le réveil met à jour sans attendre */
 await ev(()=>{jourVu='2026-11-01';UI.jour='2026-11-01';rendre();window.dispatchEvent(new Event('pageshow'));});await sleep(200);
 ok('réveil du téléphone : mise à jour immédiate',await ev(()=>UI.jour==='2026-11-02'));
 ok('la séance de dimanche soir est restée à dimanche',await ev(()=>(DB.days['2026-11-01'].gym.ex.traction||[]).filter(s=>s&&s.ok).length===2&&!(DB.days['2026-11-02']&&DB.days['2026-11-02'].gym)));
 await p.screenshot({path:path.join(OUT,'lundi.png')});
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
