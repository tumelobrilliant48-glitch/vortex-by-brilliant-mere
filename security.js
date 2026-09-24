/* =========================================================
   VORTEX — SECURITY SYSTEM
   File: security.js

   Handles:
   - Sessions
   - Devices
   - Rate limiting
   - Security events
   - Suspicious activity
   - Account protection
   - Security logs
   ========================================================= */

(function () {
  "use strict";

  const SESSION_KEY = "vortex_security_sessions";
  const EVENT_KEY = "vortex_security_events";
  const RATE_KEY = "vortex_security_rate_limits";
  const LOCK_KEY = "vortex_security_locks";
  const DEVICE_KEY = "vortex_security_devices";
  const SETTINGS_KEY = "vortex_security_settings";

  const listeners = new Set();

  const DEFAULT_SETTINGS = {
    maxLoginAttempts: 5,
    lockDurationMinutes: 15,
    rateWindowSeconds: 60,
    maxRequestsPerWindow: 30,
    suspiciousLoginDetection: true,
    sessionTimeoutHours: 168,
    maxSessionsPerUser: 5
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("VORTEX Security: storage read failed.");
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      notify();
      return true;
    } catch (error) {
      console.error("VORTEX Security: storage write failed.");
      return false;
    }
  }

  function id(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
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
        console.error(
          "VORTEX Security listener error:",
          error
        );
      }
    });
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("vortex:security:" + name, {
          detail
        })
      );
    } catch (_) {}
  }

  function getSettings() {
    return {
      ...DEFAULT_SETTINGS,
      ...load(SETTINGS_KEY, {})
    };
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

  /* =========================================================
     DEVICE
     ========================================================= */

  function getDeviceId() {
    let deviceId = localStorage.getItem(
      "vortex_device_id"
    );

    if (!deviceId) {
      deviceId = id("device");

      try {
        localStorage.setItem(
          "vortex_device_id",
          deviceId
        );
      } catch (_) {}
    }

    return deviceId;
  }

  function getDeviceInfo() {
    return {
      id: getDeviceId(),
      platform: navigator.platform || "unknown",
      language: navigator.language || "unknown",
      screen: `${window.screen?.width || 0}x${
        window.screen?.height || 0
      }`,
      timezone:
        Intl.DateTimeFormat().resolvedOptions()
          .timeZone || "unknown"
    };
  }

  function registerDevice(userId) {
    if (!userId) return null;

    const devices = load(DEVICE_KEY, {});
    const device = getDeviceInfo();

    if (!devices[userId]) {
      devices[userId] = {};
    }

    devices[userId][device.id] = {
      ...device,
      firstSeen:
        devices[userId][device.id]?.firstSeen ||
        now(),
      lastSeen: now(),
      active: true
    };

    save(DEVICE_KEY, devices);

    return devices[userId][device.id];
  }

  function getDevices(userId) {
    if (!userId) return [];

    const devices = load(DEVICE_KEY, {});

    return Object.values(devices[userId] || {});
  }

  function removeDevice(userId, deviceId) {
    if (!userId || !deviceId) {
      return false;
    }

    const devices = load(DEVICE_KEY, {});

    if (!devices[userId]?.[deviceId]) {
      return false;
    }

    delete devices[userId][deviceId];

    save(DEVICE_KEY, devices);

    recordEvent(
      userId,
      "device_removed",
      {
        deviceId
      }
    );

    return true;
  }

  /* =========================================================
     SESSIONS
     ========================================================= */

  function createSession(userId, metadata = {}) {
    if (!userId) {
      return null;
    }

    const settings = getSettings();
    const sessions = load(SESSION_KEY, {});

    if (!sessions[userId]) {
      sessions[userId] = [];
    }

    const session = {
      id: id("session"),
      userId,
      deviceId: getDeviceId(),
      createdAt: now(),
      lastActive: now(),
      expiresAt: new Date(
        Date.now() +
          settings.sessionTimeoutHours *
            60 *
            60 *
            1000
      ).toISOString(),
      active: true,
      metadata
    };

    sessions[userId].unshift(session);

    if (
      sessions[userId].length >
      settings.maxSessionsPerUser
    ) {
      sessions[userId] =
        sessions[userId].slice(
          0,
          settings.maxSessionsPerUser
        );
    }

    save(SESSION_KEY, sessions);

    registerDevice(userId);

    recordEvent(userId, "session_created", {
      sessionId: session.id,
      deviceId: session.deviceId
    });

    return/* =========================================================
   VORTEX — SECURITY SYSTEM
   File: security.js

   Handles:
   - Sessions
   - Devices
   - Rate limiting
   - Security events
   - Suspicious activity
   - Account protection
   - Security logs
   ========================================================= */

(function () {
  "use strict";

  const SESSION_KEY = "vortex_security_sessions";
  const EVENT_KEY = "vortex_security_events";
  const RATE_KEY = "vortex_security_rate_limits";
  const LOCK_KEY = "vortex_security_locks";
  const DEVICE_KEY = "vortex_security_devices";
  const SETTINGS_KEY = "vortex_security_settings";

  const listeners = new Set();

  const DEFAULT_SETTINGS = {
    maxLoginAttempts: 5,
    lockDurationMinutes: 15,
    rateWindowSeconds: 60,
    maxRequestsPerWindow: 30,
    suspiciousLoginDetection: true,
    sessionTimeoutHours: 168,
    maxSessionsPerUser: 5
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("VORTEX Security: storage read failed.");
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      notify();
      return true;
    } catch (error) {
      console.error("VORTEX Security: storage write failed.");
      return false;
    }
  }

  function id(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
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
        console.error(
          "VORTEX Security listener error:",
          error
        );
      }
    });
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("vortex:security:" + name, {
          detail
        })
      );
    } catch (_) {}
  }

  function getSettings() {
    return {
      ...DEFAULT_SETTINGS,
      ...load(SETTINGS_KEY, {})
    };
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

  /* =========================================================
     DEVICE
     ========================================================= */

  function getDeviceId() {
    let deviceId = localStorage.getItem(
      "vortex_device_id"
    );

    if (!deviceId) {
      deviceId = id("device");

      try {
        localStorage.setItem(
          "vortex_device_id",
          deviceId
        );
      } catch (_) {}
    }

    return deviceId;
  }

  function getDeviceInfo() {
    return {
      id: getDeviceId(),
      platform: navigator.platform || "unknown",
      language: navigator.language || "unknown",
      screen: `${window.screen?.width || 0}x${
        window.screen?.height || 0
      }`,
      timezone:
        Intl.DateTimeFormat().resolvedOptions()
          .timeZone || "unknown"
    };
  }

  function registerDevice(userId) {
    if (!userId) return null;

    const devices = load(DEVICE_KEY, {});
    const device = getDeviceInfo();

    if (!devices[userId]) {
      devices[userId] = {};
    }

    devices[userId][device.id] = {
      ...device,
      firstSeen:
        devices[userId][device.id]?.firstSeen ||
        now(),
      lastSeen: now(),
      active: true
    };

    save(DEVICE_KEY, devices);

    return devices[userId][device.id];
  }

  function getDevices(userId) {
    if (!userId) return [];

    const devices = load(DEVICE_KEY, {});

    return Object.values(devices[userId] || {});
  }

  function removeDevice(userId, deviceId) {
    if (!userId || !deviceId) {
      return false;
    }

    const devices = load(DEVICE_KEY, {});

    if (!devices[userId]?.[deviceId]) {
      return false;
    }

    delete devices[userId][deviceId];

    save(DEVICE_KEY, devices);

    recordEvent(
      userId,
      "device_removed",
      {
        deviceId
      }
    );

    return true;
  }

  /* =========================================================
     SESSIONS
     ========================================================= */

  function createSession(userId, metadata = {}) {
    if (!userId) {
      return null;
    }

    const settings = getSettings();
    const sessions = load(SESSION_KEY, {});

    if (!sessions[userId]) {
      sessions[userId] = [];
    }

    const session = {
      id: id("session"),
      userId,
      deviceId: getDeviceId(),
      createdAt: now(),
      lastActive: now(),
      expiresAt: new Date(
        Date.now() +
          settings.sessionTimeoutHours *
            60 *
            60 *
            1000
      ).toISOString(),
      active: true,
      metadata
    };

    sessions[userId].unshift(session);

    if (
      sessions[userId].length >
      settings.maxSessionsPerUser
    ) {
      sessions[userId] =
        sessions[userId].slice(
          0,
          settings.maxSessionsPerUser
        );
    }

    save(SESSION_KEY, sessions);

    registerDevice(userId);

    recordEvent(userId, "session_created", {
      sessionId: session.id,
      deviceId: session.deviceId
    });

    return
