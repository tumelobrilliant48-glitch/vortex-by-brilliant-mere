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

function getPagination(req) {
    const url = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
    );

    const limit = Math.min(
        Math.max(
            Number.parseInt(
                url.searchParams.get("limit") || "30",
                10
            ),
            1
        ),
        100
    );

    const offset = Math.max(
        Number.parseInt(
            url.searchParams.get("offset") || "0",
            10
        ),
        0
    );

    return { limit, offset };
}

function formatNotification(row) {
    return {
        id: row.id,
        type: row.type,
        message: row.message,
        referenceId: row.reference_id,
        isRead: Boolean(row.is_read),
        createdAt: row.created_at,

        actor: row.actor_id
            ? {
                id: row.actor_id,
                username: row.actor_username,
                displayName: row.actor_display_name,
                avatarUrl: row.actor_avatar_url,
                verified: Boolean(row.actor_verified)
            }
            : null
    };
}

function handleGetNotifications(req, res) {
    const user = getCurrentUser(req);

    if (!user) {
        return sendJson(res, 401, {
            error: "AUTH_REQUIRED"
        });
    }

    const { limit, offset } = getPagination(req);

    const notifications = db.prepare(`
        SELECT
            n.id,
            n.type,
            n.reference_id,
            n.message,
            n.is_read,
            n.created_at,

            u.id AS actor_id,
            u.username AS actor_username,
            u.display_name AS actor_display_name,
            u.avatar_url AS actor_avatar_url,
            u.verified AS actor_verified

        FROM notifications n

        LEFT JOIN users u
            ON u.id = n.actor_id

        WHERE n.user_id = ?

        ORDER BY n.created_at DESC

        LIMIT ? OFFSET ?
    `).all(
        user.id,
        limit,
        offset
    );

    const unread = db.prepare(`
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = ?
          AND is_read = 0
    `).get(user.id).count;

    return sendJson(res, 200, {
        notifications: notifications.map(formatNotification),

        pagination: {
            limit,
            offset,
            returned: notifications.length
        },

        unreadCount: Number(unread)
    });
}

function handleUnreadCount(req, res) {
    const user = getCurrentUser(req);

    if (!user) {
        return sendJson(res, 401, {
            error: "AUTH_REQUIRED"
        });
    }

    const result = db.prepare(`
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = ?
          AND is_read = 0
    `).get(user.id);

    return sendJson(res, 200, {
        unreadCount: Number(result.count)
    });
}

function handleMarkNotificationRead(req, res, notificationId) {
    const user = getCurrentUser(req);

    if (!user) {
        return sendJson(res, 401, {
            error: "AUTH_REQUIRED"
        });
    }

    const result = db.prepare(`
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
          AND user_id = ?
