/* =========================================================
   VORTEX MEDIA SYSTEM
   FILE 8 — media.js
   ========================================================= */

"use strict";


const VortexMedia = {

  /* =======================================================
     CONFIG
     ======================================================= */

  maxImageSize:
    15 * 1024 * 1024,

  maxVideoSize:
    250 * 1024 * 1024,

  maxAudioSize:
    50 * 1024 * 1024,


  allowedImages: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ],

  allowedVideos: [
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ],

  allowedAudio: [
    "audio/mpeg",
    "audio/mp4",
    "audio/webm",
    "audio/ogg",
    "audio/wav"
  ],


  /* =======================================================
     IDENTIFY MEDIA
     ======================================================= */

  getType(file) {

    if (!file) {
      return "unknown";
    }

    if (
      this.allowedImages.includes(
        file.type
      )
    ) {
      return "image";
    }

    if (
      this.allowedVideos.includes(
        file.type
      )
    ) {
      return "video";
    }

    if (
      this.allowedAudio.includes(
        file.type
      )
    ) {
      return "audio";
    }

    return "unknown";
  },


  /* =======================================================
     VALIDATE FILE
     ======================================================= */

  validate(file) {

    if (!file) {

      return {
        valid: false,
        error: "No file selected."
      };

    }


    const type =
      this.getType(file);


    if (type === "unknown") {

      return {
        valid: false,
        error:
          "This file type is not supported by VORTEX."
      };

    }


    if (
      type === "image" &&
      file.size > this.maxImageSize
    ) {

      return {
        valid: false,
        error:
          "Images must be smaller than 15 MB."
      };

    }


    if (
      type === "video" &&
      file.size > this.maxVideoSize
    ) {

      return {
        valid: false,
        error:
          "Videos must be smaller than 250 MB."
      };

    }


    if (
      type === "audio" &&
      file.size > this.maxAudioSize
    ) {

      return {
        valid: false,
        error:
          "Audio files must be smaller than 50 MB."
      };

    }


    return {
      valid: true,
      type
    };

  },


  /* =======================================================
     CREATE LOCAL PREVIEW
     ======================================================= */

  createPreview(file) {

    const check =
      this.validate(file);


    if (!check.valid) {

      return {
        success: false,
        error: check.error
      };

    }


    const url =
      URL.createObjectURL(file);


    return {

      success: true,

      url,

      type:
        check.type,

      name:
        file.name,

      size:
        file.size,

      mime:
        file.type

    };

  },


  /* =======================================================
     RELEASE PREVIEW
     ======================================================= */

  releasePreview(url) {

    if (
      url &&
      url.startsWith("blob:")
    ) {

      URL.revokeObjectURL(url);

    }

  },


  /* =======================================================
     UPLOAD
     ======================================================= */

  async upload(
    file,
    type = "media"
  ) {

    const check =
      this.validate(file);


    if (!check.valid) {

      return {
        success: false,
        error: check.error
      };

    }


    /*
      Real backend upload.
    */

    if (
      window.VORTEX_API?.BASE_URL &&
      window.vortexUploadFile
    ) {

      return vortexUploadFile(
        file,
        type
      );

    }


    /*
      Local development mode.

      Blob URLs are useful for testing the UI,
      but they are NOT permanent cloud storage.
    */

    const preview =
      this.createPreview(file);


    if (!preview.success) {

      return preview;

    }


    const media = {

      id:
        VortexDB.id("media"),

      name:
        file.name,

      type:
        check.type,

      mime:
        file.type,

      size:
        file.size,

      url:
        preview.url,

      localOnly:
        true,

      createdAt:
        new Date().toISOString()

    };


    VortexDB.localInsert(
      "media",
      media
    );


    return {

      success: true,

      data:
        media

    };

  },


  /* =======================================================
     IMAGE UPLOAD
     ======================================================= */

  async uploadImage(
    file,
    purpose = "post"
  ) {

    if (
      this.getType(file) !==
      "image"
    ) {

      return {
        success: false,
        error:
          "Please select an image."
      };

    }


    return this.upload(
      file,
      purpose
    );

  },


  /* =======================================================
     VIDEO UPLOAD
     ======================================================= */

  async uploadVideo(
    file,
    purpose = "video"
  ) {

    if (
      this.getType(file) !==
      "video"
    ) {

      return {
        success: false,
        error:
          "Please select a video."
      };

    }


    return this.upload(
      file,
      purpose
    );

  },


  /* =======================================================
     AUDIO / VOICE NOTE
     ======================================================= */

  async uploadAudio(
    file,
    purpose = "voice"
  ) {

    if (
      this.getType(file) !==
      "audio"
    ) {

      return {
        success: false,
        error:
          "Please select an audio file."
      };

    }


    return this.upload(
      file,
      purpose
    );

  },


  /* =======================================================
     PROFILE PHOTO
     ======================================================= */

  async setProfilePhoto(
    file
  ) {

    const result =
      await this.uploadImage(
        file,
        "avatar"
      );


    if (
      !result.success
    ) {

      return result;

    }


    if (
      window.VortexAuth
    ) {

      await VortexAuth.setAvatar(
        result.data.url
      );

    }


    return result;

  },


  /* =======================================================
     COVER PHOTO
     ======================================================= */

  async setCoverPhoto(
    file
  ) {

    const result =
      await this.uploadImage(
        file,
        "cover"
      );


    if (
      !result.success
    ) {

      return result;

    }


    if (
      window.VortexAuth
    ) {

      await VortexAuth.setCover(
        result.data.url
      );

    }


    return result;

  },


  /* =======================================================
     POST MEDIA
     ======================================================= */

  async preparePostMedia(
    files
  ) {

    if (!files) {

      return {
        success: true,
        media: []
      };

    }


    const list =
      Array.from(files);


    const results = [];


    for (
      const file of list
    ) {

      const result =
        await this.upload(
          file,
          "post"
        );


      if (
        result.success
      ) {

        results.push(
          result.data
        );

      }

    }


    return {

      success: true,

      media:
        results

    };

  },


  /* =======================================================
     STORY MEDIA
     ======================================================= */

  async prepareStoryMedia(
    file
  ) {

    return this.upload(
      file,
      "story"
    );

  },


  /* =======================================================
     REEL MEDIA
     ======================================================= */

  async prepareReel(
    file
  ) {

    return this.uploadVideo(
      file,
      "reel"
    );

  },


  /* =======================================================
     CHAT IMAGE
     ======================================================= */

  async prepareChatImage(
    file
  ) {

    return this.uploadImage(
      file,
      "chat-image"
    );

  },


  /* =======================================================
     CHAT VIDEO
     ======================================================= */

  async prepareChatVideo(
    file
  ) {

    return this.uploadVideo(
      file,
      "chat-video"
    );

  },


  /* =======================================================
     VOICE NOTE
     ======================================================= */

  async prepareVoiceNote(
    file
  ) {

    return this.uploadAudio(
      file,
      "voice-note"
    );

  },


  /* =======================================================
     DELETE MEDIA
     ======================================================= */

  async delete(
    mediaId
  ) {

    if (
      window.VortexAPI &&
      window.VORTEX_API?.BASE_URL
    ) {

      return VortexAPI.deleteMedia(
        mediaId
      );

    }


    VortexDB.localDelete(
      "media",
      mediaId
    );


    return {
      success: true
    };

  },


  /* =======================================================
     GET USER MEDIA
     ======================================================= */

  async getUserMedia(
    userId
  ) {

    const media =
      VortexDB.localFindMany(
        "media",
        item =>
          item.userId === userId
      );


    return {

      success: true,

      data:
        media

    };

  },


  /* =======================================================
     FORMAT FILE SIZE
     ======================================================= */

  formatSize(
    bytes
  ) {

    if (
      !bytes ||
      bytes <= 0
    ) {

      return "0 B";

    }


    const units = [
      "B",
      "KB",
      "MB",
      "GB"
    ];


    const index =
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      );


    return (
      (bytes /
        Math.pow(
          1024,
          index
        )
      ).toFixed(1) +
      " " +
      units[index]
    );

  },


  /* =======================================================
     IMAGE DIMENSIONS
     ======================================================= */

  getImageDimensions(
    file
  ) {

    return new Promise(
      resolve => {

        if (
          !file ||
          this.getType(file) !==
            "image"
        ) {

          resolve(null);

          return;

        }


        const image =
          new Image();


        const url =
          URL.createObjectURL(file);


        image.onload = () => {

          const result = {

            width:
              image.naturalWidth,

            height:
              image.naturalHeight,

            aspectRatio:
              image.naturalWidth /
              image.naturalHeight

          };


          URL.revokeObjectURL(
            url
          );


          resolve(result);

        };


        image.onerror = () => {

          URL.revokeObjectURL(
            url
          );


          resolve(null);

        };


        image.src =
          url;

      }
    );

  },


  /* =======================================================
     VIDEO INFORMATION
     ======================================================= */

  getVideoInformation(
    file
  ) {

    return new Promise(
      resolve => {

        if (
          !file ||
          this.getType(file) !==
            "video"
        ) {

          resolve(null);

          return;

        }


        const video =
          document.createElement(
            "video"
          );


        const url =
          URL.createObjectURL(file);


        video.preload =
          "metadata";


        video.onloadedmetadata =
          () => {

            const result = {

              width:
                video.videoWidth,

              height:
                video.videoHeight,

              duration:
                video.duration

            };


            URL.revokeObjectURL(
              url
            );


            resolve(result);

          };


        video.onerror =
          () => {

            URL.revokeObjectURL(
              url
            );


            resolve(null);

          };


        video.src =
          url;

      }
    );

  },


  /* =======================================================
     MEDIA PICKER
     ======================================================= */

  openPicker(
    options = {}
  ) {

    const input =
      document.createElement(
        "input"
      );


    input.type =
      "file";


    input.multiple =
      !!options.multiple;


    if (
      options.accept
    ) {

      input.accept =
        options.accept;

    } else {

      input.accept =
        "image/*,video/*";

    }


    return new Promise(
      resolve => {

        input.onchange =
          () => {

            resolve(
              Array.from(
                input.files || []
              )
            );

          };


        input.click();

      }
    );

  },


  /* =======================================================
     CAMERA
     ======================================================= */

  async openCamera(
    mode = "photo"
  ) {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      return {

        success: false,

        error:
          "Camera access is not supported on this device."

      };

    }


    try {

      const stream =
        await navigator.mediaDevices
          .getUserMedia({

            video: true,

            audio:
              mode === "video"

          });


      return {

        success: true,

        stream

      };

    } catch (error) {

      return {

        success: false,

        error:
          "Camera permission was denied or unavailable."

      };

    }

  },


  /* =======================================================
     MICROPHONE
     ======================================================= */

  async requestMicrophone() {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      return {

        success: false,

        error:
          "Microphone is not supported."

      };

    }


    try {

      const stream =
        await navigator.mediaDevices
          .getUserMedia({

            audio: true

          });


      return {

        success: true,

        stream

      };

    } catch {

      return {

        success: false,

        error:
          "Microphone permission was denied."

      };

    }

  }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexMedia =
  VortexMedia;


/* =========================================================
   MEDIA READY EVENT
   ========================================================= */

window.dispatchEvent(
  new CustomEvent(
    "vortex:media-ready"
  )
);


/* =========================================================
   END OF MEDIA MODULE
   ========================================================= */
