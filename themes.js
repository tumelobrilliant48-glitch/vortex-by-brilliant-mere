/* VORTEX THEMES ENGINE
   Handles premium visual themes,
   theme selection and persistence.
*/


/* =========================
   AVAILABLE THEMES
========================= */

const VORTEX_THEMES = {

  default: {
    name: "VORTEX",
    icon: "⚡",
    description: "The original VORTEX experience."
  },

  ocean: {
    name: "Ocean",
    icon: "🌊",
    description: "Deep blue futuristic atmosphere."
  },

  space: {
    name: "Space",
    icon: "🌌",
    description: "Dark cosmic VORTEX environment."
  },

  sunset: {
    name: "Sunset",
    icon: "🌅",
    description: "Warm futuristic sunset atmosphere."
  },

  neon: {
    name: "Neon",
    icon: "💜",
    description: "High-energy cyber neon experience."
  },

  midnight: {
    name: "Midnight",
    icon: "🌙",
    description: "Minimal dark premium interface."
  }

};


/* =========================
   GET CURRENT THEME
========================= */

function getCurrentTheme() {

  const saved =
    get(
      STORE.theme,
      "default"
    );

  return VORTEX_THEMES[saved]
    ? saved
    : "default";
}


/* =========================
   APPLY THEME
========================= */

function applyTheme(name) {

  if (!VORTEX_THEMES[name]) {
    name = "default";
  }


  /*
    Remove previous VORTEX theme
    classes without touching unrelated
    body classes.
  */

  Object.keys(VORTEX_THEMES)
    .forEach(themeName => {

      if (themeName !== "default") {
        document.body.classList.remove(
          themeName
        );
      }

    });


  if (name !== "default") {

    document.body.classList.add(
      name
    );

  }


  document.body.dataset.theme =
    name;


  /*
    Save theme.
  */

  set(
    STORE.theme,
    name
  );


  /*
    Update
