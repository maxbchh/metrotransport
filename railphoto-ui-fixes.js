/* Исправления интерфейса и массового создания составов метро */
(function(){
'use strict';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function metro(){
  if(typeof profile==='undefined'||!profile)return null;
  if(!profile.metro)profile.metro={lines:[],trains:[]};
  if(!Array.isArray(profile.metro.lines))profile.metro.lines=[];
  if(!Array.isArray(profile.metro.trains))profile.metro.trains=[];
  return profile.metro;
}
function save(){try{if(typeof saveData==='function')saveData();else localStorage.setItem('rp_profile',JSON.stringify(profile));}catch(e){console.error(e);}}

function injectStyles(){
  if(document.getElementById('rpf-ui-style'))return;
  const s=document.createElement('style');s.id='rpf-ui-style';
  s.textContent=`
    @media (max-width:700px){
      header{align-items:stretch!important;flex-direction:column!important;padding:10px!important;}
      header>div:first-child{width:100%!important;}
      header>div:first-child>span:last-child{display:block!important;margin:7px 0 0!important;font-size:12px!important;line-height:1.35!important;}
      .header-controls{width:100%!important;display:flex!important;flex-wrap:wrap!important;overflow:visible!important;gap:5px!important;}
      .header-controls .nav-tab-btn,.header-controls .theme-toggle-btn{flex:1 1 calc(50% - 5px)!important;justify-content:center!important;min-width:0!important;white-space:nowrap!important;}
      .main-wrapper{padding:13px!important;}
      .rpm-form{grid-template-columns:1fr!important;}
      .rpm-form .full{grid-column:auto!important;}
    }
    #rpfBatchModal{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(2px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;}
    #rpfBatchCard{width:min(820px,96vw);max-height:92vh;overflow:auto;background:var(--bp-card-bg,#fff);color:var(--bp-text,#111);border:1px solid var(--bp-border,#ccd);border-radius:12px;box-shadow:0 14px 50px rgba(0,0,0,.35);}
    #rpfBatchCard .rpf-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--bp-border,#ccd);font-size:16px;font-weight:800;}
    #rpfBatchCard .rpf-body{padding:16px 18px;}
    #rpfBatchCard .rpf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;}
    #rpfBatchCard label{display:block;font-size:11px;font-weight:700;color:var(--bp-text-muted,#687);}
    #rpfBatchCard input,#rpfBatchCard select{width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid var(--bp-border,#ccd);border-radius:8px;background:var(--bp-input-bg,#fff);color:var(--bp-text,#111);font:inherit;}
    #rpfBatchCard .rpf-full{grid-column:1/-1;}
    #rpfBatchCard .rpf-help{margin-top:10px;padding:10px;background:rgba(37,99,235,.08);border:1px solid var(--bp-link,#2563eb);border-radius:8px;font-size:11px;line-height:1.5;}
    #rpfBatchCard .rpf-preview{margin-top:10px;padding:10px;background:var(--bp-input-bg,#fff);border:1px dashed var(--bp-border,#ccd);border-radius:8px;font-size:11px;max-height:120px;overflow:auto;}
    #rpfBatchCard .rpf-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--bp-border,#ccd);}
    @media(max-width:700px){#rpfBatchCard .rpf-grid{grid-template-columns:1fr}#rpfBatchCard .rpf-full{grid-column:auto}.rpf-foot{flex-wrap:wrap}}
  `;
  document.head.appendChild(s);
}

function openBatchModal(){
  document.getElementById('rpfBatchModal')?.remove();
  const d=metro();if(!d)return;
  const lines=d.lines.map(l=>`<option value="${esc(l.id)}">${esc((l.number?l.number+' — ':'')+(l.name||'Без названия'))}</option>`).join('');
  const depots=['ТЧ-1 Метродепо','ТЧ-2 Электродепо','ТЧ-3 Выхино'];
  const states=['На мойке','В ремонте','В депо','Эксплуатируется','Не эксплуатируется','Перекрашен','Переименован','Утилизирован','Списан'];
  const o=document.createElement('div');o.id='rpfBatchModal';
  o.innerHTML=`<div id="rpfBatchCard">
    <div class="rpf-head"><span>📦 Массовое добавление ПС метро</span><button type="button" id="rpfBatchClose" class="btn-secondary">✕</button></div>
    <div class="rpf-body"><div class="rpf-grid">
      <label>Модель / серия<input id="rpfModel" value="81-740" placeholder="81-740"></label>
      <label>Депо приписки<select id="rpfDepot">${depots.map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label>Начальный номер<input id="rpfStart" type="number" min="1" value="1"></label>
      <label>Конечный номер<input id="rpfEnd" type="number" min="1" value="20"></label>
      <label>Количество вагонов / секций<input id="rpfWagons" type="number" min="1" value="8"></label>
      <label>Линия метро<select id="rpfLine"><option value="">— не назначена —</option>${lines}</select></label>
      <label>Завод-изготовитель<input id="rpfFactory" placeholder="Метровагонмаш"></label>
      <label>Год постройки<input id="rpfYear" type="number" min="1800" max="2200" placeholder="1977"></label>
      <label>Дата ввода в эксплуатацию<input id="rpfCommission" type="date"></label>
      <label>Состояние<select id="rpfState">${states.map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label class="rpf-full">Шаблон номера<input value="{модель}-{номер}" readonly></label>
    </div>
    <div class="rpf-help"><b>Как работает:</b> задайте начало и конец. Например, <b>1–20</b> создаст только свободные номера 1...20. Если <b>81-740-19</b> или <b>81-740-20</b> уже есть, они будут <b>пропущены</b> — система не создаст вместо них 21, 22 и т. д.</div>
    <div id="rpfPreview" class="rpf-preview"></div></div>
    <div class="rpf-foot"><button type="button" id="rpfBatchCancel" class="btn-secondary">Отмена</button><button type="button" id="rpfBatchCreate" class="btn-success">✓ Создать свободные номера</button></div>
  </div>`;
  document.body.appendChild(o);
  const close=()=>o.remove();o.querySelector('#rpfBatchClose').onclick=close;o.querySelector('#rpfBatchCancel').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});
  function preview(){
    const model=document.getElementById('rpfModel').value.trim()||'81-740';let a=parseInt(document.getElementById('rpfStart').value)||1,b=parseInt(document.getElementById('rpfEnd').value)||1;if(a>b)[a,b]=[b,a];
    const used=new Set(d.trains.map(t=>String(t.number).trim()));const total=Math.min(500,b-a+1),list=[];for(let n=a,i=0;i<total;n++,i++){const num=model+'-'+n;if(!used.has(num))list.push(num)}
    document.getElementById('rpfPreview').innerHTML=`Будет создано: <b>${list.length}</b> из ${total} номеров диапазона.<br>${list.length?esc(list.slice(0,60).join(', '))+(list.length>60?' …':''):'Свободных номеров в диапазоне нет.'}`;
  }
  ['rpfModel','rpfStart','rpfEnd'].forEach(id=>document.getElementById(id).addEventListener('input',preview));preview();
  document.getElementById('rpfBatchCreate').onclick=()=>{
    const model=document.getElementById('rpfModel').value.trim()||'81-740';let a=parseInt(document.getElementById('rpfStart').value)||1,b=parseInt(document.getElementById('rpfEnd').value)||1;if(a>b)[a,b]=[b,a];
    if(b-a>499){alert('Максимум 500 номеров за одно добавление.');return;}
    const used=new Set(d.trains.map(t=>String(t.number).trim()));const lineId=document.getElementById('rpfLine').value,depot=document.getElementById('rpfDepot').value,state=document.getElementById('rpfState').value,wagons=Math.max(1,parseInt(document.getElementById('rpfWagons').value)||1),factory=document.getElementById('rpfFactory').value.trim(),buildYear=document.getElementById('rpfYear').value.trim(),commissionDate=document.getElementById('rpfCommission').value;let created=0,skipped=0;
    for(let n=a;n<=b;n++){
      const number=model+'-'+n;
      if(used.has(number)){skipped++;continue;}
      d.trains.push({id:'metro-train-'+Date.now()+'-'+created+'-'+Math.random().toString(36).slice(2,7),number,model,wagons,buildYear,factory,homeDepot:depot,currentDepot:depot,lineId,state,notes:'',commissionDate});
      used.add(number);created++;
    }
    save();if(typeof window.__railphotoMetroRender==='function')window.__railphotoMetroRender();else document.getElementById('rpmSearch')?.dispatchEvent(new Event('input',{bubbles:true}));
    close();alert(`Создано: ${created}. Пропущено занятых номеров: ${skipped}.`);
  };
}

function install(){
  injectStyles();
  const b=document.getElementById('rpmBatchAdd');
  if(b)b.onclick=openBatchModal;
}

function boot(){
  install();
  let n=0;const timer=setInterval(()=>{install();if(++n>20)clearInterval(timer)},400);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();