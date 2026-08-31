/* Максиград — городской транспортный режим. Навигация и новая городская оболочка. */
(function(){'use strict';
if(window.__maxigradUrbanMode)return;window.__maxigradUrbanMode=true;
function hide(id){const e=document.getElementById(id);if(e)e.style.display='none';}
function addBoardStyles(){if(document.getElementById('urban-board-matrix-style'))return;const s=document.createElement('style');s.id='urban-board-matrix-style';s.textContent=`
#urbanBoardsPanel{display:flex!important;flex-direction:column!important;gap:16px!important}
#urbanBoardsPanel .urban-glass-card{position:relative!important;overflow:hidden!important;background:linear-gradient(180deg,#15120e,#050505)!important;color:#ff9a1f!important;border:1px solid #5b320b!important;border-radius:22px!important;box-shadow:0 14px 40px rgba(0,0,0,.35),inset 0 1px rgba(255,150,40,.08)!important;font-family:"Courier New",Consolas,monospace!important;letter-spacing:.5px!important}
#urbanBoardsPanel .urban-glass-card:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.34;background-image:radial-gradient(rgba(255,145,20,.34) .7px,transparent .8px);background-size:5px 5px}
#urbanBoardsPanel .urban-glass-card>*{position:relative;z-index:1}
#urbanBoardsPanel .urban-board-head{padding:18px 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important}
#urbanBoardsPanel .urban-title{font-family:"Courier New",Consolas,monospace!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:1px!important;color:#ff9d22!important;text-shadow:0 0 4px #ff7b00,0 0 12px rgba(255,100,0,.4)!important}
#urbanBoardsPanel .urban-sub{margin-top:6px!important;color:#a85f17!important;font-family:"Courier New",Consolas,monospace!important;font-size:12px!important}
#urbanBoardsPanel .urban-actions{display:flex!important;gap:8px!important}
#urbanBoardsPanel .urban-primary,#urbanBoardsPanel .urban-secondary,#urbanBoardsPanel .urban-danger{font-family:"Courier New",Consolas,monospace!important;border-radius:12px!important;letter-spacing:.3px!important;cursor:pointer!important}
#urbanBoardsPanel .urban-primary{background:#ff8c00!important;color:#0a0805!important;border:1px solid #ffb04a!important;box-shadow:0 0 18px rgba(255,125,0,.3)!important;font-weight:800!important}
#urbanBoardsPanel .urban-secondary{background:#18120c!important;color:#ff9d22!important;border:1px solid #6a3a0c!important}
#urbanBoardsPanel .urban-danger{background:#211009!important;color:#ff6338!important;border:1px solid #72250e!important}
#urbanBoardsPanel .urban-stops-grid{padding:16px!important;display:grid!important;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))!important;gap:10px!important}
#urbanBoardsPanel .urban-stop{width:100%!important;display:flex!important;align-items:center!important;gap:12px!important;text-align:left!important;padding:14px 16px!important;background:linear-gradient(180deg,#181511,#0b0a08)!important;color:#ff9d22!important;border:1px solid #4d2a0c!important;border-radius:15px!important;font-family:"Courier New",Consolas,monospace!important;cursor:pointer!important}
#urbanBoardsPanel .urban-stop:hover{border-color:#b36412!important;box-shadow:0 0 18px rgba(255,125,0,.16)!important}
#urbanBoardsPanel .urban-stop-icon{font-size:20px!important;filter:saturate(.2) sepia(1)!important}
#urbanBoardsPanel .urban-stop b{display:block!important;color:#ffad45!important;text-shadow:0 0 5px rgba(255,130,0,.6)!important}
#urbanBoardsPanel .urban-stop small{display:block!important;margin-top:4px!important;color:#995719!important}
#urbanBoardsPanel .urban-arrow{margin-left:auto!important;color:#ff8c00!important;font-size:24px!important}
#urbanBoardsPanel .urban-empty{padding:22px!important;color:#754313!important;font-family:"Courier New",Consolas,monospace!important}
#urbanBoardsPanel .urban-board-editor{padding:20px!important}
#urbanBoardsPanel .urban-editor-top{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:14px!important;border-bottom:1px solid #4b290b!important;padding-bottom:14px!important;margin-bottom:16px!important}
#urbanBoardsPanel .urban-editor-top button{margin-left:7px!important}
#urbanBoardsPanel .urban-form-grid{display:grid!important;grid-template-columns:1fr 1fr 1.3fr!important;gap:12px!important}
#urbanBoardsPanel label{color:#b96817!important;font-size:12px!important;font-family:"Courier New",Consolas,monospace!important;text-transform:uppercase!important}
#urbanBoardsPanel input,#urbanBoardsPanel select,#urbanBoardsPanel textarea{box-sizing:border-box!important;width:100%!important;margin-top:6px!important;background:#080807!important;color:#ff9d22!important;border:1px solid #60360e!important;border-radius:9px!important;min-height:38px!important;padding:8px 10px!important;font-family:"Courier New",Consolas,monospace!important;box-shadow:inset 0 0 12px rgba(255,125,0,.06)!important}
#urbanBoardsPanel input::placeholder,#urbanBoardsPanel textarea::placeholder{color:#704313!important}
#urbanBoardsPanel .urban-full{grid-column:1/-1!important}
#urbanBoardsPanel .urban-route-list{margin-top:18px!important;border-top:1px solid #4b290b!important;padding-top:16px!important}
#urbanBoardsPanel .urban-section-title{margin-bottom:10px!important;color:#ff9d22!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:1px!important;text-shadow:0 0 5px rgba(255,130,0,.6)!important}
#urbanBoardsPanel .urban-route-row{display:grid!important;grid-template-columns:1fr 1.2fr .8fr 1.1fr 1.3fr 38px!important;gap:7px!important;align-items:center!important;margin-bottom:8px!important}
#urbanBoardsPanel .urban-mini{width:38px!important;height:38px!important;padding:0!important}
@media(max-width:900px){#urbanBoardsPanel .urban-form-grid{grid-template-columns:1fr!important}#urbanBoardsPanel .urban-full{grid-column:auto!important}#urbanBoardsPanel .urban-route-row{grid-template-columns:1fr 1fr!important}}
`;document.head.appendChild(s)}
function install(){
 document.documentElement.setAttribute('data-urban-transit','1');
 document.title='Городской транспорт Максиграда';
 const title=document.querySelector('header span[style*="font-size"]');
 if(title) title.textContent='Городской транспорт Максиграда — метро, трамвай, троллейбус и автобус';
 const logo=document.querySelector('.logo-box');if(logo)logo.textContent='МГТ';
 hide('btnViewDatabase');hide('btnViewBuilder');hide('btnViewRides');hide('btnViewAnalytics');hide('btnViewRoutes');
 const routeBtns=[...document.querySelectorAll('.nav-tab-btn')].filter(b=>/маршрут/i.test((b.textContent||'')));routeBtns.forEach(b=>b.style.display='none');
 const sch=document.getElementById('btnViewSchedule');if(sch){sch.innerHTML='🚉 Табло';sch.title='Остановки, станции и информационные табло'}
 const tests=document.getElementById('btnViewTests');if(tests)tests.innerHTML='🛡 ДСП';
 const metro=document.getElementById('btnViewMetro');if(metro)metro.innerHTML='🚇 Метро';
 hide('pageDatabase');hide('pageBuilder');hide('pageRides');hide('pageAnalytics');
 addNews();addBoardStyles();
 const p=document.getElementById('pageSchedule');
 if(p){
   const h=p.querySelector('.page-header span');if(h)h.textContent='🚉 Остановки и табло городского транспорта';
   const add=p.querySelector('.page-header .action-buttons button');if(add)add.style.display='none';
   const boxes=p.querySelectorAll('.schedule-box');if(boxes.length>1)boxes[1].style.display='none';
   hide('stationManagementPanel');
   const oldStationBar=p.querySelector('.station-selector-bar');if(oldStationBar)oldStationBar.style.display='none';
   const oldBoard=p.querySelector('.board-container');if(oldBoard)oldBoard.style.display='none';
   if(!document.getElementById('urbanBoardsPanel')){
     const shell=document.createElement('div');shell.id='urbanBoardsPanel';shell.innerHTML=`
       <section class="urban-glass-card urban-board-head"><div><div class="urban-title">Остановки и станции</div><div class="urban-sub">Создавай точки городского транспорта и настраивай, что показывать на табло.</div></div><div class="urban-actions"><button class="urban-primary" id="urbanAddStopBtn">＋ Новая остановка</button></div></section>
       <section class="urban-glass-card"><div id="urbanStopsGrid" class="urban-stops-grid"></div></section>
       <section class="urban-glass-card urban-board-editor" id="urbanBoardEditor" style="display:none"></section>`;
     p.appendChild(shell);document.getElementById('urbanAddStopBtn').addEventListener('click',newStop);renderStops();
   }
 }
}
function addNews(){
 const controls=document.querySelector('.header-controls');if(!controls)return;
 const existingNews=[...controls.querySelectorAll('.nav-tab-btn')].filter(b=>/новости/i.test((b.textContent||'')));
 let btn=existingNews.shift();existingNews.forEach(b=>b.remove());
 if(!btn){btn=document.createElement('button');btn.className='nav-tab-btn';btn.type='button';controls.insertBefore(btn,document.getElementById('btnViewMetro')||controls.firstChild)}
 btn.id='btnViewNews';btn.innerHTML='📰 Новости';btn.onclick=()=>switchPage('news');
 let page=document.getElementById('pageNews');if(!page){page=document.createElement('div');page.id='pageNews';page.className='main-wrapper';page.style.display='none';page.innerHTML='<div class="page-header"><span>📰 Новости города и транспорта</span></div><div class="urban-glass-card"><div id="urbanNewsList"></div></div>';document.body.appendChild(page)}
 const data=(()=>{try{const x=JSON.parse(localStorage.getItem('rp_news')||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}})();const list=document.getElementById('urbanNewsList');if(list)list.innerHTML=data.length?data.map(n=>'<article class="urban-news-card"><b>'+esc(n.title||'Новость')+'</b><div>'+esc(n.body||n.text||'')+'</div><small>'+esc(n.date||'')+'</small></article>').join(''):'<div class="urban-empty">Новостей пока нет.</div>';
}
function ensureStopData(){try{return JSON.parse(localStorage.getItem('rp_urban_stops')||'[]')}catch(e){return[]}}
function saveStops(a){localStorage.setItem('rp_urban_stops',JSON.stringify(a))}
function newStop(){const name=prompt('Название остановки / станции:');if(!name||!name.trim())return;const type=prompt('Тип (метро / скоростной трамвай / трамвай / троллейбус / автобус):','метро')||'метро';const a=ensureStopData();const id='urban-stop-'+Date.now();a.push({id,name:name.trim(),type:type.trim(),note:'',rows:[]});saveStops(a);renderStops();openEditor(id)}
function renderStops(){const grid=document.getElementById('urbanStopsGrid');if(!grid)return;const a=ensureStopData();grid.innerHTML=a.length?a.map(s=>'<button class="urban-stop" data-id="'+esc(s.id)+'"><span class="urban-stop-icon">'+icon(s.type)+'</span><span><b>'+esc(s.name)+'</b><small>'+esc(s.type)+'</small></span><span class="urban-arrow">›</span></button>').join(''):'<div class="urban-empty">Пока нет остановок. Нажми «＋ Новая остановка».</div>';grid.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.id)))}
function openEditor(id){const a=ensureStopData(),s=a.find(x=>x.id===id);if(!s)return;const e=document.getElementById('urbanBoardEditor');e.style.display='block';e.innerHTML='<div class="urban-editor-top"><div><div class="urban-title">'+esc(s.name)+'</div><div class="urban-sub">'+esc(s.type)+'</div></div><div><button class="urban-secondary" id="urbanClose">Закрыть</button><button class="urban-danger" id="urbanDelete">Удалить</button></div></div><div class="urban-form-grid"><label>Название<input id="ubName" value="'+esc(s.name)+'"></label><label>Тип<select id="ubType"><option>метро</option><option>скоростной трамвай</option><option>трамвай</option><option>троллейбус</option><option>автобус</option></select></label><label class="urban-full">Примечание<textarea id="ubNote" rows="2" placeholder="Скоростной трамвай, пересадка, вход...">'+esc(s.note||'')+'</textarea></label></div><div class="urban-route-list"><div class="urban-section-title">Маршруты на табло</div><div id="urbanRows"></div><button class="urban-secondary" id="urbanAddRow">＋ Добавить маршрут</button></div>';
document.getElementById('ubType').value=s.type;document.getElementById('urbanClose').onclick=()=>e.style.display='none';document.getElementById('urbanDelete').onclick=()=>{if(confirm('Удалить эту остановку?')){saveStops(a.filter(x=>x.id!==id));e.style.display='none';renderStops()}};document.getElementById('urbanAddRow').onclick=()=>{s.rows=s.rows||[];s.rows.push({route:'',to:'',time:'',status:'По расписанию',note:''});saveStops(a);openEditor(id)};const rowsEl=document.getElementById('urbanRows');s.rows=s.rows||[];rowsEl.innerHTML=s.rows.length?s.rows.map((r,i)=>'<div class="urban-route-row"><input data-i="'+i+'" data-k="route" value="'+esc(r.route||'')+'" placeholder="№ маршрута"><input data-i="'+i+'" data-k="to" value="'+esc(r.to||'')+'" placeholder="Куда"><input data-i="'+i+'" data-k="time" value="'+esc(r.time||'')+'" placeholder="12:15"><select data-i="'+i+'" data-k="status"><option>По расписанию</option><option>Задерживается</option><option>Отменён</option><option>Изменён маршрут</option><option>Прибыл</option><option>Отправился</option></select><input data-i="'+i+'" data-k="note" value="'+esc(r.note||'')+'" placeholder="Примечание"><button class="urban-danger urban-mini" data-del="'+i+'">×</button></div>').join(''):'<div class="urban-empty">Маршруты пока не добавлены.</div>';s.rows.forEach((r,i)=>{const q=rowsEl.querySelector('[data-i="'+i+'\\"][data-k="status"]');if(q)q.value=r.status||'По расписанию'});rowsEl.querySelectorAll('input,select').forEach(inp=>inp.addEventListener('change',()=>{const i=+inp.dataset.i,k=inp.dataset.k;s.rows[i][k]=inp.value;saveStops(a)}));rowsEl.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{s.rows.splice(+b.dataset.del,1);saveStops(a);openEditor(id)});const saveMeta=()=>{s.name=document.getElementById('ubName').value.trim()||s.name;s.type=document.getElementById('ubType').value;s.note=document.getElementById('ubNote').value;saveStops(a);renderStops()};document.getElementById('ubName').addEventListener('change',saveMeta);document.getElementById('ubType').addEventListener('change',saveMeta);document.getElementById('ubNote').addEventListener('change',saveMeta);e.scrollIntoView({behavior:'smooth',block:'start'})}
function icon(t){t=(t||'').toLowerCase();return t.includes('метро')?'🚇':t.includes('трам')?'🚊':t.includes('трол')?'🚎':'🚌'}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();