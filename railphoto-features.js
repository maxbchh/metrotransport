/* Railphoto feature extensions: quantities, active runs, builder controls */
(function () {
  if (window.__railphotoFeaturesReady) return;
  window.__railphotoFeaturesReady = true;

  const wait = (fn, ms = 150) => {
    if (fn()) return;
    setTimeout(() => wait(fn, ms), ms);
  };

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function installStyles() {
    if (document.getElementById('railphoto-features-style')) return;
    const style = document.createElement('style');
    style.id = 'railphoto-features-style';
    style.textContent = `
      .railphoto-in-service-row{outline:2px dashed #f59e0b!important;outline-offset:-2px;animation:railphotoServicePulse 1.8s ease-in-out infinite}
      .railphoto-in-service-row td{box-shadow:inset 0 0 0 9999px rgba(245,158,11,.06)}
      @keyframes railphotoServicePulse{0%,100%{box-shadow:0 0 0 rgba(245,158,11,0)}50%{box-shadow:0 0 14px rgba(245,158,11,.35)}}
      .railphoto-service-badge{display:inline-block;margin-top:4px;padding:3px 7px;border-radius:4px;background:#7c2d12;color:#fff;font-size:9px;font-weight:700;box-shadow:0 0 9px rgba(245,158,11,.45)}
      .railphoto-qty-badge{display:inline-block;margin-left:5px;padding:1px 5px;border:1px solid var(--bp-border);border-radius:3px;font-size:9px;font-weight:700}
      .railphoto-builder-qty{width:58px;padding:5px;border:1px solid var(--bp-border);background:var(--bp-input-bg);color:var(--bp-text);border-radius:3px;font-weight:700;text-align:center}
      .railphoto-builder-qty-wrap{display:inline-flex;align-items:center;gap:5px;margin-right:8px;font-size:10px;color:var(--bp-text-muted)}
      #formCompositionCount{width:100%;box-sizing:border-box}
    `;
    document.head.appendChild(style);
  }

  function ensureDataFields() {
    if (typeof db === 'undefined') return;
    let changed = false;
    db.forEach(item => {
      const qty = Number(item.compositionCount);
      if (!Number.isFinite(qty) || qty < 1) { item.compositionCount = 1; changed = true; }
      if (!Object.prototype.hasOwnProperty.call(item, 'inService')) { item.inService = null; changed = true; }
    });
    if (changed && typeof saveData === 'function') saveData();
  }

  function fixDatabaseColumns() {
    const table = document.querySelector('#pageDatabase table.bp-table');
    if (!table) return;
    const head = table.querySelector('thead tr');
    if (!head) return;

    let actionHead = [...head.children].find(th => /Действия/i.test(th.textContent));
    if (!actionHead) actionHead = head.lastElementChild;
    if (!actionHead) return;

    let qtyHead = head.querySelector('.railphoto-qty-head');
    if (!qtyHead) {
      qtyHead = document.createElement('th');
      qtyHead.className = 'railphoto-qty-head';
      qtyHead.textContent = 'Кол-во вагонов / секций';
    }

    if (qtyHead !== actionHead.previousElementSibling) head.insertBefore(qtyHead, actionHead);
    head.appendChild(actionHead);

    table.querySelectorAll('tbody tr').forEach(tr => {
      const cells = [...tr.children];
      let actionCell = cells.find(td => td.querySelector('button[onclick*="openEditModal"],button[onclick*="deleteVehicle"]'));
      if (!actionCell) actionCell = cells[cells.length - 1];
      if (!actionCell) return;

      const series = cells[1]?.textContent.trim() || '';
      const item = (typeof db !== 'undefined') ? db.find(x => x.series === series) : null;
      const qty = Math.max(1, Number(item?.compositionCount) || 1);

      tr.querySelectorAll('.railphoto-qty-cell').forEach(td => td.remove());
      const qtyCell = document.createElement('td');
      qtyCell.className = 'railphoto-qty-cell';
      qtyCell.style.textAlign = 'center';
      qtyCell.innerHTML = `<b>${qty}</b>`;
      tr.insertBefore(qtyCell, actionCell);

      // Never leave the edit/delete buttons in the quantity column.
      tr.appendChild(actionCell);

      tr.classList.remove('railphoto-in-service-row');
      actionCell.parentNode.querySelectorAll('.railphoto-service-badge').forEach(x => x.remove());
      const service = item?.inService;
      if (service) {
        tr.classList.add('railphoto-in-service-row');
        const statusCell = [...tr.children].find(td => td !== qtyCell && td !== actionCell && /В Эксплуатации|Не эксплуатируется|В Ремонте|В Депо|Порезан|Списан|Музейный|Переформирован|Капитальный Ремонт|Выведен из эксплуатации/.test(td.textContent));
        const host = statusCell || actionCell.previousElementSibling;
        if (host) {
          const badge = document.createElement('div');
          badge.className = 'railphoto-service-badge';
          badge.textContent = `🚆 В РЕЙСЕ №${esc(service.trainNum)}${service.from || service.to ? ` · ${esc(service.from || '')} → ${esc(service.to || '')}` : ''}`;
          host.appendChild(badge);
        }
      }
    });
  }

  function patchDatabaseRender() {
    if (window.__railphotoRenderTablePatched) return;
    if (typeof window.renderTable !== 'function') return;
    const original = window.renderTable;
    window.renderTable = function () {
      original.apply(this, arguments);
      setTimeout(fixDatabaseColumns, 0);
      setTimeout(refreshBuilderSource, 0);
    };
    window.__railphotoRenderTablePatched = true;
    setTimeout(fixDatabaseColumns, 30);
  }

  function ensureQuantityFieldInVehicleModal() {
    const form = document.getElementById('vehicleForm');
    const grid = form?.querySelector('.form-grid');
    if (!form || !grid || document.getElementById('formCompositionCount')) return;

    const field = document.createElement('div');
    field.id = 'railphotoCompositionCountField';
    field.innerHTML = `
      <label for="formCompositionCount">Количество вагонов / секций:</label>
      <input type="number" min="1" step="1" id="formCompositionCount" value="1" placeholder="1">
    `;
    const notes = document.getElementById('formNotes');
    const notesBlock = notes?.closest('.form-full');
    if (notesBlock) grid.insertBefore(field, notesBlock);
    else grid.appendChild(field);
  }

  function patchVehicleModal() {
    ensureQuantityFieldInVehicleModal();
    if (window.__railphotoVehicleModalPatched) return;

    if (typeof window.openEditModal === 'function') {
      const original = window.openEditModal;
      window.openEditModal = function (id) {
        original.apply(this, arguments);
        setTimeout(() => {
          ensureQuantityFieldInVehicleModal();
          const item = db.find(x => x.id === id);
          const input = document.getElementById('formCompositionCount');
          if (input) input.value = Math.max(1, Number(item?.compositionCount) || 1);
        }, 0);
      };
    }

    if (typeof window.openAddModal === 'function') {
      const original = window.openAddModal;
      window.openAddModal = function () {
        original.apply(this, arguments);
        setTimeout(() => {
          ensureQuantityFieldInVehicleModal();
          const input = document.getElementById('formCompositionCount');
          if (input) input.value = 1;
        }, 0);
      };
    }

    if (typeof window.saveVehicleForm === 'function') {
      const original = window.saveVehicleForm;
      window.saveVehicleForm = function (e) {
        const id = document.getElementById('formVehicleId')?.value || '';
        const series = document.getElementById('formSeries')?.value || '';
        const qty = Math.max(1, parseInt(document.getElementById('formCompositionCount')?.value || '1', 10) || 1);
        original.apply(this, arguments);
        const item = id ? db.find(x => x.id === id) : db.find(x => x.series === series);
        if (item) {
          item.compositionCount = qty;
          if (typeof saveData === 'function') saveData();
          if (typeof renderTable === 'function') renderTable();
        }
      };
    }
    window.__railphotoVehicleModalPatched = true;
  }

  function getQtyInputId(item) { return `railphotoQty_${String(item.id).replace(/[^a-zA-Z0-9_-]/g, '_')}`; }

  function refreshBuilderSource() {
    const list = document.getElementById('builderSourceList');
    if (!list || typeof db === 'undefined') return;
    list.querySelectorAll('.builder-source-item').forEach(card => {
      const title = card.querySelector('b');
      const btn = card.querySelector('button');
      if (!title || !btn) return;
      const series = title.textContent.trim();
      const item = db.find(x => x.series === series);
      if (!item) return;

      const counted = item.category === 'mvps' || item.category === 'pass_car';
      const old = card.querySelector('.railphoto-builder-qty-wrap');
      if (old) old.remove();

      const wrap = document.createElement('span');
      wrap.className = 'railphoto-builder-qty-wrap';
      const inputId = getQtyInputId(item);
      wrap.innerHTML = counted
        ? `<span>Ваг./секц.</span><input class="railphoto-builder-qty" id="${inputId}" type="number" min="1" step="1" value="${Math.max(1, Number(item.compositionCount) || 1)}">`
        : `<input class="railphoto-builder-qty" id="${inputId}" type="number" min="1" step="1" value="1" disabled style="opacity:.6" title="Для локомотива количество фиксировано: 1">`;
      btn.parentNode.insertBefore(wrap, btn);

      const service = item.inService;
      card.querySelectorAll('.railphoto-service-badge').forEach(x => x.remove());
      if (service) {
        const badge = document.createElement('div');
        badge.className = 'railphoto-service-badge';
        badge.textContent = `🚆 В РЕЙСЕ №${service.trainNum}`;
        title.closest('div')?.appendChild(badge) || card.appendChild(badge);
      }
    });
  }

  function quantityForBuilderItem(item) {
    if (!item) return 1;
    if (item.category !== 'mvps' && item.category !== 'pass_car') return 1;
    const input = document.getElementById(getQtyInputId(item));
    const qty = Math.max(1, parseInt(input?.value || item.compositionCount || '1', 10) || 1);
    item.compositionCount = qty;
    if (typeof saveData === 'function') saveData();
    return qty;
  }

  function patchBuilder() {
    if (window.__railphotoBuilderPatched) return;
    if (typeof window.addToConsist === 'function') {
      window.addToConsist = function (id) {
        const item = db.find(x => x.id === id);
        if (!item) return;
        if (item.inService && !confirm(`ПС ${item.series} уже находится в рейсе №${item.inService.trainNum}. Всё равно добавить его?`)) return;
        const qty = quantityForBuilderItem(item);
        const copy = { ...item, _compositionCount: qty };
        copy.weight = (Number(item.weight) || 0) * qty;
        copy.length = (Number(item.length) || 0) * qty;
        copy.brake = (Number(item.brake) || 0) * qty;
        selectedConsist.push(copy);
        if (typeof renderConsistTrack === 'function') renderConsistTrack();
      };
    }

    if (typeof window.renderConsistTrack === 'function') {
      window.renderConsistTrack = function () {
        const track = document.getElementById('consistTrack');
        if (!track) return;
        if (!selectedConsist.length) {
          track.innerHTML = '<div style="color:var(--bp-text-muted);font-style:italic;">Состав пуст. Нажмите «+ В поезд» в списке слева.</div>';
        } else {
          track.innerHTML = selectedConsist.map((item, idx) => {
            const q = Math.max(1, Number(item._compositionCount) || 1);
            const service = item.inService;
            return `<div class="consist-card"><span>${idx === 0 ? '🚂' : '🚃'} <b>${esc(item.series)}</b> <span class="railphoto-qty-badge">× ${q}</span>${service ? `<br><small class="railphoto-service-badge">В рейсе №${esc(service.trainNum)}</small>` : ''}</span><button style="background:none;border:none;color:var(--bp-btn-danger);cursor:pointer;font-weight:700" onclick="removeFromConsist(${idx})">❌</button></div>`;
          }).join('');
        }
        let weight = 0, length = 0, brakes = 0;
        selectedConsist.forEach(x => { weight += Number(x.weight) || 0; length += Number(x.length) || 0; brakes += Number(x.brake) || 0; });
        document.getElementById('metricCount')?.innerText = String(selectedConsist.reduce((sum, x) => sum + (Number(x._compositionCount) || 1), 0));
        document.getElementById('metricWeight')?.innerText = weight.toFixed(1);
        document.getElementById('metricLength')?.innerText = length.toFixed(1);
        document.getElementById('metricBrakes')?.innerText = brakes.toFixed(1);
      };
    }

    const header = document.querySelector('#pageBuilder .page-header .action-buttons');
    if (header && !document.getElementById('railphotoDispatchBtn')) {
      const btn = document.createElement('button');
      btn.id = 'railphotoDispatchBtn'; btn.type = 'button'; btn.className = 'btn-gold'; btn.textContent = '🚆 Выпустить в рейс'; btn.onclick = dispatchConsistToTrip;
      header.insertBefore(btn, header.firstChild);
      const off = document.createElement('button');
      off.id = 'railphotoReleaseBtn'; off.type = 'button'; off.className = 'btn-secondary'; off.textContent = '↩️ Снять с рейса'; off.onclick = releaseSelectedFromTrip;
      header.insertBefore(off, btn.nextSibling);
    }
    setTimeout(refreshBuilderSource, 30);
  }

  function refreshBuilderSourceBadgesOnly() {
    const list = document.getElementById('builderSourceList');
    if (!list || typeof db === 'undefined') return;
    list.querySelectorAll('.builder-source-item').forEach(card => {
      const b = card.querySelector('b');
      if (!b) return;
      const item = db.find(x => x.series === b.textContent.trim());
      card.querySelectorAll('.railphoto-service-badge').forEach(x => x.remove());
      if (item?.inService) {
        const badge = document.createElement('div'); badge.className='railphoto-service-badge'; badge.textContent=`🚆 В РЕЙСЕ №${item.inService.trainNum}`; card.appendChild(badge);
      }
    });
  }

  function dispatchConsistToTrip() {
    if (!selectedConsist.length) return alert('Сначала сформируйте состав из ПС.');
    const trainNum = (document.getElementById('tripNum')?.value || '').trim();
    const from = document.getElementById('tripFromStation')?.value || '';
    const to = document.getElementById('tripToStation')?.value || '';
    const depTime = document.getElementById('tripStartTime')?.value || '';
    if (!trainNum) return alert('Укажите номер поезда.');
    const service = { trainNum, from, to, depTime, startedAt: new Date().toISOString() };
    const ids = [...new Set(selectedConsist.map(x => x.id))];
    db.forEach(item => { if (ids.includes(item.id)) item.inService = service; });
    if (typeof saveData === 'function') saveData();
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderBuilder === 'function') renderBuilder();
    refreshBuilderSource();
    alert(`Состав выпущен в рейс №${trainNum}. ПС помечен в базе как «В рейсе».`);
  }

  function releaseSelectedFromTrip() {
    if (!selectedConsist.length) return alert('Состав не выбран.');
    const ids = [...new Set(selectedConsist.map(x => x.id))];
    db.forEach(item => { if (ids.includes(item.id)) item.inService = null; });
    if (typeof saveData === 'function') saveData();
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderBuilder === 'function') renderBuilder();
    refreshBuilderSource();
  }

  function patchBuilderRender() {
    if (window.__railphotoRenderBuilderPatched || typeof window.renderBuilder !== 'function') return;
    const original = window.renderBuilder;
    window.renderBuilder = function () {
      original.apply(this, arguments);
      setTimeout(refreshBuilderSource, 0);
      setTimeout(refreshBuilderSourceBadgesOnly, 50);
    };
    window.__railphotoRenderBuilderPatched = true;
  }

  function init() {
    installStyles();
    ensureDataFields();
    patchDatabaseRender();
    patchVehicleModal();
    patchBuilder();
    patchBuilderRender();
    fixDatabaseColumns();
    refreshBuilderSource();
  }

  const boot = () => wait(() => {
    if (typeof db === 'undefined' || typeof selectedConsist === 'undefined') return false;
    init();
    return true;
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
