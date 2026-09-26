/* =========================================================
   VORTEX OMNIVERSE
   ANALYTICS.JS
   SOCIAL MEDIA ANALYTICS ENGINE
   ========================================================= */

"use strict";

const VortexAnalytics = (() => {

  const VERSION = "1.0.0";

  const STORAGE_KEY = "vortex_social_analytics";

  const MAX_EVENTS = 5000;

  const state = {
    initialized: false,
    events: [],
    sessions: [],
    daily: {},
    users: {},
    content: {},
    engagement: {},
    views: {},
    searches: {},
    features: {},
    lastActivity: null
  };

  const listeners = new Map();

  /* =========================================================
     EVENTS
     ========================================================= */

  function on(event, callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(callback);

    return () => {
      listeners.get(event)?.delete(callback);
    };
  }

  function emit(event, data = {}) {
    listeners.get(event)?.forEach(fn => {
      try {
        fn(data);
      } catch (error) {
        console.error("[VortexAnalytics]", error);
      }
    });

    try {
      window.dispatchEvent(
        new CustomEvent(
          `vortex:analytics:${event}`,
          { detail: data }
        )
      );
    } catch (_) {}
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function id(prefix = "analytics") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  function now() {
    return new Date();
  }

  function isoNow() {
    return now().toISOString();
  }

  function dateKey(date = now()) {
    return date.toISOString().slice(0, 10);
  }

  function hourKey(date = now()) {
    return date.toISOString().slice(0, 13);
  }

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function currentUserId() {
    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexUser?.getCurrentUserId?.() ||
      "guest"
    );
  }

  function getUsers() {
    try {
      return (
        window.VortexUser?.getAll?.() ||
        []
      );
    } catch (_) {
      return [];
    }
  }

  function safeArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          events: state.events.slice(-MAX_EVENTS),
          sessions: state.sessions.slice(-1000),
          daily: state.daily,
          users: state.users,
          content: state.content,
          engagement: state.engagement,
          views: state.views,
          searches: state.searches,
          features: state.features,
          lastActivity: state.lastActivity
        })
      );

      return true;

    } catch (error) {

      console.warn(
        "[VortexAnalytics] Save failed",
        error
      );

      return false;
    }
  }

  function load() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const data = JSON.parse(raw);

      state.events =
        Array.isArray(data.events)
          ? data.events
          : [];

      state.sessions =
        Array.isArray(data.sessions)
          ? data.sessions
          : [];

      state.daily =
        data.daily || {};

      state.users =
        data.users || {};

      state.content =
        data.content || {};

      state.engagement =
        data.engagement || {};

      state.views =
        data.views || {};

      state.searches =
        data.searches || {};

      state.features =
        data.features || {};

      state.lastActivity =
        data.lastActivity || null;

    } catch (error) {

      console.warn(
        "[VortexAnalytics] Load failed",
        error
      );
    }
  }

  /* =========================================================
     CORE TRACKING
     ========================================================= */

  function track(
    eventName,
    data = {}
  ) {

    if (!eventName) {
      return null;
    }

    const timestamp = isoNow();

    const event = {
      id: id("event"),
      name: String(eventName),
      userId: currentUserId(),
      timestamp,
      date: dateKey(),
      hour: hourKey(),
      data: clone(data)
    };

    state.events.push(event);

    if (
      state.events.length >
      MAX_EVENTS
    ) {
      state.events =
        state.events.slice(
          -MAX_EVENTS
        );
    }

    state.lastActivity = timestamp;

    updateDaily(event);
    updateFeature(event);
    updateUser(event);

    save();

    emit("tracked", {
      event: clone(event)
    });

    return clone(event);
  }

  function updateDaily(event) {

    const key = event.date;

    if (!state.daily[key]) {

      state.daily[key] = {
        date: key,
        events: 0,
        users: new Set()
      };

    }

    state.daily[key].events++;

    /*
      Sets cannot be serialized directly,
      so daily user IDs are stored separately.
    */

    if (!state.daily[key].userIds) {
      state.daily[key].userIds = [];
    }

    if (
      !state.daily[key].userIds.includes(
        event.userId
      )
    ) {
      state.daily[key].userIds.push(
        event.userId
      );
    }
  }

  function updateFeature(event) {

    const feature =
      event.data?.feature ||
      event.name;

    if (!state.features[feature]) {
      state.features[feature] = {
        uses: 0,
        users: []
      };
    }

    state.features[feature].uses++;

    if (
      !state.features[feature]
        .users
        .includes(event.userId)
    ) {
      state.features[feature].users.push(
        event.userId
      );
    }
  }

  function updateUser(event) {

    const userId =
      event.userId;

    if (!state.users[userId]) {

      state.users[userId] = {
        events: 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        sessions: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        posts: 0,
        searches: 0
      };
    }

    const user =
      state.users[userId];

    user.events++;

    user.lastSeen =
      event.timestamp;

    switch (event.name) {

      case "view":
      case "content_view":
        user.views++;
        break;

      case "like":
        user.likes++;
        break;

      case "comment":
        user.comments++;
        break;

      case "share":
        user.shares++;
        break;

      case "post_create":
        user.posts++;
        break;

      case "search":
        user.searches++;
        break;

    }
  }

  /* =========================================================
     SESSION TRACKING
     ========================================================= */

  function startSession() {

    const session = {
      id: id("session"),
      userId: currentUserId(),
      startedAt: isoNow(),
      endedAt: null,
      duration: 0,
      active: true
    };

    state.sessions.push(session);

    track(
      "session_start",
      {
        feature: "app"
      }
    );

    save();

    emit("session-start", {
      session: clone(session)
    });

    return session.id;
  }

  function endSession(sessionId) {

    const session =
      state.sessions.find(
        item => item.id === sessionId
      );

    if (!session || !session.active) {
      return false;
    }

    session.endedAt =
      isoNow();

    session.duration =
      Math.max(
        0,
        new Date(session.endedAt)
          .getTime() -
        new Date(session.startedAt)
          .getTime()
      );

    session.active = false;

    track(
      "session_end",
      {
        feature: "app",
        sessionId,
        duration:
          session.duration
      }
    );

    save();

    emit("session-end", {
      session: clone(session)
    });

    return true;
  }

  /* =========================================================
     CONTENT ANALYTICS
     ========================================================= */

  function ensureContent(contentId) {

    if (!contentId) {
      return null;
    }

    if (!state.content[contentId]) {

      state.content[contentId] = {
        id: contentId,
        type: "unknown",
        views: 0,
        uniqueViews: [],
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        reports: 0,
        clicks: 0,
        impressions: 0,
        watchTime: 0,
        createdAt: isoNow()
      };
    }

    return state.content[contentId];
  }

  function trackContent(
    action,
    contentId,
    contentType = "post",
    data = {}
  ) {

    if (!contentId) {
      return null;
    }

    const content =
      ensureContent(contentId);

    content.type =
      contentType;

    switch (action) {

      case "view":

        content.views++;

        if (
          !content.uniqueViews
            .includes(currentUserId())
        ) {
          content.uniqueViews.push(
            currentUserId()
          );
        }

        break;

      case "like":
        content.likes++;
        break;

      case "comment":
        content.comments++;
        break;

      case "share":
        content.shares++;
        break;

      case "save":
        content.saves++;
        break;

      case "report":
        content.reports++;
        break;

      case "click":
        content.clicks++;
        break;

      case "impression":
        content.impressions++;
        break;

      case "watch":
        content.watchTime +=
          Number(
            data.seconds || 0
          );

        break;
    }

    track(
      `content_${action}`,
      {
        contentId,
        contentType,
        ...data
      }
    );

    save();

    return clone(content);
  }

  function recordView(
    contentId,
    contentType = "post"
  ) {

    return trackContent(
      "view",
      contentId,
      contentType
    );
  }

  function recordLike(
    contentId,
    contentType = "post"
  ) {

    return trackContent(
      "like",
      contentId,
      contentType
    );
  }

  function recordComment(
    contentId,
    contentType = "post"
  ) {

    return trackContent(
      "comment",
      contentId,
      contentType
    );
  }

  function recordShare(
    contentId,
    contentType = "post"
  ) {

    return trackContent(
      "share",
      contentId,
      contentType
    );
  }

  function recordSave(
    contentId,
    contentType = "post"
  ) {

    return trackContent(
      "save",
      contentId,
      contentType
    );
  }

  function recordWatchTime(
    contentId,
    seconds,
    contentType = "reel"
  ) {

    return trackContent(
      "watch",
      contentId,
      contentType,
      { seconds }
    );
  }

  /* =========================================================
     SEARCH ANALYTICS
     ========================================================= */

  function recordSearch(
    query,
    resultCount = 0,
    type = "all"
  ) {

    const clean =
      String(query || "")
        .trim()
        .toLowerCase();

    if (!clean) {
      return null;
    }

    if (!state.searches[clean]) {

      state.searches[clean] = {
        query: clean,
        searches: 0,
        users: [],
        lastSearched: null,
        totalResults: 0
      };
    }

    const search =
      state.searches[clean];

    search.searches++;

    search.totalResults +=
      Number(resultCount) || 0;

    search.lastSearched =
      isoNow();

    if (
      !search.users.includes(
        currentUserId()
      )
    ) {
      search.users.push(
        currentUserId()
      );
    }

    track(
      "search",
      {
        feature: "search",
        query: clean,
        resultCount,
        type
      }
    );

    save();

    return clone(search);
  }

  function getTopSearches(
    limit = 20
  ) {

    return Object.values(
      state.searches
    )
      .sort(
        (a, b) =>
          b.searches -
          a.searches
      )
      .slice(0, limit)
      .map(clone);
  }

  /* =========================================================
     SOCIAL ENGAGEMENT
     ========================================================= */

  function recordEngagement(
    type,
    data = {}
  ) {

    if (!type) {
      return null;
    }

    if (!state.engagement[type]) {

      state.engagement[type] = {
        count: 0,
        users: [],
        lastActivity: null
      };
    }

    const item =
      state.engagement[type];

    item.count++;

    item.lastActivity =
      isoNow();

    if (
      !item.users.includes(
        currentUserId()
      )
    ) {
      item.users.push(
        currentUserId()
      );
    }

    track(
      type,
      {
        feature: "social",
        ...data
      }
    );

    save();

    return clone(item);
  }

  /* =========================================================
     FEATURE USAGE
     ========================================================= */

  function recordFeatureUse(
    feature,
    data = {}
  ) {

    if (!feature) {
      return null;
    }

    return track(
      "feature_use",
      {
        feature,
        ...data
      }
    );
  }

  function getFeatureStats() {

    return Object.values(
      state.features
    )
      .map(item => ({
        feature:
          Object.keys(
            state.features
          ).find(
            key =>
              state.features[key] ===
              item
          ),
        uses: item.uses,
        users: item.users.length
      }))
      .sort(
        (a, b) =>
          b.uses -
          a.uses
      );
  }

  /* =========================================================
     GENERAL STATISTICS
     ========================================================= */

  function getTotalEvents() {
    return state.events.length;
  }

  function getActiveUsers() {

    const users =
      getUsers();

    if (!users.length) {

      const recent =
        Date.now() -
        24 * 60 * 60 * 1000;

      return Object.entries(
        state.users
      ).filter(
        ([, user]) =>
          new Date(
            user.lastSeen
          ).getTime() >= recent
      ).length;
    }

    return users.filter(
      user =>
        user?.online === true ||
        user?.isOnline === true ||
        user?.onlineStatus === "online"
    ).length;
  }

  function getDailyStats(
    days = 30
  ) {

    const output = [];

    for (
      let i = days - 1;
      i >= 0;
      i--
    ) {

      const date =
        new Date();

      date.setDate(
        date.getDate() - i
      );

      const key =
        dateKey(date);

      const item =
        state.daily[key] || {
          date: key,
          events: 0,
          userIds: []
        };

      output.push({
        date: key,
        events:
          item.events || 0,
        users:
          safeArray(
            item.userIds
          ).length
      });
    }

    return output;
  }

  function getContentStats(
    limit = 50
  ) {

    return Object.values(
      state.content
    )
      .map(item => ({
        ...clone(item),
        uniqueViews:
          safeArray(
            item.uniqueViews
          ).length
      }))
      .sort(
        (a, b) =>
          (
            b.views +
            b.likes * 2 +
            b.comments * 3 +
            b.shares * 4
          ) -
          (
            a.views +
            a.likes * 2 +
            a.comments * 3 +
            a.shares * 4
          )
      )
      .slice(0, limit);
  }

  /* =========================================================
     SOCIAL PLATFORM DATA
     ========================================================= */

  function countModule(
    module,
    method = "getAll"
  ) {

    try {

      const result =
        window[module]?.[method]?.();

      return Array.isArray(result)
        ? result.length
        : 0;

    } catch (_) {

      return 0;
    }
  }

  function getPlatformOverview() {

    const users =
      getUsers();

    const posts =
      countModule(
        "VortexPosts"
      ) ||
      countModule(
        "VortexFeed"
      );

    const comments =
      countModule(
        "VortexComments"
      );

    const groups =
      countModule(
        "VortexGroups"
      );

    const reels =
      countModule(
        "VortexReels"
      );

    const events =
      countModule(
        "VortexEvents",
        "getUpcoming"
      );

    const games =
      countModule(
        "VortexGames"
      );

    const notifications =
      countModule(
        "VortexNotifications"
      );

    return {

      users: users.length,

      activeUsers:
        getActiveUsers(),

      posts,

      comments,

      groups,

      reels,

      events,

      games,

      notifications,

      trackedEvents:
        getTotalEvents(),

      reports:
        countModule(
          "VortexModeration",
          "getReports"
        )
    };
  }

  /* =========================================================
     ENGAGEMENT RATE
     ========================================================= */

  function calculateEngagementRate(
    content
  ) {

    if (!content) {
      return 0;
    }

    const impressions =
      Number(
        content.impressions ||
        content.views ||
        0
      );

    if (!impressions) {
      return 0;
    }

    const interactions =
      Number(
        content.likes || 0
      ) +
      Number(
        content.comments || 0
      ) +
      Number(
        content.shares || 0
      ) +
      Number(
        content.saves || 0
      );

    return Number(
      (
        interactions /
        impressions *
        100
      ).toFixed(2)
    );
  }

  function getAverageWatchTime(
    contentType = null
  ) {

    const items =
      Object.values(
        state.content
      ).filter(
        item =>
          !contentType ||
          item.type ===
            contentType
      );

    if (!items.length) {
      return 0;
    }

    const total =
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.watchTime || 0
          ),
        0
      );

    return Math.round(
      total / items.length
    );
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function getDashboard() {

    const overview =
      getPlatformOverview();

    const daily =
      getDailyStats(30);

    const content =
      getContentStats(10);

    const searches =
      getTopSearches(10);

    const features =
      getFeatureStats()
        .slice(0, 10);

    const engagement =
      Object.entries(
        state.engagement
      )
        .map(
          ([type, data]) => ({
            type,
            count:
              data.count,
            users:
              data.users.length
          })
        )
        .sort(
          (a, b) =>
            b.count -
            a.count
        );

    return {

      generatedAt:
        isoNow(),

      overview,

      daily,

      content,

      searches,

      features,

      engagement,

      averageReelWatchTime:
        getAverageWatchTime(
          "reel"
        ),

      averageVideoWatchTime:
        getAverageWatchTime(
          "video"
        )
    };
  }

  /* =========================================================
     EXPORT
     ========================================================= */

  function exportData() {

    return clone({

      version: VERSION,

      exportedAt:
        isoNow(),

      events:
        state.events,

      sessions:
        state.sessions,

      daily:
        state.daily,

      users:
        state.users,

      content:
        state.content,

      engagement:
        state.engagement,

      views:
        state.views,

      searches:
        state.searches,

      features:
        state.features
    });
  }

  function downloadReport() {

    const report =
      getDashboard();

    const blob =
      new Blob(
        [
          JSON.stringify(
            report,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `vortex-analytics-${dateKey()}.json`;

    link.click();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      1000
    );
  }

  /* =========================================================
     RESET
     ========================================================= */

  function clearAnalytics() {

    state.events = [];
    state.sessions = [];
    state.daily = {};
    state.users = {};
    state.content = {};
    state.engagement = {};
    state.views = {};
    state.searches = {};
    state.features = {};
    state.lastActivity = null;

    save();

    emit("cleared");

    return true;
  }

  /* =========================================================
     UI
     ========================================================= */

  function renderDashboard(
    container
  ) {

    if (!container) {
      return;
    }

    const data =
      getDashboard();

    const o =
      data.overview;

    container.innerHTML = `

      <div class="vortex-analytics">

        <div class="vaa-header">

          <div>

            <span>
              VORTEX OMNIVERSE
            </span>

            <h1>
              Analytics
            </h1>

            <p>
              Understand activity,
              engagement and content
              across VORTEX.
            </p>

          </div>

          <button
            class="vaa-export"
            data-analytics-export>
            Export
          </button>

        </div>

        <div class="vaa-cards">

          ${statCard(
            "Users",
            o.users
          )}

          ${statCard(
            "Active",
            o.activeUsers
          )}

          ${statCard(
            "Posts",
            o.posts
          )}

          ${statCard(
            "Comments",
            o.comments
          )}

          ${statCard(
            "Reels",
            o.reels
          )}

          ${statCard(
            "Groups",
            o.groups
          )}

          ${statCard(
            "Events",
            o.events
          )}

          ${statCard(
            "Reports",
            o.reports
          )}

        </div>

        <div class="vaa-grid">

          <section class="vaa-panel">

            <div class="vaa-title">
              <h2>
                Activity — Last 30 Days
              </h2>
            </div>

            <div class="vaa-chart">

              ${renderDailyChart(
                data.daily
              )}

            </div>

          </section>

          <section class="vaa-panel">

            <div class="vaa-title">
              <h2>
                Feature Usage
              </h2>
            </div>

            ${
              data.features.length
                ? data.features
                    .map(
                      item => `
                        <div
                          class="vaa-row">

                          <span>
                            ${escapeHTML(
                              item.feature
                            )}
                          </span>

                          <b>
                            ${item.uses}
                          </b>

                        </div>
                      `
                    )
                    .join("")
                : empty()
            }

          </section>

        </div>

        <div class="vaa-grid">

          <section class="vaa-panel">

            <div class="vaa-title">
              <h2>
                Top Content
              </h2>
            </div>

            ${
              data.content.length
                ? data.content
                    .map(
                      item => `
                        <div
                          class="vaa-content">

                          <div>
                            <strong>
                              ${escapeHTML(
                                item.type
                              )}
                            </strong>

                            <small>
                              ${escapeHTML(
                                item.id
                              )}
                            </small>
                          </div>

                          <div
                            class="vaa-content-stats">
                            👁 ${item.views}
                            ♥ ${item.likes}
                            💬 ${item.comments}
                            ↗ ${item.shares}
                          </div>

                        </div>
                      `
                    )
                    .join("")
                : empty()
            }

          </section>

          <section class="vaa-panel">

            <div class="vaa-title">
              <h2>
                Top Searches
              </h2>
            </div>

            ${
              data.searches.length
                ? data.searches
                    .map(
                      item => `
                        <div
                          class="vaa-row">

                          <span>
                            🔎
                            ${escapeHTML(
                              item.query
                            )}
                          </span>

                          <b>
                            ${item.searches}
                          </b>

                        </div>
                      `
                    )
                    .join("")
                : empty()
            }

          </section>

        </div>

        <div class="vaa-panel">

          <div class="vaa-title">
            <h2>
              Engagement
            </h2>
          </div>

          ${
            data.engagement.length
              ? data.engagement
                  .slice(0, 12)
                  .map(
                    item => `
                      <div
                        class="vaa-row">

                        <span>
                          ${escapeHTML(
                            item.type
                          )}
                        </span>

                        <b>
                          ${item.count}
                        </b>

                      </div>
                    `
                  )
                  .join("")
              : empty()
          }

        </div>

      </div>
    `;

    const exportButton =
      container.querySelector(
        "[data-analytics-export]"
      );

    exportButton?.addEventListener(
      "click",
      downloadReport
    );
  }

  function statCard(
    label,
    value
  ) {

    return `
      <div class="vaa-card">

        <small>
          ${escapeHTML(label)}
        </small>

        <strong>
          ${Number(value || 0)
            .toLocaleString()}
        </strong>

      </div>
    `;
  }

  function empty() {

    return `
      <div class="vaa-empty">
        No analytics data yet.
      </div>
    `;
  }

  function renderDailyChart(
    data
  ) {

    if (!data.length) {
      return empty();
    }

    const max =
      Math.max(
        1,
        ...data.map(
          item => item.events
        )
      );

    return `
      <div class="vaa-bars">

        ${data
          .map(item => {

            const height =
              Math.max(
                4,
                (
                  item.events /
                  max
                ) * 100
              );

            return `
              <div
                class="vaa-bar-wrap"
                title="${escapeHTML(
                  item.date
                )}: ${item.events} events">

                <div
                  class="vaa-bar"
                  style="height:${height}%">
                </div>

              </div>
            `;

          })
          .join("")}

      </div>
    `;
  }

  /* =========================================================
     AUTO INTEGRATION
     ========================================================= */

  function bindAutomaticTracking() {

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    window.addEventListener(
      "vortex:navigate",
      event => {

        const page =
          event.detail?.page ||
          event.detail?.route ||
          event.detail?.screen ||
          "unknown";

        track(
          "page_view",
          {
            feature: page,
            page
          }
        );
      }
    );

    window.addEventListener(
      "vortex:post-created",
      event => {

        const postId =
          event.detail?.post?.id ||
          event.detail?.postId;

        if (postId) {
          track(
            "post_create",
            {
              feature: "posts",
              contentId:
                postId
            }
          );
        }
      }
    );

    window.addEventListener(
      "vortex:admin:ready",
      () => {

        track(
          "admin_activity",
          {
            feature: "admin"
          }
        );
      }
    );

    window.addEventListener(
      "vortex:theme",
      event => {

        track(
          "theme_change",
          {
            feature: "themes",
            theme:
              event.detail?.theme ||
              event.detail?.name
          }
        );
      }
    );

    window.addEventListener(
      "online",
      () => {

        track(
          "network_online",
          {
            feature: "network"
          }
        );
      }
    );

    window.addEventListener(
      "offline",
      () => {

        track(
          "network_offline",
          {
            feature: "network"
          }
        );
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {

        track(
          document.hidden
            ? "app_background"
            : "app_foreground",
          {
            feature: "app"
          }
        );
      }
    );
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {

    if (state.initialized) {
      return api;
    }

    load();

    state.initialized = true;

    bindAutomaticTracking();

    startSession();

    emit("ready", {
      version: VERSION
    });

    return api;
  }

  /* =========================================================
     CSS
     ========================================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "vortex-analytics-css"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "vortex-analytics-css";

    style.textContent = `

      .vortex-analytics{
        width:100%;
        color:#fff;
        font-family:
          Inter,
          system-ui,
          sans-serif;
      }

      .vaa-header{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:20px;
        padding:25px;
        margin-bottom:16px;
        border-radius:25px;
        background:
          linear-gradient(
            135deg,
            rgba(0,217,255,.10),
            rgba(139,77,255,.12)
          );
        border:1px solid
          rgba(255,255,255,.08);
      }

      .vaa-header span{
        color:#00d9ff;
        font-size:10px;
        font-weight:900;
        letter-spacing:2px;
      }

      .vaa-header h1{
        margin:7px 0;
        font-size:30px;
      }

      .vaa-header p{
        margin:0;
        color:
          rgba(255,255,255,.5);
        font-size:13px;
      }

      .vaa-export{
        padding:11px 18px;
        border:1px solid
          rgba(0,217,255,.3);
        border-radius:12px;
        background:
          rgba(0,217,255,.08);
        color:#00d9ff;
        cursor:pointer;
        font-weight:800;
      }

      .vaa-cards{
        display:grid;
        grid-template-columns:
          repeat(4,1fr);
        gap:10px;
        margin-bottom:16px;
      }

      .vaa-card{
        padding:18px;
        border-radius:19px;
        background:
          rgba(255,255,255,.035);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vaa-card small{
        color:
          rgba(255,255,255,.4);
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:1px;
      }

      .vaa-card strong{
        display:block;
        margin-top:7px;
        font-size:26px;
      }

      .vaa-grid{
        display:grid;
        grid-template-columns:
          1fr 1fr;
        gap:15px;
        margin-bottom:15px;
      }

      .vaa-panel{
        overflow:hidden;
        margin-bottom:15px;
        border-radius:23px;
        background:
          rgba(255,255,255,.035);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vaa-title{
        padding:17px;
        border-bottom:1px solid
          rgba(255,255,255,.06);
      }

      .vaa-title h2{
        margin:0;
        font-size:16px;
      }

      .vaa-row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:15px;
        padding:13px 17px;
        border-bottom:1px solid
          rgba(255,255,255,.045);
      }

      .vaa-row span{
        color:
          rgba(255,255,255,.65);
        font-size:13px;
      }

      .vaa-row b{
        color:#00d9ff;
      }

      .vaa-content{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:15px;
        padding:14px 17px;
        border-bottom:1px solid
          rgba(255,255,255,.045);
      }

      .vaa-content strong,
      .vaa-content small{
        display:block;
      }

      .vaa-content strong{
        font-size:13px;
      }

      .vaa-content small{
        margin-top:4px;
        color:
          rgba(255,255,255,.35);
        max-width:180px;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .vaa-content-stats{
        color:
          rgba(255,255,255,.55);
        font-size:11px;
        white-space:nowrap;
      }

      .vaa-chart{
        height:220px;
        padding:20px;
      }

      .vaa-bars{
        display:flex;
        align-items:flex-end;
        height:100%;
        gap:3px;
      }

      .vaa-bar-wrap{
        flex:1;
        height:100%;
        display:flex;
        align-items:flex-end;
        min-width:2px;
      }

      .vaa-bar{
        width:100%;
        min-height:3px;
        border-radius:5px 5px 1px 1px;
        background:
          linear-gradient(
            180deg,
            #00d9ff,
            #8b4dff
          );
        box-shadow:
          0 0 10px
          rgba(0,217,255,.2);
      }

      .vaa-empty{
        padding:35px 20px;
        text-align:center;
        color:
          rgba(255,255,255,.38);
        font-size:13px;
      }

      @media(max-width:850px){

        .vaa-cards{
          grid-template-columns:
            repeat(2,1fr);
        }

        .vaa-grid{
          grid-template-columns:1fr;
        }

      }

      @media(max-width:600px){

        .vaa-header{
          align-items:flex-start;
          flex-direction:column;
        }

        .vaa-cards{
          grid-template-columns:
            repeat(2,1fr);
        }

        .vaa-card strong{
          font-size:21px;
        }

      }

    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const api = {

    VERSION,

    init,
    on,
    emit,

    track,

    startSession,
    endSession,

    trackContent,
    recordView,
    recordLike,
    recordComment,
    recordShare,
    recordSave,
    recordWatchTime,

    recordSearch,
    getTopSearches,

    recordEngagement,

    recordFeatureUse,
    getFeatureStats,

    getTotalEvents,
    getActiveUsers,
    getDailyStats,
    getContentStats,

    getPlatformOverview,

    calculateEngagementRate,
    getAverageWatchTime,

    getDashboard,

    exportData,
    downloadReport,

    clearAnalytics,

    renderDashboard,

    getState() {
      return clone({
        initialized:
          state.initialized,
        events:
          state.events.length,
        sessions:
          state.sessions.length,
        content:
          Object.keys(
            state.content
          ).length,
        searches:
          Object.keys(
            state.searches
          ).length
      });
    }
  };

  if (
    typeof window !== "undefined"
  ) {
    window.VortexAnalytics = api;
  }

  if (
    typeof document !== "undefined"
  ) {

    if (
      document.readyState ===
      "loading"
    ) {

      document.addEventListener(
        "DOMContentLoaded",
        () => {
          injectStyles();
          init();
        },
        { once: true }
      );

    } else {

      injectStyles();
      init();

    }
  }

  return api;

})();
