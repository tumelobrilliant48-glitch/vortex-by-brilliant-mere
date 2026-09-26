/* =========================================================
   VORTEX OMNIVERSE
   SETTINGS ENGINE
   Privacy • Appearance • Notifications • Security
   Storage • Account • Accessibility • App Controls
   ========================================================= */

"use strict";

const VortexSettings = {

  VERSION: "1.0.0",
  STORAGE_KEY: "vortex_settings",

  defaults: {

    /* ACCOUNT */
    account: {
      profileVisibility: "public",
      activityStatus: true,
      readReceipts: true,
      typingIndicators: true,
      showOnlineStatus: true
    },

    /* PRIVACY */
    privacy: {
      whoCanMessage: "everyone",
      whoCanFollow: "everyone",
      whoCanComment: "everyone",
      whoCanTag: "everyone",
      whoCanMention: "everyone",
      showProfileInSearch: true,
      showActivity: true,
      personalizedSuggestions: true
    },

    /* NOTIFICATIONS */
    notifications: {
      enabled: true,
      messages: true,
      friendRequests: true,
      comments: true,
      likes: true,
      follows: true,
      mentions: true,
      groups: true,
      events: true,
      games: true,
      marketplace: true,
      system: true,
      sounds: true,
      vibration: true
    },

    /* APPEARANCE */
    appearance: {
      theme: "neon",
      darkMode: true,
      animations: true,
      reduceMotion: false,
      glowEffects: true,
      glassEffects: true,
      particleEffects: true,
      compactMode: false,
      fontSize: "medium"
    },

    /* MEDIA */
    media: {
      autoplayVideos: true,
      autoplayOnMobileData: false,
      highQualityUploads: true,
      saveOriginalPhotos: true,
      dataSaver: false,
      preloadMedia: true
    },

    /* CHAT */
    chat: {
      enterToSend: true,
      mediaAutoDownload: true,
      voicePlaybackSpeed: 1,
      chatSounds: true,
      chatVibration: true
    },

    /* AI */
    ai: {
      enabled: true,
      voiceEnabled: true,
      autoGreeting: true,
      wakeWord: "Hey Vortex",
      listeningTimeout: 30,
      hourlyTimeAnnouncements: false,
      pauseDuringCalls: true,
      showOrb: true
    },

    /* GAMES */
    games: {
      sound: true,
      vibration: true,
      music: true,
      autoSave: true,
      landscapeMode: true,
      showGameNotifications: true
    },

    /* SECURITY */
    security: {
      appLock: false,
      lockMethod: "pin",
      autoLock: true,
      autoLockMinutes: 5,
      screenshotProtection: false,
      hideSensitiveNotifications: false
    },

    /* DATA */
    data: {
      backgroundData: true,
      syncOnWiFiOnly: false,
      offlineMode: true,
      cacheMedia: true,
      clearCacheOnExit: false
    },

    /* ACCESSIBILITY */
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceTransparency: false,
      reduceAnimations: false,
      screenReaderHints: true
    },

    /* LANGUAGE */
    language: {
      locale: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    },

    /* HOME */
    home: {
      showStories: true,
      showTrending: true,
      showSuggestedUsers: true,
      showGames: true,
      showEvents: true,
      showAI: true,
      showMarketplace: true
    }
  },

  state: null,
  initialized: false,
  listeners: new Set(),

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    if (this.initialized) {
      return this;
    }

    this.state = this.load();

    this.apply();

    this.initialized = true;

    this.emit("ready", this.state);

    return this;
  },

  /* =======================================================
     STORAGE
     ======================================================= */

  load() {

    try {

      const raw =
        localStorage.getItem(
          this.STORAGE_KEY
        );

      if (!raw) {
        return this.clone(this.defaults);
      }

      const saved =
        JSON.parse(raw);

      return this.merge(
        this.clone(this.defaults),
        saved
      );

    } catch (error) {

      console.warn(
        "[VORTEX SETTINGS] Load failed:",
        error
      );

      return this.clone(this.defaults);
    }
  },

  save() {

    try {

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.state)
      );

      this.emit(
        "change",
        this.state
      );

      return true;

    } catch (error) {

      console.warn(
        "[VORTEX SETTINGS] Save failed:",
        error
      );

      return false;
    }
  },

  /* =======================================================
     GET
     ======================================================= */

  get(path, fallback = undefined) {

    if (!this.state) {
      this.init();
    }

    const parts =
      String(path)
        .split(".")
        .filter(Boolean);

    let value =
      this.state;

    for (const part of parts) {

      if (
        value &&
        Object.prototype.hasOwnProperty.call(
          value,
          part
        )
      ) {
        value = value[part];
      } else {
        return fallback;
      }
    }

    return value;
  },

  /* =======================================================
     SET
     ======================================================= */

  set(path, value, save = true) {

    if (!this.state) {
      this.init();
    }

    const parts =
      String(path)
        .split(".")
        .filter(Boolean);

    if (!parts.length) {
      return false;
    }

    let target =
      this.state;

    for (
      let i = 0;
      i < parts.length - 1;
      i++
    ) {

      const part =
        parts[i];

      if (
        !target[part] ||
        typeof target[part] !== "object"
      ) {
        target[part] = {};
      }

      target =
        target[part];
    }

    target[
      parts[parts.length - 1]
    ] = value;

    if (save) {
      this.save();
      this.apply(path);
    }

    return true;
  },

  /* =======================================================
     UPDATE SECTION
     ======================================================= */

  update(section, values) {

    if (!this.state) {
      this.init();
    }

    if (
      !this.state[section] ||
      typeof this.state[section] !== "object"
    ) {
      this.state[section] = {};
    }

    this.state[section] =
      this.merge(
        this.state[section],
        values || {}
      );

    this.save();

    this.apply(section);

    return this.state[section];
  },

  /* =======================================================
     RESET
     ======================================================= */

  reset(section = null) {

    if (!this.state) {
      this.init();
    }

    if (section) {

      if (
        Object.prototype.hasOwnProperty.call(
          this.defaults,
          section
        )
      ) {

        this.state[section] =
          this.clone(
            this.defaults[section]
          );
      }

    } else {

      this.state =
        this.clone(
          this.defaults
        );
    }

    this.save();

    this.apply();

    this.emit(
      "reset",
      section
    );

    return true;
  },

  /* =======================================================
     APPEARANCE
     ======================================================= */

  apply() {

    if (!this.state) {
      return;
    }

    const root =
      document.documentElement;

    const body =
      document.body;

    if (!root) {
      return;
    }

    /* DARK MODE */

    root.dataset.theme =
      this.get(
        "appearance.theme",
        "neon"
      );

    root.dataset.mode =
      this.get(
        "appearance.darkMode",
        true
      )
        ? "dark"
        : "light";

    /* COMPACT */

    root.classList.toggle(
      "vortex-compact",
      this.get(
        "appearance.compactMode",
        false
      )
    );

    /* GLOW */

    root.classList.toggle(
      "vortex-no-glow",
      !this.get(
        "appearance.glowEffects",
        true
      )
    );

    /* GLASS */

    root.classList.toggle(
      "vortex-no-glass",
      !this.get(
        "appearance.glassEffects",
        true
      )
    );

    /* PARTICLES */

    root.classList.toggle(
      "vortex-no-particles",
      !this.get(
        "appearance.particleEffects",
        true
      )
    );

    /* MOTION */

    const reduceMotion =
      this.get(
        "appearance.reduceMotion",
        false
      ) ||
      this.get(
        "accessibility.reduceAnimations",
        false
      );

    root.classList.toggle(
      "vortex-reduce-motion",
      reduceMotion
    );

    /* TRANSPARENCY */

    root.classList.toggle(
      "vortex-reduce-transparency",
      this.get(
        "accessibility.reduceTransparency",
        false
      )
    );

    /* CONTRAST */

    root.classList.toggle(
      "vortex-high-contrast",
      this.get(
        "accessibility.highContrast",
        false
      )
    );

    /* LARGE TEXT */

    root.classList.toggle(
      "vortex-large-text",
      this.get(
        "accessibility.largeText",
        false
      )
    );

    /* FONT SIZE */

    root.dataset.fontSize =
      this.get(
        "appearance.fontSize",
        "medium"
      );

    if (body) {

      body.classList.toggle(
        "vortex-data-saver",
        this.get(
          "media.dataSaver",
          false
        )
      );
    }

    this.applyTheme();

    this.emit(
      "applied",
      this.state
    );
  },

  /* =======================================================
     THEME
     ======================================================= */

  applyTheme() {

    const theme =
      this.get(
        "appearance.theme",
        "neon"
      );

    if (
      window.VortexThemes &&
      typeof window.VortexThemes.apply ===
        "function"
    ) {

      try {
        window.VortexThemes.apply(
          theme
        );
      } catch (error) {
        console.warn(
          "[VORTEX SETTINGS] Theme apply failed:",
          error
        );
      }

    } else {

      document.documentElement.dataset.theme =
        theme;
    }
  },

  setTheme(theme) {

    if (!theme) {
      return false;
    }

    this.set(
      "appearance.theme",
      theme
    );

    return true;
  },

  /* =======================================================
     PRIVACY
     ======================================================= */

  setPrivacy(key, value) {

    return this.set(
      `privacy.${key}`,
      value
    );
  },

  getPrivacy(key, fallback) {

    return this.get(
      `privacy.${key}`,
      fallback
    );
  },

  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  setNotification(type, enabled) {

    return this.set(
      `notifications.${type}`,
      Boolean(enabled)
    );
  },

  notificationsEnabled(type = null) {

    if (
      !this.get(
        "notifications.enabled",
        true
      )
    ) {
      return false;
    }

    if (!type) {
      return true;
    }

    return Boolean(
      this.get(
        `notifications.${type}`,
        true
      )
    );
  },

  /* =======================================================
     MEDIA
     ======================================================= */

  shouldAutoplayVideos() {

    if (
      this.get(
        "media.dataSaver",
        false
      )
    ) {
      return false;
    }

    return this.get(
      "media.autoplayVideos",
      true
    );
  },

  shouldAutoplayOnMobileData() {

    if (
      this.get(
        "media.dataSaver",
        false
      )
    ) {
      return false;
    }

    return this.get(
      "media.autoplayOnMobileData",
      false
    );
  },

  /* =======================================================
     CHAT
     ======================================================= */

  chatEnterToSend() {

    return this.get(
      "chat.enterToSend",
      true
    );
  },

  /* =======================================================
     AI
     ======================================================= */

  aiEnabled() {

    return this.get(
      "ai.enabled",
      true
    );
  },

  aiVoiceEnabled() {

    return (
      this.aiEnabled() &&
      this.get(
        "ai.voiceEnabled",
        true
      )
    );
  },

  getAIConfig() {

    return {
      enabled:
        this.get(
          "ai.enabled",
          true
        ),

      voiceEnabled:
        this.get(
          "ai.voiceEnabled",
          true
        ),

      autoGreeting:
        this.get(
          "ai.autoGreeting",
          true
        ),

      wakeWord:
        this.get(
          "ai.wakeWord",
          "Hey Vortex"
        ),

      listeningTimeout:
        this.get(
          "ai.listeningTimeout",
          30
        ),

      hourlyTimeAnnouncements:
        this.get(
          "ai.hourlyTimeAnnouncements",
          false
        ),

      pauseDuringCalls:
        this.get(
          "ai.pauseDuringCalls",
          true
        ),

      showOrb:
        this.get(
          "ai.showOrb",
          true
        )
    };
  },

  /* =======================================================
     SECURITY
     ======================================================= */

  isAppLockEnabled() {

    return this.get(
      "security.appLock",
      false
    );
  },

  getLockConfig() {

    return {
      enabled:
        this.get(
          "security.appLock",
          false
        ),

      method:
        this.get(
          "security.lockMethod",
          "pin"
        ),

      autoLock:
        this.get(
          "security.autoLock",
          true
        ),

      minutes:
        this.get(
          "security.autoLockMinutes",
          5
        ),

      screenshotProtection:
        this.get(
          "security.screenshotProtection",
          false
        )
    };
  },

  /* =======================================================
     DATA
     ======================================================= */

  isOfflineModeEnabled() {

    return this.get(
      "data.offlineMode",
      true
    );
  },

  isDataSaverEnabled() {

    return this.get(
      "media.dataSaver",
      false
    );
  },

  /* =======================================================
     HOME
     ======================================================= */

  homeFeatureVisible(feature) {

    return this.get(
      `home.${feature}`,
      true
    );
  },

  /* =======================================================
     LANGUAGE
     ======================================================= */

  getLocale() {

    return this.get(
      "language.locale",
      "en"
    );
  },

  setLocale(locale) {

    return this.set(
      "language.locale",
      locale
    );
  },

  /* =======================================================
     EXPORT
     ======================================================= */

  export() {

    if (!this.state) {
      this.init();
    }

    return JSON.stringify(
      {
        app: "VORTEX OMNIVERSE",
        version: this.VERSION,
        exportedAt:
          new Date().toISOString(),
        settings:
          this.state
      },
      null,
      2
    );
  },

  /* =======================================================
     IMPORT
     ======================================================= */

  import(data) {

    try {

      const parsed =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      const incoming =
        parsed.settings ||
        parsed;

      if (
        !incoming ||
        typeof incoming !== "object"
      ) {
        return false;
      }

      this.state =
        this.merge(
          this.clone(
            this.defaults
          ),
          incoming
        );

      this.save();

      this.apply();

      this.emit(
        "imported",
        this.state
      );

      return true;

    } catch (error) {

      console.warn(
        "[VORTEX SETTINGS] Import failed:",
        error
      );

      return false;
    }
  },

  /* =======================================================
     DOWNLOAD SETTINGS
     ======================================================= */

  download() {

    const data =
      this.export();

    const blob =
      new Blob(
        [data],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "vortex-settings.json";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  },

  /* =======================================================
     SETTINGS UI
     ======================================================= */

  render(container) {

    if (!container) {
      return;
    }

    container.innerHTML = `

      <section
        class="vortex-settings"
        data-vortex-settings
      >

        <header class="settings-header">

          <div>

            <div class="settings-title">
              VORTEX Settings
            </div>

            <div class="settings-subtitle">
              Customize your VORTEX experience
            </div>

          </div>

        </header>

        <div class="settings-section">

          <h3>Appearance</h3>

          ${this.toggle(
            "appearance.darkMode",
            "Dark Mode",
            "Use the VORTEX dark interface"
          )}

          ${this.toggle(
            "appearance.animations",
            "Animations",
            "Enable interface animations"
          )}

          ${this.toggle(
            "appearance.glowEffects",
            "Glow Effects",
            "Enable futuristic VORTEX glow effects"
          )}

          ${this.toggle(
            "appearance.glassEffects",
            "Glass Effects",
            "Enable glass interface surfaces"
          )}

          ${this.toggle(
            "appearance.particleEffects",
            "Particles",
            "Enable background particles"
          )}

        </div>

        <div class="settings-section">

          <h3>Privacy</h3>

          ${this.toggle(
            "account.activityStatus",
            "Activity Status",
            "Allow people to see when you are active"
          )}

          ${this.toggle(
            "account.readReceipts",
            "Read Receipts",
            "Show when messages are read"
          )}

          ${this.toggle(
            "account.typingIndicators",
            "Typing Indicators",
            "Show when you are typing"
          )}

          ${this.toggle(
            "privacy.showProfileInSearch",
            "Search Visibility",
            "Allow your profile to appear in search"
          )}

        </div>

        <div class="settings-section">

          <h3>Notifications</h3>

          ${this.toggle(
            "notifications.enabled",
            "Notifications",
            "Enable VORTEX notifications"
          )}

          ${this.toggle(
            "notifications.messages",
            "Messages",
            "New message notifications"
          )}

          ${this.toggle(
            "notifications.comments",
            "Comments",
            "Comment notifications"
          )}

          ${this.toggle(
            "notifications.likes",
            "Likes",
            "Like notifications"
          )}

          ${this.toggle(
            "notifications.follows",
            "Follows",
            "New follower notifications"
          )}

        </div>

        <div class="settings-section">

          <h3>Media & Data</h3>

          ${this.toggle(
            "media.autoplayVideos",
            "Autoplay Videos",
            "Automatically play videos"
          )}

          ${this.toggle(
            "media.autoplayOnMobileData",
            "Mobile Data Autoplay",
            "Allow autoplay while using mobile data"
          )}

          ${this.toggle(
            "media.highQualityUploads",
            "High Quality Uploads",
            "Upload photos and videos at higher quality"
          )}

          ${this.toggle(
            "media.dataSaver",
            "Data Saver",
            "Reduce media and network usage"
          )}

          ${this.toggle(
            "data.offlineMode",
            "Offline Mode",
            "Allow supported VORTEX features offline"
          )}

        </div>

        <div class="settings-section">

          <h3>VORTEX AI</h3>

          ${this.toggle(
            "ai.enabled",
            "VORTEX AI",
            "Enable the VORTEX AI assistant"
          )}

          ${this.toggle(
            "ai.voiceEnabled",
            "AI Voice",
            "Allow VORTEX AI to speak"
          )}

          ${this.toggle(
            "ai.autoGreeting",
            "AI Greeting",
            "Greet you when VORTEX opens"
          )}

          ${this.toggle(
            "ai.hourlyTimeAnnouncements",
            "Hourly Time",
            "Allow hourly time announcements"
          )}

        </div>

        <div class="settings-section">

          <h3>Security</h3>

          ${this.toggle(
            "security.appLock",
            "App Lock",
            "Require authentication when VORTEX is locked"
          )}

          ${this.toggle(
            "security.autoLock",
            "Automatic Lock",
            "Automatically lock VORTEX after inactivity"
          )}

          ${this.toggle(
            "security.screenshotProtection",
            "Screenshot Protection",
            "Enable screenshot protection where supported"
          )}

        </div>

        <div class="settings-section">

          <h3>Accessibility</h3>

          ${this.toggle(
            "accessibility.largeText",
            "Large Text",
            "Increase interface text size"
          )}

          ${this.toggle(
            "accessibility.highContrast",
            "High Contrast",
            "Increase interface contrast"
          )}

          ${this.toggle(
            "accessibility.reduceAnimations",
            "Reduce Animations",
            "Reduce interface movement"
          )}

          ${this.toggle(
            "accessibility.reduceTransparency",
            "Reduce Transparency",
            "Reduce transparent surfaces"
          )}

        </div>

        <div class="settings-section">

          <h3>Settings Data</h3>

          <div class="settings-actions">

            <button
              type="button"
              data-settings-action="export"
            >
              Export Settings
            </button>

            <button
              type="button"
              data-settings-action="download"
            >
              Download Settings
            </button>

            <button
              type="button"
              data-settings-action="reset"
            >
              Reset Settings
            </button>

          </div>

        </div>

      </section>
    `;

    this.bindUI(container);
  },

  /* =======================================================
     TOGGLE UI
     ======================================================= */

  toggle(path, title, description) {

    const enabled =
      Boolean(
        this.get(
          path,
          false
        )
      );

    return `

      <label
        class="vortex-setting-row"
        data-setting="${this.escape(path)}"
      >

        <span class="setting-copy">

          <strong>
            ${this.escape(title)}
          </strong>

          <small>
            ${this.escape(description)}
          </small>

        </span>

        <input
          type="checkbox"
          data-setting-toggle="${this.escape(path)}"
          ${enabled ? "checked" : ""}
        >

        <span class="setting-switch"></span>

      </label>
    `;
  },

  /* =======================================================
     BIND UI
     ======================================================= */

  bindUI(container) {

    container
      .querySelectorAll(
        "[data-setting-toggle]"
      )
      .forEach(input => {

        input.addEventListener(
          "change",
          event => {

            const path =
              event.currentTarget
                .dataset
                .settingToggle;

            this.set(
              path,
              event.currentTarget.checked
            );
          }
        );
      });

    const exportButton =
      container.querySelector(
        '[data-settings-action="export"]'
      );

    if (exportButton) {

      exportButton.addEventListener(
        "click",
        () => {

          const data =
            this.export();

          if (
            navigator.clipboard
          ) {

            navigator.clipboard
              .writeText(data)
              .then(() => {
                this.toast(
                  "Settings copied"
                );
              })
              .catch(() => {
                this.toast(
                  "Export created"
                );
              });

          } else {

            this.toast(
              "Export created"
            );
          }
        }
      );
    }

    const downloadButton =
      container.querySelector(
        '[data-settings-action="download"]'
      );

    if (downloadButton) {

      downloadButton.addEventListener(
        "click",
        () => {
          this.download();
        }
      );
    }

    const resetButton =
      container.querySelector(
        '[data-settings-action="reset"]'
      );

    if (resetButton) {

      resetButton.addEventListener(
        "click",
        () => {

          const confirmed =
            window.confirm(
              "Reset all VORTEX settings?"
            );

          if (!confirmed) {
            return;
          }

          this.reset();

          this.render(
            container
          );

          this.toast(
            "Settings reset"
          );
        }
      );
    }
  },

  /* =======================================================
     TOAST
     ======================================================= */

  toast(message) {

    if (
      window.VortexApp &&
      typeof window.VortexApp.toast ===
        "function"
    ) {

      window.VortexApp.toast(
        message
      );

      return;
    }

    if (
      window.VortexUI &&
      typeof window.VortexUI.toast ===
        "function"
    ) {

      window.VortexUI.toast(
        message
      );

      return;
    }

    console.log(
      "[VORTEX SETTINGS]",
      message
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

    const item = {
      event,
      callback
    };

    this.listeners.add(
      item
    );

    return () => {
      this.listeners.delete(
        item
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

         
