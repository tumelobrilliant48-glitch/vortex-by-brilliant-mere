// VORTEX Frontend API Client
// Handles authentication and communication with the Express backend.

(function () {
  const API_BASE = `${window.location.origin}/api`;

  class VortexAPI {
    constructor() {
      this.currentUser = JSON.parse(localStorage.getItem("vortex_user") || "null");
      this.token = localStorage.getItem("vortex_token") || null;
    }

    setUser(user) {
      this.currentUser = user;
      if (user) localStorage.setItem("vortex_user", JSON.stringify(user));
      else localStorage.removeItem("vortex_user");
    }

    setToken(token) {
      this.token = token;
      if (token) localStorage.setItem("vortex_token", token);
      else localStorage.removeItem("vortex_token");
    }

    getUser() {
      return this.currentUser;
    }

    async request(endpoint, options = {}) {
      const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(options.headers || {})
      };
      const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `API error: ${response.status}`);
      return data;
    }

    async signup(username, email, password, displayName) {
      const data = await this.request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, password, display_name: displayName })
      });
      if (data.user) this.setUser(data.user);
      if (data.token) this.setToken(data.token);
      return data;
    }

    async login(identity, password) {
      const field = identity.includes("@") ? "email" : "username";
      const data = await this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ [field]: identity, password })
      });
      if (data.user) this.setUser(data.user);
      if (data.token) this.setToken(data.token);
      return data;
    }

    async logout() {
      try {
        return await this.request("/auth/logout", { method: "POST" });
      } finally {
        this.setUser(null);
        this.setToken(null);
      }
    }

    async getPosts() {
      return this.request("/posts");
    }

    async createPost(content, mediaUrl = "", mediaType = "", visibility = "public") {
      return this.request("/posts", {
        method: "POST",
        body: JSON.stringify({ content, media_url: mediaUrl, media_type: mediaType, visibility })
      });
    }

    async likePost(postId) {
      return this.request(`/posts/${postId}/like`, { method: "POST" });
    }
  }

  window.vortexApi = new VortexAPI();
})();
