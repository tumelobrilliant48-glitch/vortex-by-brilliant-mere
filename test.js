#!/usr/bin/env node
"use strict";

/**
 * VORTEX Test Suite
 * Test all core API endpoints
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("\n🚀 VORTEX API Test Suite\n");

  try {
    // Test 1: Health Check
    console.log("1️⃣  Testing health endpoint...");
    let res = await request("GET", "/api/health");
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");

    // Test 2: Signup
    console.log("\n2️⃣  Testing signup...");
    res = await request("POST", "/api/auth/signup", {
      username: "vortex_test",
      email: "test@vortex.app",
      password: "Test123456",
      display_name: "Vortex Tester"
    });
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.user) {
      console.log(`   User ID: ${res.body.user.id}`);
    } else if (res.body.message) {
      console.log(`   Message: ${res.body.message}`);
    }

    // Test 3: Login
    console.log("\n3️⃣  Testing login...");
    res = await request("POST", "/api/auth/login", {
      email: "test@vortex.app",
      password: "Test123456"
    });
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.user) {
      console.log(`   Logged in as: ${res.body.user.username}`);
    }

    // Test 4: Create Post
    console.log("\n4️⃣  Testing post creation...");
    res = await request("POST", "/api/posts", {
      user_id: 1,
      content: "Hello VORTEX! This is a test post. 🌌",
      media_url: "",
      visibility: "public"
    });
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.post) {
      console.log(`   Post ID: ${res.body.post.id}`);
    } else if (res.body.message) {
      console.log(`   Message: ${res.body.message}`);
    }

    // Test 5: Get Posts
    console.log("\n5️⃣  Testing fetch posts...");
    res = await request("GET", "/api/posts");
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.posts) {
      console.log(`   Posts found: ${res.body.posts.length}`);
    }

    // Test 6: Like Post
    console.log("\n6️⃣  Testing like post...");
    res = await request("POST", "/api/posts/1/like", {
      user_id: 1
    });
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.likes) {
      console.log(`   Total likes: ${res.body.likes}`);
    }

    // Test 7: Send Message
    console.log("\n7️⃣  Testing send message...");
    res = await request("POST", "/api/messages", {
      sender_id: 1,
      receiver_id: 1,
      content: "Test message from VORTEX!"
    });
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.message) {
      console.log(`   Message ID: ${res.body.message.id}`);
    }

    // Test 8: Get Messages
    console.log("\n8️⃣  Testing fetch messages...");
    res = await request("GET", "/api/messages?user_id=1");
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.messages) {
      console.log(`   Messages found: ${res.body.messages.length}`);
    }

    console.log("\n✅ All tests completed!\n");
  } catch (error) {
    console.error("\n❌ Test error:", error.message);
    process.exit(1);
  }
}

runTests();
