/* =========================================================
   VORTEX DATABASE / DATA LAYER
   FILE 6 — database.js
   ========================================================= */

"use strict";

/*
  VORTEX DATABASE LAYER

  Responsibilities:
  - User data
  - Posts
  - Stories
  - Messages
  - Friends
  - Groups
  - Reels
  - Games
  - Events
  - Notifications
  - Points
  - Saved media
  - Vault metadata
  - Themes

  IMPORTANT:
  This file is designed so the frontend can work during
  development without a real server.

  When the production backend is connected, these methods
  can use VortexAPI instead of localStorage.
*/


/* =========================================================
   DATABASE CONFIG
   ========================================================= */

const VortexDB = {

  mode: "auto",

  localPrefix: "vortex_db_",

  useBackend: false,


  /* =======================================================
     INITIALIZE
     ======================================================= */

  async init() {

    try {

      const status =
        await window.checkVortexBackend?.();


      if (
        status &&
        status.online
      ) {

        this.useBackend = true;
        this.mode = "backend";

      } else {

        this.useBackend = false;
        this.mode = "local";

      }

    } catch {

      this.useBackend = false;
      this.mode = "local";

    }


    this.prepareLocalDatabase();


    window.dispatchEvent(
      new CustomEvent(
        "vortex:database-ready",
        {
          detail: {
            mode: this.mode
          }
        }
      )
    );


    console.log(
      "VORTEX database:",
      this.mode
    );


    return this;

  },


  /* =======================================================
     LOCAL DATABASE
     ======================================================= */

  prepareLocalDatabase() {

    const collections = [

      "users",
      "posts",
      "stories",
      "messages",
      "conversations",
      "friends",
      "groups",
      "reels",
      "events",
      "games",
      "scores",
      "notifications",
      "points",
      "achievements",
      "themes",
      "media",
      "saved",
      "vault",
      "settings"

    ];


    collections.forEach(
      collection => {

        const key =
          this.localPrefix +
          collection;


        if (
          localStorage.getItem(key) === null
        ) {

          localStorage.setItem(
            key,
            JSON.stringify([])
          );

        }

      }
    );

  },


  /* =======================================================
     LOCAL READ
     ======================================================= */

  localGet(
    collection
  ) {

    try {

      return JSON.parse(
        localStorage.getItem(
          this.localPrefix +
          collection
        ) || "[]"
      );

    } catch {

      return [];

    }

  },


  /* =======================================================
     LOCAL WRITE
     ======================================================= */

  localSet(
    collection,
    data
  ) {

    localStorage.setItem(

      this.localPrefix +
      collection,

      JSON.stringify(data)

    );

    return data;

  },


  /* =======================================================
     LOCAL INSERT
     ======================================================= */

  localInsert(
    collection,
    item
  ) {

    const data =
      this.localGet(collection);


    data.push(item);


    this.localSet(
      collection,
      data
    );


    return item;

  },


  /* =======================================================
     LOCAL UPDATE
     ======================================================= */

  localUpdate(
    collection,
    id,
    changes
  ) {

    const data =
      this.localGet(collection);


    const index =
      data.findIndex(
        item =>
          item.id === id
      );


    if (index === -1) {

      return null;

    }


    data[index] =
      Object.assign(
        {},
        data[index],
        changes,
        {
          updatedAt:
            new Date().toISOString()
        }
      );


    this.localSet(
      collection,
      data
    );


    return data[index];

  },


  /* =======================================================
     LOCAL DELETE
     ======================================================= */

  localDelete(
    collection,
    id
  ) {

    const data =
      this.localGet(collection);


    const remaining =
      data.filter(
        item =>
          item.id !== id
      );


    this.localSet(
      collection,
      remaining
    );


    return true;

  },


  /* =======================================================
     FIND ONE
     ======================================================= */

  localFind(
    collection,
    id
  ) {

    return this
      .localGet(collection)
      .find(
        item =>
          item.id === id
      ) || null;

  },


  /* =======================================================
     FIND MANY
     ======================================================= */

  localFindMany(
    collection,
    filter
  ) {

    return this
      .localGet(collection)
      .filter(filter);

  },


  /* =======================================================
     ID GENERATOR
     ======================================================= */

  id(
    prefix = "vx"
  ) {

    return (

      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 9)

    );

  },


  /* =======================================================
     USERS
     ======================================================= */

  async getUser(
    userId
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getUser(
        userId
      );

    }


    return {

      success: true,

      data:
        this.localFind(
          "users",
          userId
        )

    };

  },


  async createUser(
    user
  ) {

    const record =
      Object.assign(
        {

          id:
            this.id("user"),

          createdAt:
            new Date().toISOString(),

          points: 0,

          followers: [],

          following: [],

          friends: []

        },

        user

      );


    return {

      success: true,

      data:
        this.localInsert(
          "users",
          record
        )

    };

  },


  async updateUser(
    userId,
    changes
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.updateProfile(
        changes
      );

    }


    return {

      success: true,

      data:
        this.localUpdate(
          "users",
          userId,
          changes
        )

    };

  },


  /* =======================================================
     POSTS
     ======================================================= */

  async getPosts() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getFeed();

    }


    return {

      success: true,

      data:
        this.localGet(
          "posts"
        ).sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )

    };

  },


  async getPost(
    postId
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getPost(
        postId
      );

    }


    return {

      success: true,

      data:
        this.localFind(
          "posts",
          postId
        )

    };

  },


  async createPost(
    data
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.createPost(
        data
      );

    }


    const post =
      Object.assign(

        {

          id:
            this.id("post"),

          likes: 0,

          comments: 0,

          shares: 0,

          createdAt:
            new Date().toISOString(),

          visibility:
            "public"

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "posts",
          post
        )

    };

  },


  async updatePost(
    postId,
    changes
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.updatePost(
        postId,
        changes
      );

    }


    return {

      success: true,

      data:
        this.localUpdate(
          "posts",
          postId,
          changes
        )

    };

  },


  async deletePost(
    postId
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.deletePost(
        postId
      );

    }


    return {

      success:
        this.localDelete(
          "posts",
          postId
        )

    };

  },


  /* =======================================================
     STORIES
     ======================================================= */

  async getStories() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getStories();

    }


    const stories =
      this.localGet(
        "stories"
      );


    const now =
      Date.now();


    const active =
      stories.filter(
        story =>
          !story.expiresAt ||
          new Date(
            story.expiresAt
          ).getTime() > now
      );


    return {

      success: true,

      data: active

    };

  },


  async createStory(
    data
  ) {

    const story =
      Object.assign(

        {

          id:
            this.id("story"),

          createdAt:
            new Date().toISOString(),

          expiresAt:
            new Date(
              Date.now() +
              24 * 60 * 60 * 1000
            ).toISOString()

        },

        data

      );


    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.createStory(
        story
      );

    }


    return {

      success: true,

      data:
        this.localInsert(
          "stories",
          story
        )

    };

  },


  /* =======================================================
     CHAT
     ======================================================= */

  async getConversations() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getConversations();

    }


    return {

      success: true,

      data:
        this.localGet(
          "conversations"
        )

    };

  },


  async getMessages(
    conversationId
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getMessages(
        conversationId
      );

    }


    return {

      success: true,

      data:
        this.localFindMany(
          "messages",
          message =>
            message.conversationId ===
            conversationId
        )

    };

  },


  async sendMessage(
    data
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.sendMessage(
        data.conversationId,
        data
      );

    }


    const message =
      Object.assign(

        {

          id:
            this.id("message"),

          createdAt:
            new Date().toISOString(),

          read: false

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "messages",
          message
        )

    };

  },


  /* =======================================================
     FRIENDS
     ======================================================= */

  async getFriends() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getFriends();

    }


    return {

      success: true,

      data:
        this.localGet(
          "friends"
        )

    };

  },


  async addFriend(
    data
  ) {

    const friend =
      Object.assign(

        {

          id:
            this.id("friend"),

          status:
            "pending",

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "friends",
          friend
        )

    };

  },


  /* =======================================================
     GROUPS
     ======================================================= */

  async getGroups() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getGroups();

    }


    return {

      success: true,

      data:
        this.localGet(
          "groups"
        )

    };

  },


  async createGroup(
    data
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.createGroup(
        data
      );

    }


    const group =
      Object.assign(

        {

          id:
            this.id("group"),

          members: [],

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "groups",
          group
        )

    };

  },


  /* =======================================================
     REELS
     ======================================================= */

  async getReels() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getReels();

    }


    return {

      success: true,

      data:
        this.localGet(
          "reels"
        )

    };

  },


  async createReel(
    data
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.createReel(
        data
      );

    }


    const reel =
      Object.assign(

        {

          id:
            this.id("reel"),

          likes: 0,

          comments: 0,

          views: 0,

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "reels",
          reel
        )

    };

  },


  /* =======================================================
     EVENTS
     ======================================================= */

  async getEvents() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getEvents();

    }


    return {

      success: true,

      data:
        this.localGet(
          "events"
        )

    };

  },


  async createEvent(
    data
  ) {

    const event =
      Object.assign(

        {

          id:
            this.id("event"),

          participants: [],

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "events",
          event
        )

    };

  },


  /* =======================================================
     GAMES
     ======================================================= */

  async getGames() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getGames();

    }


    return {

      success: true,

      data:
        this.localGet(
          "games"
        )

    };

  },


  async saveScore(
    data
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.saveGameScore(
        data.gameId,
        data.score
      );

    }


    const score =
      Object.assign(

        {

          id:
            this.id("score"),

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "scores",
          score
        )

    };

  },


  /* =======================================================
     POINTS
     ======================================================= */

  async getPoints(
    userId
  ) {

    const records =
      this.localGet(
        "points"
      );


    return {

      success: true,

      data:
        records.filter(
          record =>
            record.userId === userId
        )

    };

  },


  async addPoints(
    userId,
    amount,
    reason
  ) {

    const record = {

      id:
        this.id("points"),

      userId,

      amount:

        Number(amount) || 0,

      reason:
        reason || "Activity",

      createdAt:
        new Date().toISOString()

    };


    this.localInsert(
      "points",
      record
    );


    /*
      Points can later be calculated by the
      backend to prevent cheating.
    */


    return {

      success: true,

      data: record

    };

  },


  /* =======================================================
     ACHIEVEMENTS
     ======================================================= */

  async getAchievements() {

    return {

      success: true,

      data:
        this.localGet(
          "achievements"
        )

    };

  },


  async unlockAchievement(
    data
  ) {

    const achievement =
      Object.assign(

        {

          id:
            this.id("achievement"),

          unlockedAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "achievements",
          achievement
        )

    };

  },


  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  async getNotifications() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getNotifications();

    }


    return {

      success: true,

      data:
        this.localGet(
          "notifications"
        )

    };

  },


  async addNotification(
    data
  ) {

    const notification =
      Object.assign(

        {

          id:
            this.id("notification"),

          read: false,

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "notifications",
          notification
        )

    };

  },


  /* =======================================================
     THEMES
     ======================================================= */

  async getThemes() {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getThemes();

    }


    return {

      success: true,

      data:
        this.localGet(
          "themes"
        )

    };

  },


  async saveTheme(
    theme
  ) {

    const existing =
      this.localGet(
        "themes"
      );


    const found =
      existing.find(
        item =>
          item.id === theme.id
      );


    if (!found) {

      this.localInsert(
        "themes",
        theme
      );

    }


    return {

      success: true,

      data: theme

    };

  },


  /* =======================================================
     SAVED MEDIA
     ======================================================= */

  async saveMedia(
    data
  ) {

    const media =
      Object.assign(

        {

          id:
            this.id("media"),

          savedAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "saved",
          media
        )

    };

  },


  async getSavedMedia(
    userId
  ) {

    return {

      success: true,

      data:
        this.localFindMany(
          "saved",
          item =>
            item.userId === userId
        )

    };

  },


  async deleteSavedMedia(
    id
  ) {

    return {

      success:
        this.localDelete(
          "saved",
          id
        )

    };

  },


  /* =======================================================
     VAULT
     ======================================================= */

  async getVault(
    userId
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.getVault();

    }


    return {

      success: true,

      data:
        this.localFindMany(
          "vault",
          item =>
            item.userId === userId
        )

    };

  },


  async addVaultItem(
    data
  ) {

    const item =
      Object.assign(

        {

          id:
            this.id("vault"),

          createdAt:
            new Date().toISOString()

        },

        data

      );


    return {

      success: true,

      data:
        this.localInsert(
          "vault",
          item
        )

    };

  },


  async deleteVaultItem(
    id
  ) {

    return {

      success:
        this.localDelete(
          "vault",
          id
        )

    };

  },


  /* =======================================================
     SEARCH
     ======================================================= */

  async search(
    query
  ) {

    if (
      this.useBackend &&
      window.VortexAPI
    ) {

      return VortexAPI.search(
        query
      );

    }


    const text =
      String(query || "")
        .toLowerCase()
        .trim();


    if (!text) {

      return {

        success: true,

        data: []

      };

    }


    const users =
      this.localGet(
        "users"
      ).filter(
        user =>
          String(
            user.name || ""
          )
            .toLowerCase()
            .includes(text) ||

          String(
            user.username || ""
          )
            .toLowerCase()
            .includes(text)
      );


    const posts =
      this.localGet(
        "posts"
      ).filter(
        post =>
          String(
            post.text || ""
          )
            .toLowerCase()
            .includes(text)
      );


    return {

      success: true,

      data: {

        users,

        posts

      }

    };

  },


  /* =======================================================
     CLEAR LOCAL DATABASE
     ======================================================= */

  clearLocalDatabase() {

    const collections = [

      "users",
      "posts",
      "stories",
      "messages",
      "conversations",
      "friends",
      "groups",
      "reels",
      "events",
      "games",
      "scores",
      "notifications",
      "points",
      "achievements",
      "themes",
      "media",
      "saved",
      "vault",
      "settings"

    ];


    collections.forEach(
      collection => {

        localStorage.removeItem(
          this.localPrefix +
          collection
        );

      }
    );


    this.prepareLocalDatabase();


    console.log(
      "VORTEX local database cleared."
    );

  }

};


/* =========================================================
   GLOBAL DATABASE ACCESS
   ========================================================= */

window.VortexDB =
  VortexDB;


/* =========================================================
   DATABASE BOOT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await VortexDB.init();

  }
);


/* =========================================================
   DATABASE EVENTS
   ========================================================= */

window.addEventListener(
  "vortex:database-ready",
  event => {

    console.log(
      "🌌 VORTEX database ready:",
      event.detail.mode
    );

  }
);


/* =========================================================
   END OF DATABASE MODULE
   ========================================================= */

6th file = "database.js". It gives us the data layer for the platform: users, posts, stories, chat, friends, groups, reels, events, games, points, achievements, themes, saved media and the vault. It can run locally now and switch to the real backend when we connect it.
