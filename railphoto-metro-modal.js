/* Metro PS modal: uses the same full-window editing pattern as the main rolling-stock database. */
(function(){
'use strict';
if(window.__rpmMetroModalLoaded)return;window.__rpmMetroModalLoaded=true;
const DEPOTS=['ТЧ-1 Метродепо','ТЧ-2 Электродепо','ТЧ-3 Выхино'];
const STATES=['На мойке','В ремонте','В депо','Эксплуатируется','Не эксплуатируется','Перекрашен','Переименован','Утилизирован','Списан'];
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function metro(){
  if(typeof profile==='undefined'||!profile)return null;
  if(!profile.metro)profile.metro={lines:[],trains:[]};
  if(!Array.isArray(profile.metro.lines))profile.metro.lines=[];
  if(!Array.isArray(profile.metro.trains))profile.metro.trains=[];
  return profile.metro;
}
function save(){if(typeof saveData==='function')saveData();}
function refresh(){const s=document.getElementById('rpmSearch');if(s)s.dispatchEvent(new Event('input',{bubbles:true}));}
function styles(){
 if(document.getElementById('rpm-mm-style'))return;
 const s=document.createElement('style');s.id='rpm-mm-style';s.textContent=`
#rpmMmOverlay{position:fixed;inset:0;background:var(--bp-modal-overlay,rgba(0,0,0,.65));z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}
#rpmMm{width:min(900px,96vw);max-height:94vh;overflow:auto;background:var(--bp-card-bg,#fff);color:var(--bp-text,#0f172a);border:1px solid var(--bp-border,#cbd5e1);border-radius:6px;box-shadow:0 12px 40px rgba(0,0,0,.4)}
#rpmMm .rpm-mm-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--bp-border,#cbd5e1);font-size:15px;font-weight:bold}
#rpmMm .rpm-mm-x{border:0;background:transparent;color:var(--bp-text,#0f172a);font-size:25px;cursor:pointer;line-height:1}
#rpmMm .rpm-mm-body{padding:16px 18px}
#rpmMm .rpm-mm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
#rpmMm label{display:block;font-size:11px;font-weight:bold;margin-bottom:5px}
#rpmMm input,#rpmMm select,#rpmMm textarea{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid var(--bp-border,#cbd5e1);border-radius:3px;background:var(--bp-input-bg,#fff);color:var(--bp-text,#0f172a);font:inherit;font-size:11px}
#rpmMm textarea{min-height:78px;resize:vertical}
#rpmMm .full{grid-column:1/-1}
#rpmMm .rpm-mm-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--bp-border,#cbd5e1)}
#rpmMm .rpm-mm-foot button{padding:7px 14px;border-radius:3px;font-weight:bold;font-size:11px;cursor:pointer}
#rpmMm .rpm-mm-cancel{background:var(--bp-btn-secondary,#e2e8f0);color:var(--bp-text,#0f172a);border:1px solid var(--bp-border,#cbd5e1)}
#rpmMm .rpm-mm-save{background:var(--bp-btn-primary,#2563eb);color:#fff;border:0}
#rpmMm .rpm-mm-note{font-size:10px;color:var(--bp-text-muted,#475569);font-weight:normal;margin-top:4px}
@media(max-width:700px){#rpmMm .rpm-mm-grid{grid-template-columns:1fr}#rpmMm .full{grid-column:auto}}
`;document.head.appendChild(s);
}
function field(label,name,value,opts){
 opts=opts||{};
 if(opts.select){return `<div${opts.full?' class="full"':''}><label>${label}</label><select name="${name}">${opts.select.map(x=>`<option value="${esc(x)}" ${String(value??'')===String(x)?'selected':''}>${esc(x)}</option>`).join('')}</select>${opts.note?`<div class="rpm-mm-note">${esc(opts.note)}</div>`:''}</div>`}
 const type=opts.type||'text';
 return `<div${opts.full?' class="full"':''}><label>${label}</label><input type="${type}" name="${name}" value="${esc(value??'')}" ${opts.min!=null?`min="${opts.min}"`:''} ${opts.step?`step="${opts.step}"`:''}>${opts.note?`<div class="rpm-mm-note">${esc(opts.note)}</div>`:''}</div>`;
}
function open(existing){
 styles();
 const d=metro();if(!d)return;
 const t=existing?Object.assign({},existing):{id:'',number:'',model:'',category:'Метропоезд',gauge:'1520 мм',wagons:8,buildYear:'',factory:'',commissionDate:'',writeoffDate:'',scrapDate:'',outDate:'',homeDepot:DEPOTS[0],currentDepot:DEPOTS[0],lineId:'',state:'Эксплуатируется',secondState:'',mass:'',length:'',notes:''};
 document.getElementById('rpmMmOverlay')?.remove();
 const overlay=document.createElement('div');overlay.id='rpmMmOverlay';
 const lines=[{id:'',name:'— Без линии —'},...d.lines.map(l=>({id:l.id,name:l.name}))];
 const second=['','Осмотр','На мойке','В ремонте','В депо','Эксплуатируется','Не эксплуатируется','Перекрашен','Переименован','Утилизирован','Списан'];
 overlay.innerHTML=`<div id="rpmMm" role="dialog" aria-modal="true">
 <div class="rpm-mm-head"><span>${existing?'Редактировать':'Добавить'} ПС метрополитена${t.number?' — '+esc(t.number):''}</span><button class="rpm-mm-x" type="button" data-mm-close>×</button></div>
 <form id="rpmMmForm">
 <div class="rpm-mm-body"><div class="rpm-mm-grid">
 ${field('Номер ПС','number',t.number)}
 ${field('Категория ПС','category',t.category||'Метропоезд',{select:['Метропоезд','Моторный вагон','Вагон метро','СпецПС']})}
 ${field('Ширина колеи (мм)','gauge',t.gauge||'1520 мм',{select:['1520 мм','1435 мм','1000 мм','750 мм','Другой']})}
 ${field('Депо приписки','homeDepot',t.homeDepot,{select:DEPOTS})}
 ${field('Завод-изготовитель','factory',t.factory)}
 ${field('Год постройки','buildYear',t.buildYear,{type:'number'})}
 ${field('Дата ввода в эксплуатацию','commissionDate',t.commissionDate,{type:'date'})}
 ${field('Дата списания','writeoffDate',t.writeoffDate,{type:'date'})}
 ${field('Дата утилизации / порезки','scrapDate',t.scrapDate,{type:'date'})}
 ${field('Дата вывода из эксплуатации','outDate',t.outDate,{type:'date'})}
 ${field('Текущий статус','state',t.state,{select:STATES})}
 ${field('Текущее место / депо','currentDepot',t.currentDepot,{select:DEPOTS})}
 ${field('Линия метро','lineId',t.lineId,{select:lines.map(x=>x.id),note:'Линия выбирается из созданных во вкладке метро'})}
 ${field('Масса единицы (тонн)','mass',t.mass,{type:'number',step:'0.1'})}
 ${field('Длина (метров)','length',t.length,{type:'number',step:'0.1'})}
 ${field('Второе состояние','secondState',t.secondState||'',{select:second})}
 ${field('Количество вагонов / секций','wagons',t.wagons||1,{type:'number',min:1})}
 <div class="full"><label>Примечание / История ремонтов</label><textarea name="notes" placeholder="Укажите подробное примечание (ремонты, перекраска, передача в другое депо и т.д.)">${esc(t.notes||'')}</textarea></div>
 </div></div>
 <div class="rpm-mm-foot"><button type="button" class="rpm-mm-cancel" data-mm-close>Отмена</button><button type="submit" class="rpm-mm-save">Сохранить ${existing?'ПС':'единицу ПС'}</button></div>
 </form></div>`;
 document.body.appendChild(overlay);
 const close=()=>overlay.remove();overlay.querySelectorAll('[data-mm-close]').forEach(b=>b.addEventListener('click',close));
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 const f=overlay.querySelector('#rpmMmForm');
 f.addEventListener('submit',e=>{
   e.preventDefault();const fd=new FormData(f);const get=n=>String(fd.get(n)||'').trim();
   const lineId=get('lineId');
   const obj={...t,number:get('number'),model:t.model||get('category'),category:get('category'),gauge:get('gauge'),homeDepot:get('homeDepot'),factory:get('factory'),buildYear:get('buildYear'),commissionDate:get('commissionDate'),writeoffDate:get('writeoffDate'),scrapDate:get('scrapDate'),outDate:get('outDate'),state:get('state'),currentDepot:get('currentDepot'),lineId:d.lines.some(l=>l.id===lineId)?lineId:'',mass:get('mass'),length:get('length'),secondState:get('secondState'),wagons:Math.max(1,parseInt(get('wagons'),10)||1),notes:get('notes')};
   if(!obj.number){alert('Укажите номер ПС.');return;}
   if(existing){const i=d.trains.findIndex(x=>x.id===existing.id);if(i>=0)d.trains[i]=obj;}
   else{obj.id='metro-train-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);d.trains.push(obj);}
   save();close();refresh();
 });
 const first=overlay.querySelector('[name="number"]');if(first){first.focus();first.select();}
}
function intercept(e){
 const add=e.target.closest?.('#rpmAddTrain');
 const edit=e.target.closest?.('[data-edit-train]');
 if(!add&&!edit)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const d=metro();if(!d)return;
 if(add){open(null);return;}
 open(d.trains.find(t=>t.id===edit.dataset.editTrain)||null);
}
function init(){
 document.addEventListener('click',intercept,true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Надёжное подключение вкладки «Карта». Выполняется из уже подключённого файла,
   поэтому отдельный <script> в index.html не требуется. */
(function(){
  'use strict';
  function installMap(){
    if(document.getElementById('rgmBtn'))return;
    const h=document.querySelector('header .header-controls');
    if(!h)return;
    const b=document.createElement('button');
    b.id='rgmBtn'; b.type='button'; b.className='nav-tab-btn'; b.textContent='🗺 Карта';
    const analytics=document.getElementById('btnViewAnalytics');
    if(analytics) h.insertBefore(b,analytics); else h.appendChild(b);
    b.addEventListener('click',function(){
      const existing=document.getElementById('rgmPage');
      if(existing){
        document.querySelectorAll('.main-wrapper').forEach(x=>x.style.display=x===existing?'block':'none');
        document.querySelectorAll('.nav-tab-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
        return;
      }
      const s=document.createElement('script');
      s.src='railphoto-map.js?mapfix='+Date.now();
      s.onload=function(){
        setTimeout(function(){
          if(window.__railphotoMapLoaded)return;
          console.error('[Railphoto] Не удалось загрузить карту.');
        },1500);
      };
      s.onerror=function(){alert('Не удалось загрузить модуль карты. Обновите страницу через Ctrl+F5.');};
      document.body.appendChild(s);
    });
  }
  function boot(){installMap();let n=0;const t=setInterval(()=>{installMap();if(++n>20)clearInterval(t)},500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
