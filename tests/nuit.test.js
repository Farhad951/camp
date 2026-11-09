/* Passé minuit : mardi 3 novembre 2026 à 1 h 12, la soirée de lundi n'est pas finie. */
const {preparer,sleep}=require('./commun');const path=require('path');
const LUNDI='2026-11-02',MARDI='2026-11-03';
(async()=>{
 const t=await preparer(8813,'nuit',[],{date:MARDI+'T01:12:00'});const {p,ev,ok,OUT}=t;
 await p.goto(t.url,{waitUntil:'load'});await sleep(500);
 const clic=s=>ev(x=>{const e=document.querySelector(x);if(!e)throw new Error('absent : '+x);e.click();},s);
 const remise=()=>ev(()=>{DB.days={};DB.prefs={u:0,son:1,custom:{w:180,r:60,n:6}};UI.bJour=null;UI.r=null;UI.peauM=null;UI.peauAuj=0;UI.peauNuit=null;UI.eauN=null;if(document.getElementById('feuille').classList.contains('on'))fermerFeuille();UI.tab='jour';aller('bouffe');rendre();});
 const fermer=()=>ev(()=>{if(document.getElementById('feuille').classList.contains('on'))fermerFeuille();});
 const toast=()=>ev(()=>document.querySelector('#toast').textContent);
 const actionToast=()=>clic('#toast [data-a="toast-action"]');
 /* lundi bien rempli : repas du soir, assez de calories, assez d'eau, routine cochée */
 const lundiComplet=()=>ev(l=>{const j=jour(l);j.repas=[{nom:'Dîner',h:'20:30',sel:0,items:[itemAl('Riz basmati cuit',2000),itemAl('Poulet grillé',800)]}];j.eau=4;j.peau={soir:{}};peau().produits.forEach(x=>{if(prevuPeau(x,l,'soir'))j.peau.soir[x.id]=1;});rendre();},l=LUNDI);
 var l=LUNDI;

 ok('il est 1 h 12, mardi',await ev(()=>new Date().getHours()===1&&auj()==='2026-11-03'&&nuit()));
 await remise();
 /* --- repas */
 ok('soirée vide : la proposition apparaît',await ev(()=>/Il est 01:12/.test((document.querySelector('.nuit-prop')||{}).textContent||'')));
 await p.screenshot({path:path.join(OUT,'nuit-bouffe.png')});
 await clic('.nuit-prop [data-a="b-date"]');await sleep(120);
 ok('« Noter pour hier soir » : tout l’écran passe sur hier',await ev(l=>UI.bJour===l&&!document.querySelector('.nuit-prop')&&/Mangé hier/.test(document.querySelector('#v-bouffe').textContent),l));
 ok('sur hier, l’heure par défaut est en fin de soirée, pas à midi',await ev(l=>heureDefaut(l)==='23:30'&&heureDefaut('2026-10-20')==='12:30',l));
 await ev(()=>{ouvrirRepas({items:[itemAl('Skyr',150)],sel:0,statut:'main'});});await sleep(150);await clic('[data-a="repas-ok"]');await sleep(200);
 ok('le repas va sur hier soir, rangé à sa place',await ev(l=>{const r=repasDu(l);return r.length===1&&r[0].h==='23:30'&&!repasDu(auj()).length;},l));
 await clic('[data-a="eau"][data-v=".5"]');await sleep(80);
 ok('l’eau va sur hier',await ev(l=>DB.days[l].eau===.5&&!(DB.days[auj()]&&DB.days[auj()].eau),l));
 await remise();
 /* toast après un repas noté aujourd'hui */
 await ev(()=>{ouvrirRepas({items:[itemAl('Skyr',150)],sel:0,statut:'main'});});await sleep(150);
 ok('feuille du repas : le choix s’appelle « Hier soir »',await ev(l=>/Hier soir/.test(document.querySelector('[data-a="r-j"][data-d="'+l+'"]').textContent),l));
 await clic('[data-a="repas-ok"]');await sleep(200);
 ok('noté aujourd’hui : un geste pour le rendre à hier',/Noter pour hier soir/.test(await toast()),await toast());
 await p.screenshot({path:path.join(OUT,'nuit-toast.png')});
 await actionToast();await sleep(200);
 ok('le repas change de jour, sans doublon',await ev(l=>repasDu(l).length===1&&repasDu(l)[0].h==='23:30'&&repasDu(auj()).length===0,l));
 ok('le toast confirme',/Noté pour hier soir/.test(await toast()),await toast());
 await remise();
 await ev(()=>{const R={nom:'Skyr',items:[itemAl('Skyr',150)],sel:0};UI.rac=[R];const b=document.createElement('button');b.dataset.a='repas-rec';b.dataset.i='0';document.body.appendChild(b);b.click();b.remove();});await sleep(150);
 ok('raccourci en un geste : même proposition',/Noter pour hier soir/.test(await toast()),await toast());
 await actionToast();await sleep(150);
 ok('raccourci : parti sur hier',await ev(l=>repasDu(l).length===1&&!repasDu(auj()).length,l));
 await remise();
 /* feuille : « Hier soir » range à 23 h 30 */
 await ev(()=>{ouvrirRepas({items:[itemAl('Skyr',150)],sel:0,statut:'main'});});await sleep(150);
 await clic('[data-a="r-j"][data-d="'+LUNDI+'"]');await sleep(120);
 ok('choisir « Hier soir » range à 23 h 30, pas à 1 h 12',await ev(()=>UI.r.h==='23:30'));
 await fermer();await remise();
 /* une heure choisie à la main n'est jamais écrasée */
 await ev(()=>{ouvrirRepas({items:[itemAl('Skyr',150)],sel:0,statut:'main',h:'19:40'});});await sleep(120);
 await clic('[data-a="r-j"][data-d="'+LUNDI+'"]');await sleep(100);
 ok('une heure déjà choisie reste',await ev(()=>UI.r.h==='19:40'));
 await fermer();await remise();
 /* saisie écrite */
 const ecrit=async s=>{await ev(s=>{const i=document.querySelector('#q-repas');i.value=s;document.querySelector('[data-a="q-envoi"]').click();},s);await sleep(200);const r=await ev(()=>({k:UI.r.k,h:UI.r.h,n:UI.r.items.map(x=>x.n)}));await fermer();await sleep(80);return r;};
 let r=await ecrit('ce soir, des pâtes');ok('« ce soir » à 1 h : c’est hier soir',r.k===LUNDI&&r.h==='20:00',r);
 r=await ecrit('à 23h, un skyr');ok('« à 23 h » à 1 h : c’est hier',r.k===LUNDI&&r.h==='23:00',r);
 r=await ecrit('au dîner, du riz');ok('« au dîner » à 1 h : c’est hier',r.k===LUNDI,r);
 r=await ecrit('à 1h, un skyr');ok('« à 1 h » : c’est bien aujourd’hui',r.k===MARDI,r);
 r=await ecrit('un skyr');ok('sans précision : aujourd’hui, la proposition suivra',r.k===MARDI,r);
 r=await ecrit('avant-hier soir, du riz');ok('« avant-hier » reste avant-hier',r.k==='2026-11-01',r);
 await remise();
 /* --- eau */
 await clic('[data-a="eau"][data-v=".25"]');await clic('[data-a="eau"][data-v=".25"]');await sleep(60);
 ok('eau notée aujourd’hui : un geste pour hier',/Noter pour hier soir/.test(await toast())&&await ev(()=>DB.days[auj()].eau===.5),await toast());
 await actionToast();await sleep(150);
 ok('eau : tout ce qui vient d’être noté passe sur hier',await ev(l=>DB.days[l].eau===.5&&DB.days[auj()].eau===0,l));
 await clic('[data-a="eau"][data-v=".5"]');await sleep(60);await clic('[data-a="eau"][data-v="-.25"]');await sleep(60);
 ok('eau retirée : le compteur reste juste, aucun transfert ne part de travers',await ev(()=>DB.days[auj()].eau===.25));
 await remise();
 /* --- routine du soir */
 await ev(()=>{aller('visage');UI.visVue='peau';rendre();});await sleep(200);
 ok('routine à 1 h : c’est celle d’hier soir, pas celle du matin',await ev(()=>/Routine d’hier soir/.test(document.querySelector('#pe-haut').textContent)&&document.querySelector('[data-a="pe-m"].on').dataset.v==='soir'));
 await p.screenshot({path:path.join(OUT,'nuit-visage.png')});
 await clic('[data-a="pe-coche"]');await sleep(100);
 ok('la coche compte pour hier',await ev(l=>{const id=document.querySelector('[data-a="pe-coche"]').dataset.id;return DB.days[l].peau.soir[id]===1&&!(DB.days[auj()]&&DB.days[auj()].peau);},l));
 await ev(()=>{document.querySelectorAll('[data-a="pe-coche"]:not(.on)').forEach(b=>{});});
 for(let i=0;i<4;i++){const f=await ev(()=>{const b=document.querySelector('[data-a="pe-coche"]:not(.on)');if(b){b.click();return 1;}return 0;});if(!f)break;await sleep(60);}
 ok('routine finie : on reste sur hier soir, rien ne saute',await ev(()=>/Routine d’hier soir/.test(document.querySelector('#pe-haut').textContent)&&!document.querySelector('[data-a="pe-coche"]:not(.on)')));
 ok('date de début de traitement : prise sur hier',await ev(l=>peau().debut===l,l));
 await remise();
 await ev(()=>{aller('visage');UI.visVue='peau';rendre();});await sleep(200);
 await clic('[data-a="pe-auj"]');await sleep(100);
 ok('« C’est pour aujourd’hui » : retour à la routine du jour',await ev(()=>!document.querySelector('.nuit-peau')&&!!document.querySelector('[data-a="pe-hier"]')));
 await clic('[data-a="pe-coche"]');await sleep(80);
 ok('les coches vont alors sur aujourd’hui',await ev(l=>!!DB.days[auj()].peau&&!(DB.days[l]&&DB.days[l].peau),l));
 await clic('[data-a="pe-hier"]');await sleep(80);
 ok('et un geste pour revenir sur hier soir',await ev(()=>!!document.querySelector('.nuit-peau')));
 await remise();
 await ev(()=>{peau().debut='2026-10-01';aller('jour');rendre();});
 ok('écran du jour : la routine d’hier soir est proposée',await ev(()=>/Routine d’hier soir/.test(document.querySelector('#v-jour').textContent)));
 await remise();
 /* --- la veille est complète : on ne dérange pas */
 await lundiComplet();await ev(()=>{aller('bouffe');rendre();});await sleep(120);
 ok('soirée complète : aucune proposition',await ev(()=>!document.querySelector('.nuit-prop')));
 await ev(()=>{ouvrirRepas({items:[itemAl('Skyr',150)],sel:0,statut:'main'});});await sleep(150);await clic('[data-a="repas-ok"]');await sleep(200);
 ok('soirée complète : le repas reste sur aujourd’hui, avec Annuler',/Annuler/.test(await toast())&&!/hier soir/.test(await toast()),await toast());
 await clic('[data-a="eau"][data-v=".25"]');await sleep(60);
 ok('soirée complète : l’eau reste sur aujourd’hui, sans question',await ev(()=>DB.days[auj()].eau===.25));
 await ev(()=>{aller('visage');UI.visVue='peau';rendre();});await sleep(150);
 ok('soirée complète : la routine affichée est celle du jour',await ev(()=>!document.querySelector('.nuit-peau')&&document.querySelector('[data-a="pe-m"].on').dataset.v==='matin'));
 await remise();
 /* --- repas partiel : dîner noté, mais calories trop basses */
 await ev(l=>{jour(l).repas=[{nom:'Salade',h:'20:00',sel:0,items:[itemAl('Grosse salade',150)]}];jour(l).eau=4;rendre();},l);
 ok('dîner trop léger : la soirée reste ouverte',await ev(()=>manqueHier('repas')&&!manqueHier('eau')&&!!document.querySelector('.nuit-prop')));
 await remise();
 /* --- une allégée lundi : le reste de la semaine reste allégé */
 ok('semaine d’allègement : proposée pour la séance suivante',await ev(l=>{jour(l).gym={sid:'lun',allege:1,ex:{trapbar:[{kg:60,r:4,ok:1}]}};return /semaine d’allègement/.test(raisonAllege(auj())||'');},l));
 await remise();
 /* --- idées de repas : à 1 h, pas de petit-déjeuner */
 ok('à 1 h, les idées ne sont pas un petit-déjeuner',await ev(()=>momentDe(1)==='nuit'&&suggestions(auj()).every(x=>x.r.m==='nuit')));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
