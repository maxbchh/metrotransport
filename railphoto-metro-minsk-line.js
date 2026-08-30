/* Максиградская железная дорога — стандартная линия метро №4 «Минская» */
(function(){
'use strict';
function boot(){
  if(typeof profile==='undefined'||!profile)return;
  if(!profile.metro)profile.metro={lines:[],trains:[]};
  if(!Array.isArray(profile.metro.lines))profile.metro.lines=[];
  if(!Array.isArray(profile.metro.trains))profile.metro.trains=[];
  const lines=profile.metro.lines;
  const exists=lines.some(l=>String(l.number||'')==='4');
  if(!exists){
    lines.push({
      id:'metro-line-4-minsk',
      number:'4',
      name:'Минская',
      color:'#9acd32',
      type:'Подземная',
      stations:[] ,
      depots:['ТЧ-1 Метродепо','ТЧ-3 Выхино']
    });
    try{
      if(typeof saveData==='function')saveData();
      else localStorage.setItem('rp_profile',JSON.stringify(profile));
    }catch(e){console.error('[Metro line 4] save failed',e)}
  }else{
    const line=lines.find(l=>String(l.number||'')==='4');
    if(line){line.name='Минская';line.color='#9acd32';line.depots=['ТЧ-1 Метродепо','ТЧ-3 Выхино'];}
    try{if(typeof saveData==='function')saveData();}catch(e){}
  }
  if(typeof window.__railphotoMetroRender==='function')window.__railphotoMetroRender();
  document.getElementById('rpmBtn')?.click();
  setTimeout(()=>document.getElementById('rpmBtn')?.click(),50);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250),{once:true});else setTimeout(boot,250);
})();
