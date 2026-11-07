/* Redessine les icônes aux couleurs du thème, avec le même « CAMP » en traits que l'ouverture : node outils/icones.js
   Les écrans de démarrage de l'iPhone se font avec node outils/demarrage.js, à partir de l'ouverture elle-même. */
const puppeteer=require('puppeteer-core'),fs=require('fs'),path=require('path');
const {chrome}=require('../tests/commun');
const R=path.join(__dirname,'..');
/* les glyphes sont lus dans index.html : une seule source pour l'icône, l'ouverture et les écrans de démarrage */
const html=fs.readFileSync(path.join(R,'index.html'),'utf8');
const glyphe=l=>{const d=new RegExp('<path id="g-'+l+'" d="([^"]+)"').exec(html);if(!d)throw new Error('glyphe '+l+' introuvable');return d[1];};
const LARG={c:62,a:68,m:72,p:58};
const svg=l=>`<svg viewBox="-4 -10 ${LARG[l]} 84" style="width:${(LARG[l]/78*.826).toFixed(4)}em"><path d="${glyphe(l)}"/></svg>`;
const page=(cote,marge,txt)=>{const u=cote-2*marge,mot=txt.length>1,f=mot?u*.241:u*.8;return`<!doctype html><style>
html,body{margin:0;width:${cote}px;height:${cote}px;background:#1C1917}
.c{position:absolute;inset:${marge}px;display:flex;flex-direction:column;justify-content:center;align-items:center}
.m{display:flex;gap:.16em;font-size:${f}px;color:#F5F5F4}
svg{display:block;height:.8896em;fill:none;stroke:currentColor;stroke-width:${mot?6:7}}
i{display:block;width:${u*.3}px;height:${Math.max(2,Math.round(u*.016))}px;margin-top:${u*.05}px;background:#B91C1C}</style><div class="c"><div class="m">${[...txt.toLowerCase()].map(svg).join('')}</div>${mot?'<i></i>':''}</div>`;};
const icones=[['icon-180.png',180,14,'CAMP'],['icon-192.png',192,15,'CAMP'],['icon-512.png',512,40,'CAMP'],['icon-maskable-512.png',512,92,'CAMP'],['favicon-64.png',64,0,'C']];
(async()=>{
 const b=await puppeteer.launch({executablePath:chrome(),headless:'new'});const p=await b.newPage();
 for(const[f,cote,marge,txt]of icones){await p.setViewport({width:cote,height:cote,deviceScaleFactor:1});await p.setContent(page(cote,marge,txt));await p.screenshot({path:path.join(R,f)});console.log(f,fs.statSync(path.join(R,f)).size);}
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
