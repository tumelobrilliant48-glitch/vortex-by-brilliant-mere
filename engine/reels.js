// engine/reels.js - Horizontal reels like you said: slide left/right not up/down
export function initReels(){
  const container = document.getElementById('reels-container');
  if(!container) return;

  let isDown=false, startX, scrollLeft;
  container.addEventListener('mousedown',(e)=>{isDown=true; startX=e.pageX - container.offsetLeft; scrollLeft=container.scrollLeft});
  container.addEventListener('mouseleave',()=>isDown=false);
  container.addEventListener('mouseup',()=>isDown=false);
  container.addEventListener('mousemove',(e)=>{
    if(!isDown) return; e.preventDefault();
    const x=e.pageX - container.offsetLeft;
    const walk=(x-startX)*2;
    container.scrollLeft=scrollLeft - walk;
  });

  // Auto slide every 4s
  setInterval(()=>{
    if(container.scrollLeft + container.clientWidth >= container.scrollWidth) container.scrollTo({left:0,behavior:'smooth'});
    else container.scrollBy({left:container.clientWidth/1.2,behavior:'smooth'});
  },4000);
}

export function renderReel(reel){
  return `
  <div class="reel-card">
    <div class="reel-desc"><b style="color:#ff2a2a"> ${reel.user} </b><b style="color:#00f0ff"> • ${reel.title}</b></div>
    <div class="reel-video">${reel.thumb}</div>
    <div class="reel-actions">
      <button>❤️ ${reel.likes}</button>
      <button>💬 ${reel.comments}</button>
      <button>↗ Share</button>
      <button>★ Star</button>
    </div>
  </div>`;
}
