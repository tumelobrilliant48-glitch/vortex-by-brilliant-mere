/* =========================================================
   VORTEX SOCIAL APP
   routes/auth.js
   Authentication API Routes
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const {
    register,
    login,
    createSession,
    getSession,
    deleteSession
} = require("../auth-server");

const SESSION_COOKIE = "vortex_session";

const COOKIE_MAX_AGE =
    7 * 24 * 60 * 60;


/* =========================================================
   COOKIE HELPERS
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

            const separator =
                part.indexOf("=");

            if (separator === -1) {
                return;
            }

            const key =
                part
                    .slice(0, separator)
                    .trim();

            const value =
                part
                    .slice(separator + 1)
                    .trim();

            cookies[key] =
                decodeURIComponent(value);
        }
    );

    return cookies;
}


function setSessionCookie(
    res,
    sessionId
) {

    const cookie = [
        `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
        "Path=/",
        `Max-Age=${COOKIE_MAX_AGE}`,
        "HttpOnly",
        "SameSite=Lax"
    ];

    /*
       In production HTTPS, enable Secure.
       This can be controlled through the environment.
    */

    if (
        process.env.NODE_ENV ===
        "production"
    ) {
        cookie.push("Secure");
    }

    res.setHeader(
        "Set-Cookie",
        cookie.join("; ")
    );
}


function clearSessionCookie(res) {

    const cookie = [
        `${SESSION_COOKIE}=`,
        "Path=/",
        "Max-Age=0",
        "HttpOnly",
        "SameSite=Lax"
    ];

    if (
        process.env.NODE_ENV ===
        "production"
    ) {
        cookie.push("Secure");
    }

    res.setHeader(
        "Set-Cookie",
        cookie.join("; ")
    );
}


/* =========================================================
   RESPONSE
   ========================================================= */

function sendJson(
    res,
    status,
    data
) {

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
   REGISTER
   ========================================================= */

async function handleRegister(
    req,
    res
) {

    try {

        const result =
            await register(
                req.body
            );

        const session =
            createSession(
                result.user.id
            );

        setSessionCookie(
            res,
            session.id
        );

        sendJson(
            res,
            201,
            {
                success: true,

                message:
                    "VORTEX account created successfully.",

                user:
                    result.user
            }
        );

    } catch (error) {

        sendJson(
            res,
            400,
            {
                success: false,

                code:
                    "REGISTRATION_FAILED",

                message:
                    error.message
            }
        );
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(
    req,
    res
) {

    try {

        const result =
            await login(
                req.body
            );

        const session =
            createSession(
                result.user.id
            );

        setSessionCookie(
            res,
            session.id
        );

        sendJson(
            res,
            200,
            {
                success: true,

                message:
                    "Welcome back to VORTEX.",

                user:
                    result.user
            }
        );

    } catch (error) {

        sendJson(
            res,
            401,
            {
                success: false,

                code:
                    "LOGIN_FAILED",

                message:
                    "Invalid email or password."
            }
        );
    }
}


/* =========================================================
   CURRENT USER
   ========================================================= */

function handleMe(
    req,
    res
) {

    const cookies =
        parseCookies(req);

    const sessionId =
        cookies[SESSION_COOKIE];

    const authentication =
        getSession(sessionId);

    if (!authentication) {

        sendJson(
            res,
            401,
            {
                success: false,

                authenticated: false,

                message:
                    "You are not authenticated."
            }
        );

        return;
    }

    sendJson(
        res,
        200,
        {
            success: true,

            authenticated: true,

            user:
                authentication.user
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function handleLogout(
    req,
    res
) {

    const cookies =
        parseCookies(req);

    const sessionId =
        cookies[SESSION_COOKIE];

    if (sessionId) {

        deleteSession(
            sessionId
        );
    }

    clearSessionCookie(res);

    sendJson(
        res,
        200,
        {
            success: true,

            message:
                "You have been signed out of VORTEX."
        }
    );
}


/* =========================================================
   ROUTER
   ========================================================= */

async function handleAuthRoute(
    req,
    res,
    pathname
) {

    if (
        req.method === "POST" &&
        pathname === "/api/auth/register"
    ) {

        await handleRegister(
            req,
            res
        );

        return true;
    }


    if (
        req.method === "POST" &&
        pathname === "/api/auth/login"
    ) {

        await handleLogin(
            req,
            res
        );

        return true;
    }


    if (
        req.method === "POST" &&
        pathname === "/api/auth/logout"
    ) {

        handleLogout(
            req,
            res
        );

        return true;
    }


    if (
        req.method === "GET" &&
        pathname === "/api/me"
    ) {

        handleMe(
            req,
            res
        );

        return true;
    }


    return false;
}


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
    handleAuthRoute,
    parseCookies
};
