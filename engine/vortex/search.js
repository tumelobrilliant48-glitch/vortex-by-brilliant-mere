/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / SEARCH.JS
========================================================= */

"use strict";

const VortexSearch = {

  state: {
    query: "",
    filters: [],
    history: [],
    results: [],
    initialized: false
  },

  settings: {
    historyEnabled: true,
    maxHistory: 30
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

    this.emit("ready");

  },


  /* =======================================================
     SEARCH TYPES
  ======================================================= */

  types: [

    "all",
    "people",
    "posts",
    "videos",
    "reels",
    "stories",
    "groups",
    "communities",
    "marketplace",
    "music",
    "documents",
    "settings",
    "apps",
    "games",
    "hashtags"

  ],


  /* =======================================================
     SEARCH
  ======================================================= */

  search(query, filters = ["all"]) {

    const text =
      String(query || "")
        .trim()
        .toLowerCase();


    this.state.query = text;

    this.state.filters =
      Array.isArray(filters)
        ? filters
        : ["all"];


    if (!text) {

      this.state.results = [];

      this.emit(
        "results",
        {
          results: []
        }
      );

      return [];

    }


    const results = [];


    /*
      PEOPLE
    */

    if (
      this.matchesFilter("people")
    ) {

      results.push(
        ...this.searchPeople(text)
      );

    }


    /*
      POSTS
    */

    if (
      this.matchesFilter("posts")
    ) {

      results.push(
        ...this.searchPosts(text)
      );

    }


    /*
      VIDEOS / REELS
    */

    if (
      this.matchesFilter("videos") ||
      this.matchesFilter("reels")
    ) {

      results.push(
        ...this.searchVideos(text)
      );

    }


    /*
      GROUPS
    */

    if (
      this.matchesFilter("groups")
    ) {

      results.push(
        ...this.searchGroups(text)
      );

    }


    /*
      COMMUNITIES
    */

    if (
      this.matchesFilter("communities")
    ) {

      results.push(
        ...this.searchCommunities(text)
      );

    }


    /*
      SETTINGS
    */

    if (
      this.matchesFilter("settings")
    ) {

      results.push(
        ...this.searchSettings(text)
      );

    }


    /*
      APPS
    */

    if (
      this.matchesFilter("apps")
    ) {

      results.push(
        ...this.searchApps(text)
      );

    }


    this.state.results = results;


    if (
      this.settings.historyEnabled
    ) {

      this.addHistory(text);

    }


    this.emit(
      "results",
      {
        query: text,
        results
      }
    );


    return results;

  },


  /* =======================================================
     FILTERS
  ======================================================= */

  matchesFilter(type) {

    return (
      this.state.filters.includes("all") ||
      this.state.filters.includes(type)
    );

  },


  setFilters(filters) {

    if (!Array.isArray(filters)) {
      return false;
    }


    this.state.filters =
      filters.filter(
        filter =>
          this.types.includes(filter)
      );


    if (
      this.state.filters.length === 0
    ) {

      this.state.filters = [
        "all"
      ];

    }


    return true;

  },


  /* =======================================================
     PEOPLE
  ======================================================= */

  searchPeople(query) {

    const users =
      this.getUsers();


    return users
      .filter(user => {

        return (

          String(user.name || "")
            .toLowerCase()
            .includes(query) ||

          String(user.username || "")
            .toLowerCase()
            .includes(query)

        );

      })
      .map(user => ({

        type: "people",

        id: user.id,

        title:
          user.name ||
          user.username,

        username:
          user.username || "",

        avatar:
          user.avatar || null,

        data: user

      }));

  },


  /* =======================================================
     POSTS
  ======================================================= */

  searchPosts(query) {

    if (
      typeof VortexFeed ===
      "undefined"
    ) {

      return [];

    }


    return VortexFeed.state.posts
      .filter(post => {

        return (

          String(post.text || "")
            .toLowerCase()
            .includes(query) ||

          String(post.author || "")
            .toLowerCase()
            .includes(query)

        );

      })
      .map(post => ({

        type: "posts",

        id: post.id,

        title:
          post.text || "Post",

        subtitle:
          post.author,

        data: post

      }));

  },


  /* =======================================================
     VIDEOS
  ======================================================= */

  searchVideos(query) {

    const reels =
      typeof VortexReels !==
      "undefined"
        ? VortexReels.state.reels
        : [];


    return reels
      .filter(reel => {

        return (

          String(reel.caption || "")
            .toLowerCase()
            .includes(query) ||

          String(reel.author || "")
            .toLowerCase()
            .includes(query)

        );

      })
      .map(reel => ({

        type: "videos",

        id: reel.id,

        title:
          reel.caption ||
          "VORTEX Video",

        subtitle:
          reel.author,

        thumbnail:
          reel.thumbnail || null,

        data: reel

      }));

  },


  /* =======================================================
     GROUPS
  ======================================================= */

  searchGroups(query) {

    if (
      typeof VortexMessages ===
      "undefined"
    ) {

      return [];

    }


    return VortexMessages.state.groups
      .filter(group => {

        return String(
          group.name || ""
        )
          .toLowerCase()
          .includes(query);

      })
      .map(group => ({

        type: "groups",

        id: group.id,

        title: group.name,

        subtitle:
          `${group.members.length} members`,

        data: group

      }));

  },


  /* =======================================================
     COMMUNITIES
  ======================================================= */

  searchCommunities(query) {

    if (
      typeof VortexMessages ===
      "undefined"
    ) {

      return [];

    }


    return VortexMessages
      .state
      .communities
      .filter(community => {

        return (

          String(
            community.name || ""
          )
            .toLowerCase()
            .includes(query) ||

          String(
            community.description || ""
          )
            .toLowerCase()
            .includes(query)

        );

      })
      .map(community => ({

        type: "communities",

        id: community.id,

        title:
          community.name,

        subtitle:
          community.description,

        data: community

      }));

  },


  /* =======================================================
     SETTINGS SEARCH
  ======================================================= */

  searchSettings(query) {

    const settings = [

      {
        id: "themes",
        title: "Themes",
        keywords:
          "theme themes appearance colors neon galaxy ocean"
      },

      {
        id: "security",
        title: "Security",
        keywords:
          "security lock password pin fingerprint face id biometric"
      },

      {
        id: "privacy",
        title: "Privacy",
        keywords:
          "privacy private account visibility data"
      },

      {
        id: "notifications",
        title: "Notifications",
        keywords:
          "notifications alerts disappearing sensitive"
      },

      {
        id: "vault",
        title: "Vault",
        keywords:
          "vault hidden photos videos files documents"
      },

      {
        id: "eyes",
        title: "VORTEX Eyes",
        keywords:
          "eyes wake voice assistant listening quick apps"
      },

      {
        id: "messages",
        title: "Messages",
        keywords:
          "messages chats groups communities scheduled lock"
      },

      {
        id: "account",
        title: "Account",
        keywords:
          "account profile username password login"
      },

      {
        id: "downloads",
        title: "Downloads",
        keywords:
          "downloads offline videos files"
      }

    ];


    return settings
      .filter(item =>
        `${item.title} ${item.keywords}`
          .toLowerCase()
          .includes(query)
      )
      .map(item => ({

        type: "settings",

        id: item.id,

        title: item.title,

        data: item

      }));

  },


  /* =======================================================
     QUICK APPS
  ======================================================= */

  searchApps(query) {

    const apps = [

      {
        id: "messages",
        name: "Messages"
      },

      {
        id: "vault",
        name: "Vault"
      },

      {
        id: "marketplace",
        name: "Marketplace"
      },

      {
        id: "premium",
        name: "Premium"
      },

      {
        id: "dashboard",
        name: "Dashboard"
      },

      {
        id: "monetization",
        name: "Monetization"
      },

      {
        id: "rankings",
        name: "VORTEX Rankings"
      },

      {
        id: "create",
        name: "Create"
      },

      {
        id: "reels",
        name: "Reels"
      }

    ];


    return apps
      .filter(app =>
        app.name
          .toLowerCase()
          .includes(query)
      )
      .map(app => ({

        type: "apps",

        id: app.id,

        title: app.name,

        data: app

      }));

  },


  /* =======================================================
     USER SOURCE
  ======================================================= */

  getUsers() {

    /*
      Backend user data will replace this
      when the VORTEX database is connected.
    */

    if (
      Array.isArray(
        VortexApp?.users
      )
    ) {

      return VortexApp.users;

    }


    return [];

  },


  /* =======================================================
     SEARCH HISTORY
  ======================================================= */

  addHistory(query) {

    if (!query) {
      return;
    }


    this.state.history =
      this.state.history.filter(
        item => item !== query
      );


    this.state.history.unshift(
      query
    );


    this.state.history =
      this.state.history.slice(
        0,
        this.settings.maxHistory
      );


    this.save();

  },


  getHistory() {

    return [
      ...this.state.history
    ];

  },


  clearHistory() {

    this.state.history = [];

    this.save();

    this.emit(
      "historyCleared"
    );

  },


  /* =======================================================
     PERSISTENCE
  ======================================================= */

  save() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {

      return;

    }


    VortexStorage.save(
      "search_history",
      this.state.history
    );

  },


  load() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {

      return;

    }


    this.state.history =
      VortexStorage.load(
        "search_history",
        []
      );

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:search:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexSearch =
  VortexSearch;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexSearch.initialize();

  }
);
