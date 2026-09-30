const App = {
  go(page){
    document.querySelectorAll('.screen').forEach(s=>{
      s.classList.remove('active');
      s.style.display='none';
    });
    const el = document.getElementById('s-'+page) || document.getElementById('s-Home');
    el.classList.add('active');
    el.style.display='block';
    document.querySelectorAll('.bottom b').forEach(b=>b.classList.remove('on'));
    const btn = document.getElementById('b-'+page);
    if(btn) btn.classList.add('on');
    localStorage.setItem('vortex_last',page);
    if(page==='Home') this.loadFeed();
  },
  async loadFeed(){
    // FORCE demo posts so feed is never blank like in your video
    let posts = [
      {user:'nova.create', handle:'@nova • 12m • Earth', text:'Just launched this procedural design concept in VORTEX — playing with neon geometry and generative loops. Thoughts? ✨ #VORTEX #Design', likes:'1.2k', cm:84},
      {user:'Brilliant Mere', handle:'@brilliant.mere • now • Gaborone', text:'VORTEX is live from BW 🇧🇼 — More than a social app, it is a Universe. Built by Tumelo Brilliant Mere.', likes:12, cm:2}
    ];
    // merge with saved posts
    let saved = [];
    try{ saved = JSON.parse(localStorage.getItem('vortex_posts')||'[]'); }catch(e){}
    if(saved.length) posts = [...saved, ...posts];

    const feed = document.getElementById('feed');
    if(!feed){ console.log('NO #feed element!'); return; }
    feed.innerHTML = posts.map(p=>`
      <div class="card">
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(45deg,#7dd4ff,#9d4edd)"></div>
          <div><b>${p.user}</b><br><small style="opacity:.5">${p.handle}</small></div>
        </div>
        <p style="margin:12px 0;line-height:1.4">${p.text}</p>
        <div style="height:160px;border-radius:12px;background:linear-gradient(135deg,#1a0a5a 0%,#0a2a6a 100%);display:grid;place-items:center;opacity:.8">VORTEX Image</div>
        <div style="display:flex;gap:18px;margin-top:10px;font-size:14px;opacity:.8"><span>❤️ ${p.likes}</span><span>💬 ${p.cm}</span><span>↗️ Share</span></div>
      </div>
    `).join('');
  },
  createPost(){
    const input = document.getElementById('postText');
    if(!input) return alert('No input found — add id="postText" to your Whats on your mind bar');
    const val = input.value.trim();
    if(!val) return alert('Write something!');
    const arr = JSON.parse(localStorage.getItem('vortex_posts')||'[]');
    arr.unshift({user:'Brilliant Mere', handle:'@brilliant.mere • now', text:val, likes:0, cm:0});
    localStorage.setItem('vortex_posts', JSON.stringify(arr));
    input.value='';
    this.loadFeed();
  },
  init(){
    // hide splash after 1 sec if Get Started clicked
    const splash = document.getElementById('s-Splash');
    if(splash && localStorage.getItem('vortex_started')){ splash.style.display='none'; }
    const last = localStorage.getItem('vortex_last') || 'Home';
    this.go(last);
    this.loadFeed();
  }
};
function go(p){ 
  if(p==='Splash') localStorage.removeItem('vortex_started');
  else localStorage.setItem('vortex_started','1');
  App.go(p); 
}
function createPost(){ App.createPost(); }
document.addEventListener('DOMContentLoaded',()=>App.init());
