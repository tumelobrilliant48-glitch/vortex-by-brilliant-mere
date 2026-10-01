/* =========================================================
   VORTEX SOCIAL APP
   server.js
   Real Backend Foundation
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const SERVER_NAME = "VORTEX API";
const SERVER_VERSION = "1.0.0";


/* =========================================================
   SECURITY HEADERS
   ========================================================= */

function setSecurityHeaders(res) {

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
        "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
    );
}


/* =========================================================
   CORS
   ========================================================= */

function setCorsHeaders(res) {

    const origin = process.env.CLIENT_ORIGIN;

    if (origin) {

        res.setHeader(
            "Access-Control-Allow-Origin",
            origin
        );

        res.setHeader(
            "Access-Control-Allow-Credentials",
            "true"
        );
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
}


/* =========================================================
   COMMON HEADERS
   ========================================================= */

function prepareResponse(res) {

    setSecurityHeaders(res);
    setCorsHeaders(res);

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );
}


/* =========================================================
   JSON RESPONSE
   ========================================================= */

function sendJson(
    res,
    statusCode,
    data
) {

    prepareResponse(res);

    res.statusCode = statusCode;

    res.end(
        JSON.stringify(data)
    );
}


/* =========================================================
   REQUEST ID
   ========================================================= */

function createRequestId() {

    return crypto.randomUUID();
}


/* =========================================================
   REQUEST BODY
   ========================================================= */

function readBody(req) {

    return new Promise(
        (resolve, reject) => {

            let body = "";

            const MAX_BODY_SIZE =
                2 * 1024 * 1024;

            req.on(
                "data",
                chunk => {

                    body += chunk;

                    if (
                        Buffer.byteLength(body) >
                        MAX_BODY_SIZE
                    ) {

                        reject(
                            new Error(
                                "Request body too large."
                            )
                        );

                        req.destroy();
                    }
                }
            );

            req.on(
                "end",
                () => {

                    if (!body) {

                        resolve({});

                        return;
                    }

                    try {

                        resolve(
                            JSON.parse(body)
                        );

                    } catch {

                        reject(
                            new Error(
                                "Invalid JSON."
                            )
                        );
                    }
                }
            );

            req.on(
                "error",
                reject
            );
        }
    );
}


/* =========================================================
   ROUTER
