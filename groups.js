/* =========================================================
   VORTEX GROUPS ENGINE
   FILE 29 — groups.js

   Public Groups
   Private Groups
   Group Members
   Admins / Moderators
   Posts
   Group Chat
   Rules
   Join Requests
   Invitations
   Roles
   Group Search
   Group Notifications
   ========================================================= */

"use strict";

const VortexGroups = {

  VERSION: "1.0.0",

  groups: new Map(),
  posts: new Map(),
  requests: new Map(),
  invites: new Map(),
  listeners: {},

  STORAGE_GROUPS:
    "vortex_groups",

  STORAGE_POSTS:
    "vortex_group_posts",

  STORAGE_REQUESTS:
    "vortex_group_requests",

  STORAGE_INVITES:
    "vortex_group_invites",

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();

    console.log(
      "👥 VORTEX Groups Engine ready."
    );

  },

  /* =======================================================
     USER
     ======================================================= */

  getUserId() {

    return (
      window.VortexAuth?.getUserId?.() ||
      "guest"
    );

  },

  getUser() {

    return (
      window.VortexAuth?.getUser?.() ||
      window.VortexAuth?.currentUser ||
      {
        id: this.getUserId(),
        name: "VORTEX User",
        avatar: ""
      }
    );

  },

  /* =======================================================
     ID
     ======================================================= */

  id(prefix = "group") {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );

  },

  /* =======================================================
     CREATE GROUP
     ======================================================= */

  create(options = {}) {

    const user =
      this.getUser();

    const name =
      String(
        options.name ||
        ""
      ).trim();

    if (!name) {

      return {
        success: false,
        error:
          "Group name is required."
      };

    }

    if (
      name.length >
      80
    ) {

      return {
        success: false,
        error:
          "Group name is too long."
      };

    }

    const groupId =
      this.id();

    const group = {

      id:
        groupId,

      name,

      description:
        options.description ||
        "",

      category:
        options.category ||
        "general",

      visibility:
        options.visibility ||
        "public",

      avatar:
        options.avatar ||
        "",

      cover:
        options.cover ||
        "",

      ownerId:
        user.id,

      ownerName:
        user.name,

      admins: [
        user.id
      ],

      moderators: [],

      members: [
        user.id
      ],

      memberCount: 1,

      rules:
        Array.isArray(
          options.rules
        )
          ? options.rules
          : [],

      tags:
        Array.isArray(
          options.tags
        )
          ? options.tags
          : [],

      postsCount: 0,

      messagesCount: 0,

      requireApproval:
        options.requireApproval !==
        false,

      allowMemberPosts:
        options.allowMemberPosts !==
        false,

      allowMemberInvites:
        options.allowMemberInvites !==
        false,

      notifications:
        true,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    this.groups.set(
      groupId,
      group
    );

    this.posts.set(
      groupId,
      []
    );

    this.save();

    this.emit(
      "groupCreated",
      group
    );

    return {
      success: true,
      group
    };

  },

  /* =======================================================
     GET GROUP
     ======================================================= */

  get(
    groupId
  ) {

    return (
      this.groups.get(
        groupId
      ) ||
      null
    );

  },

  /* =======================================================
     ALL GROUPS
     ======================================================= */

  getAll() {

    return [
      ...this.groups.values()
    ];

  },

  /* =======================================================
     SEARCH
     ======================================================= */

  search(
    query,
    options = {}
  ) {

    const q =
      String(
        query ||
        ""
      )
      .toLowerCase()
      .trim();

    let groups =
      this.getAll();

    if (
      options.category
    ) {

      groups =
        groups.filter(
          group =>
            group.category ===
            options.category
        );

    }

    if (
      options.visibility
    ) {

      groups =
        groups.filter(
          group =>
            group.visibility ===
            options.visibility
        );

    }

    if (!q) {

      return groups;

    }

    return groups.filter(
      group => {

        return (

          group.name
            .toLowerCase()
            .includes(q) ||

          group.description
            .toLowerCase()
            .includes(q) ||

          group.category
            .toLowerCase()
            .includes(q) ||

          group.tags.some(
            tag =>
              String(tag)
                .toLowerCase()
                .includes(q)
          )

        );

      }
    );

  },

  /* =======================================================
     JOIN GROUP
     ======================================================= */

  join(
    groupId
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    const userId =
      this.getUserId();

    if (
      group.members.includes(
        userId
      )
    ) {

      return {
        success: false,
        error:
          "You are already a member."
      };

    }

    if (
      group.visibility ===
      "private" ||
      group.requireApproval
    ) {

      return this.requestJoin(
        groupId
      );

    }

    group.members.push(
      userId
    );

    group.memberCount =
      group.members.length;

    group.updatedAt =
      new Date().toISOString();

    this.save();

    this.notifyGroup(
      group,
      `${this.getUser().name} joined the group.`
    );

    this.emit(
      "memberJoined",
      {
        group,
        userId
      }
    );

    return {
      success: true,
      group
    };

  },

  /* =======================================================
     LEAVE GROUP
     ======================================================= */

  leave(
    groupId
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    const userId =
      this.getUserId();

    if (
      group.ownerId ===
      userId
    ) {

      return {
        success: false,
        error:
          "Group owner cannot leave. Transfer ownership first."
      };

    }

    group.members =
      group.members.filter(
        id =>
          id !==
          userId
      );

    group.admins =
      group.admins.filter(
        id =>
          id !==
          userId
      );

    group.moderators =
      group.moderators.filter(
        id =>
          id !==
          userId
      );

    group.memberCount =
      group.members.length;

    group.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "memberLeft",
      {
        group,
        userId
      }
    );

    return {
      success: true
    };

  },

  /* =======================================================
     IS MEMBER
     ======================================================= */

  isMember(
    groupId,
    userId =
      this.getUserId()
  ) {

    const group =
      this.get(
        groupId
      );

    return Boolean(
      group &&
      group.members.includes(
        userId
      )
    );

  },

  /* =======================================================
     IS ADMIN
     ======================================================= */

  isAdmin(
    groupId,
    userId =
      this.getUserId()
  ) {

    const group =
      this.get(
        groupId
      );

    return Boolean(
      group &&
      group.admins.includes(
        userId
      )
    );

  },

  /* =======================================================
     IS MODERATOR
     ======================================================= */

  isModerator(
    groupId,
    userId =
      this.getUserId()
  ) {

    const group =
      this.get(
        groupId
      );

    return Boolean(
      group &&
      (
        group.admins.includes(
          userId
        ) ||
        group.moderators.includes(
          userId
        )
      )
    );

  },

  /* =======================================================
     REQUEST JOIN
     ======================================================= */

  requestJoin(
    groupId
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    const user =
      this.getUser();

    if (
      group.members.includes(
        user.id
      )
    ) {

      return {
        success: false,
        error:
          "Already a member."
      };

    }

    const requestId =
      this.id(
        "join"
      );

    const request = {

      id:
        requestId,

      groupId,

      userId:
        user.id,

      userName:
        user.name,

      userAvatar:
        user.avatar ||
        "",

      status:
        "pending",

      createdAt:
        new Date().toISOString()

    };

    this.requests.set(
      requestId,
      request
    );

    this.save();

    this.notifyAdmins(
      group,
      `${user.name} requested to join ${group.name}.`
    );

    this.emit(
      "joinRequested",
      request
    );

    return {
      success: true,
      request
    };

  },

  /* =======================================================
     APPROVE REQUEST
     ======================================================= */

  approveRequest(
    requestId
  ) {

    const request =
      this.requests.get(
        requestId
      );

    if (!request) {

      return {
        success: false,
        error:
          "Request not found."
      };

    }

    const group =
      this.get(
        request.groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    if (
      !this.isModerator(
        group.id
      )
    ) {

      return {
        success: false,
        error:
          "Permission denied."
      };

    }

    if (
      !group.members.includes(
        request.userId
      )
    ) {

      group.members.push(
        request.userId
      );

    }

    group.memberCount =
      group.members.length;

    request.status =
      "approved";

    request.updatedAt =
      new Date().toISOString();

    this.save();

    this.notifyUser(
      request.userId,
      {
        type:
          "group",
        title:
          "Group request approved",
        message:
          `You joined ${group.name}.`,
        groupId:
          group.id
      }
    );

    this.emit(
      "requestApproved",
      request
    );

    return {
      success: true
    };

  },

  /* =======================================================
     REJECT REQUEST
     ======================================================= */

  rejectRequest(
    requestId
  ) {

    const request =
      this.requests.get(
        requestId
      );

    if (!request) {

      return {
        success: false
      };

    }

    const group =
      this.get(
        request.groupId
      );

    if (
      !group ||
      !this.isModerator(
        group.id
      )
    ) {

      return {
        success: false,
        error:
          "Permission denied."
      };

    }

    request.status =
      "rejected";

    request.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "requestRejected",
      request
    );

    return {
      success: true
    };

  },

  /* =======================================================
     INVITE
     ======================================================= */

  invite(
    groupId,
    userId,
    userName = ""
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    const currentUser =
      this.getUser();

    if (
      !this.isMember(
        groupId,
        currentUser.id
      )
    ) {

      return {
        success: false,
        error:
          "You must be a member."
      };

    }

    if (
      !group.allowMemberInvites &&
      !this.isModerator(
        groupId
      )
    ) {

      return {
        success: false,
        error:
          "Members cannot invite users."
      };

    }

    const inviteId =
      this.id(
        "invite"
      );

    const invite = {

      id:
        inviteId,

      groupId,

      fromUserId:
        currentUser.id,

      fromUserName:
        currentUser.name,

      toUserId:
        userId,

      toUserName:
        userName,

      status:
        "pending",

      createdAt:
        new Date().toISOString()

    };

    this.invites.set(
      inviteId,
      invite
    );

    this.save();

    this.notifyUser(
      userId,
      {
        type:
          "group",
        title:
          "Group invitation",
        message:
          `${currentUser.name} invited you to ${group.name}.`,
        groupId:
          group.id,
        inviteId
      }
    );

    this.emit(
      "groupInvite",
      invite
    );

    return {
      success: true,
      invite
    };

  },

  /* =======================================================
     ACCEPT INVITE
     ======================================================= */

  acceptInvite(
    inviteId
  ) {

    const invite =
      this.invites.get(
        inviteId
      );

    if (!invite) {

      return {
        success: false,
        error:
          "Invitation not found."
      };

    }

    if (
      invite.toUserId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error:
          "This invitation is not for you."
      };

    }

    const group =
      this.get(
        invite.groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    if (
      !group.members.includes(
        this.getUserId()
      )
    ) {

      group.members.push(
        this.getUserId()
      );

    }

    group.memberCount =
      group.members.length;

    invite.status =
      "accepted";

    this.save();

    this.emit(
      "inviteAccepted",
      invite
    );

    return {
      success: true,
      group
    };

  },

  /* =======================================================
     ADD ADMIN
     ======================================================= */

  addAdmin(
    groupId,
    userId
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false
      };

    }

    if (
      group.ownerId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error:
          "Only the owner can add admins."
      };

    }

    if (
      !group.members.includes(
        userId
      )
    ) {

      return {
        success: false,
        error:
          "User is not a member."
      };

    }

    if (
      !group.admins.includes(
        userId
      )
    ) {

      group.admins.push(
        userId
      );

    }

    group.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "adminAdded",
      {
        groupId,
        userId
      }
    );

    return {
      success: true
    };

  },

  /* =======================================================
     ADD MODERATOR
     ======================================================= */

  addModerator(
    groupId,
    userId
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false
      };

    }

    if (
      !this.isAdmin(
        groupId
      )
    ) {

      return {
        success: false,
        error:
          "Admin permission required."
      };

    }

    if (
      !group.members.includes(
        userId
      )
    ) {

      return {
        success: false,
        error:
          "User is not a member."
      };

    }

    if (
      !group.moderators.includes(
        userId
      )
    ) {

      group.moderators.push(
        userId
      );

    }

    this.save();

    this.emit(
      "moderatorAdded",
      {
        groupId,
        userId
      }
    );

    return {
      success: true
    };

  },

  /* =======================================================
     REMOVE MEMBER
     ======================================================= */

  removeMember(
    groupId,
    userId
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false
      };

    }

    if (
      !this.isModerator(
        groupId
      )
    ) {

      return {
        success: false,
        error:
          "Moderator permission required."
      };

    }

    if (
      userId ===
      group.ownerId
    ) {

      return {
        success: false,
        error:
          "Owner cannot be removed."
      };

    }

    group.members =
      group.members.filter(
        id =>
          id !==
          userId
      );

    group.admins =
      group.admins.filter(
        id =>
          id !==
          userId
      );

    group.moderators =
      group.moderators.filter(
        id =>
          id !==
          userId
      );

    group.memberCount =
      group.members.length;

    this.save();

    this.emit(
      "memberRemoved",
      {
        groupId,
        userId
      }
    );

    return {
      success: true
    };

  },

  /* =======================================================
     CREATE GROUP POST
     ======================================================= */

  createPost(
    groupId,
    options = {}
  ) {

    const group =
      this.get(
        groupId
      );

    if (!group) {

      return {
        success: false,
        error:
          "Group not found."
      };

    }

    const user =
      this.getUser();

    if (
      !this.isMember(
        groupId,
        user.id
      )
    ) {

      return {
        success: false,
        error:
          "You must join this group first."
      };

    }

    if (
      !group.allowMemberPosts &&
      !this.isModerator(
        groupId,
        user.id
      )
    ) {

      return {
        success: false,
        error:
          "Members cannot create posts."
      };

    }

    const text =
      String(
        options.text ||
        ""
      ).trim();

    if (
      !text &&
      !options.image &&
      !options.video
    ) {

      return {
        success: false,
        error:
          "Post cannot be empty."
      };

    }

    const post = {

      id:
        this.id(
          "gpost"
        ),

      groupId,

      authorId:
        user.id,

      authorName:
        user.name,

      authorAvatar:
        user.avatar ||
        "",

      text,

      image:
        options.image ||
        "",

      video:
        options.video ||
        "",

      likes: 0,

      comments: 0,

      shares: 0,

      likedBy: [],

      pinned:
        false,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    if (
      !this.posts.has(
        groupId
      )
    ) {

      this.posts.set(
        groupId,
        []
      );

    }

    this.posts
      .get(groupId)
      .unshift(
        post
      );

    group.postsCount++;

    group.updatedAt =
      new Date().toISOString();

    this.save();

    this.notifyGroup(
      group,
      `${user.name} created a new group post.`
    );

    this.emit(
      "groupPostCreated",
      post
    );

    return {
      success: true,
      post
    };

  },

  /* =======================================================
     GET POSTS
     ======================================================= */

  getPosts(
    groupId,
    limit = 50
  ) {

    return (
      this.posts.get(
        groupId
      ) ||
      []
    )
      .slice(
        0,
        limit
      );

  },

  /* =======================================================
     LIKE POST
     ======================================================= */

  likePost(
    groupId,
    postId
  ) {

    const
