/* =========================================================
   VORTEX SOCIAL ENGINE
   FILE 20 — social.js
   ========================================================= */

"use strict";

const VortexSocial = {

  config: {
    maxPostLength: 10000,
    maxCommentLength: 2000,
    maxBioLength: 500
  },

  listeners: {},

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    console.log("🌐 VORTEX Social Engine ready.");

  },


  /* =======================================================
     CURRENT USER
     ======================================================= */

  getUser() {

    return window.VortexAuth?.getUser?.() || null;

  },


  getUserId() {

    return window.VortexAuth?.getUserId?.() || null;

  },


  /* =======================================================
     ID
     ======================================================= */

  id(prefix = "social") {

    if (
      window.VortexDB &&
      typeof VortexDB.id === "function"
    ) {

      return VortexDB.id(prefix);

    }

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );

  },


  /* =======================================================
     CREATE POST
     ======================================================= */

  createPost(options = {}) {

    const user =
      this.getUser();

    const userId =
      this.getUserId();

    if (
      !user ||
      !userId
    ) {

      return {
        success: false,
        error: "Login required."
      };

    }

    let text =
      String(
        options.text ||
        ""
      )
      .trim()
      .slice(
        0,
        this.config.maxPostLength
      );

    const media =
      Array.isArray(
        options.media
      )
        ? options.media
        : [];

    if (
      !text &&
      media.length === 0
    ) {

      return {
        success: false,
        error: "Post cannot be empty."
      };

    }

    const privacy =
      this.normalizePrivacy(
        options.privacy
      );

    const post = {

      id:
        this.id("post"),

      authorId:
        userId,

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      text,

      media,

      type:
        options.type ||
        this.detectPostType(
          media
        ),

      privacy,

      location:
        options.location ||
        null,

      feeling:
        options.feeling ||
        null,

      tags:
        Array.isArray(
          options.tags
        )
          ? options.tags
          : [],

      mentions:
        Array.isArray(
          options.mentions
        )
          ? options.mentions
          : [],

      likes: [],

      commentsCount:
        0,

      sharesCount:
        0,

      repostsCount:
        0,

      savesCount:
        0,

      views:
        0,

      comments: [],

      repostOf:
        options.repostOf ||
        null,

      originalPostId:
        options.originalPostId ||
        null,

      edited:
        false,

      deleted:
        false,

      hidden:
        false,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    VortexDB.localInsert(
      "posts",
      post
    );

    this.emit(
      "postCreated",
      post
    );

    window.dispatchEvent(
      new CustomEvent(
        "vortex:post-created",
        {
          detail: post
        }
      )
    );

    return {
      success: true,
      data: post
    };

  },


  /* =======================================================
     POST TYPE
     ======================================================= */

  detectPostType(
    media
  ) {

    if (
      !media ||
      media.length === 0
    ) {

      return "text";

    }

    const types =
      media.map(
        item =>
          item.type
      );

    if (
      types.includes(
        "video"
      )
    ) {

      return "video";

    }

    if (
      types.includes(
        "image"
      )
    ) {

      return "image";

    }

    if (
      types.includes(
        "audio"
      )
    ) {

      return "audio";

    }

    return "media";

  },


  /* =======================================================
     PRIVACY
     ======================================================= */

  normalizePrivacy(
    privacy
  ) {

    const allowed = [

      "public",
      "friends",
      "contacts",
      "private"

    ];

    return allowed.includes(
      privacy
    )
      ? privacy
      : "public";

  },


  /* =======================================================
     CAN VIEW POST
     ======================================================= */

  canViewPost(
    post,
    viewerId = null
  ) {

    if (!post) {

      return false;

    }

    if (
      post.deleted ||
      post.hidden
    ) {

      return false;

    }

    viewerId =
      viewerId ||
      this.getUserId();

    if (
      post.authorId ===
      viewerId
    ) {

      return true;

    }

    if (
      post.privacy ===
      "public"
    ) {

      return true;

    }

    if (!viewerId) {

      return false;

    }

    if (
      post.privacy ===
      "private"
    ) {

      return false;

    }

    if (
      post.privacy ===
      "friends"
    ) {

      return this.areFriends(
        post.authorId,
        viewerId
      );

    }

    if (
      post.privacy ===
      "contacts"
    ) {

      return (
        this.areFriends(
          post.authorId,
          viewerId
        ) ||
        this.isContact(
          post.authorId,
          viewerId
        )
      );

    }

    return false;

  },


  /* =======================================================
     GET POST
     ======================================================= */

  getPost(
    postId
  ) {

    return VortexDB.localFind(
      "posts",
      postId
    );

  },


  /* =======================================================
     UPDATE POST
     ======================================================= */

  updatePost(
    postId,
    changes = {}
  ) {

    const userId =
      this.getUserId();

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false,
        error: "Post not found."
      };

    }

    if (
      post.authorId !==
      userId
    ) {

      return {
        success: false,
        error: "You can only edit your own posts."
      };

    }

    const allowed = {

      text:
        typeof changes.text ===
        "string"
          ? changes.text
              .trim()
              .slice(
                0,
                this.config.maxPostLength
              )
          : post.text,

      privacy:
        this.normalizePrivacy(
          changes.privacy ||
          post.privacy
        ),

      location:
        changes.location !== undefined
          ? changes.location
          : post.location,

      feeling:
        changes.feeling !== undefined
          ? changes.feeling
          : post.feeling,

      tags:
        Array.isArray(
          changes.tags
        )
          ? changes.tags
          : post.tags,

      mentions:
        Array.isArray(
          changes.mentions
        )
          ? changes.mentions
          : post.mentions,

      edited:
        true,

      updatedAt:
        new Date().toISOString()

    };

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        allowed
      );

    return {
      success: true,
      data: updated
    };

  },


  /* =======================================================
     DELETE POST
     ======================================================= */

  deletePost(
    postId
  ) {

    const userId =
      this.getUserId();

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false,
        error: "Post not found."
      };

    }

    if (
      post.authorId !==
      userId
    ) {

      return {
        success: false,
        error: "You can only delete your own posts."
      };

    }

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          deleted: true,
          deletedAt:
            new Date().toISOString()
        }
      );

    this.emit(
      "postDeleted",
      updated
    );

    return {
      success: true,
      data: updated
    };

  },


  /* =======================================================
     LIKE / UNLIKE
     ======================================================= */

  toggleLike(
    postId
  ) {

    const userId =
      this.getUserId();

    if (!userId) {

      return {
        success: false,
        error: "Login required."
      };

    }

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false,
        error: "Post not found."
      };

    }

    if (
      !this.canViewPost(
        post,
        userId
      )
    ) {

      return {
        success: false,
        error: "You cannot interact with this post."
      };

    }

    const likes =
      [
        ...(post.likes || [])
      ];

    const index =
      likes.indexOf(
        userId
      );

    let liked;

    if (
      index ===
      -1
    ) {

      likes.push(
        userId
      );

      liked = true;

    } else {

      likes.splice(
        index,
        1
      );

      liked = false;

    }

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          likes
        }
      );

    if (
      liked &&
      post.authorId !==
      userId &&
      window.VortexNotifications
    ) {

      const actor =
        this.getUser();

      VortexNotifications.like(
        post,
        actor
      );

    }

    this.emit(
      "like",
      {
        post: updated,
        liked
      }
    );

    return {
      success: true,
      liked,
      count:
        likes.length,
      data:
        updated
    };

  },


  /* =======================================================
     HAS LIKED
     ======================================================= */

  hasLiked(
    postId,
    userId = null
  ) {

    userId =
      userId ||
      this.getUserId();

    const post =
      this.getPost(
        postId
      );

    return Boolean(
      post &&
      (
        post.likes ||
        []
      ).includes(
        userId
      )
    );

  },


  /* =======================================================
     ADD COMMENT
     ======================================================= */

  addComment(
    postId,
    text,
    options = {}
  ) {

    const user =
      this.getUser();

    const userId =
      this.getUserId();

    if (
      !user ||
      !userId
    ) {

      return {
        success: false,
        error: "Login required."
      };

    }

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false,
        error: "Post not found."
      };

    }

    if (
      !this.canViewPost(
        post,
        userId
      )
    ) {

      return {
        success: false,
        error: "You cannot comment on this post."
      };

    }

    text =
      String(
        text || ""
      )
      .trim()
      .slice(
        0,
        this.config.maxCommentLength
      );

    if (!text) {

      return {
        success: false,
        error: "Comment cannot be empty."
      };

    }

    const comment = {

      id:
        this.id("comment"),

      postId,

      authorId:
        userId,

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      text,

      parentId:
        options.parentId ||
        null,

      likes: [],

      replies: [],

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      deleted:
        false

    };

    const comments =
      [
        ...(post.comments || [])
      ];

    comments.push(
      comment
    );

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          comments,
          commentsCount:
            comments.filter(
              item =>
                !item.deleted
            ).length
        }
      );

    if (
      post.authorId !==
      userId &&
      window.VortexNotifications
    ) {

      VortexNotifications.comment(
        post,
        user,
        text
      );

    }

    this.emit(
      "comment",
      {
        post: updated,
        comment
      }
    );

    return {
      success: true,
      data: comment
    };

  },


  /* =======================================================
     REPLY
     ======================================================= */

  replyToComment(
    postId,
    commentId,
    text
  ) {

    return this.addComment(
      postId,
      text,
      {
        parentId:
          commentId
      }
    );

  },


  /* =======================================================
     DELETE COMMENT
     ======================================================= */

  deleteComment(
    postId,
    commentId
  ) {

    const userId =
      this.getUserId();

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false
      };

    }

    const comments =
      [
        ...(post.comments || [])
      ];

    const comment =
      comments.find(
        item =>
          item.id ===
          commentId
      );

    if (!comment) {

      return {
        success: false,
        error: "Comment not found."
      };

    }

    if (
      comment.authorId !==
      userId &&
      post.authorId !==
      userId
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    comment.deleted =
      true;

    comment.text =
      "Comment deleted";

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          comments,
          commentsCount:
            comments.filter(
              item =>
                !item.deleted
            ).length
        }
      );

    return {
      success: true,
      data: updated
    };

  },


  /* =======================================================
     COMMENT LIKE
     ======================================================= */

  toggleCommentLike(
    postId,
    commentId
  ) {

    const userId =
      this.getUserId();

    const post =
      this.getPost(
        postId
      );

    if (
      !userId ||
      !post
    ) {

      return {
        success: false
      };

    }

    const comments =
      [
        ...(post.comments || [])
      ];

    const comment =
      comments.find(
        item =>
          item.id ===
          commentId
      );

    if (!comment) {

      return {
        success: false,
        error: "Comment not found."
      };

    }

    const likes =
      [
        ...(comment.likes || [])
      ];

    const index =
      likes.indexOf(
        userId
      );

    let liked;

    if (
      index ===
      -1
    ) {

      likes.push(
        userId
      );

      liked = true;

    } else {

      likes.splice(
        index,
        1
      );

      liked = false;

    }

    comment.likes =
      likes;

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          comments
        }
      );

    return {
      success: true,
      liked,
      count:
        likes.length,
      data:
        updated
    };

  },


  /* =======================================================
     REPOST
     ======================================================= */

  repost(
    postId,
    text = ""
  ) {

    const original =
      this.getPost(
        postId
      );

    const userId =
      this.getUserId();

    if (
      !original ||
      !userId
    ) {

      return {
        success: false,
        error: "Post unavailable."
      };

    }

    if (
      !this.canViewPost(
        original,
        userId
      )
    ) {

      return {
        success: false,
        error: "You cannot repost this post."
      };

    }

    const result =
      this.createPost({

        text,

        type:
          "repost",

        repostOf:
          original.id,

        originalPostId:
          original.originalPostId ||
          original.id,

        privacy:
          "public"

      });

    if (
      !result.success
    ) {

      return result;

    }

    VortexDB.localUpdate(
      "posts",
      original.id,
      {
        repostsCount:
          Number(
            original.repostsCount ||
            0
          ) + 1
      }
    );

    if (
      original.authorId !==
      userId &&
      window.VortexNotifications
    ) {

      const actor =
        this.getUser();

      VortexNotifications.create({

        userId:
          original.authorId,

        actorId:
          userId,

        actorName:
          actor?.name ||
          "Someone",

        actorAvatar:
          actor?.avatar ||
          "",

        type:
          "repost",

        title:
          "Your post was reposted",

        message:
          `${actor?.name || "Someone"} reposted your post.`,

        entityId:
          original.id,

        entityType:
          "post",

        action:
          "openPost"

      });

    }

    return result;

  },


  /* =======================================================
     SHARE
     ======================================================= */

  share(
    postId,
    target = null
  ) {

    const userId =
      this.getUserId();

    const post =
      this.getPost(
        postId
      );

    if (
      !userId ||
      !post
    ) {

      return {
        success: false
      };

    }

    if (
      !this.canViewPost(
        post,
        userId
      )
    ) {

      return {
        success: false,
        error: "This post is not available."
      };

    }

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          sharesCount:
            Number(
              post.sharesCount ||
              0
            ) + 1
        }
      );

    if (
      target &&
      target.conversationId &&
      window.VortexChat
    ) {

      const message =
        `🔗 VORTEX post: ${post.id}`;

      VortexChat.send(
        target.conversationId,
        message,
        {
          type:
            "post-share",

          metadata: {
            postId:
              post.id
          }
        }
      );

    }

    return {
      success: true,
      data: updated
    };

  },


  /* =======================================================
     SAVE / UNSAVE
     ======================================================= */

  toggleSave(
    postId
  ) {

    const userId =
      this.getUserId();

    if (!userId) {

      return {
        success: false,
        error: "Login required."
      };

    }

    const post =
      this.getPost(
        postId
      );

    if (!post) {

      return {
        success: false
      };

    }

    const saved =
      this.getSavedPostIds();

    const index =
      saved.indexOf(
        postId
      );

    let isSaved;

    if (
      index ===
      -1
    ) {

      saved.push(
        postId
      );

      isSaved = true;

    } else {

      saved.splice(
        index,
        1
      );

      isSaved = false;

    }

    localStorage.setItem(
      `vortex_saved_${userId}`,
      JSON.stringify(
        saved
      )
    );

    const count =
      Math.max(
        0,
        Number(
          post.savesCount ||
          0
        ) +
        (
          isSaved
            ? 1
            : -1
        )
      );

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          savesCount:
            count
        }
      );

    return {
      success: true,
      saved:
        isSaved,
      data:
        updated
    };

  },


  getSavedPostIds() {

    const userId =
      this.getUserId();

    if (!userId) {

      return [];

    }

    try {

      return JSON.parse(
        localStorage.getItem(
          `vortex_saved_${userId}`
        ) ||
        "[]"
      );

    } catch (
      error
    ) {

      return [];

    }

  },


  getSavedPosts() {

    const ids =
      this.getSavedPostIds();

    return ids
      .map(
        id =>
          this.getPost(id)
      )
      .filter(Boolean);

  },


  /* =======================================================
     VIEW POST
     ======================================================= */

  registerView(
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

    const updated =
      VortexDB.localUpdate(
        "posts",
        postId,
        {
          views:
            Number(
              post.views ||
              0
            ) + 1
        }
      );

    return {
      success: true,
      views:
        updated.views
    };

  },


  /* =======================================================
     FEED
     ======================================================= */

  getFeed(
    options = {}
  ) {

    const viewerId =
      options.userId ||
      this.getUserId();

    let posts =
      VortexDB.localFindMany(
        "posts",
        post =>
          this.canViewPost(
            post,
            viewerId
          )
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
      (a, b) =>
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
     FOLLOW
     ======================================================= */

  follow(
    targetUserId
  ) {

    const userId =
      this.getUserId();

    if (!userId) {

      return {
        success: false,
        error: "Login required."
      };

    }

    if (
      String(
        userId
      ) ===
      String(
        targetUserId
      )
    ) {

      return {
        success: false,
        error: "You cannot follow yourself."
      };

    }

    const target =
      this.getProfile(
        targetUserId
      );

    if (!target) {

      return {
        success: false,
        error: "User not found."
      };

    }

    const followers =
      [
        ...(target.followers || [])
      ];

    if (
      followers.includes(
        userId
      )
    ) {

      return {
        success: false,
        error: "Already following."
      };

    }

    followers.push(
      userId
    );

    VortexDB.localUpdate(
      "profiles",
      targetUserId,
      {
        followers
      }
    );

    const current =
      this.getProfile(
        userId
      );

    const following =
      [
        ...(current?.following || [])
      ];

    if (
      !following.includes(
        targetUserId
      )
    ) {

      following.push(
        targetUserId
      );

    }

    if (current) {

      VortexDB.localUpdate(
        "profiles",
        userId,
        {
          following
        }
      );

    }

    if (
      window.VortexNotifications
    ) {

      VortexNotifications.follow(
        target,
        this.getUser()
      );

    }

    return {
      success: true,
      following: true
    };

  },


  /* =======================================================
     UNFOLLOW
     ======================================================= */

  unfollow(
    targetUserId
  ) {

    const userId =
      this.getUserId();

    const target =
      this.getProfile(
        targetUserId
      );

    const current =
      this.getProfile(
        userId
      );

    if (
      !target ||
      !current
    ) {

      return {
        success: false
      };

    }

    const followers =
      (
        target.followers ||
        []
      ).filter(
        id =>
          id !==
          userId
      );

    const following =
      (
        current.following ||
        []
      ).filter(
        id =>
          id !==
          targetUserId
      );

    VortexDB.localUpdate(
      "profiles",
      targetUserId,
      {
        followers
      }
    );

    VortexDB.localUpdate(
      "profiles",
      userId,
      {
        following
      }
    );

    return {
      success: true,
      following: false
    };

  },


  /* =======================================================
     FOLLOWING CHECK
     ======================================================= */

  isFollowing(
    userId,
    targetId
  ) {

    const profile =
      this.getProfile(
        userId
      );

    return Boolean(
      profile &&
      (
        profile.following ||
        []
      ).includes(
        targetId
      )
    );

  },


  /* =======================================================
     FRIEND REQUEST
     ======================================================= */

  sendFriendRequest(
    targetUserId
  ) {

    const userId =
      this.getUserId();

    if (!userId) {

      return {
        success: false,
        error: "Login required."
      };

    }

    if (
      userId ===
      targetUserId
    ) {

      return {
        success: false,
        error: "You cannot add yourself."
      };

    }

    const target =
      this.getProfile(
        targetUserId
      );

    if (!target) {

      return {
        success: false,
        error: "User not found."
      };

    }

    const requests =
      VortexDB.localFindMany(
        "friendRequests",
        request =>
          request.from ===
            userId &&
          request.to ===
            targetUserId &&
          request.status ===
            "pending"
      );

    if (
      requests.length
    ) {

      return {
        success: false,
        error: "Request already sent."
      };

    }

    const request = {

      id:
        this.id("friend"),

      from:
        userId,

      to:
        targetUserId,

      status:
        "pending",

      createdAt:
        new Date().toISOString()

    };

    VortexDB.localInsert(
      "friendRequests",
      request
    );

    if (
      window.VortexNotifications
    ) {

      VortexNotifications.friendRequest(
        target,
        this.getUser()
      );

    }

    return {
      success: true,
      data: request
    };

  },


  /* =======================================================
     ACCEPT FRIEND
     ======================================================= */

  acceptFriendRequest(
    requestId
  ) {

    const userId =
      this.getUserId();

    const request =
      VortexDB.localFind(
        "friendRequests",
        requestId
      );

    if (
      !request
    ) {

      return {
        success: false,
        error: "Request not found."
      };

    }

    if (
      request.to !==
      userId
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    VortexDB.localUpdate(
      "friendRequests",
      requestId,
      {
        status:
          "accepted",

        respondedAt:
          new Date().toISOString()
      }
    );

    this.addFriend(
      request.from,
      request.to
    );

    const sender =
      this.getProfile(
        request.from
      );

    if (
      window.VortexNotifications
    ) {

      VortexNotifications.friendAccepted(
        sender,
        this.getUser()
      );

    }

    return {
      success: true
    };

  },


  /* =======================================================
     DECLINE FRIEND
     ======================================================= */

  declineFriendRequest(
    requestId
  ) {

    const userId =
      this.getUserId();

    const request =
      VortexDB.localFind(
        "friendRequests",
        requestId
      );

    if (
      !request ||
      request.to !==
      userId
    ) {

      return {
        success: false
      };

    }

    VortexDB.localUpdate(
      "friendRequests",
      requestId,
      {
        status:
          "declined",

        respondedAt:
          new Date().toISOString()
      }
    );

    return {
      success: true
    };

  },


  /* =======================================================
     ADD FRIEND
     ======================================================= */

  addFriend(
    userA,
    userB
  ) {

    const a =
      this.getProfile(
        userA
      );

    const b =
      this.getProfile(
        userB
      );

    if (
      !a ||
      !b
    ) {

      return false;

    }

    const friendsA =
      [
        ...(a.friends || [])
      ];

    const friendsB =
      [
        ...(b.friends || [])
      ];

    if (
      !friendsA.includes(
        userB
      )
    ) {

      friendsA.push(
        userB
      );

    }

    if (
      !friendsB.includes(
        userA
      )
    ) {

      friendsB.push(
        userA
      );

    }

    VortexDB.localUpdate(
      "profiles",
      userA,
      {
        friends:
          friendsA
      }
    );

    VortexDB.localUpdate(
      "profiles",
      userB,
      {
        friends:
          friendsB
      }
    );

    return true;

  },


  /* =======================================================
     REMOVE FRIEND
     ======================================================= */

  removeFriend(
    targetUserId
  ) {

    const userId =
      this.getUserId();

    const current =
      this.getProfile(
        userId
      );

    const target =
      this.getProfile(
        targetUserId
      );

    if (
      !current ||
      !target
    ) {

      return {
        success: false
      };

    }

    VortexDB.localUpdate(
      "profiles",
      userId,
      {
        friends:
          (
            current.friends ||
            []
          ).filter(
            id =>
              id !==
              targetUserId
          )
      }
    );

    VortexDB.localUpdate(
      "profiles",
      targetUserId,
      {
        friends:
          (
            target.friends ||
            []
          ).filter(
            id =>
              id !==
              userId
          )
      }
    );

    return {
      success: true
    };

  },


  /* =======================================================
     FRIEND CHECK
     ======================================================= */

  areFriends(
    userA,
    userB
  ) {

    const profile =
      this.getProfile(
        userA
      );

    return Boolean(
      profile &&
      (
        profile.friends ||
        []
      ).includes(
        userB
      )
    );

  },


  /* =======================================================
     CONTACT CHECK
     ======================================================= */

  isContact(
    userA,
    userB
  ) {

    const profile =
      this.getProfile(
        userA
      );

    return Boolean(
      profile &&
      (
        profile.contacts ||
        []
      ).includes(
        userB
      )
    );

  },


  /* =======================================================
     PROFILE
     ======================================================= */

  getProfile(
    userId
  ) {

    if (
      !userId
    ) {

      return null;

    }

    return VortexDB.localFind(
      "profiles",
      userId
    );

  },


  /* =======================================================
     SEARCH POSTS
     ======================================================= */

  searchPosts(
    query
  ) {

    query =
      String(
        query ||
        ""
      )
      .trim()
      .toLowerCase();

    if (!query) {

      return [];

    }

    return this.getFeed({
      limit:
        1000
    }).filter(
      post =>
        String(
          post.text ||
          ""
        )
        .toLowerCase()
        .includes(
          query
        )
    );

  },


  /* =======================================================
     MENTIONS
     ======================================================= */

  extractMentions(
    text
  ) {

    const matches =
      String(
        text ||
        ""
      )
      .match(
        /@[a-zA-Z0-9_.-]+/g
      );

    return matches
      ? [
          ...new Set(
            matches
          )
        ]
      : [];

  },


  /* =======================================================
     HASHTAGS
     ======================================================= */

  extractHashtags(
    text
  ) {

    const matches =
      String(
        text ||
        ""
      )
      .match(
        /#[a-zA-Z0-9_]+/g
      );

    return matches
      ? [
          ...new Set(
            matches
          )
        ]
      : [];

  },


  /* =======================================================
     TRENDING
     ======================================================= */

  trending(
    limit = 20
  ) {

    const posts =
      this.getFeed({
        limit:
          1000
      });

    return posts
      .sort(
        (a, b) => {

          const scoreA =
            (
              (a.likes || []).length *
              3
            ) +

            (
              a.commentsCount ||
              0
            ) *

            4 +

            (
              a.sharesCount ||
              0
            ) *

            5 +

            (
              a.views ||
              0
            ) *

            0.05;

          const scoreB =
            (
              (b.likes || []).length *
              3
            ) +

            (
              b.commentsCount ||
              0
            ) *

            4 +

            (
              b.sharesCount ||
              0
            ) *

            5 +

            (
              b.views ||
              0
            ) *

            0.05;

          return scoreB - scoreA;

        }
      )
      .slice(
        0,
        limit
      );

  },


  /* =======================================================
     EVENT EMITTER
     ======================================================= */

  on(
    event,
    callback
  ) {

    if (
      !this.listeners[event]
    ) {

      this.listeners[event] =
        [];

    }

    this.listeners[event].push(
      callback
    );

    return () => {

      this.listeners[event] =
        (
          this.listeners[event] ||
          []
        ).filter(
          fn =>
            fn !==
            callback
        );

    };

  },


  emit(
    event,
    data
  ) {

    (
      this.listeners[event] ||
      []
    ).forEach(
      callback => {

        try {

          callback(
            data
          );

        } catch (
          error
        ) {

          console.error(
            "VORTEX Social listener error:",
            error
          );

        }

      }
    );

  }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexSocial =
  VortexSocial;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexSocial.init();

  }
);


/* =========================================================
   END OF SOCIAL ENGINE
   ========================================================= */

Next file: 21st — "profile.js"
