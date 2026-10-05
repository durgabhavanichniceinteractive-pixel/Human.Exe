/* HUMAN × MACHINE — particle storytelling engine
   One fixed canvas. Every particle k belongs to a side (0 human / 1 machine) and has
   one target point in every "stage" formation. Scroll position -> stage float fs;
   particles morph between stage[a] and stage[b], bursting apart mid-transition. */
(()=>{
gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cv=$('#fx'),c=cv.getContext('2d'),secs=$$('main>section'),links=$$('#menu a'),hdr=$('header'),
      div=$('.divider'),vig=$('.vig'),ring=$('.ring'),dot=$('.dot');
const {PI,sin,cos,abs,hypot:hy,atan2}=Math;
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),ss=x=>{x=cl(x);return x*x*(3-2*x)},fr=v=>v-Math.floor(v);
let seed=11;const R=()=>(seed=seed*16807%2147483647)/2147483647,Z=()=>(R()-.5)*.6;
const dseg=(x,y,a,b,p,q)=>{const dx=p-a,dy=q-b,t=cl(((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy));return hy(x-a-t*dx,y-b-t*dy)};

/* ---------- SHAPES: test(x,y) in [-1,1]^2 -> false | z-depth (rejection sampled) ---------- */
const C4=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
const hand=seg=>(x,y)=>{const L=[.6,.78,.72,.55],i=Math.round((x+.24)/.16);
 return((abs(x)<.32&&y>-.05&&y<.55)||(abs(x)<.25&&y>=.55&&y<.8)||
  (i>=0&&i<4&&abs(x+.24-i*.16)<.058&&y<=-.05&&y>-.05-L[i]&&(!seg||fr(y*7)<.8))||dseg(x,y,-.32,.35,-.62,0)<.07)?Z():false};
const SH={
 // human: rounded head, neck, sloping shoulders, waist, curved arms and legs (all soft/organic)
 hs:(x,y)=>{const ax=abs(x),sx=x<0?-1:1;
  return(hy(x,y+.72)<.17||(ax<.06&&y>-.58&&y<-.46)||(y>-.5&&y<.12&&ax<.3-(y+.5)*.22&&ax<.3-Math.max(0,y+.5-.1)*0.1)
   ||dseg(ax,y,.3,-.42,.42,.18)<.055||dseg(x,y,sx*.12,.08,sx*.15,.96)<.075)?Z():false},
 // robot: square head with eye slots + antenna, hollow boxy torso with glowing core, blocky jointed limbs
 ms:(x,y)=>{const ax=abs(x);
  return((ax<.2&&abs(y+.72)<.15&&!(abs(ax-.09)<.045&&abs(y+.74)<.03))||(ax<.02&&y<-.88&&y>-.98)||(ax<.07&&y>-.58&&y<-.48)
   ||(ax<.34&&y>-.48&&y<.14&&(ax>.28||y<-.42||y>.08))||hy(x,y+.17)<.1||(abs(ax-.44)<.07&&y>-.46&&y<.22&&fr(y*5)<.85)
   ||(abs(ax-.15)<.09&&y>.18&&y<.96&&fr(y*4)<.88))?Z():false},
 br:(x,y)=>{const e=(x/.9)**2+(y/.68)**2;return((e<1&&e>.6)||(e<=.6&&abs(y-.18*sin(x*11))<.035)||(abs(x-.2)<.07&&y>.55&&y<.92))?Z():false}, // brain
 cp:(x,y)=>{const a=abs(x),b=abs(y),M=Math.max(a,b),m=Math.min(a,b);return((M<.55&&M>.5)||(M<.28&&M>.22)||(M>.58&&M<.85&&m<.5&&fr(m*7)<.4)||M<.12)?Z():false}, // processor
 ey:(x,y)=>{const r=hy(x,y);if(abs(abs(y)-.5*(1-x*x))<.035)return 0;if(r<.14)return .55;if(r<.3&&(r>.25||R()<.12))return .3;return false}, // eye (iris/pupil have depth -> follow mouse)
 ln:(x,y)=>{const r=hy(x,y);return abs(r-.92)<.03?0:abs(r-.62)<.03?.2:(abs(r-.34)<.03||(r<.34&&abs(sin(atan2(y,x)*3))<.06))?.45:false}, // lens + blades
 ht:(x,y)=>{const u=x*1.3,v=.25-y*1.3;return((u*u+v*v-1)**3-u*u*v**3<0)?Z():false}, // heart
 wv:(x,y)=>(abs(y-.45*sin(x*8))<.035||abs(y+.15+.3*sin(x*13))<.03||(y>.55&&y<.55+.4*abs(sin(x*5))&&fr(x*9)<.3))?Z():false, // signal waves
 bl:(x,y)=>(C4.some(([a,b])=>hy(x-a,y-b)<.27&&(R()<.5||hy(x-a,y-b)>.22))||(abs(abs(x)-.5)<.02&&abs(y)<.5)||(abs(abs(y)-.5)<.02&&abs(x)<.5))?Z():false,
 sq:(x,y)=>(C4.some(([a,b])=>Math.max(abs(x-a),abs(y-b))<.25&&(R()<.5||Math.max(abs(x-a),abs(y-b))>.2))||(abs(abs(x)-.5)<.02&&abs(y)<.5)||(abs(abs(y)-.5)<.02&&abs(x)<.5))?Z():false,
 sp:(x,y)=>{const r=hy(x,y),d=fr((r-.05)/.3-(atan2(y,x)+PI)/(2*PI));return r<.95&&(d<.1||d>.9)?Z():false}, // organic spiral sketch
 gn:(x,y)=>{const a=abs(x),b=abs(y),M=Math.max(a,b);return M<.95&&(fr(M*5)<.14||abs(a-b)<.025)?Z():false}, // generative lattice
 sw:(x,y)=>{const r=hy(x,y);return r<.95&&fr(r*2.2-atan2(y,x)/PI)<.2?Z():false}, // merging swirl
 sy:(x,y)=>{const r=hy(x,y);return(abs(r-.8)<.035||(r<.8&&abs(abs(x)-abs(y))<.04)||r<.1)?Z():false} // final unified symbol: ring + ×
};
const STC=[0,0,0,0,.4,.3,.35,1,1]; // per-stage convergence toward screen centre

let W,H,D,mob,S,rad,GS=[],NH=0,N=0,built='',F=[],NB=[],tops=[],hs=[],rx,ry,rz,tv,ox,oy,pxs,pys,pb,szs;
const stages=()=>[[SH.hs,SH.ms],[SH.br,SH.cp],[SH.ey,SH.ln],[SH.ht,SH.wv],[SH.bl,SH.sq],[SH.sp,SH.gn],
 [hand(0),hand(1),mob?PI:PI/2,mob?0:-PI/2],[SH.sw,SH.sw],[SH.sy,SH.sy]];
function build(test,n,rot=0){const a=new Float32Array(n*3),cr=cos(rot),sr=sin(rot);let k=0,g=0;
 while(k<n&&g++<n*600){const x=R()*2-1,y=R()*2-1,z=test(x,y);if(z===false)continue;a[k*3]=x*cr-y*sr;a[k*3+1]=x*sr+y*cr;a[k*3+2]=z;k++}
 for(;k<n;k++){const s=(R()*k|0)*3;a[k*3]=a[s];a[k*3+1]=a[s+1];a[k*3+2]=a[s+2]}return a}

/* ---------- reusable particle API ---------- */
function rebuild(){ // responsive particle count; formations rebuilt only when tier changes
 const n=W<700?400:W<1100?520:850,key=n+''+mob;if(key===built)return;built=key;NH=n;N=n*2;seed=11;
 F=stages().map(s=>[build(s[0],n,s[2]||0),build(s[1],n,s[3]||0)]);
 NB=F.map(p=>p.map(a=>{const nb=new Uint16Array(n);for(let i=0;i<n;i++){let b=i,bd=9;for(let q=0;q<10;q++){const j=R()*n|0;if(j===i)continue;const d=hy(a[i*3]-a[j*3],a[i*3+1]-a[j*3+1]);if(d<bd){bd=d;b=j}}nb[i]=b}return nb}));
 const fa=()=>Float32Array.from({length:N},()=>R()*2-1);rx=fa();ry=fa();rz=fa();tv=Float32Array.from({length:N},()=>.3+R()*.7);
 ox=new Float32Array(N);oy=new Float32Array(N);pxs=new Float32Array(N);pys=new Float32Array(N);szs=new Float32Array(N);pb=new Uint8Array(N)}
/* assembleParticles / disassembleParticles / moveParticlesToTarget / scrollTransition are one continuous
   function of (fs): tt=0 -> assembled at stage a, tt=1 -> assembled at stage b, bu=burst (disassembly) in between. */
function resetParticles(){ox&&ox.fill(0);oy&&oy.fill(0)}
function size(){W=innerWidth;H=innerHeight;
 mob=matchMedia('(max-width:768px) and (orientation:portrait)').matches; // stacked layout only on portrait phones/small tablets
 D=Math.min(devicePixelRatio||1,W<=1100?1.5:2);
 cv.width=W*D;cv.height=H*D;cv.style.width=W+'px';cv.style.height=H+'px';c.setTransform(D,0,0,D,0,0);
 S=mob?Math.min(W*.4,H*.14):Math.min(W*.2,H*.3);rad=W<=1100?80:130;rebuild();measure();geo()}
/* Longer comparison copy needs room: measure the caption block (.cmp) and title in THINK→MOVE, then derive a figure
   size/position that fits between them. Where the original layout already fits it is kept exactly (no change). */
function geo(){
 const O={S,y:H*(mob?.5:.54),hs:H*.165},cm=secs.slice(1,7).map(s=>s.querySelector('.cmp')).filter(Boolean),
       hd=secs.slice(1,7).map(s=>s.querySelector('h2')).filter(Boolean);
 let G=O;
 if(cm.length&&hd.length){
  const capTop=Math.min(...cm.map(e=>e.offsetTop)),titleBot=Math.max(...hd.map(e=>e.offsetTop+e.offsetHeight)),
        top0=titleBot+Math.max(8,H*.012),bot0=capTop-Math.max(10,H*.02),Hr=Math.max(80,bot0-top0);
  if(mob){const gp=Math.max(H*.05,40);   // gap keeps the FEEL question between the two figures
   if(O.y-O.hs-S>=top0&&O.y+O.hs+S<=bot0)G=O;
   else{const eS=Math.max(22,Math.min(S,(Hr-gp)/4));G={S:eS,y:(top0+bot0)/2,hs:eS+gp/2}}}
  else{const sh=.04*H,eS=Math.max(40,Math.min(S,(Hr-sh)/2*.96));G={S:eS,y:cl(O.y,top0+eS+sh,bot0-eS),hs:0}}}
 GS=[O,G,G,G,G,G,G,O,O];   // hero and final keep the original geometry
 document.documentElement.style.setProperty('--midy',mob?G.y+'px':'50%')}
function measure(){tops=secs.map(s=>s.offsetTop);hs=secs.map(s=>Math.max(1,s.offsetHeight-H))}

/* ---------- input: mouse / touch / device tilt ---------- */
let mx=0,my=0,mxT=0,myT=0,cxp=-999,cyp=-999;
const cxTo=gsap.quickTo(ring,'x',{duration:.35}),cyTo=gsap.quickTo(ring,'y',{duration:.35});
const mv=(x,y)=>{mxT=x/W*2-1;myT=y/H*2-1;cxp=x;cyp=y;cxTo(x);cyTo(y);gsap.set(dot,{x,y})};
addEventListener('pointermove',e=>mv(e.clientX,e.clientY),{passive:true});
addEventListener('touchmove',e=>mv(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
addEventListener('touchend',()=>{cxp=cyp=-999},{passive:true});
document.addEventListener('mouseleave',()=>{cxp=cyp=-999});
addEventListener('deviceorientation',e=>{if(e.gamma==null||!mob)return;mxT=cl(e.gamma/30,-1,1);myT=cl((e.beta-40)/30,-1,1)},{passive:true});
document.addEventListener('pointerover',e=>ring.classList.toggle('hov',!!e.target.closest('a,button')));

/* ---------- main loop ---------- */
let fs=0,ft=0,last=0,act=-1,bl=-1;const intro={p:0};
const COL=['#ff5a3c','#ffb18a','#2fc9ff','#c4f6ff'];
function frame(t){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,(t-last)/1000||.016),time=t/1000;last=t;
 // scroll -> continuous stage float (section i spans stage i -> i+1)
 // stage i is fully assembled at the MIDDLE of section i (so its title is on screen); transitions happen across section boundaries
 const y=scrollY;let i=0;while(i<7&&y>=tops[i+1]-1)i++;
 const ts=cl((y-tops[i])/hs[i]);
 ft=i===0?.3+.2*ts:i===7?6.5+1.5*ts:i-.5+ts;   // hero starts breaking apart right away; final section has 2 stages
 fs+=(ft-fs)*(1-Math.exp(-dt*4));mx+=(mxT-mx)*(1-Math.exp(-dt*5));my+=(myT-my)*(1-Math.exp(-dt*5));
 c.clearRect(0,0,W,H);
 const a=Math.min(fs|0,7),b=a+1,tt=ss((fs-a-.3)/.4),
   bu=Math.max(sin(PI*tt),(1-intro.p)*(1-cl(fs))),   // burst = how disassembled the particles are
   cg=STC[a]+(STC[b]-STC[a])*tt,ga=GS[a],gb=GS[b],S_=ga.S+(gb.S-ga.S)*tt,Y_=ga.y+(gb.y-ga.y)*tt,HS_=ga.hs+(gb.hs-ga.hs)*tt,
   Sx=S_*(1+Math.max(0,cg-.5)),
   bt=Math.exp(-fr(time*1.1)*7)*(.03+.07*cl(1-abs(fs-3)));  // heartbeat pulse (strongest in FEEL)
 const ax=[0,0],ay=[0,0];
 for(let s=0;s<2;s++){const d=s?1:-1;
  if(mob){ax[s]=W/2;ay[s]=Y_+d*HS_*(1-cg**2.2)-.04*H*cg}else{ax[s]=W/2+d*W*.25*(1-cg);ay[s]=Y_-.1*H*cg}}
 // human tilts more/softer, machine less/crisper; depth (z) makes foreground move more
 const T=[0,1].map(s=>{const ry_=mx*(s?.35:.5)+sin(time*.25)*.05,rx_=-my*(s?.25:.35);return[cos(ry_),sin(ry_),cos(rx_),sin(rx_)]});
 const FA=F[a],FB=F[b];
 for(let k=0;k<N;k++){
  const s=k&1,o=(k>>1)*3,A=FA[s],B=FB[s],q=T[s];
  let X=(A[o]+(B[o]-A[o])*tt)*Sx,Y=(A[o+1]+(B[o+1]-A[o+1])*tt)*Sx,Zz=(A[o+2]+(B[o+2]-A[o+2])*tt)*Sx;
  if(!s){const w=Sx*.012;X+=sin(time*.9+k)*w;Y+=cos(time*.8+k*.7)*w;X*=1+bt;Y*=1+bt}   // organic breathing
  X+=rx[k]*bu*Sx*1.4;Y+=ry[k]*bu*Sx*1.4;Zz+=rz[k]*bu*Sx*1.5+bu*Sx*.5;                  // scatter + camera push
  const x1=X*q[0]+Zz*q[1],z1=Zz*q[0]-X*q[1],y1=Y*q[2]-z1*q[3],z2=Y*q[3]+z1*q[2],kk=1/(1-cl(z2/(Sx*5),-.5,.6));
  const tr=bu*tv[k]*.6;                                                                    // horizontal travel toward centre
  let X2=ax[s]+(W/2-ax[s])*tr+x1*kk+mx*Zz*.05,Y2=ay[s]+(H*.5-ay[s])*tr+y1*kk;
  // mouseInteraction(): human particles drift toward cursor, machine particles are pushed away
  const dx=X2-cxp,dy=Y2-cyp,d=hy(dx,dy)+.01;let tx=0,ty=0;
  if(d<rad){const f=(1-d/rad)**2*(s?16:-20);tx=dx/d*f;ty=dy/d*f}
  ox[k]+=(tx-ox[k])*.12;oy[k]+=(ty-oy[k])*.12;
  pxs[k]=X2+ox[k];pys[k]=Y2+oy[k];pb[k]=s*2+(z2>0?1:0);szs[k]=(mob?1.2:1.5)*kk*(z2>0?1.3:1);
 }
 c.globalCompositeOperation='lighter';
 // neural / circuit connections between nearest neighbours of the current formation
 const nr=tt>.5?b:a,L=Sx*.2,la=(1-bu)**2;
 if(la>.05)for(let s=0;s<2;s++){const nb=NB[nr][s];c.strokeStyle=s?'#2fc9ff':'#ff6a4d';c.globalAlpha=la*(.12+.1*sin(time*2.2+s*2));c.lineWidth=.6;c.beginPath();
  for(let j=0;j<NH;j+=2){const k=j*2+s,k2=nb[j]*2+s;if(hy(pxs[k]-pxs[k2],pys[k]-pys[k2])<L){c.moveTo(pxs[k],pys[k]);c.lineTo(pxs[k2],pys[k2])}}c.stroke()}
 // dots: circles for human, squares for machine, batched by side + depth
 for(let bk=0;bk<4;bk++){c.fillStyle=COL[bk];c.globalAlpha=bk&1?.95:.6;c.beginPath();
  for(let k=bk>>1;k<N;k+=2){if(pb[k]!==bk)continue;const x=pxs[k],y=pys[k],z=szs[k];
   if(bk<2){c.moveTo(x+z,y);c.arc(x,y,z,0,6.283)}else c.rect(x-z,y-z,z*2,z*2)}c.fill()}
 c.globalAlpha=1;
 // HUD: nav state, divider reacts to mouse and disappears for the final merge, background depth shift
 const ac=Math.round(fs);if(ac!==act){act=ac;links.forEach((l,n)=>l.classList.toggle('on',n===ac-1))}
 const cs=fs>6.6?'mix':cxp<W/2?'hum':'mac';if(ring.dataset.s!==cs)ring.dataset.s=cs; // cursor changes with the world it is over
 div.style.opacity=cl(1-(fs-5.5));
 div.style.transform=mob?`translateY(${my*10}px)`:`translateX(${mx*14}px) rotate(${mx*1.5}deg)`;
 vig.style.transform=`translate3d(${-mx*20}px,${-my*14}px,0)`;
 if(!mob){const b2=Math.round(bu*bu*20)/10;if(b2!==bl){bl=b2;cv.style.filter=b2?`blur(${b2}px)`:'none'}}
}

/* ---------- GSAP ScrollTrigger: text choreography (scrubbed) ---------- */
function text(){
 secs.forEach((s,i)=>{
  const tl=gsap.timeline({scrollTrigger:{trigger:s,start:'top top',end:'bottom bottom',scrub:.8}});
  if(i===7){ // final: three beats, each fades + de-blurs in and out
   const beat=(el,a,b,keep)=>{tl.fromTo(el,{opacity:0,y:40,filter:'blur(14px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.08},a);
    if(!keep)tl.to(el,{opacity:0,y:-30,filter:'blur(10px)',duration:.07},b)};
   beat('.q1',.03,.17);beat('.q2',.2,.34);beat('.q3',.37,.52);beat('.q4',.55,.68);
   tl.fromTo('.big',{opacity:0,letterSpacing:'.5em',scale:1.15,filter:'blur(18px)'},{opacity:1,letterSpacing:'.08em',scale:1,filter:'blur(0px)',duration:.14},.72);
   beat('.small',.86,1,true);tl.to({},{duration:.01},.99);return}
  const rv=s.querySelectorAll('.rv'),t=s.querySelector('.t');
  if(i>0){tl.fromTo(rv,{opacity:0,y:50,filter:'blur(16px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.1,stagger:.012},0);
   tl.fromTo(t,{letterSpacing:'.45em',skewX:-12},{letterSpacing:'.06em',skewX:0,duration:.14},0)}   // text distortion
  const o=i?.84:.08; // hero text leaves as soon as the silhouettes break apart
  tl.fromTo(rv,{opacity:1,y:0,filter:'blur(0px)'},{opacity:0,y:-50,filter:'blur(14px)',duration:.1,immediateRender:false},o);
  tl.to(t,{letterSpacing:'.3em',skewX:10,duration:.12,immediateRender:false},o);
  tl.to({},{duration:.001},.999); // pad timeline so positions map 1:1 to scroll progress
 })
}

/* ---------- nav ---------- */
$('.burger').addEventListener('click',()=>{const o=hdr.classList.toggle('open');$('.burger').setAttribute('aria-expanded',o)});
links.forEach(l=>l.addEventListener('click',e=>{e.preventDefault();hdr.classList.remove('open');
 const i=secs.findIndex(s=>'#'+s.id===l.getAttribute('href'));scrollTo({top:tops[i]+(i===7?.33:.5)*hs[i],behavior:'smooth'})}));
$('.logo').addEventListener('click',e=>{e.preventDefault();hdr.classList.remove('open');scrollTo({top:0,behavior:'smooth'})});

size();text();
// ignore tiny height-only resizes (mobile address bar hiding) so nothing rebuilds/jumps while scrolling
let rt;addEventListener('resize',()=>{if(innerWidth===W&&abs(innerHeight-H)<150)return;
 clearTimeout(rt);rt=setTimeout(()=>{size();ScrollTrigger.refresh();measure()},150)});
gsap.to(intro,{p:1,duration:3.2,ease:'power2.out',delay:.2}); // hero: particles slowly assemble into the two silhouettes
document.fonts&&document.fonts.ready.then(geo);
requestAnimationFrame(frame);
})();
