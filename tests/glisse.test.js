/* Supprimer un repas depuis la liste (corbeille, glissement vers la gauche, Annuler), modifier un repas puis annuler, bannière d'installation sur iPhone. */
const {preparer,sleep}=require('./commun');const path=require('path');
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
(async()=>{
 const t=await preparer(8802,'glisse');const {p,ev,ok,OUT}=t;
 await p.goto(t.url,{waitUntil:'load'});await sleep(800);
 const AUJ='2026-11-02',HIER='2026-11-01';
 const n=()=>ev(k=>repasDu(k).length,AUJ),sheet=()=>ev(()=>document.querySelector('#feuille').classList.contains('on'));
 const remplir=()=>ev(k=>{const j=jour(k);j.repas=[];ajouterRepas(k,{nom:'Omelette',h:'08:00',sel:0,items:[itemAl('Œufs',120)]});ajouterRepas(k,{nom:'Karahi',h:'13:00',sel:0,items:[itemAl('Fromage',100)]});ajouterRepas(k,{nom:'Riz',h:'20:00',sel:0,items:[itemAl('Amandes',30)]});aller('bouffe');rendre();},AUJ);
 const boite=i=>ev(i=>{const r=document.querySelectorAll('.rp')[i].getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};},i);
 const voir=async i=>{await ev(i=>document.querySelectorAll('.rp')[i].scrollIntoView({block:'center'}),i);await sleep(150);return boite(i);};
 /* un doigt qui glisse : départ, pas de 12 px, lâcher */
 const glisser=async(i,dx,dy,pas)=>{const b=await voir(i),x=b.x+b.w-30,y=b.y+b.h/2;await p.touchscreen.touchStart(x,y);const N=pas||Math.max(4,Math.round(Math.abs(dx||dy)/12));for(let s=1;s<=N;s++){await p.touchscreen.touchMove(x+dx*s/N,y+(dy||0)*s/N);await sleep(16);}await p.touchscreen.touchEnd();await sleep(500);};
 const toucher=async sel=>{const b=await ev(s=>{const e=document.querySelector(s);e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},sel);await p.touchscreen.tap(b.x,b.y);await sleep(450);};

 await remplir();await sleep(300);await ev(()=>{window.__lg=[];['pointerdown','pointermove','pointerup','pointercancel','click'].forEach(t=>document.addEventListener(t,e=>{if(__lg.length<40)__lg.push(t+(t==='pointermove'?Math.round(e.clientX):''))},true));});
 ok('chaque repas a sa corbeille, avec un nom pour VoiceOver',await ev(()=>{const l=[...document.querySelectorAll('.rp')];return l.length===3&&l.every(r=>{const b=r.querySelector('.rp-poub');return b&&/^Supprimer /.test(b.getAttribute('aria-label'))&&b.offsetWidth>=44;});}));
 ok('le bouton caché derrière la ligne ne prend pas le focus',await ev(()=>[...document.querySelectorAll('.rp-suppr')].every(b=>b.tabIndex===-1&&b.getAttribute('aria-hidden')==='true')));

 /* toucher la ligne ouvre toujours le détail */
 await toucher('.rp:nth-child(2) .repas');ok('toucher un repas ouvre son détail',await sheet()&&await ev(()=>UI.r&&UI.r.nom==='Karahi'));
 await ev(()=>{UI.r=null;fermerFeuille();});await p.waitForFunction(()=>!document.querySelector('#feuille').classList.contains('on')&&getComputedStyle(document.querySelector('#voile')).visibility!=='visible',{timeout:5000}).catch(()=>{});await sleep(300);

 /* corbeille + Annuler */
 await toucher('.rp:nth-child(2) .rp-poub');
 ok('corbeille : supprimé tout de suite, sans ouvrir le détail',await n()===2&&!await sheet()&&await ev(()=>!repasDu('2026-11-02').some(r=>r.nom==='Karahi')));
 ok('toast « Annuler » affiché',await ev(()=>/Karahi/.test(document.querySelector('#toast').textContent)&&!!document.querySelector('#toast [data-a="toast-action"]')));
 await ev(()=>document.querySelector('[data-a="toast-action"]').click());await sleep(300);
 ok('Annuler remet le repas à sa place',await ev(()=>repasDu('2026-11-02').map(r=>r.nom).join()==='Omelette,Karahi,Riz'));

 /* glisser un peu : la ligne reste ouverte sur « Supprimer » */
 await glisser(1,-110);
 ok('glisser à gauche révèle « Supprimer » sans rien effacer',await n()===3&&await ev(()=>document.querySelectorAll('.rp')[1].classList.contains('ouvert'))&&!await sheet());
 const x=await ev(()=>new DOMMatrixReadOnly(getComputedStyle(document.querySelectorAll('.rp-av')[1]).transform).m41);ok('la ligne se pose à 88 px',Math.abs(x+88)<2,x);
 await p.screenshot({path:path.join(OUT,'ouvert.png')});
 await toucher('.rp:nth-child(2) .repas');
 ok('toucher la ligne ouverte la referme, sans ouvrir le détail',!await sheet()&&await ev(()=>!document.querySelector('.rp.ouvert')));
 await glisser(1,-110);{const b=await boite(1);await p.touchscreen.tap(b.x+b.w-40,b.y+b.h/2);await sleep(450);}
 ok('« Supprimer » révélé : supprime',await n()===2&&!await sheet());
 await ev(()=>document.querySelector('[data-a="toast-action"]').click());await sleep(300);

 /* glisser jusqu'au bout : supprime directement */
 await glisser(0,-300);
 ok('glisser jusqu’au bout supprime',await n()===2&&await ev(()=>repasDu('2026-11-02')[0].nom==='Karahi'));
 await ev(()=>document.querySelector('[data-a="toast-action"]').click());await sleep(300);ok('… et s’annule',await n()===3);

 /* un geste vertical fait défiler, il ne touche pas aux repas */
 await glisser(1,-20,140);ok('geste vertical : rien d’ouvert ni d’effacé',await n()===3&&await ev(()=>!document.querySelector('.rp.ouvert'))&&!await sheet());
 /* glisser vers la droite : la ligne revient en place */
 await glisser(1,90);ok('glisser à droite : rien ne se passe',await n()===3&&await ev(()=>{const m=getComputedStyle(document.querySelectorAll('.rp-av')[1]).transform;return m==='none'||new DOMMatrixReadOnly(m).m41===0;}));
 /* une ligne ouverte se referme quand on en ouvre une autre */
 await glisser(0,-110);await glisser(2,-110);ok('une seule ligne ouverte à la fois',await ev(()=>document.querySelectorAll('.rp.ouvert').length===1&&document.querySelectorAll('.rp')[2].classList.contains('ouvert')));
 await toucher('.rp:nth-child(1) .repas');ok('toucher une autre ligne referme d’abord',!await sheet()&&await ev(()=>!document.querySelector('.rp.ouvert')));

 /* modifier la date d'un repas, puis annuler */
 await toucher('.rp:nth-child(2) .repas');await ev(h=>{UI.r.k=h;UI.r.h='21:15';},HIER);await ev(()=>document.querySelector('[data-a="repas-ok"]').click());await sleep(400);
 ok('déplacé à hier',await ev(([a,h])=>repasDu(h).some(r=>r.nom==='Karahi'&&r.h==='21:15')&&!repasDu(a).some(r=>r.nom==='Karahi'),[AUJ,HIER])&&/hier/.test(await ev(()=>document.querySelector('#toast').textContent)));
 await ev(()=>document.querySelector('[data-a="toast-action"]').click());await sleep(300);
 ok('Annuler : revenu aujourd’hui, à son heure',await ev(([a,h])=>repasDu(a).some(r=>r.nom==='Karahi'&&r.h==='13:00')&&!repasDu(h).some(r=>r.nom==='Karahi'),[AUJ,HIER]));
 /* ajouter depuis la feuille : annulable aussi */
 await ev(()=>ouvrirRepas({k:'2026-11-02',nom:'Datte',items:[itemAl('Chocolat',30)],statut:'main'}));await sleep(400);
 await ev(()=>document.querySelector('[data-a="repas-ok"]').click());await sleep(400);ok('ajout noté',await n()===4);
 await ev(()=>document.querySelector('[data-a="toast-action"]').click());await sleep(300);ok('ajout annulé',await n()===3);
 /* la sauvegarde suit : relance */
 await ev(()=>flush());await p.reload({waitUntil:'load'});await sleep(800);
 ok('après relance, la liste est celle qu’on a laissée',await n()===3);
 ok('sur ordinateur : pas de bannière d’installation',await ev(()=>new Promise(r=>setTimeout(()=>r(document.querySelector('#installe').hidden),3800))));

 /* manifeste */
 const m=await ev(()=>fetch('manifest.webmanifest').then(r=>r.json()));
 ok('manifeste : app autonome, /camp/, icônes 192 et 512',m.display==='standalone'&&m.start_url==='/camp/'&&m.scope==='/camp/'&&['192x192','512x512'].every(s=>m.icons.some(i=>i.sizes===s)),m);
 ok('balises iOS présentes',await ev(()=>!!document.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]')&&!!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')&&!!document.querySelector('link[rel="apple-touch-icon"]')&&!!document.querySelector('link[rel="manifest"]')));

 /* iPhone dans Safari : la bannière explique comment installer */
 await p.setUserAgent(IPHONE);await p.reload({waitUntil:'load'});await sleep(4000);
 ok('iPhone, Safari : bannière d’installation',await ev(()=>{const e=document.querySelector('#installe');return!e.hidden&&/écran d’accueil/.test(e.textContent)&&/app web/.test(e.textContent);}));
 await ev(()=>aller('bouffe'));await sleep(300);
 ok('la bannière ne cache pas la barre d’onglets',await ev(()=>document.querySelector('#installe').getBoundingClientRect().bottom<=document.querySelector('.tabs').getBoundingClientRect().top));
 await p.screenshot({path:path.join(OUT,'installe.png')});
 await toucher('[data-a="installe-non"]');await sleep(300);
 ok('masquée d’un geste',await ev(()=>document.querySelector('#installe').hidden));
 await p.reload({waitUntil:'load'});await sleep(4000);ok('et reste masquée',await ev(()=>document.querySelector('#installe').hidden));
 await ev(()=>{localStorage.removeItem(LS+'.installe');Object.defineProperty(navigator,'standalone',{value:true});Installe.montrer();});await sleep(300);
 ok('app installée : jamais de bannière',await ev(()=>document.querySelector('#installe').hidden));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
