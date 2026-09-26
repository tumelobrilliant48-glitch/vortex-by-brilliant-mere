/* =========================================
   VORTEX SOCIAL MEDIA
   Points.js
   Rewards, XP, Levels, Streaks & Achievements
   ========================================= */

"use strict";

const VortexPoints = (() => {

  const VERSION = "1.0.0";
  const STORAGE_KEY = "vortex_social_points";

  const state = {
    initialized: false
  };

  const accounts = new Map();
  const listeners = new Map();

  /* =========================================
     CONFIGURATION
     ========================================= */

  const CONFIG = {
    pointsPerLevel: 1000,

    actions: {
      login: 10,
      dailyLogin: 25,
      post: 20,
      photoPost: 25,
      videoPost: 35,
      story: 10,
      reel: 30,
      comment: 5,
      reply: 4,
      like: 1,
      receiveLike: 2,
      receiveComment: 3,
      follow: 3,
      receiveFollow: 5,
      friend: 10,
      share: 8,
      repost: 10,
      message: 1,
      groupJoin: 10,
      groupPost: 15,
      eventJoin: 15,
      game: 5,
      gameWin: 30,
      gameDraw: 10,
      challengeComplete: 50,
      missionComplete: 75,
      profileComplete: 100,
      verified: 500,
      creatorMilestone: 250
    },

    dailyLimit: {
      like: 100,
      comment: 50,
      post: 20,
      follow: 50,
      message: 100,
      game: 50
    }
  };

  /* =========================================
     LEVELS
     ========================================= */

  const LEVELS = [
    {
      level: 1,
      name: "New Vortex",
      required: 0
    },
    {
      level: 2,
      name: "Explorer",
      required: 1000
    },
    {
      level: 3,
      name: "Creator",
      required: 2500
    },
    {
      level: 4,
      name: "Rising Star",
      required: 5000
    },
    {
      level: 5,
      name: "Vortex Elite",
      required: 10000
    },
    {
      level: 6,
      name: "Vortex Master",
      required: 25000
    },
    {
      level: 7,
      name: "Vortex Legend",
      required: 50000
    },
    {
      level: 8,
      name: "Vortex Icon",
      required: 100000
    },
    {
      level: 9,
      name: "Vortex Titan",
      required: 250000
    },
    {
      level: 10,
      name: "Omniverse",
      required: 500000
    }
  ];

  /* =========================================
     ACHIEVEMENTS
     ========================================= */

  const ACHIEVEMENTS = {

    first_post: {
      id: "first_post",
      name: "First Post",
      description: "Publish your first post",
      icon: "📝",
      reward: 100
    },

    first_follow: {
      id: "first_follow",
      name: "First Connection",
      description: "Follow your first user",
      icon: "👋",
      reward: 50
    },

    first_friend: {
      id: "first_friend",
      name: "New Friend",
      description: "Make your first friend",
      icon: "🤝",
      reward: 100
    },

    first_reel: {
      id: "first_reel",
      name: "Reel Creator",
      description: "Create your first reel",
      icon: "🎬",
      reward: 150
    },

    first_story: {
      id: "first_story",
      name: "Storyteller",
      description: "Create your first story",
      icon: "📸",
      reward: 100
    },

    social_100: {
      id: "social_100",
      name: "Social Spark",
      description: "Perform 100 social actions",
      icon: "⚡",
      reward: 250
    },

    followers_100: {
      id: "followers_100",
      name: "Growing Community",
      description: "Reach 100 followers",
      icon: "👥",
      reward: 500
    },

    followers_1000: {
      id: "followers_1000",
      name: "Community Leader",
      description: "Reach 1,000 followers",
      icon: "🌟",
      reward: 1500
    },

    points_1000: {
      id: "points_1000",
      name: "Point Hunter",
      description: "Earn 1,000 points",
      icon: "💎",
      reward: 100
    },

    points_10000: {
      id: "points_10000",
      name: "Point Master",
      description: "Earn 10,000 points",
      icon: "💠",
      reward: 500
    },

    points_100000: {
      id: "points_100000",
      name: "Point Legend",
      description: "Earn 100,000 points",
      icon: "👑",
      reward: 2500
    },

    streak_7: {
      id: "streak_7",
      name: "7 Day Streak",
      description: "Use VORTEX for 7 consecutive days",
      icon: "🔥",
      reward: 250
    },

    streak_30: {
      id: "streak_30",
      name: "30 Day Streak",
      description: "Use VORTEX for 30 consecutive days",
      icon: "🔥",
      reward: 1000
    },

    creator: {
      id: "creator",
      name: "Creator",
      description: "Publish 25 posts",
      icon: "🎨",
      reward: 500
    },

    influencer: {
      id: "influencer",
      name: "Influencer",
      description: "Reach 5,000 followers",
      icon: "📣",
      reward: 2500
    },

    gamer: {
      id: "gamer",
      name: "VORTEX Gamer",
      description: "Play 100 games",
      icon: "🎮",
      reward: 750
    },

    champion: {
      id: "champion",
      name: "Champion",
      description: "Win 50 games",
      icon: "🏆",
      reward: 1500
    }

  };

  /* =========================================
     EVENTS
     ========================================= */

  function on(event, callback) {

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(callback);

    return () => {
      listeners.get(event)?.delete(callback);
    };
  }

  function emit(event, data = {}) {

    listeners.get(event)?.forEach(callback => {

      try {
        callback(data);
      } catch (error) {
        console.error(
          "VortexPoints event error:",
          error
        );
      }

    });

    window.dispatchEvent(
      new CustomEvent(
        `vortex:points:${event}`,
        {
          detail: data
        }
      )
    );
  }

  /* =========================================
     HELPERS
     ========================================= */

  function id(prefix = "points") {

    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function today() {

    const date = new Date();

    return date.toISOString()
      .slice(0, 10);
  }

  function clone(data) {

    return JSON.parse(
      JSON.stringify(data)
    );
  }

  function getUserId() {

    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexUser?.getCurrent?.()?.id ||
      window.VortexFriends?.getUserId?.() ||
      "guest"
    );
  }

  function createAccount(userId) {

    return {
      userId,

      total: 0,

      spent: 0,

      available: 0,

      level: 1,

      levelName: "New Vortex",

      xp: 0,

      streak: 0,

      bestStreak: 0,

      lastDaily: null,

      achievements: [],

      completedMissions: [],

      completedChallenges: [],

      lifetimeActions: 0,

      actionCounts: {},

      dailyActions: {},

      dailyDate: today(),

      history: [],

      createdAt: now(),

      updatedAt: now()
    };
  }

  /* =========================================
     STORAGE
     ========================================= */

  function save() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          Array.from(accounts.values())
        )
      );

    } catch (error) {

      console.error(
        "VortexPoints save error:",
        error
      );

    }
  }

  function load() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const data =
        JSON.parse(raw);

      if (!Array.isArray(data)) {
        return;
      }

      data.forEach(account => {

        if (
          account &&
          account.userId
        ) {

          accounts.set(
            account.userId,
            {
              ...createAccount(
                account.userId
              ),
              ...account
            }
          );

        }

      });

    } catch (error) {

      console.error(
        "VortexPoints load error:",
        error
      );

    }
  }

  /* =========================================
     INIT
     ========================================= */

  function init() {

    if (state.initialized) {
      return api;
    }

    load();

    state.initialized = true;

    emit("initialized", {
      users: accounts.size
    });

    return api;
  }

  /* =========================================
     ACCOUNT
     ========================================= */

  function getAccount(userId = getUserId()) {

    init();

    if (!accounts.has(userId)) {

      accounts.set(
        userId,
        createAccount(userId)
      );

      save();
    }

    return accounts.get(userId);
  }

  function get(userId = getUserId()) {

    return clone(
      getAccount(userId)
    );
  }

  /* =========================================
     DAILY RESET
     ========================================= */

  function resetDailyIfNeeded(account) {

    const currentDay = today();

    if (
      account.dailyDate !==
      currentDay
    ) {

      account.dailyDate =
        currentDay;

      account.dailyActions = {};
    }
  }

  /* =========================================
     LEVEL SYSTEM
     ========================================= */

  function calculateLevel(points) {

    let current = LEVELS[0];

    for (const level of LEVELS) {

      if (
        points >= level.required
      ) {
        current = level;
      } else {
        break;
      }

    }

    return current;
  }

  function updateLevel(account) {

    const previous =
      account.level;

    const level =
      calculateLevel(account.total);

    account.level =
      level.level;

    account.levelName =
      level.name;

    account.xp =
      Math.max(
        0,
        account.total -
        level.required
      );

    if (
      previous !== account.level
    ) {

      emit("levelUp", {
        userId: account.userId,
        previousLevel: previous,
        level: account.level,
        name: account.levelName
      });

      showToast(
        `Level ${account.level}! ${account.levelName} 🎉`
      );
    }
  }

  function getLevel(userId = getUserId()) {

    const account =
      getAccount(userId);

    const level =
      calculateLevel(account.total);

    const next =
      LEVELS.find(
        item =>
          item.required >
          account.total
      );

    return {
      current: clone(level),

      next: next
        ? clone(next)
        : null,

      points:
        account.total,

      progress:
        next
          ? Math.min(
              100,
              Math.round(
                (
                  (
                    account.total -
                    level.required
                  ) /
                  (
                    next.required -
                    level.required
                  )
                ) * 100
              )
            )
          : 100
    };
  }

  /* =========================================
     AWARD POINTS
     ========================================= */

  function award(
    userId,
    amount,
    reason = "activity",
    metadata = {}
  ) {

    init();

    const account =
      getAccount(userId);

    resetDailyIfNeeded(account);

    amount =
      Math.floor(
        Number(amount) || 0
      );

    if (amount <= 0) {
      return clone(account);
    }

    const previousTotal =
      account.total;

    account.total += amount;

    account.available += amount;

    account.lifetimeActions++;

    account.actionCounts[reason] =
      (
        account.actionCounts[reason] ||
        0
      ) + 1;

    account.history.unshift({

      id: id("reward"),

      amount,

      reason,

      metadata: clone(metadata),

      timestamp: now()
    });

    account.history =
      account.history.slice(0, 200);

    account.updatedAt = now();

    updateLevel(account);

    accounts.set(
      userId,
      account
    );

    save();

    checkAchievements(
      userId
    );

    emit("earned", {

      userId,

      amount,

      reason,

      previousTotal,

      total: account.total,

      level: account.level
    });

    return clone(account);
  }

  /* =========================================
     ACTION REWARDS
     ========================================= */

  function reward(
    action,
    userId = getUserId(),
    metadata = {}
  ) {

    const amount =
      CONFIG.actions[action];

    if (!amount) {
      return false;
    }

    const account =
      getAccount(userId);

    resetDailyIfNeeded(account);

    const limit =
      CONFIG.dailyLimit[action];

    const used =
      Number(
        account.dailyActions[action] ||
        0
      );

    if (
      limit &&
      used >= limit
    ) {
      return false;
    }

    account.dailyActions[action] =
      used + 1;

    accounts.set(
      userId,
      account
    );

    award(
      userId,
      amount,
      action,
      metadata
    );

    return true;
  }

  /* =========================================
     DAILY LOGIN
     ========================================= */

  function dailyLogin(
    userId = getUserId()
  ) {

    const account =
      getAccount(userId);

    const current =
      today();

    if (
      account.lastDaily ===
      current
    ) {
      return {
        claimed: false,
        streak: account.streak
      };
    }

    const previous =
      account.lastDaily;

    if (previous) {

      const yesterday =
        new Date();

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      const expected =
        yesterday.toISOString()
          .slice(0, 10);

      if (
        previous === expected
      ) {

        account.streak++;

      } else {

        account.streak = 1;
      }

    } else {

      account.streak = 1;
    }

    account.bestStreak =
      Math.max(
        account.bestStreak,
        account.streak
      );

    account.lastDaily =
      current;

    accounts.set(
      userId,
      account
    );

    save();

    award(
      userId,
      CONFIG.actions.dailyLogin,
      "dailyLogin"
    );

    if (
      account.streak === 7
    ) {
      showToast(
        "🔥 7 day streak!"
      );
    }

    if (
      account.streak === 30
    ) {
      showToast(
        "🔥 30 day streak!"
      );
    }

    emit("dailyLogin", {
      userId,
      streak: account.streak
    });

    checkAchievements(userId);

    return {
      claimed: true,
      streak: account.streak
    };
  }

  /* =========================================
     SPEND POINTS
     ========================================= */

  function spend(
    userId,
    amount,
    reason = "purchase",
    metadata = {}
  ) {

    const account =
      getAccount(userId);

    amount =
      Math.floor(
        Number(amount) || 0
      );

    if (
      amount <= 0 ||
      account.available < amount
    ) {
      return false;
    }

    account.available -= amount;

    account.spent += amount;

    account.history.unshift({

      id: id("spend"),

      amount: -amount,

      reason,

      metadata: clone(metadata),

      timestamp: now()
    });

    account.history =
      account.history.slice(0, 200);

    account.updatedAt =
      now();

    accounts.set(
      userId,
      account
    );

    save();

    emit("spent", {
      userId,
      amount,
      reason,
      available: account.available
    });

    return true;
  }

  /* =========================================
     BALANCE
     ========================================= */

  function getBalance(
    userId = getUserId()
  ) {

    const account =
      getAccount(userId);

    return {
      total: account.total,
      spent: account.spent,
      available: account.available,
      level: account.level,
      levelName: account.levelName,
      streak: account.streak
    };
  }

  /* =========================================
     ACHIEVEMENTS
     ========================================= */

  function unlockAchievement(
    userId,
    achievementId
  ) {

    const account =
      getAccount(userId);

    if (
      account.achievements.includes(
        achievementId
      )
    ) {
      return false;
    }

    const achievement =
      ACHIEVEMENTS[achievementId];

    if (!achievement) {
      return false;
    }

    account.achievements.push(
      achievementId
    );

    accounts.set(
      userId,
      account
    );

    save();

    award(
      userId,
      achievement.reward,
      "achievement",
      {
        achievementId
      }
    );

    emit("achievement", {
      userId,
      achievement:
        clone(achievement)
    });

    showToast(
      `${achievement.icon} ${achievement.name} unlocked!`
    );

    return true;
  }

  function checkAchievements(
    userId
  ) {

    const account =
      getAccount(userId);

    const counts =
      account.actionCounts;

    if (
      counts.post >= 1
    ) {
      unlockAchievement(
        userId,
        "first_post"
      );
    }

    if (
      counts.follow >= 1
    ) {
      unlockAchievement(
        userId,
        "first_follow"
      );
    }

    if (
      counts.friend >= 1
    ) {
      unlockAchievement(
        userId,
        "first_friend"
      );
    }

    if (
      counts.reel >= 1
    ) {
      unlockAchievement(
        userId,
        "first_reel"
      );
    }

    if (
      counts.story >= 1
    ) {
      unlockAchievement(
        userId,
        "first_story"
      );
    }

    if (
      account.lifetimeActions >= 100
    ) {
      unlockAchievement(
        userId,
        "social_100"
      );
    }

    if (
      account.total >= 1000
    ) {
      unlockAchievement(
        userId,
        "points_1000"
      );
    }

    if (
      account.total >= 10000
    ) {
      unlockAchievement(
        userId,
        "points_10000"
      );
    }

    if (
      account.total >= 100000
    ) {
      unlockAchievement(
        userId,
        "points_100000"
      );
    }

    if (
      account.streak >= 7
    ) {
      unlockAchievement(
        userId,
        "streak_7"
      );
    }

    if (
      account.streak >= 30
    ) {
      unlockAchievement(
        userId,
        "streak_30"
      );
    }

    if (
      counts.post >= 25
    ) {
      unlockAchievement(
        userId,
        "creator"
      );
    }

    if (
      counts.game >= 100
    ) {
      unlockAchievement(
        userId,
        "gamer"
      );
    }

    if (
      counts.gameWin >= 50
    ) {
      unlockAchievement(
        userId,
        "champion"
      );
    }

    const followers =
      window.VortexUser
        ?.get?.(userId)
        ?.stats
        ?.followers || 0;

    if (
      followers >= 100
    ) {
      unlockAchievement(
        userId,
        "followers_100"
      );
    }

    if (
      followers >= 1000
    ) {
      unlockAchievement(
        userId,
        "followers_1000"
      );
    }

    if (
      followers >= 5000
    ) {
      unlockAchievement(
        userId,
        "influencer"
      );
    }
  }

  function getAchievements(
    userId = getUserId()
  ) {

    const account =
      getAccount(userId);

    return Object.values(
      ACHIEVEMENTS
    ).map(achievement => ({
      ...clone(achievement),

      unlocked:
        account.achievements
          .includes(
            achievement.id
          )
    }));
  }

  /* =========================================
     MISSIONS
     ========================================= */

  const MISSIONS = [
    {
      id: "daily_post",
      name: "Post Something",
      description: "Create 1 post today",
      action: "post",
      target: 1,
      reward: 50
    },

    {
      id: "daily_comments",
      name: "Join The Conversation",
      description: "Write 5 comments",
      action: "comment",
      target: 5,
      reward: 75
    },

    {
      id: "daily_likes",
      name: "Spread The Love",
      description: "Like 20 posts",
      action: "like",
      target: 20,
      reward: 50
    },

    {
      id: "daily_follow",
      name: "Meet Someone New",
      description: "Follow 3 users",
      action: "follow",
      target: 3,
      reward: 75
    },

    {
      id: "daily_game",
      name: "Game Time",
      description: "Play 3 games",
      action: "game",
      target: 3,
      reward: 100
    }
  ];

  function getMissions(
    userId = getUserId()
  ) {

    const account =
      getAccount(userId);

    resetDailyIfNeeded(account);

    return MISSIONS.map(
      mission => {

        const progress =
          Number(
            account.dailyActions[
              mission.action
            ] || 0
          );

        return {
          ...clone(mission),

          progress:
            Math.min(
              progress,
              mission.target
            ),

          completed:
            progress >=
            mission.target
        };
      }
    );
  }

  function completeMission(
    userId,
    missionId
  ) {

    const account =
      getAccount(userId);

    const mission =
      MISSIONS.find(
        item =>
          item.id === missionId
      );

    if (!mission) {
      return false;
    }

    if (
      account.completedMissions
        .includes(missionId)
    ) {
      return false;
    }

    const progress =
      Number(
        account.dailyActions[
          mission.action
        ] || 0
      );

    if (
      progress <
      mission.target
    ) {
      return false;
    }

    account.completedMissions.push(
      missionId
    );

    accounts.set(
      userId,
      account
    );

    save();

    award(
      userId,
      mission.reward,
      "mission",
      {
        missionId
      }
    );

    emit("missionComplete", {
      userId,
      mission:
        clone(mission)
    });

    return true;
  }

  /* =========================================
     CHALLENGES
     ========================================= */

  function completeChallenge(
    userId,
    challengeId,
    reward = 100
  ) {

    const account =
      getAccount(userId);

    if (
      account.completedChallenges
        .includes(challengeId)
    ) {
      return false;
    }

    account.completedChallenges.push(
      challengeId
    );

    accounts.set(
      userId,
      account
    );

    save();

    award(
      userId,
      reward,
      "challenge",
      {
        challengeId
      }
    );

    emit("challengeComplete", {
      userId,
      challengeId,
      reward
    });

    return true;
  }

  /* =========================================
     LEADERBOARD
     ========================================= */

  function leaderboard(
    limit = 50
  ) {

    init();

    return Array.from(
      accounts.values()
    )
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, limit)
      .map(
        (account, index) => ({
          rank: index + 1,

          userId:
            account.userId,

          points:
            account.total,

          level:
            account.level,

          levelName:
            account.levelName,

          streak:
            account.streak
        })
      );
  }

  function getRank(
    userId = getUserId()
  ) {

    const board =
      leaderboard(
        accounts.size
      );

    const index =
      board.findIndex(
        item =>
          item.userId === userId
      );

    return index >= 0
      ? index + 1
      : null;
  }

  /* =========================================
     HISTORY
     ========================================= */

  function getHistory(
    userId = getUserId(),
    limit = 50
  ) {

    const account =
      getAccount(userId);

    return clone(
      account.history
        .slice(0, limit)
    );
  }

  /* =========================================
     RENDER POINTS CARD
     ========================================= */

  function renderCard(
    userId = getUserId()
  ) {

    const balance =
      getBalance(userId);

    const level =
      getLevel(userId);

    return `
      <section
        class="vortex-points-card"
        data-user-id="${escapeHTML(userId)}"
      >

        <div class="vortex-points-top">

          <div>
            <span class="vortex-points-label">
              VORTEX POINTS
            </span>

            <strong class="vortex-points-total">
              ${formatNumber(
                balance.total
              )}
            </strong>
          </div>

          <div class="vortex-points-gem">
            💎
          </div>

        </div>

        <div class="vortex-points-level">

          <div class="vortex-level-row">
            <span>
              Level ${balance.level}
            </span>

            <strong>
              ${escapeHTML(
                balance.levelName
              )}
            </strong>
          </div>

          <div class="vortex-progress">
            <span
              style="width:${level.progress}%"
            ></span>
          </div>

          <small>
            ${level.progress}% to next level
          </small>

        </div>

        <div class="vortex-points-stats">

          <div>
            <strong>
              ${formatNumber(
                balance.available
              )}
            </strong>
            <span>Available</span>
          </div>

          <div>
            <strong>
              ${formatNumber(
                balance.spent
              )}
            </strong>
            <span>Spent</span>
          </div>

          <div>
            <strong>
              🔥 ${balance.streak}
            </strong>
            <span>Streak</span>
          </div>

        </div>

      </section>
    `;
  }

  /* =========================================
     RENDER ACHIEVEMENTS
     ========================================= */

  function renderAchievements(
    userId = getUserId()
  ) {

    const achievements =
      getAchievements(userId);

    return `
      <div class="vortex-achievements">

        ${achievements.map(
          achievement => `
            <article
              class="
                vortex-achievement
                ${
                  achievement.unlocked
                    ? "unlocked"
                    : "locked"
                }
              "
            >

              <div class="vortex-achievement-icon">
                ${achievement.icon}
              </div>

              <div>
                <strong>
                  ${escapeHTML(
                    achievement.name
                  )}
                </strong>

                <p>
                  ${escapeHTML(
                    achievement.description
                  )}
                </p>

                <small>
                  +${achievement.reward} points
                </small>
              </div>

            </article>
          `
        ).join("")}

      </div>
    `;
  }

  /* =========================================
     RENDER MISSIONS
     ========================================= */

  function renderMissions(
    userId = getUserId()
  ) {

    const missions =
      getMissions(userId);

    return `
      <div class="vortex-missions">

        ${missions.map(
          mission => {

            const percent =
              Math.min(
                100,
                Math.round(
                  (
                    mission.progress /
                    mission.target
                  ) * 100
                )
              );

            return `
              <article
                class="
                  vortex-mission
                  ${
                    mission.completed
                      ? "complete"
                      : ""
                  }
                "
              >

                <div class="vortex-mission-head">

                  <strong>
                    ${escapeHTML(
                      mission.name
                    )}
                  </strong>

                  <span>
                    +${mission.reward}
                  </span>

                </div>

                <p>
                  ${escapeHTML(
                    mission.description
                  )}
                </p>

                <div class="vortex-progress">
                  <span
                    style="width:${percent}%"
                  ></span>
                </div>

                <small>
                  ${mission.progress}
                  /
                  ${mission.target}
                </small>

              </article>
            `;
          }
        ).join("")}

      </div>
    `;
  }

  /* =========================================
     FORMAT
     ========================================= */

  function formatNumber(number) {

    number =
      Number(number || 0);

    if (
      Math.abs(number) < 1000
    ) {
      return String(number);
    }

    if (
      Math.abs(number) < 1000000
    ) {

      return (
        (number / 1000)
          .toFixed(
            number >= 10000
              ? 0
              : 1
          )
          .replace(".0", "") +
        "K"
      );

    }

    if (
      Math.abs(number) < 1000000000
    ) {

      return (
        (number / 1000000)
          .toFixed(1)
          .replace(".0", "") +
        "M"
      );

    }

    return (
      (number / 1000000000)
        .toFixed(1)
        .replace(".0", "") +
      "B"
    );
  }

  function escapeHTML(value) {

    return String(
      value ?? ""
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message) {

    if (
      window.VortexToast
        ?.show
    ) {

      window.VortexToast.show(
        message
      );

      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "vortex:toast",
        {
          detail: {
            message
          }
        }
      )
    );
  }

  /* =========================================
     AUTO SOCIAL REWARDS
     ========================================= */

  function setupIntegrations() {

    window.addEventListener(
      "vortex:post:created",
      event => {

        reward(
          event.detail?.media
            ? "photoPost"
            : "post"
        );

      }
    );

    window.addEventListener(
      "vortex:comment:created",
      () => {
        reward("comment");
      }
    );

    window.addEventListener(
      "vortex:comment:reply",
      () => {
        reward("reply");
      }
    );

    window.addEventListener(
      "vortex:post:liked",
      () => {
        reward("like");
      }
    );

    window.addEventListener(
      "vortex:post:receivedLike",
      event => {

        const userId =
          event.detail?.userId ||
          getUserId();

        reward(
          "receiveLike",
          userId
        );

      }
    );

    window.addEventListener(
      "vortex:friend:accepted",
      () => {
        reward("friend");
      }
    );

    window.addEventListener(
      "vortex:follow:created",
      () => {
        reward("follow");
      }
    );

    window.addEventListener(
      "vortex:follow:received",
      event => {

        reward(
          "receiveFollow",
          event.detail?.userId ||
          getUserId()
        );

      }
    );

    window.addEventListener(
      "vortex:share",
      () => {
        reward("share");
      }
    );

    window.addEventListener(
      "vortex:repost",
      () => {
        reward("repost");
      }
    );

    window.addEventListener(
      "vortex:game:played",
      () => {
        reward("game");
      }
    );

    window.addEventListener(
      "vortex:game:won",
      () => {
        reward("gameWin");
      }
    );

    window.addEventListener(
      "vortex:story:created",
      () => {
        reward("story");
      }
    );

    window.addEventListener(
      "vortex:reel:created",
      () => {
        reward("reel");
      }
    );
  }

  /* =========================================
     CSS
     ========================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "vortex-points-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "vortex-points-styles";

    style.textContent = `

      .vortex-points-card {
        padding:22px;
        border-radius:24px;
        background:
          linear-gradient(
            135deg,
            rgba(0,217,255,.10),
            rgba(52,120,255,.07),
            rgba(139,77,255,.10)
          );
        border:1px solid
          rgba(0,217,255,.18);
        box-shadow:
          0 15px 50px
          rgba(0,0,0,.25);
        color:#fff;
      }

      .vortex-points-top {
        display:flex;
        justify-content:space-between;
        align-items:center;
      }

      .vortex-points-label {
        display:block;
        color:#91a0b4;
        font-size:11px;
        letter-spacing:2px;
      }

      .vortex-points-total {
        display:block;
        margin-top:4px;
        font-size:38px;
        line-height:1;
      }

      .vortex-points-gem {
        width:54px;
        height:54px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:18px;
        font-size:27px;
        background:
          rgba(0,217,255,.10);
        box-shadow:
          0 0 30px
          rgba(0,217,255,.18);
      }

      .vortex-points-level {
        margin-top:22px;
      }

      .vortex-level-row {
        display:flex;
        justify-content:space-between;
        gap:12px;
        margin-bottom:8px;
        color:#aeb8c6;
        font-size:13px;
      }

      .vortex-level-row strong {
        color:#fff;
      }

      .vortex-progress {
        width:100%;
        height:8px;
        overflow:hidden;
        border-radius:999px;
        background:
          rgba(255,255,255,.08);
      }

      .vortex-progress span {
        display:block;
        height:100%;
        border-radius:inherit;
        background:
          linear-gradient(
            90deg,
            #00d9ff,
            #3478ff,
            #8b4dff
          );
        box-shadow:
          0 0 15px
          rgba(0,217,255,.4);
        transition:
          width .5s ease;
      }

      .vortex-points-level small {
        display:block;
        margin-top:7px;
        color:#718096;
      }

      .vortex-points-stats {
        display:grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap:10px;
        margin-top:22px;
      }

      .vortex-points-stats div {
        padding:12px;
        border-radius:15px;
        background:
          rgba(255,255,255,.04);
      }

      .vortex-points-stats strong,
      .vortex-points-stats span {
        display:block;
      }

      .vortex-points-stats strong {
        color:#fff;
      }

      .vortex-points-stats span {
        margin-top:3px;
        color:#718096;
        font-size:11px;
      }

      .vortex-achievements,
      .vortex-missions {
        display:grid;
        gap:12px;
      }

      .vortex-achievement {
        display:flex;
        gap:14px;
        padding:15px;
        border-radius:18px;
        background:
          rgba(255,255,255,.04);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vortex-achievement.locked {
        opacity:.45;
      }

      .vortex-achievement-icon {
        width:48px;
        height:48px;
        flex:none;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:15px;
        background:
          rgba(0,217,255,.08);
        font-size:23px;
      }

      .vortex-achievement strong {
        color:#fff;
      }

      .vortex-achievement p {
        margin:4px 0;
        color:#8c98a8;
        font-size:13px;
      }

      .vortex-achievement small {
        color:#00d9ff;
      }

      .vortex-mission {
        padding:16px;
        border-radius:18px;
        background:
          rgba(255,255,255,.04);
        border:1px solid
          rgba(255,255,255,.07);
      }

      .vortex-mission-head {
        display:flex;
        justify-content:space-between;
        color:#fff;
      }

      .vortex-mission-head span {
        color:#00d9ff;
        font-weight:800;
      }

      .vortex-mission p {
        margin:7px 0 12px;
        color:#8995a5;
        font-size:13px;
      }

      .vortex-mission small {
        display:block;
        margin-top:7px;
        color:#728094;
      }

      .vortex-mission.complete {
        border-color:
          rgba(53,255,135,.3);
      }

      @media(max-width:600px) {

        .vortex-points-card {
          padding:17px;
        }

        .vortex-points-total {
          font-size:31px;
        }

      }

    `;

    document.head.appendChild(style);
  }

  /* =========================================
     API
     ========================================= */

  const api = {

    VERSION,

    CONFIG,

    LEVELS,

    ACHIEVEMENTS,

    MISSIONS,

    state,

    accounts,

    on,

    emit,

    init,

    get,

    getAccount,

    award,

    reward,

    dailyLogin,

    spend,

    getBalance,

    calculateLevel,

    getLevel,

    unlockAchievement,

    checkAchievements,

    getAchievements,

    getMissions,

    completeMission,

    completeChallenge,

    leaderboard,

    getRank,

    getHistory,

    renderCard,

    renderAchievements,

    renderMissions,

    formatNumber
  };

  /* =========================================
     START
     ========================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        init();
        injectStyles();
        setupIntegrations();

      },
      { once: true }
    );

  } else {

    init();
    injectStyles();
    setupIntegrations();

  }

  return api;

})();

/* =========================================
   GLOBAL API
   ========================================= */

window.VortexPoints =
  VortexPoints;

/* =========================================
   AUTO DAILY LOGIN
   ========================================= */

window.addEventListener(
  "vortex:auth:login",
  () => {

    setTimeout(() => {

      VortexPoints.dailyLogin();

    }, 300);

  }
);
