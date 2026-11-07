/* Images de démarrage iOS (apple-touch-startup-image).
   Chaque image est une capture du premier frame de l'animation d'ouverture, à la taille exacte de l'écran :
   au lancement, iOS l'affiche, puis l'appli prend le relais sur un frame identique. Aucun saut visible.
   À relancer après toute retouche de l'ouverture :  node outils/demarrage.js */
const puppeteer=require('puppeteer-core'),path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
const {chrome}=require('../tests/commun');
const ECRANS=[[440,956,3],[430,932,3],[428,926,3],[420,912,3],[414,896,3],[414,896,2],[414,736,3],[402,874,3],[393,852,3],[390,844,3],[375,812,3],[375,667,2],[320,568,2]];
(async()=>{
  const racine=path.join(__dirname,'..'),html=fs.readFileSync(path.join(racine,'index.html'),'utf8');
  const b=await puppeteer.launch({executablePath:chrome(),headless:'new'});const p=await b.newPage();
  for(const [w,h,r] of ECRANS){
    const nom=(w*r)+'x'+(h*r)+'.png';
    if(!html.includes('href="demarrage/'+nom+'"'))throw new Error('balise manquante pour '+nom);
    await p.setViewport({width:w,height:h,deviceScaleFactor:r});
    await p.goto(pathToFileURL(path.join(racine,'index.html')).href,{waitUntil:'domcontentloaded'});
    /* on fige toutes les animations à leur tout premier instant */
    await p.evaluate(()=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;});});
    await p.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
    await p.screenshot({path:path.join(racine,'demarrage',nom)});
    console.log(nom);
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
