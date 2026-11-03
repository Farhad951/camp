/* Vitesse sur téléphone lent : processeur ralenti ×4, trois réseaux, première visite et relance.
   npm run test:vitesse            mesure le site publié
   npm run test:vitesse -- <url>   mesure une autre adresse */
const puppeteer=require('puppeteer-core');const {chrome,sleep}=require('./commun');
const U=process.argv[2]||'https://farhad951.github.io/camp/';
const med=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const RES={'3G rapide':{d:1.6e6/8,u:750e3/8,l:150},'3G lent':{d:400e3/8,u:400e3/8,l:400},'4G':{d:9e6/8,u:9e6/8,l:60}};
(async()=>{
 const b=await puppeteer.launch({executablePath:chrome(),headless:'new'});
 for(const[nom,n]of Object.entries(RES)){const fois={};const add=(k,v)=>{(fois[k]=fois[k]||[]).push(v);};
  for(let i=0;i<3;i++){
   const ctx=await b.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
   const c=await p.createCDPSession();await c.send('Network.enable');await c.send('Network.emulateNetworkConditions',{offline:false,latency:n.l,downloadThroughput:n.d,uploadThroughput:n.u});await c.send('Emulation.setCPUThrottlingRate',{rate:4});
   let oct=0;c.on('Network.loadingFinished',e=>{oct+=e.encodedDataLength;});
   const mesure=()=>p.evaluate(()=>{const t=performance.getEntriesByType('navigation')[0],f=performance.getEntriesByName('first-contentful-paint')[0];return{fcp:f?Math.round(f.startTime):null,load:Math.round(t.loadEventEnd)};});
   await p.goto(U+'?x='+Math.random(),{waitUntil:'load',timeout:120000});await sleep(1200);
   const m1=await mesure();add('1re visite : 1er affichage (ms)',m1.fcp);add('1re visite : utilisable (ms)',m1.load);add('1re visite : Ko',Math.round(oct/1024));
   await p.evaluate(()=>navigator.serviceWorker.ready);await sleep(500);
   oct=0;await p.goto(U,{waitUntil:'load',timeout:120000});await sleep(900);
   const m2=await mesure();add('Relance : 1er affichage (ms)',m2.fcp);add('Relance : utilisable (ms)',m2.load);add('Relance : Ko réseau',Math.round(oct/1024));
   await ctx.close();
  }
  console.log('### '+nom+', processeur ×4');for(const k in fois)console.log('  '+k.padEnd(34),med(fois[k]),JSON.stringify(fois[k]));
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
