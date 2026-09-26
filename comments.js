/* =========================================================
   VORTEX COMMENTS ENGINE
   FILE 25 — comments.js

   Comments
   Replies
   Likes
   Mentions
   Editing
   Deleting
   Reporting
   Comment notifications
   ========================================================= */

"use strict";

const VortexComments = {

  VERSION: "1.0.0",

  comments: new Map(),
  listeners: {},

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();

    console.log(
      "💬 VORTEX Comments Engine ready."
    );

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
        id: this.getUserId(),
        name: "VORTEX User",
        avatar: ""
      }
    );

  },

  /* =======================================================
     ID
     ======================================================= */

  id() {

    return (
      "comment_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );

  },

  /* =======================================================
     ADD COMMENT
     ======================================================= */

  async add(
    postId,
    text,
    options = {}
  ) {

    if (!postId) {

      return {
        success: false,
        error: "Post ID is required."
      };

    }

    const cleanText =
      String(
        text || ""
      ).trim();

    if (!cleanText) {

      return {
        success: false,
        error: "Comment cannot be empty."
      };

    }

    const post =
      window.VortexPosts?.getPost?.(
        postId
      );

    if (
      post &&
      post.allowComments === false
    ) {

      return {
        success: false,
        error: "Comments are disabled."
      };

    }

    const user =
      this.getUser();

    const comment = {

      id:
        this.id(),

      postId,

      authorId:
        user.id ||
        this.getUserId(),

      authorName:
        user.name ||
        "VORTEX User",

      authorAvatar:
        user.avatar ||
        "",

      text:
        cleanText,

      parentId:
        options.parentId ||
        null,

      mentions:
        this.extractMentions(
          cleanText
        ),

      likes: [],

      replies: [],

      edited: false,

      deleted: false,

      reported: false,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    if (
      !this.comments.has(
        postId
      )
    ) {

      this.comments.set(
        postId,
        []
      );

    }

    this.comments
      .get(postId)
      .push(
        comment
      );

    this.save();

    this.updatePostCount(
      postId
    );

    this.emit(
      "commentAdded",
      comment
    );

    this.createNotification(
      comment
    );

    return {
      success: true,
      comment
    };

  },

  /* =======================================================
     REPLY
     ======================================================= */

  async reply(
    postId,
    parentCommentId,
    text
  ) {

    return this.add(
      postId,
      text,
      {
        parentId:
          parentCommentId
      }
    );

  },

  /* =======================================================
     GET COMMENTS
     ======================================================= */

  get(
    postId,
    options = {}
  ) {

    let list =
      this.comments.get(
        postId
      ) ||
      [];

    list =
      list.filter(
        comment =>
          !comment.deleted
      );

    if (
      options.parentId !==
      undefined
    ) {

      list =
        list.filter(
          comment =>
            (
              comment.parentId ||
              null
            ) ===
            (
              options.parentId ||
              null
            )
        );

    }

    return list.sort(
      (
        a,
        b
      ) =>
        new Date(
          a.createdAt
        ) -
        new Date(
          b.createdAt
        )
    );

  },

  /* =======================================================
     GET ROOT COMMENTS
     ======================================================= */

  getRoot(
    postId
  ) {

    return this.get(
      postId,
      {
        parentId:
          null
      }
    );

  },

  /* =======================================================
     GET REPLIES
     ======================================================= */

  getReplies(
    postId,
    commentId
  ) {

    return this.get(
      postId,
      {
        parentId:
          commentId
      }
    );

  },

  /* =======================================================
     FIND COMMENT
     ======================================================= */

  find(
    commentId
  ) {

    for (
      const comments
      of this.comments.values()
    ) {

      const found =
        comments.find(
          comment =>
            comment.id ===
            commentId
        );

      if (found) {

        return found;

      }

    }

    return null;

  },

  /* =======================================================
     LIKE COMMENT
     ======================================================= */

  like(
    commentId
  ) {

    const comment =
      this.find(
        commentId
      );

    if (!comment) {

      return {
        success: false,
        error: "Comment not found."
      };

    }

    const userId =
      this.getUserId();

    comment.likes =
      comment.likes ||
      [];

    const index =
      comment.likes.indexOf(
        userId
      );

    if (
      index >= 0
    ) {

      comment.likes.splice(
        index,
        1
      );

    } else {

      comment.likes.push(
        userId
      );

    }

    comment.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "commentLiked",
      comment
    );

    return {

      success: true,

      liked:
        index < 0,

      count:
        comment.likes.length

    };

  },

  /* =======================================================
     EDIT COMMENT
     ======================================================= */

  edit(
    commentId,
    newText
  ) {

    const comment =
      this.find(
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
      this.getUserId()
    ) {

      return {
        success: false,
        error:
          "You can only edit your own comment."
      };

    }

    const clean =
      String(
        newText || ""
      ).trim();

    if (!clean) {

      return {
        success: false,
        error:
          "Comment cannot be empty."
      };

    }

    comment.text =
      clean;

    comment.mentions =
      this.extractMentions(
        clean
      );

    comment.edited =
      true;

    comment.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "commentEdited",
      comment
    );

    return {
      success: true,
      comment
    };

  },

  /* =======================================================
     DELETE COMMENT
     ======================================================= */

  delete(
    commentId
  ) {

    const comment =
      this.find(
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
      this.getUserId()
    ) {

      return {
        success: false,
        error:
          "You can only delete your own comment."
      };

    }

    comment.deleted =
      true;

    comment.text =
      "";

    comment.updatedAt =
      new Date().toISOString();

    this.save();

    this.updatePostCount(
      comment.postId
    );

    this.emit(
      "commentDeleted",
      comment
    );

    return {
      success: true
    };

  },

  /* =======================================================
     REPORT COMMENT
     ======================================================= */

  report(
    commentId,
    reason = "other"
  ) {

    const comment =
      this.find(
        commentId
      );

    if (!comment) {

      return {
        success: false,
        error:
          "Comment not found."
      };

    }

    const reports =
      JSON.parse(
        localStorage.getItem(
          "vortex_comment_reports"
        ) ||
        "[]"
      );

    reports.push({

      id:
        "report_" +
        Date.now(),

      commentId,

      reporterId:
        this.getUserId(),

      reason,

      createdAt:
        new Date().toISOString()

    });

    localStorage.setItem(
      "vortex_comment_reports",
      JSON.stringify(
        reports
      )
    );

    comment.reported =
      true;

    this.save();

    this.emit(
      "commentReported",
      comment
    );

    return {
      success: true
    };

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
        /@[a-zA-Z0-9_.-]+/g
      );

    if (!matches) {

      return [];

    }

    return [
      ...new Set(
        matches.map(
          item =>
            item.slice(1)
        )
      )
    ];

  },

  /* =======================================================
     SEARCH COMMENTS
     ======================================================= */

  search(
    postId,
    query
  ) {

    const q =
      String(
        query || ""
      )
      .toLowerCase()
      .trim();

    if (!q) {

      return this.get(
        postId
      );

    }

    return this.get(
      postId
    ).filter(
      comment =>

        comment.text
          .toLowerCase()
          .includes(
            q
          ) ||

        comment.authorName
          .toLowerCase()
          .includes(
            q
          )

    );

  },

  /* =======================================================
     COMMENT COUNT
     ======================================================= */

  count(
    postId
  ) {

    return this.get(
      postId
    ).length;

  },

  /* =======================================================
     UPDATE POST COMMENT COUNT
     ======================================================= */

  updatePostCount(
    postId
  ) {

    const post =
      window.VortexPosts?.getPost?.(
        postId
      );

    if (!post) {

      return;

    }

    post.commentsCount =
      this.count(
        postId
      );

    if (
      typeof window.VortexPosts.save ===
      "function"
    ) {

      window.VortexPosts.save();

    }

  },

  /* =======================================================
     CREATE NOTIFICATION
     ======================================================= */

  createNotification(
    comment
  ) {

    const post =
      window.VortexPosts?.getPost?.(
        comment.postId
      );

    if (!post) {

      return;

    }

    if (
      post.authorId ===
      comment.authorId
    ) {

      return;

    }

    const notification = {

      id:
        "notification_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 8),

      type:
        "comment",

      postId:
        comment.postId,

      commentId:
        comment.id,

      fromUserId:
        comment.authorId,

      fromUserName:
        comment.authorName,

      message:
        `${comment.authorName} commented on your post.`,

      read:
        false,

      createdAt:
        new Date().toISOString()

    };

    const notifications =
      JSON.parse(
        localStorage.getItem(
          "vortex_notifications"
        ) ||
        "[]"
      );

    notifications.unshift(
      notification
    );

    localStorage.setItem(
      "vortex_notifications",
      JSON.stringify(
        notifications
      )
    );

    this.emit(
      "notificationCreated",
      notification
    );

  },

  /* =======================================================
     RENDER COMMENT
     ======================================================= */

  render(
    comment,
    options = {}
  ) {

    const element =
      document.createElement(
        "div"
      );

    element.className =
      "vortex-comment";

    element.dataset.commentId =
      comment.id;

    const liked =
      comment.likes?.includes(
        this.getUserId()
      );

    element.style.cssText = `

      display:flex;

      gap:10px;

      padding:
        10px 0;

      border-bottom:
        1px solid
        rgba(255,255,255,.06);

    `;

    element.innerHTML = `

      <img
        src="${
          comment.authorAvatar ||
          "https://i.pravatar.cc/80"
        }"
        style="
          width:36px;
          height:36px;
          border-radius:50%;
          object-fit:cover;
          flex-shrink:0;
        "
      >

      <div style="
        flex:1;
      ">

        <div style="
          background:
            rgba(255,255,255,.06);

          border-radius:
            15px;

          padding:
            8px 11px;
        ">

          <b style="
            font-size:13px;
          ">
            ${this.escape(
              comment.authorName
            )}
          </b>

          <div style="
            margin-top:3px;
            line-height:1.4;
            word-break:break-word;
          ">
            ${this.escape(
              comment.text
            )}
          </div>

        </div>

        <div style="
          display:flex;
          gap:15px;
          margin-top:5px;
          padding-left:8px;
          font-size:11px;
          opacity:.7;
        ">

          <button
            data-action="like"
            style="
              border:0;
              background:none;
              color:${
                liked
                  ? "#00d9ff"
                  : "#aaa"
              };
            "
          >
            ${
              liked
                ? "❤️"
                : "👍"
            }
            ${comment.likes?.length || 0}
          </button>

          <button
            data-action="reply"
            style="
              border:0;
              background:none;
              color:#aaa;
            "
          >
            Reply
          </button>

          <button
            data-action="menu"
            style="
              border:0;
              background:none;
              color:#aaa;
            "
          >
            •••
          </button>

          <span>
            ${this.timeAgo(
              comment.createdAt
            )}
          </span>

          ${
            comment.edited
              ? "<span>edited</span>"
              : ""
          }

        </div>

      </div>

    `;

    element.addEventListener(
      "click",
      event => {

        const action =
          event.target.closest(
            "[data-action]"
          )?.dataset.action;

        if (!action) {

          return;

        }

        if (
          action ===
          "like"
        ) {

          this.like(
            comment.id
          );

        }

        if (
          action ===
          "reply"
        ) {

          this.emit(
            "replyRequested",
            comment
          );

        }

        if (
          action ===
          "menu"
        ) {

          this.emit(
            "commentMenu",
            comment
          );

        }

      }
    );

    return element;

  },

  /* =======================================================
     RENDER COMMENT LIST
     ======================================================= */

  renderList(
    postId,
    container
  ) {

    if (
      typeof container ===
      "string"
    ) {

      container =
        document.querySelector(
          container
        );

    }

    if (!container) {

      return;

    }

    container.innerHTML =
      "";

    const comments =
      this.getRoot(
        postId
      );

    if (
      comments.length ===
      0
    ) {

      container.innerHTML = `

        <div style="
          text-align:center;
          padding:25px;
          opacity:.5;
        ">

          💬 No comments yet.

          <br>

          Be the first to comment.

        </div>

      `;

      return;

    }

    comments.forEach(
      comment => {

        container.appendChild(
          this.render(
            comment
          )
        );

        const replies =
          this.getReplies(
            postId,
            comment.id
          );

        if (
          replies.length
        ) {

          replies.forEach(
            reply => {

              const replyElement =
                this.render(
                  reply
                );

              replyElement.style.marginLeft =
                "40px";

              container.appendChild(
                replyElement
              );

            }
          );

        }

      }
    );

  },

  /* =======================================================
     TIME AGO
     ======================================================= */

  timeAgo(
    date
  ) {

    const seconds =
      Math.floor(
        (
          Date.now() -
          new Date(
            date
          ).getTime()
        ) / 1000
      );

    if (
      seconds < 60
    ) {

      return "now";

    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (
      minutes < 60
    ) {

      return `${minutes}m`;

    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (
      hours < 24
    ) {

      return `${hours}h`;

    }

    const days =
      Math.floor(
        hours / 24
      );

    if (
      days < 7
    ) {

      return `${days}d`;

    }

    return new Date(
      date
    ).toLocaleDateString();

  },

  /* =======================================================
     ESCAPE HTML
     ======================================================= */

  escape(
    value
  ) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      String(
        value ??
        ""
      );

    return div.innerHTML;

  },

  /* =======================================================
     SAVE
     ======================================================= */

  save() {

    try {

      const data =
        Object.fromEntries(
          this.comments
        );

      localStorage.setItem(
        "vortex_comments",
        JSON.stringify(
          data
        )
      );

    } catch (
      error
    ) {

      console.warn(
        "VORTEX comments save failed:",
        error
      );

    }

  },

  /* =======================================================
     LOAD
     ======================================================= */

  load() {

    try {

      const data =
        JSON.parse(
          localStorage.getItem(
            "vortex_comments"
          ) ||
          "{}"
        );

      Object.entries(
        data
      ).forEach(
        ([
          postId,
          comments
        ]) => {

          this.comments.set(
            postId,
            comments
          );

        }
      );

    } catch (
      error
    ) {

      console.warn(
        "VORTEX comments load failed:",
        error
      );

    }

  },

  /* =======================================================
     EVENTS
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
        this.listeners[event].filter(
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
            "VORTEX comment event error:",
            error
          );

        }

      }
    );

  }

};


/* =========================================================
   GLOBAL VORTEX COMMENTS
   ========================================================= */

window.VortexComments =
  VortexComments;


/* =========================================================
   START ENGINE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexComments.init();

  }
);
