/* =========================================================
   VORTEX SOCIAL APP
   routes/users.js
   User Profile API
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const {
    db
} = require("../database");

const {
    getSession
} = require("../auth-server");


const SESSION_COOKIE =
    "vortex_session";


/* =========================================================
   COOKIE PARSER
   ========================================================= */

function parseCookies(req) {

    const header =
        req.headers.cookie;

    if (!header) {
        return {};
    }

    const cookies = {};

    header.split(";").forEach(
        part => {

            const index =
                part.indexOf("=");

            if (index === -1) {
                return;
            }

            const key =
                part.slice(
                    0,
                    index
                ).trim();

            const value =
                part.slice(
                    index + 1
                ).trim();

            cookies[key] =
                decodeURIComponent(value);
        }
    );

    return cookies;
}


/* =========================================================
   AUTHENTICATED USER
   ========================================================= */

function getAuthenticatedUser(req) {

    const cookies =
        parseCookies(req);

    const sessionId =
        cookies[SESSION_COOKIE];

    if (!sessionId) {
        return null;
    }

    const authentication =
        getSession(sessionId);

    if (!authentication) {
        return null;
    }

    return authentication.user;
}


/* =========================================================
   JSON RESPONSE
   ========================================================= */

function sendJson(
    res,
    status,
    data
) {

    res.statusCode =
        status;

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    res.end(
        JSON.stringify(data)
    );
}


/* =========================================================
   PUBLIC USER
   ========================================================= */

function publicUser(user) {

    return {

        id:
            user.id,

        username:
            user.username,

        displayName:
            user.display_name,

        bio:
            user.bio || "",

        avatarUrl:
            user.avatar_url || "",

        coverUrl:
            user.cover_url || "",

        verified:
            Boolean(
                user.verified
            ),

        createdAt:
            user.created_at
    };
}


/* =========================================================
   GET USER BY USERNAME
   ========================================================= */

function handleGetUser(
    req,
    res,
    username
) {

    const user =
        db.prepare(`
            SELECT
                id,
                username,
                display_name,
                bio,
                avatar_url,
                cover_url,
                verified,
                created_at
            FROM users
            WHERE username = ?
              AND is_active = 1
            LIMIT 1
        `).get(
            username.toLowerCase()
        );


    if (!user) {

        sendJson(
            res,
            404,
            {
                success: false,

                code:
                    "USER_NOT_FOUND",

                message:
                    "VORTEX user not found."
            }
        );

        return;
    }


    const followerCount =
        db.prepare(`
            SELECT COUNT(*) AS count
            FROM follows
            WHERE following_id = ?
        `).get(
            user.id
        ).count;


    const followingCount =
        db.prepare(`
            SELECT COUNT(*) AS count
            FROM follows
            WHERE follower_id = ?
        `).get(
            user.id
        ).count;


    const postCount =
        db.prepare(`
            SELECT COUNT(*) AS count
            FROM posts
            WHERE user_id = ?
        `).get(
            user.id
        ).count;


    sendJson(
        res,
        200,
        {
            success: true,

            user:
                publicUser(user),

            stats: {

                followers:
                    followerCount,

                following:
                    followingCount,

                posts:
                    postCount
            }
        }
    );
}


/* =========================================================
   UPDATE PROFILE
   ========================================================= */

function handleUpdateProfile(
    req,
    res
) {

    const user =
        getAuthenticatedUser(req);

    if (!user) {

        sendJson(
            res,
            401,
            {
                success: false,

                code:
                    "NOT_AUTHENTICATED",

                message:
                    "Authentication required."
            }
        );

        return;
    }


    const body =
        req.body || {};


    const displayName =
        typeof body.displayName ===
        "string"
            ? body.displayName.trim()
            : user.displayName;


    const bio =
        typeof body.bio ===
        "string"
            ? body.bio.trim()
            : user.bio;


    if (
        displayName.length < 1 ||
        displayName.length > 80
    ) {

        sendJson(
            res,
            400,
            {
                success: false,

                message:
                    "Display name must contain 1-80 characters."
            }
        );

        return;
    }


    if (bio.length > 500) {

        sendJson(
            res,
            400,
            {
                success: false,

                message:
                    "Bio cannot exceed 500 characters."
            }
        );

        return;
    }


    const updatedAt =
        new Date().toISOString();


    db.prepare(`
        UPDATE users

        SET
            display_name = ?,
            bio = ?,
            updated_at = ?

        WHERE id = ?
    `).run(

        displayName,

        bio,

        updatedAt,

        user.id
    );


    const updatedUser =
        db.prepare(`
            SELECT
                id,
                username,
                display_name,
                bio,
                avatar_url,
                cover_url,
                verified,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        `).get(
            user.id
        );


    sendJson(
        res,
        200,
        {
            success: true,

            message:
                "Profile updated.",

            user:
                publicUser(
                    updatedUser
                )
        }
    );
}


/* =========================================================
   USER SEARCH
   ========================================================= */

function handleUserSearch(
    req,
