/* Максиград — городской транспортный режим. Только навигация/новая оболочка. */
(function(){'use strict';
if(window.__maxigradUrbanMode)return;window.__maxigradUrbanMode=true;
function hide(id){const e=document.getElementById(id);if(e)e.style.display='none';}
function text(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function install(){
 document.documentElement.setAttribute('data-urban-transit','1');
 document.title='Городской транспорт Максиграда';
 const title=document.querySelector('header span[style*="font-size"]');
 if(title) title.textContent='Городской транспорт Максиграда — метро, трамвай, троллейбус и автобус';
 hide('btnViewDatabase');hide('btnViewBuilder');hide('btnViewRides');hide('btnViewAnalytics');
 const sch=document.getElementById('btnViewSchedule'); if(sch){sch.innerHTML='🚉 Табло';sch.title='Остановки, станции и информационные табло';}
 const tests=document.getElementById('btnViewTests'); if(tests){tests.innerHTML='🛡 ДСП';}
 const metro=document.getElementById('btnViewMetro'); if(metro) metro.innerHTML='🚇 Метро';
 const p=document.getElementById('pageSchedule');
 if(p){
   const h=p.querySelector('.page-header span'); if(h) h.textContent='🚉 Остановки и табло городского транспорта';
   const add=p.querySelector('.page-header .action-buttons button'); if(add) add.style.display='none';
   const boxes=p.querySelectorAll('.schedule-box'); if(boxes.length>1) boxes[1].style.display='none';
   const oldStationBar=p.querySelector('.station-selector-bar'); if(oldStationBar) oldStationBar.style.display='none';
   const oldBoard=p.querySelector('.board-container'); if(oldBoard) oldBoard.style.display='none';
   if(!document.getElementById('urbanBoardsPanel')){
     const shell=document.createElement('div'); shell.id='urbanBoardsPanel'; shell.innerHTML=`
       <section class="urban-glass-card urban-board-head">
         <div><div class="urban-title">Остановки и станции</div><div class="urban-sub">Создавай собственные точки и настраивай, что показывать на табло.</div></div>
         <div class="urban-actions"><button class="urban-primary" id="urbanAddStopBtn">＋ Новая остановка</button></div>
       </section>
       <section class="urban-glass-card"><div id="urbanStopsGrid" class="urban-stops-grid"></div></section>
       <section class="urban-glass-card urban-board-editor" id="urbanBoardEditor" style="display:none"></section>`;
     p.appendChild(shell);
     document.getElementById('urbanAddStopBtn').addEventListener('click',newStop);
     renderStops();
   }
 }
 function ensureStopData(){
   try{return JSON.parse(localStorage.getItem('rp_urban_stops')||'[]')}catch(e){return[]}
 }
 function saveStops(a){localStorage.setItem('rp_urban_stops',JSON.stringify(a))}
 function newStop(){
   const name=prompt('Название остановки / станции:'); if(!name||!name.trim())return;
   const type=prompt('Тип (метро / скоростной трамвай / трамвай / троллейбус / автобус):','метро')||'метро';
   const a=ensureStopData();
   const id='urban-stop-'+Date.now();
   a.push({id,name:name.trim(),type:type.trim(),note:'',rows:[]});saveStops(a);renderStops();openEditor(id);
 }
 function renderStops(){
   const grid=document.getElementById('urbanStopsGrid');if(!grid)return; const a=ensureStopData();
   grid.innerHTML=a.length?a.map(s=>`<button class="urban-stop" data-id="${esc(s.id)}"><span class="urban-stop-icon">${icon(s.type)}</span><span><b>${esc(s.name)}</b><small>${esc(s.type)}</small></span><span class="urban-arrow">›</span></button>`).join(''):`<div class="urban-empty">Пока нет остановок. Нажми «＋ Новая остановка».</div>`;
   grid.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.id)));
 }
 function openEditor(id){
   const a=ensureStopData(),s=a.find(x=>x.id===id); if(!s)return; const e=document.getElementById('urbanBoardEditor');e.style.display='block';
   e.innerHTML=`<div class="urban-editor-top"><div><div class="urban-title">${esc(s.name)}</div><div class="urban-sub">${esc(s.type)}</div></div><div><button class="urban-secondary" id="urbanClose">Закрыть</button><button class="urban-danger" id="urbanDelete">Удалить</button></div></div>
   <div class="urban-form-grid"><label>Название<input id="ubName" value="${esc(s.name)}"></label><label>Тип<select id="ubType"><option>метро</option><option>скоростной трамвай</option><option>трамвай</option><option>троллейбус</option><option>автобус</option></select></label><label class="urban-full">Примечание<textarea id="ubNote" rows="2" placeholder="Скоростной трамвай, пересадка, вход...">${esc(s.note||'')}</textarea></label></div>
   <div class="urban-route-list"><div class="urban-section-title">Маршруты на табло</div><div id="urbanRows"></div><button class="urban-secondary" id="urbanAddRow">＋ Добавить маршрут</button></div>`;
   document.getElementById('ubType').value=s.type;
   document.getElementById('urbanClose').onclick=()=>e.style.display='none';
   document.getElementById('urbanDelete').onclick=()=>{if(confirm('Удалить эту остановку?')){saveStops(a.filter(x=>x.id!==id));e.style.display='none';renderStops()}};
   document.getElementById('urbanAddRow').onclick=()=>{s.rows=s.rows||[];s.rows.push({route:'',to:'',time:'',status:'По расписанию',note:''});saveStops(a);openEditor(id)};
   const rowsEl=document.getElementById('urbanRows');s.rows=s.rows||[];
   rowsEl.innerHTML=s.rows.length?s.rows.map((r,i)=>`<div class="urban-route-row"><input data-i="${i}" data-k="route" value="${esc(r.route||'')}" placeholder="№ маршрута"><input data-i="${i}" data-k="to" value="${esc(r.to||'')}" placeholder="Куда"><input data-i="${i}" data-k="time" value="${esc(r.time||'')}" placeholder="12:15"><select data-i="${i}" data-k="status"><option>По расписанию</option><option>Задерживается</option><option>Отменён</option><option>Изменён маршрут</option><option>Прибыл</option><option>Отправился</option></select><input data-i="${i}" data-k="note" value="${esc(r.note||'')}" placeholder="Примечание"><button class="urban-danger urban-mini" data-del="${i}">×</button></div>`).join(''):`<div class="urban-empty">Маршруты пока не добавлены.</div>`;
   s.rows.forEach((r,i)=>{const q=rowsEl.querySelector(`[data-i="${i}"][data-k="status"]`);if(q)q.value=r.status||'По расписанию'});
   rowsEl.querySelectorAll('input,select').forEach(inp=>inp.addEventListener('change',()=>{const i=+inp.dataset.i,k=inp.dataset.k;s.rows[i][k]=inp.value;saveStops(a)}));
   rowsEl.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{s.rows.splice(+b.dataset.del,1);saveStops(a);openEditor(id)});
   const saveMeta=()=>{s.name=document.getElementById('ubName').value.trim()||s.name;s.type=document.getElementById('ubType').value;s.note=document.getElementById('ubNote').value;saveStops(a);renderStops()};
   document.getElementById('ubName').addEventListener('change',saveMeta);document.getElementById('ubType').addEventListener('change',saveMeta);document.getElementById('ubNote').addEventListener('change',saveMeta);
   e.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function icon(t){t=(t||'').toLowerCase();return t.includes('метро')?'🚇':t.includes('трам')?'🚊':t.includes('трол')?'🚎':'🚌'}
 function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();