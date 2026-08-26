/* Railphoto — stable feature layer. No polling, no table quantity inputs, no scroll jumps. */
(function(){
  'use strict';
  if(window.__railphotoStableFeatures)return;
  window.__railphotoStableFeatures=true;

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const counted=item=>item&&(item.category==='mvps'||item.category==='pass_car');
  const qty=item=>Math.max(1,Number(item?.compositionCount)||1);

  function styles(){
    if(document.getElementById('railphoto-stable-style'))return;
    const s=document.createElement('style');s.id='railphoto-stable-style';s.textContent=`
      .railphoto-in-service-row{outline:3px solid #f59e0b!important;outline-offset:-3px;}
      .railphoto-in-service-row td{box-shadow:inset 0 0 0 9999px rgba(245,158,11,.07)!important;}
      .railphoto-service-badge{display:inline-block;margin:4px 0 0;padding:3px 8px;border-radius:4px;background:#92400e;color:#fff!important;font-size:10px;font-weight:700;white-space:nowrap;}
      .railphoto-form-qty{display:flex;flex-direction:column;gap:5px;}
      .railphoto-form-qty input{width:100%;padding:7px 9px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px;}
      .railphoto-builder-qty-wrap{display:inline-flex;align-items:center;gap:5px;margin-right:7px;font-size:10px;}
      .railphoto-builder-qty{width:62px!important;padding:5px!important;text-align:center;}
      .railphoto-train-selector{display:inline-flex;align-items:center;gap:6px;margin-left:8px;}
      .railphoto-train-selector select{padding:6px 8px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px;min-width:170px;}
      .st-transfer-depot{background-color:#6b4f8a!important;color:#fff!important;}
      .st-transfer-railway{background-color:#4f638a!important;color:#fff!important;}
      .railphoto-drag-handle{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:1px solid var(--bp-border);border-radius:3px;background:var(--bp-input-bg);cursor:grab;user-select:none;}
      .railphoto-dragging{opacity:.45!important}.railphoto-drag-over{outline:2px dashed var(--bp-link)!important;outline-offset:-2px;}
      #btnViewProfile{order:-999!important;}
    `;document.head.appendChild(s);
  }

  function ensureData(){
    if(typeof db==='undefined')return;
    let changed=false;
    db.forEach(x=>{
      if(!Number.isFinite(Number(x.compositionCount))||Number(x.compositionCount)<1){x.compositionCount=1;changed=true;}
      if(!Object.prototype.hasOwnProperty.call(x,'inService')){x.inService=null;changed=true;}
      if(x.status==='st-transfer-other'){x.status='st-transfer-depot';changed=true;}
    });
    if(changed&&typeof saveData==='function')saveData();
  }

  function addStatusOptions(){
    if(typeof STATUS_MAP!=='undefined'){
      STATUS_MAP['st-transfer-depot']='Передан в другое депо';
      STATUS_MAP['st-transfer-railway']='Передан в другую дорогу';
      delete STATUS_MAP['st-transfer-other'];
    }
    ['filterStatus','batchStatusSelect','formStatus'].forEach(id=>{
      const sel=document.getElementById(id);if(!sel)return;
      [['st-transfer-depot','Передан в другое депо'],['st-transfer-railway','Передан в другую дорогу']].forEach(([v,t])=>{
        if(!sel.querySelector(`option[value="${v}"]`)){const o=document.createElement('option');o.value=v;o.textContent=t;sel.appendChild(o);}
      });
      sel.querySelector('option[value="st-transfer-other"]')?.remove();
    });
    if(typeof SECONDARY_STATUS_MAP!=='undefined')SECONDARY_STATUS_MAP.repainted='Перекрашен';
    ['filterSecondaryStatus','formSecondaryStatus'].forEach(id=>{
      const sel=document.getElementById(id);if(sel&&!sel.querySelector('option[value="repainted"]')){const o=document.createElement('option');o.value='repainted';o.textContent='Перекрашен';sel.appendChild(o);}
    });
  }

  function databaseTable(){return document.querySelector('#pageDatabase table.bp-table');}
  function findItemForRow(row){
    if(typeof db==='undefined')return null;
    const series=row.children[1]?.textContent?.trim();
    return db.find(x=>String(x.series).trim()===series)||null;
  }

  /* Only paint rows and show the train number. We deliberately do NOT put an input in the table. */
  function paintRuns(){
    const table=databaseTable();if(!table||typeof db==='undefined')return;
    table.querySelectorAll('tbody tr').forEach(row=>{
      const item=findItemForRow(row);if(!item)return;
      row.classList.toggle('railphoto-in-service-row',!!item.inService);
      row.querySelectorAll('.railphoto-service-badge').forEach(x=>x.remove());
      if(item.inService){
        const statusCell=[...row.children].find(td=>/В Эксплуатации|Не эксплуатируется|В Ремонте|В Депо|Порезан|Списан|Музейный|Переформирован|Капитальный Ремонт|Выведен из эксплуатации|Передан в другое депо|Передан в другую дорогу/.test(td.textContent))||row.children[row.children.length-2];
        if(statusCell){
          const b=document.createElement('div');b.className='railphoto-service-badge';
          b.textContent=`🚆 В РЕЙСЕ №${item.inService.trainNum||'—'}`;
          statusCell.appendChild(b);
        }
      }
    });
  }

  function addQuantityToForm(){
    const form=document.getElementById('vehicleForm');if(!form)return;
    let box=document.getElementById('railphotoFormQtyBox');
    if(box)return;
    const grid=form.querySelector('.form-grid');if(!grid)return;
    box=document.createElement('div');box.id='railphotoFormQtyBox';box.className='railphoto-form-qty';
    box.innerHTML='<label>Количество вагонов / секций:</label><input id="formCompositionCount" type="number" min="1" step="1" value="1" title="Количество вагонов для пассажирского состава или секций МВПС">';
    grid.appendChild(box);
  }

  function patchEditModal(){
    if(typeof window.openEditModal==='function'&&!window.__railphotoOpenEditPatched){
      const original=window.openEditModal;
      window.openEditModal=function(id){
        original.apply(this,arguments);
        addQuantityToForm();
        const item=typeof db!=='undefined'?db.find(x=>x.id===id):null;
        const input=document.getElementById('formCompositionCount');if(input)input.value=String(qty(item));
      };
      window.__railphotoOpenEditPatched=true;
    }
    if(typeof window.saveVehicleForm==='function'&&!window.__railphotoSavePatched){
      const original=window.saveVehicleForm;
      window.saveVehicleForm=function(e){
        const id=document.getElementById('formVehicleId')?.value||'';
        const input=document.getElementById('formCompositionCount');
        const newQty=Math.max(1,parseInt(input?.value||'1',10)||1);
        original.apply(this,arguments);
        const item=typeof db!=='undefined'?db.find(x=>x.id===id):null;
        if(item){item.compositionCount=newQty;if(typeof saveData==='function')saveData();}
        setTimeout(paintRuns,0);
      };
      window.__railphotoSavePatched=true;
    }
  }

  function builderQuantity(item){
    if(!counted(item))return 1;
    const input=document.getElementById('railphoto_qty_'+String(item.id).replace(/[^a-zA-Z0-9_-]/g,'_'));
    const n=parseInt(input?.value||qty(item),10);
    return Number.isFinite(n)&&n>0?n:qty(item);
  }

  function builderQuantities(){
    const list=document.getElementById('builderSourceList');if(!list||typeof db==='undefined')return;
    list.querySelectorAll('.builder-source-item').forEach(card=>{
      const b=card.querySelector('b'),btn=card.querySelector('button');if(!b||!btn)return;
      const item=db.find(x=>String(x.series).trim()===b.textContent.trim());if(!item||!counted(item))return;
      if(card.querySelector('.railphoto-builder-qty-wrap'))return;
      const wrap=document.createElement('span');wrap.className='railphoto-builder-qty-wrap';
      const input=document.createElement('input');input.id='railphoto_qty_'+String(item.id).replace(/[^a-zA-Z0-9_-]/g,'_');input.className='railphoto-builder-qty';input.type='number';input.min='1';input.step='1';input.value=String(qty(item));input.addEventListener('click',e=>e.stopPropagation());
      wrap.append('Ваг./секц. ',input);btn.parentNode.insertBefore(wrap,btn);
    });
  }

  function patchBuilder(){
    if(typeof window.addToConsist==='function'&&!window.__railphotoAddPatched){
      window.addToConsist=function(id){
        const item=db.find(x=>x.id===id);if(!item)return;
        if(item.inService&&!confirm(`ПС ${item.series} уже в рейсе №${item.inService.trainNum}. Всё равно добавить?`))return;
        const n=builderQuantity(item);
        selectedConsist.push({...item,_compositionCount:n,compositionCount:n,weight:(Number(item.weight)||0)*n,length:(Number(item.length)||0)*n,brake:(Number(item.brake)||0)*n});
        if(typeof renderConsistTrack==='function')renderConsistTrack();
      };
      window.__railphotoAddPatched=true;
    }
    builderQuantities();
  }

  function patchConsistView(){
    if(typeof window.renderConsistTrack==='function'&&!window.__railphotoConsistPatched){
      const original=window.renderConsistTrack;
      window.renderConsistTrack=function(){
        original.apply(this,arguments);
        const track=document.getElementById('consistTrack');if(!track)return;
        [...track.querySelectorAll('.consist-card')].forEach((card,i)=>{
          const item=selectedConsist[i];if(!item)return;
          const n=Math.max(1,Number(item._compositionCount)||1);
          if(!card.querySelector('.railphoto-consist-qty')){const s=document.createElement('span');s.className='type-badge railphoto-consist-qty';s.textContent=`× ${n}`;card.appendChild(s);}
        });
      };
      window.__railphotoConsistPatched=true;
    }
  }

  function routes(){
    try{
      if(typeof profile!=='undefined'&&Array.isArray(profile.routeRegistry))return profile.routeRegistry;
      const x=JSON.parse(localStorage.getItem('rp_route_registry')||'[]');return Array.isArray(x)?x:[];
    }catch(e){return[];}
  }
  function saveRoutes(r){
    try{localStorage.setItem('rp_route_registry',JSON.stringify(r));if(typeof profile!=='undefined')profile.routeRegistry=r;if(typeof saveData==='function')saveData();}catch(e){}
  }
  function routeType(){return document.getElementById('railphotoTrainRouteSelect')?.selectedOptions?.[0]?.dataset?.type||'Пассажирский';}
  function routeColor(){return document.getElementById('railphotoTrainRouteSelect')?.selectedOptions?.[0]?.dataset?.color||'blue';}

  function installTrainSelector(){
    const num=document.getElementById('tripNum');if(!num||document.getElementById('railphotoTrainSelector'))return;
    const wrap=document.createElement('span');wrap.id='railphotoTrainSelector';wrap.className='railphoto-train-selector';
    const sel=document.createElement('select');sel.id='railphotoTrainRouteSelect';wrap.append('Поезд: ',sel);num.parentNode.insertBefore(wrap,num.nextSibling);
    sel.addEventListener('change',()=>{if(sel.value&&sel.value!=='__new__')num.value=sel.value;else if(sel.value==='__new__'){num.value='';num.focus();}});
    refreshTrainSelector();
  }
  function refreshTrainSelector(){
    const sel=document.getElementById('railphotoTrainRouteSelect');if(!sel)return;
    const list=routes();const current=document.getElementById('tripNum')?.value?.trim()||'';
    sel.innerHTML='<option value="">— выбрать номер —</option>';
    list.forEach(r=>{const o=document.createElement('option');o.value=String(r.num);o.dataset.type=r.type||'Пассажирский';o.dataset.color=r.color||'blue';o.textContent=String(r.num)+(r.from||r.to?` — ${r.from||''} → ${r.to||''}`:'');sel.appendChild(o);});
    const n=document.createElement('option');n.value='__new__';n.textContent='＋ Новый номер';sel.appendChild(n);
    if(current&&list.some(r=>String(r.num)===current))sel.value=current;
  }

  function dispatchConsist(){
    if(!Array.isArray(selectedConsist)||!selectedConsist.length){alert('Сначала добавьте ПС в состав.');return;}
    const trainNum=document.getElementById('tripNum')?.value?.trim()||'';if(!trainNum){alert('Укажите номер поезда.');return;}
    const service={trainNum,from:document.getElementById('tripFromStation')?.value||'',to:document.getElementById('tripToStation')?.value||'',depTime:document.getElementById('tripStartTime')?.value||'',startedAt:new Date().toISOString()};
    const ids=new Set(selectedConsist.map(x=>x.id));db.forEach(x=>{if(ids.has(x.id))x.inService=service;});
    const list=routes();let r=list.find(x=>String(x.num)===String(trainNum));
    const parts={};selectedConsist.forEach(x=>{const n=String(x.series||x.id);parts[n]=(parts[n]||0)+Math.max(1,Number(x._compositionCount||x.compositionCount)||1);});
    const cars=Object.entries(parts).map(([n,c])=>`${n} × ${c}`).join(', ');
    const total=Object.values(parts).reduce((a,b)=>a+b,0);
    if(!r){r={id:'route-'+Date.now(),num:String(trainNum),from:service.from,to:service.to,type:routeType(),color:routeColor(),arr:'',dep:service.depTime,trains:'1',wagons:String(total),cars,consist:cars,notes:'Создано из конструктора состава'};list.push(r);}
    else{r.from=service.from||r.from;r.to=service.to||r.to;r.dep=service.depTime||r.dep;r.wagons=String(total);r.cars=cars;r.consist=cars;}
    saveRoutes(list);if(typeof saveData==='function')saveData();paintRuns();refreshTrainSelector();alert(`Состав №${trainNum} отправлен в рейс.`);
  }
  function releaseConsist(){
    if(!Array.isArray(selectedConsist)||!selectedConsist.length){alert('Выберите состав в конструкторе.');return;}
    const ids=new Set(selectedConsist.map(x=>x.id));db.forEach(x=>{if(ids.has(x.id))x.inService=null;});if(typeof saveData==='function')saveData();paintRuns();
  }

  function builderButtons(){
    const box=document.querySelector('#pageBuilder .page-header .action-buttons');if(!box)return;
    if(!document.getElementById('railphotoGenerateConsistBtn')){const b=document.createElement('button');b.id='railphotoGenerateConsistBtn';b.className='btn-success';b.type='button';b.textContent='📋 Сформировать состав';b.onclick=()=>typeof generateVU45Ticket==='function'?generateVU45Ticket():typeof renderConsistTrack==='function'&&renderConsistTrack();box.appendChild(b);}
    if(!document.getElementById('railphotoDispatchBtn')){const b=document.createElement('button');b.id='railphotoDispatchBtn';b.className='btn-gold';b.type='button';b.textContent='🚆 Отправить в рейс';b.onclick=dispatchConsist;box.appendChild(b);}
    if(!document.getElementById('railphotoReleaseBtn')){const b=document.createElement('button');b.id='railphotoReleaseBtn';b.className='btn-secondary';b.type='button';b.textContent='↩️ Снять с рейса';b.onclick=releaseConsist;box.appendChild(b);}
  }

  function dragDrop(){
    const tbody=document.getElementById('tableBody');if(!tbody||typeof db==='undefined')return;
    [...tbody.rows].forEach(row=>{
      if(row.dataset.railphotoDragReady)return;
      const item=findItemForRow(row);if(!item)return;const first=row.children[0];if(!first)return;
      const h=document.createElement('span');h.className='railphoto-drag-handle';h.textContent='↕';h.title='Перетащить ПС вверх/вниз';h.draggable=true;
      first.appendChild(h);row.dataset.railphotoDragReady='1';row.dataset.itemId=item.id;
      h.addEventListener('dragstart',e=>{row.classList.add('railphoto-dragging');e.dataTransfer.setData('text/plain',String(item.id));});
      h.addEventListener('dragend',()=>row.classList.remove('railphoto-dragging'));
      row.addEventListener('dragover',e=>{e.preventDefault();row.classList.add('railphoto-drag-over');});
      row.addEventListener('dragleave',()=>row.classList.remove('railphoto-drag-over'));
      row.addEventListener('drop',e=>{e.preventDefault();row.classList.remove('railphoto-drag-over');const from=e.dataTransfer.getData('text/plain'),to=row.dataset.itemId;if(!from||!to||from===to)return;const a=db.findIndex(x=>String(x.id)===String(from)),b=db.findIndex(x=>String(x.id)===String(to));if(a<0||b<0)return;const moved=db.splice(a,1)[0];db.splice(b,0,moved);if(typeof saveData==='function')saveData();if(typeof renderTable==='function')renderTable();});
    });
  }

  function patchRenderTable(){
    if(typeof window.renderTable!=='function'||window.__railphotoRenderPatched)return;
    const original=window.renderTable;
    window.renderTable=function(){
      const sx=window.scrollX,sy=window.scrollY;
      const result=original.apply(this,arguments);
      requestAnimationFrame(()=>{paintRuns();dragDrop();});
      window.scrollTo(sx,sy);
      return result;
    };
    window.__railphotoRenderPatched=true;
  }

  function patchReady(){
    if(typeof db==='undefined'||typeof selectedConsist==='undefined'){setTimeout(patchReady,250);return;}
    styles();ensureData();addStatusOptions();addQuantityToForm();patchEditModal();patchBuilder();patchConsistView();builderButtons();installTrainSelector();paintRuns();dragDrop();patchRenderTable();
    /* One short delayed pass lets the base app finish building its modal/table. No interval. */
    setTimeout(()=>{addStatusOptions();addQuantityToForm();patchEditModal();patchBuilder();builderButtons();installTrainSelector();paintRuns();dragDrop();},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchReady);else patchReady();
})();
