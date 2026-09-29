// VORTEX 🌌 - Interactive Application Logic

const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const tabs = document.querySelectorAll('.tab');
const filterBtns = document.querySelectorAll('.filter-btn');

// PAGE NAVIGATION
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Remove active class from all nav items
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    
    // Get the page name from data-page attribute
    const pageName = item.getAttribute('data-page');
    
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageName).classList.add('active');
  });
});

// PROFILE LINK
const profileLink = document.querySelector('.profile-link');
if (profileLink) {
  profileLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    navItems.forEach(nav => nav.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById('profile').classList.add('active');
  });
}

// FILTER BUTTONS
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    console.log(`Filter changed to: ${btn.textContent}`);
  });
});

// PROFILE TABS
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// CREATE BUTTON
const createBtn = document.querySelector('.create-btn');
if (createBtn) {
  createBtn.addEventListener('click', () => {
    console.log('🎨 Create new content modal would open here');
    alert('✨ Create new post/story/reel modal coming soon!');
  });
}

// INTERACTIVE CARDS
const storyCards = document.querySelectorAll('.story-card');
storyCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!card.classList.contains('add-story')) {
      console.log('📖 Story clicked');
    }
  });
});

const exploreCards = document.querySelectorAll('.explore-card');
exploreCards.forEach(card => {
  card.addEventListener('click', () => {
    console.log(`🔍 Explore category: ${card.textContent}`);
  });
});

const communityCards = document.querySelectorAll('.community-card');
communityCards.forEach(card => {
  card.addEventListener('click', () => {
    const name = card.querySelector('h3').textContent;
    console.log(`👥 Community clicked: ${name}`);
  });
});

// ACTION BUTTONS
const actionBtns = document.querySelectorAll('.action-btn');
actionBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = btn.textContent.trim();
    console.log(`📌 Action: ${action}`);
    
    // Visual feedback
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 100);
  });
});

// FOLLOW BUTTONS
const followBtns = document.querySelectorAll('.follow-btn');
followBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.textContent = btn.textContent === 'Follow' ? 'Following' : 'Follow';
    console.log(`👤 Follow button clicked`);
  });
});

// CHAT ITEMS
const chatItems = document.querySelectorAll('.chat-item');
chatItems.forEach(item => {
  item.addEventListener('click', () => {
    chatItems.forEach(chat => chat.classList.remove('active'));
    item.classList.add('active');
  });
});

// SEARCH FUNCTIONALITY
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      console.log(`🔍 Searching for: ${query}`);
    }
  });
}

// VORTEX THEME SWITCHER (Future Enhancement)
function initThemes() {
  const themes = ['Midnight', 'Ocean', 'Galaxy', 'Neon', 'Space'];
  console.log('🎨 Available themes:', themes);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌌 VORTEX initialized successfully!');
  console.log('Connect · Create · Discover');
  initThemes();
});

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'k') {
      e.preventDefault();
      console.log('🔍 Search shortcut triggered');
    }
    if (e.key === 'n') {
      e.preventDefault();
      console.log('✨ New post shortcut triggered');
    }
  }
});