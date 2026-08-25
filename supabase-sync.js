/* Supabase cloud synchronization for uzdphoto */
(function () {
  const URL = 'https://ubhfigqpsepnpokrbdyo.supabase.co';
  const KEY = 'sb_publishable_yN8W8pvQq8hWsYMO8z1Rzw_6zKQ-8D1';
  let sb, user, timer, channel, originalSave;

  function status(t) {
    let el = document.getElementById('cloudSyncStatus');
    if (!el) {
      el = document.createElement('span'); el.id = 'cloudSyncStatus';
      el.style.cssText = 'font-size:10px;color:var(--bp-text-muted);margin-left:8px;';
      const theme = document.querySelector('.theme-toggle-btn');
      if (theme && theme.parentNode) theme.parentNode.insertBefore(el, theme.nextSibling);
    }
    el.textContent = t;
  }
  function authBox(message='') {
    let box = document.getElementById('cloudAuthOverlay');
    if (!box) {
      box=document.createElement('div'); box.id='cloudAuthOverlay';
      box.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(8,12,16,.96);';
      box.innerHTML=`<div style="width:min(420px,calc(100vw - 28px));background:var(--bp-card-bg);border:1px solid var(--bp-border);border-radius:8px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.45)">
        <h2 style="margin:0 0 8px;font-size:18px;color:var(--bp-text)">☁️ Облачная синхронизация</h2>
        <p style="color:var(--bp-text-muted);font-size:12px;line-height:1.5">Войди в один и тот же аккаунт на телефоне и ПК. База ПС, профиль, памятки и расписания будут общими.</p>
        <input id="cloudEmail" type="email" placeholder="Email" autocomplete="email" style="width:100%;box-sizing:border-box;padding:10px;margin:0 0 9px;background:var(--bp-input-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:4px">
        <input id="cloudPassword" type="password" placeholder="Пароль" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:10px;margin:0 0 9px;background:var(--bp-input-bg);color:var(--bp-text);border:1px solid var(--bp-border);border-radius:4px">
        <div style="display:flex;gap:8px"><button class="btn-primary" id="cloudLogin" style="flex:1">Войти</button><button class="btn-secondary" id="cloudSignup" style="flex:1">Создать аккаунт</button></div>
        <div id="cloudAuthMessage" style="min-height:18px;margin-top:10px;font-size:11px;color:var(--bp-text-muted)"></div></div>`;
      document.body.appendChild(box); document.getElementById('cloudLogin').onclick=login; document.getElementById('cloudSignup').onclick=signup;
    }
    box.style.display='flex'; if(message)document.getElementById('cloudAuthMessage').textContent=message;
  }
  function hideAuth(){const x=document.getElementById('cloudAuthOverlay');if(x)x.style.display='none';}
  function msg(t){const x=document.getElementById('cloudAuthMessage');if(x)x.textContent=t;}
  async function login(){const email=cloudEmail.value.trim(),password=cloudPassword.value;if(!email||!password)return msg('Введите email и пароль.');const r=await sb.auth.signInWithPassword({email,password});if(r.error)msg('Ошибка входа: '+r.error.message);}
  async function signup(){const email=cloudEmail.value.trim(),password=cloudPassword.value;if(!email||!password)return msg('Введите email и пароль.');if(password.length<6)return msg('Пароль должен содержать минимум 6 символов.');const r=await sb.auth.signUp({email,password});if(r.error)return msg('Ошибка регистрации: '+r.error.message);msg(r.data.session?'Аккаунт создан.':'Аккаунт создан. Подтвердите email, затем войдите.');}
  async function rows(table){const r=await sb.from(table).select('id,data').eq('user_id',user.id);if(r.error)throw r.error;return r.data||[];}
  async function saveCloud(){if(!user)return;status('☁️ сохраняю...');try{
    const vr=db.map(data=>({user_id:user.id,id:data.id,data})),nr=pinnedNotes.map(data=>({user_id:user.id,id:data.id,data})),sr=schedules.map(data=>({user_id:user.id,id:data.id,data}));
    const rr=await Promise.all([sb.from('uzd_vehicles').upsert(vr,{onConflict:'user_id,id'}),sb.from('uzd_profiles').upsert({user_id:user.id,id:'main',data:profile},{onConflict:'user_id,id'}),sb.from('uzd_notes').upsert(nr,{onConflict:'user_id,id'}),sb.from('uzd_schedules').upsert(sr,{onConflict:'user_id,id'})]);
    const bad=rr.find(x=>x.error);if(bad)throw bad.error;
    for(const [table,ids] of [['uzd_vehicles',db.map(x=>x.id)],['uzd_notes',pinnedNotes.map(x=>x.id)],['uzd_schedules',schedules.map(x=>x.id)]]){const r=await sb.from(table).select('id').eq('user_id',user.id);if(r.error)throw r.error;const stale=(r.data||[]).map(x=>x.id).filter(id=>!ids.includes(id));if(stale.length){const d=await sb.from(table).delete().eq('user_id',user.id).in('id',stale);if(d.error)throw d.error;}}
    status('☁️ сохранено');
  }catch(e){console.error(e);status('⚠️ ошибка синхронизации');}}
  function queueSave(){clearTimeout(timer);timer=setTimeout(saveCloud,250);}
  async function loadCloud(){const [v,p,n,s]=await Promise.all([rows('uzd_vehicles'),sb.from('uzd_profiles').select('data').eq('user_id',user.id).eq('id','main').maybeSingle(),rows('uzd_notes'),rows('uzd_schedules')]);if(p.error)throw p.error;
    if(!v.length&&!n.length&&!s.length&&!p.data){await saveCloud();return;}
    db=v.map(x=>x.data);if(p.data)profile=p.data.data;pinnedNotes=n.map(x=>x.data);schedules=s.map(x=>x.data);
    localStorage.setItem('rp_db',JSON.stringify(db));localStorage.setItem('rp_profile',JSON.stringify(profile));localStorage.setItem('rp_pinned',JSON.stringify(pinnedNotes));localStorage.setItem('rp_schedules',JSON.stringify(schedules));
    renderTable();renderProfile();renderBuilder();renderScheduleBoard();renderAnalytics();status('☁️ синхронизировано');
  }
  async function refresh(){try{await loadCloud()}catch(e){console.error(e)}}
  function realtime(){if(channel)sb.removeChannel(channel);channel=sb.channel('uzdphoto-sync').on('postgres_changes',{event:'*',schema:'public',table:'uzd_vehicles',filter:`user_id=eq.${user.id}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'uzd_profiles',filter:`user_id=eq.${user.id}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'uzd_notes',filter:`user_id=eq.${user.id}`},refresh).on('postgres_changes',{event:'*',schema:'public',table:'uzd_schedules',filter:`user_id=eq.${user.id}`},refresh).subscribe();}
  async function start(session){user=session&&session.user;if(!user){status('🔐 требуется вход');authBox();return;}hideAuth();status('☁️ загрузка...');try{await loadCloud();if(!originalSave){originalSave=window.saveData;window.saveData=function(){originalSave();queueSave();}}realtime()}catch(e){console.error(e);authBox('Ошибка Supabase: '+e.message);status('⚠️ ошибка Supabase');}}
  function boot(){const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=async()=>{sb=window.supabase.createClient(URL,KEY);const r=await sb.auth.getSession();await start(r.data.session);sb.auth.onAuthStateChange((_e,s)=>start(s));};script.onerror=()=>status('⚠️ не удалось загрузить Supabase');document.head.appendChild(script);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
