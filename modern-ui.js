/* Современный интерфейс на основе предоставленного index(3)(1).html. Только оформление, без удаления старых функций. */
(function(){'use strict';if(window.__maxigradModernUI)return;window.__maxigradModernUI=true;
function install(){if(document.getElementById('maxigrad-modern-ui'))return;var s=document.createElement('style');s.id='maxigrad-modern-ui';s.textContent=`
:root{--ui-bg:#f4f7fb;--ui-card:#fff;--ui-border:#e5eaf1;--ui-text:#172033;--ui-muted:#6b7280;--ui-primary:#2563eb;--ui-primary-soft:#eff6ff;--ui-shadow:0 8px 28px rgba(15,23,42,.07)}
body{font-family:Inter,Segoe UI,Arial,sans-serif!important;background:var(--ui-bg)!important;color:var(--ui-text)!important;font-size:13px!important}
header{background:rgba(255,255,255,.94)!important;color:var(--ui-text)!important;border-bottom:1px solid var(--ui-border)!important;box-shadow:0 2px 14px rgba(15,23,42,.05)!important;position:sticky!important;top:0;z-index:900}
.logo-box{background:var(--ui-primary)!important;border-radius:10px!important}
.header-controls{gap:6px!important}
.nav-tab-btn,.theme-toggle-btn{color:var(--ui-muted)!important;background:transparent!important;border:1px solid transparent!important;border-radius:9px!important;padding:8px 11px!important}
.nav-tab-btn:hover,.theme-toggle-btn:hover{background:#f1f5f9!important;color:var(--ui-text)!important}
.nav-tab-btn.active{background:var(--ui-primary)!important;color:#fff!important;border-color:var(--ui-primary)!important;box-shadow:none!important}
.main-wrapper{max-width:1500px!important;margin:0 auto!important;padding:22px 24px 34px!important}
.page-header{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:14px!important;padding:16px 18px!important;box-shadow:var(--ui-shadow)!important}
.profile-card,.pinned-section,.schedule-box,.analytics-card,.table-container,.calc-panel,.trip-form-panel,.builder-source,.consist-area,.test-card{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:14px!important;box-shadow:var(--ui-shadow)!important}
.stat-card{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:12px!important;box-shadow:var(--ui-shadow)!important}
input,select,textarea{border-radius:9px!important;border-color:var(--ui-border)!important;min-height:36px}
button{border-radius:9px!important}
.btn-primary{background:var(--ui-primary)!important}.filter-panel,.batch-toolbar{background:var(--ui-card)!important;border:1px solid var(--ui-border)!important;border-radius:12px!important}
table.bp-table{border-radius:10px;overflow:hidden}table.bp-table th{background:#f8fafc!important;color:var(--ui-text)!important}table.bp-table td,table.bp-table th{border-color:var(--ui-border)!important}
.profile-avatar{box-shadow:0 4px 14px rgba(37,99,235,.16)!important}
.board-container{border-radius:14px!important;box-shadow:0 0 24px rgba(255,183,3,.15)!important}
.metro-layout{display:grid;grid-template-columns:minmax(280px,360px) 1fr;gap:16px;align-items:start}
.metro-card{background:var(--ui-card);border:1px solid var(--ui-border);border-radius:14px;box-shadow:var(--ui-shadow);padding:18px}
.metro-card h3{margin:0 0 12px;font-size:15px}.metro-line-list{display:grid;gap:9px}
.metro-line-item{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--ui-border);border-radius:10px;cursor:pointer;background:#fff}
.metro-line-item.active{border-color:var(--ui-primary);background:var(--ui-primary-soft)}
.metro-color-dot{width:16px;height:16px;border-radius:50%;flex:0 0 16px;border:2px solid rgba(0,0,0,.08)}
.metro-line-meta{min-width:0;flex:1}.metro-line-name{font-weight:700}.metro-line-number{color:var(--ui-muted);font-size:11px}
.metro-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}.metro-kpi{padding:12px;background:#f8fafc;border:1px solid var(--ui-border);border-radius:10px}.metro-kpi b{display:block;font-size:18px;margin-top:3px}
.metro-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.metro-table-wrap{overflow:auto}.metro-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:#f1f5f9;font-size:11px;font-weight:600}.metro-empty{padding:28px;text-align:center;color:var(--ui-muted);border:1px dashed var(--ui-border);border-radius:12px}
body:not(.light-theme){--ui-bg:#0f172a;--ui-card:#111827;--ui-border:#263244;--ui-text:#e5e7eb;--ui-muted:#94a3b8;--ui-primary-soft:#172554}body:not(.light-theme) header,body:not(.light-theme) .page-header,body:not(.light-theme) .profile-card,body:not(.light-theme) .pinned-section,body:not(.light-theme) .schedule-box,body:not(.light-theme) .analytics-card,body:not(.light-theme) .table-container,body:not(.light-theme) .metro-card,body:not(.light-theme) .stat-card{background:var(--ui-card)!important;color:var(--ui-text)!important}body:not(.light-theme) .metro-line-item,body:not(.light-theme) .metro-kpi{background:#0f172a;color:var(--ui-text)}body:not(.light-theme) table.bp-table th{background:#182235!important}
@media(max-width:900px){.profile-grid,.builder-layout,.metro-layout{grid-template-columns:1fr!important}.form-grid{grid-template-columns:1fr!important}.header-controls{overflow:auto}.main-wrapper{padding:15px 12px 28px!important}}
`;
document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
(function loadRecovery(){const s=document.createElement('script');s.src='metro-data-recovery.js?v=20260831b';(document.head||document.documentElement).appendChild(s)})();
})();