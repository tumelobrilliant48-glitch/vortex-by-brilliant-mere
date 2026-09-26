/* =========================================
   VORTEX SOCIAL MEDIA
   User.js
   ========================================= */

"use strict";

const VortexUser = (() => {

  const VERSION = "1.0.0";
  const STORAGE_KEY = "vortex_social_users";
  const CURRENT_USER_KEY = "vortex_current_user";

  const state = {
    initialized: false,
    currentUserId: null
  };

  const users = new Map();

  const listeners = new Map();

  /* =========================================
     EVENTS
     ========================================= */

  function on(event, callback) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(callback);

    return () => {
      listeners.get(event)?.delete(callback);
    };
  }

  function emit(event, data = {}) {
    listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error("VortexUser event error:", error);
      }
    });

    window.dispatchEvent(
      new CustomEvent(`vortex:user:${event}`, {
        detail: data
      })
    );
  }

  /* =========================================
     HELPERS
     ========================================= */

  function id(prefix = "user") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function clean(value, fallback = "") {
    if (value === null || value === undefined) {
      return fallback;
    }

    return String(value).trim();
  }

  function normalizeUsername(username) {
    return clean(username)
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 30);
  }

  function escapeHTML(value) {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getUserId() {
    return (
      state.currentUserId ||
      window.VortexAuth?.getUserId?.() ||
      window.VortexFriends?.getUserId?.() ||
      localStorage.getItem(CURRENT_USER_KEY) ||
      null
    );
  }

  /* =========================================
     DEFAULT USER
     ========================================= */

  function createDefaultUser(data = {}) {

    const firstName = clean(
      data.firstName ||
      data.name ||
      "VORTEX"
    );

    const username =
      normalizeUsername(
        data.username ||
        `${firstName}_${Math.floor(Math.random() * 9999)}`
      );

    return {
      id: data.id || id(),

      username,

      name: clean(data.name, firstName),

      firstName,

      lastName: clean(data.lastName),

      email: clean(data.email),

      phone: clean(data.phone),

      avatar: clean(data.avatar),

      cover: clean(data.cover),

      bio: clean(data.bio),

      website: clean(data.website),

      location: clean(data.location),

      birthday: clean(data.birthday),

      gender: clean(data.gender),

      verified: Boolean(data.verified),

      role: data.role || "user",

      status: data.status || "online",

      online: data.online !== false,

      createdAt: data.createdAt || now(),

      updatedAt: now(),

      lastSeen: now(),

      stats: {
        posts: Number(data.stats?.posts || 0),
        followers: Number(data.stats?.followers || 0),
        following: Number(data.stats?.following || 0),
        friends: Number(data.stats?.friends || 0),
        likes: Number(data.stats?.likes || 0),
        views: Number(data.stats?.views || 0),
        points: Number(data.stats?.points || 0)
      },

      privacy: {
        profile:
          data.privacy?.profile ||
          "public",

        messages:
          data.privacy?.messages ||
          "everyone",

        followers:
          data.privacy?.followers ||
          "everyone",

        posts:
          data.privacy?.posts ||
          "public",

        showOnline:
          data.privacy?.showOnline !== false,

        showEmail:
          Boolean(data.privacy?.showEmail),

        showPhone:
          Boolean(data.privacy?.showPhone)
      },

      badges: Array.isArray(data.badges)
        ? data.badges
        : [],

      interests: Array.isArray(data.interests)
        ? data.interests
        : [],

      links: Array.isArray(data.links)
        ? data.links
        : [],

      pinnedPosts: Array.isArray(data.pinnedPosts)
        ? data.pinnedPosts
        : [],

      settings: {
        theme:
          data.settings?.theme ||
          "neon",

        language:
          data.settings?.language ||
          "en",

        notifications:
          data.settings?.notifications !== false
      }
    };
  }

  /* =========================================
     STORAGE
     ========================================= */

  function save() {

    try {

      const data = Array.from(users.values());

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      if (state.currentUserId) {
        localStorage.setItem(
          CURRENT_USER_KEY,
          state.currentUserId
        );
      }

    } catch (error) {

      console.error(
        "VortexUser save error:",
        error
      );

    }
  }

  function load() {

    try {

      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (raw) {

        const data = JSON.parse(raw);

        if (Array.isArray(data)) {

          data.forEach(user => {

            const normalized =
              createDefaultUser(user);

            users.set(
              normalized.id,
              normalized
            );

          });

        }

      }

      state.currentUserId =
        localStorage.getItem(
          CURRENT_USER_KEY
        );

    } catch (error) {

      console.error(
        "VortexUser load error:",
        error
      );

    }
  }

  /* =========================================
     INIT
     ========================================= */

  function init() {

    if (state.initialized) {
      return;
    }

    load();

    state.initialized = true;

    emit("initialized", {
      count: users.size
    });

    return api;
  }

  /* =========================================
     CREATE USER
     ========================================= */

  function create(data = {}) {

    init();

    let username =
      normalizeUsername(
        data.username ||
        `${clean(data.name, "user")}_${Math.floor(Math.random() * 9999)}`
      );

    let original = username;
    let counter = 1;

    while (getByUsername(username)) {
      username =
        `${original}${counter++}`;
    }

    const user = createDefaultUser({
      ...data,
      username
    });

    users.set(user.id, user);

    save();

    emit("created", {
      user: clone(user)
    });

    return clone(user);
  }

  /* =========================================
     GET USER
     ========================================= */

  function get(id) {

    init();

    if (!id) {
      return null;
    }

    const user = users.get(id);

    return user
      ? clone(user)
      : null;
  }

  function getCurrent() {

    const currentId = getUserId();

    return currentId
      ? get(currentId)
      : null;
  }

  function getByUsername(username) {

    init();

    const normalized =
      normalizeUsername(username);

    for (const user of users.values()) {

      if (
        normalizeUsername(user.username) ===
        normalized
      ) {
        return clone(user);
      }

    }

    return null;
  }

  function getByEmail(email) {

    init();

    const target =
      clean(email).toLowerCase();

    if (!target) {
      return null;
    }

    for (const user of users.values()) {

      if (
        clean(user.email).toLowerCase() ===
        target
      ) {
        return clone(user);
      }

    }

    return null;
  }

  function getByPhone(phone) {

    init();

    const target =
      clean(phone).replace(/\s/g, "");

    if (!target) {
      return null;
    }

    for (const user of users.values()) {

      if (
        clean(user.phone)
          .replace(/\s/g, "") === target
      ) {
        return clone(user);
      }

    }

    return null;
  }

  function getAll() {

    init();

    return Array.from(users.values())
      .map(clone);
  }

  /* =========================================
     CURRENT USER
     ========================================= */

  function setCurrentUser(userId) {

    init();

    if (
      userId &&
      users.has(userId)
    ) {

      state.currentUserId = userId;

      localStorage.setItem(
        CURRENT_USER_KEY,
        userId
      );

      update(userId, {
        online: true,
        status: "online",
        lastSeen: now()
      });

      emit("login", {
        user: get(userId)
      });

      return true;
    }

    return false;
  }

  function clearCurrentUser() {

    const oldUser =
      getCurrent();

    if (oldUser) {

      update(oldUser.id, {
        online: false,
        status: "offline",
        lastSeen: now()
      });

    }

    state.currentUserId = null;

    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    emit("logout", {
      user: oldUser
    });
  }

  /* =========================================
     UPDATE
     ========================================= */

  function update(userId, changes = {}) {

    init();

    const user = users.get(userId);

    if (!user) {
      return null;
    }

    const protectedFields = [
      "id",
      "createdAt"
    ];

    Object.keys(changes).forEach(key => {

      if (
        !protectedFields.includes(key) &&
        changes[key] !== undefined
      ) {

        if (
          typeof changes[key] === "object" &&
          changes[key] !== null &&
          !Array.isArray(changes[key])
        ) {

          user[key] = {
            ...(user[key] || {}),
            ...changes[key]
          };

        } else {

          user[key] = changes[key];

        }

      }

    });

    user.updatedAt = now();

    users.set(userId, user);

    save();

    emit("updated", {
      user: clone(user),
      changes: clone(changes)
    });

    return clone(user);
  }

  function updateProfile(userId, profile = {}) {

    const allowed = [
      "name",
      "firstName",
      "lastName",
      "bio",
      "website",
      "location",
      "birthday",
      "gender",
      "avatar",
      "cover",
      "interests",
      "links"
    ];

    const changes = {};

    allowed.forEach(key => {

      if (profile[key] !== undefined) {
        changes[key] = profile[key];
      }

    });

    return update(userId, changes);
  }

  /* =========================================
     AVATAR
     ========================================= */

  async function setAvatar(userId, file) {

    if (!file) {
      return null;
    }

    let avatar = "";

    if (
      window.VortexMedia?.upload
    ) {

      try {

        const result =
          await window.VortexMedia.upload(
            file,
            {
              type: "avatar",
              userId
            }
          );

        avatar =
          result?.url ||
          result?.src ||
          result?.data?.url ||
          "";

      } catch (error) {

        console.warn(
          "VortexMedia avatar upload failed:",
          error
        );

      }

    }

    if (!avatar && file instanceof Blob) {

      avatar =
        URL.createObjectURL(file);

    }

    if (!avatar) {
      return null;
    }

    return update(
      userId,
      { avatar }
    );
  }

  /* =========================================
     COVER IMAGE
     ========================================= */

  async function setCover(userId, file) {

    if (!file) {
      return null;
    }

    let cover = "";

    if (
      window.VortexMedia?.upload
    ) {

      try {

        const result =
          await window.VortexMedia.upload(
            file,
            {
              type: "cover",
              userId
            }
          );

        cover =
          result?.url ||
          result?.src ||
          result?.data?.url ||
          "";

      } catch (error) {

        console.warn(
          "VortexMedia cover upload failed:",
          error
        );

      }

    }

    if (!cover && file instanceof Blob) {

      cover =
        URL.createObjectURL(file);

    }

    if (!cover) {
      return null;
    }

    return update(
      userId,
      { cover }
    );
  }

  /* =========================================
     STATS
     ========================================= */

  function updateStats(
    userId,
    changes = {}
  ) {

    const user = users.get(userId);

    if (!user) {
      return null;
    }

    user.stats = {
      ...user.stats,
      ...changes
    };

    user.updatedAt = now();

    users.set(userId, user);

    save();

    emit("stats", {
      userId,
      stats: clone(user.stats)
    });

    return clone(user.stats);
  }

  function incrementStat(
    userId,
    stat,
    amount = 1
  ) {

    const user = users.get(userId);

    if (!user) {
      return null;
    }

    const current =
      Number(user.stats?.[stat] || 0);

    return updateStats(
      userId,
      {
        [stat]:
          Math.max(
            0,
            current + Number(amount)
          )
      }
    );
  }

  /* =========================================
     ONLINE STATUS
     ========================================= */

  function setOnline(
    userId,
    online = true
  ) {

    return update(
      userId,
      {
        online,
        status:
          online
            ? "online"
            : "offline",
        lastSeen: now()
      }
    );
  }

  function isOnline(userId) {

    const user = users.get(userId);

    return Boolean(
      user?.online
    );
  }

  /* =========================================
     USERNAME
     ========================================= */

  function isUsernameAvailable(
    username,
    ignoreUserId = null
  ) {

    const normalized =
      normalizeUsername(username);

    if (!normalized) {
      return false;
    }

    for (const user of users.values()) {

      if (
        user.id !== ignoreUserId &&
        normalizeUsername(user.username) ===
          normalized
      ) {
        return false;
      }

    }

    return true;
  }

  function changeUsername(
    userId,
    username
  ) {

    const normalized =
      normalizeUsername(username);

    if (
      !normalized ||
      normalized.length < 3
    ) {
      return null;
    }

    if (
      !isUsernameAvailable(
        normalized,
        userId
      )
    ) {
      return null;
    }

    return update(
      userId,
      {
        username: normalized
      }
    );
  }

  /* =========================================
     PRIVACY
     ========================================= */

  function setPrivacy(
    userId,
    settings = {}
  ) {

    const allowed = [
      "profile",
      "messages",
      "followers",
      "posts",
      "showOnline",
      "showEmail",
      "showPhone"
    ];

    const privacy = {};

    allowed.forEach(key => {

      if (
        settings[key] !== undefined
      ) {
        privacy[key] =
          settings[key];
      }

    });

    return update(
      userId,
      { privacy }
    );
  }

  function canViewProfile(
    viewerId,
    targetId
  ) {

    if (!targetId) {
      return false;
    }

    if (
      viewerId &&
      viewerId === targetId
    ) {
      return true;
    }

    const target = users.get(targetId);

    if (!target) {
      return false;
    }

    if (
      target.privacy.profile ===
      "public"
    ) {
      return true;
    }

    if (
      target.privacy.profile ===
      "private"
    ) {
      return false;
    }

    if (
      target.privacy.profile ===
      "friends"
    ) {

      return Boolean(
        window.VortexFriends?.isFriend?.(
          viewerId,
          targetId
        )
      );

    }

    return true;
  }

  function canMessage(
    senderId,
    targetId
  ) {

    if (
      senderId &&
      senderId === targetId
    ) {
      return true;
    }

    const target = users.get(targetId);

    if (!target) {
      return false;
    }

    const rule =
      target.privacy.messages;

    if (rule === "everyone") {
      return true;
    }

    if (rule === "nobody") {
      return false;
    }

    if (rule === "friends") {

      return Boolean(
        window.VortexFriends?.isFriend?.(
          senderId,
          targetId
        )
      );

    }

    return true;
  }

  /* =========================================
     BADGES
     ========================================= */

  function addBadge(
    userId,
    badge
  ) {

    const user = users.get(userId);

    if (!user) {
      return null;
    }

    if (!user.badges.includes(badge)) {

      user.badges.push(badge);

      user.updatedAt = now();

      users.set(userId, user);

      save();

      emit("badge", {
        userId,
        badge
      });
    }

    return clone(user.badges);
  }

  function removeBadge(
    userId,
    badge
  ) {

    const user = users.get(userId);

    if (!user) {
      return null;
    }

    user.badges =
      user.badges.filter(
        item => item !== badge
      );

    users.set(userId, user);

    save();

    emit("badgeRemoved", {
      userId,
      badge
    });

    return clone(user.badges);
  }

  /* =========================================
     SEARCH
     ========================================= */

  function search(
    query,
    options = {}
  ) {

    init();

    const q =
      clean(query).toLowerCase();

    if (!q) {
      return [];
    }

    const limit =
      Number(options.limit || 30);

    const results = [];

    for (const user of users.values()) {

      const searchable = [
        user.username,
        user.name,
        user.firstName,
        user.lastName,
        user.bio,
        user.location
      ]
        .join(" ")
        .toLowerCase();

      if (
        searchable.includes(q)
      ) {

        results.push({
          ...clone(user),
          score:
            calculateSearchScore(
              user,
              q
            )
        });

      }

      if (
        results.length >= limit
      ) {
        break;
      }

    }

    return results.sort(
      (a, b) =>
        b.score - a.score
    );
  }

  function calculateSearchScore(
    user,
    query
  ) {

    const username =
      normalizeUsername(
        user.username
      );

    const name =
      clean(user.name).toLowerCase();

    if (
      username === query
    ) {
      return 100;
    }

    if (
      username.startsWith(query)
    ) {
      return 80;
    }

    if (
      name === query
    ) {
      return 70;
    }

    if (
      name.startsWith(query)
    ) {
      return 60;
    }

    return 30;
  }

  /* =========================================
     SUGGESTIONS
     ========================================= */

  function suggestions(
    limit = 10
  ) {

    const currentId =
      getUserId();

    return getAll()
      .filter(
        user =>
          user.id !== currentId
      )
      .sort(
        () =>
          Math.random() - 0.5
      )
      .slice(0, limit);
  }

  /* =========================================
     PROFILE CARD
     ========================================= */

  function renderCard(
    userId,
    options = {}
  ) {

    const user = get(userId);

    if (!user) {
      return "";
    }

    const avatar =
      user.avatar ||
      options.fallbackAvatar ||
      "";

    const avatarHTML = avatar
      ? `<img
          class="vortex-user-avatar"
          src="${escapeHTML(avatar)}"
          alt="${escapeHTML(user.name)}"
        >`
      : `
        <div class="vortex-user-avatar vortex-avatar-fallback">
          ${escapeHTML(
            getInitials(user.name)
          )}
        </div>
      `;

    return `
      <article
        class="vortex-user-card"
        data-user-id="${escapeHTML(user.id)}"
      >

        <div class="vortex-user-card-avatar">
          ${avatarHTML}

          ${
            user.online
              ? `<span class="vortex-online-dot"></span>`
              : ""
          }
        </div>

        <div class="vortex-user-card-info">

          <div class="vortex-user-name-row">

            <strong>
              ${escapeHTML(user.name)}
            </strong>

            ${
              user.verified
                ? `<span
                    class="vortex-verified"
                    title="Verified"
                  >✓</span>`
                : ""
            }

          </div>

          <span class="vortex-user-handle">
            @${escapeHTML(user.username)}
          </span>

          ${
            user.bio
              ? `
                <p class="vortex-user-bio">
                  ${escapeHTML(user.bio)}
                </p>
              `
              : ""
          }

          <div class="vortex-user-stats">
            <span>
              ${formatNumber(
                user.stats.followers
              )}
              followers
            </span>

            <span>
              ${formatNumber(
                user.stats.posts
              )}
              posts
            </span>
          </div>

        </div>

      </article>
    `;
  }

  /* =========================================
     PROFILE PAGE
     ========================================= */

  function renderProfile(
    userId,
    container
  ) {

    const user = get(userId);

    if (!user || !container) {
      return false;
    }

    const avatar =
      user.avatar ||
      "";

    container.innerHTML = `
      <section
        class="vortex-profile"
        data-user-id="${escapeHTML(user.id)}"
      >

        <div
          class="vortex-profile-cover"
          style="${
            user.cover
              ? `background-image:url('${escapeHTML(
                  user.cover
                )}')`
              : ""
          }"
        ></div>

        <div class="vortex-profile-main">

          <div class="vortex-profile-avatar-wrap">

            ${
              avatar
                ? `
                  <img
                    class="vortex-profile-avatar"
                    src="${escapeHTML(avatar)}"
                    alt="${escapeHTML(user.name)}"
                  >
                `
                : `
                  <div class="vortex-profile-avatar vortex-avatar-fallback">
                    ${escapeHTML(
                      getInitials(user.name)
                    )}
                  </div>
                `
            }

            ${
              user.online
                ? `<span class="vortex-profile-online"></span>`
                : ""
            }

          </div>

          <div class="vortex-profile-name-row">

            <h1>
              ${escapeHTML(user.name)}
            </h1>

            ${
              user.verified
                ? `<span class="vortex-verified">✓</span>`
                : ""
            }

          </div>

          <div class="vortex-profile-username">
            @${escapeHTML(user.username)}
          </div>

          ${
            user.bio
              ? `
                <p class="vortex-profile-bio">
                  ${escapeHTML(user.bio)}
                </p>
              `
              : ""
          }

          ${
            user.location
              ? `
                <div class="vortex-profile-location">
                  📍 ${escapeHTML(user.location)}
                </div>
              `
              : ""
          }

          ${
            user.website
              ? `
                <a
                  class="vortex-profile-link"
                  href="${escapeHTML(user.website)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗 ${escapeHTML(user.website)}
                </a>
              `
              : ""
          }

          <div class="vortex-profile-stats">

            <div>
              <strong>
                ${formatNumber(
                  user.stats.posts
                )}
              </strong>
              <span>Posts</span>
            </div>

            <div>
              <strong>
                ${formatNumber(
                  user.stats.followers
                )}
              </strong>
              <span>Followers</span>
            </div>

            <div>
              <strong>
                ${formatNumber(
                  user.stats.following
                )}
              </strong>
              <span>Following</span>
            </div>

            <div>
              <strong>
                ${formatNumber(
                  user.stats.friends
                )}
              </strong>
              <span>Friends</span>
            </div>

          </div>

          <div class="vortex-profile-actions">

            <button
              type="button"
              data-action="follow"
              data-user-id="${escapeHTML(user.id)}"
            >
              Follow
            </button>

            <button
              type="button"
              data-action="message"
              data-user-id="${escapeHTML(user.id)}"
            >
              Message
            </button>

          </div>

        </div>

      </section>
    `;

    bindProfile(container);

    return true;
  }

  /* =========================================
     PROFILE BINDING
     ========================================= */

  function bindProfile(container) {

    container
      .querySelectorAll(
        "[data-action='follow']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const userId =
              button.dataset.userId;

            window.VortexFriends
              ?.follow?.(userId);

          }
        );

      });

    container
      .querySelectorAll(
        "[data-action='message']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const userId =
              button.dataset.userId;

            window.VortexChat
              ?.open?.(userId);

          }
        );

      });

  }

  /* =========================================
     INITIALS
     ========================================= */

  function getInitials(name) {

    const parts =
      clean(name)
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
      return "V";
    }

    return parts
      .slice(0, 2)
      .map(
        part =>
          part.charAt(0).toUpperCase()
      )
      .join("");
  }

  /* =========================================
     NUMBER FORMAT
     ========================================= */

  function formatNumber(number) {

    const value =
      Number(number || 0);

    if (value < 1000) {
      return String(value);
    }

    if (value < 1000000) {
      return (
        (value / 1000)
          .toFixed(
            value >= 10000 ? 0 : 1
          )
          .replace(".0", "") +
        "K"
      );
    }

    if (value < 1000000000) {
      return (
        (value / 1000000)
          .toFixed(1)
          .replace(".0", "") +
        "M"
      );
    }

    return (
      (value / 1000000000)
        .toFixed(1)
        .replace(".0", "") +
      "B"
    );
  }

  /* =========================================
     DELETE
     ========================================= */

  function remove(userId) {

    init();

    if (!users.has(userId)) {
      return false;
    }

    users.delete(userId);

    if (
      state.currentUserId === userId
    ) {
      state.currentUserId = null;

      localStorage.removeItem(
        CURRENT_USER_KEY
      );
    }

    save();

    emit("deleted", {
      userId
    });

    return true;
  }

  /* =========================================
     EXPORT USER
     ========================================= */

  function exportUser(userId) {

    const user = get(userId);

    if (!user) {
      return null;
    }

    return JSON.stringify(
      user,
      null,
      2
    );
  }

  /* =========================================
     IMPORT USER
     ========================================= */

  function importUser(data) {

    try {

      const user =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      if (!user) {
        return null;
      }

      const normalized =
        createDefaultUser(user);

      users.set(
        normalized.id,
        normalized
      );

      save();

      emit("imported", {
        user: clone(normalized)
      });

      return clone(normalized);

    } catch (error) {

      console.error(
        "VortexUser import error:",
        error
      );

      return null;
    }
  }

  /* =========================================
     USER PROFILE URL
     ========================================= */

  function profileURL(userId) {

    const user = get(userId);

    if (!user) {
      return "";
    }

    return `#profile/${encodeURIComponent(
      user.username
    )}`;
  }

  /* =========================================
     CSS
     ========================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "vortex-user-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "vortex-user-styles";

    style.textContent = `

      .vortex-user-card {
        display:flex;
        align-items:center;
        gap:14px;
        padding:14px;
        border-radius:18px;
        background:
          linear-gradient(
            135deg,
            rgba(255,255,255,.06),
            rgba(0,217,255,.025)
          );
        border:1px solid
          rgba(255,255,255,.08);
        transition:.25s ease;
      }

      .vortex-user-card:hover {
        transform:translateY(-2px);
        border-color:
          rgba(0,217,255,.3);
        box-shadow:
          0 10px 35px
          rgba(0,217,255,.08);
      }

      .vortex-user-card-avatar {
        position:relative;
        flex:none;
      }

      .vortex-user-avatar {
        width:58px;
        height:58px;
        border-radius:50%;
        object-fit:cover;
        display:block;
        border:2px solid
          rgba(0,217,255,.4);
      }

      .vortex-avatar-fallback {
        display:flex;
        align-items:center;
        justify-content:center;
        background:
          linear-gradient(
            135deg,
            #00d9ff,
            #3478ff,
            #8b4dff
          );
        color:#fff;
        font-weight:800;
        font-size:18px;
      }

      .vortex-online-dot {
        position:absolute;
        right:1px;
        bottom:2px;
        width:13px;
        height:13px;
        border-radius:50%;
        background:#35ff87;
        border:3px solid #050712;
      }

      .vortex-user-card-info {
        min-width:0;
        flex:1;
      }

      .vortex-user-name-row {
        display:flex;
        align-items:center;
        gap:6px;
      }

      .vortex-user-name-row strong {
        color:#fff;
        font-size:16px;
      }

      .vortex-user-handle {
        color:#8d9aaa;
        font-size:13px;
      }

      .vortex-user-bio {
        margin:5px 0;
        color:#c8d0da;
        font-size:13px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      .vortex-user-stats {
        display:flex;
        gap:12px;
        color:#778494;
        font-size:11px;
      }

      .vortex-verified {
        width:18px;
        height:18px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        background:#00bfff;
        color:#fff;
        font-size:11px;
        font-weight:900;
      }

      .vortex-profile {
        overflow:hidden;
        border-radius:26px;
        background:#080b16;
        border:1px solid
          rgba(255,255,255,.08);
      }

      .vortex-profile-cover {
        height:220px;
        background:
          linear-gradient(
            135deg,
            #071a2a,
            #17103b,
            #050712
          );
        background-size:cover;
        background-position:center;
      }

      .vortex-profile-main {
        position:relative;
        padding:0 24px 28px;
      }

      .vortex-profile-avatar-wrap {
        position:relative;
        width:120px;
        height:120px;
        margin-top:-60px;
        margin-bottom:12px;
      }

      .vortex-profile-avatar {
        width:120px;
        height:120px;
        border-radius:50%;
        object-fit:cover;
        border:5px solid #080b16;
        box-shadow:
          0 0 30px
          rgba(0,217,255,.25);
      }

      .vortex-profile-online {
        position:absolute;
        right:7px;
        bottom:9px;
        width:20px;
        height:20px;
        border-radius:50%;
        background:#35ff87;
        border:4px solid #080b16;
      }

      .vortex-profile-name-row {
        display:flex;
        align-items:center;
        gap:8px;
      }

      .vortex-profile-name-row h1 {
        margin:0;
        color:#fff;
        font-size:28px;
      }

      .vortex-profile-username {
        color:#7f8da0;
        margin-top:3px;
      }

      .vortex-profile-bio {
        max-width:700px;
        color:#d0d7df;
        line-height:1.6;
        margin:15px 0;
      }

      .vortex-profile-location,
      .vortex-profile-link {
        color:#8d9aaa;
        margin:7px 0;
        text-decoration:none;
      }

      .vortex-profile-stats {
        display:flex;
        flex-wrap:wrap;
        gap:28px;
        margin-top:20px;
      }

      .vortex-profile-stats div {
        display:flex;
        flex-direction:column;
      }

      .vortex-profile-stats strong {
        color:#fff;
        font-size:19px;
      }

      .vortex-profile-stats span {
        color:#7d8998;
        font-size:12px;
      }

      .vortex-profile-actions {
        display:flex;
        gap:10px;
        margin-top:22px;
      }

      .vortex-profile-actions button {
        border:0;
        border-radius:13px;
        padding:11px 20px;
        color:#fff;
        font-weight:700;
        cursor:pointer;
        background:
          linear-gradient(
            135deg,
            #00bfff,
            #3478ff,
            #8b4dff
          );
      }

      .vortex-profile-actions button + button {
        background:
          rgba(255,255,255,.08);
        border:1px solid
          rgba(255,255,255,.1);
      }

      @media(max-width:600px) {

        .vortex-profile-cover {
          height:160px;
        }

        .vortex-profile-main {
          padding:0 16px 22px;
        }

        .vortex-profile-name-row h1 {
          font-size:23px;
        }

        .vortex-profile-avatar-wrap,
        .vortex-profile-avatar {
          width:96px;
          height:96px;
        }

        .vortex-profile-avatar-wrap {
          margin-top:-48px;
        }

      }

    `;

    document.head.appendChild(style);
  }

  /* =========================================
     AUTO STATUS
     ========================================= */

  function setupPresence() {

    window.addEventListener(
      "online",
      () => {

        const userId =
          getUserId();

        if (userId) {
          setOnline(
            userId,
            true
          );
        }

      }
    );

    window.addEventListener(
      "offline",
      () => {

        const userId =
          getUserId();

        if (userId) {
          setOnline(
            userId,
            false
          );
        }

      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {

        const userId =
          getUserId();

        if (!userId) {
          return;
        }

        if (
          document.visibilityState ===
          "visible"
        ) {

          setOnline(
            userId,
            true
          );

        } else {

          update(
            userId,
            {
              lastSeen: now()
            }
          );

        }

      }
    );
  }

  /* =========================================
     AUTH INTEGRATION
     ========================================= */

  function setupAuthIntegration() {

    window.addEventListener(
      "vortex:auth:login",
      event => {

        const userId =
          event.detail?.userId ||
          event.detail?.user?.id;

        if (userId) {
          setCurrentUser(userId);
        }

      }
    );

    window.addEventListener(
      "vortex:auth:logout",
      () => {
        clearCurrentUser();
      }
    );
  }

  /* =========================================
     API
     ========================================= */

  const api = {

    VERSION,

    state,

    users,

    init,

    on,

    emit,

    create,

    get,

    getCurrent,

    getCurrentUser: getCurrent,

    getAll,

    getByUsername,

    getByEmail,

    getByPhone,

    setCurrentUser,

    clearCurrentUser,

    update,

    updateProfile,

    setAvatar,

    setCover,

    updateStats,

    incrementStat,

    setOnline,

    isOnline,

    isUsernameAvailable,

    changeUsername,

    setPrivacy,

    canViewProfile,

    canMessage,

    addBadge,

    removeBadge,

    search,

    suggestions,

    renderCard,

    renderProfile,

    bindProfile,

    getInitials,

    formatNumber,

    remove,

    delete: remove,

    exportUser,

    importUser,

    profileURL,

    normalizeUsername,

    escapeHTML
  };

  /* =========================================
     STARTUP
     ========================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        init();
        injectStyles();
        setupPresence();
        setupAuthIntegration();

      },
      { once: true }
    );

  } else {

    init();
    injectStyles();
    setupPresence();
    setupAuthIntegration();

  }

  return api;

})();

/* =========================================
   GLOBAL VORTEX USER API
   ========================================= */

window.VortexUser = VortexUser;

/* Compatibility aliases */

window.VortexUsers = VortexUser;

window.VortexProfileUsers = VortexUser;

/* =========================================
   QUICK GLOBAL HELPERS
   ========================================= */

window.getVortexUser = function(userId) {
  return window.VortexUser?.get?.(userId);
};

window.getCurrentVortexUser = function() {
  return window.VortexUser?.getCurrent?.();
};
