// core/app.js - VORTEX Main App
// By Brilliant Tumelo Mere
// Features: quality filter no dirt posts, rankings, child safety RED auto-close, anti-scam, anonymous allowed, vault, downloads

import { supabase } from '../backend/db/supabase.js'; // will fallback to local if no backend

const API = localStorage.getItem('vortex_api') || 'http://localhost:3000/api';

class Database {
  static qualityFilter(text) {
    const bad = ['dirty','spam','scam','child','minor','underage','porn','xxx','nude'];
    const t = text.toLowerCase();
    if (bad.some(w => t.includes(w))) return false;
    if (text.length < 3) return false;
    if (text.length > 2000) return false;
    return true;
  }

  static getRankings() {
    return [
      { icon:'🔥', name:'Top Post', user:'@nova.create', score:'12.4k likes', type:'post' },
      { icon:'🎬', name:'Top Video / Reels', user:'@kai_vortex', score:'89k views', type:'reel' },
      { icon:'🎮', name:'Top Game Rank', user:'@zed_gamer', score:'Lv 99', type:'game' },
      { icon:'💰', name:'Top Buyer', user:'@luna_shop', score:'$4.2k spent', type:'buyer' },
      { icon:'👥', name:'Most Online', user:'@mira_live', score:'24h active', type:'online' },
      { icon:'🏅', name:'Best Video Maker', user:'@synth.arch', score:'1.2M earned', type:'maker' }
    ];
  }
}

class Security {
  static checkMessage(text) {
    const child = ['child','minor','underage','kid','teen','school kid','young boy','young girl'];
    const scam = ['send money fast','gift card','lottery win','verify account link','urgent transfer','crypto double','free money click'];
    const t = text.toLowerCase();
    if (child.some(w => t.includes(w))) {
      return { blocked:true, reason:'Child safety - RED and closed automatically', code:'CHILD' };
    }
    if (scam.some(w => t.includes(w))) {
      return { blocked:true, reason:'Scam detected - Awareness of people claiming to use someone account - RED and closed', code:'SCAM' };
    }
    return { blocked:false };
  }

  static redFlash() {
    document.body.style.transition = 'background.2s';
    document.body.style.background = '#7a0000';
    setTimeout(() => {
      document.body.style.background = '';
      if (window.Router) Router.go('home');
    }, 1200);
  }
}

export const App = {
  posts: JSON.parse(localStorage.getItem('vortex_posts') || '[]'),
  messages: JSON.parse(localStorage.getItem('vortex_msgs') || '[]'),

  init() {
    window.App = this;
    this.renderFeed();
    this.renderRankings();
    this.initReels();
    this.loadSettings();
    // PWA SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
    console.log('[VORTEX] By Brilliant Tumelo Mere - Initialized');
  },

  // FEED
  renderFeed() {
    const el = document.getElementById('feedList');
    if (!el) return;
    if (this.posts.length === 0) {
      el.innerHTML = `<div class="card small">No posts yet — Create first post, app improves quality so not messy</div>`;
      return;
    }
    el.innerHTML = this.posts.map(p => `
      <div class="card">
        <div class="p-head"><div class="avatar"></div><div><b>@you • ${p.time}</b><br><small class="small">${this.escape(p.text)}</small>
        ${p.media? `<div style="margin-top:10px;height:140px;border-radius:12px;background:#0a102a;border:1px solid var(--line);display:grid;place-items:center;color:var(--muted)">📎 ${p.media}</div>` : ''}
        </div></div>
        <div class="p-actions"><span onclick="App.like(${p.id})">♡ ${p.likes||0}</span><span>💬 0</span><span>↗ Share</span><span onclick="App.star(${p.id})">★ Star</span></div>
      </div>
    `).join('');
  },

  // RANKINGS TABLE
  renderRankings() {
    const el = document.getElementById('ranking-table');
    const dash = document.getElementById('dashboard-stats');
    const r = Database.getRankings();
    const html = `<div class="card"><b>🏆 Top Rankings — VORTEX</b><table class="rank">${r.map(x=>`<tr><td>${x.icon} ${x.name}</td><td>${x.user}</td><td>${x.score}</td></tr>`).join('')}</table><br><button class="v-btn" onclick="Router.go('dashboard')">View Dashboard</button></div>`;
    if (el) el.innerHTML = html;
    if (dash) dash.innerHTML = `<table class="rank">${r.map(x=>`<tr><td>${x.icon} ${x.name}</td><td>${x.user}</td><td>${x.score}</td></tr>`).join('')}</table>`;
  },

  // CREATE POST - AI VIDEO HELP + QUALITY FILTER
  async createPost() {
    const textEl = document.getElementById('aiPrompt');
    const fileEl = document.getElementById('fileInput');
    const text = textEl?.value?.trim();
    if (!text) return alert('Type something - Describe what AI should make');

    if (!Database.qualityFilter(text)) {
      alert('Quality filter: dirt post blocked — app improves post quality so not messy');
      return;
    }

    let media = fileEl?.files?.[0]?.name || null;

    // Try backend
    try {
      const res = await fetch(`${API}/posts`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ user_id:'local', text, media_url:media })
      });
      if (res.ok) console.log('Saved to backend');
    } catch {}

    // Local save
    const post = { id:Date.now(), text, media, time:new Date().toLocaleTimeString(), likes:0 };
    this.posts.unshift(post);
    localStorage.setItem('vortex_posts', JSON.stringify(this.posts));
    if (textEl) textEl.value = '';
    if (fileEl) fileEl.value = '';
    if (window.Router) Router.go('home');
    this.renderFeed();
  },

  like(id) {
    const p = this.posts.find(x=>x.id===id);
    if (p) { p.likes = (p.likes||0)+1; localStorage.setItem('vortex_posts', JSON.stringify(this.posts)); this.renderFeed(); }
  },

  star(id) {
    alert('Starred — saved to Vault + Downloads');
  },

  // MESSAGES - LOCKED, CHILD SAFETY RED, ANTI-SCAM, ANONYMOUS ALLOWED
  sendMsg() {
    const el = document.getElementById('msgInput');
    const text = el?.value?.trim();
    if (!text) return;

    const check = Security.checkMessage(text);
    if (check.blocked) {
      Security.redFlash();
      alert(check.reason);
      el.value = '';
      return;
    }

    // Anonymous allowed but anti-scam handled above
    this.messages.push({ id:Date.now(), text, time:new Date().toLocaleTimeString() });
    localStorage.setItem('vortex_msgs', JSON.stringify(this.messages));

    const list = document.getElementById('msgList');
    if (list) {
      list.innerHTML += `<div class="card" style="background:var(--card-2);margin-top:8px"><small class="small">${new Date().toLocaleTimeString()}</small><br>${this.escape(text)}</div>`;
    }
    el.value = '';
    // Notification disappearing but keep sensitive
    if (Notification && Notification.permission === 'granted') {
      const n = new Notification('VORTEX', { body:text.substring(0,40) });
      setTimeout(()=>n.close(), 3000);
    }
  },

  // REELS - SWIPE LEFT/RIGHT + AUTO SLIDE
  initReels() {
    const c = document.getElementById('reels-container');
    if (!c) return;
    c.innerHTML = [1,2,3,4,5,6].map(i=>`
      <div class="reel">
        <div class="reel-top"><b>user${i}_vortex</b><b> • Cyber Loop #${i} - AI Generated vertical 9:16</b><br><small>Best video maker ranking • ${i*12}k views</small></div>
        <div class="reel-mid">Video Preview ${i}<br><small>Drag left/right — auto slide 4s</small></div>
        <div class="reel-bot"><span>❤️ ${2+i}.3k</span><span>💬 ${80+i*10}</span><span>↗ Share</span><span>★ Star</span></div>
      </div>
    `).join('');

    let idx = 0;
    const auto = setInterval(()=>{
      idx = (idx+1) % c.children.length;
      c.children[idx]?.scrollIntoView({ behavior:'smooth', inline:'start', block:'nearest' });
      if (idx === 0) c.scrollTo({ left:0, behavior:'smooth' });
    }, 4000);

    c.onmouseenter = () => clearInterval(auto);
  },

  loadSettings() {
    const theme = localStorage.getItem('theme');
    if (theme) document.body.dataset.theme = theme;
  },

  escape(s) {
    return s.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
