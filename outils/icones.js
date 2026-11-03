/* Redessine les icônes de l'appli aux couleurs du thème : node outils/icones.js */
const puppeteer=require('puppeteer-core'),fs=require('fs'),path=require('path');
const {chrome}=require('../tests/commun');
const R=path.join(__dirname,'..');
const police=fs.readFileSync(path.join(R,'polices/outfit.woff2')).toString('base64');
const page=(cote,marge,txt)=>`<!doctype html><style>@font-face{font-family:Outfit;src:url(data:font/woff2;base64,${police});font-weight:100 900}
html,body{margin:0;width:${cote}px;height:${cote}px;background:#0C0C1D}
.c{position:absolute;inset:${marge}px;display:flex;flex-direction:column;justify-content:center;align-items:center}
b{font:800 ${(cote-2*marge)*(txt.length>1?.335:.8)}px/1 Outfit;letter-spacing:-.015em;color:#ECEFF4;text-shadow:.05em .05em 0 #FF00C8}
i{display:block;width:100%;height:${Math.round((cote-2*marge)*.022)}px;margin-top:${(cote-2*marge)*.06}px;background:#FF00C8}
i+i{margin-top:${(cote-2*marge)*.05}px;background:#00E5FF}</style><div class="c"><b>${txt}</b>${txt.length>1?'<i></i><i></i>':''}</div>`;
const liste=[['icon-180.png',180,14,'CAMP'],['icon-192.png',192,15,'CAMP'],['icon-512.png',512,40,'CAMP'],['icon-maskable-512.png',512,92,'CAMP'],['favicon-64.png',64,0,'C']];
(async()=>{
 const b=await puppeteer.launch({executablePath:chrome(),headless:'new'});const p=await b.newPage();
 for(const[f,cote,marge,txt]of liste){await p.setViewport({width:cote,height:cote,deviceScaleFactor:1});await p.setContent(page(cote,marge,txt));await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(R,f)});console.log(f,fs.statSync(path.join(R,f)).size);}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
