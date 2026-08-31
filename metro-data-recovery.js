/* Автовосстановление старой БД метро. Сохраняет legacy rp_metro_stock/rp_metro_lines. */
(function(){'use strict';
const TRAINS_KEY='rp_metro_trains', LEGACY_TRAINS='rp_metro_stock', LINES_KEY='rp_metro_lines';
function read(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
function migrate(){
  let old=read(LEGACY_TRAINS); if(!Array.isArray(old)||!old.length)return 0;
  let cur=read(TRAINS_KEY); if(!Array.isArray(cur))cur=[];
  const haveIds=new Set(cur.map(x=>String(x.id||'')));
  const haveNums=new Set(cur.map(x=>String(x.number||'')));
  const statusMap={active:'Эксплуатируется',repair:'В ремонте',reserve:'В запасе',out:'Выведен из эксплуатации'};
  let added=0;
  old.forEach((x,i)=>{
    const id=String(x.id||('legacy-'+i)), num=String(x.number||'');
    if(!num||haveIds.has(id)||haveNums.has(num))return;
    cur.push({id:'metro-train-'+id,number:num,model:x.type||'',wagons:x.wagons||x.cars||8,buildYear:x.buildYear||'',factory:x.factory||'',commissionDate:x.commissionDate||'',homeDepot:x.homeDepot||x.depot||'',currentDepot:x.currentDepot||x.depot||'',lineId:x.lineId||'',state:statusMap[x.status]||x.state||'Эксплуатируется',notes:x.note||x.notes||''});
    haveIds.add(id);haveNums.add(num);added++;
  });
  localStorage.setItem(TRAINS_KEY,JSON.stringify(cur));
  const oldLines=read(LINES_KEY);
  if(Array.isArray(oldLines)&&oldLines.length){
    try{localStorage.setItem(LINES_KEY,JSON.stringify(oldLines))}catch(e){}
  }
  return added;
}
function boot(){
  const key='rp_metro_recovery_done_v2';
  if(sessionStorage.getItem(key))return;
  const added=migrate();
  if(added>0){
    sessionStorage.setItem(key,'1');
    setTimeout(()=>location.reload(),120);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
