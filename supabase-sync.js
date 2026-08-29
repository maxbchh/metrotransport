/* Shared cloud synchronization for railphoto - one common site state, no accounts/login. */
(function () {
  const URL = 'https://ubhfigqpsepnpokrbdyo.supabase.co';
  const KEY = 'sb_publishable_yN8W8pvQq8hWsYMO8z1Rzw_6zKQ-8D1';
  const STATE_ID = 'main';
  let sb, timer, channel, originalSave, syncing = false;

  function installHeaderLayoutFix() {
    if (document.getElementById('railphotoHeaderLayoutStyle')) return;
    const s = document.createElement('style');
    s.id = 'railphotoHeaderLayoutStyle';
    s.textContent = `
      @media (min-width:1101px){header.no-print{flex-wrap:nowrap!important;min-width:0!important}.header-controls{margin-left:auto!important;justify-content:flex-end!important;flex-wrap:nowrap!important;min-width:0;max-width:calc(100vw - 20px)!important;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}.header-controls::-webkit-scrollbar{display:none}.header-controls>*{flex:0 0 auto!important;white-space:nowrap!important}#btnViewProfile{order:-999!important;display:flex!important;visibility:visible!important;opacity:1!important}}
      @media (max-width:1100px){header.no-print{flex-direction:column!important;align-items:stretch!important}.header-controls{width:100%!important;max-width:100%!important;overflow-x:auto!important;flex-wrap:nowrap!important;justify-content:flex-start!important}}
      #cloudSyncStatus{white-space:nowrap!important;flex:0 0 auto!important;min-width:112px;text-align:left}
    `;
    document.head.appendChild(s);
    const controls = document.querySelector('.header-controls');
    if (controls && !document.getElementById('cloudSyncStatus')) {
      const el = document.createElement('span');
      el.id = 'cloudSyncStatus';
      el.style.cssText = 'font-size:10px;color:var(--bp-text-muted);margin-left:8px;white-space:nowrap;';
      controls.appendChild(el);
    }
  }

  function status(t) {
    let el = document.getElementById('cloudSyncStatus');
    if (!el) {
      el = document.createElement('span');
      el.id = 'cloudSyncStatus';
      el.style.cssText = 'font-size:10px;color:var(--bp-text-muted);margin-left:8px;white-space:nowrap;';
      const theme = document.querySelector('.theme-toggle-btn');
      if (theme && theme.parentNode) theme.parentNode.insertBefore(el, theme.nextSibling);
    }
    el.textContent = t;
  }

  function routePanelHtml(idPrefix) {
    const inputId = `routeStationInput_${idPrefix}`;
    const listId = `routeStationList_${idPrefix}`;
    return `<div class="schedule-box no-print" id="routePanel_${idPrefix}" style="margin:0 0 12px 0;">
      <div class="page-header" style="margin-bottom:10px;"><span>🚉 Станции маршрута и последовательность</span><div class="action-buttons">
      <input id="${inputId}" type="text" placeholder="Название станции" style="padding:7px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px;">
      <button class="btn-secondary" type="button" onclick="window.railphotoAddStation('${inputId}')">➕ Добавить станцию</button></div></div>
      <div id="${listId}" class="railphoto-route-list" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;"></div>
      <small style="color:var(--bp-text-muted);">↑ ↓ меняют последовательность. Этот порядок используется при авторасчёте маршрута, в расписании и в ВУ-45.</small>
    </div>`;
  }

  function renderRoutePanel(idPrefix) {
    const list = document.getElementById(`routeStationList_${idPrefix}`);
    if (!list || typeof LINE_STATIONS === 'undefined') return;
    list.innerHTML = LINE_STATIONS.map((st,i)=>`<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 6px;border:1px solid var(--bp-border);border-radius:4px;background:var(--bp-input-bg);"><b style="color:var(--bp-text-muted);font-size:10px;">${i+1}</b><span class="type-badge">${st}</span><button type="button" title="Поднять" style="border:0;border-radius:3px;padding:2px 6px;cursor:pointer;background:var(--bp-btn-secondary);color:var(--bp-text);" onclick="window.railphotoMoveStation(${i},-1)">↑</button><button type="button" title="Опустить" style="border:0;border-radius:3px;padding:2px 6px;cursor:pointer;background:var(--bp-btn-secondary);color:var(--bp-text);" onclick="window.railphotoMoveStation(${i},1)">↓</button><button type="button" title="Удалить" style="border:0;border-radius:3px;padding:2px 6px;cursor:pointer;background:var(--bp-btn-danger);color:#fff;" onclick="window.railphotoRemoveStation(${i})">×</button></span>`).join('');
  }

  function renderAllRoutePanels(){renderRoutePanel('schedule');renderRoutePanel('vu45');}

  function refreshRouteSelectors(){
    if(typeof LINE_STATIONS==='undefined')return;
    ['tripFromStation','tripToStation','schFrom','schTo','calcFromStation','calcToStation'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;const old=el.value;
      el.innerHTML=LINE_STATIONS.map(st=>`<option value="${st}">${st}</option>`).join('');
      if(LINE_STATIONS.includes(old))el.value=old;
    });
    renderAllRoutePanels();
  }

  function persistRouteStations(){
    if(typeof profile!=='undefined') profile.lineStations=[...LINE_STATIONS];
    localStorage.setItem('rp_stations',JSON.stringify(LINE_STATIONS));
    if(typeof saveData==='function') saveData();
    refreshRouteSelectors();
    if(typeof renderScheduleBoard==='function') renderScheduleBoard();
  }

  window.railphotoAddStation=function(inputId){
    const el=document.getElementById(inputId),name=(el?.value||'').trim();
    if(!name)return;
    if(LINE_STATIONS.includes(name)){alert('Такая станция уже есть в маршруте.');return;}
    LINE_STATIONS.push(name);if(el)el.value='';persistRouteStations();
  };
  window.railphotoMoveStation=function(index,direction){
    const target=index+direction;if(target<0||target>=LINE_STATIONS.length)return;
    [LINE_STATIONS[index],LINE_STATIONS[target]]=[LINE_STATIONS[target],LINE_STATIONS[index]];persistRouteStations();
  };
  window.railphotoRemoveStation=function(index){
    if(LINE_STATIONS.length<=2){alert('Должно остаться минимум две станции маршрута.');return;}
    if(!confirm(`Удалить станцию «${LINE_STATIONS[index]}»?`))return;
    LINE_STATIONS.splice(index,1);persistRouteStations();
  };

  function installRoutePanels(){
    if(typeof LINE_STATIONS==='undefined')return;
    if(!document.getElementById('routePanel_schedule')){
      const p=document.getElementById('pageSchedule'),m=document.getElementById('stationManagementPanel');
      if(p&&m)m.insertAdjacentHTML('beforebegin',routePanelHtml('schedule'));
    }
    if(!document.getElementById('routePanel_vu45')){
      const p=document.getElementById('pageBuilder'),t=p?.querySelector('.trip-form-panel.no-print');
      if(p&&t)t.insertAdjacentHTML('beforebegin',routePanelHtml('vu45'));
    }
    refreshRouteSelectors();
  }

  function getLocalState(){
    return {
      db: typeof db!=='undefined' && Array.isArray(db) ? db : JSON.parse(localStorage.getItem('rp_db')||'[]'),
      profile: typeof profile!=='undefined' && profile ? profile : JSON.parse(localStorage.getItem('rp_profile')||'{}'),
      pinnedNotes: typeof pinnedNotes!=='undefined' && Array.isArray(pinnedNotes) ? pinnedNotes : JSON.parse(localStorage.getItem('rp_pinned')||'[]'),
      schedules: typeof schedules!=='undefined' && Array.isArray(schedules) ? schedules : JSON.parse(localStorage.getItem('rp_schedules')||'[]')
    };
  }

  function applyState(state){
    state=state||{};
    if(Array.isArray(state.db) && typeof db!=='undefined') db=state.db;
    if(state.profile && typeof profile!=='undefined') profile=state.profile;
    if(Array.isArray(state.pinnedNotes) && typeof pinnedNotes!=='undefined') pinnedNotes=state.pinnedNotes;
    if(Array.isArray(state.schedules) && typeof schedules!=='undefined') schedules=state.schedules;
    if(Array.isArray(state.profile?.lineStations) && state.profile.lineStations.length>=2 && typeof LINE_STATIONS!=='undefined'){
      LINE_STATIONS=[...state.profile.lineStations];localStorage.setItem('rp_stations',JSON.stringify(LINE_STATIONS));
    }
    localStorage.setItem('rp_db',JSON.stringify(state.db||[]));
    localStorage.setItem('rp_profile',JSON.stringify(state.profile||{}));
    localStorage.setItem('rp_pinned',JSON.stringify(state.pinnedNotes||[]));
    localStorage.setItem('rp_schedules',JSON.stringify(state.schedules||[]));
    try{if(typeof renderTable==='function')renderTable();}catch(e){console.error(e)}
    try{if(typeof renderProfile==='function')renderProfile();}catch(e){console.error(e)}
    try{if(typeof renderBuilder==='function')renderBuilder();}catch(e){console.error(e)}
    try{if(typeof renderScheduleBoard==='function')renderScheduleBoard();}catch(e){console.error(e)}
    try{if(typeof renderAnalytics==='function')renderAnalytics();}catch(e){console.error(e)}
    installRoutePanels();
  }

  async function loadShared(){
    const r=await sb.from('railphoto_shared_state').select('data,updated_at').eq('id',STATE_ID).maybeSingle();
    if(r.error)throw r.error;
    if(r.data?.data){applyState(r.data.data);status('☁️ общая база');return true;}
    await saveShared();
    status('☁️ общая база создана');
    return true;
  }

  async function saveShared(){
    if(syncing)return;
    syncing=true;status('☁️ сохраняю...');
    try{
      const state=getLocalState();
      const r=await sb.from('railphoto_shared_state').upsert({id:STATE_ID,data:state,updated_at:new Date().toISOString()},{onConflict:'id'});
      if(r.error)throw r.error;
      localStorage.setItem('rp_db',JSON.stringify(state.db));
      localStorage.setItem('rp_profile',JSON.stringify(state.profile));
      localStorage.setItem('rp_pinned',JSON.stringify(state.pinnedNotes));
      localStorage.setItem('rp_schedules',JSON.stringify(state.schedules));
      status('☁️ сохранено для всех');
    }catch(e){console.error(e);status('⚠️ ошибка общей базы');}
    finally{syncing=false;}
  }

  function queueSave(){clearTimeout(timer);timer=setTimeout(saveShared,350);}

  function realtime(){
    if(channel)sb.removeChannel(channel);
    channel=sb.channel('railphoto-shared-sync').on('postgres_changes',{event:'*',schema:'public',table:'railphoto_shared_state',filter:'id=eq.main'},async payload=>{
      if(payload.eventType==='UPDATE'||payload.eventType==='INSERT'){
        if(payload.new?.data)applyState(payload.new.data);
      }else if(payload.eventType==='DELETE'){
        await loadShared();
      }
    }).subscribe();
  }

  function loadFeatures(){
    if(document.getElementById('railphotoFeatureScript'))return;
    const s=document.createElement('script');s.id='railphotoFeatureScript';s.src='railphoto-features.js?v=7';
    s.onload=()=>loadBoardAttestation();s.onerror=()=>loadBoardAttestation();document.head.appendChild(s);
  }
  function loadBoardAttestation(){
    if(document.getElementById('railphotoBoardAttestationScript'))return;
    const s=document.createElement('script');s.id='railphotoBoardAttestationScript';s.src='railphoto-board-attestation.js?v=3';
    s.onload=loadAttestationFix;s.onerror=loadAttestationFix;document.head.appendChild(s);
  }
  function loadAttestationFix(){
    if(document.getElementById('railphotoAttestationFixScript'))return;
    const s=document.createElement('script');s.id='railphotoAttestationFixScript';s.src='railphoto-attestation-fix.js?v=2';document.head.appendChild(s);
  }

  async function start(){
    status('☁️ подключение...');
    try{
      await loadShared();
      if(!originalSave && typeof window.saveData==='function'){
        originalSave=window.saveData;
        window.saveData=function(){
          originalSave();
          if(!syncing)queueSave();
        };
      }
      realtime();
      loadFeatures();
    }catch(e){console.error(e);status('⚠️ ошибка облачной базы');loadFeatures();}
  }

  function boot(){
    installHeaderLayoutFix();
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload=async()=>{sb=window.supabase.createClient(URL,KEY);await start();};
    script.onerror=()=>status('⚠️ не удалось загрузить облачную базу');
    document.head.appendChild(script);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installHeaderLayoutFix();installRoutePanels();boot();});
  else{installHeaderLayoutFix();installRoutePanels();boot();}
})();