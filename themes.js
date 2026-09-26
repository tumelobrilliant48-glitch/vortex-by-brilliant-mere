/* =========================================================
   VORTEX OMNIVERSE
   THEMES ENGINE
   ========================================================= */

"use strict";

const VortexThemes = {

  VERSION: "1.0.0",

  STORAGE_KEY: "vortex_themes",

  listeners: {},

  activeTheme: "neon",

  customThemes: {},

  downloadedThemes: {},

  themes: {

    neon: {
      id: "neon",
      name: "Neon Vortex",
      icon: "🌌",
      description: "Classic VORTEX futuristic neon",
      premium: false,

      colors: {
        background: "#050712",
        surface: "#0b1020",
        surface2: "#10182d",
        text: "#ffffff",
        muted: "#8b96ad",
        cyan: "#00d9ff",
        blue: "#3478ff",
        purple: "#8b4dff",
        pink: "#e14cff",
        success: "#20e3a2",
        danger: "#ff477e"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    ocean: {
      id: "ocean",
      name: "Ocean Pulse",
      icon: "🌊",
      description: "Deep blue ocean atmosphere",
      premium: false,

      colors: {
        background: "#031018",
        surface: "#071d28",
        surface2: "#0b2b3a",
        text: "#f4ffff",
        muted: "#80aab7",
        cyan: "#00e5ff",
        blue: "#008cff",
        purple: "#246bff",
        pink: "#00c6ff",
        success: "#25e6b1",
        danger: "#ff5577"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    space: {
      id: "space",
      name: "Deep Space",
      icon: "🚀",
      description: "Dark cosmic VORTEX",
      premium: false,

      colors: {
        background: "#02020a",
        surface: "#080817",
        surface2: "#101025",
        text: "#ffffff",
        muted: "#8c8ca8",
        cyan: "#5de7ff",
        blue: "#596cff",
        purple: "#a05cff",
        pink: "#e55cff",
        success: "#57e6b1",
        danger: "#ff557d"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    sunset: {
      id: "sunset",
      name: "Solar Sunset",
      icon: "🌅",
      description: "Warm futuristic sunset",
      premium: false,

      colors: {
        background: "#10070b",
        surface: "#1b0c14",
        surface2: "#29101b",
        text: "#fff7f8",
        muted: "#b89ca5",
        cyan: "#ff9d66",
        blue: "#ff7048",
        purple: "#ff4f91",
        pink: "#ff3f6e",
        success: "#8fe39e",
        danger: "#ff435d"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: false,
        gradients: true
      }
    },

    midnight: {
      id: "midnight",
      name: "Midnight",
      icon: "🌑",
      description: "Minimal black premium mode",
      premium: false,

      colors: {
        background: "#000000",
        surface: "#080808",
        surface2: "#121212",
        text: "#ffffff",
        muted: "#888888",
        cyan: "#ffffff",
        blue: "#bdbdbd",
        purple: "#777777",
        pink: "#999999",
        success: "#65d6a2",
        danger: "#ff5555"
      },

      effects: {
        glow: false,
        glass: false,
        animatedBackground: false,
        particles: false,
        gradients: false
      }
    },

    glass: {
      id: "glass",
      name: "Crystal Glass",
      icon: "💎",
      description: "Transparent glass interface",
      premium: false,

      colors: {
        background: "#071018",
        surface: "rgba(255,255,255,.07)",
        surface2: "rgba(255,255,255,.11)",
        text: "#ffffff",
        muted: "#9fb4c5",
        cyan: "#72edff",
        blue: "#6a9dff",
        purple: "#b48cff",
        pink: "#ff8be8",
        success: "#71edba",
        danger: "#ff6688"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    cyber: {
      id: "cyber",
      name: "Cyber City",
      icon: "🤖",
      description: "High-energy cyber interface",
      premium: false,

      colors: {
        background: "#050505",
        surface: "#0c0c0c",
        surface2: "#151515",
        text: "#f4fff8",
        muted: "#87978e",
        cyan: "#00ffcc",
        blue: "#00aaff",
        purple: "#aa44ff",
        pink: "#ff2277",
        success: "#00ff99",
        danger: "#ff3355"
      },

      effects: {
        glow: true,
        glass: false,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    aurora: {
      id: "aurora",
      name: "Aurora",
      icon: "🌈",
      description: "Aurora-inspired flowing colors",
      premium: false,

      colors: {
        background: "#040b12",
        surface: "#091720",
        surface2: "#10252c",
        text: "#ffffff",
        muted: "#8daeb0",
        cyan: "#46ffe1",
        blue: "#45a7ff",
        purple: "#9d6cff",
        pink: "#ff6fd8",
        success: "#65ffb3",
        danger: "#ff6b8a"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    crimson: {
      id: "crimson",
      name: "Crimson",
      icon: "🔥",
      description: "Powerful red futuristic mode",
      premium: false,

      colors: {
        background: "#0d0306",
        surface: "#18070b",
        surface2: "#250b11",
        text: "#ffffff",
        muted: "#b28c94",
        cyan: "#ff536f",
        blue: "#ff385d",
        purple: "#c93366",
        pink: "#ff164f",
        success: "#73dc9d",
        danger: "#ff3155"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    matrix: {
      id: "matrix",
      name: "Matrix",
      icon: "🟢",
      description: "Digital green terminal atmosphere",
      premium: false,

      colors: {
        background: "#000700",
        surface: "#031003",
        surface2: "#061806",
        text: "#d8ffd8",
        muted: "#6aa76a",
        cyan: "#00ff66",
        blue: "#00cc44",
        purple: "#00aa33",
        pink: "#33ff88",
        success: "#00ff55",
        danger: "#ff5555"
      },

      effects: {
        glow: true,
        glass: false,
        animatedBackground: true,
        particles: true,
        gradients: false
      }
    },

    royal: {
      id: "royal",
      name: "Royal Vortex",
      icon: "👑",
      description: "Luxury purple interface",
      premium: false,

      colors: {
        background: "#08040f",
        surface: "#11091d",
        surface2: "#1b0e2c",
        text: "#ffffff",
        muted: "#a796ba",
        cyan: "#8f7cff",
        blue: "#7654ff",
        purple: "#b04cff",
        pink: "#e35cff",
        success: "#6ce3b0",
        danger: "#ff5f8b"
      },

      effects: {
        glow: true,
        glass: true,
        animatedBackground: true,
        particles: true,
        gradients: true
      }
    },

    carbon: {
      id: "carbon",
      name: "Carbon",
      icon: "⚫",
      description: "Clean dark performance theme",
      premium: false,

      colors: {
        background: "#080808",
        surface: "#101010",
        surface2: "#181818",
        text: "#eeeeee",
        muted: "#858585",
        cyan: "#dddddd",
        blue: "#bbbbbb",
        purple: "#999999",
        pink: "#cccccc",
        success: "#72d69e",
        danger: "#ff5d68"
      },

      effects: {
        glow: false,
        glass: false,
        animatedBackground: false,
        particles: false,
        gradients: false
      }
    }

  },

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();

    this.apply(
      this.activeTheme,
      false
    );

    this.emit(
      "ready",
      {
        active:
          this.activeTheme
      }
    );

    console.log(
      "🎨 VORTEX Themes Engine ready."
    );

  },

  /* =======================================================
     GET THEMES
     ======================================================= */

  get(id) {

    if (
      this.customThemes[id]
    ) {
      return this.customThemes[id];
    }

    if (
      this.downloadedThemes[id]
    ) {
      return this.downloadedThemes[id];
    }

    return (
      this.themes[id] ||
      null
    );

  },

  getAll() {

    return [

      ...Object.values(
        this.themes
      ),

      ...Object.values(
        this.downloadedThemes
      ),

      ...Object.values(
        this.customThemes
      )

    ];

  },

  getActive() {

    return this.get(
      this.activeTheme
    );

  },

  /* =======================================================
     APPLY THEME
     ======================================================= */

  apply(id, save = true) {

    const theme =
      this.get(id);

    if (!theme) {

      return {
        success: false,
        error: "Theme not found."
      };

    }

    this.activeTheme =
      theme.id;

    this.applyColors(
      theme
    );

    this.applyEffects(
      theme
    );

    document.documentElement
      .dataset
      .vortexTheme =
        theme.id;

    document.body?.classList
      .add(
        "vortex-theme-active"
      );

    if (save) {
      this.save();
    }

    this.emit(
      "changed",
      theme
    );

    return {
      success: true,
      theme
    };

  },

  /* =======================================================
     APPLY COLORS
     ======================================================= */

  applyColors(theme) {

    const root =
      document.documentElement;

    const colors =
      theme.colors || {};

    Object.entries(
      colors
    ).forEach(
      ([key, value]) => {

        root.style.setProperty(
          `--vortex-${key}`,
          value
        );

        root.style.setProperty(
          `--${key}`,
          value
        );

      }
    );

    root.style.setProperty(
      "--vortex-bg",
      colors.background ||
      "#050712"
    );

    root.style.setProperty(
      "--vortex-surface",
      colors.surface ||
      "#0b1020"
    );

    root.style.setProperty(
      "--vortex-surface-2",
      colors.surface2 ||
      "#10182d"
    );

    root.style.setProperty(
      "--vortex-text",
      colors.text ||
      "#ffffff"
    );

    root.style.setProperty(
      "--vortex-muted",
      colors.muted ||
      "#8b96ad"
    );

    root.style.setProperty(
      "--vortex-accent",
      colors.cyan ||
      "#00d9ff"
    );

    root.style.setProperty(
      "--vortex-gradient",
      `
        linear-gradient(
          135deg,
          ${colors.cyan || "#00d9ff"},
          ${colors.blue || "#3478ff"},
          ${colors.purple || "#8b4dff"}
        )
      `
    );

  },

  /* =======================================================
     EFFECTS
     ======================================================= */

  applyEffects(theme) {

    const effects =
      theme.effects || {};

    const root =
      document.documentElement;

    root.style.setProperty(
      "--vortex-glow",
      effects.glow
        ? "1"
        : "0"
    );

    root.style.setProperty(
      "--vortex-glass",
      effects.glass
        ? "1"
        : "0"
    );

    root.style.setProperty(
      "--vortex-particles",
      effects.particles
        ? "1"
        : "0"
    );

    root.style.setProperty(
      "--vortex-animated-bg",
      effects.animatedBackground
        ? "1"
        : "0"
    );

    root.style.setProperty(
      "--vortex-gradients",
      effects.gradients
        ? "1"
        : "0"
    );

    document.body?.classList
      .toggle(
        "vortex-glow-enabled",
        Boolean(effects.glow)
      );

    document.body?.classList
      .toggle(
        "vortex-glass-enabled",
        Boolean(effects.glass)
      );

    document.body?.classList
      .toggle(
        "vortex-particles-enabled",
        Boolean(effects.particles)
      );

    document.body?.classList
      .toggle(
        "vortex-animated-background",
        Boolean(
          effects.animatedBackground
        )
      );

  },

  /* =======================================================
     RANDOM THEME
     ======================================================= */

  random() {

    const list =
      this.getAll();

    if (!list.length) {
      return null;
    }

    const theme =
      list[
        Math.floor(
          Math.random() *
          list.length
        )
      ];

    return this.apply(
      theme.id
    );

  },

  /* =======================================================
     CREATE CUSTOM THEME
     ======================================================= */

  createCustom(name, config = {}) {

    name =
      String(name || "").trim();

    if (!name) {

      return {
        success: false,
        error: "Theme name is required."
      };

    }

    const id =
      "custom_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7);

    const theme = {

      id,

      name,

      icon:
        config.icon ||
        "🎨",

      description:
        config.description ||
        "Custom VORTEX theme",

      premium:
        Boolean(
          config.premium
        ),

      colors: {

        background:
          config.colors?.background ||
          "#050712",

        surface:
          config.colors?.surface ||
          "#0b1020",

        surface2:
          config.colors?.surface2 ||
          "#10182d",

        text:
          config.colors?.text ||
          "#ffffff",

        muted:
          config.colors?.muted ||
          "#8b96ad",

        cyan:
          config.colors?.cyan ||
          "#00d9ff",

        blue:
          config.colors?.blue ||
          "#3478ff",

        purple:
          config.colors?.purple ||
          "#8b4dff",

        pink:
          config.colors?.pink ||
          "#e14cff",

        success:
          config.colors?.success ||
          "#20e3a2",

        danger:
          config.colors?.danger ||
          "#ff477e"

      },

      effects: {

        glow:
          config.effects?.glow ??
          true,

        glass:
          config.effects?.glass ??
          true,

        animatedBackground:
          config.effects
            ?.animatedBackground ??
          true,

        particles:
          config.effects
            ?.particles ??
          true,

        gradients:
          config.effects
            ?.gradients ??
          true

      }

    };

    this.customThemes[id] =
      theme;

    this.save();

    this.emit(
      "created",
      theme
    );

    return {
      success: true,
      theme
    };

  },

  /* =======================================================
     DELETE CUSTOM THEME
     ======================================================= */

  deleteCustom(id) {

    if (
      !this.customThemes[id]
    ) {

      return {
        success: false,
        error: "Custom theme not found."
      };

    }

    if (
      this.activeTheme === id
    ) {

      this.apply(
        "neon"
      );

    }

    const theme =
      this.customThemes[id];

    delete this.customThemes[id];

    this.save();

    this.emit(
      "deleted",
      theme
    );

    return {
      success: true
    };

  },

  /* =======================================================
     DOWNLOAD / INSTALL THEME
     ======================================================= */

  install(theme) {

    if (
      !theme ||
      !theme.id
    ) {

      return {
        success: false,
        error: "Invalid theme."
      };

    }

    if (
      this.themes[theme.id]
    ) {

      return {
        success: false,
        error: "Theme already exists."
      };

    }

    this.downloadedThemes[
      theme.id
    ] = {

      ...theme,

      downloadedAt:
        new Date().toISOString()

    };

    this.save();

    this.emit(
      "installed",
      theme
    );

    return {
      success: true,
      theme
    };

  },

  uninstall(id) {

    const theme =
      this.downloadedThemes[id];

    if (!theme) {

      return {
        success: false,
        error: "Downloaded theme not found."
      };

    }

    if (
      this.activeTheme === id
    ) {

      this.apply(
        "neon"
      );

    }

    delete this.downloadedThemes[
      id
    ];

    this.save();

    this.emit(
      "uninstalled",
      theme
    );

    return {
      success: true
    };

  },

  /* =======================================================
     THEME PREVIEW
     ======================================================= */

  preview(id) {

    const theme =
      this.get(id);

    if (!theme) {
      return null;
    }

    return {
      ...theme
    };

  },

  /* =======================================================
     RESET
     ======================================================= */

  reset() {

    this.activeTheme =
      "neon";

    this.customThemes = {};
    this.downloadedThemes = {};

    this.apply(
      "neon"
    );

    this.save();

    this.emit(
      "reset"
    );

    return {
      success: true,
      theme:
        this.getActive()
    };

  },

  /* =======================================================
     EXPORT
     ======================================================= */

  exportTheme(id) {

    const theme =
      this.get(id);

    if (!theme) {

      return {
        success: false,
        error: "Theme not found."
      };

    }

    return {

      success: true,

      data:
        JSON.stringify(
          theme,
          null,
          2
        )

    };

  },

  /* =======================================================
     IMPORT
     ======================================================= */

  importTheme(data) {

    try {

      const theme =
        typeof data ===
        "string"
          ? JSON.parse(data)
          : data;

      if (
        !theme ||
        !theme.id ||
        !theme.name
      ) {

        return {
          success: false,
          error: "Invalid theme."
        };

      }

      return this.install(
        theme
      );

    } catch (error) {

      return {
        success: false,
        error: "Invalid theme data."
      };

    }

  },

  /* =======================================================
     RENDER THEME SELECTOR
     ======================================================= */

  renderSelector(
    container,
    options = {}
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

    const themes =
      this.getAll();

    container.innerHTML = "";

    const grid =
      document.createElement(
        "div"
      );

    grid.style.cssText = `

      display:grid;
      grid-template-columns:
        repeat(
          auto-fill,
          minmax(
            140px,
            1fr
          )
        );
      gap:12px;

    `;

    themes.forEach(
      theme => {

        const active =
         
