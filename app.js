/* =========================================================
   VORTEX SOCIAL PLATFORM
   CORE APPLICATION CONTROLLER
   FILE 3
   ========================================================= */

"use strict";

/* =========================================================
   GLOBAL VORTEX STATE
   ========================================================= */

window.VORTEX = window.VORTEX || {

  version: "1.0.0",

  user: null,

  currentPage: "home",

  initialized: false,

  settings: {
    theme: "vortex",
    greeting: true,
    assistant: false,
    assistantSleep: 30,
    notifications: true,
    autoplayVideos: true,
    dataSaver: false
  },

  cache: {
    posts: [],
    stories: [],
    chats: [],
    groups: [],
    reels: [],
    games: [],
    notifications: []
  }

};


/* =========================================================
   SAFE STORAGE
   ========================================================= */

const VXStorage = {

  get(key, fallback = null) {

    try {

      const value =
        localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);

    } catch (error) {

      console.warn(
        "VORTEX storage read error:",
        key,
        error
      );

      return fallback;

    }

  },


  set(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.warn(
        "VORTEX storage write error:",
        key,
        error
      );

      return false;

    }

  },


  remove(key) {

    try {

      localStorage.removeItem(key);

    } catch (error) {

      console.warn(
        "VORTEX storage remove error:",
        error
      );

    }

  }

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const VX = {

  id(id) {
    return document.getElementById(id);
  },


  qs(selector) {
    return document.querySelector(selector);
  },


  qsa(selector) {
    return document.querySelectorAll(selector);
  },


  show(element) {

    if (!element) return;

    element.classList.remove("hidden");

  },


  hide(element) {

    if (!element) return;

    element.classList.add("hidden");

  },


  escape(value) {

    if (value === null ||
        value === undefined) {

      return "";

    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

};


/* =========================================================
   PAGE SYSTEM
   ========================================================= */

function navigateTo(pageName) {

  const pages =
    VX.qsa(".app-page");

  pages.forEach(page => {

    page.classList.add("hidden");
    page.classList.remove("active");

  });


  const target =
