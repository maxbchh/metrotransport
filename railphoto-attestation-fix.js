/* Railphoto — put the DСП/машинист attestation questions into the existing Аттестация tab only. */
(function(){
  if(window.__railphotoAttestationFixReady) return;
  window.__railphotoAttestationFixReady=true;

  const GROUPS={
    DSP:{title:'ДСП',questions:[
      ['Какова основная задача ДСП на станции?',['Обеспечение безопасного и организованного движения поездов и маневров','Продажа билетов','Ремонт локомотивов','Только информирование пассажиров'],0],
      ['Что необходимо проверить перед приёмом или отправлением поезда?',['Только номер поезда','Готовность маршрута, сигналы и необходимые условия безопасности','Только погоду','Только наличие пассажиров'],1],
      ['Что делать при противоречивой информации о движении поезда?',['Игнорировать её','Уточнить информацию по установленному каналу связи и действовать по регламенту','Самостоятельно отменить поезд','Удалить запись'],1],
      ['Для чего ДСП использует поездную и оперативную связь?',['Для безопасной координации действий и передачи служебной информации','Для личных разговоров','Для рекламы','Для развлечений'],0],
      ['Как действовать при обстоятельстве, угрожающем безопасности движения?',['Скрыть информацию','Немедленно сообщить ответственным и действовать по установленному регламенту','Продолжить работу без изменений','Изменить данные задним числом'],1]
    ]},
    MACHINIST:{title:'Машинист',questions:[
      ['Какое значение обычно имеет зелёный сигнал светофора?',['Движение запрещено','Движение разрешено в установленном направлении','Только маневры','Требуется немедленная остановка'],1],
      ['Что должен сделать машинист при неисправности, влияющей на безопасность движения?',['Игнорировать её','Сообщить о неисправности и действовать по установленному порядку','Ускориться','Скрыть неисправность'],1],
      ['Для чего машинисту нужна информация о маршруте и ограничениях скорости?',['Для безопасного ведения поезда','Только для отчёта','Для расчёта стоимости билета','Только для табло'],0],
      ['Что важно сделать перед отправлением поезда после стоянки?',['Проверить готовность к отправлению и действовать по установленной процедуре','Сразу увеличить скорость','Игнорировать сигналы','Выключить радиосвязь'],0],
      ['Что делать при получении оперативного сообщения об изменении условий движения?',['Игнорировать сообщение','Принять информацию к исполнению и действовать по указаниям и регламенту','Удалить сообщение','Продолжить без изменений'],1]
    ]}
  };

  function page(){return document.getElementById('pageAttestation')||document.getElementById('pageCertification')||null;}
  function profilePage(){return document.getElementById('pageProfile')||null;}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function build(){
    const p=page(); if(!p)return;
    const old=document.getElementById('railphotoAttestationExtra');
    if(old && old.parentElement!==p) p.appendChild(old);
    if(document.getElementById('railphotoAttestationExtra'))return;

    const wrap=document.createElement('div');
    wrap.id='railphotoAttestationExtra';
    wrap.className='railphoto-extra-test';
    wrap.innerHTML='<h3>🚆 Дополнительная аттестация</h3><p style="color:var(--bp-text-muted);margin:4px 0 10px">10 вопросов: 5 для ДСП и 5 для машиниста.</p>';

    const tabs=document.createElement('div'); tabs.className='railphoto-attestation-tabs';
    const body=document.createElement('div');
    const sections={};
    [['DSP','ДСП'],['MACHINIST','Машинист']].forEach(([key,label],idx)=>{
      const tab=document.createElement('button');tab.type='button';tab.className='railphoto-attestation-tab'+(idx===0?' active':'');tab.textContent=label;
      const sec=document.createElement('div');sec.className='railphoto-attestation-section'+(idx===0?' active':'');sec.dataset.group=key;
      sec.innerHTML='<h4>'+label+'</h4>';
      GROUPS[key].questions.forEach((item,i)=>{
        const q=document.createElement('div');q.className='railphoto-extra-question';
        q.innerHTML='<b>'+(i+1)+'. '+esc(item[0])+'</b>'+item[1].map((a,j)=>'<label><input type="radio" name="att_'+key+'_'+i+'" value="'+j+'"> '+esc(a)+'</label>').join('');
        sec.appendChild(q);
      });
      const check=document.createElement('button');check.type='button';check.className='btn-primary';check.textContent='Проверить '+label;
      const result=document.createElement('div');result.className='railphoto-extra-result';result.style.display='none';
      check.onclick=function(){let score=0;GROUPS[key].questions.forEach((item,i)=>{const v=sec.querySelector('input[name="att_'+key+'_'+i+'"]:checked');if(v&&Number(v.value)===item[2])score++;});result.style.display='block';result.textContent='Результат: '+score+' из 5.';};
      sec.appendChild(check);sec.appendChild(result);body.appendChild(sec);sections[key]=sec;
      tab.onclick=function(){Object.keys(sections).forEach(k=>sections[k].classList.remove('active'));sections[key].classList.add('active');tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));tab.classList.add('active');};
      tabs.appendChild(tab);
    });
    wrap.appendChild(tabs);wrap.appendChild(body);p.appendChild(wrap);
  }

  function moveExisting(){
    const p=page(), existing=document.getElementById('railphotoAttestationExtra');
    if(p&&existing&&existing.parentElement!==p)p.appendChild(existing);
    const prof=profilePage();
    if(prof&&existing&&existing.parentElement===prof)p.appendChild(existing);
  }

  function init(){
    moveExisting();build();
    setInterval(function(){moveExisting();build();},1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
