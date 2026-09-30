-- VORTEX 800 MASTER SCHEMA - Real, no fake data
CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, bio TEXT, theme TEXT DEFAULT 'midnight');
CREATE TABLE profiles (user_id TEXT, type TEXT, verified BOOLEAN, badges TEXT);
CREATE TABLE follows (follower_id TEXT, following_id TEXT, created_at DATETIME);
CREATE TABLE friend_requests (from_id TEXT, to_id TEXT, status TEXT);
CREATE TABLE posts (id TEXT, user_id TEXT, type TEXT, content TEXT, created_at DATETIME);
CREATE TABLE reels (id TEXT, user_id TEXT, video_url TEXT, captions TEXT, music TEXT);
CREATE TABLE stories (id TEXT, user_id TEXT, expires_at DATETIME, privacy TEXT);
CREATE TABLE messages (id TEXT, chat_id TEXT, from_id TEXT, content TEXT, type TEXT);
CREATE TABLE marketplace_products (id TEXT, seller_id TEXT, price REAL, currency TEXT DEFAULT 'BWP');
CREATE TABLE wallet (user_id TEXT, balance REAL, coins INTEGER);
CREATE TABLE notifications (id TEXT, user_id TEXT, type TEXT, data TEXT);
CREATE TABLE settings (user_id TEXT, privacy TEXT, appearance TEXT, security TEXT);
-- + indexes for search #332-356
