/* Railphoto — consist quantities and in-service tracking */
(function () {
  if (window.__railphotoFeaturesReady) return;
  window.__railphotoFeaturesReady = true;

  function waitForApp() {
    if (typeof db === 'undefined' || typeof selectedConsist === 'undefined') {
      setTimeout(waitForApp, 250);
      return;
    }
    init();
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function installStyles() {
    if (document.getElementById('railphoto-consist-features-style')) return;
    const style = document.createElement('style');
    style.id = 'railphoto-consist-features-style';
    style.textContent = `
      .railphoto-in-service-row { outline: 2px dashed #f59e0b !important; outline-offset: -2px; }
      .railphoto-service-badge { display:inline-block; margin:3px 0 0; padding:2px 6px; border-radius:3px; background:#7c2d12; color:#fff; font-size:9px; font-weight:bold; }
      .railphoto-qty-badge { display:inline-block; margin-left:5px; padding:1px 5px; border:1px solid var(--bp-border); border-radius:3px; font-size:9px; font-weight:bold; }
      .railphoto-feature-panel { background:var(--bp-card-bg); border:1px solid var(--bp-border); border-radius:4px; padding:10px; margin-top:10px; }
    `;
    document.head.appendChild(style);
  }

  function ensureDataFields() {
    let changed = false;
    db.forEach(item => {
      if (!Number.isFinite(Number(item.compositionCount)) || Number(item.compositionCount) < 1) {
        item.compositionCount = 1;
        changed = true;
      }
      if (!Object.prototype.hasOwnProperty.call(item, 'inService')) {
        item.inService = null;
        changed = true;
      }
    });
    if (changed && typeof saveData === 'function') saveData();
  }

  function addDatabaseColumn() {
    const table = document.querySelector('#pageDatabase table.bp-table');
    if (!table) return;
    const head = table.querySelector('thead tr');
    const bodyRows = table.querySelectorAll('tbody tr');
    if (!head || !bodyRows.length) return;
    if (head.querySelector('.railphoto-qty-head')) return;

    const th = document.createElement('th');
    th.className = 'railphoto-qty-head';
    th.textContent = 'Кол-во вагонов / секций';
    const actionTh = head.lastElementChild;
    head.insertBefore(th, actionTh);

    bodyRows.forEach((tr, idx) => {
      const seriesCell = tr.children[1];
      const series = seriesCell ? seriesCell.textContent.trim() : '';
      const item = db.find(x => x.series === series);
      const td = document.createElement('td');
      const qty = Number(item?.compositionCount) || 1;
      const service = item?.inService;
      td.innerHTML = `<b>${qty}</b>${service ? `<br><span class="railphoto-service-badge">В рейсе №${esc(service.trainNum)}${service.from || service.to ? ` · ${esc(service.from || '')} → ${esc(service.to || '')}` : ''}</span>` : ''}`;
      tr.insertBefore(td, tr.lastElementChild);
      if (service) tr.classList.add('railphoto-in-service-row');
    });
  }

  function patchDatabaseRefresh() {
    if (window.__railphotoRenderTablePatched) return;
    const original = window.renderTable;
    if (typeof original !== 'function') return;
    window.renderTable = function () {
      original.apply(this, arguments);
      setTimeout(addDatabaseColumn, 0);
    };
    window.__railphotoRenderTablePatched = true;
    setTimeout(addDatabaseColumn, 50);
  }

  function addQuantityFieldToVehicleForm() {
    const form = document.getElementById('vehicleForm');
    const notes = document.getElementById('formNotes');
    if (!form || !notes || document.getElementById('formCompositionCount')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <label>Количество вагонов / секций:</label>
      <input type="number" min="1" step="1" id="formCompositionCount" value="1" placeholder="1">
    `;
    const field = wrap.firstElementChild;
    const grid = notes.closest('.form-grid') || form.querySelector('.form-grid');
    const full = notes.closest('.form-full');
    if (grid && full) grid.insertBefore(field, full);
  }

  function patchVehicleModal() {
    addQuantityFieldToVehicleForm();
    if (window.__railphotoVehicleModalPatched) return;
    if (typeof window.openEditModal === 'function') {
      const originalOpen = window.openEditModal;
      window.openEditModal = function (id) {
        originalOpen.apply(this, arguments);
        const item = db.find(x => x.id === id);
        const input = document.getElementById('formCompositionCount');
        if (input) input.value = Number(item?.compositionCount) || 1;
      };
    }
    if (typeof window.openAddModal === 'function') {
      const originalAdd = window.openAddModal;
      window.openAddModal = function () {
        originalAdd.apply(this, arguments);
        setTimeout(() => {
          const input = document.getElementById('formCompositionCount');
          if (input) input.value = 1;
        }, 0);
      };
    }
    if (typeof window.saveVehicleForm === 'function') {
      const originalSave = window.saveVehicleForm;
      window.saveVehicleForm = function (e) {
        const idBefore = document.getElementById('formVehicleId')?.value || '';
        const seriesBefore = document.getElementById('formSeries')?.value || '';
        originalSave.apply(this, arguments);
        const item = idBefore ? db.find(x => x.id === idBefore) : db.find(x => x.series === seriesBefore);
        const qty = Math.max(1, parseInt(document.getElementById('formCompositionCount')?.value || '1', 10) || 1);
        if (item) {
          item.compositionCount = qty;
          if (!item.inService) item.inService = null;
          if (typeof saveData === 'function') saveData();
          if (typeof renderTable === 'function') renderTable();
        }
      };
    }
    window.__railphotoVehicleModalPatched = true;
  }

  function promptQuantity(item) {
    const isCounted = item.category === 'mvps' || item.category === 'pass_car';
    if (!isCounted) return 1;
    const existing = Number(item.compositionCount) || 1;
    const label = item.category === 'mvps' ? 'секций/вагонов МВПС' : 'пассажирских вагонов';
    const raw = prompt(`Сколько ${label} указать для «${item.series}» в составе?`, String(existing));
    if (raw === null) return null;
    const qty = parseInt(raw, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      alert('Количество должно быть целым числом не меньше 1.');
      return null;
    }
    return qty;
  }

  function patchBuilder() {
    if (window.__railphotoBuilderPatched) return;

    if (typeof window.addToConsist === 'function') {
      window.addToConsist = function (id) {
        const item = db.find(x => x.id === id);
        if (!item) return;
        if (item.inService) {
          if (!confirm(`ПС ${item.series} уже находится в рейсе №${item.inService.trainNum}. Всё равно добавить его в новый состав?`)) return;
        }
        const qty = promptQuantity(item);
        if (qty === null) return;
        const copy = { ...item };
        copy._compositionCount = qty;
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
            const q = Number(item._compositionCount) || 1;
            const service = item.inService;
            return `<div class="consist-card"><span>${idx === 0 ? '🚂' : '🚃'} <b>${esc(item.series)}</b> <span class="railphoto-qty-badge">× ${q}</span>${service ? `<br><small class="railphoto-service-badge">В рейсе №${esc(service.trainNum)}</small>` : ''}</span><button style="background:none;border:none;color:var(--bp-btn-danger);cursor:pointer;font-weight:bold;" onclick="removeFromConsist(${idx})">❌</button></div>`;
          }).join('');
        }
        let weight = 0, length = 0, brakes = 0;
        selectedConsist.forEach(x => { weight += Number(x.weight) || 0; length += Number(x.length) || 0; brakes += Number(x.brake) || 0; });
        const mc = document.getElementById('metricCount');
        const mw = document.getElementById('metricWeight');
        const ml = document.getElementById('metricLength');
        const mb = document.getElementById('metricBrakes');
        if (mc) mc.innerText = selectedConsist.reduce((sum, x) => sum + (Number(x._compositionCount) || 1), 0);
        if (mw) mw.innerText = weight.toFixed(1);
        if (ml) ml.innerText = length.toFixed(1);
        if (mb) mb.innerText = brakes.toFixed(1);
      };
    }

    const header = document.querySelector('#pageBuilder .page-header .action-buttons');
    if (header && !document.getElementById('railphotoDispatchBtn')) {
      const btn = document.createElement('button');
      btn.id = 'railphotoDispatchBtn';
      btn.type = 'button';
      btn.className = 'btn-gold';
      btn.textContent = '🚆 Выпустить в рейс';
      btn.onclick = dispatchConsistToTrip;
      header.insertBefore(btn, header.firstChild);
      const off = document.createElement('button');
      off.id = 'railphotoReleaseBtn';
      off.type = 'button';
      off.className = 'btn-secondary';
      off.textContent = '↩️ Снять с рейса';
      off.onclick = releaseSelectedFromTrip;
      header.insertBefore(off, btn.nextSibling);
    }
  }

  function refreshBuilderSourceBadges() {
    const list = document.getElementById('builderSourceList');
    if (!list) return;
    list.querySelectorAll('.builder-source-item').forEach(div => {
      const text = div.querySelector('b');
      if (!text) return;
      const item = db.find(x => x.series === text.textContent.trim());
      if (!item || !item.inService) return;
      if (div.querySelector('.railphoto-service-badge')) return;
      const target = div.firstElementChild;
      const badge = document.createElement('div');
      badge.className = 'railphoto-service-badge';
      badge.textContent = `В рейсе №${item.inService.trainNum}`;
      target.appendChild(badge);
    });
  }

  function dispatchConsistToTrip() {
    if (!selectedConsist.length) {
      alert('Сначала сформируйте состав из ПС.');
      return;
    }
    const trainNum = (document.getElementById('tripNum')?.value || '').trim();
    const from = document.getElementById('tripFromStation')?.value || '';
    const to = document.getElementById('tripToStation')?.value || '';
    const depTime = document.getElementById('tripStartTime')?.value || '';
    if (!trainNum) {
      alert('Укажите номер поезда.');
      return;
    }
    const service = {
      trainNum,
      from,
      to,
      depTime,
      startedAt: new Date().toISOString()
    };
    const ids = [...new Set(selectedConsist.map(x => x.id))];
    db.forEach(item => {
      if (ids.includes(item.id)) item.inService = service;
    });
    if (typeof saveData === 'function') saveData();
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderBuilder === 'function') renderBuilder();
    refreshBuilderSourceBadges();
    alert(`Состав выпущен в рейс №${trainNum}. ПС помечен в базе как «В рейсе».`);
  }

  function releaseSelectedFromTrip() {
    if (!selectedConsist.length) {
      alert('Состав не выбран.');
      return;
    }
    const ids = [...new Set(selectedConsist.map(x => x.id))];
    db.forEach(item => {
      if (ids.includes(item.id)) item.inService = null;
    });
    if (typeof saveData === 'function') saveData();
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderBuilder === 'function') renderBuilder();
    refreshBuilderSourceBadges();
  }

  function init() {
    installStyles();
    ensureDataFields();
    patchDatabaseRefresh();
    patchVehicleModal();
    patchBuilder();
    addDatabaseColumn();
    refreshBuilderSourceBadges();
    setInterval(() => {
      try {
        addDatabaseColumn();
        refreshBuilderSourceBadges();
      } catch (_) {}
    }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForApp); else waitForApp();
})();
