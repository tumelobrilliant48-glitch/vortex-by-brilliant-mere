"use strict";

const { randomUUID } = require("node:crypto");
const { saveBuffer, isAllowedMimeType, getMaxFileSize } = require("../storage");
const { db } = require("../database");
const { requireAuth } = require("../middleware/auth");

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify(data));
}

function readBinaryBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalSize = 0;
        let finished = false;

        req.on("data", chunk => {
            if (finished) return;

            totalSize += chunk.length;

            if (totalSize > getMaxFileSize()) {
                finished = true;

                const error = new Error(
                    "FILE_SIZE_LIMIT_EXCEEDED"
                );

                error.statusCode = 413;

                reject(error);
                req.destroy();
                return;
            }

            chunks.push(chunk);
        });

        req.on("end", () => {
            if (finished) return;

            finished = true;
            resolve(Buffer.concat(chunks));
        });

        req.on("error", error => {
            if (finished) return;

            finished = true;
            reject(error);
        });
    });
}

function getMimeType(req) {
    const contentType =
        req.headers["content-type"] || "";

    return contentType
        .split(";")[0]
        .trim()
        .toLowerCase();
}

function getMediaKind(mimeType) {
    if (mimeType.startsWith("image/")) {
        return "image";
    }

    if (mimeType.startsWith("video/")) {
        return "video";
    }

    if (mimeType.startsWith("audio/")) {
        return "audio";
    }

    return null;
}

function createMediaRecord({
    id,
    userId,
    storage,
    kind
}) {
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO media (
            id,
            user_id,
            type,
            mime_type,
            storage_path,
            url,
            size,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        userId,
        kind,
        storage.mimeType,
        storage.relativePath,
        storage.url,
        storage.size,
        now
    );

    return {
        id,
        type: kind,
        mimeType: storage.mimeType,
        url: storage.url,
        size: storage.size,
        createdAt: now
    };
}

async function handleUpload(req, res) {
    const user = requireAuth(req, res);

    if (!user) return;

    const mimeType = getMimeType(req);
    const kind = getMediaKind(mimeType);

    if (!kind || !isAllowedMimeType(mimeType)) {
        return sendJson(res, 415, {
            error: "UNSUPPORTED_MEDIA_TYPE",
            message:
                "VORTEX does not support this media type."
        });
    }

    try {
        const buffer = await readBinaryBody(req);

        if (!buffer.length) {
            return sendJson(res, 400, {
                error: "EMPTY_FILE"
            });
        }

        const storage = await saveBuffer(
            buffer,
            mimeType
        );

        const mediaId = randomUUID();

        const media = createMediaRecord({
            id: mediaId,
            userId: user.id,
            storage,
            kind
        });

        return sendJson(res, 201, {
            success: true,
            media
        });
    } catch (error) {
        console.error(
            "VORTEX media upload failed:",
            error
        );

        if (
            error.message ===
            "FILE_SIZE_LIMIT_EXCEEDED"
        ) {
            return sendJson(res, 413, {
                error: "FILE_SIZE_LIMIT_EXCEEDED",
                maxBytes: getMaxFileSize()
            });
        }

        if (
            error.message ===
            "UNSUPPORTED_FILE_TYPE"
        ) {
            return sendJson(res, 415, {
                error: "UNSUPPORTED_MEDIA_TYPE"
            });
        }

        return sendJson(res, 500, {
            error: "MEDIA_UPLOAD_FAILED"
        });
    }
}

function handleGetMedia(req, res, mediaId) {
    const media = db.prepare(`
        SELECT
            id,
            user_id,
            type,
            mime_type,
            url,
            size,
            created_at
        FROM media
        WHERE id = ?
        LIMIT 1
    `).get(mediaId);

    if (!media) {
        return sendJson(res, 404, {
            error: "MEDIA_NOT_FOUND"
        });
    }

    return sendJson(res, 200, {
        media: {
            id: media.id,
            type: media.type,
            mimeType: media.mime_type,
            url: media.url,
            size: media.size,
            createdAt: media.created_at
        }
    });
}

function handleMediaRoute(req, res, pathname) {
    const parts = pathname
        .split("/")
        .filter(Boolean);

    /*
        POST /api/media/upload
        GET  /api/media/:id
    */

    if (
        pathname === "/api/media/upload" &&
        req.method === "POST"
    ) {
        return handleUpload(req, res);
    }

    if (
        parts.length === 3 &&
        parts[0] === "api" &&
        parts[1] === "media" &&
        req.method === "GET"
    ) {
        const mediaId =
            decodeURIComponent(parts[2]);

        return handleGetMedia(
            req,
            res,
            mediaId
        );
    }

    return false;
}

module.exports = {
    handleMediaRoute
};
