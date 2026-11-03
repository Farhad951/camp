/* Thème et étapes : contrastes, polices, texte fixe sous la vidéo. */
const path=require('path');const {preparer,sleep}=require('./commun');
const lin=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};
const lum=h=>{const n=parseInt(h.slice(1),16);return .2126*lin(n>>16)+.7152*lin(n>>8&255)+.0722*lin(n&255);};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return +((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2);};
(async()=>{
 const t=await preparer(8778,'theme');const {p,ev,ok,OUT}=t;
 await p.goto(t.url);await sleep(900);
 /* --- ouverture : moins de 1,2 s, propriétés fluides seulement, jamais de blocage du toucher */
 await p.reload({waitUntil:'domcontentloaded'});
 const ouv=await ev(()=>{const l=document.getAnimations().filter(a=>a.animationName&&a.animationName.startsWith('ouv-'));const fx=new Set();l.forEach(a=>a.effect.getKeyframes().forEach(k=>Object.keys(k).forEach(x=>{if(!['offset','computedOffset','easing','composite'].includes(x))fx.add(x);})));return{n:l.length,fin:Math.max(...l.map(a=>{const t=a.effect.getTiming();return t.delay+t.duration;})),fx:[...fx],clic:getComputedStyle(document.querySelector('#ouv')).pointerEvents};});
 ok('ouverture en moins de 1,2 s',ouv.n>0&&ouv.fin<1200,ouv.fin);
 ok('ouverture : opacity et transform seulement',ouv.fx.every(x=>['opacity','transform','visibility'].includes(x)),ouv.fx);
 ok('ouverture : le toucher passe au travers',ouv.clic==='none');
 await sleep(1300);
 await p.waitForFunction(()=>!document.querySelector('#ouv'),{timeout:3000}).catch(()=>{});
 ok('ouverture : tout est retiré à la fin',await ev(()=>!document.querySelector('#ouv')&&!document.documentElement.classList.contains('ouverture')&&getComputedStyle(document.querySelector('.app')).transform==='none'));
 /* --- contrastes : 4,5:1 au moins pour le texte courant */
 const v=await ev(()=>{const c=getComputedStyle(document.documentElement),r={};for(const k of['nuit','toile','bas','craie','gris','or','or-clair','rouge','rouge-clair','bleu','encre-or'])r[k]=c.getPropertyValue('--'+k).trim();return r;});
 for(const[nom,a,b]of[['texte / carte',v.craie,v.toile],['texte secondaire / carte',v.gris,v.toile],['texte secondaire / fond',v.gris,v.nuit],['lien rouge / carte',v['or-clair'],v.toile],['texte boxe / carte',v['rouge-clair'],v.toile],['texte On Air / carte',v.bleu,v.toile],['bouton salle',v['encre-or'],v.or],['bouton boxe',v['encre-or'],v.rouge],['bouton On Air',v.nuit,v.bleu]]){const x=ratio(a,b);ok('contraste '+nom,x>=4.5,x);}
 /* --- polices */
 const pol=await ev(async()=>{await document.fonts.ready;return{ok:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/"/g,'')),corps:getComputedStyle(document.body).fontFamily};});
 ok('police système, rien à télécharger',await ev(()=>document.fonts.size===0)&&/system-ui/.test(pol.corps),pol);
 ok('aucun flou ni halo',await ev(()=>![...document.querySelectorAll('.nav,.tabs,.toast,.carte,.hero')].some(e=>{const c=getComputedStyle(e);return c.backdropFilter&&c.backdropFilter!=='none';})));
 /* --- étapes : la liste reste fixe sous la vidéo */
 await ev(()=>{UI.jour='2026-11-02';rendre();document.querySelector('[data-a="go-salle"]').click();});await sleep(1500);
 for(const id of['boxjump','medball','trapbar','landmine','pallof','copenhague','latCable','cou','nordic','crunchPoulie']){
  const q=await ev(id=>{const x=document.querySelector('#ex-'+id);return x?x.querySelectorAll('.scene + .etapes li').length:null;},id);
  if(q!=null)ok(id+' : 1 à 5 étapes sous la vidéo',q>=1&&q<=5,q);
 }
 await ev(()=>{const c=document.querySelector('#seance');c.scrollTop=document.querySelector('#ex-boxjump').offsetTop-70;});await sleep(900);
 const fixe=await ev(async()=>{const e=document.querySelector('#ex-boxjump'),txt=()=>e.querySelector('.etapes').textContent,t0=txt(),h0=e.offsetHeight;let bouge=false;for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));if(txt()!==t0||e.offsetHeight!==h0)bouge=true;}return!bouge;});
 ok('le texte ne change jamais, la carte ne saute pas',fixe);
 await p.screenshot({path:path.join(OUT,'etapes.png')});
 ok('étapes lisibles',await ev(()=>{const c=getComputedStyle(document.querySelector('#ex-boxjump .etapes li'));return parseFloat(c.fontSize)>=14&&c.opacity==='1';}));
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
