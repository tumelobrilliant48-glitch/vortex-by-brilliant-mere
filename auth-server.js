/* =========================================================
   VORTEX SOCIAL APP
   auth-server.js
   Secure Authentication Service
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const crypto = require("crypto");
const argon2 = require("argon2");

const {
    db,
    generateId,
    now,
    users
} = require("./database");


/* =========================================================
   CONFIGURATION
   ========================================================= */

const SESSION_DAYS = 7;

const SESSION_MS =
    SESSION_DAYS *
    24 *
    60 *
    60 *
    1000;


/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();
}


function normalizeUsername(username) {

    return String(username || "")
        .trim()
        .toLowerCase();
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateUsername(username) {

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {

        throw new Error(
            "Username must contain 3-30 letters, numbers, or underscores."
        );
    }
}


function validateEmail(email) {

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        throw new Error(
            "Please provide a valid email address."
        );
    }
}


function validatePassword(password) {

    if (
        typeof password !== "string" ||
        password.length < 8
    ) {

        throw new Error(
            "Password must contain at least 8 characters."
        );
    }

    if (password.length > 128) {

        throw new Error(
            "Password is too long."
        );
    }
}


function validateDisplayName(name) {

    const value =
        String(name || "").trim();

    if (
        value.length < 1 ||
        value.length > 80
    ) {

        throw new Error(
            "Display name must contain 1-80 characters."
        );
    }
}


/* =========================================================
   PUBLIC USER OBJECT
   ========================================================= */

function publicUser(user) {

    if (!user) {
        return null;
    }

    return {

        id: user.id,

        username: user.username,

        email: user.email,

        displayName:
            user.display_name,

        bio:
            user.bio,

        avatarUrl:
            user.avatar_url,

        coverUrl:
            user.cover_url,

        verified:
            Boolean(user.verified),

        createdAt:
            user.created_at
    };
}


/* =========================================================
   REGISTER
   ========================================================= */

async function register({
    username,
    email,
    password,
    displayName
}) {

    username =
        normalizeUsername(username);

    email =
        normalizeEmail(email);

    displayName =
        String(displayName || "").trim();


    validateUsername(username);

    validateEmail(email);

    validatePassword(password);

    validateDisplayName(displayName);


    /* -----------------------------------------------------
       CHECK EXISTING ACCOUNT
       ----------------------------------------------------- */

    const existingEmail =
        users.findByEmail.get(email);

    if (existingEmail) {

        throw new Error(
            "An account with this email already exists."
        );
    }


    const existingUsername =
        users.findByUsername.get(username);

    if (existingUsername) {

        throw new Error(
            "That username is already taken."
        );
    }


    /* -----------------------------------------------------
       PASSWORD HASH
       ----------------------------------------------------- */

    const passwordHash =
        await argon2.hash(
            password,
            {
                type:
                    argon2.argon2id
            }
        );


    /* -----------------------------------------------------
       USER
       ----------------------------------------------------- */

    const userId =
        generateId();

    const timestamp =
        now();


    users.create.run({

        id:
            userId,

        username,

        email,

        password_hash:
            passwordHash,

        display_name:
            displayName,

        created_at:
            timestamp,

        updated_at:
            timestamp
    });


    const createdUser =
        users.findById.get(
            userId
        );


    return {
        user:
            publicUser(createdUser)
    };
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login({
    email,
    password
}) {

    email =
        normalizeEmail(email);

    validateEmail(email);

    validatePassword(password);


    const user =
        users.findByEmail.get(email);


    /*
       Don't reveal whether an email exists.
    */

    if (!user) {

        throw new Error(
            "Invalid email or password."
        );
    }


    if (!user.is_active) {

        throw new Error(
            "This account is currently unavailable."
        );
    }


    const validPassword =
        await argon2.verify(
            user.password_hash,
            password
        );


    if (!validPassword) {

        throw new Error(
            "Invalid email or password."
        );
    }


    return {
        user:
            publicUser(user)
    };
}


/* =========================================================
   SESSION CREATION
   ========================================================= */

function createSession(userId) {

    const sessionId =
        crypto.randomUUID();

    const createdAt =
        new Date();

    const expiresAt =
        new Date(
            createdAt.getTime() +
            SESSION_MS
        );


    db.prepare(`
        INSERT INTO sessions (
            id,
            user_id,
            expires_at,
            created_at
        )
        VALUES (
            ?,
            ?,
            ?,
            ?
        )
    `).run(

        sessionId,

        userId,

        expiresAt.toISOString(),

        createdAt.toISOString()
    );


    return {

        id:
            sessionId,

        userId,

        expiresAt:
            expiresAt.toISOString()
    };
}


/* =========================================================
   SESSION LOOKUP
   ========================================================= */

function getSession(sessionId) {

    if (!sessionId) {
        return null;
    }


    const session =
        db.prepare(`
            SELECT
                sessions.id,
                sessions.user_id,
                sessions.expires_at,
                sessions.created_at,

                users.username,
                users.email,
                users.display_name,
                users.bio,
                users.avatar_url,
                users.cover_url,
                users.verified,
                users.is_active,
                users.created_at AS user_created_at

            FROM sessions

            INNER JOIN users
                ON users.id = sessions.user_id

            WHERE sessions.id = ?

            LIMIT 1
        `).get(sessionId);


    if (!session) {
        return null;
    }


    const expired =
        Date.now() >=
        Date.parse(
            session.expires_at
        );


    if (expired) {

        deleteSession(
            session.id
        );

        return null;
    }


    if (!session.is_active) {
        return null;
    }


    return {

        session: {

            id:
                session.id,

            userId:
                session.user_id,

            expiresAt:
                session.expires_at,

            createdAt:
                session.created_at
        },

        user: {

            id:
                session.user_id,

            username:
                session.username,

            email:
                session.email,

            displayName:
                session.display_name,

            bio:
                session.bio,

            avatarUrl:
                session.avatar_url,

            coverUrl:
                session.cover_url,

            verified:
                Boolean(
                    session.verified
                ),

            createdAt:
                session.user_created_at
        }
    };
}


/* =========================================================
   DELETE SESSION
   ========================================================= */

function deleteSession(sessionId) {

    db.prepare(`
        DELETE FROM sessions
        WHERE id = ?
    `).run(sessionId);
}


/* =========================================================
   DELETE ALL USER SESSIONS
   ========================================================= */

function deleteUserSessions(userId) {

    db.prepare(`
        DELETE FROM sessions
        WHERE user_id = ?
    `).run(userId);
}


/* =========================================================
   CLEAN EXPIRED SESSIONS
   ========================================================= */

function cleanupSessions() {

    db.prepare(`
        DELETE FROM sessions
        WHERE expires_at <= ?
    `).run(
        new Date().toISOString()
    );
}


/* =========================================================
   AUTHENTICATE SESSION
   ========================================================= */

function authenticateSession(
    sessionId
) {

    const result =
        getSession(sessionId);

    if
