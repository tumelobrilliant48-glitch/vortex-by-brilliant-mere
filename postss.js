/* =========================================================
   VORTEX SOCIAL POSTS ENGINE
   FILE 24 — posts.js
   Text • Photos • Videos • News • Privacy • Comments
   Likes • Reposts • Saves • Sharing • Editing • Deleting
   Stories • Public • Friends • Contacts • Private
   ========================================================= */

"use strict";

const VortexPosts = {

  VERSION: "1.0.0",

  posts: new Map(),
  comments: new Map(),
  listeners: {},

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();

    console.log("📝 VORTEX Posts Engine ready.");

  },

  /* =======================================================
     USER
     ======================================================= */

  getUserId() {

    return (
      window.VortexAuth?.getUserId?.() ||
      "guest"
    );

  },

  getUser() {

    return (
      window.VortexAuth?.getUser?.() ||
      window.VortexAuth?.currentUser ||
      {
        id:
          this.getUserId(),

        name:
          "VORTEX User",

        avatar:
          ""
      }
    );

  },

  /* =======================================================
     ID
     ======================================================= */

  id(prefix = "post") {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 12)
    );

  },

  /* =======================================================
     CREATE POST
     ======================================================= */

  async createPost(
    data = {}
  ) {

    const user =
      this.getUser();

    const text =
      String(
        data.text ||
        ""
      ).trim();

    const media =
      data.media ||
      null;

    if (
      !text &&
      !media
    ) {

      return {
        success: false,
        error:
          "Post cannot be empty."
      };

    }

    const post = {

      id:
        this.id(),

      authorId:
        user.id ||
        this.getUserId(),

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      type:
        data.type ||
        this.detectType(
          media
        ),

      text,

      title:
        data.title ||
        "",

      media,

      privacy:
        data.privacy ||
        "public",

      allowComments:
        data.allowComments !== false,

      allowSharing:
        data.allowSharing !== false,

      location:
        data.location ||
        null,

      tags:
        Array.isArray(
          data.tags
        )
          ? data.tags
          : [],

      mentions:
        Array.isArray(
          data.mentions
        )
          ? data.mentions
          : [],

      category:
        data.category ||
        "general",

      likes:
        [],

      dislikes:
        [],

      reactions:
        {},

      reposts:
        [],

      saves:
        [],

      shares:
        0,

      views:
        0,

      commentsCount:
        0,

      hidden:
        false,

      deleted:
        false,

      edited:
        false,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    this.posts.set(
      post.id,
      post
    );

    await this.save();

    this.emit(
      "postCreated",
      post
    );

    return {
      success: true,
      post
    };

  },

  /* =======================================================
     TYPE DETECTION
     ======================================================= */

  detectType(
    media
  ) {

    if (!media) {

      return "text";

    }

    if (
      media.type ===
      "image"
    ) {

      return "image";

    }

    if (
      media.type ===
      "video"
    ) {

      return "video";

    }

    return "media";

  },

  /* =======================================================
     CREATE PHOTO POST
     ======================================================= */

  async createPhotoPost(
    file,
    text = "",
    options = {}
  ) {

    if (
      !window.VortexMedia
    ) {

      return {
        success: false,
        error:
          "VORTEX Media Engine is not loaded."
      };

    }

    const upload =
      await VortexMedia.upload(
        file,
        {
          type:
            "image",

          visibility:
            options.privacy ||
            "public",

          compress:
            true
        }
      );

    if (
      !upload.success
    ) {

      return upload;

    }

    return this.createPost({

      type:
        "image",

      text,

      media:
        upload,

      privacy:
        options.privacy ||
        "public",

      tags:
        options.tags ||
        [],

      location:
        options.location ||
        null

    });

  },

  /* =======================================================
     CREATE VIDEO POST
     ======================================================= */

  async createVideoPost(
    file,
    text = "",
    options = {}
  ) {

    if (
      !window.VortexMedia
    ) {

      return {
        success: false,
        error:
          "VORTEX Media Engine is not loaded."
      };

    }

    const upload =
      await VortexMedia.upload(
        file,
        {
          type:
            "video",

          visibility:
            options.privacy ||
            "public",

          compress:
            false
        }
      );

    if (
      !upload.success
    ) {

      return upload;

    }

    return this.createPost({

      type:
        "video",

      text,

      media:
        upload,

      privacy:
        options.privacy ||
        "public",

      tags:
        options.tags ||
        [],

      location:
        options.location ||
        null

    });

  },

  /* =======================================================
     NEWS POST
     ======================================================= */

  async createNewsPost(
    title,
    text,
    options = {}
  ) {

    return this.createPost({

      type:
        "news",

      title,

      text,

      category:
        options.category ||
        "news",

      media:
        options.media ||
        null,

      privacy:
        options.privacy ||
        "public",

      tags:
        options.tags ||
        []

    });

  },

  /* =======================================================
     GET POST
     ======================================================= */

  getPost(
    postId
  ) {

    return (
      this.posts.get(
        postId
      ) ||
      null
    );

  },

  /* =======================================================
     GET FEED
     ======================================================= */

  getFeed(
    options = {}
  ) {

    const userId =
      this.getUserId();

    let posts =
      [...this.posts.values()];

    posts =
      posts.filter(
        post => {

          if (
            post.deleted ||
            post.hidden
          ) {

            return false;

          }

          return this.canView(
            post,
            userId
          );

        }
      );

    if (
      options.type
    ) {

      posts =
        posts.filter(
          post =>
            post.type ===
            options.type
        );

    }

    if (
      options.category
    ) {

      posts =
        posts.filter(
          post =>
            post.category ===
            options.category
        );

    }

    if (
      options.authorId
    ) {

      posts =
        posts.filter(
          post =>
            post.authorId ===
            options.authorId
        );

    }

    posts.sort(
      (
        a,
        b
      ) =>
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
    );

    if (
      options.limit
    ) {

      posts =
        posts.slice(
          0,
          options.limit
        );

    }

    return posts;

  },

  /* =======================================================
     PRIVACY
     ======================================================= */

  canView(
    post,
    userId
  ) {

    if (
      post.authorId ===
      userId
    ) {

      return true;

    }

    switch (
      post.privacy
    ) {

      case "public":

        return true;

      case "private":

        return false;

      case "friends":

        return this.areFriends(
          post.authorId,
          userId
        );

      case "contacts":

        return this.areContacts(
          post.authorId,
          userId
        );

      case "followers":

        return this.isFollowing(
          userId,
          post.authorId
        );

      default:

        return false;

    }

  },

  /* =======================================================
     FRIEND CHECK
     ======================================================= */

  areFriends(
    userA,
    userB
  ) {

    if (
      userA ===
      userB
    ) {

      return true;

    }

    if (
      window.VortexSocial &&
      typeof VortexSocial.areFriends ===
      "function"
    ) {

      return VortexSocial.areFriends(
        userA,
        userB
      );

    }

    const friends =
      JSON.parse(
        localStorage.getItem(
          "vortex_friends"
        ) ||
        "{}"
      );

    return Boolean(
      friends[userA]?.includes(
        userB
      ) ||
      friends[userB]?.includes(
        userA
      )
    );

  },

  /* =======================================================
     CONTACT CHECK
     ======================================================= */

  areContacts(
    userA,
    userB
  ) {

    if (
      userA ===
      userB
    ) {

      return true;

    }

    if (
      window.VortexContacts &&
      typeof VortexContacts.isContact ===
      "function"
    ) {

      return VortexContacts.isContact(
        userA,
        userB
      );

    }

    return this.areFriends(
      userA,
      userB
    );

  },

  /* =======================================================
     FOLLOW CHECK
     ======================================================= */

  isFollowing(
    follower,
    following
  ) {

    if (
      window.VortexSocial &&
      typeof VortexSocial.isFollowing ===
      "function"
    ) {

      return VortexSocial.isFollowing(
        follower,
        following
      );

    }

    return false;

  },

  /* =======================================================
     LIKE
     ======================================================= */

  like(
    postId
  ) {

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false,
        error:
          "Post not found."
      };

    }

    const userId =
      this.getUserId();

    post.likes =
      post.likes ||
      [];

    const index =
      post.likes.indexOf(
        userId
      );

    if (
      index >= 0
    ) {

      post.likes.splice(
        index,
        1
      );

      this.emit(
        "postUnliked",
        post
      );

    } else {

      post.likes.push(
        userId
      );

      post.dislikes =
        post.dislikes ||
        [];

      post.dislikes =
        post.dislikes.filter(
          id =>
            id !==
            userId
        );

      this.emit(
        "postLiked",
        post
      );

    }

    post.updatedAt =
      new Date().toISOString();

    this.save();

    return {
      success: true,
      liked:
        index < 0,
      count:
        post.likes.length
    };

  },

  /* =======================================================
     DISLIKE
     ======================================================= */

  dislike(
    postId
  ) {

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false
      };

    }

    const userId =
      this.getUserId();

    post.dislikes =
      post.dislikes ||
      [];

    const index =
      post.dislikes.indexOf(
        userId
      );

    if (
      index >= 0
    ) {

      post.dislikes.splice(
        index,
        1
      );

    } else {

      post.dislikes.push(
        userId
      );

      post.likes =
        post.likes ||
        [];

      post.likes =
        post.likes.filter(
          id =>
            id !==
            userId
        );

    }

    this.save();

    this.emit(
      "postDisliked",
      post
    );

    return {
      success: true
    };

  },

  /* =======================================================
     REACTION
     ======================================================= */

  react(
    postId,
    emoji
  ) {

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false
      };

    }

    const userId =
      this.getUserId();

    post.reactions =
      post.reactions ||
      {};

    post.reactions[emoji] =
      post.reactions[emoji] ||
      [];

    const users =
      post.reactions[emoji];

    const index =
      users.indexOf(
        userId
      );

    if (
      index >= 0
    ) {

      users.splice(
        index,
        1
      );

    } else {

      users.push(
        userId
      );

    }

    this.save();

    this.emit(
      "reactionChanged",
      {
        post,
        emoji
      }
    );

    return {
      success: true,
      post
    };

  },

  /* =======================================================
     SAVE POST
     ======================================================= */

  savePost(
    postId
  ) {

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false
      };

    }

    const userId =
      this.getUserId();

    post.saves =
      post.saves ||
      [];

    const index =
      post.saves.indexOf(
        userId
      );

    if (
      index >= 0
    ) {

      post.saves.splice(
        index,
        1
      );

    } else {

      post.saves.push(
        userId
      );

    }

    this.save();

    this.emit(
      "postSaved",
      post
    );

    return {
      success: true,
      saved:
        index < 0
    };

  },

  /* =======================================================
     REPOST
     ======================================================= */

  async repost(
    postId,
    text = ""
  ) {

    const original =
      this.getPost(
        postId
      );

    if (!original) {

      return {
        success: false,
        error:
          "Original post not found."
      };

    }

    const user =
      this.getUser();

    const repost = {

      id:
        this.id("repost"),

      authorId:
        user.id ||
        this.getUserId(),

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      type:
        "repost",

      text,

      originalPostId:
        original.id,

      originalAuthorId:
        original.authorId,

      privacy:
        "public",

      likes:
        [],

      dislikes:
        [],

      reactions:
        {},

      reposts:
        [],

      saves:
        [],

      shares:
        0,

      views:
        0,

      commentsCount:
        0,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    this.posts.set(
      repost.id,
      repost
    );

    original.reposts =
      original.reposts ||
      [];

    original.reposts.push(
      this.getUserId()
    );

    await this.save();

    this.emit(
      "postReposted",
      repost
    );

    return {
      success: true,
      post:
        repost
    };

  },

  /* =======================================================
     SHARE
     ======================================================= */

  async share(
    postId,
    options = {}
  ) {

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false
      };

    }

    post.shares =
      Number(
        post.shares ||
        0
      ) + 1;

    await this.save();

    if (
      navigator.share
    ) {

      try {

        await navigator.share({

          title:
            "VORTEX",

          text:
            post.text ||
            "Check this out on VORTEX.",

          url:
            options.url ||
            location.href +
            "#post-" +
           
