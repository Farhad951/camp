const {preparer,sleep}=require('./commun');
(async()=>{
 const t=await preparer(8777,'youtube');const {p,ok}=t;
 await p.goto(t.url);await sleep(800);
 await p.evaluate(()=>{UI.jour='2026-11-01';rendre();document.querySelector('[data-a="go-salle"]').click();});await sleep(800);
 const ids=await p.evaluate(()=>Object.keys(GESTES));let bon=0;
 for(const id of ids){
  await p.evaluate(id=>ouvrirGeste(id),id);await sleep(4500);
  const fr=p.frames().find(f=>/youtube-nocookie/.test(f.url()));
  const st=fr?await fr.evaluate(()=>{const v=document.querySelector('video'),e=document.querySelector('.ytp-error');return{t:v?+v.currentTime.toFixed(1):null,err:e&&e.offsetParent?e.textContent.slice(0,70):null};}).catch(e=>({err:'cadre:'+String(e).slice(0,50)})):{err:'pas de cadre'};
  const ok=st.t>0&&!st.err;if(ok)bon++;console.log((ok?'OK  ':'KO  ')+id.padEnd(14),JSON.stringify(st));
  await p.evaluate(()=>fermerFeuille());await sleep(500);
 }
 ok(bon+'/'+ids.length+' vidéos jouent dans le lecteur intégré',bon===ids.length);
 await t.fin();
})().catch(e=>{console.error(e);process.exit(1);});
