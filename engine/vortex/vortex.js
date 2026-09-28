/* =========================================================
   VORTEX SOCIAL MEDIA ENGINE
   ENGINE / VORTEX / VORTEX.JS
========================================================= */

"use strict";


/* =========================================================
   VORTEX APPLICATION STATE
========================================================= */

const VortexApp = {

  version: "1.0.0",

  name: "VORTEX",

  creator: "Brilliant Tumelo Mere",

  mode: "social",

  currentPage: "home",

  online: navigator.onLine,

  authenticated: false,

  user: null,


  /* =====================================================
     USER PREFERENCES
  ====================================================== */

  preferences: {

    theme: "vortex-dark",

    language: "en",

    autoplayReels: true,

    disappearingNotifications: false,

    notificationPreview: true,

    soundEffects: true,

    vibration: true,

    reduceMotion: false

  },


  /* =====================================================
     SECURITY
  ====================================================== */

  security: {

    appLockEnabled: false,

    biometricEnabled: false,

    pinEnabled: false,

    passwordEnabled: false,

    patternEnabled: false,

    securityQuestionsEnabled: false,

    messageLockEnabled: false,

    vaultLockEnabled: true,

    loginVerification: true

  },


  /* =====================================================
     VORTEX EYES
  ====================================================== */

  eyes: {

    enabled: true,

    awake: false,

    listening: false,

    wakeWord: "hey vortex",

    listeningDuration: 120000,

    soundReactive: true,

    leftStyle: "cyan",

    rightStyle: "purple",

    quickApps: []

  },


  /* =====================================================
     SOCIAL SETTINGS
  ====================================================== */

  social: {

    posts: [],

    stories: [],

    reels: [],

    following: [],

    followers: [],

    communities: [],

    groups: []

  },


  /* =====================================================
     RANKINGS
  ====================================================== */

  rankings: {

    posts: [],

    videos: [],

    games: [],

    buyers: [],

    creators: [],

    onlineUsers: [],

    videoMakers: [],

    overall: []

  },


  /* =====================================================
     SERVICES
  ====================================================== */

  services: {

    downloads: [],

    marketplace: [],

    premium: {

      active: false,

      removeAds: false

    },

    monetization: {

      enabled: false,

      creatorEarnings: 0

    },

    dashboard: {}

  },


  /* =====================================================
     VAULT
  ====================================================== */

  vault: {

    photos: [],

    videos: [],

    music: [],

    documents: [],

    downloads: [],

    hidden: []

  },


  /* =====================================================
     MESSAGES
  ====================================================== */

  messages: {

    conversations: [],

    groups: [],

    communities: [],

    scheduled: [],

    locked: false

  }

};


/* =========================================================
   STORAGE ENGINE
========================================================= */

const VortexStorage = {

  prefix: "vortex_",

  save(key, value) {

    try {

      localStorage.setItem(
        this.prefix + key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.error(
        "VORTEX storage error:",
        error
      );

      return false;

    }

  },


  load(key, fallback = null) {

    try {

      const data =
        localStorage.getItem(
          this.prefix + key
        );

      if (data === null) {
        return fallback;
      }

      return JSON.parse(data);

    } catch (error) {

      console.error(
        "VORTEX load error:",
        error
      );

      return fallback;

    }

  },


  remove(key) {

    localStorage.removeItem(
      this.prefix + key
    );

  },


  clear() {

    Object.keys(localStorage)
      .filter(key =>
        key.startsWith(this.prefix)
      )
      .forEach(key =>
        localStorage.removeItem(key)
      );

  }

};


/* =========================================================
   APP STATE PERSISTENCE
========================================================= */

const VortexState = {

  save() {

    VortexStorage.save(
      "preferences",
      VortexApp.preferences
    );

    VortexStorage.save(
      "security",
      VortexApp.security
    );

    VortexStorage.save(
      "eyes",
      VortexApp.eyes
    );

    VortexStorage.save(
      "services",
      VortexApp.services
    );

  },


  load() {

    VortexApp.preferences =
      VortexStorage.load(
        "preferences",
        VortexApp.preferences
      );

    VortexApp.security =
      VortexStorage.load(
        "security",
        VortexApp.security
      );

    VortexApp.eyes =
      VortexStorage.load(
        "eyes",
        VortexApp.eyes
      );

    VortexApp.services =
      VortexStorage.load(
        "services",
        VortexApp.services
      );

  }

};


/* =========================================================
   ROUTER
========================================================= */

const VortexRouter = {

  pages: [
    "home",
    "reels",
    "messages",
    "vault",
    "settings",
    "create",
    "explore",
    "profile",
    "notifications",
    "marketplace",
    "premium",
    "dashboard",
    "monetization",
    "rankings"
  ],


  go(page) {

    VortexApp.currentPage = page;

    history.pushState(
      { page },
      "",
      "#" + page
    );

    this.emit(page);

  },


  emit(page) {

    window.dispatchEvent(

      new CustomEvent(
        "vortex:navigate",
        {
          detail: { page }
        }
      )

    );

  }

};


/* =========================================================
   NETWORK STATUS
========================================================= */

window.addEventListener(
  "online",
  () => {

    VortexApp.online = true;

    window.dispatchEvent(
      new CustomEvent(
        "vortex:online"
      )
    );

  }
);


window.addEventListener(
  "offline",
  () => {

    VortexApp.online = false;

    window.dispatchEvent(
      new CustomEvent(
        "vortex:offline"
      )
    );

  }
);


/* =========================================================
   APP INITIALIZATION
========================================================= */

function initializeVortex() {

  VortexState.load();

  console.log(
    `VORTEX ${VortexApp.version} initialized`
  );

  console.log(
    `Built by ${VortexApp.creator}`
  );

  window.dispatchEvent(
    new CustomEvent(
      "vortex:ready",
      {
        detail: VortexApp
      }
    )
  );

}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.Vortex = {

  app: VortexApp,

  storage: VortexStorage,

  state: VortexState,

  router: VortexRouter

};


/* =========================================================
   START
========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeVortex
  );

} else {

  initializeVortex();

        }
