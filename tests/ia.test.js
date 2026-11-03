/* Recettes, produits, peau, corps, bilans et onglets. Service d'IA et Open Food Facts simulés : aucun appel réseau sortant. */
const {preparer,sleep}=require('./commun');const path=require('path');
const CLE='AQ.cle-de-test-pour-les-parcours';
const RECETTE={titre:'Poulet harissa et semoule',temps_min:18,etapes:['Fais cuire le poulet 8 min.','Ajoute la semoule.'],astuce:'Double les quantités pour demain.',ingredients:[{nom:'Blanc de poulet',type:'viande',grammes:180,proteines:40,glucides:0,lipides:3,a_acheter:false},{nom:'Semoule cuite',type:'feculent',grammes:200,proteines:8,glucides:46,lipides:1,a_acheter:false},{nom:'Citron',type:'fruit',grammes:50,proteines:0,glucides:4,lipides:0,a_acheter:true}]};
const PEAU={visible:true,qualite:'bonne',comparable:true,resume:'Quelques boutons sur le menton.',evolution:'mieux',boutons:'leger',points_noirs:'aucun',rougeurs:'leger',secheresse:'modere',zones:['menton'],retours:['Hydrate davantage le soir.'],voir_medecin:false,raison_medecin:''};
const CORPS={visible:true,qualite:'bonne',comparable:true,resume:'Taille plus marquée.',gras_fourchette:'13 à 16 %',changements:[{zone:'Taille',constat:'Moins de volume.',sens:'mieux'},{zone:'Épaules',constat:'Inchangées.',sens:'stable'}],conseils:['Garde tes protéines.'],prudence:''};
const COACH={titre:'Une semaine solide',constats:['2 séances de salle sur 2.'],priorites:[{action:'Dors 8 h',pourquoi:'Ton sommeil baisse.'}]};
(async()=>{
 const t=await preparer(8796,'ia',['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']);const {p,ev,ok,OUT}=t;
 const appels=[];let mode='ok',reponse=null,saturés=0;const hors=[];await p.setRequestInterception(true);
 p.on('request',q=>{const u=q.url(),h={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'};
  if(/generativelanguage\.googleapis\.com/.test(u)){
   if(q.method()==='OPTIONS'){q.respond({status:204,headers:h});return;}
   if(q.method()==='GET'){q.respond({status:mode==='cle'?400:200,headers:h,contentType:'application/json',body:'{}'});return;}
   const b=JSON.parse(q.postData());appels.push({u,h:q.headers(),b});
   if(saturés>0){saturés--;q.respond({status:503,headers:h,body:'{}'});return;}
   if(mode==='429'){q.respond({status:429,headers:h,body:'{}'});return;}
   if(mode==='bloque'){q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify({promptFeedback:{blockReason:'SAFETY'}})});return;}
   q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'réflexion',thought:true},{text:JSON.stringify(reponse)}]}}]})});return;}
  if(/openfoodfacts\.org/.test(u)){
   if(/product\/3033490004743/.test(u))q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify({status:1,product:{product_name:'Skyr nature',brands:'Danone',serving_quantity:150,nutriments:{proteins_100g:10,carbohydrates_100g:4,fat_100g:0.2,salt_100g:.1},ingredients_text:'lait écrémé, ferments'}})});
   else q.respond({status:200,headers:h,contentType:'application/json',body:JSON.stringify({products:[{product_name:'Bonbons',brands:'Marque',nutriments:{proteins_100g:6,carbohydrates_100g:77,fat_100g:0,salt_100g:0},ingredients_text:'sucre, gélatine, arômes'},{product_name:'Sans valeurs',nutriments:{}}]})});
   return;}
  if(!/localhost/.test(u)&&!/^data:|^blob:/.test(u))hors.push(u);
  q.continue();});
 p.on('dialog',d=>{t.ok('aucune alerte injectée',false,d.message());d.dismiss();});
 await p.goto(t.url,{waitUntil:'load'});await sleep(1000);
 const clic=s=>ev(s=>document.querySelector(s).click(),s);
 const ong=async n=>{await clic('[data-tab="'+n+'"]');await sleep(250);};
 const photo=path.join(__dirname,'..','icon-512.png');
 const envoie=async s=>{const i=await p.$(s);await i.uploadFile(photo);};
 const fermer=async()=>{await clic('[data-a="fermer-feuille"]');await sleep(350);};

 /* --- onglets */
 ok('cinq onglets',await ev(()=>[...document.querySelectorAll('.tabs button')].map(b=>b.dataset.tab).join()==='jour,onair,bouffe,visage,progres'));
 ok('Entraîner réunit On Air et Chrono',await ev(()=>{aller('chrono');const on=document.querySelector('.tabs button.on').dataset.tab==='onair',s=[...document.querySelectorAll('[data-a="ent"]')].length===2;aller('jour');return on&&s;}));
 ok('À faire : premières photos proposées',await ev(()=>/premières photos/.test(document.querySelector('#v-jour').textContent)));
 await p.screenshot({path:path.join(OUT,'jour.png'),fullPage:true});
 await clic('[data-a="faire"][data-tab="progres"]');await sleep(300);ok('À faire : mène au bon écran',await ev(()=>UI.tab==='progres'&&!!document.querySelector('#corps-photos')));
 await ong('jour');await clic('[data-a="faire-plus-tard"][data-id="corps"]');await sleep(200);ok('À faire : se reporte',await ev(()=>!aFaire().some(x=>x.id==='corps')));
 await ev(()=>{delete DB.prefs.report;});

 /* --- sans clé */
 await ong('bouffe');
 await clic('[data-a="rc-ouvre"]');await sleep(300);
 ok('recette sans clé : bouton désactivé, invitation',await ev(()=>document.querySelector('[data-a="rc-go"]').disabled&&!!document.querySelector('#feuille [data-a="ia-regler"]')));
 await fermer();
 /* --- clé */
 await clic('[data-a="ia-regler"]');await sleep(300);
 ok('seul Gemini est proposé, aucun service payant',await ev(()=>{const x=document.querySelector('#feuille').textContent;return!/Claude|centimes|sk-ant/.test(x)&&/aucun service payant/.test(x);}));
 ok('la clé fournie est au bon format',await ev(()=>IA.valable('AQ.Ab8RN6-exemple_de_format_long')));
 ok('une ancienne clé payante est ignorée',await ev(()=>{IA.poser('sk-ant-ancienne-cle-tres-longue');const c=IA.cle();IA.poser('');return c==='';}));
 await ev(()=>{document.querySelector('#cle-ia').value='court';document.querySelector('[data-a="ia-ok"]').click();});await sleep(100);ok('format inconnu refusé',await ev(()=>!IA.cle()));
 mode='cle';await ev(c=>{document.querySelector('#cle-ia').value=c;document.querySelector('[data-a="ia-ok"]').click();},CLE);await sleep(400);ok('clé refusée par Google : non gardée',await ev(()=>!IA.cle()));
 mode='ok';await ev(c=>{document.querySelector('#cle-ia').value=c;document.querySelector('[data-a="ia-ok"]').click();},CLE);await sleep(500);ok('clé acceptée',await ev(c=>IA.cle()===c,CLE));
 ok('clé absente de la sauvegarde',await ev(c=>!JSON.stringify(DB).includes(c),CLE));

 /* --- recette */
 reponse=RECETTE;await clic('[data-a="rc-ouvre"]');await sleep(300);
 await ev(()=>{const i=document.querySelector('#rc-in');i.value='Poulet, Semoule ; harissa';document.querySelector('[data-a="rc-ajout"]').click();});await sleep(100);
 ok('plusieurs ingrédients d’un coup',await ev(()=>UI.rc.ing.join()==='Poulet,Semoule,harissa'));
 await clic('[data-a="rc-courant"][data-v="Skyr"]');await sleep(100);ok('produit français courant ajouté',await ev(()=>UI.rc.ing.includes('Skyr')&&!document.querySelector('[data-a="rc-courant"][data-v="Skyr"]')));
 await clic('.puce.on[data-i="3"]');await sleep(100);ok('ingrédient retiré',await ev(()=>!UI.rc.ing.includes('Skyr')));
 await p.screenshot({path:path.join(OUT,'recette-saisie.png')});
 reponse={ingredients:['Œufs','Tomates']};appels.length=0;await envoie('#rc-photo');await sleep(900);
 ok('photo du frigo : ingrédients ajoutés',await ev(()=>UI.rc.ing.includes('Œufs')&&UI.rc.ing.includes('Tomates')));
 ok('photo du frigo : image envoyée en JPEG',!!appels[0].b.contents[0].parts[0].inlineData&&appels[0].b.contents[0].parts[0].inlineData.mimeType==='image/jpeg');
 reponse=RECETTE;appels.length=0;await clic('[data-a="rc-go"]');await sleep(800);
 ok('recette : modèle gratuit, clé en en-tête, jamais dans l’adresse',/gemini-3\.5-flash:generateContent$/.test(appels[0].u)&&appels[0].h['x-goog-api-key']===CLE&&!appels[0].u.includes(CLE));
 const envoye=appels[0].b.systemInstruction.parts[0].text+appels[0].b.contents[0].parts.map(x=>x.text).join('');
 ok('recette : halal et plancher imposés',/halal/.test(envoye)&&/porc/.test(envoye)&&/2300|2 300/.test(envoye));
 ok('recette : ingrédients et reste du jour transmis',/Poulet/.test(envoye)&&/Il a :/.test(envoye)&&/Déjà mangé/.test(envoye));
 ok('recette : sortie structurée demandée',!!appels[0].b.generationConfig.responseJsonSchema);
 const rc=await ev(()=>({n:UI.rc.recette.items.length,a:UI.rc.recette.items[2].a,x:document.querySelector('#feuille').textContent,et:document.querySelectorAll('.rc-et li').length,kc:Math.round(somme(UI.rc.recette.items).k)}));
 ok('recette : quantités, étapes, macros, à acheter',rc.n===3&&rc.a===1&&rc.et===2&&/180 g/.test(rc.x)&&/à acheter/.test(rc.x)&&/paume/.test(rc.x)&&rc.kc===4*48+4*50+9*4,rc.kc);
 await p.screenshot({path:path.join(OUT,'recette.png')});
 await clic('[data-a="rc-garde"]');await sleep(200);ok('recette gardée',await ev(()=>DB.prefs.recettes.length===1));
 reponse=Object.assign({},RECETTE,{titre:'Omelette'});appels.length=0;await clic('[data-a="rc-autre"]');await sleep(700);
 ok('« Une autre » écarte la précédente',/Ne refais pas : Poulet harissa/.test(appels[0].b.contents[0].parts.map(x=>x.text).join('')));
 await clic('[data-a="rc-journal"]');await sleep(300);await clic('[data-a="repas-ok"]');await sleep(400);ok('recette au journal',await ev(()=>repasDu(auj()).some(r=>r.nom==='Omelette')));
 ok('recettes gardées visibles',await ev(()=>/Tes recettes/.test(document.querySelector('#v-bouffe').textContent)));
 await ev(()=>{DB.days[auj()].repas=[];rendre();});

 /* --- repli et erreurs */
 reponse=RECETTE;saturés=2;appels.length=0;await clic('[data-a="rc-ouvre"]');await sleep(250);await clic('[data-a="rc-go"]');await sleep(800);
 ok('modèle saturé : le suivant prend le relais',appels.length===3&&/gemini-3\.5-flash-lite/.test(appels[2].u)&&await ev(()=>!!UI.rc.recette),appels.map(x=>x.u.split('/').pop()));
 mode='429';await clic('[data-a="rc-retour"]');await sleep(100);await clic('[data-a="rc-go"]');await sleep(800);ok('quota épuisé : message clair',await ev(()=>/Limite gratuite/.test(document.querySelector('#feuille').textContent)));mode='ok';await fermer();
 ok('limite quotidienne de sécurité',await ev(async()=>{localStorage.setItem(LS_IA_J,JSON.stringify({d:auj(),n:IA_MAX_JOUR}));let m='';try{await IA.demande({consigne:'x',schema:{},texte:'x'});}catch(e){m=e.message;}localStorage.removeItem(LS_IA_J);return /par jour/.test(m);}));

 /* --- plat : analyse améliorée */
 reponse={pas_un_plat:false,plat:'Pizza au jambon',sel_eleve:true,confiance:'faible',note:'Garniture cachée.',conseil:'Il te reste 90 g de protéines.',halal_doute:'jambon probable',aliments:[{nom:'Pizza',type:'feculent',grammes:300,proteines:30,glucides:90,lipides:30}]};
 await envoie('#photo-galerie');await sleep(900);
 const pl=await ev(()=>document.querySelector('#feuille').textContent);
 ok('plat : fourchette de calories selon la certitude',/entre .* et .* kcal/.test(pl)&&/fragile/.test(pl));
 ok('plat : conseil situé dans la journée',/90 g de protéines/.test(pl));
 ok('plat : doute halal signalé',/À vérifier.*jambon/.test(pl));
 reponse=Object.assign({},reponse,{halal_doute:'',plat:'Pizza végétarienne'});appels.length=0;await ev(()=>{document.querySelector('#r-precis').value='sans jambon, aux légumes';document.querySelector('[data-a="repas-affiner"]').click();});await sleep(800);
 const tx=appels[0].b.contents[0].parts.map(x=>x.text||'').join('');ok('plat : précision et estimation précédente envoyées',/sans jambon/.test(tx)&&/estimation précédente/.test(tx));
 await fermer();
 await clic('[data-a="repas-neuf"]');await sleep(250);appels.length=0;await ev(()=>{document.querySelector('#r-precis').value='2 naans et un karahi';document.querySelector('[data-a="repas-affiner"]').click();});await sleep(800);
 ok('repas décrit sans photo',appels.length===1&&!appels[0].b.contents[0].parts[0].inlineData&&await ev(()=>UI.r.items.length===1));
 /* produit */
 reponse={lisible:true,code_barres:'3033490004743',nom:'',proteines_100g:0,glucides_100g:0,lipides_100g:0,portion_g:0};await envoie('#photo-produit');await sleep(900);
 ok('code-barres : produit français via Open Food Facts',await ev(()=>{const i=UI.r.items[UI.r.items.length-1];return /Skyr nature, Danone/.test(i.n)&&i.g===150&&i.m[0]===10;}));
 reponse={lisible:true,code_barres:'',nom:'Protéines maison',proteines_100g:20,glucides_100g:5,lipides_100g:3,portion_g:50};await envoie('#photo-produit');await sleep(900);
 ok('tableau nutritionnel lu sans code-barres',await ev(()=>{const i=UI.r.items[UI.r.items.length-1];return i.n==='Protéines maison'&&i.g===50&&i.m[0]===20;}));
 await ev(()=>{const r=document.querySelector('#rech-al');r.value='bonbons';r.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(100);await clic('[data-a="off-cherche"]');await sleep(500);
 ok('recherche Open Food Facts : gélatine à vérifier',await ev(()=>/à vérifier : gélatine/.test(document.querySelector('#rech-res').textContent)&&document.querySelectorAll('[data-a="off-prend"]').length===1));
 await clic('[data-a="off-prend"]');await sleep(150);ok('produit ajouté avec son alerte',await ev(()=>!!document.querySelector('.al-douteux')));
 ok('garde-fou : gélatine de poisson non signalée',await ev(()=>!HALAL_DOUTE.test('sucre, gélatine de poisson')&&HALAL_DOUTE.test('gélatine')&&HALAL_DOUTE.test('arôme jambon')&&!HALAL_DOUTE.test('vinaigre')));
 await fermer();
 /* eau */
 await clic('[data-a="eau"][data-v=".5"]');await clic('[data-a="eau"][data-v=".25"]');ok('eau notée',await ev(()=>DB.days[auj()].eau===.75&&/0,75 \/ 3,5 L/.test(document.querySelector('#eau-o').textContent)));
 await ev(()=>{const y=iso(addD(fromISO(auj()),-1));jour(y).eau=2.5;delete DB.days[auj()].vis;});ok('l’eau d’hier remplit la note du matin',await ev(()=>visDu(auj()).eau===2.5));
 await ev(()=>{const y=iso(addD(fromISO(auj()),-2));jour(y).repas=[{nom:'Karahi du dimanche',h:'20:00',sel:0,items:[itemAl('Riz basmati cuit')||itemAl(ALIMENTS[0][0])]}];rendre();});ok('repas récent à refaire',await ev(()=>!!document.querySelector('[data-a="repas-rec"]')));
 await p.screenshot({path:path.join(OUT,'bouffe.png'),fullPage:true});
 ok('Ramadan détecté par le calendrier',await ev(()=>moisHijri(new window.Date(2027,1,20))===9&&moisHijri(new window.Date(2026,10,2))!==9));

 /* --- visage */
 await ong('visage');await sleep(300);
 ok('aucune mention d’alcool, nulle part dans le Visage',await ev(()=>{const x=()=>document.querySelector('#v-visage').textContent;const a=!/alcool/i.test(x());UI.visVue='seche';rendre();const b=!/alcool/i.test(x());const c=[...document.querySelectorAll('#v-visage details')].every(d=>!/alcool/i.test(d.textContent));UI.visVue='peau';rendre();return a&&b&&c&&!FACTEURS.some(f=>/alcool/i.test(f[0]));}));
 ok('anciennes données : champ alcool retiré',await ev(()=>{jour('2026-01-01').vis={g:3,alc:1};flush();charger();const v=DB.days['2026-01-01'].vis;const r=!('alc' in v);delete DB.days['2026-01-01'];return r;}));
 ok('routine : adapalène le soir, Cutacnyl le matin',await ev(()=>{const P=peau().produits;return P.find(x=>x.id==='ada').m==='soir'&&P.find(x=>x.id==='cuta').m==='matin';}));
 await p.screenshot({path:path.join(OUT,'visage-peau.png'),fullPage:true});
 await ev(()=>{UI.peauM='soir';rendre();});await clic('[data-a="pe-coche"][data-id="ada"]');await sleep(200);
 ok('première coche d’adapalène : le traitement démarre',await ev(()=>peau().debut===auj()&&/Semaine 1/.test(document.querySelector('#v-visage .hero').textContent)&&cocheePeau(auj(),'soir','ada')));
 ok('semaine 10 : le bon message',await ev(()=>{peau().debut=iso(addD(fromISO(auj()),-65));return /Semaine 10/.test('Semaine '+etapePeau().s)&&/résultat/.test(etapePeau().t);}));
 await ev(()=>{peau().debut=auj();});
 await clic('[data-a="pe-bout"][data-v="2"]');await sleep(150);await clic('[data-a="pe-irr"][data-v="1"]');await sleep(150);ok('journal de peau',await ev(()=>DB.days[auj()].peau.bout===2&&DB.days[auj()].peau.irr===1));
 await ev(()=>{for(let i=0;i<3;i++){const j=jour(reculer(i));j.peau=j.peau||{};j.peau.irr=2;}rendre();});await sleep(150);
 ok('3 jours d’irritation : proposition, sans décider seul',await ev(()=>!!document.querySelector('[data-a="pe-espace"]')&&peau().produits.find(x=>x.trt).f==='j'));
 await clic('[data-a="pe-espace"]');await sleep(150);ok('un soir sur deux appliqué',await ev(()=>peau().produits.find(x=>x.trt).f==='2j'&&!!(prevuPeau(peau().produits.find(x=>x.trt),'2026-11-02','soir')^prevuPeau(peau().produits.find(x=>x.trt),'2026-11-03','soir'))));
 await ev(()=>{jour(auj()).peau.irr=3;rendre();});await sleep(150);ok('ça brûle : suspendre et demander un avis',await ev(()=>/médecin/.test(document.querySelector('#v-visage').textContent)&&/brûle/.test(document.querySelector('#v-visage').textContent)));
 await ev(()=>{jour(auj()).peau.irr=0;peau().produits.find(x=>x.trt).f='j';rendre();});await sleep(150);
 await clic('[data-a="pe-regler"]');await sleep(300);await ev(()=>{document.querySelector('#pe-nom').value='Crème barrière';document.querySelector('[data-a="pe-ajout"]').click();});await sleep(200);ok('produit personnel ajouté',await ev(()=>peau().produits.some(x=>x.n==='Crème barrière')));
 await p.screenshot({path:path.join(OUT,'peau-reglages.png')});
 await ev(()=>{const m=document.querySelector('[data-pe-m="0"]');m.value='soir';m.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);ok('moment réglable',await ev(()=>peau().produits[0].m==='soir'));await ev(()=>{peau().produits[0].m='ms';});await fermer();
 /* photo de visage : prise, accord, analyse */
 await p.waitForSelector('#vis-photos [data-a="cam-go"]',{timeout:5000});
 await clic('[data-a="cam-go"]');await p.waitForSelector('#cam video',{timeout:20000});await sleep(600);
 appels.length=0;await clic('[data-a="cam-prise"]');await p.waitForFunction(()=>!document.querySelector('#cam'),{timeout:10000});await sleep(500);
 ok('photo de visage gardée',await ev(async()=>(await Photos.tout()).filter(x=>x.t==='face').length===1));
 ok('sans accord : rien n’est envoyé',appels.length===0);
 reponse=PEAU;await clic('[data-a="alb-ia"]');await sleep(300);ok('accord demandé avant le premier envoi',await ev(()=>/Envoyer ces photos à Google/.test(document.querySelector('#feuille').textContent))&&appels.length===0);
 await p.screenshot({path:path.join(OUT,'accord.png')});
 await clic('[data-a="ia-oui"]');await sleep(1000);
 const cp=appels[0];const tp=cp.b.systemInstruction.parts[0].text;
 ok('peau : photo et routine transmises',!!cp.b.contents[0].parts[0].inlineData&&/Adapalène/.test(cp.b.contents[0].parts.map(x=>x.text||'').join('')));
 ok('peau : pas de note de beauté, pas de changement de dose',/Pas de jugement de beauté/.test(tp)&&/Ne dis jamais de changer une dose/.test(tp));
 await p.waitForSelector('#vis-photos .bilan',{timeout:5000});
 ok('retour de peau affiché',await ev(()=>{const x=document.querySelector('#vis-photos .bilan').textContent;return /menton/.test(x)&&/Modéré/.test(x)&&/Hydrate/.test(x);}));
 await ev(()=>document.querySelector('#vis-photos .bilan').scrollIntoView());await p.screenshot({path:path.join(OUT,'peau-bilan.png')});
 ok('retour gardé, photo non',await ev(()=>DB.prefs.iaPeau.length===1&&!JSON.stringify(DB).includes('base64')));
 reponse=Object.assign({},PEAU,{voir_medecin:true,raison_medecin:'Lésions profondes.'});await clic('[data-a="alb-ia"]');await sleep(900);ok('alerte : à montrer au médecin',await ev(()=>/À montrer à ton médecin/.test(document.querySelector('#vis-photos').textContent)&&DB.prefs.iaPeau.length===1));
 mode='bloque';await clic('[data-a="alb-ia"]');await sleep(800);ok('photo refusée par Google : message clair',await ev(()=>/refusé/.test(document.querySelector('#vis-photos').textContent)));mode='ok';
 reponse=Object.assign({},PEAU,{visible:false});await clic('[data-a="alb-ia"]');await sleep(800);ok('pas de visage : message clair',await ev(()=>/ne vois pas ton visage/.test(document.querySelector('#vis-photos').textContent)));

 /* --- progrès */
 await ong('progres');await sleep(400);
 await p.screenshot({path:path.join(OUT,'progres.png'),fullPage:true});
 ok('Progrès : photos en tête',await ev(()=>{const z=document.querySelector('#corps-photos');return !!z&&!!z.querySelector('[data-a="cam-go"][data-alb="corps"]')&&/À toi de commencer/.test(z.textContent);}));
 ok('rythme réglable, 3 semaines par défaut',await ev(()=>joursPhotos('corps')===21&&/3 sem/.test(document.querySelector('#corps-photos').textContent)));
 reponse=CORPS;appels.length=0;
 ok('retardateur de 10 s pour le corps',await ev(()=>ALB.corps.retard===10));
 /* trois poses à la suite, sans attendre le retardateur */
 const prise=async()=>{await clic('#corps-photos [data-a="cam-go"]');await p.waitForSelector('#cam video',{timeout:20000});await sleep(500);ok('caméra corps prête',await ev(()=>document.querySelector('#cam-p').textContent==='Dans 10 secondes'));await ev(()=>Cam.prendre());await p.waitForFunction(()=>!document.querySelector('#cam'),{timeout:10000});await sleep(500);};
 await ev(()=>{DB.prefs.iaAccord.corps=0;});await prise();
 ok('après la face : au tour du profil',await ev(()=>VC.type==='cp'));
 await prise();ok('puis le dos',await ev(()=>VC.type==='cd'));ok('sans accord : pas d’envoi automatique',appels.length===0);
 await ev(()=>{DB.prefs.iaAccord.corps=1;});await prise();await p.waitForSelector('#corps-photos .bilan',{timeout:6000});
 ok('séance complète : analyse automatique',appels.length===1&&appels[0].b.contents[0].parts.filter(x=>x.inlineData).length===3,appels.length);
 ok('bilan : changements, fourchette, conseils',await ev(()=>{const x=document.querySelector('#corps-photos .bilan').textContent;return /Taille/.test(x)&&/Mieux/.test(x)&&/13 à 16 %/.test(x)&&/protéines/.test(x);}));
 ok('date du prochain rappel',await ev(()=>dernPhoto('corps')===auj()&&dansPhotos('corps')===21&&/21 jours/.test(document.querySelector('#corps-photos .pro-p').textContent)));
 ok('Jour : plus de rappel avant 3 semaines',await ev(()=>!aFaire().some(x=>x.id==='corps')));
 /* la fois d'après : comparaison, avec la photo précédente et le premier cliché */
 await ev(async()=>{const l=await Photos.tout();const old=l.filter(x=>typesDe('corps').includes(x.t));for(const x of old){await Photos.retirer(x.id);await Photos.ajouter({d:'2026-09-20',t:x.t,blob:x.blob});await Photos.ajouter({d:'2026-10-11',t:x.t,blob:x.blob});}DB.prefs.dernPhoto.corps='2026-10-11';DB.prefs.iaCorps=[{d:'2026-10-11',r:{resume:'Départ.',changements:[]}}];rendre();});await sleep(500);
 ok('21 jours plus tard : l’appli le propose',await ev(()=>aFaire().some(x=>x.id==='corps')&&/C’est le moment/.test(document.querySelector('#corps-photos').textContent)));
 ok('comparateur du corps',await ev(()=>!!document.querySelector('#corps-photos #comp')));
 appels.length=0;await ev(()=>{VC.type='cf';});await prise();await prise();await prise();await sleep(800);
 const c1=appels[0],im=c1.b.contents[0].parts.filter(x=>x.inlineData).length,tc=c1.b.contents[0].parts.map(x=>x.text||'').join('');
 ok('comparaison : photos du jour, précédentes, et point de départ',im===7,im);
 ok('comparaison : ordre, mesures et retour précédent transmis',/2026-10-11/.test(tc)&&/2026-09-20/.test(tc)&&/Poids moyen/.test(tc)&&/retour précédent/.test(tc));
 ok('corps : pas de note de beauté, garde-fous',/Aucune note de beauté/.test(c1.b.systemInstruction.parts[0].text)&&/diurétique/.test(c1.b.systemInstruction.parts[0].text));
 /* mensurations */
 await clic('[data-a="me-neuf"]');await sleep(300);await ev(()=>{document.querySelector('#me-taille').value='78,5';document.querySelector('#me-bras').value='500';document.querySelector('[data-a="me-ok"]').click();});await sleep(150);ok('mesure aberrante refusée',await ev(()=>!(DB.prefs.mens||[]).length));
 await ev(()=>{document.querySelector('#me-bras').value='34';document.querySelector('[data-a="me-ok"]').click();});await sleep(400);ok('mesures enregistrées',await ev(()=>DB.prefs.mens[0].taille===78.5&&DB.prefs.mens[0].bras===34));
 await ev(()=>{DB.prefs.mens.unshift({d:'2026-10-01',taille:80,bras:33});rendre();});await sleep(300);ok('courbe et écart de tour de taille',await ev(()=>!!document.querySelector('#v-progres .graphe')&&/−1,5/.test(document.querySelector('#v-progres').textContent)));
 /* force */
 await ev(()=>{[35,28,21,14,7].forEach((n,i)=>{const k=reculer(n);jour(k).gym={ex:{incline:[{ok:1,kg:30,r:8}],traction:[{ok:1,kg:10+i*3,r:6}]}};});});
 await clic('[data-a="pr-vue"][data-v="force"]');await sleep(300);
 ok('plateau et hausse détectés',await ev(()=>{const T=tendances();return T.P.some(x=>x.id==='incline')&&T.H.some(x=>x.id==='traction');}));
 ok('force : tonnage et records',await ev(()=>!!document.querySelector('.bn')&&!!document.querySelector('.record')));
 await p.screenshot({path:path.join(OUT,'progres-force.png'),fullPage:true});
 await clic('[data-a="pr-vue"][data-v="regul"]');await sleep(300);ok('régularité : grille conservée',await ev(()=>document.querySelectorAll('.grille-sem .case').length===84));
 await p.screenshot({path:path.join(OUT,'progres-regul.png'),fullPage:true});
 /* bilan */
 reponse=COACH;appels.length=0;await clic('[data-a="coach"]');await sleep(800);
 const co=appels[0].b.contents[0].parts[0].text;ok('bilan : résumé chiffré, sans photo',/tonnage_kg/.test(co)&&/routine_peau_pct/.test(co)&&!appels[0].b.contents[0].parts[0].inlineData);
 ok('bilan affiché et gardé',await ev(()=>DB.prefs.iaCoach.d===auj()&&/Une semaine solide/.test(document.querySelector('#v-progres').textContent)&&/Dors 8 h/.test(document.querySelector('#v-progres').textContent)));
 await ev(()=>{const z=document.querySelector('#v-progres');z.querySelector('.bilan').scrollIntoView({block:'center'});});await sleep(100);await p.screenshot({path:path.join(OUT,'coach.png')});
 /* texte renvoyé jamais interprété */
 ok('texte de l’IA échappé',await ev(()=>{const h=carteBilan('corps',{d:auj(),r:{resume:'<img src=x onerror=alert(1)>',changements:[{zone:'<b>x',constat:'y',sens:'??'}],conseils:['<i>']}});return !/<img/.test(h)&&!/<b>x/.test(h)&&/&lt;img/.test(h);}));
 /* 320 px : rien ne déborde */
 await p.setViewport({width:320,height:640,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 for(const[nom,f]of[['Jour',()=>aller('jour')],['Bouffe',()=>aller('bouffe')],['Visage',()=>{UI.visVue='peau';aller('visage');}],['Progrès',()=>{UI.prVue='corps';aller('progres');}],['Force',()=>{UI.prVue='force';rendre();}]]){await ev(f);await sleep(300);ok('320 px, '+nom+' : pas de défilement horizontal',await ev(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 ok('aucun appel vers un autre service',hors.filter(u=>!/youtube|ytimg/.test(u)).length===0,hors.slice(0,3));
 /* tout effacer */
 await ev(()=>{aller('plan');document.querySelector('[data-a="reset"]').click();});await sleep(300);await clic('[data-a="reset-ok"]');await sleep(500);
 ok('Tout effacer : retours et photos compris',await ev(async()=>(await Photos.tout()).length===0&&!DB.prefs.iaPeau&&!DB.prefs.iaCorps&&!DB.prefs.peau));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
