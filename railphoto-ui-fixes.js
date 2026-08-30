/* Максиградская железная дорога — стабильные улучшения БД метро */
(function(){
'use strict';
if(window.__railphotoMetroUIReady)return;
window.__railphotoMetroUIReady=true;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function metro(){
  if(typeof profile==='undefined'||!profile)return null;
  if(!profile.metro)profile.metro={lines:[],trains:[]};
  if(!Array.isArray(profile.metro.lines))profile.metro.lines=[];
  if(!Array.isArray(profile.metro.trains))profile.metro.trains=[];
  return profile.metro;
}
function save(){try{if(typeof saveData==='function')saveData();else localStorage.setItem('rp_profile',JSON.stringify(profile));}catch(e){console.error(e);}}
function ordinalOf(v){const m=String(v??'').trim().match(/(?:^|-)\s*(\d+)$/);return m?String(parseInt(m[1],10)):null;}
function usedOrdinals(d,skipId=''){const s=new Set();(d?.trains||[]).forEach(t=>{if(skipId&&t.id===skipId)return;const n=ordinalOf(t.number);if(n)s.add(n)});return s;}

function injectStyles(){
  if(document.getElementById('rpf-ui-style'))return;
  const s=document.createElement('style');s.id='rpf-ui-style';s.textContent=`
    #rmsSummary{margin-bottom:14px}.rms-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.rms-title b{font-size:14px}.rms-updated{font-size:10px;color:var(--bp-text-muted)}.rms-top{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin-bottom:10px}.rms-stat{background:var(--bp-input-bg);border:1px solid var(--bp-border);border-radius:9px;padding:10px}.rms-stat small{display:block;color:var(--bp-text-muted);font-size:9px;text-transform:uppercase;font-weight:700}.rms-stat strong{display:block;font-size:19px;color:var(--bp-link);margin-top:2px}.rms-lines{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:9px}.rms-line{border:1px solid var(--bp-border);border-left:8px solid var(--rms-color);border-radius:10px;background:var(--bp-input-bg);padding:10px}.rms-line-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.rms-line-name{font-weight:800;font-size:12px}.rms-line-count{font-weight:800;font-size:13px}.rms-line-meta{font-size:10px;color:var(--bp-text-muted);margin-top:6px}.rms-pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.rms-pill{font-size:9px;padding:3px 6px;border-radius:999px;border:1px solid var(--bp-border);background:var(--bp-card-bg)}.rms-trains{margin-top:8px;font-size:10px;line-height:1.7;color:var(--bp-text);max-height:84px;overflow:auto}.rms-trains b{color:var(--bp-link)}.rms-unassigned{border-left-color:#94a3b8}
    .rpm-delete-selected{background:#b91c1c!important;color:#fff!important;border-color:#b91c1c!important}.rpm-delete-selected:disabled{opacity:.5!important;cursor:not-allowed!important}.rpm-assign-line{margin-top:7px;display:flex;gap:7px;flex-wrap:wrap;align-items:center}.rpm-assign-line select{padding:8px;background:var(--bp-input-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:8px;min-width:220px}
    @media(max-width:700px){header{align-items:stretch!important;flex-direction:column!important;padding:10px!important}.header-controls{width:100%!important;display:flex!important;flex-wrap:wrap!important;gap:5px!important}.header-controls .nav-tab-btn,.header-controls .theme-toggle-btn{flex:1 1 calc(50% - 5px)!important;justify-content:center!important;min-width:0!important;white-space:nowrap!important}.main-wrapper{padding:13px!important}.rpm-form{grid-template-columns:1fr!important}.rpm-form .full{grid-column:auto!important}.rms-lines{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}
function refresh(){
  const q=document.getElementById('rpmSearch');
  if(q)q.dispatchEvent(new Event('input',{bubbles:true}));
  else if(typeof window.__railphotoMetroRender==='function')window.__railphotoMetroRender();
}
function selectedIds(){return [...document.querySelectorAll('#rpmBatchList input[data-batch]:checked')].map(x=>x.dataset.batch).filter(Boolean)}
function updateDeleteButton(){const b=document.getElementById('rpmDeleteSelected');if(!b)return;const n=document.querySelectorAll('#rpmBatchList input[data-batch]:checked').length;b.disabled=!n;b.textContent=n?`🗑 Удалить выбранные (${n})`:'🗑 Удалить выбранные';}
function deleteSelected(){const d=metro();if(!d)return;const ids=selectedIds();if(!ids.length){alert('Сначала выберите поезда для удаления.');return}const rows=d.trains.filter(t=>ids.includes(t.id));if(!rows.length)return;if(!confirm(`Удалить выбранные составы из БД метро?\n\n${rows.map(t=>t.number).slice(0,15).join(', ')}${rows.length>15?' …':''}\n\nБудет удалено: ${rows.length}`))return;const set=new Set(ids);d.trains=d.trains.filter(t=>!set.has(t.id));save();refresh();updateDeleteButton();renderSummary();}
function assignSelected(){const d=metro();if(!d)return;const ids=selectedIds();const lineId=document.getElementById('rpmMassLine')?.value||'';if(!ids.length){alert('Сначала выберите поезда.');return}if(!lineId){alert('Выберите линию метро.');return}const line=d.lines.find(l=>l.id===lineId);if(!line){alert('Линия не найдена.');return}let n=0;d.trains.forEach(t=>{if(ids.includes(t.id)){t.lineId=lineId;n++}});save();refresh();updateDeleteButton();renderSummary();alert(`На линию «${(line.number?line.number+' — ':'')+line.name}» назначено составов: ${n}.`)}

function installSelectionControls(){
  const list=document.getElementById('rpmBatchList');
  const toolbar=list?.closest('.rpm-batch')?.querySelector('.rpm-toolbar');
  if(!list||!toolbar)return false;
  let del=document.getElementById('rpmDeleteSelected');
  if(!del){del=document.createElement('button');del.id='rpmDeleteSelected';del.type='button';del.className='btn-danger rpm-delete-selected';del.disabled=true;del.textContent='🗑 Удалить выбранные';del.onclick=deleteSelected;const none=document.getElementById('rpmBatchNone');if(none)none.insertAdjacentElement('afterend',del);else toolbar.appendChild(del)}
  let wrap=document.getElementById('rpmMassAssignWrap');
  if(!wrap){wrap=document.createElement('div');wrap.id='rpmMassAssignWrap';wrap.className='rpm-assign-line';wrap.innerHTML='<span style="font-size:10px;color:var(--bp-text-muted);font-weight:700">Назначить выбранные на:</span><select id="rpmMassLine"><option value="">— выберите линию —</option></select><button type="button" class="btn-primary" id="rpmMassAssignBtn">🚇 Выдать на линию</button>';toolbar.insertAdjacentElement('afterend',wrap)}
  const sel=document.getElementById('rpmMassLine');const current=sel?.value||'';if(sel){sel.innerHTML='<option value="">— выберите линию —</option>'+((metro()?.lines)||[]).map(l=>`<option value="${esc(l.id)}">${esc((l.number?l.number+' — ':'')+(l.name||'Без названия'))}</option>`).join('');sel.value=current}
  list.onchange=updateDeleteButton;
  const all=document.getElementById('rpmBatchAll'),none=document.getElementById('rpmBatchNone');if(all)all.onclick=()=>{document.querySelectorAll('#rpmBatchList input[data-batch]').forEach(x=>x.checked=true);updateDeleteButton()};if(none)none.onclick=()=>{document.querySelectorAll('#rpmBatchList input[data-batch]').forEach(x=>x.checked=false);updateDeleteButton()};
  const mb=document.getElementById('rpmMassAssignBtn');if(mb)mb.onclick=assignSelected;
  updateDeleteButton();return true;
}

function openBatchModal(){
  document.getElementById('rpfBatchModal')?.remove();const d=metro();if(!d)return;
  const lines=(d.lines||[]).map(l=>`<option value="${esc(l.id)}">${esc((l.number?l.number+' — ':'')+(l.name||'Без названия'))}</option>`).join('');
  const depots=['ТЧ-1 Метродепо','ТЧ-2 Электродепо','ТЧ-3 Выхино'];
  const states=['На мойке','В ремонте','В депо','Эксплуатируется','Не эксплуатируется','Перекрашен','Переименован','Утилизирован','Списан'];
  const o=document.createElement('div');o.id='rpfBatchModal';o.innerHTML=`<div id="rpfBatchCard"><div class="rpf-head"><span>📦 Массовое добавление ПС метро</span><button type="button" id="rpfBatchClose" class="btn-secondary">✕</button></div><div class="rpf-body"><div class="rpf-grid"><label>Модель / серия<input id="rpfModel" value="81-740" placeholder="81-740"></label><label>Депо приписки<select id="rpfDepot">${depots.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Начальный номер<input id="rpfStart" type="number" min="1" value="1"></label><label>Конечный номер<input id="rpfEnd" type="number" min="1" value="20"></label><label>Количество вагонов / секций<input id="rpfWagons" type="number" min="1" value="8"></label><label>Линия метро<select id="rpfLine"><option value="">— не назначена —</option>${lines}</select></label><label>Завод-изготовитель<input id="rpfFactory" placeholder="Метровагонмаш"></label><label>Год постройки<input id="rpfYear" type="number" min="1800" max="2200" placeholder="1977"></label><label>Дата ввода в эксплуатацию<input id="rpfCommission" type="date"></label><label>Состояние<select id="rpfState">${states.map(x=>`<option>${x}</option>`).join('')}</select></label><label class="rpf-full">Шаблон номера<input value="{модель}-{порядковый номер}" readonly></label></div><div class="rpf-help"><b>Правило нумерации:</b> порядковый номер после последнего тире общий для всего метро. Если уже есть <b>81-717-1</b>, создать <b>81-740-1</b> нельзя. Занятые порядковые номера пропускаются.</div><div id="rpfPreview" class="rpf-preview"></div></div><div class="rpf-foot"><button type="button" id="rpfBatchCancel" class="btn-secondary">Отмена</button><button type="button" id="rpfBatchCreate" class="btn-success">✓ Создать свободные номера</button></div></div>`;
  document.body.appendChild(o);const close=()=>o.remove();o.querySelector('#rpfBatchClose').onclick=close;o.querySelector('#rpfBatchCancel').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});
  function preview(){const model=document.getElementById('rpfModel').value.trim()||'81-740';let a=parseInt(document.getElementById('rpfStart').value)||1,b=parseInt(document.getElementById('rpfEnd').value)||1;if(a>b)[a,b]=[b,a];const used=usedOrdinals(d),list=[];for(let n=a;n<=b&&list.length<=500;n++){if(!used.has(String(n)))list.push(model+'-'+n)}document.getElementById('rpfPreview').innerHTML=`Будет создано: <b>${list.length}</b> свободных номеров.<br>${esc(list.slice(0,70).join(', '))}${list.length>70?' …':''}`}
  ['rpfModel','rpfStart','rpfEnd'].forEach(id=>document.getElementById(id).addEventListener('input',preview));preview();
  document.getElementById('rpfBatchCreate').onclick=()=>{const model=document.getElementById('rpfModel').value.trim()||'81-740';let a=parseInt(document.getElementById('rpfStart').value)||1,b=parseInt(document.getElementById('rpfEnd').value)||1;if(a>b)[a,b]=[b,a];if(b-a>499){alert('Максимум 500 порядковых номеров за одно добавление.');return}const used=usedOrdinals(d);const lineId=document.getElementById('rpfLine').value,depot=document.getElementById('rpfDepot').value,state=document.getElementById('rpfState').value,wagons=Math.max(1,parseInt(document.getElementById('rpfWagons').value)||1),factory=document.getElementById('rpfFactory').value.trim(),buildYear=document.getElementById('rpfYear').value.trim(),commissionDate=document.getElementById('rpfCommission').value;let created=0,skipped=0;for(let n=a;n<=b;n++){const ord=String(n),number=model+'-'+n;if(used.has(ord)){skipped++;continue}d.trains.push({id:'metro-train-'+Date.now()+'-'+created+'-'+Math.random().toString(36).slice(2,7),number,model,wagons,buildYear,factory,homeDepot:depot,currentDepot:depot,lineId,state,notes:'',commissionDate});used.add(ord);created++}save();refresh();close();renderSummary();alert(`Создано: ${created}. Пропущено занятых порядковых номеров: ${skipped}.`)};
}

function renderSummary(){
  const d=metro(),page=document.getElementById('rpmPage');if(!d||!page)return;
  let box=document.getElementById('rmsSummary');if(!box){box=document.createElement('div');box.id='rmsSummary';box.className='rpm-card';const first=page.querySelector('.rpm-card');if(first)page.insertBefore(box,first);else page.appendChild(box)}
  const total=d.trains.length,lines=d.lines.length,onLine=d.trains.filter(t=>t.lineId).length,noLine=total-onLine,active=d.trains.filter(t=>t.state==='Эксплуатируется').length,repair=d.trains.filter(t=>['В ремонте','На мойке'].includes(t.state)).length,depot=d.trains.filter(t=>['В депо','Не эксплуатируется'].includes(t.state)).length;
  const states={};d.trains.forEach(t=>{const k=t.state||'Без состояния';states[k]=(states[k]||0)+1});const statePills=Object.entries(states).map(([k,v])=>`<span class="rms-pill">${esc(k)} ${v}</span>`).join('');
  const cards=(d.lines||[]).map(l=>{const a=d.trains.filter(t=>t.lineId===l.id),al=a.filter(t=>t.state==='Эксплуатируется').length,r=a.filter(t=>['В ремонте','На мойке'].includes(t.state)).length,dp=a.filter(t=>['В депо','Не эксплуатируется'].includes(t.state)).length,models={};a.forEach(t=>models[t.model||'Без модели']=(models[t.model||'Без модели']||0)+1);const modelText=Object.entries(models).map(([m,n])=>`${esc(m)}: ${n}`).join(' • ');const nums=a.slice().sort((x,y)=>String(x.number).localeCompare(String(y.number),undefined,{numeric:true})).map(t=>esc(t.number)).join(', ');const color=/^#[0-9a-f]{6}$/i.test(l.color)?l.color:'#2563eb';return `<div class="rms-line" style="--rms-color:${esc(color)}"><div class="rms-line-head"><span class="rms-line-name">${esc(l.number?l.number+' — ':'')}${esc(l.name||'Без названия')}</span><span class="rms-line-count">${a.length} ПС</span></div><div class="rms-line-meta">Модели: ${modelText||'—'}<br>Всего: <b>${a.length}</b> • эксплуатация: <b>${al}</b> • ремонт/мойка: <b>${r}</b> • депо/не экспл.: <b>${dp}</b></div><div class="rms-pills"><span class="rms-pill">Эксплуатация ${al}</span><span class="rms-pill">Ремонт/мойка ${r}</span><span class="rms-pill">Депо ${dp}</span></div><div class="rms-trains"><b>№ ПС:</b> ${nums||'На линии составов нет'}</div></div>`}).join('');
  const un=d.trains.filter(t=>!t.lineId).slice().sort((a,b)=>String(a.number).localeCompare(String(b.number),undefined,{numeric:true}));
  box.innerHTML=`<div class="rms-title"><b>📊 Основная сводка по линиям</b><span class="rms-updated">обновляется автоматически</span></div><div class="rms-top"><div class="rms-stat"><small>Всего ПС</small><strong>${total}</strong></div><div class="rms-stat"><small>Линий</small><strong>${lines}</strong></div><div class="rms-stat"><small>В эксплуатации</small><strong>${active}</strong></div><div class="rms-stat"><small>Ремонт / мойка</small><strong>${repair}</strong></div><div class="rms-stat"><small>Депо / не экспл.</small><strong>${depot}</strong></div><div class="rms-stat"><small>Без линии</small><strong>${noLine}</strong></div></div><div class="rms-pills" style="margin-bottom:8px">${statePills||'<span class="rms-pill">Нет данных по состояниям</span>'}</div><div class="rms-lines">${cards||'<div class="rpm-empty">Линий пока нет.</div>'}${un.length?`<div class="rms-line rms-unassigned"><div class="rms-line-head"><span class="rms-line-name">Без назначенной линии</span><span class="rms-line-count">${un.length} ПС</span></div><div class="rms-trains"><b>№ ПС:</b> ${un.map(t=>esc(t.number)).join(', ')}</div></div>`:''}</div>`;
}

function guardSingleSave(){
  const modal=document.getElementById('rpmModal'),btn=modal?.querySelector('[data-save]');if(!modal||!btn||btn.dataset.ordinalGuard)return;btn.dataset.ordinalGuard='1';
  btn.addEventListener('click',ev=>{const d=metro();if(!d)return;const num=modal.querySelector('[name="number"]')?.value?.trim()||'',ord=ordinalOf(num),editing=modal.__metroTrainId||'';if(!ord)return;const c=d.trains.find(t=>ordinalOf(t.number)===ord&&t.id!==editing);if(c){ev.preventDefault();ev.stopImmediatePropagation();alert(`Порядковый номер ${ord} уже занят составом ${c.number}.\nНомер после последнего тире должен быть уникальным для всего метро.`)}},true);
}

function install(){
  injectStyles();
  const batch=document.getElementById('rpmBatchAdd');if(batch&&!batch.dataset.uiBound){batch.dataset.uiBound='1';batch.onclick=openBatchModal}
  installSelectionControls();renderSummary();guardSingleSave();
}

function boot(){
  install();
  let n=0;const timer=setInterval(()=>{install();if(++n>80)clearInterval(timer)},500);
  const pageTimer=setInterval(()=>{const page=document.getElementById('rpmPage');if(!page)return;renderSummary();if(++boot._page>40)clearInterval(pageTimer)},500);
}
boot._page=0;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();