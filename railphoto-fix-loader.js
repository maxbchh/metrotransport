/* Railphoto — compatibility loader. Loads the current stable feature layer. */
(function(){
  'use strict';
  if(window.__railphotoFixLoaderReady)return;
  window.__railphotoFixLoaderReady=true;

  const CURRENT='https://raw.githubusercontent.com/maxbchh/railphoto/a2a2b2fdc89d936e4e3a09a0ac95317070573147/railphoto-features.js';
  const s=document.createElement('script');
  s.src=CURRENT;
  s.onload=function(){
    try{installQuantityEditor();}catch(e){console.error('[Railphoto quantity editor]',e);}
    try{installRunsTab();}catch(e){console.error('[Railphoto runs tab]',e);}
  };
  s.onerror=function(){console.error('[Railphoto] Current feature module failed to load.');};
  document.head.appendChild(s);

  function ensure(){
    const form=document.getElementById('vehicleForm');
    if(!form)return;
    const grid=form.querySelector('.form-grid');
    if(!grid)return;

    let box=document.getElementById('railphotoFormQtyBox');
    if(!box){
      box=document.createElement('div');
      box.id='railphotoFormQtyBox';
      box.className='railphoto-form-qty';
      box.innerHTML='<label>Количество вагонов / секций:</label><input id="formCompositionCount" type="number" min="1" step="1" value="1" title="Для пассажирского состава — количество вагонов; для МВПС — количество секций">';
    }

    const lengthInput=document.getElementById('formLength');
    const lengthBox=lengthInput?.parentElement;
    if(lengthBox && lengthBox.parentElement===grid){
      lengthBox.insertAdjacentElement('afterend',box);
    }else if(!box.parentElement){
      grid.appendChild(box);
    }

    const input=document.getElementById('formCompositionCount');
    if(input && !input.dataset.qtyBound){
      input.dataset.qtyBound='1';
      input.addEventListener('click',e=>e.stopPropagation());
      input.addEventListener('mousedown',e=>e.stopPropagation());
    }
  }

  function installQuantityEditor(){
    ensure();
    const observer=new MutationObserver(ensure);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(ensure,100);
    setTimeout(ensure,500);
  }

  /* -------------------------------------------------------------------------
     Separate top-level "Рейсы" workspace.
     The old small dispatcher tabs are hidden from their old location and
     their useful functions are collected here. Existing data/functions stay.
     ------------------------------------------------------------------------- */
  function installRunsTab(){
    if(document.getElementById('railphotoRunsTab'))return;

    const style=document.createElement('style');
    style.id='railphoto-runs-style';
    style.textContent=`
      #railphotoRunsTab{display:flex!important;}
      #railphotoRunsTab.railphoto-runs-visible{display:flex!important;}
      #railphotoRunsPanel{display:none;background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:6px;box-shadow:var(--bp-box-shadow);margin:16px 20px;padding:16px;position:relative;z-index:20;}
      #railphotoRunsPanel.railphoto-runs-fullscreen{margin:0;min-height:calc(100vh - 90px);border:0;border-radius:0;box-shadow:none;}
      #railphotoRunsPanel h2{font-size:18px;margin:0 0 12px;color:var(--bp-text);}
      .railphoto-runs-toolbar{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;}
      .railphoto-runs-toolbar button{background:var(--bp-btn-secondary);color:var(--bp-text);border:1px solid var(--bp-border);padding:7px 12px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:bold;}
      .railphoto-runs-toolbar button.active{background:var(--bp-link);color:#fff;border-color:var(--bp-link);}
      .railphoto-run-card{border:1px solid var(--bp-border);border-left:4px solid var(--bp-link);border-radius:5px;padding:11px;margin:8px 0;background:var(--bp-input-bg);}
      .railphoto-run-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;font-weight:bold;}
      .railphoto-run-number{font-size:16px;color:var(--bp-link);}
      .railphoto-run-route{font-size:12px;color:var(--bp-text);}
      .railphoto-run-meta{display:flex;gap:14px;flex-wrap:wrap;margin-top:7px;color:var(--bp-text-muted);font-size:11px;}
      .railphoto-run-ps{margin-top:8px;padding-top:7px;border-top:1px solid var(--bp-border);font-size:11px;color:var(--bp-text);}
      .railphoto-run-actions{margin-top:9px;display:flex;gap:7px;flex-wrap:wrap;}
      .railphoto-run-actions button{padding:5px 9px;border:1px solid var(--bp-border);border-radius:3px;background:var(--bp-btn-secondary);color:var(--bp-text);cursor:pointer;font-size:10px;font-weight:bold;}
      .railphoto-run-actions .danger{background:var(--bp-btn-danger);color:#fff;border-color:var(--bp-btn-danger);}
      .railphoto-run-empty{padding:20px;text-align:center;color:var(--bp-text-muted);border:1px dashed var(--bp-border);border-radius:5px;}
      .railphoto-runs-stat{display:inline-block;margin-right:14px;font-size:11px;color:var(--bp-text-muted);}
      .railphoto-runs-stat b{color:var(--bp-link);font-size:15px;}
      .railphoto-run-section-title{font-size:13px;font-weight:bold;margin:14px 0 7px;color:var(--bp-text);}
      .railphoto-run-history{width:100%;border-collapse:collapse;font-size:11px;}
      .railphoto-run-history th,.railphoto-run-history td{border:1px solid var(--bp-border);padding:7px;text-align:left;}
      .railphoto-run-history th{background:var(--bp-table-header);color:var(--bp-text);}
      .railphoto-run-map{display:flex;gap:7px;align-items:center;overflow:auto;padding:18px 4px;}
      .railphoto-run-station{min-width:125px;text-align:center;padding:10px;border:2px solid var(--bp-link);border-radius:8px;background:var(--bp-card-bg);color:var(--bp-text);font-weight:bold;}
      .railphoto-run-line{height:4px;min-width:35px;background:var(--bp-link);border-radius:4px;}
      .railphoto-run-map-note{color:var(--bp-text-muted);font-size:10px;margin-top:5px;}
      .railphoto-runs-back{float:right;}
    `;
    document.head.appendChild(style);

    const header=document.querySelector('header');
    if(!header)return;
    const controls=header.querySelector('.header-controls')||header;
    const btn=document.createElement('button');
    btn.id='railphotoRunsTab';
    btn.className='nav-tab-btn';
    btn.type='button';
    btn.innerHTML='🚆 Рейсы';
    controls.appendChild(btn);

    const panel=document.createElement('section');
    panel.id='railphotoRunsPanel';
    panel.innerHTML=`
      <div class="page-header"><span>🚆 Рейсы</span><button type="button" class="btn-secondary railphoto-runs-back" id="railphotoRunsBack">← Вернуться</button></div>
      <div class="railphoto-runs-toolbar">
        <button type="button" data-runs-view="active" class="active">Активные рейсы</button>
        <button type="button" data-runs-view="all">Все рейсы</button>
        <button type="button" data-runs-view="routes">Маршруты и расписание</button>
        <button type="button" data-runs-view="map">Схема ЖД</button>
        <button type="button" data-runs-view="history">История ПС</button>
      </div>
      <div id="railphotoRunsStats"></div>
      <div id="railphotoRunsContent"></div>
    `;
    const wrapper=document.querySelector('.main-wrapper');
    if(wrapper)wrapper.insertBefore(panel,wrapper.firstChild);else document.body.insertBefore(panel,document.body.firstChild);

    let hiddenMain=[];
    function hideMainForRuns(){
      const w=document.querySelector('.main-wrapper');
      if(!w)return;
      hiddenMain=[];
      Array.from(w.children).forEach(el=>{
        if(el===panel)return;
        hiddenMain.push([el,el.style.display]);
        el.style.display='none';
      });
      panel.classList.add('railphoto-runs-fullscreen');
    }
    function restoreMain(){
      hiddenMain.forEach(([el,display])=>{el.style.display=display;});
      hiddenMain=[];
      panel.classList.remove('railphoto-runs-fullscreen');
    }

    btn.addEventListener('click',()=>{
      const visible=panel.style.display==='block';
      if(visible){showMain();return;}
      showRuns('active');
    });
    document.getElementById('railphotoRunsBack')?.addEventListener('click',showMain);
    panel.querySelectorAll('[data-runs-view]').forEach(b=>b.addEventListener('click',()=>showRuns(b.dataset.runsView)));

    function hideOldDispatcherTabs(){
      document.querySelectorAll('button,a,.cat-tab').forEach(el=>{
        if(el.closest('#railphotoRunsPanel'))return;
        const t=(el.textContent||'').replace(/\s+/g,' ').trim();
        if(t==='Рейсы'||t==='Схема ЖД'||t==='История ПС'){
          el.dataset.railphotoOldRunTab='1';
          el.style.display='none';
        }
      });
    }

    function getRoutes(){
      try{
        if(typeof profile!=='undefined'&&Array.isArray(profile.routeRegistry))return profile.routeRegistry;
        const r=JSON.parse(localStorage.getItem('rp_route_registry')||'[]');
        return Array.isArray(r)?r:[];
      }catch(e){return[];}
    }

    function getDb(){return typeof db!=='undefined'&&Array.isArray(db)?db:[];}

    function getActive(){
      const items=getDb();
      const map={};
      items.forEach(x=>{
        if(!x.inService)return;
        const n=String(x.inService.trainNum||'—');
        if(!map[n])map[n]={trainNum:n,service:x.inService,ps:[]};
        map[n].ps.push(x);
      });
      return Object.values(map);
    }

    function getHistory(){
      try{
        const x=JSON.parse(localStorage.getItem('rp_control_center')||'{}');
        return Array.isArray(x.history)?x.history:[];
      }catch(e){return[];}
    }

    function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}

    function showRuns(view){
      panel.style.display='block';
      btn.classList.add('active');
      document.body.classList.add('railphoto-runs-mode');
      hideMainForRuns();
      document.querySelectorAll('#railphotoRunsPanel [data-runs-view]').forEach(x=>x.classList.toggle('active',x.dataset.runsView===view));
      hideOldDispatcherTabs();
      render(view);
    }

    function showMain(){
      panel.style.display='none';
      btn.classList.remove('active');
      document.body.classList.remove('railphoto-runs-mode');
      restoreMain();
    }

    function render(view){
      const content=document.getElementById('railphotoRunsContent');
      const stats=document.getElementById('railphotoRunsStats');
      if(!content||!stats)return;
      const active=getActive();
      const routes=getRoutes();
      stats.innerHTML=`<span class="railphoto-runs-stat">Активных рейсов: <b>${active.length}</b></span><span class="railphoto-runs-stat">ПС в рейсе: <b>${active.reduce((a,r)=>a+r.ps.length,0)}</b></span><span class="railphoto-runs-stat">Маршрутов: <b>${routes.length}</b></span>`;

      if(view==='routes'){
        if(!routes.length){content.innerHTML='<div class="railphoto-run-empty">Маршруты пока не созданы.</div>';return;}
        content.innerHTML=routes.map(r=>`<div class="railphoto-run-card"><div class="railphoto-run-head"><span class="railphoto-run-number">№ ${esc(r.num||'—')}</span><span class="railphoto-run-route">${esc(r.from||'—')} → ${esc(r.to||'—')}</span></div><div class="railphoto-run-meta"><span>Тип: ${esc(r.type||'Пассажирский')}</span><span>Прибытие: ${esc(r.arr||'—')}</span><span>Отправление: ${esc(r.dep||'—')}</span><span>Вагоны/секции: ${esc(r.wagons||'—')}</span><span>Поездов на маршруте: ${esc(r.trains||'—')}</span></div><div class="railphoto-run-ps">Состав: ${esc(r.cars||r.consist||'не указан')}</div><div class="railphoto-run-ps">Примечание: ${esc(r.notes||'—')}</div></div>`).join('');
        return;
      }

      if(view==='map'){
        const seen=[];
        routes.forEach(r=>{[r.from,r.to].forEach(s=>{if(s&&s!=='—'&&!seen.includes(s))seen.push(s);});});
        const stations=seen.length?seen:['Максиград','Тверь','Минск','Москва'];
        content.innerHTML=`<div class="railphoto-run-section-title">🗺️ Схема ЖД</div><div class="railphoto-run-map">${stations.map((x,i)=>(i?'<div class="railphoto-run-line"></div>':'')+`<div class="railphoto-run-station">🚉<br>${esc(x)}</div>`).join('')}</div><div class="railphoto-run-map-note">Схема отображает станции, которые сейчас указаны в маршрутах. Старый раздел «Схема ЖД» из профиля скрыт и доступен здесь.</div>`;
        return;
      }

      if(view==='history'){
        const h=getHistory();
        content.innerHTML=`<div class="railphoto-run-section-title">📋 История ПС и рейсов</div><table class="railphoto-run-history"><thead><tr><th>Дата/время</th><th>Событие</th><th>Поезд</th><th>ПС</th></tr></thead><tbody>${h.length?h.slice().reverse().map(x=>`<tr><td>${esc(x.at)}</td><td>${esc(x.event)}</td><td>${esc(x.train||'')}</td><td>${esc(x.ps||'')}</td></tr>`).join(''):'<tr><td colspan="4">История пока пуста.</td></tr>'}</tbody></table>`;
        return;
      }

      if(view==='active'){
        if(!active.length){content.innerHTML='<div class="railphoto-run-empty">Сейчас активных рейсов нет.</div>';return;}
        content.innerHTML=active.map(r=>runCard(r)).join('');
        return;
      }

      if(!routes.length){content.innerHTML='<div class="railphoto-run-empty">Рейсов и маршрутов пока нет.</div>';return;}
      content.innerHTML=routes.map(r=>`<div class="railphoto-run-card"><div class="railphoto-run-head"><span class="railphoto-run-number">№ ${esc(r.num||'—')}</span><span class="railphoto-run-route">${esc(r.from||'—')} → ${esc(r.to||'—')}</span></div><div class="railphoto-run-meta"><span>Тип: ${esc(r.type||'Пассажирский')}</span><span>Прибытие: ${esc(r.arr||'—')}</span><span>Отправление: ${esc(r.dep||'—')}</span><span>Вагонов/секций: ${esc(r.wagons||'—')}</span><span>Поездов на маршруте: ${esc(r.trains||'—')}</span></div><div class="railphoto-run-ps">Состав: ${esc(r.cars||r.consist||'не указан')}</div><div class="railphoto-run-ps">Примечание: ${esc(r.notes||'—')}</div></div>`).join('');
    }

    function runCard(r){
      const ps=r.ps||[];
      const psText=ps.map(x=>`${esc(x.series||x.id||'—')} × ${Math.max(1,Number(x.compositionCount)||1)}`).join(', ')||'—';
      return `<div class="railphoto-run-card"><div class="railphoto-run-head"><span class="railphoto-run-number">№ ${esc(r.trainNum)}</span><span class="railphoto-run-route">${esc(r.service?.from||'—')} → ${esc(r.service?.to||'—')}</span></div><div class="railphoto-run-meta"><span>Отправление: ${esc(r.service?.depTime||'—')}</span><span>ПС: ${ps.length}</span></div><div class="railphoto-run-ps"><b>Подвижной состав:</b> ${psText}</div><div class="railphoto-run-actions"><button type="button" class="danger" data-release-train="${esc(r.trainNum)}">Снять весь состав с рейса</button></div></div>`;
    }

    panel.addEventListener('click',e=>{
      const b=e.target.closest('[data-release-train]');
      if(!b)return;
      const train=String(b.dataset.releaseTrain);
      if(!confirm(`Снять весь состав №${train} с рейса?`))return;
      const items=getDb();
      items.forEach(x=>{if(x.inService&&String(x.inService.trainNum)===train)x.inService=null;});
      try{if(typeof saveData==='function')saveData();}catch(err){}
      render('active');
      if(typeof window.paintRuns==='function')try{window.paintRuns();}catch(err){}
    });

    const observer=new MutationObserver(()=>hideOldDispatcherTabs());
    observer.observe(document.body,{childList:true,subtree:true});
    hideOldDispatcherTabs();
    setTimeout(hideOldDispatcherTabs,300);
    setTimeout(hideOldDispatcherTabs,1000);
  }
})();
