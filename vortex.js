// V17 STARS LIGHTING - NO AI
let c=document.getElementById('stars');
if(!c){c=document.createElement('canvas');c.id='stars';document.body.prepend(c);}
const ctx=c.getContext('2d');let w,h,s=[];
function R(){w=c.width=innerWidth;h=c.height=innerHeight}
addEventListener('resize',R);R();
for(let i=0;i<250;i++)s.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*2+0.2,sp:Math.random()*.6+.2,t:Math.random()*6});
(function D(){
ctx.clearRect(0,0,w,h);
s.forEach(o=>{
ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);
ctx.fillStyle=`rgba(255,255,255,${0.3+Math.sin(o.t)*0.7})`;
ctx.shadowBlur=o.r>1.2?10:0;ctx.shadowColor='#8a5cf5';ctx.fill();ctx.shadowBlur=0;
o.y+=o.sp;o.t+=0.02;if(o.y>h){o.y=0;o.x=Math.random()*w}
});
requestAnimationFrame(D);
})();

// REMOVE AI CARD AUTOMATICALLY
setInterval(()=>{
document.querySelectorAll('div').forEach(d=>{
 if(d.innerText && d.innerText.includes('Vortex AI') && d.innerText.includes('Ask me anything')){
   let card = d.closest('div[style*="border"]') || d.parentElement.parentElement;
   if(card) card.style.display='none';
 }
});
},1000);

if('serviceWorker' in navigator){
 navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(r=>r.unregister()));
}
