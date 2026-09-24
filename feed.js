/* =========================================================
   VORTEX FEED ENGINE
   File: feed.js

   Handles:
   - Home feed
   - Personalized feed
   - Following feed
   - Trending feed
   - Latest feed
   - Pagination
   - Likes/comments/shares/saves
   - Hidden posts
   - Feed preferences
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "vortex_feed_posts";
  const HIDDEN_KEY = "vortex_hidden_posts";
  const PREFS_KEY = "vortex_feed_preferences";

  const EVENT_NAME = "vortex:feed-change";

  /* -------------------------------------------------------
     Storage
     ------------------------------------------------------- */

  function readPosts() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function savePosts(posts) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(posts)
    );

    emitChange();
  }

  function readHidden() {
    try {
      const data = JSON.parse(
        localStorage.getItem(HIDDEN_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveHidden(hidden) {
    localStorage.setItem(
      HIDDEN_KEY,
      JSON.stringify(hidden)
    );
  }

  function readPreferences() {
    try {
      const data = JSON.parse(
        localStorage.getItem(PREFS_KEY)
      );

      return data && typeof data === "object"
        ? data
        : defaultPreferences();
    } catch (error) {
      return defaultPreferences();
    }
  }

  function savePreferences(preferences) {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify(preferences)
    );
  }

  /* -------------------------------------------------------
     Defaults
     ------------------------------------------------------- */

  function defaultPreferences() {
    return {
      mode: "personalized",
      showVideos: true,
      showReposts: true,
      showSuggestedCreators: true,
      hideSeenPosts: false,
      pageSize: 10
    };
  }

  /* -------------------------------------------------------
     Helpers
     ------------------------------------------------------- */

  function generateId() {
    return (
      "post_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function number(value) {
    const n = Number(value);

    return Number.isFinite(n) ? n : 0;
  }

  function date(value) {
    const result = new Date(value);

    if (Number.isNaN(result.getTime())) {
      return new Date();
    }

    return result;
  }

  function ageHours(value) {
    return Math.max(
      0,
      (Date.now() - date(value).getTime()) / 3600000
    );
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function emitChange() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          posts: readPosts()
        }
      })
    );
  }

  /* -------------------------------------------------------
     Feed score
     ------------------------------------------------------- */

  function calculateFeedScore(post) {
    const likes = number(post.likes);
    const comments = number(post.comments);
    const shares = number(post.shares);
    const views = number(post.views);
    const saves = number(post.saves);

    const engagement =
      likes * 2 +
      comments * 4 +
      shares * 6 +
      saves * 5 +
      views * 0.1;

    const freshness =
      1 / Math.pow(ageHours(post.createdAt) + 2, 0.5);

    const quality =
      post.verifiedAuthor ? 1.15 : 1;

    return engagement * freshness * quality;
  }

  /* -------------------------------------------------------
     Create post
     ------------------------------------------------------- */

  function createPost(data = {}) {
    const post = {
      id: data.id || generateId(),

      authorId: data.authorId || null,
      authorName: String(data.authorName || ""),
      authorAvatar: data.authorAvatar || null,

      text: String(data.text || ""),
      title: String(data.title || ""),

      type: data.type || "text",

      media: data.media || null,
      mediaId: data.mediaId || null,

      tags: Array.isArray(data.tags)
        ? data.tags
        : [],

      likes: number(data.likes),
      comments: number(data.comments),
      shares: number(data.shares),
      saves: number(data.saves),
      views: number(data.views),

      verifiedAuthor: Boolean(
        data.verifiedAuthor
      ),

      repostOf: data.repostOf || null,

      createdAt:
        data.createdAt ||
        new Date().toISOString(),

      metadata: data.metadata || {},

      score: 0
    };

    post.score = calculateFeedScore(post);

    const posts = readPosts();

    const existing = posts.findIndex(
      item => item.id === post.id
    );

    if (existing >= 0) {
      posts[existing] = {
        ...posts[existing],
        ...post
      };
    } else {
      posts.push(post);
    }

    savePosts(posts);

    return post;
  }

  /* -------------------------------------------------------
     Import posts
     ------------------------------------------------------- */

  function addPosts(posts = []) {
    if (!Array.isArray(posts)) {
      return [];
    }

    return posts.map(post => createPost(post));
  }

  /* -------------------------------------------------------
     Get post
     ------------------------------------------------------- */

  function getPost(id) {
    return (
      readPosts().find(post => post.id === id) ||
      null
    );
  }

  /* -------------------------------------------------------
     Update post
     ------------------------------------------------------- */

  function updatePost(id, updates = {}) {
    const posts = readPosts();

    const index = posts.findIndex(
      post => post.id === id
    );

    if (index === -1) {
      return null;
    }

    posts[index] = {
      ...posts[index],
      ...updates
    };

    posts[index].score =
      calculateFeedScore(posts[index]);

    savePosts(posts);

    return posts[index];
  }

  /* -------------------------------------------------------
     Delete post
     ------------------------------------------------------- */

  function deletePost(id) {
    const posts = readPosts();

    const filtered = posts.filter(
      post => post.id !== id
    );

    if (filtered.length === posts.length) {
      return false;
    }

    savePosts(filtered);

    return true;
  }

  /* -------------------------------------------------------
     Hidden posts
     ------------------------------------------------------- */

  function hidePost(id) {
    const hidden = readHidden();

    if (!hidden.includes(id)) {
      hidden.push(id);
      saveHidden(hidden);
    }

    return true;
  }

  function unhidePost(id) {
    const hidden = readHidden().filter(
      item => item !== id
    );

    saveHidden(hidden);

    return true;
  }

  function isHidden(id) {
    return readHidden().includes(id);
  }

  function getHiddenPosts() {
    return readHidden();
  }

  /* -------------------------------------------------------
     Filter hidden posts
     ------------------------------------------------------- */

  function removeHidden(posts) {
    const hidden = new Set(readHidden());

    return posts.filter(
      post => !hidden.has(post.id)
    );
  }

  /* -------------------------------------------------------
     Following check
     ------------------------------------------------------- */

  function isFollowing(post, following = []) {
    if (!post.authorId) {
      return false;
    }

    return following.includes(post.authorId);
  }

  /* -------------------------------------------------------
     Personalized ranking
     ------------------------------------------------------- */

  function personalized(posts, options = {}) {
    const following = Array.isArray(
      options.following
    )
      ? options.following
      : [];

    const interests = Array.isArray(
      options.interests
    )
      ? options.interests.map(normalize)
      : [];

    return posts
      .map(post => {
        let score = calculateFeedScore(post);

        if (
          isFollowing(post, following)
        ) {
          score += 100;
        }

        if (post.verifiedAuthor) {
          score += 5;
        }

        if (interests.length) {
          const tags = Array.isArray(post.tags)
            ? post.tags.map(normalize)
            : [];

          const matches = tags.filter(tag =>
            interests.includes(tag)
          ).length;

          score += matches * 20;
        }

        return {
          ...post,
          score
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /* -------------------------------------------------------
     Latest
     ------------------------------------------------------- */

  function latest(posts) {
    return posts.sort(
      (a, b) =>
        date(b.createdAt) -
        date(a.createdAt)
    );
  }

  /* -------------------------------------------------------
     Trending
     ------------------------------------------------------- */

  function trending(posts) {
    return posts
      .map(post => ({
        ...post,
        score: calculateFeedScore(post)
      }))
      .sort(
        (a, b) => b.score - a.score
      );
  }

  /* -------------------------------------------------------
     Build feed
     ------------------------------------------------------- */

  function buildFeed(options = {}) {
    const preferences = {
      ...readPreferences(),
      ...options
    };

    let posts = readPosts();

    posts = removeHidden(posts);

    if (
      preferences.showVideos === false
    ) {
      posts = posts.filter(
        post => post.type !== "video"
      );
    }

    if (
      preferences.showReposts === false
    ) {
      posts = posts.filter(
        post => !post.repostOf
      );
    }

    switch (preferences.mode) {
      case "latest":
        posts = latest(posts);
        break;

      case "trending":
        posts = trending(posts);
        break;

      case "following":
        posts = posts.filter(
          post =>
            isFollowing(
              post,
              preferences.following || []
            )
        );

        posts = latest(posts);
        break;

      case "personalized":
      default:
        posts = personalized(
          posts,
          preferences
        );
        break;
    }

    return posts;
  }

  /* -------------------------------------------------------
     Pagination
     ------------------------------------------------------- */

  function getPage(page = 1, options = {}) {
    const preferences = readPreferences();

    const pageSize =
      Number(options.pageSize) ||
      Number(preferences.pageSize) ||
      10;

    const currentPage =
      Math.max(1, Number(page));

    const feed = buildFeed(options);

    const start =
      (currentPage - 1) * pageSize;

    const items = feed.slice(
      start,
      start + pageSize
    );

    return {
      items,

      page: currentPage,

      pageSize,

      total: feed.length,

      totalPages:
        Math.ceil(feed.length / pageSize),

      hasNext:
        start + pageSize < feed.length,

      hasPrevious:
        currentPage > 1
    };
  }

  /* -------------------------------------------------------
     Refresh
     ------------------------------------------------------- */

  function refresh(options = {}) {
    return getPage(1, options);
  }

  /* -------------------------------------------------------
     Engagement
     ------------------------------------------------------- */

  function engage(id, action) {
    const post = getPost(id);

    if (!post) {
      return null;
    }

    switch (action) {
      case "view":
        post.views += 1;
        break;

      case "like":
        post.likes += 1;
        break;

      case "comment":
        post.comments += 1;
        break;

      case "share":
        post.shares += 1;
        break;

      case "save":
        post.saves += 1;
        break;

      default:
        return post;
    }

    post.score =
      calculateFeedScore(post);

    updatePost(id, post);

    /*
      Also notify Explore when available.
    */
    if (
      window.VortexExplore &&
      typeof window.VortexExplore.recordEngagement ===
        "function"
    ) {
      try {
        window.VortexExplore.recordEngagement(
          id,
          action
        );
      } catch (error) {
        // Ignore optional Explore integration errors.
      }
    }

    return post;
  }

  function view(id) {
    return engage(id, "view");
  }

  function like(id) {
    return engage(id, "like");
  }

  function comment(id) {
    return engage(id, "comment");
  }

  function share(id) {
    return engage(id, "share");
  }

  function save(id) {
    return engage(id, "save");
  }

  /* -------------------------------------------------------
     Repost
     ------------------------------------------------------- */

  function repost(id, user = {}) {
    const original = getPost(id);

    if (!original) {
      return null;
    }

    const repost = createPost({
      authorId: user.id || null,
      authorName: user.name || "",
      authorAvatar: user.avatar || null,

      text: user.text || "",

      type: "repost",

      repostOf: original.id,

      tags: original.tags,

      createdAt:
        new Date().toISOString()
    });

    engage(original.id, "share");

    return repost;
  }

  /* -------------------------------------------------------
     Feed preferences
     ------------------------------------------------------- */

  function getPreferences() {
    return readPreferences();
  }

  function updatePreferences(updates = {}) {
    const current = readPreferences();

    const updated = {
      ...current,
      ...updates
    };

    savePreferences(updated);

    emitChange();

    return updated;
  }

  function resetPreferences() {
    const defaults =
      defaultPreferences();

    savePreferences(defaults);

    emitChange();

    return defaults;
  }

  /* -------------------------------------------------------
     Follow-based feed helper
     ------------------------------------------------------- */

  function getFollowingFeed(
    following = [],
    options = {}
  ) {
    return getPage(1, {
      ...options,
      mode: "following",
      following
    });
  }

  /* -------------------------------------------------------
     User feed
     ------------------------------------------------------- */

  function getUserFeed(
    userId,
    options = {}
  ) {
    const posts = readPosts()
      .filter(
        post =>
          post.authorId === userId
      )
      .filter(
        post =>
          !isHidden(post.id)
      );

    const sorted =
      options.sort === "latest"
        ? latest(posts)
        : trending(posts);

    const limit =
      Number(options.limit) || sorted.length;

    return sorted.slice(0, limit);
  }

  /* -------------------------------------------------------
     Search feed
     ------------------------------------------------------- */

  function search(query, options = {}) {
    const cleanQuery =
      normalize(query);

    if (!cleanQuery) {
      return [];
    }

    const posts = removeHidden(
      readPosts()
    );

    const results = posts.filter(post => {
      const searchable = [
        post.text,
        post.title,
        post.authorName,
        ...(Array.isArray(post.tags)
          ? post.tags
          : [])
     
