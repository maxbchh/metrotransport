/* Railphoto — editable station-board notes + railway attestation add-ons */
(function () {
  if (window.__railphotoBoardAttestationReady) return;
  window.__railphotoBoardAttestationReady = true;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function ensureProfile() {
    if (typeof profile === 'undefined') return null;
    if (!profile.boardNotes || typeof profile.boardNotes !== 'object') profile.boardNotes = {};
    return profile;
  }

  function saveState() {
    try {
      if (typeof localStorage !== 'undefined' && typeof profile !== 'undefined') {
        localStorage.setItem('rp_profile', JSON.stringify(profile));
      }
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
      .railphoto-extra-test h3{margin-bottom:8px}
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
    if (boardPage()) {
      boardPage().querySelectorAll('tr,[class*="row"],[class*="item"],[class*="train"]').forEach(el => {
        const text = el.textContent || '';
        const m = text.match(/(?:№\s*)?(\d{1,6})\b/);
        if (m) out.push(m[1]);
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
        <button type="button" data-note="Посадка">Посадка</button>
        <button type="button" data-note="Готов">Готов</button>
        <button type="button" data-note="Стоянка">Стоянка</button>
        <button type="button" data-note="Опаздывает">Опаздывает</button>
        <button type="button" data-note="Ожидание посадки">Ожидание посадки</button>
        <button type="button" data-note="Посадка окончена">Посадка окончена</button>
        <button type="button" data-note="Отмена">Отмена</button>
      </div>
      <small style="display:block;margin-top:7px;color:var(--bp-text-muted)">Примечание сохраняется вместе с облачными данными и отображается на табло рядом с номером поезда.</small>
    </div>`;
  }

  function populateNoteTrains() {
    const select = document.getElementById('railphotoBoardTrain');
    if (!select) return;
    const current = select.value;
    const nums = schedulesForNotes();
    select.innerHTML = nums.length ? nums.map(n => `<option value="${esc(n)}">№ ${esc(n)}</option>`).join('') : '<option value="">Введите номер в списании</option>';
    if (current && nums.includes(current)) select.value = current;
    const p = ensureProfile();
    const note = p?.boardNotes?.[select.value] || '';
    const input = document.getElementById('railphotoBoardNote');
    if (input) input.value = note;
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
      const p = ensureProfile();
      if (input) input.value = p?.boardNotes?.[select.value] || '';
    });
    document.getElementById('railphotoSaveBoardNote')?.addEventListener('click', () => {
      const p = ensureProfile();
      const num = (select?.value || '').trim();
      const note = (input?.value || '').trim();
      if (!num) { alert('Выберите номер поезда.'); return; }
      if (note) p.boardNotes[num] = note;
      else delete p.boardNotes[num];
      saveState();
      renderBoardNotes();
      alert(note ? `Примечание к поезду №${num} сохранено.` : `Примечание к поезду №${num} удалено.`);
    });
    document.querySelectorAll('#railphotoBoardNotePanel [data-note]').forEach(btn => {
      btn.addEventListener('click', () => { if (input) input.value = btn.getAttribute('data-note') || ''; input?.focus(); });
    });
  }

  function renderBoardNotes() {
    const page = boardPage();
    const p = ensureProfile();
    if (!page || !p) return;
    page.querySelectorAll('[data-railphoto-board-note]').forEach(x => x.remove());
    const notes = p.boardNotes || {};
    Object.keys(notes).forEach(num => {
      const note = String(notes[num] || '').trim();
      if (!note) return;
      const escaped = num.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      let candidates = [...page.querySelectorAll('tr,[class*="row"],[class*="item"],[class*="train"],div')]
        .filter(el => !el.closest('#railphotoBoardNotePanel') && new RegExp(`(?:^|\\D)${escaped}(?:\\D|$)`).test(el.textContent || ''));
      candidates = candidates.sort((a,b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
      const host = candidates[0];
      if (host) {
        const badge = document.createElement('span');
        badge.className = 'railphoto-board-note-badge';
        badge.dataset.railphotoBoardNote = num;
        badge.textContent = `📝 ${note}`;
        host.appendChild(badge);
      }
    });
  }

  const EXTRA_QUESTIONS = [
    {q:'Какой сигнал на железнодорожном светофоре обычно разрешает движение?',a:['Красный','Жёлтый','Зелёный','Лунно-белый'],c:2},
    {q:'Что необходимо сделать при обнаружении неисправности подвижного состава перед отправлением?',a:['Игнорировать и продолжить работу','Сообщить ответственному работнику и принять меры по установленному порядку','Сразу отправить поезд','Только записать неисправность после рейса'],c:1},
    {q:'Для чего используется номер поезда на станции и табло?',a:['Только для украшения табло','Для идентификации конкретного рейса и его движения','Только для расчёта массы','Только для внутреннего архива'],c:1},
    {q:'Что означает остановка/стоянка поезда на станции?',a:['Поезд обязательно неисправен','Поезд находится на станции установленное время для выполнения необходимых операций','Поезд списан','Поезд выведен из эксплуатации'],c:1},
    {q:'Какое действие правильно при получении информации об опоздании поезда?',a:['Скрыть информацию','Обновить сведения для диспетчерского управления и информирования пассажиров по установленному порядку','Удалить поезд из расписания','Изменить номер локомотива без уведомления'],c:1}
  ];

  function makeQuestionBlock(prefix) {
    const wrap = document.createElement('section');
    wrap.className = 'railphoto-extra-test';
    wrap.dataset.railphotoExtraTest = prefix;
    wrap.innerHTML = `<h3>🚆 Дополнительные вопросы по железной дороге</h3><p style="color:var(--bp-text-muted);margin-bottom:8px">Добавлено 5 вопросов к этому тесту.</p>`;
    EXTRA_QUESTIONS.forEach((x,i) => {
      const q = document.createElement('div');
      q.className = 'railphoto-extra-question';
      q.innerHTML = `<b>${i+1}. ${esc(x.q)}</b>` + x.a.map((a,j)=>`<label><input type="radio" name="${prefix}_q${i}" value="${j}"> ${esc(a)}</label>`).join('');
      wrap.appendChild(q);
    });
    const actions = document.createElement('div');
    actions.className='action-buttons';
    const check=document.createElement('button');check.className='btn-primary';check.type='button';check.textContent='✅ Проверить дополнительные вопросы';
    const result=document.createElement('div');result.className='railphoto-extra-result';result.style.display='none';
    check.onclick=()=>{
      let score=0, answered=0;
      EXTRA_QUESTIONS.forEach((x,i)=>{const v=wrap.querySelector(`input[name="${prefix}_q${i}"]:checked`);if(v){answered++;if(Number(v.value)===x.c)score++;}});
      result.style.display='block';
      result.textContent=`Результат: ${score} из ${EXTRA_QUESTIONS.length}. Отвечено: ${answered} из ${EXTRA_QUESTIONS.length}.`;
    };
    actions.appendChild(check);wrap.appendChild(actions);wrap.appendChild(result);
    return wrap;
  }

  function attestationPage() {
    return document.getElementById('pageAttestation') || document.getElementById('pageCertification') ||
      [...document.querySelectorAll('[id^="page"]')].find(el => /аттестаци/i.test(el.textContent || '')) || null;
  }

  function injectAttestationExtras() {
    const page = attestationPage();
    if (!page) return;
    let targets = [...page.querySelectorAll('form,.test-card,.quiz-card,.test-panel,.attestation-test')];
    targets = targets.filter(el => !el.closest('.railphoto-extra-test'));
    if (!targets.length) targets = [page];
    targets.forEach((target,i)=>{
      if (target.querySelector('.railphoto-extra-test')) return;
      target.appendChild(makeQuestionBlock(`rpAtt_${i}`));
    });
  }

  function init() {
    installStyles();
    injectBoardNotePanel();
    populateNoteTrains();
    renderBoardNotes();
    injectAttestationExtras();
    const observer = new MutationObserver(() => {
      injectBoardNotePanel();
      populateNoteTrains();
      renderBoardNotes();
      injectAttestationExtras();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(()=>{
      injectBoardNotePanel();
      populateNoteTrains();
      renderBoardNotes();
      injectAttestationExtras();
    },1500);
  }

  ready(init);
})();
