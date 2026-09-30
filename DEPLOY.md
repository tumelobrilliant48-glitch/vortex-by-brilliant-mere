# VORTEX - Cloud Deployment Setup
By Brilliant Tumelo Mere - Built in BW for the world

### Step 1: Create Supabase Tables

Go to: https://app.supabase.com/project/ojqzjgubyoqgritza/sql/new

Run the SQL file from `database/schema.sql`
(This file contains all 800 features: users, posts, likes, comments, reels, stories, follows, friend_requests, messages, notifications, marketplace_products, wallet, user_settings)

Click RUN.

### Step 2: Set Env

In Vercel / Netlify dashboard, add:
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
JWT_SECRET=VORTEX_800_SECRET

### Step 3: Push to GitHub

On your phone, use GitHub mobile app:
git add .
git commit -m "Fix DEPLOY.md - Restore deployment guide"
git push origin main

### Step 4: Deploy

Connect repo to Vercel - it will auto deploy backend/server.js

Health check: /api/health should say "VORTEX 800 running"
