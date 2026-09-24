/* =========================================================
   VORTEX — VERIFICATION SYSTEM
   File: verification.js

   Handles:
   - Account verification
   - Creator verification
   - Organization verification
   - Verification requests
   - Approval / rejection
   - Verification badges
   ========================================================= */

(function () {
  "use strict";

  const VERIFICATION_KEY =
    "vortex_verification";

  const REQUEST_KEY =
    "vortex_verification_requests";

  const HISTORY_KEY =
    "vortex_verification_history";

  const listeners = new Set();

  const TYPES = {
    PERSONAL: "personal",
    CREATOR: "creator",
    ORGANIZATION: "organization"
  };

  const STATUS = {
    NONE: "none",
    PENDING: "pending",
    VERIFIED: "verified",
    REJECTED: "rejected",
    REVOKED: "revoked"
  };

  const BADGES = {
    PERSONAL: "verified",
    CREATOR: "creator_verified",
    ORGANIZATION: "organization_verified"
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(
        "VORTEX Verification: storage read failed."
      );
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      notify();

      return true;
    } catch (error) {
      console.error(
        "VORTEX Verification: storage write failed."
      );

      return false;
    }
  }

  function id(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 9)
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
          "VORTEX Verification listener error:",
          error
        );
      }
    });
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent(
          "vortex:verification:" + name,
          {
            detail
          }
        )
      );
    } catch (_) {}
  }

  /* =========================================================
     USER VERIFICATION RECORD
     ========================================================= */

  function getAll() {
    return load(VERIFICATION_KEY, {});
  }

  function get(userId) {
    if (!userId) return null;

    const records = getAll();

    return records[userId] || {
      userId,
      personal: {
        status: STATUS.NONE,
        badge: null,
        verifiedAt: null
      },
      creator: {
        status: STATUS.NONE,
        badge: null,
        verifiedAt: null
      },
      organization: {
        status: STATUS.NONE,
        badge: null,
        verifiedAt: null
      }
    };
  }

  function ensureUser(userId) {
    if (!userId) return null;

    const records = getAll();

    if (!records[userId]) {
      records[userId] = {
        userId,

        personal: {
          status: STATUS.NONE,
          badge: null,
          verifiedAt: null
        },

        creator: {
          status: STATUS.NONE,
          badge: null,
          verifiedAt: null
        },

        organization: {
          status: STATUS.NONE,
          badge: null,
          verifiedAt: null
        },

        createdAt: now(),
        updatedAt: now()
      };

      save(VERIFICATION_KEY, records);
    }

    return records[userId];
  }

  /* =========================================================
     STATUS
     ========================================================= */

  function getStatus(
    userId,
    type = TYPES
