// core/api-client.js - VORTEX Frontend API Client
// By Brilliant Tumelo Mere
// Handles all API communication with backend

const API_BASE = window.location.origin + '/api';

class VortexAPI {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('vortex_user') || 'null');
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('vortex_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vortex_user');
    }
  }

  getUser() {
    return this.currentUser;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();

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
    }
    return data;
  }

  logout() {
    this.setUser(null);
  }

  async getUser(username) {
    return this.request(`/users/me?username=${encodeURIComponent(username)}`);
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
        user_id: this.currentUser.id,
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
      body: JSON.stringify({ user_id: this.currentUser.id }),
    });
  }

  // MESSAGES
  async getMessages() {
    if (!this.currentUser) {
      throw new Error('Must be logged in to fetch messages');
    }
    return this.request(`/messages?user_id=${this.currentUser.id}`);
  }

  async sendMessage(receiverId, content) {
    if (!this.currentUser) {
      throw new Error('Must be logged in to send a message');
    }
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        sender_id: this.currentUser.id,
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
    return this.request(`/notifications?user_id=${this.currentUser.id}`);
  }

  // HEALTH CHECK
  async health() {
    return this.request('/health');
  }
}

export const api = new VortexAPI();
window.api = api; // Global access for debugging
