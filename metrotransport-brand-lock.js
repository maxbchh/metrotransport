/* Metrotransport: permanent site identity, navigation lock and working metro entry. */
(function(){
  'use strict';
  if(window.__metrotransportBrandLock)return;
  window.__metrotransportBrandLock=true;
  const BRAND='Метрополитен и узкоколейная железная дорога Максиграда';
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
  function replaceLegacyText(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(!n.nodeValue||n.parentElement?.closest('script,style'))return;n.nodeValue=n.nodeValue.replace(/Максиградская железная дорога — база подвижного состава, управление ДСП и аналитика/gi,BRAND).replace(/Максиградская железная дорога — Система управления и база подвижного состава/gi,BRAND).replace(/Максиградская железная дорога/gi,'Узкоколейная железная дорога');});
  }
  function hideButtonByText(re){
    document.querySelectorAll('.header-controls button,.header-controls a').forEach(el=>{if(re.test((el.textContent||'').replace(/\s+/g,' ').trim()))el.style.display='none';});
  }
  function showMetro(){
    const b=document.getElementById('btnViewMetro');if(!b)return;
    b.style.display='flex';b.style.pointerEvents='auto';b.style.cursor='pointer';b.disabled=false;b.removeAttribute('disabled');
    b.onclick=function(ev){
      ev.preventDefault();ev.stopPropagation();
      try{if(typeof window.switchPage==='function')window.switchPage('metro');
        setTimeout(function(){const p=document.getElementById('pageMetro');if(p){if(getComputedStyle(p).display==='none'){document.querySelectorAll('[id^="page"]').forEach(x=>x.style.display='none');p.style.display='block';}if(typeof window.renderMetro==='function')window.renderMetro();}},100);
      }catch(e){console.error('Metro navigation:',e);}return false;
    };
  }
  function ensureMetroRuntime(){
    if(document.getElementById('metro-stable-runtime'))return;
    const s=document.createElement('script');s.id='metro-stable-runtime';s.src='metro-stable-enhancements.js?v=20260901metrofix';s.async=false;(document.head||document.documentElement).appendChild(s);
  }
  function apply(){
    document.title=BRAND;setText(document.querySelector('header .logo-box'),'МТ');setText(document.querySelector('header > div:first-child span:not(.logo-box)'),BRAND);
    const labels={btnViewProfile:'👤 Профиль',btnViewDatabase:'🚂 База УЖД',btnViewSchedule:'📅 Расписание / Табло',btnViewMetro:'🚇 Метро',btnViewNews:'📰 Новости'};
    Object.keys(labels).forEach(id=>{const b=document.getElementById(id);if(b)setText(b,labels[id]);});
    document.querySelectorAll('.header-controls button,.header-controls a').forEach(el=>{const t=(el.textContent||'').replace(/\s+/g,' ').trim();if(/общая база/i.test(t))setText(el,'🚂 База УЖД');});
    hideButtonByText(/ДСП|Маршруты/i);hideButtonByText(/обычная железная дорога|главная железная дорога|магистраль/i);showMetro();ensureMetroRuntime();
    const db=document.getElementById('pageDatabase');
    if(db)db.querySelectorAll('h1,h2,h3,.page-header').forEach(el=>{const t=(el.textContent||'').trim();if(/база данных/i.test(t))el.textContent='База подвижного состава УЖД';else if(/железн(ая|ой) дорог/i.test(t))el.textContent=t.replace(/Максиградская железная дорога/gi,'Узкоколейная железная дорога');});
    replaceLegacyText();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,150),{once:true});else setTimeout(apply,150);
  const mo=new MutationObserver(()=>apply());const start=()=>{if(document.body)mo.observe(document.body,{childList:true,subtree:true});};if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
