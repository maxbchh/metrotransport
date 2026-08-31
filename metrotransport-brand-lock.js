/* Metrotransport: permanent site identity and navigation lock. */
(function(){
  'use strict';
  if(window.__metrotransportBrandLock)return;
  window.__metrotransportBrandLock=true;

  const BRAND='Метрополитен и узкоколейная железная дорога Максиграда';

  function setText(el,text){if(el && el.textContent!==text)el.textContent=text;}

  function replaceLegacyText(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
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

  function apply(){
    document.title=BRAND;
    const logo=document.querySelector('header .logo-box');
    setText(logo,'МТ');
    const headBrand=document.querySelector('header > div:first-child span:not(.logo-box)');
    setText(headBrand,BRAND);

    const labels={
      btnViewProfile:'👤 Профиль',
      btnViewDatabase:'🚂 База УЖД',
      btnViewSchedule:'📅 Расписание / Табло',
      btnViewMetro:'🚇 Метро',
      btnViewNews:'📰 Новости',
      btnViewDSP:'⚙️ ДСП'
    };
    Object.keys(labels).forEach(id=>{const b=document.getElementById(id);if(b)setText(b,labels[id])});

    document.querySelectorAll('.header-controls button,.header-controls a').forEach(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(/общая база/i.test(t))setText(el,'🚂 База УЖД');
    });

    /* No ordinary/mainline railway section is part of this site. */
    hideButtonByText(/обычная железная дорога|главная железная дорога|магистраль/i);

    const db=document.getElementById('pageDatabase');
    if(db){
      db.querySelectorAll('h1,h2,h3,.page-header').forEach(el=>{
        const t=(el.textContent||'').trim();
        if(/база данных/i.test(t))el.textContent='База подвижного состава УЖД';
        else if(/железн(ая|ой) дорог/i.test(t))el.textContent=t.replace(/Максиградская железная дорога/gi,'Узкоколейная железная дорога');
      });
    }
    replaceLegacyText();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,150),{once:true});
  else setTimeout(apply,150);
  const mo=new MutationObserver(()=>apply());
  const start=()=>{if(document.body)mo.observe(document.body,{childList:true,subtree:true});};
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
