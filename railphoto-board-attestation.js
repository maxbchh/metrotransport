/* Railphoto — editable station-board notes + stable attestation sections */
(function () {
  if (window.__railphotoBoardAttestationReady) return;
  window.__railphotoBoardAttestationReady = true;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let refreshTimer = null;
  let observerStarted = false;
  let rendering = false;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function ensureProfile() {
    if (typeof profile === 'undefined') return null;
    if (!profile.boardNotes || typeof profile.boardNotes !== 'object') profile.boardNotes = {};
    return profile;
  }

  function saveState() {
    try {
      const p = ensureProfile();
      if (p && typeof localStorage !== 'undefined') localStorage.setItem('rp_profile', JSON.stringify(p));
      if (typeof saveData === 'function') saveData();
    } catch (e) { console.error(e); }
  }

  function installStyles() {
    if (document.getElementById('railphoto-board-attestation-style')) return;
    const style = document.createElement('style');
    style.id = 'railphoto-board-attestation-style';
    style.textContent = `
      .railphoto-board-note-panel,.railphoto-extra-test{background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:5px;padding:12px;margin:0 0 14px;box-shadow:var(--bp-box-shadow)}
      .railphoto-board-note-grid{display:grid;grid-template-columns:160px 1fr auto;gap:8px;align-items:end}
      .railphoto-board-note-grid input,.railphoto-board-note-grid select{width:100%;padding:7px 9px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px}
      .railphoto-quick-notes{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
      .railphoto-quick-notes button{padding:4px 8px;border:1px solid var(--bp-border);background:var(--bp-btn-secondary);color:var(--bp-text);border-radius:3px;cursor:pointer;font-size:10px}
      .railphoto-board-note-badge{display:inline-block;margin:3px 0 0 6px;padding:2px 6px;border-radius:3px;background:#0f766e;color:#fff;font-size:10px;font-weight:700;box-shadow:0 0 8px rgba(20,184,166,.35)}
      .railphoto-attestation-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 10px}
      .railphoto-attestation-tab{padding:6px 10px;border:1px solid var(--bp-border);background:var(--bp-btn-secondary);color:var(--bp-text);border-radius:4px;cursor:pointer;font-weight:700;font-size:10px}
      .railphoto-attestation-tab.active{background:var(--bp-link);color:#fff;border-color:var(--bp-link)}
      .railphoto-attestation-section{display:none}
      .railphoto-attestation-section.active{display:block}
      .railphoto-extra-question{border:1px solid var(--bp-border);border-radius:4px;padding:9px;margin:8px 0;background:rgba(255,255,255,.02)}
      .railphoto-extra-question label{display:block;margin:4px 0;cursor:pointer}
      .railphoto-extra-result{margin-top:9px;padding:8px;border-radius:4px;background:var(--bp-input-bg);border:1px solid var(--bp-border);font-weight:700}
      @media(max-width:700px){.railphoto-board-note-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function boardPage() {
    return document.getElementById('pageBoard') || document.getElementById('pageStationBoard') ||
      [...document.querySelectorAll('[id^="page"]')].find(el => /табло станций/i.test(el.textContent || '')) || null;
  }

  function schedulesForNotes() {
    const out = [];
    if (Array.isArray(window.schedules)) {
      window.schedules.forEach(s => {
        const n = s.trainNumber ?? s.trainNum ?? s.number ?? s.num ?? s.id;
        if (n !== undefined && n !== null && String(n).trim()) out.push(String(n).trim());
      });
    }
    return [...new Set(out)];
  }

  function notePanelHtml() {
    return `<div class="railphoto-board-note-panel no-print" id="railphotoBoardNotePanel">
      <div class="page-header" style="margin-bottom:10px"><span>📝 Примечания к табло</span><small style="font-size:10px;color:var(--bp-text-muted)">Можно менять в любой момент</small></div>
      <div class="railphoto-board-note-grid">
        <div><label>Номер поезда:</label><select id="railphotoBoardTrain"></select></div>
        <div><label>Примечание:</label><input id="railphotoBoardNote" type="text" placeholder="Например: Посадка / Готов / Стоянка / Опаздывает"></div>
        <button class="btn-success" id="railphotoSaveBoardNote" type="button">💾 Сохранить</button>
      </div>
      <div class="railphoto-quick-notes">
        <button type="button" data-note="Посадка">Посадка</button><button type="button" data-note="Готов">Готов</button><button type="button" data-note="Стоянка">Стоянка</button><button type="button" data-note="Опаздывает">Опаздывает</button><button type="button" data-note="Ожидание посадки">Ожидание посадки</button><button type="button" data-note="Посадка окончена">Посадка окончена</button><button type="button" data-note="Отмена">Отмена</button>
      </div>
    </div>`;
  }

  function populateNoteTrains() {
    const select = document.getElementById('railphotoBoardTrain');
    if (!select) return;
    const current = select.value;
    const nums = schedulesForNotes();
    select.innerHTML = nums.length ? nums.map(n => `<option value="${esc(n)}">№ ${esc(n)}</option>`).join('') : '<option value="">Нет поездов в расписании</option>';
    if (current && nums.includes(current)) select.value = current;
    const p = ensureProfile();
    const input = document.getElementById('railphotoBoardNote');
    if (input) input.value = p?.boardNotes?.[select.value] || '';
  }

  function injectBoardNotePanel() {
    const page = boardPage();
    if (!page || document.getElementById('railphotoBoardNotePanel')) return;
    const header = page.querySelector('.page-header');
    if (header) header.insertAdjacentHTML('afterend', notePanelHtml());
    else page.insertAdjacentHTML('afterbegin', notePanelHtml());
    populateNoteTrains();
    const select = document.getElementById('railphotoBoardTrain');
    const input = document.getElementById('railphotoBoardNote');
    select?.addEventListener('change', () => {
      const p = ensureProfile(); if (input) input.value = p?.boardNotes?.[select.value] || '';
    });
    document.getElementById('railphotoSaveBoardNote')?.addEventListener('click', () => {
      const p = ensureProfile(); const num = (select?.value || '').trim(); const note = (input?.value || '').trim();
      if (!num) { alert('Выберите номер поезда.'); return; }
      if (note) p.boardNotes[num] = note; else delete p.boardNotes[num];
      saveState(); renderBoardNotes();
    });
    page.querySelectorAll('#railphotoBoardNotePanel [data-note]').forEach(btn => btn.addEventListener('click', () => { if (input) input.value = btn.dataset.note || ''; input?.focus(); }));
  }

  function renderBoardNotes() {
    if (rendering) return;
    const page = boardPage(); const p = ensureProfile();
    if (!page || !p) return;
    rendering = true;
    try {
      page.querySelectorAll('[data-railphoto-board-note]').forEach(x => x.remove());
      const notes = p.boardNotes || {};
      Object.entries(notes).forEach(([num,note]) => {
        const text = String(note || '').trim(); if (!text) return;
        const escaped = num.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const candidates = [...page.querySelectorAll('tr,[class*="row"],[class*="item"],[class*="train"]')].filter(el => !el.closest('#railphotoBoardNotePanel') && new RegExp(`(?:^|\\D)${escaped}(?:\\D|$)`).test(el.textContent || ''));
        const host = candidates.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];
        if (host) { const badge=document.createElement('span'); badge.className='railphoto-board-note-badge'; badge.dataset.railphotoBoardNote=num; badge.textContent=`📝 ${text}`; host.appendChild(badge); }
      });
    } finally { rendering = false; }
  }

  const QUESTION_GROUPS = {
    DSP: [
      {q:'Какова основная задача ДСП на станции?',a:['Обеспечение безопасного и организованного движения поездов и маневров в пределах станции','Продажа билетов','Ремонт локомотивов','Только информирование пассажиров'],c:0},
      {q:'Что необходимо проверить перед приёмом или отправлением поезда?',a:['Только номер поезда','Готовность маршрута, сигналы и необходимые условия для безопасного выполнения операции','Только погоду','Только наличие пассажиров'],c:1},
      {q:'Что делать при противоречивой информации о движении поезда?',a:['Игнорировать','Уточнить информацию по установленному каналу связи и действовать по регламенту','Самостоятельно отменить поезд','Удалить запись'],c:1},
      {q:'Для чего ДСП использует поездную и оперативную связь?',a:['Для безопасной координации действий работников и передачи служебной информации','Для личных разговоров','Для рекламы','Для развлечений'],c:0},
      {q:'Как действовать при обнаружении обстоятельства, угрожающего безопасности движения?',a:['Скрыть информацию','Немедленно сообщить ответственным работникам и действовать по установленному регламенту','Продолжить работу без изменений','Изменить данные задним числом'],c:1}
    ],
    MACHINIST: [
      {q:'Какое значение обычно имеет зелёный сигнал светофора?',a:['Движение запрещено','Движение разрешено в установленном направлении','Только маневры','Требуется немедленная остановка'],c:1},
      {q:'Что должен сделать машинист при выявлении неисправности, влияющей на безопасность движения?',a:['Игнорировать','Сообщить о неисправности и действовать по установленному порядку','Ускориться','Скрыть неисправность'],c:1},
      {q:'Для чего машинисту нужна информация о маршруте и ограничениях скорости?',a:['Для безопасного ведения поезда','Только для заполнения отчёта','Для расчёта стоимости билета','Только для табло'],c:0},
      {q:'Что важно сделать перед отправлением поезда после стоянки?',a:['Проверить готовность к отправлению и действовать по установленной процедуре','Сразу увеличить скорость','Игнорировать сигналы','Выключить радиосвязь'],c:0},
      {q:'Что делать при получении оперативного сообщения об изменении условий движения?',a:['Игнорировать сообщение','Принять информацию к исполнению и действовать в соответствии с переданными указаниями и регламентом','Удалить сообщение','Продолжить без изменений'],c:1}
    ]
  };

  function makeSection(prefix,title,questions) {
    const section=document.createElement('div'); section.className='railphoto-attestation-section'; section.dataset.group=prefix;
    section.innerHTML=`<h4 style="margin:8px 0;color:var(--bp-text)">${esc(title)}</h4><p style="color:var(--bp-text-muted);margin-bottom:8px">5 вопросов.</p>`;
    questions.forEach((x,i)=>{
      const q=document.createElement('div'); q.className='railphoto-extra-question';
      q.innerHTML=`<b>${i+1}. ${esc(x.q)}</b>`+x.a.map((a,j)=>`<label><input type="radio" name="${prefix}_q${i}" value="${j}"> ${esc(a)}</label>`).join(''); section.appendChild(q);
    });
    const check=document.createElement('button'); check.type='button'; check.className='btn-primary'; check.textContent='✅ Проверить раздел';
    const result=document.createElement('div'); result.className='railphoto-extra-result'; result.style.display='none';
    check.onclick=()=>{let score=0,answered=0;questions.forEach((x,i)=>{const v=section.querySelector(`input[name="${prefix}_q${i}"]:checked`);if(v){answered++;if(Number(v.value)===x.c)score++;}});result.style.display='block';result.textContent=`Результат: ${score} из ${questions.length}. Отвечено: ${answered} из ${questions.length}.`;};
    section.appendChild(check); section.appendChild(result); return section;
  }

  function attestationPage(){
    return document.getElementById('pageAttestation') || document.getElementById('pageCertification') || [...document.querySelectorAll('[id^="page"]')].find(el=>/аттестаци/i.test(el.textContent||'')) || null;
  }

  function injectAttestation(){
    const page=attestationPage(); if(!page || page.querySelector('#railphotoAttestationExtra')) return;
    const wrap=document.createElement('section'); wrap.id='railphotoAttestationExtra'; wrap.className='railphoto-extra-test';
    wrap.innerHTML='<h3>🚆 Аттестация — дополнительные вопросы</h3><p style="color:var(--bp-text-muted);margin-bottom:8px">10 вопросов: отдельные подгруппы для ДСП и машиниста.</p>';
    const tabs=document.createElement('div'); tabs.className='railphoto-attestation-tabs';
    const sections={};
    [['DSP','ДСП'],['MACHINIST','Машинист']].forEach(([key,label],i)=>{
      const tab=document.createElement('button'); tab.type='button'; tab.className='railphoto-attestation-tab'+(i===0?' active':''); tab.textContent=label;
      const section=makeSection('rp_'+key,label,QUESTION_GROUPS[key]); sections[key]=section;
      tab.onclick=()=>{Object.keys(sections).forEach(k=>sections[k].classList.toggle('active',k===key));tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));tab.classList.add('active');};
      tabs.appendChild(tab); wrap.appendChild(tab); tab.replaceWith(tab); // keep only one DOM copy
      tabs.appendChild(tab);
    });
    // Rebuild tab container safely after event setup.
    tabs.innerHTML='';
    [['DSP','ДСП'],['MACHINIST','Машинист']].forEach(([key,label],i)=>{
      const tab=document.createElement('button'); tab.type='button'; tab.className='railphoto-attestation-tab'+(i===0?' active':''); tab.textContent=label;
      tab.onclick=()=>{Object.keys(sections).forEach(k=>sections[k].classList.toggle('active',k===key));tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===tab));};
      tabs.appendChild(tab);
    });
    wrap.insertBefore(tabs,wrap.children[1]); wrap.appendChild(sections.DSP); wrap.appendChild(sections.MACHINIST); sections.DSP.classList.add('active');
    page.appendChild(wrap);
  }

  function refresh(){
    if(refreshTimer) return;
    refreshTimer=setTimeout(()=>{refreshTimer=null; injectBoardNotePanel(); populateNoteTrains(); renderBoardNotes(); injectAttestation();},120);
  }

  function init(){
    installStyles(); refresh();
    if(observerStarted) return;
    observerStarted=true;
    const observer=new MutationObserver(()=>refresh());
    observer.observe(document.body,{childList:true,subtree:true});
  }

  ready(init);
})();
