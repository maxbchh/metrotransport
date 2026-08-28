/* Railphoto — ДСП: ручной конструктор станции и управление объектами. */
(function(){
  'use strict';
  if(window.__railphotoDspReady)return;
  window.__railphotoDspReady=true;

  const KEY='rp_dsp_layout_v1';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let layout=[];
  let tool='select';
  let selected=null;
  let seq=0;

  function load(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(x))layout=x;}
    catch(e){layout=[];}
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(layout));}
  function nextId(){return 'dsp-'+Date.now()+'-'+(++seq)}

  function styles(){
    if(document.getElementById('railphoto-dsp-style'))return;
    const s=document.createElement('style');s.id='railphoto-dsp-style';
    s.textContent=`
      #railphotoDspPage{display:none;min-height:calc(100vh - 86px)}
      .dsp-shell{display:grid;grid-template-columns:250px 1fr;gap:12px}
      .dsp-panel{background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:6px;padding:12px}
      .dsp-tools{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .dsp-tool{padding:8px 6px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold}
      .dsp-tool.active{background:var(--bp-link);color:#fff;border-color:var(--bp-link)}
      .dsp-board-wrap{background:#dfe6ec;border:1px solid var(--bp-border);border-radius:6px;overflow:hidden;position:relative}
      #dspBoard{width:100%;height:650px;display:block;background:linear-gradient(#eef3f6,#dfe7eb);touch-action:none}
      .dsp-help{font-size:10px;color:var(--bp-text-muted);line-height:1.55;margin-top:10px}
      .dsp-status{padding:8px;border:1px solid var(--bp-border);border-radius:4px;background:var(--bp-input-bg);font-size:10px;margin-top:10px}
      .dsp-status b{color:var(--bp-link)}
      .dsp-list{max-height:260px;overflow:auto;margin-top:8px}
      .dsp-list-item{padding:6px;border-bottom:1px solid var(--bp-border);font-size:10px;cursor:pointer}
      .dsp-list-item:hover{background:rgba(37,99,235,.08)}
      .dsp-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
      .dsp-mini{font-size:9px;color:var(--bp-text-muted);margin-top:6px}
      @media(max-width:900px){.dsp-shell{grid-template-columns:1fr}.dsp-tools{grid-template-columns:repeat(3,1fr)}}
    `;
    document.head.appendChild(s);
  }

  function createPage(){
    if(document.getElementById('railphotoDspPage'))return;
    const p=document.createElement('section');
    p.id='railphotoDspPage';p.className='main-wrapper';
    p.innerHTML=`
      <div class="page-header"><span>🛠 ДСП — Конструктор станции и управление</span><button class="btn-secondary" id="dspBack">← Назад</button></div>
      <div class="dsp-shell">
        <div class="dsp-panel">
          <h3 style="margin-bottom:10px">Построение станции</h3>
          <div class="dsp-tools">
            <button class="dsp-tool active" data-tool="select">🖱 Выбор</button>
            <button class="dsp-tool" data-tool="track">🛤 Участок пути</button>
            <button class="dsp-tool" data-tool="switch">🔀 Стрелка</button>
            <button class="dsp-tool" data-tool="signal">🚦 Светофор</button>
            <button class="dsp-tool" data-tool="platform">▰ Платформа</button>
            <button class="dsp-tool" data-tool="station">🚉 Станция</button>
          </div>
          <div class="dsp-actions">
            <button class="btn-primary btn-sm" id="dspSave">💾 Сохранить</button>
            <button class="btn-secondary btn-sm" id="dspClear">🧹 Очистить</button>
            <button class="btn-danger btn-sm" id="dspDelete">🗑 Удалить выбранное</button>
          </div>
          <div class="dsp-status" id="dspStatus">Инструмент: <b>Выбор</b><br>Выберите объект на схеме.</div>
          <div class="dsp-mini">Объекты можно перетаскивать мышью. Стрелки и светофоры можно переключать кликом.</div>
          <h4 style="margin-top:14px">Объекты станции</h4>
          <div class="dsp-list" id="dspList"></div>
        </div>
        <div class="dsp-board-wrap"><svg id="dspBoard" viewBox="0 0 1100 650" aria-label="Схема станции"></svg></div>
      </div>`;
    document.body.appendChild(p);
  }

  function labelFor(o){return ({track:'Участок пути',switch:'Стрелка',signal:'Светофор',platform:'Платформа',station:'Станция'})[o.type]||o.type}
  function colorFor(o){if(o.type==='track')return o.occupied?'#d97706':'#374151';if(o.type==='signal')return o.state==='green'?'#16a34a':'#dc2626';if(o.type==='switch')return o.state==='diverging'?'#2563eb':'#64748b';return '#2563eb'}

  function render(){
    const svg=document.getElementById('dspBoard');if(!svg)return;
    svg.innerHTML='';
    const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');bg.setAttribute('width','1100');bg.setAttribute('height','650');bg.setAttribute('fill','#eef3f6');svg.appendChild(bg);
    const grid=document.createElementNS('http://www.w3.org/2000/svg','path');
    let d='';for(let x=20;x<1100;x+=40)d+=`M${x} 0V650 `;for(let y=20;y<650;y+=40)d+=`M0 ${y}H1100 `;
    grid.setAttribute('d',d);grid.setAttribute('stroke','#d7dee5');grid.setAttribute('stroke-width','1');svg.appendChild(grid);
    layout.forEach(o=>drawObject(svg,o));
    updateList();
  }

  function drawObject(svg,o){
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.dataset.id=o.id;g.style.cursor='pointer';
    if(selected===o.id)g.setAttribute('filter','drop-shadow(0 0 5px #2563eb)');
    if(o.type==='track'){
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',o.x);line.setAttribute('y1',o.y);line.setAttribute('x2',o.x2);line.setAttribute('y2',o.y2);line.setAttribute('stroke',colorFor(o));line.setAttribute('stroke-width','9');line.setAttribute('stroke-linecap','round');g.appendChild(line);
      const line2=line.cloneNode();line2.setAttribute('stroke','#f5f5f5');line2.setAttribute('stroke-width','2');g.appendChild(line2);
      if(o.occupied){const t=text(o.x,o.y-10,'ЗАНЯТ');t.setAttribute('fill','#d97706');t.setAttribute('font-weight','700');g.appendChild(t)}
    } else if(o.type==='switch'){
      const a=document.createElementNS('http://www.w3.org/2000/svg','path');const bx=o.x,by=o.y;const end=o.state==='diverging'?`${bx+105} ${by-55}`:`${bx+105} ${by}`;a.setAttribute('d',`M${bx} ${by} L${bx+105} ${by} M${bx+25} ${by} L${end.split(' ')[0]} ${end.split(' ')[1]}`);a.setAttribute('fill','none');a.setAttribute('stroke',colorFor(o));a.setAttribute('stroke-width','7');g.appendChild(a);const t=text(bx,by+25,o.state==='diverging'?'ПЕРЕВЕДЕНА':'ПРЯМОЙ');g.appendChild(t)
    } else if(o.type==='signal'){
      const pole=document.createElementNS('http://www.w3.org/2000/svg','line');pole.setAttribute('x1',o.x);pole.setAttribute('y1',o.y);pole.setAttribute('x2',o.x);pole.setAttribute('y2',o.y-42);pole.setAttribute('stroke','#374151');pole.setAttribute('stroke-width','4');g.appendChild(pole);const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',o.x);c.setAttribute('cy',o.y-48);c.setAttribute('r','10');c.setAttribute('fill',colorFor(o));c.setAttribute('stroke','#111827');c.setAttribute('stroke-width','3');g.appendChild(c);const t=text(o.x+14,o.y-45,o.state==='green'?'ЗЕЛЕНЫЙ':'КРАСНЫЙ');g.appendChild(t)
    } else if(o.type==='platform'){
      const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',o.x);r.setAttribute('y',o.y);r.setAttribute('width',o.w);r.setAttribute('height',o.h);r.setAttribute('rx','5');r.setAttribute('fill','#cbd5e1');r.setAttribute('stroke','#64748b');r.setAttribute('stroke-width','2');g.appendChild(r);g.appendChild(text(o.x+8,o.y+o.h/2+4,o.name||'Платформа'))
    } else if(o.type==='station'){
      const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',o.x);r.setAttribute('y',o.y);r.setAttribute('width',o.w);r.setAttribute('height',o.h);r.setAttribute('rx','8');r.setAttribute('fill','#ffffff');r.setAttribute('stroke','#2563eb');r.setAttribute('stroke-width','3');g.appendChild(r);g.appendChild(text(o.x+12,o.y+o.h/2+5,o.name||'Новая станция'))
    }
    g.addEventListener('pointerdown',e=>onObjectDown(e,o));
    svg.appendChild(g);
  }
  function text(x,y,s){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('font-family','Verdana,Arial');t.setAttribute('font-size','12');t.setAttribute('fill','#111827');t.textContent=s;return t}

  let drag=null;
  function svgPoint(e){const svg=document.getElementById('dspBoard'),r=svg.getBoundingClientRect();return {x:(e.clientX-r.left)*1100/r.width,y:(e.clientY-r.top)*650/r.height}}
  function onObjectDown(e,o){e.stopPropagation();selected=o.id;if(tool==='select'){if(o.type==='switch'){o.state=o.state==='diverging'?'straight':'diverging';save()}else if(o.type==='signal'){o.state=o.state==='green'?'red':'green';save()}else if(o.type==='track'){o.occupied=!o.occupied;save()}drag={o,pt:svgPoint(e)};}else if(tool==='delete'){layout=layout.filter(x=>x.id!==o.id);selected=null;save()}render()}

  function onBoardDown(e){
    if(e.target!==e.currentTarget && e.target.tagName!=='rect')return;
    const p=svgPoint(e);if(tool==='select')return;
    if(tool==='track'){layout.push({id:nextId(),type:'track',x:p.x-90,y:p.y,x2:p.x+90,y2:p.y,occupied:false});}
    if(tool==='switch'){layout.push({id:nextId(),type:'switch',x:p.x-35,y:p.y,state:'straight'});}
    if(tool==='signal'){layout.push({id:nextId(),type:'signal',x:p.x,y:p.y,state:'red'});}
    if(tool==='platform'){layout.push({id:nextId(),type:'platform',x:p.x-80,y:p.y-18,w:160,h:36,name:'Платформа'});}
    if(tool==='station'){const name=prompt('Название станции:','Выхино');if(name===null)return;layout.push({id:nextId(),type:'station',x:p.x-95,y:p.y-22,w:190,h:44,name:name.trim()||'Станция'});}
    save();selected=layout[layout.length-1]?.id||null;render();
  }
  function onMove(e){if(!drag)return;const p=svgPoint(e),o=drag.o,dx=p.x-drag.pt.x,dy=p.y-drag.pt.y;drag.pt=p;o.x+=dx;o.y+=dy;if(o.type==='track'){o.x2+=dx;o.y2+=dy}save();render()}
  function onUp(){drag=null}

  function updateList(){const box=document.getElementById('dspList');if(!box)return;box.innerHTML=layout.length?layout.map(o=>`<div class="dsp-list-item" data-id="${esc(o.id)}"><b>${labelFor(o)}</b> — ${o.type==='signal'?(o.state==='green'?'зелёный':'красный'):o.type==='switch'?(o.state==='diverging'?'переведена':'прямой'):o.type==='track'?(o.occupied?'занят':'свободен'):(o.name||'без названия')}</div>`).join(''):'<div class="dsp-mini">Станция пока пустая. Выберите инструмент и кликните по схеме.</div>'}

  function setTool(x){tool=x;document.querySelectorAll('.dsp-tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===x));const names={select:'Выбор',track:'Участок пути',switch:'Стрелка',signal:'Светофор',platform:'Платформа',station:'Станция',delete:'Удаление'};document.getElementById('dspStatus').innerHTML='Инструмент: <b>'+names[x]+'</b><br>'+(x==='select'?'Клик по стрелке/светофору/пути меняет их состояние; объект можно перетащить.':'Клик по схеме создаёт объект.');}

  function open(){
    document.querySelectorAll('.main-wrapper').forEach(x=>{if(x.id!=='railphotoDspPage')x.style.display='none'});
    const p=document.getElementById('railphotoDspPage');p.style.display='block';document.querySelectorAll('.nav-tab-btn').forEach(x=>x.classList.remove('active'));document.getElementById('railphotoDspBtn')?.classList.add('active');render();
  }
  function back(){document.getElementById('railphotoDspPage').style.display='none';document.querySelectorAll('.main-wrapper').forEach(x=>{if(x.id!=='railphotoDspPage')x.style.removeProperty('display')});document.getElementById('railphotoDspBtn')?.classList.remove('active')}

  function replaceMapButton(){
    const header=document.querySelector('header');
    if(!header)return;
    const buttons=[...header.querySelectorAll('button.nav-tab-btn,a.nav-tab-btn')];
    const norm=v=>(v||'').replace(/\s+/g,' ').trim();
    const isDsp=b=>/^🛠?\s*ДСП$/u.test(norm(b.textContent));
    const isMap=b=>/^🗺️?\s*Карта$/u.test(norm(b.textContent));
    const dspButtons=buttons.filter(isDsp);
    const mapButtons=buttons.filter(isMap);
    const keep=dspButtons[0]||mapButtons[0];
    if(!keep)return;
    [...dspButtons.slice(1),...mapButtons].forEach(b=>{if(b!==keep)b.remove();});
    keep.id='railphotoDspBtn';
    keep.textContent='🛠 ДСП';
    keep.onclick=open;
    keep.removeAttribute('href');
    keep.style.display='flex';
    document.getElementById('pageMap')?.remove();
  }
  function ensureButton(){
    let btn=document.getElementById('railphotoDspBtn');if(btn)return;
    const controls=document.querySelector('header .header-controls');if(!controls)return;
    btn=document.createElement('button');btn.id='railphotoDspBtn';btn.className='nav-tab-btn';btn.type='button';btn.textContent='🛠 ДСП';
    const metro=[...controls.querySelectorAll('.nav-tab-btn')].find(x=>/Метро/i.test(x.textContent||''));
    if(metro)controls.insertBefore(btn,metro);else controls.appendChild(btn);btn.onclick=open;
  }
  function init(){
    load();styles();createPage();
    document.querySelectorAll('.dsp-tool').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
    document.getElementById('dspSave').onclick=()=>{save();alert('Схема станции сохранена.');};
    document.getElementById('dspClear').onclick=()=>{if(confirm('Очистить всю схему станции?')){layout=[];selected=null;save();render()}};
    document.getElementById('dspDelete').onclick=()=>{if(selected){layout=layout.filter(x=>x.id!==selected);selected=null;save();render()}};
    document.getElementById('dspBack').onclick=back;
    const svg=document.getElementById('dspBoard');svg.addEventListener('pointerdown',onBoardDown);svg.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);
    document.getElementById('dspList').onclick=e=>{const x=e.target.closest('[data-id]');if(x){selected=x.dataset.id;tool='select';setTool('select');render()}};
    replaceMapButton();ensureButton();render();
    const obs=new MutationObserver(()=>{replaceMapButton();ensureButton()});obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
