/* WhereWasIt? main app: state, search, screens, camera, microphone */
const $=s=>document.querySelector(s),R=$('#robot');
const CATS=['Keys','Wallet','ID Cards','Electronics','Other'];
const SYN={earbuds:'earphones',earphone:'earphones',headphones:'earphones',airpods:'earphones',key:'keys',keychain:'keys',purse:'wallet',id:'college id',card:'college id',phone:'electronics',charger:'electronics',bottle:'water bottle'};
const STOP=new Set('where did i last see my the is a an keep kept put show me photo of when was find what are'.split(' '));
let S={mode:null,msgs:[],sheet:null,sel:null,filter:'All',draft:null,listening:false};
let DB=[],ptr=null,stream,ac,an,rec,heard='';
const KEY=()=>'wwi2_'+S.mode;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const when=i=>{const d=new Date(i);return d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})+', '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
const state=s=>R.dataset.s=s;
function svg(e,c){return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#070b16"/></linearGradient></defs><rect width="400" height="250" fill="url(#g)"/><text x="200" y="150" font-size="100" text-anchor="middle">${e}</text><text x="200" y="238" font-size="14" fill="#fff" text-anchor="middle" opacity=".7">SAMPLE IMAGE</text></svg>`)}
function demo(){const d=n=>new Date(Date.now()-n*36e5).toISOString();
const m=(id,name,cat,e,c,loc,notes,h)=>({id,name,cat,img:svg(e,c),loc,notes,created:d(h+30),updated:d(h),remind:0,sightings:[{img:svg(e,c),loc,notes,at:d(h)}]});
return[m('d1','Keys','Keys','🔑','#2d5bd8','Study table','Next to the lamp',3),m('d2','College ID','ID Cards','🪪','#6b4bd8','Front pocket of backpack','Inside the small zip pocket',20),m('d3','Earphones','Electronics','🎧','#1f7ab8','Bedside drawer','Top drawer, in the case',9),m('d4','Wallet','Wallet','👛','#5a3fb0','Desk organizer','Left slot',27)]}
function load(){try{const r=localStorage.getItem(KEY());DB=r?JSON.parse(r):(S.mode=='demo'?demo():[])}catch(e){DB=S.mode=='demo'?demo():[]}}
function save(){try{localStorage.setItem(KEY(),JSON.stringify(DB));return true}catch(e){toast('Storage is full. Delete a memory or export your data.');return false}}
function toast(t){$('#toastbox').innerHTML=`<div class="toast" role="status">${esc(t)}</div>`;setTimeout(()=>$('#toastbox').innerHTML='',2600)}
function norm(t){return t.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x&&!STOP.has(x)).map(x=>SYN[x]||x).join(' ').split(' ').filter(Boolean)}
function search(q){const tk=norm(q);if(!tk.length)return[];
return DB.map(m=>{const nm=norm(m.name).join(' '),oth=norm(m.notes+' '+m.loc+' '+m.cat).join(' ');let s=0,hit=0;
tk.forEach(t=>{if(nm.includes(t)){s+=3;hit++}else if(oth.includes(t))s+=1});
if(!s)return null;return{m,s:s+1/(1+(Date.now()-new Date(m.updated))/864e5),conf:hit==tk.length?'High':hit?'Medium':'Low'}}).filter(Boolean).sort((a,b)=>b.s-a.s)}
function shrink(file,cb){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,800/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.7))};i.onerror=()=>toast('Could not read that image.');i.src=r.result};r.readAsDataURL(file)}
/* eyes follow touch */
function look(x,y){const b=$('#robot svg').getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height*.43,dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/160);
$('#pu').setAttribute('transform',`translate(${(dx/d*13*k).toFixed(1)},${(dy/d*11*k).toFixed(1)})`)}
['pointermove','pointerdown','touchmove'].forEach(ev=>addEventListener(ev,e=>{const p=e.touches?e.touches[0]:e;look(p.clientX,p.clientY)},{passive:true}));
/* wake / dock */
function dock(){ensureMenu();$('#menuBtn').style.display=S.mode?'flex':'none';
$('#dock').innerHTML=!S.mode?'':`<form id="typed" class="bar" onsubmit="event.preventDefault();ask($('#tq').value)" autocomplete="off"><input id="tq" autocomplete="off" spellcheck="false" placeholder="Ask your memory…" aria-label="Ask your memory"><button class="send" aria-label="Ask">&#10148;</button></form>
<button class="orb mic" onclick="toggleMic()" aria-label="${S.listening?'Stop listening':'Speak'}">${S.listening?'<svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>':'<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'}</button>
<div class="tiny" style="text-align:center;margin-top:8px">${S.listening?'Listening… tap to stop':'Tap to speak'}</div>`}
function ensureMenu(){if($('#menuBtn'))return;$('#stage').insertAdjacentHTML('beforeend',`<button id="menuBtn" onclick="menu(true)" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#e9eefb" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button><div id="scrim" onclick="menu(false)"></div><aside id="drawer" aria-label="Menu"></aside>`)}
function menu(open){const d=$('#drawer');if(open){
 d.innerHTML=`<button class="dx" onclick="menu(false)" aria-label="Close menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#e9eefb" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="dh"><svg viewBox="0 0 40 40" width="48" height="48"><rect x="4" y="8" width="32" height="26" rx="10" fill="#e9eefc"/><rect x="9" y="13" width="22" height="16" rx="6" fill="#04070e"/><rect x="14" y="19" width="4" height="6" rx="2" fill="#5ee6ff"/><rect x="22" y="19" width="4" height="6" rx="2" fill="#5ee6ff"/></svg><div style="font:700 18px Sora;margin-top:8px">WhereWasIt?</div><div class="tiny">${S.mode=='demo'?'Demo account':esc(S.email||'Signed in')}</div></div>
<button class="di" onclick="menu(false);addOpt()"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Add a memory</button>
<button class="di" onclick="menu(false);openSheet('mem')"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="3"/></svg>Memory Vault</button>
<button class="di" onclick="menu(false);openSheet('sched')"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>Schedule</button>
<button class="di" onclick="toggleVoice()"><svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>Robot voice: ${voiceOn()?'On':'Off'}</button>
<button class="di" onclick="menu(false);openSheet('set')"><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>Settings</button>
<div style="flex:1"></div>
<button class="di" onclick="menu(false);logout()"><svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></svg>Sign out</button>`}
 d.classList.toggle('open',open);$('#scrim').classList.toggle('open',open);$('#menuBtn').setAttribute('aria-expanded',open)}
function wake(m){S.mode=m;load();state('idle');S.msgs=[{r:1,t:`I'm awake. Ask me where you left something, or open the menu (top left) to add something new.`}];dock();panel()}
function panel(){$('#panel').innerHTML=(S.mode=='demo'?'<div class="banner">Demo account: sample records, not real user data.</div>':'')+(!S.mode?(window.authHTML?authHTML():''):'')+S.msgs.map(m=>m.you?`<div class="bub you">${esc(m.t)}</div>`:m.html?m.html:`<div class="bub">${esc(m.t)}</div>`).join('');$('#panel').scrollTop=1e5}
/* ask */
function ask(q,noAI){q=(q||'').trim();if(!q)return toast('Type or say a question first.');if($('#tq'))$('#tq').value='';
if(isBad(q)){const w='Nah, you should not speak like this.';S.msgs=[{you:1,t:maskBad(q)},{r:1,t:w}];state('show');panel();window.robotAct&&robotAct('cover');window.speak&&speak(w);return}
S.msgs=[{you:1,t:q}];const sm=chat(q);if(sm){S.msgs.push({r:1,t:sm});state('show');panel();if(/^\s*(hi+|hello+|hey+|yo|hola|namaste|vanakkam|good (morning|afternoon|evening)|bye|goodbye)\b/i.test(q)&&window.robotWave)robotWave();if(window.speak)speak(sm);return}state('think');panel();
if(!noAI&&window.aiReady&&aiReady()){aiAsk(q);return}
setTimeout(()=>{const r=search(q);if(!r.length){S.msgs.push({r:1,t:`I couldn't find a saved memory for that. I only know what you've shown me. Try another word, or open the menu to add it.`})}
else{const x=r[0].m;S.msgs.push({r:1,t:`Last recorded sighting of ${x.name}. This isn't a live location, only where you last showed me.`});
S.msgs.push({html:`<div class="rc"><img class="big" src="${x.img}" alt="${esc(x.name)}"><div class="row"><b class="col">${esc(x.name)}</b><span class="tag">${r[0].conf} confidence</span></div><p style="margin:6px 0 2px"><b>${esc(x.loc)}</b></p><div class="mut">${when(x.updated)}</div>${x.notes?`<div class="mut">Note: ${esc(x.notes)}</div>`:''}<div class="row" style="margin-top:10px"><button onclick="openSheet('detail','${x.id}')">View memory</button><button class="ghost" onclick="addOpt('${x.id}')">Update</button></div></div>`});
if(r.length>1)S.msgs.push({r:1,t:'Other possible matches: '+r.slice(1,4).map(y=>y.m.name+' ('+y.m.loc+')').join(', ')+'.'})}
state('show');panel()},900)}
/* mic: real audio level drives the robot */
async function toggleMic(){try{speechSynthesis.cancel()}catch(e){}if(S.listening)return stopMic(true);
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;heard='';
try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){toast('Microphone is off. Allow it in Settings.');openSheet('set');return}
S.listening=true;state('listen');dock();
S.msgs=[{r:1,t:SR?'Listening…':'Listening, but this browser can’t turn speech into text. Type your question instead.'}];panel();
ac=new (window.AudioContext||window.webkitAudioContext)();an=ac.createAnalyser();an.fftSize=64;ac.createMediaStreamSource(stream).connect(an);meter();
if(SR){rec=new SR();rec.interimResults=true;rec.onresult=e=>{heard=[...e.results].map(r=>r[0].transcript).join('');S.msgs=[{you:1,t:heard}];panel()};rec.onerror=()=>{toast('Could not hear you clearly.')};rec.onend=()=>{if(S.listening)stopMic(true)};try{rec.start()}catch(e){}}}
function stopMic(go){S.listening=false;try{rec&&rec.stop()}catch(e){}stream&&stream.getTracks().forEach(t=>t.stop());ac&&ac.close();rec=null;R.style.setProperty('--lv',0);document.documentElement.style.setProperty('--lv',0);dock();
if(go&&heard.trim())ask(heard);else{state('idle');S.msgs=[{r:1,t:`I didn't catch anything. Tap Speak and try again, or type.`}];panel()}}
function meter(){if(!S.listening)return;const f=new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(f);
const lv=Math.min(1,f.reduce((a,b)=>a+b,0)/f.length/90);document.documentElement.style.setProperty('--lv',lv.toFixed(2));R.style.setProperty('--lv',lv.toFixed(2));
const c=$('#wave'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);const n=f.length,w=c.width/n;
for(let i=0;i<n;i++){const h=Math.max(3,f[i]/255*c.height);g.fillStyle=i%2?'#8b6bff':'#3d8bff';g.fillRect(i*w+2,(c.height-h)/2,w-4,h)}
requestAnimationFrame(meter)}
/* sheets */
function openSheet(k,id){if(k!='cam')stopCam();S.sheet=k;if(id)S.sel=id;sheet();$('#sheet').classList.add('open')}
function closeSheet(){stopCam();$('#sheet').classList.remove('open');S.sheet=null;S.draft=null}
function pick(e,upd){const f=e.target.files[0];if(!f)return;shrink(f,img=>{S.draft={img,upd:upd||null};openSheet('add')})}
function saveNew(){const n=$('#nm').value.trim(),l=$('#lc').value.trim();if(!n||!l)return toast('Add an object name and a location.');
const now=new Date().toISOString(),no=$('#nt').value.trim(),d=S.draft;
if(d.upd){const m=DB.find(x=>x.id==d.upd);m.img=d.img;m.loc=l;m.notes=no;m.updated=now;m.sightings.unshift({img:d.img,loc:l,notes:no,at:now})}
else DB.unshift({id:'u'+Date.now(),name:n,cat:$('#ct').value,img:d.img,loc:l,notes:no,created:now,updated:now,remind:0,sightings:[{img:d.img,loc:l,notes:no,at:now}]});
if(save()){const u=d.upd;S.draft=null;S.msgs=[{r:1,t:`Got it. I'll remember ${n} at ${l}.`}];panel();toast('Memory saved.');u?openSheet('detail',u):closeSheet()}}
function del(id){if(!confirm('Delete this memory and its photos?'))return;DB=DB.filter(m=>m.id!=id);save();openSheet('mem')}
function edit(id){const m=DB.find(x=>x.id==id),n=prompt('Object name',m.name);if(n===null)return;m.name=n.trim()||m.name;const t=prompt('Notes',m.notes);if(t!==null)m.notes=t;save();sheet()}
function remind(id){const m=DB.find(x=>x.id==id);m.remind=m.remind?0:1;save();sheet()}
function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB,null,1)],{type:'application/json'}));a.download='wherewasit-export.json';a.click()}
function wipe(){if(!confirm('Delete all data in this '+(S.mode=='demo'?'demo':'account')+'?'))return;DB=[];try{localStorage.removeItem(KEY())}catch(e){}toast('All data deleted.');openSheet('mem')}
function sheet(){const k=S.sheet,X='<button class="ghost" style="float:right" onclick="closeSheet()">Close</button>';let h=X;
if(k=='mem'){const L=DB.filter(m=>S.filter=='All'||m.cat==S.filter).sort((a,b)=>new Date(b.updated)-new Date(a.updated));
h+=`<h2 style="margin:0 0 12px">Memory Vault</h2><div class="chips">${['All',...CATS].map(c=>`<button class="chip ${S.filter==c?'on':''}" onclick="S.filter='${c}';sheet()">${c}</button>`).join('')}</div>`+(L.length?L.map(m=>`<div class="rc row" onclick="openSheet('detail','${m.id}')" style="cursor:pointer"><img class="thumb" src="${m.img}" alt=""><div class="col"><b>${esc(m.name)}</b><div class="mut">${esc(m.loc)}</div><div class="tiny">${when(m.updated)}</div></div></div>`).join(''):'<div class="rc mut">Nothing saved yet. Close this, open the menu and choose Add a memory.</div>')+`<div class="row" style="margin-top:14px"><button class="ghost" onclick="openSheet('set')">Settings</button></div>`}
if(k=='detail'){const m=DB.find(x=>x.id==S.sel);if(!m)return openSheet('mem');h+=`<h2 style="margin:0 0 12px">${esc(m.name)} <span class="tag">${esc(m.cat)}</span></h2><img class="big" src="${m.img}" alt="${esc(m.name)}"><p><b>Last recorded: ${esc(m.loc)}</b><br><span class="mut">${when(m.updated)}${m.notes?'<br>Note: '+esc(m.notes):''}</span></p><div class="row" style="flex-wrap:wrap"><button onclick="addOpt('${m.id}')">Update location</button><button class="ghost" onclick="edit('${m.id}')">Edit</button><button class="ghost" onclick="remind('${m.id}')">${m.remind?'Reminder on':'Add to reminders'}</button><button class="danger" onclick="del('${m.id}')">Delete</button></div><h3 style="margin:18px 0 8px">Past sightings</h3>`+m.sightings.map(s=>`<div class="rc row"><img class="thumb" src="${s.img}" alt=""><div class="col"><b>${esc(s.loc)}</b><div class="tiny">${when(s.at)}</div>${s.notes?`<div class="mut">${esc(s.notes)}</div>`:''}</div></div>`).join('')}
if(k=='sched'){const a=AC(),tab=S.stab||(a.start?'today':'cal'),DN={1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',0:'Sun'},np=('Notification' in window)?Notification.permission:'unsupported';
 const OPT=(sel,n)=>Array.from({length:n},(_,i)=>`<option value="${i+1}" ${sel==i+1?'selected':''}>Day order ${i+1}</option>`).join('');
 const BEF=`<option value="0">At the time</option><option value="5">5 minutes before</option><option value="10" selected>10 minutes before</option><option value="15">15 minutes before</option><option value="30">30 minutes before</option>`;
 const SMALL='style="min-height:40px;padding:8px 12px;font-size:14px"';
 h+=`<h2 style="margin:0 0 8px">Schedule</h2>${S.mode=='demo'?'<div class="banner">Demo account: this is a sample timetable.</div>':''}<div class="chips">${[['today','Today'],['tt','Timetable'],['cal','Calendar']].map(([v,l])=>`<button class="chip ${tab==v?'on':''}" onclick="S.stab='${v}';sheet()">${l}</button>`).join('')}</div>`;
 if(tab=='today'){const now=new Date(),o=orderFor(now,a),ot=orderFor(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1),a),hhmm=pad2(now.getHours())+':'+pad2(now.getMinutes());
  if(o===null)h+=`<div class="rc">Your calendar isn't set up yet.<br><button style="margin-top:10px" onclick="S.stab='cal';sheet()">Set up calendar</button></div>`;
  else{const L=o?periods(o,a):[],nx=L.find(e=>e.time>=hhmm);
   h+=`<div class="rc"><div class="mut">${now.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}</div><div style="font:700 24px Sora;margin-top:4px">${o?'Day order '+o:'No classes today'}</div></div>`
   +(L.length?L.map(e=>`<div class="rc row" ${e===nx?'style="border-color:var(--blue)"':''}><div style="font:700 16px Sora;width:58px">${esc(e.time)}</div><div class="col"><b>${esc(e.title)}</b><div class="mut">${e.place?esc(e.place):''}</div></div>${e===nx?'<span class="tag">Next</span>':''}</div>`).join(''):(o?'<div class="rc mut">No periods added for this day order yet. Open the Timetable tab.</div>':''))
   +`<div class="mut" style="margin:6px 0 14px">Tomorrow: ${ot===null?'not set':ot?'Day order '+ot:'no classes'}</div><div class="rc"><label class="l">Is today really a different day order?</label><div class="row"><select id="fixo" style="margin:0">${OPT(o||1,a.n)}</select><button onclick="fixToday()">Update</button></div></div>`}}
 if(tab=='tt'){const so=Math.min(S.sto||1,a.n),L=periods(so,a);
  h+=`<div class="chips">${Array.from({length:a.n},(_,i)=>`<button class="chip ${so==i+1?'on':''}" onclick="S.sto=${i+1};sheet()">Day ${i+1}</button>`).join('')}</div>`
  +(L.length?L.map(e=>`<div class="rc row"><div style="font:700 16px Sora;width:58px">${esc(e.time)}</div><div class="col"><b>${esc(e.title)}</b><div class="mut">${e.place?esc(e.place)+' · ':''}remind ${e.before?e.before+' min before':'at the time'}</div></div><button class="danger" ${SMALL} onclick="delPeriod(${so},'${e.id}')">Delete</button></div>`).join(''):`<div class="rc mut">No periods for Day order ${so} yet.</div>`)
  +`<div class="rc"><b>Add a period to Day order ${so}</b><label class="l" style="display:block;margin-top:8px">Subject</label><input id="st" autocomplete="off" placeholder="e.g. Data Structures"><label class="l">Place (optional)</label><input id="sp" autocomplete="off" placeholder="e.g. Block A, Room 204"><label class="l">Start time</label><input id="stm" type="time"><label class="l">Remind me</label><select id="sb">${BEF}</select><button style="width:100%" onclick="addPeriod(${so})">Add period</button></div>`}
 if(tab=='cal'){
  if(!a.start)h+=`<div class="rc"><b>Set up your academic calendar</b><p class="mut">Tell me today's day order and which weekdays have classes. I count day orders forward and skip the holidays you add.</p><label class="l">Number of day orders</label><select id="cn">${[1,2,3,4,5,6,7,8].map(n=>`<option ${n==a.n?'selected':''}>${n}</option>`).join('')}</select><label class="l">Class days</label><div id="dayrow">${[1,2,3,4,5,6,0].map(d=>`<button class="chip ${a.work.includes(d)?'on':''}" data-d="${d}" onclick="this.classList.toggle('on')">${DN[d]}</button>`).join('')}</div><label class="l">Today's day order</label><select id="co">${OPT(1,8)}</select><button style="width:100%" onclick="setupCal()">Start calendar</button></div>`;
  else h+=`<div class="rc"><b>${a.n} day orders</b><div class="mut">Class days: ${a.work.slice().sort((x,y)=>(x||7)-(y||7)).map(d=>DN[d]).join(' ')} · counting from ${esc(a.start)} (Day ${a.startOrder})</div></div>`
   +`<div class="rc"><b>Holidays</b><p class="mut" style="margin:4px 0 8px">Day orders skip these dates and carry on the next working day.</p><div class="row"><input id="hd" type="date" style="margin:0"><button onclick="addHoliday()">Add</button></div>${a.holidays.slice().sort().map(d=>`<div class="row" style="margin-top:8px"><div class="col">${esc(d)}</div><button class="danger" ${SMALL} onclick="delHoliday('${d}')">Remove</button></div>`).join('')}</div>`
   +`<div class="rc"><b>One-off exceptions</b><p class="mut" style="margin:4px 0 8px">For a single day that follows a different order, like a Saturday that runs Monday's schedule. These don't shift other days.</p><input id="xd" type="date"><select id="xo"><option value="0">No classes</option>${OPT(0,a.n)}</select><button style="width:100%" onclick="addOver()">Save exception</button>${Object.keys(a.over).sort().map(d=>`<div class="row" style="margin-top:8px"><div class="col">${esc(d)}: ${a.over[d]?'Day order '+a.over[d]:'No classes'}</div><button class="danger" ${SMALL} onclick="delOver('${d}')">Remove</button></div>`).join('')}</div>`
   +`<button class="ghost" style="width:100%;margin-bottom:10px" onclick="resetCal()">Reset calendar (keeps timetable)</button>`}
 h+=(np=='granted'?'':`<div class="warn">${np=='denied'?'Notifications are blocked in your browser, so reminders show and speak inside the app only.':np=='unsupported'?'This browser has no notifications. Reminders show inside the app.':'Allow notifications so reminders also pop up when you are on another tab.'}${np=='default'?'<br><button class="ghost" style="min-height:36px;padding:6px 12px;font-size:13px;margin-top:6px" onclick="askNotif()">Allow notifications</button>':''}</div>`)+`<div class="rc" style="margin-top:6px"><b>Get reminders even when the app is closed</b><p class="mut" style="margin:4px 0 10px">Add your classes to your phone's calendar. Your calendar app then rings before each class. It covers the next 120 days, so export again after you change the calendar.</p><button style="width:100%" onclick="exportICS()">Add to phone calendar (.ics)</button></div>`+`<button class="ghost" style="width:100%;margin-top:6px" onclick="testReminder()">Test a reminder in 1 minute</button>`}
if(k=='addopt'){h+=`<h2 style="margin:0 0 6px">${S.updId?'Update location':'Show me something'}</h2><p class="mut" style="margin:0 0 16px">How do you want to add the photo?</p><div style="display:grid;gap:12px"><button onclick="openCam()">Take a photo</button><label class="btn ghost" style="cursor:pointer">Choose from gallery or files<input type="file" accept="image/*" hidden onchange="pick(event,S.updId)"></label></div>`}
if(k=='cam'){h+=`<h2 style="margin:0 0 12px">Take a photo</h2><video id="cv" class="big" playsinline muted autoplay></video><div class="row"><button class="ghost" onclick="addOpt(S.updId)">Back</button><button class="col" onclick="snap()">Capture</button></div>`}
if(k=='add'){const d=S.draft,m=d.upd?DB.find(x=>x.id==d.upd):null;h+=`<h2 style="margin:0 0 12px">${m?'Update location':'Show me something'}</h2><img class="big" src="${d.img}" alt="Captured photo"><div class="warn">AI object detection isn't connected in this prototype. Name the object yourself.</div><label class="l">Object name</label><input id="nm" autocomplete="off" spellcheck="false" value="${esc(m?m.name:'')}" ${m?'readonly':''} placeholder="e.g. Blue water bottle"><label class="l">Category</label><select id="ct">${CATS.map(c=>`<option ${m&&m.cat==c?'selected':''}>${c}</option>`).join('')}</select><label class="l">Location or room</label><input id="lc" autocomplete="off" spellcheck="false" placeholder="e.g. Study table"><label class="l">Notes (optional)</label><textarea id="nt" autocomplete="off" spellcheck="false" rows="2" placeholder="e.g. inside the top drawer"></textarea><button style="width:100%" onclick="saveNew()">Save memory</button>`}
if(k=='set'){h+=`<h2 style="margin:0 0 12px">Settings</h2><div class="rc"><b>Microphone</b><div id="micst" class="mut" style="margin-top:8px">Checking…</div></div>${window.aiCard?aiCard():''}<div class="rc"><b>Robot voice</b><p class="mut">When you say hi, the robot answers out loud and waves.</p><button class="ghost" onclick="toggleVoice()">${voiceOn()?'Turn voice off':'Turn voice on'}</button></div><div class="rc"><b>Privacy</b><p class="mut">Signed-in memories and photos are stored in your private Supabase account, and only you can read them. Demo data stays in this browser. Your browser asks for camera and microphone access only when you use them; change that in site settings.</p></div><div class="rc"><b>Your data</b><div class="row" style="margin-top:10px"><button class="ghost" onclick="exportData()">Export JSON</button><button class="danger" onclick="wipe()">Delete all data</button></div></div><div class="rc"><b>Account</b><p class="mut">${S.mode=='demo'?'Demo (sample data)':esc(S.email||'Signed in')}</p><button class="ghost" onclick="stopMic(false);closeSheet();logout()">Sign out</button></div><p class="tiny">Prototype limits: no AI vision, no background reminders.</p>`}
$('#sheet').innerHTML=h;if(k=='set')micStatus()}
dock();panel();

/* add-photo options, in-app camera, small talk */
let camStream=null;
function addOpt(id){S.updId=id||null;openSheet('addopt')}
async function openCam(){openSheet('cam');try{camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});const v=$('#cv');v.srcObject=camStream;await v.play()}catch(e){stopCam();toast('Camera not available. Allow it in your browser, or choose from gallery.');openSheet('addopt')}}
function stopCam(){if(camStream)camStream.getTracks().forEach(t=>t.stop());camStream=null}
function snap(){const v=$('#cv');if(!v||!v.videoWidth)return toast('Camera is not ready yet.');const k=Math.min(1,800/v.videoWidth),c=document.createElement('canvas');c.width=v.videoWidth*k;c.height=v.videoHeight*k;c.getContext('2d').drawImage(v,0,0,c.width,c.height);S.draft={img:c.toDataURL('image/jpeg',.7),upd:S.updId||null};stopCam();openSheet('add')}
function chat(q){const t=q.toLowerCase().replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ').trim();
 if(/\bi hate (you|u)\b|\bhate (you|u)\b|\bi (do not|dont|don t) like (you|u)\b|\b(you|u) (are|re|r) (useless|stupid|dumb|worthless|trash)\b|\b(you|u) suck\b|\bshut up\b/.test(t)){window.robotAct&&robotAct('sad');return "Aww... that hurts my circuits. I'm sorry I let you down. Tell me what went wrong and I will try to do better."}
 {const ok=!/\b(where|find|last|kept|keep|put|left)\b/.test(t),TR=[
 [/\b(play dead|act dead|be dead|pretend to be dead|faint|pass out)\b/,'dead','Bleh. I am dead.'],
 [/\b(dizzy|dizziness)\b/,'dizzy','Whoa. Everything is spinning.'],
 [/\b(i love you|love you|be cute|show some love)\b/,'love','Aww, I love you too!'],
 [/\b(angry|grumpy|be mad)\b/,'angry','Grr. I am very angry.'],
 [/\b(scare me|scared|boo)\b/,'scared','Eek! That was scary.'],
 [/\b(laugh|giggle|haha|lol)\b/,'laugh','Ha ha ha ha!'],
 [/\bwink\b/,'wink','Wink wink.'],
 [/\b(sing|sing a song)\b/,'sing','La la la la la.'],
 [/\b(glitch|malfunction|short circuit)\b/,'glitch','Bzzzt. Error. Just kidding.'],
 [/\b(pew pew|pew|bang bang|finger gun|shoot|gun)\b/,'shoot','Pew pew pew!'],
 [/\b(entertain|bored|something funny|surprise me|do a trick|do something|be funny|cheer me up|show me something)\b/,'entertain','Okay, watch this!']];
 for(const[re,act,txt]of TR){if(ok&&re.test(t)){window.robotAct&&robotAct(act);return txt}}}
 if(!/\b(where|find|last|kept|keep|put|left|show)\b/.test(t)&&/\b(dance|dancing|boogie)\b/.test(t)){window.robotAct&&robotAct('dance');return "Here come my moves!"}
 if(!/\b(where|find|last|kept|keep|put|left|show)\b/.test(t)&&/\b(spin|rotate|turn around)\b/.test(t)){window.robotAct&&robotAct('spin');return "Whee!"}
 if(!/\b(where|find|last|kept|keep|put|left|show)\b/.test(t)&&/\b(jump|hop)\b/.test(t)){window.robotAct&&robotAct('jump');return "Boing!"}
 if(/^(wave|wave at me|wave hello)$/.test(t)){window.robotAct&&robotAct('wave');return "Hello there!"}
 if(!/\b(where|find|last|kept|keep|put|left|show)\b/.test(t)&&/\b(nod|say yes)\b/.test(t)){window.robotAct&&robotAct('nod');return "Yes!"}
 if(!/\b(where|find|last|kept|keep|put|left|show)\b/.test(t)&&/\b(shake your head|say no)\b/.test(t)){window.robotAct&&robotAct('shake');return "Nope!"}
 if(/\b(day order|dayorder)\b/.test(t))return orderText();
 if(/\b(next class|my schedule|timetable|classes today|what s next)\b/.test(t))return nextText();
 if(/^(hi+|hello+|hey+|yo|hola|namaste|vanakkam|good (morning|afternoon|evening))( there| robot| buddy| bro)?$/.test(t))return `Hi! I'm WhereWasIt. Ask me where you left something, like "where are my keys?"`;
 if(/^(thanks|thank you|thx|ty)\b/.test(t))return "You're welcome!";
 if(/how are you|how r u|what's up|whats up/.test(t))return "I'm doing great and ready to help. What are you looking for?";
 if(/who are you|your name|what are you/.test(t))return "I'm WhereWasIt, your memory assistant. I remember where you last saw your things.";
 if(/^(help|help me)$|\bwhat (all )?(can|could) (you|u) do\b|\bwhat do (you|u) do\b|\byour (features|abilities|skills|capabilities)\b|\bhow can you help\b|\bhow do i use (this|you)\b/.test(t))return "Hi, I'm WhereWasIt. Your memory forgets, I remember. I help you remember where you put things: open the menu and add a photo of an item and where you left it, then ask me later where it is, and I'll show its last recorded sighting. I can also tell you your next class and day order, remind you before classes, and entertain you."+(window.aiReady&&aiReady()?" I can chat and answer general questions too.":"");
 if(/^(bye|goodbye|see you|good night)$/.test(t))return "Bye! I'll be here when you need me.";
 return null}

/* academic calendar (day orders) + timetable + reminders, stored on this device */
const SK=()=>'wwi_ac_'+(S.mode=='demo'?'demo':(S.uid||'local'));
const pad2=x=>String(x).padStart(2,'0'),ymd=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`,pymd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
function AC(){try{const a=JSON.parse(localStorage.getItem(SK())||'null');if(a)return a}catch(e){}
 if(S.mode=='demo')return{n:5,work:[1,2,3,4,5],start:ymd(new Date()),startOrder:3,holidays:[],over:{},tests:[],tt:{3:[{id:'d1',title:'Data Structures',place:'Block A, Room 204',time:'09:00',before:10},{id:'d2',title:'Engineering Maths',place:'Block B, Room 101',time:'10:00',before:10},{id:'d3',title:'Physics Lab',place:'Lab 2',time:'11:15',before:15},{id:'d4',title:'Professional English',place:'Block A, Room 110',time:'14:00',before:10}]}};
 return{n:5,work:[1,2,3,4,5],start:'',startOrder:1,holidays:[],over:{},tests:[],tt:{}}}
function saveAC(a){try{localStorage.setItem(SK(),JSON.stringify(a));return true}catch(e){toast('Storage is full.');return false}}
function orderFor(d,a){a=a||AC();const k=ymd(d);if(k in a.over)return a.over[k]||0;if(!a.start||k<a.start)return null;
 if(!a.work.includes(d.getDay())||a.holidays.includes(k))return 0;
 let c=0;const cur=pymd(a.start);while(ymd(cur)<k){if(a.work.includes(cur.getDay())&&!a.holidays.includes(ymd(cur)))c++;cur.setDate(cur.getDate()+1)}
 return((a.startOrder-1+c)%a.n)+1}
function periods(o,a){return(a.tt[o]||[]).slice().sort((x,y)=>x.time.localeCompare(y.time))}
function setupCal(){const a=AC(),n=+$('#cn').value,so=+$('#co').value,work=[...document.querySelectorAll('#dayrow .on')].map(b=>+b.dataset.d);
 if(!work.length)return toast('Pick at least one class day.');if(so>n)return toast(`Today's day order can't be more than ${n}.`);
 a.n=n;a.work=work;a.start=ymd(new Date());a.startOrder=so;if(saveAC(a)){S.stab='today';toast('Calendar started.');sheet()}}
function fixToday(){const a=AC(),so=+$('#fixo').value,k=ymd(new Date());a.start=k;a.startOrder=so;delete a.over[k];a.holidays=a.holidays.filter(d=>d>k);if(saveAC(a)){toast('Updated.');sheet()}}
function addHoliday(){const d=$('#hd').value;if(!d)return toast('Pick a date.');const a=AC();if(!a.holidays.includes(d))a.holidays.push(d);if(saveAC(a))sheet()}
function delHoliday(d){const a=AC();a.holidays=a.holidays.filter(x=>x!=d);if(saveAC(a))sheet()}
function addOver(){const d=$('#xd').value;if(!d)return toast('Pick a date.');const a=AC();a.over[d]=+$('#xo').value;if(saveAC(a))sheet()}
function delOver(d){const a=AC();delete a.over[d];if(saveAC(a))sheet()}
function resetCal(){if(!confirm('Reset the calendar? Your timetable stays.'))return;const a=AC();a.start='';a.holidays=[];a.over={};if(saveAC(a)){S.stab='cal';sheet()}}
function addPeriod(o){const title=$('#st').value.trim(),time=$('#stm').value;if(!title||!time)return toast('Add a subject and a start time.');
 const a=AC();(a.tt[o]=a.tt[o]||[]).push({id:'p'+Date.now(),title,place:$('#sp').value.trim(),time,before:+$('#sb').value});if(saveAC(a)){toast('Period added.');sheet()}}
function delPeriod(o,id){const a=AC();a.tt[o]=(a.tt[o]||[]).filter(e=>e.id!=id);if(saveAC(a))sheet()}
function askNotif(){try{Notification.requestPermission().then(()=>sheet())}catch(e){}}
function testReminder(){const n=new Date(Date.now()+6e4),a=AC();a.tests.push({id:'t'+Date.now(),title:'Test reminder',place:'',time:pad2(n.getHours())+':'+pad2(n.getMinutes()),date:ymd(n),before:0});if(saveAC(a))toast('Test set for the next minute. Keep this tab open.')}
function nextText(){const a=AC(),now=new Date(),out=[];
 for(let i=0;i<14&&out.length<3;i++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i),o=orderFor(d,a);if(!o)continue;
  periods(o,a).forEach(e=>{const[h,m]=e.time.split(':').map(Number),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m);
   if(at>now&&out.length<3)out.push(`${e.title}${e.place?' ('+e.place+')':''} ${i==0?'today':i==1?'tomorrow':d.toLocaleDateString(undefined,{weekday:'long'})} at ${e.time}`)})}
 return out.length?'Coming up: '+out.join('; then ')+'.':"I don't see any upcoming classes. Open the menu, choose Schedule, and set up your calendar and timetable."}
function orderText(){const o=orderFor(new Date());return o===null?"Your calendar isn't set up yet. Open the menu, choose Schedule, then the Calendar tab.":o?`Today is Day order ${o}.`:"There's no day order today. It's a holiday or an off day."}
let fired={};try{fired=JSON.parse(localStorage.getItem('wwi_fired')||'{}')}catch(e){}
function tick(){if(!S.mode)return;const a=AC(),now=new Date(),today=ymd(now),o=orderFor(now,a);let ch=0;
 (o?periods(o,a):[]).concat((a.tests||[]).filter(t=>t.date===today)).forEach(e=>{const[h,m]=e.time.split(':').map(Number),at=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m),fire=new Date(at-(e.before||0)*6e4),k=e.id+'|'+today;
  if(now>=fire&&now-at<10*6e4&&!fired[k]){fired[k]=Date.now();ch=1;const mins=Math.round((at-now)/6e4),t=mins>0?`Reminder: ${e.title}${e.place?' at '+e.place:''} in ${mins} min, at ${e.time}.`:`Reminder: ${e.title}${e.place?' at '+e.place:''} is starting now.`;
   S.msgs=[{r:1,t}];state('show');panel();window.robotWave&&robotWave();window.speak&&speak(t);toast(t);try{if(window.Notification&&Notification.permission==='granted')new Notification('WhereWasIt?',{body:t})}catch(x){}}});
 if(ch){Object.keys(fired).forEach(k=>{if(Date.now()-fired[k]>2*864e5)delete fired[k]});try{localStorage.setItem('wwi_fired',JSON.stringify(fired))}catch(e){}}}
setInterval(tick,20000);document.addEventListener('visibilitychange',tick);

/* export the day-order timetable to a calendar file so the phone's calendar app does the reminding */
const icsEsc=t=>String(t).replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
function exportICS(){const a=AC(),now=new Date(),L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WhereWasIt//EN','CALSCALE:GREGORIAN'],stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');let n=0;
 const f=x=>`${x.getFullYear()}${pad2(x.getMonth()+1)}${pad2(x.getDate())}T${pad2(x.getHours())}${pad2(x.getMinutes())}00`;
 for(let i=0;i<120;i++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i),o=orderFor(d,a);if(!o)continue;
  periods(o,a).forEach(e=>{const[h,m]=e.time.split(':').map(Number),st=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m),en=new Date(st.getTime()+50*6e4);
   L.push('BEGIN:VEVENT',`UID:${e.id}-${ymd(d)}@wherewasit`,`DTSTAMP:${stamp}`,`DTSTART:${f(st)}`,`DTEND:${f(en)}`,`SUMMARY:${icsEsc(e.title)}`,`LOCATION:${icsEsc(e.place||'')}`,`DESCRIPTION:Day order ${o}`,'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsEsc(e.title)}`,`TRIGGER:-PT${e.before||0}M`,'END:VALARM','END:VEVENT');n++})}
 if(!n)return toast('Nothing to export yet. Set up your calendar and timetable first.');
 L.push('END:VCALENDAR');const x=document.createElement('a');x.href=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar'}));x.download='wherewasit-classes.ics';x.click();toast(`Exported ${n} classes.`)}

document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#drawer')&&$('#drawer').classList.contains('open'))menu(false);else if(S.sheet)closeSheet()}});


/* polite-robot: bad words make it cover its ears */
const BAD=[/f+[u*@]+c+k/,/\bf+[u*]+k+(ing|er|ed|s)?\b/,/\b[fsb]\*{2,}/,/\bsh[i1*]+t(s|ty|head|hole)?\b|bullshit|horseshit/,/\bb[i1]tch/,/\ba+ss+h[o0]+le/,/\bbastard/,/\bdick ?head/,/\bc[u*]nt\b/,/madarchod|maderchod|bhenchod|behenchod|chutiya|chutiye|gandu|bhosdi|\brandi\b/];
const normBad=x=>x.toLowerCase().replace(/@/g,'a').replace(/\$/g,'s').replace(/0/g,'o').replace(/[1!|]/g,'i');
const isBad=x=>{const n=normBad(x);return BAD.some(r=>r.test(n))};
function maskBad(x){const n=normBad(x),o=x.split('');BAD.forEach(r=>{const g=new RegExp(r.source,'g');let m;while((m=g.exec(n))){for(let i=m.index+1;i<m.index+m[0].length;i++)o[i]='*';if(!m[0].length)g.lastIndex++}});return o.join('')}