// VORTEX 🌌 - Interactive frontend prototype

const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const tabs = document.querySelectorAll('.tab');
const filterBtns = document.querySelectorAll('.filter-btn');
const STORAGE_KEY = 'vortex-demo-posts';

const demoPosts = [
  {
    id: 'welcome',
    author: 'Brilliant Mere',
    avatar: '👤',
    time: '2 hours ago',
    content: 'Welcome to VORTEX 🌌 — More Than a Social App... It\'s a Universe! 🚀\nConnect · Create · Discover',
    likes: 12,
    liked: false
  }
];

function getPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : demoPosts;
  } catch {
    return demoPosts;
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderPosts() {
  const feed = document.querySelector('.feed');
  if (!feed) return;
  feed.innerHTML = getPosts().map(post => `
    <article class="post" data-post-id="${post.id}">
      <div class="post-header">
        <div class="post-user">
          <div class="avatar">${post.avatar || '👤'}</div>
          <div><h3>${escapeHtml(post.author)}</h3><span class="timestamp">${escapeHtml(post.time)}</span></div>
        </div>
        <button class="menu-btn" type="button" aria-label="Post options">⋯</button>
      </div>
      <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
      <div class="post-actions">
        <button class="action-btn like-btn ${post.liked ? 'is-liked' : ''}" type="button">❤️ <span>${post.likes}</span> Like</button>
        <button class="action-btn" type="button">💬 Comment</button>
        <button class="action-btn" type="button">🔄 Repost</button>
        <button class="action-btn" type="button">📌 Save</button>
      </div>
    </article>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showPage(pageName) {
  const target = document.getElementById(pageName);
  if (!target) return;
  navItems.forEach(nav => nav.classList.toggle('active', nav.getAttribute('data-page') === pageName));
  pages.forEach(page => page.classList.toggle('active', page === target));
  history.replaceState(null, '', `#${pageName}`);
}

navItems.forEach(item => item.addEventListener('click', event => {
  event.preventDefault();
  showPage(item.dataset.page);
}));

document.querySelector('.profile-link')?.addEventListener('click', event => {
  event.preventDefault();
  showPage('profile');
});

filterBtns.forEach(button => button.addEventListener('click', () => {
  filterBtns.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
}));

tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
}));

function createPostModal() {
  if (document.getElementById('create-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'create-modal';
  modal.innerHTML = `<div class="modal-backdrop" data-close-modal></div>
    <form class="create-modal-card" id="create-form">
      <button class="modal-close" type="button" aria-label="Close" data-close-modal>×</button>
      <p class="eyebrow">CREATE IN VORTEX</p><h2>Share something with your universe</h2>
      <textarea id="post-text" maxlength="500" required placeholder="What are you creating today?"></textarea>
      <div class="modal-actions"><button type="button" class="secondary-btn" data-close-modal>Cancel</button><button type="submit" class="create-btn">Publish post</button></div>
    </form>`;
  Object.assign(modal.style, { position: 'fixed', inset: '0', zIndex: '20', display: 'grid', placeItems: 'center' });
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', () => modal.remove()));
  modal.querySelector('textarea').focus();
  modal.querySelector('#create-form').addEventListener('submit', event => {
    event.preventDefault();
    const text = modal.querySelector('#post-text').value.trim();
    if (!text) return;
    const posts = getPosts();
    posts.unshift({ id: `post-${Date.now()}`, author: 'You', avatar: '✨', time: 'Just now', content: text, likes: 0, liked: false });
    savePosts(posts);
    renderPosts();
    modal.remove();
    showPage('home');
  });
}

document.querySelector('.create-btn')?.addEventListener('click', createPostModal);

document.addEventListener('click', event => {
  const likeButton = event.target.closest('.like-btn');
  if (!likeButton) return;
  const post = getPosts().find(item => item.id === likeButton.closest('.post')?.dataset.postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  const posts = getPosts().map(item => item.id === post.id ? post : item);
  savePosts(posts);
  renderPosts();
});

document.querySelectorAll('.follow-btn').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  button.textContent = button.textContent === 'Follow' ? 'Following' : 'Follow';
}));

document.querySelector('.search-bar input')?.addEventListener('input', event => {
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.explore-card').forEach(card => {
    card.hidden = query && !card.textContent.toLowerCase().includes(query);
  });
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    createPostModal();
  }
  if (event.key === 'Escape') document.getElementById('create-modal')?.remove();
});

renderPosts();
const initialPage = location.hash.slice(1);
if (initialPage && document.getElementById(initialPage)) showPage(initialPage);
console.log('🌌 VORTEX initialized — local prototype mode');
