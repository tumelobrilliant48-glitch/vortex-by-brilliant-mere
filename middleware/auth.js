"use strict";

const {
    authenticateSession
} = require("../auth-server");

const {
    parseCookies
} = require("../routes/auth");

function getSessionId(req) {
    const cookies = parseCookies(
        req.headers.cookie || ""
    );

    return cookies.vortex_session || null;
}

function getAuthenticatedUser(req) {
    const sessionId = getSessionId(req);

    if (!sessionId) {
        return null;
    }

    return authenticateSession(sessionId);
}

function requireAuth(req, res) {
    const user = getAuthenticatedUser(req);

    if (!user) {
        res.writeHead(401, {
            "Content-Type":
                "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        });

        res.end(
            JSON.stringify({
                error: "AUTH_REQUIRED",
                message:
                    "You must be signed in to use this VORTEX feature."
            })
        );

        return null;
    }

    return user;
}

function optionalAuth(req) {
    return getAuthenticatedUser(req);
}

function createAuthContext(req) {
    const sessionId = getSessionId(req);
    const user = sessionId
        ? authenticateSession(sessionId)
        : null;

    return {
        authenticated: Boolean(user),
        sessionId,
        user
    };
}

module.exports = {
    getSessionId,
    getAuthenticatedUser,
    requireAuth,
    optionalAuth,
    createAuthContext
};
