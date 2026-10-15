async function micStatus(){const el=$('#micst');if(!el)return;let st='unknown';
try{const p=await navigator.permissions.query({name:'microphone'});st=p.state;p.onchange=micStatus}catch(e){}
const b=l=>`<div style="margin-top:10px"><button class="ghost" onclick="allowMic()">${l}</button></div>`;
el.innerHTML=st=='granted'?`<b style="color:#5ee6ff">Allowed.</b> Tap Speak on the main screen to talk.${b('Test microphone')}`:
st=='denied'?`<b style="color:#ff6b7a">Blocked by your browser.</b> Tap Try again. If no prompt appears, open your browser's site settings, set Microphone to Allow, then come back.${b('Try again')}`:
`<b>Not allowed yet.</b> Allow it so I can hear your questions.${b('Allow microphone')}`}
window.voiceOn=()=>{if(window.__mute===undefined){try{window.__mute=localStorage.getItem('wwi_mute')=='1'}catch(e){window.__mute=false}}return !window.__mute};
window.speak=t=>{try{if(!window.speechSynthesis||!voiceOn())return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=1.05;u.pitch=1.25;speechSynthesis.speak(u)}catch(e){}};
window.toggleVoice=()=>{window.__mute=voiceOn();try{localStorage.setItem('wwi_mute',window.__mute?'1':'0')}catch(e){}if(window.__mute){try{speechSynthesis.cancel()}catch(e){}}toast(window.__mute?'Robot voice is off.':'Robot voice is on.');if(S.sheet)sheet();const d=$('#drawer');if(d&&d.classList.contains('open'))menu(true)};
async function allowMic(){try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());toast('Microphone allowed.')}
catch(e){toast("Couldn't turn on the microphone. If this page is inside another app, open it in your browser.")}micStatus()}
(function(){
const cv=$('#gl');if(!window.THREE){cv.outerHTML='<div class="mut">3D could not load. Check your connection.</div>';window.look=()=>{};return}
const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,50);cam.position.set(0,-.1,7.8);
sc.add(new THREE.AmbientLight(0x9fb2e8,.9));
const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(3,4,6);sc.add(dl);
const bl=new THREE.PointLight(0x3d8bff,1.2,14);bl.position.set(-4,1,4);sc.add(bl);
const vl=new THREE.PointLight(0x8b6bff,.9,14);vl.position.set(4,-2,3);sc.add(vl);
const M=(c,e,ei,m,r)=>new THREE.MeshStandardMaterial({color:c,emissive:e||0,emissiveIntensity:ei||0,metalness:m??.1,roughness:r??.35});
function rs(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
const root=new THREE.Group();sc.add(root);
const bg=new THREE.ExtrudeGeometry(rs(2.9,2.3,.75),{depth:.7,bevelEnabled:true,bevelThickness:.25,bevelSize:.25,bevelSegments:8,curveSegments:28});bg.translate(0,0,-.35);
const body=new THREE.Mesh(bg,M(0xe9eefc,0,0,.1,.3));root.add(body);
const fc=document.createElement('canvas');fc.width=512;fc.height=384;const tex=new THREE.CanvasTexture(fc);
const scr=new THREE.Mesh(new THREE.PlaneGeometry(2.75,2.06),new THREE.MeshBasicMaterial({map:tex,transparent:true}));scr.position.z=.61;root.add(scr);
const knobs=[-1,1].map(s=>{const k=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),M(0x2a1f5c,0x8b6bff,.5));k.position.set(s*1.85,0,0);root.add(k);return k});
const BODYM=M(0xe9eefc,0,0,.1,.3);
const arms=[-1,1].map(s=>{const g=new THREE.Group();g.position.set(s*1.85,-.45,.05);
 g.add(new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),BODYM));
 const a=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.7,16),BODYM);a.position.y=-.38;g.add(a);
 const h=new THREE.Mesh(new THREE.SphereGeometry(.24,20,14),BODYM);h.scale.set(1,1.15,.8);h.position.y=-.85;g.add(h);
 const th=new THREE.Mesh(new THREE.SphereGeometry(.1,12,10),BODYM);th.position.set(-s*.2,-.78,.06);g.add(th);
 g.rotation.z=s*.2;root.add(g);return g});
[-.7,.7].forEach(x=>{const f=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),M(0x16224a));f.scale.set(1,.5,1);f.position.set(x,-1.55,0);root.add(f)});
function rr(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
let tx=0,ty=0,hy=0,hx=0,sm=0;
window.look=(x,y)=>{const b=cv.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(x-b.left-b.width/2)/(b.width*.6)));ty=Math.max(-1,Math.min(1,(y-b.top-b.height/2)/(b.height*.45)))};
function size(){const w=R.clientWidth,h=R.clientHeight;ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.setSize(w,h,false);cv.style.width=w+'px';cv.style.height=h+'px';cam.aspect=w/h;{const tn=Math.tan(cam.fov*Math.PI/360);cam.position.z=Math.max(2.7/tn,3.5/(tn*cam.aspect))}cam.updateProjectionMatrix()}
size();addEventListener('resize',size);if(window.ResizeObserver)new ResizeObserver(size).observe(R);
function face(t,st,lv,ex){const g=fc.getContext('2d');g.clearRect(0,0,512,384);g.shadowBlur=0;g.fillStyle='#04070e';rr(g,6,6,500,372,84);g.fill();
const col='#5ee6ff';g.fillStyle=col;g.strokeStyle=col;g.shadowColor=col;g.shadowBlur=30;g.lineCap='round';
let ox=tx*28,oy=ty*28,w=80,h=104,cy=165,L=165,Rr=347;g.globalAlpha=1;
if(ex){const X=(x,y,r)=>{g.lineWidth=18;g.beginPath();g.moveTo(x-r,y-r);g.lineTo(x+r,y+r);g.moveTo(x+r,y-r);g.lineTo(x-r,y+r);g.stroke()},
 heart=(x,y,s)=>{g.beginPath();g.moveTo(x,y+s*.9);g.bezierCurveTo(x-s*1.6,y-s*.2,x-s*.8,y-s*1.3,x,y-s*.4);g.bezierCurveTo(x+s*.8,y-s*1.3,x+s*1.6,y-s*.2,x,y+s*.9);g.fill()},
 happy=()=>{g.lineWidth=22;[L,Rr].forEach(x=>{g.beginPath();g.arc(x,cy+38,52,Math.PI*1.12,Math.PI*1.88);g.stroke()})},
 eyes=(w2,h2)=>{[L,Rr].forEach(x=>{rr(g,x-w2/2,cy-h2/2,w2,h2,w2*.44);g.fill()})};
 g.lineCap='round';
 if(ex=='dead'){X(L,cy,38);X(Rr,cy,38);g.lineWidth=12;g.beginPath();g.moveTo(216,290);g.lineTo(296,290);g.stroke();return}
 if(ex=='dizzy'){g.lineWidth=8;g.shadowBlur=14;[L,Rr].forEach(cx=>{g.beginPath();for(let q=0;q<13;q+=.3){const r=q*3.8,px=cx+Math.cos(q+t*8)*r,py=cy+Math.sin(q+t*8)*r;q?g.lineTo(px,py):g.moveTo(px,py)}g.stroke()});g.lineWidth=10;g.beginPath();for(let x=-44;x<=44;x+=4){const y=295+Math.sin(x/8+t*10)*7;x==-44?g.moveTo(256+x,y):g.lineTo(256+x,y)}g.stroke();return}
 if(ex=='love'){g.fillStyle=g.shadowColor='#ff6bb5';const s=44+Math.sin(t*10)*6;heart(L,cy,s);heart(Rr,cy,s);return}
 if(ex=='angry'){g.fillStyle=g.strokeStyle=g.shadowColor='#ff5a6e';g.beginPath();g.moveTo(L-50,cy-36);g.lineTo(L+50,cy-8);g.lineTo(L+50,cy+50);g.lineTo(L-50,cy+50);g.fill();g.beginPath();g.moveTo(Rr+50,cy-36);g.lineTo(Rr-50,cy-8);g.lineTo(Rr-50,cy+50);g.lineTo(Rr+50,cy+50);g.fill();g.lineWidth=12;g.beginPath();g.arc(256,335,40,Math.PI*1.2,Math.PI*1.8);g.stroke();return}
 if(ex=='scared'){eyes(62,138);g.lineWidth=10;g.beginPath();g.ellipse(256,300,18+Math.sin(t*30)*3,24,0,0,Math.PI*2);g.stroke();return}
 if(ex=='laugh'){happy();g.beginPath();g.ellipse(256,290,42,26+Math.abs(Math.sin(t*14))*16,0,0,Math.PI);g.fill();return}
 if(ex=='wink'){rr(g,L-40,cy-52,80,104,35);g.fill();g.lineWidth=22;g.beginPath();g.arc(Rr,cy+38,52,Math.PI*1.12,Math.PI*1.88);g.stroke();g.lineWidth=12;g.beginPath();g.arc(256,262,34,Math.PI*.15,Math.PI*.85);g.stroke();return}
 if(ex=='sing'){happy();g.beginPath();g.ellipse(256,300,22,18+Math.abs(Math.sin(t*6))*8,0,0,Math.PI*2);g.fill();g.font='bold 54px Sora,sans-serif';[0,.5].forEach(o=>{const ph=(t*.6+o)%1;g.globalAlpha=1-ph;g.fillText('\u266A',350+Math.sin(t*3+o*6)*14,170-ph*110)});g.globalAlpha=1;return}
 if(ex=='shoot'){const sa=window.__a||0,pew=[.8,1.5,2.2].some(ts=>sa-ts>=0&&sa-ts<.4),c2=pew?'#ffe27a':col;g.fillStyle=g.strokeStyle=g.shadowColor=c2;rr(g,L-44,cy-12,88,26,13);g.fill();rr(g,Rr-44,cy-12,88,26,13);g.fill();g.lineWidth=12;g.beginPath();g.arc(256,270,34,Math.PI*.2,Math.PI*.8);g.stroke();if(pew){g.font='bold 66px Sora,sans-serif';g.textAlign='center';g.fillText('PEW!',256,340);g.textAlign='start'}return}
 if(ex=='cover'){g.lineWidth=18;g.beginPath();g.moveTo(L-40,cy-30);g.lineTo(L+30,cy);g.lineTo(L-40,cy+30);g.stroke();g.beginPath();g.moveTo(Rr+40,cy-30);g.lineTo(Rr-30,cy);g.lineTo(Rr+40,cy+30);g.stroke();g.lineWidth=12;g.beginPath();g.arc(256,330,36,Math.PI*1.2,Math.PI*1.8);g.stroke();return}
 if(ex=='sad'){g.beginPath();g.moveTo(L-48,cy-6);g.lineTo(L+48,cy-40);g.lineTo(L+48,cy+50);g.lineTo(L-48,cy+50);g.fill();g.beginPath();g.moveTo(Rr+48,cy-6);g.lineTo(Rr-48,cy-40);g.lineTo(Rr-48,cy+50);g.lineTo(Rr+48,cy+50);g.fill();g.fillStyle=g.shadowColor='#8fd8ff';g.beginPath();g.arc(L-30,cy+72+((t*90)%110),11,0,Math.PI*2);g.fill();g.strokeStyle=col;g.lineWidth=12;g.beginPath();g.arc(256,335,36,Math.PI*1.2,Math.PI*1.8);g.stroke();return}
 if(ex=='glitch'){[['#5ee6ff',-8],['#ff5ad8',8]].forEach(([c,dx])=>{g.fillStyle=g.shadowColor=c;g.globalAlpha=.55+Math.random()*.45;const jx=(Math.random()-.5)*70,jy=(Math.random()-.5)*30;[L,Rr].forEach(x=>{rr(g,x-40+dx+jx,cy-52+jy,80,104,35);g.fill()})});g.globalAlpha=1;if(Math.random()<.3){g.fillStyle='#5ee6ff';g.fillRect(40,60+Math.random()*250,430,6)}return}}
if(st=='sleep'){g.globalAlpha=.45;h=10;ox=0;oy=0;rr(g,L-w/2,cy-5,w,10,5);g.fill();rr(g,Rr-w/2,cy-5,w,10,5);g.fill();g.font='bold 44px Sora';g.fillText('z',420,90);return}
if(st=='show'){g.lineWidth=22;[L,Rr].forEach(x=>{g.beginPath();g.arc(x+ox*.4,cy+38+oy*.4,52,Math.PI*1.12,Math.PI*1.88);g.stroke()});g.lineWidth=12;g.beginPath();g.arc(256+ox*.4,262,34,Math.PI*.15,Math.PI*.85);g.stroke();return}
if(st=='listen'){w=92;h=118+lv*70}
else if(st=='think'){ox=Math.sin(t*3)*42;h=44;oy=0}
else if(t%5<.14)h=8;
[L,Rr].forEach(x=>{rr(g,x-w/2+ox,cy-h/2+oy,w,h,w*.44);g.fill()});
if(st=='listen'){for(let i=-2;i<=2;i++){const bh=14+lv*80*(.6+.4*Math.sin(t*14+i*1.7));rr(g,256+i*34-9,318-bh/2,18,bh,9);g.fill()}}}
let showT=-1,thinkT=-1,act=null,at0=0;const DUR={dance:5.5,spin:1.3,jump:1.4,nod:1.6,shake:1.6,dead:4.6,dizzy:3.2,love:3.5,angry:2.6,scared:2.6,laugh:3,wink:1.6,sing:4.2,glitch:2.2,shoot:3.4,cover:2.8,sad:3.4};let queue=[];
const flash=new THREE.Mesh(new THREE.SphereGeometry(.18,12,10),new THREE.MeshBasicMaterial({color:0xffe27a}));flash.visible=false;sc.add(flash);
const bullet=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xfff2a8}));bullet.visible=false;sc.add(bullet);
const _hp=new THREE.Vector3(),_sp=new THREE.Vector3();
window.robotAct=n=>{if(n=='wave')return robotWave();if(n=='entertain'){queue=['dance','spin','jump','dead','dizzy','love','laugh','wink','sing','glitch','scared','angry','shoot'].sort(()=>Math.random()-.5).slice(0,4);act=queue.shift()}else{queue=[];act=n}at0=clk.getElapsedTime()};
let wv=-9;window.robotWave=()=>{wv=clk.getElapsedTime()};
const clk=new THREE.Clock();
(function loop(){requestAnimationFrame(loop);const t=clk.getElapsedTime(),st=R.dataset.s,lv=parseFloat(R.style.getPropertyValue('--lv'))||0;
if(st=='show'){if(showT<0)showT=t;else if(t-showT>3.5){R.dataset.s='idle';showT=-1}}else showT=-1;
if(st=='think'){if(thinkT<0)thinkT=t;else if(t-thinkT>15){R.dataset.s='idle';thinkT=-1}}else thinkT=-1;
let gy=tx*.45,gx=ty*.4,gz=0;
if(st=='sleep'){gy=0;gx=.22}else if(st=='think'){gy=Math.sin(t*3)*.3;gz=Math.sin(t*3)*.06}else if(st=='show'){gx=.12;gz=Math.sin(t*5)*.03}
hy+=(gy-hy)*.12;hx+=(gx-hx)*.12;sm+=((st=='listen'?lv:0)-sm)*.3;
root.position.x=0;root.rotation.set(hx,hy,gz);root.position.y=Math.sin(t*1.6)*.07;root.scale.setScalar(1+sm*.06);
{const w=t-wv,wd=2.4,wp=(w>=0&&w<wd)?Math.min(1,w/.35,(wd-w)/.35):0,rest=.2+Math.sin(t*1.6)*.04;
 arms[1].rotation.z=rest+(2.25-rest)*wp+Math.sin(Math.max(0,w)*13)*.38*wp;arms[0].rotation.z=-(.2+Math.sin(t*1.6+1)*.04)}
 arms[1].rotation.x=0;flash.visible=false;bullet.visible=false;window.__a=act=='shoot'?t-at0:0;
{if(act){const a=t-at0,D=DUR[act]||2,env=Math.min(1,a/.3,(D-a)/.4),L=(i,tg)=>{arms[i].rotation.z+=(tg-arms[i].rotation.z)*Math.max(0,env)};
 if(a>=D){act=queue.length?queue.shift():null;at0=t}else{const b=t*7;
  if(act=='dance'){root.rotation.z+=Math.sin(b)*.2*env;root.rotation.y+=Math.sin(b*.5)*.5*env;root.position.y+=Math.abs(Math.sin(b))*.35*env;L(1,2+Math.sin(b)*.5);L(0,-(2+Math.sin(b+Math.PI)*.5))}
  else if(act=='spin'){root.rotation.y+=(1-Math.cos(a/D*Math.PI))/2*Math.PI*2;L(1,1.3);L(0,-1.3)}
  else if(act=='jump'){root.position.y+=Math.abs(Math.sin(a*Math.PI*2.2))*.8*env;L(1,1.8);L(0,-1.8)}
  else if(act=='nod'){root.rotation.x+=Math.sin(a*Math.PI*4)*.2*env}
  else if(act=='shake'){root.rotation.y+=Math.sin(a*Math.PI*5)*.35*env}
  else if(act=='dead'){const k=Math.min(1,a/.45,(D-a)/.6);root.rotation.z+=-1.45*k+(a>1.6&&a<2.4?Math.sin(a*40)*.03:0);root.position.y+=-.8*k;L(1,1.1);L(0,-1.1)}
  else if(act=='dizzy'){root.rotation.z+=Math.sin(a*6)*.25*env;root.rotation.y+=Math.sin(a*4)*.3*env}
  else if(act=='love'){root.position.y+=Math.abs(Math.sin(a*5))*.15*env;root.rotation.z+=Math.sin(a*4)*.08*env;L(1,1.0);L(0,-1.0)}
  else if(act=='angry'){root.rotation.z+=Math.sin(a*45)*.05*env;L(1,.5);L(0,-.5)}
  else if(act=='scared'){root.rotation.z+=Math.sin(a*60)*.06*env;L(1,2.4);L(0,-2.4)}
  else if(act=='laugh'){root.position.y+=Math.abs(Math.sin(a*14))*.12*env;root.rotation.z+=Math.sin(a*14)*.05*env;L(1,.6);L(0,-.6)}
  else if(act=='wink'){root.rotation.z+=.12*env}
  else if(act=='sing'){root.rotation.z+=Math.sin(a*3)*.15*env;root.rotation.y+=Math.sin(a*1.5)*.3*env;L(1,1.2+Math.sin(a*3)*.4);L(0,-(1.2-Math.sin(a*3)*.4))}
  else if(act=='shoot'){const sh=[.8,1.5,2.2],k=Math.min(1,a/.4,(D-a)/.4);let rc=0;sh.forEach(ts=>{const d=a-ts;if(d>=0&&d<.35)rc=Math.max(rc,1-d/.35)});
   arms[1].rotation.x=-.9*k-.3*rc;L(1,1.1);L(0,-.4);root.rotation.x+=-.12*rc;
   root.updateMatrixWorld(true);arms[1].children[2].getWorldPosition(_hp);arms[1].getWorldPosition(_sp);const dir=_hp.clone().sub(_sp).normalize();
   sh.forEach(ts=>{const d=a-ts;if(d>=0&&d<.15){flash.visible=true;flash.position.copy(_hp).addScaledVector(dir,.35);flash.scale.setScalar(.2+1.6*(1-d/.15))}if(d>=0&&d<.6){bullet.visible=true;bullet.position.copy(_hp).addScaledVector(dir,.3+d*7);bullet.scale.setScalar(.2+1-d/.6)}})}
  else if(act=='cover'){root.rotation.y+=Math.sin(a*Math.PI*5)*.25*env;L(1,2.9);L(0,-2.9)}
  else if(act=='sad'){root.rotation.x+=.18*env;root.position.y+=-.08*env;L(1,.1);L(0,-.1)}
  else if(act=='glitch'){root.position.x+=(Math.random()-.5)*.15*env;root.rotation.z+=(Math.random()-.5)*.1*env}}}}
 knobs.forEach(k=>k.material.emissiveIntensity=st=='listen'?.6+lv*2.4:.5);
face(t,st,lv,act);tex.needsUpdate=true;ren.render(sc,cam)})();
})();