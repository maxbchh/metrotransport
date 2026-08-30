/* Максиградская железная дорога — глобальная уникальность порядковых номеров метро */
(function(){
  'use strict';
  function data(){
    try{
      if(typeof profile==='undefined'||!profile)return null;
      if(!profile.metro)profile.metro={lines:[],trains:[]};
      if(!Array.isArray(profile.metro.trains))profile.metro.trains=[];
      return profile.metro;
    }catch(e){return null;}
  }
  function save(){try{if(typeof saveData==='function')saveData();else localStorage.setItem('rp_profile',JSON.stringify(profile));}catch(e){console.error(e)}}
  function ordinal(number){
    const m=String(number||'').trim().match(/(?:^|-)(\d+)$/);
    return m?String(parseInt(m[1],10)):null;
  }
  function usedOrdinals(skipId){
    const d=data(),s=new Set();
    if(!d)return s;
    d.trains.forEach(t=>{
      if(skipId&&t.id===skipId)return;
      const n=ordinal(t.number);if(n)s.add(n);
    });
    return s;
  }
  function modelModal(){return document.getElementById('rpmModal')}
  function wireBatchButton(){
    const btn=document.getElementById('rpfBatchCreate');
    if(!btn||btn.dataset.globalGuard==='1')return;
    btn.dataset.globalGuard='1';
    btn.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopImmediatePropagation();
      const d=data();if(!d)return;
      const model=(document.getElementById('rpfModel')?.value||'81-740').trim()||'81-740';
      let a=parseInt(document.getElementById('rpfStart')?.value)||1;
      let b=parseInt(document.getElementById('rpfEnd')?.value)||1;
      if(a>b)[a,b]=[b,a];
      if(b-a>499){alert('Максимум 500 номеров за одно добавление.');return;}
      const used=usedOrdinals();
      const lineId=document.getElementById('rpfLine')?.value||'';
      const depot=document.getElementById('rpfDepot')?.value||'';
      const state=document.getElementById('rpfState')?.value||'Эксплуатируется';
      const wagons=Math.max(1,parseInt(document.getElementById('rpfWagons')?.value)||1);
      const factory=(document.getElementById('rpfFactory')?.value||'').trim();
      const buildYear=(document.getElementById('rpfYear')?.value||'').trim();
      const commissionDate=document.getElementById('rpfCommission')?.value||'';
      let created=0,skipped=0;
      for(let n=a;n<=b;n++){
        const ord=String(n);
        if(used.has(ord)){skipped++;continue;}
        const number=model+'-'+n;
        d.trains.push({id:'metro-train-'+Date.now()+'-'+created+'-'+Math.random().toString(36).slice(2,7),number,model,wagons,buildYear,factory,homeDepot:depot,currentDepot:depot,lineId,state,notes:'',commissionDate});
        used.add(ord);created++;
      }
      save();
      document.getElementById('rpfBatchModal')?.remove();
      document.getElementById('rpmSearch')?.dispatchEvent(new Event('input',{bubbles:true}));
      alert(`Создано: ${created}. Пропущено занятых порядковых номеров: ${skipped}.`);
    },true);
  }
  function wireSingleSave(){
    const btn=document.querySelector('#rpmModal [data-save]');
    const modal=modelModal();
    if(!btn||!modal||btn.dataset.globalGuard==='1')return;
    btn.dataset.globalGuard='1';
    btn.addEventListener('click',function(ev){
      const num=modal.querySelector('[name="number"]')?.value?.trim()||'';
      const ord=ordinal(num);
      if(!ord)return;
      const d=data();if(!d)return;
      /* Для ручного добавления: одинаковый порядковый номер запрещён независимо от модели. */
      const conflict=d.trains.find(t=>ordinal(t.number)===ord);
      if(conflict){
        /* При редактировании текущей записи оставляем её номер разрешённым. */
        const modelText=modal.querySelector('[name="model"]')?.value?.trim()||'';
        const exact=String(conflict.number||'').trim()===num && String(conflict.model||'').trim()===modelText;
        if(!exact){
          ev.preventDefault();ev.stopImmediatePropagation();
          alert(`Порядковый номер ${ord} уже занят составом ${conflict.number}.\nНомер после тире должен быть уникальным для всего метро.`);
        }
      }
    },true);
  }
  function observe(){
    wireBatchButton();wireSingleSave();
    const rpm=document.getElementById('rpmPage');
    if(rpm&&!rpm.dataset.globalGuardObserver){
      rpm.dataset.globalGuardObserver='1';
      new MutationObserver(()=>{wireBatchButton();wireSingleSave()}).observe(rpm,{subtree:true,childList:true});
    }
  }
  function boot(){
    observe();let i=0;const t=setInterval(()=>{observe();if(++i>40)clearInterval(t)},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
