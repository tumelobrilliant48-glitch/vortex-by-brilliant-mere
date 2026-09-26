/* =========================================================
   VORTEX POSTS ENGINE
   FILE 16 — posts.js
   ========================================================= */

"use strict";

const VortexPosts = {

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    console.log("📝 VORTEX Posts ready.");

  },


  /* =======================================================
     CURRENT USER
     ======================================================= */

  getUser() {

    return window.VortexAuth?.getUser() || null;

  },


  getUserId() {

    return window.VortexAuth?.getUserId() || null;

  },


  /* =======================================================
     CREATE POST
     ======================================================= */

  async create(data = {}) {

    const user =
      this.getUser();


    if (!user) {

      return {

        success: false,

        error:
          "Login required."

      };

    }


    const text =
      String(
        data.text || ""
      ).trim();


    const media =
      Array.isArray(
        data.media
      )
        ? data.media
        : data.media
          ? [data.media]
          : [];


    if (
      !text &&
      media.length === 0
    ) {

      return {

        success: false,

        error:
          "Write something or add media."

      };

    }


    const visibility =
      this.normalizeVisibility(
        data.visibility ||
        "public"
      );


    const hashtags =
      this.extractHashtags(
        text
      );


    const mentions =
      this.extractMentions(
        text
      );


    const post = {

      id:
        VortexDB.id("post"),

      authorId:
        user.id,

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      text,

      media,

      type:
        this.detectPostType(
          media
        ),

      visibility,

      hashtags,

      mentions,

      location:
        data.location ||
        null,

      feeling:
        data.feeling ||
        null,

      commentsCount:
        0,

      sharesCount:
        0,

      savesCount:
        0,

      views:
        0,

      reactions: {

        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: []

      },

      savedBy: [],

      hiddenFrom: [],

      edited:
        false,

      deleted:
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


    window.dispatchEvent(
      new CustomEvent(
        "vortex:post-created",
        {
          detail:
            post
        }
      )
    );


    return {

      success: true,

      data:
        post

    };

  },


  /* =======================================================
     CREATE TEXT POST
     ======================================================= */

  createText(
    text,
    visibility = "public"
  ) {

    return this.create({

      text,

      visibility

    });

  },


  /* =======================================================
     CREATE MEDIA POST
     ======================================================= */

  async createMedia(
    files,
    text = "",
    visibility = "public"
  ) {

    const user =
      this.getUser();


    if (!user) {

      return {

        success: false,

        error:
          "Login required."

      };

    }


    const fileList =
      Array.isArray(files)
        ? files
        : Array.from(
            files || []
          );


    if (
      fileList.length === 0
    ) {

      return {

        success: false,

        error:
          "No media selected."

      };

    }


    if (!window.VortexMedia) {

      return {

        success: false,

        error:
          "Media system unavailable."

      };

    }


    const prepared = [];


    for (
      const file
      of fileList
    ) {

      const type =
        file.type?.startsWith(
          "video/"
        )
          ? "video"
          : "image";


      const result =
        await VortexMedia.prepare(
          file,
          type
        );


      if (
        result.success
      ) {

        prepared.push(
          result.data
        );

      }

    }


    if (
      prepared.length === 0
    ) {

      return {

        success: false,

        error:
          "Media could not be processed."

      };

    }


    return this.create({

      text,

      media:
        prepared,

      visibility

    });

  },


  /* =======================================================
     DETECT POST TYPE
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


    const hasVideo =
      media.some(
        item =>
          item.type ===
          "video"
      );


    const hasImage =
      media.some(
        item =>
          item.type ===
          "image"
      );


    if (
      hasVideo &&
      hasImage
    ) {

      return "mixed";

    }


    if (hasVideo) {

      return "video";

    }


    return "image";

  },


  /* =======================================================
     VISIBILITY
     ======================================================= */

  normalizeVisibility(
    visibility
  ) {

    const allowed = [

      "public",
      "friends",
      "contacts",
      "private"

    ];


    return allowed.includes(
      visibility
    )
      ? visibility
      : "public";

  },


  /* =======================================================
     EDIT POST
     ======================================================= */

  edit(
    postId,
    updates = {}
  ) {

    const userId =
      this.getUserId();


    const post =
      this.get(postId);


    if (!post) {

      return {

        success: false,

        error:
          "Post not found."

      };

    }


    if (
      post.authorId !==
      userId
    ) {

      return {

        success: false,

        error:
          "You can only edit your own posts."

      };

    }


    const changes = {};


    if (
      updates.text !==
      undefined
    ) {

      changes.text =
        String(
          updates.text
        ).trim();


      changes.hashtags =
        this.extractHashtags(
          changes.text
        );


      changes.mentions =
        this.extractMentions(
          changes.text
        );

    }


    if (
      updates.visibility !==
      undefined
    ) {

      changes.visibility =
        this.normalizeVisibility(
          updates.visibility
        );

    }


    if (
      updates.location !==
      undefined
    ) {

      changes.location =
        updates.location;

    }


    if (
      updates.feeling !==
      undefined
    ) {

      changes.feeling =
        updates.feeling;

    }


    changes.edited =
      true;


    changes.updatedAt =
      new Date().toISOString();


    const updated =
      VortexDB.localUpdate(

        "posts",

        postId,

        changes

      );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:post-updated",
        {
          detail:
            updated
        }
      )
    );


    return {

      success: true,

      data:
        updated

    };

  },


  /* =======================================================
     DELETE POST
     ======================================================= */

  delete(
    postId
  ) {

    const userId =
      this.getUserId();


    const post =
      this.get(postId);


    if (!post) {

      return {

        success: false,

        error:
          "Post not found."

      };

    }


    if (
      post.authorId !==
      userId
    ) {

      return {

        success: false,

        error:
          "You can only delete your own posts."

      };

    }


    const updated =
      VortexDB.localUpdate(

        "posts",

        postId,

        {

          deleted:
            true,

          deletedAt:
            new Date().toISOString()

        }

      );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:post-deleted",
        {
          detail:
            updated
        }
      )
    );


    return {

      success: true,

      data:
        updated

    };

  },


  /* =======================================================
     RESTORE POST
     ======================================================= */

  restore(
    postId
  ) {

    const userId =
      this.getUserId();


    const post =
      this.get(postId);


    if (
      !post ||
      post.authorId !==
      userId
    ) {

      return {

        success: false,

        error:
          "Post unavailable."

      };

    }


    const updated =
      VortexDB.localUpdate(

        "posts",

        postId,

        {

          deleted:
            false,

          deletedAt:
            null

        }

      );


    return {

      success: true,

      data:
        updated

    };

  },


  /* =======================================================
     GET POST
     ======================================================= */

  get(
    postId
  ) {

    return VortexDB.localFind(
      "posts",
      postId
    );

  },


  /* =======================================================
     REACT
     ======================================================= */

  react(
    postId,
    reaction = "like"
  ) {

    const userId =
      this.getUserId();


    if (!userId) {

      return {

        success: false,

        error:
          "Login required."

      };

    }


    const allowed = [

      "like",
      "love",
      "laugh",
      "wow",
      "sad",
      "angry"

    ];


    if (
      !allowed.includes(
        reaction
      )
    ) {

      reaction =
        "like";

    }


    const post =
      this.get(postId);


    if (!post) {

      return {

        success: false,

        error:
          "Post not found."

      };

    }


    const reactions =
      post.reactions ||
      {};


    allowed.forEach(
      type => {

        if (
          !Array.isArray(
            reactions[type]
          )
        ) {

          reactions[type] =
            [];

        }

      }
    );


    let removed =
      false;


    allowed.forEach(
      type => {

        const index =
          reactions[type].indexOf(
            userId
          );


        if (
          type ===
          reaction
        ) {

          if (
            index ===
            -1
          ) {

            reactions[type].push(
              userId
            );

          } else {

            reactions[type].splice(
              index,
              1
            );

            removed =
              true;

          }

        } else {

          if (
            index !==
            -1
          ) {

            reactions[type].splice(
              index,
              1
            );

          }

        }

      }
    );


    const updated =
      VortexDB.localUpdate(

        "posts",

        postId,

        {

          reactions

        }

      );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:post-reaction",
        {
          detail:
            updated
        }
      )
    );


    return {

      success: true,

      reaction:

        removed
          ? null
          : reaction,

      data:
        updated

    };

  },


  /* =======================================================
     LIKE
     ======================================================= */

  like(
    postId
  ) {

    return this.react(
      postId,
      "like"
    );

  },


  /* =======================================================
     GET USER REACTION
     ======================================================= */

  getUserReaction(
    post
  ) {

    const userId =
      this.getUserId();


    if (
      !post ||
      !post.reactions
    ) {

      return null;

    }


    for (
      const type
      of Object.keys(
        post.reactions
      )
    ) {

      if (
        Array.isArray(
          post.reactions[type]
        ) &&
        post.reactions[type].includes(
          userId
        )
      ) {

        return type;

      }

    }


    return null;

  },


  /* =======================================================
     REACTION COUNTS
     ======================================================= */

  getReactionCounts(
    post
  ) {

    const reactions =
      post?.reactions ||
      {};


    const counts = {};


    Object.keys(
      reactions
    ).forEach(
      type => {

        counts[type] =
          Array.isArray(
            reactions[type]
          )
            ? reactions[type].length
            : 0;

      }
    );


    return counts;

  },


  /* =======================================================
     COMMENTS
     ======================================================= */

  addComment(
    postId,
    text
  ) {

    const user =
      this.getUser();


    if (!user) {

      return {

        success: false,

        error:
          "Login required."

      };

    }


    text =
      String(
        text || ""
      ).trim();


    if (!text) {

      return {

        success: false,

        error:
          "Comment cannot be empty."

      };

    }


    const post =
      this.get(postId);


    if (!post) {

      return {

        success: false,

        error:
          "Post not found."

      };

    }


    const comment = {

      id:
        VortexDB.id(
          "comment"
        ),

      postId,

      authorId:
        user.id,

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      text,

      likes: [],

      replies: [],

      deleted:
        false,

      createdAt:
        new Date().toISOString()

    };


    VortexDB.localInsert(
      "comments",
      comment
    );


    VortexDB.localUpdate(

      "posts",

      postId,

      {

        commentsCount:
          Number(
            post.commentsCount ||
            0
          ) + 1

      }

    );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:comment-created",
        {
          detail:
            comment
        }
      )
    );


    return {

      success: true,

      data:
        comment

    };

  },


  /* =======================================================
     GET COMMENTS
     ======================================================= */

  getComments(
    postId
  ) {

    return VortexDB.localFindMany(

      "comments",

      comment =>
        comment.postId ===
        postId &&
        !comment.deleted

    ).sort(
      (a, b) =>
        new Date(
          a.createdAt
        ) -
        new Date(
          b.createdAt
        )
    );

  },


  /* =======================================================
     DELETE COMMENT
     ======================================================= */

  deleteComment(
    commentId
  ) {

    const userId =
      this.getUserId();


    const comment =
      VortexDB.localFind(
        "comments",
        commentId
      );


    if (!comment) {

      return {

        success: false,

        error:
          "Comment not found."

      };

    }


    if (
      comment.authorId !==
      userId
    ) {

      return {

        success: false,

        error:
          "You can only delete your own comment."

      };

    }


    const updated =
      VortexDB.localUpdate(

        "comments",

        commentId,

        {

          deleted:
            true

        }

      );


    const post =
      this.get(
        comment.postId
      );


    if (post) {

      VortexDB.localUpdate(

        "posts",

        post.id,

        {

          commentsCount:
            Math.max(
              0,
              Number(
                post.commentsCount ||
                0
              ) - 1
            )

        }

      );

    }


    return {

      success: true,

      data:
        updated

    };

  },


  /* =======================================================
     SAVE POST
     ======================================================= */

  save(
    postId
  ) {

    const userId =
      this.getUserId();


    const post =
      this.get(postId);


    if (
      !userId ||
      !post
    ) {

      return {

        success: false,

        error:
          "Post unavailable."

      };

    }


    const savedBy =
      Array.isArray(
        post.savedBy
      )
        ? [
            ...post.savedBy
          ]
        : [];


    const index =
      savedBy.indexOf(
        userId
      );


    let saved;


    if (
      index ===
      -1
    ) {

      savedBy.push(
        userId
      );

      saved =
        true;

    } else {

      savedBy.splice(
        index,
        1
      );

      saved =
        false;

    }


    const updated =
      VortexDB.localUpdate(

        "posts",

        postId,

        {

          savedBy,

          savesCount:
            savedBy.length

        }

      );


    return {

      success: true,

      saved,

      data:
        updated

    };

  },


  /* =======================================================
     SHARE / REPOST
     ======================================================= */

  share(
    postId,
    text = ""
  ) {

    const user =
      this.getUser();


    const original =
      this.get(postId);


    if (
      !user ||
      !original
    ) {

      return {

        success: false,

        error:
          "Post unavailable."

      };

    }


    const result =
      this.create({

        text,

        media:
          original.media ||
          [],

        visibility:
          "public"

      });


    if (
      !result.success
    ) {

      return result;

    }


    VortexDB.localUpdate(

      "posts",

      postId,

      {

        sharesCount:
          Number(
            original.sharesCount ||
            0
          ) + 1

      }

    );


    const repost =
      VortexDB.localUpdate(

        "posts",

        result.data.id,

        {

          sharedFrom:
            postId,

          originalAuthorId:
            original.authorId

        }

      );


    return {

      success: true,

      data:
        repost

    };

  },


  /* =======================================================
     VIEW
     ======================================================= */

  registerView(
    postId
  ) {

    const post =
      this.get(postId);


    if (!post) {

      return false;

    }


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


    return true;

  },


  /* =======================================================
     HIDE POST
     ======================================================= */

  hide(
    postId
  ) {

    const userId =
      this.getUserId();


    const post =
      this.get(postId);


    if (
      !post ||
      !userId
    ) {

      return {

        success: false

      };

    }


    const hiddenFrom =
      Array.isArray(
        post.hiddenFrom
      )
        ? [
            ...post.hiddenFrom
          ]
        : [];


    if (
      !hiddenFrom.includes(
        userId
      )
    ) {

      hiddenFrom.push(
        userId
      );

    }


    VortexDB.localUpdate(

      "posts",

      postId,

      {

        hiddenFrom

      }

    );


    return {

      success: true

    };

  },


  /* =======================================================
     UNHIDE
     ======================================================= */

  unhide(
    postId
  ) {

    const userId =
      this.getUserId();


    const post =
      this.get(postId);


    if (
      !post ||
      !userId
    ) {

      return {

        success: false

      };

    }


    const hiddenFrom =
      (
        post.hiddenFrom ||
        []
      ).filter(
        id =>
          id !==
          userId
      );


    VortexDB.localUpdate(

      "posts",

      postId,

      {

        hiddenFrom

      }

    );


    return {

      success: true

    };

  },


  /* =======================================================
     GET FEED
     ======================================================= */

  getFeed(
    limit = 50
  ) {

    const userId =
      this.getUserId();


    const all =
      VortexDB.localFindMany(

        "posts",

        post =>
          !post.deleted &&
          !(
            post.hiddenFrom ||
            []
          ).includes(
            userId
          )

      );


    const visible =
      all.filter(
        post =>
          this.canView(
            post,
            userId
          )
      );


    visible.sort(
      (a, b) =>
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
    );


    return visible.slice(
      0,
      limit
    );

  },


  /* =======================================================
     PRIVACY CHECK
     ======================================================= */

  canView(
    post,
    viewerId
  ) {

    if (!post) {

      return false;

    }


    if (
      post.deleted
    ) {

      return false;

    }


    if (
      post.authorId ===
      viewerId
    ) {

      return true;

    }


    if (
      post.visibility ===
      "public"
    ) {

      return true;

    }


    if (
      post.visibility ===
      "private"
    ) {

      return false;

    }


    if (
      window.VortexProfiles
    ) {

      return VortexProfiles.canViewPost(
        post,
        viewerId
      );

    }


    return false;

  },


  /* =======================================================
     HASHTAGS
     ======================================================= */

  extractHashtags(
    text
  ) {

    const matches =
      String(
        text || ""
      ).match(
        /#[a-zA-Z0-9_]+/g
      );


    return matches
      ? [
          ...new Set(
            matches.map(
              tag =>
                tag
                  .slice(1)
                  .toLowerCase()
            )
          )
        ]
      : [];

  },


  /* =======================================================
     MENTIONS
     ======================================================= */

  extractMentions(
    text
  ) {

    const matches =
      String(
        text || ""
      ).match(
        /@[a-zA-Z0-9_]+/g
      );


    return matches
      ? [
          ...new Set(
            matches.map(
              name =>
                name
                  .slice(1)
                  .toLowerCase()
            )
          )
        ]
      : [];

  },


  /* =======================================================
     HASHTAG SEARCH
     ======================================================= */

  searchHashtag(
    hashtag
  ) {

    hashtag =
      String(
        hashtag || ""
      )
      .replace(
        /^#/,
        ""
      )
      .toLowerCase();


    return VortexDB.localFindMany(

      "posts",

      post =>
        !post.deleted &&
        Array.isArray(
          post.hashtags
        ) &&
        post.hashtags.includes(
          hashtag
        )

    ).sort(
      (a, b) =>
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
    );

  },


  /* =======================================================
     USER POSTS
     ======================================================= */

  getUserPosts(
    userId
  ) {

    return VortexDB.localFindMany(

      "posts",

      post =>
        !post.deleted &&
        post.authorId ===
        userId

    ).sort(
      (a, b) =>
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
    );

  },


  /* =======================================================
     SAVED POSTS
     ======================================================= */

  getSavedPosts() {

    const userId =
      this.getUserId();


    if (!userId) {

      return [];

    }


    return VortexDB.localFindMany(

      "posts",

      post =>
        !post.deleted &&
        Array.isArray(
          post.savedBy
        ) &&
        post.savedBy.includes(
          userId
        )

    );

  },


  /* =======================================================
     DELETE ALL USER POSTS
     ======================================================= */

  deleteAllMyPosts() {

    const userId =
      this.getUserId();


    if (!userId) {

      return {

        success: false,

        error:
          "Login required."

      };

    }


    const posts =
      this.getUserPosts(
        userId
      );


    posts.forEach(
      post => {

        this.delete(
          post.id
        );

      }
    );


    return {

      success: true,

      deleted:
        posts.length

    };

  }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexPosts =
  VortexPosts;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexPosts.init();

  }
);


/* =========================================================
   END OF POSTS ENGINE
   ========================================================= */
