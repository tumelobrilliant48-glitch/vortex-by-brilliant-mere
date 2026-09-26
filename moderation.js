/* =========================================================
   VORTEX OMNIVERSE
   MODERATION ENGINE
   moderation.js
   ========================================================= */

"use strict";

const VortexModeration = (() => {

  const VERSION = "1.0.0";

  const STORAGE_KEYS = {
    reports: "vortex_moderation_reports",
    actions: "vortex_moderation_actions",
    blocked: "vortex_moderation_blocked",
    muted: "vortex_moderation_muted",
    warnings: "vortex_moderation_warnings",
    settings: "vortex_moderation_settings"
  };

  const REPORT_TYPES = {
    SPAM: "spam",
    HARASSMENT: "harassment",
    HATE: "hate",
    VIOLENCE: "violence",
    SEXUAL: "sexual",
    SCAM: "scam",
    IMPERSONATION: "impersonation",
    FALSE_INFORMATION: "false_information",
    COPYRIGHT: "copyright",
    SELF_HARM: "self_harm",
    CHILD_SAFETY: "child_safety",
    OTHER: "other"
  };

  const ACTIONS = {
    NONE: "none",
    HIDE: "hide",
    REMOVE: "remove",
    WARN: "warn",
    MUTE: "mute",
    BLOCK: "block",
    SUSPEND: "suspend",
    BAN: "ban"
  };

  const CONTENT_TYPES = {
    POST: "post",
    COMMENT: "comment",
    MESSAGE: "message",
    REEL: "reel",
    STORY: "story",
    PROFILE: "profile",
    GROUP: "group",
    EVENT: "event",
    MARKETPLACE: "marketplace",
    MEDIA: "media"
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    autoModeration: true,
    hideReportedContent: false,
    spamProtection: true,
    profanityFilter: true,
    linkProtection: true,
    duplicateProtection: true,
    maxReportsBeforeReview: 3,
    maxReportsBeforeHide: 5,
    warningThreshold: 3,
    suspensionThreshold: 6,
    banThreshold: 10
  };

  const state = {
    initialized: false,
    reports: new Map(),
    actions: new Map(),
    blocked: new Set(),
    muted: new Set(),
    warnings: new Map(),
    settings: { ...DEFAULT_SETTINGS }
  };

  const listeners = new Map();

  /* =========================================================
     EVENTS
     ========================================================= */

  function on(event, callback) {
    if (typeof callback !== "function") return () => {};

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(callback);

    return () => {
      listeners.get(event)?.delete(callback);
    };
  }

  function emit(event, data = {}) {
    const set = listeners.get(event);

    if (set) {
      set.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error("[VortexModeration] Event error:", error);
        }
      });
    }

    try {
      window.dispatchEvent(
        new CustomEvent(`vortex:moderation:${event}`, {
          detail: data
        })
      );
    } catch (_) {}
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function createId(prefix = "mod") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function getUserId() {
    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexUser?.getCurrentUserId?.() ||
      window.VortexFriends?.getUserId?.() ||
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

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
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

  function normalize(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getContentId(content) {
    if (!content) return null;

    if (typeof content === "string") {
      return content;
    }

    return (
      content.id ||
      content.postId ||
      content.commentId ||
      content.messageId ||
      content.reelId ||
      content.storyId ||
      content.userId ||
      content.eventId ||
      content.groupId ||
      null
    );
  }

  function getContentType(content, explicitType) {
    if (explicitType) return explicitType;

    if (!content || typeof content !== "object") {
      return CONTENT_TYPES.POST;
    }

    if (content.commentId) return CONTENT_TYPES.COMMENT;
    if (content.messageId) return CONTENT_TYPES.MESSAGE;
    if (content.reelId) return CONTENT_TYPES.REEL;
    if (content.storyId) return CONTENT_TYPES.STORY;
    if (content.eventId) return CONTENT_TYPES.EVENT;
    if (content.groupId) return CONTENT_TYPES.GROUP;
    if (content.marketplaceId) return CONTENT_TYPES.MARKETPLACE;
    if (content.mediaId) return CONTENT_TYPES.MEDIA;

    return content.type || CONTENT_TYPES.POST;
  }

  function getAuthorId(content) {
    if (!content || typeof content !== "object") {
      return null;
    }

    return (
      content.authorId ||
      content.userId ||
      content.creatorId ||
      content.ownerId ||
      content.senderId ||
      null
    );
  }

  function safeStorageGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("[VortexModeration] Storage error:", error);
      return false;
    }
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  function saveReports() {
    safeStorageSet(
      STORAGE_KEYS.reports,
      Array.from(state.reports.values())
    );
  }

  function saveActions() {
    safeStorageSet(
      STORAGE_KEYS.actions,
      Array.from(state.actions.values())
    );
  }

  function saveBlocked() {
    safeStorageSet(
      STORAGE_KEYS.blocked,
      Array.from(state.blocked)
    );
  }

  function saveMuted() {
    safeStorageSet(
      STORAGE_KEYS.muted,
      Array.from(state.muted)
    );
  }

  function saveWarnings() {
    safeStorageSet(
      STORAGE_KEYS.warnings,
      Array.from(state.warnings.entries())
    );
  }

  function saveSettings() {
    safeStorageSet(
      STORAGE_KEYS.settings,
      state.settings
    );
  }

  function load() {
    const reports = safeStorageGet(STORAGE_KEYS.reports, []);
    const actions = safeStorageGet(STORAGE_KEYS.actions, []);
    const blocked = safeStorageGet(STORAGE_KEYS.blocked, []);
    const muted = safeStorageGet(STORAGE_KEYS.muted, []);
    const warnings = safeStorageGet(STORAGE_KEYS.warnings, []);
    const settings = safeStorageGet(
      STORAGE_KEYS.settings,
      DEFAULT_SETTINGS
    );

    state.reports.clear();
    state.actions.clear();
    state.blocked.clear();
    state.muted.clear();
    state.warnings.clear();

    reports.forEach(item => {
      if (item?.id) {
        state.reports.set(item.id, item);
      }
    });

    actions.forEach(item => {
      if (item?.id) {
        state.actions.set(item.id, item);
      }
    });

    blocked.forEach(id => {
      if (id) state.blocked.add(id);
    });

    muted.forEach(id => {
      if (id) state.muted.add(id);
    });

    warnings.forEach(item => {
      if (Array.isArray(item) && item.length === 2) {
        state.warnings.set(item[0], item[1]);
      }
    });

    state.settings = {
      ...DEFAULT_SETTINGS,
      ...(settings || {})
    };
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function getSettings() {
    return clone(state.settings);
  }

  function getSetting(key) {
    return state.settings[key];
  }

  function setSetting(key, value) {
    if (!(key in DEFAULT_SETTINGS)) {
      return false;
    }

    state.settings[key] = value;
    saveSettings();

    emit("settings-change", {
      key,
      value,
      settings: getSettings()
    });

    return true;
  }

  function updateSettings(values = {}) {
    Object.keys(values).forEach(key => {
      if (key in DEFAULT_SETTINGS) {
        state.settings[key] = values[key];
      }
    });

    saveSettings();

    emit("settings-change", {
      settings: getSettings()
    });

    return getSettings();
  }

  function resetSettings() {
    state.settings = {
      ...DEFAULT_SETTINGS
    };

    saveSettings();

    emit("settings-reset", {
      settings: getSettings()
    });

    return getSettings();
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function createReport({
    content,
    contentId,
    contentType,
    reason = REPORT_TYPES.OTHER,
    description = "",
    targetUserId,
    metadata = {}
  } = {}) {

    const reporterId = getUserId();

    const id = createId("report");

    const resolvedContentId =
      contentId ||
      getContentId(content);

    const resolvedType =
      getContentType(content, contentType);

    const resolvedTargetUserId =
      targetUserId ||
      getAuthorId(content);

    const report = {
      id,
      reporterId,
      targetUserId: resolvedTargetUserId,
      contentId: resolvedContentId,
      contentType: resolvedType,
      reason,
      description: String(description || "").slice(0, 2000),
      metadata: clone(metadata),
      status: "pending",
      action: ACTIONS.NONE,
      createdAt: now(),
      reviewedAt: null,
      reviewedBy: null
    };

    state.reports.set(id, report);
    saveReports();

    emit("report-created", {
      report: clone(report)
    });

    if (state.settings.autoModeration) {
      runAutoModeration(report);
    }

    return clone(report);
  }

  function reportContent(content, reason, description = "", options = {}) {
    return createReport({
      content,
      reason,
      description,
      ...options
    });
  }

  function getReport(id) {
    const report = state.reports.get(id);
    return report ? clone(report) : null;
  }

  function getReports(filters = {}) {
    let results = Array.from(state.reports.values());

    if (filters.status) {
      results = results.filter(
        item => item.status === filters.status
      );
    }

    if (filters.reason) {
      results = results.filter(
        item => item.reason === filters.reason
      );
    }

    if (filters.contentType) {
      results = results.filter(
        item => item.contentType === filters.contentType
      );
    }

    if (filters.contentId) {
      results = results.filter(
        item => item.contentId === filters.contentId
      );
    }

    if (filters.targetUserId) {
      results = results.filter(
        item => item.targetUserId === filters.targetUserId
      );
    }

    if (filters.reporterId) {
      results = results.filter(
        item => item.reporterId === filters.reporterId
      );
    }

    results.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    return clone(results);
  }

  function getPendingReports() {
    return getReports({
      status: "pending"
    });
  }

  function getReportsForContent(contentId) {
    return getReports({
      contentId
    });
  }

  function getReportCount(contentId) {
    return getReportsForContent(contentId).length;
  }

  function reviewReport(
    reportId,
    {
      action = ACTIONS.NONE,
      reviewerId = getUserId(),
      note = ""
    } = {}
  ) {

    const report = state.reports.get(reportId);

    if (!report) {
      return null;
    }

    report.status = "reviewed";
    report.action = action;
    report.reviewedAt = now();
    report.reviewedBy = reviewerId;
    report.reviewNote = String(note || "").slice(0, 2000);

    state.reports.set(reportId, report);

    saveReports();

    if (action !== ACTIONS.NONE) {
      applyAction({
        action,
        targetUserId: report.targetUserId,
        contentId: report.contentId,
        contentType: report.contentType,
        reason: report.reason,
        source: "report",
        reportId
      });
    }

    emit("report-reviewed", {
      report: clone(report)
    });

    return clone(report);
  }

  /* =========================================================
     BLOCKING / MUTING
     ========================================================= */

  function blockUser(userId, reason = "user_block") {
    if (!userId || userId === getUserId()) {
      return false;
    }

    state.blocked.add(userId);
    saveBlocked();

    emit("user-blocked", {
      userId,
      reason
    });

    return true;
  }

  function unblockUser(userId) {
    if (!userId) return false;

    const existed = state.blocked.delete(userId);

    if (existed) {
      saveBlocked();

      emit("user-unblocked", {
        userId
      });
    }

    return existed;
  }

  function isBlocked(userId) {
    return !!userId && state.blocked.has(userId);
  }

  function getBlockedUsers() {
    return Array.from(state.blocked);
  }

  function muteUser(userId, reason = "user_mute") {
    if (!userId || userId === getUserId()) {
      return false;
    }

    state.muted.add(userId);
    saveMuted();

    emit("user-muted", {
      userId,
      reason
    });

    return true;
  }

  function unmuteUser(userId) {
    if (!userId) return false;

    const existed = state.muted.delete(userId);

    if (existed) {
      saveMuted();

      emit("user-unmuted", {
        userId
      });
    }

    return existed;
  }

  function isMuted(userId) {
    return !!userId && state.muted.has(userId);
  }

  function getMutedUsers() {
    return Array.from(state.muted);
  }

  /* =========================================================
     WARNINGS
     ========================================================= */

  function getWarningRecord(userId) {
    if (!userId) return null;

    if (!state.warnings.has(userId)) {
      state.warnings.set(userId, {
        userId,
        count: 0,
        history: [],
        updatedAt: now()
      });
    }

    return state.warnings.get(userId);
  }

  function warnUser(userId, reason, details = "") {
    if (!userId) return null;

    const record = getWarningRecord(userId);

    record.count += 1;

    record.history.push({
      id: createId("warning"),
      reason,
      details: String(details || "").slice(0, 2000),
      createdAt: now()
    });

    record.updatedAt = now();

    state.warnings.set(userId, record);

    saveWarnings();

    emit("user-warned", {
      userId,
      warning: clone(record)
    });

    if (
      record.count >=
      Number(state.settings.suspensionThreshold)
    ) {
      emit("suspension-threshold", {
        userId,
        count: record.count
      });
    }

    return clone(record);
  }

  function getWarnings(userId) {
    const record = state.warnings.get(userId);
    return record ? clone(record) : null;
  }

  function getWarningCount(userId) {
    return state.warnings.get(userId)?.count || 0;
  }

  function clearWarnings(userId) {
    if (!userId) return false;

    const existed = state.warnings.delete(userId);

    if (existed) {
      saveWarnings();

      emit("warnings-cleared", {
        userId
      });
    }

    return existed;
  }

  /* =========================================================
     ACTIONS
     ========================================================= */

  function applyAction({
    action,
    targetUserId = null,
    contentId = null,
    contentType = null,
    reason = "",
    source = "manual",
    reportId = null
  } = {}) {

    const actionId = createId("action");

    const record = {
      id: actionId,
      action,
      targetUserId,
      contentId,
      contentType,
      reason,
      source,
      reportId,
      moderatorId: getUserId(),
      createdAt: now()
    };

    state.actions.set(actionId, record);
    saveActions();

    if (targetUserId) {
      if (action === ACTIONS.BLOCK) {
        blockUser(targetUserId, reason);
      }

      if (action === ACTIONS.MUTE) {
        muteUser(targetUserId, reason);
      }

      if (action === ACTIONS.WARN) {
        warnUser(targetUserId, reason);
      }

      if (action === ACTIONS.SUSPEND) {
        emit("user-suspended", {
          userId: targetUserId,
          reason
        });
      }

      if (action === ACTIONS.BAN) {
        emit("user-banned", {
          userId: targetUserId,
          reason
        });
      }
    }

    if (contentId) {
      emit("content-action", {
        action,
        contentId,
        contentType,
        reason
      });
    }

    emit("action-created", {
      action: clone(record)
    });

    return clone(record);
  }

  function getActions(filters = {}) {
    let results = Array.from(state.actions.values());

    if (filters.action) {
      results = results.filter(
        item => item.action === filters.action
      );
    }

    if (filters.targetUserId) {
      results = results.filter(
        item => item.targetUserId === filters.targetUserId
      );
    }

    if (filters.contentId) {
      results = results.filter(
        item => item.contentId === filters.contentId
      );
    }

    results.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    return clone(results);
  }

  /* =========================================================
     TEXT MODERATION
     ========================================================= */

  const DEFAULT_BLOCKED_WORDS = [
    "spamword",
    "free money scam",
    "fake giveaway",
    "click this link to win"
  ];

  const DEFAULT_SUSPICIOUS_PATTERNS = [
    /free\s+money/i,
    /send\s+me\s+your\s+password/i,
    /send\s+your\s+otp/i,
    /give\s+me\s+your\s+verification\s+code/i,
    /guaranteed\s+profit/i,
    /double\s+your\s+money/i,
    /click\s+here\s+to\s+claim/i
  ];

  function getBlockedWords() {
    return [
      ...DEFAULT_BLOCKED_WORDS,
      ...(window.VortexModerationWords || [])
    ];
  }

  function containsBlockedWord(text) {
    const value = normalize(text);

    return getBlockedWords().some(word =>
      value.includes(normalize(word))
    );
  }

  function containsSuspiciousPattern(text) {
    return DEFAULT_SUSPICIOUS_PATTERNS.some(
      pattern => pattern.test(String(text || ""))
    );
  }

  function containsExcessiveLinks(text) {
    const matches =
      String(text || "").match(
        /https?:\/\/[^\s]+/gi
      ) || [];

    return matches.length >= 4;
  }

  function hasRepeatedText(text) {
    const words = normalize(text)
      .split(/\s+/)
      .filter(Boolean);

    if (words.length < 8) {
      return false;
    }

    const frequency = {};

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.values(frequency)
      .some(count => count / words.length > 0.45);
  }

  function analyzeText(text = "") {
    const value = String(text || "");

    const flags = [];

    if (containsBlockedWord(value)) {
      flags.push("blocked_word");
    }

    if (containsSuspiciousPattern(value)) {
      flags.push("suspicious_pattern");
    }

    if (
      state.settings.linkProtection &&
      containsExcessiveLinks(value)
    ) {
      flags.push("excessive_links");
    }

    if (
      state.settings.duplicateProtection &&
      hasRepeatedText(value)
    ) {
      flags.push("repeated_text");
    }

    let severity = "safe";

    if (flags.length === 1) {
      severity = "review";
    }

    if (flags.length >= 2) {
      severity = "high";
    }

    return {
      safe: flags.length === 0,
      severity,
      flags
    };
  }

  function moderateText(text = "") {
    const result = analyzeText(text);

    emit("text-analyzed", {
      text,
      result
    });

    return result;
  }

  /* =========================================================
     CONTENT ANALYSIS
     ========================================================= */

  function analyzeContent(content = {}) {
    if (!content) {
      return {
        safe: true,
        severity: "safe",
        flags: []
      };
    }

    const textParts = [
      content.text,
      content.caption,
      content.description,
      content.title,
      content.bio,
      content.comment
    ].filter(Boolean);

    const combinedText = textParts.join(" ");

    const textResult =
      moderateText(combinedText);

    const flags = [...textResult.flags];

    if (
      content.url &&
      state.settings.linkProtection
    ) {
      const url = String(content.url);

      if (
        /bit\.ly|tinyurl|t\.co|shorturl/i.test(url)
      ) {
        flags.push("shortened_link");
      }
    }

    let severity = "safe";

    if (flags.length === 1) {
      severity = "review";
    }

    if (flags.length >= 2) {
      severity = "high";
    }

    return {
      safe: flags.length === 0,
      severity,
      flags,
      text: combinedText
    };
  }

  /* =========================================================
     AUTOMODERATION
     ========================================================= */

  function runAutoModeration(report) {
    if (!report) return null;

    const count = getReportCount(
      report.contentId
    );

    let action = ACTIONS.NONE;

    if (
      count >=
      Number(state.settings.maxReportsBeforeHide)
    ) {
      action = ACTIONS.HIDE;
    }

    if (
      report.reason === REPORT_TYPES.SCAM ||
      report.reason === REPORT_TYPES.CHILD_SAFETY
    ) {
      action = ACTIONS.HIDE;
    }

    if (action !== ACTIONS.NONE) {
      applyAction({
        action,
        targetUserId: report.targetUserId,
        contentId: report.contentId,
        contentType: report.contentType,
        reason: report.reason,
        source: "auto"
      });
    }

    return action;
  }

  function autoModerateContent(content, options = {}) {
    if (!state.settings.enabled) {
      return {
        allowed: true,
        action: ACTIONS.NONE,
        analysis: {
          safe: true,
          severity: "disabled",
          flags: []
        }
      };
    }

    const analysis =
      analyzeContent(content);

    let action = ACTIONS.NONE;

    if (
      state.settings.autoModeration &&
      !analysis.safe
    ) {
      if (analysis.severity === "high") {
        action = ACTIONS.HIDE;
      } else {
        action = ACTIONS.WARN;
      }
    }

    if (action !== ACTIONS.NONE) {
      applyAction({
        action,
        targetUserId: getAuthorId(content),
        contentId: getContentId(content),
        contentType: getContentType(content),
        reason: analysis.flags.join(","),
        source: "auto"
      });
    }

    return {
      allowed: action !== ACTIONS.HIDE,
      action,
      analysis
    };
  }

  /* =========================================================
     CONTENT VISIBILITY
     ========================================================= */

  function getContentActions(contentId) {
    return getActions({
      contentId
    });
  }

  function isContentHidden(contentId) {
    return getContentActions(contentId)
      .some(item =>
        item.action === ACTIONS.HIDE ||
        item.action === ACTIONS.REMOVE
      );
  }

  function isContentRemoved(contentId) {
    return getContentActions(contentId)
      .some(item =>
        item.action === ACTIONS.REMOVE
      );
  }

  function shouldHideContent(content) {
    const id = getContentId(content);

    if (!id) return false;

    return isContentHidden(id);
  }

  function canInteractWithUser(userId) {
    if (!userId) return true;

    if (userId === getUserId()) {
      return true;
    }

    return !isBlocked(userId);
  }

  function canViewContent(content) {
    if (!content) return true;

    const authorId =
      getAuthorId(content);

    if (
      authorId &&
      isBlocked(authorId)
    ) {
      return false;
    }

    if (
      shouldHideContent(content)
    ) {
      return false;
    }

    return true;
  }

  /* =========================================================
     USER SAFETY
     ========================================================= */

  function reportUser(
    userId,
    reason = REPORT_TYPES.OTHER,
    description = ""
  ) {
    return createReport({
      targetUserId: userId,
      contentId: userId,
      contentType: CONTENT_TYPES.PROFILE,
      reason,
      description
    });
  }

  function blockAndReport(
    userId,
    reason = REPORT_TYPES.OTHER,
    description = ""
  ) {
    const report = reportUser(
      userId,
      reason,
      description
    );

    blockUser(userId, reason);

    return report;
  }

  /* =========================================================
     MODERATION QUEUE
     ========================================================= */

  function getQueue() {
    return getPendingReports();
  }

  function getQueueStats() {
    const reports =
      Array.from(state.reports.values());

    const stats = {
      total: reports.length,
      pending: 0,
      reviewed: 0,
      hidden: 0,
      removed: 0,
      warnings: 0,
      bans: 0
    };

    reports.forEach(report => {
      if (report.status === "pending") {
        stats.pending++;
      }

      if (report.status === "reviewed") {
        stats.reviewed++;
      }

      if (report.action === ACTIONS.HIDE) {
        stats.hidden++;
      }

      if (report.action === ACTIONS.REMOVE) {
        stats.removed++;
      }

      if (report.action === ACTIONS.WARN) {
        stats.warnings++;
      }

      if (report.action === ACTIONS.BAN) {
        stats.bans++;
      }
    });

    return stats;
  }

  /* =========================================================
     MODERATION DASHBOARD
     ========================================================= */

  function renderDashboard(container) {
    if (!container) return;

    const stats = getQueueStats();
    const queue = getQueue();

    container.innerHTML = `
      <section class="vortex-moderation-dashboard">

        <div class="vm-header">
          <div>
            <span class="vm-kicker">VORTEX SAFETY</span>
            <h2>Moderation Center</h2>
            <p>Manage reports, safety actions and content protection.</p>
          </div>

          <div class="vm-status">
            <span class="vm-status-dot"></span>
            ${state.settings.enabled ? "Protection Active" : "Protection Off"}
          </div>
        </div>

        <div class="vm-stats">

          <div class="vm-stat">
            <strong>${stats.total}</strong>
            <span>Total Reports</span>
          </div>

          <div class="vm-stat">
            <strong>${stats.pending}</strong>
            <span>Pending</span>
          </div>

          <div class="vm-stat">
            <strong>${stats.hidden}</strong>
            <span>Hidden</span>
          </div>

          <div class="vm-stat">
            <strong>${stats.removed}</strong>
            <span>Removed</span>
          </div>

        </div>

        <div class="vm-panel">
          <div class="vm-panel-head">
            <h3>Report Queue</h3>
            <button class="vm-refresh" data-vm-refresh>
              Refresh
            </button>
          </div>

          <div class="vm-queue">

            ${
              queue.length
                ? queue.map(renderReport).join("")
                : `
                  <div class="vm-empty">
                    <div class="vm-empty-icon">✓</div>
                    <strong>No pending reports</strong>
                    <span>The moderation queue is clear.</span>
                  </div>
                `
            }

          </div>
        </div>

      </section>
    `;

    bindDashboard(container);
  }

  function renderReport(report) {
    return `
      <article class="vm-report" data-report-id="${escapeHTML(report.id)}">

        <div class="vm-report-main">

          <div class="vm-report-icon">
            ⚠
          </div>

          <div class="vm-report-content">

            <div class="vm-report-title">
              ${escapeHTML(report.reason)}
            </div>

            <div class="vm-report-meta">
              ${escapeHTML(report.contentType)}
              ·
              ${escapeHTML(report.contentId || "unknown")}
            </div>

            ${
              report.description
                ? `
                  <p>
                    ${escapeHTML(report.description)}
                  </p>
                `
                : ""
            }

            <small>
              ${formatDate(report.createdAt)}
            </small>

          </div>

        </div>

        <div class="vm-report-actions">

          <button
            data-vm-action="warn"
            data-report="${escapeHTML(report.id)}">
            Warn
          </button>

          <button
            data-vm-action="hide"
            data-report="${escapeHTML(report.id)}">
            Hide
          </button>

          <button
            data-vm-action="remove"
            data-report="${escapeHTML(report.id)}">
            Remove
          </button>

        </div>

      </article>
    `;
  }

  function bindDashboard(container) {

    container
      .querySelector("[data-vm-refresh]")
      ?.addEventListener("click", () => {
        renderDashboard(container);
      });

    container
      .querySelectorAll("[data-vm-action]")
      .forEach(button => {

        button.addEventListener("click", () => {

          const action =
            button.dataset.vmAction;

          const reportId =
            button.dataset.report;

          reviewReport(
            reportId,
            {
              action:
                action === "warn"
                  ? ACTIONS.WARN
                  : action === "hide"
                    ? ACTIONS.HIDE
                    : ACTIONS.REMOVE
            }
          );

          renderDashboard(container);
        });

      });
  }

  /* =========================================================
     REPORT MODAL
     ========================================================= */

  function openReportModal({
    content,
    contentType,
    contentId,
    targetUserId
  } = {}) {

    const existing =
      document.getElementById(
        "vortexModerationModal"
      );

    existing?.remove();

    const modal =
      document.createElement("div");

    modal.id =
      "vortexModerationModal";

    modal.className =
      "vm-modal";

    modal.innerHTML = `
      <div class="vm-modal-backdrop" data-vm-close></div>

      <div class="vm-modal-card">

        <button
          class="vm-modal-close"
          data-vm-close>
          ×
        </button>

        <span class="vm-kicker">VORTEX SAFETY</span>

        <h2>Report Content</h2>

        <p class="vm-modal-description">
          Tell VORTEX what is wrong with this content.
        </p>

        <div class="vm-reasons">

          ${Object.entries(REPORT_TYPES)
            .map(([key, value]) => `
              <button
                type="button"
                class="vm-reason"
                data-reason="${value}">
                ${formatReason(value)}
              </button>
            `)
            .join("")}

        </div>

        <textarea
          class="vm-description"
          maxlength="2000"
          placeholder="Additional details (optional)">
        </textarea>

        <button
          class="vm-submit-report"
          data-vm-submit>
          Submit Report
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    let selectedReason =
      REPORT_TYPES.OTHER;

    modal
      .querySelectorAll("[data-reason]")
      .forEach(button => {

        button.addEventListener("click", () => {

          selectedReason =
            button.dataset.reason;

          modal
            .querySelectorAll("[data-reason]")
            .forEach(item =>
              item.classList.remove("active")
            );

          button.classList.add("active");
        });

      });

    modal
      .querySelectorAll("[data-vm-close]")
      .forEach(button => {

        button.addEventListener("click", () => {
          modal.remove();
        });

      });

    modal
      .querySelector("[data-vm-submit]")
      ?.addEventListener("click", () => {

        const description =
          modal
            .querySelector(".vm-description")
            ?.value || "";

        const report =
          createReport({
            content,
            contentId,
            contentType,
            targetUserId,
            reason: selectedReason,
            description
          });

        modal.remove();

        showToast(
          "Report submitted. Thank you for helping keep VORTEX safe."
        );

        emit("report-submitted", {
          report
        });
      });

    requestAnimationFrame(() => {
      modal.classList.add("visible");
    });

    return modal;
  }

  /* =========================================================
     UTILITIES
     ========================================================= */

  function formatReason(reason) {
    return String(reason)
      .replace(/_/g, " ")
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );
  }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat(
        undefined,
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      ).format(new Date(date));
    } catch (_) {
      return String(date || "");
    }
  }

  function showToast(message) {
    if (
      typeof window.VortexToast === "object" &&
      typeof window.VortexToast.show === "function"
    ) {
      window.VortexToast.show(message);
      return;
    }

    const toast =
      document.createElement("div");

    toast.className =
      "vm-toast";

    toast.textContent =
      message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    setTimeout(() => {
      toast.classList.remove("visible");

      setTimeout(() => {
        toast.remove();
      }, 300);

    }, 3000);
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {
    if (state.initialized) {
      return api;
    }

    load();

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
        "vortex-moderation-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "vortex-moderation-styles";

    style.textContent = `
      .vortex-moderation-dashboard{
        width:100%;
        color:#fff;
        font-family:Inter,system-ui,sans-serif;
      }

      .vm-header{
        display:flex;
        justify-content:space-between;
        gap:20px;
        align-items:flex-start;
        padding:22px;
        border-radius:24px;
        background:
          linear-gradient(
            135deg,
            rgba(0,217,255,.10),
            rgba(139,77,255,.10)
          );
        border:1px solid rgba(255,255,255,.08);
        margin-bottom:16px;
      }

      .vm-kicker{
        font-size:10px;
        letter-spacing:2px;
        color:#00d9ff;
        font-weight:800;
      }

      .vm-header h2{
        margin:6px 0;
        font-size:25px;
      }

      .vm-header p{
        margin:0;
        color:rgba(255,255,255,.58);
        font-size:13px;
      }

      .vm-status{
        white-space:nowrap;
        padding:9px 13px;
        border-radius:999px;
        background:rgba(0,217,255,.08);
        border:1px solid rgba(0,217,255,.22);
        font-size:11px;
      }

      .vm-status-dot{
        display:inline-block;
        width:7px;
        height:7px;
        border-radius:50%;
        background:#00d9ff;
        margin-right:6px;
        box-shadow:0 0 12px #00d9ff;
      }

      .vm-stats{
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:12px;
        margin-bottom:16px;
      }

      .vm-stat{
        padding:18px;
        border-radius:20px;
        background:rgba(255,255,255,.045);
        border:1px solid rgba(255,255,255,.07);
      }

      .vm-stat strong{
        display:block;
        font-size:25px;
      }

      .vm-stat span{
        display:block;
        margin-top:4px;
        color:rgba(255,255,255,.5);
        font-size:11px;
      }

      .vm-panel{
        border-radius:24px;
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.07);
        overflow:hidden;
      }

      .vm-panel-head{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:18px;
        border-bottom:1px solid rgba(255,255,255,.07);
      }

      .vm-panel-head h3{
        margin:0;
      }

      .vm-refresh{
        border:0;
        border-radius:10px;
        padding:8px 12px;
        color:#fff;
        background:rgba(0,217,255,.1);
        cursor:pointer;
      }

      .vm-report{
        display:flex;
        justify-content:space-between;
        gap:15px;
        padding:17px;
        border-bottom:1px solid rgba(255,255,255,.06);
      }

      .vm-report-main{
        display:flex;
        gap:12px;
        min-width:0;
      }

      .vm-report-icon{
        width:40px;
        height:40px;
        display:grid;
        place-items:center;
        border-radius:13px;
        background:rgba(255,100,100,.1);
      }

      .vm-report-content{
        min-width:0;
      }

      .vm-report-title{
        font-weight:800;
      }

      .vm-report-meta{
        margin-top:4px;
        color:#00d9ff;
        font-size:11px;
      }

      .vm-report-content p{
        margin:8px 0;
        color:rgba(255,255,255,.68);
        font-size:13px;
      }

      .vm-report-content small{
        color:rgba(255,255,255,.4);
      }

      .vm-report-actions{
        display:flex;
        align-items:center;
        gap:7px;
        flex-wrap:wrap;
      }

      .vm-report-actions button{
        border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.05);
        color:#fff;
        border-radius:9px;
        padding:8px 10px;
        cursor:pointer;
      }

      .vm-report-actions button:hover{
        background:rgba(0,217,255,.13);
        border-color:rgba(0,217,255,.3);
      }

      .vm-empty{
        padding:45px 20px;
        text-align:center;
        color:rgba(255,255,255,.5);
      }

      .vm-empty-icon{
        margin:auto auto 10px;
        width:48px;
        height:48px;
        display:grid;
        place-items:center;
        border-radius:50%;
        color:#00d9ff;
        background:rgba(0,217,255,.1);
        font-size:22px;
      }

      .vm-empty strong,
      .vm-empty span{
        display:block;
      }

      .vm-empty span{
        margin-top:5px;
        font-size:12px;
      }

      .vm-modal{
        position:fixed;
        inset:0;
        z-index:99999;
        display:grid;
        place-items:center;
        padding:18px;
        opacity:0;
        transition:.2s ease;
      }

      .vm-modal.visible{
        opacity:1;
      }

      .vm-modal-backdrop{
        position:absolute;
        inset:0;
        background:rgba(0,0,0,.72);
        backdrop-filter:blur(12px);
      }

      .vm-modal-card{
        position:relative;
        width:min(520px,100%);
        max-height:90vh;
        overflow:auto;
        padding:24px;
        border-radius:26px;
        background:#080b18;
        border:1px solid rgba(255,255,255,.1);
        box-shadow:0 25px 80px rgba(0,0,0,.55);
      }

      .vm-modal-card h2{
        margin:7px 0;
      }

      .vm-modal-description{
        color:rgba(255,255,255,.55);
        font-size:13px;
      }

      .vm-modal-close{
        position:absolute;
        right:15px;
        top:15px;
        width:35px;
        height:35px;
        border:0;
        border-radius:50%;
        color:#fff;
        background:rgba(255,255,255,.07);
        font-size:22px;
        cursor:pointer;
      }

      .vm-reasons{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:8px;
        margin:18px 0;
      }

      .vm-reason{
        text-align:left;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.04);
        color:#fff;
        border-radius:13px;
        padding:12px;
        cursor:pointer;
      }

      .vm-reason.active{
        border-color:#00d9ff;
        background:rgba(0,217,255,.1);
      }

      .vm-description{
        width:100%;
        min-height:100px;
        resize:vertical;
        box-sizing:border-box;
        border:1px solid rgba(255,255,255,.08);
        border-radius:15px;
        padding:13px;
        background:rgba(255,255,255,.04);
        color:#fff;
        outline:none;
      }

      .vm-submit-report{
        width:100%;
        margin-top:12px;
        padding:13px;
        border:0;
        border-radius:15px;
        color:#001018;
        background:#00d9ff;
        font-weight:800;
        cursor:pointer;
      }

      .vm-toast{
        position:fixed;
        left:50%;
        bottom:25px;
        transform:translate(-50%,20px);
        z-index:100000;
        padding:12px 17px;
        border-radius:14px;
        background:#11172a;
        color:#fff;
        border:1px solid rgba(0,217,255,.25);
        box-shadow:0 12px 40px rgba(0,0,0,.4);
        opacity:0;
        transition:.25s ease;
        font-size:13px;
      }

      .vm-toast.visible{
        opacity:1;
        transform:translate(-50%,0);
      }

      @media(max-width:700px){

        .vm-header{
          flex-direction:column;
        }

        .vm-stats{
          grid-template-columns:repeat(2,1fr);
        }

        .vm-report{
          flex-direction:column;
        }

        .vm-report-actions{
          width:100%;
        }

        .vm-report-actions button{
          flex:1;
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

    REPORT_TYPES,
    ACTIONS,
    CONTENT_TYPES,

    init,

    on,

    emit,

    getSettings,
    getSetting,
    setSetting,
    updateSettings,
    resetSettings,

    createReport,
    reportContent,
    reportUser,
    blockAndReport,

    getReport,
    getReports,
    getPendingReports,
    getReportsForContent,
    getReportCount,
    reviewReport,

    blockUser,
    unblockUser,
    isBlocked,
    getBlockedUsers,

    muteUser,
    unmuteUser,
    isMuted,
    getMutedUsers,

    warnUser,
    getWarnings,
    getWarningCount,
    clearWarnings,

    applyAction,
    getActions,

    analyzeText,
    moderateText,
    analyzeContent,
    autoModerateContent,

    getContentActions,
    isContentHidden,
    isContentRemoved,
    shouldHideContent,
    canInteractWithUser,
    canViewContent,

    getQueue,
    getQueueStats,

    renderDashboard,
    renderReport,
    openReportModal,

    formatReason,
    formatDate
  };

  if (typeof window !== "undefined") {
    window.VortexModeration = api;
  }

  if (
    typeof document !== "undefined"
  ) {
    if (
      document.readyState === "loading"
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
