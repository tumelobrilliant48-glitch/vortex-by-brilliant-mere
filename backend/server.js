"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// DATABASE
// ===============================

const db = new Database("./database/socialbook.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,

    UNIQUE(user_id, post_id),

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(post_id)
    REFERENCES posts(id)
    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',

    UNIQUE(requester_id, receiver_id),

    FOREIGN KEY(requester_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(receiver_id)
    REFERENCES users(id)
    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(sender_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(receiver_id)
    REFERENCES users(id)
    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
  );
`);

// ===============================
// AUTH
// ===============================

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const likeRoutes = require("./routes/likes");
const friendRoutes = require("./routes/friends");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notifications");

app.use("/api/auth", authRoutes(db));
app.use("/api/users", userRoutes(db));
app.use("/api/posts", postRoutes(db));
app.use("/api/comments", commentRoutes(db));
app.use("/api/likes", likeRoutes(db));
app.use("/api/friends", friendRoutes(db));
app.use("/api/messages", messageRoutes(db));
app.use("/api/notifications", notificationRoutes(db));

// ===============================
// SERVE FRONTEND
// ===============================

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SocialBook backend is running",
    database: "connected"
  });
});

// ===============================
// 404
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });

});

// ===============================
// START
// ===============================

app.listen(PORT, () => {

  console.log(`
====================================
SOCIALBOOK BACKEND
====================================

Server:
http://localhost:${PORT}

API:
http://localhost:${PORT}/api/health

====================================
`);

});
