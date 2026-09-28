/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / FEED.JS
========================================================= */

"use strict";

const VortexFeed = {

  state: {
    posts: [],
    ranking: [],
    initialized: false
  },

  settings: {
    showStoriesFirst: true,
    showBestPosts: true,
    qualityFiltering: true,
    hideLowQuality: false
  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.load();

    this.state.initialized = true;

    this.rebuildRanking();

    this.emit("ready");

  },


  /* =======================================================
     ADD POST
  ======================================================= */

  addPost(post = {}) {

    const item = {

      id:
        post.id ||
        `post_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      author:
        post.author || "VORTEX User",

      authorId:
        post.authorId || null,

      avatar:
        post.avatar || null,

      text:
        String(post.text || ""),

      media:
        post.media || [],

      type:
        post.type || "post",

      createdAt:
        post.createdAt ||
        new Date().toISOString(),

      likes: 0,

      comments: 0,

      shares: 0,

      stars: 0,

      views: 0,

      saves: 0,

      quality: null,

      hidden: false

    };


    item.quality =
      this.analyzeQuality(item);


    if (
      this.settings.qualityFiltering &&
      this.settings.hideLowQuality &&
      item.quality.score < 30
    ) {

      item.hidden = true;

    }


    this.state.posts.unshift(
      item
    );

    this.rebuildRanking();

    this.save();

    this.emit(
      "postAdded",
      item
    );

    return item;

  },


  /* =======================================================
     QUALITY ANALYSIS
  ======================================================= */

  analyzeQuality(post) {

    let score = 100;

    const warnings = [];


    const text =
      String(post.text || "").trim();


    if (!text) {

      score -= 15;

      warnings.push(
        "No caption"
      );

    }


    if (
      text.length > 5000
    ) {

      score -= 10;

      warnings.push(
        "Very long caption"
      );

    }


    if (
      /(.)\1{7,}/.test(text)
    ) {

      score -= 20;

      warnings.push(
        "Excessive repeated characters"
      );

    }


    if (
      /[!?]{6,}/.test(text)
    ) {

      score -= 10;

      warnings.push(
        "Excessive punctuation"
      );

    }


    const mediaCount =
      Array.isArray(post.media)
        ? post.media.length
        : 0;


    if (
      post.type !== "text" &&
      mediaCount === 0
    ) {

      score -= 10;

      warnings.push(
        "Missing media"
      );

    }


    score =
      Math.max(
        0,
        Math.min(100, score)
      );


    return {

      score,

      level:
        score >= 80
          ? "high"
          : score >= 50
            ? "medium"
            : "low",

      warnings

    };

  },


  /* =======================================================
     POST INTERACTIONS
  ======================================================= */

  like(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.likes++;

    this.rebuildRanking();

    this.save();

    this.emit(
      "liked",
      post
    );

    return true;

  },


  comment(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.comments++;

    this.rebuildRanking();

    this.save();

    return true;

  },


  share(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.shares++;

    this.rebuildRanking();

    this.save();

    this.emit(
      "shared",
      post
    );

    return true;

  },


  star(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.stars++;

    this.rebuildRanking();

    this.save();

    return true;

  },


  view(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.views++;

    this.rebuildRanking();

    this.save();

    return true;

  },


  savePost(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.saves++;

    this.save();

    return true;

  },


  /* =======================================================
     RANKING
  ======================================================= */

  calculateRank(post) {

    return (
      post.likes * 2 +
      post.comments * 3 +
      post.shares * 4 +
      post.stars * 2 +
      post.saves * 3 +
      post.views * 0.1 +
      post.quality.score
    );

  },


  rebuildRanking() {

    this.state.ranking =
      [...this.state.posts]
        .filter(
          post => !post.hidden
        )
        .sort(
          (a, b) =>
            this.calculateRank(b) -
            this.calculateRank(a)
        );

  },


  getBestPosts(limit = 20) {

    return this.state.ranking
      .slice(0, limit);

  },


  getNewPosts(limit = 20) {

    return [...this.state.posts]
      .filter(
        post => !post.hidden
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, limit);

  },


  /* =======================================================
     SEARCH
  ======================================================= */

  search(query) {

    const text =
      String(query || "")
        .toLowerCase()
        .trim();


    if (!text) {
      return [];
    }


    return this.state.posts
      .filter(post => {

        return (
          post.text
            .toLowerCase()
            .includes(text) ||

          post.author
            .toLowerCase()
            .includes(text)

        );

      });

  },


  /* =======================================================
     FIND
  ======================================================= */

  find(id) {

    return this.state.posts
      .find(post =>
        post.id === id
      );

  },


  /* =======================================================
     REMOVE / HIDE
  ======================================================= */

  hide(id) {

    const post =
      this.find(id);

    if (!post) {
      return false;
    }

    post.hidden = true;

    this.rebuildRanking();

    this.save();

    return true;

  },


  remove(id) {

    const index =
      this.state.posts
        .findIndex(
          post => post.id === id
        );


    if (index === -1) {
      return false;
    }


    this.state.posts
      .splice(index, 1);


    this.rebuildRanking();

    this.save();

    return true;

  },


  /* =======================================================
     STORAGE
  ======================================================= */

  save() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    VortexStorage.save(
      "feed_posts",
      this.state.posts
    );

  },


  load() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    this.state.posts =
      VortexStorage.load(
        "feed_posts",
        []
      );

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:feed:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexFeed =
  VortexFeed;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexFeed.initialize();

  }
);
