/* Railphoto — route registry and service-line classification */
(function(){
  if(window.__railphotoRouteRegistryReady)return;
  window.__railphotoRouteRegistryReady=true;

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const LINE_COLORS={
    yellow:{label:'Жёлтый — международные / дальние',color:'#facc15'},
    lime:{label:'Салатовый — Ласточка / межрегиональные',color:'#84cc16'},
    green:{label:'Зелёный — УЖД / межрегиональные',color:'#16a34a'},
    blue:{label:'Синий — электрички / региональные',color:'#2563eb'},
    sky:{label:'Голубой — региональные эконом-класса',color:'#38bdf8'},
    red:{label:'Красный — городские линии',color:'#ef4444'},
    black:{label:'Чёрный — грузовые',color:'#111827'}
  };
  const TRAIN_TYPES=['Скорый','Пассажирский','Скоростной','Грузовой','Пригородный','Городской'];
  const DEFAULT_ROUTES=[
    {id:'route-101',num:'101',from:'',to:'',type:'Скорый',color:'yellow',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Невский экспресс'},
    {id:'route-148',num:'148',from:'Калининград',to:'Москва',type:'Скорый',color:'yellow',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'ЧС8'},
    {id:'route-743',num:'743',from:'Максиград',to:'Москва',type:'Скорый',color:'lime',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Ласточка'},
    {id:'route-601',num:'601',from:'Забайкалье',to:'Байкальск',type:'Пассажирский',color:'green',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'УЖД'},
    {id:'route-6143',num:'6143',from:'Байкальск',to:'Пилотная',type:'Пригородный',color:'blue',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Ответвление от аэропортной линии'},
    {id:'route-6741',num:'6741',from:'Аэропорт',to:'Минск',type:'Пригородный',color:'blue',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:''},
    {id:'route-7143',num:'7143',from:'Максиград',to:'Тверь',type:'Городской',color:'red',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Городская линия'},
    {id:'route-2891',num:'2891',from:'',to:'',type:'Грузовой',color:'black',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Грузовой'}
  ];

  function getRoutes(){
    if(typeof profile!=='undefined' && Array.isArray(profile.routeRegistry)) return profile.routeRegistry;
    try{const x=JSON.parse(localStorage.getItem('rp_route_registry')||'null');if(Array.isArray(x))return x;}catch(e){}
    return DEFAULT_ROUTES.map(x=>({...x}));
  }
  function saveRoutes(routes){
    if(typeof profile!=='undefined')profile.routeRegistry=routes;
    localStorage.setItem('rp_route_registry',JSON.stringify(routes));
    if(typeof saveData==='function')saveData();
  }
  function ensureProfileRoutes(){
    const routes=getRoutes();
    if(typeof profile!=='undefined'&&!Array.isArray(profile.routeRegistry))profile.routeRegistry=routes;
    localStorage.setItem('rp_route_registry',JSON.stringify(routes));
    return routes;
  }
  function installStyles(){
    if(document.getElementById('railphoto-route-registry-style'))return;
    const s=document.createElement('style');s.id='railphoto-route-registry-style';s.textContent=`
      #railphotoRoutePage{display:none}
      .rr-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
      .rr-filter{padding:7px 9px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:4px}
      .rr-table-wrap{width:100%;overflow:auto;background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:5px}
      .rr-table{width:100%;border-collapse:collapse;font-size:11px;white-space:nowrap}
      .rr-table th,.rr-table td{border:1px solid var(--bp-border);padding:7px 6px;vertical-align:middle}
      .rr-table th{background:var(--bp-table-header);color:var(--bp-text)}
      .rr-table tbody tr.rr-line-row{color:#0f172a!important;font-weight:500}
      .rr-table tbody tr.rr-line-row td{color:inherit!important;text-shadow:none!important;opacity:1!important}
      .rr-table tbody tr.rr-line-black{color:#ffffff!important}
      .rr-table tbody tr.rr-line-black td{color:inherit!important}
      .rr-table tbody tr.rr-line-yellow{background:rgba(250,204,21,.20)!important}
      .rr-table tbody tr.rr-line-lime{background:rgba(132,204,22,.18)!important}
      .rr-table tbody tr.rr-line-green{background:rgba(22,163,74,.18)!important}
      .rr-table tbody tr.rr-line-blue{background:rgba(37,99,235,.16)!important}
      .rr-table tbody tr.rr-line-sky{background:rgba(56,189,248,.18)!important}
      .rr-table tbody tr.rr-line-red{background:rgba(239,68,68,.16)!important}
      .rr-table tbody tr.rr-line-black{background:#1f2937!important}
      .rr-color-dot{display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle;margin-right:5px;border:1px solid rgba(0,0,0,.25)}
      .rr-edit{width:100%;min-width:90px;padding:5px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px}
      .rr-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px}
      .rr-card{background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:5px;padding:10px}
      .rr-modal{position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:16px}
      .rr-modal-card{width:min(900px,96vw);max-height:92vh;overflow:auto;background:var(--bp-card-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:8px;padding:16px;box-shadow:0 12px 45px rgba(0,0,0,.5)}
      .rr-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .rr-form input,.rr-form select,.rr-form textarea{width:100%;padding:7px 9px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px}
      .rr-span-2{grid-column:span 2}.rr-span-3{grid-column:span 3}
      .rr-composition-box{border:1px solid var(--bp-border);background:rgba(37,99,235,.06);border-radius:5px;padding:10px;margin-top:2px}
      .rr-composition-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
      .rr-composition-tab{border:1px solid var(--bp-border);background:var(--bp-btn-secondary);color:var(--bp-text);padding:6px 9px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:700}
      .rr-composition-tab.active{background:var(--bp-link);color:#fff;border-color:var(--bp-link)}
      .rr-composition-source{display:none}.rr-composition-source.active{display:block}
      .rr-existing-select{min-height:90px}
      .rr-composition-hint{display:block;color:var(--bp-text-muted);font-size:10px;margin-top:5px}
      @media(max-width:900px){.rr-form{grid-template-columns:1fr 1fr}.rr-span-3{grid-column:span 2}}
      @media(max-width:600px){.rr-form{grid-template-columns:1fr}.rr-span-2,.rr-span-3{grid-column:span 1}}
    `;document.head.appendChild(s);
  }
  function hideExistingPages(){
    ['profile','database','builder','schedule','analytics','tests'].forEach(p=>{const el=document.getElementById('page'+p.charAt(0).toUpperCase()+p.slice(1));if(el)el.style.display='none';});
    document.querySelectorAll('.nav-tab-btn').forEach(b=>b.classList.remove('active'));
  }
  function pageHtml(){
    return `<div id="railphotoRoutePage" class="main-wrapper">
      <div class="page-header"><span>🚆 Маршруты и линии движения</span><div class="action-buttons"><button class="btn-primary" id="rrAddBtn">＋ Добавить маршрут</button><button class="btn-secondary" id="rrBackBtn">← Назад</button></div></div>
      <div class="rr-summary" id="rrSummary"></div>
      <div class="rr-toolbar"><input id="rrSearch" class="rr-filter" placeholder="Поиск по номеру, станции, составу..." style="flex:1;min-width:220px"><select id="rrColorFilter" class="rr-filter"><option value="">Все цвета</option>${Object.entries(LINE_COLORS).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select><select id="rrTypeFilter" class="rr-filter"><option value="">Все типы поездов</option>${TRAIN_TYPES.map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="rr-table-wrap"><table class="rr-table"><thead><tr><th>Линия</th><th>№ поезда</th><th>Станция отправления</th><th>Станция прибытия</th><th>Тип поезда</th><th>Прибытие</th><th>Отправление</th><th>Составность</th><th>Поездов на маршруте</th><th>Вагонов в поезде</th><th>Какие вагоны</th><th>Примечание</th><th>Действия</th></tr></thead><tbody id="rrBody"></tbody></table></div>
    </div>`;
  }
  function compositionSourcesHtml(){
    const items=Array.isArray(window.db)?window.db:[];
    const options=items.map(x=>`<option value="${esc(x.id)}">${esc(x.series||x.id)} — ${esc(x.category||'ПС')}</option>`).join('');
    return `<div class="rr-composition-box rr-span-3"><label><b>Составность:</b> выбери способ задания состава</label><div class="rr-composition-tabs"><button type="button" class="rr-composition-tab active" data-comp-mode="manual">✍️ Вручную</button><button type="button" class="rr-composition-tab" data-comp-mode="existing">📋 Выбрать существующие ПС</button><button type="button" class="rr-composition-tab" data-comp-mode="builder">🚆 Взять из конструктора</button></div><div id="rrCompManual" class="rr-composition-source active"><input id="rrConsist" placeholder="Например: ЧС8 + 8 вагонов"><span class="rr-composition-hint">Можно полностью написать состав вручную, как раньше.</span></div><div id="rrCompExisting" class="rr-composition-source"><select id="rrExistingPs" class="rr-existing-select" multiple>${options||'<option disabled>База ПС пока пуста</option>'}</select><div class="action-buttons" style="margin-top:7px"><button type="button" class="btn-secondary btn-sm" id="rrUseExisting">Добавить выбранные ПС</button></div><span class="rr-composition-hint">Можно выбрать несколько единиц из существующей базы ПС.</span></div><div id="rrCompBuilder" class="rr-composition-source"><div class="action-buttons"><button type="button" class="btn-secondary" id="rrUseBuilder">📋 Взять текущий состав из конструктора</button><button type="button" class="btn-secondary" id="rrOpenBuilder">🛠 Открыть конструктор</button></div><span class="rr-composition-hint">Берётся текущий состав, который сейчас собран во вкладке «Конструктор».</span></div></div>`;
  }
  function modalHtml(){return `<div id="rrModal" class="rr-modal"><div class="rr-modal-card"><div class="page-header"><span id="rrModalTitle">Добавить маршрут</span><button type="button" class="btn-secondary" id="rrClose">×</button></div><form id="rrForm" class="rr-form"><div><label>Номер поезда:</label><input id="rrNum" required></div><div><label>Станция отправления:</label><input id="rrFrom"></div><div><label>Станция прибытия:</label><input id="rrTo"></div><div><label>Тип поезда:</label><select id="rrTrainType">${TRAIN_TYPES.map(x=>`<option>${x}</option>`).join('')}</select></div><div><label>Цвет линии/поезда:</label><select id="rrColor">${Object.entries(LINE_COLORS).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></div><div><label>Время прибытия:</label><input id="rrArr" type="time"></div><div><label>Время отправления:</label><input id="rrDep" type="time"></div>${compositionSourcesHtml()}<div><label>Поездов на маршруте всего:</label><input id="rrTrains" type="number" min="0"></div><div><label>Вагонов в поезде:</label><input id="rrWagons" type="number" min="0"></div><div class="rr-span-2"><label>Какие вагоны:</label><input id="rrCars" placeholder="Например: плацкарт × 6, купе × 2"></div><div class="rr-span-3"><label>Примечание:</label><textarea id="rrNotes" rows="3"></textarea></div><div class="rr-span-3 action-buttons" style="justify-content:flex-end"><button type="button" class="btn-secondary" id="rrCancel">Отмена</button><button type="submit" class="btn-primary">Сохранить маршрут</button></div></form></div></div>`;}
  let editId=null;
  let compositionMode='manual';
  function setCompositionMode(mode){
    compositionMode=mode;
    document.querySelectorAll('[data-comp-mode]').forEach(b=>b.classList.toggle('active',b.dataset.compMode===mode));
    document.querySelectorAll('.rr-composition-source').forEach(x=>x.classList.remove('active'));
    const pane=document.getElementById('rrComp'+mode.charAt(0).toUpperCase()+mode.slice(1));
    if(pane)pane.classList.add('active');
    const manual=document.getElementById('rrConsist');
    if(manual)manual.readOnly=mode!=='manual';
  }
  function buildCompositionFromItems(items){
    if(!items.length){alert('Выбери хотя бы одну единицу ПС.');return;}
    const counts={};
    items.forEach(x=>{
      const q=Math.max(1,Number(x._compositionCount||x.compositionCount)||1);
      const label=x.series||x.id;
      counts[label]=(counts[label]||0)+q;
    });
    const parts=Object.entries(counts).map(([name,q])=>`${name} × ${q}`);
    document.getElementById('rrConsist').value=parts.join(' + ');
    document.getElementById('rrWagons').value=String(items.reduce((a,x)=>a+Math.max(1,Number(x._compositionCount||x.compositionCount)||1),0));
    document.getElementById('rrCars').value=parts.join(', ');
    setCompositionMode('manual');
  }
  function useExistingComposition(){
    const ids=[...document.querySelectorAll('#rrExistingPs option:checked')].map(o=>o.value);
    const items=(Array.isArray(window.db)?window.db:[]).filter(x=>ids.includes(String(x.id)));
    buildCompositionFromItems(items);
  }
  function useBuilderComposition(){
    const items=Array.isArray(window.selectedConsist)?window.selectedConsist:[];
    if(!items.length){alert('В конструкторе сейчас нет собранного состава.');return;}
    buildCompositionFromItems(items);
  }
  function openBuilder(){
    closeModal();
    if(typeof switchPage==='function')switchPage('builder');
  }
  function openModal(id){
    editId=id||null;const r=(ensureProfileRoutes().find(x=>x.id===id));
    document.getElementById('rrModalTitle').textContent=r?'Редактировать маршрут':'Добавить маршрут';
    ['rrNum','rrFrom','rrTo','rrArr','rrDep','rrConsist','rrTrains','rrWagons','rrCars','rrNotes'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('rrTrainType').value='Пригородный';document.getElementById('rrColor').value='blue';
    if(document.getElementById('rrExistingPs'))[...document.getElementById('rrExistingPs').options].forEach(o=>o.selected=false);
    compositionMode='manual';
    if(r){document.getElementById('rrNum').value=r.num||'';document.getElementById('rrFrom').value=r.from||'';document.getElementById('rrTo').value=r.to||'';document.getElementById('rrTrainType').value=r.type||'Пригородный';document.getElementById('rrColor').value=r.color||'blue';document.getElementById('rrArr').value=r.arr||'';document.getElementById('rrDep').value=r.dep||'';document.getElementById('rrConsist').value=r.consist||'';document.getElementById('rrTrains').value=r.trains||'';document.getElementById('rrWagons').value=r.wagons||'';document.getElementById('rrCars').value=r.cars||'';document.getElementById('rrNotes').value=r.notes||'';compositionMode='manual';}
    document.getElementById('rrModal').style.display='flex';
    setCompositionMode(compositionMode);
  }
  function closeModal(){document.getElementById('rrModal').style.display='none';}
  function saveForm(e){
    e.preventDefault();const routes=ensureProfileRoutes();const rec={id:editId||('route-'+Date.now()),num:document.getElementById('rrNum').value.trim(),from:document.getElementById('rrFrom').value.trim(),to:document.getElementById('rrTo').value.trim(),type:document.getElementById('rrTrainType').value,color:document.getElementById('rrColor').value,arr:document.getElementById('rrArr').value,dep:document.getElementById('rrDep').value,consist:document.getElementById('rrConsist').value.trim(),trains:document.getElementById('rrTrains').value,wagons:document.getElementById('rrWagons').value,cars:document.getElementById('rrCars').value.trim(),notes:document.getElementById('rrNotes').value.trim(),compositionSource:compositionMode};const idx=routes.findIndex(x=>x.id===editId);if(idx>=0)routes[idx]=rec;else routes.push(rec);saveRoutes(routes);closeModal();render();}
  function del(id){if(!confirm('Удалить маршрут из таблицы?'))return;saveRoutes(ensureProfileRoutes().filter(x=>x.id!==id));render();}
  function filtered(){const q=(document.getElementById('rrSearch')?.value||'').toLowerCase(),c=document.getElementById('rrColorFilter')?.value||'',t=document.getElementById('rrTypeFilter')?.value||'';return ensureProfileRoutes().filter(r=>{const hay=[r.num,r.from,r.to,r.type,r.consist,r.cars,r.notes].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!c||r.color===c)&&(!t||r.type===t);});}
  function render(){const routes=filtered(),summary=document.getElementById('rrSummary');if(summary)summary.innerHTML=`<div class="rr-card"><b>Маршрутов</b><div style="font-size:20px">${routes.length}</div></div><div class="rr-card"><b>Городских</b><div style="font-size:20px">${routes.filter(r=>r.color==='red').length}</div></div><div class="rr-card"><b>Грузовых</b><div style="font-size:20px">${routes.filter(r=>r.color==='black').length}</div></div><div class="rr-card"><b>УЖД</b><div style="font-size:20px">${routes.filter(r=>r.color==='green').length}</div></div>`;const body=document.getElementById('rrBody');if(!body)return;body.innerHTML=routes.map(r=>{const c=LINE_COLORS[r.color]||LINE_COLORS.blue;const cls=`rr-line-row rr-line-${r.color}`;return `<tr class="${cls}" style="color:inherit!important;box-shadow:inset 6px 0 0 ${c.color};"><td style="width:8px;padding:0;background:${c.color}!important;" title="${esc(c.label)}"></td><td><b>${esc(r.num)}</b></td><td>${esc(r.from||'—')}</td><td>${esc(r.to||'—')}</td><td>${esc(r.type||'—')}</td><td>${esc(r.arr||'—')}</td><td>${esc(r.dep||'—')}</td><td>${esc(r.consist||'—')}</td><td>${esc(r.trains||'—')}</td><td>${esc(r.wagons||'—')}</td><td>${esc(r.cars||'—')}</td><td>${esc(r.notes||'—')}</td><td><button class="btn-secondary btn-sm" data-edit="${esc(r.id)}">✏️</button> <button class="btn-danger btn-sm" data-del="${esc(r.id)}">🗑</button></td></tr>`;}).join('')||'<tr><td colspan="13" style="text-align:center;padding:16px">Маршрутов пока нет</td></tr>';
  }
  function openPage(){hideExistingPages();const p=document.getElementById('railphotoRoutePage');if(p)p.style.display='block';document.getElementById('rrBtn')?.classList.add('active');render();}
  function back(){closeModal();if(typeof switchPage==='function')switchPage('schedule');else{document.getElementById('railphotoRoutePage').style.display='none';}}
  function create(){if(!document.getElementById('railphotoRoutePage'))document.body.insertAdjacentHTML('beforeend',pageHtml()+modalHtml());const header=document.querySelector('header .header-controls');if(header&&!document.getElementById('rrBtn')){const b=document.createElement('button');b.id='rrBtn';b.className='nav-tab-btn';b.textContent='🚆 Маршруты';b.onclick=openPage;header.insertBefore(b,document.getElementById('btnViewAnalytics')||null);}document.getElementById('rrAddBtn').onclick=()=>openModal(null);document.getElementById('rrBackBtn').onclick=back;document.getElementById('rrClose').onclick=closeModal;document.getElementById('rrCancel').onclick=closeModal;document.getElementById('rrForm').onsubmit=saveForm;document.getElementById('rrSearch').oninput=render;document.getElementById('rrColorFilter').onchange=render;document.getElementById('rrTypeFilter').onchange=render;document.getElementById('rrBody').onclick=e=>{const ed=e.target.closest('[data-edit]'),de=e.target.closest('[data-del]');if(ed)openModal(ed.dataset.edit);if(de)del(de.dataset.del);};document.querySelectorAll('[data-comp-mode]').forEach(b=>b.onclick=()=>setCompositionMode(b.dataset.compMode));document.getElementById('rrUseExisting').onclick=useExistingComposition;document.getElementById('rrUseBuilder').onclick=useBuilderComposition;document.getElementById('rrOpenBuilder').onclick=openBuilder;}
  function init(){installStyles();ensureProfileRoutes();create();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200));else setTimeout(init,1200);
})();