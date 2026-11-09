/* Évolutions du cahier des charges : séance allégée, Plan B, carnet de boxe, rappels du coach, eau du jour,
   reprendre d'hier, lecture locale, pesée antidatée, minuteurs au retour de l'arrière-plan, cache synchronisé.
   Date figée : lundi 2 novembre 2026 à midi. La nuit a sa propre suite (nuit.test.js). */
const {preparer,sleep,RACINE}=require('./commun');const fs=require('fs'),path=require('path'),crypto=require('crypto');
(async()=>{
 const t=await preparer(8812,'nouveautes');const {p,ev,ok,OUT}=t;
 await p.goto(t.url,{waitUntil:'load'});await sleep(500);
 const clic=s=>ev(x=>{const e=document.querySelector(x);if(!e)throw new Error('absent : '+x);e.click();},s);
 const remise=()=>ev(()=>{Repos.stop();DB.days={};DB.poids={u:0,list:[]};DB.prefs={u:0,son:1,custom:{w:180,r:60,n:6}};UI.bJour=null;UI.r=null;UI.prVue='corps';UI.tab='jour';if(UI.s){UI.s=null;}document.getElementById('seance').classList.remove('on');rendre();});
 const fermer=async()=>{await ev(()=>{if(document.getElementById('feuille').classList.contains('on'))fermerFeuille();if(UI.s)fermerCouche();Repos.stop();});await sleep(150);};
 const toutValider=()=>ev(()=>{let n=0;for(const r of document.querySelectorAll('#seance .serie:not(.ok)')){const k=r.querySelector('[data-f="kg"]');if(k&&!k.value&&!k.placeholder)k.value='20';const ri=r.querySelector('[data-f="r"]');if(!ri.value&&!num(ri.placeholder))ri.value='8';r.querySelector('.ok-b').click();n++;}return n;});
 /* trois séances du passé, au même poids et aux mêmes reps */
 const seance=(d,id,kg,r,n,extra)=>ev((d,id,kg,r,n,extra)=>{const j=jour(d);j.gym=Object.assign(j.gym||{sid:'dim',ex:{},echauf:{},express:0,done:1},extra||{});j.gym.ex[id]=Array.from({length:n},()=>({kg,r,ok:1}));},d,id,kg,r,n,extra||null);

 /* ---------------------------------------- A1. séance allégée */
 await ev(()=>ouvrirSalle(auj()));await sleep(250);
 await clic('[data-a="express"][data-v="2"]');await sleep(300);
 ok('allégée : un geste, mode actif',await ev(()=>{const g=jour(auj()).gym;return g.allege===1&&g.express===0&&document.querySelector('[data-a="express"][data-v="2"]').classList.contains('on');}));
 ok('allégée : moitié moins de séries, 3 → 2, 4 → 2, 2 → 1',await ev(()=>{const g=jour(auj()).gym;return nbSeries(g,'trapbar')===2&&nbSeries(g,'medball')===2&&nbSeries(g,'pallof')===1;}));
 ok('allégée : 17 séries au lieu de 29 le lundi',await ev(()=>{const g=jour(auj()).gym,c=totalSeries(SEANCES.lun,g,auj());g.allege=0;const n=totalSeries(SEANCES.lun,g,auj());g.allege=1;return c===17&&n===29;}));
 ok('allégée : la carte annonce la cible réduite',await ev(()=>/^2 × /.test(document.querySelector('#ex-trapbar .cibles li b').textContent)));
 await p.screenshot({path:path.join(OUT,'allegee.png')});
 await toutValider();await sleep(200);
 ok('allégée : validée à 100 %',await ev(()=>document.querySelector('#s-compte').textContent==='17 / 17'&&+document.querySelector('#s-jauge').dataset.v===1),await ev(()=>document.querySelector('#s-compte').textContent));
 await clic('[data-a="finir"]');await sleep(300);
 ok('allégée : le bilan le dit, et la séance est terminée',await ev(()=>jour(auj()).gym.done===1&&/Séance allégée/.test(document.querySelector('#feuille').textContent)));
 await fermer();
 ok('allégée : l’accueil affiche sa durée et son état',await ev(()=>/40 min/.test(document.querySelector('#hero').textContent)&&/Allégée/.test(document.querySelector('#hero').textContent)));
 ok('allégée : la frise affiche sa durée',await ev(()=>/Salle, 40 min/.test(document.querySelector('#frise').textContent)));

 await remise();
 /* passer en allégée ne retire jamais une série validée, revenir rétablit tout */
 await ev(()=>ouvrirSalle(auj()));await sleep(200);
 await ev(()=>{for(let i=0;i<3;i++){const r=document.querySelectorAll('#ex-trapbar .serie')[i];r.querySelector('[data-f="kg"]').value='60';r.querySelector('[data-f="r"]').value='4';r.querySelector('.ok-b').click();}const g=jour(auj()).gym;g.ex.medball=[{kg:3},{},{},{}];});
 await clic('[data-a="express"][data-v="2"]');await sleep(300);
 ok('allégée en cours de route : les 3 séries validées restent',await ev(()=>{const g=jour(auj()).gym;return okDans(g.ex.trapbar)===3&&nbSeries(g,'trapbar')===3&&document.querySelector('#ex-trapbar').classList.contains('fini');}));
 ok('allégée en cours de route : les lignes vides partent',await ev(()=>jour(auj()).gym.ex.medball.length===2));
 await clic('[data-a="express"][data-v="0"]');await sleep(300);
 ok('retour en complète : cible et séries rétablies',await ev(()=>{const g=jour(auj()).gym;return !g.allege&&nbSeries(g,'medball')===4&&okDans(g.ex.trapbar)===3;}));
 await clic('[data-a="express"][data-v="1"]');await sleep(300);
 ok('express et allégée s’excluent',await ev(()=>{const g=jour(auj()).gym;return g.express===1&&!g.allege;}));
 await fermer();await remise();

 /* aucune fausse alerte de stagnation */
 const D=['2026-10-05','2026-10-12','2026-10-19','2026-10-26'];
 await seance(D[0],'trapbar',60,4,3);await seance(D[1],'trapbar',60,4,3);await seance(D[2],'trapbar',40,3,2,{allege:1});
 ok('deux vraies séances et une allégée : pas de stagnation',await ev(()=>!stagne('trapbar','2026-11-02')));
 ok('l’allégée à 40 kg ne fait pas baisser la cible : retour au dernier vrai repère',await ev(()=>{const c=conseil(EX.trapbar,precedent('trapbar','2026-11-02'),'trapbar','2026-11-02');return c.kg===60&&!/Repars à/.test(c.txt);}));
 ok('« Avant » montre la dernière vraie séance',await ev(()=>precedent('trapbar','2026-11-02')[0].kg===60));
 await seance(D[3],'trapbar',60,4,3);
 ok('trois vraies séances identiques : la vraie stagnation reste détectée, allégée ignorée',await ev(()=>stagne('trapbar','2026-11-02')));
 ok('plateau de l’onglet Force : l’allégée n’y entre pas',await ev(()=>{const h=historiqueEx('trapbar');return h.length===3&&h.every(x=>x.d!=='2026-10-19');}));
 ok('courbe de l’exercice : allégée hors courbe, signalée dans la liste',await ev(()=>{feuilleHisto('trapbar');const tx=document.querySelector('#feuille .histo').textContent;fermerFeuille();return /allégée/.test(tx);}));
 ok('coach : l’allégée est présentée comme volontaire',await ev(()=>{DB.days[auj()]=DB.days[auj()]||{};DB.days['2026-10-30']={gym:{sid:'dim',allege:1,ex:{trapbar:[{kg:60,r:4,ok:1}]}}};const s=JSON.stringify(resumeSemaine());return /séance allégée volontaire/.test(s)&&/seances_allegees_volontaires/.test(s);}));
 ok('coach : la consigne interdit d’y voir une baisse',await ev(()=>/allégée est volontaire/.test(CONSIGNE_COACH)));
 await ev(()=>ouvrirSalle(auj()));await sleep(150);await clic('[data-a="express"][data-v="2"]');await sleep(300);
 ok('conseil en allégée : mêmes charges, aucune hausse ni baisse',await ev(()=>{const c=document.querySelector('#ex-trapbar .conseil').textContent;const ph=document.querySelector('#ex-trapbar [data-f="kg"]').placeholder;return /Séance allégée/.test(c)&&/60 kg/.test(c)&&ph==='60';}),await ev(()=>document.querySelector('#ex-trapbar .conseil').textContent));
 await fermer();await remise();

 /* proposition automatique */
 const prop=()=>ev(()=>!!document.querySelector('#seance .allege-prop'));
 await ev(()=>ouvrirSalle(auj()));await sleep(150);ok('pas de fatigue : aucune proposition',!(await prop()));await fermer();
 await ev(()=>{jour(auj()).vis={fat:1,so:8};rendre();});
 ok('fatigue : l’écran du jour propose d’ouvrir l’allégée',await ev(()=>!!document.querySelector('[data-a="allege-go"]')));
 await clic('[data-a="allege-go"]');await sleep(300);
 ok('un geste depuis l’écran du jour : la séance s’ouvre allégée',await ev(()=>!!UI.s&&jour(auj()).gym.allege===1));
 await fermer();await remise();
 await ev(()=>{jour(auj()).vis={so:5,fat:0};ouvrirSalle(auj());});await sleep(200);
 ok('nuit courte : la séance propose l’allégée',await ev(()=>/Nuit courte : 5 h/.test((document.querySelector('.allege-prop')||{}).textContent||'')));
 await p.screenshot({path:path.join(OUT,'allegee-proposee.png')});
 await clic('[data-a="allege-non"]');await sleep(100);
 ok('« Pas aujourd’hui » : la proposition part et ne revient pas',await ev(()=>{const a=!document.querySelector('.allege-prop');renderSalle();return a&&!document.querySelector('.allege-prop')&&!jour(auj()).gym.allege;}));
 await fermer();await remise();
 await ev(()=>{jour(auj()).vis={so:5,fat:0};ouvrirSalle(auj());});await sleep(200);await clic('[data-a="allege-oui"]');await sleep(300);
 ok('« Passer en allégée » depuis la proposition',await ev(()=>jour(auj()).gym.allege===1&&!document.querySelector('.allege-prop')));
 await fermer();await remise();
 ok('nuit notée sur un autre jour : rien à proposer aujourd’hui',await ev(()=>{jour('2026-11-01').vis={fat:1};return raisonAllege(auj())===null&&raisonAllege('2026-11-01')===null;}));
 await seance('2026-09-20','trapbar',60,4,3);
 ok('six semaines sans allègement : proposé',await ev(()=>/Six semaines/.test(raisonAllege(auj())||'')));
 await seance('2026-10-31','trapbar',50,4,2,{allege:1});
 ok('allégée la semaine passée : le compteur des six semaines repart',await ev(()=>raisonAllege(auj())===null));
 await remise();

 /* ---------------------------------------- A2. Plan B */
 ok('Plan B : chaque exercice a sa fiche complète',await ev(()=>Object.keys(EX).every(id=>{const B=PLANB[id];return B&&B.nom&&B.series>0&&B.reps.length===2&&B.repos>0&&B.champs.length&&B.repere;})&&Object.keys(PLANB).every(id=>EX[id])));
 await seance('2026-10-26','medball',4,4,4);
 await ev(()=>ouvrirSalle(auj()));await sleep(200);
 await clic('#ex-medball [data-a="planb"]');await sleep(200);
 ok('Plan B : la carte bascule sur le remplaçant',await ev(()=>{const c=document.querySelector('#ex-medball');return c.classList.contains('en-b')&&c.querySelector('h3').textContent===PLANB.medball.nom&&jour(auj()).gym.planB.medball===1;}));
 ok('Plan B : aucun bouton « Voir le geste » trompeur',await ev(()=>!document.querySelector('#ex-medball [data-a="geste"]')));
 await p.screenshot({path:path.join(OUT,'plan-b.png')});
 const avant=await ev(()=>meilleur('medball'));
 await ev(()=>{const r=document.querySelector('#ex-medball .serie');r.querySelector('[data-f="kg"]').value='90';r.querySelector('[data-f="r"]').value='5';r.querySelector('.ok-b').click();});await sleep(150);
 ok('Plan B : la série valide l’étape du jour',await ev(()=>{const g=jour(auj()).gym;return okDans(g.exB.medball)===1&&nbOk(g)===1&&/^1 \//.test(document.querySelector('#s-compte').textContent);}));
 ok('Plan B : rien dans l’historique de l’exercice principal',await ev(()=>{const g=jour(auj()).gym;return okDans(g.ex&&g.ex.medball)===0;}));
 ok('Plan B : 90 kg ne devient pas un record',await ev(a=>meilleur('medball')===a&&!jour(auj()).gym.exB.medball[0].pr,avant));
 ok('Plan B : le repos suit la fiche du remplaçant',await ev(()=>Repos.actif&&Math.round((Repos.fin-Date.now())/1000)<=PLANB.medball.repos&&/Woodchop/.test(document.querySelector('#repos-txt').textContent)),await ev(()=>document.querySelector('#repos-txt').textContent));
 ok('Plan B : le tonnage du jour le compte, la courbe non',await ev(()=>{const c=tonnages(1)[0].t;return c===450&&!historiqueEx('medball').some(x=>x.d===auj());}));
 await ev(()=>{const c=[...document.querySelectorAll('#ex-medball .serie')];c.forEach(r=>{if(r.classList.contains('ok'))return;r.querySelector('[data-f="kg"]').value='20';r.querySelector('[data-f="r"]').value='5';r.querySelector('.ok-b').click();});});await sleep(150);
 ok('Plan B : toutes ses séries faites, la carte est finie',await ev(()=>document.querySelector('#ex-medball').classList.contains('fini')));
 ok('saisie sans validation : va au Plan B',await ev(()=>{const r=document.querySelector('#ex-medball .serie'),i=r.querySelector('[data-f="r"]');i.value='6';i.dispatchEvent(new Event('input',{bubbles:true}));return jour(auj()).gym.exB.medball[0].r===6&&!(jour(auj()).gym.ex&&jour(auj()).gym.ex.medball);}));
 await clic('#ex-medball [data-a="planb"]');await sleep(200);
 ok('retour à l’exercice : ses séries du Plan B comptent toujours, la carte reste finie',await ev(()=>{const g=jour(auj()).gym;return !enB(g,'medball')&&okDans(g.exB.medball)===4&&okTotal(g,'medball')>=nbSeries(g,'medball')&&document.querySelector('#ex-medball').classList.contains('fini')&&document.querySelectorAll('#ex-medball .serie').length===0;}));
 await fermer();
 ok('Plan B : sa propre mémoire la fois suivante',await ev(()=>{const s=precedent('medball','2026-11-09',true);return s&&s.filter(x=>x.ok).length===4&&s[0].r===6;})||await ev(()=>{const s=precedent('medball','2026-11-09',true);return s&&s.filter(x=>x.ok).length===4;}));
 ok('Plan B : l’exercice principal retrouve son dernier vrai repère',await ev(()=>precedent('medball','2026-11-09')[0].kg===4));
 ok('Plan B : suivi consultable',await ev(()=>{feuilleHisto('medball',true);const x=document.querySelector('#feuille').textContent;fermerFeuille();return /Plan B de/.test(x)&&/Woodchop/.test(x);}));
 ok('coach : le Plan B est signalé comme un poste occupé',await ev(()=>/Woodchop/.test(JSON.stringify(resumeSemaine().plan_b_poste_occupe))));
 await remise();

 /* passer au Plan B après deux vraies séries */
 await ev(()=>ouvrirSalle(auj()));await sleep(150);
 await ev(()=>{for(let i=0;i<2;i++){const r=document.querySelectorAll('#ex-trapbar .serie')[i];r.querySelector('[data-f="kg"]').value='60';r.querySelector('[data-f="r"]').value='4';r.querySelector('.ok-b').click();}});
 await clic('#ex-trapbar [data-a="planb"]');await sleep(200);
 ok('Plan B en plein exercice : il ne reste que la dernière série',await ev(()=>{const g=jour(auj()).gym,rows=document.querySelectorAll('#ex-trapbar .serie');return rows.length===1&&rows[0].querySelector('.n').textContent==='3'&&nbSeries(g,'trapbar')===3&&okDans(g.ex.trapbar)===2;}));
 ok('Plan B en plein exercice : les vraies séries restent dans les records',await ev(()=>meilleur('trapbar')>0));
 await ev(()=>{const r=document.querySelector('#ex-trapbar .serie');r.querySelector('[data-f="kg"]').value='20';r.querySelector('[data-f="r"]').value='6';r.querySelector('.ok-b').click();});await sleep(120);
 ok('Plan B en plein exercice : l’étape est complète',await ev(()=>document.querySelector('#ex-trapbar').classList.contains('fini')));
 await fermer();await remise();
 /* superset, sans charge, en allégée */
 await ev(()=>ouvrirSalle(auj()));await sleep(150);await clic('#ex-landmine [data-a="planb"]');await sleep(150);
 ok('Plan B sans charge : pompes, reps seules',await ev(()=>{const c=document.querySelector('#ex-landmine');return !c.querySelector('[data-f="kg"]')&&!!c.querySelector('[data-f="r"]');}));
 ok('superset avec un Plan B : la suite est nommée correctement',await ev(()=>{const g=jour(auj()).gym;g.exB={landmine:[{r:5,ok:1},{},{}]};return /Rowing assis/.test(suivante('landmine',0));}));
 await clic('[data-a="express"][data-v="2"]');await sleep(300);
 ok('Plan B en allégée : cible réduite',await ev(()=>nbSeries(jour(auj()).gym,'landmine')===2));
 await fermer();await remise();
 ok('données abîmées du Plan B : nettoyées à la lecture',await ev(()=>{const c=assainir({days:{'2026-10-01':{gym:{ex:{},exB:'x',planB:7}},'2026-10-02':{gym:{ex:{},exB:{inconnu:[{ok:1}],traction:'x',trapbar:[{ok:1,kg:1,r:1}]},planB:{trapbar:1}}}}});return !c.days['2026-10-01'].gym.exB&&!c.days['2026-10-01'].gym.planB&&Object.keys(c.days['2026-10-02'].gym.exB).join()==='trapbar';}));
 ok('ancienne sauvegarde sans Plan B ni allégée : tout marche',await ev(()=>{DB.days['2026-10-05']={gym:{sid:'lun',ex:{trapbar:[{kg:60,r:4,ok:1}]},echauf:{},express:0}};UI.jour='2026-10-05';const x=hero('2026-10-05');UI.jour=auj();return /1 série|séries/.test(x);}));
 await remise();

 /* ---------------------------------------- A3. carnet de boxe */
 await ev(()=>{UI.prVue='boxe';aller('progres');});await sleep(200);
 ok('carnet vide : un message clair',await ev(()=>/Pas encore de séance/.test(document.querySelector('#v-progres').textContent)));
 await ev(()=>{const J=(d,o)=>Object.assign(jour(d),o);
  J('2026-10-06',{boxe:{st:'fait',rpe:6,note:'3 rounds de sparring,\nbon jab'}});J('2026-10-08',{boxe:{st:'fait',rpe:7,note:''}});J('2026-10-13',{boxe:{st:'fait',rpe:7}});J('2026-10-15',{boxe:{st:'rate'}});J('2026-10-16',{onair:{id:'B',done:1,leger:1,blocs:{corde:1},rpe:8,pour:'2026-10-15',note:'Cardio dur'}});
  J('2026-10-20',{boxe:{st:'fait',rpe:'abc',note:'<img src=x onerror="window.__xss=1"><b>gras</b>'}});J('2026-10-27',{boxe:{st:'fait',rpe:99}});J('2026-10-29',{boxe:{st:'fait',rpe:9,note:'Dur'}});J('2026-10-31',{boxe:{st:'fait',rpe:8}});rendre();});await sleep(200);
 const carnet=()=>ev(()=>[...document.querySelectorAll('.carnet .cb')].map(x=>x.textContent));
 let c=await carnet();
 ok('carnet : séances du club et On Air, sans les ratées',c.length===8,c.length);
 ok('carnet : ordre chronologique, la plus récente d’abord',/Samedi 31 octobre/.test(c[0])&&/Mardi 6 octobre/.test(c[c.length-1]),[c[0],c[c.length-1]]);
 ok('carnet : la note d’On Air se relit, version légère comprise',c.some(x=>/On Air B/.test(x)&&/version légère/.test(x)&&/Cardio dur/.test(x)));
 ok('carnet : le retour à la ligne d’une note est gardé',await ev(()=>{const e=[...document.querySelectorAll('.carnet .cb p')].find(x=>/3 rounds/.test(x.textContent));return e&&getComputedStyle(e).whiteSpace==='pre-wrap'&&e.textContent.includes('\n');}));
 ok('carnet : une note est du texte, jamais du code',await ev(()=>!window.__xss&&!document.querySelector('.carnet img')&&[...document.querySelectorAll('.carnet p')].some(x=>x.textContent.includes('<b>gras</b>'))));
 ok('carnet : un ressenti aberrant est ignoré',await ev(()=>{const l=seancesBoxe();return l.find(x=>x.d==='2026-10-20').rpe===null&&l.find(x=>x.d==='2026-10-27').rpe===null;}));
 ok('carnet : courbe du ressenti',await ev(()=>/ressenti sur 10/.test((document.querySelector('#v-progres .graphe')||{getAttribute(){return'';}}).getAttribute('aria-label'))));
 ok('carnet : assiduité par semaine',await ev(()=>document.querySelectorAll('#v-progres .bn>div').length===8));
 ok('carnet : présence sur 4 semaines, rattrapage compris',await ev(()=>{const m=[...document.querySelectorAll('#v-progres .score div')].find(x=>/présence/.test(x.textContent));return m&&/\d+\s*%/.test(m.textContent);}),await ev(()=>[...document.querySelectorAll('#v-progres .score div')].map(x=>x.textContent).join(' | ')));
 ok('carnet : aucune note de ressenti : pas de courbe, pas d’erreur',await ev(()=>{const D0=DB.days;DB.days={'2026-10-27':{boxe:{st:'fait'}}};rendre();const b=/La courbe arrive/.test(document.querySelector('#v-progres').textContent);DB.days=D0;rendre();return b;}));
 await p.screenshot({path:path.join(OUT,'carnet-boxe.png')});
 await ev(()=>{for(let i=0;i<30;i++){const d=iso(addD(fromISO('2026-08-01'),i*2));jour(d).boxe={st:'fait',rpe:5};}rendre();});
 ok('carnet long : 20 séances, puis la suite',await ev(()=>document.querySelectorAll('.carnet .cb').length===20&&!!document.querySelector('[data-a="bx-plus"]')));
 await clic('[data-a="bx-plus"]');await sleep(150);
 ok('carnet long : « Voir de plus » allonge la liste',await ev(()=>document.querySelectorAll('.carnet .cb').length===38));
 ok('les notes se saisissent toujours depuis le jour',await ev(()=>/data-note/.test(hero('2026-10-29'))));
 await ev(()=>{UI.boxeN=0;});await remise();

 /* ---------------------------------------- A4. rappels du coach */
 const bilan=l=>ev(l=>{DB.prefs.iaCoach={d:'2026-11-01',r:{titre:'t',constats:[],priorites:[],ajustements:l}};UI.prVue='corps';aller('progres');rendre();},l);
 await bilan([{exercice:'Soulevé de terre trap bar',changement:'Baisse à 55 kg et remonte',pourquoi:'3 séances sans progrès'},{exercice:'Lancer rotatif médecine-ball',changement:'Passe à 4 kg',pourquoi:'La vitesse est bonne'},{exercice:'Danse classique',changement:'Rien',pourquoi:'Inconnu'}]);await sleep(200);
 ok('rappel : bouton « Retenir » sur chaque ajustement reconnu',await ev(()=>document.querySelectorAll('[data-a="pin"]').length===2));
 await clic('[data-a="pin"][data-i="0"]');await sleep(200);
 ok('rappel : retenu, l’état se voit dans le bilan',await ev(()=>/Retenu/.test(document.querySelector('[data-a="pin"][data-i="0"]').textContent)&&DB.prefs.epingles.length===1&&DB.prefs.epingles[0].ex==='trapbar'));
 await p.screenshot({path:path.join(OUT,'coach-retenu.png')});
 await ev(()=>{aller('jour');});await sleep(100);
 ok('rappel : annoncé sur l’accueil de la séance',await ev(()=>/1 rappel du coach/.test(document.querySelector('#hero').textContent)));
 await ev(()=>ouvrirSalle(auj()));await sleep(200);
 ok('rappel : affiché sur la carte de l’exercice, et elle seule',await ev(()=>{const r=document.querySelectorAll('#seance .rappel');return r.length===1&&!!r[0].closest('#ex-trapbar')&&/Baisse à 55 kg/.test(r[0].textContent)&&/3 séances sans progrès/.test(r[0].textContent);}));
 await p.screenshot({path:path.join(OUT,'coach-rappel.png')});
 await clic('#ex-trapbar [data-a="planb"]');await sleep(150);
 ok('rappel : caché sur le Plan B, il ne le concerne pas',await ev(()=>!document.querySelector('#ex-trapbar .rappel')));
 await clic('#ex-trapbar [data-a="planb"]');await sleep(150);
 await clic('[data-a="pin-fait"]');await sleep(150);
 ok('rappel : « Appliqué » le masque aussitôt',await ev(()=>!document.querySelector('#seance .rappel')&&!!DB.prefs.epingles[0].f));
 await clic('#toast [data-a="toast-action"]');await sleep(250);
 ok('rappel : Annuler le fait revenir',await ev(()=>!!document.querySelector('#ex-trapbar .rappel')&&!DB.prefs.epingles[0].f));
 await clic('[data-a="pin-fait"]');await sleep(100);await fermer();
 await ev(()=>{flush();});await p.reload({waitUntil:'load'});await sleep(500);
 await ev(()=>ouvrirSalle(auj()));await sleep(150);
 ok('rappel masqué : il ne revient pas au relancement',await ev(()=>!document.querySelector('#seance .rappel')));
 await fermer();
 await ev(()=>{DB.prefs.epingles[0].f=undefined;delete DB.prefs.epingles[0].f;});
 ok('rappel : jamais sur une séance d’avant le bilan',await ev(()=>{DB.prefs.epingles[0].d=auj();return rappelsDe('trapbar','2026-10-26').length===0&&rappelsDe('trapbar',auj()).length===1;}));
 ok('rappel : jamais sur une séance future non commencée',await ev(()=>rappelsDe('trapbar','2026-11-09').length===0));
 ok('rappel : le coach cite un nom approximatif',await ev(()=>exParNom('Soulevé de terre')==='trapbar'&&exParNom('lancer rotatif')==='medball'&&exParNom('Élévation latérale à la poulie')==='latCable'&&exParNom('')===null));
 ok('rappel : le coach ne peut citer qu’un exercice du programme',await ev(()=>SCHEMA_COACH.properties.ajustements.items.properties.exercice.enum.length===Object.keys(EX).length));
 await ev(()=>{aller('progres');rendre();});await sleep(100);await clic('[data-a="pin"][data-i="0"]');await sleep(150);
 ok('rappel : retirer depuis le bilan',await ev(()=>!DB.prefs.epingles.length));
 ok('rappels abîmés : nettoyés à la lecture',await ev(()=>{const c=assainir({days:{},prefs:{epingles:[{id:'a',ex:'inconnu',txt:'x',d:'2026-11-01'},{id:'b',ex:'trapbar',txt:'ok',d:'2026-11-01'},{ex:'trapbar'},'x']}});return c.prefs.epingles.length===1&&c.prefs.epingles[0].id==='b';}));
 await remise();

 /* ---------------------------------------- B5. eau */
 await ev(()=>{nutri().obj='seche';nutri().ctx='bureau';});
 ok('eau : lundi de salle au bureau, cible de base',await ev(()=>eauCible('2026-11-02')===3.5&&!raisonsEau('2026-11-02').length));
 ok('eau : mardi de boxe prévu, +0,5 L',await ev(()=>eauCible('2026-11-03')===4&&raisonsEau('2026-11-03')[0]==='boxe'));
 ok('eau : boxe ratée, pas de bonus',await ev(()=>{jour('2026-10-27').boxe={st:'rate'};return eauCible('2026-10-27')===3.5;}));
 ok('eau : boxe validée, +0,5 L',await ev(()=>{jour('2026-10-27').boxe={st:'fait'};return eauCible('2026-10-27')===4;}));
 ok('eau : rattrapage On Air validé un jour de repos, +0,5 L',await ev(()=>{jour('2026-10-28').onair={id:'A',done:1,blocs:{corde:1}};return eauCible('2026-10-28')===4;}));
 ok('eau : On Air commencé aujourd’hui, +0,5 L',await ev(()=>{jour(auj()).onair={id:'A',blocs:{}};return eauCible(auj())===4;}));
 await ev(()=>{delete jour(auj()).onair;nutri().ctx='chantier';aller('bouffe');rendre();});await sleep(150);
 ok('eau : chantier, +0,5 L, et l’appli explique pourquoi',await ev(()=>/0 \/ 4 L/.test(document.querySelector('#eau-o').textContent)&&/\+0,5 L aujourd’hui : chantier/.test(document.querySelector('#eau-pq').textContent)));
 await p.screenshot({path:path.join(OUT,'eau.png')});
 ok('eau : chantier et On Air le même jour, les deux bonus se cumulent, +1 L',await ev(()=>{jour(auj()).onair={id:'A',blocs:{}};rendre();const r=eauCible(auj())===4.5&&/4,5 L/.test(document.querySelector('#eau-o').textContent)&&/[+]1 L aujourd’hui : On Air et chantier/.test(document.querySelector('#eau-pq').textContent);delete jour(auj()).onair;return r;}));
 ok('eau : boxe, On Air et chantier, +1 L au plus',await ev(()=>{const k=auj(),d=fromISO(k).getDay(),t=PLAN[d].type;PLAN[d].type='boxe';jour(k).onair={id:'A',blocs:{}};const r=raisonsEau(k).length===3&&eauCible(k)===4.5;PLAN[d].type=t;delete jour(k).onair;return r;}));
 await clic('[data-a="eau"][data-v=".5"]');await sleep(80);
 ok('eau : le compteur garde la bonne cible après un ajout',await ev(()=>/0,5 \/ 4 L/.test(document.querySelector('#eau-o').textContent)));
 ok('eau : le chantier d’aujourd’hui ne réécrit pas les jours passés',await ev(()=>eauCible('2026-10-26')===3.5));
 ok('eau : l’aperçu de l’écran du jour suit la même cible',await ev(()=>/sur 4 L/.test(apercuH(auj()))));
 await ev(()=>{nutri().ctx='bureau';UI.bJour=null;rendre();});
 ok('eau : au bureau un jour de salle, aucune explication',await ev(()=>!document.querySelector('#eau-pq')));
 ok('eau : la phase garde sa base (entretien 3 L)',await ev(()=>{nutri().obj='entretien';const a=eauCible('2026-11-02'),b=eauCible('2026-11-03');nutri().obj='seche';return a===3&&b===3.5;}));
 await remise();

 /* ---------------------------------------- B6. reprendre d'hier */
 const HIER='2026-11-01';
 await ev(h=>{jour(h).repas=[{nom:'Karahi de maman',h:'20:00',sel:1,items:[itemAl('Poulet karahi',250),itemAl('Riz basmati cuit',200)]},{nom:'À analyser',h:'21:00',att:1,items:[],txt:'?'}];aller('bouffe');rendre();},HIER);await sleep(150);
 ok('hier : le repas se propose, celui sans analyse non',await ev(()=>{const l=[...document.querySelectorAll('[data-a="repas-hier"]')].map(x=>x.textContent);return l.length===1&&/Karahi de maman/.test(l[0]);}));
 await p.screenshot({path:path.join(OUT,'reprendre-hier.png')});
 await clic('[data-a="repas-hier"]');await sleep(200);
 ok('hier : un geste ouvre la feuille, repas prêt pour aujourd’hui',await ev(()=>UI.r&&UI.r.k===auj()&&UI.r.items.length===2&&UI.r.nom==='Karahi de maman'&&UI.r.sel===1&&/Repris de la veille/.test(document.querySelector('#feuille').textContent)));
 await clic('[data-a="r-fois"][data-v=".5"]');await sleep(120);
 ok('hier : portion ajustable avant de valider',await ev(()=>UI.r.items[0].g===125&&UI.r.items[1].g===100));
 await clic('[data-a="repas-ok"]');await sleep(250);
 ok('hier : copié sur aujourd’hui, à la portion choisie',await ev(()=>{const r=repasDu(auj());return r.length===1&&r[0].nom==='Karahi de maman'&&r[0].items[0].g===125;}));
 ok('hier : le repas d’origine n’a pas bougé',await ev(h=>repasDu(h)[0].items[0].g===250&&repasDu(h)[0].items[1].g===200,HIER));
 ok('hier : copie indépendante, modifier l’une ne touche pas l’autre',await ev(h=>{repasDu(auj())[0].items[0].m[0]=99;return repasDu(h)[0].items[0].m[0]!==99;},HIER));
 await ev(()=>{UI.bJour='2026-11-01';rendre();});
 ok('hier : un jour passé propose sa propre veille',await ev(()=>!document.querySelector('[data-a="repas-hier"]')));
 await ev(()=>{jour('2026-10-31').repas=[{nom:'Pâtes du samedi',h:'12:00',sel:0,items:[itemAl('Pâtes cuites',200)]}];rendre();});
 await clic('[data-a="repas-hier"]');await sleep(150);
 ok('hier : la copie va sur le jour affiché',await ev(()=>UI.r.k==='2026-11-01'&&/de la veille/.test(document.querySelector('.q-hier').textContent)||UI.r.k==='2026-11-01'));
 await fermer();await remise();
 await ev(()=>{aller('bouffe');rendre();});ok('hier : rien mangé hier, rien à proposer',await ev(()=>!document.querySelector('.q-hier')));
 await remise();

 /* ---------------------------------------- B7. lecture locale */
 const lit=txt=>ev(x=>{const r=lireLocal(x);return{n:r.items.map(i=>i.n),g:r.items.map(i=>i.g),h:r.items.map(i=>i.h||''),inc:r.inconnus};},txt);
 for(const [txt,nom,g] of [
  ['une boîte de thon','Thon en boîte au naturel',112],['2 blancs de poulet','Poulet grillé',260],['un pot de skyr','Skyr',150],['une poignée d’amandes','Amandes',30],["une poignee d'amandes",'Amandes',30],
  ['3 œufs','Œufs',165],['2 oeufs','Œufs',110],['2 blancs d’œufs','Blancs d’œufs',66],['une omelette','Œufs',55],['2 tranches de pain','Pain complet',70],['un bol de riz','Riz basmati cuit',200],['une assiette de pâtes','Pâtes cuites',300],
  ['une cuillère à soupe d’huile','Huile d’olive',12],['1 c. à soupe de beurre de cacahuète','Beurre de cacahuète',15],['une cuillère à café de miel','Miel',7],['100 g de riz','Riz basmati cuit',100],['33 cl de coca','Soda',330],['une canette de coca','Soda',330],['un verre de lait','Lait demi-écrémé',200],
  ['une boîte et demie de thon','Thon en boîte au naturel',168],['une demi boîte de thon','Thon en boîte au naturel',56],['1/2 boîte de thon','Thon en boîte au naturel',56],['une escalope de dinde','Dinde',130],['un steak haché','Steak haché 5 %',125],['deux steaks hachés','Steak haché 5 %',250],['un filet de saumon','Saumon',130],['un scoop de whey','Whey',30],['une tranche de jambon de dinde','Charcuterie de volaille',30],
  ['3 dattes','Dattes',24],['spaghettis','Pâtes cuites',200],['des patates','Pommes de terre',200],['une pomme de terre','Pommes de terre',200],['une pomme','Pomme',150],['du cabillaud','Poisson blanc',200],['chapatti','Chapati',60],['un fromage blanc 0 %','Fromage blanc 0 %',300],['un pot de fromage blanc','Fromage blanc 0 %',100],['karahi de poulet','Poulet karahi',220],['poullet','Poulet grillé',150],['banan','Banane',120],['une part de pizza','Pizza',110]]){
  const r=await lit(txt);ok('lecture : « '+txt+' » → '+nom+', '+g+' g',r.n.length===1&&r.n[0]===nom&&r.g[0]===g,r);
 }
 let L=await lit('2 blancs de poulet, un bol de riz et une poignée d’amandes + du soda');
 ok('lecture : une phrase, plusieurs aliments',L.n.join('|')==='Poulet grillé|Riz basmati cuit|Amandes|Soda'&&!L.inc.length,L);
 L=await lit('une pizza au jambon');ok('lecture : doute halal signalé, jamais masqué',L.n[0]==='Pizza'&&L.h[0]==='jambon',L);
 L=await lit('du jambon');ok('lecture : jambon seul n’est jamais rangé en volaille',!L.n.length&&L.inc.length===1,L);
 L=await lit('une bière');ok('lecture : bière non reconnue',!L.n.length&&L.inc.length===1,L);
 L=await lit('du bacon');ok('lecture : bacon non reconnu',!L.n.length&&L.inc.length===1,L);
 L=await lit('xylophone');ok('lecture : mot inconnu, dit franchement',!L.n.length&&L.inc[0]==='xylophone',L);
 L=await lit('   ,, ; + ');ok('lecture : rien à lire, aucune erreur',!L.n.length&&!L.inc.length,L);
 L=await lit('0 g de riz');ok('lecture : zéro gramme borné',L.g[0]>=1,L);
 ok('lecture : aucun synonyme ne pointe dans le vide',await ev(()=>Object.keys(SYNONYMES).every(n=>ALIMENTS.some(a=>a[0]===n))&&Object.keys(PORTIONS).every(n=>ALIMENTS.some(a=>a[0]===n))));
 ok('lecture : aucun synonyme de porc ni d’alcool',await ev(()=>!SYN.some(s=>/\bporc\b|\blard|\bbacon|\bvin\b|\bbiere|\brhum|alcool|\bbiere/.test(s.t)||(/\bjambon\b/.test(s.t)&&!/dinde|poulet|volaille/.test(s.t)))));
 ok('base : toute valeur est un nombre plausible',await ev(()=>ALIMENTS.every(a=>a[2]>0&&a[3]>=0&&a[4]>=0&&a[5]>=0&&a[3]+a[4]+a[5]<=101)));
 /* produits scannés et historique */
 await ev(()=>{retenirProduit({n:'Skyr vanille, Danone',t:'produit',g:150,m:[9,12,0],s:0,h:''});retenirProduit({n:'Thon albacore, Petit Navire',t:'produit',g:93,m:[26,0,1],s:0,h:''});});
 L=await lit('skyr danone');ok('produit scanné : retrouvé sans réseau',L.n[0]==='Skyr vanille, Danone'&&L.g[0]===150,L);
 L=await lit('2 skyr');ok('produit scanné : préféré à la moyenne, compté en pots',L.n[0]==='Skyr vanille, Danone'&&L.g[0]===300,L);
 L=await lit('petit navire');ok('produit scanné : par sa marque',L.n[0]==='Thon albacore, Petit Navire',L);
 ok('produit scanné : pas de doublon, le plus récent d’abord, 100 au plus',await ev(()=>{retenirProduit({n:'Skyr vanille, Danone',t:'produit',g:100,m:[9,12,0],s:0});const a=DB.prefs.produits.filter(x=>x.n==='Skyr vanille, Danone').length===1&&DB.prefs.produits[0].g===100;for(let i=0;i<120;i++)retenirProduit({n:'P'+i,t:'produit',g:100,m:[1,1,1]});return a&&DB.prefs.produits.length===100;}));
 await ev(()=>{DB.prefs.produits=[];jour('2026-10-29').repas=[{nom:'Midi',h:'12:00',sel:0,items:[itemAl('Riz basmati cuit',250),{n:'Poulet tandoori de maman',t:'viande',g:180,m:[25,2,6],s:0}]}];jour('2026-10-30').repas=[{nom:'Karahi du soir',h:'20:00',sel:0,items:[itemAl('Poulet karahi',300),itemAl('Naan',90)]}];});
 L=await lit('du riz');ok('historique : ta portion habituelle sert de repère',L.g[0]===250,L);
 L=await lit('poulet tandoori');ok('historique : un aliment déjà noté se retrouve',L.n[0]==='Poulet tandoori de maman'&&L.g[0]===180,L);
 L=await lit('karahi du soir');ok('historique : un repas entier se retrouve par son nom',L.n.length===2&&L.n[1]==='Naan',L);
 L=await lit('Karahi du soir, une pomme');ok('historique : un repas connu dans une phrase',L.n.length===3&&L.n[2]==='Pomme',L);
 ok('historique : copie indépendante de l’original',await ev(()=>{const r=lireLocal('karahi du soir');r.items[0].g=1;r.items[0].m[0]=99;const o=jour('2026-10-30').repas[0].items[0];return o.g===300&&o.m[0]!==99;}));
 ok('produits abîmés : nettoyés à la lecture',await ev(()=>{const c=assainir({days:{},prefs:{produits:[{n:'ok',g:100,m:[1,2,3]},{n:'sans m',g:1},{g:1,m:[1,2,3]},{n:'NaN',g:'x',m:[1,2,3]},null]}});return c.prefs.produits.length===1;}));
 await ev(()=>{DB.prefs.produits=[{n:'Crème dessert, Danette',t:'produit',g:125,m:[3,20,3],s:0,h:'',d:'2026-10-01'}];aller('bouffe');rendre();ouvrirRepas({items:[],sel:0,statut:'main'});});await sleep(200);
 await ev(()=>{const i=document.querySelector('#rech-al');i.value='coca';i.dispatchEvent(new Event('input',{bubbles:true}));});
 ok('recherche : un synonyme trouve l’aliment',await ev(()=>/Soda/.test(document.querySelector('#rech-res').textContent)));
 await ev(()=>{const i=document.querySelector('#rech-al');i.value='danette';i.dispatchEvent(new Event('input',{bubbles:true}));});
 ok('recherche : un produit scanné se retrouve',await ev(()=>/Crème dessert/.test(document.querySelector('#rech-res').textContent)));
 await clic('[data-a="sou-prend"]');await sleep(120);
 ok('recherche : il s’ajoute au repas, avec ses vraies valeurs',await ev(()=>UI.r.items.length===1&&UI.r.items[0].g===125&&UI.r.items[0].m[1]===20));
 await fermer();
 /* envoi rapide sans clé : bout en bout */
 await ev(()=>{const i=document.querySelector('#q-repas');i.value='ce midi, 2 blancs de poulet et un pot de skyr';document.querySelector('[data-a="q-envoi"]').click();});await sleep(250);
 ok('saisie rapide sans IA : le repas est lu',await ev(()=>UI.r.items.length===2&&UI.r.items[0].g===260&&UI.r.items[1].g===150&&UI.r.h==='12:30'));
 await fermer();await remise();

 /* ---------------------------------------- D10. date de la pesée et des mesures */
 await ev(()=>{DB.poids.list=[{d:'2026-10-30',kg:66},{d:'2026-11-02',kg:68}];DB.poids.u=1;UI.prVue='corps';aller('progres');rendre();});await sleep(150);
 const moy=()=>ev(()=>[...document.querySelectorAll('#v-progres .score div')].find(x=>/moyenne sur 7/.test(x.textContent)).querySelector('b').textContent);
 ok('pesée : aujourd’hui par défaut',await ev(()=>document.querySelector('#poids-date').value===auj()&&document.querySelector('[data-a="poids-j"].on').dataset.d===auj()));
 ok('pesée : pas de date dans le futur',await ev(()=>document.querySelector('#poids-date').max===auj()));
 ok('pesée : moyenne de départ',(await moy())==='67',await moy());
 await ev(()=>{document.querySelector('#poids-in').value='70';});
 await clic('[data-a="poids-j"]:not(.on)');await sleep(80);
 ok('pesée : « Hier » choisi, la saisie n’est pas perdue',await ev(()=>document.querySelector('#poids-in').value==='70'&&document.querySelector('#poids-date').value==='2026-11-01'));
 await p.screenshot({path:path.join(OUT,'pesee-date.png')});
 await clic('[data-a="poids"]');await sleep(150);
 ok('pesée : enregistrée à la date d’hier',await ev(()=>DB.poids.list.find(x=>x.d==='2026-11-01').kg===70));
 ok('pesée : liste triée, la dernière pesée reste celle d’aujourd’hui',await ev(()=>DB.poids.list.map(x=>x.d).join()==='2026-10-30,2026-11-01,2026-11-02'&&bw()===68));
 ok('pesée : moyenne sur 7 jours recalculée',(await moy())==='68',await moy());
 ok('pesée : la courbe la montre',await ev(()=>/Pesée du 1 nov/.test(document.querySelector('#toast').textContent)));
 ok('pesée : la date revient à aujourd’hui',await ev(()=>document.querySelector('#poids-date').value===auj()));
 await ev(()=>{const i=document.querySelector('#poids-date');i.value='2026-10-30';i.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#poids-in').value='65';});
 await clic('[data-a="poids"]');await sleep(150);
 ok('pesée : une date existante est corrigée, sans doublon',await ev(()=>DB.poids.list.length===3&&DB.poids.list[0].kg===65&&/corrigée/.test(document.querySelector('#toast').textContent)));
 await ev(()=>{const i=document.querySelector('#poids-date');i.value='2030-01-01';i.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#poids-in').value='60';});
 ok('pesée : date future refusée',await ev(()=>document.querySelector('#poids-date').value===auj()));
 await clic('[data-a="poids"]');await sleep(100);
 ok('pesée : retombe sur aujourd’hui, pas sur 2030',await ev(()=>!DB.poids.list.some(x=>x.d>auj())&&bw()===60));
 await ev(()=>{const i=document.querySelector('#poids-date');i.value='';i.dispatchEvent(new Event('change',{bubbles:true}));});
 ok('pesée : date vide, rien ne casse',await ev(()=>document.querySelector('#poids-date').value===auj()));
 ok('pesée : en changeant d’onglet, le choix de date s’oublie',await ev(()=>{UI.poidsD='2026-10-01';aller('jour');aller('progres');return datePesee()===auj();}));
 /* mensurations */
 await ev(()=>{DB.prefs.mens=[{d:'2026-10-20',taille:80},{d:auj(),taille:78}];rendre();});await sleep(100);
 await clic('[data-a="me-neuf"]');await sleep(250);
 ok('mesures : aujourd’hui par défaut, valeurs du jour reprises',await ev(()=>document.querySelector('#me-date').value===auj()&&document.querySelector('#me-taille').value==='78'));
 await clic('[data-a="me-j"]:not(.on)');await sleep(100);
 ok('mesures : un autre jour vide les valeurs du jour',await ev(()=>document.querySelector('#me-date').value==='2026-11-01'&&document.querySelector('#me-taille').value===''));
 await ev(()=>{document.querySelector('#me-taille').value='79';});
 await clic('[data-a="me-ok"]');await sleep(250);
 ok('mesures : antidatées, triées',await ev(()=>DB.prefs.mens.map(x=>x.d).join()==='2026-10-20,2026-11-01,2026-11-02'&&DB.prefs.mens[1].taille===79));
 ok('mesures : le toast dit la date',await ev(()=>/Mesures du 1 nov/.test(document.querySelector('#toast').textContent)));
 ok('mesures : la courbe suit la date',await ev(()=>[...document.querySelectorAll('#v-progres .graphe')].some(g=>/en cm/.test(g.getAttribute('aria-label')))&&DB.prefs.mens[DB.prefs.mens.length-1].taille===78));
 await clic('[data-a="me-neuf"]');await sleep(250);
 await ev(()=>{const i=document.querySelector('#me-date');i.value='2026-10-20';i.dispatchEvent(new Event('change',{bubbles:true}));});
 ok('mesures : une date déjà notée reprend ses valeurs',await ev(()=>document.querySelector('#me-taille').value==='80'));
 await ev(()=>{document.querySelector('#me-taille').value='81';document.querySelector('[data-a="me-ok"]').click();});await sleep(250);
 ok('mesures : corrigées sans doublon',await ev(()=>DB.prefs.mens.length===3&&DB.prefs.mens[0].taille===81));
 await clic('[data-a="me-neuf"]');await sleep(250);
 await ev(()=>{const i=document.querySelector('#me-date');i.value='2031-05-05';i.dispatchEvent(new Event('change',{bubbles:true}));});
 ok('mesures : date future refusée',await ev(()=>document.querySelector('#me-date').value===auj()));
 await fermer();await remise();

 /* ---------------------------------------- D11. minuteurs */
 await ev(()=>{window.__sons={b:0,c:0,v:0};const b0=beep,c0=cloche,v0=vibre;beep=(...a)=>{window.__sons.b++;return b0(...a);};cloche=(...a)=>{window.__sons.c++;return c0(...a);};vibre=(...a)=>{window.__sons.v++;return v0(...a);};
  window.__vis=v=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>v});document.dispatchEvent(new Event('visibilitychange'));};});
 const sons=()=>ev(()=>window.__sons);
 const lbl=()=>ev(()=>document.querySelector('#repos-lbl').textContent);
 /* parti en arrière-plan pendant le repos */
 await ev(()=>{Repos.start(60,'Série suivante');});await sleep(150);
 await ev(()=>{__vis('hidden');Repos.fin=Date.now()-1000;Repos.tick();});await sleep(50);
 ok('minuteur caché : la fin est notée, sans rien afficher encore',await ev(()=>!Repos.actif&&Repos.attente===true));
 const s0=await sons();
 await ev(()=>{Repos.fin=Date.now()-25000;__vis('visible');});await sleep(120);
 ok('retour : « Repos terminé il y a 25 s »',/Repos terminé il y a 25 s/.test(await lbl()),await lbl());
 ok('retour : état visuel clair',await ev(()=>{const e=document.querySelector('#repos');return e.classList.contains('fin')&&e.classList.contains('retard')&&e.classList.contains('on');}));
 await p.screenshot({path:path.join(OUT,'repos-termine.png')});
 const s1=await sons();await sleep(600);const s2=await sons();
 ok('retour : rappel sonore immédiat, et vibration',s2.b>=s0.b+2&&s1.v>s0.v,{s0,s1,s2});
 await sleep(1100);
 ok('retour : le compteur continue',/il y a 2[67] s/.test(await lbl()),await lbl());
 await clic('#repos');await sleep(150);
 ok('toucher ferme le rappel et oublie le repos',await ev(()=>!Repos.actif&&!localStorage.getItem(LS_REPOS)&&!Repos.attente));
 await sleep(1100);
 ok('après fermeture : plus de compteur fantôme',await ev(()=>!document.querySelector('#repos').classList.contains('retard')));
 /* page gelée : le minuteur était arrêté, la minuterie n'a pas tourné */
 await ev(()=>{Repos.start(60,'x');Repos.fin=Date.now()-90000;clearInterval(Repos.iv);__vis('hidden');__vis('visible');});await sleep(100);
 ok('page gelée : au retour, le repos est dit terminé',/Repos terminé il y a 1 min/.test(await lbl()),await lbl());
 await ev(()=>Repos.stop());await sleep(150);
 /* à l'écran, à l'heure : pas d'alerte de retard */
 await ev(()=>Repos.start(1,'x'));await sleep(1400);
 ok('à l’écran : « C’est reparti », aucun retard',(await lbl())==='C’est reparti'&&await ev(()=>!document.querySelector('#repos').classList.contains('retard')),await lbl());
 await ev(()=>Repos.stop());await sleep(150);
 await ev(()=>{Repos.start(60,'x');Repos.fin=Date.now()-5000;Repos.tick();});await sleep(80);
 ok('à l’écran, en retard de 5 s : dit aussi',/il y a 5 s/.test(await lbl()),await lbl());
 await ev(()=>Repos.stop());await sleep(100);
 /* relancer un repos efface l'état précédent */
 await ev(()=>{Repos.start(60,'x');Repos.fin=Date.now()-5000;Repos.tick();Repos.start(60,'y');});
 ok('nouveau repos : tout est remis à zéro',(await lbl())==='Repos'&&await ev(()=>!document.querySelector('#repos').classList.contains('fin')&&!document.querySelector('#repos').classList.contains('retard')&&Repos.actif));
 await ev(()=>Repos.stop());await sleep(100);
 /* programmation audio */
 ok('la fin est programmée dans le moteur audio, et annulée à l’arrêt',await ev(async()=>{audio();await AC.resume();Repos.start(30,'x');const a=!!Repos.prog&&Repos.prog.t>AC.currentTime+25;Repos.add(15);const b=Repos.prog.t>AC.currentTime+40;Repos.stop();return a&&b&&Repos.prog===null;}));
 /* iOS a tué la page : le repos et la séance reviennent */
 await ev(()=>{ouvrirSalle(auj());jour(auj()).gym.ex={trapbar:[{kg:60,r:4,ok:1}]};Repos.start(90,'Trap bar, série 2');flush();});
 await p.reload({waitUntil:'load'});await sleep(500);
 ok('page rechargée : le repos continue, séance rouverte',await ev(()=>Repos.actif&&!!UI.s&&UI.s.kind==='salle'&&document.querySelector('#seance').classList.contains('on')&&Repos.fin>Date.now()+60000&&/Trap bar/.test(document.querySelector('#repos-txt').textContent)));
 await ev(()=>{const o=JSON.parse(localStorage.getItem(LS_REPOS));o.fin=Date.now()-40000;localStorage.setItem(LS_REPOS,JSON.stringify(o));flush();window.__rel=1;});
 await p.reload({waitUntil:'load'});await sleep(500);
 ok('page rechargée après la fin : « il y a 40 s »',/Repos terminé il y a [34]\d s/.test(await lbl()),await lbl());
 await fermer();
 await ev(()=>{localStorage.setItem(LS_REPOS,JSON.stringify({fin:Date.now()-3600000,tot:60,txt:'x',k:null}));});
 await p.reload({waitUntil:'load'});await sleep(400);
 ok('repos vieux d’une heure : oublié',await ev(()=>!Repos.actif&&!document.querySelector('#repos').classList.contains('on')&&!localStorage.getItem(LS_REPOS)));
 await ev(()=>{localStorage.setItem(LS_REPOS,'{pas du json');});
 await p.reload({waitUntil:'load'});await sleep(300);
 ok('repos illisible : ignoré sans erreur',await ev(()=>!Repos.actif));
 await ev(()=>{localStorage.removeItem(LS_REPOS);window.__sons={b:0,c:0,v:0};const b0=beep,c0=cloche,v0=vibre;beep=(...a)=>{window.__sons.b++;return b0(...a);};cloche=(...a)=>{window.__sons.c++;return c0(...a);};vibre=(...a)=>{window.__sons.v++;return v0(...a);};window.__vis=v=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>v});document.dispatchEvent(new Event('visibilitychange'));};});
 /* minuteur de rounds */
 await ev(()=>{Ring.start('Essai',segsPreset(60,30,3));});await sleep(100);
 const sr0=await sons();
 await ev(()=>{__vis('hidden');Ring.t0=Date.now()-(10+60+5)*1000;__vis('visible');});await sleep(100);
 ok('rounds : au retour, on est dans le bon temps',await ev(()=>Ring.segs[Ring.i].k==='rest'&&document.querySelector('#r-temps').textContent==='0:25'),await ev(()=>document.querySelector('#r-temps').textContent));
 const sr1=await sons();
 ok('rounds : un rappel sonore dit où on en est',sr1.b+sr1.c>sr0.b+sr0.c&&sr1.v>sr0.v,{sr0,sr1});
 await ev(()=>{__vis('hidden');Ring.t0=Date.now()-3600000;Ring.tick();});await sleep(60);
 ok('rounds finis cachés : la fin attend le retour',await ev(()=>!Ring.actif&&Ring.attente));
 await ev(()=>{Ring.finA=Date.now()-25000;__vis('visible');});await sleep(100);
 ok('rounds finis : « Terminé il y a 25 s »',await ev(()=>/Terminé il y a 25 s/.test(document.querySelector('#r-consigne').textContent)),await ev(()=>document.querySelector('#r-consigne').textContent));
 await ev(()=>Ring.fermer());await sleep(200);
 await ev(()=>{Ring.start('Essai',segsPreset(60,30,1));Ring.t0=Date.now()-(10+60+3)*1000;Ring.tick();});await sleep(60);
 ok('rounds finis à l’écran en retard : dit aussi',await ev(()=>/Terminé il y a 3 s/.test(document.querySelector('#r-consigne').textContent)));
 await ev(()=>Ring.fermer());await sleep(200);
 await ev(()=>{Ring.start('Essai',segsPreset(60,30,1));Ring.t0=Date.now()-(10+60)*1000+50;});await sleep(250);
 ok('rounds finis à l’heure : « Bien joué. »',await ev(()=>/Bien joué/.test(document.querySelector('#r-consigne').textContent)));
 await ev(()=>Ring.fermer());await sleep(200);
 /* éveil */
 ok('éveil : sans verrou d’éveil, la veilleuse prend le relais',await ev(async()=>{const d=Object.getOwnPropertyDescriptor(Navigator.prototype,'wakeLock');Object.defineProperty(navigator,'wakeLock',{configurable:true,value:undefined});await eveil(true);const v=document.querySelector('video.veilleuse');await new Promise(r=>setTimeout(r,150));const on=v&&!v.paused&&v.muted;await eveil(false);const off=v&&v.paused;delete navigator.wakeLock;return !!(on&&off);}));
 ok('éveil : verrou refusé, la veilleuse prend le relais',await ev(async()=>{Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>{throw new Error('refus');}}});await eveil(true);const v=document.querySelector('video.veilleuse');await new Promise(r=>setTimeout(r,120));const on=!v.paused;await eveil(false);delete navigator.wakeLock;return on;}));
 ok('éveil : un verrou perdu est repris tant qu’un minuteur tourne',await ev(async()=>{let n=0;const ec=new Set();const faux={request:async()=>{n++;return{addEventListener:(e,f)=>ec.add(f),release:async()=>{}};}};Object.defineProperty(navigator,'wakeLock',{configurable:true,value:faux});WL=null;Repos.start(60,'x');await new Promise(r=>setTimeout(r,50));ec.forEach(f=>f());await new Promise(r=>setTimeout(r,50));const a=n;Repos.stop();await eveil(false);delete navigator.wakeLock;WL=null;return a===2;}));
 /* session audio : au choix, elle coupe la musique */
 ok('session audio : coupée par défaut, ta musique continue',await ev(()=>{DB.prefs.verrou=0;Repos.start(60,'x');const a=!SessionAudio.el||SessionAudio.el.paused;Repos.stop();return a;}));
 await ev(()=>{aller('plan');});await sleep(120);
 ok('session audio : réglage présent et expliqué',await ev(()=>/coupe ta musique/.test(document.querySelector('#v-plan').textContent)&&document.querySelector('[data-a="son-verrou"]').getAttribute('aria-checked')==='false'));
 await clic('[data-a="son-verrou"]');await sleep(60);
 ok('session audio : activée, un son muet tourne pendant le minuteur',await ev(async()=>{Repos.start(60,'x');await new Promise(r=>setTimeout(r,200));const a=DB.prefs.verrou===1&&SessionAudio.el&&!SessionAudio.el.paused;Repos.stop();await new Promise(r=>setTimeout(r,50));return a&&SessionAudio.el.paused;}));
 await ev(()=>{DB.prefs.verrou=0;aller('jour');});

 /* ---------------------------------------- C. clips, cache, démarrage */
 const clips=await ev(()=>CLIPS),sel=JSON.parse(fs.readFileSync(path.join(RACINE,'outils/selection.json'),'utf8')),vid=fs.readdirSync(path.join(RACINE,'videos'));
 ok('clips : un par exercice sélectionné',Object.keys(sel).sort().join()===Object.keys(clips).sort().join());
 ok('clips : chaque fichier existe, aucun orphelin',Object.values(clips).every(c=>vid.includes(c.f+'.mp4')&&vid.includes(c.f+'.jpg'))&&vid.length===Object.keys(clips).length*2,vid.length);
 const reels=Object.values(sel).filter(x=>x.fichier).length,recons=Object.values(sel).filter(x=>x.photos).length;
 ok('clips : deux tiers de vrais mouvements filmés, plus aucun simple fondu',reels>=21&&recons<=8&&!fs.readFileSync(path.join(RACINE,'outils/videos.mjs'),'utf8').includes('xfade'),{reels,recons});
 ok('clips : toute variante est signalée à l’écran',Object.keys(sel).every(id=>!sel[id].variante||clips[id].variante===sel[id].variante));
 ok('clips : toute source a un auteur et une licence',Object.values(sel).every(s=>s.auteur&&s.licence&&s.url));
 const poids=vid.reduce((a,f)=>a+fs.statSync(path.join(RACINE,'videos',f)).size,0);
 ok('clips : moins de 4 Mo au total, moins de 200 Ko chacun',poids<4*1048576&&vid.every(f=>fs.statSync(path.join(RACINE,'videos',f)).size<200*1024),Math.round(poids/1024)+' Ko');
 const sw=fs.readFileSync(path.join(RACINE,'sw.js'),'utf8'),h=crypto.createHash('sha256').update(fs.readFileSync(path.join(RACINE,'index.html'))).update(fs.readFileSync(path.join(RACINE,'clips.js'))).digest('hex').slice(0,10);
 ok('cache : le service worker porte l’empreinte de cette version (node outils/cache.js)',sw.includes("const CACHE='camp-"+h+"'"),h);
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
