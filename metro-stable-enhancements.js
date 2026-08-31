/* Стабильные улучшения метро для основного интерфейса */
(function(){'use strict';
function boot(){
  if(typeof metroLines==='undefined'||typeof metroStock==='undefined') return;
  const esc=window.escapeHtml||((v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  if(!metroLines.some(l=>String(l.number)==='4')) metroLines.push({id:'metro-line-4-minsk',number:'4',name:'Минская',color:'#9acd32',type:'Подземная',depots:['ТЧ-1 Метродепо','ТЧ-3 Выхино']});
  const line4=metroLines.find(l=>String(l.number)==='4'); if(line4){line4.name='Минская';line4.color='#9acd32';line4.depots=['ТЧ-1 Метродепо','ТЧ-3 Выхино'];}
  let selected=new Set();
  const ordinal=v=>{const m=String(v??'').trim().match(/(?:^|-)\s*(\d+)$/);return m?String(parseInt(m[1],10)):null};
  const used=()=>{const s=new Set();metroStock.forEach(t=>{const n=ordinal(t.number);if(n)s.add(n)});return s};
  function summary(){
    const host=document.getElementById('metroSummaryBody'); if(!host)return;
    const total=metroStock.length, active=metroStock.filter(x=>x.status==='active').length, un=metroStock.filter(x=>!x.lineId).length;
    const cards=metroLines.map(l=>{const a=metroStock.filter(x=>x.lineId===l.id);const nums=a.slice().sort((x,y)=>String(x.number).localeCompare(String(y.number),undefined,{numeric:true})).map(x=>esc(x.number)).join(', ');return `<div style="border-left:7px solid ${esc(l.color)};border:1px solid var(--ui-border);border-left-width:7px;border-radius:10px;padding:10px;background:var(--ui-card)"><b>Линия ${esc(l.number)} — ${esc(l.name)}</b><div style="font-size:10px;color:var(--ui-muted);margin-top:4px">Составов: <b>${a.length}</b> · В эксплуатации: ${a.filter(x=>x.status==='active').length} · Ремонт: ${a.filter(x=>x.status==='repair').length} · Запас: ${a.filter(x=>x.status==='reserve').length}${l.depots?.length?' · Депо: '+esc(l.depots.join(', ')):''}</div><div style="font-size:10px;margin-top:5px"><b>ПС:</b> ${nums||'нет'}</div></div>`}).join('');
    host.innerHTML=`<div class="metro-grid" style="margin-bottom:10px"><div class="metro-kpi"><span>Всего ПС</span><b>${total}</b></div><div class="metro-kpi"><span>В эксплуатации</span><b>${active}</b></div><div class="metro-kpi"><span>Без линии</span><b>${un}</b></div><div class="metro-kpi"><span>Линий</span><b>${metroLines.length}</b></div></div><div style="display:grid;gap:9px">${cards}</div>`;
  }
  function render(){
    const list=document.getElementById('metroLineList'); if(!list)return;
    list.innerHTML=metroLines.map(l=>`<div class="metro-line-item ${l.id===selectedMetroLineId?'active':''}" onclick="switchMetroLine('${esc(l.id)}')"><span class="metro-color-dot" style="background:${esc(l.color)}"></span><div class="metro-line-meta"><div class="metro-line-name">Линия ${esc(l.number)} — ${esc(l.name)}</div><div class="metro-line-number">${metroStock.filter(x=>x.lineId===l.id).length} ед. ПС${l.depots?.length?' · '+esc(l.depots.join(' / ')):''}</div></div></div>`).join('');
    const line=selectedMetroLine();
    document.getElementById('metroSelectedTitle').textContent=line?`БД ПС — линия ${line.number}`:'База ПС метро';
    document.getElementById('metroSelectedSub').textContent=line?`${line.name} · номер ${line.number}${line.depots?.length?' · '+line.depots.join(' / '):''}`:'Создайте линию метро';
    const rows=line?metroStock.filter(x=>x.lineId===line.id):[];
    document.getElementById('metroStockCount').textContent=rows.length;document.getElementById('metroTypeCount').textContent=new Set(rows.map(x=>x.type)).size;document.getElementById('metroLineCount').textContent=metroLines.length;
    const body=document.getElementById('metroStockBody');
    body.innerHTML=rows.length?rows.map((x,i)=>`<tr><td style="text-align:center"><input type="checkbox" ${selected.has(x.id)?'checked':''} onchange="window.toggleStableMetro('${esc(x.id)}',this.checked)"></td><td>${i+1}</td><td><b>${esc(x.type||x.model)}</b></td><td>${esc(x.number)}</td><td><span class="metro-badge"><span class="metro-color-dot" style="width:9px;height:9px;flex-basis:9px;background:${esc(line.color)}"></span>Линия ${esc(line.number)}</span></td><td>${esc(METRO_STATUS[x.status]||x.status)}</td><td><button class="btn-danger btn-sm" onclick="deleteMetroStock('${esc(x.id)}')">🗑</button></td></tr>`).join(''):'<tr><td colspan="7"><div class="metro-empty">На этой линии пока нет подвижного состава.</div></td></tr>';
    const mass=document.getElementById('metroMassLine'); if(mass){const cur=mass.value;mass.innerHTML='<option value="">— линия для назначения —</option>'+metroLines.map(l=>`<option value="${esc(l.id)}">Линия ${esc(l.number)} — ${esc(l.name)}</option>`).join('');if(metroLines.some(l=>l.id===cur))mass.value=cur;}
    summary();
  }
  window.toggleStableMetro=(id,on)=>{if(on)selected.add(id);else selected.delete(id)};
  window.selectAllMetroStock=(on)=>{const l=selectedMetroLine();metroStock.filter(x=>x.lineId===l?.id).forEach(x=>on?selected.add(x.id):selected.delete(x.id));render()};
  window.assignSelectedMetroStock=()=>{const lineId=document.getElementById('metroMassLine')?.value;if(!lineId){alert('Выберите линию метро.');return}if(!selected.size){alert('Выберите составы.');return}metroStock.forEach(x=>{if(selected.has(x.id))x.lineId=lineId});saveMetroData();selected.clear();render()};
  window.deleteSelectedMetroStock=()=>{if(!selected.size){alert('Выберите составы.');return}if(!confirm(`Удалить выбранные составы (${selected.size})?`))return;metroStock=metroStock.filter(x=>!selected.has(x.id));selected.clear();saveMetroData();render()};
  window.renderMetroSummary=summary;
  window.renderMetro=render;
  window.openMetroBatchModal=function(){
    const modal=document.getElementById('modalMetroBatch'); if(!modal)return;
    const select=document.getElementById('metroBatchLine');select.innerHTML=metroLines.map(l=>`<option value="${esc(l.id)}">Линия ${esc(l.number)} — ${esc(l.name)}</option>`).join('');select.value=selectedMetroLineId||metroLines[0].id;
    const ids=[['metroBatchEnd','Конечный номер'],['metroBatchDepot','Депо приписки'],['metroBatchWagons','Количество вагонов / секций'],['metroBatchFactory','Завод-изготовитель'],['metroBatchYear','Год постройки'],['metroBatchCommission','Дата ввода в эксплуатацию']];
    const grid=modal.querySelector('.form-grid'); if(grid&&!document.getElementById('metroBatchEnd')){
      const make=(id,label,type='text',extra='')=>{const d=document.createElement('div');d.innerHTML=`<label>${label}:</label><input id="${id}" type="${type}" ${extra}>`;return d};
      grid.append(make('metroBatchEnd','Конечный номер','number','min="1" value="20"'),make('metroBatchDepot','Депо приписки'),make('metroBatchWagons','Количество вагонов / секций','number','min="1" value="5"'),make('metroBatchFactory','Завод-изготовитель'),make('metroBatchYear','Год постройки','number','min="1800" max="2200"'),make('metroBatchCommission','Дата ввода в эксплуатацию','date'));
    }
    updatePreview();modal.style.display='flex';
  };
  function updatePreview(){const p=preview();const el=document.getElementById('metroBatchPreview');if(el)el.innerHTML=`Будет создано: <b>${p.free.length}</b> свободных номеров.${p.busy.length?` Пропущено занятых: <b>${p.busy.length}</b>.`:''}<br>${esc(p.free.slice(0,12).join(', '))}${p.free.length>12?' …':''}`;}
  function preview(){const type=document.getElementById('metroBatchType')?.value.trim()||'81-740';let a=parseInt(document.getElementById('metroBatchStart')?.value)||1,b=parseInt(document.getElementById('metroBatchEnd')?.value)||20;if(a>b)[a,b]=[b,a];const u=used(),free=[],busy=[];for(let n=a;n<=b;n++)(u.has(String(n))?busy:free).push(type+'-'+n);return{type,a,b,free,busy};}
  ['metroBatchType','metroBatchStart','metroBatchEnd'].forEach(id=>document.addEventListener('input',e=>{if(e.target.id===id)updatePreview()}));
  window.saveMetroBatchForm=function(e){e.preventDefault();const p=preview();const lineId=document.getElementById('metroBatchLine').value;if(!lineId)return;const status=document.getElementById('metroBatchStatus').value,note=document.getElementById('metroBatchNote').value.trim();const depot=document.getElementById('metroBatchDepot')?.value||'';const wagons=Math.max(1,parseInt(document.getElementById('metroBatchWagons')?.value)||5);const factory=document.getElementById('metroBatchFactory')?.value||'';const year=document.getElementById('metroBatchYear')?.value||'';const commission=document.getElementById('metroBatchCommission')?.value||'';const now=Date.now();p.free.forEach((number,i)=>metroStock.push({id:`metro-ps-${now}-${i}-${Math.random().toString(36).slice(2,7)}`,type:p.type,model:p.type,number,lineId,status,note,homeDepot:depot,currentDepot:depot,wagons,buildYear:year,factory,commissionDate:commission}));selectedMetroLineId=lineId;saveMetroData();closeMetroBatchModal();render();alert(`Создано: ${p.free.length}. Пропущено занятых порядковых номеров: ${p.busy.length}.`)};
  saveMetroData();render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50),{once:true});else setTimeout(boot,50);
})();