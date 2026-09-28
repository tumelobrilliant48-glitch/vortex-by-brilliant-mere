/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / CREATE.JS
========================================================= */

"use strict";

const VortexCreate = {

  state: {
    type: "post",
    text: "",
    files: [],
    generatedMedia: [],
    aiEnabled: true,
    visibility: "public",
    scheduledAt: null
  },


  /* -------------------------------------------------------
     CREATE TYPES
  ------------------------------------------------------- */

  types: [
    "post",
    "photo",
    "video",
    "reel",
    "story",
    "document",
    "community"
  ],


  setType(type) {

    if (!this.types.includes(type)) {
      return false;
    }

    this.state.type = type;

    this.emit("typeChanged", {
      type
    });

    return true;
  },


  /* -------------------------------------------------------
     TEXT
  ------------------------------------------------------- */

  setText(text) {

    this.state.text =
      String(text || "");

    return this.state.text;

  },


  /* -------------------------------------------------------
     FILES
  ------------------------------------------------------- */

  addFiles(fileList) {

    if (!fileList) {
      return [];
    }

    const files =
      Array.from(fileList);

    this.state.files.push(
      ...files
    );

    this.emit("filesAdded", {
      files
    });

    return files;

  },


  removeFile(index) {

    if (
      index < 0 ||
      index >= this.state.files.length
    ) {
      return false;
    }

    this.state.files.splice(
      index,
      1
    );

    return true;

  },


  clearFiles() {

    this.state.files = [];

  },


  /* -------------------------------------------------------
     AI CREATION
  ------------------------------------------------------- */

  async generateFromPrompt(prompt) {

    if (!this.state.aiEnabled) {
      throw new Error(
        "VORTEX AI creation is disabled."
      );
    }

    const cleanPrompt =
      String(prompt || "").trim();

    if (!cleanPrompt) {
      throw new Error(
        "Enter a creation prompt."
      );
    }


    /*
      This is intentionally an engine interface.

      The real AI provider will be connected
      through the secure backend.

      Do NOT place secret API keys inside
      this frontend file.
    */

    const
