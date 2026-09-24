/* =========================================================
   VORTEX — PRIVACY & VISIBILITY SYSTEM
   File: privacy.js

   Handles:
   - Profile privacy
   - Post visibility
   - Messaging privacy
   - Followers/following visibility
   - Search visibility
   - Activity visibility
   - Online status
   - Block checks
   ========================================================= */

(function () {
  "use strict";

  const PRIVACY_KEY = "vortex_privacy_settings";
  const DATA_KEY = "vortex_privacy_data_requests";

  const listeners = new Set();

  const VISIBILITY = {
    PUBLIC: "public",
    FOLLOWERS: "followers",
    FRIENDS: "friends",
    ONLY_ME: "only_me"
  };

  const DEFAULTS = {
    profileVisibility: VISIBILITY.PUBLIC,

    postVisibility: VISIBILITY.PUBLIC,

    storyVisibility: VISIBILITY.FOLLOWERS,

    followersVisibility: VISIBILITY.PUBLIC,

    followingVisibility: VISIBILITY.PUBLIC,

    friendListVisibility: VISIBILITY.FRIENDS,

    messaging: "everyone",

    messageRequests: true,

    comments: "everyone",

    mentions: "everyone",

    tagging: "everyone",

    searchDiscovery: true,

    searchByEmail: false,

    searchByPhone: false,

    showOnlineStatus: true,

    showLastActive: true,

    showActivityStatus: true,

    personalizedRecommendations: true,

    personalizedAds: false,

    readReceipts: true,

    typingIndicator: true,

    profileIndexing: true,

    allowProfileSharing: true
  };

  const MESSAGING = {
    EVERYONE: "everyone",
    FOLLOWERS: "followers",
    FRIENDS: "friends",
    NOBODY: "nobody"
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(
        "VORTEX Privacy: storage read failed."
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
        "VORTEX Privacy: storage write failed."
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
          "VORTEX Privacy listener error:",
          error
        );
      }
    });
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent(
          "vortex:privacy:" + name,
          {
            detail
          }
        )
      );
    } catch (_) {}
  }

  /* =========================================================
     USER SETTINGS
     ========================================================= */

  function getAll() {
    return load(PRIVACY_KEY, {});
  }

  function get(userId) {
    if (!userId) {
      return {
        ...DEFAULTS
      };
    }

    const all = getAll();

    return {
      ...DEFAULTS,
      ...(all[userId] || {})
    };
  }

  function set(userId, updates) {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required."
      };
    }

    if (
      !updates ||
      typeof updates !== "object"
    ) {
      return {
        success: false,
        error: "Privacy settings are required."
      };
    }

    const all = getAll();

    all[userId] = {
      ...get(userId),
      ...updates,
      updatedAt: now()
    };

    save(PRIVACY_KEY, all);

    emit("updated", {
      userId,
      settings: all[userId]
    });

    return {
      success: true,
      settings: all[userId]
    };
  }

  function update(userId, key, value) {
    return set(userId, {
      [key]: value
    });
  }

  function reset(userId) {
    if (!userId) return false;

    const all = getAll();

    all[userId] = {
      ...DEFAULTS,
      updatedAt: now()
    };

    save(PRIVACY_KEY, all);

    emit("reset", {
      userId
    });

    return true;
  }

  /* =========================================================
     BLOCK CHECK
     ========================================================= */

  function isBlocked(
    ownerId,
    viewerId
  ) {
    if (!ownerId || !viewerId) {
      return false;
    }

    if (ownerId === viewerId) {
      return false;
    }

    try {
      if (
        window.VortexFriends &&
        typeof window.VortexFriends.isBlocked ===
          "function"
      ) {
        return Boolean(
          window.VortexFriends.isBlocked(
            ownerId,
            viewerId
          )
        );
      }
    } catch (_) {}

    return false;
  }

  /* =========================================================
     RELATIONSHIP HELPERS
     ========================================================= */

  function areFriends(
    ownerId,
    viewerId
  ) {
    if (!ownerId || !viewerId) {
      return false;
    }

    if (ownerId === viewerId) {
      return true;
    }

    try {
      if (
        window.VortexFriends &&
        typeof window.VortexFriends.areFriends ===
          "function"
      ) {
        return Boolean(
          window.VortexFriends.areFriends(
            ownerId,
            viewerId
          )
        );
      }
    } catch (_) {}

    return false;
  }

  function isFollowing(
    ownerId,
    viewerId
  ) {
    if (!ownerId || !viewerId) {
      return false;
    }

    if (ownerId === viewerId) {
      return true;
    }

    try {
      if (
        window.VortexFriends &&
        typeof window.VortexFriends.isFollowing ===
          "function"
      ) {
        return Boolean(
          window.VortexFriends.isFollowing(
            viewerId,
            ownerId
          )
        );
      }
    } catch (_) {}

    return false;
  }

  /* =========================================================
     VISIBILITY ENGINE
     ========================================================= */

  function canView(
    ownerId,
    viewerId,
    visibility
  ) {
    if (!ownerId) {
      return false;
    }

    if (ownerId === viewerId) {
      return true;
    }

    if (
      viewerId &&
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    switch (visibility) {
      case VISIBILITY.PUBLIC:
        return true;

      case VISIBILITY.FOLLOWERS:
        return Boolean(
          viewerId &&
          isFollowing(ownerId, viewerId)
        );

      case VISIBILITY.FRIENDS:
        return Boolean(
          viewerId &&
          areFriends(ownerId, viewerId)
        );

      case VISIBILITY.ONLY_ME:
        return false;

      default:
        return false;
    }
  }

  /* =========================================================
     PROFILE
     ========================================================= */

  function canViewProfile(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    const settings = get(ownerId);

    return canView(
      ownerId,
      viewerId,
      settings.profileVisibility
    );
  }

  function canDiscoverProfile(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      viewerId &&
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    const settings = get(ownerId);

    return (
      settings.searchDiscovery === true &&
      settings.profileIndexing === true &&
      canViewProfile(
        ownerId,
        viewerId
      )
    );
  }

  /* =========================================================
     POSTS
     ========================================================= */

  function canViewPost(
    ownerId,
    viewerId,
    visibility = null
  ) {
    if (!ownerId) return false;

    const settings = get(ownerId);

    return canView(
      ownerId,
      viewerId,
      visibility ||
        settings.postVisibility
    );
  }

  /* =========================================================
     STORIES
     ========================================================= */

  function canViewStory(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    const settings = get(ownerId);

    return canView(
      ownerId,
      viewerId,
      settings.storyVisibility
    );
  }

  /* =========================================================
     FOLLOWERS / FOLLOWING
     ========================================================= */

  function canViewFollowers(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    const settings = get(ownerId);

    return canView(
      ownerId,
      viewerId,
      settings.followersVisibility
    );
  }

  function canViewFollowing(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    const settings = get(ownerId);

    return canView(
      ownerId,
      viewerId,
      settings.followingVisibility
    );
  }

  function canViewFriends(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    const settings = get(ownerId);

    return canView(
      ownerId,
      viewerId,
      settings.friendListVisibility
    );
  }

  /* =========================================================
     MESSAGING
     ========================================================= */

  function canMessage(
    ownerId,
    viewerId
  ) {
    if (!ownerId || !viewerId) {
      return false;
    }

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    const settings = get(ownerId);

    switch (settings.messaging) {
      case MESSAGING.EVERYONE:
        return true;

      case MESSAGING.FOLLOWERS:
        return isFollowing(
          ownerId,
          viewerId
        );

      case MESSAGING.FRIENDS:
        return areFriends(
          ownerId,
          viewerId
        );

      case MESSAGING.NOBODY:
        return false;

      default:
        return false;
    }
  }

  function canReceiveMessageRequest(
    ownerId,
    viewerId
  ) {
    if (
      !canMessage(
        ownerId,
        viewerId
      )
    ) {
      return false;
    }

    return get(ownerId)
      .messageRequests === true;
  }

  /* =========================================================
     COMMENTS
     ========================================================= */

  function canComment(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    const setting =
      get(ownerId).comments;

    switch (setting) {
      case MESSAGING.EVERYONE:
        return true;

      case MESSAGING.FOLLOWERS:
        return isFollowing(
          ownerId,
          viewerId
        );

      case MESSAGING.FRIENDS:
        return areFriends(
          ownerId,
          viewerId
        );

      case MESSAGING.NOBODY:
        return false;

      default:
        return false;
    }
  }

  /* =========================================================
     MENTIONS
     ========================================================= */

  function canMention(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    const setting =
      get(ownerId).mentions;

    switch (setting) {
      case MESSAGING.EVERYONE:
        return true;

      case MESSAGING.FOLLOWERS:
        return isFollowing(
          ownerId,
          viewerId
        );

      case MESSAGING.FRIENDS:
        return areFriends(
          ownerId,
          viewerId
        );

      case MESSAGING.NOBODY:
        return false;

      default:
        return false;
    }
  }

  /* =========================================================
     TAGGING
     ========================================================= */

  function canTag(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    const setting =
      get(ownerId).tagging;

    switch (setting) {
      case MESSAGING.EVERYONE:
        return true;

      case MESSAGING.FOLLOWERS:
        return isFollowing(
          ownerId,
          viewerId
        );

      case MESSAGING.FRIENDS:
        return areFriends(
          ownerId,
          viewerId
        );

      case MESSAGING.NOBODY:
        return false;

      default:
        return false;
    }
  }

  /* =========================================================
     ONLINE / ACTIVITY
     ========================================================= */

  function canViewOnlineStatus(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    return (
      get(ownerId)
        .showOnlineStatus === true
    );
  }

  function canViewLastActive(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    return (
      get(ownerId)
        .showLastActive === true
    );
  }

  function canViewActivity(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    return (
      get(ownerId)
        .showActivityStatus === true
    );
  }

  /* =========================================================
     SEARCH
     ========================================================= */

  function canSearchByEmail(
    ownerId
  ) {
    return (
      get(ownerId)
        .searchByEmail === true
    );
  }

  function canSearchByPhone(
    ownerId
  ) {
    return (
      get(ownerId)
        .searchByPhone === true
    );
  }

  function appearsInSearch(
    ownerId,
    viewerId
  ) {
    return canDiscoverProfile(
      ownerId,
      viewerId
    );
  }

  /* =========================================================
     PERSONALIZATION
     ========================================================= */

  function allowsRecommendations(
    userId
  ) {
    return (
      get(userId)
        .personalizedRecommendations ===
      true
    );
  }

  function allowsPersonalizedAds(
    userId
  ) {
    return (
      get(userId)
        .personalizedAds === true
    );
  }

  /* =========================================================
     SHARING
     ========================================================= */

  function canShareProfile(
    ownerId,
    viewerId
  ) {
    if (!ownerId) return false;

    if (ownerId === viewerId) {
      return true;
    }

    if (
      isBlocked(ownerId, viewerId)
    ) {
      return false;
    }

    return (
      get(ownerId)
        .allowProfileSharing === true
    );
  }

  /* =========================================================
     READ RECEIPTS / TYPING
     ========================================================= */

  function allowsReadReceipts(
    userId
  ) {
    return (
      get(userId)
        .readReceipts === true
    );
  }

  function allowsTypingIndicator(
    userId
  ) {
    return (
      get(userId)
        .typingIndicator === true
    );
  }

  /* =========================================================
     PRIVACY SUMMARY
     ========================================================= */

  function getSummary(userId) {
    const settings = get(userId);

    return {
      profile:
        settings.profileVisibility,

      posts:
        settings.postVisibility,

      stories:
        settings.storyVisibility,

      messaging:
        settings.messaging,

      search:
        settings.searchDiscovery,

      onlineStatus:
        settings.showOnlineStatus,

      lastActive:
        settings.showLastActive,

      comments:
        settings.comments,

      mentions:
        settings.mentions,

      tagging:
        settings.tagging
    };
  }

  /* =========================================================
     DATA REQUESTS
     ========================================================= */

  function createDataRequest(
    userId,
    type
  ) {
    if (!userId || !type) {
      return {
        success: false,
        error:
          "User ID and request type are required."
      };
    }

    const allowed = [
      "export",
      "delete",
      "download"
    ];

    if (!allowed.includes(type)) {
      return {
        success: false,
        error:
          "Invalid data request type."
      };
    }

    const requests =
      load(DATA_KEY, []);

    const request = {
      id: id("data"),
      userId,
      type,
      status: "requested",
      createdAt: now(),
      updatedAt: now()
    };

    requests.unshift(request);

    save(DATA_KEY, requests);

    emit(
      "dataRequest",
      request
    );

    return {
      success: true,
      request
    };
  }

  function getDataRequests(
    userId
  ) {
    const requests =
      load(DATA_KEY, []);

    if (!userId) {
      return requests;
    }

    return requests.filter(
      (request) =>
        request.userId === userId
    );
  }

  /* =========================================================
     COOKIE / STORAGE HELPERS
     ========================================================= */

  function clearLocalPrivacyData(
    userId
  ) {
    if (!userId) return false;

    const all = getAll();

    delete all[userId];

    save(PRIVACY_KEY, all);

    return true;
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function onChange(callback) {
    if (
      typeof callback !==
      "function"
    ) {
      return () => {};
    }

    listeners.add(callback);

    return () => {
      listeners.delete(callback);
    };
  }

  /* =========================================================
     CLEAR
     ========================================================= */

  function clear() {
    localStorage.removeItem(
      PRIVACY_KEY
    );

    localStorage.removeItem(
      DATA_KEY
    );

    notify();

    return true;
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  const api = {
    VISIBILITY,
    MESSAGING,
    DEFAULTS,

    getAll,
    get,
    set,
    update,
    reset,

    canView,
    canViewProfile,
    canDiscoverProfile,

    canViewPost,
    canViewStory,

    canViewFollowers,
    canViewFollowing,
    canViewFriends,

    canMessage,
    canReceiveMessageRequest,

    canComment,
    canMention,
    canTag,

    canViewOnlineStatus,
    canViewLastActive,
    canViewActivity,

    canSearchByEmail,
    canSearchByPhone,
    appearsInSearch,

    allowsRecommendations,
    allowsPersonalizedAds,

    canShareProfile,

    allowsReadReceipts,
    allowsTypingIndicator,

    getSummary,

    createDataRequest,
    getDataRequests,

    clearLocalPrivacyData,

    onChange,
    clear
  };

  window.VortexPrivacy = api;

  console.log(
    "%cVORTEX Privacy loaded",
    "font-weight:bold"
  );
})();
