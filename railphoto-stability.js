/* Railphoto stability layer: keeps navigation and core UI clickable after feature scripts load. */
(function(){
  'use strict';
  const NAV = [
    ['btnViewProfile','profile'],
    ['btnViewDatabase','database'],
    ['btnViewBuilder','builder'],
    ['btnViewSchedule','schedule'],
    ['btnViewTests','tests'],
    ['btnViewAnalytics','analytics']
  ];

  function cleanDuplicateNav(){
    const controls=document.querySelector('.header-controls');
    if(!controls)return;
    const seen=new Set();
    [...controls.querySelectorAll('button')].forEach(btn=>{
      const id=btn.id;
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      const key=id||text;
      if(!key)return;
      if(seen.has(key)){
        btn.remove();
        return;
      }
      seen.add(key);
      btn.style.pointerEvents='auto';
      btn.style.cursor='pointer';
      btn.style.position='relative';
      btn.style.zIndex='1001';
    });

    const wanted={
      'btnViewProfile':'profile',
      'btnViewDatabase':'database',
      'btnViewBuilder':'builder',
      'btnViewSchedule':'schedule',
      'btnViewTests':'tests',
      'btnViewAnalytics':'analytics'
    };
    Object.entries(wanted).forEach(([id,page])=>{
      const b=document.getElementById(id);
      if(!b)return;
      b.onclick=function(e){
        e.preventDefault();e.stopPropagation();
        if(typeof window.switchPage==='function')window.switchPage(page);
      };
    });
  }

  function removeBlockingLayers(){
    document.querySelectorAll('.modal-overlay').forEach(el=>{
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.pointerEvents==='none')return;
      if(el.id && /^modal(Vehicle|Card|Profile|PinnedNote|Schedule)$/.test(el.id))return;
    });
    document.body.style.pointerEvents='auto';
    const header=document.querySelector('header');
    if(header)header.style.pointerEvents='auto';
  }

  function repairPages(){
    NAV.forEach(([id,page])=>{
      const b=document.getElementById(id);
      const p=document.getElementById('page'+page.charAt(0).toUpperCase()+page.slice(1));
      if(b){b.style.pointerEvents='auto';b.disabled=false;}
      if(p)p.style.pointerEvents='auto';
    });
  }

  function run(){
    cleanDuplicateNav();
    removeBlockingLayers();
    repairPages();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);
  else run();
  setTimeout(run,300);
  setTimeout(run,1000);
  setTimeout(run,2500);
})();
