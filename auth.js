/* =========================================================
   VORTEX — Authentication Engine
   File: auth.js
   Purpose: Authentication, sessions & account management
   ========================================================= */

(function () {
  "use strict";

  const VORTEX_AUTH_KEY = "vortex_auth";
  const VORTEX_USERS_KEY = "vortex_users";

  /* ---------------------------------------------------------
     Storage helpers
  --------------------------------------------------------- */

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(VORTEX_USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(VORTEX_USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(VORTEX_AUTH_KEY));
    } catch {
      return null;
    }
  }

  function saveSession(user) {
    localStorage.setItem(
      VORTEX_AUTH_KEY,
      JSON.stringify({
        userId: user.id,
        username: user.username,
        email: user.email,
        loggedInAt: Date.now()
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(VORTEX_AUTH_KEY);
  }

  /* ---------------------------------------------------------
     Utilities
  --------------------------------------------------------- */

  function createId() {
    return (
      "vx_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function normalizeUsername(username) {
    return String(username || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validUsername(username) {
    return /^[a-zA-Z0-9_.]{3,30}$/.test(username);
  }

  function validPassword(password) {
    return typeof password === "string" && password.length >= 8;
  }

  /* ---------------------------------------------------------
     Register
  --------------------------------------------------------- */

  function register(data) {
    const email = normalizeEmail(data.email);
    const username = normalizeUsername(data.username);
    const password = String(data.password || "");

    if (!validEmail(email)) {
      return {
        success: false,
        error: "Please enter a valid email address."
      };
    }

    if (!validUsername(username)) {
      return {
        success: false,
        error:
          "Username must contain 3–30 letters, numbers, underscores or dots."
      };
    }

    if (!validPassword(password)) {
      return {
        success: false,
        error: "Password must contain at least 8 characters."
      };
    }

    const users = getUsers();

    if (users.some(user => user.email === email)) {
      return {
        success: false,
        error: "An account with this email already exists."
      };
    }

    if (users.some(user => user.username === username)) {
      return {
        success: false,
        error: "That username is already taken."
      };
    }

    const user = {
      id: createId(),
      email,
      username,
      displayName:
        data.displayName?.trim() ||
        username.charAt(0).toUpperCase() + username.slice(1),
      bio: "",
      avatar: "",
      followers: [],
      following: [],
      createdAt: Date.now()
    };

    /*
      NOTE:
      This local prototype stores account data locally.
      Production authentication should use a secure backend
      with properly hashed passwords and server-side sessions.
    */

    user.password = password;

    users.push(user);
    saveUsers(users);
    saveSession(user);

    return {
      success: true,
      user: sanitizeUser(user)
    };
  }

  /* ---------------------------------------------------------
     Login
  --------------------------------------------------------- */

  function login(identifier, password) {
    const value = String(identifier || "").trim().toLowerCase();
    const pass = String(password || "");

    const users = getUsers();

    const user = users.find(
      item =>
        item.email === value ||
        item.username === value.replace(/^@/, "")
    );

    if (!user || user.password !== pass) {
      return {
        success: false,
        error: "Incorrect username/email or password."
      };
    }

    saveSession(user);

    return {
      success: true,
      user: sanitizeUser(user)
    };
  }

  /* ---------------------------------------------------------
     Logout
  --------------------------------------------------------- */

  function logout() {
    clearSession();

    window.dispatchEvent(
      new CustomEvent("vortex:auth-change", {
        detail: {
          loggedIn: false
        }
      })
    );

    return {
      success: true
    };
  }

  /* ---------------------------------------------------------
     Current user
  --------------------------------------------------------- */

  function currentUser() {
    const session = getSession();

    if (!session) {
      return null;
    }

    const users = getUsers();

    const user = users.find(item => item.id === session.userId);

    return user ? sanitizeUser(user) : null;
  }

  function isLoggedIn() {
    return !!currentUser();
  }

  /* ---------------------------------------------------------
     Update account
  --------------------------------------------------------- */

  function updateUser(updates) {
    const session = getSession();

    if (!session) {
      return {
        success: false,
        error: "You must be logged in."
      };
    }

    const users = getUsers();
    const index = users.findIndex(user => user.id === session.userId);

    if (index === -1) {
      return {
        success: false,
        error: "User account could not be found."
      };
    }

    const user = users
