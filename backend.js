/* =========================================================
   VORTEX OMNIVERSE — BACKEND CORE
   Authentication • Users • Profiles • Posts • Media
   Messages • Notifications • Groups • Storage • Settings
   ========================================================= */

"use strict";

const VortexBackend = (() => {

  const DB_KEY = "vortex_backend_v1";

  const defaultDB = {
    version: 1,

    session: {
      loggedIn: false,
      userId: null,
      token: null
    },

    users: [],

    posts: [],

    messages: [],

    groups: [],

    notifications: [],

    savedVideos: [],

    vault: [],

    games: [],

    events: [],

    points: {},

    settings: {},

    themes: [],

    chatFonts: [],

    cameraEffects: [],

    reports: [],

    follows: [],

    friendships: []
  };

  function loadDB() {
    try {
      const saved = localStorage.getItem(DB_KEY);

      if (!saved) {
        saveDB(defaultDB);
        return structuredClone(defaultDB);
      }

      const db = JSON.parse(saved);

      return {
        ...structuredClone(defaultDB),
        ...db
      };

    } catch (error) {
      console.error("VORTEX database error:", error);
      return structuredClone(defaultDB);
    }
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function id(prefix = "vx") {
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

  function sanitize(value, max = 10000) {
    return String(value ?? "").trim().slice(0, max);
  }

  function hashPassword(password) {
    /*
      Frontend/demo hash only.
      Real production authentication must happen on a server
      using HTTPS + Argon2/bcrypt/scrypt and secure sessions.
    */

    let hash = 2166136261;

    for (let i = 0; i < password.length; i++) {
      hash ^= password.charCodeAt(i);
      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    return (hash >>> 0).toString(16);
  }

  function getDB() {
    return loadDB();
  }

  function currentUser() {
    const db = loadDB();

    if (!db.session.userId) return null;

    return (
      db.users.find(
        user => user.id === db.session.userId
      ) || null
    );
  }

  /* =======================================================
     AUTHENTICATION
     ======================================================= */

  function register({
    name,
    username,
    email,
    password
  }) {

    const db = loadDB();

    name = sanitize(name, 80);
    username = sanitize(username, 30)
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, "");

    email = sanitize(email, 150).toLowerCase();

    if (!name || !username || !email || !password) {
      throw new Error("All registration fields are required.");
    }

    if (password.length < 6) {
      throw new Error("Password must contain at least 6 characters.");
    }

    if (
      db.users.some(
        user => user.username.toLowerCase() === username
      )
    ) {
      throw new Error("Username already exists.");
    }

    if (
      db.users.some(
        user => user.email.toLowerCase() === email
      )
    ) {
      throw new Error("Email already exists.");
    }

    const user = {
      id: id("user"),

      name,

      username,

      email,

      passwordHash: hashPassword(password),

      avatar: "",

      cover: "",

      bio: "",

      location: "",

      website: "",

      verified: false,

      privacy: {
        profile: "public",
        posts: "public",
        messages: "friends",
        stories: "friends",
        onlineStatus: true
      },

      friends: [],

      followers: [],

      following: [],

      blocked: [],

      points: 0,

      level: 1,

      achievements: [],

      createdAt: now(),

      lastSeen: now(),

      online: true
    };

    db.users.push(user);

    db.settings[user.id] = {
      theme: "vortex-dark",

      homeDecoration: "default",

      font: "default",

      sound: true,

      vibration: true,

      voiceAssistant: true,

      greeting: true,

      eyeDisplay: true,

      eyeStyle: "vortex",

      sleepAfter: 30,

      autoplay: true,

      dataSaver: false,

      notifications: true,

      privateVault: true,

      appLock: false,

      appLockType: "pin",

      hiddenButtons: [],

      language: "en"
    };

    db.points[user.id] = 0;

    saveDB(db);

    return publicUser(user);
  }

  function login(identifier, password) {

    const db = loadDB();

    identifier = sanitize(identifier, 150).toLowerCase();

    const user = db.users.find(
      u =>
        u.email.toLowerCase() === identifier ||
        u.username.toLowerCase() === identifier
    );

    if (!user) {
      throw new Error("Account not found.");
    }

    if (user.passwordHash !== hashPassword(password)) {
      throw new Error("Incorrect password.");
    }

    user.online = true;
    user.lastSeen = now();

    db.session.loggedIn = true;
    db.session.userId = user.id;
    db.session.token = id("session");

    saveDB(db);

    return publicUser(user);
  }

  function logout() {

    const db = loadDB();

    const user = currentUser();

    if (user) {
      user.online = false;
      user.lastSeen = now();
    }

    db.session = {
      loggedIn: false,
      userId: null,
      token: null
    };

    saveDB(db);
  }

  function publicUser(user) {

    if (!user) return null;

    const {
      passwordHash,
      email,
      ...safeUser
    } = user;

    return safeUser;
  }

  /* =======================================================
     PROFILE
     ======================================================= */

  function updateProfile(changes) {

    const db = loadDB();

    const user = db.users.find(
      u => u.id === db.session.userId
    );

    if (!user) {
      throw new Error("You must be logged in.");
    }

    const allowed = [
      "name",
      "username",
      "bio",
      "avatar",
      "cover",
      "location",
      "website"
    ];

    allowed.forEach(key => {

      if (changes[key] !== undefined) {
        user[key] = sanitize(
          changes[key],
          key === "bio" ? 500 : 500
        );
      }

    });

    saveDB(db);

    return publicUser(user);
  }

  function getProfile(userId) {

    const db = loadDB();

    const user = db.users.find(
      u => u.id === userId
    );

    if (!user) return null;

    return publicUser(user);
  }

  /* =======================================================
     PRIVACY
     ======================================================= */

  function updatePrivacy(changes) {

    const db = loadDB();

    const user = db.users.find(
      u => u.id === db.session.userId
    );

    if (!user) throw new Error("Not logged in.");

    Object.assign(
      user.privacy,
      changes
    );

    saveDB(db);

    return user.privacy;
  }

  function getPrivacy() {

    const db = loadDB();

    const user = db.users.find(
      u => u.id === db.session.userId
    );

    return user?.privacy || null;
  }

  /* =======================================================
     POSTS
     ======================================================= */

  function createPost({
    text = "",
    media = [],
    visibility = "public",
    type = "post",
    location = "",
    feeling = ""
  }) {

    const db = loadDB();

    const user = currentUser();

    if (!user) {
      throw new Error("Login required.");
    }

    const validVisibility = [
      "public",
      "friends",
      "private"
    ];

    if (!validVisibility.includes(visibility)) {
      visibility = "public";
    }

    const post = {

      id: id("post"),

      userId: user.id,

      text: sanitize(text, 5000),

      media: Array.isArray(media)
        ? media.slice(0, 20)
        : [],

      type,

      visibility,

      location: sanitize(location, 100),

      feeling: sanitize(feeling, 100),

      likes: [],

      comments: [],

      shares: 0,

      savedBy: [],

      reports: [],

      createdAt: now(),

      editedAt: null
    };

    db.posts.unshift(post);

    saveDB(db);

    return post;
  }

  function canViewPost(post, viewerId) {

    if (post.visibility === "public") {
      return true;
    }

    if (post.visibility === "private") {
      return post.userId === viewerId;
    }

    if (post.visibility === "friends") {

      const owner = dbUser(post.userId);

      return (
        owner &&
        owner.friends.includes(viewerId)
      );
    }

    return false;
  }

  function dbUser(userId) {

    const db = loadDB();

    return db.users.find(
      u => u.id === userId
    );
  }

  function getFeed() {

    const db = loadDB();

    const viewerId = db.session.userId;

    return db.posts
      .filter(post =>
        canViewPost(post, viewerId)
      )
      .map(post => ({
        ...post,
        author: publicUser(
          db.users.find(
            u => u.id === post.userId
          )
        )
      }));
  }

  function likePost(postId) {

    const db = loadDB();

    const post = db.posts.find(
      p => p.id === postId
    );

    if (!post) throw new Error("Post not found.");

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    const index = post.likes.indexOf(uid);

    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(uid);
    }

    saveDB(db);

    return {
      liked: post.likes.includes(uid),
      count: post.likes.length
    };
  }

  function commentPost(postId, text) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    const post = db.posts.find(
      p => p.id === postId
    );

    if (!post) throw new Error("Post not found.");

    const comment = {
      id: id("comment"),
      userId: uid,
      text: sanitize(text, 1000),
      createdAt: now()
    };

    post.comments.push(comment);

    saveDB(db);

    return comment;
  }

  function deletePost(postId) {

    const db = loadDB();

    const uid = db.session.userId;

    const index = db.posts.findIndex(
      p =>
        p.id === postId &&
        p.userId === uid
    );

    if (index === -1) {
      throw new Error("Post not found or permission denied.");
    }

    db.posts.splice(index, 1);

    saveDB(db);

    return true;
  }

  /* =======================================================
     MESSAGES / CHAT
     ======================================================= */

  function sendMessage({
    receiverId,
    text = "",
    media = null,
    type = "text"
  }) {

    const db = loadDB();

    const senderId = db.session.userId;

    if (!senderId) {
      throw new Error("Login required.");
    }

    if (!receiverId) {
      throw new Error("Receiver required.");
    }

    const message = {

      id: id("msg"),

      senderId,

      receiverId,

      text: sanitize(text, 5000),

      type,

      media,

      voice: type === "voice"
        ? media
        : null,

      read: false,

      createdAt: now()
    };

    db.messages.push(message);

    db.notifications.push({
      id: id("notification"),
      userId: receiverId,
      type: "message",
      from: senderId,
      messageId: message.id,
      createdAt: now(),
      read: false
    });

    saveDB(db);

    return message;
  }

  function getConversation(otherUserId) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) return [];

    return db.messages.filter(
      message =>
        (
          message.senderId === uid &&
          message.receiverId === otherUserId
        ) ||
        (
          message.senderId === otherUserId &&
          message.receiverId === uid
        )
    );
  }

  function markMessageRead(messageId) {

    const db = loadDB();

    const message = db.messages.find(
      m => m.id === messageId
    );

    if (message) {
      message.read = true;
      saveDB(db);
    }
  }

  /* =======================================================
     FRIENDS / FOLLOWING
     ======================================================= */

  function addFriend(userId) {

    const db = loadDB();

    const me = db.users.find(
      u => u.id === db.session.userId
    );

    const target = db.users.find(
      u => u.id === userId
    );

    if (!me || !target) {
      throw new Error("User not found.");
    }

    if (me.id === target.id) {
      throw new Error("You cannot add yourself.");
    }

    if (!me.friends.includes(target.id)) {
      me.friends.push(target.id);
    }

    if (!target.friends.includes(me.id)) {
      target.friends.push(me.id);
    }

    saveDB(db);

    return true;
  }

  function followUser(userId) {

    const db = loadDB();

    const me = db.users.find(
      u => u.id === db.session.userId
    );

    const target = db.users.find(
      u => u.id === userId
    );

    if (!me || !target) {
      throw new Error("User not found.");
    }

    if (!me.following.includes(userId)) {
      me.following.push(userId);
    }

    if (!target.followers.includes(me.id)) {
      target.followers.push(me.id);
    }

    saveDB(db);

    return true;
  }

  /* =======================================================
     VAULT
     ======================================================= */

  function addToVault({
    type,
    media,
    name = ""
  }) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    const item = {

      id: id("vault"),

      userId: uid,

      type,

      name: sanitize(name, 100),

      media,

      locked: true,

      createdAt: now()
    };

    db.vault.push(item);

    saveDB(db);

    return item;
  }

  function getVault() {

    const db = loadDB();

    const uid = db.session.userId;

    return db.vault.filter(
      item => item.userId === uid
    );
  }

  function deleteVaultItem(itemId) {

    const db = loadDB();

    const uid = db.session.userId;

    db.vault = db.vault.filter(
      item =>
        !(
          item.id === itemId &&
          item.userId === uid
        )
    );

    saveDB(db);
  }

  /* =======================================================
     OFFLINE SAVED VIDEOS
     ======================================================= */

  function saveVideoOffline({
    videoId,
    title,
    source,
    thumbnail = ""
  }) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    const existing = db.savedVideos.find(
      video =>
        video.userId === uid &&
        video.videoId === videoId
    );

    if (existing) {
      return existing;
    }

    const item = {

      id: id("offline"),

      userId: uid,

      videoId,

      title: sanitize(title, 200),

      source,

      thumbnail,

      downloadedAt: now(),

      status: "saved"
    };

    db.savedVideos.push(item);

    saveDB(db);

    return item;
  }

  function getOfflineVideos() {

    const db = loadDB();

    return db.savedVideos.filter(
      video =>
        video.userId === db.session.userId
    );
  }

  function removeOfflineVideo(idToRemove) {

    const db = loadDB();

    db.savedVideos = db.savedVideos.filter(
      video =>
        !(
          video.id === idToRemove &&
          video.userId === db.session.userId
        )
    );

    saveDB(db);
  }

  /* =======================================================
     THEMES
     ======================================================= */

  function installTheme(theme) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    const themeId = sanitize(theme.id, 100);

    const existing = db.themes.find(
      t =>
        t.userId === uid &&
        t.themeId === themeId
    );

    if (!existing) {

      db.themes.push({

        id: id("theme"),

        userId: uid,

        themeId,

        name: sanitize(theme.name, 100),

        installedAt: now()
      });

    }

    saveDB(db);
  }

  function setTheme(themeId) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    db.settings[uid] ||= {};

    db.settings[uid].theme = themeId;

    saveDB(db);

    return themeId;
  }

  /* =======================================================
     SETTINGS
     ======================================================= */

  function getSettings() {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) return null;

    return db.settings[uid] || {};
  }

  function updateSettings(changes) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) {
      throw new Error("Login required.");
    }

    db.settings[uid] = {
      ...(db.settings[uid] || {}),
      ...changes
    };

    saveDB(db);

    return db.settings[uid];
  }

  /* =======================================================
     HIDDEN HOME BUTTONS
     ======================================================= */

  function hideHomeButton(buttonId) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) return;

    db.settings[uid] ||= {};

    db.settings[uid].hiddenButtons ||= [];

    if (
      !db.settings[uid].hiddenButtons.includes(buttonId)
    ) {
      db.settings[uid].hiddenButtons.push(buttonId);
    }

    saveDB(db);
  }

  function showHomeButton(buttonId) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) return;

    db.settings[uid].hiddenButtons =
      (db.settings[uid].hiddenButtons || [])
        .filter(id => id !== buttonId);

    saveDB(db);
  }

  /* =======================================================
     GROUPS
     ======================================================= */

  function createGroup({
    name,
    description = "",
    privacy = "public",
    image = ""
  }) {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) throw new Error("Login required.");

    const group = {

      id: id("group"),

      name: sanitize(name, 100),

      description: sanitize(description, 500),

      privacy,

      image,

      ownerId: uid,

      members: [uid],

      admins: [uid],

      posts: [],

      createdAt: now()
    };

    db.groups.push(group);

    saveDB(db);

    return group;
  }

  function joinGroup(groupId) {

    const db = loadDB();

    const uid = db.session.userId;

    const group = db.groups.find(
      g => g.id === groupId
    );

    if (!group) throw new Error("Group not found.");

    if (!group.members.includes(uid)) {
      group.members.push(uid);
    }

    saveDB(db);

    return group;
  }

  /* =======================================================
     GAMES
     ======================================================= */

  function registerGame(game) {

    const db = loadDB();

    const existing = db.games.find(
      g => g.id === game.id
    );

    if (!existing) {
      db.games.push({
        ...game,
        installed: false
      });
    }

    saveDB(db);

    return game;
  }

  function installGame(gameId) {

    const db = loadDB();

    const game = db.games.find(
      g => g.id === gameId
    );

    if (!game) {
      throw new Error("Game not found.");
    }

    game.installed = true;

    saveDB(db);

    return game;
  }

  /* =======================================================
     POINTS / ACHIEVEMENTS
     ======================================================= */

  function addPoints(amount, reason = "") {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) return 0;

    amount = Math.max(
      0,
      Number(amount) || 0
    );

    db.points[uid] =
      Number(db.points[uid] || 0) +
      amount;

    const user = db.users.find(
      u => u.id === uid
    );

    if (user) {
      user.points = db.points[uid];

      user.level =
        Math.floor(user.points / 500) + 1;
    }

    db.notifications.push({
      id: id("notification"),
      userId: uid,
      type: "points",
      amount,
      reason,
      createdAt: now(),
      read: false
    });

    saveDB(db);

    return db.points[uid];
  }

  function getPoints() {

    const db = loadDB();

    return db.points[db.session.userId] || 0;
  }

  /* =======================================================
     WEEKLY EVENTS
     ======================================================= */

  function createWeeklyEvent({
    title,
    description,
    reward = 0,
    startsAt,
    endsAt
  }) {

    const db = loadDB();

    const event = {

      id: id("event"),

      title: sanitize(title, 150),

      description: sanitize(description, 1000),

      reward: Number(reward) || 0,

      startsAt,

      endsAt,

      participants: [],

      createdAt: now()
    };

    db.events.push(event);

    saveDB(db);

    return event;
  }

  function joinEvent(eventId) {

    const db = loadDB();

    const uid = db.session.userId;

    const event = db.events.find(
      e => e.id === eventId
    );

    if (!event) {
      throw new Error("Event not found.");
    }

    if (!event.participants.includes(uid)) {
      event.participants.push(uid);
    }

    saveDB(db);

    return event;
  }

  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  function getNotifications() {

    const db = loadDB();

    const uid = db.session.userId;

    return db.notifications
      .filter(n => n.userId === uid)
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );
  }

  function markNotificationsRead() {

    const db = loadDB();

    const uid = db.session.userId;

    db.notifications
      .filter(n => n.userId === uid)
      .forEach(n => {
        n.read = true;
      });

    saveDB(db);
  }

  /* =======================================================
     SEARCH
     ======================================================= */

  function searchUsers(query) {

    const db = loadDB();

    query = sanitize(query, 100)
      .toLowerCase();

    return db.users
      .filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      )
      .slice(0, 50)
      .map(publicUser);
  }

  function searchPosts(query) {

    const db = loadDB();

    query = sanitize(query, 200)
      .toLowerCase();

    return db.posts.filter(post =>
      post.text.toLowerCase().includes(query)
    );
  }

  /* =======================================================
     STORAGE INFORMATION
     ======================================================= */

  async function storageInfo() {

    if (!navigator.storage?.estimate) {
      return {
        supported: false
      };
    }

    const estimate =
      await navigator.storage.estimate();

    return {
      supported: true,

      usage: estimate.usage || 0,

      quota: estimate.quota || 0,

      percent:
        estimate.quota
          ? ((estimate.usage || 0) /
             estimate.quota) * 100
          : 0
    };
  }

  /* =======================================================
     ACCOUNT DATA EXPORT
     ======================================================= */

  function exportUserData() {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) {
      throw new Error("Login required.");
    }

    return {
      profile: publicUser(
        db.users.find(u => u.id === uid)
      ),

      posts: db.posts.filter(
        p => p.userId === uid
      ),

      messages: db.messages.filter(
        m =>
          m.senderId === uid ||
          m.receiverId === uid
      ),

      vault: db.vault.filter(
        v => v.userId === uid
      ),

      savedVideos: db.savedVideos.filter(
        v => v.userId === uid
      ),

      settings: db.settings[uid] || {},

      points: db.points[uid] || 0
    };
  }

  /* =======================================================
     DELETE ACCOUNT
     ======================================================= */

  function deleteAccount() {

    const db = loadDB();

    const uid = db.session.userId;

    if (!uid) {
      throw new Error("Login required.");
    }

    db.users =
      db.users.filter(
        user => user.id !== uid
      );

    db.posts =
      db.posts.filter(
        post => post.userId !== uid
      );

    db.messages =
      db.messages.filter(
        message =>
          message.senderId !== uid &&
          message.receiverId !== uid
      );

    db.vault =
      db.vault.filter(
        item => item.userId !== uid
      );

    db.savedVideos =
      db.savedVideos.filter(
        item => item.userId !== uid
      );

    delete db.settings[uid];
    delete db.points[uid];

    db.session = {
      loggedIn: false,
      userId: null,
      token: null
    };

    saveDB(db);
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {

    getDB,

    currentUser,

    register,
    login,
    logout,

    updateProfile,
    getProfile,

    updatePrivacy,
    getPrivacy,

    createPost,
    getFeed,
    likePost,
    commentPost,
    deletePost,

    sendMessage,
    getConversation,
    markMessageRead,

    addFriend,
    followUser,

    addToVault,
    getVault,
    deleteVaultItem,

    saveVideoOffline,
    getOfflineVideos,
    removeOfflineVideo,

    installTheme,
    setTheme,

    getSettings,
    updateSettings,

    hideHomeButton,
    showHomeButton,

    createGroup,
    joinGroup,

    registerGame,
    installGame,

    addPoints,
    getPoints,

    createWeeklyEvent,
    joinEvent,

    getNotifications,
    markNotificationsRead,

    searchUsers,
    searchPosts,

    storageInfo,

    exportUserData,
    deleteAccount
  };

})();

/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexBackend = VortexBackend;

console.log(
  "%c VORTEX BACKEND CORE READY ",
  "background:#00d4ff;color:#050510;font-weight:bold;padding:8px;border-radius:6px"
);
