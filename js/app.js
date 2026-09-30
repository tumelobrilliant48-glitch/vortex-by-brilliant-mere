// VORTEX app.js - By Brilliant T Mere
// Connects: index.html + core/api-client.js + backend/ + database/ + css/

const App = {
  // 1. ROUTER - Makes touches OPEN screens
  go(page) {
    // hide all
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    // show target
    const target = document.getElementById('s-' + page) || document.getElementById('s-Home');
    target.classList.add('active');
    target.style.display = 'block';
    
    // bottom nav highlight
    document.querySelectorAll('.bottom b').forEach(b => b.classList.remove('on'));
    const btn = document.getElementById('b-' + page);
    if (btn) btn.classList.add('on');
    
    localStorage.setItem('vortex_last', page);
    
    // auto load data when opening
    if (page === 'Home') this.loadFeed();
    if (page === 'Messages') this.loadMessages();
    if (page === 'Notifications') this.loadNotifs();
    if (page === 'Profile') this.loadProfile();
  },

  // 2. DATA - Loads posts from backend or localStorage (your database/ folder fallback)
  async loadFeed() {
    let posts = [];
    if (window.VORTEX_API && VORTEX_API.getPosts) {
      posts = await VORTEX_API.getPosts(); // from core/api-client.js
    } else {
      posts = JSON.parse(localStorage.getItem('vortex_posts') || '[]');
    }
    // fallback demo posts like in your image
    if (posts.length === 0) {
      posts = [
        {user:'nova.create', sub:'12m • Earth', text:'Just launched this procedural design concept in VORTEX — playing with neon geometry and generative loops. Thoughts? ✨', likes:'1.2k', cm:84},
        {user:'synth.architect', sub:'1h • Vortex City', text:'Working on the new vault encryption theme. Dark mode + clean mode. #design #build', likes:542, cm:23}
      ];
    }
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = posts.map(p => `
      <div class="card">
        <b>${p.user}</b> <small style="opacity:.5">${p.sub||''}</small>
        <p style="margin:10px 0">${p.text}</p>
        <div style="height:140px;border-radius:12px;background:linear-gradient(45deg,#1a0a5a,#0a2a6a);margin:8px 0"></div>
        <div style="display:flex;gap:16px;font-size:13px">❤️ ${p.likes} 💬 ${p.cm||p.comments||0} ↗️ Share</div>
      </div>
    `).join('');
  },

  // 3. BACKEND CONNECTION - Messages, Vault, Profile
  async loadMessages() {
    let msgs = [];
    if (window.VORTEX_API) msgs = await VORTEX_API.getMessages();
    const el = document.getElementById('msgList');
    if (el) el.innerHTML = msgs.map(m => `<div class="card"><b>${m.name}</b><br><small>${m.text}</small><span style="float:right;opacity:.5">${m.time}</span></div>`).join('');
  },
  async loadNotifs() {
    const el = document.getElementById('notifList');
    if (el) el.innerHTML = `<div class="card">💜 Luna liked your post</div><div class="card">💬 Kai: "This is next level 🔥"</div>`;
  },
  async loadProfile() {
    if (!window.VORTEX_API) return;
    const p = await VORTEX_API.getProfile();
    const n = document.getElementById('pName'); if(n) n.textContent = p.name;
  },

  async createPost() {
    const input = document.getElementById('postText');
    if (!input || !input.value.trim()) return alert('Type something!');
    
    // save to database/ via api-client -> backend/
    if (window.VORTEX_API) await VORTEX_API.createPost(input.value);
    else {
      const arr = JSON.parse(localStorage.getItem('vortex_posts')||'[]');
      arr.unshift({user:'Brilliant Mere', sub:'now • Gaborone', text:input.value, likes:0, cm:0});
      localStorage.setItem('vortex_posts', JSON.stringify(arr));
    }
    
    input.value = '';
    this.go('Home');
  },

  // 4. INIT - Runs on load
  init() {
    const last = localStorage.getItem('vortex_last') || 'Splash';
    this.go(last);
    this.loadFeed();
    console.log('VORTEX connected:', !!window.VORTEX_API, 'Backend:', localStorage.getItem('vortex_backend_url')||'localStorage mode');
  }
};

// Global functions so HTML onclick="go('Home')" works
function go(p){ App.go(p); }
function createPost(){ App.createPost(); }

// Start
document.addEventListener('DOMContentLoaded', ()=> App.init());
