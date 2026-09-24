/* =========================================================
   VORTEX EXPLORE ENGINE
   File: explore.js

   Handles:
   - Explore content
   - Trending content
   - Topics
   - Creators
   - Search
   - Engagement tracking
   - Recent searches
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "vortex_explore_items";
  const SEARCH_KEY = "vortex_explore_searches";
  const EVENT_NAME = "vortex:explore-change";

  const TYPES = ["post", "video", "creator", "topic"];

  /* -------------------------------------------------------
     Storage helpers
     ------------------------------------------------------- */

  function readItems() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    emitChange();
  }

  function readSearches() {
    try {
      const data = JSON.parse(localStorage.getItem(SEARCH_KEY));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveSearches(searches) {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(searches));
  }

  function emitChange() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          items: readItems()
        }
      })
    );
  }

  /* -------------------------------------------------------
     Utilities
     ------------------------------------------------------- */

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function toDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return new Date();
    }

    return date;
  }

  function ageInHours(date) {
    const milliseconds = Date.now() - date.getTime();

    return Math.max(0, milliseconds / 3600000);
  }

  function normalizeTags(tags) {
    if (!Array.isArray(tags)) {
      if (typeof tags === "string") {
        tags = tags.split(",");
      } else {
        return [];
      }
    }

    return [
      ...new Set(
        tags
          .map(tag => String(tag).trim().replace(/^#/, ""))
          .filter(Boolean)
      )
    ];
  }

  /* -------------------------------------------------------
     Trending score
     ------------------------------------------------------- */

  function calculateScore(item) {
    const likes = number(item.likes);
    const comments = number(item.comments);
    const shares = number(item.shares);
    const views = number(item.views);
    const saves = number(item.saves);

    const engagement =
      likes * 2 +
      comments * 4 +
      shares * 6 +
      saves * 5 +
      views * 0.15;

    const age = ageInHours(toDate(item.createdAt));

    /*
      Newer content receives a stronger score.
      The score gradually decreases as content becomes older.
    */
    const freshness = 1 / Math.pow(age + 2, 0.55);

    return Number((engagement * freshness).toFixed(4));
  }

  /* -------------------------------------------------------
     Add content
     ------------------------------------------------------- */

  function addItem(data = {}) {
    const type = TYPES.includes(data.type)
      ? data.type
      : "post";

    const item = {
      id: data.id || generateId("explore"),
      type,

      title: String(data.title || ""),
      description: String(data.description || ""),

      authorId: data.authorId || null,
      authorName: String(data.authorName || ""),
      authorAvatar: data.authorAvatar || null,

      media: data.media || null,
      mediaId: data.mediaId || null,

      tags: normalizeTags(data.tags),

      views: number(data.views),
      likes: number(data.likes),
      comments: number(data.comments),
      shares: number(data.shares),
      saves: number(data.saves),

      createdAt: data.createdAt || new Date().toISOString(),

      metadata: data.metadata || {},

      score: 0
    };

    item.score = calculateScore(item);

    const items = readItems();

    const existingIndex = items.findIndex(
      existing => existing.id === item.id
    );

    if (existingIndex >= 0) {
      items[existingIndex] = {
        ...items[existingIndex],
        ...item
      };
    } else {
      items.push(item);
    }

    saveItems(items);

    return item;
  }

  /* -------------------------------------------------------
     Register multiple items
     ------------------------------------------------------- */

  function addItems(items = []) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map(item => addItem(item))
      .filter(Boolean);
  }

  /* -------------------------------------------------------
     Get item
     ------------------------------------------------------- */

  function getItem(id) {
    return readItems().find(item => item.id === id) || null;
  }

  /* -------------------------------------------------------
     Remove item
     ------------------------------------------------------- */

  function removeItem(id) {
    const items = readItems();

    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === items.length) {
      return false;
    }

    saveItems(filtered);

    return true;
  }

  /* -------------------------------------------------------
     Update item
     ------------------------------------------------------- */

  function updateItem(id, updates = {}) {
    const items = readItems();

    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = {
      ...items[index],
      ...updates
    };

    updated.tags = normalizeTags(updated.tags);
    updated.score = calculateScore(updated);

    items[index] = updated;

    saveItems(items);

    return updated;
  }

  /* -------------------------------------------------------
     Get all content
     ------------------------------------------------------- */

  function getAll(options = {}) {
    let items = readItems();

    if (options.type) {
      items = items.filter(item => item.type === options.type);
    }

    if (options.authorId) {
      items = items.filter(
        item => item.authorId === options.authorId
      );
    }

    if (options.tag) {
      const tag = normalize(options.tag);

      items = items.filter(item =>
        item.tags.some(existingTag =>
          normalize(existingTag) === tag
        )
      );
    }

    items.forEach(item => {
      item.score = calculateScore(item);
    });

    if (options.sort === "newest") {
      items.sort(
        (a, b) =>
          toDate(b.createdAt) - toDate(a.createdAt)
      );
    } else if (options.sort === "oldest") {
      items.sort(
        (a, b) =>
          toDate(a.createdAt) - toDate(b.createdAt)
      );
    } else {
      items.sort((a, b) => b.score - a.score);
    }

    if (options.limit) {
      items = items.slice(0, Number(options.limit));
    }

    return items;
  }

  /* -------------------------------------------------------
     Trending
     ------------------------------------------------------- */

  function trending(options = {}) {
    const limit = Number(options.limit) || 20;

    return getAll({
      type: options.type,
      tag: options.tag
    }).slice(0, limit);
  }

  /* -------------------------------------------------------
     Discover
     ------------------------------------------------------- */

  function discover(options = {}) {
    let items = getAll({
      type: options.type,
      tag: options.tag,
      sort: options.sort || "trending"
    });

    if (options.query) {
      const query = normalize(options.query);

      items = items.filter(item => {
        const searchableText = [
          item.title,
          item.description,
          item.authorName,
          ...item.tags
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    if (options.limit) {
      items = items.slice(0, Number(options.limit));
    }

    return items;
  }

  /* -------------------------------------------------------
     Search
     ------------------------------------------------------- */

  function search(query, options = {}) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
      return [];
    }

    trackSearch(cleanQuery);

    return discover({
      ...options,
      query: cleanQuery
    });
  }

  /* -------------------------------------------------------
     Search history
     ------------------------------------------------------- */

  function trackSearch(query) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
      return;
    }

    let searches = readSearches();

    searches = searches.filter(
      item => normalize(item.query) !== normalize(cleanQuery)
    );

    searches.unshift({
      id: generateId("search"),
      query: cleanQuery,
      createdAt: new Date().toISOString()
    });

    searches = searches.slice(0, 20);

    saveSearches(searches);
  }

  function getRecentSearches(limit = 10) {
    return readSearches().slice(0, Number(limit));
  }

  function clearSearchHistory() {
    localStorage.removeItem(SEARCH_KEY);
  }

  /* -------------------------------------------------------
     Topics
     ------------------------------------------------------- */

  function getTopics(options = {}) {
    const items = readItems();
    const topicMap = {};

    items.forEach(item => {
      item.tags.forEach(tag => {
        const cleanTag = String(tag).trim();

        if (!cleanTag) {
          return;
        }

        const key = normalize(cleanTag);

        if (!topicMap[key]) {
          topicMap[key] = {
            name: cleanTag,
            posts: 0,
            views: 0,
            likes: 0,
            score: 0
          };
        }

        topicMap[key].posts += 1;
        topicMap[key].views += number(item.views);
        topicMap[key].likes += number(item.likes);
        topicMap[key].score += calculateScore(item);
      });
    });

    let topics = Object.values(topicMap);

    topics.sort((a, b) => b.score - a.score);

    if (options.limit) {
      topics = topics.slice(0, Number(options.limit));
    }

    return topics;
  }

  /* -------------------------------------------------------
     Creators
     ------------------------------------------------------- */

  function getCreators(options = {}) {
    let creators = readItems().filter(
      item => item.type === "creator"
    );

    creators.sort(
      (a, b) => calculateScore(b) - calculateScore(a)
    );

    if (options.limit) {
      creators = creators.slice(0, Number(options.limit));
    }

    return creators;
  }

  /* -------------------------------------------------------
     Engagement
     ------------------------------------------------------- */

  function recordEngagement(id, type) {
    const item = getItem(id);

    if (!item) {
      return null;
    }

    const supportedTypes = [
      "view",
      "like",
      "comment",
      "share",
      "save"
    ];

    if (!supportedTypes.includes(type)) {
      return item;
    }

    const field = `${type}s`;

    if (type === "view") {
      item.views += 1;
    } else if (type === "like") {
      item.likes += 1;
    } else if (type === "comment") {
      item.comments += 1;
    } else if (type === "share") {
      item.shares += 1;
    } else if (type === "save") {
      item.saves += 1;
    }

    item.score = calculateScore(item);

    updateItem(id, item);

    return item;
  }

  function recordView(id) {
    return recordEngagement(id, "view");
  }

  function recordLike(id) {
    return recordEngagement(id, "like");
  }

  function recordComment(id) {
    return recordEngagement(id, "comment");
  }

  function recordShare(id) {
    return recordEngagement(id, "share");
  }

  function recordSave(id) {
    return recordEngagement(id, "save");
  }

  /* -------------------------------------------------------
     Clear explore database
     ------------------------------------------------------- */

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    emitChange();
  }

  /* -------------------------------------------------------
     Events
     ------------------------------------------------------- */

  function onChange(callback) {
    if (typeof callback !== "function") {
      return function () {};
    }

    const handler = event => {
      callback(event.detail);
    };

    window.addEventListener(EVENT_NAME, handler);

    return function unsubscribe() {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }

  /* -------------------------------------------------------
     Public API
     ------------------------------------------------------- */

  window.VortexExplore = {
    addItem,
    addItems,

    getItem,
    getAll,
    updateItem,
    removeItem,

    trending,
    discover,
    search,

    getTopics,
    getCreators,

    recordEngagement,
    recordView,
    recordLike,
    recordComment,
    recordShare,
    recordSave,

    trackSearch,
    getRecentSearches,
    clearSearchHistory,

    calculateScore,

    clear,

    onChange
  };

})();
