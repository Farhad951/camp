/* Lance chaque suite l'une après l'autre : npm test */
const {spawnSync}=require('child_process'),path=require('path');
const suites=['theme','parcours','coherence','hors-ligne','reseau','bouffe-visage'];
const ko=[];
for(const s of suites){
  console.log('\n=== '+s);
  const r=spawnSync(process.execPath,[path.join(__dirname,s+'.test.js')],{stdio:'inherit'});
  if(r.status!==0)ko.push(s);
}
console.log(ko.length?'\nEn échec : '+ko.join(', '):'\nToutes les suites passent');
process.exit(ko.length?1:0);
