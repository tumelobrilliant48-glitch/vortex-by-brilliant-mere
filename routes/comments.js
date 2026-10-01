/* =========================================================
   VORTEX SOCIAL APP
   routes/comments.js
   Comments API
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
   FORMAT COMMENT
   ========================================================= */

function formatComment(comment) {

    return {

        id:
            comment.id,

        content:
            comment.content,

        createdAt:
            comment.created_at,

        author: {

            id:
                comment.user_id,

            username:
                comment.username,

            displayName:
                comment.display_name,

            avatarUrl:
                comment.avatar_url || "",

            verified:
                Boolean(comment.verified)
        }
    };
}


/* =========================================================
   GET COMMENTS
   ========================================================= */

function handleGetComments(
    req,
    res,
    postId
) {

    const post =
        db.prepare(`
            SELECT id
            FROM posts
            WHERE id = ?
            LIMIT 1
        `).get(postId);

    if (!post) {

        sendJson(res, 404, {

            success: false,

            code:
                "POST_NOT_FOUND",

            message:
                "Post not found."
        });

        return;
    }


    const url =
        new URL(
            req.url,
            "http://localhost"
        );


    let limit =
        Number(
            url.searchParams.get("limit")
        ) || 30;

    let offset =
        Number(
            url.searchParams.get("offset")
        ) || 0;


    limit =
        Math.min(
            Math.max(limit, 1),
            100
        );

    offset =
        Math.max(
            offset,
            0
        );


    const comments =
        db.prepare(`
            SELECT
                comments.id,
                comments.user_id,
                comments.content,
                comments.created_at,

                users.username,
                users.display_name,
                users.avatar_url,
                users.verified

            FROM comments

            INNER JOIN users
                ON users.id = comments.user_id

            WHERE comments.post_id = ?

            ORDER BY
                comments.created_at ASC

            LIMIT ?
            OFFSET ?
        `).all(
            postId,
            limit,
            offset
        );


    sendJson(res, 200, {

        success: true,

        comments:
            comments.map(
                formatComment
            ),

        pagination: {

            limit,

            offset,

            returned:
                comments.length
        }
    });
}


/* =========================================================
   CREATE COMMENT
   ========================================================= */

function handleCreateComment(
    req,
    res,
    postId
) {

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


    const post =
        db.prepare(`
            SELECT id
            FROM posts
            WHERE id = ?
            LIMIT 1
        `).get(postId);


    if (!post) {

        sendJson(res, 404, {

            success: false,

            code:
                "POST_NOT_FOUND",

            message:
                "Post not found."
        });

        return;
    }


    const body =
        req.body || {};

    const content =
        typeof body.content === "string"
            ? body.content.trim()
            : "";


    if (!content) {

        sendJson(res, 400, {

            success: false,

            message:
                "Comment cannot be empty."
        });

        return;
    }


    if (content.length > 2000) {

        sendJson(res, 400, {

            success: false,

            message:
                "Comment cannot exceed 2000 characters."
        });

        return;
    }


    const commentId =
        generateId();

    const timestamp =
        now();


    const transaction =
        db.transaction(() => {

            db.prepare(`
                INSERT INTO comments (
                    id,
                    post_id,
                    user_id,
                    content,
                    created_at
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `).run(

                commentId,

                postId,

                user.id,

                content,

                timestamp
            );


            db.prepare(`
                UPDATE posts

                SET comments_count =
                    comments_count + 1

                WHERE id = ?
            `).run(postId);
        });


    transaction();


    const comment =
        db.prepare(`
            SELECT
                comments.id,
                comments.user_id,
                comments.content,
                comments.created_at,

                users.username,
                users.display_name,
                users.avatar_url,
                users.verified

            FROM comments

            INNER JOIN users
                ON users.id = comments.user_id

            WHERE comments.id = ?

            LIMIT 1
        `).get(commentId);


    sendJson(res, 201, {

        success: true,

        message:
            "Comment added.",

        comment:
            formatComment(comment)
    });
}


/* =========================================================
   DELETE COMMENT
   ========================================================= */

function handleDeleteComment(
    req,
    res,
    commentId
) {

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


    const comment =
        db.prepare(`
            SELECT
                id,
                post_id,
                user_id
            FROM comments
            WHERE id = ?
            LIMIT 1
        `).get(commentId);


    if (!comment) {

        sendJson(res, 404, {

            success: false,

            code:
                "COMMENT_NOT_FOUND",

            message:
                "Comment not found."
        });

        return;
    }


    if (
        comment.user_id !== user.id
    ) {

        sendJson(res, 403, {

            success: false,

            code:
                "FORBIDDEN",

            message:
                "You can only delete your own comments."
        });

        return;
    }


    const transaction =
        db.transaction(() => {

            db.prepare(`
                DELETE FROM comments
                WHERE id = ?
            `).run(commentId);


            db.prepare(`
                UPDATE posts

                SET comments_count =
                    CASE
                        WHEN comments_count > 0
                        THEN comments_count - 1
                        ELSE 0
                    END

                WHERE id = ?
            `).run(
                comment.post_id
            );
        });


    transaction();


    sendJson(res, 200, {

        success: true,

        message:
            "Comment deleted."
    });
}


/* =========================================================
   ROUTER
   ========================================================= */

async function handleCommentRoute(
    req,
    res,
    pathname
) {

    const commentsMatch =
        pathname.match(
            /^\/api\/posts\/([^/]+)\/comments$/
        );


    if (
        commentsMatch &&
        req.method === "GET"
    ) {

        handleGetComments(
            req,
            res,
            commentsMatch[1]
        );

        return true;
    }


    if (
        commentsMatch &&
        req.method === "POST"
    ) {

        handleCreateComment(
            req,
            res,
            commentsMatch[1]
        );

        return true;
    }


    const deleteMatch =
        pathname.match(
            /^\/api\/comments\/([^/]+)$/
        );


    if (
        deleteMatch &&
        req.method === "DELETE"
    ) {

        handleDeleteComment(
            req,
            res,
            deleteMatch[1]
        );

        return true;
    }


    return false;
}


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
    handleCommentRoute
};
