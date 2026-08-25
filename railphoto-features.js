/* Railphoto — builder quantities and active-run tracking */
(function () {
  if (window.__railphotoFeaturesReady) return;
  window.__railphotoFeaturesReady = true;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function waitForApp() {
    if (typeof db === 'undefined' || typeof selectedConsist === 'undefined') {
      setTimeout(waitForApp, 200);
      return;
    }
    init();
  }

  function installStyles() {
    if (document.getElementById('railphoto-features-style')) return;
    const style = document.createElement('style');
    style.id = 'railphoto-features-style';
    style.textContent = `
      .railphoto-in-service-row{outline:3px solid #f59e0b!important;outline-offset:-3px;animation:railphotoPulse 1.7s ease-in-out infinite}
      .railphoto-in-service-row td{box-shadow:inset 0 0 0 9999px rgba(245,158,11,.08)}
      @keyframes railphotoPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.13)}}
      .railphoto-service-badge{display:inline-block;margin-top:4px;padding:3px 7px;border-radius:4px;background:#7c2d12;color:#fff;font-size:10px;font-weight:700;box-shadow:0 0 10px rgba(245,158,11,.5)}
      .railphoto-qty-note{font-size:10px;color:var(--bp-text-muted);margin-top:3px}
      .railphoto-builder-qty{width:62px!important;padding:5px!important;text-align:center;margin-right:6px}
      .railphoto-builder-qty-wrap{display:inline-flex;align-items:center;gap:4px;margin-right:6px;font-size:10px}
      .railphoto-feature-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
    `;
    document.head.appendChild(style);
  }

  function ensureData() {
    let changed = false;
    db.forEach(item => {
      if (!Number.isFinite(Number(item.compositionCount)) || Number(item.compositionCount) < 1) {
        item.compositionCount = 1;
        changed = true;
      }
      if (!Object.prototype.hasOwnProperty.call(item, 'inService')) {
        item.inService = null;
        changed = true;
      }
    });
    if (changed && typeof saveData === 'function') saveData();
  }

  function getBuilderInputId(item){
    return 'railphoto_qty_' + String(item.id).replace(/[^a-zA-Z0-9_-]/g,'_');
  }

  function isCounted(item){
    return item && (item.category === 'mvps' || item.category === 'pass_car');
  }

  function renderBuilderQuantities(){
    const list = document.getElementById('builderSourceList');
    if(!list) return;
    list.querySelectorAll('.builder-source-item').forEach(card=>{
      const title = card.querySelector('b');
      const btn = card.querySelector('button');
      if(!title || !btn) return;
      const item = db.find(x=>x.series === title.textContent.trim());
      if(!item) return;

      card.querySelectorAll('.railphoto-builder-qty-wrap').forEach(x=>x.remove());
      card.querySelectorAll('.railphoto-service-badge').forEach(x=>x.remove());

      const wrap = document.createElement('span');
      wrap.className = 'railphoto-builder-qty-wrap';
      const inputId = getBuilderInputId(item);
      if(isCounted(item)){
        wrap.innerHTML = `<span>Ваг./секц.</span><input id="${inputId}" class="railphoto-builder-qty" type="number" min="1" step="1" value="${Math.max(1,Number(item.compositionCount)||1)}" onclick="event.stopPropagation()">`;
        btn.parentNode.insertBefore(wrap, btn);
      }

      if(item.inService){
        const badge = document.createElement('div');
        badge.className = 'railphoto-service-badge';
        badge.textContent = `🚆 В РЕЙСЕ №${item.inService.trainNum}`;
        const host = title.parentElement || card;
        host.appendChild(badge);
      }
    });
  }

  function quantityFromBuilder(item){
    if(!isCounted(item)) return 1;
    const input = document.getElementById(getBuilderInputId(item));
    let qty = parseInt(input?.value || item.compositionCount || '1',10);
    if(!Number.isFinite(qty) || qty < 1) qty = 1;
    item.compositionCount = qty;
    if(typeof saveData === 'function') saveData();
    return qty;
  }

  function promptQuantity(item){
    if(!isCounted(item)) return 1;
    const current = Math.max(1,Number(item.compositionCount)||1);
    const label = item.category === 'mvps' ? 'вагонов/секций МВПС' : 'пассажирских вагонов';
    const raw = prompt(`Сколько ${label} добавить в этот состав для «${item.series}»?`, String(current));
    if(raw === null) return null;
    const qty = parseInt(raw,10);
    if(!Number.isFinite(qty) || qty < 1){
      alert('Укажите целое количество не меньше 1.');
      return null;
    }
    item.compositionCount = qty;
    if(typeof saveData === 'function') saveData();
    return qty;
  }

  function patchAddToConsist(){
    if(typeof window.addToConsist !== 'function' || window.__railphotoAddPatched) return;
    const original = window.addToConsist;
    window.addToConsist = function(id){
      const item = db.find(x=>x.id===id);
      if(!item) return;
      if(item.inService && !confirm(`ПС ${item.series} уже находится в рейсе №${item.inService.trainNum}. Всё равно добавить его?`)) return;

      const qty = promptQuantity(item);
      if(qty === null) return;

      const copy = {...item};
      copy._compositionCount = qty;
      copy.weight = (Number(item.weight)||0) * qty;
      copy.length = (Number(item.length)||0) * qty;
      copy.brake = (Number(item.brake)||0) * qty;
      selectedConsist.push(copy);
      if(typeof window.renderConsistTrack === 'function') window.renderConsistTrack();
      renderBuilderQuantities();
    };
    window.__railphotoAddPatched = true;
  }

  function patchConsistRendering(){
    if(typeof window.renderConsistTrack !== 'function' || window.__railphotoRenderConsistPatched) return;
    window.renderConsistTrack = function(){
      const track=document.getElementById('consistTrack');
      if(!track) return;
      if(!selectedConsist.length){
        track.innerHTML='<div style="color:var(--bp-text-muted);font-style:italic;">Состав пуст. Нажмите «+ В поезд» в списке слева.</div>';
      }else{
        track.innerHTML=selectedConsist.map((item,idx)=>{
          const q=Math.max(1,Number(item._compositionCount)||1);
          return `<div class="consist-card"><span>${idx===0?'🚂':'🚃'} <b>${esc(item.series)}</b> <span class="type-badge">× ${q}</span></span><button style="background:none;border:none;color:var(--bp-btn-danger);cursor:pointer;font-weight:bold" onclick="removeFromConsist(${idx})">❌</button></div>`;
        }).join('');
      }
      let weight=0,length=0,brake=0,count=0;
      selectedConsist.forEach(x=>{const q=Math.max(1,Number(x._compositionCount)||1);count+=q;weight+=Number(x.weight)||0;length+=Number(x.length)||0;brake+=Number(x.brake)||0;});
      document.getElementById('metricCount')?.replaceChildren(document.createTextNode(String(count)));
      document.getElementById('metricWeight')?.replaceChildren(document.createTextNode(weight.toFixed(1)));
      document.getElementById('metricLength')?.replaceChildren(document.createTextNode(length.toFixed(1)));
      document.getElementById('metricBrakes')?.replaceChildren(document.createTextNode(brake.toFixed(1)));
    };
    window.__railphotoRenderConsistPatched = true;
  }

  function addBuilderButtons(){
    const header=document.querySelector('#pageBuilder .page-header .action-buttons');
    if(!header) return;
    if(!document.getElementById('railphotoGenerateConsistBtn')){
      const b=document.createElement('button');
      b.id='railphotoGenerateConsistBtn';
      b.type='button';
      b.className='btn-success';
      b.textContent='📋 Сформировать состав';
      b.onclick=()=>{
        if(typeof generateVU45Ticket==='function') generateVU45Ticket();
        else if(typeof renderConsistTrack==='function') renderConsistTrack();
      };
      header.insertBefore(b,header.firstChild);
    }
    if(!document.getElementById('railphotoDispatchBtn')){
      const b=document.createElement('button');
      b.id='railphotoDispatchBtn';
      b.type='button';
      b.className='btn-gold';
      b.textContent='🚆 Отправить в рейс';
      b.onclick=dispatchConsist;
      header.insertBefore(b,document.getElementById('railphotoGenerateConsistBtn').nextSibling);
    }
    if(!document.getElementById('railphotoReleaseBtn')){
      const b=document.createElement('button');
      b.id='railphotoReleaseBtn';
      b.type='button';
      b.className='btn-secondary';
      b.textContent='↩️ Снять с рейса';
      b.onclick=releaseConsist;
      header.insertBefore(b,document.getElementById('railphotoDispatchBtn').nextSibling);
    }
  }

  function addDatabaseRunInfo(){
    const table=document.querySelector('#pageDatabase table.bp-table');
    if(!table) return;
    const head=table.querySelector('thead tr');
    const rows=[...table.querySelectorAll('tbody tr')];
    if(!head || !rows.length) return;

    let qtyHead=head.querySelector('.railphoto-qty-head');
    if(!qtyHead){
      qtyHead=document.createElement('th');
      qtyHead.className='railphoto-qty-head';
      qtyHead.textContent='Кол-во вагонов / секций';
      head.insertBefore(qtyHead,head.lastElementChild);
    }

    rows.forEach(tr=>{
      const cells=[...tr.children];
      const actionCell=cells.find(td=>td.querySelector('button'));
      const seriesCell=cells[1];
      if(!actionCell || !seriesCell) return;
      const item=db.find(x=>x.series===seriesCell.textContent.trim());
      if(!item) return;
      tr.querySelectorAll('.railphoto-qty-cell').forEach(x=>x.remove());
      const qty=document.createElement('td');
      qty.className='railphoto-qty-cell';
      qty.style.textAlign='center';
      qty.innerHTML=`<b>${Math.max(1,Number(item.compositionCount)||1)}</b>`;
      tr.insertBefore(qty,actionCell);
      if(actionCell!==tr.lastElementChild) tr.appendChild(actionCell);

      tr.classList.remove('railphoto-in-service-row');
      const old=tr.querySelectorAll('.railphoto-service-badge');
      old.forEach(x=>x.remove());
      if(item.inService){
        tr.classList.add('railphoto-in-service-row');
        const statusCell=cells.find(td=>/В Эксплуатации|Не эксплуатируется|В Ремонте|В Депо|Порезан|Списан|Музейный|Переформирован|Капитальный Ремонт|Выведен из эксплуатации/.test(td.textContent));
        const host=statusCell || tr.children[Math.max(0,tr.children.length-2)];
        if(host){
          const badge=document.createElement('div');
          badge.className='railphoto-service-badge';
          badge.textContent=`🚆 В РЕЙСЕ №${item.inService.trainNum}${item.inService.from||item.inService.to?` · ${item.inService.from||''} → ${item.inService.to||''}`:''}`;
          host.appendChild(badge);
        }
      }
    });
  }

  function patchTableRefresh(){
    if(typeof window.renderTable !== 'function' || window.__railphotoTablePatched) return;
    const original=window.renderTable;
    window.renderTable=function(){
      original.apply(this,arguments);
      setTimeout(addDatabaseRunInfo,0);
    };
    window.__railphotoTablePatched=true;
    setTimeout(addDatabaseRunInfo,50);
  }

  function dispatchConsist(){
    if(!selectedConsist.length){alert('Сначала добавьте ПС в состав.');return;}
    const trainNum=(document.getElementById('tripNum')?.value||'').trim();
    if(!trainNum){alert('Укажите номер поезда.');return;}
    const from=document.getElementById('tripFromStation')?.value||'';
    const to=document.getElementById('tripToStation')?.value||'';
    const depTime=document.getElementById('tripStartTime')?.value||'';
    const service={trainNum,from,to,depTime,startedAt:new Date().toISOString()};
    const ids=[...new Set(selectedConsist.map(x=>x.id))];
    db.forEach(item=>{if(ids.includes(item.id)) item.inService=service;});
    if(typeof saveData==='function') saveData();
    addDatabaseRunInfo();
    renderBuilderSourceQuantities();
    alert(`Состав №${trainNum} отправлен в рейс.`);
  }

  function releaseConsist(){
    if(!selectedConsist.length){alert('Состав не выбран.');return;}
    const ids=[...new Set(selectedConsist.map(x=>x.id))];
    db.forEach(item=>{if(ids.includes(item.id)) item.inService=null;});
    if(typeof saveData==='function') saveData();
    addDatabaseRunInfo();
    renderBuilderSourceQuantities();
  }

  function renderBuilderSourceQuantities(){renderBuilderQuantities();}

  function init(){
    installStyles();
    ensureData();
    patchConsistRendering();
    patchAddToConsist();
    addBuilderButtons();
    patchTableRefresh();
    addDatabaseRunInfo();
    renderBuilderSourceQuantities();
    setInterval(()=>{
      patchAddToConsist();
      patchConsistRendering();
      addBuilderButtons();
      addDatabaseRunInfo();
      renderBuilderSourceQuantities();
    },1000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',waitForApp); else waitForApp();
})();
