const $=s=>document.querySelector(s),cv=$('#cv'),ctx=cv.getContext('2d');
const h=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const SIZES={'iPhone 1170x2532':[1170,2532],'iPhone Max 1290x2796':[1290,2796],'Square 2000x2000':[2000,2000],'Landscape 2560x1440':[2560,1440],'Portrait 1080x1920':[1080,1920]};
const BM=['source-over','multiply','screen','overlay','soft-light','hard-light','lighten','darken','color-dodge','difference'].map(v=>[v,v=='source-over'?'normal':v]);
const uid=()=>Math.random().toString(36).slice(2,8),imgs={},clamp=v=>Math.max(0,Math.min(1,v));
let doc,sel=null,zoom=.3,hist=[],fut=[],tab='add';
const fresh=()=>({w:1170,h:2532,c1:'#5ee7c5',c2:'#b9f5d6',ang:160,grain:.08,objs:[]});
const mk=(t,o={})=>({id:uid(),type:t,name:t,x:doc.w/2,y:doc.h/2,w:600,h:600,rot:0,fill:'#ffd36b',fill2:'#ff5e7e',op:1,blur:0,vis:1,text:'Hello',rad:140,bm:'source-over',glass:0,refr:1,ca:.3,gb:.1,fres:.5,spec:.7,bev:120,ior:1.5,tint:'#ffffff',ta:.06,...o});
// ---- color utils ----
const hx=c=>{c=c.replace('#','');if(c.length==6)c+='ff';return[0,2,4,6].map(i=>parseInt(c.substr(i,2),16))};
const toHex=(r,g,b,a)=>'#'+[r,g,b,a].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
function rgb2hsv(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let H=0;if(d){H=M==r?((g-b)/d)%6:M==g?(b-r)/d+2:(r-g)/d+4;H*=60;if(H<0)H+=360}return[H,M?d/M:0,M]}
function hsv2rgb(H,S,V){const f=n=>{const k=(n+H/60)%6;return(V-V*S*Math.max(0,Math.min(k,4-k,1)))*255};return[f(5),f(3),f(1)]}
// ---- liquid glass shader (webgl) ----
let G,gErr=0;
const VS='attribute vec2 P;void main(){gl_Position=vec4(P,0.,1.);}';
const FS=`precision highp float;uniform sampler2D T;uniform vec2 R,C,H;uniform float rot,rad,refr,ca,bl,fr,sp,bev,op,ta,S,ior;uniform vec3 tint;
float sd(vec2 p){float a=-rot,c=cos(a),s=sin(a);vec2 q=mat2(c,s,-s,c)*p;vec2 d=abs(q)-H+rad;return length(max(d,0.))+min(max(d.x,d.y),0.)-rad;}
vec3 tx(vec2 f){return texture2D(T,clamp(f/R,0.,1.)).rgb;}
void main(){vec2 f=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y),p=f-C;float d=sd(p);
float aa=smoothstep(.75,-.75,d);float sh=smoothstep(40.*S,-5.*S,sd(p-vec2(0.,14.*S)))*.28*(1.-aa);
if(d>45.*S){gl_FragColor=vec4(0.);return;}
float B=max(bev,2.),dep=max(-d,0.),t=clamp(dep/B,0.,1.),u=1.-t,u4=u*u*u*u;
float y=pow(1.-u4,.25),yp=min(pow(max(1.-u4,1e-4),-.75)*u*u*u,6.);if(t>=1.)yp=0.;
vec2 k=vec2(1.5,0.);vec2 n=normalize(vec2(sd(p+k.xy)-sd(p-k.xy),sd(p+k.yx)-sd(p-k.yx))+vec2(1e-5));
vec3 N=normalize(vec3(n*refr*.9*yp,1.));float Lh=refr*B*.9*(.4+y);
vec3 I=vec3(0.,0.,-1.),r0=refract(I,N,1./(ior-ca*.1)),r1=refract(I,N,1./ior),r2=refract(I,N,1./(ior+ca*.1));
vec2 o0=r0.xy/-r0.z*Lh,o1=r1.xy/-r1.z*Lh,o2=r2.xy/-r2.z*Lh;float br=bl*24.*S;vec3 col=vec3(0.);
for(int i=0;i<9;i++){vec2 o=vec2(float(i/3)-1.,float(i-(i/3)*3)-1.)*br;col+=vec3(tx(f+o+o0).r,tx(f+o+o1).g,tx(f+o+o2).b);}
col/=9.;col=mix(col,tint,ta);
vec3 V=vec3(0.,0.,1.),L1=normalize(vec3(-.5,-.7,.5)),L2=normalize(vec3(.5,.7,.5));
float s1=pow(max(dot(N,normalize(L1+V)),0.),40.)+.6*pow(max(dot(N,normalize(L2+V)),0.),40.);
col+=sp*s1*.9+fr*pow(1.-N.z,1.5)*.6+smoothstep(2.5*S,0.,dep)*.3;
float a=aa*op;gl_FragColor=vec4(clamp(col,0.,1.)*a,a+sh*(1.-a));}`;
function initGL(){try{const c=document.createElement('canvas'),g=c.getContext('webgl',{premultipliedAlpha:true,alpha:true});if(!g)throw 0;
 const sh=(t,s)=>{const x=g.createShader(t);g.shaderSource(x,s);g.compileShader(x);if(!g.getShaderParameter(x,g.COMPILE_STATUS))throw g.getShaderInfoLog(x);return x};
 const p=g.createProgram();g.attachShader(p,sh(g.VERTEX_SHADER,VS));g.attachShader(p,sh(g.FRAGMENT_SHADER,FS));g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw 'link';g.useProgram(p);
 g.bindBuffer(g.ARRAY_BUFFER,g.createBuffer());g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);const l=g.getAttribLocation(p,'P');g.enableVertexAttribArray(l);g.vertexAttribPointer(l,2,g.FLOAT,false,0,0);
 const t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);[g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER].forEach(k=>g.texParameteri(g.TEXTURE_2D,k,g.LINEAR));[g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T].forEach(k=>g.texParameteri(g.TEXTURE_2D,k,g.CLAMP_TO_EDGE));
 return{c,g,p,u:n=>g.getUniformLocation(p,n)}}catch(e){console.error('liquid glass init failed',e);return null}}
function glass(c,o,s,W,H){if(!G&&!gErr){G=initGL();if(!G){gErr=1;toast('Glass shader unavailable here, showing a plain fallback')}}
 const w=o.w*s,hh=o.h*s;
 if(!G){c.save();c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.roundRect(-w/2,-hh/2,w,hh,Math.min(o.type=='circle'?1e5:o.rad*s,w/2,hh/2));c.fill();c.restore();return}
 const{g,u}=G;if(G.c.width!=W||G.c.height!=H){G.c.width=W;G.c.height=H}g.viewport(0,0,W,H);
 g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,c.canvas);
 const hex=x=>hx(x).slice(0,3).map(v=>v/255),rd=o.type=='circle'?Math.min(w,hh)/2:Math.min(o.rad*s,w/2,hh/2);
 g.uniform2f(u('R'),W,H);g.uniform2f(u('C'),o.x*s,o.y*s);g.uniform2f(u('H'),w/2,hh/2);
 Object.entries({rot:o.rot*Math.PI/180,rad:rd,refr:o.refr,ca:o.ca,bl:o.gb,fr:o.fres,sp:o.spec,bev:Math.max(2,o.bev*s),op:o.op,ta:o.ta,S:s,ior:o.ior}).forEach(([k,v])=>g.uniform1f(u(k),v));
 g.uniform3fv(u('tint'),hex(o.tint));g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);g.drawArrays(g.TRIANGLE_STRIP,0,4);c.drawImage(G.c,0,0)}
// ---- render engine ----
let noise;function grainTile(){noise=h('canvas');noise.width=noise.height=256;const c=noise.getContext('2d'),d=c.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=Math.random()*255;d.data[i+3]=255}c.putImageData(d,0,0)}
function blobPath(c,w,h){const a=w/2,b=h/2;c.beginPath();c.moveTo(0,-b);c.bezierCurveTo(a*.9,-b,a,-b*.2,a*.8,b*.3);c.bezierCurveTo(a*.6,b,a*.1,b,-a*.3,b*.9);c.bezierCurveTo(-a,b*.8,-a,-b*.1,-a*.7,-b*.5);c.bezierCurveTo(-a*.5,-b*.9,-a*.2,-b,0,-b);c.closePath()}
const get=id=>doc.objs.find(o=>o.id==id);
function render(c,s,W,H,uiOn){
 const a=doc.ang*Math.PI/180,r=Math.hypot(W,H)/2,cx=W/2,cy=H/2,g=c.createLinearGradient(cx-Math.sin(a)*r,cy+Math.cos(a)*r,cx+Math.sin(a)*r,cy-Math.cos(a)*r);
 g.addColorStop(0,doc.c1);g.addColorStop(1,doc.c2);c.globalCompositeOperation='source-over';c.filter='none';c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,0,W,H);
 for(const o of doc.objs){if(!o.vis)continue;if(o.glass&&(o.type=='rect'||o.type=='circle')){glass(c,o,s,W,H);continue}
  c.save();c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.globalAlpha=o.op;c.globalCompositeOperation=o.bm;c.filter=o.blur?`blur(${o.blur*s}px)`:'none';
  const w=o.w*s,hh=o.h*s,f=c.createLinearGradient(-w/2,-hh/2,w/2,hh/2);f.addColorStop(0,o.fill);f.addColorStop(1,o.fill2);c.fillStyle=f;
  if(o.type=='circle'){c.beginPath();c.ellipse(0,0,w/2,hh/2,0,0,7);c.fill()}
  else if(o.type=='rect'){c.beginPath();c.roundRect(-w/2,-hh/2,w,hh,Math.min(o.rad*s,w/2,hh/2));c.fill()}
  else if(o.type=='blob'){blobPath(c,w,hh);c.fill()}
  else if(o.type=='text'){c.font=`700 ${hh*.8}px -apple-system,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(o.text,0,0)}
  else if(o.type=='img'&&imgs[o.id]?.complete)c.drawImage(imgs[o.id],-w/2,-hh/2,w,hh);
  c.restore()}
 if(doc.grain>0){c.save();c.globalAlpha=doc.grain;c.globalCompositeOperation='overlay';c.fillStyle=c.createPattern(noise,'repeat');c.fillRect(0,0,W,H);c.restore()}
 if(uiOn){const o=get(sel);if(o){c.save();c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.strokeStyle='#0a84ff';c.lineWidth=2;c.strokeRect(-o.w*s/2,-o.h*s/2,o.w*s,o.h*s);c.fillStyle='#fff';c.fillRect(o.w*s/2-8,o.h*s/2-8,16,16);c.restore()}}}
function draw(){cv.width=Math.round(doc.w*zoom);cv.height=Math.round(doc.h*zoom);render(ctx,zoom,cv.width,cv.height,1);ui()}
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
  [...recent,...PAL].slice(0,16).forEach(c=>{const s=h('button','sw s');s.style.setProperty('--c',c);s.onclick=()=>setC(c);n.querySelector('.sws').append(s)});
  openPop(b,n,()=>{commit();recent=[o[k],...recent.filter(x=>x!=o[k])].slice(0,8);try{localStorage.rc=JSON.stringify(recent)}catch(e){}});upd()};return b}
// ---- inspector ----
function row(l,...e){const d=h('div','r');d.append(h('label','',l),...e);return d}
function tx(o,k){const i=h('input','in');i.value=o[k];i.oninput=()=>{o[k]=i.value;draw()};i.onchange=commit;return i}
function rg(o,k,min,max,step=1){const d=h('div','rg'),i=h('input','rng'),out=h('output');i.type='range';i.min=min;i.max=max;i.step=step;i.value=o[k];
 const p=()=>{i.style.setProperty('--p',(i.value-min)/(max-min)*100+'%');out.textContent=step<1?(+i.value).toFixed(2):Math.round(i.value)};p();i.oninput=()=>{o[k]=+i.value;p();draw()};i.onchange=commit;d.append(i,out);return d}
function tg(o,k){const b=h('button','tg'+(o[k]?' on':''));b.onclick=()=>{o[k]=o[k]?0:1;commit();draw()};return b}
function insp(){const I=$('#in'),o=get(sel),key=sel+':'+(o?o.glass:'');if(I.dataset.k===key&&I.children.length)return;I.dataset.k=key;I.innerHTML='';
 const sec=(t,...r)=>{I.append(h('h4','',t),...r)};
 sec('Canvas',row('Color 1',cp(doc,'c1')),row('Color 2',cp(doc,'c2')),row('Angle',rg(doc,'ang',0,360)),row('Grain',rg(doc,'grain',0,.6,.01)));
 if(!o){I.append(h('p','mut','Select a layer to edit it.'));return}
 const sh=!o.glass&&o.type!='img',gl=o.type=='rect'||o.type=='circle';
 sec('Appearance',row('Name',tx(o,'name')),...(o.type=='text'?[row('Text',tx(o,'text'))]:[]),...(sh?[row('Fill',cp(o,'fill')),row('Fill 2',cp(o,'fill2'))]:[]),row('Opacity',rg(o,'op',0,1,.01)),...(o.glass?[]:[row('Blend',dd(BM,o.bm,v=>{o.bm=v;commit();draw()}))]));
 sec('Geometry',row('Width',rg(o,'w',20,4000)),row('Height',rg(o,'h',20,4000)),row('Rotate',rg(o,'rot',-180,180)),...(o.type=='rect'?[row('Radius',rg(o,'rad',0,2000))]:[]));
 if(!o.glass)sec('Effects',row('Blur',rg(o,'blur',0,300)));
 if(gl){sec('Liquid Glass',row('Enabled',tg(o,'glass')));if(o.glass)I.append(row('Depth',rg(o,'refr',0,3,.01)),row('Index',rg(o,'ior',1.1,2.2,.01)),row('Aberration',rg(o,'ca',0,1,.01)),row('Backdrop blur',rg(o,'gb',0,1,.01)),row('Fresnel',rg(o,'fres',0,1,.01)),row('Specular',rg(o,'spec',0,1,.01)),row('Bezel',rg(o,'bev',10,400)),row('Tint',cp(o,'tint')),row('Tint amount',rg(o,'ta',0,1,.01)))}
 const d=h('button','btn','Duplicate');d.onclick=dup;I.append(h('h4'),d)}
// ---- left panel ----
function left(){const P=$('#lp');P.innerHTML='';
 if(tab=='add'){const g=h('div','grid');[['Rounded Rect',()=>add('rect')],['Circle',()=>add('circle')],['Blob',()=>add('blob')],['Text',()=>add('text',{h:260,w:700,fill:'#ffffff',fill2:'#ffffff'})],['Glass Rect',()=>add('rect',{glass:1,w:700,h:900,rad:300})],['Glass Circle',()=>add('circle',{glass:1,w:600,h:420})],['Image',()=>$('#f').click()]].forEach(([l,f])=>{const b=h('button','btn',l);b.onclick=f;g.append(b)});P.append(g)}
 else if(tab=='tp'){const g=h('div','grid');for(const k in TP){const b=h('button','btn',k);b.onclick=()=>useTP(k);g.append(b)}P.append(g)}
 else{[...doc.objs].reverse().forEach(o=>{const d=h('div','ly'+(o.id==sel?' s':'')),s=h('span','',o.name),mkb=(t,f)=>{const b=h('button','',t);b.onclick=f;return b};s.onclick=()=>{sel=o.id;draw()};
  const mv=n=>{const i=doc.objs.indexOf(o),j=i+n;if(j<0||j>=doc.objs.length)return;doc.objs.splice(i,1);doc.objs.splice(j,0,o);commit();draw()};
  d.append(s,mkb(o.vis?'Hide':'Show',()=>{o.vis=!o.vis;commit();draw()}),mkb('Up',()=>mv(1)),mkb('Dn',()=>mv(-1)));P.append(d)});if(!doc.objs.length)P.append(h('p','mut','No layers yet.'))}}
function ui(){if(tab=='layers')left();insp()}
[['add','Add'],['tp','Templates'],['layers','Layers']].forEach(([k,l])=>{const b=h('button',k==tab?'on':'',l);b.dataset.t=k;b.onclick=()=>{tab=k;document.querySelectorAll('#tabs button').forEach(x=>x.className=x.dataset.t==k?'on':'');left()};$('#tabs').append(b)});
function dup(){const o=get(sel);if(!o)return;const c={...o,id:uid(),x:o.x+40,y:o.y+40};if(imgs[o.id])imgs[c.id]=imgs[o.id];doc.objs.push(c);sel=c.id;commit();draw()}
function add(t,o){const x=mk(t,o);doc.objs.push(x);sel=x.id;commit();draw()}
$('#f').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const x=mk('img',{src:r.result,w:800,h:800*im.height/im.width});imgs[x.id]=im;doc.objs.push(x);sel=x.id;commit();draw()};im.src=r.result};r.readAsDataURL(f);e.target.value=''};
// ---- templates ----
const TP={'Mint Glass':()=>({c1:'#10b88e',c2:'#c3f7dc',ang:160,grain:.06,objs:[['circle',{fill:'#6df2cf',fill2:'#0fa984',x:300,y:600,w:1300,h:1300,blur:40}],['rect',{fill:'#f0fff8',fill2:'#a8ecd6',x:650,y:1800,w:1400,h:700,rad:300,rot:-24,op:.8,blur:30}],['rect',{glass:1,x:620,y:1250,w:760,h:1000,rad:380,rot:-12,tint:'#9ff5db',ta:.12}],['circle',{glass:1,x:720,y:2050,w:520,h:360,rot:15}]]}),'Aurora Glass':()=>({c1:'#0f2027',c2:'#2c5364',ang:200,grain:.1,objs:[['blob',{fill:'#00ffa3',fill2:'#03e1ff',blur:120,x:600,y:700,w:1100,h:700}],['blob',{fill:'#a855f7',fill2:'#6366f1',blur:140,x:500,y:1700,w:1200,h:800}],['rect',{glass:1,x:585,y:1250,w:700,h:700,rad:240,rot:20}]]}),'Sunset':()=>({c1:'#ff9966',c2:'#5b2a86',ang:170,grain:.15,objs:[['blob',{fill:'#ffe29f',fill2:'#ff719a',blur:60,x:500,y:900,w:1000,h:1000}],['circle',{fill:'#ffffff',fill2:'#ffb199',blur:30,op:.7,x:800,y:1800,w:500,h:500}],['circle',{glass:1,x:600,y:1500,w:640,h:640}]]}),'Mono':()=>({c1:'#e5e5e5',c2:'#8a8a8a',ang:120,grain:.2,objs:[['circle',{fill:'#ffffff',fill2:'#bbbbbb',blur:80,op:.8,x:600,y:900,w:900,h:900}],['rect',{fill:'#222222',fill2:'#555555',blur:40,op:.5,x:500,y:2000,w:700,h:500,rot:-20}]]})};
function useTP(k){const t=TP[k](),sx=doc.w/1170,sy=doc.h/2532;Object.assign(doc,{c1:t.c1,c2:t.c2,ang:t.ang,grain:t.grain});doc.objs=t.objs.map(([ty,o])=>mk(ty,{...o,x:o.x*sx,y:o.y*sy,w:o.w*sx,h:o.h*sy,name:k+' '+ty}));sel=null;commit();$('#in').dataset.k='';draw()}
// ---- size + format dropdowns, zoom ----
let szb;function sizeDD(){const k=Object.keys(SIZES).find(k=>SIZES[k][0]==doc.w&&SIZES[k][1]==doc.h)||'Custom';$('#szw').innerHTML='';$('#szw').append(dd([...Object.keys(SIZES).map(x=>[x,x]),['Custom',`${doc.w}x${doc.h}`]],k,v=>{if(v=='Custom')return;const[w,hh]=SIZES[v],sx=w/doc.w,sy=hh/doc.h;doc.objs.forEach(o=>{o.x*=sx;o.y*=sy;o.w*=sx;o.h*=sy;o.rad*=Math.min(sx,sy)});doc.w=w;doc.h=hh;commit();fit()}))}
let fmt='png';$('#fmw').append(dd([['png','PNG'],['jpeg','JPEG'],['webp','WebP']],'png',v=>fmt=v));
function fit(){const m=$('#M');zoom=Math.max(.02,Math.min((m.clientWidth-48)/doc.w,(m.clientHeight-48)/doc.h));$('#zoom').value=zoom*100;sizeDD();draw()}
$('#zoom').oninput=e=>{zoom=e.target.value/100;draw()};
// ---- pointer ----
let drag=null;const loc=(o,px,py)=>{const a=-o.rot*Math.PI/180,dx=px-o.x,dy=py-o.y;return[dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a)]};
cv.onpointerdown=e=>{closePop();const px=e.offsetX/zoom,py=e.offsetY/zoom;cv.setPointerCapture(e.pointerId);const s=get(sel);
 if(s){const[lx,ly]=loc(s,px,py);if(Math.abs(lx-s.w/2)<30/zoom&&Math.abs(ly-s.h/2)<30/zoom){drag={m:'r',o:s};return}}
 for(let i=doc.objs.length-1;i>=0;i--){const o=doc.objs[i];if(!o.vis)continue;const[lx,ly]=loc(o,px,py);if(Math.abs(lx)<=o.w/2&&Math.abs(ly)<=o.h/2){sel=o.id;drag={m:'m',o,dx:o.x-px,dy:o.y-py};draw();return}}
 sel=null;draw()};
cv.onpointermove=e=>{if(!drag)return;const px=e.offsetX/zoom,py=e.offsetY/zoom,o=drag.o;if(drag.m=='m'){o.x=px+drag.dx;o.y=py+drag.dy}else{const[lx,ly]=loc(o,px,py);o.w=Math.max(20,lx*2);o.h=Math.max(20,ly*2);$('#in').dataset.k=''}draw()};
cv.onpointerup=()=>{if(drag){drag=null;commit()}};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const o=get(sel),m=e.ctrlKey||e.metaKey,k=e.key,n=e.shiftKey?10:1;
 if(m&&k=='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click()}else if(m&&k=='d'){e.preventDefault();dup()}
 else if(k=='Escape'){closePop();sel=null;draw()}
 else if(o&&(k=='Delete'||k=='Backspace')){doc.objs=doc.objs.filter(x=>x!=o);sel=null;commit();draw()}
 else if(o&&k.startsWith('Arrow')){e.preventDefault();o.x+=({ArrowLeft:-n,ArrowRight:n})[k]||0;o.y+=({ArrowUp:-n,ArrowDown:n})[k]||0;commit();draw()}
 else if(o&&(k=='['||k==']')){o.rot+=k=='['?-5:5;$('#in').dataset.k='';commit();draw()}});
// ---- export / import ----
$('#dl').onclick=()=>{const c=h('canvas');c.width=doc.w;c.height=doc.h;render(c.getContext('2d'),1,doc.w,doc.h,0);c.toBlob(b=>dlf(b,`${$('#name').value}.${fmt=='jpeg'?'jpg':fmt}`),'image/'+fmt,.95)};
function dlf(b,n){const a=h('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),999)}
$('#exp').onclick=()=>dlf(new Blob([JSON.stringify({name:$('#name').value,doc})],{type:'application/json'}),$('#name').value+'.wallpaper.json');
$('#imp').onclick=()=>$('#j').click();
$('#j').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text());load(p.doc,p.name)}catch(x){toast('Could not open that file')}e.target.value=''};
function load(d,name){doc=d;$('#name').value=name||'Untitled';sel=null;doc.objs=doc.objs.map(o=>({...mk(o.type),...o}));doc.objs.forEach(o=>{if(o.src){const i=new Image();i.src=o.src;i.onload=draw;imgs[o.id]=i}});hist=[JSON.stringify(doc)];$('#in').dataset.k='';left();fit()}
$('#name').onchange=save;addEventListener('resize',fit);
(async()=>{grainTile();doc=fresh();const d=await idb();if(d){const r=d.transaction('p').objectStore('p').get('cur');r.onsuccess=()=>load(r.result?r.result.doc:fresh(),r.result?.name);r.onerror=()=>load(fresh())}else load(fresh())})();
