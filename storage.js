"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT_DIR = path.resolve(
    process.env.UPLOAD_DIR || "./uploads"
);

const MAX_FILE_SIZE = Number(
    process.env.MAX_UPLOAD_SIZE || 100 * 1024 * 1024
);

const ALLOWED_TYPES = {
    image: new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ]),

    video: new Set([
        "video/mp4",
        "video/webm",
        "video/quicktime"
    ]),

    audio: new Set([
        "audio/mpeg",
        "audio/mp4",
        "audio/wav",
        "audio/ogg",
        "audio/webm"
    ])
};

const EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",

    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",

    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/webm": ".webm"
};

async function initializeStorage() {
    await fsp.mkdir(ROOT_DIR, {
        recursive: true
    });

    await Promise.all([
        fsp.mkdir(
            path.join(ROOT_DIR, "images"),
            { recursive: true }
        ),

        fsp.mkdir(
            path.join(ROOT_DIR, "videos"),
            { recursive: true }
        ),

        fsp.mkdir(
            path.join(ROOT_DIR, "audio"),
            { recursive: true }
        ),

        fsp.mkdir(
            path.join(ROOT_DIR, "avatars"),
            { recursive: true }
        ),

        fsp.mkdir(
            path.join(ROOT_DIR, "covers"),
            { recursive: true }
        ),

        fsp.mkdir(
            path.join(ROOT_DIR, "temp"),
            { recursive: true }
        )
    ]);
}

function getMediaCategory(mimeType) {
    for (const [category, types] of Object.entries(
        ALLOWED_TYPES
    )) {
        if (types.has(mimeType)) {
            return category;
        }
    }

    return null;
}

function isAllowedMimeType(mimeType) {
    return Boolean(
        getMediaCategory(mimeType)
    );
}

function getExtension(mimeType) {
    return EXTENSIONS[mimeType] || "";
}

function createSafeFilename(mimeType) {
    const extension = getExtension(mimeType);

    if (!extension) {
        throw new Error(
            "UNSUPPORTED_FILE_TYPE"
        );
    }

    return (
        crypto.randomUUID() +
        extension
    );
}

function sanitizeUserPath(value) {
    if (!value) {
        throw new Error("INVALID_STORAGE_PATH");
    }

    const normalized = path.normalize(value);

    if (
        normalized.includes("..") ||
        path.isAbsolute(normalized)
    ) {
        throw new Error("INVALID_STORAGE_PATH");
    }

    return normalized;
}

function getFilePath(relativePath) {
    const safePath =
        sanitizeUserPath(relativePath);

    const fullPath = path.resolve(
        ROOT_DIR,
        safePath
    );

    if (
        fullPath !== ROOT_DIR &&
        !fullPath.startsWith(
            ROOT_DIR + path.sep
        )
    ) {
        throw new Error(
            "INVALID_STORAGE_PATH"
        );
    }

    return fullPath;
}

async function saveBuffer(
    buffer,
    mimeType,
    options = {}
) {
    if (!Buffer.isBuffer(buffer)) {
        throw new TypeError(
            "FILE_DATA_MUST_BE_BUFFER"
        );
    }

    if (
        buffer.length <= 0 ||
        buffer.length > MAX_FILE_SIZE
    ) {
        throw new Error(
            "FILE_SIZE_LIMIT_EXCEEDED"
        );
    }

    if (!isAllowedMimeType(mimeType)) {
        throw new Error(
            "UNSUPPORTED_FILE_TYPE"
        );
    }

    const category =
        options.category ||
        getMediaCategory(mimeType);

    const filename =
        createSafeFilename(mimeType);

    const relativePath =
        path.join(
            category + "s",
            filename
        );

    const fullPath =
        getFilePath(relativePath);

    await fsp.mkdir(
        path.dirname(fullPath),
        { recursive: true }
    );

    await fsp.writeFile(
        fullPath,
        buffer,
        {
            flag: "wx"
        }
    );

    return {
        filename,
        mimeType,
        size: buffer.length,
        category,
        relativePath: relativePath
            .split(path.sep)
            .join("/"),
        url:
            "/uploads/" +
            relativePath
                .split(path.sep)
                .join("/")
    };
}

async function saveAvatar(
    buffer,
    mimeType
) {
    return saveBuffer(
        buffer,
        mimeType,
        {
            category: "avatar"
        }
    );
}

async function saveCover(
    buffer,
    mimeType
) {
    return saveBuffer(
        buffer,
        mimeType,
        {
            category: "cover"
        }
    );
}

async function saveImage(
    buffer,
    mimeType
) {
    return saveBuffer(
        buffer,
        mimeType,
        {
            category: "image"
        }
    );
}

async function saveVideo(
    buffer,
    mimeType
) {
    return saveBuffer(
        buffer,
        mimeType,
        {
            category: "video"
        }
    );
}

async function saveAudio(
    buffer,
    mimeType
) {
    return saveBuffer(
        buffer,
        mimeType,
        {
            category: "audio"
        }
    );
}

async function fileExists(
    relativePath
) {
    try {
        const fullPath =
            getFilePath(relativePath);

        await fsp.access(
            fullPath,
            fs.constants.F_OK
        );

        return true;
    } catch {
        return false;
    }
}

async function deleteFile(
    relativePath
) {
    const fullPath =
        getFilePath(relativePath);

    try {
        await fsp.unlink(fullPath);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }

        throw error;
    }
}

async function getFileInfo(
    relativePath
) {
    const fullPath =
        getFilePath(relativePath);

    const stats =
        await fsp.stat(fullPath);

    return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile()
    };
}

function getStorageRoot() {
    return ROOT_DIR;
}

function getMaxFileSize() {
    return MAX_FILE_SIZE;
}

module.exports = {
    initializeStorage,

    saveBuffer,
    saveAvatar,
    saveCover,
    saveImage,
    saveVideo,
    saveAudio,

    deleteFile,
    fileExists,
    getFileInfo,

    getMediaCategory,
    isAllowedMimeType,
    getExtension,

    getStorageRoot,
    getMaxFileSize
};
