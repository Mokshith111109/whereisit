/* Supabase backend: login, database, private image storage */
const CONFIGURED=!SUPABASE_URL.startsWith('YOUR_');
const sb=(CONFIGURED&&window.supabase)?supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const BK='memory-images';
const _wake=wake,_saveNew=saveNew,_del=del,_edit=edit,_remind=remind,_wipe=wipe;
S.authMode='in';
function toBlob(d){const b=d.split(',')[1],bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:'image/jpeg'})}
async function upImg(d){const path=`${S.uid}/${crypto.randomUUID()}.jpg`;const{error}=await sb.storage.from(BK).upload(path,toBlob(d),{contentType:'image/jpeg'});if(error)throw error;return path}
async function loadRemote(){
 const{data,error}=await sb.from('memories').select('*, sightings(*)').order('updated_at',{ascending:false});
 if(error){toast('Could not load memories: '+error.message);DB=[];return}
 const paths=[...new Set(data.flatMap(m=>[m.image_path,...m.sightings.map(s=>s.image_path)]).filter(Boolean))],map={};
 if(paths.length){const{data:u}=await sb.storage.from(BK).createSignedUrls(paths,3600);(u||[]).forEach(x=>{if(x.signedUrl)map[x.path]=x.signedUrl})}
 DB=data.map(m=>({id:m.id,name:m.object_name,cat:m.category,img:map[m.image_path]||'',path:m.image_path,loc:m.location_name,notes:m.notes||'',created:m.created_at,updated:m.updated_at,remind:m.remind?1:0,
  sightings:m.sightings.sort((a,b)=>new Date(b.recorded_at)-new Date(a.recorded_at)).map(s=>({img:map[s.image_path]||'',path:s.image_path,loc:s.location_name,notes:s.notes||'',at:s.recorded_at}))}))}
function afterAuth(ses){S.uid=ses.user.id;S.email=ses.user.email;wake('user')}
wake=async function(m){if(m!='user')return _wake(m);S.mode='user';await loadRemote();state('idle');S.msgs=[{r:1,t:'Welcome back. Ask me where you left something, or open the menu (top left) to add something new.'}];dock();panel()};
async function logout(){if(S.mode=='user'&&sb){try{await sb.auth.signOut()}catch(e){}}S.mode=null;S.uid=null;S.email=null;S.msgs=[];DB=[];state('idle');dock();panel()}
async function doAuth(){const email=$('#em').value.trim(),password=$('#pw').value,err=$('#autherr'),btn=$('#authbtn');err.textContent='';
 if(!email||password.length<6){err.textContent='Enter your email and a password of at least 6 characters.';return}
 btn.disabled=true;
 try{if(S.authMode=='up'){const{data,error}=await sb.auth.signUp({email,password});if(error)throw error;
   if(data.session)return afterAuth(data.session);err.style.color='#5ee6ff';err.textContent='Account created. Check your email to confirm, then sign in.';S.authMode='in'}
  else{const{data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;return afterAuth(data.session)}}
 catch(e){err.style.color='#ff9aa6';err.textContent=e.message||'Something went wrong. Try again.'}
 btn.disabled=false}
async function resetPw(){const email=$('#em').value.trim(),err=$('#autherr');if(!email){err.textContent='Type your email first.';return}
 const{error}=await sb.auth.resetPasswordForEmail(email);err.style.color=error?'#ff9aa6':'#5ee6ff';err.textContent=error?error.message:'Password reset email sent.'}
window.authHTML=()=>{
 if(!sb)return `<div class="rc"><b>Backend not connected</b><p class="mut">Add your Supabase URL and anon key at the top of the last script in index.html, then reload. You can still try the demo.</p><button class="ghost" onclick="wake('demo')">Try demo account</button></div>`;
 if(S.authMode=='otp'||S.authMode=='otp2'){const two=S.authMode=='otp2';
 return `<div class="rc"><h2 style="margin:0 0 4px;font-size:22px">${two?'Enter your code':'Sign in with a code'}</h2><p class="mut" style="margin:0 0 12px">${two?'We emailed a code to '+esc(S.otpEmail)+'.':'We email you a one-time code. No password needed.'}</p>
${two?'<input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Code from email" aria-label="One-time code" onkeydown="if(event.key==\'Enter\')verifyOtp()">':'<input id="em" type="email" autocomplete="email" placeholder="Email" aria-label="Email" onkeydown="if(event.key==\'Enter\')sendOtp()">'}
<div id="autherr" class="mut" style="color:#ff9aa6;min-height:20px" role="alert"></div>
<button style="width:100%" id="authbtn" onclick="${two?'verifyOtp()':'sendOtp()'}">${two?'Verify and sign in':'Send code'}</button>
<button class="ghost" style="width:100%;margin-top:10px" onclick="S.authMode='in';panel()">Use password instead</button></div>`}
const up=S.authMode=='up';
 return `<div class="rc"><h2 style="margin:0 0 4px;font-size:22px">${up?'Create your account':'Welcome back'}</h2><p class="mut" style="margin:0 0 12px">${up?'Save where you leave things, privately.':'Sign in so I can remember for you.'}</p>
<input id="em" type="email" autocomplete="email" placeholder="Email" aria-label="Email">
<input id="pw" type="password" autocomplete="${up?'new-password':'current-password'}" placeholder="Password (min 6 characters)" aria-label="Password" onfocus="state('sleep')" onblur="state('idle')" onkeydown="if(event.key=='Enter')doAuth()">
<div id="autherr" class="mut" style="color:#ff9aa6;min-height:20px" role="alert"></div>
<button style="width:100%" id="authbtn" onclick="doAuth()">${up?'Create account':'Sign in'}</button>
<div class="row" style="margin-top:10px;justify-content:space-between"><button class="ghost" onclick="S.authMode='${up?'in':'up'}';panel()">${up?'I have an account':'New here? Sign up'}</button>${up?'':'<button class="ghost" onclick="resetPw()">Forgot password</button>'}</div>
${up?'':`<button class="ghost" style="width:100%;margin-top:10px" onclick="S.authMode='otp';panel()">Sign in with email code</button>`}
<button class="ghost" style="width:100%;margin-top:10px" onclick="wake('demo')">Try demo account</button></div>`};
saveNew=async function(){if(S.mode=='demo')return _saveNew();
 const n=$('#nm').value.trim(),l=$('#lc').value.trim();if(!n||!l)return toast('Add an object name and a location.');
 const no=$('#nt').value.trim(),ct=$('#ct').value,d=S.draft;toast('Saving…');
 try{const path=await upImg(d.img);let mid=d.upd;
  if(d.upd){const{error}=await sb.from('memories').update({image_path:path,location_name:l,notes:no,updated_at:new Date().toISOString()}).eq('id',d.upd);if(error)throw error}
  else{const{data,error}=await sb.from('memories').insert({object_name:n,category:ct,image_path:path,location_name:l,notes:no}).select('id').single();if(error)throw error;mid=data.id}
  const{error:e2}=await sb.from('sightings').insert({memory_id:mid,image_path:path,location_name:l,notes:no});if(e2)throw e2;
  await loadRemote();S.draft=null;S.msgs=[{r:1,t:`Got it. I'll remember ${n} at ${l}.`}];panel();toast('Memory saved.');d.upd?openSheet('detail',mid):closeSheet()}
 catch(e){toast('Could not save: '+(e.message||e))}};
const allPaths=m=>[...new Set([m.path,...m.sightings.map(s=>s.path)].filter(Boolean))];
del=async function(id){if(S.mode=='demo')return _del(id);if(!confirm('Delete this memory and its photos?'))return;
 const m=DB.find(x=>x.id==id),ps=allPaths(m),{error}=await sb.from('memories').delete().eq('id',id);if(error)return toast('Could not delete: '+error.message);
 if(ps.length)await sb.storage.from(BK).remove(ps);DB=DB.filter(x=>x.id!=id);openSheet('mem')};
edit=async function(id){if(S.mode=='demo')return _edit(id);const m=DB.find(x=>x.id==id),n=prompt('Object name',m.name);if(n===null)return;const t=prompt('Notes',m.notes);
 const u={object_name:n.trim()||m.name};if(t!==null)u.notes=t;const{error}=await sb.from('memories').update(u).eq('id',id);if(error)return toast('Could not edit: '+error.message);
 m.name=u.object_name;if(t!==null)m.notes=t;sheet()};
remind=async function(id){if(S.mode=='demo')return _remind(id);const m=DB.find(x=>x.id==id),v=!m.remind;const{error}=await sb.from('memories').update({remind:v}).eq('id',id);if(error)return toast(error.message);m.remind=v?1:0;sheet()};
wipe=async function(){if(S.mode=='demo')return _wipe();if(!confirm('Delete ALL your memories and photos? This cannot be undone.'))return;
 const ps=DB.flatMap(allPaths),{error}=await sb.from('memories').delete().eq('user_id',S.uid);if(error)return toast('Could not delete: '+error.message);
 for(let i=0;i<ps.length;i+=100)await sb.storage.from(BK).remove(ps.slice(i,i+100));DB=[];toast('All data deleted.');openSheet('mem')};
(async()=>{state('idle');if(sb){const{data}=await sb.auth.getSession();if(data.session)return afterAuth(data.session)}panel()})();

async function sendOtp(){const email=$('#em').value.trim(),err=$('#autherr'),b=$('#authbtn');err.textContent='';
 if(!email){err.textContent='Type your email first.';return}b.disabled=true;
 const{error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
 if(error){err.style.color='#ff9aa6';err.textContent=error.message;b.disabled=false;return}
 S.otpEmail=email;S.authMode='otp2';panel()}
async function verifyOtp(){const token=$('#otp').value.trim(),err=$('#autherr'),b=$('#authbtn');err.textContent='';
 if(token.length<6){err.textContent='Enter the code from your email.';return}b.disabled=true;
 const{data,error}=await sb.auth.verifyOtp({email:S.otpEmail,token,type:'email'});
 if(error){err.style.color='#ff9aa6';err.textContent=error.message;b.disabled=false;return}afterAuth(data.session)}