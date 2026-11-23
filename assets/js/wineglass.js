/* BRAISE V1.94 — verre à vin paramétrique 3D rendu sur canvas, sans dépendance */
(()=>{'use strict';
const section=document.querySelector('#gravure');if(!section)return;
const holder=section.querySelector('.engrave-glass-display');if(!holder)return;
const preservedLaser=holder.querySelector('.braise-glass-laser');
holder.innerHTML='<canvas class="braise-wine-canvas" aria-label="Verre à vin tridimensionnel transparent avec gravure personnalisée. Glisser pour le faire tourner." role="img"></canvas><div class="braise-wine-hint">FAITES GLISSER POUR TOURNER · 360°</div>'; if(preservedLaser)holder.append(preservedLaser);
const canvas=holder.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
const name=section.querySelector('#engrave-name'),button=section.querySelector('.engrave-start');
let angle=-.34,drag=false,lastX=0,spin=0,laserStart=-1,active=false,w=550,h=490,dpr=1,prev=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function visible(){return section.querySelector('input[name="engrave-material"]:checked')?.value==='verre'}
function resize(){const r=holder.getBoundingClientRect();w=Math.max(260,r.width);h=Math.max(300,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(resize).observe(holder);
const profile=[[-2.55,0],[-2.52,.52],[-2.47,.76],[-2.42,.84],[-2.34,.87],[-2.28,.35],[-2.22,.12],[-1.25,.085],[-.94,.13],[-.72,.25],[-.48,.48],[-.20,.67],[.12,.81],[.49,.88],[.85,.90],[1.19,.89],[1.51,.85],[1.82,.78],[2.05,.70],[2.10,.69]];
function point(radius,y,theta){const x=radius*Math.sin(theta+angle),z=radius*Math.cos(theta+angle);const k=1+z*.10;const scale=Math.min(w/3.5,h/5.8)*1.18;return [w*.5+x*scale*k,h*.52-y*scale*k,z]}
function poly(points,fill,stroke,line=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
function ellipse3D(rad,y,opacity){const pts=[];for(let j=0;j<=90;j++)pts.push(point(rad,y,j*Math.PI*2/90));ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=`rgba(225,246,255,${opacity})`;ctx.lineWidth=1.4;ctx.stroke()}
function drawGlass(){
 const scale=Math.min(w/3.5,h/5.8)*1.18;
 // Reflected tabletop and contact shadow
 const ground=ctx.createRadialGradient(w/2,h*.89,2,w/2,h*.89,scale*1.25);ground.addColorStop(0,'rgba(0,0,0,.66)');ground.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ground;ctx.fillRect(0,h*.75,w,h*.25);
 // Studio light reflected through the transparent bowl: soft vertical light cards
 const backlight=ctx.createLinearGradient(w*.30,0,w*.71,0);
 backlight.addColorStop(0,'rgba(191,224,240,0)');backlight.addColorStop(.19,'rgba(219,242,255,.055)');backlight.addColorStop(.28,'rgba(255,255,255,.018)');backlight.addColorStop(.64,'rgba(203,229,247,.012)');backlight.addColorStop(.78,'rgba(233,249,255,.05)');backlight.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=backlight;ctx.fillRect(w*.18,h*.08,w*.64,h*.83);
 // Profile surface triangulated in true cylindrical coordinates; front and back blended
 const N=94;
 for(let side=0;side<2;side++)for(let i=0;i<profile.length-1;i++){
 const [y1,r1]=profile[i],[y2,r2]=profile[i+1];
 for(let j=0;j<N;j++){
  const t1=j*2*Math.PI/N,t2=(j+1)*2*Math.PI/N,mid=(t1+t2)/2;
  const z=Math.cos(mid+angle);if(side===0?z>0:z<=0)continue;
  const glint=Math.pow(Math.max(0,Math.cos(mid+angle-1.10)),22)*.55+Math.pow(Math.max(0,Math.cos(mid+angle+1.24)),30)*.7;
  const edge=Math.pow(1-Math.abs(z),5)*.29;
  const bowl=y1>-.8;
  const a=(bowl?.018:.075)+glint*.31+edge*.72+(side===0?.018:0);
  poly([point(r1,y1,t1),point(r1,y1,t2),point(r2,y2,t2),point(r2,y2,t1)],`rgba(${bowl?'196,230,244':'224,238,245'},${Math.min(.48,a).toFixed(3)})`);
 }
 }
 // Subtle wall outline on both sides, following actual profile
 for(const t of [Math.PI/2,3*Math.PI/2]){ctx.beginPath();profile.forEach(([y,r],i)=>{const p=point(r,y,t-angle);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});ctx.strokeStyle='rgba(225,241,248,.72)';ctx.lineWidth=1.45;ctx.stroke()}
 // Foot, rim and polished highlights
 ellipse3D(.87,-2.34,.43);ellipse3D(.69,2.10,.94);ellipse3D(.67,2.075,.24);
 // Thick crystal rim: double inner lip, subtly cool reflections and specular highlights
 ellipse3D(.65,2.065,.34);
 const baseLight=ctx.createRadialGradient(w*.46,h*.9,1,w*.50,h*.9,scale*.85);baseLight.addColorStop(0,'rgba(232,245,255,.17)');baseLight.addColorStop(.55,'rgba(211,232,247,.05)');baseLight.addColorStop(1,'rgba(211,232,247,0)');ctx.fillStyle=baseLight;ctx.fillRect(w*.22,h*.84,w*.56,h*.12);
 for(const t of [-1.12,.93]){ctx.beginPath();for(let i=8;i<profile.length;i++){const [y,r]=profile[i];const p=point(r,y,t-angle);i===8?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1])}ctx.strokeStyle=t<0?'rgba(255,255,255,.42)':'rgba(194,229,255,.28)';ctx.lineWidth=t<0?2.3:3.2;ctx.stroke()}
}
function engraving(now){const value=(name?.value.trim()||'Votre prénom').slice(0,24),font=section.querySelector('input[name="engrave-font"]:checked')?.value||'elegant';const fontName=font==='modern'?'Arial, sans-serif':font==='signature'?'Georgia, serif':'Georgia, serif';const progress=1;if(progress>=1)laserStart=-1;
 const letters=[...value];const step=Math.min(.145,2.02/Math.max(letters.length,1));const begin=-(letters.length-1)*step/2;
 // The text lives on the curved 3D bowl. Characters are individually projected and occluded.
 if(holder.classList.contains('laser-active'))return; letters.forEach((letter,i)=>{const theta=begin+i*step;const facing=Math.cos(theta+angle);if(facing<.06||i/letters.length>progress)return;const p=point(.888,.69,theta);const projectedScale=Math.max(.1,facing);ctx.save();ctx.translate(p[0],p[1]);ctx.scale(projectedScale,1);ctx.font=`${font==='modern'?'500':'400'} ${Math.min(31,Math.max(18,w*.054))}px ${fontName}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(225,248,255,.6)';ctx.shadowBlur=3;ctx.fillStyle='rgba(238,248,250,.92)';ctx.fillText(letter,0,0);ctx.restore()});

}
function frame(now){requestAnimationFrame(frame);if(!visible())return;if(!w||!h)resize();const dt=Math.min((now-prev)||16,80);prev=now;if(holder.classList.contains('laser-active'))angle=0;else if(!drag&&!reduce.matches)angle+=dt*.00020;ctx.clearRect(0,0,w,h);drawGlass();engraving(now)}
requestAnimationFrame(frame);
holder.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;holder.setPointerCapture(e.pointerId)});
holder.addEventListener('pointermove',e=>{if(!drag)return;angle+=(e.clientX-lastX)*.011;lastX=e.clientX});
holder.addEventListener('pointerup',()=>{drag=false});holder.addEventListener('pointercancel',()=>{drag=false});
// The shared engraving engine draws the same blue beam for wood, metal and glass.
})();
