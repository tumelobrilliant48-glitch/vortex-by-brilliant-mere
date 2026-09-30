"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not set in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VORTEX backend is running",
    database: "Supabase connected"
  });
});

// ========================================
// AUTH - SIGNUP
// ========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`username.eq.${normalizedUsername},email.eq.${normalizedEmail}`)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "That email or username is already in use."
      });
    }

    // Create user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: normalizedUsername,
          email: normalizedEmail,
          password_hash: hashPassword(password),
          display_name: displayName,
          bio: "",
          avatar_url: "",
          cover_url: "",
          location: "",
          website: "",
          verified: false,
          online: true
        }
      ])
      .select();

    if (error) {
      console.error("Signup error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to create account."
      });
    }

    const user = data[0];
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

// ========================================
// AUTH - LOGIN
// ========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const identity = String(email || username || "").trim();

    if (!identity || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or username and password are required."
      });
    }

    let query;
    if (email) {
      query = supabase
        .from("users")
        .select("*")
        .eq("email", identity.toLowerCase())
        .single();
    } else {
      query = supabase
        .from("users")
        .select("*")
        .eq("username", identity)
        .single();
    }

    const { data: user, error } = await query;

    if (error || !user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    // Update online status
    await supabase
      .from("users")
      .update({ online: true })
      .eq("id", user.id);

    return res.json({
      success: true,
      user: safeUser(user),
      message: "Logged in successfully."
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log in."
    });
  }
});

// ========================================
// USERS
// ========================================

app.get("/api/users/me", async (req, res) => {
  try {
    const username = String(req.query.username || "").trim();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required."
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user."
    });
  }
});

// ========================================
// POSTS
// ========================================

app.get("/api/posts", async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*, users(username, display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Get posts error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch posts."
      });
    }

    return res.json({ success: true, posts });
  } catch (error) {
    console.error("Get posts error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch posts."
    });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const { user_id, content, media_url, media_type = "", visibility = "public" } = req.body || {};

    if (!Number.isInteger(Number(user_id)) || !content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        message: "A numeric user_id and non-empty content are required."
      });
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: Number(user_id),
          content: String(content).trim(),
          media_url: media_url || "",
          media_type: media_type,
          visibility: visibility
        }
      ])
      .select("*, users(username, display_name, avatar_url)");

    if (error) {
      console.error("Post create error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to create post."
      });
    }

    const post = data[0];
    return res.status(201).json({ success: true, post });
  } catch (error) {
    console.error("Post create error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create post."
    });
  }
});

app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { user_id } = req.body || {};
    const postId = Number(req.params.id);
    const userId = Number(user_id);

    if (!Number.isInteger(postId) || !Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Numeric post and user IDs are required."
      });
    }

    await supabase
      .from("likes")
      .insert([{ post_id: postId, user_id: userId, reaction: "like" }])
      .select();

    const { data: likes, error } = await supabase
      .from("likes")
      .select("id", { count: "exact" })
      .eq("post_id", postId);

    if (error) {
      console.error("Like error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to like post."
      });
    }

    return res.json({ success: true, likes: likes ? likes.length : 0 });
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to like post."
    });
  }
});

// ========================================
// MESSAGES
// ========================================

app.get("/api/messages", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "A numeric user_id is required."
      });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch messages."
      });
    }

    return res.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch messages."
    });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body || {};
    const senderId = Number(sender_id);
    const receiverId = Number(receiver_id);

    if (!Number.isInteger(senderId) || !Number.isInteger(receiverId) || !String(content || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Numeric sender_id, receiver_id, and non-empty content are required."
      });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content: String(content).trim(),
          message_type: "text",
          media_url: "",
          is_read: false
        }
      ])
      .select();

    if (error) {
      console.error("Message create error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to send message."
      });
    }

    const message = data[0];
    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Message create error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send message."
    });
  }
});

// ========================================
// NOTIFICATIONS
// ========================================

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "A numeric user_id is required."
      });
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Get notifications error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch notifications."
      });
    }

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications."
    });
  }
});

// ========================================
// STATIC FILES & FALLBACK
// ========================================

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
  console.log(`Supabase: ${supabaseUrl}`);
});
