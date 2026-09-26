/* =========================================================
   VORTEX OMNIVERSE
   REELS ENGINE
   File: Reels.js
   ========================================================= */

"use strict";

const VortexReels = {

  VERSION: "1.0.0",
  STORAGE_KEY: "vortex_reels",

  reels: new Map(),
  likes: new Map(),
  saves: new Map(),
  views: new Map(),
  comments: new Map(),
  follows: new Set(),

  state: {
    initialized: false,
    currentReel: null,
    currentIndex: 0,
    feed: [],
    muted: false,
    autoplay: true,
    loop: true,
    loading: false
  },

  listeners: {},

  /* =======================================================
     INIT
     ======================================================= */

  async init() {
    if (this.state.initialized) return this;

    this.load();

    this.state.initialized = true;

    this.emit("ready", {
      count: this.reels.size
    });

    return this;
  },

  /* =======================================================
     USER
     ======================================================= */

  getUserId() {
    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexFriends?.getUserId?.() ||
      "guest"
    );
  },

  getUserName() {
    return (
      window.VortexAuth?.getUser?.()?.name ||
      window.VortexAuth?.getUser?.()?.username ||
      "VORTEX User"
    );
  },

  /* =======================================================
     ID
     ======================================================= */

  createId(prefix = "reel") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 9)
    );
  },

  /* =======================================================
     CREATE REEL
     ======================================================= */

  create(data = {}) {

    const userId = data.userId || this.getUserId();

    const reel = {
      id: data.id || this.createId(),

      userId,

      username:
        data.username ||
        this.getUserName(),

      avatar:
        data.avatar ||
        window.VortexAuth?.getUser?.()?.avatar ||
        "",

      video: data.video || data.url || "",

      thumbnail:
        data.thumbnail ||
        data.cover ||
        "",

      caption: data.caption || "",

      title: data.title || "",

      hashtags:
        Array.isArray(data.hashtags)
          ? data.hashtags
          : this.extractHashtags(data.caption || ""),

      mentions:
        Array.isArray(data.mentions)
          ? data.mentions
          : this.extractMentions(data.caption || ""),

      music: data.music || null,

      duration: Number(data.duration || 0),

      visibility:
        data.visibility ||
        "public",

      location:
        data.location ||
        "",

      category:
        data.category ||
        "general",

      allowComments:
        data.allowComments !== false,

      allowDuet:
        data.allowDuet !== false,

      allowRemix:
        data.allowRemix !== false,

      createdAt:
        data.createdAt ||
        Date.now(),

      updatedAt:
        Date.now(),

      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0
      },

      metadata: {
        width: data.width || 0,
        height: data.height || 0,
        size: data.size || 0,
        mimeType:
          data.mimeType ||
          "video/mp4"
      }
    };

    this.reels.set(reel.id, reel);

    this.save();

    this.emit("created", reel);

    return reel;
  },

  /* =======================================================
     UPDATE
     ======================================================= */

  update(id, changes = {}) {

    const reel = this.reels.get(id);

    if (!reel) {
      throw new Error("Reel not found");
    }

    const blocked = [
      "id",
      "userId",
      "createdAt",
      "stats"
    ];

    Object.keys(changes).forEach(key => {

      if (!blocked.includes(key)) {
        reel[key] = changes[key];
      }

    });

    if (changes.caption !== undefined) {

      reel.hashtags =
        this.extractHashtags(
          changes.caption
        );

      reel.mentions =
        this.extractMentions(
          changes.caption
        );
    }

    reel.updatedAt = Date.now();

    this.save();

    this.emit("updated", reel);

    return reel;
  },

  /* =======================================================
     DELETE
     ======================================================= */

  delete(id) {

    const reel = this.reels.get(id);

    if (!reel) return false;

    if (
      reel.userId !== this.getUserId() &&
      this.getUserId() !== "admin"
    ) {
      return false;
    }

    this.reels.delete(id);
    this.likes.delete(id);
    this.saves.delete(id);
    this.views.delete(id);
    this.comments.delete(id);

    this.save();

    this.emit("deleted", {
      id
    });

    return true;
  },

  /* =======================================================
     GET REEL
     ======================================================= */

  get(id) {
    return this.reels.get(id) || null;
  },

  getAll() {
    return Array.from(this.reels.values());
  },

  /* =======================================================
     FEED
     ======================================================= */

  getFeed(options = {}) {

    const currentUser =
      options.userId ||
      this.getUserId();

    let feed =
      this.getAll()
        .filter(reel => {

          if (reel.visibility === "public") {
            return true;
          }

          if (
            reel.visibility === "private" &&
            reel.userId === currentUser
          ) {
            return true;
          }

          if (
            reel.visibility === "followers" &&
            this.follows.has(reel.userId)
          ) {
            return true;
          }

          return false;
        });

    if (options.category) {

      feed =
        feed.filter(
          reel =>
            reel.category ===
            options.category
        );
    }

    if (options.hashtag) {

      const tag =
        options.hashtag
          .replace("#", "")
          .toLowerCase();

      feed =
        feed.filter(reel =>
          reel.hashtags
            .map(x => x.toLowerCase())
            .includes(tag)
        );
    }

    if (options.userId) {

      feed =
        feed.filter(
          reel =>
            reel.userId === options.userId
        );
    }

    feed.sort(
      (a, b) =>
        b.createdAt - a.createdAt
    );

    if (options.limit) {
      feed =
        feed.slice(
          0,
          Number(options.limit)
        );
    }

    this.state.feed = feed;

    return feed;
  },

  /* =======================================================
     TRENDING
     ======================================================= */

  getTrending(limit = 30) {

    return this.getAll()
      .filter(
        reel =>
          reel.visibility === "public"
      )
      .sort((a, b) => {

        const scoreA =
          (a.stats.views * 1) +
          (a.stats.likes * 4) +
          (a.stats.comments * 6) +
          (a.stats.shares * 7) +
          (a.stats.saves * 5);

        const scoreB =
          (b.stats.views * 1) +
          (b.stats.likes * 4) +
          (b.stats.comments * 6) +
          (b.stats.shares * 7) +
          (b.stats.saves * 5);

        return scoreB - scoreA;
      })
      .slice(0, limit);
  },

  /* =======================================================
     FOLLOW CREATOR
     ======================================================= */

  followCreator(userId) {

    if (!userId) return false;

    this.follows.add(userId);

    this.emit("follow", {
      userId
    });

    return true;
  },

  unfollowCreator(userId) {

    this.follows.delete(userId);

    this.emit("unfollow", {
      userId
    });

    return true;
  },

  isFollowing(userId) {
    return this.follows.has(userId);
  },

  /* =======================================================
     VIEWS
     ======================================================= */

  view(id) {

    const reel = this.get(id);

    if (!reel) return null;

    const userId =
      this.getUserId();

    let viewers =
      this.views.get(id);

    if (!viewers) {
      viewers = new Set();
      this.views.set(id, viewers);
    }

    if (!viewers.has(userId)) {

      viewers.add(userId);

      reel.stats.views++;

      this.save();

      this.emit("view", {
        reel,
        userId
      });
    }

    return reel;
  },

  /* =======================================================
     LIKE
     ======================================================= */

  like(id) {

    const reel = this.get(id);

    if (!reel) return false;

    const userId =
      this.getUserId();

    let users =
      this.likes.get(id);

    if (!users) {
      users = new Set();
      this.likes.set(id, users);
    }

    if (users.has(userId)) {
      return this.unlike(id);
    }

    users.add(userId);

    reel.stats.likes++;

    this.save();

    this.emit("like", {
      reel,
      userId
    });

    this.notifyCreator(
      reel,
      "like"
    );

    return true;
  },

  unlike(id) {

    const reel = this.get(id);

    if (!reel) return false;

    const userId =
      this.getUserId();

    const users =
      this.likes.get(id);

    if (!users || !users.has(userId)) {
      return false;
    }

    users.delete(userId);

    reel.stats.likes =
      Math.max(
        0,
        reel.stats.likes - 1
      );

    this.save();

    this.emit("unlike", {
      reel,
      userId
    });

    return true;
  },

  isLiked(id) {

    const users =
      this.likes.get(id);

    return !!(
      users &&
      users.has(this.getUserId())
    );
  },

  /* =======================================================
     SAVE
     ======================================================= */

  saveReel(id) {

    const reel = this.get(id);

    if (!reel) return false;

    const userId =
      this.getUserId();

    let users =
      this.saves.get(id);

    if (!users) {
      users = new Set();
      this.saves.set(id, users);
    }

    if (users.has(userId)) {
      return this.unsaveReel(id);
    }

    users.add(userId);

    reel.stats.saves++;

    this.save();

    this.emit("save", {
      reel,
      userId
    });

    return true;
  },

  unsaveReel(id) {

    const reel = this.get(id);

    if (!reel) return false;

    const userId =
      this.getUserId();

    const users =
      this.saves.get(id);

    if (!users || !users.has(userId)) {
      return false;
    }

    users.delete(userId);

    reel.stats.saves =
      Math.max(
        0,
        reel.stats.saves - 1
      );

    this.save();

    this.emit("unsave", {
      reel,
      userId
    });

    return true;
  },

  isSaved(id) {

    const users =
      this.saves.get(id);

    return !!(
      users &&
      users.has(this.getUserId())
    );
  },

  getSaved() {

    return this.getAll()
      .filter(reel =>
        this.isSaved(reel.id)
      )
      .sort(
        (a, b) =>
          b.createdAt - a.createdAt
      );
  },

  /* =======================================================
     COMMENTS
     ======================================================= */

  addComment(id, text) {

    const reel = this.get(id);

    if (!reel || !text?.trim()) {
      return null;
    }

    if (reel.allowComments === false) {
      return null;
    }

    const comment = {

      id: this.createId("comment"),

      reelId: id,

      userId:
        this.getUserId(),

      username:
        this.getUserName(),

      avatar:
        window.VortexAuth?.getUser?.()?.avatar ||
        "",

      text:
        text.trim(),

      likes: 0,

      createdAt:
        Date.now()
    };

    let list =
      this.comments.get(id);

    if (!list) {
      list = [];
      this.comments.set(id, list);
    }

    list.push(comment);

    reel.stats.comments =
      list.length;

    this.save();

    this.emit("comment", comment);

    this.notifyCreator(
      reel,
      "comment",
      comment
    );

    return comment;
  },

  getComments(id) {

    return (
      this.comments.get(id) ||
      []
    ).slice()
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt
      );
  },

  deleteComment(
    reelId,
    commentId
  ) {

    const list =
      this.comments.get(reelId);

    if (!list) return false;

    const index =
      list.findIndex(
        comment =>
          comment.id === commentId
      );

    if (index === -1) {
      return false;
    }

    const comment =
      list[index];

    if (
      comment.userId !==
      this.getUserId()
    ) {
      return false;
    }

    list.splice(index, 1);

    const reel =
      this.get(reelId);

    if (reel) {
      reel.stats.comments =
        list.length;
    }

    this.save();

    this.emit(
      "commentDeleted",
      {
        reelId,
        commentId
      }
    );

    return true;
  },

  /* =======================================================
     SHARE
     ======================================================= */

  share(id) {

    const reel = this.get(id);

    if (!reel) return false;

    reel.stats.shares++;

    this.save();

    this.emit("share", {
      reel,
      userId:
        this.getUserId()
    });

    return reel;
  },

  async shareNative(id) {

    const reel = this.get(id);

    if (!reel) return false;

    this.share(id);

    const shareData = {

      title:
        reel.title ||
        "VORTEX Reel",

      text:
        reel.caption ||
        "Check out this Reel on VORTEX.",

      url:
        reel.url ||
        reel.video ||
        location.href
    };

    if (
      navigator.share
    ) {

      try {

        await navigator.share(
          shareData
        );

        return true;

      } catch (error) {

        if (
          error?.name ===
          "AbortError"
        ) {
          return false;
        }
      }
    }

    try {

      await navigator.clipboard.writeText(
        shareData.url
      );

      this.toast(
        "Reel link copied"
      );

      return true;

    } catch {

      return false;
    }
  },

  /* =======================================================
     SEARCH
     ======================================================= */

  search(query, options = {}) {

    const q =
      String(query || "")
        .trim()
        .toLowerCase();

    if (!q) {
      return this.getFeed(
        options
      );
    }

    return this.getAll()
      .filter(reel => {

        return (

          reel.caption
            .toLowerCase()
            .includes(q) ||

          reel.title
            .toLowerCase()
            .includes(q) ||

          reel.username
            .toLowerCase()
            .includes(q) ||

          reel.hashtags
            .some(tag =>
              tag
                .toLowerCase()
                .includes(q)
            )

        );
      })
      .sort(
        (a, b) =>
          b.createdAt - a.createdAt
      );
  },

  /* =======================================================
     HASHTAGS
     ======================================================= */

  extractHashtags(text) {

    const matches =
      String(text)
        .match(
          /#[a-zA-Z0-9_]+/g
        ) || [];

    return [
      ...new Set(
        matches.map(
          tag =>
            tag
              .replace("#", "")
              .toLowerCase()
        )
      )
    ];
  },

  extractMentions(text) {

    const matches =
      String(text)
        .match(
          /@[a-zA-Z0-9_.-]+/g
        ) || [];

    return [
      ...new Set(
        matches.map(
          tag =>
            tag
              .replace("@", "")
              .toLowerCase()
        )
      )
    ];
  },

  /* =======================================================
     CATEGORIES
     ======================================================= */

  getCategories() {

    const categories =
      new Map();

    this.getAll()
      .forEach(reel => {

        const category =
          reel.category ||
          "general";

        categories.set(
          category,
          (categories.get(
            category
          ) || 0) + 1
        );
      });

    return Array.from(
      categories.entries()
    )
      .map(
        ([name, count]) => ({
          name,
          count
        })
      )
      .sort(
        (a, b) =>
          b.count - a.count
      );
  },

  /* =======================================================
     TOP HASHTAGS
     ======================================================= */

  getTrendingHashtags(
    limit = 20
  ) {

    const counts = {};

    this.getAll()
      .forEach(reel => {

        reel.hashtags
          .forEach(tag => {

            counts[tag] =
              (counts[tag] || 0) + 1;

          });
      });

    return Object.entries(
      counts
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, limit)
      .map(
        ([tag, count]) => ({
          tag,
          count
        })
      );
  },

  /* =======================================================
     CREATOR REELS
     ======================================================= */

  getCreatorReels(
    userId
  ) {

    return this.getAll()
      .filter(
        reel =>
          reel.userId === userId
      )
      .sort(
        (a, b) =>
          b.createdAt - a.createdAt
      );
  },

  /* =======================================================
     USER LIKED REELS
     ======================================================= */

  getLikedReels() {

    const userId =
      this.getUserId();

    return this.getAll()
      .filter(reel => {

        const users =
          this.likes.get(
            reel.id
          );

        return (
          users &&
          users.has(userId)
        );
      });
  },

  /* =======================================================
     REEL PLAYER
     ======================================================= */

  openPlayer(
    id,
    container
  ) {

    const reel =
      this.get(id);

    if (!reel) {
      return null;
    }

    this.state.currentReel =
      id;

    const index =
      this.state.feed.findIndex(
        item =>
          item.id === id
      );

    if (index >= 0) {
      this.state.currentIndex =
        index;
    }

    this.view(id);

    const html =
      this.renderPlayer(
        reel
      );

    if (container) {
      container.innerHTML =
        html;

      this.bindPlayer(
        container,
        reel
      );
    }

    this.emit(
      "playerOpened",
      reel
    );

    return reel;
  },

  closePlayer() {

    this.state.currentReel =
      null;

    this.emit(
      "playerClosed"
    );
  },

  next() {

    if (!this.state.feed.length) {
      return null;
    }

    const nextIndex =
      this.state.currentIndex + 1;

    if (
      nextIndex >=
      this.state.feed.length
    ) {

      if (!this.state.loop) {
        return null;
      }

      this.state.currentIndex =
        0;

    } else {

      this.state.currentIndex =
        nextIndex;
    }

    const reel =
      this.state.feed[
        this.state.currentIndex
      ];

    if (reel) {
      this.state.currentReel =
        reel.id;

      this.view(reel.id);
    }

    this.emit(
      "next",
      reel
    );

    return reel;
  },

  previous() {

    if (!this.state.feed.length) {
      return null;
    }

    let index =
      this.state.currentIndex - 1;

    if (index < 0) {
      index =
        this.state.loop
          ? this.state.feed.length - 1
          : 0;
    }

    this.state.currentIndex =
      index;

    const reel =
      this.state.feed[index];

    if (reel) {

      this.state.currentReel =
        reel.id;

      this.view(reel.id);
    }

    this.emit(
      "previous",
      reel
    );

    return reel;
  },

  /* =======================================================
     PLAYER RENDER
     ======================================================= */

  renderPlayer(reel) {

    const liked =
      this.isLiked(reel.id);

    const saved =
      this.isSaved(reel.id);

    return `
      <section
        class="vortex-reel-player"
        data-reel-id="${this.escape(
          reel.id
        )}"
      >

        <video
          class="vortex-reel-video"
          src="${this.escape(
            reel.video
          )}"
          ${reel.thumbnail
            ? `poster="${this.escape(
                reel.thumbnail
              )}"`
            : ""}
          playsinline
          preload="metadata"
          ${this.state.autoplay
            ? "autoplay"
            : ""}
          ${this.state.loop
            ? "loop"
            : ""}
          ${this.state.muted
            ? "muted"
            : ""}
        ></video>

        <div class="vortex-reel-gradient"></div>

        <button
          class="vortex-reel-close"
          data-action="close"
          aria-label="Close"
        >
          ×
        </button>

        <button
          class="vortex-reel-mute"
          data-action="mute"
          aria-label="Mute"
        >
          ${this.state.muted
            ? "🔇"
            : "🔊"}
        </button>

        <div class="vortex-reel-info">

          <div class="vortex-reel-user">

            ${
              reel.avatar
                ? `
                  <img
                    src="${this.escape(
                      reel.avatar
                    )}"
                    class="vortex-reel-avatar"
                    alt=""
                  >
                `
                : `
                  <div class="vortex-reel-avatar vortex-avatar-fallback">
                    ${this.escape(
                      reel.username
                        .slice(0, 1)
                        .toUpperCase()
                    )}
                  </div>
                `
            }

            <strong>
              @${this.escape(
                reel.username
              )}
            </strong>

            ${
              reel.userId !==
              this.getUserId()
                ? `
                  <button
                    data-action="follow"
                    class="vortex-follow-btn"
                  >
                    ${
                      this.isFollowing(
                        reel.userId
                      )
                        ? "Following"
                        : "Follow"
                    }
                  </button>
                `
                : ""
            }

          </div>

          ${
            reel.title
              ? `
                <h3>
                  ${this.escape(
                    reel.title
                  )}
                </h3>
              `
              : ""
          }

          ${
            reel.caption
              ? `
                <p>
                  ${this.formatCaption(
                    reel.caption
                  )}
                </p>
              `
              : ""
          }

          ${
            reel.music
              ? `
                <div class="vortex-reel-music">
                  🎵 ${this.escape(
                    typeof reel.music ===
                    "string"
                      ? reel.music
                      : reel.music.title ||
                        "Original sound"
                  )}
                </div>
              `
              : ""
          }

        </div>

        <div class="vortex-reel-actions">

          <button
            data-action="like"
            class="${
              liked
                ? "active"
                : ""
            }"
          >
            ❤️
            <span>
              ${this.formatNumber(
                reel.stats.likes
              )}
            </span>
          </button>

          <button
            data-action="comments"
          >
            💬
            <span>
              ${this.formatNumber(
                reel.stats.comments
              )}
            </span>
          </button>

          <button
            data-action="share"
          >
            ↗️
            <span>
              ${this.formatNumber(
                reel.stats.shares
              )}
            </span>
          </button>

          <button
            data-action="save"
            class="${
              saved
                ? "active"
                : ""
            }"
          >
            🔖
            <span>
              ${this.formatNumber(
                reel.stats.saves
              )}
            </span>
          </button>

        </div>

      </section>
    `;
  },

  /* =======================================================
     FEED CARD
     ======================================================= */

  renderCard(reel) {

    const liked =
      this.isLiked(reel.id);

    const saved =
      this.isSaved(reel.id);

    return `
      <article
        class="vortex-reel-card"
        data-reel-id="${this.escape(
          reel.id
        )}"
      >

        <div
          class="vortex-reel-thumbnail"
          data-action="open"
        >

          ${
            reel.thumbnail
              ? `
                <img
                  src="${this.escape(
                    reel.thumbnail
                  )}"
                  alt=""
                  loading="lazy"
                >
              `
              : `
                <video
                  src="${this.escape(
                    reel.video
                  )}"
                  muted
                  preload="metadata"
                  playsinline
                ></video>
              `
          }

          <div class="vortex-reel-play">
            ▶
          </div>

          <div class="vortex-reel-duration">
            ${this.formatDuration(
              reel.duration
            )}
          </div>

          <div class="vortex-reel-views">
            👁
            ${this.formatNumber(
              reel.stats.views
            )}
          </div>

        </div>

        <div class="vortex-reel-card-body">

          <div class="vortex-reel-card-user">

            <strong>
              @${this.escape(
                reel.username
              )}
            </strong>

          </div>

          ${
            reel.caption
              ? `
                <div class="vortex-reel-caption">
                  ${this.formatCaption(
                    reel.caption
                  )}
                </div>
              `
              : ""
          }

          <div class="vortex-reel-card-actions">

            <button
              data-action="like"
              class="${
                liked
                  ? "active"
                  : ""
              }"
            >
              ❤️
              ${this.formatNumber(
                reel.stats.likes
              )}
            </button>

            <button
              data-action="comments"
            >
              💬
              ${this.formatNumber(
                reel.stats.comments
              )}
            </button>

            <button
              data-action="share"
            >
              ↗️
              ${this.formatNumber(
                reel.stats.shares
              )}
            </button>

            <button
              data-action="save"
              class="${
                saved
                  ? "active"
                  : ""
              }"
            >
              🔖
            </button>

          </div>

        </div>

      </article>
    `;
  },

  /* =======================================================
     FEED RENDER
     ======================================================= */

  renderFeed(
    container,
    options = {}
  ) {

    if (!container) {
      return "";
    }

    const feed =
      this.getFeed(
        options
      );

    if (!feed.length) {

      container.innerHTML = `
        <div class="vortex-empty-reels">
          <div class="empty-icon">
            🎬
          </div>

          <h3>
            No Reels Yet
          </h3>

          <p>
            Create the first VORTEX Reel.
          </p>
        </div>
      `;

      return "";
    }

    container.innerHTML =
      feed
        .map(
          reel =>
            this.renderCard(
              reel
            )
        )
        .join("");

    this.bindFeed(
      container
    );

    return container.innerHTML;
  },

  /* =======================================================
     BIND FEED
     ======================================================= */

  bindFeed(container) {

    container
      .querySelectorAll(
        "[data-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const card =
              button.closest(
                "[data-reel-id]"
              );

            if (!card) return;

            const id =
              card.dataset.reelId;

            const action =
              button.dataset.action;

            this.handleAction(
              action,
              id,
              card
            );
          }
        );
      });

    container
      .querySelectorAll(
        ".vortex-reel-thumbnail"
      )
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const card =
              item.closest(
                "[data-reel-id]"
              );

            if (!card) return;

            this.openPlayer(
              card.dataset.reelId
            );
          }
        );
      });
  },

  /* =======================================================
     BIND PLAYER
     ======================================================= */

  bindPlayer(
    container,
    reel
  ) {

    container
      .querySelectorAll(
        "[data-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();

            const action =
              button.dataset.action;

            await this.handleAction(
              action,
              reel.id,
              container
            );
          }
        );
      });

    const video =
      container.querySelector(
        ".vortex-reel-video"
      );

    if (video) {

      video.addEventListener(
        "ended",
        () => {

          if (!this.state.loop) {
            this.next();
          }
        }
      );

      video.addEventListener(
        "timeupdate",
        () => {

          if (
            video.duration &&
            video.currentTime >=
              video.duration - 0.5
          ) {

            this.emit(
              "reelNearEnd",
              reel
            );
          }
        }
      );
    }
  },

  /* =======================================================
     ACTION HANDLER
     ======================================================= */

  async handleAction(
    action,
    id,
    container
  ) {

    switch (action) {

      case "open":
        return this.openPlayer(
          id,
          container
        );

      case "like":
        this.like(id);
        this.refreshElement(
          id,
          container
        );
        break;

      case "comments":
        return this.openComments(
          id
        );

      case "share":
        return this.shareNative(
          id
        );

      case "save":
        this.saveReel(id);
        this.refreshElement(
          id,
          container
        );
        break;

      case "follow": {

        const reel =
          this.get(id);

        if (!reel) return;

        if (
          this.isFollowing(
            reel.userId
          )
        ) {
          this.unfollowCreator(
            reel.userId
          );
        } else {
          this.followCreator(
            reel.userId
          );
        }

        break;
      }

      case "mute":

        this.state.muted =
          !this.state.muted;

        const video =
          container?.querySelector(
            "video"
          );

        if (video) {
          video.muted =
            this.state.muted;
        }

        break;

      case "close":

        this.closePlayer();

        if (
          container &&
          container.parentElement
        ) {
          container.innerHTML = "";
        }

        break;
    }
  },

  /* =======================================================
     REFRESH ELEMENT
     ======================================================= */

  refreshElement(
    id,
    container
  ) {

    if (!container) return;

    const reel =
      this.get(id);

    if (!reel) return;

    const card =
      container.closest(
        ".vortex-reel-card"
      ) ||
      container.querySelector(
        `[data-reel-id="${CSS.escape(id)}"]`
      );

    if (
      card &&
      card.classList.contains(
        "vortex-reel-card"
      )
    ) {

      const parent =
        card.parentElement;

      card.outerHTML =
        this.renderCard(
          reel
        );

      this.bindFeed(
        parent
      );
    }
  },

  /* =======================================================
     COMMENTS UI
     ======================================================= */

  openComments(id) {

    const reel =
      this.get(id);

    if (!reel) return null;

    const comments =
      this.getComments(id);

    const html = `
      <div
        class="vortex-reel-comments"
        data-reel-comments="${this.escape(
          id
        )}"
      >

        <div class="comments-header">
          <strong>
            Comments
          </strong>

          <button
            data-close-comments
          >
            ×
          </button>
        </div>

        <div class="comments-list">

          ${
            comments.length
              ? comments
                  .map(
                    comment => `
                      <div class="reel-comment">

                        <strong>
                          @${this.escape(
                            comment.username
                          )}
                        </strong>

                        <p>
                          ${this.escape(
                            comment.text
                          )}
                        </p>

                      </div>
                    `
                  )
                  .join("")
              : `
                <div class="comments-empty">
                  Be the first to comment.
                </div>
              `
          }

        </div>

        <form
          class="reel-comment-form"
          data-reel-id="${this.escape(
            id
          )}"
        >

          <input
            type="text"
            name="comment"
            placeholder="Add a comment..."
            autocomplete="off"
            maxlength="1000"
          >

          <button type="submit">
            Send
          </button>

        </form>

      </div>
    `;

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "vortex-reel-comments-layer";

    wrapper.innerHTML =
      html;

    document.body.appendChild(
      wrapper
    );

    const form =
      wrapper.querySelector(
        ".reel-comment-form"
      );

    form?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const input =
          form.querySelector(
            "input"
          );

        const comment =
          this.addComment(
            id,
            input.value
          );

        if (comment) {
          input.value = "";
          this.openComments(id);
          wrapper.remove();
        }
      }
    );

    wrapper
      .querySelector(
        "[data-close-comments]"
      )
      ?.addEventListener(
        "click",
        () => wrapper.remove()
      );

    return wrapper;
  },

  /* =======================================================
     MEDIA UPLOAD
     ======================================================= */

  async createFromMedia(
    options = {}
  ) {

    if (
      window.VortexMedia?.pickVideo
    ) {

      try {

        const media =
          await window.VortexMedia.pickVideo();

        if (media) {

          return this.create({
            ...options,
            video:
              media.url ||
              media.src,

            thumbnail:
              media.thumbnail ||
              "",

            duration:
              media.duration ||
              0,

            size:
              media.size ||
              0,

            mimeType:
              media.type ||
              media.mimeType ||
              "video/mp4"
          });
        }

      } catch (error) {

        this.emit(
          "error",
          error
        );
      }
    }

    const file =
      await this.pickVideoFile();

    if (!file) {
      return null;
    }

    const url =
      URL.createObjectURL(
        file
      );

    return this.create({
      ...options,
      video: url,
      size: file.size,
      mimeType: file.type
    });
  },

  pickVideoFile() {

    return new Promise(
      resolve => {

        const input =
          document.createElement(
            "input"
          );

        input.type =
          "file";

        input.accept =
          "video/*";

        input.capture =
          "environment";

        input.onchange =
          () =>
            resolve(
              input.files?.[0] ||
              null
            );

        input.click();
      }
    );
  },

  /* =======================================================
     DOWNLOAD
     ======================================================= */

  async download(
    id
  ) {

    const reel =
      this.get(id);

    if (!reel?.video) {
      return false;
    }

    try {

      const response =
        await fetch(
          reel.video
        );

      if (!response.ok) {
        throw new Error(
          "Video download failed"
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href =
        url;

      a.download =
        `vortex-reel-${reel.id}.mp4`;

      document.body.appendChild(
        a
      );

      a.click();

      a.remove();

      setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        5000
      );

      this.emit(
        "downloaded",
        reel
      );

      return true;

    } catch (error) {

      this.emit(
        "error",
        error
      );

      return false;
    }
  },

  /* =======================================================
     NOTIFICATION
     ======================================================= */

  notifyCreator(
    reel,
    type,
    extra = {}
  ) {

    if (
      !window.VortexNotifications
    ) {
      return;
    }

    if (
      reel.userId ===
      this.getUserId()
    ) {
      return;
    }

    try {

      window.VortexNotifications.create({
        type:
          type === "like"
            ? "like"
            : "comment",

        userId:
          reel.userId,

        actorId:
          this.getUserId(),

        message:
          type === "like"
            ? "liked your Reel."
            : "commented on your Reel.",

        reelId:
          reel.id,

        ...extra
      });

    } catch {
      // Notification system is optional.
    }
  },

  /* =======================================================
     STATS
     ======================================================= */

  getStats(id) {

    const reel =
      this.get(id);

    if (!reel) return null;

    return {
      ...reel.stats,

      engagement:
        reel.stats.views
          ? (
              (
                reel.stats.likes +
                reel.stats.comments +
                reel.stats.shares +
                reel.stats.saves
              ) /
              reel.stats.views
            ) * 100
          : 0
    };
  },

  getGlobalStats() {

    const reels =
      this.getAll();

    return reels.reduce(
      (stats, reel) => {

        stats.reels++;

        stats.views +=
          reel.stats.views;

        stats.likes +=
          reel.stats.likes;

        stats.comments +=
          reel.stats.comments;

        stats.shares +=
          reel.stats.shares;

        stats.saves +=
          reel.stats.saves;

        return stats;

      },
      {
        reels: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0
      }
    );
  },

  /* =======================================================
     PERSISTENCE
     ======================================================= */

  save() {

    try {

      const data = {

        reels:
          Array.from(
            this.reels.entries()
          ),

        likes:
          Array.from(
            this.likes.entries()
          ).map(
            ([id, users]) => [
              id,
              Array.from(users)
            ]
          ),

        saves:
          Array.from(
            this.saves.entries()
          ).map(
            ([id, users]) => [
              id,
              Array.from(users)
            ]
          ),

        views:
          Array.from(
            this.views.entries()
          ).map(
            ([id, users]) => [
              id,
              Array.from(users)
            ]
          ),

        comments:
          Array.from(
            this.comments.entries()
          ),

        follows:
          Array.from(
            this.follows
          )
      };

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(data)
      );

    } catch (error) {

      console.warn(
        "VortexReels save failed:",
        error
      );
    }
  },

  load() {

    try {

      const raw =
        localStorage.getItem(
          this.STORAGE_KEY
        );

      if (!raw) return;

      const data =
        JSON.parse(raw);

      this.reels =
        new Map(
          data.reels || []
        );

      this.likes =
        new Map(
          (data.likes || [])
            .map(
              ([id, users]) => [
                id,
                new Set(users)
              ]
            )
        );

      this.saves =
        new Map(
          (data.saves || [])
            .map(
              ([id, users]) => [
                id,
                new Set(users)
              ]
            )
        );

      this.views =
        new Map(
          (data.views || [])
            .map(
              ([id, users]) => [
                id,
                new Set(users)
              ]
            )
        );

      this.comments =
        new Map(
          data.comments || []
        );

      this.follows =
        new Set(
          data.follows || []
        );

    } catch (error) {

      console.warn(
        "VortexReels load failed:",
        error
      );
    }
  },

  /* =======================================================
     EVENTS
     ======================================================= */

  on(event, callback) {

    if (
      typeof callback !==
      "function"
    ) {
      return () => {};
    }

    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(
      callback
    );

    return () => {

      this.listeners[event] =
        this.listeners[event]
          .filter(
            fn =>
              fn !== callback
          );
    };
  },

  emit(event, data) {

    (
      this.listeners[event] ||
      []
    ).forEach(
      callback => {

        try {
          callback(data);
        } catch (error) {
          console.error(
            "VortexReels event error:",
            error
          );
        }

      }
    );

    try {

      window.dispatchEvent(
        new CustomEvent(
          `vortex:reels:${event}`,
          {
            detail: data
          }
        )
      );

    } catch {
      // Older browser fallback.
    }
  },

  /* =======================================================
     TOAST
     ======================================================= */

  toast(message) {

    if (
      typeof window.vortexToast ===
      "function"
    ) {
      window.vortexToast(
        message
      );
      return;
    }

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      "vortex-reel-toast";

    toast.textContent =
      message;

    document.body.appendChild(
      toast
    );

    requestAnimationFrame(
      () =>
        toast.classList.add(
          "show"
        )
    );

    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

        setTimeout(
          () =>
            toast.remove(),
          300
        );

      },
      2200
    );
  },

  /* =======================================================
     FORMATTERS
     ======================================================= */

  formatNumber(number) {

    number =
      Number(number) || 0;

    if (number >= 1000000000) {
      return (
        (number / 1000000000)
          .toFixed(1)
          .replace(".0", "") +
        "B"
      );
    }

    if (number >= 1000000) {
      return (
        (number / 1000000)
          .toFixed(1)
          .replace(".0", "") +
        "M"
      );
    }

    if (number >= 1000) {
      return (
        (number / 1000)
          .toFixed(1)
          .replace(".0", "") +
        "K"
      );
    }

    return String(number);
  },

  formatDuration(seconds) {

    seconds =
      Math.max(
        0,
        Math.floor(
          Number(seconds) || 0
        )
      );

    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;

    return `${minutes}:${String(
      remaining
    ).padStart(2, "0")}`;
  },

  formatCaption(text) {

    let result =
      this.escape(
        String(text || "")
      );

    result =
      result.replace(
        /(#\w+)/g,
        `<span class="vortex-hashtag">$1</span>`
      );

    result =
      result.replace(
        /(@[\w.-]+)/g,
        `<span class="vortex-mention">$1</span>`
      );

    return result;
  },

  escape(value) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  },

  /* =======================================================
     SETTINGS
     ======================================================= */

  setAutoplay(enabled) {

    this.state.autoplay =
      Boolean(enabled);

    this.emit(
      "autoplayChanged",
      this.state.autoplay
    );
  },

  setLoop(enabled) {

    this.state.loop =
      Boolean(enabled);

    this.emit(
      "loopChanged",
      this.state.loop
    );
  },

  setMuted(muted) {

    this.state.muted =
      Boolean(muted);

    this.emit(
      "muteChanged",
      this.state.muted
    );
  },

  /* =======================================================
     RESET
     ======================================================= */

  clearAll() {

    this.reels.clear();
    this.likes.clear();
    this.saves.clear();
    this.views.clear();
    this.comments.clear();
    this.follows.clear();

    this.save();

    this.emit(
      "cleared"
    );
  },

  /* =======================================================
     DEMO CONTENT
     ======================================================= */

  createDemoReels() {

    const existing =
      this.getAll();

    if (existing.length) {
      return existing;
    }

    const demos = [

      {
        username: "VORTEX",
        caption:
          "Welcome to the VORTEX OMNIVERSE 🚀 #VORTEX #Omniverse",
        category: "technology"
      },

      {
        username: "VortexGaming",
        caption:
          "Game mode activated 🎮🔥 #Gaming #VORTEX",
        category: "gaming"
      },

      {
        username: "VortexWorld",
        caption:
          "Explore. Drive. Build. Conquer. 🌌 #World #Adventure",
        category: "adventure"
      }

    ];

    return demos.map(
      demo =>
        this.create({
          ...demo,
          userId:
            demo.username
              .toLowerCase()
              .replace(
                /[^a-z0-9]/g,
                "_"
              ),
          video: "",
          thumbnail: ""
        })
    );
  },

  /* =======================================================
     STATUS
     ======================================================= */

  getStatus() {

    return {

      version:
        this.VERSION,

      initialized:
        this.state.initialized,

      reels:
        this.reels.size,

      currentReel:
        this.state.currentReel,

      feedSize:
        this.state.feed.length,

      muted:
        this.state.muted,

      autoplay:
        this.state.autoplay,

      loop:
        this.state.loop,

      stats:
        this.getGlobalStats()
    };
  }
};


/* =========================================================
   GLOBAL
   ========================================================= */

window.VortexReels =
  VortexReels;


/* =========================================================
   AUTO INIT
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () =>
      VortexReels.init()
  );

} else {

  VortexReels.init();

}


/* =========================================================
   INTEGRATIONS
   ========================================================= */

window.addEventListener(
  "vortex:reel:create",
  event => {

    if (event.detail) {
      VortexReels.create(
        event.detail
      );
    }

  }
);

window.addEventListener(
  "vortex:reel:like",
  event => {

    if (event.detail?.id) {
      VortexReels.like(
        event.detail.id
      );
    }

  }
);

window.addEventListener(
  "vortex:reel:share",
  event => {

    if (event.detail?.id) {
      VortexReels.shareNative(
        event.detail.id
      );
    }

  }
);


/* =========================================================
   VISIBILITY / MEDIA BEHAVIOR
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden
    ) {

      document
        .querySelectorAll(
          ".vortex-reel-video"
        )
        .forEach(
          video => {

            try {
              video.pause();
            } catch {}

          }
        );

    }

  }
);


/* =========================================================
   GLOBAL STYLES
   ========================================================= */

if (
  !document.getElementById(
    "vortex-reels-runtime-style"
  )
) {

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "vortex-reels-runtime-style";

  style.textContent = `

    .vortex-reel-card {
      position: relative;
      overflow: hidden;
      border-radius: 22px;
      background: #0a0d1a;
      border: 1px solid rgba(0,217,255,.12);
      box-shadow: 0 15px 45px rgba(0,0,0,.35);
      transition: transform .2s ease,
                  border-color .2s ease;
    }

    .vortex-reel-card:hover {
      transform: translateY(-3px);
      border-color: rgba(0,217,255,.35);
    }

    .vortex-reel-thumbnail {
      position: relative;
      aspect-ratio: 9 / 16;
      overflow: hidden;
      background: #050712;
      cursor: pointer;
    }

    .vortex-reel-thumbnail img,
    .vortex-reel-thumbnail video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .vortex-reel-play {
      position: absolute;
      inset: 50% auto auto 50%;
      transform: translate(-50%, -50%);
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: rgba(5,7,18,.72);
      border: 1px solid rgba(255,255,255,.2);
      backdrop-filter: blur(12px);
      color: white;
      font-size: 21px;
    }

    .vortex-reel-duration,
    .vortex-reel-views {
      position: absolute;
      bottom: 10px;
      padding: 5px 9px;
      border-radius: 10px;
      background: rgba(0,0,0,.65);
      color: white;
      font-size: 12px;
      backdrop-filter: blur(8px);
    }

    .vortex-reel-duration {
      left: 10px;
    }

    .vortex-reel-views {
      right: 10px;
    }

    .vortex-reel-card-body {
      padding: 13px;
    }

    .vortex-reel-card-user {
      color: #fff;
      margin-bottom: 7px;
    }

    .vortex-reel-caption {
      color: rgba(255,255,255,.78);
      line-height: 1.45;
      font-size: 14px;
    }

    .vortex-reel-card-actions {
      display: flex;
      gap: 7px;
      margin-top: 12px;
    }

    .vortex-reel-card-actions button,
    .vortex-reel-actions button {
      border: 0;
      color: rgba(255,255,255,.82);
      background: rgba(255,255,255,.07);
      border-radius: 12px;
      padding: 8px 10px;
      cursor: pointer;
    }

    .vortex-reel-card-actions button.active,
    .vortex-reel-actions button.active {
      color: #00d9ff;
      background: rgba(0,217,255,.12);
    }

    .vortex-reel-player {
      position: relative;
      width: min(100vw, 520px);
      height: min(100vh, 920px);
      overflow: hidden;
      border-radius: 25px;
      background: #000;
    }

    .vortex-reel-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      background: #000;
    }

    .vortex-reel-gradient {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(
          to top,
          rgba(0,0,0,.8),
          transparent 42%,
          rgba(0,0,0,.18)
        );
    }

    .vortex-reel-close,
    .vortex-reel-mute {
      position: absolute;
      top: 16px;
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 50%;
      background: rgba(0,0,0,.55);
      color: white;
      font-size: 20px;
      cursor: pointer;
      backdrop-filter: blur(10px);
    }

    .vortex-reel-close {
      right: 16px;
    }

    .vortex-reel-mute {
      right: 66px;
    }

    .vortex-reel-info {
      position: absolute;
      left: 18px;
      right: 78px;
      bottom: 25px;
      color: white;
    }

    .vortex-reel-user {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 10px;
    }

    .vortex-reel-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      background: #11182b;
      display: grid;
      place-items: center;
      color: white;
    }

    .vortex-follow-btn {
      border: 1px solid rgba(0,217,255,.55);
      background: rgba(0,217,255,.12);
      color: #00d9ff;
      border-radius: 10px;
      padding: 6px 10px;
    }

    .vortex-reel-info h3 {
      margin: 4px 0;
    }

    .vortex-reel-info p {
      margin: 6px 0;
      line-height: 1.45;
    }

    .vortex-reel-actions {
      position: absolute;
      right: 12px;
      bottom: 25px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .vortex-reel-actions button {
      min-width: 54px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .vortex-reel-comments-layer {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: end center;
      background: rgba(0,0,0,.62);
      backdrop-filter: blur(8px);
    }

    .vortex-reel-comments {
      width: min(100%, 600px);
      max-height: 80vh;
      background: #0a0d1a;
      color: white;
      border-radius: 25px 25px 0 0;
      overflow: hidden;
      border: 1px solid rgba(0,217,255,.15);
    }

    .comments-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .comments-header button {
      border: 0;
      background: transparent;
      color: white;
      font-size: 24px;
    }

    .comments-list {
      max-height: 55vh;
      overflow-y: auto;
      padding: 15px;
    }

    .reel-comment {
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }

    .reel-comment p {
      margin: 5px 0 0;
      color: rgba(255,255,255,.75);
    }

    .reel-comment-form {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,.08);
    }

    .reel-comment-form input {
      flex: 1;
      min-width: 0;
      border: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.05);
      color: white;
      border-radius: 14px;
      padding: 12px;
      outline: none;
    }

    .reel-comment-form button {
      border: 0;
      border-radius: 14px;
      padding: 0 15px;
      background: linear-gradient(
        135deg,
        #00d9ff,
        #3478ff,
        #8b4dff
      );
      color: white;
      font-weight: 700;
    }

    .vortex-reel-toast {
      position: fixed;
      left: 50%;
      bottom: 30px;
      transform:
        translate(-50%, 20px);
      opacity: 0;
      z-index: 100000;
      padding: 11px 17px;
      border-radius: 14px;
      background: rgba(10,13,26,.94);
      color: white;
      border: 1px solid rgba(0,217,255,.2);
      transition:
        opacity .25s ease,
        transform .25s ease;
    }

    .vortex-reel-toast.show {
      opacity: 1;
      transform:
        translate(-50%, 0);
    }

    .vortex-hashtag {
      color: #00d9ff;
    }

    .vortex-mention {
      color: #8b4dff;
    }

    .vortex-empty-reels {
      padding: 50px 20px;
      text-align: center;
      color: rgba(255,255,255,.7);
    }

    .vortex-empty-reels .empty-icon {
      font-size: 45px;
      margin-bottom: 10px;
    }

    @media (max-width: 600px) {

      .vortex-reel-card {
        border-radius: 16px;
      }

      .vortex-reel-player {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
      }

    }

  `;

  document.head.appendChild(
    style
  );
}
