#!/usr/bin/env node
/* Vidéos d'exercices de Camp. Sources gratuites : wger, Wikimedia Commons, Pexels, Pixabay, ou tes propres fichiers.

   node outils/videos.mjs etat                               ce qui est couvert, ce qui manque
   node outils/videos.mjs chercher [exo…]                    planche de candidats : outils/candidats.html
   node outils/videos.mjs installer <exo> <choix> [début] [durée]
        <choix> : pexels:123, pixabay:456 (vus sur la planche) ou chemin d'un fichier vidéo
        début et durée en secondes (0 et 6 par défaut)
   node outils/videos.mjs retirer <exo>
   node outils/videos.mjs appliquer [exo…]                   produit les clips décrits dans outils/selection.json

   Clés API dans .env à la racine (jamais commité) : PEXELS_API_KEY=…  PIXABAY_API_KEY=…
   Nécessite ffmpeg dans le PATH. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const RACINE=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ICI=p=>path.join(RACINE,p);
const CLIPS_JS=ICI('clips.js'),DOSSIER=ICI('videos'),CANDIDATS=ICI('outils/candidats.json'),PLANCHE=ICI('outils/candidats.html');
const PAR_SOURCE=6,VALIDITE_MS=24*3600e3; /* Pixabay demande de garder les réponses 24 h */

/* Requêtes en anglais : ces banques sont bien mieux indexées dans cette langue. */
const EXOS={
  traction:['Tractions lestées','weighted pull up'],
  rowAppuye:['Rowing haltères buste appuyé','chest supported dumbbell row'],
  incline:['Développé incliné haltères','incline dumbbell press'],
  latDB:['Élévations latérales haltères','dumbbell lateral raise'],
  oiseau:['Oiseau à la poulie','cable rear delt fly'],
  curlInc:['Curl incliné haltères','incline dumbbell curl'],
  tricepsOH:['Extension triceps au-dessus de la tête','overhead cable triceps extension'],
  crunchPoulie:['Crunch à la poulie haute','kneeling cable crunch'],
  nordic:['Nordic curl','nordic hamstring curl'],
  boxjump:['Sauts sur box','box jump'],
  sautsLat:['Sauts latéraux','lateral bound skater jump'],
  medball:['Lancer rotatif médecine-ball','rotational medicine ball throw'],
  trapbar:['Soulevé de terre trap bar','trap bar deadlift'],
  landmine:['Développé landmine','landmine press'],
  rowPoulie:['Rowing assis poulie','seated cable row'],
  latCable:['Élévation latérale à la poulie','cable lateral raise'],
  facepull:['Face pull','cable face pull'],
  pallof:['Pallof press','pallof press'],
  copenhague:['Planche de Copenhague','copenhagen plank'],
  cou:['Flexion du cou','neck flexion exercise']
};

const stop=m=>{console.error(m);process.exit(1);};
const lireJson=(f,d)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return d;}};

function chargerEnv(){
  let t='';try{t=fs.readFileSync(ICI('.env'),'utf8');}catch{}
  for(const l of t.split(/\r?\n/)){const m=/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
}

function lireClips(){
  try{const t=fs.readFileSync(CLIPS_JS,'utf8');return JSON.parse(t.slice(t.indexOf('=')+1).trim().replace(/;$/,''));}catch{return{};}
}
/* clips.js change : on change aussi le nom du cache du service worker, pour que le téléphone reprenne la nouvelle liste. */
function ecrireClips(c){
  const tri=Object.fromEntries(Object.keys(c).sort().map(k=>[k,c[k]]));
  fs.writeFileSync(CLIPS_JS,'/* Généré par outils/videos.mjs. Ne pas modifier à la main. */\nwindow.CLIPS='+JSON.stringify(tri,null,1)+';\n');
  const h=crypto.createHash('sha256').update(fs.readFileSync(ICI('index.html'))).update(fs.readFileSync(CLIPS_JS)).digest('hex').slice(0,10);
  const sw=fs.readFileSync(ICI('sw.js'),'utf8');
  fs.writeFileSync(ICI('sw.js'),sw.replace(/const CACHE='camp-[^']*'/,"const CACHE='camp-"+h+"'"));
}

async function json(url,headers){
  const r=await fetch(url,{headers});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
async function pexels(q,cle){
  const d=await json('https://api.pexels.com/v1/videos/search?per_page='+PAR_SOURCE+'&query='+encodeURIComponent(q),{Authorization:cle});
  return(d.videos||[]).map(v=>{
    const fs_=(v.video_files||[]).filter(f=>f.file_type==='video/mp4'&&f.width);
    const f=fs_.filter(x=>x.width>=540).sort((a,b)=>a.width-b.width)[0]||fs_.sort((a,b)=>b.width-a.width)[0];
    return f&&{choix:'pexels:'+v.id,source:'Pexels',auteur:v.user&&v.user.name||'',url:v.url,duree:v.duration,image:v.image,video:f.link};
  }).filter(Boolean);
}
async function pixabay(q,cle){
  const d=await json('https://pixabay.com/api/videos/?safesearch=true&per_page='+PAR_SOURCE+'&key='+encodeURIComponent(cle)+'&q='+encodeURIComponent(q));
  return(d.hits||[]).map(v=>{
    const t=v.videos||{},f=[t.small,t.medium,t.tiny,t.large].find(x=>x&&x.url&&x.width>=540)||t.tiny;
    return f&&f.url&&{choix:'pixabay:'+v.id,source:'Pixabay',auteur:v.user||'',url:v.pageURL,duree:v.duration,image:f.thumbnail||'',video:f.url};
  }).filter(Boolean);
}

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function ecrirePlanche(base){
  const clips=lireClips();
  const blocs=Object.keys(EXOS).map(id=>{
    const c=(base[id]&&base[id].res)||[];
    const cartes=c.map(v=>'<figure><video controls muted preload="none" poster="'+esc(v.image)+'" src="'+esc(v.video)+'"></video><figcaption><code>node outils/videos.mjs installer '+id+' '+esc(v.choix)+'</code><br>'+Math.round(v.duree||0)+' s · <a href="'+esc(v.url)+'" target="_blank" rel="noopener">'+esc(v.auteur)+' sur '+esc(v.source)+'</a></figcaption></figure>').join('');
    return'<section><h2>'+esc(EXOS[id][0])+(clips[id]?' <small>installé</small>':'')+'</h2><p>Recherche : '+esc(EXOS[id][1])+'</p>'+(cartes?'<div class="g">'+cartes+'</div>':'<p class="vide">Aucun résultat : filme-le toi-même ou essaie une autre requête.</p>')+'</section>';
  }).join('');
  fs.writeFileSync(PLANCHE,'<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Candidats vidéo</title><style>body{font:15px system-ui;margin:0 auto;max-width:1100px;padding:16px;background:#111;color:#eee}a{color:#d9b36c}h2{margin:28px 0 2px}h2 small{color:#7c7}p{margin:0 0 10px;color:#aaa}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}figure{margin:0}video{width:100%;aspect-ratio:4/3;object-fit:cover;background:#000}figcaption{font-size:12px;color:#aaa;margin-top:4px}code{color:#eee;word-break:break-all}.vide{color:#e88}</style><h1>Candidats vidéo</h1><p>Vérifie que le mouvement est le bon et que la technique correspond à la carte de l’exercice, puis lance la commande affichée sous la vidéo.</p>'+blocs+'</html>');
}

async function chercher(ids){
  chargerEnv();
  const kp=process.env.PEXELS_API_KEY,kx=process.env.PIXABAY_API_KEY;
  if(!kp&&!kx)stop('Aucune clé : ajoute PEXELS_API_KEY et/ou PIXABAY_API_KEY dans le fichier .env à la racine.');
  for(const id of ids)if(!EXOS[id])stop('Exercice inconnu : '+id);
  const base=lireJson(CANDIDATS,{});
  for(const id of ids.length?ids:Object.keys(EXOS)){
    if(base[id]&&Date.now()-base[id].quand<VALIDITE_MS){console.log(id+' : déjà cherché il y a moins de 24 h');continue;}
    const q=EXOS[id][1],res=[],err=[];
    for(const [nom,f,k] of [['Pexels',pexels,kp],['Pixabay',pixabay,kx]]){
      if(!k)continue;
      try{res.push(...await f(q,k));}catch(e){err.push(nom+' : '+e.message);}
    }
    /* un échec réseau ne doit pas se faire passer pour « aucun résultat » pendant 24 h */
    if(err.length)console.error(id+' : '+err.join(', '));
    if(!err.length||res.length)base[id]={quand:err.length?0:Date.now(),res};
    console.log(id+' : '+res.length+' candidat(s)');
  }
  fs.writeFileSync(CANDIDATS,JSON.stringify(base,null,1));
  ecrirePlanche(base);
  console.log('\nPlanche : '+PLANCHE);
}

function ffmpeg(args){
  const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});
  if(r.error)stop('ffmpeg introuvable dans le PATH.');
  if(r.status!==0)stop('ffmpeg a échoué : '+r.stderr);
}

async function installer(id,choix,debut='0',duree='6'){
  if(!EXOS[id])stop('Exercice inconnu : '+id);
  if(!choix)stop('Indique un choix : pexels:123, pixabay:456 ou un fichier vidéo.');
  if(!(+debut>=0)||!(+duree>0))stop('Début et durée doivent être des nombres de secondes.');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'camp-video-'));
  try{
    let entree,meta={};
    if(fs.existsSync(choix)){entree=path.resolve(choix);}
    else{
      const v=Object.values(lireJson(CANDIDATS,{})).flatMap(x=>x.res||[]).find(x=>x.choix===choix);
      if(!v)stop(choix+' n’est ni un fichier, ni un candidat connu. Lance d’abord : node outils/videos.mjs chercher '+id);
      const r=await fetch(v.video);
      if(!r.ok)stop('Téléchargement refusé : HTTP '+r.status);
      entree=path.join(tmp,'source.mp4');
      fs.writeFileSync(entree,Buffer.from(await r.arrayBuffer()));
      meta={source:v.source,auteur:v.auteur,url:v.url};
    }
    const mp4=path.join(tmp,'c.mp4'),jpg=path.join(tmp,'c.jpg');
    /* 544 × 408 : le 4:3 des cartes, en dimensions paires comme l'exige le codec. Muet, démarrage rapide. */
    const filtre='scale=544:408:force_original_aspect_ratio=increase,crop=544:408,setsar=1';
    ffmpeg(['-ss',debut,'-t',duree,'-i',entree,'-an','-vf',filtre,'-c:v','libx264','-profile:v','main','-pix_fmt','yuv420p','-crf','30','-preset','slow','-movflags','+faststart',mp4]);
    ffmpeg(['-i',mp4,'-frames:v','1','-q:v','5',jpg]);
    const nom=id+'-'+crypto.createHash('sha256').update(fs.readFileSync(mp4)).digest('hex').slice(0,8);
    fs.mkdirSync(DOSSIER,{recursive:true});
    const clips=lireClips();
    const ancien=clips[id]&&clips[id].f;
    fs.copyFileSync(mp4,path.join(DOSSIER,nom+'.mp4'));
    fs.copyFileSync(jpg,path.join(DOSSIER,nom+'.jpg'));
    if(ancien&&ancien!==nom)supprimerFichiers(ancien);
    clips[id]={f:nom,...meta};
    ecrireClips(clips);
    console.log(id+' installé : videos/'+nom+'.mp4 ('+Math.round(fs.statSync(mp4).size/1024)+' Ko)');
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
/* Découpe et compresse un extrait : une boucle de répétitions complètes, recadrée sur le geste. */
function encoder(entree,dossier,{debut=0,duree=6,crop,filtre}){
  const mp4=path.join(dossier,'c.mp4'),jpg=path.join(dossier,'c.jpg');
  const fit=crop?'crop='+crop+',scale=544:408':'scale=544:408:force_original_aspect_ratio=increase,crop=544:408';
  ffmpeg(['-ss',String(debut),'-t',String(duree),'-i',entree,'-an','-vf',fit+(filtre?','+filtre:'')+',setsar=1,fps=24','-c:v','libx264','-profile:v','main','-pix_fmt','yuv420p','-crf','30','-preset','slow','-movflags','+faststart',mp4]);
  ffmpeg(['-i',mp4,'-frames:v','1','-q:v','5',jpg]);
  return{mp4,jpg};
}
function publier(id,{mp4,jpg},meta){
  const nom=id+'-'+crypto.createHash('sha256').update(fs.readFileSync(mp4)).digest('hex').slice(0,8);
  fs.mkdirSync(DOSSIER,{recursive:true});
  const clips=lireClips(),ancien=clips[id]&&clips[id].f;
  fs.copyFileSync(mp4,path.join(DOSSIER,nom+'.mp4'));
  fs.copyFileSync(jpg,path.join(DOSSIER,nom+'.jpg'));
  if(ancien&&ancien!==nom)supprimerFichiers(ancien);
  clips[id]={f:nom,...meta};
  ecrireClips(clips);
  console.log(id+' installé : videos/'+nom+'.mp4 ('+Math.round(fs.statSync(mp4).size/1024)+' Ko)');
}
async function appliquer(ids){
  const sel=lireJson(ICI('outils/selection.json'),null);if(!sel)stop('outils/selection.json illisible.');
  for(const id of ids)if(!sel[id])stop(id+' n’est pas dans la sélection.');
  /* sources volumineuses : gardées hors du dépôt entre deux lancements */
  const cache=path.join(os.tmpdir(),'camp-sources');fs.mkdirSync(cache,{recursive:true});
  for(const id of ids.length?ids:Object.keys(sel)){
    const s=sel[id],src=path.join(cache,crypto.createHash('sha256').update(s.fichier).digest('hex').slice(0,16));
    if(!fs.existsSync(src)){
      const r=await fetch(s.fichier,{headers:{'User-Agent':'CampApp/1.0 (application personnelle ; farhad951.github.io/camp)'}});
      if(!r.ok)stop(id+' : téléchargement refusé, HTTP '+r.status);
      fs.writeFileSync(src,Buffer.from(await r.arrayBuffer()));
    }
    const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'camp-video-'));
    try{publier(id,encoder(src,tmp,s),{source:s.source,auteur:s.auteur,url:s.url,licence:s.licence,licenceUrl:s.licenceUrl,...(s.variante?{variante:s.variante}:{})});}
    finally{fs.rmSync(tmp,{recursive:true,force:true});}
  }
}
function supprimerFichiers(f){for(const x of ['.mp4','.jpg'])fs.rmSync(path.join(DOSSIER,f+x),{force:true});}

function retirer(id){
  const c=lireClips();if(!c[id])stop(id+' n’a pas de clip installé.');
  supprimerFichiers(c[id].f);delete c[id];ecrireClips(c);console.log(id+' retiré.');
}
function etat(){
  const c=lireClips(),ids=Object.keys(EXOS);let poids=0;
  for(const id of ids){
    if(!c[id]){console.log('  à faire  '+id);continue;}
    const t=fs.statSync(path.join(DOSSIER,c[id].f+'.mp4')).size;poids+=t;
    console.log('  ok       '+id+' ('+Math.round(t/1024)+' Ko, '+(c[id].source||'fichier perso')+')');
  }
  console.log('\n'+Object.keys(c).length+'/'+ids.length+' clips, '+(poids/1048576).toFixed(1)+' Mo');
}

const [cmd,...a]=process.argv.slice(2);
if(cmd==='chercher')await chercher(a);
else if(cmd==='installer')await installer(...a);
else if(cmd==='retirer')retirer(a[0]);
else if(cmd==='etat')etat();
else if(cmd==='appliquer')await appliquer(a);
else stop('Commandes : etat, chercher [exo…], installer <exo> <choix> [début] [durée], retirer <exo>, appliquer [exo…]');
