/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / VAULT.JS
========================================================= */

"use strict";

const VortexVault = {

  state: {

    locked: true,

    initialized: false,

    photos: [],

    videos: [],

    music: [],

    documents: [],

    downloads: [],

    hidden: []

  },


  settings: {

    requireAuthentication: true,

    autoLock: true,

    autoLockMinutes: 5,

    showVaultNotifications: false

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

    this.emit("ready");

  },


  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  async unlock() {

    if (
      !this.settings.requireAuthentication
    ) {

      this.state.locked = false;

      return true;

    }


    if (
      typeof VortexSecurity ===
      "undefined"
    ) {

      return false;

    }


    const authenticated =
      await VortexSecurity
        .authenticate("auto");


    if (!authenticated) {
      return false;
    }


    this.state.locked = false;

    this.emit("unlocked");

    return true;

  },


  lock() {

    this.state.locked = true;

    this.emit("locked");

  },


  isLocked() {

    return this.state.locked;

  },


  /* =======================================================
     ACCESS CHECK
  ======================================================= */

  requireAccess() {

    if (!this.state.locked) {
      return true;
    }

    this.emit(
      "authenticationRequired"
    );

    return false;

  },


  /* =======================================================
     ADD FILE
  ======================================================= */

  addFile(
    category,
    file
  ) {

    if (!this.requireAccess()) {
      return false;
    }


    const allowed = [
      "photos",
      "videos",
      "music",
      "documents",
      "downloads",
      "hidden"
    ];


    if (!allowed.includes(category)) {
      return false;
    }


    const item = {

      id:
        `vault_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      name:
        file?.name ||
        "Unnamed file",

      type:
        file?.type ||
        "application/octet-stream",

      size:
        file?.size ||
        0,

      source:
        "local",

      createdAt:
        new Date().toISOString(),

      protected: true

    };


    this.state[category].push(
      item
    );

    this.save();

    this.emit(
      "fileAdded",
      {
        category,
        item
      }
    );

    return item;

  },


  /* =======================================================
     MOVE FILE
  ======================================================= */

  moveFile(
    id,
    from,
    to
  ) {

    if (!this.requireAccess()) {
      return false;
    }


    if (
      !this.state[from] ||
      !this.state[to]
    ) {

      return false;

    }


    const index =
      this.state[from]
        .findIndex(
          item =>
            item.id === id
        );


    if (index === -1) {
      return false;
    }


    const [item] =
      this.state[from]
        .splice(index, 1);


    this.state[to].push(
      item
    );


    this.save();

    return true;

  },


  /* =======================================================
     HIDE FILE
  ======================================================= */

  hideFile(
    category,
    id
  ) {

    return this.moveFile(
      id,
      category,
      "hidden"
    );

  },


  /* =======================================================
     RESTORE FILE
  ======================================================= */

  restoreFile(id) {

    if (!this.requireAccess()) {
      return false;
    }


    const index =
      this.state.hidden
        .findIndex(
          item =>
            item.id === id
        );


    if (index === -1) {
      return false;
    }


    const [item] =
      this.state.hidden
        .splice(index, 1);


    const category =
      this.detectCategory(
        item.type
      );


    this.state[category].push(
      item
    );


    this.save();

    return true;

  },


  /* =======================================================
     CATEGORY DETECTION
  ======================================================= */

  detectCategory(type = "") {

    if (
      type.startsWith("image/")
    ) {

      return "photos";

    }


    if (
      type.startsWith("video/")
    ) {

      return "videos";

    }


    if (
      type.startsWith("audio/")
    ) {

      return "music";

    }


    if (
      type.includes("pdf") ||
      type.includes("document") ||
      type.includes("text")
    ) {

      return "documents";

    }


    return "downloads";

  },


  /* =======================================================
     DELETE
  ======================================================= */

  deleteFile(
    category,
    id
  ) {

    if (!this.requireAccess()) {
      return false;
    }


    if (!this.state[category]) {
      return false;
    }


    const index =
      this.state[category]
        .findIndex(
          item =>
            item.id === id
        );


    if (index === -1) {
      return false;
    }


    this.state[category]
      .splice(index, 1);


    this.save();

    this.emit(
      "fileDeleted",
      {
        category,
        id
      }
    );

    return true;

  },


  /* =======================================================
     SEARCH VAULT
  ======================================================= */

  search(query) {

    if (!this.requireAccess()) {
      return [];
    }


    const text =
      String(query || "")
        .toLowerCase();


    const all = [

      ...this.state.photos,

      ...this.state.videos,

      ...this.state.music,

      ...this.state.documents,

      ...this.state.downloads,

      ...this.state.hidden

    ];


    return all.filter(
      item =>
        item.name
          .toLowerCase()
          .includes(text)
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
      "vault",
      {
        photos:
          this.state.photos,

        videos:
          this.state.videos,

        music:
          this.state.music,

        documents:
          this.state.documents,

        downloads:
          this.state.downloads,

        hidden:
          this.state.hidden
      }
    );

  },


  load() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    const saved =
      VortexStorage.load(
        "vault",
        null
      );


    if (!saved) {
      return;
    }


    Object.assign(
      this.state,
      saved
    );

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:vault:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexVault =
  VortexVault;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexVault.initialize();

  }
);
