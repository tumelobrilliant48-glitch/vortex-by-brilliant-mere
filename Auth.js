/* =========================================================
   VORTEX AUTHENTICATION SYSTEM
   FILE 4 — auth.js
   ========================================================= */

"use strict";

window.VortexAuth = {

  currentUser: null,

  /* -------------------------------------------------------
     STORAGE
  ------------------------------------------------------- */

  getUsers() {

    try {
      return JSON.parse(
        localStorage.getItem("vortex_users") || "[]"
      );
    } catch {
      return [];
    }

  },


  saveUsers(users) {

    localStorage.setItem(
      "vortex_users",
      JSON.stringify(users)
    );

  },


  getSession() {

    try {
      return JSON.parse(
        localStorage.getItem("vortex_session") || "null"
      );
    } catch {
      return null;
    }

  },


  saveSession(user) {

    localStorage.setItem(
      "vortex_session",
      JSON.stringify(user)
    );

    this.currentUser = user;

  },


  clearSession() {

    localStorage.removeItem(
      "vortex_session"
    );

    this.currentUser = null;

  },


  /* -------------------------------------------------------
     CREATE ACCOUNT
     ------------------------------------------------------- */

  register(data) {

    const name =
      String(data.name || "").trim();

    const username =
      String(data.username || "")
        .trim()
        .toLowerCase();

    const email =
      String(data.email || "")
        .trim()
        .toLowerCase();

    const password =
      String(data.password || "");

    if (!name) {
      return {
        success: false,
        message: "Enter your name."
      };
    }

    if (!username) {
      return {
        success: false,
        message: "Choose a username."
      };
    }

    if (!/^[a-z0-9._]{3,30}$/.test(username)) {

      return {
        success: false,
        message:
          "Username must contain 3–30 letters, numbers, dots or underscores."
      };

    }

    if (!email) {

      return {
        success: false,
        message: "Enter your email."
      };

    }

    if (password.length < 6) {

      return {
        success: false,
        message:
          "Password must contain at least 6 characters."
      };

    }


    const users =
      this.getUsers();


    const usernameExists =
      users.some(
        user =>
          user.username === username
      );


    if (usernameExists) {

      return {
        success: false,
        message:
          "That username is already taken."
      };

    }


    const emailExists =
      users.some(
        user =>
          user.email === email
      );


    if (emailExists) {

      return {
        success: false,
        message:
          "That email is already registered."
      };

    }


    /*
      IMPORTANT:

      This local password storage is ONLY for
      the frontend MVP.

      The production VORTEX backend will replace
      this with secure server-side authentication.
    */

    const user = {

      id:
        "vx_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 8),

      name,

      username,

      email,

      password,

      avatar: "",

      cover: "",

      bio: "",

      points: 0,

      level: 1,

      followers: [],

      following: [],

      friends: [],

      blockedUsers: [],

      privacy: {

        profile:
          "public",

        posts:
          "public",

        messages:
          "friends"

      },

      createdAt:
        new Date().toISOString()

    };


    users.push(user);

    this.saveUsers(users);

    this.saveSession(user);


    return {

      success: true,

      message:
        "VORTEX account created.",

      user

    };

  },


  /* -------------------------------------------------------
     LOGIN
     ------------------------------------------------------- */

  login(identifier, password) {

    identifier =
      String(identifier || "")
        .trim()
        .toLowerCase();

    password =
      String(password || "");


    const users =
      this.getUsers();


    const user =
      users.find(
        item =>
          (
            item.email === identifier ||
            item.username === identifier
          ) &&
          item.password === password
      );


    if (!user) {

      return {

        success: false,

        message:
          "Incorrect username, email or password."

      };

    }


    this.saveSession(user);


    return {

      success: true,

      message:
        "Welcome back to VORTEX.",

      user

    };

  },


  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  logout() {

    this.clearSession();

    if (
      window.VortexApp &&
      VortexApp.closeMenu
    ) {

      VortexApp.closeMenu();

    }


    showAuthScreen();

  },


  /* -------------------------------------------------------
     UPDATE USER
     ------------------------------------------------------- */

  updateProfile(changes) {

    const session =
      this.getSession();


    if (!session) {

      return {

        success: false,

        message:
          "You are not logged in."

      };

    }


    const users =
      this.getUsers();


    const index =
      users.findIndex(
        user =>
          user.id === session.id
      );


    if (index === -1) {

      return {

        success: false,

        message:
          "Account not found."

      };

    }


    const allowed = [

      "name",
      "username",
      "bio",
      "avatar",
      "cover",
      "privacy"

    ];


    allowed.forEach(key => {

      if (
        changes[key] !== undefined
      ) {

        users[index][key] =
          changes[key];

      }

    });


    this.saveUsers(users);

    this.saveSession(users[index]);


    if (window.VORTEX) {

      VORTEX.user =
        users[index];

    }


    return {

      success: true,

      user:
        users[index]

    };

  },


  /* -------------------------------------------------------
     DELETE ACCOUNT
     ------------------------------------------------------- */

  deleteAccount() {

    const session =
      this.getSession();


    if (!session) {
      return false;
    }


    const users =
      this.getUsers();


    const remaining =
      users.filter(
        user =>
          user.id !== session.id
      );


    this.saveUsers(remaining);

    this.clearSession();


    /*
      Remove local VORTEX data belonging
      to the deleted account.
    */

    localStorage.removeItem(
      "vortex_posts"
    );

    localStorage.removeItem(
      "vortex_stories"
    );

    localStorage.removeItem(
      "vortex_chats"
    );


    showAuthScreen();


    return true;

  }

};


/* =========================================================
   AUTH UI
   ========================================================= */

function showAuthScreen() {

  const main =
    document.getElementById(
      "mainApp"
    );

  const auth =
    document.getElementById(
      "authScreen"
    );


  if (main) {

    main.classList.add(
      "hidden"
    );

  }


  if (auth) {

    auth.classList.remove(
      "hidden"
    );

  }

}


function showMainApp() {

  const auth =
    document.getElementById(
      "authScreen"
    );

  const main =
    document.getElementById(
      "mainApp"
    );


  if (auth) {

    auth.classList.add(
      "hidden"
    );

  }


  if (main) {

    main.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   AUTH FORM SETUP
   ========================================================= */

function setupAuthentication() {

  const loginForm =
    document.getElementById(
      "loginForm"
    );


  const registerForm =
    document.getElementById(
      "registerForm"
    );


  /* -------------------------------------------------------
     LOGIN
     ------------------------------------------------------- */

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const identifier =
          document.getElementById(
            "loginIdentifier"
          )?.value;


        const password =
          document.getElementById(
            "loginPassword"
          )?.value;


        const result =
          VortexAuth.login(
            identifier,
            password
          );


        if (!result.success) {

          if (
            window.notifyUser
          ) {

            notifyUser(
              result.message
            );

          } else {

            alert(
              result.message
            );

          }

          return;

        }


        if (window.VORTEX) {

          VORTEX.user =
            result.user;

        }


        showMainApp();


        if (
          window.updateCurrentUserUI
        ) {

          updateCurrentUserUI();

        }


        if (
          window.renderLocalFeed
        ) {

          renderLocalFeed();

        }


        if (
          window.showGreeting
        ) {

          showGreeting();

        }


        if (
          window.notifyUser
        ) {

          notifyUser(
            "Welcome back, " +
            result.user.name +
            " 👋"
          );

        }

      }
    );

  }


  /* -------------------------------------------------------
     REGISTER
     ------------------------------------------------------- */

  if (registerForm) {

    registerForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const result =
          VortexAuth.register({

            name:
              document.getElementById(
                "registerName"
              )?.value,

            username:
              document.getElementById(
                "registerUsername"
              )?.value,

            email:
              document.getElementById(
                "registerEmail"
              )?.value,

            password:
              document.getElementById(
                "registerPassword"
              )?.value

          });


        if (!result.success) {

          if (
            window.notifyUser
          ) {

            notifyUser(
              result.message
            );

          } else {

            alert(
              result.message
            );

          }

          return;

        }


        if (window.VORTEX) {

          VORTEX.user =
            result.user;

        }


        showMainApp();


        if (
          window.updateCurrentUserUI
        ) {

          updateCurrentUserUI();

        }


        if (
          window.showGreeting
        ) {

          showGreeting();

        }


        if (
          window.notifyUser
        ) {

          notifyUser(
            "Welcome to VORTEX, " +
            result.user.name +
            " 👋"
          );

        }

      }
    );

  }

}


/* =========================================================
   AUTH TABS
   ========================================================= */

function setupAuthTabs() {

  document
    .querySelectorAll(
      "[data-auth-tab]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const target =
            button.dataset.authTab;


          document
            .querySelectorAll(
              "[data-auth-panel]"
            )
            .forEach(panel => {

              panel.classList.add(
                "hidden"
              );

            });


          const panel =
            document.querySelector(
              `[data-auth-panel="${target}"]`
            );


          if (panel) {

            panel.classList.remove(
              "hidden"
            );

          }


          document
            .querySelectorAll(
              "[data-auth-tab]"
            )
            .forEach(item => {

              item.classList.toggle(
                "active",
                item === button
              );

            });

        }
      );

    });

}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

function setupPasswordToggles() {

  document
    .querySelectorAll(
      "[data-password-toggle]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const targetId =
            button.dataset.passwordToggle;


          const input =
            document.getElementById(
              targetId
            );


          if (!input) return;


          if (
            input.type === "password"
          ) {

            input.type =
              "text";

            button.textContent =
              "🙈";

          } else {

            input.type =
              "password";

            button.textContent =
              "👁️";

          }

        }
      );

    });

}


/* =========================================================
   SESSION RESTORE
   ========================================================= */

function restoreSession() {

  const session =
    VortexAuth.getSession();


  if (!session) {

    return false;

  }


  VortexAuth.currentUser =
    session;


  if (window.VORTEX) {

    VORTEX.user =
      session;

  }


  showMainApp();


  return true;

}


/* =========================================================
   AUTH INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupAuthentication();

    setupAuthTabs();

    setupPasswordToggles();


    /*
      Restore an existing VORTEX
      session if available.
    */

    restoreSession();

  }
);


/* =========================================================
   PUBLIC AUTH HELPERS
   ========================================================= */

window.loginVortex =
  function(identifier, password) {

    return VortexAuth.login(
      identifier,
      password
    );

  };


window.registerVortex =
  function(data) {

    return VortexAuth.register(
      data
    );

  };


window.logoutVortex =
  function() {

    VortexAuth.logout();

  };


/* =========================================================
   END OF AUTHENTICATION MODULE
   ========================================================= */

File 4 is now "auth.js". It handles the MVP authentication layer: registration, login, sessions, logout, profile updates, account deletion, privacy fields, and restoring the user session. The later backend will replace the local authentication with real secure authentication/database services.
