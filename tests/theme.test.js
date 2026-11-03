/* Thème et étapes du mannequin : contrastes, polices, texte fixe sous la figure. */
const path=require('path');const {preparer,sleep}=require('./commun');
const lin=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};
const lum=h=>{const n=parseInt(h.slice(1),16);return .2126*lin(n>>16)+.7152*lin(n>>8&255)+.0722*lin(n&255);};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return +((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2);};
(async()=>{
 const t=await preparer(8778,'theme');const {p,ev,ok,OUT}=t;
 await p.goto(t.url);await sleep(900);
 /* --- contrastes : 4,5:1 au moins pour le texte courant */
 const v=await ev(()=>{const c=getComputedStyle(document.documentElement),r={};for(const k of['nuit','toile','bas','craie','gris','or','or-clair','rouge','rouge-clair','bleu','encre-or'])r[k]=c.getPropertyValue('--'+k).trim();return r;});
 for(const[nom,a,b]of[['texte / carte',v.craie,v.toile],['texte secondaire / carte',v.gris,v.toile],['texte secondaire / fond',v.gris,v.nuit],['lien rose / carte',v['or-clair'],v.toile],['texte boxe / carte',v['rouge-clair'],v.toile],['texte On Air / carte',v.bleu,v.toile],['bouton salle',v['encre-or'],v.or],['bouton boxe',v['encre-or'],v.rouge],['bouton On Air',v['encre-or'],v.bleu]]){const x=ratio(a,b);ok('contraste '+nom,x>=4.5,x);}
 /* --- polices */
 const pol=await ev(async()=>{await document.fonts.ready;return{ok:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/"/g,'')),corps:getComputedStyle(document.body).fontFamily};});
 ok('Outfit chargée',pol.ok.includes('Outfit')&&/Outfit/.test(pol.corps),pol);
 ok('aucun flou ni halo',await ev(()=>![...document.querySelectorAll('.nav,.tabs,.toast,.carte,.hero')].some(e=>{const c=getComputedStyle(e);return c.backdropFilter&&c.backdropFilter!=='none';})));
 /* --- étapes : la liste reste fixe, l'étape allumée suit le geste */
 await ev(()=>{UI.jour='2026-11-02';rendre();document.querySelector('[data-a="go-salle"]').click();});await sleep(1500);
 for(const id of['boxjump','medball','trapbar','landmine','pallof','copenhague','latCable','cou','nordic','crunchPoulie']){
  const q=await ev(id=>{const x=document.querySelector('#ex-'+id);return x?{n:x.querySelectorAll('.etapes li').length,v:!!x.querySelector('video')}:null;},id);
  if(q&&!q.v)ok(id+' : 1 à 4 étapes',q.n>=1&&q.n<=4,q.n);
 }
 await ev(()=>{const c=document.querySelector('#seance');c.scrollTop=document.querySelector('#ex-boxjump').offsetTop-70;});await sleep(900);
 const suivi=await ev(async()=>{const e=document.querySelector('#ex-boxjump'),txt=()=>[...e.querySelectorAll('.etapes li')].map(l=>l.textContent).join('|'),t0=txt(),vues=new Set();let bouge=false,h0=e.offsetHeight;
   for(let i=0;i<70;i++){await new Promise(r=>setTimeout(r,100));const on=e.querySelector('.etapes li.on');if(on)vues.add(on.textContent);if(txt()!==t0||e.offsetHeight!==h0)bouge=true;if(e.querySelectorAll('.etapes li.on').length>1)bouge=true;}
   return{bouge,vues:[...vues],total:e.querySelectorAll('.etapes li').length};});
 ok('le texte ne change jamais, la carte ne saute pas',!suivi.bouge,suivi);
 ok('chaque étape s’allume à son tour',suivi.vues.length===suivi.total,suivi.vues);
 await p.screenshot({path:path.join(OUT,'etapes.png')});
 ok('étapes lisibles sans mouvement',await ev(()=>{const c=getComputedStyle(document.querySelector('#ex-boxjump .etapes li:not(.on)'));return parseFloat(c.fontSize)>=14&&c.opacity==='1';}));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
