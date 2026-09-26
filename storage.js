/* =========================================================
   VORTEX OMNIVERSE
   STORAGE ENGINE
   Local Storage • IndexedDB • Cache • Offline Queue
   Files • Media • Database-like Collections
   ========================================================= */

"use strict";

const VortexStorage = {

  VERSION: "1.0.0",

  DB_NAME: "VORTEX_OMNIVERSE_DB",
  DB_VERSION: 1,

  LOCAL_PREFIX: "vortex_",

  db: null,
  initialized: false,

  memory: new Map(),
  listeners: new Set(),

  /* =======================================================
     INIT
     ======================================================= */

  async init() {

    if (this.initialized) {
      return this;
    }

    this.loadLocalMemory();

    try {
      await this.openDB();
    } catch (error) {
      console.warn(
        "[VORTEX STORAGE] IndexedDB unavailable:",
        error
      );
    }

    this.initialized = true;

    this.emit(
      "ready",
      this.getStatus()
    );

    return this;
  },

  /* =======================================================
     INDEXED DB
     ======================================================= */

  openDB() {

    return new Promise((resolve, reject) => {

      if (!("indexedDB" in window)) {
        reject(
          new Error(
            "IndexedDB not supported"
          )
        );
        return;
      }

      const request =
        indexedDB.open(
          this.DB_NAME,
          this.DB_VERSION
        );

      request.onupgradeneeded =
        event => {

          const db =
            event.target.result;

          const stores = [
            "collections",
            "media",
            "files",
            "cache",
            "queue",
            "downloads"
          ];

          stores.forEach(
            storeName => {

              if (
                !db.objectStoreNames
                  .contains(storeName)
              ) {

                db.createObjectStore(
                  storeName,
                  {
                    keyPath: "id"
                  }
                );
              }
            }
          );
        };

      request.onsuccess =
        event => {

          this.db =
            event.target.result;

          this.db.onversionchange =
            () => {
              this.db.close();
            };

          resolve(
            this.db
          );
        };

      request.onerror =
        () => {

          reject(
            request.error ||
            new Error(
              "IndexedDB failed"
            )
          );
        };
    });
  },

  /* =======================================================
     LOCAL MEMORY
     ======================================================= */

  loadLocalMemory() {

    try {

      for (
        let i = 0;
        i < localStorage.length;
        i++
      ) {

        const key =
          localStorage.key(i);

        if (
          !key ||
          !key.startsWith(
            this.LOCAL_PREFIX
          )
        ) {
          continue;
        }

        try {

          const raw =
            localStorage.getItem(
              key
            );

          this.memory.set(
            key,
            JSON.parse(raw)
          );

        } catch {

          this.memory.set(
            key,
            localStorage.getItem(
              key
            )
          );
        }
      }

    } catch (error) {

      console.warn(
        "[VORTEX STORAGE] Local storage scan failed:",
        error
      );
    }
  },

  /* =======================================================
     LOCAL SET
     ======================================================= */

  set(key, value) {

    const storageKey =
      this.normalizeKey(key);

    this.memory.set(
      storageKey,
      value
    );

    try {

      localStorage.setItem(
        storageKey,
        JSON.stringify(value)
      );

    } catch (error) {

      /*
       * Storage may be full.
       * Keep memory copy available.
       */

      console.warn(
        "[VORTEX STORAGE] Local save failed:",
        error
      );
    }

    this.emit(
      "set",
      {
        key: storageKey,
        value
      }
    );

    return value;
  },

  /* =======================================================
     LOCAL GET
     ======================================================= */

  get(key, fallback = null) {

    const storageKey =
      this.normalizeKey(key);

    if (
      this.memory.has(
        storageKey
      )
    ) {

      return this.memory.get(
        storageKey
      );
    }

    try {

      const raw =
        localStorage.getItem(
          storageKey
        );

      if (raw === null) {
        return fallback;
      }

      const value =
        JSON.parse(raw);

      this.memory.set(
        storageKey,
        value
      );

      return value;

    } catch {

      return fallback;
    }
  },

  /* =======================================================
     HAS
     ======================================================= */

  has(key) {

    const storageKey =
      this.normalizeKey(key);

    if (
      this.memory.has(
        storageKey
      )
    ) {
      return true;
    }

    try {

      return (
        localStorage.getItem(
          storageKey
        ) !== null
      );

    } catch {

      return false;
    }
  },

  /* =======================================================
     REMOVE
     ======================================================= */

  remove(key) {

    const storageKey =
      this.normalizeKey(key);

    this.memory.delete(
      storageKey
    );

    try {

      localStorage.removeItem(
        storageKey
      );

    } catch {}

    this.emit(
      "remove",
      {
        key: storageKey
      }
    );

    return true;
  },

  /* =======================================================
     CLEAR VORTEX STORAGE
     ======================================================= */

  clearLocal() {

    const keys = [];

    try {

      for (
        let i = 0;
        i < localStorage.length;
        i++
      ) {

        const key =
          localStorage.key(i);

        if (
          key &&
          key.startsWith(
            this.LOCAL_PREFIX
          )
        ) {

          keys.push(
            key
          );
        }
      }

      keys.forEach(
        key => {
          localStorage.removeItem(
            key
          );
          this.memory.delete(
            key
          );
        }
      );

    } catch (error) {

      console.warn(
        "[VORTEX STORAGE] Clear failed:",
        error
      );
    }

    this.emit(
      "clear",
      {
        count: keys.length
      }
    );

    return keys.length;
  },

  /* =======================================================
     COLLECTIONS
     ======================================================= */

  async collectionSet(
    collection,
    id,
    data
  ) {

    const record = {

      id: String(id),

      collection:
        String(collection),

      data:
        data,

      updatedAt:
        Date.now()
    };

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      const key =
        `collection:${collection}`;

      const items =
        this.get(
          key,
          {}
        );

      items[id] =
        record;

      this.set(
        key,
        items
      );

      return record;
    }

    return this.transaction(
      "collections",
      "readwrite",
      store => {

        return store.put(
          record
        );
      }
    );
  },

  /* =======================================================
     COLLECTION GET
     ======================================================= */

  async collectionGet(
    collection,
    id
  ) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      const items =
        this.get(
          `collection:${collection}`,
          {}
        );

      return items[id] || null;
    }

    const record =
      await this.transaction(
        "collections",
        "readonly",
        store => {

          return store.get(
            String(id)
          );
        }
      );

    if (
      record &&
      record.collection ===
        String(collection)
    ) {

      return record;
    }

    return null;
  },

  /* =======================================================
     COLLECTION ALL
     ======================================================= */

  async collectionAll(
    collection
  ) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      const items =
        this.get(
          `collection:${collection}`,
          {}
        );

      return Object.values(
        items
      );
    }

    const records =
      await this.transaction(
        "collections",
        "readonly",
        store => {

          return store.getAll();
        }
      );

    return records.filter(
      item =>
        item.collection ===
        String(collection)
    );
  },

  /* =======================================================
     COLLECTION DELETE
     ======================================================= */

  async collectionDelete(
    collection,
    id
  ) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      const key =
        `collection:${collection}`;

      const items =
        this.get(
          key,
          {}
        );

      delete items[id];

      this.set(
        key,
        items
      );

      return true;
    }

    await this.transaction(
      "collections",
      "readwrite",
      store => {

        return store.delete(
          String(id)
        );
      }
    );

    return true;
  },

  /* =======================================================
     MEDIA STORAGE
     ======================================================= */

  async saveMedia(
    id,
    blob,
    metadata = {}
  ) {

    if (!blob) {
      throw new Error(
        "Media blob required"
      );
    }

    if (!this.db) {
      await this.init();
    }

    const record = {

      id: String(id),

      blob,

      metadata,

      size:
        blob.size || 0,

      type:
        blob.type || "application/octet-stream",

      createdAt:
        Date.now()
    };

    if (!this.db) {
      return false;
    }

    await this.transaction(
      "media",
      "readwrite",
      store => {

        return store.put(
          record
        );
      }
    );

    this.emit(
      "media:saved",
      record
    );

    return record;
  },

  /* =======================================================
     GET MEDIA
     ======================================================= */

  async getMedia(id) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return null;
    }

    return this.transaction(
      "media",
      "readonly",
      store => {

        return store.get(
          String(id)
        );
      }
    );
  },

  /* =======================================================
     DELETE MEDIA
     ======================================================= */

  async deleteMedia(id) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return false;
    }

    await this.transaction(
      "media",
      "readwrite",
      store => {

        return store.delete(
          String(id)
        );
      }
    );

    this.emit(
      "media:deleted",
      {
        id
      }
    );

    return true;
  },

  /* =======================================================
     FILE STORAGE
     ======================================================= */

  async saveFile(
    id,
    file,
    metadata = {}
  ) {

    if (!file) {
      throw new Error(
        "File required"
      );
    }

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return false;
    }

    const record = {

      id: String(id),

      file,

      metadata,

      name:
        file.name || metadata.name || "file",

      type:
        file.type ||
        metadata.type ||
        "application/octet-stream",

      size:
        file.size || 0,

      createdAt:
        Date.now()
    };

    await this.transaction(
      "files",
      "readwrite",
      store => {

        return store.put(
          record
        );
      }
    );

    this.emit(
      "file:saved",
      record
    );

    return record;
  },

  /* =======================================================
     GET FILE
     ======================================================= */

  async getFile(id) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return null;
    }

    return this.transaction(
      "files",
      "readonly",
      store => {

        return store.get(
          String(id)
        );
      }
    );
  },

  /* =======================================================
     CACHE
     ======================================================= */

  async cacheSet(
    key,
    value,
    ttl = 0
  ) {

    if (!this.db) {
      await this.init();
    }

    const record = {

      id: String(key),

      value,

      createdAt:
        Date.now(),

      expiresAt:
        ttl > 0
          ? Date.now() + ttl
          : 0
    };

    if (!this.db) {

      this.set(
        `cache:${key}`,
        record
      );

      return record;
    }

    await this.transaction(
      "cache",
      "readwrite",
      store => {

        return store.put(
          record
        );
      }
    );

    return record;
  },

  /* =======================================================
     CACHE GET
     ======================================================= */

  async cacheGet(
    key,
    fallback = null
  ) {

    if (!this.db) {
      await this.init();
    }

    let record;

    if (!this.db) {

      record =
        this.get(
          `cache:${key}`,
          null
        );

    } else {

      record =
        await this.transaction(
          "cache",
          "readonly",
          store => {

            return store.get(
              String(key)
            );
          }
        );
    }

    if (!record) {
      return fallback;
    }

    if (
      record.expiresAt &&
      Date.now() >
        record.expiresAt
    ) {

      await this.cacheDelete(
        key
      );

      return fallback;
    }

    return record.value;
  },

  /* =======================================================
     CACHE DELETE
     ======================================================= */

  async cacheDelete(key) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      this.remove(
        `cache:${key}`
      );

      return true;
    }

    await this.transaction(
      "cache",
      "readwrite",
      store => {

        return store.delete(
          String(key)
        );
      }
    );

    return true;
  },

  /* =======================================================
     OFFLINE QUEUE
     ======================================================= */

  async queue(
    type,
    payload
  ) {

    if (!this.db) {
      await this.init();
    }

    const id =
      this.id("queue");

    const record = {

      id,

      type,

      payload,

      createdAt:
        Date.now(),

      attempts: 0
    };

    if (!this.db) {

      const queue =
        this.get(
          "offline_queue",
          []
        );

      queue.push(
        record
      );

      this.set(
        "offline_queue",
        queue
      );

      return record;
    }

    await this.transaction(
      "queue",
      "readwrite",
      store => {

        return store.put(
          record
        );
      }
    );

    this.emit(
      "queue:add",
      record
    );

    return record;
  },

  /* =======================================================
     GET QUEUE
     ======================================================= */

  async getQueue() {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      return this.get(
        "offline_queue",
        []
      );
    }

    return this.transaction(
      "queue",
      "readonly",
      store => {

        return store.getAll();
      }
    );
  },

  /* =======================================================
     REMOVE QUEUE ITEM
     ======================================================= */

  async removeQueue(id) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {

      const queue =
        this.get(
          "offline_queue",
          []
        );

      const filtered =
        queue.filter(
          item =>
            item.id !== id
        );

      this.set(
        "offline_queue",
        filtered
      );

      return true;
    }

    await this.transaction(
      "queue",
      "readwrite",
      store => {

        return store.delete(
          id
        );
      }
    );

    return true;
  },

  /* =======================================================
     FLUSH QUEUE
     ======================================================= */

  async flushQueue(
    handler
  ) {

    if (
      typeof handler !==
      "function"
    ) {
      return false;
    }

    const queue =
      await this.getQueue();

    let completed = 0;

    for (
      const item of queue
    ) {

      try {

        item.attempts =
          Number(
            item.attempts || 0
          ) + 1;

        await handler(
          item
        );

        await this.removeQueue(
          item.id
        );

        completed++;

      } catch (error) {

        console.warn(
          "[VORTEX STORAGE] Queue item failed:",
          item.id,
          error
        );
      }
    }

    this.emit(
      "queue:flushed",
      {
        completed,
        remaining:
          (await this.getQueue())
            .length
      }
    );

    return completed;
  },

  /* =======================================================
     DOWNLOADS
     ======================================================= */

  async saveDownload(
    id,
    blob,
    metadata = {}
  ) {

    if (!blob) {
      return false;
    }

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return false;
    }

    const record = {

      id: String(id),

      blob,

      metadata,

      size:
        blob.size || 0,

      createdAt:
        Date.now()
    };

    await this.transaction(
      "downloads",
      "readwrite",
      store => {

        return store.put(
          record
        );
      }
    );

    this.emit(
      "download:saved",
      record
    );

    return record;
  },

  /* =======================================================
     GET DOWNLOAD
     ======================================================= */

  async getDownload(id) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return null;
    }

    return this.transaction(
      "downloads",
      "readonly",
      store => {

        return store.get(
          String(id)
        );
      }
    );
  },

  /* =======================================================
     DELETE DOWNLOAD
     ======================================================= */

  async deleteDownload(id) {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return false;
    }

    await this.transaction(
      "downloads",
      "readwrite",
      store => {

        return store.delete(
          String(id)
        );
      }
    );

    return true;
  },

  /* =======================================================
     TRANSACTION
     ======================================================= */

  transaction(
    storeName,
    mode,
    operation
  ) {

    return new Promise(
      (resolve, reject) => {

        if (!this.db) {

          reject(
            new Error(
              "Database unavailable"
            )
          );

          return;
        }

        let request;

        try {

          const transaction =
            this.db.transaction(
              storeName,
              mode
            );

          const store =
            transaction.objectStore(
              storeName
            );

          request =
            operation(
              store
            );

          request.onsuccess =
            () => {

              resolve(
                request.result
              );
            };

          request.onerror =
            () => {

              reject(
                request.error
              );
            };

        } catch (error) {

          reject(error);
        }
      }
    );
  },

  /* =======================================================
     STORAGE ESTIMATE
     ======================================================= */

  async estimate() {

    if (
      navigator.storage &&
      navigator.storage.estimate
    ) {

      try {

        const result =
          await navigator.storage
            .estimate();

        return {

          usage:
            result.usage || 0,

          quota:
            result.quota || 0,

          usageMB:
            this.bytesToMB(
              result.usage || 0
            ),

          quotaMB:
            this.bytesToMB(
              result.quota || 0
            ),

          percent:
            result.quota
              ? (
                  result.usage /
                  result.quota
                ) * 100
              : 0
        };

      } catch {}
    }

    return {
      usage: 0,
      quota: 0,
      usageMB: 0,
      quotaMB: 0,
      percent: 0
    };
  },

  /* =======================================================
     PERSIST STORAGE
     ======================================================= */

  async persist() {

    if (
      navigator.storage &&
      navigator.storage.persist
    ) {

      try {

        return await navigator
          .storage
          .persist();

      } catch {}
    }

    return false;
  },

  /* =======================================================
     PERSISTED?
     ======================================================= */

  async isPersisted() {

    if (
      navigator.storage &&
      navigator.storage.persisted
    ) {

      try {

        return await navigator
          .storage
          .persisted();

      } catch {}
    }

    return false;
  },

  /* =======================================================
     CLEAR DATABASE
     ======================================================= */

  async clearDatabase() {

    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return false;
    }

    const stores = [
      "collections",
      "media",
      "files",
      "cache",
      "queue",
      "downloads"
    ];

    for (
      const storeName
      of stores
    ) {

      try {

        await this.transaction(
          storeName,
          "readwrite",
          store => {

            return store.clear();
          }
        );

      } catch (error) {

        console.warn(
          "[VORTEX STORAGE] Clear failed:",
          storeName,
          error
        );
      }
    }

    this.emit(
      "database:clear"
    );

    return true;
  },

  /* =======================================================
     TOTAL CLEANUP
     ======================================================= */

  async clearAll() {

    this.clearLocal();

    await this.clearDatabase();

    this.emit(
      "clear:all"
    );

    return true;
  },

  /* =======================================================
     STATUS
     ======================================================= */

  async getStatus() {

    const estimate =
      await this.estimate();

    return {

      version:
        this.VERSION,

      initialized:
        this.initialized,

      indexedDB:
        Boolean(this.db),

      localStorage:
        this.storageAvailable(),

      usage:
        estimate.usage,

      quota:
        estimate.quota,

      usageMB:
        estimate.usageMB,

      quotaMB:
        estimate.quotaMB,

      usagePercent:
        estimate.percent
    };
  },

  /* =======================================================
     STORAGE AVAILABLE
     ======================================================= */

  storageAvailable() {

    try {

      const test =
        "__vortex_storage_test__";

      localStorage.setItem(
        test,
        "1"
      );

      localStorage.removeItem(
        test
      );

      return true;

    } catch {

      return false;
    }
  },

  /* =======================================================
     KEY NORMALIZER
     ======================================================= */

  normalizeKey(key) {

    key =
      String(key || "")
        .trim();

    if (
      key.startsWith(
        this.LOCAL_PREFIX
      )
    ) {
      return key;
    }

    return (
      this.LOCAL_PREFIX +
      key
    );
  },

  /* =======================================================
     ID GENERATOR
     ======================================================= */

  id(prefix = "item") {

    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  },

  /* =======================================================
     SIZE HELPERS
     ======================================================= */

  bytesToMB(bytes) {

    return Number(
      (
        Number(bytes || 0) /
        1024 /
        1024
      ).toFixed(2)
    );
  },

  bytesToGB(bytes) {

    return Number(
      (
        Number(bytes || 0) /
        1024 /
        1024 /
        1024
      ).toFixed(3)
    );
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

    const listener = {
      event,
      callback
    };

    this.listeners.add(
      listener
    );

    return () => {

      this.listeners.delete(
        listener
      );
    };
  },

  emit(event, data) {

    for (
      const listener
      of this.listeners
    ) {

      if (
        listener.event === event ||
        listener.event === "*"
      ) {

        try {

          listener.callback(
            data,
            event
          );

        } catch (error) {

          console.error(
            "[VORTEX STORAGE] Listener error:",
            error
          );
        }
      }
    }

    try {

      window.dispatchEvent(
        new CustomEvent(
          `vortex:storage:${event}`,
          {
            detail: data
          }
        )
      );

    } catch {}
  }
};

/* =========================================================
   GLOBAL
   ========================================================= */

window.VortexStorage =
  VortexStorage;

/* =========================================================
   AUTO INIT
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      VortexStorage.init();
    },
    {
      once: true
    }
  );

} else {

  VortexStorage.init();
}

/* =========================================================
   ONLINE EVENT
   ========================================================= */

window.addEventListener(
  "online",
  async () => {

    VortexStorage.emit(
      "online"
    );

    if (
      window.VortexBackend &&
      typeof window.VortexBackend
        .flushQueue ===
        "function"
    ) {

      try {

        await window.VortexBackend
          .flushQueue();

      } catch (error) {

        console.warn(
          "[VORTEX STORAGE] Backend queue flush failed:",
          error
        );
      }
    }
  }
);

/* =========================================================
   OFFLINE EVENT
   ========================================================= */

window.addEventListener(
  "offline",
  () => {

    VortexStorage.emit(
      "offline"
    );
  }
);
