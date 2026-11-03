const path=require('path');const {preparer,sleep}=require('./commun');
(async()=>{
 const t=await preparer(8776,'coherence');const {p,ev,ok,OUT}=t;
 await p.goto('http://localhost:8776/');await sleep(800);
 const DIM='2026-11-01',LUN='2026-11-02',FUT='2027-01-03';
 const seance=async k=>{await ev(k=>{UI.s=null;document.querySelector('#seance').classList.remove('on');UI.jour=k;rendre();document.querySelector('[data-a="go-salle"]').click();},k);await sleep(1600);};
 const ferme=async()=>{await ev(()=>{fermerFeuille();Repos.stop();fermerCouche();});await sleep(700);};
 // --- conseils : aucun exercice sans charge ne parle de charge
 const cons=await ev(()=>{const r={};for(const id in EX){r[id]=conseil(prescrit(id,'2026-11-01'),null).txt;}return r;});
 for(const id of ['nordic','copenhague','boxjump','sautsLat'])ok('conseil sans « charge » : '+id,!/charge/i.test(cons[id]),cons[id]);
 ok('tractions : parle de lest',/lest/.test(cons.traction),cons.traction);
 ok('RIR 1–2 : pluriel',/reps en réserve|lest/.test(cons.traction));
 ok('latéral poulie : RIR repris',/1 rep en réserve/.test(cons.latCable),cons.latCable);
 ok('rowing : 2 reps',/2 reps en réserve/.test(cons.rowPoulie),cons.rowPoulie);
 ok('tous les conseils sont des phrases',Object.values(cons).every(t=>t&&!/undefined|null/.test(t)));
 // --- regarder ne démarre rien
 await seance(LUN);
 ok('chrono à zéro en regardant',await ev(k=>!DB.days[k].gym.debut&&document.querySelector('#s-chrono').textContent==='0:00',LUN));
 await sleep(1200);ok('chrono toujours à zéro',await ev(()=>document.querySelector('#s-chrono').textContent==='0:00'));
 await ev(()=>document.querySelector('[data-a="echauf"]').click());await sleep(1200);
 ok('premier geste : chrono lancé',await ev(k=>!!DB.days[k].gym.debut,LUN));
 await ferme();await ev(k=>{delete DB.days[k];},LUN);
 await ev(k=>{UI.jour=k;rendre();},FUT);await sleep(300);
 ok('jour à venir : « Voir la séance »',await ev(()=>/Voir la séance/.test(document.querySelector('#hero').textContent)));
 // --- On Air consulté
 const WED='2026-11-04';
 await ev(()=>{const k='2026-11-04';UI.jour=k;rendre();ouvrirOnAir('A',k);});await sleep(700);await ev(()=>fermerCouche());await sleep(600);
 await ev(k=>{UI.jour=k;rendre();},WED);await sleep(300);
 ok('On Air seulement consulté : écran du jour normal',await ev(()=>/On récupère/.test(document.querySelector('#hero').textContent)&&!/Reprendre/.test(document.querySelector('#hero').textContent)));
 // --- Express
 await seance(LUN);await ev(()=>document.querySelector('[data-a="express"][data-v="1"]').click());await sleep(400);await ferme();
 await ev(k=>{UI.jour=k;rendre();},LUN);await sleep(300);
 const d=await ev(()=>document.querySelector('#hero .donnees').textContent);
 ok('accueil express : durée et exercices cohérents',/30 min/.test(d)&&/3 exercices/.test(d),d);
 ok('liste de la semaine : durée express',await ev(()=>/Salle, 30 min/.test(document.querySelector('#frise').textContent)));
 await ev(k=>{DB.days[k].gym.express=0;},LUN);
 // --- dernière série : pas de repos
 await seance(LUN);
 await ev(()=>{document.querySelector('[data-a="express"][data-v="1"]').click();});await sleep(500);
 const fini=await ev(async()=>{const g=jour(UI.s.k).gym;const lignes=[...document.querySelectorAll('.serie')];for(const r of lignes){const k=r.querySelector('input[data-f="kg"]');if(k)k.value='20';r.querySelector('input[data-f="r"]').value='5';valider(r);if(r!==lignes[lignes.length-1])Repos.stop();}await new Promise(z=>setTimeout(z,500));return{repos:Repos.actif,cl:document.querySelector('#repos').classList.contains('on')&&!document.querySelector('#repos').classList.contains('fin'),toast:document.querySelector('#toast').textContent};});
 ok('après la toute dernière série : aucun repos',!fini.repos&&!fini.cl,fini);
 await ev(k=>{delete DB.days[k];},LUN);await ferme();
 // --- « reste à faire » compte toutes les séries
 await seance(DIM);
 ok('série sautée : retrouvée',await ev(k=>{const g=jour(k).gym;g.ex={};const S=SEANCES.dim;for(const id of S.ex.flat()){g.ex[id]=[];for(let j=0;j<nbSeries(g,id);j++)g.ex[id].push({ok:1,kg:1,r:1});}g.ex.traction[2].ok=0;return idSuivant('nordic',1)==='traction'&&/Ensuite : Tractions/.test(suivante('nordic',1));},DIM));
 await ev(k=>{delete DB.days[k];},DIM);await ferme();
 // --- unités
 ok('historique secondes',await ev(()=>{DB.days['2026-10-26']={gym:{ex:{copenhague:[{ok:1,r:25}],traction:[{ok:1,kg:0,r:7}]}}};DB.days['2026-10-19']={gym:{ex:{copenhague:[{ok:1,r:20}]}}};feuilleHisto('copenhague');const t=document.querySelector('#feuille').textContent;const svg=document.querySelector('#feuille svg.graphe').getAttribute('aria-label');fermerFeuille();return /25 s/.test(t)&&/secondes/.test(svg);}));
 await sleep(500);
 ok('poids du corps dans l’historique',await ev(()=>{feuilleHisto('traction');const t=document.querySelector('#feuille').textContent;fermerFeuille();return /Poids du corps × 7/.test(t);}));
 await sleep(500);
 ok('« Plan B » partout',await ev(()=>/Plan B/.test(panneau(EX.nordic,'pourquoi'))&&!/Machine prise/.test(document.documentElement.innerHTML)));
 // --- lecteur intégré
 await seance(LUN);
 ok('bouton : pas de lien externe',await ev(()=>{const a=document.querySelector('#ex-boxjump [data-a="geste"]');return a.tagName==='BUTTON';}));
 await ev(()=>{document.querySelector('#ex-facepull [data-a="geste"]').click();});await sleep(5000);
 const lec=await ev(()=>{const f=document.querySelector('#feuille iframe');return f?{src:f.src,w:f.offsetWidth,h:f.offsetHeight,urlPage:location.pathname,ouvert:document.querySelector('#feuille').classList.contains('on')}:null;});
 ok('lecteur dans l’appli',lec&&lec.ouvert&&lec.src.startsWith('https://www.youtube-nocookie.com/embed/4FAiPDzKRUw')&&lec.w>300&&lec.urlPage==='/',lec);
 ok('démarre seul',/autoplay=1/.test(lec.src)&&/playsinline=1/.test(lec.src));
 await p.screenshot({path:path.join(OUT,'lecteur.png')});
 const frame=p.frames().find(f=>/youtube-nocookie/.test(f.url()));
 if(frame){const st=await frame.evaluate(()=>{const v=document.querySelector('video');const er=document.querySelector('.ytp-error');return{video:!!v,t:v&&v.currentTime,paused:v&&v.paused,muted:v&&v.muted,erreur:er?er.textContent.slice(0,80):null};}).catch(e=>({e:String(e).slice(0,80)}));ok('la vidéo YouTube joue',st.video&&st.t>0&&!st.erreur,st);}else ok('cadre YouTube présent',false);
 ok('derrière : figures et clips en pause',await ev(()=>Lecteur.actif&&[...document.querySelectorAll('#seance video')].every(v=>v.paused)));
 await ev(()=>Repos.start(60,'Test'));await sleep(500);
 ok('minuteur au-dessus de la vidéo',await ev(()=>{const r=document.querySelector('#repos').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(e&&e.closest('#repos'));}));
 await p.screenshot({path:path.join(OUT,'lecteur-repos.png')});
 await ev(()=>{Repos.stop();document.querySelector('#feuille [data-a="fermer-feuille"]').click();});await sleep(800);
 ok('fermer coupe la vidéo',await ev(()=>!document.querySelector('iframe')&&!Lecteur.actif&&!document.body.classList.contains('lecteur-on')));
 // hors ligne
 await p.setOfflineMode(true);
 await ev(()=>document.querySelector('#ex-trapbar [data-a="geste"]').click());await sleep(500);
 ok('hors ligne : message clair, pas d’iframe',await ev(()=>!document.querySelector('#feuille iframe')&&/besoin de réseau/.test(document.querySelector('#feuille').textContent)));
 await ev(()=>fermerFeuille());await p.setOfflineMode(false);await sleep(500);await ferme();
 // --- défilement sans saut : suivi image par image
 const traces=[];
 for(let i=0;i<8;i++){
  await seance(DIM);
  const r=await ev(async()=>{const c=document.querySelector('#seance'),e=document.querySelector('#ex-oiseau');c.scrollTop=e.offsetTop;await new Promise(z=>requestAnimationFrame(z));const lignes=[...e.querySelectorAll('.serie')];const T=document.querySelector('#ex-curlInc');const tops=[];let on=true;const rec=()=>{tops.push(T.getBoundingClientRect().top);if(on)requestAnimationFrame(rec);};
    for(const x of lignes){x.querySelector('input[data-f="kg"]').value='5';x.querySelector('input[data-f="r"]').value='15';valider(x);}Repos.stop();requestAnimationFrame(rec);await new Promise(z=>setTimeout(z,1800));on=false;
    let rec2=0,prev=tops[0];for(const v of tops){if(v-prev>3)rec2=Math.max(rec2,v-prev);prev=v;}const min=Math.min(...tops),fin=tops[tops.length-1];return{images:tops.length,remonte:Math.round(rec2),min:Math.round(min),fin:Math.round(fin),attendu:document.querySelector('.s-top').offsetHeight+8};});
  traces.push(r);await ev(k=>{delete DB.days[k];},DIM);await ferme();
 }
 console.log(JSON.stringify(traces));
 ok('8 défilements : aucun retour en arrière',traces.every(t=>t.remonte===0&&t.min>=t.attendu-3));
 ok('8 défilements : bonne arrivée',traces.every(t=>Math.abs(t.fin-t.attendu)<=2));
 // le doigt reprend la main
 await seance(DIM);
 const pris=await ev(async()=>{const c=document.querySelector('#seance');c.scrollTop=0;voirCarte('nordic');await new Promise(z=>setTimeout(z,120));c.dispatchEvent(new Event('touchstart'));const y=c.scrollTop;await new Promise(z=>setTimeout(z,300));return Math.abs(c.scrollTop-y);});
 ok('un toucher arrête le défilement',pris<2,pris);
 // --- On Air : une vidéo par bloc et par station
 await ev(()=>{UI.s=null;document.querySelector('#seance').classList.remove('on');UI.jour='2026-11-04';rendre();});await sleep(300);
 for(const id of['A','B']){
  await ev(id=>{ouvrirOnAir(id,'2026-11-04');},id);await sleep(900);
  const r=await ev(()=>[...document.querySelectorAll('#seance-in [data-a="geste"]')].map(b=>b.dataset.ex));
  ok('On Air '+id+' : chaque bloc a sa vidéo',r.length>=4,r);
  ok('On Air '+id+' : toutes les vidéos existent',await ev(r=>r.every(x=>GESTES[x]&&GESTES[x][2]&&GESTES[x][3]),r));
  if(id==='B')ok('On Air B : 5 stations à toucher',await ev(()=>document.querySelectorAll('#seance-in button.station').length===5));
  await ev(()=>{fermerCouche();});await sleep(700);
 }
 await ev(()=>{ouvrirOnAir('B','2026-11-04');});await sleep(900);
 await ev(()=>document.querySelector('button.station[data-ex="swing"]').click());await sleep(2500);
 const oa=await ev(()=>{const f=document.querySelector('#feuille iframe');return f?{src:f.src,t:document.querySelector('#feuille h2').textContent,rep:document.querySelector('.geste-rep').textContent}:null;});
 ok('station : lit la vidéo dans l’appli',oa&&oa.src.includes('embed/IxgnCZ3oKuE')&&oa.t==='Swing kettlebell'&&/hanches/.test(oa.rep),oa);
 await p.screenshot({path:path.join(OUT,'onair-lecteur.png')});
 await ev(()=>document.querySelector('#feuille [data-a="fermer-feuille"]').click());await sleep(700);
 await p.setOfflineMode(true);
 await ev(()=>document.querySelector('#seance-in [data-a="geste"][data-ex="sparring"]').click());await sleep(500);
 ok('On Air hors ligne : message sans onglet inexistant',await ev(()=>{const x=document.querySelector('#feuille').textContent;return /besoin de réseau/.test(x)&&!/Placement/.test(x);}));
 await ev(()=>fermerFeuille());await p.setOfflineMode(false);await sleep(500);
 await ev(()=>{const c=document.querySelector('#seance');c.scrollTop=document.querySelector('#bloc-circuit').offsetTop-70;});await sleep(800);
 await p.screenshot({path:path.join(OUT,'onair-stations.png')});
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
