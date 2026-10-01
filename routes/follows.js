"use strict";

const { db } = require("../database");
const { authenticateSession } = require("../auth-server");
const { parseCookies } = require("./auth");

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify(data));
}

function getCurrentUser(req) {
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionId = cookies.vortex_session;

    if (!sessionId) return null;

    return authenticateSession(sessionId);
}

function publicUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        verified: Boolean(user.verified)
    };
}

function getUserByUsername(username) {
    return db.prepare(`
        SELECT
            id,
            username,
            display_name,
            avatar_url,
            verified,
            is_active
        FROM users
        WHERE username = ?
        LIMIT 1
    `).get(username.toLowerCase());
}

function getFollowCounts(userId) {
    const followers = db.prepare(`
        SELECT COUNT(*) AS count
        FROM follows
        WHERE following_id = ?
    `).get(userId).count;

    const following = db.prepare(`
        SELECT COUNT(*) AS count
        FROM follows
        WHERE follower_id = ?
    `).get(userId).count;

    return {
        followers: Number(followers),
        following: Number(following)
    };
}

function isFollowing(followerId, followingId) {
    return Boolean(
        db.prepare(`
            SELECT 1
            FROM follows
            WHERE follower_id = ?
              AND following_id = ?
            LIMIT 1
        `).get(followerId, followingId)
    );
}

async function handleFollow(req, res, username) {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
        return sendJson(res, 401, {
            error: "AUTH_REQUIRED"
        });
    }

    const target = getUserByUsername(username);

    if (!target || !target.is_active) {
        return sendJson(res, 404, {
            error: "USER_NOT_FOUND"
        });
    }

    if (target.id === currentUser.id) {
        return sendJson(res, 400, {
            error: "CANNOT_FOLLOW_SELF"
        });
    }

    if (isFollowing(currentUser.id, target.id)) {
        const counts = getFollowCounts(target.id);

        return sendJson(res, 200, {
            success: true,
            following: true,
            alreadyFollowing: true,
            counts
        });
    }

    const transaction = db.transaction(() => {
        db.prepare(`
            INSERT INTO follows (
                follower_id,
                following_id
            )
            VALUES (?, ?)
        `).run(
            currentUser.id,
            target.id
        );

        db.prepare(`
            INSERT INTO notifications (
                id,
                user_id,
                actor_id,
                type,
                reference_id,
                message,
                is_read,
                created_at
            )
            VALUES (
                lower(hex(randomblob(16))),
                ?,
                ?,
                'follow',
                ?,
                ?,
                0,
                datetime('now')
            )
        `).run(
            target.id,
            currentUser.id,
            currentUser.id,
            `${currentUser.display_name || currentUser.username} followed you.`
        );
    });

    try {
        transaction();
    } catch (error) {
        console.error("Follow transaction failed:", error);

        return sendJson(res, 500, {
            error: "FOLLOW_FAILED"
        });
    }

    const counts = getFollowCounts(target.id);

    return sendJson(res, 201, {
        success: true,
        following: true,
        counts
    });
}

async function handleUnfollow(req, res, username) {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
        return sendJson(res, 401, {
            error: "AUTH_REQUIRED"
        });
    }

    const target = getUserByUsername(username);

    if (!target || !target.is_active) {
        return sendJson(res, 404, {
            error: "USER_NOT_FOUND"
        });
    }

    if (target.id === currentUser.id) {
        return sendJson(res, 400, {
            error: "CANNOT_UNFOLLOW_SELF"
        });
    }

    const result = db.prepare(`
        DELETE FROM follows
        WHERE follower_id = ?
          AND following_id = ?
    `).run(
        currentUser.id,
        target.id
    );

    const counts = getFollowCounts(target.id);

    return sendJson(res, 200, {
        success: true,
        following: false,
        changed: result.changes > 0,
        counts
    });
}

function handleFollowStatus(req, res, username) {
    const currentUser = getCurrentUser(req);
    const target = getUserByUsername(username);

    if (!target || !target.is_active) {
        return sendJson(res, 404, {
            error: "USER_NOT_FOUND"
        });
    }

    const following = currentUser
        ? isFollowing(currentUser.id, target.id)
        : false;

    const counts = getFollowCounts(target.id);

    return sendJson(res, 200, {
        following,
        counts
    });
}

function handleFollowers(req, res, username) {
    const target = getUserByUsername(username);

    if (!target || !target.is_active) {
        return sendJson(res, 404, {
            error: "USER_NOT_FOUND"
        });
    }

    const url = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
    );

    const limit = Math.min(
        Math.max(Number.parseInt(url.searchParams.get("limit") || "30", 10), 1),
        100
    );

    const offset = Math.max(
        Number.parseInt(url.searchParams.get("offset") || "0", 10),
        0
    );

    const rows = db.prepare(`
        SELECT
            u.id,
            u.username,
            u.display_name,
            u.avatar_url,
            u.verified
        FROM follows f
        INNER JOIN users u
            ON u.id = f.follower_id
        WHERE f.following_id = ?
          AND u.is_active = 1
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    `).all(
        target.id,
        limit,
        offset
    );

    return sendJson(res, 200, {
        users: rows.map(publicUser),
        pagination: {
            limit,
            offset,
            returned: rows.length
        }
    });
}

function handleFollowing(req, res, username) {
    const target = getUserByUsername(username);

    if (!target || !target.is_active) {
        return sendJson(res, 404, {
            error: "USER_NOT_FOUND"
        });
    }

    const url = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
    );

    const limit = Math.min(
        Math.max(Number.parseInt(url.searchParams.get("limit") || "30", 10), 1),
        100
    );

    const offset = Math.max(
        Number.parseInt(url.searchParams.get("offset") || "0", 10),
        0
    );

    const rows = db.prepare(`
        SELECT
            u.id,
            u.username,
            u.display_name,
            u.avatar_url,
            u.verified
        FROM follows f
        INNER JOIN users u
            ON u.id = f.following_id
        WHERE f.follower_id = ?
          AND u.is_active = 1
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    `).all(
        target.id,
        limit,
        offset
    );

    return sendJson(res, 200, {
        users: rows.map(publicUser),
        pagination: {
            limit,
            offset,
            returned: rows.length
        }
    });
}

async function handleFollowRoute(req, res, pathname) {
    const parts = pathname.split("/").filter(Boolean);

    /*
        /api/users/:username/follow
        /api/users/:username/follow-status
        /api/users/:username/followers
        /api/users/:username/following
    */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "users"
    ) {
        const username = decodeURIComponent(parts[2]);
        const action = parts[3];

        if (action === "follow") {
            if (req.method === "POST") {
                return handleFollow(req, res, username);
            }

            if (req.method === "DELETE") {
                return handleUnfollow(req, res, username);
            }
        }

        if (
            action === "follow-status" &&
            req.method === "GET"
        ) {
            return handleFollowStatus(req, res, username);
        }

        if (
            action === "followers" &&
            req.method === "GET"
        ) {
            return handleFollowers(req, res, username);
        }

        if (
            action === "following" &&
            req.method === "GET"
        ) {
            return handleFollowing(req, res, username);
        }
    }

    return false;
}

module.exports = {
    handleFollowRoute
};
