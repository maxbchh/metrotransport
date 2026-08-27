/* Railphoto — route registry and service-line classification */
(function(){
  if(window.__railphotoRouteRegistryReady)return;
  window.__railphotoRouteRegistryReady=true;

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  const LINE_COLORS={
    yellow:{label:'Жёлтый — международные / бизнес-класс',color:'#facc15'},
    lime:{label:'Салатовый — межрегиональные 1520 мм',color:'#84cc16'},
    green:{label:'Зелёный — межрегиональные УЖД',color:'#16a34a'},
    blue:{label:'Синий — региональные / электрички',color:'#2563eb'},
    sky:{label:'Голубой — будущие региональные линии',color:'#38bdf8'},
    red:{label:'Красный — городские линии',color:'#ef4444'},
    black:{label:'Чёрный — грузовые',color:'#111827'}
  };

  const NUMBERING_RULES=[
    {min:1,max:200,category:'international',label:'1–200 — Международные поезда (скоростные или фирменные)'},
    {min:301,max:498,category:'international_long_distance',label:'301–498 — Международные поезда дальнего следования'},
    {min:601,max:698,category:'interregional_economy_1520',label:'601–698 — Межрегиональные поезда ЖД/УЖД (обычные)'},
    {min:701,max:730,category:'interregional_business',label:'701–730 — Межрегиональные поезда бизнес-класса скорого типа'},
    {min:731,max:798,category:'regional_business',label:'731–798 — Региональные поезда бизнес-класса'},
    {min:951,max:958,category:'interregional_passenger_freight',label:'951–958 — Межрегиональные (грузопассажирские)'},
    {min:2001,max:2998,category:'cargo',label:'2001–2998 — Грузовые поезда'},
    {min:6001,max:6998,category:'regional_economy',label:'6001–6998 — Региональные поезда эконом-класса (электрички)'},
    {min:7001,max:7998,category:'city',label:'7001–7998 — Городские линии'}
  ];

  const ROUTE_CATEGORIES={
    international:{label:'1–200 — Международные поезда (скоростные или фирменные)',color:'yellow',gauge:''},
    international_long_distance:{label:'301–498 — Международные поезда дальнего следования',color:'yellow',gauge:''},
    interregional_business:{label:'701–730 — Межрегиональные поезда бизнес-класса скорого типа',color:'yellow',gauge:'1520'},
    interregional_economy_1520:{label:'601–698 — Межрегиональные поезда ЖД/УЖД (обычные) — 1520 мм',color:'lime',gauge:'1520'},
    interregional_economy_uzhd:{label:'601–698 — Межрегиональные поезда ЖД/УЖД (обычные) — УЖД',color:'green',gauge:'750'},
    regional_business:{label:'731–798 — Региональные поезда бизнес-класса',color:'blue',gauge:'1520'},
    regional_economy:{label:'6001–6998 — Региональные поезда эконом-класса (электрички)',color:'blue',gauge:'1520'},
    future_regional:{label:'Будущие региональные линии',color:'sky',gauge:'1520'},
    interregional_passenger_freight:{label:'951–958 — Межрегиональные (грузопассажирские)',color:'lime',gauge:'1520'},
    city:{label:'7001–7998 — Городские линии',color:'red',gauge:'1520'},
    cargo:{label:'2001–2998 — Грузовые поезда',color:'black',gauge:''}
  };

  const TRAIN_TYPES=['Скорый','Пассажирский','Скоростной','Грузовой','Пригородный','Городской'];

  const DEFAULT_ROUTES=[
    {id:'route-101',num:'101',from:'',to:'',type:'Скорый',color:'yellow',routeCategory:'international',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Невский экспресс'},
    {id:'route-148',num:'148',from:'Калининград',to:'Москва',type:'Скорый',color:'yellow',routeCategory:'international',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'ЧС8'},
    {id:'route-743',num:'743',from:'Максиград',to:'Москва',type:'Скорый',color:'lime',routeCategory:'interregional_business',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Ласточка'},
    {id:'route-601',num:'601',from:'Забайкалье',to:'Байкальск',type:'Пассажирский',color:'green',routeCategory:'interregional_economy_uzhd',gauge:'750',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'УЖД'},
    {id:'route-6143',num:'6143',from:'Байкальск',to:'Пилотная',type:'Пригородный',color:'blue',routeCategory:'regional_economy',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Ответвление от аэропортной линии'},
    {id:'route-6741',num:'6741',from:'Аэропорт',to:'Минск',type:'Пригородный',color:'blue',routeCategory:'regional_economy',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:''},
    {id:'route-7143',num:'7143',from:'Максиград',to:'Тверь',type:'Городской',color:'red',routeCategory:'city',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Городская линия'},
    {id:'route-2891',num:'2891',from:'',to:'',type:'Грузовой',color:'black',routeCategory:'cargo',gauge:'1520',arr:'',dep:'',trains:'',wagons:'',cars:'',notes:'Грузовой'}
  ];

  function numberRule(num){
    const raw=String(num||'').trim();
    if(raw==='743')return {min:743,max:743,category:'interregional_business',label:'743 — Межрегиональный поезд бизнес-класса'};
    const n=Number(raw);
    if(!Number.isInteger(n))return null;
    return NUMBERING_RULES.find(x=>n>=x.min&&n<=x.max)||null;
  }

  function inferCategory(r){
    const rule=numberRule(r.num);
    if(rule){
      if(rule.category==='interregional_economy_1520'){
        if(String(r.gauge)==='750' || /ужд|узк|750/i.test(String(r.notes||'')))return 'interregional_economy_uzhd';
        return 'interregional_economy_1520';
      }
      return rule.category;
    }
    if(r.routeCategory && ROUTE_CATEGORIES[r.routeCategory]) return r.routeCategory;
    const note=String(r.notes||'').toLowerCase();
    if(r.gauge==='750' || /ужд|узк|750/.test(note)) return 'interregional_economy_uzhd';
    if(r.color==='green') return 'interregional_economy_uzhd';
    if(r.color==='lime') return 'interregional_economy_1520';
    if(r.color==='red' || r.type==='Городской') return 'city';
    if(r.color==='black' || r.type==='Грузовой') return 'cargo';
    if(r.color==='yellow') return 'international';
    if(r.color==='sky') return 'future_regional';
    return 'regional_economy';
  }

  function normalizeRoute(r){
    const x={...r};
    x.routeCategory=inferCategory(x);
    const meta=ROUTE_CATEGORIES[x.routeCategory]||ROUTE_CATEGORIES.regional_economy;
    if(!x.gauge) x.gauge=meta.gauge||'';
    if(!x.color) x.color=meta.color;
    if(x.routeCategory==='interregional_economy_1520' && (!x.gauge || x.gauge==='750')) x.gauge='1520';
    if(x.routeCategory==='interregional_economy_uzhd') x.gauge='750';
    if(x.routeCategory==='interregional_economy_1520') x.color='lime';
    if(x.routeCategory==='interregional_economy_uzhd') x.color='green';
    if(x.routeCategory==='interregional_business') x.color=(String(x.num).trim()==='743'?'lime':'yellow');
    if(x.routeCategory==='international' || x.routeCategory==='international_long_distance') x.color='yellow';
    if(x.routeCategory==='regional_business' || x.routeCategory==='regional_economy') x.color='blue';
    if(x.routeCategory==='interregional_passenger_freight') x.color='lime';
    if(x.routeCategory==='city') x.color='red';
    if(x.routeCategory==='cargo') x.color='black';
    return x;
  }

  function getRoutes(){
    let routes=null;
    if(typeof profile!=='undefined' && Array.isArray(profile.routeRegistry)) routes=profile.routeRegistry;
    if(!routes){try{const x=JSON.parse(localStorage.getItem('rp_route_registry')||'null');if(Array.isArray(x))routes=x;}catch(e){}}
    if(!routes) routes=DEFAULT_ROUTES.map(x=>({...x}));
    return routes.map(normalizeRoute);
  }
  function saveRoutes(routes){
    const normalized=routes.map(normalizeRoute);
    if(typeof profile!=='undefined')profile.routeRegistry=normalized;
    localStorage.setItem('rp_route_registry',JSON.stringify(normalized));
    if(typeof saveData==='function')saveData();
  }
  function ensureProfileRoutes(){
    const routes=getRoutes();
    if(typeof profile!=='undefined'&&!Array.isArray(profile.routeRegistry))profile.routeRegistry=routes;
    localStorage.setItem('rp_route_registry',JSON.stringify(routes));
    return routes;
  }

  function categoryOptions(selected){
    return Object.entries(ROUTE_CATEGORIES).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${esc(v.label)}</option>`).join('');
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
      .rr-table tbody tr.rr-line-black{color:#0f172a!important}
      .rr-table tbody tr.rr-line-black td{color:#0f172a!important}
      .rr-table tbody tr.rr-line-yellow{background:rgba(250,204,21,.20)!important}
      .rr-table tbody tr.rr-line-lime{background:rgba(132,204,22,.18)!important}
      .rr-table tbody tr.rr-line-green{background:rgba(22,163,74,.18)!important}
      .rr-table tbody tr.rr-line-blue{background:rgba(37,99,235,.16)!important}
      .rr-table tbody tr.rr-line-sky{background:rgba(56,189,248,.18)!important}
      .rr-table tbody tr.rr-line-red{background:rgba(239,68,68,.16)!important}
      .rr-table tbody tr.rr-line-black{background:rgba(31,41,55,.18)!important}
      .rr-color-dot{display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle;margin-right:5px;border:1px solid rgba(0,0,0,.25)}
      .rr-edit{width:100%;min-width:90px;padding:5px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px}
      .rr-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px}
      .rr-card{background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:5px;padding:10px}
      .rr-modal{position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:16px}
      .rr-modal-card{width:min(900px,96vw);max-height:92vh;overflow:auto;background:var(--bp-card-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:8px;padding:16px;box-shadow:0 12px 45px rgba(0,0,0,.5)}
      .rr-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .rr-form input,.rr-form select,.rr-form textarea{width:100%;padding:7px 9px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px}
      .rr-span-2{grid-column:span 2}.rr-span-3{grid-column:span 3}
      .rr-category-hint{font-size:10px;color:var(--bp-text-muted);margin-top:4px}
      .rr-numbering-hint{font-size:10px;color:var(--bp-text-muted);margin-top:4px;line-height:1.35}
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
      <div class="rr-toolbar"><input id="rrSearch" class="rr-filter" placeholder="Поиск по номеру, станции, составу..." style="flex:1;min-width:220px"><select id="rrColorFilter" class="rr-filter"><option value="">Все цвета</option>${Object.entries(LINE_COLORS).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select><select id="rrTypeFilter" class="rr-filter"><option value="">Все типы поездов</option>${TRAIN_TYPES.map(x=>`<option>${x}</option>`).join('')}</select><select id="rrCategoryFilter" class="rr-filter"><option value="">Все категории маршрутов</option>${categoryOptions('')}</select></div>
      <div class="rr-table-wrap"><table class="rr-table"><thead><tr><th>Линия</th><th>№ поезда</th><th>Категория маршрута</th><th>Колея</th><th>Станция отправления</th><th>Станция прибытия</th><th>Тип поезда</th><th>Прибытие</th><th>Отправление</th><th>Составность</th><th>Поездов на маршруте</th><th>Вагонов в поезде</th><th>Какие вагоны</th><th>Примечание</th><th>Действия</th></tr></thead><tbody id="rrBody"></tbody></table></div>
    </div>`;
  }

  function compositionSourcesHtml(){
    const items=Array.isArray(window.db)?window.db:[];
    const options=items.map(x=>`<option value="${esc(x.id)}">${esc(x.series||x.id)} — ${esc(x.category||'ПС')}</option>`).join('');
    return `<div class="rr-composition-box rr-span-3"><label><b>Составность:</b> выбери способ задания состава</label><div class="rr-composition-tabs"><button type="button" class="rr-composition-tab active" data-comp-mode="manual">✍️ Вручную</button><button type="button" class="rr-composition-tab" data-comp-mode="existing">📋 Выбрать существующие ПС</button><button type="button" class="rr-composition-tab" data-comp-mode="builder">🚆 Взять из конструктора</button></div><div id="rrCompManual" class="rr-composition-source active"><input id="rrConsist" placeholder="Например: ЧС8 + 8 вагонов"><span class="rr-composition-hint">Можно полностью написать состав вручную, как раньше.</span></div><div id="rrCompExisting" class="rr-composition-source"><select id="rrExistingPs" class="rr-existing-select" multiple>${options||'<option disabled>База ПС пока пуста</option>'}</select><div class="action-buttons" style="margin-top:7px"><button type="button" class="btn-secondary btn-sm" id="rrUseExisting">Добавить выбранные ПС</button></div><span class="rr-composition-hint">Можно выбрать несколько единиц из существующей базы ПС.</span></div><div id="rrCompBuilder" class="rr-composition-source"><div class="action-buttons"><button type="button" class="btn-secondary" id="rrUseBuilder">📋 Взять текущий состав из конструктора</button><button type="button" class="btn-secondary" id="rrOpenBuilder">🛠 Открыть конструктор</button></div><span class="rr-composition-hint">Берётся текущий состав, который сейчас собран во вкладке «Конструктор».</span></div></div>`;
  }

  function modalHtml(){return `<div id="rrModal" class="rr-modal"><div class="rr-modal-card"><div class="page-header"><span id="rrModalTitle">Добавить маршрут</span><button type="button" class="btn-secondary" id="rrClose">×</button></div><form id="rrForm" class="rr-form"><div><label>Номер поезда:</label><input id="rrNum" required><div class="rr-numbering-hint" id="rrNumberingHint">Категория и цвет определяются по номеру поезда.</div></div><div><label>Станция отправления:</label><input id="rrFrom"></div><div><label>Станция прибытия:</label><input id="rrTo"></div><div><label>Категория маршрута:</label><select id="rrRouteCategory">${categoryOptions('regional_economy')}</select><div class="rr-category-hint">Для номеров из трафарета категория автоматически выбирается по номеру. Для 601–698 колея определяет ЖД 1520 мм или УЖД.</div></div><div><label>Колея маршрута:</label><select id="rrGauge"><option value="1520">1520 мм</option><option value="750">750 мм — УЖД</option></select></div><div><label>Тип поезда:</label><select id="rrTrainType">${TRAIN_TYPES.map(x=>`<option>${x}</option>`).join('')}</select></div><div><label>Цвет линии/поезда:</label><select id="rrColor">${Object.entries(LINE_COLORS).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></div><div><label>Время прибытия:</label><input id="rrArr" type="time"></div><div><label>Время отправления:</label><input id="rrDep" type="time"></div>${compositionSourcesHtml()}<div><label>Поездов на маршруте всего:</label><input id="rrTrains" type="number" min="0"></div><div><label>Вагонов в поезде:</label><input id="rrWagons" type="number" min="0"></div><div class="rr-span-2"><label>Какие вагоны:</label><input id="rrCars" placeholder="Например: плацкарт × 6, купе × 2"></div><div class="rr-span-3"><label>Примечание:</label><textarea id="rrNotes" rows="3"></textarea></div><div class="rr-span-3 action-buttons" style="justify-content:flex-end"><button type="button" class="btn-secondary" id="rrCancel">Отмена</button><button type="submit" class="btn-primary">Сохранить маршрут</button></div></form></div></div>`;}

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
  function openBuilder(){closeModal();if(typeof switchPage==='function')switchPage('builder');}

  function applyCategoryToForm(){
    const cat=document.getElementById('rrRouteCategory')?.value;
    const meta=ROUTE_CATEGORIES[cat];if(!meta)return;
    const color=document.getElementById('rrColor');if(color)color.value=meta.color;
    const gauge=document.getElementById('rrGauge');if(gauge&&meta.gauge)gauge.value=meta.gauge;
  }

  function applyNumberingToForm(){
    const num=document.getElementById('rrNum')?.value?.trim()||'';
    const rule=numberRule(num);
    const hint=document.getElementById('rrNumberingHint');
    const cat=document.getElementById('rrRouteCategory');
    const gauge=document.getElementById('rrGauge');
    const color=document.getElementById('rrColor');
    if(!rule){if(hint)hint.textContent='Номер вне заданных диапазонов — категорию можно выбрать вручную.';return;}
    let category=rule.category;
    if(category==='interregional_economy_1520')category=(gauge?.value==='750')?'interregional_economy_uzhd':'interregional_economy_1520';
    if(cat)cat.value=category;
    const meta=ROUTE_CATEGORIES[category];
    if(meta){if(color)color.value=meta.color;if(meta.gauge&&gauge)gauge.value=meta.gauge;}
    if(hint)hint.textContent=rule.label+(rule.min===601?' — для 601–698: 1520 мм = ЖД, 750 мм = УЖД.':'');
  }

  function openModal(id){
    editId=id||null;
    const r=ensureProfileRoutes().find(x=>x.id===id);
    document.getElementById('rrModalTitle').textContent=r?'Редактировать маршрут':'Добавить маршрут';
    ['rrNum','rrFrom','rrTo','rrArr','rrDep','rrConsist','rrTrains','rrWagons','rrCars','rrNotes'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('rrTrainType').value='Пригородный';
    document.getElementById('rrRouteCategory').value='regional_economy';
    document.getElementById('rrGauge').value='1520';
    document.getElementById('rrColor').value='blue';
    if(document.getElementById('rrExistingPs'))[...document.getElementById('rrExistingPs').options].forEach(o=>o.selected=false);
    compositionMode='manual';
    if(r){
      const nr=normalizeRoute(r);
      document.getElementById('rrNum').value=nr.num||'';
      document.getElementById('rrFrom').value=nr.from||'';
      document.getElementById('rrTo').value=nr.to||'';
      document.getElementById('rrTrainType').value=nr.type||'Пригородный';
      document.getElementById('rrRouteCategory').value=nr.routeCategory||'regional_economy';
      document.getElementById('rrGauge').value=nr.gauge||'1520';
      document.getElementById('rrColor').value=nr.color||'blue';
      document.getElementById('rrArr').value=nr.arr||'';
      document.getElementById('rrDep').value=nr.dep||'';
      document.getElementById('rrConsist').value=nr.consist||'';
      document.getElementById('rrTrains').value=nr.trains||'';
      document.getElementById('rrWagons').value=nr.wagons||'';
      document.getElementById('rrCars').value=nr.cars||'';
      document.getElementById('rrNotes').value=nr.notes||'';
    }
    document.getElementById('rrModal').style.display='flex';
    setCompositionMode(compositionMode);
    applyNumberingToForm();
  }

  function closeModal(){document.getElementById('rrModal').style.display='none';}

  function saveForm(e){
    e.preventDefault();
    const routes=ensureProfileRoutes();
    const num=document.getElementById('rrNum').value.trim();
    const rule=numberRule(num);
    let cat=document.getElementById('rrRouteCategory').value;
    const gauge=document.getElementById('rrGauge').value;
    if(rule){cat=rule.category==='interregional_economy_1520'?(gauge==='750'?'interregional_economy_uzhd':'interregional_economy_1520'):rule.category;}
    const meta=ROUTE_CATEGORIES[cat]||ROUTE_CATEGORIES.regional_economy;
    const rec={id:editId||('route-'+Date.now()),num,from:document.getElementById('rrFrom').value.trim(),to:document.getElementById('rrTo').value.trim(),routeCategory:cat,gauge:gauge,type:document.getElementById('rrTrainType').value,color:document.getElementById('rrColor').value||meta.color,arr:document.getElementById('rrArr').value,dep:document.getElementById('rrDep').value,consist:document.getElementById('rrConsist').value.trim(),trains:document.getElementById('rrTrains').value,wagons:document.getElementById('rrWagons').value,cars:document.getElementById('rrCars').value.trim(),notes:document.getElementById('rrNotes').value.trim(),compositionSource:compositionMode};
    if(cat==='interregional_economy_1520')rec.color='lime',rec.gauge='1520';
    if(cat==='interregional_economy_uzhd')rec.color='green',rec.gauge='750';
    if(cat==='interregional_business')rec.color=(String(num).trim()==='743'?'lime':'yellow');
    if(cat==='international'||cat==='international_long_distance')rec.color='yellow';
    if(cat==='regional_business'||cat==='regional_economy')rec.color='blue';
    if(cat==='interregional_passenger_freight')rec.color='lime';
    if(cat==='city')rec.color='red';
    if(cat==='cargo')rec.color='black';
    const idx=routes.findIndex(x=>x.id===editId);if(idx>=0)routes[idx]=rec;else routes.push(rec);
    saveRoutes(routes);closeModal();render();
    if(typeof window.refreshTrainSelector==='function')window.refreshTrainSelector();
  }

  function del(id){if(!confirm('Удалить маршрут из таблицы?'))return;saveRoutes(ensureProfileRoutes().filter(x=>x.id!==id));render();}

  function filtered(){
    const q=(document.getElementById('rrSearch')?.value||'').toLowerCase();
    const c=document.getElementById('rrColorFilter')?.value||'';
    const t=document.getElementById('rrTypeFilter')?.value||'';
    const rc=document.getElementById('rrCategoryFilter')?.value||'';
    return ensureProfileRoutes().filter(r=>{const cat=r.routeCategory||inferCategory(r);const hay=[r.num,r.from,r.to,r.type,r.consist,r.cars,r.notes,ROUTE_CATEGORIES[cat]?.label,r.gauge].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!c||r.color===c)&&(!t||r.type===t)&&(!rc||cat===rc);});
  }

  function render(){
    const routes=filtered(),summary=document.getElementById('rrSummary');
    if(summary)summary.innerHTML=`<div class="rr-card"><b>Маршрутов</b><div style="font-size:20px">${routes.length}</div></div><div class="rr-card"><b>Международных</b><div style="font-size:20px">${routes.filter(r=>['international','international_long_distance'].includes(r.routeCategory||inferCategory(r))).length}</div></div><div class="rr-card"><b>Межрегиональных 1520 мм</b><div style="font-size:20px">${routes.filter(r=>(r.routeCategory||inferCategory(r))==='interregional_economy_1520').length}</div></div><div class="rr-card"><b>Межрегиональных УЖД</b><div style="font-size:20px">${routes.filter(r=>(r.routeCategory||inferCategory(r))==='interregional_economy_uzhd').length}</div></div><div class="rr-card"><b>Городских</b><div style="font-size:20px">${routes.filter(r=>(r.routeCategory||inferCategory(r))==='city').length}</div></div><div class="rr-card"><b>Грузовых</b><div style="font-size:20px">${routes.filter(r=>(r.routeCategory||inferCategory(r))==='cargo').length}</div></div>`;
    const body=document.getElementById('rrBody');if(!body)return;
    body.innerHTML=routes.map(r=>{const nr=normalizeRoute(r),c=LINE_COLORS[nr.color]||LINE_COLORS.blue,cat=ROUTE_CATEGORIES[nr.routeCategory]||ROUTE_CATEGORIES.regional_economy;const isFreight=nr.type==='Грузовой'||nr.color==='black';const cls=`rr-line-row rr-line-${nr.color}${isFreight?' rr-freight-row':''}`;return `<tr class="${cls}" style="color:inherit!important;box-shadow:inset 6px 0 0 ${c.color};"><td style="width:8px;padding:0;background:${c.color}!important;" title="${esc(c.label)}"></td><td><b>${esc(nr.num)}</b></td><td>${esc(cat.label)}</td><td>${esc(nr.gauge?nr.gauge+' мм':'—')}</td><td>${esc(nr.from||'—')}</td><td>${esc(nr.to||'—')}</td><td>${esc(nr.type||'—')}</td><td>${esc(nr.arr||'—')}</td><td>${esc(nr.dep||'—')}</td><td>${esc(nr.consist||'—')}</td><td>${esc(nr.trains||'—')}</td><td>${esc(nr.wagons||'—')}</td><td>${esc(nr.cars||'—')}</td><td>${esc(nr.notes||'—')}</td><td><button class="btn-secondary btn-sm" data-edit="${esc(nr.id)}">✏️</button> <button class="btn-danger btn-sm" data-del="${esc(nr.id)}">🗑</button></td></tr>`;}).join('')||'<tr><td colspan="15" style="text-align:center;padding:16px">Маршрутов пока нет</td></tr>';
    body.querySelectorAll('tr.rr-freight-row td, tr.rr-freight-row td *').forEach(el=>el.style.setProperty('color','#0f172a','important'));
  }

  function openPage(){hideExistingPages();const p=document.getElementById('railphotoRoutePage');if(p)p.style.display='block';document.getElementById('rrBtn')?.classList.add('active');render();}
  function back(){closeModal();if(typeof switchPage==='function')switchPage('schedule');else{document.getElementById('railphotoRoutePage').style.display='none';}}

  function create(){
    if(!document.getElementById('railphotoRoutePage'))document.body.insertAdjacentHTML('beforeend',pageHtml()+modalHtml());
    const header=document.querySelector('header .header-controls');
    if(header&&!document.getElementById('rrBtn')){const b=document.createElement('button');b.id='rrBtn';b.className='nav-tab-btn';b.textContent='🚆 Маршруты';b.onclick=openPage;header.insertBefore(b,document.getElementById('btnViewAnalytics')||null);}
    document.getElementById('rrAddBtn').onclick=()=>openModal(null);
    document.getElementById('rrBackBtn').onclick=back;
    document.getElementById('rrClose').onclick=closeModal;
    document.getElementById('rrCancel').onclick=closeModal;
    document.getElementById('rrForm').onsubmit=saveForm;
    document.getElementById('rrSearch').oninput=render;
    document.getElementById('rrColorFilter').onchange=render;
    document.getElementById('rrTypeFilter').onchange=render;
    document.getElementById('rrCategoryFilter').onchange=render;
    document.getElementById('rrRouteCategory').onchange=applyCategoryToForm;
    document.getElementById('rrNum').oninput=applyNumberingToForm;
    document.getElementById('rrGauge').onchange=applyNumberingToForm;
    document.getElementById('rrBody').onclick=e=>{const ed=e.target.closest('[data-edit]'),de=e.target.closest('[data-del]');if(ed)openModal(ed.dataset.edit);if(de)del(de.dataset.del);};
    document.querySelectorAll('[data-comp-mode]').forEach(b=>b.onclick=()=>setCompositionMode(b.dataset.compMode));
    document.getElementById('rrUseExisting').onclick=useExistingComposition;
    document.getElementById('rrUseBuilder').onclick=useBuilderComposition;
    document.getElementById('rrOpenBuilder').onclick=openBuilder;
  }

  function init(){installStyles();ensureProfileRoutes();create();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200));else setTimeout(init,1200);
})();