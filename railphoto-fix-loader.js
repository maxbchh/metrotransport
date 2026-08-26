/* Railphoto compatibility loader + current bug fixes */
(function(){
  if(window.__railphotoFixLoaderReady)return;
  window.__railphotoFixLoaderReady=true;
  const ORIGINAL='https://raw.githubusercontent.com/maxbchh/railphoto/962ff03bc63b6c9e88c4def6144c3339c8526f58/railphoto-features.js';
  const s=document.createElement('script');
  s.src=ORIGINAL;
  s.onload=function(){try{installFixes();}catch(e){console.error('[Railphoto fix]',e);}};
  s.onerror=function(){console.error('[Railphoto fix] Original feature module failed to load.');};
  document.head.appendChild(s);

  function saveQuantity(item,input){
    const q=Math.max(1,parseInt(input.value,10)||1);
    input.value=String(q);
    item.compositionCount=q;
    try{localStorage.setItem('rp_db',JSON.stringify(db));}catch(e){}
    if(typeof saveData==='function'){try{saveData();}catch(e){console.warn('[Railphoto fix] saveData',e);}}
  }
  function makeQtyInputs(){
    const table=document.querySelector('#pageDatabase table.bp-table');
    if(!table||typeof db==='undefined')return;
    table.querySelectorAll('.railphoto-qty-cell').forEach(cell=>{
      const row=cell.parentElement;if(!row)return;
      const seriesCell=row.children[1];
      const series=seriesCell?.textContent?.trim();
      const item=db.find(x=>x.series===series);if(!item)return;
      let input=cell.querySelector('input.railphoto-db-qty');
      if(!input){
        input=document.createElement('input');
        input.className='railphoto-db-qty';input.type='number';input.min='1';input.step='1';
        input.title='Количество вагонов / секций';cell.replaceChildren(input);
        input.addEventListener('change',()=>saveQuantity(item,input));
        input.addEventListener('blur',()=>saveQuantity(item,input));
        input.addEventListener('click',e=>e.stopPropagation());
        input.addEventListener('mousedown',e=>e.stopPropagation());
      }
      input.value=String(Math.max(1,Number(item.compositionCount)||1));
    });
  }
  function patchRender(){
    if(typeof window.renderTable!=='function'||window.__railphotoFixRenderPatched)return;
    const original=window.renderTable;
    window.renderTable=function(){
      const x=window.scrollX,y=window.scrollY;
      original.apply(this,arguments);
      requestAnimationFrame(()=>{makeQtyInputs();window.scrollTo(x,y);});
    };
    window.__railphotoFixRenderPatched=true;
  }
  function installFixes(){
    let n=0;
    const tick=()=>{patchRender();makeQtyInputs();if(++n<30)setTimeout(tick,500);};
    tick();
  }
})();
