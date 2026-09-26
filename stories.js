/* =========================================================
   VORTEX STORIES SYSTEM
   FILE 12 — stories.js
   ========================================================= */

"use strict";

const VortexStories = {

  stories: [],

  currentIndex: 0,

  expiresAfter: 24 * 60 * 60 * 1000,


  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.removeExpired();

    this.load();

    console.log("⭕ VORTEX Stories ready.");

  },


  /* =======================================================
     LOAD
     ======================================================= */

  load() {

    const saved =
      VortexDB.localGet("stories");

    this.stories =
      Array.isArray(saved)
        ? saved
        : [];

    this.removeExpired();

    window.dispatchEvent(
      new CustomEvent(
        "vortex:stories-updated",
        {
          detail:
            this.stories
        }
      )
    );

    return this.stories;

  },


  /* =======================================================
     CREATE STORY
     ======================================================= */

  async create(
    file,
    options = {}
  ) {

    const user =
      window.VortexAuth?.getUser();

    if (!user) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    if (!file) {

      return {
        success: false,
        error:
          "Choose an image or video."
      };

    }


    if (!window.VortexMedia) {

      return {
        success: false,
        error:
          "Media system unavailable."
      };

    }


    const media =
      await VortexMedia.prepareStoryMedia(
        file
      );


    if (!media.success) {

      return media;

    }


    const now =
      Date.now();


    const story = {

      id:
        VortexDB.id("story"),

      userId:
        user.id,

      userName:
        user.name || "VORTEX User",

      userAvatar:
        user.avatar || "",

      media:
        media.data,

      type:
        media.data?.type ||
        "image",

      text:
        String(
          options.text || ""
        ).slice(0, 500),

      visibility:
        options.visibility ||
        "friends",

      viewers: [],

      reactions: {},

      createdAt:
        new Date(
          now
        ).toISOString(),

      expiresAt:
        new Date(
          now +
          this.expiresAfter
        ).toISOString()

    };


    const stories =
      VortexDB.localGet(
        "stories"
      );


    stories.push(
      story
    );


    VortexDB.localSet(
      "stories",
      stories
    );


    this.load();


    window.dispatchEvent(
      new CustomEvent(
        "vortex:story-created",
        {
          detail:
            story
        }
      )
    );


    return {

      success: true,

      data:
        story

    };

  },


  /* =======================================================
     DELETE STORY
     ======================================================= */

  async delete(
    storyId
  ) {

    const userId =
      window.VortexAuth?.getUserId();


    if (!userId) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const story =
      this.find(storyId);


    if (!story) {

      return {
        success: false,
        error:
          "Story not found."
      };

    }


    if (
      story.userId !==
      userId
    ) {

      return {
        success: false,
        error:
          "You can only delete your own story."
      };

    }


    const updated =
      this.stories.filter(
        item =>
          item.id !== storyId
      );


    VortexDB.localSet(
      "stories",
      updated
    );


    this.stories =
      updated;


    window.dispatchEvent(
      new CustomEvent(
        "vortex:story-deleted",
        {
          detail:
            storyId
        }
      )
    );


    return {
      success: true
    };

  },


  /* =======================================================
     FIND STORY
     ======================================================= */

  find(
    storyId
  ) {

    return this.stories.find(
      story =>
        story.id === storyId
    );

  },


  /* =======================================================
     GET USER STORIES
     ======================================================= */

  getUserStories(
    userId,
    viewerId
  ) {

    return this.stories.filter(
      story => {

        if (
          story.userId !==
          userId
        ) {

          return false;

        }


        return this.canView(
          story,
          viewerId
        );

      }
    );

  },


  /* =======================================================
     GROUP STORIES BY USER
     ======================================================= */

  groupByUser(
    viewerId
  ) {

    const groups = {};


    this.stories.forEach(
      story => {

        if (
          !this.canView(
            story,
            viewerId
          )
        ) {

          return;

        }


        if (
          !groups[
            story.userId
          ]
        ) {

          groups[
            story.userId
          ] = {

            userId:
              story.userId,

            name:
              story.userName,

            avatar:
              story.userAvatar,

            stories: []

          };

        }


        groups[
          story.userId
        ].stories.push(
          story
        );

      }
    );


    return Object.values(
      groups
    );

  },


  /* =======================================================
     STORY PRIVACY
     ======================================================= */

  canView(
    story,
    viewerId
  ) {

    if (!story) {

      return false;

    }


    if (
      story.userId ===
      viewerId
    ) {

      return true;

    }


    if (
      story.visibility ===
      "public"
    ) {

      return true;

    }


    if (!viewerId) {

      return false;

    }


    const owner =
      VortexDB.localFind(
        "users",
        story.userId
      );


    if (!owner) {

      return false;

    }


    if (
      story.visibility ===
      "private"
    ) {

      return false;

    }


    if (
      story.visibility ===
      "friends"
    ) {

      return (
        Array.isArray(
          owner.friends
        ) &&
        owner.friends.includes(
          viewerId
        )
      );

    }


    if (
      story.visibility ===
      "contacts"
    ) {

      return (
        Array.isArray(
          owner.followers
        ) &&
        owner.followers.includes(
          viewerId
        )
      );

    }


    return false;

  },


  /* =======================================================
     MARK VIEWED
     ======================================================= */

  markViewed(
    storyId
  ) {

    const userId =
      window.VortexAuth?.getUserId();


    if (!userId) {

      return false;

    }


    const story =
      this.find(storyId);


    if (!story) {

      return false;

    }


    if (
      !Array.isArray(
        story.viewers
      )
    ) {

      story.viewers = [];

    }


    if (
      !story.viewers.includes(
        userId
      )
    ) {

      story.viewers.push(
        userId
      );


      VortexDB.localUpdate(

        "stories",

        storyId,

        {
          viewers:
            story.viewers
        }

      );

    }


    return true;

  },


  /* =======================================================
     REACT
     ======================================================= */

  react(
    storyId,
    reaction = "❤️"
  ) {

    const userId =
      window.VortexAuth?.getUserId();


    if (!userId) {

      return {
        success: false,
        error:
          "Login required."
      };

    }


    const story =
      this.find(storyId);


    if (!story) {

      return {
        success: false,
        error:
          "Story not found."
      };

    }


    if (
      !story.reactions
    ) {

      story.reactions = {};

    }


    if (
      !Array.isArray(
        story.reactions[
          reaction
        ]
      )
    ) {

      story.reactions[
        reaction
      ] = [];

    }


    const users =
      story.reactions[
        reaction
      ];


    const index =
      users.indexOf(
        userId
      );


    if (index === -1) {

      users.push(
        userId
      );

    } else {

      users.splice(
        index,
        1
      );

    }


    VortexDB.localUpdate(

      "stories",

      storyId,

      {
        reactions:
          story.reactions
      }

    );


    return {

      success: true,

      reaction,

      active:
        index === -1

    };

  },


  /* =======================================================
     STORY VIEWERS
     ======================================================= */

  getViewers(
    storyId
  ) {

    const story =
      this.find(storyId);


    if (!story) {

      return [];

    }


    return (
      story.viewers || []
    ).map(
      userId =>
        VortexDB.localFind(
          "users",
          userId
        )
    ).filter(Boolean);

  },


  /* =======================================================
     OPEN STORY
     ======================================================= */

  open(
    storyId
  ) {

    const story =
      this.find(storyId);


    if (!story) {

      return {
        success: false,
        error:
          "Story not found."
      };

    }


    const viewerId =
      window.VortexAuth?.getUserId();


    if (
      !this.canView(
        story,
        viewerId
      )
    ) {

      return {
        success: false,
        error:
          "This story is private."
      };

    }


    this.markViewed(
      storyId
    );


    window.dispatchEvent(
      new CustomEvent(
        "vortex:story-open",
        {
          detail:
            story
        }
      )
    );


    return {

      success: true,

      data:
        story

    };

  },


  /* =======================================================
     NEXT STORY
     ======================================================= */

  next(
    storyId
  ) {

    const viewerId =
      window.VortexAuth?.getUserId();


    const visible =
      this.stories.filter(
        story =>
          this.canView(
            story,
            viewerId
          )
      );


    const index =
      visible.findIndex(
        story =>
          story.id ===
          storyId
      );


    if (
      index === -1
    ) {

      return null;

    }


    const nextIndex =
      index + 1;


    if (
      nextIndex >=
      visible.length
    ) {

      return null;

    }


    return this.open(
      visible[nextIndex].id
    );

  },


  /* =======================================================
     PREVIOUS STORY
     ======================================================= */

  previous(
    storyId
  ) {

    const viewerId =
      window.VortexAuth?.getUserId();


    const visible =
      this.stories.filter(
        story =>
          this.canView(
            story,
            viewerId
          )
      );


    const index =
      visible.findIndex(
        story =>
          story.id ===
          storyId
      );


    if (
      index <= 0
    ) {

      return null;

    }


    return this.open(
      visible[index - 1].id
    );

  },


  /* =======================================================
     REMOVE EXPIRED
     ======================================================= */

  removeExpired() {

    const now =
      Date.now();


    const current =
      VortexDB.localGet(
        "stories"
      );


    const active =
      current.filter(
        story => {

          if (
            !story.expiresAt
          ) {

            return true;

          }


          return (
            new Date(
              story.expiresAt
            ).getTime() >
            now
          );

        }
      );


    if (
      active.length !==
      current.length
    ) {

      VortexDB.localSet(
        "stories",
        active
      );

    }


    this.stories =
      active;


    return active;

  },


  /* =======================================================
     TIME LEFT
     ======================================================= */

  timeLeft(
    story
  ) {

    if (!story?.expiresAt) {

      return "";

    }


    const remaining =
      new Date(
        story.expiresAt
      ).getTime() -
      Date.now();


    if (
      remaining <= 0
    ) {

      return "Expired";

    }


    const hours =
      Math.floor(
        remaining /
        (60 * 60 * 1000)
      );


    const minutes =
      Math.floor(
        (
          remaining %
          (60 * 60 * 1000)
        ) /
        (60 * 1000)
      );


    if (hours > 0) {

      return `${hours}h ${minutes}m`;

    }


    return `${minutes}m`;

  },


  /* =======================================================
     CLEANUP TIMER
     ======================================================= */

  startCleanup() {

    setInterval(
      () => {

        this.removeExpired();

      },

      60 * 1000

    );

  }

};


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.VortexStories =
  VortexStories;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexStories.init();

    VortexStories.startCleanup();

  }
);


/* =========================================================
   END OF STORIES MODULE
   ========================================================= */
