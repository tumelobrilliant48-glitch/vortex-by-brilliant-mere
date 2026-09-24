/* =========================================================
   VORTEX — Premium Engine
   File: premium.js
   Purpose: Premium memberships & feature access
   ========================================================= */

(function () {
  "use strict";

  const PREMIUM_KEY = "vortex_premium";

  /* ---------------------------------------------------------
     Premium plans
  --------------------------------------------------------- */

  const PLANS = {
    free: {
      id: "free",
      name: "VORTEX Free",
      description: "The core VORTEX experience.",
      features: [
        "Social feed",
        "Profiles",
        "Messaging",
        "Stories",
        "Explore"
      ]
    },

    plus: {
      id: "plus",
      name: "VORTEX Plus",
      description: "More personalization and premium tools.",
      features: [
        "Everything in Free",
        "Premium themes",
        "Advanced profile customization",
        "Extra creator tools",
        "Priority feature access"
      ]
    },

    pro: {
      id: "pro",
      name: "VORTEX Pro",
      description: "Advanced tools for creators and power users.",
      features: [
        "Everything in Plus",
        "Advanced creator analytics",
        "Premium creator tools",
        "Enhanced customization",
        "Early access to selected features"
      ]
    }
  };

  /* ---------------------------------------------------------
     Storage
  --------------------------------------------------------- */

  function getAllMemberships() {
    try {
      return JSON.parse(
        localStorage.getItem(PREMIUM_KEY)
      ) || {};
    } catch {
      return {};
    }
  }

  function saveAllMemberships(memberships) {
    localStorage.setItem(
      PREMIUM_KEY,
      JSON.stringify(memberships)
    );
  }

  /* ---------------------------------------------------------
     Current user
  --------------------------------------------------------- */

  function getCurrentUser() {
    if (
      window.VortexAuth &&
      typeof window.VortexAuth.currentUser === "function"
    ) {
      return window.VortexAuth.currentUser();
    }

    return null;
  }

  /* ---------------------------------------------------------
     Membership
  --------------------------------------------------------- */

  function getMembership(userId) {
    const user = getCurrentUser();
    const id = userId || user?.id;

    if (!id) {
      return {
        userId: null,
        plan: "free",
        active: false,
        status: "guest"
      };
    }

    const memberships = getAllMemberships();

    if (!memberships[id]) {
      memberships[id] = {
        userId: id,
        plan: "free",
        active: true,
        status: "free",
        startedAt: Date.now(),
        expiresAt: null
      };

      saveAllMemberships(memberships);
    }

    return memberships[id];
  }

  /* ---------------------------------------------------------
     Plans
  --------------------------------------------------------- */

  function getPlans() {
    return Object.values(PLANS);
  }

  function getPlan(planId) {
    return PLANS[planId] || null;
  }

  /* ---------------------------------------------------------
     Activate premium
  --------------------------------------------------------- */

  function activate(planId = "plus", durationDays = 30) {
    const user = getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in."
      };
    }

    if (!PLANS[planId] || planId === "
