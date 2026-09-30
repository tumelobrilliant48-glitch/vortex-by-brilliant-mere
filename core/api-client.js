// VORTEX Core API Client - Expose the frontend API client safely in - Your commit
// SAFE: No secrets here, only calls to backend. JWT stored in memory.

class VortexAPI {
  constructor() {
    this.base = window.location.origin.includes('localhost') 
      ? 'http://localhost:3000/api' 
      : '/api';
    this.token = localStorage.getItem('vortex_token') || null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('vortex_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('vortex_token');
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers
    };
    const res = await fetch(`${this.base}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Request failed'}));
      throw new Error(err.error || 'API error');
    }
    return res.json();
  }

  // AUTH # from backend/auth.js
  async register(username, password) {
    const data = await this.request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
    return data;
  }

  async login(username, password) {
    const { token, user } = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    this.setToken(token);
    return { token, user };
  }

  // SEARCH #332-356 - People, Post, Video, Reel, Hashtag
  async searchPeople(q) { return this.request(`/search/people?q=${encodeURIComponent(q)}`); }
  async searchPosts(q) { return this.request(`/search/posts?q=${encodeURIComponent(q)}`); }
  async searchReels(q) { return this.request(`/search/reels?q=${encodeURIComponent(q)}`); }

  // FEED #2-10 - Following, Recommended, Latest, Trending
  async getFeed(type='following') { return this.request(`/feed?type=${type}`); }
  async getReels() { return this.request('/reels'); }
  async getStories() { return this
