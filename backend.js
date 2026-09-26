/* =========================================================
   VORTEX OMNIVERSE
   BACKEND / API BRIDGE
   ========================================================= */

"use strict";

const VortexBackend = {

  VERSION: "1.0.0",

  STORAGE_KEY: "vortex_backend_config",

  config: {
    enabled: false,
    mode: "local",
    baseURL: "",
    apiVersion: "v1",
    timeout: 15000,
    retries: 2,
    credentials: "include",
    debug: false
  },

  state: {
    online: navigator.onLine,
    connected: false,
    authenticated: false,
    lastRequest: null,
    lastError: null
  },

  token: null,

  listeners: {},

  requestQueue: [],

  cache: new Map(),

  /* =======================================================
     INIT
     ======================================================= */

  init(options = {}) {

    this.load();

    this.config = {
      ...this.config,
      ...options
    };

    this.state.online =
      navigator.onLine;

    this.token =
      this.loadToken();

    this.bindNetworkEvents();

    this.state.connected =
      Boolean(
        this.config.enabled &&
        this.config.baseURL
      );

    this.emit(
      "ready",
      {
        config: {
          ...this.config
        },
        online:
          this.state.online
      }
    );

    console.log(
      "🌐 VORTEX Backend Bridge ready."
    );

    return this;

  },

  /* =======================================================
     CONFIG
     ======================================================= */

  configure(options = {}) {

    this.config = {
      ...this.config,
      ...options
    };

    this.save();

    this.state.connected =
      Boolean(
        this.config.enabled &&
        this.config.baseURL
      );

    this.emit(
      "configured",
      this.config
    );

    return {
      success: true,
      config: {
        ...this.config
      }
    };

  },

  getConfig() {

    return {
      ...this.config
    };

  },

  /* =======================================================
     BASE URL
     ======================================================= */

  setBaseURL(url) {

    url =
      String(url || "")
        .trim()
        .replace(/\/+$/, "");

    this.config.baseURL =
      url;

    this.config.enabled =
      Boolean(url);

    this.save();

    return {
      success: true,
      baseURL: url
    };

  },

  getBaseURL() {

    return this.config.baseURL;

  },

  /* =======================================================
     AUTH TOKEN
     ======================================================= */

  setToken(token) {

    this.token =
      token || null;

    try {

      if (token) {

        localStorage.setItem(
          "vortex_api_token",
          token
        );

      } else {

        localStorage.removeItem(
          "vortex_api_token"
        );

      }

    } catch (error) {

      console.warn(
        "VORTEX token storage error:",
        error
      );

    }

    this.state.authenticated =
      Boolean(token);

    this.emit(
      "authChanged",
      {
        authenticated:
          this.state.authenticated
      }
    );

    return {
      success: true
    };

  },

  getToken() {

    return this.token;

  },

  loadToken() {

    try {

      return localStorage.getItem(
        "vortex_api_token"
      );

    } catch {

      return null;

    }

  },

  clearToken() {

    return this.setToken(
      null
    );

  },

  /* =======================================================
     AUTH HELPERS
     ======================================================= */

  login(token, user = null) {

    this.setToken(token);

    if (user) {

      try {

        localStorage.setItem(
          "vortex_backend_user",
          JSON.stringify(user)
        );

      } catch {}

    }

    return {
      success: true,
      user
    };

  },

  logout() {

    this.clearToken();

    try {

      localStorage.removeItem(
        "vortex_backend_user"
      );

    } catch {}

    this.emit(
      "logout"
    );

    return {
      success: true
    };

  },

  getUser() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "vortex_backend_user"
        ) || "null"
      );

    } catch {

      return null;

    }

  },

  isAuthenticated() {

    return Boolean(
      this.token
    );

  },

  /* =======================================================
     URL BUILDER
     ======================================================= */

  buildURL(path) {

    path =
      String(path || "");

    if (
      /^https?:\/\//i.test(path)
    ) {

      return path;

    }

    const base =
      this.config.baseURL
        .replace(/\/+$/, "");

    const cleanPath =
      path.replace(
        /^\/+/,
        ""
      );

    if (!base) {

      return "/" +
        cleanPath;

    }

    return (
      base +
      "/" +
      cleanPath
    );

  },

  /* =======================================================
     HEADERS
     ======================================================= */

  getHeaders(extra = {}) {

    const headers = {
      "Accept":
        "application/json",
      ...extra
    };

    if (
      this.token
    ) {

      headers[
        "Authorization"
      ] =
        `Bearer ${this.token}`;

    }

    return headers;

  },

  /* =======================================================
     REQUEST
     ======================================================= */

  async request(
    path,
    options = {}
  ) {

    if (
      !this.config.enabled ||
      !this.config.baseURL
    ) {

      return this.localResponse(
        path,
        options
      );

    }

    if (
      !navigator.onLine
    ) {

      this.queueRequest(
        path,
        options
      );

      return {
        success: false,
        offline: true,
        queued: true,
        error:
          "Device is offline."
      };

    }

    const method =
      String(
        options.method ||
        "GET"
      ).toUpperCase();

    const url =
      this.buildURL(
        path
      );

    const headers =
      this.getHeaders(
        options.headers ||
        {}
      );

    let body =
      options.body;

    if (
      body !== undefined &&
      body !== null &&
      typeof body ===
        "object" &&
      !(body instanceof FormData) &&
      !(body instanceof Blob)
    ) {

      headers[
        "Content-Type"
      ] =
        "application/json";

      body =
        JSON.stringify(
          body
        );

    }

    let attempt = 0;
    let lastError = null;

    while (
      attempt <=
      this.config.retries
    ) {

      try {

        this.state.lastRequest =
          Date.now();

        const controller =
          new AbortController();

        const timer =
          setTimeout(
            () =>
              controller.abort(),
            this.config.timeout
          );

        const response =
          await fetch(
            url,
            {
              method,
              headers,
              body,
              credentials:
                this.config.credentials,
              signal:
                controller.signal
            }
          );

        clearTimeout(
          timer
        );

        const result =
          await this.parseResponse(
            response
          );

        if (
          response.status ===
          401
        ) {

          this.state.authenticated =
            false;

          this.emit(
            "unauthorized",
            result
          );

        }

        if (
          !response.ok
        ) {

          throw new Error(
            result?.message ||
            result?.error ||
            `HTTP ${response.status}`
          );

        }

        this.state.lastError =
          null;

        this.state.connected =
          true;

        this.emit(
          "response",
          {
            path,
            method,
            result
          }
        );

        return {
          success: true,
          status:
            response.status,
          data:
            result
        };

      } catch (error) {

        lastError =
          error;

        attempt++;

        if (
          attempt >
          this.config.retries
        ) {
          break;
        }

        await this.delay(
          500 *
          attempt
        );

      }

    }

    this.state.lastError =
      lastError?.message ||
      "Request failed.";

    this.emit(
      "error",
      {
        path,
        method,
        error:
          this.state.lastError
      }
    );

    return {
      success: false,
      error:
        this.state.lastError
    };

  },

  /* =======================================================
     RESPONSE PARSER
     ======================================================= */

  async parseResponse(
    response
  ) {

    const type =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      type.includes(
        "application/json"
      )
    ) {

      return response.json();

    }

    return response.text();

  },

  /* =======================================================
     HTTP METHODS
     ======================================================= */

  get(
    path,
    params = {},
    options = {}
  ) {

    const query =
      new URLSearchParams();

    Object.entries(
      params
    ).forEach(
      ([key, value]) => {

        if (
          value !== undefined &&
          value !== null
        ) {

          query.set(
            key,
            String(value)
          );

        }

      }
    );

    const queryString =
      query.toString();

    const finalPath =
      queryString
        ? `${path}?${queryString}`
        : path;

    return this.request(
      finalPath,
      {
        ...options,
        method: "GET"
      }
    );

  },

  post(
    path,
    body = {},
    options = {}
  ) {

    return this.request(
      path,
      {
        ...options,
        method: "POST",
        body
      }
    );

  },

  put(
    path,
    body = {},
    options = {}
  ) {

    return this.request(
      path,
      {
        ...options,
        method: "PUT",
        body
      }
    );

  },

  patch(
    path,
    body = {},
    options = {}
  ) {

    return this.request(
      path,
      {
        ...options,
        method: "PATCH",
        body
      }
    );

  },

  delete(
    path,
    body = {},
    options = {}
  ) {

    return this.request(
      path,
      {
        ...options,
        method: "DELETE",
        body
      }
    );

  },

  /* =======================================================
     AUTH API
     ======================================================= */

  apiLogin(credentials) {

    return this.post(
      "/auth/login",
      credentials
    );

  },

  apiRegister(data) {

    return this.post(
      "/auth/register",
      data
    );

  },

  apiLogout() {

    return this.post(
      "/auth/logout"
    );

  },

  apiMe() {

    return this.get(
      "/auth/me"
    );

  },

  /* =======================================================
     POSTS
     ======================================================= */

  createPost(data) {

    return this.post(
      "/posts",
      data
    );

  },

  getPosts(params = {}) {

    return this.get(
      "/posts",
      params
    );

  },

  getPost(id) {

    return this.get(
      `/posts/${encodeURIComponent(id)}`
    );

  },

  updatePost(id, data) {

    return this.patch(
      `/posts/${encodeURIComponent(id)}`,
      data
    );

  },

  deletePost(id) {

    return this.delete(
      `/posts/${encodeURIComponent(id)}`
    );

  },

  /* =======================================================
     USERS
     ======================================================= */

  getUsers(params = {}) {

    return this.get(
      "/users",
      params
    );

  },

  getUserById(id) {

    return this.get(
      `/users/${encodeURIComponent(id)}`
    );

  },

  updateUser(id, data) {

    return this.patch(
      `/users/${encodeURIComponent(id)}`,
      data
    );

  },

  /* =======================================================
     FRIENDS
     ======================================================= */

  sendFriendRequest(userId) {

    return this.post(
      "/friends/request",
      {
        userId
      }
    );

  },

  acceptFriendRequest(userId) {

    return this.post(
      "/friends/accept",
      {
        userId
      }
    );

  },

  removeFriend(userId) {

    return this.delete(
      `/friends/${encodeURIComponent(userId)}`
    );

  },

  /* =======================================================
     CHAT
     ======================================================= */

  getConversations() {

    return this.get(
      "/chat/conversations"
    );

  },

  getMessages(
    conversationId,
    params = {}
  ) {

    return this.get(
      `/chat/${encodeURIComponent(
        conversationId
      )}/messages`,
      params
    );

  },

  sendMessage(
    conversationId,
    data
  ) {

    return this.post(
      `/chat/${encodeURIComponent(
        conversationId
      )}/messages`,
      data
    );

  },

  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  getNotifications(
    params = {}
  ) {

    return this.get(
      "/notifications",
      params
    );

  },

  markNotificationRead(
    id
  ) {

    return this.patch(
      `/notifications/${encodeURIComponent(
        id
      )}`,
      {
        read: true
      }
    );

  },

  /* =======================================================
     MEDIA UPLOAD
     ======================================================= */

  async uploadMedia(
    file,
    options = {}
  ) {

    if (!file) {

      return {
        success: false,
        error: "File is required."
      };

    }

    if (
      !this.config.enabled ||
      !this.config.baseURL
    ) {

      return {
        success: false,
        local: true,
        error:
          "No media backend configured."
      };

    }

    const form =
      new FormData();

    form.append(
      "file",
      file
    );

    Object.entries(
      options
    ).forEach(
      ([key, value]) => {

        if (
          value !== undefined &&
          value !== null
        ) {

          form.append(
            key,
            String(value)
          );

        }

      }
    );

    return this.request(
      "/media/upload",
      {
        method: "POST",
        body: form
      }
    );

  },

  /* =======================================================
     GENERIC FILE UPLOAD
     ======================================================= */

  upload(
    file,
    options = {}
  ) {

    return this.uploadMedia(
      file,
      options
    );

  },

  /* =======================================================
     GROUPS
     ======================================================= */

  getGroups(
    params = {}
  ) {

    return this.get(
      "/groups",
      params
    );

  },

  getGroup(id) {

    return this.get(
      `/groups/${encodeURIComponent(id)}`
    );

  },

  createGroup(data) {

    return this.post(
      "/groups",
      data
    );

  },

  joinGroup(id) {

    return this.post(
      `/groups/${encodeURIComponent(
        id
      )}/join`
    );

  },

  /* =======================================================
     EVENTS
     ======================================================= */

  getEvents(
    params = {}
  ) {

    return this.get(
      "/events",
      params
    );

  },

  createEvent(data) {

    return this.post(
      "/events",
      data
    );

  },

  attendEvent(id) {

    return this.post(
      `/events/${encodeURIComponent(
        id
      )}/attend`
    );

  },

  /* =======================================================
     GAMES
     ======================================================= */

  getGames(
    params = {}
  ) {

    return this.get(
      "/games",
      params
    );

  },

  saveGameScore(data) {

    return this.post(
      "/games/scores",
      data
    );

  },

  getLeaderboard(
    gameId,
    params = {}
  ) {

    return this.get(
      `/games/${encodeURIComponent(
        gameId
      )}/leaderboard`,
      params
    );

  },

  /* =======================================================
     VAULT
     ======================================================= */

  syncVault(items) {

    return this.post(
      "/vault/sync",
      {
        items
      }
    );

  },

  /* =======================================================
     AI
     ======================================================= */

  aiRequest(data) {

    return this.post(
      "/ai",
      data
    );

  },

  /* =======================================================
     CACHE
     ======================================================= */

  cacheSet(
    key,
    value,
    ttl = 300000
  ) {

    this.cache.set(
      key,
      {
        value,
        expires:
          Date.now() + ttl
      }
    );

  },

  cacheGet(key) {

    const entry =
      this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (
      Date.now() >
      entry.expires
    ) {

      this.cache.delete(
        key
      );

      return null;

    }

    return entry.value;

  },

  cacheDelete(key) {

    return this.cache.delete(
      key
    );

  },

  clearCache() {

    this.cache.clear();

  },

  /* =======================================================
     OFFLINE QUEUE
     ======================================================= */

  queueRequest(
    path,
    options
  ) {

    this.requestQueue.push({

      id:
        `queue_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`,

      path,

      options,

      createdAt:
        new Date().toISOString()

    });

    this.saveQueue();

    this.emit(
      "queued",
      this.requestQueue[
        this.requestQueue.length - 1
      ]
    );

  },

  async flushQueue() {

    if (
      !navigator.onLine
    ) {
      return;
    }

    if (
      !this.requestQueue.length
    ) {
      return;
    }

    const queue = [
      ...this.requestQueue
    ];

    this.requestQueue = [];

    this.saveQueue();

    for (
      const request
      of queue
    ) {

      const result =
        await this.request(
          request.path,
          request.options
        );

      if (
        !result.success
      ) {

        this.requestQueue.push(
          request
        );

      }

    }

    this.saveQueue();

    this.emit(
      "queueFlushed",
      {
        remaining:
          this.requestQueue.length
      }
    );

  },

  /* =======================================================
     NETWORK
     ======================================================= */

  bindNetworkEvents() {

    window.addEventListener(
      "online",
      () => {

        this.state.online =
          true;

        this.emit(
          "online"
        );

        this.flushQueue();

      }
    );

    window.addEventListener(
      "offline",
      () => {

        this.state.online =
          false;

        this.emit(
          "offline"
        );

      }
    );

  },

  /* =======================================================
     HEALTH CHECK
     ======================================================= */

  async healthCheck() {

    if (
      !this.config.baseURL
    ) {

      return {
        success: false,
        local: true,
        error:
          "Backend URL is not configured."
      };

    }

    const started =
      Date.now();

    const result =
      await this.get(
        "/health"
      );

    return {

      ...result,

      latency:
        Date.now() -
        started

    };

  },

  /* =======================================================
     LOCAL FALLBACK
     ======================================================= */

  localResponse(
    path,
    options
  ) {

    return {

      success: false,

      local: true,

      backend:
        "not-configured",

      path,

      method:
        options.method ||
        "GET",

      error:
        "VORTEX backend is not configured. Local engines can continue working."

    };

  },

  /* =======================================================
     HELPERS
     ======================================================= */

  delay(ms) {

    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );

  },

  /* =======================================================
     EVENTS
     ======================================================= */

  on(
    event,
    callback
  ) {

    if (
      !this.listeners[event]
    ) {

      this.listeners[event] =
        [];

    }

    this.listeners[event].push(
      callback
    );

    return () => {

      this.listeners[event] =
        this.listeners[event]
          .filter(
            fn =>
              fn !== callback
          );

    };

  },

  emit(
    event,
    data
  ) {

    (
      this.listeners[event] ||
      []
    ).forEach(
      callback => {

        try {

          callback(data);

        } catch (error) {

          console.error(
            "VORTEX Backend listener error:",
            error
          );

        }

      }
    );

  },

  /* =======================================================
     STORAGE
     ======================================================= */

  save() {

    try {

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(
          this.config
        )
      );

      this.saveQueue();

    } catch (error) {

      console.warn(
        "VORTEX Backend save error:",
        error
      );

    }

  },

  saveQueue() {

    try {

      localStorage.setItem(
        "vortex_backend_queue",
        JSON.stringify(
          this.requestQueue
        )
      );

    } catch {}

  },

  load() {

    try {

      const config =
        JSON.parse(
          localStorage.getItem(
            this.STORAGE_KEY
          ) || "{}"
        );

      this.config = {
        ...this.config,
        ...config
      };

      this.requestQueue =
        JSON.parse(
          localStorage.getItem(
            "vortex_backend_queue"
          ) || "[]"
        );

    } catch (error) {

      console.warn(
        "VORTEX Backend load error:",
        error
      );

    }

  },

  /* =======================================================
     STATUS
     ======================================================= */

  getStatus() {

    return {

      version:
        this.VERSION,

      online:
        this.state.online,

      connected:
        this.state.connected,

      authenticated:
        this.state.authenticated,

      configured:
        Boolean(
          this.config.baseURL
        ),

      queued:
        this.requestQueue.length,

      lastRequest:
        this.state.lastRequest,

      lastError:
        this.state.lastError

    };

  }

};

/* =========================================================
   GLOBAL
   ========================================================= */

window.VortexBackend =
  VortexBackend;

/* =========================================================
   OPTIONAL ALIAS
   ========================================================= */

window.VortexAPI =
  VortexBackend;

/* =========================================================
   AUTO INIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexBackend.init();

  }
);
