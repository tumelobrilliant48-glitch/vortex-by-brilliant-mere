/* =========================================================
   VORTEX FRIENDS & CONNECTIONS ENGINE
   File: friends.js

   Handles:
   - Following
   - Followers
   - Friend requests
   - Mutual connections
   - Blocking
   - Relationship status
   - Connection events
   ========================================================= */

(function () {
  "use strict";

  const CONNECTIONS_KEY =
    "vortex_connections";

  const REQUESTS_KEY =
    "vortex_friend_requests";

  const BLOCKS_KEY =
    "vortex_blocked_users";

  const EVENT_NAME =
    "vortex:friends-change";

  /* -------------------------------------------------------
     Storage helpers
     ------------------------------------------------------- */

  function readConnections() {
    try {
      const data = JSON.parse(
        localStorage.getItem(CONNECTIONS_KEY)
      );

      return data && typeof data === "object"
        ? data
        : {};
    } catch (error) {
      return {};
    }
  }

  function saveConnections(data) {
    localStorage.setItem(
      CONNECTIONS_KEY,
      JSON.stringify(data)
    );

    emitChange();
  }

  function readRequests() {
    try {
      const data = JSON.parse(
        localStorage.getItem(REQUESTS_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveRequests(requests) {
    localStorage.setItem(
      REQUESTS_KEY,
      JSON.stringify(requests)
    );

    emitChange();
  }

  function readBlocks() {
    try {
      const data = JSON.parse(
        localStorage.getItem(BLOCKS_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveBlocks(blocks) {
    localStorage.setItem(
      BLOCKS_KEY,
      JSON.stringify(blocks)
    );

    emitChange();
  }

  /* -------------------------------------------------------
     Helpers
     ------------------------------------------------------- */

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function cleanId(id) {
    return String(id || "").trim();
  }

  function emitChange() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          connections: readConnections(),
          requests: readRequests()
        }
      })
    );
  }

  /* -------------------------------------------------------
     User connection record
     ------------------------------------------------------- */

  function ensureUser(userId) {
    const id = cleanId(userId);

    if (!id) {
      return null;
    }

    const connections =
      readConnections();

    if (!connections[id]) {
      connections[id] = {
        followers: [],
        following: [],
        friends: []
      };

      saveConnections(connections);
    }

    return connections[id];
  }

  /* -------------------------------------------------------
     Internal list helper
     ------------------------------------------------------- */

  function addUnique(list, value) {
    if (!list.includes(value)) {
      list.push(value);
    }

    return list;
  }

  function removeValue(list, value) {
    return list.filter(
      item => item !== value
    );
  }

  /* -------------------------------------------------------
     Follow
     ------------------------------------------------------- */

  function follow(userId, targetId) {
    userId = cleanId(userId);
    targetId = cleanId(targetId);

    if (!userId || !targetId) {
      return false;
    }

    if (userId === targetId) {
      return false;
    }

    if (isBlocked(userId, targetId)) {
      return false;
    }

    const connections =
      readConnections();

    if (!connections[userId]) {
      connections[userId] = {
        followers: [],
        following: [],
        friends: []
      };
    }

    if (!connections[targetId]) {
      connections[targetId] = {
        followers: [],
        following: [],
        friends: []
      };
    }

    connections[userId].following =
      addUnique(
        connections[userId].following,
        targetId
      );

    connections[targetId].followers =
      addUnique(
        connections[targetId].followers,
        userId
      );

    /*
      If both users follow each other,
      automatically mark them as friends.
    */
    if (
      connections[targetId].following.includes(
        userId
      )
    ) {
      connections[userId].friends =
        addUnique(
          connections[userId].friends,
          targetId
        );

      connections[targetId].friends =
        addUnique(
          connections[targetId].friends,
          userId
        );
    }

    saveConnections(connections);

    return true;
  }

  /* -------------------------------------------------------
     Unfollow
     ------------------------------------------------------- */

  function unfollow(userId, targetId) {
    userId = cleanId(userId);
    targetId = cleanId(targetId);

    const connections =
      readConnections();

    if (!connections[userId]) {
      return false;
    }

    if (!connections[targetId]) {
      return false;
    }

    connections[userId].following =
      removeValue(
        connections[userId].following,
        targetId
      );

    connections[targetId].followers =
      removeValue(
        connections[targetId].followers,
        userId
      );

    connections[userId].friends =
      removeValue(
        connections[userId].
