"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const db = require("../database/database.js");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const hashPassword = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const safeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...publicUser } = user;
  return publicUser;
};

const findUserByEmail = (email) =>
  db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").get(email);

const findUserByUsername = (username) =>
  db.prepare("SELECT * FROM users WHERE username = ? LIMIT 1").get(username);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VORTEX backend is running",
    database: "connected"
  });
});

app.post("/api/auth/signup", (req, res) => {
  const { username, email, password, display_name } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, email, and password are required."
    });
  }

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const displayName = String(display_name || normalizedUsername).trim();

  if (normalizedUsername.length < 3 || normalizedEmail.length < 5 || String(password).length < 6) {
    return res.status(400).json({
      success: false,
      message: "Username must be at least 3 characters and password at least 6 characters."
    });
  }

  if (findUserByEmail(normalizedEmail) || findUserByUsername(normalizedUsername)) {
    return res.status(409).json({
      success: false,
      message: "That email or username is already in use."
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO users (
        username, email, password_hash, display_name,
        bio, avatar_url, cover_url, location, website, verified, online
      ) VALUES (?, ?, ?, ?, '', '', '', '', '', 0, 1)
    `).run(
      normalizedUsername,
      normalizedEmail,
      hashPassword(password),
      displayName
    );

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      user: safeUser(user),
      message: "Account created successfully."
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create account."
    });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, username, password } = req.body || {};
  const identity = String(email || username || "").trim();

  if (!identity || !password) {
    return res.status(400).json({
      success: false,
      message: "Email or username and password are required."
    });
  }

  const user = email
    ? findUserByEmail(identity.toLowerCase())
    : findUserByUsername(identity);

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials."
    });
  }

  db.prepare("UPDATE users SET online = 1 WHERE id = ?").run(user.id);

  return res.json({
    success: true,
    user: safeUser(user),
    message: "Logged in successfully."
  });
});

app.get("/api/users/me", (req, res) => {
  const username = String(req.query.username || "").trim();
  const user = username ? findUserByUsername(username) : null;

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found."
    });
  }

  return res.json({ success: true, user: safeUser(user) });
});

app.get("/api/posts", (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_url
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT 50
  `).all();

  return res.json({ success: true, posts });
});

app.post("/api/posts", (req, res) => {
  const { user_id, content, media_url, media_type = "", visibility = "public" } = req.body || {};

  if (!Number.isInteger(Number(user_id)) || !content || !String(content).trim()) {
    return res.status(400).json({
      success: false,
      message: "A numeric user_id and non-empty content are required."
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO posts (user_id, content, media_url, media_type, visibility)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      Number(user_id),
      String(content).trim(),
      media_url || "",
      media_type,
      visibility
    );

    const post = db.prepare(`
      SELECT p.*, u.username, u.display_name, u.avatar_url
      FROM posts p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({ success: true, post });
  } catch (error) {
    console.error("Post create error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create post."
    });
  }
});

app.post("/api/posts/:id/like", (req, res) => {
  const { user_id } = req.body || {};
  const postId = Number(req.params.id);
  const userId = Number(user_id);

  if (!Number.isInteger(postId) || !Number.isInteger(userId)) {
    return res.status(400).json({
      success: false,
      message: "Numeric post and user IDs are required."
    });
  }

  try {
    db.prepare(`
      INSERT OR IGNORE INTO likes (post_id, user_id, reaction)
      VALUES (?, ?, 'like')
    `).run(postId, userId);

    const likes = db.prepare(
      "SELECT COUNT(*) AS total FROM likes WHERE post_id = ?"
    ).get(postId);

    return res.json({ success: true, likes: Number(likes.total) });
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to like post."
    });
  }
});

app.get("/api/messages", (req, res) => {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      success: false,
      message: "A numeric user_id is required."
    });
  }

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(userId, userId);

  return res.json({ success: true, messages });
});

app.post("/api/messages", (req, res) => {
  const { sender_id, receiver_id, content } = req.body || {};
  const senderId = Number(sender_id);
  const receiverId = Number(receiver_id);

  if (!Number.isInteger(senderId) || !Number.isInteger(receiverId) || !String(content || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "Numeric sender_id, receiver_id, and non-empty content are required."
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, message_type, media_url, is_read)
      VALUES (?, ?, ?, 'text', '', 0)
    `).run(senderId, receiverId, String(content).trim());

    const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Message create error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send message."
    });
  }
});

app.get("/api/notifications", (req, res) => {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      success: false,
      message: "A numeric user_id is required."
    });
  }

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(userId);

  return res.json({ success: true, notifications });
});

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

app.listen(PORT, () => {
  console.log(`VORTEX backend running at http://localhost:${PORT}`);
  console.log("Created by Brilliant Tumelo Mere — Connect · Create · Discover");
});
