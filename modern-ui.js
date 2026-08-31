/*
 * Максиградская железная дорога — ЗАФИКСИРОВАННОЕ СОВРЕМЕННОЕ ОФОРМЛЕНИЕ.
 * Этот файл отвечает только за внешний вид. Функциональные изменения не должны
 * заменять его стили. Современный дизайн является постоянной базой интерфейса.
 */
(function(){'use strict';if(window.__maxigradModernUI)return;window.__maxigradModernUI=true;
function install(){if(document.getElementById('maxigrad-modern-ui'))return;var s=document.createElement('style');s.id='maxigrad-modern-ui';s.textContent=`
:root{--ui-bg:#f4f7fb;--ui-card:#fff;--ui-border:#e5eaf1;--ui-text:#172033;--ui-muted:#6b7280;--ui-primary:#2563eb;--ui-primary-soft:#eff6ff;--ui-shadow:0 8px 28px rgba(15,23,42,.07)}
html[data-ui-locked="modern"] body{font-family:Inter,Segoe UI,Arial,sans-serif!important;background:var(--ui-bg)!important;color:var(--ui-text)!important;font-size:13px!important}
html[data-ui-locked="modern"] header{background:rgba(255,255,255,.94)!important;color:var(--ui-text)!important;border-bottom:1px solid var(--ui-border)!important;box-shadow:0 2px 14px rgba(15,23,42,.05)!important;position:sticky!important;top:0;z-index:900}
html[data-ui-locked="modern"] .logo-box{background:var(--ui-primary)!important;border-radius:10px!important}
html[data-ui-locked="modern"] .header-controls{gap:6px!important}
html[data-ui-locked="modern"] .nav-tab-btn,html[data-ui-locked="modern"] .theme-toggle-btn{color:var(--ui-muted)!important;background:transparent!important;border:1px solid transparent!important;border-radius:9px!important;padding:8px 11px!important}
html[data-ui-locked="modern"] .nav-tab-btn:hover,html[data-ui-locked="modern"] .theme-toggle-btn:hover{background:#f1f5f9!important;color:var(--ui-text)!important}
html[data-ui-locked="modern"] .nav-tab-btn.active{background:var(--ui-primary)!important;color:#fff!important;border-color:var(--ui-primary)!important;box-shadow:none!important}
html[data-ui-locked="modern"] .main-wrapper{max-width:1500px!important;margin:0 auto!important;padding:22px 24px 34px!important}
html[data-ui-locked="modern"] .page-header{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:14px!important;padding:16px 18px!important;box-shadow:var(--ui-shadow)!important}
html[data-ui-locked="modern"] .profile-card,html[data-ui-locked="modern"] .pinned-section,html[data-ui-locked="modern"] .schedule-box,html[data-ui-locked="modern"] .analytics-card,html[data-ui-locked="modern"] .table-container,html[data-ui-locked="modern"] .calc-panel,html[data-ui-locked="modern"] .trip-form-panel,html[data-ui-locked="modern"] .builder-source,html[data-ui-locked="modern"] .consist-area,html[data-ui-locked="modern"] .test-card,html[data-ui-locked="modern"] .metro-card{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:14px!important;box-shadow:var(--ui-shadow)!important}
html[data-ui-locked="modern"] .stat-card{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:12px!important;box-shadow:var(--ui-shadow)!important}
html[data-ui-locked="modern"] input,html[data-ui-locked="modern"] select,html[data-ui-locked="modern"] textarea{border-radius:9px!important;border-color:var(--ui-border)!important;min-height:36px!important;background:#fff!important;color:var(--ui-text)!important}
html[data-ui-locked="modern"] button{border-radius:9px!important}
html[data-ui-locked="modern"] .btn-primary{background:var(--ui-primary)!important;color:#fff!important;border-color:var(--ui-primary)!important}
html[data-ui-locked="modern"] .btn-secondary{background:#f1f5f9!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}
html[data-ui-locked="modern"] .btn-danger{background:#b91c1c!important;color:#fff!important}
html[data-ui-locked="modern"] .btn-success{background:#15803d!important;color:#fff!important}
html[data-ui-locked="modern"] .btn-gold{background:#d97706!important;color:#fff!important}
html[data-ui-locked="modern"] .filter-panel,html[data-ui-locked="modern"] .batch-toolbar{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:12px!important}
html[data-ui-locked="modern"] .category-tabs{gap:8px!important}
html[data-ui-locked="modern"] .cat-tab{background:var(--ui-card)!important;color:var(--ui-text)!important;border:1px solid var(--ui-border)!important;border-radius:9px!important}
html[data-ui-locked="modern"] .cat-tab.active{background:var(--ui-primary)!important;color:#fff!important;border-color:var(--ui-primary)!important}
html[data-ui-locked="modern"] table.bp-table{border-radius:10px;overflow:hidden}html[data-ui-locked="modern"] table.bp-table th{background:#f8fafc!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}html[data-ui-locked="modern"] table.bp-table td{border-color:var(--ui-border)!important;background:var(--ui-card)!important;color:var(--ui-text)!important}
html[data-ui-locked="modern"] .profile-avatar{box-shadow:0 4px 14px rgba(37,99,235,.16)!important}
html[data-ui-locked="modern"] .board-container{border-radius:14px!important;box-shadow:0 0 24px rgba(255,183,3,.15)!important}
html[data-ui-locked="modern"] .modal-card{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:14px!important;box-shadow:0 18px 50px rgba(15,23,42,.18)!important;color:var(--ui-text)!important}
html[data-ui-locked="modern"] .metro-layout{display:grid;grid-template-columns:minmax(280px,360px) 1fr;gap:16px;align-items:start}
html[data-ui-locked="modern"] .metro-line-item{background:#fff!important;color:var(--ui-text)!important;border:1px solid var(--ui-border)!important;border-radius:10px!important}
html[data-ui-locked="modern"] .metro-line-item.active{border-color:var(--ui-primary)!important;background:var(--ui-primary-soft)!important}
html[data-ui-locked="modern"] .metro-kpi{padding:12px;background:#f8fafc!important;color:var(--ui-text)!important;border:1px solid var(--ui-border)!important;border-radius:10px!important}
html[data-ui-locked="modern"] .metro-badge{background:#f1f5f9!important;color:var(--ui-text)!important;border:1px solid var(--ui-border)!important}
html[data-ui-locked="modern"] .metro-empty{padding:28px;text-align:center;color:var(--ui-muted)!important;border:1px dashed var(--ui-border)!important;border-radius:12px!important}
html[data-ui-locked="modern"] .metro-table{background:#fff!important;color:var(--ui-text)!important}html[data-ui-locked="modern"] .metro-table th{background:#f8fafc!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}html[data-ui-locked="modern"] .metro-table td{background:#fff!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}
html[data-ui-locked="modern"] .rpm-card,html[data-ui-locked="modern"] .rpm-line{background:var(--ui-card)!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important;border-radius:12px!important;box-shadow:var(--ui-shadow)!important}
html[data-ui-locked="modern"] .rpm-table th{background:#f8fafc!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}html[data-ui-locked="modern"] .rpm-table td{background:#fff!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}
html[data-ui-locked="modern"] .rpm-modal-card{background:var(--ui-card)!important;color:var(--ui-text)!important;border:1px solid var(--ui-border)!important;border-radius:14px!important;box-shadow:0 18px 50px rgba(15,23,42,.18)!important}
html[data-ui-locked="modern"] .rms-stat,html[data-ui-locked="modern"] .rms-line{background:#f8fafc!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important;border-radius:10px!important}
html[data-ui-locked="modern"] .rms-pill{background:#fff!important;color:var(--ui-text)!important;border-color:var(--ui-border)!important}
@media(max-width:900px){html[data-ui-locked="modern"] .profile-grid,html[data-ui-locked="modern"] .builder-layout,html[data-ui-locked="modern"] .metro-layout{grid-template-columns:1fr!important}html[data-ui-locked="modern"] .form-grid{grid-template-columns:1fr!important}html[data-ui-locked="modern"] .header-controls{overflow:auto!important}.header-controls{flex-wrap:wrap!important}html[data-ui-locked="modern"] .main-wrapper{padding:15px 12px 28px!important}}
body:not(.light-theme){--ui-bg:#0f172a;--ui-card:#111827;--ui-border:#263244;--ui-text:#e5e7eb;--ui-muted:#94a3b8;--ui-primary-soft:#172554}
body:not(.light-theme) .metro-line-item,body:not(.light-theme) .metro-kpi{background:#0f172a!important;color:var(--ui-text)!important}
body:not(.light-theme) table.bp-table th{background:#182235!important;color:var(--ui-text)!important}
`;
document.head.appendChild(s);document.documentElement.setAttribute('data-ui-locked','modern');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();