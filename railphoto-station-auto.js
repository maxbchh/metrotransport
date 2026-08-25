/* Automatic station timetable output for railphoto */
(function(){
  'use strict';
  const KEY='rp_station_auto_settings';
  let timer=null;
  function settings(){
    try{return Object.assign({enabled:true,interval:15,rotate:true},JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {enabled:true,interval:15,rotate:true};}
  }
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
  function stations(){return (typeof LINE_STATIONS!=='undefined'&&Array.isArray(LINE_STATIONS)&&LINE_STATIONS.length)?LINE_STATIONS:['Максиград','Тверь','Минск','Москва'];}
  function panel(){return document.getElementById('railphotoStationAutoPanel');}
  function render(){
    const p=panel(); if(!p)return;
    const s=settings(), list=stations();
    const sel=p.querySelector('#rpAutoStation');
    if(sel){const old=sel.value;sel.innerHTML=list.map(x=>`<option value="${x}">${x}</option>`).join('');if(list.includes(old))sel.value=old;else if(typeof currentBoardStation!=='undefined'&&list.includes(currentBoardStation))sel.value=currentBoardStation;}
    const en=p.querySelector('#rpAutoEnabled'); if(en)en.checked=!!s.enabled;
    const ro=p.querySelector('#rpAutoRotate'); if(ro)ro.checked=!!s.rotate;
    const iv=p.querySelector('#rpAutoInterval'); if(iv)iv.value=s.interval;
    const status=p.querySelector('#rpAutoStatus'); if(status)status.textContent=s.enabled?(s.rotate?'🟢 Автовывод включён — станции переключаются автоматически':'🟢 Автовывод включён — выбрана одна станция'):'⚪ Автовывод выключен';
  }
  function choose(name){
    if(typeof selectStationBoard==='function') selectStationBoard(name);
    else if(typeof currentBoardStation!=='undefined'){currentBoardStation=name;if(typeof renderScheduleBoard==='function')renderScheduleBoard();}
  }
  function restart(){clearInterval(timer);const s=settings();if(!s.enabled)return;timer=setInterval(()=>{
    const list=stations();if(!list.length)return;
    if(s.rotate){let i=list.indexOf(typeof currentBoardStation!=='undefined'?currentBoardStation:'Максиград');i=(i+1)%list.length;choose(list[i]);}
    else if(typeof renderScheduleBoard==='function')renderScheduleBoard();
  },Math.max(5,Number(s.interval)||15)*1000);}
  function install(){
    if(document.getElementById('railphotoStationAutoPanel')){render();restart();return;}
    const page=document.getElementById('pageSchedule');if(!page)return;
    const anchor=page.querySelector('#stationManagementPanel')||page.firstElementChild;if(!anchor)return;
    const box=document.createElement('div');box.id='railphotoStationAutoPanel';box.className='schedule-box no-print';box.style.cssText='margin-bottom:12px;';
    box.innerHTML=`<div class="page-header" style="margin-bottom:8px;"><span>📡 Автоматический вывод расписания на станцию</span><span id="rpAutoStatus" style="font-size:10px;color:var(--bp-text-muted);"></span></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <label style="display:flex;gap:5px;align-items:center;"><input id="rpAutoEnabled" type="checkbox"> Включить автовывод</label>
        <label style="display:flex;gap:5px;align-items:center;"><input id="rpAutoRotate" type="checkbox"> Переключать станции</label>
        <label>Станция: <select id="rpAutoStation" style="padding:6px;background:var(--bp-input-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:3px;"></select></label>
        <label>Обновление: <input id="rpAutoInterval" type="number" min="5" max="120" style="width:65px;padding:6px;background:var(--bp-input-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:3px;"> сек.</label>
        <button id="rpAutoApply" class="btn-primary btn-sm" type="button">Применить</button>
        <button id="rpAutoNow" class="btn-secondary btn-sm" type="button">Показать сейчас</button>
      </div>
      <small style="display:block;margin-top:7px;color:var(--bp-text-muted);">Расписание берётся автоматически из созданных рейсов. На выбранной станции показываются только подходящие отправления, прибытия, стоянки и пути с учётом времени автовывода.</small>`;
    anchor.parentNode.insertBefore(box,anchor);
    box.querySelector('#rpAutoApply').onclick=()=>{const s=settings();s.enabled=box.querySelector('#rpAutoEnabled').checked;s.rotate=box.querySelector('#rpAutoRotate').checked;s.interval=Math.min(120,Math.max(5,Number(box.querySelector('#rpAutoInterval').value)||15));save(s);choose(box.querySelector('#rpAutoStation').value);render();restart();};
    box.querySelector('#rpAutoNow').onclick=()=>choose(box.querySelector('#rpAutoStation').value);
    box.querySelector('#rpAutoStation').onchange=e=>choose(e.target.value);
    render();restart();
  }
  window.railphotoInstallStationAuto=install;
  function boot(){setTimeout(install,400);setTimeout(install,1800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
