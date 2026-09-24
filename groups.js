/* =========================================================
   VORTEX GROUPS ENGINE
   File: groups.js

   Handles:
   - Public/private groups
   - Group creation
   - Joining/leaving
   - Members
   - Owners/moderators
   - Group posts
   - Discovery
   ========================================================= */

(function () {
  "use strict";

  const GROUPS_KEY = "vortex_groups";
  const POSTS_KEY = "vortex_group_posts";

  const EVENT_NAME = "vortex:groups-change";

  /* -------------------------------------------------------
     Storage
     ------------------------------------------------------- */

  function readGroups() {
    try {
      const data = JSON.parse(
        localStorage.getItem(GROUPS_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveGroups(groups) {
    localStorage.setItem(
      GROUPS_KEY,
      JSON.stringify(groups)
    );

    emitChange();
  }

  function readPosts() {
    try {
      const data = JSON.parse(
        localStorage.getItem(POSTS_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function savePosts(posts) {
    localStorage.setItem(
      POSTS_KEY,
      JSON.stringify(posts)
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

  function clean(value) {
    return String(value || "").trim();
  }

  function normalize(value) {
    return clean(value).toLowerCase();
  }

  function emitChange() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          groups: readGroups()
        }
      })
    );
  }

  /* -------------------------------------------------------
     Create group
     ------------------------------------------------------- */

  function createGroup(data = {}) {
    const ownerId = clean(data.ownerId);

    if (!ownerId) {
      return null;
    }

    const name = clean(data.name);

    if (!name) {
      return null;
    }

    const group = {
      id:
        data.id ||
        generateId("group"),

      name,

      description:
        clean(data.description),

      category:
        clean(data.category) ||
        "General",

      privacy:
        data.privacy === "private"
          ? "private"
          : "public",

      cover:
        data.cover || null,

      avatar:
        data.avatar || null,

      ownerId,

      moderators: [],
