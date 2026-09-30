"use strict";

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databaseFolder = __dirname;

if (!fs.existsSync(databaseFolder)) {
  fs.mkdirSync(databaseFolder, { recursive: true });
}

const dbPath = path.join(databaseFolder, "socialbook.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ========================================
// USERS
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    verified INTEGER DEFAULT 0,
    online INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ========================================
// POSTS
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    media_type TEXT DEFAULT '',
    visibility TEXT DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
`);

// ========================================
// COMMENTS
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (parent_id)
        REFERENCES comments(id)
        ON DELETE CASCADE
);
`);

// ========================================
// LIKES
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reaction TEXT DEFAULT 'like',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
`);

// ========================================
// FOLLOWS
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id),
    FOREIGN KEY (follower_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (following_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
`);

// ========================================
// STORIES
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    caption TEXT DEFAULT '',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
`);

// ========================================
// MESSAGES
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    media_url TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
`);

// ========================================
// NOTIFICATIONS
// ========================================

db.exec(`
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sender_id INTEGER DEFAULT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    target_id INTEGER DEFAULT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);
`);

// ========================================
// INDEXES
// ========================================

db.exec(`
CREATE INDEX IF NOT EXISTS idx_posts_user
ON posts(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created
ON posts(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_post
ON comments(post_id);

CREATE INDEX IF NOT EXISTS idx_likes_post
ON likes(post_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower
ON follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following
ON follows(following_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver
ON messages(receiver_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_stories_user
ON stories(user_id);
`);

console.log("[VORTEX] Database initialized at", dbPath);

module.exports = db;
