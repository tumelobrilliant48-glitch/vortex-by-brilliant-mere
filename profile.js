/* =========================================================
   VORTEX PROFILE SYSTEM
   FILE 10 — profile.js
   ========================================================= */

"use strict";


const VortexProfile = {

  /* =======================================================
     CURRENT PROFILE
     ======================================================= */

  currentProfile: null,


  /* =======================================================
     INIT
     ======================================================= */

  init() {

    window.addEventListener(
      "vortex:user-changed",
      event => {

        this.currentProfile =
          event.detail || null;

      }
    );


    this.currentProfile =
      window.VortexAuth?.getUser() || null;


    console.log(
      "👤 VORTEX Profiles ready."
    );

  },


  /* =======================================================
     GET PROFILE
     ======================================================= */

  async getProfile(
    userId
  ) {

    if (!userId) {

      return {
        success: false,
        error:
          "User ID is required."
      };

    }


    const result =
      await VortexDB.getUser(
        userId
      );


    if (!result.success) {

      return result;

    }


    const user =
      result.data;


    if (!user) {

      return {
        success: false,
        error:
          "Profile not found."
      };

    }


    return {

      success: true,

      data:
        this.prepareProfile(
          user
        )

    };

  },


  /* =======================================================
     PREPARE PROFILE
     ======================================================= */

  prepareProfile(
    user
  ) {

    return {

      id:
        user.id,

      name:
        user.name || "VORTEX User",

      username:
        user.username || "",

      avatar:
        user.avatar || "",

      cover:
        user.cover || "",

      bio:
        user.bio || "",

      website:
        user.website || "",

      location:
        user.location || "",

      points:
        Number(
          user.points || 0
        ),

      followers:
        Array.isArray(
          user.followers
        )
          ? user.followers
          : [],

      following:
        Array.isArray(
          user.following
        )
          ? user.following
          : [],

      friends:
        Array.isArray(
          user.friends
        )
          ? user.friends
          : [],

      privacy:
        user.privacy || {

          profile:
            "public",

          posts:
            "public",

          friends:
            "friends"

        },

      createdAt:
        user.createdAt || null

    };

  },


  /* =======================================================
     EDIT PROFILE
     ======================================================= */

  async update(
    changes
  ) {

    if (
      !window.VortexAuth?.isAuthenticated()
    ) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const allowed = {

      name:
        changes?.name,

      username:
        changes?.username,

      bio:
        changes?.bio,

      website:
        changes?.website,

      location:
        changes?.location

    };


    Object.keys(
      allowed
    ).forEach(
      key => {

        if (
          allowed[key] ===
          undefined
        ) {

          delete allowed[key];

        }

      }
    );


    if (
      allowed.name !==
      undefined
    ) {

      allowed.name =
        String(
          allowed.name
        )
        .trim()
        .slice(0, 80);

    }


    if (
      allowed.username !==
      undefined
    ) {

      allowed.username =
        String(
          allowed.username
        )
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9_.]/g,
          ""
        )
        .slice(0, 30);

    }


    if (
      allowed.bio !==
      undefined
    ) {

      allowed.bio =
        String(
          allowed.bio
        )
        .trim()
        .slice(0, 500);

    }


    const result =
      await VortexAuth.updateProfile(
        allowed
      );


    if (result.success) {

      this.currentProfile =
        result.user;

    }


    return result;

  },


  /* =======================================================
     SET PROFILE PHOTO
     ======================================================= */

  async setAvatar(
    file
  ) {

    if (
      !window.VortexMedia
    ) {

      return {
        success: false,
        error:
          "Media system unavailable."
      };

    }


    const result =
      await VortexMedia.setProfilePhoto(
        file
      );


    if (result.success) {

      this.currentProfile =
        VortexAuth.getUser();

    }


    return result;

  },


  /* =======================================================
     SET COVER
     ======================================================= */

  async setCover(
    file
  ) {

    if (
      !window.VortexMedia
    ) {

      return {
        success: false,
        error:
          "Media system unavailable."
      };

    }


    const result =
      await VortexMedia.setCoverPhoto(
        file
      );


    if (result.success) {

      this.currentProfile =
        VortexAuth.getUser();

    }


    return result;

  },


  /* =======================================================
     UPDATE BIO
     ======================================================= */

  async updateBio(
    bio
  ) {

    return this.update({

      bio

    });

  },


  /* =======================================================
     PRIVACY
     ======================================================= */

  async setPrivacy(
    settings
  ) {

    const allowed = {

      profile:
        settings?.profile ||
        "public",

      posts:
        settings?.posts ||
        "public",

      friends:
        settings?.friends ||
        "friends"

    };


    return VortexAuth.updatePrivacy(
      allowed
    );

  },


  /* =======================================================
     POST VISIBILITY
     ======================================================= */

  canViewPost(
    post,
    viewerId
  ) {

    if (!post) {

      return false;

    }


    const visibility =
      post.visibility ||
      "public";


    if (
      visibility ===
      "public"
    ) {

      return true;

    }


    if (!viewerId) {

      return false;

    }


    if (
      post.authorId ===
      viewerId
    ) {

      return true;

    }


    if (
      visibility ===
      "private"
    ) {

      return false;

    }


    if (
      visibility ===
      "friends"
    ) {

      const author =
        VortexDB.localFind(
          "users",
          post.authorId
        );


      if (!author) {

        return false;

      }


      return (
        Array.isArray(
          author.friends
        ) &&
        author.friends.includes(
          viewerId
        )
      );

    }


    if (
      visibility ===
      "contacts"
    ) {

      const author =
        VortexDB.localFind(
          "users",
          post.authorId
        );


      if (!author) {

        return false;

      }


      return (
        Array.isArray(
          author.followers
        ) &&
        author.followers.includes(
          viewerId
        )
      );

    }


    return false;

  },


  /* =======================================================
     FOLLOW
     ======================================================= */

  async follow(
    userId
  ) {

    const me =
      VortexAuth.getUser();


    if (!me) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    if (
      me.id === userId
    ) {

      return {
        success: false,
        error:
          "You cannot follow yourself."
      };

    }


    const target =
      VortexDB.localFind(
        "users",
        userId
      );


    if (!target) {

      return {
        success: false,
        error:
          "User not found."
      };

    }


    const following =
      Array.isArray(
        me.following
      )
        ? [
            ...me.following
          ]
        : [];


    const followers =
      Array.isArray(
        target.followers
      )
        ? [
            ...target.followers
          ]
        : [];


    if (
      following.includes(
        userId
      )
    ) {

      return {
        success: true,
        alreadyFollowing: true
      };

    }


    following.push(
      userId
    );


    followers.push(
      me.id
    );


    VortexDB.localUpdate(

      "users",

      me.id,

      {
        following
      }

    );


    VortexDB.localUpdate(

      "users",

      target.id,

      {
        followers
      }

    );


    VortexDB.addNotification({

      userId:
        target.id,

      type:
        "follow",

      actorId:
        me.id,

      text:
        `${me.name} followed you.`

    });


    return {

      success: true,

      following: true

    };

  },


  /* =======================================================
     UNFOLLOW
     ======================================================= */

  async unfollow(
    userId
  ) {

    const me =
      VortexAuth.getUser();


    if (!me) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const target =
      VortexDB.localFind(
        "users",
        userId
      );


    if (!target) {

      return {
        success: false,
        error:
          "User not found."
      };

    }


    const following =
      (
        me.following || []
      ).filter(
        id =>
          id !== userId
      );


    const followers =
      (
        target.followers || []
      ).filter(
        id =>
          id !== me.id
      );


    VortexDB.localUpdate(

      "users",

      me.id,

      {
        following
      }

    );


    VortexDB.localUpdate(

      "users",

      target.id,

      {
        followers
      }

    );


    return {

      success: true,

      following: false

    };

  },


  /* =======================================================
     FRIEND REQUEST
     ======================================================= */

  async sendFriendRequest(
    userId
  ) {

    const me =
      VortexAuth.getUser();


    if (!me) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    if (
      me.id === userId
    ) {

      return {
        success: false,
        error:
          "You cannot add yourself."
      };

    }


    const target =
      VortexDB.localFind(
        "users",
        userId
      );


    if (!target) {

      return {
        success: false,
        error:
          "User not found."
      };

    }


    const existing =
      VortexDB.localFindMany(

        "friends",

        request =>

          (
            request.senderId ===
              me.id &&
            request.receiverId ===
              userId
          ) ||

          (
            request.senderId ===
              userId &&
            request.receiverId ===
              me.id
          )

      );


    if (existing.length) {

      return {
        success: false,
        error:
          "Friend request already exists."
      };

    }


    const request =
      await VortexDB.addFriend({

        senderId:
          me.id,

        receiverId:
          userId,

        status:
          "pending"

      });


    await VortexDB.addNotification({

      userId,

      type:
        "friend_request",

      actorId:
        me.id,

      text:
        `${me.name} sent you a friend request.`

    });


    return request;

  },


  /* =======================================================
     ACCEPT FRIEND REQUEST
     ======================================================= */

  async acceptFriendRequest(
    requestId
  ) {

    const request =
      VortexDB.localFind(
        "friends",
        requestId
      );


    if (!request) {

      return {
        success: false,
        error:
          "Friend request not found."
      };

    }


    const me =
      VortexAuth.getUser();


    if (
      request.receiverId !==
      me?.id
    ) {

      return {
        success: false,
        error:
          "You cannot accept this request."
      };

    }


    VortexDB.localUpdate(

      "friends",

      requestId,

      {
        status:
          "accepted"
      }

    );


    const sender =
      VortexDB.localFind(
        "users",
        request.senderId
      );


    const receiver =
      VortexDB.localFind(
        "users",
        request.receiverId
      );


    if (
      sender &&
      receiver
    ) {

      const senderFriends =
        Array.from(
          new Set([
            ...(sender.friends || []),
            receiver.id
          ])
        );


      const receiverFriends =
        Array.from(
          new Set([
            ...(receiver.friends || []),
            sender.id
          ])
        );


      VortexDB.localUpdate(

        "users",

        sender.id,

        {
          friends:
            senderFriends
        }

      );


      VortexDB.localUpdate(

        "users",

        receiver.id,

        {
          friends:
            receiverFriends
        }

      );

    }


    return {

      success: true

    };

  },


  /* =======================================================
     REMOVE FRIEND
     ======================================================= */

  async removeFriend(
    userId
  ) {

    const me =
      VortexAuth.getUser();


    if (!me) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const other =
      VortexDB.localFind(
        "users",
        userId
      );


    if (!other) {

      return {
        success: false,
        error:
          "User not found."
      };

    }


    const myFriends =
      (
        me.friends || []
      ).filter(
        id =>
          id !== userId
      );


    const theirFriends =
      (
        other.friends || []
      ).filter(
        id =>
          id !== me.id
      );


    VortexDB.localUpdate(

      "users",

      me.id,

      {
        friends:
          myFriends
      }

    );


    VortexDB.localUpdate(

      "users",

      other.id,

      {
        friends:
          theirFriends
      }

    );


    return {

      success: true

    };

  },


  /* =======================================================
     PROFILE POSTS
     ======================================================= */

  async getProfilePosts(
    userId,
    viewerId
  ) {

    const result =
      await VortexDB.getPosts();


    if (!result.success) {

      return result;

    }


    const posts =
      result.data.filter(
        post => {

          if (
            post.authorId !==
            userId
          ) {

            return false;

          }


          return this.canViewPost(
            post,
            viewerId
          );

        }
      );


    return {

      success: true,

      data:
        posts

    };

  },


  /* =======================================================
     DELETE OWN POST
     ======================================================= */

  async deletePost(
    postId
  ) {

    const user =
      VortexAuth.getUser();


    if (!user) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const post =
      VortexDB.localFind(
        "posts",
        postId
      );


    if (!post) {

      return {
        success: false,
        error:
          "Post not found."
      };

    }


    if (
      post.authorId !==
      user.id &&
      post.userId !==
      user.id
    ) {

      return {
        success: false,
        error:
          "You can only delete your own posts."
      };

    }


    return VortexDB.deletePost(
      postId
    );

  },


  /* =======================================================
     PROFILE STATISTICS
     ======================================================= */

  getStats(
    user
  ) {

    if (!user) {

      return {

        posts: 0,

        followers: 0,

        following: 0,

        friends: 0,

        points: 0

      };

    }


    const posts =
      VortexDB.localFindMany(

        "posts",

        post =>
          (
            post.authorId ===
            user.id
          ) ||
          (
            post.userId ===
            user.id
          )

      );


    return {

      posts:
        posts.length,

      followers:
        (
          user.followers || []
        ).length,

      following:
        (
          user.following || []
        ).length,

      friends:
        (
          user.friends || []
        ).length,

      points:
        Number(
          user.points || 0
        )

    };

  },


  /* =======================================================
     SEARCH USERS
     ======================================================= */

  searchUsers(
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

      "users",

      user =>

        String(
          user.name || ""
        )
        .toLowerCase()
        .includes(q) ||

        String(
          user.username || ""
        )
        .toLowerCase()
        .includes(q)

    );

  }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexProfile =
  VortexProfile;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexProfile.init();

  }
);


/* =========================================================
   END OF PROFILE MODULE
   ========================================================= */
