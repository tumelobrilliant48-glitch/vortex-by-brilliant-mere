/* =========================================================
   VORTEX — ADMIN & MODERATION SYSTEM
   File: admin.js

   Handles:
   - Roles
   - Permissions
   - Reports
   - Moderation
   - User status
   - Audit logs
   - Admin dashboard
   ========================================================= */

(function () {
  "use strict";

  const ROLE_KEY = "vortex_admin_roles";
  const REPORT_KEY = "vortex_reports";
  const STATUS_KEY = "vortex_admin_user_status";
  const ACTION_KEY = "vortex_moderation_actions";
  const SETTINGS_KEY = "vortex_admin_settings";

  const ROLES = {
    USER: "user",
    MODERATOR: "moderator",
    ADMIN: "admin",
    SUPERADMIN: "superadmin"
  };

  const PERMISSIONS = {
    user: [],

    moderator: [
      "reports.view",
      "reports.manage",
      "content.moderate",
      "users.warn"
    ],

    admin: [
      "reports.view",
      "reports.manage",
      "content.moderate",
      "users.warn",
      "users.suspend",
      "users.ban",
      "groups.manage",
      "events.manage",
      "roles.manage",
      "settings.view"
    ],

    superadmin: ["*"]
  };

  const REPORT_STATUSES = {
    PENDING: "pending",
    ASSIGNED: "assigned",
    RESOLVED: "resolved",
    DISMISSED: "dismissed"
  };

  const USER_STATUSES = {
    ACTIVE: "active",
    WARNED: "warned",
    SUSPENDED: "suspended",
    BANNED: "banned"
  };

  const listeners = new Set();

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("VORTEX Admin: storage read failed.", error);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      notify();
      return true;
    } catch (error) {
      console.error("VORTEX Admin: storage write failed.", error);
      return false;
    }
  }

  function id(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 9)
    );
  }

  function now() {
    return new Date().toISOString();
  }

  function notify() {
    listeners.forEach((callback) => {
      try {
        callback(api);
      } catch (error) {
        console.error("VORTEX Admin listener error:", error);
      }
    });
  }

  function emitEvent(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("vortex:admin:" + name, {
          detail
        })
      );
    } catch (_) {}
  }

  function getCurrentUserId() {
    try {
      if (
        window.VortexAuth &&
        typeof window.VortexAuth.currentUser === "function"
      ) {
        const user = window.VortexAuth.currentUser();
        return user ? user.id : null;
      }
    } catch (_) {}

    return null;
  }

  function normalizeRole(role) {
    const value = String(role || "").toLowerCase();

    if (Object.values(ROLES).includes(value)) {
      return value;
    }

    return ROLES.USER;
  }

  function getRoles() {
    return load(ROLE_KEY, {});
  }

  function setRoleInternal(userId, role) {
    const roles = getRoles();
    roles[userId] = normalizeRole(role);
    save(ROLE_KEY, roles);
    return roles[userId];
  }

  function getRole(userId) {
    if (!userId) return ROLES.USER;

    const roles = getRoles();
    return normalizeRole(roles[userId]);
  }

  function roleLevel(role) {
    const levels = {
      user: 0,
      moderator: 1,
      admin: 2,
      superadmin: 3
    };

    return levels[normalizeRole(role)] || 0;
  }

  function hasPermission(userId, permission) {
    const role = getRole(userId);
    const permissions = PERMISSIONS[role] || [];

    return (
      permissions.includes("*") ||
      permissions.includes(permission)
    );
  }

  function canManageRole(actorId, targetRole) {
    const actorRole = getRole(actorId);
    const target = normalizeRole(targetRole);

    if (actorRole === ROLES.SUPERADMIN) {
      return true;
    }

    if (actorRole !== ROLES.ADMIN) {
      return false;
    }

    return roleLevel(target) < roleLevel(ROLES.ADMIN);
  }

  function addAuditAction(data) {
    const actions = load(ACTION_KEY, []);

    const action = {
      id: id("action"),
      actorId: data.actorId || null,
      targetUserId: data.targetUserId || null,
      targetType: data.targetType || null,
      targetId: data.targetId || null,
      action: data.action || "unknown",
      reason: data.reason || "",
      details: data.details || "",
      createdAt: now()
    };

    actions.unshift(action);

    if (actions.length > 2000) {
      actions.length = 2000;
    }

    save(ACTION_KEY, actions);

    emitEvent("action", action);

    return action;
  }

  /* =========================================================
     ROLES
     ========================================================= */

  function setRole(actorId, userId, role) {
    if (!actorId || !userId) {
      return {
        success: false,
        error: "Actor and user ID are required."
      };
    }

    role = normalizeRole(role);

    if (!hasPermission(actorId, "roles.manage")) {
      return {
        success: false,
        error: "Permission denied."
      };
    }

    if (!canManageRole(actorId, role)) {
      return {
        success: false,
        error: "You cannot assign this role."
      };
    }

    const actorRole = getRole(actorId);
    const currentTargetRole = getRole(userId);

    if (
      actorRole !== ROLES.SUPERADMIN &&
      roleLevel(currentTargetRole) >= roleLevel(ROLES.ADMIN)
    ) {
      return {
        success: false,
        error: "This account cannot be managed by the current administrator."
      };
    }

    setRoleInternal(userId, role);

    addAuditAction({
      actorId,
      targetUserId: userId,
      action: "role_changed",
      reason: "Administrative role update",
      details: `${currentTargetRole} → ${role}`
    });

    emitEvent("roleChanged", {
      userId,
      role
    });

    return {
      success: true,
      userId,
      role
    };
  }

  function getPermissions(roleOrUserId) {
    let role = roleOrUserId;

    if (
      roleOrUserId &&
      !Object.values(ROLES).includes(roleOrUserId)
    ) {
      role = getRole(roleOrUserId);
    }

    role = normalizeRole(role);

    return [...(PERMISSIONS[role] || [])];
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  function createReport(
    reporterId,
    targetType,
    targetId,
    reason,
    details
  ) {
    if (!targetType || !targetId || !reason) {
      return {
        success: false,
        error: "Report target and reason are required."
      };
    }

    const reports = load(REPORT_KEY, []);

    const report = {
      id: id("report"),
      reporterId: reporterId || null,
      targetType,
      targetId,
      reason,
      details: details || "",
      status: REPORT_STATUSES.PENDING,
      assignedTo: null,
      resolution: null,
      createdAt: now(),
      updatedAt: now()
    };

    reports.unshift(report);

    save(REPORT_KEY, reports);

    emitEvent("reportCreated", report);

    return {
      success: true,
      report
    };
  }

  function getReport(reportId) {
    const reports = load(REPORT_KEY, []);
    return reports.find((report) => report.id === reportId) || null;
  }

  function getReports(filters = {}, viewerId = null) {
    if (
      viewerId &&
      !hasPermission(viewerId, "reports.view")
    ) {
      return [];
    }

    let reports = load(REPORT_KEY, []);

    if (filters.status) {
      reports = reports.filter(
        (report) => report.status === filters.status
      );
    }

    if (filters.targetType) {
      reports = reports.filter(
        (report) => report.targetType === filters.targetType
      );
    }

    if (filters.assignedTo) {
      reports = reports.filter(
        (report) => report.assignedTo === filters.assignedTo
      );
    }

    if (filters.reporterId) {
      reports = reports.filter(
        (report) => report.reporterId === filters.reporterId
      );
    }

    if (filters.targetId) {
      reports = reports.filter(
        (report) => report.targetId === filters.targetId
      );
    }

    return reports;
  }

  function assignReport(actorId, reportId, moderatorId) {
    if (!hasPermission(actorId, "reports.manage")) {
      return {
        success: false,
        error: "Permission denied."
      };
    }

    const reports = load(REPORT_KEY, []);
    const report = reports.find((item) => item.id === reportId);

    if (!report) {
      return {
        success: false,
        error: "Report not found."
      };
    }

    report.assignedTo = moderatorId || actorId;
    report.status = REPORT_STATUSES.ASSIGNED;
    report.updatedAt = now();

    save(REPORT_KEY, reports);

    addAuditAction({
      actorId,
      targetType: "report",
      targetId: reportId,
      action: "report_assigned",
      details: `Assigned to ${report.assignedTo}`
    });

    return {
      success: true,
      report
    };
  }

  function resolveReport(actorId, reportId, resolution) {
    if (!hasPermission(actorId, "reports.manage")) {
      return {
        success: false,
        error: "Permission denied."
      };
    }

    const reports = load(REPORT_KEY, []);
    const report = reports.find((item) => item.id === reportId);

    if (!report) {
      return {
        success: false,
        error: "Report not found."
      };
    }

    report.status = REPORT_STATUSES.RESOLVED;
    report.resolution = resolution || "Resolved";
    report.updatedAt = now();

    save(REPORT_KEY, reports);

    addAuditAction({
      actorId,
      targetType: "report",
      targetId: reportId,
      action: "report_resolved",
      details: report.resolution
    });

    return {
      success: true,
      report
    };
  }

  function dismissReport(actorId, reportId, reason) {
    if (!hasPermission(actorId, "reports.manage")) {
      return {
        success: false,
        error: "Permission denied."
      };
    }

    const reports = load(REPORT_KEY, []);
    const report = reports.find((item) => item.id === reportId);

    if (!report) {
      return {
        success: false,
        error: "Report not found."
      };
    }

    report.status = REPORT_STATUSES.DISMISSED;
    report.resolution = reason || "Report dismissed";
    report.updatedAt = now();

    save(REPORT_KEY, reports);

    addAuditAction({
      actorId,
      targetType: "report",
      targetId: reportId,
      action: "report_dismissed",
      details: report.resolution
    });
