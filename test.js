#!/usr/bin/env node
"use strict";

const http = require("http");

const BASE_URL = "http://localhost:3000";
const state = {
  token: null,
  userId: null,
  secondUserId: null,
  postId: null
};

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
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

    // Test 2: Signup primary user
    console.log("\n2️⃣  Testing signup for primary user...");
    const userSuffix = Date.now();
    res = await request("POST", "/api/auth/signup", {
      username: `vortex_test_${userSuffix}`,
      email: `test_${userSuffix}@vortex.app`,
      password: "Test123456",
      display_name: "Vortex Tester"
    });
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.user) {
      state.userId = res.body.user.id;
      state.token = res.body.token;
      console.log(`   User ID: ${res.body.user.id}`);
    } else if (res.body.message) {
      console.log(`   Message: ${res.body.message}`);
    }

    // Test 3: User profile fetch via token
    console.log("\n3️⃣  Testing authenticated profile fetch...");
    res = await request("GET", "/api/users/me", null, state.token);
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.user) {
      console.log(`   Profile user: ${res.body.user.username}`);
    }

    // Test 4: Create Post
    console.log("\n4️⃣  Testing post creation...");
    res = await request("POST", "/api/posts", {
      content: "Hello VORTEX! This is a test post. 🌌",
      media_url: "",
      media_type: "",
      visibility: "public"
    }, state.token);
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.post) {
      state.postId = res.body.post.id;
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
    res = await request("POST", `/api/posts/${state.postId}/like`, null, state.token);
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.likes) {
      console.log(`   Total likes: ${res.body.likes}`);
    }

    // Test 7: Create second user for messaging
    console.log("\n7️⃣  Creating second user for messaging...");
    const secondSuffix = Date.now() + 1;
    res = await request("POST", "/api/auth/signup", {
      username: `vortex_second_${secondSuffix}`,
      email: `second_${secondSuffix}@vortex.app`,
      password: "Test123456",
      display_name: "Vortex Friend"
    });
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.user) {
      state.secondUserId = res.body.user.id;
      console.log(`   Secondary user ID: ${res.body.user.id}`);
    }

    // Test 8: Send Message
    console.log("\n8️⃣  Testing send message...");
    res = await request("POST", "/api/messages", {
      receiver_id: state.secondUserId,
      content: "Test message from VORTEX!"
    }, state.token);
    console.log(`   Status: ${res.status}`, res.status === 201 ? "✅" : "❌");
    if (res.body.message) {
      console.log(`   Message ID: ${res.body.message.id}`);
    }

    // Test 9: Get Messages
    console.log("\n9️⃣  Testing fetch messages...");
    res = await request("GET", "/api/messages", null, state.token);
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");
    if (res.body.messages) {
      console.log(`   Messages found: ${res.body.messages.length}`);
    }

    // Test 10: Logout
    console.log("\n🔐 Testing logout...");
    res = await request("POST", "/api/auth/logout", null, state.token);
    console.log(`   Status: ${res.status}`, res.status === 200 ? "✅" : "❌");

    console.log("\n✅ All tests completed!\n");
  } catch (error) {
    console.error("\n❌ Test error:", error.message);
    process.exit(1);
  }
}

runTests();
