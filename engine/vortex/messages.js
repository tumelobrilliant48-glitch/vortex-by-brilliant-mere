/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / MESSAGES.JS
========================================================= */

"use strict";

const VortexMessages = {

  state: {
    conversations: [],
    groups: [],
    communities: [],
    scheduled: [],
    activeConversation: null
  },

  settings: {
    messageLock: false,
    disappearingMessages: false,
    readReceipts: true,
    typingIndicators: true,
    mediaAutoDownload: false
  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    this.load();

    this.emit("ready");

  },


  /* =======================================================
     CONVERSATIONS
  ======================================================= */

  createConversation(user) {

    if (!user) {
      throw new Error("User is required.");
    }

    const conversation = {

      id:
        `chat_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type: "direct",

      participants: [
        user
      ],

      messages: [],

      locked: false,

      createdAt:
        new Date().toISOString()

    };

    this.state.conversations.push(
      conversation
    );

    this.save();

    this.emit(
      "conversationCreated",
      conversation
    );

    return conversation;

  },


  getConversation(id) {

    return this.state.conversations
      .find(chat =>
        chat.id === id
      );

  },


  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  sendMessage(
    conversationId,
    content,
    options = {}
  ) {

    const conversation =
      this.getConversation(
        conversationId
      );

    if (!conversation) {
      throw new Error(
        "Conversation not found."
      );
    }


    const message = {

      id:
        `msg_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        options.type || "text",

      content:
        String(content || ""),

      sender:
        options.sender || "me",

      media:
        options.media || [],

      voice:
        options.voice || null,

      replyTo:
        options.replyTo || null,

      delivered: false,

      read: false,

      createdAt:
        new Date().toISOString(),

      expiresAt:
        options.expiresAt || null

    };


    conversation.messages.push(
      message
    );

    this.save();

    this.emit(
      "messageSent",
      {
        conversation,
        message
      }
    );

    return message;

  },


  /* =======================================================
     MEDIA
  ======================================================= */

  sendPhoto(
    conversationId,
    file
  ) {

    return this.sendMessage(
      conversationId,
      file?.name || "Photo",
      {
        type: "photo",
        media: [file]
      }
    );

  },


  sendVideo(
    conversationId,
    file
  ) {

    return this.sendMessage(
      conversationId,
      file?.name || "Video",
      {
        type: "video",
        media: [file]
      }
    );

  },


  sendVoice(
    conversationId,
    audio
  ) {

    return this.sendMessage(
      conversationId,
      "Voice message",
      {
        type: "voice",
        voice: audio
      }
    );

  },


  /* =======================================================
     SCHEDULED MESSAGES
  ======================================================= */

  scheduleMessage(
    conversationId,
    content,
    deliveryTime,
    options = {}
  ) {

    const timestamp =
      new Date(
        deliveryTime
      ).getTime();


    if (
      Number.isNaN(timestamp) ||
      timestamp <= Date.now()
    ) {

      throw new Error(
        "Delivery time must be in the future."
      );

    }


    const scheduled = {

      id:
        `scheduled_${Date.now()}`,

      conversationId,

      content,

      type:
        options.type || "text",

      deliveryTime:
        new Date(timestamp).toISOString(),

      status: "scheduled",

      createdAt:
        new Date().toISOString()

    };


    this.state.scheduled.push(
      scheduled
    );

    this.save();

    this.emit(
      "messageScheduled",
      scheduled
    );

    return scheduled;

  },


  processScheduledMessages() {

    const now = Date.now();

    this.state.scheduled
      .filter(item =>
        item.status === "scheduled"
      )
      .forEach(item => {

        const delivery =
          new Date(
            item.deliveryTime
          ).getTime();


        if (delivery <= now) {

          this.sendMessage(
            item.conversationId,
            item.content,
            {
              type: item.type
            }
          );

          item.status = "sent";

        }

      });


    this.save();

  },


  /* =======================================================
     GROUPS
  ======================================================= */

  createGroup(
    name,
    members = []
  ) {

    if (!name) {
      throw new Error(
        "Group name is required."
      );
    }


    const group = {

      id:
        `group_${Date.now()}`,

      name,

      members,

      admins: [],

      messages: [],

      createdAt:
        new Date().toISOString()

    };


    this.state.groups.push(
      group
    );

    this.save();

    this.emit(
      "groupCreated",
      group
    );

    return group;

  },


  addGroupMember(
    groupId,
    user
  ) {

    const group =
      this.state.groups
        .find(item =>
          item.id === groupId
        );

    if (!group) {
      return false;
    }


    if (
      !group.members.includes(user)
    ) {

      group.members.push(user);

    }


    this.save();

    return true;

  },


  /* =======================================================
     COMMUNITIES
  ======================================================= */

  createCommunity(
    name,
    description = ""
  ) {

    const community = {

      id:
        `community_${Date.now()}`,

      name,

      description,

      members: [],

      moderators: [],

      channels: [],

      createdAt:
        new Date().toISOString()

    };


    this.state.communities.push(
      community
    );

    this.save();

    this.emit(
      "communityCreated",
      community
    );

    return community;

  },


  /* =======================================================
     MESSAGE LOCK
  ======================================================= */

  lockMessages() {

    this.settings.messageLock =
      true;

    this.save();

    if (
      typeof VortexSecurity !==
      "undefined"
    ) {

      VortexSecurity.lockMessages();

    }

    this.emit("messagesLocked");

  },


  unlockMessages() {

    if (
      typeof VortexSecurity !==
      "undefined"
    ) {

      VortexSecurity.authenticate(
        "auto"
      )
      .then(success => {

        if (!success) {
          return;
        }

        this.settings.messageLock =
          false;

        this.save();

        this.emit(
          "messagesUnlocked"
        );

      });

      return;

    }

    this.settings.messageLock =
      false;

    this.save();

  },


  /* =======================================================
     DISAPPEARING MESSAGES
  ======================================================= */

  enableDisappearing() {

    this.settings.disappearingMessages =
      true;

    this.save();

  },


  disableDisappearing() {

    this.settings.disappearingMessages =
      false;

    this.save();

  },


  /* =======================================================
     SEARCH
  ======================================================= */

  searchMessages(query) {

    const text =
      String(query || "")
        .toLowerCase();

    if (!text) {
      return [];
    }


    const results = [];


    this.state.conversations
      .forEach(conversation => {

        conversation.messages
          .forEach(message => {

            if (
              String(
                message.content
              )
                .toLowerCase()
                .includes(text)
            ) {

              results.push({
                conversationId:
                  conversation.id,

                message

              });

            }

          });

      });


    return results;

  },


  /* =======================================================
     PERSISTENCE
  ======================================================= */

  save() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {
      return;
    }


    VortexStorage.save(
      "messages",
      this.state
    );


    VortexStorage.save(
      "message_settings",
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


    const state =
      VortexStorage.load(
        "messages",
        null
      );


    if (state) {

      this.state = {
        ...this.state,
        ...state
      };

    }


    const settings =
      VortexStorage.load(
        "message_settings",
        null
      );


    if (settings) {

      this.settings = {
        ...this.settings,
        ...settings
      };

    }

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:messages:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexMessages =
  VortexMessages;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexMessages.initialize();

    setInterval(
      () =>
        VortexMessages
          .processScheduledMessages(),
      5000
    );

  }
);
