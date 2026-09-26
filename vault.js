/* =========================================================
   VORTEX OMNIVERSE
   VAULT ENGINE
   ========================================================= */

"use strict";

const VortexVault = {

  VERSION: "1.0.0",

  STORAGE_KEY: "vortex_secure_vault",

  items: new Map(),
  folders: new Map(),
  listeners: {},

  settings: {
    autoLock: true,
    lockMinutes: 5,
    hideFromGallery: true,
    requireAppLock: false,
    screenshotProtection: false
  },

  state: {
    initialized: false,
    unlocked: false,
    lockedAt: null,
    failedAttempts: 0
  },

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();

    this.state.initialized = true;

    this.emit("ready", {
      items: this.items.size,
      folders: this.folders.size
    });

    console.log("🔐 VORTEX Vault Engine ready.");

  },

  /* =======================================================
     USER
     ======================================================= */

  getUserId() {

    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexProfile?.getUserId?.() ||
      "guest"
    );

  },

  getUser() {

    return (
      window.VortexAuth?.getUser?.() ||
      window.VortexProfile?.getCurrent?.() ||
      {
        id: this.getUserId(),
        name: "VORTEX User",
        username: "vortexuser"
      }
    );

  },

  /* =======================================================
     IDS
     ======================================================= */

  createId(prefix = "vault") {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 11)
    );

  },

  /* =======================================================
     SECURITY STATE
     ======================================================= */

  isUnlocked() {

    return this.state.unlocked === true;

  },

  lock() {

    this.state.unlocked = false;
    this.state.lockedAt = Date.now();

    this.emit("locked");

    return {
      success: true
    };

  },

  unlock(pin = null) {

    /*
      VORTEX Vault does not store a plain-text PIN.

      If VortexAppLock exists, it is used as the
      authentication provider.
    */

    if (
      window.VortexAppLock?.verify
    ) {

      const result =
        window.VortexAppLock.verify(pin);

      if (!result) {

        this.state.failedAttempts++;

        this.emit(
          "unlockFailed",
          {
            attempts:
              this.state.failedAttempts
          }
        );

        return {
          success: false,
          error: "Invalid vault authentication."
        };

      }

    }

    this.state.unlocked = true;
    this.state.failedAttempts = 0;
    this.state.lockedAt = null;

    this.emit("unlocked");

    return {
      success: true
    };

  },

  requireUnlock() {

    if (!this.settings.requireAppLock) {
      return true;
    }

    return this.isUnlocked();

  },

  /* =======================================================
     FOLDERS
     ======================================================= */

  createFolder(name, options = {}) {

    name = String(name || "").trim();

    if (!name) {

      return {
        success: false,
        error: "Folder name is required."
      };

    }

    const folder = {

      id: this.createId("folder"),

      ownerId: this.getUserId(),

      name,

      icon: options.icon || "📁",

      color: options.color || "",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    this.folders.set(
      folder.id,
      folder
    );

    this.save();

    this.emit(
      "folderCreated",
      folder
    );

    return {
      success: true,
      folder
    };

  },

  getFolder(folderId) {

    return (
      this.folders.get(folderId) ||
      null
    );

  },

  getFolders() {

    return [
      ...this.folders.values()
    ];

  },

  renameFolder(folderId, name) {

    const folder =
      this.getFolder(folderId);

    if (!folder) {

      return {
        success: false,
        error: "Folder not found."
      };

    }

    if (
      folder.ownerId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    name =
      String(name || "").trim();

    if (!name) {

      return {
        success: false,
        error: "Folder name is required."
      };

    }

    folder.name = name;

    folder.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "folderUpdated",
      folder
    );

    return {
      success: true,
      folder
    };

  },

  deleteFolder(folderId) {

    const folder =
      this.getFolder(folderId);

    if (!folder) {

      return {
        success: false,
        error: "Folder not found."
      };

    }

    if (
      folder.ownerId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    this.items.forEach(
      item => {

        if (
          item.folderId ===
          folderId
        ) {
          item.folderId = null;
        }

      }
    );

    this.folders.delete(
      folderId
    );

    this.save();

    this.emit(
      "folderDeleted",
      folder
    );

    return {
      success: true
    };

  },

  /* =======================================================
     ADD MEDIA
     ======================================================= */

  add(data = {}) {

    if (!this.requireUnlock()) {

      return {
        success: false,
        locked: true,
        error: "Vault is locked."
      };

    }

    const user =
      this.getUser();

    const source =
      data.source ||
      data.url ||
      data.src ||
      "";

    if (!source) {

      return {
        success: false,
        error: "Media source is required."
      };

    }

    const type =
      data.type ||
      this.detectType(source);

    const item = {

      id:
        this.createId("vault_item"),

      ownerId:
        user.id,

      type,

      name:
        String(
          data.name ||
          `VORTEX ${type}`
        ).trim(),

      source,

      thumbnail:
        data.thumbnail ||
        source,

      mimeType:
        data.mimeType ||
        "",

      size:
        Number(data.size) || 0,

      duration:
        Number(data.duration) || 0,

      width:
        Number(data.width) || 0,

      height:
        Number(data.height) || 0,

      folderId:
        data.folderId ||
        null,

      favorite:
        Boolean(data.favorite),

      hidden:
        true,

      metadata:
        data.metadata ||
        {},

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      lastOpenedAt:
        null

    };

    this.items.set(
      item.id,
      item
    );

    this.save();

    this.emit(
      "added",
      item
    );

    return {
      success: true,
      item
    };

  },

  /* =======================================================
     IMPORT FROM MEDIA ENGINE
     ======================================================= */

  importMedia(media, options = {}) {

    if (!media) {

      return {
        success: false,
        error: "Media is required."
      };

    }

    return this.add({

      source:
        media.url ||
        media.src ||
        media.source,

      thumbnail:
        media.thumbnail ||
        media.thumb ||
        media.url,

      type:
        media.type ||
        media.kind,

      name:
        options.name ||
        media.name,

      mimeType:
        media.mimeType,

      size:
        media.size,

      duration:
        media.duration,

      width:
        media.width,

      height:
        media.height,

      folderId:
        options.folderId ||

        null,

      metadata:
        media.metadata ||
        {}

    });

  },

  /* =======================================================
     GET
     ======================================================= */

  get(itemId) {

    return (
      this.items.get(itemId) ||
      null
    );

  },

  getAll(options = {}) {

    if (!this.requireUnlock()) {
      return [];
    }

    const ownerId =
      this.getUserId();

    let list =
      [...this.items.values()]
        .filter(
          item =>
            item.ownerId ===
            ownerId
        );

    if (options.type) {

      list =
        list.filter(
          item =>
            item.type ===
            options.type
        );

    }

    if (options.folderId) {

      list =
        list.filter(
          item =>
            item.folderId ===
            options.folderId
        );

    }

    if (
      options.favorite !==
      undefined
    ) {

      list =
        list.filter(
          item =>
            item.favorite ===
            Boolean(
              options.favorite
            )
        );

    }

    if (options.search) {

      const query =
        String(
          options.search
        )
          .toLowerCase()
          .trim();

      list =
        list.filter(
          item =>
            item.name
              ?.toLowerCase()
              .includes(query)
        );

    }

    return list.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

  },

  /* =======================================================
     TYPE FILTERS
     ======================================================= */

  getPhotos() {

    return this.getAll({
      type: "image"
    });

  },

  getVideos() {

    return this.getAll({
      type: "video"
    });

  },

  getAudio() {

    return this.getAll({
      type: "audio"
    });

  },

  getDocuments() {

    return this.getAll({
      type: "document"
    });

  },

  /* =======================================================
     UPDATE
     ======================================================= */

  update(itemId, changes = {}) {

    if (!this.requireUnlock()) {

      return {
        success: false,
        locked: true
      };

    }

    const item =
      this.get(itemId);

    if (!item) {

      return {
        success: false,
        error: "Vault item not found."
      };

    }

    if (
      item.ownerId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    const allowed = [

      "name",
      "thumbnail",
      "folderId",
      "favorite",
      "metadata"

    ];

    allowed.forEach(
      key => {

        if (
          changes[key] !==
          undefined
        ) {

          item[key] =
            changes[key];

        }

      }
    );

    item.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "updated",
      item
    );

    return {
      success: true,
      item
    };

  },

  /* =======================================================
     FAVORITES
     ======================================================= */

  toggleFavorite(itemId) {

    const item =
      this.get(itemId);

    if (!item) {

      return {
        success: false
      };

    }

    if (!this.requireUnlock()) {

      return {
        success: false,
        locked: true
      };

    }

    item.favorite =
      !item.favorite;

    item.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "favoriteChanged",
      item
    );

    return {
      success: true,
      favorite:
        item.favorite
    };

  },

  getFavorites() {

    return this.getAll({
      favorite: true
    });

  },

  /* =======================================================
     MOVE
     ======================================================= */

  move(itemId, folderId) {

    const item =
      this.get(itemId);

    if (!item) {

      return {
        success: false,
        error: "Item not found."
      };

    }

    if (
      folderId &&
      !this.getFolder(folderId)
    ) {

      return {
        success: false,
        error: "Folder not found."
      };

    }

    item.folderId =
      folderId || null;

    item.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "moved",
      item
    );

    return {
      success: true,
      item
    };

  },

  /* =======================================================
     DELETE
     ======================================================= */

  delete(itemId) {

    if (!this.requireUnlock()) {

      return {
        success: false,
        locked: true
      };

    }

    const item =
      this.get(itemId);

    if (!item) {

      return {
        success: false,
        error: "Item not found."
      };

    }

    if (
      item.ownerId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    this.items.delete(
      itemId
    );

    this.save();

    this.emit(
      "deleted",
      item
    );

    return {
      success: true
    };

  },

  /* =======================================================
     PERMANENT CLEAR
     ======================================================= */

  emptyVault() {

    if (!this.requireUnlock()) {

      return {
        success: false,
        locked: true
      };

    }

    this.items.clear();

    this.save();

    this.emit(
      "emptied"
    );

    return {
      success: true
    };

  },

  /* =======================================================
     OPEN
     ======================================================= */

  open(itemId) {

    if (!this.requireUnlock()) {

      return {
        success: false,
        locked: true
      };

    }

    const item =
      this.get(itemId);

    if (!item) {

      return {
        success: false,
        error: "Item not found."
      };

    }

    item.lastOpenedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "opened",
      item
    );

    return {
      success: true,
      item
    };

  },

  /* =======================================================
     SEARCH
     ======================================================= */

  search(query) {

    return this.getAll({
      search: query
    });

  },

  /* =======================================================
     STATS
     ======================================================= */

  getStats() {

    const list =
      this.getAll();

    return {

      total:
        list.length,

      photos:
        list.filter(
          item =>
            item.type ===
            "image"
        ).length,

      videos:
        list.filter(
          item =>
            item.type ===
            "video"
        ).length,

      audio:
        list.filter(
          item =>
            item.type ===
            "audio"
        ).length,

      documents:
        list.filter(
          item =>
            item.type ===
            "document"
        ).length,

      favorites:
        list.filter(
          item =>
            item.favorite
        ).length,

      size:
        list.reduce(
          (total, item) =>
            total +
            (Number(
              item.size
            ) || 0),
          0
        )

    };

  },

  /* =======================================================
     SETTINGS
     ======================================================= */

  updateSettings(changes = {}) {

    const allowed = [

      "autoLock",
      "lockMinutes",
      "hideFromGallery",
      "requireAppLock",
      "screenshotProtection"

    ];

    allowed.forEach(
      key => {

        if (
          changes[key] !==
          undefined
        ) {

          this.settings[key] =
            changes[key];

        }

      }
    );

    this.save();

    this.emit(
      "settingsChanged",
      this.settings
    );

    return {
      success: true,
      settings:
        this.settings
    };

  },

  getSettings() {

    return {
      ...this.settings
    };

  },

  /* =======================================================
     AUTO LOCK
     ======================================================= */

  checkAutoLock() {

    if (
      !this.settings.autoLock ||
      !this.isUnlocked()
    ) {
      return;
    }

    if (
      !this.state.lockedAt
    ) {
      return;
    }

    const elapsed =
      Date.now() -
      this.state.lockedAt;

    const limit =
      Number(
        this.settings.lockMinutes
      ) *
      60 *
      1000;

    if (
      elapsed >= limit
    ) {
      this.lock();
    }

  },

  /* =======================================================
     DETECT TYPE
     ======================================================= */

  detectType(source) {

    const value =
      String(source)
        .toLowerCase();

    if (
      value.startsWith(
        "data:image/"
      ) ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
        .test(value)
    ) {
      return "image";
    }

    if (
      value.startsWith(
        "data:video/"
      ) ||
      /\.(mp4|webm|mov|mkv|avi)$/i
        .test(value)
    ) {
      return "video";
    }

    if (
      value.startsWith(
        "data:audio/"
      ) ||
     
