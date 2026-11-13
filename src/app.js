const $=s=>document.querySelector(s),cv=$('#cv'),ctx=cv.getContext('2d');
const SIZES={'iPhone 1170x2532':[1170,2532],'iPhone Max 1290x2796':[1290,2796],'Square 2000x2000':[2000,2000],'Landscape 2560x1440':[2560,1440],'Portrait 1080x1920':[1080,1920]};
const uid=()=>Math.random().toString(36).slice(2,8),imgs={};
let doc,sel=null,zoom=.3,hist=[],fut=[];
const fresh=()=>({w:1170,h:2532,c1:'#ff7ac6',c2:'#4a6cff',ang:160,grain:.12,objs:[]});
const mk=(t,o={})=>({id:uid(),type:t,name:t,x:doc.w/2,y:doc.h/2,w:600,h:600,rot:0,fill:'#ffd36b',fill2:'#ff5e7e',op:1,blur:0,vis:1,text:'Hello',...o});
// ---- render engine ----
let noise;function grainTile(){noise=document.createElement('canvas');noise.width=noise.height=256;const c=noise.getContext('2d'),d=c.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=Math.random()*255;d.data[i+3]=255}c.putImageData(d,0,0)}
function blobPath(c,w,h){const a=w/2,b=h/2;c.beginPath();c.moveTo(0,-b);c.bezierCurveTo(a*.9,-b,a,-b*.2,a*.8,b*.3);c.bezierCurveTo(a*.6,b,a*.1,b,-a*.3,b*.9);c.bezierCurveTo(-a,b*.8,-a,-b*.1,-a*.7,-b*.5);c.bezierCurveTo(-a*.5,-b*.9,-a*.2,-b,0,-b);c.closePath()}
function render(c,s,W,H,ui){
 const a=doc.ang*Math.PI/180,r=Math.hypot(W,H)/2,cx=W/2,cy=H/2,g=c.createLinearGradient(cx-Math.sin(a)*r,cy+Math.cos(a)*r*-1,cx+Math.sin(a)*r,cy+Math.cos(a)*r);
 g.addColorStop(0,doc.c1);g.addColorStop(1,doc.c2);c.fillStyle=g;c.fillRect(0,0,W,H);
 for(const o of doc.objs){if(!o.vis)continue;c.save();c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.globalAlpha=o.op;c.filter=o.blur?`blur(${o.blur*s}px)`:'none';
  const w=o.w*s,h=o.h*s,f=c.createLinearGradient(-w/2,-h/2,w/2,h/2);f.addColorStop(0,o.fill);f.addColorStop(1,o.fill2);c.fillStyle=f;
  if(o.type=='circle'){c.beginPath();c.ellipse(0,0,w/2,h/2,0,0,7);c.fill()}
  else if(o.type=='rect'){c.beginPath();c.roundRect(-w/2,-h/2,w,h,Math.min(w,h)*.22);c.fill()}
  else if(o.type=='blob'){blobPath(c,w,h);c.fill()}
  else if(o.type=='text'){c.font=`700 ${h*.8}px -apple-system,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(o.text,0,0)}
  else if(o.type=='img'&&imgs[o.id]?.complete)c.drawImage(imgs[o.id],-w/2,-h/2,w,h);
  c.restore()}
 if(doc.grain>0){c.save();c.globalAlpha=doc.grain;c.globalCompositeOperation='overlay';c.fillStyle=c.createPattern(noise,'repeat');c.fillRect(0,0,W,H);c.restore()}
 if(ui&&sel){const o=get(sel);if(o){c.save();c.translate(o.x*s,o.y*s);c.rotate(o.rot*Math.PI/180);c.strokeStyle='#007aff';c.lineWidth=2;c.strokeRect(-o.w*s/2,-o.h*s/2,o.w*s,o.h*s);c.fillStyle='#fff';c.fillRect(o.w*s/2-8,o.h*s/2-8,16,16);c.restore()}}}
const get=id=>doc.objs.find(o=>o.id==id);
function draw(){cv.width=doc.w*zoom;cv.height=doc.h*zoom;render(ctx,zoom,cv.width,cv.height,1);ui()}
// ---- history + storage ----
function commit(){hist.push(JSON.stringify(doc));if(hist.length>80)hist.shift();fut=[];save()}
function restore(j){doc=JSON.parse(j);if(!get(sel))sel=null;draw();bgUI();save()}
$('#undo').onclick=()=>{if(hist.length>1){fut.push(hist.pop());restore(hist[hist.length-1])}};
$('#redo').onclick=()=>{if(fut.length){const j=fut.pop();hist.push(j);restore(j)}};
const idb=()=>new Promise(r=>{const q=indexedDB.open('wallpaper-studio',1);q.onupgradeneeded=()=>q.result.createObjectStore('p');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)});
let tm;function save(){clearTimeout(tm);tm=setTimeout(async()=>{const d=await idb();if(d)d.transaction('p','readwrite').objectStore('p').put({doc,name:$('#name').value},'cur')},400)}
// ---- UI ----
function row(label,el){const d=document.createElement('div');d.className='r';d.innerHTML=`<label>${label}</label>`;d.append(el);return d}
function inp(t,obj,k,min,max,step){const i=document.createElement('input');i.type=t;if(t=='range'){i.min=min;i.max=max;i.step=step||1}i.value=obj[k];i.oninput=()=>{obj[k]=t=='range'||t=='number'?+i.value:i.value;draw()};i.onchange=commit;return i}
function bgUI(){const b=$('#bg');b.innerHTML='';b.append(row('Color 1',inp('color',doc,'c1')),row('Color 2',inp('color',doc,'c2')),row('Angle',inp('range',doc,'ang',0,360)),row('Grain',inp('range',doc,'grain',0,.6,.01)))}
function ui(){const L=$('#ly');L.innerHTML='';[...doc.objs].reverse().forEach(o=>{const d=document.createElement('div');d.className='ly'+(o.id==sel?' s':'');d.innerHTML=`<span>${o.name}</span><button>${o.vis?'Hide':'Show'}</button><button>Up</button><button>Dn</button>`;const[s,...b]=[d.children[0],...d.querySelectorAll('button')];s.onclick=()=>{sel=o.id;draw()};
 const mv=n=>{const i=doc.objs.indexOf(o),j=i+n;if(j<0||j>=doc.objs.length)return;doc.objs.splice(i,1);doc.objs.splice(j,0,o);commit();draw()};b[0].onclick=()=>{o.vis=!o.vis;commit();draw()};b[1].onclick=()=>mv(1);b[2].onclick=()=>mv(-1);L.append(d)});
 const I=$('#in'),o=get(sel);if(I.dataset.s==sel&&I.children.length)return;I.dataset.s=sel||'';I.innerHTML='';if(!o){I.textContent='Nothing selected';return}
 const n=inp('text',o,'name');n.type='text';I.append(row('Name',n));if(o.type=='text')I.append(row('Text',inp('text',o,'text')));
 if(o.type!='img')I.append(row('Fill',inp('color',o,'fill')),row('Fill 2',inp('color',o,'fill2')));
 I.append(row('Opacity',inp('range',o,'op',0,1,.01)),row('Blur',inp('range',o,'blur',0,300)),row('Rotate',inp('range',o,'rot',-180,180)),row('Width',inp('range',o,'w',20,4000)),row('Height',inp('range',o,'h',20,4000)));
 const d=document.createElement('button');d.textContent='Duplicate';d.onclick=dup;I.append(d)}
function dup(){const o=get(sel);if(!o)return;const c={...o,id:uid(),x:o.x+40,y:o.y+40};if(imgs[o.id])imgs[c.id]=imgs[o.id];doc.objs.push(c);sel=c.id;commit();draw()}
function add(t,o){const x=mk(t,o);doc.objs.push(x);sel=x.id;commit();draw()}
document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a=='img')$('#f').click();else add(a,a=='text'?{h:260,w:700,fill:'#fff',fill2:'#fff'}:{})});
$('#f').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const x=mk('img',{src:r.result,w:800,h:800*im.height/im.width});imgs[x.id]=im;doc.objs.push(x);sel=x.id;commit();draw()};im.src=r.result};r.readAsDataURL(f);e.target.value=''};
const TP={Sunset:()=>({c1:'#ff9966',c2:'#5b2a86',ang:170,grain:.15,objs:[['blob',{fill:'#ffe29f',fill2:'#ff719a',blur:60,x:500,y:900,w:1000,h:1000}],['circle',{fill:'#fff',fill2:'#ffb199',blur:30,op:.7,x:800,y:1800,w:500,h:500}]]}),Aurora:()=>({c1:'#0f2027',c2:'#2c5364',ang:200,grain:.1,objs:[['blob',{fill:'#00ffa3',fill2:'#03e1ff',blur:120,x:600,y:700,w:1100,h:700}],['blob',{fill:'#a855f7',fill2:'#6366f1',blur:140,x:500,y:1700,w:1200,h:800}]]}),Mono:()=>({c1:'#e5e5e5',c2:'#8a8a8a',ang:120,grain:.2,objs:[['circle',{fill:'#fff',fill2:'#bbb',blur:80,op:.8,x:600,y:900,w:900,h:900}],['rect',{fill:'#222',fill2:'#555',blur:40,op:.5,x:500,y:2000,w:700,h:500,rot:-20}]]})};
for(const k in TP){const b=document.createElement('button');b.textContent=k;b.onclick=()=>{const t=TP[k](),sx=doc.w/1170,sy=doc.h/2532;doc.c1=t.c1;doc.c2=t.c2;doc.ang=t.ang;doc.grain=t.grain;doc.objs=t.objs.map(([ty,o])=>mk(ty,{...o,x:o.x*sx,y:o.y*sy,w:o.w*sx,h:o.h*sy,name:k+' '+ty}));sel=null;commit();bgUI();draw()};$('#tp').append(b)}
for(const k in SIZES){const o=document.createElement('option');o.textContent=k;$('#size').append(o)}
$('#size').onchange=e=>{const[w,h]=SIZES[e.target.value],sx=w/doc.w,sy=h/doc.h;doc.objs.forEach(o=>{o.x*=sx;o.y*=sy;o.w*=sx;o.h*=sy});doc.w=w;doc.h=h;commit();fit()};
function fit(){const m=$('#M');zoom=Math.min((m.clientWidth-48)/doc.w,(m.clientHeight-48)/doc.h);$('#zoom').value=zoom*100;draw()}
$('#zoom').oninput=e=>{zoom=e.target.value/100;draw()};
// ---- pointer: select, drag, resize ----
let drag=null;const loc=(o,px,py)=>{const a=-o.rot*Math.PI/180,dx=px-o.x,dy=py-o.y;return[dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a)]};
cv.onpointerdown=e=>{const px=e.offsetX/zoom,py=e.offsetY/zoom;cv.setPointerCapture(e.pointerId);const s=get(sel);
 if(s){const[lx,ly]=loc(s,px,py);if(Math.abs(lx-s.w/2)<30/zoom&&Math.abs(ly-s.h/2)<30/zoom){drag={m:'r',o:s};return}}
 for(let i=doc.objs.length-1;i>=0;i--){const o=doc.objs[i];if(!o.vis)continue;const[lx,ly]=loc(o,px,py);if(Math.abs(lx)<=o.w/2&&Math.abs(ly)<=o.h/2){sel=o.id;drag={m:'m',o,dx:o.x-px,dy:o.y-py};$('#in').dataset.s='';draw();return}}
 sel=null;$('#in').dataset.s='';draw()};
cv.onpointermove=e=>{if(!drag)return;const px=e.offsetX/zoom,py=e.offsetY/zoom,o=drag.o;if(drag.m=='m'){o.x=px+drag.dx;o.y=py+drag.dy}else{const[lx,ly]=loc(o,px,py);o.w=Math.max(20,lx*2);o.h=Math.max(20,ly*2);$('#in').dataset.s=''}draw()};
cv.onpointerup=()=>{if(drag){drag=null;commit()}};
// ---- keys ----
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const o=get(sel),m=e.ctrlKey||e.metaKey,k=e.key,n=e.shiftKey?10:1;
 if(m&&k=='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click()}else if(m&&k=='d'){e.preventDefault();dup()}
 else if(k=='Escape'){sel=null;$('#in').dataset.s='';draw()}
 else if(o&&(k=='Delete'||k=='Backspace')){doc.objs=doc.objs.filter(x=>x!=o);sel=null;commit();draw()}
 else if(o&&k.startsWith('Arrow')){e.preventDefault();o.x+=({ArrowLeft:-n,ArrowRight:n})[k]||0;o.y+=({ArrowUp:-n,ArrowDown:n})[k]||0;commit();draw()}
 else if(o&&(k=='['||k==']')){o.rot+=k=='['?-5:5;$('#in').dataset.s='';commit();draw()}});
// ---- export / import ----
$('#dl').onclick=()=>{const c=document.createElement('canvas');c.width=doc.w;c.height=doc.h;render(c.getContext('2d'),1,doc.w,doc.h,0);const f=$('#fmt').value;c.toBlob(b=>dlf(b,`${$('#name').value}.${f=='jpeg'?'jpg':f}`),'image/'+f,.95)};
function dlf(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),999)}
$('#exp').onclick=()=>dlf(new Blob([JSON.stringify({name:$('#name').value,doc:{...doc,assets:Object.fromEntries(doc.objs.filter(o=>o.src).map(o=>[o.id,o.src]))}})],{type:'application/json'}),$('#name').value+'.wallpaper.json');
$('#imp').onclick=()=>$('#j').click();
$('#j').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const p=JSON.parse(await f.text());load(p.doc,p.name)}catch(x){alert('Could not open that file.')}e.target.value=''};
function load(d,name){doc=d;$('#name').value=name||'Untitled';sel=null;doc.objs.forEach(o=>{if(o.src){const i=new Image();i.src=o.src;i.onload=draw;imgs[o.id]=i}});hist=[JSON.stringify(doc)];bgUI();fit()}
$('#name').onchange=save;addEventListener('resize',fit);
(async()=>{grainTile();doc=fresh();const d=await idb();if(d){const r=d.transaction('p').objectStore('p').get('cur');r.onsuccess=()=>{r.result?load(r.result.doc,r.result.name):load(fresh())};r.onerror=()=>load(fresh())}else load(fresh())})();
