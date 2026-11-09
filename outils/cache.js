/* Le service worker porte l'empreinte de la version : à relancer après toute retouche de index.html ou clips.js,
   sans quoi le téléphone garde l'ancienne. npm test vérifie qu'elle est à jour.  node outils/cache.js */
const crypto=require('crypto'),fs=require('fs'),path=require('path'),R=path.join(__dirname,'..');
const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'index.html'))).update(fs.readFileSync(path.join(R,'clips.js'))).digest('hex').slice(0,10);
const f=path.join(R,'sw.js');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/const CACHE='camp-[^']*'/,"const CACHE='camp-"+h+"'"));console.log('camp-'+h);
