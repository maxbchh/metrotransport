/* Railphoto stability layer: keeps navigation and core UI clickable after feature scripts load. */
(function(){
  'use strict';
  const NAV=[
    ['btnViewProfile','profile'],['btnViewDatabase','database'],['btnViewBuilder','builder'],
    ['btnViewSchedule','schedule'],['btnViewTests','tests'],['btnViewAnalytics','analytics']
  ];
  let busy=false;
  function cleanDuplicateNav(){
    const controls=document.querySelector('.header-controls'); if(!controls)return;
    const seen=new Set();
    [...controls.querySelectorAll('button')].forEach(btn=>{
      const id=btn.id;
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const key=id||text; if(!key)return;
      if(seen.has(key)){btn.remove();return;}
      seen.add(key);
      btn.style.pointerEvents='auto';btn.style.cursor='pointer';btn.style.position='relative';btn.style.zIndex='1001';
    });
    NAV.forEach(([id,page])=>{
      const b=document.getElementById(id); if(!b)return;
      b.onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof window.switchPage==='function')window.switchPage(page)};
      b.disabled=false;b.style.pointerEvents='auto';
    });
  }
  function repairPages(){NAV.forEach(([id,page])=>{const b=document.getElementById(id),p=document.getElementById('page'+page[0].toUpperCase()+page.slice(1));if(b){b.disabled=false;b.style.pointerEvents='auto'}if(p)p.style.pointerEvents='auto'})}
  function repair(){if(busy)return;busy=true;try{cleanDuplicateNav();repairPages();document.body.style.pointerEvents='auto';const h=document.querySelector('header');if(h)h.style.pointerEvents='auto'}finally{busy=false}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repair);else repair();
  [200,600,1200,2500,5000].forEach(t=>setTimeout(repair,t));
  const controls=document.querySelector('.header-controls');
  if(controls){new MutationObserver(()=>{clearTimeout(controls._rpTimer);controls._rpTimer=setTimeout(repair,20)}).observe(controls,{childList:true,subtree:true})}
})();
