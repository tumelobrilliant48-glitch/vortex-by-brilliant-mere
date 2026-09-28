/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / STORIES.JS
========================================================= */

"use strict";

const VortexStories = {

  state: {
    stories: [],
    viewed: new Set(),
    currentIndex: 0,
    initialized: false
  },

  settings: {
    duration: 15000,
    autoAdvance: true,
    allowReplies: true,
    allowSharing: true,
    showStoriesFirst: true
  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.load();

    this.state.initialized = true;

    this.cleanupExpired();

    this.emit("ready");

  },


  /* =======================================================
     CREATE STORY
  ======================================================= */

  create(data = {}) {

    if (!data.author && !data.authorId) {
      throw new Error("Story author is required.");
    }

    const story = {

      id:
        data.id ||
        `story_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      author:
        data.author || "VORTEX User",

      authorId:
        data.authorId || null,

      avatar:
        data.avatar || null,

      type:
        data.type || "image",

      media:
        data.media || null,

      caption:
        data.caption || "",

      createdAt:
        new Date().toISOString(),

      expiresAt:
        data.expiresAt ||
        new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),

      viewers: [],

      replies: [],

      shares: 0,

      reactions: {}

    };


    this.state.stories.unshift(
      story
    );

    this.save();

    this.emit(
      "created",
      story
    );

    return story;

  },


  /* =======================================================
     GET ACTIVE STORIES
  ======================================================= */

  getActive() {

    const now = Date.now();

    return this.state.stories.filter(
      story =>
        new Date(
          story.expiresAt
        ).getTime() > now
    );

  },


  /* =======================================================
     MARK VIEWED
  ======================================================= */

  view(
    storyId,
    viewerId = "me"
  ) {

    const story =
      this.find(storyId);

    if (!story) {
      return false;
    }


    if (
      !story.viewers.includes(
        viewerId
      )
    ) {

      story.viewers.push(
        viewerId
      );

    }


    this.state.viewed.add(
      storyId
    );

    this.save();

    this.emit(
      "viewed",
      {
        story,
        viewerId
      }
    );

    return true;

  },


  /* =======================================================
     REACTIONS
  ======================================================= */

  react(
    storyId,
    reaction
  ) {

    const story =
      this.find(storyId);

    if (!story) {
      return false;
    }


    if (
      !story.reactions[
        reaction
      ]
    ) {

      story.reactions[
        reaction
      ] = 0;

    }


    story.reactions[
      reaction
    ]++;


    this.save();

    this.emit(
      "reaction",
      {
        story,
        reaction
      }
    );

    return true;

  },


  /* =======================================================
     REPLY
  ======================================================= */

  reply(
    storyId,
    message,
    sender = "me"
  ) {

    if (
      !this.settings.allowReplies
    ) {

      return false;

    }


    const story =
      this.find(storyId);

    if (!story) {
      return false;
    }


    story.replies.push({

      id:
        `reply_${Date.now()}`,

      sender,

      message:
        String(message || ""),

      createdAt:
        new Date().toISOString()

    });


    this.save();

    this.emit(
      "reply",
      story
    );

    return true;

  },


  /* =======================================================
     SHARE
  ======================================================= */

  share(storyId) {

    if (
      !this.settings.allowSharing
    ) {

      return false;

    }


    const story =
      this.find(storyId);

    if (!story) {
      return false;
    }


    story.shares++;

    this.save();

    return true;

  },


  /* =======================================================
     NAVIGATION
  ======================================================= */

  next() {

    const stories =
      this.getActive();

    if (!stories.length) {
      return null;
    }


    this.state.currentIndex =
      Math.min(
        this.state.currentIndex + 1,
        stories.length - 1
      );


    const story =
      stories[
        this.state.currentIndex
      ];


    this.emit(
      "changed",
      {
        story,
        index:
          this.state.currentIndex
      }
    );


    return story;

  },


  previous() {

    const stories =
      this.getActive();

    if (!stories.length) {
      return null;
    }


    this.state.currentIndex =
      Math.max(
        this.state.currentIndex - 1,
        0
      );


    const story =
      stories[
        this.state.currentIndex
      ];


    this.emit(
      "changed",
      {
        story,
        index:
          this.state.currentIndex
      }
    );


    return story;

  },


  /* =======================================================
     FIND
  ======================================================= */

  find(id) {

    return this.state.stories
      .find(
        story =>
          story.id === id
      );

  },


  /* =======================================================
     DELETE
  ======================================================= */

  delete(id) {

    const index =
      this.state.stories
        .findIndex(
          story =>
            story.id === id
        );


    if (index === -1) {
      return false;
    }


    this.state.stories
      .splice(index, 1);

    this.save();

    this.emit(
      "deleted",
      {
        id
      }
    );

    return true;

  },


  /* =======================================================
     CLEANUP
  ======================================================= */

  cleanupExpired() {

    const now = Date.now();

    this.state.stories =
      this.state.stories.filter(
        story =>
          new Date(
            story.expiresAt
          ).getTime() > now
      );

    this.save();

  },


  /* =======================================================
     STORAGE
  ======================================================= */

  save() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    VortexStorage.save(
      "stories",
      this.state.stories
    );

  },


  load() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    this.state.stories =
      VortexStorage.load(
        "stories",
        []
      );

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(
    name,
    detail = {}
  ) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:stories:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexStories =
  VortexStories;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexStories.initialize();

    setInterval(
      () =>
        VortexStories
          .cleanupExpired(),
      60000
    );

  }
);
