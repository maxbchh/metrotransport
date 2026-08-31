/* Разрешает полностью пустое метро: последнюю линию можно удалить. */
(function(){
  'use strict';
  function install(){
    try{
      if(typeof metroLines==='undefined' || !Array.isArray(metroLines)) return false;
      // Убираем автоматически навязанную линию №4, если она была создана старым скриптом.
      for(let i=metroLines.length-1;i>=0;i--){
        if(String(metroLines[i]?.number ?? '')==='4' && String(metroLines[i]?.id ?? '')==='metro-line-4-minsk'){
          metroLines.splice(i,1);
        }
      }
      // Старые скрипты могли снова попытаться добавить её. Блокируем только эту
      // автоматическую линию, не мешая пользователю создавать любые свои линии.
      if(!metroLines.__metroLastLinePushPatched){
        const originalPush=metroLines.push.bind(metroLines);
        metroLines.push=function(){
          const args=[...arguments];
          const filtered=args.filter(x=>!(x && String(x.id??'')==='metro-line-4-minsk'));
          return filtered.length ? originalPush(...filtered) : metroLines.length;
        };
        Object.defineProperty(metroLines,'__metroLastLinePushPatched',{value:true,enumerable:false});
      }
      if(typeof saveMetroData==='function') saveMetroData();
      if(typeof saveData==='function') saveData();
      if(typeof renderMetro==='function') renderMetro();
      if(typeof window.__railphotoMetroRender==='function') window.__railphotoMetroRender();
      return true;
    }catch(e){console.error('[Metro] last-line delete fix:',e);return false}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(install,350),{once:true});
  else setTimeout(install,350);
})();
