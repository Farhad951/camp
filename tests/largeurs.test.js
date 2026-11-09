/* Tous les écrans, de 320 à 440 px : rien ne déborde, le texte reste entier et lisible.
   Les autres suites regardent 390 px, et 320 px pour quelques écrans seulement. */
const {preparer,sleep}=require('./commun');
const LARGEURS=[320,360,375,390,414,430,440];
(async()=>{
 const t=await preparer(8814,'largeurs');const {p,ev,ok,OUT}=t;
 await p.goto(t.url,{waitUntil:'load'});await sleep(500);
 /* des données de tous les jours : séances, repas, pesées, notes de boxe, rappel du coach */
 await ev(()=>{
  const a=auj(),h=veilleDe(a);
  for(let i=1;i<=30;i++){const d=addD(fromISO(a),-i),k=iso(d),j=jour(k),T=PLAN[d.getDay()].type;
   if(T==='boxe')j.boxe={st:'fait',rpe:7,note:'Six rounds de sparring, bonnes sensations sur le jab et les esquives.'};
   if(T==='salle')j.gym={sid:PLAN[d.getDay()].sid,ex:{trapbar:[{kg:100,r:5,ok:1},{kg:100,r:5,ok:1}],pallof:[{kg:15,r:10,ok:1}]},echauf:{},express:0,done:1};
   j.eau=2.5;
   DB.poids.list.push({d:k,kg:80-i*.05});}
  ajouterRepas(h,{id:'r1',nom:'Poulet grillé, riz et une sauce au nom un peu long à lire',m:'soir',h:'20:00',items:[itemAl('Poulet grillé',200),itemAl('Riz basmati cuit',220)]});
  ajouterRepas(a,{id:'r2',nom:'Avoine, skyr',m:'matin',h:'08:00',items:[itemAl('Flocons d’avoine',70),itemAl('Skyr',200)]});
  DB.prefs.epingles=[{id:'e1',ex:'trapbar',txt:'Ajoute 2,5 kg sur la dernière série si la précédente passe sans forcer.',pq:'Bilan de la semaine',d:a}];
  nutri().ctx='chantier';
 }).catch(e=>{throw new Error('données de test : '+e.message);});
 const fermer=()=>ev(()=>{if(document.getElementById('feuille').classList.contains('on'))fermerFeuille();if(UI.s)fermerCouche();Repos.stop();});
 const ECRANS=[
  ['Jour',()=>aller('jour')],
  ['Entraîner, On Air',()=>aller('onair')],
  ['Entraîner, Chrono',()=>aller('chrono')],
  ['Bouffe',()=>{UI.bJour=null;aller('bouffe');}],
  ['Visage, Peau',()=>{UI.visVue='peau';aller('visage');}],
  ['Visage, Sèche',()=>{UI.visVue='seche';aller('visage');}],
  ['Progrès, Corps',()=>{UI.prVue='corps';aller('progres');}],
  ['Progrès, Force',()=>{UI.prVue='force';aller('progres');}],
  ['Progrès, Boxe',()=>{UI.prVue='boxe';aller('progres');}],
  ['Progrès, Régularité',()=>{UI.prVue='regul';aller('progres');}],
  ['Le plan',()=>aller('plan')],
  ['Séance de salle complète',()=>{ouvrirSalle(auj());}],
  ['Séance allégée',()=>{ouvrirSalle(auj());document.querySelector('[data-a="express"][data-v="2"]').click();}],
  ['Plan B',()=>{ouvrirSalle(auj());document.querySelector('[data-a="planb"]').click();}],
  ['On Air',()=>{ouvrirOnAir('A',auj());}]
 ];
 /* ce qui dépasse de l'écran, hors bandes qui défilent ; et les textes trop pâles sur un fond uni */
 /* W : la largeur demandée. En émulation mobile, innerWidth grandit avec ce qui déborde et ne prouve donc rien. */
 const mesure=W=>ev(W=>{
  const lum=c=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);};
  const rgb=s=>{const m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0];};
  const racine=UI.s?document.getElementById('seance'):document.querySelector('.vue.on')||document.querySelector('.app');
  const debord=[],pales=[];
  const visible=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>0&&r.height>0&&c.visibility!=='hidden'&&c.display!=='none';};
  /* les seules bandes qui défilent de côté, voulues : le reste doit tenir dans l'écran */
  const dansBande=e=>!!e.closest('.oa-pages,.q-puces,.ph-frise,.ia-fil');
  for(const e of racine.querySelectorAll('*')){
   if(!visible(e)||e.closest('svg'))continue;
   const r=e.getBoundingClientRect();
   if((r.right>W+1||r.left<-1)&&!dansBande(e)&&debord.length<5)debord.push((e.id?'#'+e.id:e.tagName+'.'+e.className).slice(0,50)+' '+Math.round(r.left)+'→'+Math.round(r.right));
   /* un texte coupé par le bouton ou la case qui le contient */
   if(/^(BUTTON|LABEL)$/.test(e.tagName)&&e.scrollWidth>e.clientWidth+1&&e.clientWidth>0&&getComputedStyle(e).overflowX!=='visible'&&!e.closest('.apercu')&&debord.length<5)debord.push('texte coupé : '+e.textContent.trim().slice(0,40));
   const tx=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!tx)continue;
   const c=getComputedStyle(e);if(e.disabled||e.closest('[disabled]')||e.closest('video'))continue;
   let fond=null,image=false,op=1;
   for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);op*=+s.opacity;if(s.backgroundImage!=='none'){image=true;break;}if(!fond){const b=rgb(s.backgroundColor);if(b[3]===undefined||b[3]===1)fond=b;else if(b[3]>0){image=true;break;}}}
   /* fond dégradé, image ou voile : le calcul ne serait pas fiable. Élément en cours de fondu : pareil */
   if(image||!fond||op<.99)continue;
   const a=rgb(c.color);if(a[3]!==undefined&&a[3]<1)for(let i=0;i<3;i++)a[i]=a[i]*a[3]+fond[i]*(1-a[3]);
   const x=lum(a),y=lum(fond),R=(Math.max(x,y)+.05)/(Math.min(x,y)+.05),g=parseFloat(c.fontSize),gros=g>=24||(g>=18.66&&+c.fontWeight>=700);
   if(R<(gros?3:4.5)&&pales.length<5)pales.push(e.textContent.trim().slice(0,36)+' ('+R.toFixed(2)+')');
  }
  return{h:document.documentElement.scrollWidth,W,debord,pales,secours:/Cet écran n’a pas pu s’afficher/.test(racine.textContent)};
 },W);
 /* le détecteur doit voir un vrai défaut : sinon, un « tout passe » ne prouverait rien */
 await ev(()=>{aller('jour');const v=document.querySelector('.vue.on'),b=document.createElement('div');b.id='piege';b.style.cssText='min-width:900px;flex:none;background:#fff;color:#ddd;position:relative';b.textContent='Texte trop pâle';v.appendChild(b);});await sleep(80);
 {const m=await mesure(390);ok('le détecteur voit un débordement et un texte pâle',m.h>m.W&&m.debord.some(x=>/piege/.test(x))&&m.pales.some(x=>/pâle/.test(x)),{debord:m.debord.length,pales:m.pales.length});}
 await ev(()=>{document.getElementById('piege').remove();rendre();});
 for(const[nom,f]of ECRANS){
  let probl=[],pales=new Set();
  for(const L of LARGEURS){
   await p.setViewport({width:L,height:L<375?640:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
   await fermer();await ev(f);await sleep(180);
   const m=await mesure(L);
   if(m.secours)probl.push(L+' px : écran de secours');
   if(m.h>m.W)probl.push(L+' px : la page défile de côté ('+m.h+')');
   m.debord.forEach(x=>probl.push(L+' px : '+x));
   m.pales.forEach(x=>pales.add(x));
   if(L===320||L===440)await p.screenshot({path:require('path').join(OUT,nom.replace(/[^a-zA-Zé]+/g,'-')+'-'+L+'.png')});
  }
  ok(nom+' : rien ne déborde de 320 à 440 px',!probl.length,probl.length?probl.slice(0,6):undefined);
  ok(nom+' : texte lisible, 4,5:1 au moins',!pales.size,pales.size?[...pales]:undefined);
 }
 await fermer();
 await p.setViewport({width:320,height:640,deviceScaleFactor:2,isMobile:true,hasTouch:true});await sleep(150);
 ok('320 px : les cinq onglets tiennent sur une ligne',await ev(()=>{const l=[...document.querySelectorAll('.tabs button')],y=l[0].getBoundingClientRect().top;return l.length===5&&l.every(b=>b.getBoundingClientRect().top===y&&b.scrollWidth<=b.clientWidth+1);}));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
