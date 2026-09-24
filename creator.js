/* =========================================================
   VORTEX — Creator Engine
   File: creator.js
   Purpose: Creator profiles, analytics & rewards
   ========================================================= */

(function () {
  "use strict";

  const CREATOR_KEY = "vortex_creators";

  /* ---------------------------------------------------------
     Storage
  --------------------------------------------------------- */

  function getCreators() {
    try {
      return JSON.parse(
        localStorage.getItem(CREATOR_KEY)
      ) || {};
    } catch {
      return {};
    }
  }

  function saveCreators(creators) {
    localStorage.setItem(
      CREATOR_KEY,
      JSON.stringify(creators)
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

  function creatorId() {
    return currentUser()?.id || null;
  }

  function createCreatorProfile(userId) {
    return {
      userId,

      isCreator: true,
      verified: false,

      category: "General",
      description: "",

      followers: 0,
      following: 0,

      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,

      lifetimeRewards: 0,

      monetization: {
        enabled: false,
        eligible: false
      },

      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /* ---------------------------------------------------------
     Get creator profile
  --------------------------------------------------------- */

  function getCreator(userId) {
    const id = userId || creatorId();

    if (!id) {
      return null;
    }

    const creators = getCreators();

    if (!creators[id]) {
      creators[id] = createCreatorProfile(id);
      saveCreators(creators);
    }

    return creators[id];
  }

  /* ---------------------------------------------------------
     Become a creator
  --------------------------------------------------------- */

  function enableCreatorMode(options = {}) {
    const user = currentUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in."
      };
    }

    const creators = getCreators();

    const creator =
      creators[user.id] ||
      createCreatorProfile(user.id);

    creator.isCreator = true;

    if (options.category) {
      creator.category = String(
        options.category
      ).slice(0, 50);
    }

    if (options.description) {
      creator.description = String(
        options.description
      ).slice(0, 500);
