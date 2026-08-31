/* Metrotransport: local fallback for the optional cloud status. */
(function(){
  'use strict';
  if(window.__metrotransportLocalFallback)return;
  window.__metrotransportLocalFallback=true;
  function normalize(t){return String(t||'').replace(/\s+/g,' ').trim()}
  function markLocal(el){
    if(!el||el.dataset.metroLocalStatus==='1')return;
    el.dataset.metroLocalStatus='1';
    el.textContent='💾 Локальная база';
    el.title='Сайт работает локально. Данные сохраняются в браузере; ошибка облачной синхронизации не блокирует работу сайта.';
    el.style.color='var(--bp-text-muted,#667085)';
    el.style.cursor='default';
  }
  function apply(){
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length>0)return;
      const t=normalize(el.textContent);
      if(/ошибка\s+облачной\s+базы|ошибка\s+облачн/i.test(t))markLocal(el);
    });
    document.documentElement.dataset.metroLocalMode='1';
  }
  function boot(){apply();setTimeout(apply,250);setTimeout(apply,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();
