/* =========================================================
   VORTEX API / BACKEND CONNECTION
   FILE 5 — api.js
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const VORTEX_API = {

  /*
    CHANGE THIS WHEN YOUR REAL BACKEND IS DEPLOYED.

    Example:

    https://api.yourvortex.com

    During frontend development we keep it empty so
    the application can still run without a backend.
  */

  BASE_URL:
    window.VORTEX_API_URL || "",


  VERSION:
    "/api/v1",


  TIMEOUT:
    15000

};


/* =========================================================
   API CLIENT
   ========================================================= */

const VortexAPI = {

  async request(
    endpoint,
    options = {}
  ) {

    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        () => controller.abort(),
        VORTEX_API.TIMEOUT
      );


    try {

      const headers = {

        "Content-Type":
          "application/json",

        ...(options.headers || {})

      };


      /*
        Attach authentication token when the
        backend provides one.
      */

      const token =
        localStorage.getItem(
          "vortex_access_token"
        );


      if (token) {

        headers.Authorization =
          `Bearer ${token}`;

      }


      const response =
        await fetch(
          VORTEX_API.BASE_URL +
          VORTEX_API.VERSION +
          endpoint,
          {

            ...options,

            headers,

            signal:
              controller.signal

          }
        );


      clearTimeout(timeout);


      let data = null;


      try {

        data =
          await response.json();

      } catch {

        data = null;

      }


      if (!response.ok) {

        throw new Error(

          data?.message ||
          `VORTEX API error ${response.status}`

        );

      }


      return {

        success: true,

        status:
          response.status,

        data

      };

    } catch (error) {

      clearTimeout(timeout);


      console.warn(
        "VORTEX API:",
        error.message
      );


      return {

        success: false,

        error:
          error.message

      };

    }

  },


  /* =======================================================
     AUTHENTICATION
     ======================================================= */

  register(data) {

    return this.request(
      "/auth/register",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  login(data) {

    return this.request(
      "/auth/login",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  logout() {

    return this.request(
      "/auth/logout",
      {

        method: "POST"

      }
    );

  },


  getMe() {

    return this.request(
      "/auth/me"
    );

  },


  refreshToken() {

    return this.request(
      "/auth/refresh",
      {

        method: "POST"

      }
    );

  },


  /* =======================================================
     USERS / PROFILES
     ======================================================= */

  getUser(userId) {

    return this.request(
      `/users/${encodeURIComponent(userId)}`
    );

  },


  updateProfile(data) {

    return this.request(
      "/users/me",
      {

        method: "PATCH",

        body:
          JSON.stringify(data)

      }
    );

  },


  searchUsers(query) {

    return this.request(
      `/users/search?q=${encodeURIComponent(query)}`
    );

  },


  followUser(userId) {

    return this.request(
      `/users/${encodeURIComponent(userId)}/follow`,
      {

        method: "POST"

      }
    );

  },


  unfollowUser(userId) {

    return this.request(
      `/users/${encodeURIComponent(userId)}/follow`,
      {

        method: "DELETE"

      }
    );

  },


  blockUser(userId) {

    return this.request(
      `/users/${encodeURIComponent(userId)}/block`,
      {

        method: "POST"

      }
    );

  },


  unblockUser(userId) {

    return this.request(
      `/users/${encodeURIComponent(userId)}/block`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     POSTS
     ======================================================= */

  getFeed(options = {}) {

    const page =
      options.page || 1;

    const limit =
      options.limit || 20;


    return this.request(
      `/feed?page=${page}&limit=${limit}`
    );

  },


  getPost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}`
    );

  },


  createPost(data) {

    return this.request(
      "/posts",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  updatePost(
    postId,
    data
  ) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}`,
      {

        method: "PATCH",

        body:
          JSON.stringify(data)

      }
    );

  },


  deletePost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}`,
      {

        method: "DELETE"

      }
    );

  },


  likePost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/like`,
      {

        method: "POST"

      }
    );

  },


  unlikePost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/like`,
      {

        method: "DELETE"

      }
    );

  },


  commentPost(
    postId,
    text
  ) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/comments`,
      {

        method: "POST",

        body:
          JSON.stringify({
            text
          })

      }
    );

  },


  getComments(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/comments`
    );

  },


  sharePost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/share`,
      {

        method: "POST"

      }
    );

  },


  savePost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/save`,
      {

        method: "POST"

      }
    );

  },


  unsavePost(postId) {

    return this.request(
      `/posts/${encodeURIComponent(postId)}/save`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     STORIES
     ======================================================= */

  getStories() {

    return this.request(
      "/stories"
    );

  },


  createStory(data) {

    return this.request(
      "/stories",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  deleteStory(storyId) {

    return this.request(
      `/stories/${encodeURIComponent(storyId)}`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     REELS / SHORT VIDEOS
     ======================================================= */

  getReels(options = {}) {

    const page =
      options.page || 1;


    return this.request(
      `/reels?page=${page}`
    );

  },


  createReel(data) {

    return this.request(
      "/reels",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  likeReel(reelId) {

    return this.request(
      `/reels/${encodeURIComponent(reelId)}/like`,
      {

        method: "POST"

      }
    );

  },


  commentReel(
    reelId,
    text
  ) {

    return this.request(
      `/reels/${encodeURIComponent(reelId)}/comments`,
      {

        method: "POST",

        body:
          JSON.stringify({
            text
          })

      }
    );

  },


  /* =======================================================
     CHAT
     ======================================================= */

  getConversations() {

    return this.request(
      "/messages/conversations"
    );

  },


  getMessages(
    conversationId,
    options = {}
  ) {

    const page =
      options.page || 1;


    return this.request(
      `/messages/${encodeURIComponent(conversationId)}?page=${page}`
    );

  },


  sendMessage(
    conversationId,
    data
  ) {

    return this.request(
      `/messages/${encodeURIComponent(conversationId)}`,
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  deleteMessage(messageId) {

    return this.request(
      `/messages/${encodeURIComponent(messageId)}`,
      {

        method: "DELETE"

      }
    );

  },


  markMessagesRead(
    conversationId
  ) {

    return this.request(
      `/messages/${encodeURIComponent(conversationId)}/read`,
      {

        method: "POST"

      }
    );

  },


  /* =======================================================
     GROUPS
     ======================================================= */

  getGroups() {

    return this.request(
      "/groups"
    );

  },


  getGroup(groupId) {

    return this.request(
      `/groups/${encodeURIComponent(groupId)}`
    );

  },


  createGroup(data) {

    return this.request(
      "/groups",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  joinGroup(groupId) {

    return this.request(
      `/groups/${encodeURIComponent(groupId)}/join`,
      {

        method: "POST"

      }
    );

  },


  leaveGroup(groupId) {

    return this.request(
      `/groups/${encodeURIComponent(groupId)}/join`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     FRIENDS
     ======================================================= */

  getFriends() {

    return this.request(
      "/friends"
    );

  },


  sendFriendRequest(
    userId
  ) {

    return this.request(
      `/friends/request/${encodeURIComponent(userId)}`,
      {

        method: "POST"

      }
    );

  },


  acceptFriendRequest(
    requestId
  ) {

    return this.request(
      `/friends/requests/${encodeURIComponent(requestId)}/accept`,
      {

        method: "POST"

      }
    );

  },


  rejectFriendRequest(
    requestId
  ) {

    return this.request(
      `/friends/requests/${encodeURIComponent(requestId)}/reject`,
      {

        method: "POST"

      }
    );

  },


  removeFriend(
    userId
  ) {

    return this.request(
      `/friends/${encodeURIComponent(userId)}`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  getNotifications() {

    return this.request(
      "/notifications"
    );

  },


  markNotificationRead(
    notificationId
  ) {

    return this.request(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      {

        method: "POST"

      }
    );

  },


  markAllNotificationsRead() {

    return this.request(
      "/notifications/read-all",
      {

        method: "POST"

      }
    );

  },


  /* =======================================================
     SEARCH
     ======================================================= */

  search(query) {

    return this.request(
      `/search?q=${encodeURIComponent(query)}`
    );

  },


  /* =======================================================
     MARKETPLACE
     ======================================================= */

  getMarketplace() {

    return this.request(
      "/marketplace"
    );

  },


  createListing(data) {

    return this.request(
      "/marketplace",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  deleteListing(listingId) {

    return this.request(
      `/marketplace/${encodeURIComponent(listingId)}`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     EVENTS
     ======================================================= */

  getEvents() {

    return this.request(
      "/events"
    );

  },


  getEvent(eventId) {

    return this.request(
      `/events/${encodeURIComponent(eventId)}`
    );

  },


  joinEvent(eventId) {

    return this.request(
      `/events/${encodeURIComponent(eventId)}/join`,
      {

        method: "POST"

      }
    );

  },


  /* =======================================================
     GAMES
     ======================================================= */

  getGames() {

    return this.request(
      "/games"
    );

  },


  getGame(gameId) {

    return this.request(
      `/games/${encodeURIComponent(gameId)}`
    );

  },


  saveGameScore(
    gameId,
    score
  ) {

    return this.request(
      `/games/${encodeURIComponent(gameId)}/score`,
      {

        method: "POST",

        body:
          JSON.stringify({
            score
          })

      }
    );

  },


  getLeaderboard(
    gameId
  ) {

    return this.request(
      `/games/${encodeURIComponent(gameId)}/leaderboard`
    );

  },


  /* =======================================================
     POINTS / ACHIEVEMENTS
     ======================================================= */

  getPoints() {

    return this.request(
      "/points"
    );

  },


  getAchievements() {

    return this.request(
      "/achievements"
    );

  },


  getLeaderboardGlobal() {

    return this.request(
      "/leaderboard"
    );

  },


  /* =======================================================
     THEMES
     ======================================================= */

  getThemes() {

    return this.request(
      "/themes"
    );

  },


  unlockTheme(themeId) {

    return this.request(
      `/themes/${encodeURIComponent(themeId)}/unlock`,
      {

        method: "POST"

      }
    );

  },


  /* =======================================================
     MEDIA
     ======================================================= */

  requestUpload(
    data
  ) {

    return this.request(
      "/media/upload",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  deleteMedia(
    mediaId
  ) {

    return this.request(
      `/media/${encodeURIComponent(mediaId)}`,
      {

        method: "DELETE"

      }
    );

  },


  /* =======================================================
     PRIVACY
     ======================================================= */

  updatePrivacy(
    data
  ) {

    return this.request(
      "/privacy",
      {

        method: "PATCH",

        body:
          JSON.stringify(data)

      }
    );

  },


  /* =======================================================
     VAULT
     ======================================================= */

  getVault() {

    return this.request(
      "/vault"
    );

  },


  addVaultItem(
    data
  ) {

    return this.request(
      "/vault",
      {

        method: "POST",

        body:
          JSON.stringify(data)

      }
    );

  },


  deleteVaultItem(
    itemId
  ) {

    return this.request(
      `/vault/${encodeURIComponent(itemId)}`,
      {

        method: "DELETE"

      }
    );

  }

};


/* =========================================================
   FILE UPLOAD
   ========================================================= */

async function vortexUploadFile(
  file,
  type = "media"
) {

  if (!file) {

    return {

      success: false,

      error:
        "No file selected."

    };

  }


  const token =
    localStorage.getItem(
      "vortex_access_token"
    );


  /*
    This uses multipart/form-data.

    DO NOT manually set Content-Type.
    The browser adds the correct boundary.
  */

  const form =
    new FormData();


  form.append(
    "file",
    file
  );


  form.append(
    "type",
    type
  );


  try {

    const response =
      await fetch(
        VORTEX_API.BASE_URL +
        VORTEX_API.VERSION +
        "/media/upload-file",
        {

          method: "POST",

          headers:
            token
              ? {
                  Authorization:
                    `Bearer ${token}`
                }
              : {},

          body:
            form

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data?.message ||
        "Upload failed."
      );

    }


    return {

      success: true,

      data

    };

  } catch (error) {

    console.error(
      "VORTEX upload:",
      error
    );


    return {

      success: false,

      error:
        error.message

    };

  }

}


window.vortexUploadFile =
  vortexUploadFile;


/* =========================================================
   BACKEND STATUS
   ========================================================= */

async function checkVortexBackend() {

  /*
    If no backend URL exists, the frontend
    continues working in local/offline MVP mode.
  */

  if (!VORTEX_API.BASE_URL) {

    return {

      online: false,

      mode:
        "local"

    };

  }


  const result =
    await VortexAPI.request(
      "/health"
    );


  return {

    online:
      result.success,

    mode:
      result.success
        ? "backend"
        : "offline"

  };

}


window.checkVortexBackend =
  checkVortexBackend;


/* =========================================================
   BACKEND CONNECTION EVENT
   ========================================================= */

async function initializeVortexAPI() {

  const status =
    await checkVortexBackend();


  window.dispatchEvent(
    new CustomEvent(
      "vortex:backend-status",
      {
        detail: status
      }
    )
  );


  console.log(
    "VORTEX backend mode:",
    status.mode
  );


  return status;

}


window.VortexAPI =
  VortexAPI;


window.VORTEX_API =
  VORTEX_API;


document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeVortexAPI();

  }
);


/* =========================================================
   END OF VORTEX API MODULE
   ========================================================= */

File 5 = "api.js". This is the bridge for the serious version: authentication, posts, images/videos, chat, friends, groups, reels, marketplace, events, games, points, themes, media uploads, privacy and the vault are all given backend endpoints.

Next we can continue with 6th file.
