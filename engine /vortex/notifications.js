/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / NOTIFICATIONS.JS
========================================================= */

"use strict";

const VortexNotifications = {

  state: {

    items: [],

    unread: 0,

    disappearing: false,

    initialized: false

  },


  settings: {

    enabled: true,

    disappearingNotifications: false,

    notificationPreview: true,

    sound: true,

    vibration: true,

    sensitiveProtection: true

  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.load();

    this.state.initialized = true;

    this.recalculateUnread();

    this.emit("ready");

  },


  /* =======================================================
     ADD NOTIFICATION
  ======================================================= */

  add(notification = {}) {

    if (!this.settings.enabled) {
      return null;
    }


    const item = {

      id:
        notification.id ||
        `notification_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        notification.type ||
        "system",

      title:
        notification.title ||
        "VORTEX",

      message:
        notification.message ||
        "",

      sender:
        notification.sender ||
        null,

      avatar:
        notification.avatar ||
        null,

      sensitive:
        Boolean(notification.sensitive),

      read: false,

      createdAt:
        new Date().toISOString(),

      action:
        notification.action ||
        null

    };


    this.state.items.unshift(
      item
    );


    this.recalculateUnread();

    this.save();

    this.emit(
      "new",
      item
    );


    return item;

  },


  /* =======================================================
     COMMON SOCIAL NOTIFICATIONS
  ======================================================= */

  like(user, postId) {

    return this.add({

      type: "like",

      title: "New Like",

      message:
        `${user} liked your post.`,

      sender: user,

      action: {
        type: "post",
        id: postId
      }

    });

  },


  comment(user, postId) {

    return this.add({

      type: "comment",

      title: "New Comment",

      message:
        `${user} commented on your post.`,

      sender: user,

      action: {
        type: "post",
        id: postId
      }

    });

  },


  follow(user) {

    return this.add({

      type: "follow",

      title: "New Follower",

      message:
        `${user} started following you.`,

      sender: user

    });

  },


  message(user, preview, conversationId) {

    return this.add({

      type: "message",

      title: user,

      message: preview,

      sender: user,

      action: {
        type: "conversation",
        id: conversationId
      },

      sensitive: true

    });

  },


  security(title, message) {

    return this.add({

      type: "security",

      title,

      message,

      sensitive: true

    });

  },


  /* =======================================================
     READ / UNREAD
  ======================================================= */

  markRead(id) {

    const item =
      this.state.items.find(
        notification =>
          notification.id === id
      );

    if (!item) {
      return false;
    }

    item.read = true;

    this.recalculateUnread();

    this.save();

    this.emit(
      "read",
      item
    );

    return true;

  },


  markAllRead() {

    this.state.items
      .forEach(item => {
        item.read = true;
      });

    this.recalculateUnread();

    this.save();

    this.emit(
      "allRead"
    );

  },


  /* =======================================================
     SENSITIVE NOTIFICATIONS
  ======================================================= */

  shouldShow(notification) {

    if (
      !notification.sensitive
    ) {
      return true;
    }

    if (
      !this.settings.sensitiveProtection
    ) {
      return true;
    }

    /*
      Sensitive notifications remain stored,
      but their preview can be hidden.
    */

    return this.settings.notificationPreview;

  },


  displayMessage(notification) {

    if (
      notification.sensitive &&
      this.settings.sensitiveProtection &&
      !this.settings.notificationPreview
    ) {

      return "New notification";

    }

    return notification.message;

  },


  /* =======================================================
     DISAPPEARING NOTIFICATIONS
  ======================================================= */

  enableDisappearing() {

    this.settings.disappearingNotifications =
      true;

    this.save();

  },


  disableDisappearing() {

    this.settings.disappearingNotifications =
      false;

    this.save();

  },


  removeExpired() {

    if (
      !this.settings.disappearingNotifications
    ) {
      return;
    }


    const now =
      Date.now();


    this.state.items =
      this.state.items.filter(
        notification => {

          /*
            Security/sensitive notifications
            are deliberately preserved.
          */

          if (
            notification.sensitive
          ) {
            return true;
          }


          const age =
            now -
            new Date(
              notification.createdAt
            ).getTime();


          return age <
            24 * 60 * 60 * 1000;

        }
      );


    this.recalculateUnread();

    this.save();

  },


  /* =======================================================
     COUNT
  ======================================================= */

  recalculateUnread() {

    this.state.unread =
      this.state.items.filter(
        item => !item.read
      ).length;


    this.emit(
      "countChanged",
      {
        unread:
          this.state.unread
      }
    );

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
      "notifications",
      this.state.items
    );


    VortexStorage.save(
      "notification_settings",
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


    this.state.items =
      VortexStorage.load(
        "notifications",
        []
      );


    const settings =
      VortexStorage.load(
        "notification_settings",
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
        `vortex:notifications:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexNotifications =
  VortexNotifications;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexNotifications.initialize();

  }
);
