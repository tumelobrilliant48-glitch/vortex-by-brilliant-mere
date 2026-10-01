/* =========================================================
   VORTEX SOCIAL APP
   auth.js
   Authentication / Session Foundation
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

/*
    IMPORTANT

    This file is the FRONTEND authentication foundation.

    It does NOT store passwords.

    Real account creation/login will later connect this
    layer to a secure backend/database.

    Never store plain-text passwords in localStorage.
*/

const VortexAuth = (() => {

    const SESSION_KEY = "vortex_auth_session";
    const USER_KEY = "vortex_auth_user";

    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

    let session = null;
    let user = null;

    /* =====================================================
       STORAGE
       ===================================================== */

    function readStorage(key) {
        try {
            const value = localStorage.getItem(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "VORTEX Auth storage read error:",
                error
            );

            return null;
        }
    }

    function writeStorage(key, value) {
        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "VORTEX Auth storage write error:",
                error
            );

            return false;
        }
    }

    function removeStorage(key) {

        try {

            localStorage.removeItem(key);

        } catch (error) {

            console.error(
                "VORTEX Auth storage remove error:",
                error
            );
        }
    }

    /* =====================================================
       SESSION
       ===================================================== */

    function createSession(userData) {

        if (!userData || !userData.id) {
            throw new Error(
                "A valid user is required to create a session."
            );
        }

        const now = Date.now();

        session = {
            id: crypto.randomUUID
                ? crypto.randomUUID()
                : createFallbackId(),

            userId: userData.id,

            createdAt: now,

            expiresAt: now + SESSION_DURATION
        };

        user = {
            ...userData
        };

        writeStorage(
            SESSION_KEY,
            session
        );

        writeStorage(
            USER_KEY,
            user
        );

        return {
            session,
            user
        };
    }

    function createFallbackId() {

        return (
            "vortex-session-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }

    /* =====================================================
       SESSION VALIDATION
       ===================================================== */

    function isSessionExpired() {

        if (!session) {
            return true;
        }

        return Date.now() >= session.expiresAt;
    }

    function isAuthenticated() {

        if (!session || !user) {
            return false;
        }

        if (isSessionExpired()) {

            clearSession();

            return false;
        }

        return true;
    }

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function init() {

        session = readStorage(
            SESSION_KEY
        );

        user = readStorage(
            USER_KEY
        );

        if (!session || !user) {

            session = null;
            user = null;

            return false;
        }

        if (isSessionExpired()) {

            clearSession();

            return false;
        }

        return true;
    }

    /* =====================================================
       USER
       ===================================================== */

    function getUser() {

        if (!isAuthenticated()) {
            return null;
        }

        return {
            ...user
        };
    }

    function getSession() {

        if (!isAuthenticated()) {
            return null;
        }

        return {
            ...session
        };
    }

    /* =====================================================
       UPDATE USER
       ===================================================== */

    function updateUser(changes) {

        if (!isAuthenticated()) {
            return false;
        }

        if (!changes || typeof changes !== "object") {
            return false;
        }

        user = {
            ...user,
            ...changes
        };

        return writeStorage(
            USER_KEY,
            user
        );
    }

    /* =====================================================
       SIGN OUT
       ===================================================== */

    function clearSession() {

        session = null;
        user = null;

        removeStorage(
            SESSION_KEY
        );

        removeStorage(
            USER_KEY
        );
    }

    function signOut() {

        clearSession();

        document.dispatchEvent(
            new CustomEvent(
                "vortex:auth:logout"
            )
        );

        return true;
    }

    /* =====================================================
       DEMO DEVELOPMENT LOGIN
       ===================================================== */

    function developmentLogin() {

        const demoUser = {

            id: "local-user",

            name: "Brilliant Mere",

            username: "brilliant",

            avatar: "B",

            email: "",

            followers: 0,

            following: 0,

            posts: 0,

            verified: false,

            createdAt: Date.now()
        };

        return createSession(
            demoUser
        );
    }

    /* =====================================================
       AUTH GUARD
       ===================================================== */

    function requireAuth(callback) {

        if (!isAuthenticated()) {

            document.dispatchEvent(
                new CustomEvent(
                    "vortex:auth:required"
                )
            );

            return false;
        }

        if (typeof callback === "function") {
            callback(getUser());
        }

        return true;
    }

    /* =====================================================
       SESSION REFRESH
       ===================================================== */

    function refreshSession() {

        if (!isAuthenticated()) {
            return false;
        }

        const now = Date.now();

        session = {
            ...session,

            expiresAt:
                now + SESSION_DURATION
        };

        return writeStorage(
            SESSION_KEY,
            session
        );
    }

    /* =====================================================
       AUTH STATE
       ===================================================== */

    function getAuthState() {

        return {
            authenticated:
                isAuthenticated(),

            user:
                getUser(),

            session:
                getSession()
        };
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {

        init,

        isAuthenticated,

        getUser,

        getSession,

        getAuthState,

        createSession,

        updateUser,

        signOut,

        clearSession,

        developmentLogin,

        requireAuth,

        refreshSession
    };

})();

/* =========================================================
   INITIALIZE
   ========================================================= */

VortexAuth.init();

/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexAuth = VortexAuth;


/* =========================================================
   AUTH EVENTS
   ========================================================= */

document.addEventListener(
    "vortex:auth:logout",
    () => {

        console.log(
            "VORTEX user signed out."
        );

    }
);

document.addEventListener(
    "vortex:auth:required",
    () => {

        console.log(
            "VORTEX authentication required."
        );

    }
);
