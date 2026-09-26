/* =========================================================
   VORTEX OMNIVERSE
   VOICE ENGINE
   Speech Recognition • Text To Speech • Voice Commands
   AI Voice • Wake Word • Listening Control
   ========================================================= */

"use strict";

const VortexVoice = {

  VERSION: "1.0.0",

  state: {
    supported: false,
    listening: false,
    speaking: false,
    paused: false,
    initialized: false,
    lastTranscript: "",
    lastCommand: "",
    volume: 1,
    rate: 1,
    pitch: 1,
    language: "en-US"
  },

  recognition: null,
  listeners: new Set(),
  commands: new Map(),
  silenceTimer: null,

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    if (this.state.initialized) {
      return this;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    this.state.supported =
      Boolean(
        SpeechRecognition
      ) ||
      "speechSynthesis" in window;

    if (SpeechRecognition) {

      try {

        this.recognition =
          new SpeechRecognition();

        this.recognition.continuous =
          false;

        this.recognition.interimResults =
          true;

        this.recognition.lang =
          this.state.language;

        this.recognition.maxAlternatives =
          3;

        this.bindRecognition();

      } catch (error) {

        console.warn(
          "[VORTEX VOICE] Recognition setup failed:",
          error
        );
      }
    }

    this.registerDefaultCommands();

    this.state.initialized =
      true;

    this.emit(
      "ready",
      this.getStatus()
    );

    return this;
  },

  /* =======================================================
     RECOGNITION EVENTS
     ======================================================= */

  bindRecognition() {

    if (!this.recognition) {
      return;
    }

    this.recognition.onstart =
      () => {

        this.state.listening =
          true;

        this.state.paused =
          false;

        this.emit(
          "start"
        );
      };

    this.recognition.onresult =
      event => {

        let finalText = "";
        let interimText = "";

        for (
          let i =
            event.resultIndex;
          i <
            event.results.length;
          i++
        ) {

          const result =
            event.results[i];

          const text =
            result[0]?.transcript
              ?.trim() || "";

          if (result.isFinal) {
            finalText +=
              text + " ";
          } else {
            interimText +=
              text + " ";
          }
        }

        if (interimText) {

          this.emit(
            "interim",
            interimText.trim()
          );
        }

        if (finalText) {

          const transcript =
            finalText.trim();

          this.state.lastTranscript =
            transcript;

          this.emit(
            "transcript",
            transcript
          );

          this.processCommand(
            transcript
          );
        }
      };

    this.recognition.onerror =
      event => {

        this.state.listening =
          false;

        this.emit(
          "error",
          event
        );
      };

    this.recognition.onend =
      () => {

        this.state.listening =
          false;

        this.emit(
          "end"
        );
      };
  },

  /* =======================================================
     START LISTENING
     ======================================================= */

  startListening(options = {}) {

    if (!this.state.initialized) {
      this.init();
    }

    if (!this.recognition) {

      this.emit(
        "unsupported",
        "Speech recognition is not supported."
      );

      return false;
    }

    if (this.state.listening) {
      return true;
    }

    if (options.language) {

      this.setLanguage(
        options.language
      );
    }

    try {

      this.recognition.continuous =
        options.continuous ??
        false;

      this.recognition.interimResults =
        options.interimResults ??
        true;

      this.recognition.start();

      this.startSilenceTimer(
        options.timeout ||
        this.getAISetting(
          "listeningTimeout",
          30
        )
      );

      return true;

    } catch (error) {

      console.warn(
        "[VORTEX VOICE] Start failed:",
        error
      );

      return false;
    }
  },

  /* =======================================================
     STOP LISTENING
     ======================================================= */

  stopListening() {

    this.clearSilenceTimer();

    if (!this.recognition) {
      return false;
    }

    try {

      this.recognition.stop();

    } catch {}

    this.state.listening =
      false;

    this.emit(
      "stopped"
    );

    return true;
  },

  /* =======================================================
     ABORT LISTENING
     ======================================================= */

  abortListening() {

    this.clearSilenceTimer();

    if (!this.recognition) {
      return false;
    }

    try {

      this.recognition.abort();

    } catch {}

    this.state.listening =
      false;

    this.emit(
      "aborted"
    );

    return true;
  },

  /* =======================================================
     SILENCE TIMER
     ======================================================= */

  startSilenceTimer(seconds) {

    this.clearSilenceTimer();

    if (!seconds || seconds <= 0) {
      return;
    }

    this.silenceTimer =
      setTimeout(
        () => {

          if (
            this.state.listening
          ) {
            this.stopListening();
          }

        },
        Number(seconds) * 1000
      );
  },

  clearSilenceTimer() {

    if (this.silenceTimer) {

      clearTimeout(
        this.silenceTimer
      );

      this.silenceTimer =
        null;
    }
  },

  /* =======================================================
     SPEAK
     ======================================================= */

  speak(text, options = {}) {

    if (
      !text ||
      !("speechSynthesis" in window)
    ) {
      return false;
    }

    if (!this.state.initialized) {
      this.init();
    }

    this.stopSpeaking();

    const utterance =
      new SpeechSynthesisUtterance(
        String(text)
      );

    utterance.lang =
      options.language ||
      this.state.language;

    utterance.rate =
      options.rate ??
      this.state.rate;

    utterance.pitch =
      options.pitch ??
      this.state.pitch;

    utterance.volume =
      options.volume ??
      this.state.volume;

    utterance.onstart =
      () => {

        this.state.speaking =
          true;

        this.emit(
          "speak:start",
          text
        );
      };

    utterance.onend =
      () => {

        this.state.speaking =
          false;

        this.emit(
          "speak:end",
          text
        );
      };

    utterance.onerror =
      error => {

        this.state.speaking =
          false;

        this.emit(
          "speak:error",
          error
        );
      };

    window.speechSynthesis.speak(
      utterance
    );

    return true;
  },

  /* =======================================================
     STOP SPEAKING
     ======================================================= */

  stopSpeaking() {

    if (
      "speechSynthesis" in window
    ) {

      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.state.speaking =
      false;

    this.emit(
      "speak:stop"
    );
  },

  /* =======================================================
     PAUSE SPEAKING
     ======================================================= */

  pauseSpeaking() {

    if (
      "speechSynthesis" in window &&
      window.speechSynthesis.speaking
    ) {

      window.speechSynthesis.pause();

      this.state.paused =
        true;

      this.emit(
        "speak:pause"
      );

      return true;
    }

    return false;
  },

  /* =======================================================
     RESUME SPEAKING
     ======================================================= */

  resumeSpeaking() {

    if (
      "speechSynthesis" in window
    ) {

      window.speechSynthesis.resume();

      this.state.paused =
        false;

      this.emit(
        "speak:resume"
      );

      return true;
    }

    return false;
  },

  /* =======================================================
     SET LANGUAGE
     ======================================================= */

  setLanguage(language) {

    if (!language) {
      return false;
    }

    this.state.language =
      language;

    if (this.recognition) {

      this.recognition.lang =
        language;
    }

    this.emit(
      "language",
      language
    );

    return true;
  },

  /* =======================================================
     SET VOICE SETTINGS
     ======================================================= */

  setRate(rate) {

    this.state.rate =
      Math.max(
        0.1,
        Math.min(
          10,
          Number(rate) || 1
        )
      );

    return this.state.rate;
  },

  setPitch(pitch) {

    this.state.pitch =
      Math.max(
        0,
        Math.min(
          2,
          Number(pitch) || 1
        )
      );

    return this.state.pitch;
  },

  setVolume(volume) {

    this.state.volume =
      Math.max(
        0,
        Math.min(
          1,
          Number(volume) || 0
        )
      );

    return this.state.volume;
  },

  /* =======================================================
     VOICE LIST
     ======================================================= */

  getVoices() {

    if (
      !("speechSynthesis" in window)
    ) {
      return [];
    }

    return window
      .speechSynthesis
      .getVoices();
  },

  /* =======================================================
     SELECT VOICE
     ======================================================= */

  findVoice(language) {

    const voices =
      this.getVoices();

    if (!voices.length) {
      return null;
    }

    const exact =
      voices.find(
        voice =>
          voice.lang === language
      );

    if (exact) {
      return exact;
    }

    const base =
      String(language)
        .split("-")[0];

    return (
      voices.find(
        voice =>
          voice.lang
            .toLowerCase()
            .startsWith(
              base.toLowerCase()
            )
      ) ||
      voices[0]
    );
  },

  /* =======================================================
     REGISTER COMMAND
     ======================================================= */

  registerCommand(
    name,
    aliases,
    callback
  ) {

    if (
      typeof callback !==
      "function"
    ) {
      return false;
    }

    if (!Array.isArray(aliases)) {
      aliases = [];
    }

    this.commands.set(
      String(name)
        .toLowerCase(),
      {
        name,
        aliases:
          aliases.map(
            alias =>
              String(alias)
                .toLowerCase()
          ),
        callback
      }
    );

    return true;
  },

  /* =======================================================
     DEFAULT COMMANDS
     ======================================================= */

  registerDefaultCommands() {

    this.registerCommand(
      "stop",
      [
        "stop",
        "stop listening",
        "be quiet",
        "shut up"
      ],
      () => {

        this.stopListening();
        this.stopSpeaking();

        this.emit(
          "command:stop"
        );
      }
    );

    this.registerCommand(
      "sleep",
      [
        "sleep",
        "go to sleep",
        "sleep vortex"
      ],
      () => {

        this.stopListening();
        this.stopSpeaking();

        this.emit(
          "command:sleep"
        );
      }
    );

    this.registerCommand(
      "open games",
      [
        "open games",
        "show games",
        "start games"
      ],
      () => {

        this.emit(
          "command:open",
          "games"
        );
      }
    );

    this.registerCommand(
      "open messages",
      [
        "open messages",
        "show messages",
        "open chat",
        "show chat"
      ],
      () => {

        this.emit(
          "command:open",
          "messages"
        );
      }
    );

    this.registerCommand(
      "open settings",
      [
        "open settings",
        "show settings",
        "settings"
      ],
      () => {

        this.emit(
          "command:open",
          "settings"
        );
      }
    );

    this.registerCommand(
      "open profile",
      [
        "open profile",
        "show profile",
        "my profile"
      ],
      () => {

        this.emit(
          "command:open",
          "profile"
        );
      }
    );

    this.registerCommand(
      "open home",
      [
        "go home",
        "open home",
        "show home"
      ],
      () => {

        this.emit(
          "command:open",
          "home"
        );
      }
    );

    this.registerCommand(
      "open explore",
      [
        "open explore",
        "show explore",
        "explore"
      ],
      () => {

        this.emit(
          "command:open",
          "explore"
        );
      }
    );

    this.registerCommand(
      "read notifications",
      [
        "read notifications",
        "show notifications",
        "open notifications"
      ],
      () => {

        this.emit(
          "command:open",
          "notifications"
        );
      }
    );
  },

  /* =======================================================
     PROCESS COMMAND
     ======================================================= */

  processCommand(text) {

    if (!text) {
      return null;
    }

    const normalized =
      String(text)
        .trim()
        .toLowerCase();

    this.state.lastCommand =
      normalized;

    for (
      const command
      of this.commands.values()
    ) {

      const matches =
        normalized ===
          command.name.toLowerCase() ||
        command.aliases.some(
          alias =>
            normalized === alias ||
            normalized.includes(
              alias
            )
        );

      if (matches) {

        try {

          command.callback(
            text
          );

        } catch (error) {

          this.emit(
            "command:error",
            error
          );
        }

        this.emit(
          "command",
          {
            name:
              command.name,
            text
          }
        );

        return command.name;
      }
    }

    this.emit(
      "unknown",
      text
    );

    return null;
  },

  /* =======================================================
     WAKE WORD
     ======================================================= */

  containsWakeWord(text) {

    const wakeWord =
      this.getAISetting(
        "wakeWord",
        "Hey Vortex"
      );

    if (!wakeWord) {
      return true;
    }

    return String(text)
      .toLowerCase()
      .includes(
        String(wakeWord)
          .toLowerCase()
      );
  },

  /* =======================================================
     LISTEN FOR WAKE WORD
     ======================================================= */

  listenForWakeWord() {

    this.startListening({
      continuous: false,
      interimResults: true
    });

    const unsubscribe =
      this.on(
        "transcript",
        text => {

          if (
            this.containsWakeWord(
              text
            )
          ) {

            this.emit(
              "wake",
              text
            );

            this.speak(
              "Yes, I'm listening."
            );
          }
        }
      );

    return unsubscribe;
  },

  /* =======================================================
     AI GREETING
     ======================================================= */

  greet(name) {

    const userName =
      name ||
      this.getUserName() ||
      "there";

    const message =
      `Hello ${userName}. ` +
      `I'm Vortex. How can I help you?`;

    this.emit(
      "greeting",
      message
    );

    return this.speak(
      message
    );
  },

  /* =======================================================
     TIME
     ======================================================= */

  speakTime() {

    const now =
      new Date();

    const time =
      now.toLocaleTimeString(
        this.state.language,
        {
          hour: "numeric",
          minute: "2-digit"
        }
      );

    return this.speak(
      `The time is ${time}.`
    );
  },

  /* =======================================================
     CURRENT USER
     ======================================================= */

  getUserName() {

    try {

      return (
        window.VortexAuth
          ?.getCurrentUser
          ?.()?.name ||
        window.VortexAuth
          ?.getUser
          ?.()?.name ||
        "there"
      );

    } catch {

      return "there";
    }
  },

  /* =======================================================
     AI SETTING
     ======================================================= */

  getAISetting(
    key,
    fallback
  ) {

    try {

      if (
        window.VortexSettings &&
        typeof window.VortexSettings
          .get ===
          "function"
      ) {

        return window.VortexSettings.get(
          `ai.${key}`,
          fallback
        );
      }

    } catch {}

    return fallback;
  },

  /* =======================================================
     PAUSE DURING CALL
     ======================================================= */

  pauseForCall() {

    this.stopListening();
    this.pauseSpeaking();

    this.emit(
      "call:pause"
    );
  },

  /* =======================================================
     RESUME AFTER CALL
     ======================================================= */

  resumeAfterCall() {

    this.resumeSpeaking();

    this.emit(
      "call:resume"
    );
  },

  /* =======================================================
     STATUS
     ======================================================= */

  getStatus() {

    return {

      version:
        this.VERSION,

      supported:
        this.state.supported,

      listening:
        this.state.listening,

      speaking:
        this.state.speaking,

      paused:
        this.state.paused,

      language:
        this.state.language,

      rate:
        this.state.rate,

      pitch:
        this.state.pitch,

      volume:
        this.state.volume,

      lastTranscript:
        this.state.lastTranscript,

      lastCommand:
        this.state.lastCommand
    };
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
            "[VORTEX VOICE] Listener error:",
            error
          );
        }
      }
    }

    try {

      window.dispatchEvent(
        new CustomEvent(
          `vortex:voice:${event}`,
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

window.VortexVoice =
  VortexVoice;

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
      VortexVoice.init();
    },
    {
      once: true
    }
  );

} else {

  VortexVoice.init();
}

/* =========================================================
   SPEECH VOICES LOADED
   ========================================================= */

if (
  "speechSynthesis" in window
) {

  window.speechSynthesis
    .addEventListener(
      "voiceschanged",
      () => {

        VortexVoice.emit(
          "voices",
          VortexVoice.getVoices()
        );
      }
    );
}

/* =========================================================
   PHONE / CALL DETECTION HOOK
   ========================================================= */

window.addEventListener(
  "vortex:call:start",
  () => {

    if (
      VortexVoice.getAISetting(
        "pauseDuringCalls",
        true
      )
    ) {

      VortexVoice.pauseForCall();
    }
  }
);

window.addEventListener(
  "vortex:call:end",
  () => {

    if (
      VortexVoice.getAISetting(
        "pauseDuringCalls",
        true
      )
    ) {

      VortexVoice.resumeAfterCall();
    }
  }
);

/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden
    ) {

      VortexVoice.stopListening();

    }
  }
);
