/* Railphoto — compatibility loader. Loads the current stable feature layer. */
(function(){
  'use strict';
  if(window.__railphotoFixLoaderReady)return;
  window.__railphotoFixLoaderReady=true;

  const CURRENT='https://raw.githubusercontent.com/maxbchh/railphoto/a2a2b2fdc89d936e4e3a09a0ac95317070573147/railphoto-features.js';
  const s=document.createElement('script');
  s.src=CURRENT;
  s.onload=function(){
    try{installQuantityEditor();}catch(e){console.error('[Railphoto quantity editor]',e);}
  };
  s.onerror=function(){console.error('[Railphoto] Current feature module failed to load.');};
  document.head.appendChild(s);

  function installQuantityEditor(){
    function ensure(){
      const form=document.getElementById('vehicleForm');
      if(!form)return;
      const grid=form.querySelector('.form-grid');
      if(!grid)return;

      let box=document.getElementById('railphotoFormQtyBox');
      if(!box){
        box=document.createElement('div');
        box.id='railphotoFormQtyBox';
        box.className='railphoto-form-qty';
        box.innerHTML='<label>Количество вагонов / секций:</label><input id="formCompositionCount" type="number" min="1" step="1" value="1" title="Для пассажирского состава — количество вагонов; для МВПС — количество секций">';
      }

      /* Put the field directly after the length field in the edit window. */
      const lengthInput=document.getElementById('formLength');
      const lengthBox=lengthInput?.parentElement;
      if(lengthBox && lengthBox.parentElement===grid){
        lengthBox.insertAdjacentElement('afterend',box);
      }else if(!box.parentElement){
        grid.appendChild(box);
      }

      const input=document.getElementById('formCompositionCount');
      if(input && !input.dataset.qtyBound){
        input.dataset.qtyBound='1';
        input.addEventListener('click',e=>e.stopPropagation());
        input.addEventListener('mousedown',e=>e.stopPropagation());
      }
    }

    ensure();
    const observer=new MutationObserver(ensure);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(ensure,100);
    setTimeout(ensure,500);
  }
})();
