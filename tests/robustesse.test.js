/* Parcours critiques et cas limites : repas passés, saisie rapide, séance, repos, photos, hors ligne, import et export, données abîmées. IA simulée. */
const {preparer,sleep}=require('./commun');const path=require('path');
const CLE='AQ.cle-de-test-longue-et-valide';
const PLAT={pas_un_plat:false,plat:'Karahi et naans',sel_eleve:false,confiance:'moyenne',note:'',conseil:'',halal_doute:'',aliments:[{nom:'Karahi',type:'viande',grammes:200,proteines:40,glucides:8,lipides:20},{nom:'Naan',type:'pain',grammes:180,proteines:16,glucides:90,lipides:10}]};
(async()=>{
 const t=await preparer(8798,'robustesse',['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);const {p,ev,ok,OUT}=t;
 let mode='ok';const appels=[];await p.setRequestInterception(true);
 p.on('request',q=>{const u=q.url(),h={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'};
  if(/generativelanguage/.test(u)){if(q.method()==='OPTIONS'){q.respond({status:204,headers:h});return;}if(q.method()==='GET'){q.respond({status:200,headers:h,body:'{}'});return;}
   appels.push(JSON.parse(q.postData()));if(mode==='coupe'){q.abort('failed');return;}
   q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(PLAT)}]}}]})});return;}
  q.continue();});
 await p.goto(t.url,{waitUntil:'load'});await sleep(800);
 const clic=s=>ev(s=>document.querySelector(s).click(),s),texte=s=>ev(s=>document.querySelector(s).textContent,s);
 const saisir=async v=>{await ev(v=>{document.querySelector('#q-repas').value=v;document.querySelector('[data-a="q-envoi"]').click();},v);await sleep(400);};
 const HIER='2026-11-01',AUJ='2026-11-02';

 /* --- lecture du moment dans une phrase */
 const q=s=>ev(s=>quandDans(s),s);
 let r=await q('hier soir 2 naans et un karahi');ok('« hier soir » : date, heure, reste',r.j===1&&r.h==='20:00'&&r.reste==='2 naans et un karahi',r);
 r=await q('ce matin, 2 œufs et du pain');ok('« ce matin »',r.j==null&&r.h==='08:00'&&/œufs/.test(r.reste),r);
 r=await q('avant-hier à 14h30 j’ai mangé un burger');ok('« avant-hier à 14h30 »',r.j===2&&r.h==='14:30'&&/^un burger/.test(r.reste),r);
 r=await q('samedi au dîner un biryani');ok('un jour de la semaine : le dernier passé',r.j===2&&r.h==='20:00',r);
 r=await q('un pain de mie');ok('sans moment : rien d’inventé',r.j==null&&r.h==null,r);

 /* --- sans clé : lecture locale */
 await ev(()=>aller('bouffe'));await sleep(250);
 await saisir('ce matin 2 œufs, 100 g de riz basmati cuit et une banane');
 const l=await ev(()=>({k:UI.r.k,h:UI.r.h,it:UI.r.items.map(i=>[i.n,Math.round(i.g)]),s:UI.r.statut}));
 ok('sans IA : la phrase devient des aliments',l.s==='local'&&l.it.length===3&&l.it[0][0]==='Œufs'&&l.it[0][1]===110&&l.it[1][1]===100&&/Banane/.test(l.it[2][0]),l);
 ok('sans IA : l’heure est reprise',l.h==='08:00'&&l.k===AUJ);
 await p.screenshot({path:path.join(OUT,'saisie-locale.png')});
 await clic('[data-a="fermer-feuille"]');await sleep(350);
 await saisir('zzzz qqqq');ok('sans IA : texte inconnu, message et pas d’enregistrement',await ev(()=>/rien reconnu/.test(document.querySelector('#feuille').textContent)&&document.querySelector('[data-a="repas-ok"]').disabled));await clic('[data-a="fermer-feuille"]');await sleep(350);

 /* --- repas d'hier, avec la clé */
 await ev(c=>{IA.poser(c);rendre();},CLE);
 await saisir('hier soir 2 naans et un karahi');await sleep(600);
 const h=await ev(()=>({k:UI.r.k,h:UI.r.h,n:UI.r.items.length,st:UI.r.statut}));
 ok('repas d’hier : date et heure préremplies, analyse faite',h.k===HIER&&h.h==='20:00'&&h.n===2&&h.st==='ok',h);
 ok('la date se voit avant d’enregistrer',await ev(H=>document.querySelector('#r-date').value===H&&document.querySelector('.quand .puce.on').textContent==='Hier',HIER));
 await p.screenshot({path:path.join(OUT,'repas-hier.png')});
 await clic('[data-a="repas-ok"]');await sleep(400);
 ok('enregistré à la bonne date',await ev(H=>repasDu(H).length===1&&repasDu(H)[0].h==='20:00'&&repasDu(auj()).length===0,HIER));
 ok('on reste sur aujourd’hui, le message dit où c’est allé',/pour hier/.test(await texte('#toast'))&&await ev(()=>!UI.bJour));
 /* navigation dans les jours */
 await clic('[data-a="b-jour"][data-v="-1"]');await sleep(200);ok('jour précédent : son journal, ses calories',await ev(()=>UI.bJour==='2026-11-01'&&document.querySelectorAll('#v-bouffe [data-a="repas-voir"]').length===1&&/Mangé hier/.test(document.querySelector('#v-bouffe').textContent)));
 await p.screenshot({path:path.join(OUT,'bouffe-hier.png')});
 ok('pas d’idées « pour maintenant » sur un jour passé',await ev(()=>!/Idées pour maintenant/.test(document.querySelector('#v-bouffe').textContent)));
 await clic('[data-a="eau"][data-v=".5"]');ok('eau notée sur le jour affiché',await ev(H=>DB.days[H].eau===.5&&!(DB.days[auj()]&&DB.days[auj()].eau),HIER));
 ok('impossible d’aller dans le futur',await ev(()=>{UI.bJour=null;rendre();return document.querySelector('[data-a="b-jour"][data-v="1"]').disabled;}));
 ok('date future refusée dans le repas',await ev(()=>{ouvrirRepas({items:[itemAl('Banane')],sel:0,statut:'main'});const d=document.querySelector('#r-date');d.value='2030-01-01';d.dispatchEvent(new Event('change',{bubbles:true}));return UI.r.k===auj()&&document.querySelector('#r-date').value===auj();}));await sleep(100);
 /* déplacer un repas */
 await clic('[data-a="fermer-feuille"]');await sleep(350);
 await ev(H=>{UI.bJour=H;rendre();},HIER);await clic('[data-a="repas-voir"]');await sleep(300);await clic('[data-a="r-j"][data-d="'+AUJ+'"]');await sleep(150);await clic('[data-a="repas-ok"]');await sleep(400);
 ok('repas déplacé d’hier à aujourd’hui, sans doublon',await ev(H=>repasDu(H).length===0&&repasDu(auj()).length===1,HIER));
 await ev(()=>{UI.bJour=null;rendre();});
 /* tri par heure */
 await ev(()=>{ajouterRepas(auj(),{nom:'Petit-déj',h:'08:00',sel:0,items:[itemAl('Skyr')]});rendre();});ok('journal trié par heure',await ev(()=>repasDu(auj())[0].nom==='Petit-déj'));
 /* repas salé noté après coup */
 await ev(()=>{const k='2026-11-01',s=auj();jour(s).vis={g:3,so:8,eau:3,sel:0,fat:0};ajouterRepas(k,{nom:'Pizza',h:'20:00',sel:1,items:[itemAl('Pizza')]});});ok('repas salé noté après coup : repris dans le visage du lendemain',await ev(()=>DB.days[auj()].vis.sel===1));
 await ev(()=>{DB.days['2026-11-01'].repas=[];delete DB.days[auj()].vis;});

 /* --- favoris et un seul geste */
 await ev(()=>rendre());await clic('[data-a="repas-voir"][data-i="1"]');await sleep(300);await clic('[data-a="r-fav"]');await sleep(100);await clic('[data-a="repas-ok"]');await sleep(400);
 ok('favori créé',await ev(()=>DB.prefs.favoris.length===1&&DB.prefs.favoris[0].nom==='Karahi et naans'));
 ok('favori en tête des raccourcis',await ev(()=>document.querySelector('.q-puces .puce').classList.contains('fav')));
 const n0=await ev(()=>repasDu(auj()).length);await clic('.q-puces .puce');await sleep(250);ok('un seul geste : repas ajouté',await ev(()=>repasDu(auj()).length)===n0+1);
 await p.screenshot({path:path.join(OUT,'bouffe-raccourcis.png')});
 await clic('#toast [data-a="toast-action"]');await sleep(250);ok('et annulable',await ev(()=>repasDu(auj()).length)===n0);
 await clic('[data-a="repas-neuf"]');await sleep(250);await ev(()=>{const i=document.querySelector('#rech-al');i.value='karahi';i.dispatchEvent(new Event('input',{bubbles:true}));});ok('la recherche trouve mes repas',await ev(()=>!!document.querySelector('[data-a="rac-items"]')));
 await clic('[data-a="rac-items"]');await sleep(150);ok('repas entier repris d’un coup',await ev(()=>UI.r.items.length===2));
 await clic('[data-a="r-fois"][data-v=".5"]');await sleep(100);ok('portion × ½',await ev(()=>Math.round(UI.r.items[0].g)===100));
 ok('grammes saisis au clavier',await ev(()=>{const i=document.querySelector('.al-gi');i.value='230';i.dispatchEvent(new Event('input',{bubbles:true}));return UI.r.items[0].g===230&&+document.querySelector('.al input[type=range]').value>=230;}));
 ok('grammes aberrants ignorés',await ev(()=>{const i=document.querySelector('.al-gi');i.value='99999';i.dispatchEvent(new Event('input',{bubbles:true}));return UI.r.items[0].g===230;}));
 await clic('[data-a="fermer-feuille"]');await sleep(350);
 /* supprimer et annuler */
 await clic('[data-a="repas-voir"]');await sleep(300);const nom=await ev(()=>repasDu(auj())[0].nom);await clic('[data-a="repas-suppr"]');await sleep(350);ok('repas supprimé',await ev(n=>!repasDu(auj()).some(r=>r.nom===n),nom));await clic('#toast [data-a="toast-action"]');await sleep(250);ok('suppression annulable',await ev(n=>repasDu(auj()).some(r=>r.nom===n),nom));

 /* --- dictée */
 await ev(()=>{window.__rec=null;window.SpeechRecognition=class{constructor(){window.__rec=this;}start(){}stop(){this.onend&&this.onend();}};rendre();});
 await clic('[data-a="q-micro"]');ok('dictée : le micro s’allume',await ev(()=>document.querySelector('#q-micro').classList.contains('on')));
 await ev(()=>{const R=window.__rec;R.onresult({results:[[{transcript:'hier matin un skyr'}]]});R.onend();});ok('dictée : le texte arrive dans le champ',await ev(()=>document.querySelector('#q-repas').value==='hier matin un skyr'&&!document.querySelector('#q-micro').classList.contains('on')));
 await ev(()=>{window.webkitSpeechRecognition=undefined;window.SpeechRecognition=undefined;document.querySelector('#q-repas').value='';});await clic('[data-a="q-micro"]');await sleep(50);ok('sans dictée : renvoie au micro du clavier',/micro/.test(await texte('#toast')));

 /* --- hors ligne : rien n'est perdu */
 const horsLigne=async v=>{await p.setOfflineMode(v);await ev(v=>Object.defineProperty(navigator,'onLine',{value:!v,configurable:true}),v);};
 await ev(()=>{DB.days[auj()].repas=[];rendre();});await horsLigne(true);appels.length=0;
 await saisir('2 œufs et une banane');
 ok('hors ligne : estimation locale, aucune requête',await ev(()=>UI.r.statut==='attente'&&UI.r.items.length===2&&UI.r.att===1)&&appels.length===0);
 await clic('[data-a="repas-ok"]');await sleep(350);ok('hors ligne : repas noté, marqué à analyser',await ev(()=>{const m=repasDu(auj())[0];return m.att===1&&!!m.txt&&/à analyser/.test(document.querySelector('#v-bouffe').textContent);}));
 await saisir('un truc inconnu xyzzy');ok('hors ligne : texte inconnu quand même notable',await ev(()=>!document.querySelector('[data-a="repas-ok"]').disabled));await clic('[data-a="repas-ok"]');await sleep(350);
 ok('hors ligne : repas sans aliment gardé',await ev(()=>repasDu(auj()).length===2));
 const photo=path.join(__dirname,'..','icon-512.png');
 await (await p.$('#photo-plat')).uploadFile(photo);await sleep(500);ok('photo hors ligne : proposée pour plus tard',await ev(()=>UI.r.statut==='horsligne'&&!!document.querySelector('[data-a="repas-plus-tard"]')));
 await clic('[data-a="repas-plus-tard"]');await sleep(400);ok('photo gardée pour plus tard',await ev(async()=>(await Photos.tout()).filter(x=>x.t==='repas-att').length===1));
 ok('elle n’entre pas dans les albums',await ev(async()=>(await Photos.tout()).filter(x=>typesDe('visage').includes(x.t)||typesDe('corps').includes(x.t)).length===0));
 await horsLigne(false);appels.length=0;await ev(()=>window.dispatchEvent(new Event('online')));await sleep(1200);
 ok('retour du réseau : tout est analysé',appels.length===3&&await ev(async()=>repasDu(auj()).length===3&&repasDu(auj()).every(m=>!m.att&&m.items.length===2)&&(await Photos.tout()).filter(x=>x.t==='repas-att').length===0),appels.length);
 /* coupure pendant l'appel */
 await ev(()=>{DB.days[auj()].repas=[];rendre();});mode='coupe';await saisir('un skyr');await sleep(500);ok('coupure en plein appel : le repas reste notable',await ev(()=>UI.r.statut==='attente'&&UI.r.att===1&&UI.r.items.length===1));mode='ok';await clic('[data-a="fermer-feuille"]');await sleep(350);
 await ev(()=>{DB.days[auj()].repas=[];});

 /* --- séance */
 await ev(()=>{aller('jour');ouvrirSalle(auj());});await sleep(500);
 await clic('[data-a="finir"]');await sleep(200);ok('séance sans série : ne se termine pas',await ev(()=>!jour(auj()).gym.done&&etat(auj())!=='fait')&&/au moins une série/.test(await texte('#toast')));
 const ligne='[...document.querySelectorAll("#seance .serie")].find(r=>r.querySelector("[data-f=kg]"))';
 ok('charge de 8000 kg refusée',await p.evaluate('(()=>{const row='+ligne+';row.querySelector("[data-f=kg]").value="8000";row.querySelector("[data-f=r]").value="5";valider(row);return !row.classList.contains("ok");})()'));
 ok('999 répétitions refusées',await p.evaluate('(()=>{const row='+ligne+';row.querySelector("[data-f=kg]").value="20";row.querySelector("[data-f=r]").value="999";valider(row);return !row.classList.contains("ok");})()'));
 await p.evaluate('(()=>{const row='+ligne+';row.querySelector("[data-f=kg]").value="20,5";row.querySelector("[data-f=r]").value="8";valider(row);})()');await sleep(200);
 ok('série valide : virgule comprise, repos lancé',await ev(()=>{const g=jour(auj()).gym;return nbOk(g)===1&&Object.values(g.ex).flat().some(s=>s&&s.ok&&s.kg===20.5)&&Repos.actif;}));
 /* minuteur de repos */
 await ev(()=>{Repos.fin=Date.now()-1000;Repos.tick();});ok('repos écoulé pendant que l’écran dormait : il sonne au retour',await ev(()=>!Repos.actif&&document.querySelector('#repos').classList.contains('fin')));
 await ev(()=>Repos.start(60,'x'));ok('repos : +15 s',await ev(()=>{const a=Repos.fin;Repos.add(15);return Repos.fin-a===15000;}));await ev(()=>Repos.stop());
 await clic('[data-a="finir"]');await sleep(400);ok('avec une série : se termine',await ev(()=>jour(auj()).gym.done===1&&etat(auj())==='fait'));await clic('[data-a="fin-ok"]');await sleep(500);
 /* jours passés et futurs */
 await ev(()=>{ouvrirSalle('2026-11-08');});await sleep(400);
 ok('séance à venir : pas de bouton Terminer, message clair',await ev(()=>!document.querySelector('[data-a="finir"]')&&/à venir/.test(document.querySelector('#seance').textContent)));
 await ev(()=>{const row=document.querySelector('#seance .serie');const ki=row.querySelector('[data-f="kg"]');if(ki)ki.value='20';row.querySelector('[data-f="r"]').value='8';valider(row);});ok('série refusée sur un jour à venir',await ev(()=>nbOk(jour('2026-11-08').gym)===0));await ev(()=>{Repos.stop();fermerCouche();});await sleep(500);
 ok('jour passé manqué : « Noter cette séance »',await ev(()=>{UI.jour='2026-11-01';rendre();const x=/Noter cette séance/.test(document.querySelector('#hero').textContent);UI.jour=auj();rendre();return x;}));
 await ev(()=>ouvrirSalle('2026-11-01'));await p.evaluate('(()=>{const row='+ligne+';row.querySelector("[data-f=kg]").value="20";row.querySelector("[data-f=r]").value="8";valider(row);Repos.stop();})()');ok('séance notée après coup : pas de durée inventée',await ev(()=>!jour('2026-11-01').gym.debut&&nbOk(jour('2026-11-01').gym)===1));await ev(()=>finirSalle());await sleep(300);ok('bilan sans durée : pas de NaN',await ev(()=>!/NaN/.test(document.querySelector('#feuille').textContent)));await clic('[data-a="fin-ok"]');await sleep(500);

 /* --- on air */
 await ev(()=>ouvrirOnAir('A',auj()));await sleep(300);await clic('[data-a="fin-oa"]');await sleep(300);ok('On Air sans bloc : on demande',await ev(()=>/Aucun bloc/.test(document.querySelector('#feuille').textContent)&&!jour(auj()).onair.done));await clic('#feuille [data-a="fermer-feuille"]');await sleep(350);
 await clic('[data-a="bloc-ok"]');await sleep(100);await clic('[data-a="fin-oa"]');await sleep(400);ok('On Air avec un bloc : enregistré',await ev(()=>jour(auj()).onair.done===1));
 await ev(()=>ouvrirOnAir('B',auj()));await sleep(350);ok('autre On Air le même jour : pas d’écrasement silencieux',await ev(()=>jour(auj()).onair.id==='A'&&/déjà fait On Air A/.test(document.querySelector('#feuille').textContent)));await clic('#feuille [data-a="fermer-feuille"]');await sleep(350);
 await ev(()=>ouvrirOnAir('B',auj()));await sleep(300);await clic('[data-a="oa-remplace"]');await sleep(500);ok('remplacer reste possible',await ev(()=>jour(auj()).onair.id==='B'));await ev(()=>fermerCouche());await sleep(500);
 ok('Entraîner depuis Chrono : reste sur Chrono',await ev(()=>{aller('chrono');document.querySelector('[data-tab="onair"]').click();const u=UI.tab;aller('jour');return u==='chrono';}));

 /* --- photos */
 await ev(()=>{UI.visVue='peau';aller('visage');});await sleep(400);
 const prise=async()=>{await t.ouvrirCam('[data-a="cam-go"]');await sleep(500);await ev(()=>Cam.prendre());await p.waitForFunction(()=>!document.querySelector('#cam'),{timeout:10000});await sleep(500);};
 await prise();await prise();ok('même pose, même jour : la photo est remplacée',await ev(async()=>(await Photos.tout()).filter(x=>x.t==='face').length===1));
 ok('cocher la routine ne recharge pas les photos',await ev(()=>{const z=document.querySelector('#vis-photos'),a=z.firstElementChild;UI.peauM='soir';majPeau();document.querySelector('[data-a="pe-coche"][data-id="ada"]').click();return z.firstElementChild===a&&document.querySelector('[data-a="pe-coche"][data-id="ada"]').getAttribute('aria-pressed')==='true';}));
 ok('routine : pas de reproche pour le soir à midi',await ev(()=>{const j=jour(auj());j.peau.matin={};peau().produits.filter(x=>prevuPeau(x,auj(),'matin')).forEach(x=>{j.peau.matin[x.id]=1;});return suiviPeau(7)===1;}));
 ok('routine : rien coché, pas de pourcentage',await ev(()=>{const s=DB.days[auj()].peau;delete DB.days[auj()].peau;const v=suiviPeau(7);DB.days[auj()].peau=s;return v===null;}));
 await ev(async()=>{const l=await Photos.tout(),b=l[0].blob;await Photos.ajouter({d:'2026-10-12',t:'face',blob:b});await Photos.ajouter({d:'2026-09-21',t:'face',blob:b});await monterAlbum('visage');});await sleep(400);
 ok('frise : toutes les dates, la dernière choisie',await ev(()=>document.querySelectorAll('.ph-frise button').length===3&&document.querySelector('.ph-frise button:last-child').classList.contains('on')));
 await clic('.ph-frise button');await sleep(400);ok('toucher une date la met en « après »',await ev(()=>document.querySelector('.ph-frise button').classList.contains('on')));
 await clic('[data-a="vis-suppr"]');await sleep(400);ok('retirer : celle qui est affichée',await ev(async()=>{const d=(await Photos.tout()).filter(x=>x.t==='face').map(x=>x.d);return d.length===2&&!d.includes('2026-09-21');}));
 await clic('#toast [data-a="toast-action"]');await sleep(500);ok('retrait annulable',await ev(async()=>(await Photos.tout()).filter(x=>x.d==='2026-09-21').length===1));
 ok('stockage refusé : message, pas de plantage',await ev(async()=>{const o=Photos.ajouter;Photos.ajouter=()=>Promise.reject(new Error('plein'));await garderPhoto(new Blob(['x'],{type:'image/jpeg'}),'visage');Photos.ajouter=o;return /refusé/.test(document.querySelector('#toast').textContent);}));
 await ev(async()=>{const c=document.createElement('canvas');c.width=c.height=20;const b=await new Promise(r=>c.toBlob(r,'image/jpeg'));await Photos.ajouter({d:auj(),t:'face',blob:b});await monterAlbum('visage');});

 /* --- export, import */
 ok('export avec photos : fichier complet, date retenue',await ev(async()=>{const o=navigator.canShare,c=URL.createObjectURL;navigator.canShare=()=>false;let taille=0;URL.createObjectURL=b=>{taille=b.size;return c.call(URL,b);};await exporter(true);URL.createObjectURL=c;navigator.canShare=o;return DB.prefs.dernExport===auj()&&taille>1000;}));
 const sauvegarde=await ev(()=>JSON.stringify(DB));
 const ph=await ev(async()=>{const o=[];for(const x of await Photos.tout())o.push({d:x.d,t:x.t,b:await lireBase64(x.blob)});return o;});
 const nbPh=ph.length;
 await ev(()=>{aller('plan');document.querySelector('[data-a="reset"]').click();});await sleep(300);await clic('[data-a="reset-ok"]');await sleep(600);
 ok('tout effacé',await ev(async()=>!Object.keys(DB.days).length&&(await Photos.tout()).length===0));
 await clic('#toast [data-a="toast-action"]');await sleep(300);ok('Tout effacer : annulable pour les données',await ev(()=>Object.keys(DB.days).length>0));
 await clic('[data-a="reset"]');await sleep(300);await clic('[data-a="reset-ok"]');await sleep(600);
 await ev((t,ph)=>{const o=JSON.parse(t);o.photos=ph;return importer(JSON.stringify(o));},sauvegarde,ph);await sleep(500);
 ok('restauration après effacement : jours, réglages et photos reviennent',await ev(async n=>Object.keys(DB.days).length>0&&!!DB.prefs.favoris&&(await Photos.tout()).length===n,nbPh));
 ok('import deux fois : pas de photos en double',await ev(async(t,ph,n)=>{const o=JSON.parse(t);o.photos=ph;await importer(JSON.stringify(o));return(await Photos.tout()).length===n;},sauvegarde,ph,nbPh));
 await ev(async()=>{DB.poids={u:Date.now(),list:[{d:auj(),kg:66}]};await importer(JSON.stringify({days:{},poids:{u:5,list:[{d:'2026-01-01',kg:70},{d:auj(),kg:99}]}}));});ok('import : pesées additionnées, la plus récente gagne',await ev(()=>DB.poids.list.length===2&&DB.poids.list.find(x=>x.d===auj()).kg===66));
 await ev(async()=>{DB.prefs.mens=[{d:'2026-10-01',taille:80}];DB.prefs.u=Date.now();await importer(JSON.stringify({days:{},prefs:{u:5,mens:[{d:'2026-01-01',taille:82}],favoris:[{nom:'Vieux',items:[{n:'x',t:'autre',g:1,m:[1,1,1]}]}]}}));});ok('import : mesures et favoris additionnés',await ev(()=>DB.prefs.mens.length===2&&DB.prefs.favoris.some(f=>f.nom==='Vieux')));
 /* mauvais fichiers */
 for(const[n,x]of[['texte','pas du json'],['tableau','[1,2]'],['sans jours','{"a":1}']]){const a=await ev(()=>JSON.stringify(DB));await ev(x=>importer(x),x);await sleep(100);ok('import refusé : '+n,await ev(()=>JSON.stringify(DB))===a&&/sauvegarde/.test(await texte('#toast')));}
 await ev(async()=>{await importer(JSON.stringify({days:{'2026-02-02':null,'pas-une-date':{u:1},'2026-02-03':{u:5,onair:{id:'Z',done:1},gym:'x',repas:[null,{nom:'Vide'},{nom:'Bon',items:[{n:'a',g:'x',m:[1,1,1]},{n:'b',t:'autre',g:50,m:[1,2,3]}]}],vis:7,boxe:3}},poids:{u:9,list:[{d:'x',kg:1},{d:'2026-02-03',kg:900},null]},prefs:{u:9e15,nutri:{obj:'nimporte',ctx:'non',bonus:'x'},peau:{produits:3},recettes:'x',favoris:[null]}}));});
 ok('import abîmé : ne garde que ce qui est sain',await ev(()=>{const d=DB.days['2026-02-03'];return !DB.days['2026-02-02']&&!DB.days['pas-une-date']&&!d.onair&&!d.gym&&!d.vis&&!d.boxe&&d.repas.length===1&&d.repas[0].items.length===1&&!!PHASES[nutri().obj]&&Array.isArray(peau().produits);}));
 for(const v of['jour','onair','chrono','bouffe','visage','progres','plan']){const ec=await ev(v=>{aller(v);return /n’a pas pu s’afficher/.test(document.querySelector('#v-'+v).textContent);},v);ok('écran '+v+' s’affiche après cet import',!ec);}
 await ev(()=>{UI.visVue='seche';aller('visage');UI.prVue='force';aller('progres');UI.prVue='regul';rendre();});ok('sous-écrans aussi',await ev(()=>!/n’a pas pu s’afficher/.test(document.querySelector('#v-progres').textContent)));
 /* un écran qui plante */
 ok('un écran qui plante : secours, pas de page blanche',await ev(()=>{const o=VUES.bouffe;VUES.bouffe=()=>{throw new Error('test');};aller('bouffe');const x=/n’a pas pu s’afficher/.test(document.querySelector('#v-bouffe').textContent)&&!!document.querySelector('#v-bouffe [data-a="export"]');VUES.bouffe=o;aller('jour');return x;}));
 /* sauvegardes automatiques */
 await ev(()=>Sauve.garder('test-a','Test'));await ev(()=>{aller('plan');document.querySelector('[data-a="import"]').click();});await sleep(500);
 ok('sauvegardes automatiques listées',await ev(()=>document.querySelectorAll('[data-a="sv-rend"]').length>=1));await p.screenshot({path:path.join(OUT,'restaurer.png')});
 await ev(()=>{jour('2026-03-03').u=1;DB.days['2026-03-03'].boxe={st:'fait'};});await clic('[data-a="sv-rend"][data-id="test-a"]');await sleep(500);ok('retour en arrière : état remplacé',await ev(()=>!DB.days['2026-03-03']));
 await clic('#toast [data-a="toast-action"]');await sleep(200);ok('retour en arrière annulable',await ev(()=>!!DB.days['2026-03-03']));
 await ev(async()=>{for(let i=0;i<20;i++)await Sauve.garder('t-'+i,'x');});ok('quatorze sauvegardes au plus',await ev(async()=>(await Sauve.liste()).length===14));
 /* stockage plein */
 ok('stockage plein : prévenu, une seule fois',await ev(()=>{const o=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new DOMException('q','QuotaExceededError');};flush();const m=document.querySelector('#toast').textContent;document.querySelector('#toast').innerHTML='';flush();const s=document.querySelector('#toast').textContent;Storage.prototype.setItem=o;flush();return /Stockage plein/.test(m)&&s===''&&!UI.plein;}));
 /* rappel de sauvegarde */
 ok('rappel de sauvegarde après 14 jours d’usage',await ev(()=>{const a=[];for(let i=0;i<14;i++){const k=iso(addD(fromISO('2026-05-01'),i));jour(k).u=1;a.push(k);}delete DB.prefs.dernExport;DB.prefs.report={corps:'2030-01-01',pesee:'2030-01-01',mesures:'2030-01-01',matin:'2030-01-01'};const x=aFaire().some(o=>o.id==='sauvegarde');a.forEach(k=>delete DB.days[k]);delete DB.prefs.report;return x;}));
 /* le temps qui passe */
 ok('reprise le lendemain : l’écran suit la date, sans attendre',await ev(()=>{jourVu='2026-10-30';UI.jour='2026-10-30';nouveauJour();return UI.jour===auj();}));
 ok('passage à l’heure d’hiver : un jour reste un jour',await ev(()=>Math.round((fromISO('2026-10-26')-fromISO('2026-10-24'))/864e5)===2&&iso(addD(fromISO('2026-10-24'),1))==='2026-10-25'&&iso(addD(fromISO('2026-10-25'),1))==='2026-10-26'&&iso(lundiDe(fromISO('2026-10-25')))==='2026-10-19'));
 ok('passage à l’heure d’été aussi',await ev(()=>iso(addD(fromISO('2027-03-28'),1))==='2027-03-29'&&iso(addD(fromISO('2027-03-27'),1))==='2027-03-28'));
 ok('photo de la galerie prise hier : garde son jour',await ev(async()=>{const c=document.createElement('canvas');c.width=c.height=10;const b=await new Promise(r=>c.toBlob(r,'image/jpeg'));const f=new File([b],'a.jpg',{type:'image/jpeg',lastModified:fromISO('2026-11-01').getTime()});const k=IA.cle();IA.poser('');await photoPlat(f,true);const r=UI.r.k;IA.poser(k);fermerFeuille();return r==='2026-11-01';}));await sleep(350);
 /* données illisibles : doit rester à la fin, la page repart de zéro */
 await p.evaluate(()=>{const s=Storage.prototype.setItem,k=LS;localStorage.setItem(k,'{abîmé');Storage.prototype.setItem=function(a,b){if(a===k)return;return s.call(this,a,b);};});
 await p.reload({waitUntil:'load'});await sleep(800);
 ok('fichier illisible : mis de côté, appli ouverte, restauration proposée',await ev(()=>localStorage.getItem(LS+'.illisible')==='{abîmé'&&!!document.querySelector('#hero')&&/mises de côté/.test(document.querySelector('#toast').textContent)&&!!document.querySelector('#toast [data-a="toast-action"]')));
 await p.screenshot({path:path.join(OUT,'illisible.png')});

 /* --- la vraie sauvegarde de Farhad : import complet, chaque onglet s’affiche */
 const FIXV=path.join(__dirname,'fixtures','sauvegarde-test.json');if(require('fs').existsSync(FIXV)){const VRAIE=require('fs').readFileSync(FIXV,'utf8');
 await ev(async x=>{await importer(x);},VRAIE);await sleep(300);
 ok('vraie sauvegarde : tous les jours importés, macros exactes',await ev(d=>d.every(k=>!!DB.days[k])&&DB.days['2026-11-03'].repas[1].items[0].m[2]===3.3333333333333335,Object.keys(JSON.parse(VRAIE).days)));
 for(const tab of['jour','onair','bouffe','visage','progres']){await ev(x=>aller(x),tab);await sleep(200);ok('vraie sauvegarde : '+tab+' s’affiche',await ev(()=>![...document.querySelectorAll('.vue')].some(v=>/n’a pas pu s’afficher/.test(v.textContent))));}}
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
