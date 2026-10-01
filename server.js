"use strict";

require("dotenv").config();

const http = require("node:http");
const crypto = require("node:crypto");

const {
    healthCheck,
    cleanupSessions
} = require("./database");

const { handleAuthRoute } = require("./routes/auth");
const { handleUserRoute } = require("./routes/users");
const { handlePostRoute } = require("./routes/posts");
const { handleCommentRoute } = require("./routes/comments");
const { handleFollowRoute } = require("./routes/follows");
const {
    handleNotificationRoute
} = require("./routes/notifications");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
const NODE_ENV = process.env.NODE_ENV || "development";

const MAX_BODY_SIZE = 2 * 1024 * 1024;

function requestId() {
    return crypto.randomUUID();
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
    const body = JSON.stringify(data);

    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        ...extraHeaders
    });

    res.end(body);
}

function sendText(res, statusCode, text) {
    res.writeHead(statusCode, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
    });

    res.end(text);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        let size = 0;
        let finished = false;

        req.setEncoding("utf8");

        req.on("data", chunk => {
            if (finished) return;

            size += Buffer.byteLength(chunk);

            if (size > MAX_BODY_SIZE) {
                finished = true;

                const error = new Error("REQUEST_BODY_TOO_LARGE");
                error.statusCode = 413;

                reject(error);

                req.destroy();
                return;
            }

            body += chunk;
        });

        req.on("end", () => {
            if (finished) return;

            finished = true;
            resolve(body);
        });

        req.on("error", error => {
            if (finished) return;

            finished = true;
            reject(error);
        });
    });
}

function applySecurityHeaders(res) {
    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    res.setHeader(
        "X-Frame-Options",
        "DENY"
    );

    res.setHeader(
        "Referrer-Policy",
        "strict-origin-when-cross-origin"
    );

    res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );

    res.setHeader(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "media-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'"
        ].join("; ")
    );
}

function applyCors(req, res) {
    const origin = req.headers.origin;

    if (
        CLIENT_ORIGIN === "*" &&
        NODE_ENV !== "production"
    ) {
        res.setHeader(
            "Access-Control-Allow-Origin",
            "*"
        );
    } else if (
        origin &&
        origin === CLIENT_ORIGIN
    ) {
        res.setHeader(
            "Access-Control-Allow-Origin",
            origin
        );

        res.setHeader(
            "Access-Control-Allow-Credentials",
            "true"
        );

        res.setHeader(
            "Vary",
            "Origin"
        );
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,PUT,DELETE,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
}

async function routeRequest(req, res) {
    const parsedUrl = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
    );

    const pathname = parsedUrl.pathname;

    /*
     * Health endpoint
     */
    if (
        pathname === "/api/health" &&
        req.method === "GET"
    ) {
        let database = false;

        try {
            database = healthCheck();
        } catch (error) {
            console.error(
                "Database health check failed:",
                error
            );
        }

        return sendJson(res, database ? 200 : 503, {
            success: database,
            service: "VORTEX API",
            database,
            environment: NODE_ENV,
            timestamp: new Date().toISOString()
        });
    }

    /*
     * API information
     */
    if (
        pathname === "/api" &&
        req.method === "GET"
    ) {
        return sendJson(res, 200, {
            name: "VORTEX API",
            version: "1.0.0",
            status: "online"
        });
    }

    /*
     * Authentication
     */
    if (
        pathname.startsWith("/api/auth/") ||
        pathname === "/api/me"
    ) {
        const handled = await handleAuthRoute(
            req,
            res,
            pathname
        );

        if (handled !== false) {
            return;
        }
    }

    /*
     * Users
     */
    if (
        pathname.startsWith("/api/users/")
    ) {
        const handled = await handleUserRoute(
            req
