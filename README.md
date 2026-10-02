VORTEX

Connect. Create. Discover.

VORTEX Social Media App
Created by Brilliant Tumelo Mere

---

About VORTEX

VORTEX is a next-generation social platform designed as more than a traditional social-media app.

VORTEX brings social networking, short-form video, communities, messaging, media sharing, profiles, discovery, marketplace features, creator tools, and future services into one connected platform.

The vision is to build a social universe where people can:

- Connect with people
- Create and share content
- Discover videos and posts
- Follow creators
- Build communities
- Send messages
- Share photos and videos
- Save private content
- Discover products
- Build a profile and identity
- Participate in the VORTEX ecosystem

---

Tagline

«Connect. Create. Discover.»

---

Project Vision

VORTEX is being developed as a scalable platform rather than a simple social-media clone.

The initial goal is to establish a reliable foundation for:

1. User accounts
2. Secure authentication
3. User profiles
4. Social connections
5. Posts
6. Comments
7. Likes
8. Notifications
9. Media uploads
10. Search
11. Messaging
12. Reels
13. Communities
14. Marketplace
15. Creator features
16. Premium features
17. Analytics
18. Future VORTEX services

---

Current Architecture

VORTEX/
│
├── index.html
├── style.css
├── app.js
├── manifest.json
├── sw.js
│
├── server.js
├── package.json
├── .env
├── .env.example
├── database.js
├── auth-server.js
├── storage.js
│
├── middleware/
│   ├── auth.js
│   └── rate-limit.js
│
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   ├── follows.js
│   ├── notifications.js
│   └── media.js
│
├── data/
│   └── vortex.db
│
└── uploads/
    ├── images/
    ├── videos/
    ├── audio/
    ├── avatars/
    └── covers/

---

Core Backend

The VORTEX backend is responsible for:

- Authentication
- Sessions
- User accounts
- Profiles
- Posts
- Comments
- Likes
- Followers
- Following
- Notifications
- Media storage
- API communication
- Database persistence
- Rate limiting
- Security controls

---

Authentication

VORTEX supports the foundation for:

- Account registration
- Login
- Logout
- Session management
- Current-user detection
- Protected API operations
- Profile ownership

Authentication must be treated as a security-critical part of the platform.

---

Profiles

Every VORTEX user can have:

- Username
- Display name
- Biography
- Profile picture
- Cover image
- Verification status
- Followers
- Following
- Posts

Future profile features can include:

- Profile themes
- Social links
- Creator information
- Badges
- Achievements
- Custom profile decoration

---

Posts

The VORTEX post system supports:

- Text posts
- Media posts
- Public posts
- Followers-only posts
- Private posts
- Likes
- Comments
- Post deletion
- Feed retrieval

Future post features can include:

- Reposts
- Saves
- Polls
- Hashtags
- Mentions
- Location
- Music
- Stories
- Multiple media
- Post editing

---

Comments

Users can:

- Create comments
- Read comments
- Delete their own comments

Future features can include:

- Comment replies
- Comment likes
- Comment mentions
- Comment sorting
- Comment moderation
- Pinned comments

---

Social Graph

VORTEX includes the foundation for:

- Follow users
- Unfollow users
- Check follow status
- View followers
- View following
- Track follower counts
- Track following counts

---

Notifications

The notification system supports:

- Follow notifications
- Read/unread state
- Unread notification count
- Mark notification as read
- Mark all notifications as read
- Delete notifications

Future notification types can include:

- Likes
- Comments
- Mentions
- Reposts
- Messages
- Marketplace activity
- Creator activity
- System notifications

---

Media

VORTEX includes a storage layer for:

- Images
- Videos
- Audio
- Avatars
- Cover images

Media files are stored separately from the database while the database stores their metadata.

---

Security

Security is a core part of VORTEX development.

The project includes foundations for:

- Authentication
- Session management
- HTTP security headers
- Request limits
- Upload size limits
- Allowed media types
- Safe generated filenames
- Protected user operations
- Environment configuration

Real production deployment will require additional security review, HTTPS, secure secrets, monitoring, backups, abuse prevention, and infrastructure hardening.

---

User Interface

The VORTEX interface is designed around a premium dark visual identity.

The planned interface includes:

- Dark mode
- VORTEX eye identity
- Neon-inspired visual elements
- Home feed
- Stories
- Reels
- Create
- Messages
- Vault
- Search
- Profiles
- Notifications
- Marketplace
- Settings

The interface should remain responsive across:

- Android
- iPhone
- Tablet
- Desktop
- Web browsers

---

Planned VORTEX Features

The platform can eventually expand into:

Social

- Posts
- Stories
- Reels
- Likes
- Comments
- Shares
- Saves
- Reposts
- Followers
- Communities

Communication

- Direct messages
- Group chats
- Voice communication
- Media sharing
- Chat customization

Discovery

- Search
- Explore
- Trending content
- Creator discovery
- User discovery
- Hashtags

Creator Ecosystem

- Creator profiles
- Creator analytics
- Content statistics
- Monetization
- Premium content
- Creator dashboard

Marketplace

- Product listings
- Buyer profiles
- Seller profiles
- Product discovery
- Orders
- Seller tools

Personalization

- Themes
- Profile customization
- Chat appearance
- Camera effects
- Notification settings
- Privacy controls

---

Development Philosophy

VORTEX will be developed in stages.

The priority is:

Stable foundation
        ↓
Authentication
        ↓
Database
        ↓
Profiles
        ↓
Social interactions
        ↓
Media
        ↓
Messaging
        ↓
Reels
        ↓
Communities
        ↓
Marketplace
        ↓
Creator ecosystem
        ↓
Advanced VORTEX features

Features should be connected to the real backend instead of relying permanently on fake/demo data.

---

Development Status

Foundation

- [x] Project structure
- [x] Backend server
- [x] Database foundation
- [x] Authentication foundation
- [x] Sessions
- [x] User profiles
- [x] Posts API
- [x] Comments API
- [x] Follow system
- [x] Notifications API
- [x] Media storage foundation
- [x] Rate limiting foundation

In Development

- [ ] Frontend/backend integration
- [ ] Real media upload UI
- [ ] Complete feed interface
- [ ] Search interface
- [ ] Profile interface
- [ ] Notifications interface

Planned

- [ ] Direct messaging
- [ ] Reels
- [ ] Stories
- [ ] Communities
- [ ] Marketplace
- [ ] Creator dashboard
- [ ] Monetization
- [ ] Premium
- [ ] Advanced settings
- [ ] VORTEX Vault
- [ ] VORTEX voice features

---

Running VORTEX

Install dependencies:

npm install

Create your local environment file:

.env

Start the development server:

npm start

Then open:

http://localhost:3000

API health check:

http://localhost:3000/api/health

---

Environment Variables

Never publish real secrets.

Use:

.env.example

as the template for:

.env

Keep the real ".env" file private.

---

Project Ownership

VORTEX

Created by:

Brilliant Tumelo Mere

Vision:

Build a connected social universe from Botswana for the world.

---

Important Development Rule

VORTEX Social App and VORTEX Life Simulation Game are separate projects.

Do not place game-engine files, game worlds, NPC systems, vehicles, or other game-specific code inside the VORTEX Social App repository.

---

VORTEX

Connect. Create. Discover.
