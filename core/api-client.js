// core/api-client.js - VORTEX Frontend API Client
// By Brilliant Tumelo Mere
// Handles all API communication with backend

const API_BASE = window.location.origin + '/api';

class VortexAPI {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('vortex_user') || 'null');
    this.token = localStorage.getItem('vortex_token') || null;
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('vortex_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vortex_user');
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('vortex_token', token);
    } else {
      localStorage.removeItem('vortex_token');
    }
  }

  getUser() {
    return this.currentUser;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `API Error: ${res.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[VORTEX API] ${endpoint}:`, error.message);
      throw error;
    }
  }

  // AUTH
  async signup(username, email, password, displayName) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, display_name: displayName }),
    });
    if (data.user) {
      this.setUser(data.user);
      this.setToken(data.token);
    }
    return data;
  }

  async login(emailOrUsername, password) {
    const isEmail = emailOrUsername.includes('@');
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        [isEmail ? 'email' : 'username']: emailOrUsername,
        password,
      }),
    });
    if (data.user) {
      this.setUser(data.user);
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    try {
      const data = await this.request('/auth/logout', { method: 'POST' });
      this.setUser(null);
      this.setToken(null);
      return data;
    } catch (error) {
      this.setUser(null);
      this.setToken(null);
      throw error;
    }
  }

  async getUser(username) {
    if (username) {
      return this.request(`/users/me?username=${encodeURIComponent(username)}`);
    }
    return this.request('/users/me');
  }

  // POSTS
  async getPosts() {
    return this.request('/posts');
  }

  async createPost(content, mediaUrl, mediaType = '', visibility = 'public') {
    if (!this.currentUser) {
      throw new Error('Must be logged in to create a post');
    }
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        visibility,
      }),
    });
  }

  async likePost(postId) {
    if (!this.currentUser) {
      throw new Error('Must be logged in to like a post');
    }
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // MESSAGES
  async getMessages() {
    if (!this.currentUser) {
      throw new Error('Must be logged in to fetch messages');
    }
    return this.request('/messages');
  }

  async sendMessage(receiverId, content) {
    if (!this.currentUser) {
      throw new Error('Must be logged in to send a message');
    }
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
      }),
    });
  }

  // NOTIFICATIONS
  async getNotifications() {
    if (!this.currentUser) {
      throw new Error('Must be logged in to fetch notifications');
    }
    return this.request('/notifications');
  }

  // HEALTH CHECK
  async health() {
    return this.request('/health');
  }
}

export const api = new VortexAPI();
window.api = api; // Global access for debugging
