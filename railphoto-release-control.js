/* Railphoto — active run cancellation controls */
(function(){
  if(window.__railphotoReleaseControlReady)return;
  window.__railphotoReleaseControlReady=true;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function wait(){if(typeof db==='undefined'){setTimeout(wait,250);return;}init();}

  function styles(){
    if(document.getElementById('railphoto-release-style'))return;
    const s=document.createElement('style');
    s.id='railphoto-release-style';
    s.textContent=`
      .railphoto-release-btn{margin-left:4px!important;background:#b91c1c!important;color:#fff!important;border:0!important}
      .railphoto-active-runs{background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:5px;padding:10px;margin:0 0 12px;box-shadow:var(--bp-box-shadow)}
      .railphoto-active-run{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--bp-border);border-radius:4px;padding:8px;margin-top:7px;background:var(--bp-input-bg)}
      .railphoto-active-run-title{font-weight:700}
      @media(max-width:700px){.railphoto-active-run{flex-direction:column;align-items:flex-start}}
    `;
    document.head.appendChild(s);
  }

  function refresh(){
    try{if(typeof saveData==='function')saveData();}catch(e){}
    try{if(typeof renderTable==='function')renderTable();}catch(e){}
    try{if(typeof renderBuilder==='function')renderBuilder();}catch(e){}
    try{if(typeof renderScheduleBoard==='function')renderScheduleBoard();}catch(e){}
  }

  function releaseTrain(trainNum){
    const n=String(trainNum||'').trim();
    if(!n)return;
    const affected=(db||[]).filter(x=>x.inService&&String(x.inService.trainNum||'').trim()===n);
    if(!affected.length){alert('Этот поезд уже не находится в рейсе.');return;}
    if(!confirm(`Снять с рейса весь поезд №${n}?\nБудут освобождены все единицы ПС, назначенные на этот номер.`))return;
    affected.forEach(x=>{x.inService=null;});
    if(typeof selectedConsist!=='undefined'){
      for(let i=selectedConsist.length-1;i>=0;i--){if(affected.some(x=>x.id===selectedConsist[i].id))selectedConsist.splice(i,1);}
    }
    refresh();
    alert(`Поезд №${n} снят с рейса.`);
  }
  window.railphotoReleaseTrain=releaseTrain;

  function renderActiveRunsPanel(){
    const page=document.getElementById('pageBuilder');
    const source=document.getElementById('builderSourceList');
    if(!page||!source)return;
    let panel=document.getElementById('railphotoActiveRunsPanel');
    if(!panel){
      panel=document.createElement('div');
      panel.id='railphotoActiveRunsPanel';
      panel.className='railphoto-active-runs no-print';
      source.parentNode.insertBefore(panel,source);
    }
    const groups={};
    (db||[]).forEach(x=>{if(x.inService){const k=String(x.inService.trainNum||'').trim();if(k)(groups[k]||(groups[k]={service:x.inService,items:[]})).items.push(x);}});
    const nums=Object.keys(groups);
    if(!nums.length){panel.innerHTML='';panel.style.display='none';return;}
    panel.style.display='block';
    panel.innerHTML=`<div class="page-header" style="margin-bottom:8px"><span>🚆 Активные рейсы</span></div>`+
      nums.map(n=>{const g=groups[n];return `<div class="railphoto-active-run"><div><div class="railphoto-active-run-title">Поезд №${esc(n)}</div><div style="color:var(--bp-text-muted);font-size:10px">${esc(g.service.from||'')} → ${esc(g.service.to||'')} · ПС: ${g.items.map(x=>esc(x.series)).join(', ')}</div></div><button type="button" class="btn-danger btn-sm railphoto-release-btn" onclick="window.railphotoReleaseTrain('${esc(n)}')">↩️ Снять с рейса</button></div>`;}).join('');
  }

  function enhanceDatabase(){
    const table=document.querySelector('#pageDatabase table.bp-table');
    if(!table)return;
    const rows=[...table.querySelectorAll('tbody tr')];
    rows.forEach(tr=>{
      const actionCell=[...tr.children].find(td=>td.querySelector('button'));
      const seriesCell=tr.children[1];
      if(!actionCell||!seriesCell)return;
      const item=(db||[]).find(x=>x.series===seriesCell.textContent.trim());
      if(!item)return;
      actionCell.querySelectorAll('.railphoto-release-btn').forEach(b=>b.remove());
      if(item.inService){
        const b=document.createElement('button');
        b.type='button';
        b.className='btn-danger btn-sm railphoto-release-btn';
        b.title='Снять весь поезд с рейса';
        b.textContent='↩️ Снять с рейса';
        b.onclick=(e)=>{e.stopPropagation();releaseTrain(item.inService.trainNum);};
        actionCell.appendChild(b);
      }
    });
  }

  function enhanceBuilderCards(){
    const list=document.getElementById('builderSourceList');
    if(!list)return;
    list.querySelectorAll('.builder-source-item').forEach(card=>{
      card.querySelectorAll('.railphoto-release-btn').forEach(b=>b.remove());
      const title=card.querySelector('b');
      if(!title)return;
      const item=(db||[]).find(x=>x.series===title.textContent.trim());
      if(!item||!item.inService)return;
      const b=document.createElement('button');
      b.type='button';b.className='btn-danger btn-sm railphoto-release-btn';
      b.textContent='↩️ Снять';
      b.title=`Снять поезд №${item.inService.trainNum} с рейса`;
      b.onclick=(e)=>{e.stopPropagation();releaseTrain(item.inService.trainNum);};
      const addBtn=card.querySelector('button');
      if(addBtn&&addBtn.parentNode)addBtn.parentNode.appendChild(b);
    });
  }

  function patchRenderers(){
    if(typeof window.renderTable==='function'&&!window.__railphotoReleaseTablePatched){
      const old=window.renderTable;
      window.renderTable=function(){old.apply(this,arguments);setTimeout(enhanceDatabase,0);};
      window.__railphotoReleaseTablePatched=true;
    }
    if(typeof window.renderBuilder==='function'&&!window.__railphotoReleaseBuilderPatched){
      const old=window.renderBuilder;
      window.renderBuilder=function(){old.apply(this,arguments);setTimeout(()=>{renderActiveRunsPanel();enhanceBuilderCards();},0);};
      window.__railphotoReleaseBuilderPatched=true;
    }
  }

  function init(){
    styles();
    patchRenderers();
    renderActiveRunsPanel();
    enhanceDatabase();
    enhanceBuilderCards();
    setInterval(()=>{patchRenderers();renderActiveRunsPanel();enhanceDatabase();enhanceBuilderCards();},1000);
  }
  wait();
})();