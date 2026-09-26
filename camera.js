/* =========================================================
   VORTEX OMNIVERSE
   CAMERA ENGINE
   File: Camera.js
   ========================================================= */

"use strict";

const VortexCamera = {

  VERSION: "1.0.0",

  state: {
    initialized: false,
    active: false,
    facingMode: "user",
    stream: null,
    video: null,
    canvas: null,
    context: null,
    recording: false,
    recorder: null,
    recordedChunks: [],
    recordingStartedAt: 0,
    recordingTimer: null,
    torch: false,
    zoom: 1,
    filter: "none",
    flash: "auto",
    timer: 0,
    resolution: "high",
    audio: true,
    mirror: true,
    countdown: false,
    lastPhoto: null,
    lastVideo: null
  },

  listeners: {},

  filters: {
    none: "none",
    neon: "contrast(1.15) saturate(1.4) hue-rotate(8deg)",
    vortex: "contrast(1.12) saturate(1.65) brightness(1.05)",
    cyber: "contrast(1.3) saturate(1.35) hue-rotate(25deg)",
    ocean: "saturate(1.3) hue-rotate(165deg)",
    sunset: "contrast(1.08) saturate(1.5) sepia(.2)",
    midnight: "brightness(.75) contrast(1.3) saturate(1.15)",
    noir: "grayscale(1) contrast(1.3)",
    dream: "brightness(1.08) saturate(1.2) blur(.2px)",
    warm: "sepia(.25) saturate(1.35) contrast(1.05)",
    cool: "hue-rotate(175deg) saturate(1.2)",
    vivid: "saturate(1.8) contrast(1.15)"
  },

  /* =======================================================
     INIT
     ======================================================= */

  async init() {

    if (this.state.initialized) {
      return this;
    }

    this.state.initialized = true;

    this.emit("ready", {
      supported: this.isSupported()
    });

    return this;
  },

  /* =======================================================
     SUPPORT
     ======================================================= */

  isSupported() {

    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  },

  isRecordingSupported() {

    return !!(
      window.MediaRecorder &&
      this.isSupported()
    );
  },

  /* =======================================================
     PERMISSIONS
     ======================================================= */

  async getPermissionState() {

    if (!navigator.permissions) {
      return "unknown";
    }

    try {

      const result =
        await navigator.permissions.query({
          name: "camera"
        });

      return result.state;

    } catch {

      return "unknown";
    }
  },

  async requestPermission() {

    if (!this.isSupported()) {
      throw new Error(
        "Camera is not supported on this device."
      );
    }

    let stream = null;

    try {

      stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

      return true;

    } catch (error) {

      this.emit(
        "permissionDenied",
        error
      );

      throw error;

    } finally {

      if (stream) {
        stream.getTracks().forEach(
          track => track.stop()
        );
      }
    }
  },

  /* =======================================================
     START CAMERA
     ======================================================= */

  async start(options = {}) {

    if (!this.isSupported()) {
      throw new Error(
        "Camera is not supported."
      );
    }

    await this.stop();

    const constraints =
      this.buildConstraints(
        options
      );

    try {

      const stream =
        await navigator.mediaDevices
          .getUserMedia(
            constraints
          );

      this.state.stream =
        stream;

      this.state.active =
        true;

      if (
        options.video ||
        options.element
      ) {

        this.attachVideo(
          options.video ||
          options.element
        );
      }

      this.emit(
        "started",
        {
          stream,
          facingMode:
            this.state.facingMode
        }
      );

      return stream;

    } catch (error) {

      this.state.active =
        false;

      this.emit(
        "error",
        error
      );

      throw error;
    }
  },

  /* =======================================================
     CONSTRAINTS
     ======================================================= */

  buildConstraints(options = {}) {

    const facingMode =
      options.facingMode ||
      this.state.facingMode;

    if (options.facingMode) {
      this.state.facingMode =
        options.facingMode;
    }

    let width = 1280;
    let height = 720;

    if (
      this.state.resolution ===
      "ultra"
    ) {
      width = 3840;
      height = 2160;
    }

    if (
      this.state.resolution ===
      "high"
    ) {
      width = 1920;
      height = 1080;
    }

    if (
      this.state.resolution ===
      "medium"
    ) {
      width = 1280;
      height = 720;
    }

    if (
      this.state.resolution ===
      "low"
    ) {
      width = 640;
      height = 480;
    }

    return {

      video: {
        facingMode: {
          ideal: facingMode
        },

        width: {
          ideal: width
        },

        height: {
          ideal: height
        },

        frameRate: {
          ideal: 30,
          max: 60
        }
      },

      audio:
        options.audio !== undefined
          ? Boolean(options.audio)
          : this.state.audio
    };
  },

  /* =======================================================
     ATTACH VIDEO
     ======================================================= */

  attachVideo(element) {

    if (!element) {
      return;
    }

    if (
      typeof element ===
      "string"
    ) {
      element =
        document.querySelector(
          element
        );
    }

    if (!element) {
      return;
    }

    this.state.video =
      element;

    element.srcObject =
      this.state.stream;

    element.autoplay =
      true;

    element.playsInline =
      true;

    element.muted =
      true;

    element.style.filter =
      this.filters[
        this.state.filter
      ] || "none";

    if (
      this.state.facingMode ===
      "user" &&
      this.state.mirror
    ) {

      element.style.transform =
        "scaleX(-1)";

    } else {

      element.style.transform =
        "none";
    }

    element.play?.().catch(
      () => {}
    );

    this.emit(
      "videoAttached",
      element
    );
  },

  /* =======================================================
     STOP CAMERA
     ======================================================= */

  async stop() {

    this.stopRecording();

    if (this.state.stream) {

      this.state.stream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );
    }

    if (this.state.video) {

      try {
        this.state.video.pause();
      } catch {}

      this.state.video.srcObject =
        null;
    }

    this.state.stream =
      null;

    this.state.video =
      null;

    this.state.active =
      false;

    this.state.torch =
      false;

    this.emit("stopped");

    return true;
  },

  /* =======================================================
     SWITCH CAMERA
     ======================================================= */

  async switchCamera() {

    this.state.facingMode =
      this.state.facingMode ===
      "user"
        ? "environment"
        : "user";

    const oldVideo =
      this.state.video;

    try {

      await this.start({
        facingMode:
          this.state.facingMode,
        audio:
          this.state.audio,
        video:
          oldVideo
      });

      this.emit(
        "cameraSwitched",
        this.state.facingMode
      );

      return this.state.stream;

    } catch (error) {

      this.state.facingMode =
        this.state.facingMode ===
        "user"
          ? "environment"
          : "user";

      throw error;
    }
  },

  /* =======================================================
     PHOTO
     ======================================================= */

  async takePhoto(options = {}) {

    if (
      !this.state.stream ||
      !this.state.video
    ) {

      throw new Error(
        "Camera is not active."
      );
    }

    if (
      this.state.timer > 0 &&
      !options.skipTimer
    ) {

      await this.countdownTimer(
        this.state.timer
      );
    }

    const video =
      this.state.video;

    const canvas =
      this.state.canvas ||
      document.createElement(
        "canvas"
      );

    const context =
      canvas.getContext(
        "2d",
        {
          alpha: false
        }
      );

    this.state.canvas =
      canvas;

    this.state.context =
      context;

    const width =
      video.videoWidth ||
      1280;

    const height =
      video.videoHeight ||
      720;

    canvas.width =
      options.width ||
      width;

    canvas.height =
      options.height ||
      height;

    context.save();

    if (
      this.state.facingMode ===
      "user" &&
      this.state.mirror &&
      !options.noMirror
    ) {

      context.translate(
        canvas.width,
        0
      );

      context.scale(
        -1,
        1
      );
    }

    context.filter =
      this.filters[
        this.state.filter
      ] || "none";

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.restore();

    const mime =
      options.mimeType ||
      "image/jpeg";

    const quality =
      options.quality ??
      0.92;

    const blob =
      await new Promise(
        resolve =>
          canvas.toBlob(
            resolve,
            mime,
            quality
          )
      );

    if (!blob) {
      throw new Error(
        "Could not create photo."
      );
    }

    const url =
      URL.createObjectURL(
        blob
      );

    const photo = {

      id:
        this.createId(
          "photo"
        ),

      blob,

      url,

      width:
        canvas.width,

      height:
        canvas.height,

      mimeType:
        mime,

      size:
        blob.size,

      createdAt:
        Date.now()
    };

    this.state.lastPhoto =
      photo;

    this.emit(
      "photo",
      photo
    );

    return photo;
  },

  /* =======================================================
     SAVE PHOTO
     ======================================================= */

  async savePhoto(
    photo = this.state.lastPhoto
  ) {

    if (!photo) {
      return false;
    }

    try {

      if (
        window.VortexMedia?.register
      ) {

        await window.VortexMedia.register(
          {
            id: photo.id,
            type: "image",
            url: photo.url,
            blob: photo.blob,
            size: photo.size,
            width: photo.width,
            height: photo.height,
            mimeType:
              photo.mimeType
          }
        );
      }

      if (
        window.VortexStorage?.saveMedia
      ) {

        await window.VortexStorage
          .saveMedia(
            photo.id,
            {
              type: "image",
              blob: photo.blob,
              url: photo.url,
              width: photo.width,
              height: photo.height,
              mimeType:
                photo.mimeType,
              createdAt:
                photo.createdAt
            }
          );
      }

      this.emit(
        "photoSaved",
        photo
      );

      return true;

    } catch (error) {

      this.emit(
        "error",
        error
      );

      return false;
    }
  },

  /* =======================================================
     RECORD VIDEO
     ======================================================= */

  async startRecording(
    options = {}
  ) {

    if (
      !this.state.stream
    ) {

      throw new Error(
        "Camera is not active."
      );
    }

    if (
      !this.isRecordingSupported()
    ) {

      throw new Error(
        "Video recording is not supported."
      );
    }

    if (
      this.state.recording
    ) {
      return false;
    }

    this.state.recordedChunks =
      [];

    let mimeType =
      options.mimeType ||
      this.getSupportedMimeType();

    const recorderOptions = {};

    if (mimeType) {
      recorderOptions.mimeType =
        mimeType;
    }

    if (
      options.videoBitsPerSecond
    ) {

      recorderOptions.videoBitsPerSecond =
        options.videoBitsPerSecond;
    }

    if (
      options.audioBitsPerSecond
    ) {

      recorderOptions.audioBitsPerSecond =
        options.audioBitsPerSecond;
    }

    const recorder =
      new MediaRecorder(
        this.state.stream,
        recorderOptions
      );

    this.state.recorder =
      recorder;

    recorder.ondataavailable =
      event => {

        if (
          event.data &&
          event.data.size > 0
        ) {

          this.state.recordedChunks
            .push(
              event.data
            );
        }
      };

    recorder.onerror =
      event => {

        this.emit(
          "recordingError",
          event.error
        );
      };

    recorder.onstop =
      () => {

        this.finishRecording(
          mimeType
        );
      };

    recorder.start(
      options.timeslice ||
      1000
    );

    this.state.recording =
      true;

    this.state.recordingStartedAt =
      Date.now();

    this.startRecordingTimer();

    this.emit(
      "recordingStarted",
      {
        startedAt:
          this.state.recordingStartedAt
      }
    );

    return true;
  },

  /* =======================================================
     STOP RECORDING
     ======================================================= */

  stopRecording() {

    if (
      !this.state.recorder
    ) {
      this.state.recording =
        false;

      return null;
    }

    if (
      this.state.recorder.state !==
      "inactive"
    ) {

      try {
        this.state.recorder.stop();
      } catch {}
    }

    this.stopRecordingTimer();

    return true;
  },

  /* =======================================================
     FINISH RECORDING
     ======================================================= */

  async finishRecording(
    mimeType
  ) {

    const blob =
      new Blob(
        this.state.recordedChunks,
        {
          type:
            mimeType ||
            "video/webm"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const video = {

      id:
        this.createId(
          "video"
        ),

      blob,

      url,

      size:
        blob.size,

      mimeType:
        blob.type,

      duration:
        Math.max(
          0,
          Date.now() -
          this.state.recordingStartedAt
        ),

      createdAt:
        Date.now()
    };

    this.state.lastVideo =
      video;

    this.state.recording =
      false;

    this.state.recorder =
      null;

    this.state.recordedChunks =
      [];

    this.stopRecordingTimer();

    this.emit(
      "recordingStopped",
      video
    );

    return video;
  },

  /* =======================================================
     RECORDING TIMER
     ======================================================= */

  startRecordingTimer() {

    this.stopRecordingTimer();

    this.state.recordingTimer =
      setInterval(
        () => {

          if (
            !this.state.recording
          ) {
            return;
          }

          this.emit(
            "recordingTime",
            {
              milliseconds:
                Date.now() -
                this.state.recordingStartedAt
            }
          );

        },
        250
      );
  },

  stopRecordingTimer() {

    if (
      this.state.recordingTimer
    ) {

      clearInterval(
        this.state.recordingTimer
      );

      this.state.recordingTimer =
        null;
    }
  },

  /* =======================================================
     MIME TYPE
     ======================================================= */

  getSupportedMimeType() {

    if (
      !window.MediaRecorder
    ) {
      return "";
    }

    const types = [

      "video/mp4;codecs=h264,aac",

      "video/mp4",

      "video/webm;codecs=vp9,opus",

      "video/webm;codecs=vp8,opus",

      "video/webm"
    ];

    return (
      types.find(
        type =>
          MediaRecorder.isTypeSupported(
            type
          )
      ) || ""
    );
  },

  /* =======================================================
     TIMER PHOTO
     ======================================================= */

  async countdownTimer(
    seconds
  ) {

    seconds =
      Math.max(
        1,
        Number(seconds) || 1
      );

    this.state.countdown =
      true;

    for (
      let i = seconds;
      i > 0;
      i--
    ) {

      this.emit(
        "countdown",
        i
      );

      await this.sleep(
        1000
      );
    }

    this.state.countdown =
      false;

    this.emit(
      "countdown",
      0
    );
  },

  /* =======================================================
     TORCH / FLASH
     ======================================================= */

  async setTorch(
    enabled
  ) {

    const track =
      this.getVideoTrack();

    if (!track) {
      return false;
    }

    const capabilities =
      track.getCapabilities?.();

    if (
      !capabilities?.torch
    ) {
      return false;
    }

    try {

      await track.applyConstraints({
        advanced: [
          {
            torch:
              Boolean(enabled)
          }
        ]
      });

      this.state.torch =
        Boolean(enabled);

      this.emit(
        "torch",
        this.state.torch
      );

      return true;

    } catch (error) {

      this.emit(
        "error",
        error
      );

      return false;
    }
  },

  async toggleTorch() {

    return this.setTorch(
      !this.state.torch
    );
  },

  /* =======================================================
     ZOOM
     ======================================================= */

  async setZoom(
    zoom
  ) {

    const track =
      this.getVideoTrack();

    if (!track) {
      return false;
    }

    const capabilities =
      track.getCapabilities?.();

    if (
      !capabilities?.zoom
    ) {
      return false;
    }

    const min =
      capabilities.zoom.min ??
      1;

    const max =
      capabilities.zoom.max ??
      5;

    const value =
      Math.min(
        max,
        Math.max(
          min,
          Number(zoom)
        )
      );

    try {

      await track.applyConstraints({
        advanced: [
          {
            zoom: value
          }
        ]
      });

      this.state.zoom =
        value;

      this.emit(
        "zoom",
        value
      );

      return true;

    } catch (error) {

      this.emit(
        "error",
        error
      );

      return false;
    }
  },

  async zoomIn(step = 0.25) {

    return this.setZoom(
      this.state.zoom +
      step
    );
  },

  async zoomOut(step = 0.25) {

    return this.setZoom(
      this.state.zoom -
      step
    );
  },

  /* =======================================================
     FOCUS
     ======================================================= */

  async focus(x, y) {

    const track =
      this.getVideoTrack();

    if (!track) {
      return false;
    }

    const capabilities =
      track.getCapabilities?.();

    if (
      !capabilities?.focusMode
    ) {
      return false;
    }

    try {

      await track.applyConstraints({
        advanced: [
          {
            focusMode:
              "single-shot"
          }
        ]
      });

      this.emit(
        "focus",
        {
          x,
          y
        }
      );

      return true;

    } catch {

      return false;
    }
  },

  /* =======================================================
     VIDEO TRACK
     ======================================================= */

  getVideoTrack() {

    return (
      this.state.stream
        ?.getVideoTracks?.()[0] ||
      null
    );
  },

  getAudioTrack() {

    return (
      this.state.stream
        ?.getAudioTracks?.()[0] ||
      null
    );
  },

  /* =======================================================
     FILTERS
     ======================================================= */

  setFilter(filter) {

    if (
      !this.filters[
        filter
      ]
    ) {

      filter =
        "none";
    }

    this.state.filter =
      filter;

    if (this.state.video) {

      this.state.video.style.filter =
        this.filters[
          filter
        ];
    }

    this.emit(
      "filter",
      filter
    );

    return filter;
  },

  getFilters() {

    return Object.keys(
      this.filters
    );
  },

  applyFilterToImage(
    canvas
  ) {

    if (!canvas) {
      return canvas;
    }

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      return canvas;
    }

    const imageData =
      context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    return imageData;
  },

  /* =======================================================
     FLASH MODE
     ======================================================= */

  setFlash(mode) {

    const valid = [
      "auto",
      "on",
      "off"
    ];

    if (
      !valid.includes(
        mode
      )
    ) {
      mode = "auto";
    }

    this.state.flash =
      mode;

    this.emit(
      "flash",
      mode
    );

    return mode;
  },

  /* =======================================================
     RESOLUTION
     ======================================================= */

  setResolution(
    resolution
  ) {

    const valid = [
      "low",
      "medium",
      "high",
      "ultra"
    ];

    if (
      !valid.includes(
        resolution
      )
    ) {

      resolution =
        "high";
    }

    this.state.resolution =
      resolution;

    this.emit(
      "resolution",
      resolution
    );

    return resolution;
  },

  /* =======================================================
     MIRROR
     ======================================================= */

  setMirror(enabled) {

    this.state.mirror =
      Boolean(enabled);

    if (this.state.video) {

      if (
        this.state.facingMode ===
        "user" &&
        this.state.mirror
      ) {

        this.state.video.style
          .transform =
          "scaleX(-1)";

      } else {

        this.state.video.style
          .transform =
          "none";
      }
    }

    this.emit(
      "mirror",
      this.state.mirror
    );
  },

  /* =======================================================
     TIMER SETTING
     ======================================================= */

  setTimer(seconds) {

    seconds =
      Number(seconds) || 0;

    if (
      ![0, 3, 5, 10].includes(
        seconds
      )
    ) {
      seconds = 0;
    }

    this.state.timer =
      seconds;

    this.emit(
      "timer",
      seconds
    );

    return seconds;
  },

  /* =======================================================
     CAPTURE FILE
     ======================================================= */

  async capturePhotoFile(
    options = {}
  ) {

    const input =
      document.createElement(
        "input"
      );

    input.type =
      "file";

    input.accept =
      "image/*";

    input.capture =
      "environment";

    return new Promise(
      resolve => {

        input.onchange =
          async () => {

            const file =
              input.files?.[0];

            if (!
