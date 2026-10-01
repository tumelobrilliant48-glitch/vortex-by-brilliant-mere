/* =========================================================
   VORTEX SOCIAL APP
   database.js
   Database Foundation
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

/* =========================================================
   DATABASE DIRECTORY
   ========================================================= */

const DATA_DIR = path.join(
    __dirname,
    "data"
);

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}


/* =========================================================
   DATABASE
   ========================================================= */

const DATABASE_FILE = path.join(
    DATA_DIR,
    "vortex.db"
);

const db = new Database(
    DATABASE_FILE
);


/* =========================================================
   DATABASE SETTINGS
   ========================================================= */

db.pragma("journal_mode = WAL");

db.pragma("foreign_keys = ON");

db.pragma("synchronous = NORMAL");


/* =========================================================
   USERS
   ========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS users (

        id TEXT PRIMARY KEY,

        username TEXT NOT NULL UNIQUE,

        email TEXT NOT NULL UNIQUE,

        password_hash TEXT NOT NULL,

        display_name TEXT NOT NULL,

        bio TEXT DEFAULT '',

        avatar_url TEXT DEFAULT '',

        cover_url TEXT DEFAULT '',

        verified INTEGER NOT NULL DEFAULT 0,

        is_admin INTEGER NOT NULL DEFAULT 0,

        is_active INTEGER NOT NULL DEFAULT 1,

        created_at TEXT NOT NULL,

        updated_at TEXT NOT NULL
    );
`);


/* =========================================================
   SESSIONS
   ========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (

        id TEXT PRIMARY KEY,

        user_id TEXT NOT NULL,

        expires_at TEXT NOT NULL,

        created_at TEXT NOT NULL,

        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE CASCADE
    );
`);


/* =========================================================
   POSTS
   ========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS posts (

        id TEXT PRIMARY KEY,

        user_id TEXT NOT NULL,

        content TEXT NOT NULL,

        media_url TEXT DEFAULT '',

        media_type TEXT DEFAULT '',

        visibility TEXT NOT NULL DEFAULT 'public',

        likes_count INTEGER NOT NULL DEFAULT 0,

        comments_count INTEGER NOT NULL DEFAULT 0,

        shares_count INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL,

        updated_at TEXT NOT NULL,

        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE CASCADE
    );
`);


/* =========================================================
   COMMENTS
   ========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS comments (

        id TEXT PRIMARY KEY,

        post_id TEXT NOT NULL,

        user_id TEXT NOT NULL
