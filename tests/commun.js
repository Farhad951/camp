/* Outils partagés par les tests : petit serveur local, Chrome sans interface, date figée. */
const puppeteer=require('puppeteer-core'),http=require('http'),fs=require('fs'),path=require('path');
const RACINE=path.join(__dirname,'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const TYPES={'.html':'text/html','.js':'text/javascript','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
/* CHROME permet d'indiquer un autre navigateur */
function chrome(){
  const liste=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome'].filter(Boolean);
  const c=liste.find(f=>fs.existsSync(f));if(!c)throw new Error('Chrome introuvable : indique son chemin dans la variable CHROME');return c;
}
/* reseau : retard et blocage par fichier, et nombre de téléchargements de clips en cours */
const reseau={delai:0,bloque:null,enCours:0,max:0,servis:[]};
function serveur(port){return http.createServer(async(q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(RACINE,p);
  if(!f.startsWith(RACINE)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
  if(reseau.bloque&&reseau.bloque.test(p))return;
  const clip=p.startsWith('/videos/');
  if(clip){reseau.enCours++;reseau.max=Math.max(reseau.max,reseau.enCours);reseau.servis.push(p);if(reseau.delai)await sleep(reseau.delai);reseau.enCours--;}
  r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f));}).listen(port);}
/* un lundi de semaine connue : les parcours ne dépendent pas du jour où on lance les tests */
const LUNDI='2026-11-02T12:00:00';
async function preparer(port,nom,args){
  const OUT=path.join(__dirname,'sortie',nom);fs.mkdirSync(OUT,{recursive:true});
  const srv=serveur(port);
  const b=await puppeteer.launch({executablePath:chrome(),headless:'new',args:['--autoplay-policy=no-user-gesture-required',...(args||[])]});
  const p=await b.newPage();await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.evaluateOnNewDocument(t=>{const dec=new Date(t).getTime()-Date.now(),D=Date;
    window.Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+dec]));}static now(){return D.now()+dec;}};},LUNDI);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|youtube|ytimg|ERR_|absent-000/.test(m.text()))errs.push(m.text());});
  const t={b,p,srv,OUT,errs,reseau,echecs:0,url:'http://localhost:'+port+'/',
    ev:(f,...a)=>p.evaluate(f,...a),
    ok(n,c,x){if(!c)t.echecs++;console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' → '+JSON.stringify(x):''));},
    async fin(){t.ok('aucune erreur JavaScript',errs.length===0,errs);console.log(t.echecs?'ÉCHECS : '+t.echecs:'TOUT PASSE');await b.close();srv.close();process.exit(t.echecs?1:0);}};
  return t;
}
module.exports={preparer,serveur,sleep,chrome,RACINE};
