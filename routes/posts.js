/* =========================================================
   VORTEX SOCIAL APP
   routes/posts.js
   Posts / Feed API
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const {
    db,
    generateId,
    now
} = require("../database");

const {
    getSession
} = require("../auth-server");

const SESSION_COOKIE = "vortex_session";


/* =========================================================
   COOKIE PARSER
   ========================================================= */

function parseCookies(req) {

    const header = req.headers.cookie;

    if (!header) {
        return {};
    }

    const cookies = {};

    header.split(";").forEach(part => {

        const separator = part.indexOf("=");

        if (separator === -1) {
            return;
        }

        const key =
            part.slice(0, separator).trim();

        const value =
            part.slice(separator + 1).trim();

        cookies[key] =
            decodeURIComponent(value);
    });

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
   RESPONSE
   ========================================================= */

function sendJson(res, status, data) {

    res.statusCode = status;

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    res.end(
        JSON.stringify(data)
    );
}


/* =========================================================
   POST OBJECT
   ========================================================= */

function formatPost(post) {

    return {

        id: post.id,

        content: post.content,

        mediaUrl:
            post.media_url || "",

        mediaType:
            post.media_type || "",

        visibility:
            post.visibility,

        createdAt:
            post.created_at,

        updatedAt:
            post.updated_at,

        author: {

            id:
                post.user_id,

            username:
                post.username,

            displayName:
                post.display_name,

            avatarUrl:
                post.avatar_url || "",

            verified:
                Boolean(post.verified)
        },

        stats: {

            likes:
                post.likes_count,

            comments:
                post.comments_count,

            shares:
                post.shares_count
        }
    };
}


/* =========================================================
   CREATE POST
   ========================================================= */

function handleCreatePost(req, res) {

    const user =
        getAuthenticatedUser(req);

    if (!user) {

        sendJson(res, 401, {

            success: false,

            code:
                "NOT_AUTHENTICATED",

            message:
                "Authentication required."
        });

        return;
    }


    const body =
        req.body || {};

    const content =
        typeof body.content === "string"
            ? body.content.trim()
            : "";

    const mediaUrl =
        typeof body.mediaUrl === "string"
            ? body.mediaUrl.trim()
            : "";

    const mediaType =
        typeof body.mediaType === "string"
            ? body.mediaType.trim()
            : "";

    const visibility =
        typeof body.visibility === "string"
            ? body.visibility
            : "public";


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (
        content.length === 0 &&
        mediaUrl.length === 0
    ) {

        sendJson(res, 400, {

            success: false,

            message:
                "A post needs text or media."
        });

        return;
    }


    if (content.length > 5000) {

        sendJson(res, 400, {

            success: false,

            message:
                "Post content cannot exceed 5000 characters."
        });

        return;
    }


    const allowedVisibility = [
        "public",
        "followers",
        "private"
    ];

    if (
        !allowedVisibility.includes(
            visibility
        )
    ) {

        sendJson(res, 400, {

            success: false,

            message:
                "Invalid post visibility."
        });

        return;
    }


    /* -----------------------------------------------------
       CREATE
       ----------------------------------------------------- */

    const id =
        generateId();

    const timestamp =
        now();


    db.prepare(`
        INSERT INTO posts (
            id,
            user_id,
            content,
            media_url,
            media_type,
            visibility,
            created_at,
            updated_at
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `).run(

        id,

        user.id,

        content,

        mediaUrl,

        mediaType,

        visibility,

        timestamp,

        timestamp
    );


    const post =
        getPostById(id);


    sendJson(res, 201, {

        success: true,

        message:
            "Post published.",

        post
    });
}


/* =========================================================
   GET POST
   ========================================================= */

function getPostById(id) {

    const post =
        db.prepare(`
            SELECT
                posts.*,

                users.username,
                users.display_name,
                users.avatar_url,
                users.verified

            FROM posts

            INNER JOIN users
                ON users.id = posts.user_id

            WHERE posts.id = ?

            LIMIT 1
        `).get(id);


    if (!post) {
        return null;
    }


    return formatPost(post);
}


/* =========================================================
   GET FEED
   ========================================================= */

function handleGetFeed(req, res) {

    const url =
        new URL(
            req.url,
            "http://localhost"
        );

    let limit =
        Number(
            url.searchParams.get("limit")
        ) || 20;

    let offset =
        Number(
            url.searchParams.get("offset
