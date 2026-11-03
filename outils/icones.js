/* Redessine les icônes et les écrans de démarrage de l'iPhone aux couleurs du thème : node outils/icones.js */
const puppeteer=require('puppeteer-core'),fs=require('fs'),path=require('path');
const {chrome}=require('../tests/commun');
const R=path.join(__dirname,'..');
const page=(cote,marge,txt)=>{const u=cote-2*marge,mot=txt.length>1;return`<!doctype html><style>
html,body{margin:0;width:${cote}px;height:${cote}px;background:#1C1917}
.c{position:absolute;inset:${marge}px;display:flex;flex-direction:column;justify-content:center;align-items:center}
b{font:300 ${u*(mot?.27:.72)}px/1 system-ui,'Segoe UI',sans-serif;letter-spacing:${mot?'.1em':'0'};padding-left:${mot?'.1em':'0'};color:#F5F5F4}
i{display:block;width:${u*.3}px;height:${Math.max(2,Math.round(u*.016))}px;margin-top:${u*.07}px;background:#B91C1C}</style><div class="c"><b>${txt}</b>${mot?'<i></i>':''}</div>`;};
const icones=[['icon-180.png',180,14,'CAMP'],['icon-192.png',192,15,'CAMP'],['icon-512.png',512,40,'CAMP'],['icon-maskable-512.png',512,92,'CAMP'],['favicon-64.png',64,0,'C']];
/* même fond que l'ouverture : pas d'éclair blanc au lancement depuis l'écran d'accueil */
const ecrans=[[440,956,3],[430,932,3],[428,926,3],[414,896,3],[414,896,2],[414,736,3],[402,874,3],[393,852,3],[390,844,3],[375,812,3],[375,667,2],[320,568,2]];
(async()=>{
 const b=await puppeteer.launch({executablePath:chrome(),headless:'new'});const p=await b.newPage();
 for(const[f,cote,marge,txt]of icones){await p.setViewport({width:cote,height:cote,deviceScaleFactor:1});await p.setContent(page(cote,marge,txt));await p.screenshot({path:path.join(R,f)});console.log(f,fs.statSync(path.join(R,f)).size);}
 fs.mkdirSync(path.join(R,'demarrage'),{recursive:true});
 for(const[w,h,d]of ecrans){const f='demarrage/'+(w*d)+'x'+(h*d)+'.png';await p.setViewport({width:w*d,height:h*d,deviceScaleFactor:1});await p.setContent('<!doctype html><style>html,body{margin:0;height:100%;background:#1C1917}</style>');await p.screenshot({path:path.join(R,f)});console.log(f,fs.statSync(path.join(R,f)).size);}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
