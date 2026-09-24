/* =========================================================
   VORTEX ANALYTICS
   File: analytics.js
   Purpose: Analytics, engagement and performance tracking
   ========================================================= */

(function () {
  "use strict";

  const EVENTS_KEY = "vortex_analytics_events";
  const DAILY_KEY = "vortex_analytics_daily";
  const CONTENT_KEY = "vortex_analytics_content";
  const SESSIONS_KEY = "vortex_analytics_sessions";

  const MAX_EVENTS = 10000;

  const state = {
    listeners: []
  };

  /* ---------------------------------------------------------
     Storage helpers
     --------------------------------------------------------- */

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function now() {
    return new Date().toISOString();
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function id(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function currentUserId() {
    try {
      if (
        window.VortexAuth &&
        typeof window.VortexAuth.currentUser === "function"
      ) {
        const user = window.VortexAuth.currentUser();
        return user?.id || user?.userId || null;
      }
    } catch (error) {}

    return null;
  }

  function notify(type, data) {
    state.listeners.forEach((callback) => {
      try {
        callback({
          type,
          data,
          timestamp: now()
        });
      } catch (error) {}
    });
  }

  /* ---------------------------------------------------------
     Event tracking
     --------------------------------------------------------- */

  function track(type, data = {}) {
    if (!type) return null;

    const events = read(EVENTS_KEY, []);

    const event = {
      id: id("analytics"),
      type,
      userId: data.userId || currentUserId(),
      timestamp: now(),
      date: today(),
      data: { ...data }
    };

    events.push(event);

    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    write(EVENTS_KEY, events);

    updateDaily(type);
    notify("track", event);

    return event;
  }

  /* ---------------------------------------------------------
     Daily statistics
     --------------------------------------------------------- */

  function updateDaily(type) {
    const daily = read(DAILY_KEY, {});
    const date = today();

    if (!daily[date]) {
      daily[date] = {
        date,
        pageViews: 0,
        sessions: 0,
        profileViews: 0,
        postViews: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        follows: 0,
        unfollows: 0,
        messages: 0,
        liveViews: 0,
        groupActivity: 0,
        eventActivity: 0,
        totalEvents: 0
      };
    }

    const map = {
      page_view: "pageViews",
      session_start: "sessions",
      profile_view: "profileViews",
      post_view: "postViews",
      like: "likes",
      comment: "comments",
      share: "shares",
      save: "saves",
      follow: "follows",
      unfollow: "unfollows",
      message: "messages",
      live_view: "liveViews",
      group_activity: "groupActivity",
      event_activity: "eventActivity"
    };

    daily[date].totalEvents++;

    if (map[type]) {
      daily[date][map[type]]++;
    }

    write(DAILY_KEY, daily);
  }

  /* ---------------------------------------------------------
     Session tracking
     --------------------------------------------------------- */

  function startSession(userId = currentUserId()) {
    const sessions = read(SESSIONS_KEY, []);

    const session = {
      id: id("session"),
      userId,
      startedAt: now(),
      lastActiveAt: now(),
      endedAt: null
    };

    sessions.push(session);

    if (sessions.length > 1000) {
      sessions.splice(0, sessions.length - 1000);
    }

    write(SESSIONS_KEY, sessions);

    track("session_start", {
      userId,
      sessionId: session.id
    });

    return session;
  }

  function touchSession(sessionId) {
    const sessions = read(SESSIONS_KEY, []);
    const session = sessions.find((item) => item.id === sessionId);

    if (!session) return null;

    session.lastActiveAt = now();

    write(SESSIONS_KEY, sessions);

    return session;
  }

 
