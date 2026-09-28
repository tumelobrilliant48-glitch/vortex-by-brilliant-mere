/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / REELS.JS
========================================================= */

"use strict";

const VortexReels = {

  state: {

    reels: [],

    currentIndex: 0,

    initialized: false,

    dragging: false,

    startX: 0,

    currentX: 0

  },


  settings: {

    direction: "horizontal",

    autoplay: true,

    loop: true,

    preload: 2,

    sound: true

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

    this.attachTouchControls();

    this.emit("ready");

  },


  /* =======================================================
     ADD REEL
  ======================================================= */

  add(reel = {}) {

    const item = {

      id:
        reel.id ||
        `reel_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      author:
        reel.author || "VORTEX User",

      authorId:
        reel.authorId || null,

      caption:
        reel.caption || "",

      media:
        reel.media || null,

      thumbnail:
        reel.thumbnail || null,

      likes: 0,

      comments: 0,

      shares: 0,

      stars: 0,

      views: 0,

      createdAt:
        new Date().toISOString()

    };


    this.state.reels.push(
      item
    );

    this.save();

    this.emit(
      "added",
      item
    );

    return item;

  },


  /* =======================================================
     CURRENT REEL
  ======================================================= */

  current() {

    return this.state.reels[
      this.state.currentIndex
    ] || null;

  },


  /* =======================================================
     NEXT / PREVIOUS
  ======================================================= */

  next() {

    if (
      this.state.reels.length === 0
    ) {
      return null;
    }


    if (
      this.state.currentIndex <
      this.state.reels.length - 1
    ) {

      this.state.currentIndex++;

    } else if (
      this.settings.loop
    ) {

      this.state.currentIndex = 0;

    }


    const reel =
      this.current();


    this.emit(
      "changed",
      {
        reel,
        index:
          this.state.currentIndex
      }
    );


    return reel;

  },


  previous() {

    if (
      this.state.reels.length === 0
    ) {
      return null;
    }


    if (
      this.state.currentIndex > 0
    ) {

      this.state.currentIndex--;

    } else if (
      this.settings.loop
    ) {

      this.state.currentIndex =
        this.state.reels.length - 1;

    }


    const reel =
      this.current();


    this.emit(
      "changed",
      {
        reel,
        index:
          this.state.currentIndex
      }
    );


    return reel;

  },


  /* =======================================================
     TOUCH / SWIPE
  ======================================================= */

  attachTouchControls() {

    const container =
      document.getElementById(
        "vortexReels"
      );


    if (!container) {
      return;
    }


    container.addEventListener(
      "pointerdown",
      event => {

        this.state.dragging = true;

        this.state.startX =
          event.clientX;

        this.state.currentX =
          event.clientX;

      }
    );


    container.addEventListener(
      "pointermove",
      event => {

        if (
          !this.state.dragging
        ) {
          return;
        }

        this.state.currentX =
          event.clientX;

      }
    );


    container.addEventListener(
      "pointerup",
      () => {

        if (
          !this.state.dragging
        ) {
          return;
        }


        const distance =
          this.state.currentX -
          this.state.startX;


        this.state.dragging =
          false;


        const threshold = 60;


        if (
          Math.abs(distance) <
          threshold
        ) {

          return;

        }


        /*
          Swipe LEFT:
          next reel

          Swipe RIGHT:
          previous reel
        */

        if (distance < 0) {

          this.next();

        } else {

          this.previous();

        }

      }
    );


    container.addEventListener(
      "pointercancel",
      () => {

        this.state.dragging =
          false;

      }
    );

  },


  /* =======================================================
     INTERACTIONS
  ======================================================= */

  like(id) {

    const reel =
      this.find(id);

    if (!reel) {
      return false;
    }

    reel.likes++;

    this.save();

    return true;

  },


  comment(id) {

    const reel =
      this.find(id);

    if (!reel) {
      return false;
    }

    reel.comments++;

    this.save();

    return true;

  },


  share(id) {

    const reel =
      this.find(id);

    if (!reel) {
      return false;
    }

    reel.shares++;

    this.save();

    return true;

  },


  star(id) {

    const reel =
      this.find(id);

    if (!reel) {
      return false;
    }

    reel.stars++;

    this.save();

    return true;

  },


  view(id) {

    const reel =
      this.find(id);

    if (!reel) {
      return false;
    }

    reel.views++;

    this.save();

    return true;

  },


  /* =======================================================
     FIND
  ======================================================= */

  find(id) {

    return this.state.reels
      .find(reel =>
        reel.id === id
      );

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
      "reels",
      this.state.reels
    );

  },


  load() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    this.state.reels =
      VortexStorage.load(
        "reels",
        []
      );

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:reels:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexReels =
  VortexReels;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexReels.initialize();

  }
);
