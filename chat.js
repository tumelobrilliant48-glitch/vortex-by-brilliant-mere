/* =========================================================
   VORTEX CHAT SYSTEM
   FILE 9 — chat.js
   ========================================================= */

"use strict";

const VortexChat = {

  currentConversation: null,

  messages: [],

  typingTimer: null,

  /* =======================================================
     INITIALIZE
     ======================================================= */

  init() {

    window.addEventListener(
      "vortex:user-changed",
      () => {
        this.loadConversations();
      }
    );

    console.log("💬 VORTEX Chat ready.");

  },


  /* =======================================================
     CREATE CONVERSATION
     ======================================================= */

  async createConversation(
    participantIds = [],
    type = "private",
    name = ""
  ) {

    const currentUser =
      window.VortexAuth?.getUser();

    if (!currentUser) {

      return {
        success: false,
        error: "Login required."
      };

    }


    const participants =
      [...new Set([
        currentUser.id,
        ...participantIds
      ])];


    const conversation = {

      id:
        VortexDB.id("conversation"),

      type,

      name,

      participants,

      createdAt:
        new Date().toISOString(),

      lastMessage:
        null,

      unread:
        0

    };


    VortexDB.localInsert(
      "conversations",
      conversation
    );


    return {

      success: true,

      data: conversation

    };

  },


  /* =======================================================
     LOAD CONVERSATIONS
     ======================================================= */

  async loadConversations() {

    const result =
      await VortexDB.getConversations();


    if (!result.success) {

      return result;

    }


    window.dispatchEvent(
      new CustomEvent(
        "vortex:conversations",
        {
          detail: result.data
        }
      )
    );


    return result;

  },


  /* =======================================================
     OPEN CHAT
     ======================================================= */

  async openConversation(
    conversationId
  ) {

    this.currentConversation =
      conversationId;


    const result =
      await VortexDB.getMessages(
        conversationId
      );


    if (result.success) {

      this.messages =
        result.data || [];

      this.markConversationRead(
        conversationId
      );

    }


    window.dispatchEvent(
      new CustomEvent(
        "vortex:chat-open",
        {
          detail: {

            conversationId,

            messages:
              this.messages

          }
        }
      )
    );


    return result;

  },


  /* =======================================================
     SEND TEXT
     ======================================================= */

  async sendText(
    text
  ) {

    text =
      String(text || "").trim();


    if (!text) {

      return {
        success: false,
        error: "Message is empty."
      };

    }


    if (!this.currentConversation) {

      return {
        success: false,
        error:
          "Open a conversation first."
      };

    }


    const user =
      window.VortexAuth?.getUser();


    if (!user) {

      return {
        success: false,
        error: "Login required."
      };

    }


    return this.sendMessage({

      conversationId:
        this.currentConversation,

      senderId:
        user.id,

      type:
        "text",

      text

    });

  },


  /* =======================================================
     SEND MESSAGE
     ======================================================= */

  async sendMessage(
    data
  ) {

    if (
      !data ||
      !data.conversationId
    ) {

      return {
        success: false,
        error:
          "Conversation is required."
      };

    }


    const user =
      window.VortexAuth?.getUser();


    if (!user) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const message = {

      conversationId:
        data.conversationId,

      senderId:
        data.senderId || user.id,

      receiverId:
        data.receiverId || null,

      type:
        data.type || "text",

      text:
        data.text || "",

      media:
        data.media || null,

      replyTo:
        data.replyTo || null,

      createdAt:
        new Date().toISOString(),

      read:
        false

    };


    const result =
      await VortexDB.sendMessage(
        message
      );


    if (result.success) {

      this.messages.push(
        result.data
      );


      this.updateConversationPreview(
        result.data
      );


      window.dispatchEvent(
        new CustomEvent(
          "vortex:new-message",
          {
            detail:
              result.data
          }
        )
      );

    }


    return result;

  },


  /* =======================================================
     SEND IMAGE
     ======================================================= */

  async sendImage(
    file
  ) {

    if (!window.VortexMedia) {

      return {
        success: false,
        error:
          "Media system unavailable."
      };

    }


    const media =
      await VortexMedia.prepareChatImage(
        file
      );


    if (!media.success) {

      return media;

    }


    return this.sendMessage({

      conversationId:
        this.currentConversation,

      type:
        "image",

      media:
        media.data

    });

  },


  /* =======================================================
     SEND VIDEO
     ======================================================= */

  async sendVideo(
    file
  ) {

    if (!window.VortexMedia) {

      return {
        success: false,
        error:
          "Media system unavailable."
      };

    }


    const media =
      await VortexMedia.prepareChatVideo(
        file
      );


    if (!media.success) {

      return media;

    }


    return this.sendMessage({

      conversationId:
        this.currentConversation,

      type:
        "video",

      media:
        media.data

    });

  },


  /* =======================================================
     SEND VOICE NOTE
     ======================================================= */

  async sendVoiceNote(
    file
  ) {

    if (!window.VortexMedia) {

      return {
        success: false,
        error:
          "Media system unavailable."
      };

    }


    const media =
      await VortexMedia.prepareVoiceNote(
        file
      );


    if (!media.success) {

      return media;

    }


    return this.sendMessage({

      conversationId:
        this.currentConversation,

      type:
        "voice",

      media:
        media.data

    });

  },


  /* =======================================================
     REPLY TO MESSAGE
     ======================================================= */

  async replyTo(
    messageId,
    text
  ) {

    if (!this.currentConversation) {

      return {
        success: false,
        error:
          "No conversation is open."
      };

    }


    const user =
      window.VortexAuth?.getUser();


    return this.sendMessage({

      conversationId:
        this.currentConversation,

      senderId:
        user?.id,

      type:
        "text",

      text,

      replyTo:
        messageId

    });

  },


  /* =======================================================
     DELETE MESSAGE
     ======================================================= */

  async deleteMessage(
    messageId
  ) {

    const message =
      VortexDB.localFind(
        "messages",
        messageId
      );


    if (!message) {

      return {
        success: false,
        error:
          "Message not found."
      };

    }


    const user =
      window.VortexAuth?.getUser();


    if (
      message.senderId !==
      user?.id
    ) {

      return {
        success: false,
        error:
          "You can only delete your own messages."
      };

    }


    VortexDB.localDelete(
      "messages",
      messageId
    );


    this.messages =
      this.messages.filter(
        item =>
          item.id !== messageId
      );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:message-deleted",
        {
          detail: messageId
        }
      )
    );


    return {
      success: true
    };

  },


  /* =======================================================
     EDIT MESSAGE
     ======================================================= */

  async editMessage(
    messageId,
    newText
  ) {

    const message =
      VortexDB.localFind(
        "messages",
        messageId
      );


    if (!message) {

      return {
        success: false,
        error:
          "Message not found."
      };

    }


    const user =
      window.VortexAuth?.getUser();


    if (
      message.senderId !==
      user?.id
    ) {

      return {
        success: false,
        error:
          "You can only edit your own messages."
      };

    }


    const updated =
      VortexDB.localUpdate(

        "messages",

        messageId,

        {

          text:
            String(
              newText || ""
            ).trim(),

          edited:
            true

        }

      );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:message-edited",
        {
          detail:
            updated
        }
      )
    );


    return {

      success: true,

      data:
        updated

    };

  },


  /* =======================================================
     REACT TO MESSAGE
     ======================================================= */

  react(
    messageId,
    reaction
  ) {

    const message =
      VortexDB.localFind(
        "messages",
        messageId
      );


    if (!message) {

      return false;

    }


    const reactions =
      message.reactions || {};


    const userId =
      window.VortexAuth?.getUserId();


    if (!userId) {

      return false;

    }


    if (!reactions[reaction]) {

      reactions[reaction] = [];

    }


    if (
      reactions[reaction]
        .includes(userId)
    ) {

      reactions[reaction] =
        reactions[reaction]
          .filter(
            id =>
              id !== userId
          );

    } else {

      reactions[reaction].push(
        userId
      );

    }


    VortexDB.localUpdate(

      "messages",

      messageId,

      {
        reactions
      }

    );


    return true;

  },


  /* =======================================================
     TYPING
     ======================================================= */

  startTyping() {

    if (
      !this.currentConversation
    ) {

      return;

    }


    const userId =
      window.VortexAuth?.getUserId();


    window.dispatchEvent(
      new CustomEvent(
        "vortex:typing",
        {
          detail: {

            conversationId:
              this.currentConversation,

            userId,

            typing:
              true

          }
        }
      )
    );


    clearTimeout(
      this.typingTimer
    );


    this.typingTimer =
      setTimeout(
        () => {

          this.stopTyping();

        },
        2500
      );

  },


  stopTyping() {

    if (
      !this.currentConversation
    ) {

      return;

    }


    const userId =
      window.VortexAuth?.getUserId();


    window.dispatchEvent(
      new CustomEvent(
        "vortex:typing",
        {
          detail: {

            conversationId:
              this.currentConversation,

            userId,

            typing:
              false

          }
        }
      )
    );

  },


  /* =======================================================
     MARK READ
     ======================================================= */

  markConversationRead(
    conversationId
  ) {

    const messages =
      VortexDB.localFindMany(

        "messages",

        message =>
          message.conversationId ===
          conversationId

      );


    messages.forEach(
      message => {

        if (!message.read) {

          VortexDB.localUpdate(

            "messages",

            message.id,

            {
              read: true
            }

          );

        }

      }
    );


    const conversation =
      VortexDB.localFind(

        "conversations",

        conversationId

      );


    if (conversation) {

      VortexDB.localUpdate(

        "conversations",

        conversationId,

        {
          unread: 0
        }

      );

    }

  },


  /* =======================================================
     CONVERSATION PREVIEW
     ======================================================= */

  updateConversationPreview(
    message
  ) {

    const conversation =
      VortexDB.localFind(

        "conversations",

        message.conversationId

      );


    if (!conversation) {

      return;

    }


    let preview =
      message.text || "";


    if (
      message.type ===
      "image"
    ) {

      preview =
        "📷 Photo";

    }


    if (
      message.type ===
      "video"
    ) {

      preview =
        "🎬 Video";

    }


    if (
      message.type ===
      "voice"
    ) {

      preview =
        "🎤 Voice note";

    }


    VortexDB.localUpdate(

      "conversations",

      conversation.id,

      {

        lastMessage: {

          text:
            preview,

          type:
            message.type,

          senderId:
            message.senderId,

          createdAt:
            message.createdAt

        }

      }

    );

  },


  /* =======================================================
     SEARCH CHAT
     ======================================================= */

  searchMessages(
    query
  ) {

    const q =
      String(
        query || ""
      )
      .toLowerCase()
      .trim();


    if (!q) {

      return [];

    }


    return VortexDB.localFindMany(

      "messages",

      message =>
        String(
          message.text || ""
        )
        .toLowerCase()
        .includes(q)

    );

  },


  /* =======================================================
     CLEAR CHAT
     ======================================================= */

  clearConversation(
    conversationId
  ) {

    const messages =
      VortexDB.localFindMany(

        "messages",

        message =>
          message.conversationId ===
          conversationId

      );


    messages.forEach(
      message => {

        VortexDB.localDelete(
          "messages",
          message.id
        );

      }
    );


    return {
      success: true
    };

  },


  /* =======================================================
     FORMAT MESSAGE TIME
     ======================================================= */

  formatTime(
    date
  ) {

    const d =
      new Date(date);


    if (
      Number.isNaN(
        d.getTime()
      )
    ) {

      return "";

    }


    return d.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexChat =
  VortexChat;


/* =========================================================
   START CHAT SYSTEM
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexChat.init();

  }
);


/* =========================================================
   END OF CHAT MODULE
   ========================================================= */
