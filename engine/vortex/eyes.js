/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / EYES.JS
========================================================= */

"use strict";

const VortexEyes = {

  state: {

    awake: false,

    listening: false,

    initialized: false,

    listeningTimer: null,

    recognition: null,

    audioContext: null,

    analyser: null,

    microphone: null,

    stream: null

  },


  settings: {

    wakeWord: "hey vortex",

    listeningDuration: 120000,

    soundReactive: true,

    requireUserGesture: true

  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    if (this.state.initialized) {
      return true;
    }

    this.state.initialized = true;

    this.setupSpeechRecognition();

    this.emit(
      "initialized"
    );

    return true;

  },


  /* =======================================================
     WAKE / SLEEP
  ======================================================= */

  wake() {

    if (this.state.awake) {
      return;
    }

    this.state.awake = true;

    this.setVisualState(true);

    this.startListening();

    this.emit(
      "awake"
    );

  },


  sleep() {

    this.state.awake = false;

    this.stopListening();

    this.stopSoundReaction();

    this.setVisualState(false);

    this.emit(
      "sleep"
    );

  },


  toggle() {

    if (this.state.awake) {

      this.sleep();

    } else {

      this.wake();

    }

  },


  /* =======================================================
     LISTENING
  ======================================================= */

  startListening() {

    if (this.state.listening) {
      return;
    }

    this.state.listening = true;

    this.emit(
      "listening"
    );


    /*
      Browser speech recognition can only
      be started when the browser/device
      permits microphone access.
    */

    if (this.state.recognition) {

      try {

        this.state.recognition.start();

      } catch (error) {

        /*
          Recognition may already be running.
        */

      }

    }


    this.startSoundReaction();


    clearTimeout(
      this.state.listeningTimer
    );


    this.state.listeningTimer =
      setTimeout(() => {

        this.sleep();

      }, this.settings.listeningDuration);

  },


  stopListening() {

    this.state.listening = false;

    clearTimeout(
      this.state.listeningTimer
    );


    if (this.state.recognition) {

      try {

        this.state.recognition.stop();

      } catch (error) {}

    }

  },


  /* =======================================================
     SPEECH RECOGNITION
  ======================================================= */

  setupSpeechRecognition() {

    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!Recognition) {

      console.warn(
        "Speech recognition is not supported."
      );

      return;

    }


    const recognition =
      new Recognition();


    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";


    recognition.onresult =
      event => {

        let transcript = "";


        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {

          transcript +=
            event.results[i][0].transcript;

        }


        transcript =
          transcript
            .trim()
            .toLowerCase();


        if (!transcript) {
          return;
        }


        this.emit(
          "voice",
          {
            transcript
          }
        );


        this.handleCommand(
          transcript
        );

      };


    recognition.onerror =
      event => {

        this.emit(
          "error",
          {
            error: event.error
          }
        );

      };


    recognition.onend =
      () => {

        if (
          this.state.awake &&
          this.state.listening
        ) {

          try {
            recognition.start();
          } catch (error) {}

        }

      };


    this.state.recognition =
      recognition;

  },


  /* =======================================================
     COMMAND ENGINE
  ======================================================= */

  handleCommand(command) {

    const text =
      String(command)
        .toLowerCase()
        .trim();


    if (
      text.includes("go home")
    ) {

      this.sleep();

      if (
        typeof VortexRouter !== "undefined"
      ) {

        VortexRouter.go("home");

      }

      return;

    }


    if (
      text.includes("open messages")
    ) {

      if (
        typeof VortexRouter !== "undefined"
      ) {

        VortexRouter.go(
          "messages"
        );

      }

      return;

    }


    if (
      text.includes("open vault")
    ) {

      if (
        typeof VortexRouter !== "undefined"
      ) {

        VortexRouter.go(
          "vault"
        );

      }

      return;

    }


    if (
      text.includes("open settings")
    ) {

      if (
        typeof VortexRouter !== "undefined"
      ) {

        VortexRouter.go(
          "settings"
        );

      }

      return;

    }


    if (
      text.includes("sleep vortex")
    ) {

      this.sleep();

      return;

    }


    this.emit(
      "command",
      {
        command: text
      }
    );

  },


  /* =======================================================
     SOUND REACTIVE EYES
  ======================================================= */

  async startSoundReaction() {

    if (
      !this.settings.soundReactive
    ) {
      return;
    }


    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      return;

    }


    try {

      this.state.stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: true
          });


      this.state.audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();


      this.state.analyser =
        this.state.audioContext
          .createAnalyser();


      this.state.analyser.fftSize =
        256;


      this.state.microphone =
        this.state.audioContext
          .createMediaStreamSource(
            this.state.stream
          );


      this.state.microphone.connect(
        this.state.analyser
      );


      this.monitorSound();

    } catch (error) {

      this.emit(
        "microphoneDenied",
        {
          error
        }
      );

    }

  },


  monitorSound() {

    if (
      !this.state.awake ||
      !this.state.analyser
    ) {

      return;

    }


    const data =
      new Uint8Array(
        this.state.analyser.frequencyBinCount
      );


    const check = () => {

      if (
        !this.state.awake ||
        !this.state.analyser
      ) {

        return;

      }


      this.state.analyser
        .getByteFrequencyData(data);


      let total = 0;


      for (
        let i = 0;
        i < data.length;
        i++
      ) {

        total += data[i];

      }


      const average =
        total / data.length;


      this.setBrightness(
        average
      );


      requestAnimationFrame(
        check
      );

    };


    check();

  },


  setBrightness(level) {

    const normalized =
      Math.min(
        1,
        Math.max(
          0,
          level / 120
        )
      );


    document.documentElement
      .style
      .setProperty(
        "--vortex-eye-brightness",
        String(
          0.7 + normalized * 1.5
        )
      );

  },


  stopSoundReaction() {

    if (this.state.stream) {

      this.state.stream
        .getTracks()
        .forEach(track =>
          track.stop()
        );

    }


    if (this.state.audioContext) {

      try {
        this.state.audioContext.close();
      } catch (error) {}

    }


    this.state.stream = null;

    this.state.audioContext = null;

    this.state.analyser = null;

    this.state.microphone = null;

  },


  /* =======================================================
     VISUAL STATE
  ======================================================= */

  setVisualState(awake) {

    const left =
      document.getElementById(
        "eyeLeft"
      );

    const right =
      document.getElementById(
        "eyeRight"
      );


    if (left) {

      left.classList.toggle(
        "awake",
        awake
      );

    }


    if (right) {

      right.classList.toggle(
        "awake",
        awake
      );

    }

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

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


/* =========================================================
   START ENGINE
========================================================= */

window.VortexEyes =
  VortexEyes;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexEyes.initialize();

  }
);
