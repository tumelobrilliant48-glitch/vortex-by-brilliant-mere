/* =========================================================
   VORTEX — Live Engine
   File: live.js
   Purpose: Live sessions, viewers, reactions & comments
   ========================================================= */

(function () {
  "use strict";

  const LIVE_KEY = "vortex_live_sessions";

  /* ---------------------------------------------------------
     Storage
  --------------------------------------------------------- */

  function getSessions() {
    try {
      return JSON.parse(
        localStorage.getItem(LIVE_KEY)
      ) || [];
    } catch {
      return [];
    }
  }

  function saveSessions(sessions) {
    localStorage.setItem(
      LIVE_KEY,
      JSON.stringify(sessions)
    );
  }

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  function currentUser() {
    if (
      window.VortexAuth &&
      typeof window.VortexAuth.currentUser === "function"
    ) {
      return window.VortexAuth.currentUser();
    }

    return null;
  }

  function createId(prefix = "live") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 9)
    );
  }

  function findSession(sessionId) {
    return getSessions().find(
      session => session.id === sessionId
    );
  }

  /* ---------------------------------------------------------
     Start live session
  --------------------------------------------------------- */

  function start(options = {}) {
    const user = currentUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in."
      };
    }

    const sessions = getSessions();

    const existing = sessions.find(
      session =>
        session.hostId === user.id &&
        session.status === "live"
    );

    if (existing) {
      return {
        success: false,
        error: "You already have a live session."
      };
    }

    const session = {
      id: createId(),
      hostId: user.id,

      hostUsername: user.username,
      hostDisplayName: user.displayName,

      title:
        String(
          options.title ||
          `${user.displayName}'s VORTEX Live`
        ).slice(0, 100),

      description:
        String(
          options.description || ""
        ).slice(0, 500),

      category:
        String(
          options.category || "General"
        ).slice(0, 50),

      status: "live",

      viewers: 0,
      peakViewers: 0,

      likes: 0,
      reactions: 0,

      comments: [],

      startedAt: Date.now(),
      endedAt: null
   
