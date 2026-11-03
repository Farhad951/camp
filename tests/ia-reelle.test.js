/* Le vrai service, avec la clé de .env : npm run test:ia. Consomme un peu de quota, hors de npm test. La clé n'est jamais affichée. */
const {preparer,sleep}=require('./commun');const fs=require('fs'),path=require('path');
const env=fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').match(/^GEMINI_API_KEY=(.*)$/m);if(!env)throw new Error('GEMINI_API_KEY absente de .env');
const CLE=env[1].trim(),IMG=process.argv[2];
(async()=>{
 const t=await preparer(8797,'ia-reelle');const {p,ev,ok,OUT}=t;
 await p.goto(t.url,{waitUntil:'load'});await sleep(800);
 await ev(c=>IA.poser(c),CLE);
 ok('la clé est reconnue par Google',await ev(c=>IA.verifier(c),CLE));
 const net=await ev(async()=>{const k=IA.cle();const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',{headers:{'x-goog-api-key':k}});return r.status;});
 ok('appel direct depuis le navigateur (CORS)',net===200,net);
 const r=await ev(async()=>{try{const o=await IA.recette({ing:['Blanc de poulet','Riz','Courgettes','Skyr'],moment:'Dîner',temps:20,exclus:[]});return o;}catch(e){return{err:e.message};}});
 console.log('RECETTE',JSON.stringify(r).slice(0,1400));
 ok('recette générée',!r.err&&r.items.length>=2&&r.etapes.length>=2,r.err);
 ok('recette : halal, sans porc ni alcool',!r.err&&!/porc|lardon|jambon|bacon|vin blanc|vin rouge|bière|alcool/i.test(JSON.stringify(r)));
 ok('recette : ses ingrédients utilisés',!r.err&&/poulet/i.test(JSON.stringify(r.items)));
 const kc=r.err?0:await ev(o=>Math.round(somme(o).k),r.items);ok('recette : calories crédibles',kc>200&&kc<1500,kc);
 const plat=await ev(async()=>{try{const st={items:[],precision:'2 naans et un karahi de poulet'};return await IA.analyser(st);}catch(e){return{err:e.message};}});
 console.log('PLAT TEXTE',JSON.stringify(plat).slice(0,700));ok('repas décrit analysé',!plat.err&&plat.items.length>=1,plat.err);
 const clip=fs.readdirSync(path.join(__dirname,'..','videos')).find(f=>f.startsWith('pompes')&&f.endsWith('.jpg'));
 const pasPlat=await ev(async u=>{const b=await(await fetch(u)).blob();const url=await reduire(b,900,.8);try{return await IA.analyser({items:[],photo:url});}catch(e){return{err:e.message};}},'videos/'+clip);
 ok('une photo sans nourriture est reconnue comme telle',!!pasPlat.err&&/nourriture|reconna/.test(pasPlat.err),pasPlat.err||pasPlat.nom);
 if(IMG&&fs.existsSync(IMG)){const b64='data:image/jpeg;base64,'+fs.readFileSync(IMG).toString('base64');
  const a=await ev(async u=>{const url=await reduire(await(await fetch(u)).blob(),1024,.75);try{return await IA.analyser({items:[],photo:url});}catch(e){return{err:e.message};}},b64);
  console.log('PLAT PHOTO',JSON.stringify(a).slice(0,1200));ok('photo de plat analysée',!a.err&&a.items.length>=1,a.err);}
 const corps=await ev(async u=>{const url=await reduire(await(await fetch(u)).blob(),900,.8);try{return await IA.demande({consigne:CONSIGNE_CORPS,schema:SCHEMA_CORPS,images:[url],texte:'Point de départ. Ordre des images : 2026-11-02 cf.'});}catch(e){return{err:e.message};}},'videos/'+clip);
 console.log('CORPS',JSON.stringify(corps).slice(0,900));ok('bilan de corps : réponse structurée',!corps.err&&typeof corps.resume==='string',corps.err);
 const pe=await ev(async u=>{const url=await reduire(await(await fetch(u)).blob(),900,.8);try{return await IA.demande({consigne:CONSIGNE_PEAU,schema:SCHEMA_PEAU,images:[url],texte:'Ordre des images : 2026-11-02 face. Routine : Adapalène le soir, Cutacnyl le matin.'});}catch(e){return{err:e.message};}},'videos/'+clip);
 console.log('PEAU',JSON.stringify(pe).slice(0,700));ok('peau : réponse structurée',!pe.err&&typeof pe.visible==='boolean',pe.err);
 const coach=await ev(async()=>{try{return await IA.demande({consigne:CONSIGNE_COACH,schema:SCHEMA_COACH,texte:'Résumé : '+JSON.stringify(resumeSemaine())});}catch(e){return{err:e.message};}});
 console.log('COACH',JSON.stringify(coach).slice(0,500));ok('bilan de semaine',!coach.err&&Array.isArray(coach.priorites),coach.err);
 const off=await ev(async()=>{const a=await OFF.code('3033490004743'),b=await OFF.chercher('skyr');return{a,n:b&&b.length,b0:b&&b[0]};});
 console.log('OFF',JSON.stringify(off).slice(0,400));ok('Open Food Facts répond',!!off.n||!!off.a);
 await ev(()=>IA.poser(''));
 ok('la clé n’apparaît dans aucune sortie',!JSON.stringify([r,plat,corps,pe,coach,off]).includes(CLE));
 await t.fin();
})().catch(e=>{console.error(String(e.message||e).split(CLE).join('<clé>'));process.exit(1);});
