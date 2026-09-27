// core/router.js - VORTEX Router
// By Brilliant Tumelo Mere
// Handles: home reels create messages vault search settings marketplace premium dashboard monetization downloads

export const Router = {
  current: 'home',
  history: [],

  init() {
    window.Router = this;
    // Handle back button
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || 'home';
      this.go(page, false);
    });
    this.go('home', false);
  },

  go(id, push = true) {
    const target = document.getElementById(`page-${id}`);
    if (!target) {
      console.warn(`[VORTEX] Page ${id} not found`);
      return;
    }

    // Hide all
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');

    // Nav active state
    document.querySelectorAll('#nav button').forEach(btn => {
      btn.classList.remove('active');
      const onclick = btn.getAttribute('onclick') || '';
      if (onclick.includes(`'${id}'`)) btn.classList.add('active');
    });

    // Special for reels
    if (id === 'reels' && window.App) {
      App.initReels();
    }

    // Special for home
    if (id === 'home' && window.App) {
      App.renderFeed();
      App.renderRankings();
    }

    // Push state for back button
    if (push) {
      history.pushState({ page: id }, '', `#${id}`);
      this.history.push(this.current);
    }

    this.current = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
  },

  back() {
    const prev = this.history.pop() || 'home';
    this.go(prev, false);
    history.back();
  },

  // Quick openers for eyes engine
  openCreate() { this.go('create'); },
  openMessages() { this.go('messages'); },
  openVault() { this.go('vault'); },
  openSearch() { this.go('search'); },
  openSettings() { this.go('settings'); }
};
