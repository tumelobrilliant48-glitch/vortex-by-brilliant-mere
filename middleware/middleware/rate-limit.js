"use strict";

const buckets = new Map();

const WINDOW_MS = Number(
    process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);

const MAX_REQUESTS = Number(
    process.env.RATE_LIMIT_MAX_REQUESTS || 300
);

function getClientKey(req) {
    // Prefer the direct socket address.
    // If VORTEX is later placed behind a trusted reverse proxy,
    // this can be adapted to use the proxy's trusted client IP.
    return (
        req.socket?.remoteAddress ||
        "unknown-client"
    );
}

function rateLimit(options = {}) {
    const windowMs = Number(
        options.windowMs || WINDOW_MS
    );

    const maxRequests = Number(
        options.maxRequests || MAX_REQUESTS
    );

    return function checkRateLimit(req, res) {
        const key = getClientKey(req);
        const now = Date.now();

        let bucket = buckets.get(key);

        if (!bucket || now >= bucket.resetAt) {
            bucket = {
                count: 0,
                resetAt: now + windowMs
            };

            buckets.set(key, bucket);
        }

        bucket.count += 1;

        const remaining = Math.max(
            maxRequests - bucket.count,
            0
        );

        const retryAfter = Math.ceil(
            Math.max(bucket.resetAt - now, 0) / 1000
        );

        res.setHeader(
            "X-RateLimit-Limit",
            String(maxRequests)
        );

        res.setHeader(
            "X-RateLimit-Remaining",
            String(remaining)
        );

        res.setHeader(
            "X-RateLimit-Reset",
            String(Math.ceil(bucket.resetAt / 1000))
        );

        if (bucket.count > maxRequests) {
            res.setHeader(
                "Retry-After",
                String(retryAfter)
            );

            res.writeHead(429, {
                "Content-Type":
                    "application/json; charset=utf-8",
                "Cache-Control": "no-store"
            });

            res.end(
                JSON.stringify({
                    error: "RATE_LIMITED",
                    message:
                        "Too many requests. Please try again later.",
                    retryAfter
                })
            );

            return false;
        }

        return true;
    };
}

function cleanupRateLimitBuckets() {
    const now = Date.now();

    for (const [key, bucket] of buckets) {
        if (now >= bucket.resetAt) {
            buckets.delete(key);
        }
    }
}

const cleanupTimer = setInterval(
    cleanupRateLimitBuckets,
    60 * 1000
);

cleanupTimer.unref();

function clearRateLimitBuckets() {
    buckets.clear();
}

module.exports = {
    rateLimit,
    cleanupRateLimitBuckets,
    clearRateLimitBuckets
};
