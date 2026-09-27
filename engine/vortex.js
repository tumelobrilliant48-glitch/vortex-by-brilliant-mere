"use strict";

/* =========================================
   SOCIALBOOK — SOCIAL.JS
   Feed / Posts / Likes / Comments / Sharing
========================================= */

const Social = {

  api: "/api",

  state: {
    posts: [],
    loading: false,
    page: 1
  },

  /* =========================================
     INITIALIZE
  ========================================= */

  init() {
    this.bindEvents();
    this.loadFeed();
  },

  /* =========================================
     EVENTS
  ========================================= */

  bindEvents() {

    const postInput = document.getElementById("postInput");

    if (postInput) {

      postInput.addEventListener("keydown", (event) => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          this.createPost();

        }

      });

    }

    document.addEventListener("click", (event) => {

      const likeButton =
        event.target.closest("[data-action='like']");

      const commentButton =
        event.target.closest("[data-action='comment']");

      const shareButton =
        event.target.closest("[data-action='share']");

      const deleteButton =
        event.target.closest("[data-action='delete']");

      if (likeButton) {
        this.toggleLike(
          likeButton.dataset.postId
        );
      }

      if (commentButton) {
        this.openComments(
          commentButton.dataset.postId
        );
      }

      if (shareButton) {
        this.sharePost(
          shareButton.dataset.postId
        );
      }

      if (deleteButton) {
        this.deletePost(
          deleteButton.dataset.postId
        );
      }

    });

  },

  /* =========================================
     LOAD FEED
  ========================================= */

  async loadFeed() {

    if (this.state.loading) return;

    this.state.loading = true;

    try {

      const response = await fetch(
        `${this.api}/posts?page=${this.state.page}`
      );

      if (!response.ok) {
        throw new Error("Unable to load posts");
      }

      const data = await response.json();

      const posts =
        data.posts ||
        data.data ||
        [];

      this.state.posts = posts;

      this.renderFeed(posts);

    } catch (error) {

      console.error(
        "Feed error:",
        error
      );

      this.showMessage(
        "Unable to load your feed."
      );

    } finally {

      this.state.loading = false;

    }

  },

  /* =========================================
     CREATE POST
  ========================================= */

  async createPost() {

    const input =
      document.getElementById("postInput");

    if (!input) return;

    const content =
      input.value.trim();

    if (!content) {

      this.showMessage(
        "Write something first."
      );

      return;
    }

    try {

      const response = await fetch(
        `${this.api}/posts`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            content
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Post failed"
        );
      }

      input.value = "";

      const post =
        data.post ||
        data.data;

      if (post) {

        this.state.posts.unshift(post);

        this.renderFeed(
          this.state.posts
        );

      } else {

        await this.loadFeed();

      }

    } catch (error) {

      console.error(
        "Create post error:",
        error
      );

      this.showMessage(
        error.message ||
        "Unable to create post."
      );

    }

  },

  /* =========================================
     LIKE / UNLIKE
  ========================================= */

  async toggleLike(postId) {

    if (!postId) return;

    try {

      const response = await fetch(
        `${this.api}/likes/${postId}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Like failed"
        );
      }

      this.updatePostLike(
        postId,
        data
      );

    } catch (error) {

      console.error(
        "Like error:",
        error
      );

    }

  },

  /* =========================================
     COMMENTS
  ========================================= */

  async addComment(
    postId,
    content
  ) {

    if (!postId || !content.trim()) {
      return;
    }

    try {

      const response = await fetch(
        `${this.api}/comments`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            post_id: postId,
            content: content.trim()
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Comment failed"
        );
      }

      return data;

    } catch (error) {

      console.error(
        "Comment error:",
        error
      );

      this.showMessage(
        "Unable to add comment."
      );

    }

  },

  /* =========================================
     OPEN COMMENTS
  ========================================= */

  async openComments(postId) {

    try {

      const response = await fetch(
        `${this.api}/comments/post/${postId}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load comments"
        );
      }

      this.showComments(
        postId,
        data.comments ||
        data.data ||
        []
      );

    } catch (error) {

      console.error(
        "Comments error:",
        error
      );

    }

  },

  /* =========================================
     SHARE
  ========================================= */

  async sharePost(postId) {

    const shareData = {
      title: "SocialBook",
      text: "Check out this post on SocialBook.",
      url:
        `${window.location.origin}/post/${postId}`
    };

    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData
        );

      } else {

        await navigator.clipboard.writeText(
          shareData.url
        );

        this.showMessage(
          "Post link copied."
        );

      }

    } catch (error) {

      console.log(
        "Share cancelled."
      );

    }

  },

  /* =========================================
     DELETE POST
  ========================================= */

  async deletePost(postId) {

    if (
      !confirm(
        "Delete this post?"
      )
    ) {
      return;
    }

    try {

      const response = await fetch(
        `${this.api}/posts/${postId}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to delete post"
        );
      }

      this.state.posts =
        this.state.posts.filter(
          post =>
            String(post.id) !==
            String(postId)
        );

      this.renderFeed(
        this.state.posts
      );

    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      this.showMessage(
        "Unable to delete post."
      );

    }

  },

  /* =========================================
     RENDER FEED
  ========================================= */

  renderFeed(posts) {

    const feed =
      document.getElementById("feed");

    if (!feed) return;

    if (!posts.length) {

      feed.innerHTML = `
        <div class="card">
          <p>No posts yet.</p>
        </div>
      `;

      return;
    }

    feed.innerHTML =
      posts
        .map(post =>
          this.renderPost(post)
        )
        .join("");

  },

  /* =========================================
     RENDER POST
  ========================================= */

  renderPost(post) {

    const user =
      post.user ||
      {};

    const username =
      user.display_name ||
      user.username ||
      post.display_name ||
      "SocialBook User";

    const avatar =
      user.avatar_url ||
      post.avatar_url ||
      "";

    const content =
      this.escapeHTML(
        post.content ||
        ""
      );

    const image =
      post.media_url ||
      post.image ||
      "";

    const likes =
      Number(
        post.like_count ||
        post.likes ||
        0
      );

    const comments =
      Number(
        post.comment_count ||
        post.comments ||
        0
      );

    const shares =
      Number(
        post.share_count ||
        post.shares ||
        0
      );

    const liked =
      post.liked ||
      post.is_liked ||
      false;

    return `

      <article
        class="card social-post"
        data-post-id="${post.id}"
      >

        <div class="post-header">

          ${this.avatarHTML(
            avatar,
            username
          )}

          <div>

            <div class="post-name">
              ${this.escapeHTML(username)}
            </div>

            <div class="post-time">
              ${this.formatDate(
                post.created_at
              )}
            </div>

          </div>

        </div>

        ${
          content
            ? `
              <p class="post-text">
                ${content}
              </p>
            `
            : ""
        }

        ${
          image
            ? `
              <img
                class="post-image"
                src="${this.escapeAttribute(image)}"
                alt="Post image"
                loading="lazy"
              >
            `
            : ""
        }

        <div class="stats">

          <span>
            👍 ${likes}
          </span>

          <span>
            ${comments} Comments ·
            ${shares} Shares
          </span>

        </div>

        <div class="actions">

          <button
            data-action="like"
            data-post-id="${post.id}"
          >
            ${liked ? "❤️ Liked" : "👍 Like"}
          </button>

          <button
            data-action="comment"
            data-post-id="${post.id}"
          >
            💬 Comment
          </button>

          <button
            data-action="share"
            data-post-id="${post.id}"
          >
            ↗️ Share
          </button>

        </div>

      </article>

    `;

  },

  /* =========================================
     COMMENTS UI
  ========================================= */

  showComments(
    postId,
    comments
  ) {

    const html =
      comments.length
        ? comments
            .map(comment => `

              <div class="comment">

                <strong>
                  ${this.escapeHTML(
                    comment.username ||
                    comment.display_name ||
                    "User"
                  )}
                </strong>

                <p>
                  ${this.escapeHTML(
                    comment.content
                  )}
                </p>

              </div>

            `)
            .join("")
        : "<p>No comments yet.</p>";

    const content =
      prompt(
        "Comments:\n\n" +
        comments
          .map(c =>
            `${c.username || "User"}: ${c.content}`
          )
          .join("\n\n") +
        "\n\nWrite a new comment:"
      );

    if (content) {

      this.addComment(
        postId,
        content
      );

    }

  },

  /* =========================================
     UPDATE LIKE COUNT
  ========================================= */

  updatePostLike(
    postId,
    data
  ) {

    const post =
      this.state.posts.find(
        item =>
          String(item.id) ===
          String(postId)
      );

    if (!post) return;

    if (
      typeof data.liked !==
      "undefined"
    ) {

      post.liked =
        data.liked;

    }

    if (
      typeof data.like_count !==
      "undefined"
    ) {

      post.like_count =
        data.like_count;

    }

    this.renderFeed(
      this.state.posts
    );

  },

  /* =========================================
     AVATAR
  ========================================= */

  avatarHTML(
    avatar,
    username
  ) {

    if (avatar) {

      return `
        <img
          class="avatar"
          src="${this.escapeAttribute(avatar)}"
          alt="${this.escapeAttribute(username)}"
        >
      `;

    }

    const letter =
      (username || "U")
        .charAt(0)
        .toUpperCase();

    return `
      <div class="avatar">
        ${this.escapeHTML(letter)}
      </div>
    `;

  },

  /* =========================================
     DATE
  ========================================= */

  formatDate(date) {

    if (!date) {
      return "Just now";
    }

    const time =
      new Date(date);

    if (Number.isNaN(
      time.getTime()
    )) {

      return "Just now";

    }

    return time.toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  },

  /* =========================================
     MESSAGE
  ========================================= */

  showMessage(message) {

    console.log(
      "SocialBook:",
      message
    );

    alert(message);

  },

  /* =========================================
     SECURITY
  ========================================= */

  escapeHTML(value) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      String(value ?? "");

    return div.innerHTML;

  },

  escapeAttribute(value) {

    return this.escapeHTML(
      value
    )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }

};


/* =========================================
   START SOCIAL SYSTEM
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    Social.init();

  }
);


/* =========================================
   GLOBAL ACCESS
========================================= */

window.Social = Social;
