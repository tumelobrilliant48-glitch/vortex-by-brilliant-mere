/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / RANKINGS.JS
========================================================= */

"use strict";

const VortexRankings = {

  state: {

    posts: [],

    videos: [],

    games: [],

    buyers: [],

    creators: [],

    onlineUsers: [],

    videoMakers: [],

    overall: [],

    initialized: false

  },


  settings: {

    defaultLimit: 50,

    refreshInterval: 30000

  },


  /* =======================================================
     INITIALIZE
  ======================================================= */

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.state.initialized = true;

    this.rebuild();

    this.emit("ready");

  },


  /* =======================================================
     POST RANKING
  ======================================================= */

  buildPostRanking(
    posts = []
  ) {

    this.state.posts =
      [...posts]
        .map(post => ({

          ...post,

          rankingScore:
            this.postScore(post)

        }))
        .sort(
          (a, b) =>
            b.rankingScore -
            a.rankingScore
        )
        .slice(
          0,
          this.settings.defaultLimit
        );


    return this.state.posts;

  },


  postScore(post) {

    const quality =
      Number(
        post?.quality?.score || 0
      );


    return (

      quality +

      Number(post?.likes || 0) * 2 +

      Number(post?.comments || 0) * 3 +

      Number(post?.shares || 0) * 4 +

      Number(post?.stars || 0) * 2 +

      Number(post?.saves || 0) * 3 +

      Number(post?.views || 0) * 0.1

    );

  },


  /* =======================================================
     VIDEO RANKING
  ======================================================= */

  buildVideoRanking(
    videos = []
  ) {

    this.state.videos =
      [...videos]
        .map(video => ({

          ...video,

          rankingScore:
            this.videoScore(video)

        }))
        .sort(
          (a, b) =>
            b.rankingScore -
            a.rankingScore
        )
        .slice(
          0,
          this.settings.defaultLimit
        );


    this.state.videoMakers =
      this.buildCreatorRanking(
        videos
      );


    return this.state.videos;

  },


  videoScore(video) {

    return (

      Number(video?.views || 0) * 0.1 +

      Number(video?.likes || 0) * 2 +

      Number(video?.comments || 0) * 3 +

      Number(video?.shares || 0) * 4 +

      Number(video?.stars || 0) * 3

    );

  },


  /* =======================================================
     CREATOR RANKING
  ======================================================= */

  buildCreatorRanking(
    content = []
  ) {

    const creators = {};


    content.forEach(item => {

      const id =
        item.authorId ||
        item.author ||
        "unknown";


      if (!creators[id]) {

        creators[id] = {

          id,

          name:
            item.author ||
            "VORTEX User",

          score: 0,

          posts: 0,

          views: 0,

          likes: 0,

          shares: 0

        };

      }


      creators[id].posts++;

      creators[id].views +=
        Number(
          item.views || 0
        );

      creators[id].likes +=
        Number(
          item.likes || 0
        );

      creators[id].shares +=
        Number(
          item.shares || 0
        );


      creators[id].score +=
        this.videoScore(item);

    });


    return Object.values(
      creators
    )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        this.settings.defaultLimit
      );

  },


  /* =======================================================
     BUYER RANKING
  ======================================================= */

  buildBuyerRanking(
    buyers = []
  ) {

    this.state.buyers =
      [...buyers]
        .map(buyer => ({

          ...buyer,

          rankingScore:
            Number(
              buyer.totalPurchases || 0
            ) +
            Number(
              buyer.totalSpent || 0
            ) * 0.01

        }))
        .sort(
          (a, b) =>
            b.rankingScore -
            a.rankingScore
        )
        .slice(
          0,
          this.settings.defaultLimit
        );


    return this.state.buyers;

  },


  /* =======================================================
     ONLINE USERS
  ======================================================= */

  buildOnlineRanking(
    users = []
  ) {

    this.state.onlineUsers =
      [...users]
        .filter(
          user =>
            user.online === true
        )
        .sort(
          (a, b) =>
            Number(
              b.activityScore || 0
            ) -
            Number(
              a.activityScore || 0
            )
        )
        .slice(
          0,
          this.settings.defaultLimit
        );


    return this.state.onlineUsers;

  },


  /* =======================================================
     OVERALL RANKING
  ======================================================= */

  buildOverallRanking(
    users = []
  ) {

    this.state.overall =
      [...users]
        .map(user => {

          const score =

            Number(
              user.postsScore || 0
            ) +

            Number(
              user.videoScore || 0
            ) +

            Number(
              user.socialScore || 0
            ) +

            Number(
              user.creatorScore || 0
            ) +

            Number(
              user.marketplaceScore || 0
            );


          return {

            ...user,

            rankingScore:
              score

          };

        })
        .sort(
          (a, b) =>
            b.rankingScore -
            a.rankingScore
        )
        .slice(
          0,
          this.settings.defaultLimit
        );


    return this.state.overall;

  },


  /* =======================================================
     REBUILD
  ======================================================= */

  rebuild() {

    if (
      typeof VortexFeed !==
      "undefined"
    ) {

      this.buildPostRanking(
        VortexFeed.state.posts
      );

    }


    if (
      typeof VortexReels !==
      "undefined"
    ) {

      this.buildVideoRanking(
        VortexReels.state.reels
      );

    }


    this.emit(
      "updated",
      this.state
    );

  },


  /* =======================================================
     CATEGORY LIST
  ======================================================= */

  getCategory(
    category,
    limit = this.settings.defaultLimit
  ) {

    if (
      !this.state[category]
    ) {

      return [];

    }


    return this.state[
      category
    ].slice(
      0,
      limit
    );

  },


  /* =======================================================
     STORAGE
  ======================================================= */

  save() {

    if (
      typeof VortexStorage ===
      "undefined"
    ) {

      return;

    }


    VortexStorage.save(
      "rankings",
      this.state
    );

  },


  /* =======================================================
     EVENTS
  ======================================================= */

  emit(name, detail = {}) {

    window.dispatchEvent(

      new CustomEvent(
        `vortex:rankings:${name}`,
        {
          detail
        }
      )

    );

  }

};


window.VortexRankings =
  VortexRankings;


window.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexRankings.initialize();

    setInterval(
      () =>
        VortexRankings.rebuild(),
      VortexRankings
        .settings
        .refreshInterval
    );

  }
);
