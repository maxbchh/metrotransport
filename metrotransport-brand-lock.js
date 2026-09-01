/* Metrotransport: permanent site identity and navigation lock. */
(function(){
  'use strict';
  if(window.__metrotransportBrandLock)return;
  window.__metrotransportBrandLock=true;
  const BRAND='Метрополитен и узкоколейная железная дорога Максиграда';
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
  function replaceLegacyText(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      if(!n.nodeValue||n.parentElement?.closest('script,style'))return;
      n.nodeValue=n.nodeValue
        .replace(/Максиградская железная дорога — база подвижного состава, управление ДСП и аналитика/gi,BRAND)
        .replace(/Максиградская железная дорога — Система управления и база подвижного состава/gi,BRAND)
        .replace(/Максиградская железная дорога/gi,'Узкоколейная железная дорога');
    });
  }
  function hideButtonByText(re){
    document.querySelectorAll('.header-controls button,.header-controls a').forEach(el=>{
      if(re.test((el.textContent||'').replace(/\s+/g,' ').trim()))el.style.display='none';
    });
  }

  /* News was accidentally left as a visual/disabled tab. Force every News tab
     to be a real navigation control without touching the other pages. */
  function fixNewsNavigation(){
    const controls=document.querySelector('.header-controls');
    if(!controls)return;
    const buttons=[...controls.querySelectorAll('button,a')].filter(el=>/новости/i.test((el.textContent||'').replace(/\s+/g,' ').trim()));
    buttons.forEach(btn=>{
      btn.disabled=false;
      btn.removeAttribute('disabled');
      btn.removeAttribute('aria-disabled');
      btn.style.display='flex';
      btn.style.pointerEvents='auto';
      btn.style.cursor='pointer';
      btn.style.opacity='1';
      btn.tabIndex=0;
      btn.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        try{
          if(typeof window.switchPage==='function'){
            window.switchPage('news');
            setTimeout(()=>ensureNewsVisible(),80);
            return false;
          }
        }catch(err){console.warn('News switchPage failed',err)}
        ensureNewsVisible();
        return false;
      };
    });
  }

  function ensureNewsVisible(){
    const candidates=[
      document.getElementById('pageNews'),
      document.getElementById('newsPage'),
      document.querySelector('[data-page="news"]'),
      document.querySelector('[id*="News" i]')
    ].filter(Boolean);
    const target=candidates[0];
    if(!target)return;
    document.querySelectorAll('.page').forEach(p=>{p.style.display='none';});
    target.style.display='block';
    document.querySelectorAll('.header-controls .nav-tab-btn').forEach(b=>b.classList.remove('active'));
    const news=[...document.querySelectorAll('.header-controls button,.header-controls a')].find(b=>/новости/i.test(b.textContent||''));
    if(news)news.classList.add('active');
  }

  function apply(){
    document.title=BRAND;
    setText(document.querySelector('header .logo-box'),'МТ');
    setText(document.querySelector('header > div:first-child span:not(.logo-box)'),BRAND);
    const labels={btnViewProfile:'👤 Профиль',btnViewDatabase:'🚂 База УЖД',btnViewSchedule:'📅 Расписание / Табло',btnViewMetro:'🚇 Метро',btnViewNews:'📰 Новости',btnViewDSP:'⚙️ ДСП'};
    Object.keys(labels).forEach(id=>{const b=document.getElementById(id);if(b)setText(b,labels[id]);});
    document.querySelectorAll('.header-controls button,.header-controls a').forEach(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(/общая база/i.test(t))setText(el,'🚂 База УЖД');
    });
    hideButtonByText(/обычная железная дорога|главная железная дорога|магистраль/i);
    const db=document.getElementById('pageDatabase');
    if(db)db.querySelectorAll('h1,h2,h3,.page-header').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(/база данных/i.test(t))el.textContent='База подвижного состава УЖД';
      else if(/железн(ая|ой) дорог/i.test(t))el.textContent=t.replace(/Максиградская железная дорога/gi,'Узкоколейная железная дорога');
    });
    fixNewsNavigation();
    replaceLegacyText();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,150),{once:true});
  else setTimeout(apply,150);
  const mo=new MutationObserver(()=>apply());
  const start=()=>{if(document.body)mo.observe(document.body,{childList:true,subtree:true});};
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
