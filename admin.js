/* =========================================================
   VORTEX OMNIVERSE
   ADMIN CONTROL CENTER
   Admin.js
   ========================================================= */

"use strict";

const VortexAdmin = (() => {

  const VERSION = "1.0.0";

  const STORAGE_KEY = "vortex_admin_data";

  const ROLES = {
    OWNER: "owner",
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    MODERATOR: "moderator",
    SUPPORT: "support",
    ANALYST: "analyst"
  };

  const PERMISSIONS = {
    DASHBOARD: "dashboard",
    USERS_VIEW: "users.view",
    USERS_EDIT: "users.edit",
    USERS_SUSPEND: "users.suspend",
    USERS_BAN: "users.ban",

    POSTS_VIEW: "posts.view",
    POSTS_MODERATE: "posts.moderate",
    POSTS_DELETE: "posts.delete",

    REPORTS_VIEW: "reports.view",
    REPORTS_REVIEW: "reports.review",

    GROUPS_VIEW: "groups.view",
    GROUPS_MODERATE: "groups.moderate",

    EVENTS_VIEW: "events.view",
    EVENTS_MODERATE: "events.moderate",

    GAMES_VIEW: "games.view",
    GAMES_MODERATE: "games.moderate",

    MARKETPLACE_VIEW: "marketplace.view",
    MARKETPLACE_MODERATE: "marketplace.moderate",

    ANALYTICS_VIEW: "analytics.view",
    SETTINGS_VIEW: "settings.view",
    SETTINGS_EDIT: "settings.edit",

    AUDIT_VIEW: "audit.view",
    SYSTEM: "system"
  };

  const ROLE_PERMISSIONS = {
    [ROLES.OWNER]: Object.values(PERMISSIONS),

    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
      .filter(permission =>
        permission !== PERMISSIONS.SYSTEM
      ),

    [ROLES.ADMIN]: [
      PERMISSIONS.DASHBOARD,

      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_SUSPEND,

      PERMISSIONS.POSTS_VIEW,
      PERMISSIONS.POSTS_MODERATE,
      PERMISSIONS.POSTS_DELETE,

      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_REVIEW,

      PERMISSIONS.GROUPS_VIEW,
      PERMISSIONS.GROUPS_MODERATE,

      PERMISSIONS.EVENTS_VIEW,
      PERMISSIONS.EVENTS_MODERATE,

      PERMISSIONS.GAMES_VIEW,
      PERMISSIONS.GAMES_MODERATE,

      PERMISSIONS.MARKETPLACE_VIEW,
      PERMISSIONS.MARKETPLACE_MODERATE,

      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.SETTINGS_VIEW,

      PERMISSIONS.AUDIT_VIEW
    ],

    [ROLES.MODERATOR]: [
      PERMISSIONS.DASHBOARD,

      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_SUSPEND,

      PERMISSIONS.POSTS_VIEW,
      PERMISSIONS.POSTS_MODERATE,
      PERMISSIONS.POSTS_DELETE,

      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_REVIEW,

      PERMISSIONS.GROUPS_VIEW,
      PERMISSIONS.GROUPS_MODERATE,

      PERMISSIONS.EVENTS_VIEW,
      PERMISSIONS.EVENTS_MODERATE,

      PERMISSIONS.GAMES_VIEW,
      PERMISSIONS.GAMES_MODERATE,

      PERMISSIONS.MARKETPLACE_VIEW,
      PERMISSIONS.MARKETPLACE_MODERATE
    ],

    [ROLES.SUPPORT]: [
      PERMISSIONS.DASHBOARD,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.REPORTS_VIEW
    ],

    [ROLES.ANALYST]: [
      PERMISSIONS.DASHBOARD,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.ANALYTICS_VIEW
    ]
  };

  const DEFAULT_DATA = {
    admins: [],
    settings: {
      maintenanceMode: false,
      registrationEnabled: true,
      guestModeEnabled: true,
      postingEnabled: true,
      messagingEnabled: true,
      gamesEnabled: true,
      marketplaceEnabled: true,
      eventsEnabled: true,
      groupsEnabled: true,
      reelsEnabled: true,
      aiEnabled: true,
      maxUploadMB: 100,
      maxPostLength: 5000,
      maxMessageLength: 5000
    },
    announcements: [],
    auditLogs: [],
    featureFlags: {}
  };

  const state = {
    initialized: false,
    admins: new Map(),
    settings: {
      ...DEFAULT_DATA.settings
    },
    announcements: [],
    auditLogs: [],
    featureFlags: {}
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

    listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(
          "[VortexAdmin] Event error:",
          error
        );
      }
    });

    try {
      window.dispatchEvent(
        new CustomEvent(
          `vortex:admin:${event}`,
          {
            detail: data
          }
        )
      );
    } catch (_) {}
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function createId(prefix = "admin") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (_) {
      return value;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCurrentUserId() {
    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexUser?.getCurrentUserId?.() ||
      "guest"
    );
  }

  function getCurrentUser() {
    return (
      window.VortexAuth?.getCurrentUser?.() ||
      window.VortexUser?.getCurrentUser?.() ||
      null
    );
  }

  function storageGet() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return clone(DEFAULT_DATA);
      }

      return JSON.parse(raw);
    } catch (_) {
      return clone(DEFAULT_DATA);
    }
  }

  function storageSave() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          admins: Array.from(
            state.admins.values()
          ),
          settings: state.settings,
          announcements:
            state.announcements,
          auditLogs:
            state.auditLogs.slice(-1000),
          featureFlags:
            state.featureFlags
        })
      );

      return true;
    } catch (error) {
      console.warn(
        "[VortexAdmin] Storage error:",
        error
      );

      return false;
    }
  }

  /* =========================================================
     ADMIN ACCESS
     ========================================================= */

  function addAdmin({
    userId,
    role = ROLES.ADMIN,
    name = "",
    email = "",
    active = true
  } = {}) {

    if (!userId) {
      throw new Error(
        "userId is required"
      );
    }

    if (!ROLE_PERMISSIONS[role]) {
      throw new Error(
        `Invalid admin role: ${role}`
      );
    }

    const existing =
      state.admins.get(userId);

    const admin = {
      id: existing?.id || createId("admin"),
      userId,
      role,
      name,
      email,
      active,
      createdAt:
        existing?.createdAt || now(),
      updatedAt: now(),
      lastActiveAt:
        existing?.lastActiveAt || null
    };

    state.admins.set(
      userId,
      admin
    );

    storageSave();

    logAction(
      "admin.created",
      {
        targetUserId: userId,
        role
      }
    );

    emit("admin-added", {
      admin: clone(admin)
    });

    return clone(admin);
  }

  function removeAdmin(userId) {

    const admin =
      state.admins.get(userId);

    if (!admin) {
      return false;
    }

    state.admins.delete(userId);

    storageSave();

    logAction(
      "admin.removed",
      {
        targetUserId: userId
      }
    );

    emit("admin-removed", {
      userId
    });

    return true;
  }

  function updateAdmin(
    userId,
    updates = {}
  ) {

    const admin =
      state.admins.get(userId);

    if (!admin) {
      return null;
    }

    if (
      updates.role &&
      !ROLE_PERMISSIONS[updates.role]
    ) {
      return null;
    }

    Object.assign(
      admin,
      updates,
      {
        updatedAt: now()
      }
    );

    state.admins.set(
      userId,
      admin
    );

    storageSave();

    logAction(
      "admin.updated",
      {
        targetUserId: userId,
        updates
      }
    );

    emit("admin-updated", {
      admin: clone(admin)
    });

    return clone(admin);
  }

  function getAdmin(userId) {
    const admin =
      state.admins.get(userId);

    return admin
      ? clone(admin)
      : null;
  }

  function getAdmins() {
    return clone(
      Array.from(
        state.admins.values()
      )
    );
  }

  function getRole(userId) {
    return (
      state.admins.get(userId)
        ?.role || null
    );
  }

  function isAdmin(userId = getCurrentUserId()) {
    return state.admins.has(userId);
  }

  function isActiveAdmin(
    userId = getCurrentUserId()
  ) {

    const admin =
      state.admins.get(userId);

    return !!(
      admin &&
      admin.active
    );
  }

  function hasPermission(
    permission,
    userId = getCurrentUserId()
  ) {

    const admin =
      state.admins.get(userId);

    if (
      !admin ||
      !admin.active
    ) {
      return false;
    }

    const permissions =
      ROLE_PERMISSIONS[
        admin.role
      ] || [];

    return permissions.includes(
      permission
    );
  }

  function requirePermission(
    permission,
    userId = getCurrentUserId()
  ) {

    if (
      hasPermission(
        permission,
        userId
      )
    ) {
      return true;
    }

    emit("permission-denied", {
      permission,
      userId
    });

    return false;
  }

  function getPermissions(
    userId = getCurrentUserId()
  ) {

    const role =
      getRole(userId);

    return clone(
      ROLE_PERMISSIONS[role] || []
    );
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function getSettings() {
    return clone(
      state.settings
    );
  }

  function getSetting(key) {
    return state.settings[key];
  }

  function setSetting(
    key,
    value
  ) {

    if (
      !requirePermission(
        PERMISSIONS.SETTINGS_EDIT
      )
    ) {
      return false;
    }

    if (!(key in state.settings)) {
      return false;
    }

    state.settings[key] =
      value;

    storageSave();

    logAction(
      "setting.updated",
      {
        key,
        value
      }
    );

    emit("settings-changed", {
      key,
      value,
      settings:
        getSettings()
    });

    return true;
  }

  function updateSettings(
    values = {}
  ) {

    if (
      !requirePermission(
        PERMISSIONS.SETTINGS_EDIT
      )
    ) {
      return false;
    }

    Object.keys(values)
      .forEach(key => {

        if (
          key in state.settings
        ) {
          state.settings[key] =
            values[key];
        }

      });

    storageSave();

    logAction(
      "settings.updated",
      {
        values
      }
    );

    emit("settings-changed", {
      settings:
        getSettings()
    });

    return true;
  }

  /* =========================================================
     FEATURE FLAGS
     ========================================================= */

  function setFeature(
    feature,
    enabled
  ) {

    if (
      !requirePermission(
        PERMISSIONS.SETTINGS_EDIT
      )
    ) {
      return false;
    }

    state.featureFlags[
      feature
    ] = !!enabled;

    storageSave();

    logAction(
      "feature.updated",
      {
        feature,
        enabled: !!enabled
      }
    );

    emit("feature-changed", {
      feature,
      enabled: !!enabled
    });

    return true;
  }

  function isFeatureEnabled(
    feature,
    fallback = true
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        state.featureFlags,
        feature
      )
    ) {
      return !!state.featureFlags[
        feature
      ];
    }

    return fallback;
  }

  function getFeatureFlags() {
    return clone(
      state.featureFlags
    );
  }

  /* =========================================================
     USER MANAGEMENT
     ========================================================= */

  function getUsers() {

    if (
      !requirePermission(
        PERMISSIONS.USERS_VIEW
      )
    ) {
      return [];
    }

    try {
      return (
        window.VortexUser
          ?.getAll?.() || []
      );
    } catch (_) {
      return [];
    }
  }

  function findUser(
    userId
  ) {

    if (
      !requirePermission(
        PERMISSIONS.USERS_VIEW
      )
    ) {
      return null;
    }

    return (
      window.VortexUser
        ?.get?.(userId) ||
      null
    );
  }

  function suspendUser(
    userId,
    reason = "admin_action"
  ) {

    if (
      !requirePermission(
        PERMISSIONS.USERS_SUSPEND
      )
    ) {
      return false;
    }

    if (!userId) {
      return false;
    }

    const result =
      window.VortexModeration
        ?.applyAction?.({
          action: "suspend",
          targetUserId: userId,
          reason,
          source: "admin"
        });

    logAction(
      "user.suspended",
      {
        targetUserId: userId,
        reason
      }
    );

    emit("user-suspended", {
      userId,
      reason,
      result
    });

    return true;
  }

  function banUser(
    userId,
    reason = "admin_action"
  ) {

    if (
      !requirePermission(
        PERMISSIONS.USERS_BAN
      )
    ) {
      return false;
    }

    if (!userId) {
      return false;
    }

    const result =
      window.VortexModeration
        ?.applyAction?.({
          action: "ban",
          targetUserId: userId,
          reason,
          source: "admin"
        });

    logAction(
      "user.banned",
      {
        targetUserId: userId,
        reason
      }
    );

    emit("user-banned", {
      userId,
      reason,
      result
    });

    return true;
  }

  function unsuspendUser(
    userId
  ) {

    if (
      !requirePermission(
        PERMISSIONS.USERS_SUSPEND
      )
    ) {
      return false;
    }

    logAction(
      "user.unsuspended",
      {
        targetUserId: userId
      }
    );

    emit("user-unsuspended", {
      userId
    });

    return true;
  }

  /* =========================================================
     CONTENT MANAGEMENT
     ========================================================= */

  function getReports() {

    if (
      !requirePermission(
        PERMISSIONS.REPORTS_VIEW
      )
    ) {
      return [];
    }

    return (
      window.VortexModeration
        ?.getReports?.() || []
    );
  }

  function reviewReport(
    reportId,
    action,
    note = ""
  ) {

    if (
      !requirePermission(
        PERMISSIONS.REPORTS_REVIEW
      )
    ) {
      return null;
    }

    const result =
      window.VortexModeration
        ?.reviewReport?.(
          reportId,
          {
            action,
            note
          }
        );

    logAction(
      "report.reviewed",
      {
        reportId,
        action
      }
    );

    return result;
  }

  function deletePost(
    postId,
    reason = "admin_action"
  ) {

    if (
      !requirePermission(
        PERMISSIONS.POSTS_DELETE
      )
    ) {
      return false;
    }

    let deleted = false;

    try {
      deleted =
        !!(
          window.VortexPosts
            ?.delete?.(postId) ||
          window.VortexFeed
            ?.delete?.(postId)
        );
    } catch (_) {}

    if (
      window.VortexModeration
        ?.applyAction
    ) {
      window.VortexModeration
        .applyAction({
          action: "remove",
          contentId: postId,
          contentType: "post",
          reason,
          source: "admin"
        });
    }

    logAction(
      "post.deleted",
      {
        postId,
        reason,
        deleted
      }
    );

    emit("post-deleted", {
      postId,
      reason
    });

    return true;
  }

  /* =========================================================
     ANNOUNCEMENTS
     ========================================================= */

  function createAnnouncement({
    title = "",
    message = "",
    type = "system",
    active = true,
    expiresAt = null
  } = {}) {

    if (
      !requirePermission(
        PERMISSIONS.SETTINGS_EDIT
      )
    ) {
      return null;
    }

    if (!title || !message) {
      return null;
    }

    const announcement = {
      id: createId("announcement"),
      title: String(title).slice(0, 150),
      message: String(message).slice(0, 3000),
      type,
      active,
      expiresAt,
      createdAt: now(),
      createdBy: getCurrentUserId()
    };

    state.announcements.unshift(
      announcement
    );

    storageSave();

    logAction(
      "announcement.created",
      {
        announcementId:
          announcement.id
      }
    );

    emit(
      "announcement-created",
      {
        announcement:
          clone(announcement)
      }
    );

    return clone(
      announcement
    );
  }

  function getAnnouncements({
    activeOnly = false
  } = {}) {

    let results =
      state.announcements;

    if (activeOnly) {

      const current =
        Date.now();

      results =
        results.filter(item => {

          if (!item.active) {
            return false;
          }

          if (!item.expiresAt) {
            return true;
          }

          return (
            new Date(
              item.expiresAt
            ).getTime() > current
          );
        });
    }

    return clone(results);
  }

  function removeAnnouncement(
    announcementId
  ) {

    if (
      !requirePermission(
        PERMISSIONS.SETTINGS_EDIT
      )
    ) {
      return false;
    }

    const index =
      state.announcements.findIndex(
        item =>
          item.id === announcementId
      );

    if (index === -1) {
      return false;
    }

    state.announcements.splice(
      index,
      1
    );

    storageSave();

    logAction(
      "announcement.removed",
      {
        announcementId
      }
    );

    emit(
      "announcement-removed",
      {
        announcementId
      }
    );

    return true;
  }

  /* =========================================================
     AUDIT LOG
     ========================================================= */

  function logAction(
    action,
    details = {}
  ) {

    const log = {
      id: createId("audit"),
      action,
      actorId:
        getCurrentUserId(),
      details: clone(details),
      createdAt: now()
    };

    state.auditLogs.push(log);

    if (
      state.auditLogs.length > 1000
    ) {
      state.auditLogs =
        state.auditLogs.slice(-1000);
    }

    storageSave();

    emit("audit-log", {
      log: clone(log)
    });

    return clone(log);
  }

  function getAuditLogs({
    limit = 100,
    action = null,
    actorId = null
  } = {}) {

    if (
      !requirePermission(
        PERMISSIONS.AUDIT_VIEW
      )
    ) {
      return [];
    }

    let logs =
      [...state.auditLogs];

    if (action) {
      logs =
        logs.filter(
          item =>
            item.action === action
        );
    }

    if (actorId) {
      logs =
        logs.filter(
          item =>
            item.actorId === actorId
        );
    }

    logs.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    return clone(
      logs.slice(0, limit)
    );
  }

  /* =========================================================
     ANALYTICS
     ========================================================= */

  function getAnalytics() {

    if (
      !requirePermission(
        PERMISSIONS.ANALYTICS_VIEW
      )
    ) {
      return null;
    }

    const users =
      getUsers();

    const reports =
      window.VortexModeration
        ?.getReports?.() || [];

    const posts =
      window.VortexPosts
        ?.getAll?.() ||
      window.VortexFeed
        ?.getAll?.() ||
      [];

    const groups =
      window.VortexGroups
        ?.getAll?.() || [];

    const events =
      window.VortexEvents
        ?.getUpcoming?.() || [];

    const games =
      window.VortexGames
        ?.getAll?.() || [];

    const friends =
      window.VortexFriends;

    let onlineUsers = 0;

    users.forEach(user => {
      if (
        user?.online ||
        user?.isOnline ||
        user?.onlineStatus === "online"
      ) {
        onlineUsers++;
      }
    });

    return {
      generatedAt: now(),

      users: {
        total: users.length,
        online: onlineUsers
      },

      content: {
        posts: posts.length,
        groups: groups.length,
        events: events.length,
        games: games.length
      },

      moderation: {
        reports: reports.length,
        pending:
          reports.filter(
            item =>
              item.status === "pending"
          ).length
      },

      friends: {
        available:
          !!friends
      },

      admins:
        state.admins.size
    };
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function getDashboardData() {

    return {
      version: VERSION,
      admin:
        getAdmin(
          getCurrentUserId()
        ),
      permissions:
        getPermissions(),
      settings:
        getSettings(),
      analytics:
        getAnalytics(),
      reports:
        getReports(),
      announcements:
        getAnnouncements({
          activeOnly: true
        })
    };
  }

  function renderDashboard(
    container
  ) {

    if (!container) {
      return;
    }

    if (
      !requirePermission(
        PERMISSIONS.DASHBOARD
      )
    ) {
      container.innerHTML = `
        <div class="vortex-admin-denied">
          <div class="vad-icon">🔒</div>
          <h2>Admin Access Required</h2>
          <p>
            You do not have permission to open
            the VORTEX Admin Center.
          </p>
        </div>
      `;

      return;
    }

    const admin =
      getAdmin(
        getCurrentUserId()
      );

    const analytics =
      getAnalytics() || {};

    const reports =
      getReports();

    container.innerHTML = `

      <section class="vortex-admin-dashboard">

        <header class="vad-header">

          <div>
            <span class="vad-kicker">
              VORTEX OMNIVERSE
            </span>

            <h1>
              Admin Control Center
            </h1>

            <p>
              Manage the VORTEX platform,
              users, content and safety.
            </p>
          </div>

          <div class="vad-admin-badge">
            <span class="vad-online-dot"></span>
            ${escapeHTML(
              admin?.role ||
              "administrator"
            )}
          </div>

        </header>

        <div class="vad-cards">

          <div class="vad-card">
            <span>Users</span>
            <strong>
              ${analytics.users?.total || 0}
            </strong>
          </div>

          <div class="vad-card">
            <span>Online</span>
            <strong>
              ${analytics.users?.online || 0}
            </strong>
          </div>

          <div class="vad-card">
            <span>Reports</span>
            <strong>
              ${analytics.moderation?.reports || 0}
            </strong>
          </div>

          <div class="vad-card">
            <span>Pending</span>
            <strong>
              ${analytics.moderation?.pending || 0}
            </strong>
          </div>

        </div>

        <div class="vad-grid">

          <div class="vad-panel">

            <div class="vad-panel-head">
              <h2>Platform Status</h2>
            </div>

            ${renderStatusRows()}

          </div>

          <div class="vad-panel">

            <div class="vad-panel-head">
              <h2>Quick Actions</h2>
            </div>

            <div class="vad-actions">

              <button
                data-admin-action="reports">
                🛡️ Moderation
              </button>

              <button
                data-admin-action="users">
                👥 Users
              </button>

              <button
                data-admin-action="announcement">
                📢 Announcement
              </button>

              <button
                data-admin-action="analytics">
                📊 Analytics
              </button>

            </div>

          </div>

        </div>

        <div class="vad-panel vad-reports">

          <div class="vad-panel-head">

            <h2>
              Recent Reports
            </h2>

            <span>
              ${reports.length}
            </span>

          </div>

          ${
            reports.length
              ? reports
                  .slice(0, 8)
                  .map(renderReportRow)
                  .join("")
              : `
                <div class="vad-empty">
                  No reports available.
                </div>
              `
          }

        </div>

      </section>
    `;

    bindDashboard(container);
  }

  function renderStatusRows() {

    const items = [
      [
        "Registration",
        state.settings.registrationEnabled
      ],
      [
        "Posting",
        state.settings.postingEnabled
      ],
      [
        "Messaging",
        state.settings.messagingEnabled
      ],
      [
        "Games",
        state.settings.gamesEnabled
      ],
      [
        "Marketplace",
        state.settings.marketplaceEnabled
      ],
      [
        "AI",
        state.settings.aiEnabled
      ],
      [
        "Maintenance",
        state.settings.maintenanceMode
      ]
    ];

    return items.map(
      ([label, enabled]) => `
        <div class="vad-status-row">

          <span>
            ${escapeHTML(label)}
          </span>

          <b class="${enabled ? "on" : "off"}">
            ${enabled ? "ACTIVE" : "OFF"}
          </b>

        </div>
      `
    ).join("");
  }

  function renderReportRow(
    report
  ) {

    return `
      <div
        class="vad-report-row"
        data-report-id="${escapeHTML(
          report.id
        )}">

        <div>

          <strong>
            ${escapeHTML(
              report.reason ||
              "Report"
            )}
          </strong>

          <span>
            ${escapeHTML(
              report.contentType ||
              "content"
            )}
            ·
            ${escapeHTML(
              report.status ||
              "pending"
            )}
          </span>

        </div>

        <button
          data-review-report="${escapeHTML(
            report.id
          )}">
          Review
        </button>

      </div>
    `;
  }

  function bindDashboard(
    container
  ) {

    container
      .querySelectorAll(
        "[data-admin-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const action =
              button.dataset.adminAction;

            emit(
              "navigate",
              {
                section: action
              }
            );

          }
        );

      });

    container
      .querySelectorAll(
        "[data-review-report]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            emit(
              "review-report",
              {
                reportId:
                  button.dataset
                    .reviewReport
              }
            );

          }
        );

      });
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {

    if (state.initialized) {
      return api;
    }

    const saved =
      storageGet();

    state.admins.clear();

    (
      saved.admins || []
    ).forEach(admin => {

      if (admin?.userId) {
        state.admins.set(
          admin.userId,
          admin
        );
      }

    });

    state.settings = {
      ...DEFAULT_DATA.settings,
      ...(saved.settings || {})
    };

    state.announcements =
      Array.isArray(
        saved.announcements
      )
        ? saved.announcements
        : [];

    state.auditLogs =
      Array.isArray(
        saved.auditLogs
      )
        ? saved.auditLogs
        : [];

    state.featureFlags =
      saved.featureFlags || {};

    state.initialized = true;

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
        "vortex-admin-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "vortex-admin-styles";

    style.textContent = `

      .vortex-admin-dashboard{
        width:100%;
        min-height:100%;
        color:#fff;
        font-family:
          Inter,
          system-ui,
          -apple-system,
          sans-serif;
      }

      .vad-header{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
        padding:25px;
        margin-bottom:16px;
        border-radius:26px;
        background:
          linear-gradient(
            135deg,
            rgba(0,217,255,.10),
            rgba(139,77,255,.12)
          );
        border:1px solid
          rgba(255,255,255,.08);
        box-shadow:
          0 20px 60px
          rgba(0,0,0,.25);
      }

      .vad-kicker{
        color:#00d9ff;
        font-size:10px;
        font-weight:900;
        letter-spacing:2px;
      }

      .vad-header h1{
        margin:6px 0;
        font-size:29px;
      }

      .vad-header p{
        margin:0;
        color:
          rgba(255,255,255,.56);
        font-size:13px;
      }

      .vad-admin-badge{
        padding:10px 14px;
        border-radius:999px;
        background:
          rgba(0,217,255,.08);
        border:1px solid
          rgba(0,217,255,.2);
        color:#00d9ff;
        font-size:11px;
        font-weight:800;
        text-transform:uppercase;
      }

      .vad-online-dot{
        display:inline-block;
        width:7px;
        height:7px;
        margin-right:6px;
        border-radius:50%;
        background:#00d9ff;
        box-shadow:
          0 0 12px #00d9ff;
      }

      .vad-cards{
        display:grid;
        grid-template-columns:
          repeat(4,1fr);
        gap:12px;
        margin-bottom:16px;
      }

      .vad-card{
        padding:20px;
        border-radius:21px;
        background:
          rgba(255,255,255,.04);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vad-card span{
        display:block;
        color:
          rgba(255,255,255,.48);
        font-size:11px;
      }

      .vad-card strong{
        display:block;
        margin-top:5px;
        font-size:27px;
      }

      .vad-grid{
        display:grid;
        grid-template-columns:
          1fr 1fr;
        gap:16px;
        margin-bottom:16px;
      }

      .vad-panel{
        overflow:hidden;
        border-radius:23px;
        background:
          rgba(255,255,255,.035);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vad-panel-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:18px;
        border-bottom:1px solid
          rgba(255,255,255,.06);
      }

      .vad-panel-head h2{
        margin:0;
        font-size:16px;
      }

      .vad-status-row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:14px 18px;
        border-bottom:1px solid
          rgba(255,255,255,.045);
      }

      .vad-status-row span{
        color:
          rgba(255,255,255,.7);
        font-size:13px;
      }

      .vad-status-row b{
        font-size:9px;
        letter-spacing:1px;
      }

      .vad-status-row b.on{
        color:#00d9ff;
      }

      .vad-status-row b.off{
        color:#ff6b7a;
      }

      .vad-actions{
        display:grid;
        grid-template-columns:
          1fr 1fr;
        gap:10px;
        padding:16px;
      }

      .vad-actions button{
        min-height:65px;
        border:1px solid
          rgba(255,255,255,.08);
        border-radius:16px;
        background:
          rgba(255,255,255,.045);
        color:#fff;
        cursor:pointer;
        font-weight:700;
      }

      .vad-actions button:hover{
        border-color:
          rgba(0,217,255,.35);
        background:
          rgba(0,217,255,.08);
      }

      .vad-reports{
        margin-bottom:20px;
      }

      .vad-report-row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:15px;
        padding:15px 18px;
        border-bottom:1px solid
          rgba(255,255,255,.05);
      }

      .vad-report-row strong{
        display:block;
        font-size:13px;
      }

      .vad-report-row span{
        display:block;
        margin-top:4px;
        color:
          rgba(255,255,255,.45);
        font-size:11px;
      }

      .vad-report-row button{
        border:1px solid
          rgba(0,217,255,.2);
        background:
          rgba(0,217,255,.07);
        color:#00d9ff;
        border-radius:10px;
        padding:8px 12px;
        cursor:pointer;
      }

      .vad-empty{
        padding:35px;
        text-align:center;
        color:
          rgba(255,255,255,.45);
        font-size:13px;
      }

      .vortex-admin-denied{
        min-height:350px;
        display:grid;
        place-items:center;
        align-content:center;
        text-align:center;
        padding:30px;
        border-radius:25px;
        background:
          rgba(255,255,255,.035);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vad-icon{
        width:70px;
        height:70px;
        display:grid;
        place-items:center;
        margin-bottom:15px;
        border-radius:22px;
        background:
          rgba(139,77,255,.1);
        font-size:30px;
      }

      .vortex-admin-denied h2{
        margin:0;
      }

      .vortex-admin-denied p{
        color:
          rgba(255,255,255,.5);
      }

      @media(max-width:800px){

        .vad-header{
          flex-direction:column;
        }

        .vad-cards{
          grid-template-columns:
            repeat(2,1fr);
        }

        .vad-grid{
          grid-template-columns:1fr;
        }

      }

      @media(max-width:480px){

        .vad-cards{
          grid-template-columns:1fr 1fr;
        }

        .vad-header h1{
          font-size:23px;
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

    ROLES,
    PERMISSIONS,

    init,
    on,
    emit,

    addAdmin,
    removeAdmin,
    updateAdmin,
    getAdmin,
    getAdmins,

    getRole,
    isAdmin,
    isActiveAdmin,
    hasPermission,
    requirePermission,
    getPermissions,

    getSettings,
    getSetting,
    setSetting,
    updateSettings,

    setFeature,
    isFeatureEnabled,
    getFeatureFlags,

    getUsers,
    findUser,
    suspendUser,
    unsuspendUser,
    banUser,

    getReports,
    reviewReport,
    deletePost,

    createAnnouncement,
    getAnnouncements,
    removeAnnouncement,

    logAction,
    getAuditLogs,

    getAnalytics,
    getDashboardData,

    renderDashboard,

    getState() {
      return {
        initialized:
          state.initialized,
        adminCount:
          state.admins.size,
        settings:
          getSettings(),
        featureFlags:
          getFeatureFlags()
      };
    }
  };

  if (
    typeof window !== "undefined"
  ) {
    window.VortexAdmin = api;
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
