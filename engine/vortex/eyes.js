/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / EYES.JS

   VORTEX EYES:
   - Touchable eyes
   - Quick-app actions
   - Wake/sleep state
   - Voice-command lifecycle
   - Sound activity visualization
   - Custom eye appearance
========================================================= */

"use strict";

const VortexEyes = {

  state: {

    awake: false,

    listening: false,

    soundActive: false,

    initialized: false,

    commandStartedAt: null,

    lastCommand: null,

    currentApp: null

  },


  settings: {

    enabled: true,

    wakePhrase: "hey vortex",

    listenDuration: 120000,

    soundReactive: true,

    touchEnabled: true,

    doubleTapEnabled: true,

    theme: "cosmic",

    eyeStyle: "classic",

    leftEye: "blue",

    rightEye: "purple",

    quickApps: []

  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    if (
      this.state.initialized
    ) {

      return;

    }


    this.load();

    this.state.initialized = true;

    this.bindEyeControls();

    this.emit(
      "ready"
    );

  },


  /* =======================================================
     WAKE
  ======================================================= */

  wake() {

    if (
      !this.settings.enabled
    ) {

      return false;

    }


    this.state.awake = true;

    this.state.listening = true;

    this.state.commandStartedAt =
      Date.now();


    this.emit(
      "wake"
    );


    this.startListeningTimer();

    return true;

  },


  /* =======================================================
     SLEEP
  ======================================================= */

  sleep() {

    this.state.awake = false;

    this.state.listening = false;

    this.state.soundActive = false;

    this.state.commandStartedAt =
      null;

    this.emit(
      "sleep"
    );

  },


  /* =======================================================
     TWO-MINUTE LISTEN WINDOW
  ======================================================= */

  startListeningTimer() {

    const started =
      this.state.commandStartedAt;


    setTimeout(
      () => {

        if (
          this.state.commandStartedAt !==
          started
        ) {

          return;

        }


        this.sleep();

      },
      this.settings.listenDuration
    );

  },


  /* =======================================================
     VOICE COMMAND
  ======================================================= */

  receiveCommand(
    command
  ) {

    if (
      !this.state.awake
    ) {

      return false;

    }


    const text =
      String(command || "")
        .trim()
        .toLowerCase();


    if (!text) {
      return false;
    }


    this.state.lastCommand =
      text;


    /*
      "wake up" can keep the eyes awake.
    */

    if (
      text.includes("wake up")
    ) {

      this.wake();

      return true;

    }


    /*
      "go to..." can launch a registered
      quick application.
    */

    const app =
      this.findQuickApp(text);


    if (app) {

      this.openQuickApp(
        app
      );

      return true;

    }


    this.emit(
      "command",
      {
        command: text
      }
    );


    return true;

  },


  /* =======================================================
     QUICK APPS
  ======================================================= */

  addQuickApp(
    app
  ) {

    if (!app?.id) {
      return false;
    }


    const existing =
      this.settings.quickApps
        .find(
          item =>
            item.id === app.id
        );


    if (existing) {
      return false;
    }


    this.settings.quickApps.push({

      id: app.id,

      name:
        app.name ||
        app.id,

      trigger:
        app.trigger ||
        app.name ||
        app.id,

      action:
        app.action ||
        null

    });


    this.save();

    this.emit(
      "quickAppAdded",
      app
    );

    return true;

  },


  removeQuickApp(
    appId
  ) {

    const index =
      this.settings.quickApps
        .findIndex(
          app =>
            app.id === appId
        );


    if (index === -1) {
      return false;
    }


    this.settings.quickApps
      .splice(index, 1);

    this.save();

    return true;

  },


  findQuickApp(
    command
  ) {

    return this.settings.quickApps
      .find(app => {

        const trigger =
          String(
            app.trigger || ""
          )
            .toLowerCase();


        return (
          command.includes(
            trigger
          ) ||

          command.includes(
            String(
              app.name || ""
            )
              .toLowerCase()
          )

        );

      });

  },


  openQuickApp(
    app
  ) {

    this.state.currentApp =
      app.id;


    /*
      The eyes stay awake while
      a quick app is being opened.
    */

    this.state.awake = true;

    this.emit(
      "openApp",
      {
        app
      }
    );


    /*
      If the main VORTEX router exists,
      let it handle navigation.
    */

    if (
      typeof VortexRouter !==
      "undefined" &&
      typeof VortexRouter.navigate ===
      "function"
    ) {

      VortexRouter.navigate(
        app.id
      );

    }


    return true;

  },


  /* =======================================================
     TOUCH
  ======================================================= */

  touch() {

    if (
      !this.settings.touchEnabled
    ) {

      return;

    }


    if (
      this.state.awake
    ) {

      this.sleep();

    } else {

      this.wake();

    }

  },


  /* =======================================================
     DOUBLE TAP
  ======================================================= */

  doubleTap() {

    if (
      !this.settings.doubleTapEnabled
    ) {

      return;

    }


    const firstApp =
      this.settings.quickApps[0];


    if (firstApp) {

      this.wake();

      this.openQuickApp(
        firstApp
      );

    } else {

      this.wake();

    }

  },


  /* =======================================================
     SOUND ACTIVITY
  ======================================================= */

  setSoundActivity(
    active
  ) {

    if (
      !this.settings.soundReactive
    ) {

      return;

    }


    if (
      !this.state.awake
    ) {

      this.state.soundActive =
        false;

      return;

    }


    this.state.soundActive =
      Boolean(active);


    this.emit(
      "sound",
      {
        active:
          this.state.soundActive
      }
    );

  },


  /* =======================================================
     EYE APPEARANCE
  ======================================================= */

  setAppearance(
    options = {}
  ) {

    const allowedStyles = [
      "classic",
      "cyber",
      "galaxy",
      "minimal",
      "crystal",
      "fire",
      "ocean"
    ];


    if (
      options.eyeStyle &&
      allowedStyles.includes(
        options.eyeStyle
      )
    ) {

      this.settings.eyeStyle =
        options.eyeStyle;

    }


    if (options.leftEye) {

      this.settings.leftEye =
        String(
          options.leftEye
        );

    }


    if (options.rightEye) {

      this.settings.rightEye =
        String(
          options.rightEye
        );

    }


    if (options.theme) {

      this.settings.theme =
        String(
          options.theme
        );

    }


    this.save();

    this.emit(
      "appearanceChanged",
      this.settings
    );

  },


  /* =======================================================
     BIND UI
  ======================================================= */

  bindEyeControls() {

    const eyes =
      document.querySelector(
        "[data-vortex-eyes]"
      );


    if (!eyes) {
      return;
    }


    eyes.addEventListener(
      "click",
      () => {

        this.touch();

      }
    );


    eyes.addEventListener(
      "dblclick",
      () => {

        this.doubleTap();

      }
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
      "eyes_settings",
      this.settings
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
        "eyes_settings",
        null
      );


    if (saved) {

      this.settings = {

        ...this.settings,

        ...saved

      };

    }

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
        `vortex:eyes:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexEyes =
  VortexEyes;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexEyes.initialize();

  }
);
