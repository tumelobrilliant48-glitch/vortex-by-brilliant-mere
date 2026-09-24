/* =========================================================
   VORTEX — Settings Engine
   File: settings.js
   Purpose: User preferences, privacy & app settings
   ========================================================= */

(function () {
  "use strict";

  const SETTINGS_KEY = "vortex_settings";

  const DEFAULT_SETTINGS = {
    theme: "vortex",
    appearance: "system",

    notifications: {
      likes: true,
      comments: true,
      follows: true,
      messages: true,
      mentions: true,
      live: true
    },

    privacy: {
      privateAccount: false,
      showOnlineStatus: true,
      allowMessages: true,
      allowTagging: true
    },

    media: {
      autoplayVideos: true,
      highQualityMedia: true,
      dataSaver: false
    },

    accessibility: {
      reducedMotion: false,
      largerText: false
    },

    language: "en",

    sound: true,
    vibration: true
  };

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  function getStoredSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));

      if (!saved) {
        return cloneDefaults();
      }

      return mergeSettings(cloneDefaults(), saved);
    } catch {
      return cloneDefaults();
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

    applySettings(settings);

    window.dispatchEvent(
      new
