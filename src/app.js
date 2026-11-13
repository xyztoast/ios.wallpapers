const $=s=>document.querySelector(s);let segC=[],pickCb=null;
const h=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const SIZES={'iPhone 1170x2532':[1170,2532],'iPhone Max 1290x2796':[1290,2796],'Square 2000x2000':[2000,2000],'Landscape 2560x1440':[2560,1440],'Portrait 1080x1920':[1080,1920]};
const BM=['source-over','multiply','screen','overlay','soft-light','hard-light','lighten','darken','color-dodge','difference'].map(v=>[v,v=='source-over'?'normal':v]);
const uid=()=>Math.random().toString(36).slice(2,8),imgs={},mimgs={},clamp=v=>Math.max(0,Math.min(1,v));
let doc,sel=null,zoom=.3,hist=[],fut=[],tab='add';
const fresh=()=>({w:1170,h:2532,stops:[{c:'#5ee7c5',p:0},{c:'#b9f5d6',p:1}],gtype:'linear',gang:160,grain:.08,bgSrc:'',bgBlur:0,objs:[]});
const fixS=x=>{if(!x.stops)x.stops=[{c:x.fill,p:0},{c:x.fill2,p:1}];return x};
const mk=(t,o={})=>fixS({id:uid(),type:t,name:t,x:doc.w/2,y:doc.h/2,w:600,h:600,rot:0,fill:'#ffd36b',fill2:'#ff5e7e',op:1,blur:0,vis:1,text:'Hello',rad:40,bm:'source-over',glass:0,refr:.69,ca:.05,gb:.25,fres:1,spec:0,edge:.05,dist:0,sat:0,br:0,bev:40,ta:0,so:.3,ss:10,bmode:0,mask:'none',msrc:'',gtype:'linear',gang:135,...o});
// ---- color utils ----
const hx=c=>{c=c.replace('#','');if(c.length==6)c+='ff';return[0,2,4,6].map(i=>parseInt(c.substr(i,2),16))};
const toHex=(r,g,b,a)=>'#'+[r,g,b,a].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let H=0;if(d){H=M==r?((g-b)/d)%6:M==g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360}return[H,M?d/M:0,M]}
function hsv2rgb(H,S,V){const f=n=>{const k=(n+H/60)%6;return(V-V*S*Math.max(0,Math.min(k,4-k,1)))*255};return[f(5),f(3),f(1)]}
// ---- liquid glass (ybouane/liquidglass, vendored in /vendor) ----
const ST=$('#stage');let LGi=null,LGsig='',LGv=0,gEls={};
const isG=o=>o.glass&&(o.type=='rect'||o.type=='circle')&&o.vis;
const gcfg=(o,z)=>({cornerRadius:(o.type=='circle'?Math.min(o.w,o.h)/2:Math.min(o.rad,o.w/2,o.h/2))*z,zRadius:Math.max(1,Math.min(o.bev,Math.min(o.w,o.h)/2)*z),refraction:o.refr,chromAberration:o.ca,edgeHighlight:o.edge,specular:o.spec,fresnel:o.fres,blurAmount:o.gb,tintStrength:o.ta,saturation:o.sat,opacity:o.op,distortion:o.dist,brightness:o.br,shadowOpacity:o.so,shadowSpread:o.ss,bevelMode:+o.bmode});
function gStyle(e,o,z){const s=e.style;s.position='absolute';s.left=(o.x-o.w/2)*z+'px';s.top=(o.y-o.h/2)*z+'px';s.width=o.w*z+'px';s.height=o.h*z+'px';s.pointerEvents='none';s.isolation='isolate';s.transform=`rotate(${o.rot}deg)`;e._rot=o.rot;e.dataset.config=JSON.stringify(gcfg(o,z))}
function layout(){const L=[{t:'c',objs:[]}];for(const o of doc.objs){if(window.LiquidGlass&&isG(o))L.push({t:'g',o},{t:'c',objs:[]});else L[L.length-1].objs.push(o)}return L.filter((i,n)=>i.t=='g'||i.objs.length||n==0)}
function paint(L){const W=Math.round(doc.w*zoom),H=Math.round(doc.h*zoom);let k=0;L.forEach(i=>{if(i.t!='c')return;const a=segC[k];a.width=W;a.height=H;render(a.getContext('2d'),zoom,W,H,i.objs,k==0);k++})}
async function sync(){const L=layout(),sig=L.map(i=>i.t=='c'?'c':i.o.id).join(),root=$('#root');ST.style.width=Math.round(doc.w*zoom)+'px';ST.style.height=Math.round(doc.h*zoom)+'px';
 if(sig!==LGsig){LGsig=sig;const my=++LGv;if(LGi){LGi.destroy();LGi=null}root.innerHTML='';gEls={};segC=[];
  L.forEach(i=>{if(i.t=='c'){const k=h('canvas');k.style.cssText='position:absolute;left:0;top:0';segC.push(k);root.append(k)}else{const e=h('div');gEls[i.o.id]=e;root.append(e)}});
  paint(L);L.forEach(i=>{if(i.t=='g')gStyle(gEls[i.o.id],i.o,zoom)});
  if(L.some(i=>i.t=='g')){try{const inst=await LiquidGlass.init({root,glassElements:Object.values(gEls)});if(my!==LGv){inst.destroy();return}LGi=inst}catch(x){console.error(x);toast('Liquid glass failed to start, see console')}}
  else if(!window.LiquidGlass&&doc.objs.some(isG))toast('Glass library failed to load, showing a plain fallback')}
 else{paint(L);L.forEach(i=>{if(i.t=='g'&&gEls[i.o.id])gStyle(gEls[i.o.id],i.o,zoom)});LGi&&segC.forEach(k=>LGi.markChanged(k))}}
const frames=n=>new Promise(r=>{const f=()=>--n<=0?setTimeout(r,250):requestAnimationFrame(f);f()});
async function exportCanvas(){const W=doc.w,H=doc.h,out=h('canvas');out.width=W;out.height=H;const c=out.getContext('2d');
 if(!window.LiquidGlass||!doc.objs.some(isG)){render(c,1,W,H,doc.objs,true);return out}
 const st=h('div');st.style.cssText=`position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:-1;pointer-events:none`;document.body.append(st);
 const order=[],els=[];let n=0;layout().forEach(i=>{if(i.t=='c'){const a=h('canvas');a.width=W;a.height=H;a.style.cssText='position:absolute;left:0;top:0';render(a.getContext('2d'),1,W,H,i.objs,n++==0);st.append(a);order.push(a)}else{const e=h('div');gStyle(e,i.o,1);st.append(e);els.push(e);order.push(e)}});
 try{const inst=await LiquidGlass.init({root:st,glassElements:els});await frames(8);const R=st.getBoundingClientRect();
  order.forEach(e=>{if(e.tagName=='CANVAS'){c.drawImage(e,0,0);return}const k=e.querySelector('canvas');if(!k)return;const r=e.getBoundingClientRect();c.save();c.translate(r.left-R.left+r.width/2,r.top-R.top+r.height/2);c.rotate(e._rot*Math.PI/180);c.drawImage(k,-k.offsetWidth/2,-k.offsetHeight/2,k.offsetWidth,k.offsetHeight);c.restore()});inst.destroy()}catch(x){console.error(x);toast('Glass export failed, exported without glass');render(c,1,W,H,doc.objs,true)}
 st.remove();return out}
function ov(){const o2=$('#ov');o2.width=Math.round(doc.w*zoom);o2.height=Math.round(doc.h*zoom);const c=o2.getContext('2d'),o=get(sel);if(!o)return;const s=zoom;c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.strokeStyle='#0a84ff';c.lineWidth=2;c.strokeRect(-o.w*s/2,-o.h*s/2,o.w*s,o.h*s);c.fillStyle='#fff';c.fillRect(o.w*s/2-8,o.h*s/2-8,16,16)}
// ---- gradients ----
function grad(c,st,type,ang,x,y,w,h){const cx=x+w/2,cy=y+h/2,a=ang*Math.PI/180;let g;
 if(type=='radial')g=c.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(w,h)/2);
 else if(type=='conic'&&c.createConicGradient)g=c.createConicGradient(a,cx,cy);
 else{const r=(Math.abs(w*Math.sin(a))+Math.abs(h*Math.cos(a)))/2;g=c.createLinearGradient(cx-Math.sin(a)*r,cy+Math.cos(a)*r,cx+Math.sin(a)*r,cy-Math.cos(a)*r)}
 [...st].sort((p,q)=>p.p-q.p).forEach(t=>g.addColorStop(clamp(t.p),t.c));return g}
// ---- render engine ----
let noise;function grainTile(){noise=h('canvas');noise.width=noise.height=256;const c=noise.getContext('2d'),d=c.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=Math.random()*255;d.data[i+3]=255}c.putImageData(d,0,0)}
function blobPath(c,w,h){const a=w/2,b=h/2;c.beginPath();c.moveTo(0,-b);c.bezierCurveTo(a*.9,-b,a,-b*.2,a*.8,b*.3);c.bezierCurveTo(a*.6,b,a*.1,b,-a*.3,b*.9);c.bezierCurveTo(-a,b*.8,-a,-b*.1,-a*.7,-b*.5);c.bezierCurveTo(-a*.5,-b*.9,-a*.2,-b,0,-b);c.closePath()}
const get=id=>doc.objs.find(o=>o.id==id);
function render(c,s,W,H,list,withBg){
 c.globalCompositeOperation='source-over';c.filter='none';c.globalAlpha=1;
 if(withBg){c.fillStyle=grad(c,doc.stops,doc.gtype,doc.gang,0,0,W,H);c.fillRect(0,0,W,H);if(doc.bgSrc&&imgs.bg&&imgs.bg.complete){const im=imgs.bg,k=Math.max(W/im.naturalWidth,H/im.naturalHeight),iw=im.naturalWidth*k,ih=im.naturalHeight*k;c.filter=doc.bgBlur?`blur(${doc.bgBlur*s}px)`:'none';c.drawImage(im,(W-iw)/2,(H-ih)/2,iw,ih);c.filter='none'}}
 for(const o of list){if(!o.vis)continue;if(o.glass&&(o.type=='rect'||o.type=='circle')){if(!window.LiquidGlass){c.save();c.translate(o.x*s,o.y*s);c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.roundRect(-o.w*s/2,-o.h*s/2,o.w*s,o.h*s,Math.min(o.type=='circle'?1e5:o.rad*s,o.w*s/2,o.h*s/2));c.fill();c.restore()}continue}
  c.save();c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.globalAlpha=o.op;c.globalCompositeOperation=o.bm;c.filter=o.blur?`blur(${o.blur*s}px)`:'none';
  const w=o.w*s,hh=o.h*s;c.fillStyle=grad(c,o.stops,o.gtype,o.gang,-w/2,-hh/2,w,hh);
  if(o.type=='circle'){c.beginPath();c.ellipse(0,0,w/2,hh/2,0,0,7);c.fill()}
  else if(o.type=='rect'){c.beginPath();c.roundRect(-w/2,-hh/2,w,hh,Math.min(o.rad*s,w/2,hh/2));c.fill()}
  else if(o.type=='blob'){blobPath(c,w,hh);c.fill()}
  else if(o.type=='text'){c.font=`700 ${hh*.8}px -apple-system,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(o.text,0,0)}
  else if((o.type=='img'||o.type=='shape')&&imgs[o.id]?.complete){const t=h('canvas');t.width=Math.max(1,Math.round(w));t.height=Math.max(1,Math.round(hh));const x=t.getContext('2d');
   if(o.type=='shape'){x.fillStyle=grad(x,o.stops,o.gtype,o.gang,0,0,t.width,t.height);x.fillRect(0,0,t.width,t.height);x.globalCompositeOperation='destination-in';x.drawImage(imgs[o.id],0,0,t.width,t.height)}
   else{x.drawImage(imgs[o.id],0,0,t.width,t.height);x.globalCompositeOperation='destination-in';if(o.mask=='circle'){x.beginPath();x.ellipse(t.width/2,t.height/2,t.width/2,t.height/2,0,0,7);x.fill()}else if(o.mask=='rounded'){x.beginPath();x.roundRect(0,0,t.width,t.height,Math.min(o.rad*s,t.width/2,t.height/2));x.fill()}else if(o.mask=='png'&&mimgs[o.id]&&mimgs[o.id].complete)x.drawImage(mimgs[o.id],0,0,t.width,t.height)}
   c.drawImage(t,-w/2,-hh/2)}
  c.restore()}
 if(withBg&&doc.grain>0){c.save();c.globalAlpha=doc.grain;c.globalCompositeOperation='overlay';c.fillStyle=c.createPattern(noise,'repeat');c.fillRect(0,0,W,H);c.restore()}}
function draw(){sync();ov();ui()}
function toast(m){const t=$('#toast');t.className='gl';t.textContent=m;t.style.display='block';clearTimeout(t._t);t._t=setTimeout(()=>t.style.display='none',3500)}
// ---- history + storage ----
function commit(){hist.push(JSON.stringify(doc));if(hist.length>80)hist.shift();fut=[];save()}
function restore(j){doc=JSON.parse(j);if(!get(sel))sel=null;$('#in').dataset.k='';draw();save()}
$('#undo').onclick=()=>{if(hist.length>1){fut.push(hist.pop());restore(hist[hist.length-1])}};
$('#redo').onclick=()=>{if(fut.length){const j=fut.pop();hist.push(j);restore(j)}};
const idb=()=>new Promise(r=>{const q=indexedDB.open('wallpaper-studio',1);q.onupgradeneeded=()=>q.result.createObjectStore('p');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});
let tm;function save(){clearTimeout(tm);tm=setTimeout(async()=>{const d=await idb();if(d)d.transaction('p','readwrite').objectStore('p').put({doc,name:$('#name').value},'cur')},400)}
// ---- custom popovers, dropdown, color picker ----
const pop=$('#pop');
function closePop(){pop.innerHTML='';if(pop._c){const f=pop._c;pop._c=null;f()}}
function openPop(a,n,onClose){closePop();n.classList.add('gl','pp');pop.append(n);pop._c=onClose;const r=a.getBoundingClientRect();n.style.left=Math.max(8,Math.min(r.left,innerWidth-n.offsetWidth-8))+'px';n.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-n.offsetHeight-8))+'px'}
addEventListener('pointerdown',e=>{if(!e.target.closest('.pp')&&!e.target.closest('[data-pp]'))closePop()},true);
function dd(opts,val,cb){const b=h('button','btn dd');b.dataset.pp=1;b.textContent=(opts.find(x=>x[0]==val)||opts[0])[1];
 b.onclick=()=>{const n=h('div');opts.forEach(([v,l])=>{const i=h('button','it'+(v==val?' on':''),l);i.onclick=()=>{val=v;b.textContent=l;closePop();cb(v)};n.append(i)});openPop(b,n)};return b}
let recent=[];try{recent=JSON.parse(localStorage.rc||'[]')}catch(e){}
const PAL=['#ffffff','#000000','#ff3b30','#ff9500','#ffd60a','#34c759','#5ee7c5','#0a84ff','#bf5af2','#ff2d55'];
function cp(o,k,cb=draw){const b=h('button','sw');b.dataset.pp=1;const paint=()=>b.style.setProperty('--c',o[k]);paint();
 b.onclick=()=>{const[r0,g0,b0,a0]=hx(o[k]);let[H,S,V]=rgb2hsv(r0,g0,b0),A=a0/255;
  const n=h('div','cpk');n.innerHTML='<div class="sv"><i></i></div><div class="mut">Hue</div><input type="range" class="rng hue" min="0" max="360"><div class="mut">Opacity</div><input type="range" class="rng" min="0" max="100"><input class="in hex" spellcheck="false"><div class="sws"></div>';
  const sv=n.querySelector('.sv'),dot=sv.firstChild,[hu,al]=n.querySelectorAll('.rng'),hex=n.querySelector('.hex');
  const upd=src=>{const[r,g,bb]=hsv2rgb(H,S,V);o[k]=toHex(r,g,bb,A*255);paint();sv.style.setProperty('--h',H);dot.style.left=S*100+'%';dot.style.top=(1-V)*100+'%';if(src!=1)hu.value=H;al.value=A*100;al.style.setProperty('--p',A*100+'%');if(src!=2)hex.value=o[k];cb()};
  const setC=c=>{const[r,g,bb,a]=hx(c);[H,S,V]=rgb2hsv(r,g,bb);A=a/255;upd()};
  const mv=e=>{const q=sv.getBoundingClientRect();S=clamp((e.clientX-q.left)/q.width);V=1-clamp((e.clientY-q.top)/q.height);upd()};
  sv.onpointerdown=e=>{sv.setPointerCapture(e.pointerId);mv(e);sv.onpointermove=mv};sv.onpointerup=()=>sv.onpointermove=null;
  hu.oninput=()=>{H=+hu.value;upd(1)};al.oninput=()=>{A=al.value/100;upd()};
  hex.oninput=()=>{if(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex.value))setC(hex.value)};
  const eye=h('button','btn','Eyedropper');eye.style.marginTop='8px';eye.onclick=async()=>{if(window.EyeDropper){try{const r=await new EyeDropper().open();setC(r.sRGBHex)}catch(e){}}else{closePop();pickCb=x=>{o[k]=x;cb();commit();$('#in').dataset.k='';draw()};toast('Click the artboard to pick a color')}};n.append(eye);
  [...recent,...PAL].slice(0,16).forEach(c=>{const s=h('button','sw s');s.style.setProperty('--c',c);s.onclick=()=>setC(c);n.querySelector('.sws').append(s)});
  openPop(b,n,()=>{commit();recent=[o[k],...recent.filter(x=>x!=o[k])].slice(0,8);try{localStorage.rc=JSON.stringify(recent)}catch(e){}});upd()};return b}
function pixelAt(x,y){const t=h('canvas');t.width=t.height=1;const c=t.getContext('2d');segC.forEach(k=>c.drawImage(k,-x,-y));const d=c.getImageData(0,0,1,1).data;return toHex(d[0],d[1],d[2],255)}
// ---- inspector ----
function row(l,...e){const d=h('div','r');d.append(h('label','',l),...e);return d}
function tx(o,k){const i=h('input','in');i.value=o[k];i.oninput=()=>{o[k]=i.value;draw()};i.onchange=commit;return i}
function rg(o,k,min,max,step=1){const d=h('div','rg'),i=h('input','rng'),n=h('input','nb');n.type='text';n.inputMode='decimal';i.type='range';i.min=min;i.max=max;i.step=step;i.value=o[k];
 const fm=v=>step<1?(+v).toFixed(2):String(Math.round(v*100)/100),p=()=>{i.style.setProperty('--p',clamp((i.value-min)/(max-min))*100+'%');n.value=fm(o[k])};
 i.oninput=()=>{o[k]=+i.value;p();draw()};i.onchange=commit;n.onfocus=()=>n.select();n.onkeydown=e=>{if(e.key=='Enter')n.blur()};
 n.onchange=()=>{const v=parseFloat(n.value);if(isFinite(v)){o[k]=v;i.value=v;commit();draw()}p()};p();d.append(i,n);return d}
function nbox(v,set){const n=h('input','nb');n.type='text';n.inputMode='decimal';n.value=Math.round(v);n.onfocus=()=>n.select();n.onkeydown=e=>{if(e.key=='Enter')n.blur()};n.onchange=()=>{const x=parseFloat(n.value);if(isFinite(x))set(Math.max(0,Math.min(100,x)));n.value=Math.round(Math.max(0,Math.min(100,parseFloat(n.value)||0)))};return n}
function gedit(o){const d=h('div','ge'),bar=h('div','gbar'),rb=()=>{$('#in').dataset.k='';draw()};
 const pb=()=>{const t=[...o.stops].sort((a,b)=>a.p-b.p);bar.style.background=t.length==1?t[0].c:`linear-gradient(90deg,${t.map(x=>x.c+' '+x.p*100+'%').join(',')})`};pb();
 d.append(bar,row('Type',dd([['linear','Linear'],['radial','Radial'],['conic','Conic']],o.gtype,v=>{o.gtype=v;commit();rb()})));
 if(o.gtype!='radial')d.append(row('Angle',rg(o,'gang',0,360)));
 o.stops.forEach((t,i)=>{const r=h('div','gs');r.append(cp(t,'c',()=>{pb();draw()}),nbox(t.p*100,v=>{t.p=v/100;pb();commit();draw()}),h('span','mut','%'));if(o.stops.length>1){const x=h('button','btn','Remove');x.onclick=()=>{o.stops.splice(i,1);commit();rb()};r.append(x)}d.append(r)});
 if(o.stops.length<5){const a=h('button','btn','Add color');a.style.margin='8px 12px';a.onclick=()=>{const l=o.stops[o.stops.length-1];o.stops.push({c:l.c,p:1});o.stops.forEach((t,j)=>t.p=j/(o.stops.length-1));commit();rb()};d.append(a)}return d}
function tg(o,k){const b=h('button','tg'+(o[k]?' on':''));b.onclick=()=>{o[k]=o[k]?0:1;commit();draw()};return b}
function insp(){const I=$('#in'),o=get(sel),key=sel+':'+(o?o.glass+(o.mask||''):'')+(doc.bgSrc?'b':'');if(I.dataset.k===key&&I.children.length)return;I.dataset.k=key;I.innerHTML='';
 const sec=(t,...r)=>{const g=h('div','grp');g.append(...r);I.append(h('h4','',t),g)};
 const bgb=h('div','rg'),up=h('button','btn','Upload');up.onclick=()=>pick('bg');bgb.append(up);if(doc.bgSrc){const rm=h('button','btn','Remove');rm.onclick=()=>{doc.bgSrc='';delete imgs.bg;commit();draw()};bgb.append(rm)}
 sec('Canvas',gedit(doc),row('Grain',rg(doc,'grain',0,.6,.01)),row('BG image',bgb),...(doc.bgSrc?[row('BG blur',rg(doc,'bgBlur',0,200))]:[]));
 if(!o){I.append(h('p','mut','Select a layer to edit it.'));return}
 const sh=!o.glass&&o.type!='img',gl=o.type=='rect'||o.type=='circle';
 sec('Appearance',row('Name',tx(o,'name')),...(o.type=='text'?[row('Text',tx(o,'text'))]:[]),row('Opacity',rg(o,'op',0,1,.01)),...(o.glass?[]:[row('Blend',dd(BM,o.bm,v=>{o.bm=v;commit();draw()}))]));
 if(sh)sec('Fill',gedit(o));
 if(o.type=='img'){const rs=[row('Mask',dd([['none','None'],['rounded','Rounded'],['circle','Circle'],['png','Custom PNG']],o.mask,v=>{o.mask=v;commit();draw()}))];if(o.mask=='png'){const u=h('button','btn',o.msrc?'Replace mask PNG':'Upload mask PNG');u.onclick=()=>pick('msk');rs.push(row('',u))}sec('Mask',...rs)}
 sec('Geometry',row('Width',rg(o,'w',20,4000)),row('Height',rg(o,'h',20,4000)),row('Rotate',rg(o,'rot',-180,180)),...((o.type=='rect'||(o.type=='img'&&o.mask=='rounded'))?[row('Radius',rg(o,'rad',0,2000))]:[]));
 if(!o.glass)sec('Effects',row('Blur',rg(o,'blur',0,300)));
 if(gl){sec('Liquid Glass',row('Enabled',tg(o,'glass')));if(o.glass)I.append(row('Refraction',rg(o,'refr',0,1,.01)),row('Aberration',rg(o,'ca',0,.3,.01)),row('Backdrop blur',rg(o,'gb',0,1,.01)),row('Fresnel',rg(o,'fres',0,1,.01)),row('Specular',rg(o,'spec',0,1,.01)),row('Edge light',rg(o,'edge',0,1,.01)),row('Distortion',rg(o,'dist',0,1,.01)),row('Z-Radius',rg(o,'bev',1,400)),row('Bevel mode',dd([[0,'Biconvex'],[1,'Dome']],o.bmode,v=>{o.bmode=+v;commit();draw()})),row('Tint',rg(o,'ta',0,1,.01)),row('Saturation',rg(o,'sat',-1,1,.01)),row('Brightness',rg(o,'br',-.5,.5,.01)),row('Shadow',rg(o,'so',0,1,.01)),row('Shadow size',rg(o,'ss',0,60)))}
 const d=h('button','btn','Duplicate');d.onclick=dup;I.append(h('h4'),d)}
// ---- left panel ----
function left(){const P=$('#lp');P.innerHTML='';
 if(tab=='add'){const g=h('div','grid');[['Rounded Rect',()=>add('rect')],['Circle',()=>add('circle')],['Blob',()=>add('blob')],['Text',()=>add('text',{h:260,w:700,fill:'#ffffff',fill2:'#ffffff'})],['Glass Rect',()=>add('rect',{glass:1,w:700,h:900,})],['Glass Circle',()=>add('circle',{glass:1,w:600,h:420})],['Image',()=>pick('img')],['PNG Shape',()=>pick('shape')],['BG Image',()=>pick('bg')]].forEach(([l,f])=>{const b=h('button','btn',l);b.onclick=f;g.append(b)});P.append(g)}
 else if(tab=='tp'){const g=h('div','grid');for(const k in TP){const b=h('button','btn',k);b.onclick=()=>useTP(k);g.append(b)}P.append(g)}
 else{[...doc.objs].reverse().forEach(o=>{const d=h('div','ly'+(o.id==sel?' s':'')),s=h('span','',o.name),mkb=(t,f)=>{const b=h('button','',t);b.onclick=f;return b};s.onclick=()=>{sel=o.id;draw()};
  const mv=n=>{const i=doc.objs.indexOf(o),j=i+n;if(j<0||j>=doc.objs.length)return;doc.objs.splice(i,1);doc.objs.splice(j,0,o);commit();draw()};
  d.append(s,mkb(o.vis?'Hide':'Show',()=>{o.vis=!o.vis;commit();draw()}),mkb('Up',()=>mv(1)),mkb('Dn',()=>mv(-1)));P.append(d)});if(!doc.objs.length)P.append(h('p','mut','No layers yet.'))}}
function ui(){if(tab=='layers')left();insp()}
[['add','Add'],['tp','Templates'],['layers','Layers']].forEach(([k,l])=>{const b=h('button',k==tab?'on':'',l);b.dataset.t=k;b.onclick=()=>{tab=k;document.querySelectorAll('#tabs button').forEach(x=>x.className=x.dataset.t==k?'on':'');left()};$('#tabs').append(b)});
function dup(){const o=get(sel);if(!o)return;const c={...o,id:uid(),x:o.x+40,y:o.y+40,stops:o.stops.map(t=>({...t}))};if(imgs[o.id])imgs[c.id]=imgs[o.id];if(mimgs[o.id])mimgs[c.id]=mimgs[o.id];doc.objs.push(c);sel=c.id;commit();draw()}
function add(t,o){const x=mk(t,o);doc.objs.push(x);sel=x.id;commit();draw()}
let fm='img';const pick=m=>{fm=m;$('#f').click()};
function useFile(f,m){if(!f||!/^image\//.test(f.type))return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
 if(m=='bg'){doc.bgSrc=r.result;imgs.bg=im}
 else if(m=='msk'){const o=get(sel);if(!o)return;o.msrc=r.result;o.mask='png';mimgs[o.id]=im}
 else{const x=mk(m=='shape'?'shape':'img',{src:r.result,w:800,h:800*im.height/im.width,name:m=='shape'?'PNG shape':'image'});imgs[x.id]=im;doc.objs.push(x);sel=x.id}
 commit();$('#in').dataset.k='';draw()};im.src=r.result};r.readAsDataURL(f)}
$('#f').onchange=e=>{useFile(e.target.files[0],fm);e.target.value=''};
ST.ondragover=e=>e.preventDefault();ST.ondrop=e=>{e.preventDefault();useFile(e.dataTransfer.files[0],'img')};
// ---- templates ----
const TP={'Mint Glass':()=>({c1:'#10b88e',c2:'#c3f7dc',ang:160,grain:.06,objs:[['circle',{fill:'#6df2cf',fill2:'#0fa984',x:300,y:600,w:1300,h:1300,blur:40}],['rect',{fill:'#f0fff8',fill2:'#a8ecd6',x:650,y:1800,w:1400,h:700,rad:300,rot:-24,op:.8,blur:30}],['rect',{glass:1,x:620,y:1250,w:760,h:1000,rad:380,rot:-12,tint:'#9ff5db',ta:.12}],['circle',{glass:1,x:720,y:2050,w:520,h:360,rot:15}]]}),'Aurora Glass':()=>({c1:'#0f2027',c2:'#2c5364',ang:200,grain:.1,objs:[['blob',{fill:'#00ffa3',fill2:'#03e1ff',blur:120,x:600,y:700,w:1100,h:700}],['blob',{fill:'#a855f7',fill2:'#6366f1',blur:140,x:500,y:1700,w:1200,h:800}],['rect',{glass:1,x:585,y:1250,w:700,h:700,rad:240,rot:20}]]}),'Sunset':()=>({c1:'#ff9966',c2:'#5b2a86',ang:170,grain:.15,objs:[['blob',{fill:'#ffe29f',fill2:'#ff719a',blur:60,x:500,y:900,w:1000,h:1000}],['circle',{fill:'#ffffff',fill2:'#ffb199',blur:30,op:.7,x:800,y:1800,w:500,h:500}],['circle',{glass:1,x:600,y:1500,w:640,h:640}]]}),'Mono':()=>({c1:'#e5e5e5',c2:'#8a8a8a',ang:120,grain:.2,objs:[['circle',{fill:'#ffffff',fill2:'#bbbbbb',blur:80,op:.8,x:600,y:900,w:900,h:900}],['rect',{fill:'#222222',fill2:'#555555',blur:40,op:.5,x:500,y:2000,w:700,h:500,rot:-20}]]})};
function useTP(k){const t=TP[k](),sx=doc.w/1170,sy=doc.h/2532;Object.assign(doc,{stops:[{c:t.c1,p:0},{c:t.c2,p:1}],gtype:'linear',gang:t.ang,grain:t.grain});doc.objs=t.objs.map(([ty,o])=>mk(ty,{...o,x:o.x*sx,y:o.y*sy,w:o.w*sx,h:o.h*sy,name:k+' '+ty}));sel=null;commit();$('#in').dataset.k='';draw()}
// ---- size + format dropdowns, zoom ----
let szb;function sizeDD(){const k=Object.keys(SIZES).find(k=>SIZES[k][0]==doc.w&&SIZES[k][1]==doc.h)||'Custom';$('#szw').innerHTML='';$('#szw').append(dd([...Object.keys(SIZES).map(x=>[x,x]),['Custom',`${doc.w}x${doc.h}`]],k,v=>{if(v=='Custom')return;const[w,hh]=SIZES[v],sx=w/doc.w,sy=hh/doc.h;doc.objs.forEach(o=>{o.x*=sx;o.y*=sy;o.w*=sx;o.h*=sy;o.rad*=Math.min(sx,sy)});doc.w=w;doc.h=hh;commit();fit()}))}
let fmt='png';$('#fmw').append(dd([['png','PNG'],['jpeg','JPEG'],['webp','WebP']],'png',v=>fmt=v));
function fit(){const m=$('#M');zoom=Math.max(.02,Math.min((m.clientWidth-48)/doc.w,(m.clientHeight-48)/doc.h));$('#zoom').value=zoom*100;sizeDD();draw()}
$('#zoom').oninput=e=>{zoom=e.target.value/100;draw()};
// ---- pointer ----
let drag=null;const loc=(o,px,py)=>{const a=-o.rot*Math.PI/180,dx=px-o.x,dy=py-o.y;return[dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a)]};
ST.onpointerdown=e=>{if(pickCb){const q=ST.getBoundingClientRect(),f=pickCb;pickCb=null;f(pixelAt(Math.floor(e.clientX-q.left),Math.floor(e.clientY-q.top)));return}closePop();const q=ST.getBoundingClientRect(),px=(e.clientX-q.left)/zoom,py=(e.clientY-q.top)/zoom;ST.setPointerCapture(e.pointerId);const s=get(sel);
 if(s){const[lx,ly]=loc(s,px,py);if(Math.abs(lx-s.w/2)<30/zoom&&Math.abs(ly-s.h/2)<30/zoom){drag={m:'r',o:s};return}}
 for(let i=doc.objs.length-1;i>=0;i--){const o=doc.objs[i];if(!o.vis)continue;const[lx,ly]=loc(o,px,py);if(Math.abs(lx)<=o.w/2&&Math.abs(ly)<=o.h/2){sel=o.id;drag={m:'m',o,dx:o.x-px,dy:o.y-py};draw();return}}
 sel=null;draw()};
ST.onpointermove=e=>{if(!drag)return;const q=ST.getBoundingClientRect(),px=(e.clientX-q.left)/zoom,py=(e.clientY-q.top)/zoom,o=drag.o;if(drag.m=='m'){o.x=px+drag.dx;o.y=py+drag.dy}else{const[lx,ly]=loc(o,px,py);o.w=Math.max(20,lx*2);o.h=Math.max(20,ly*2);$('#in').dataset.k=''}draw()};
ST.onpointerup=()=>{if(drag){drag=null;commit()}};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const o=get(sel),m=e.ctrlKey||e.metaKey,k=e.key,n=e.shiftKey?10:1;
 if(m&&k=='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click()}else if(m&&k=='d'){e.preventDefault();dup()}
 else if(k=='Escape'){closePop();sel=null;draw()}
 else if(o&&(k=='Delete'||k=='Backspace')){doc.objs=doc.objs.filter(x=>x!=o);sel=null;commit();draw()}
 else if(o&&k.startsWith('Arrow')){e.preventDefault();o.x+=({ArrowLeft:-n,ArrowRight:n})[k]||0;o.y+=({ArrowUp:-n,ArrowDown:n})[k]||0;commit();draw()}
 else if(o&&(k=='['||k==']')){o.rot+=k=='['?-5:5;$('#in').dataset.k='';commit();draw()}});
// ---- export / import ----
$('#dl').onclick=async()=>{toast('Exporting...');const c=await exportCanvas();c.toBlob(b=>dlf(b,`${$('#name').value}.${fmt=='jpeg'?'jpg':fmt}`),'image/'+fmt,.95)};
function dlf(b,n){const a=h('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),999)}
$('#exp').onclick=()=>dlf(new Blob([JSON.stringify({name:$('#name').value,doc})],{type:'application/json'}),$('#name').value+'.wallpaper.json');
$('#imp').onclick=()=>$('#j').click();
$('#j').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text());load(p.doc,p.name)}catch(x){toast('Could not open that file')}e.target.value=''};
function load(d,name){doc=d;if(!doc.stops){doc.stops=[{c:doc.c1||'#5ee7c5',p:0},{c:doc.c2||'#b9f5d6',p:1}];doc.gang=doc.ang==null?160:doc.ang;doc.gtype='linear'}$('#name').value=name||'Untitled';sel=null;doc.objs=doc.objs.map(o=>{const x={...mk(o.type),...o};if(!o.stops)x.stops=[{c:x.fill,p:0},{c:x.fill2,p:1}];return x});doc.objs.forEach(o=>{if(o.src){const i=new Image();i.src=o.src;i.onload=draw;imgs[o.id]=i}if(o.msrc){const i=new Image();i.src=o.msrc;i.onload=draw;mimgs[o.id]=i}});doc.bgSrc=doc.bgSrc||'';doc.bgBlur=doc.bgBlur||0;if(doc.bgSrc){const i=new Image();i.src=doc.bgSrc;i.onload=draw;imgs.bg=i}hist=[JSON.stringify(doc)];$('#in').dataset.k='';left();fit()}
$('#name').onchange=save;addEventListener('resize',fit);
(async()=>{grainTile();doc=fresh();const d=await idb();if(d){const r=d.transaction('p').objectStore('p').get('cur');r.onsuccess=()=>load(r.result?r.result.doc:fresh(),r.result?.name);r.onerror=()=>load(fresh())}else load(fresh())})();
