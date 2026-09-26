/* =========================================================
   VORTEX NOTIFICATIONS ENGINE
   FILE 19 — notifications.js
   ========================================================= */

"use strict";

const VortexNotifications = {

  maxNotifications: 500,
  listeners: {},

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    console.log("🔔 VORTEX Notifications ready.");

    this.ensureStorage();

  },


  /* =======================================================
     CURRENT USER
     ======================================================= */

  getUserId() {

    return window.VortexAuth?.getUserId?.() || null;

  },


  /* =======================================================
     STORAGE
     ======================================================= */

  ensureStorage() {

    if (
      !window.VortexDB ||
      typeof VortexDB.localFindMany !== "function"
    ) {

      console.warn(
        "VORTEX Notifications: database engine not loaded yet."
      );

    }

  },


  /* =======================================================
     ID
     ======================================================= */

  id() {

    if (
      window.VortexDB &&
      typeof VortexDB.id === "function"
    ) {

      return VortexDB.id("notification");

    }

    return (
      "
