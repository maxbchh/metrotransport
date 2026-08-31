/* Метро: добавление одного ПС. Не изменяет массовое добавление. */
(function(){
  'use strict';
  if(window.__metroSingleAddLoaded)return;
  window.__metroSingleAddLoaded=true;

  function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}

  function installButton(){
    if(document.getElementById('metroSingleAddBtn'))return true;
    const page=document.getElementById('pageMetro');
    if(!page)return false;
    const primary=page.querySelector('.page-header .action-buttons');
    if(!primary)return false;
    const b=document.createElement('button');
    b.id='metroSingleAddBtn';
    b.className='btn-primary';
    b.type='button';
    b.textContent='＋ Добавить 1 ПС';
    b.addEventListener('click',openModal);
    primary.insertBefore(b,primary.firstChild);
    return true;
  }

  function openModal(){
    if(document.getElementById('metroSingleModal'))return;
    const lines=(window.metroLines||[]);
    const opts=lines.map(l=>`<option value="${esc(l.id)}">${esc(l.number+' — '+l.name)}</option>`).join('');
    const o=document.createElement('div');
    o.className='modal-overlay';
    o.id='metroSingleModal';
    o.style.display='flex';
    o.innerHTML=`<div class="modal-card">
      <span class="modal-close" id="metroSingleClose">&times;</span>
      <h3>Добавить 1 ПС метро</h3>
      <p style="color:var(--bp-text-muted);font-size:11px;margin:6px 0 14px">Порядковый номер после последнего тире общий для всего метро. Если номер уже занят другой моделью, он будет заменён на ближайший свободный.</p>
      <div class="form-grid">
        <div><label>Модель</label><input id="msModel" value="81-740"></div>
        <div><label>Порядковый номер</label><input id="msNumber" type="number" min="1" placeholder="Авто"></div>
        <div><label>Вагоны / секции</label><input id="msWagons" type="number" min="1" value="5"></div>
        <div><label>Линия</label><select id="msLine">${opts}</select></div>
        <div><label>Состояние</label><select id="msState"><option>Эксплуатируется</option><option>Ремонт</option><option>В запасе</option><option>Выведен из эксплуатации</option></select></div>
        <div><label>Завод</label><input id="msFactory" placeholder="Метровагонмаш"></div>
        <div><label>Год постройки</label><input id="msYear" type="number" placeholder="2001"></div>
        <div><label>Дата ввода в эксплуатацию</label><input id="msCommission" type="date"></div>
      </div>
      <div class="action-buttons" style="margin-top:18px;justify-content:flex-end">
        <button class="btn-secondary" id="metroSingleCancel">Отмена</button>
        <button class="btn-primary" id="metroSingleSave">Добавить ПС</button>
      </div>
    </div>`;
    document.body.appendChild(o);
    document.getElementById('metroSingleClose').onclick=()=>o.remove();
    document.getElementById('metroSingleCancel').onclick=()=>o.remove();
    document.getElementById('metroSingleSave').onclick=saveOne;
  }

  function saveOne(){
    if(!Array.isArray(window.metroStock)){
      alert('База метро пока не загрузилась. Обновите страницу.');
      return;
    }
    const model=(document.getElementById('msModel').value||'81-740').trim();
    const raw=parseInt(document.getElementById('msNumber').value,10);
    const used=new Set(window.metroStock.map(x=>{const m=String(x.number||'').match(/(?:^|-)\s*(\d+)$/);return m?String(+m[1]):null}).filter(Boolean));
    let n=Number.isFinite(raw)&&raw>0?raw:1;
    if(used.has(String(n))){while(used.has(String(n)))n++;}
    const id='metro-ps-'+Date.now();
    window.metroStock.push({id,type:model,number:model+'-'+n,lineId:document.getElementById('msLine').value,status:document.getElementById('msState').value,wagons:parseInt(document.getElementById('msWagons').value,10)||5,factory:(document.getElementById('msFactory').value||'').trim(),buildYear:(document.getElementById('msYear').value||'').trim(),commissionDate:document.getElementById('msCommission').value||''});
    if(typeof window.saveData==='function')window.saveData();
    if(typeof window.renderMetro==='function')window.renderMetro();
    document.getElementById('metroSingleModal')?.remove();
    alert(`Добавлен ПС: ${model}-${n}`);
  }

  /* Разрешаем удалить любую линию, включая последнюю. Старое ограничение
     «нельзя удалить последнюю линию» полностью обходится на уровне клика. */
  function installDeleteFix(){
    if(window.__metroDeleteLastLineFix)return;
    window.__metroDeleteLastLineFix=true;
    document.addEventListener('click',function(e){
      const page=document.getElementById('pageMetro');
      if(!page || page.style.display==='none')return;
      const b=e.target.closest?.('button');
      if(!b)return;
      const text=(b.textContent||'').replace(/\s+/g,' ').trim();
      if(text!=='Удалить')return;
      if(!Array.isArray(window.metroLines))return;
      const selectedId=window.selectedMetroLineId || window.currentMetroLineId || '';
      const index=window.metroLines.findIndex(l=>String(l.id)===String(selectedId));
      if(index<0)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if(!confirm(`Удалить линию «${window.metroLines[index].number} — ${window.metroLines[index].name}»?`))return;
      const id=window.metroLines[index].id;
      // ПС не удаляем — просто снимаем привязку к удалённой линии.
      if(Array.isArray(window.metroStock))window.metroStock.forEach(t=>{if(String(t.lineId)===String(id))t.lineId=''});
      window.metroLines.splice(index,1);
      window.selectedMetroLineId=window.metroLines[0]?.id || '';
      if(typeof window.saveMetroData==='function')window.saveMetroData();
      if(typeof window.saveData==='function')window.saveData();
      if(typeof window.renderMetro==='function')window.renderMetro();
      if(typeof window.renderMetroSummary==='function')window.renderMetroSummary();
    },true);
  }

  function boot(){
    installDeleteFix();
    if(installButton())return;
    let tries=0;
    const t=setInterval(()=>{tries++;if(installButton()||tries>30)clearInterval(t)},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
