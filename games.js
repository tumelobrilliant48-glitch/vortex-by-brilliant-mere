/* =========================================================
   VORTEX GAMES ENGINE
   FILE 28 — games.js

   Mini-games system
   Game launcher
   Game library
   Game categories
   Scores
   XP / points
   Achievements
   Leaderboards
   Offline game support
   Multiplayer-ready structure
   ========================================================= */

"use strict";

const VortexGames = {

  VERSION: "1.0.0",

  games: new Map(),
  scores: new Map(),
  achievements: new Map(),
  listeners: {},

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();

    this.registerDefaultGames();

    console.log(
      "🎮 VORTEX Games Engine ready."
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
        name: "VORTEX Player",
        avatar: ""
      }
    );

  },

  /* =======================================================
     GAME ID
     ======================================================= */

  id(prefix = "game") {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );

  },

  /* =======================================================
     REGISTER GAME
     ======================================================= */

  register(game) {

    if (!game?.id) {

      return {
        success: false,
        error:
          "Game ID is required."
      };

    }

    const item = {

      id:
        game.id,

      name:
        game.name ||
        "VORTEX Game",

      description:
        game.description ||
        "",

      category:
        game.category ||
        "arcade",

      icon:
        game.icon ||
        "🎮",

      cover:
        game.cover ||
        "",

      players:
        game.players ||
        "1",

      multiplayer:
        Boolean(
          game.multiplayer
        ),

      offline:
        game.offline !== false,

      installed:
        Boolean(
          game.installed
        ),

      locked:
        Boolean(
          game.locked
        ),

      requiredPoints:
        Number(
          game.requiredPoints ||
          0
        ),

      version:
        game.version ||
        "1.0.0",

      launch:
        typeof game.launch ===
        "function"
          ? game.launch
          : null,

      createdAt:
        game.createdAt ||
        new Date().toISOString()

    };

    this.games.set(
      item.id,
      item
    );

    this.save();

    this.emit(
      "gameRegistered",
      item
    );

    return {
      success: true,
      game: item
    };

  },

  /* =======================================================
     DEFAULT GAMES
     ======================================================= */

  registerDefaultGames() {

    const defaults = [

      {
        id: "vortex-chess",
        name: "VORTEX Chess",
        description:
          "Classic chess with VORTEX styling.",
        category: "board",
        icon: "♟️",
        players: "1-2",
        multiplayer: true,
        offline: true
      },

      {
        id: "vortex-checkers",
        name: "VORTEX Checkers",
        description:
          "Fast classic board battles.",
        category: "board",
        icon: "🔴",
        players: "1-2",
        multiplayer: true,
        offline: true
      },

      {
        id: "vortex-snooker",
        name: "VORTEX Snooker",
        description:
          "Physics-based snooker challenge.",
        category: "sports",
        icon: "🎱",
        players: "1-2",
        multiplayer: true,
        offline: true
      },

      {
        id: "vortex-racing",
        name: "VORTEX Racing",
        description:
          "Fast futuristic racing.",
        category: "racing",
        icon: "🏎️",
        players: "1-8",
        multiplayer: true,
        offline: true
      },

      {
        id: "vortex-runner",
        name: "VORTEX Runner",
        description:
          "Endless futuristic running challenge.",
        category: "arcade",
        icon: "🏃",
        players: "1",
        multiplayer: false,
        offline: true
      },

      {
        id: "vortex-brain",
        name: "VORTEX Brain",
        description:
          "Logic, memory and reaction challenges.",
        category: "brain",
        icon: "🧠",
        players: "1",
        multiplayer: false,
        offline: true
      },

      {
        id: "vortex-battle",
        name: "VORTEX Battle",
        description:
          "Mini arena battle mode.",
        category: "action",
        icon: "⚔️",
        players: "1-4",
        multiplayer: true,
        offline: true
      },

      {
        id: "vortex-balls",
        name: "VORTEX Balls",
        description:
          "Arcade ball challenge.",
        category: "arcade",
        icon: "🔵",
        players: "1-4",
        multiplayer: true,
        offline: true
      },

      {
        id: "vortex-puzzle",
        name: "VORTEX Puzzle",
        description:
          "Complete increasingly difficult puzzles.",
        category: "puzzle",
        icon: "🧩",
        players: "1",
        multiplayer: false,
        offline: true
      },

      {
        id: "vortex-board",
        name: "VORTEX Board",
        description:
          "Collection of classic board mini-games.",
        category: "board",
        icon: "🎲",
        players: "1-4",
        multiplayer: true,
        offline: true
      }

    ];

    defaults.forEach(
      game => {

        if (
          !this.games.has(
            game.id
          )
        ) {

          this.register(
            game
          );

        }

      }
    );

  },

  /* =======================================================
     GET GAME
     ======================================================= */

  get(
    gameId
  ) {

    return (
      this.games.get(
        gameId
      ) ||
      null
    );

  },

  /* =======================================================
     GET ALL
     ======================================================= */

  getAll(
    options = {}
  ) {

    let games =
      [
        ...this.games.values()
      ];

    if (
      options.category
    ) {

      games =
        games.filter(
          game =>
            game.category ===
            options.category
        );

    }

    if (
      options.offline
    ) {

      games =
        games.filter(
          game =>
            game.offline
        );

    }

    if (
      options.multiplayer
    ) {

      games =
        games.filter(
          game =>
            game.multiplayer
        );

    }

    return games;

  },

  /* =======================================================
     SEARCH
     ======================================================= */

  search(
    query
  ) {

    const q =
      String(
        query ||
        ""
      )
      .toLowerCase()
      .trim();

    if (!q) {

      return this.getAll();

    }

    return this.getAll()
      .filter(
        game =>

          game.name
            .toLowerCase()
            .includes(q) ||

          game.description
            .toLowerCase()
            .includes(q) ||

          game.category
            .toLowerCase()
            .includes(q)

      );

  },

  /* =======================================================
     INSTALL
     ======================================================= */

  install(
    gameId
  ) {

    const game =
      this.get(
        gameId
      );

    if (!game) {

      return {
        success: false,
        error:
          "Game not found."
      };

    }

    const points =
      this.getPoints();

    if (
      game.requiredPoints >
      points
    ) {

      return {
        success: false,
        error:
          "Not enough VORTEX points.",
        required:
          game.requiredPoints,
        current:
          points
      };

    }

    game.installed =
      true;

    this.save();

    this.emit(
      "gameInstalled",
      game
    );

    return {
      success: true,
      game
    };

  },

  /* =======================================================
     UNINSTALL
     ======================================================= */

  uninstall(
    gameId
  ) {

    const game =
      this.get(
        gameId
      );

    if (!game) {

      return {
        success: false
      };

    }

    game.installed =
      false;

    this.save();

    this.emit(
      "gameUninstalled",
      game
    );

    return {
      success: true
    };

  },

  /* =======================================================
     LAUNCH
     ======================================================= */

  launch(
    gameId
  ) {

    const game =
      this.get(
        gameId
      );

    if (!game) {

      return {
        success: false,
        error:
          "Game not found."
      };

    }

    if (
      game.locked
    ) {

      return {
        success: false,
        error:
          "This game is locked."
      };

    }

    if (
      !game.installed &&
      !game.offline
    ) {

      return {
        success: false,
        error:
          "Game is not installed."
      };

    }

    this.emit(
      "gameLaunched",
      game
    );

    if (
      typeof game.launch ===
      "function"
    ) {

      game.launch();

    } else {

      this.openGameScreen(
        game
      );

    }

    return {
      success: true,
      game
    };

  },

  /* =======================================================
     GAME SCREEN
     ======================================================= */

  openGameScreen(
    game
  ) {

    let screen =
      document.getElementById(
        "vortexGameScreen"
      );

    if (!screen) {

      screen =
        document.createElement(
          "div"
        );

      screen.id =
        "vortexGameScreen";

      screen.style.cssText = `

        position:fixed;
        inset:0;
        z-index:9999;
        background:#050712;
        color:white;
        display:flex;
        flex-direction:column;
        overflow:hidden;

      `;

      document.body.appendChild(
        screen
      );

    }

    screen.innerHTML = `

      <div style="
        height:60px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:10px 15px;
        background:
          rgba(5,7,18,.96);
        border-bottom:
          1px solid
          rgba(0,217,255,.25);
      ">

        <button
          id="vortexGameBack"
          style="
            width:42px;
            height:42px;
            border:0;
            border-radius:50%;
            background:
              rgba(0,217,255,.12);
            color:white;
            font-size:20px;
          "
        >
          ←
        </button>

        <b style="
          color:#00d9ff;
          font-size:18px;
        ">
          ${this.escape(
            game.icon
          )}
          ${this.escape(
            game.name
          )}
        </b>

        <button
          id="vortexGameMenu"
          style="
            width:42px;
            height:42px;
            border:0;
            border-radius:50%;
            background:
              rgba(139,77,255,.15);
            color:white;
            font-size:20px;
          "
        >
          ⋮
        </button>

      </div>

      <div id="vortexGameCanvas"
        style="
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
          text-align:center;
        "
      >

        <div>

          <div style="
            font-size:70px;
            margin-bottom:15px;
          ">
            ${this.escape(
              game.icon
            )}
          </div>

          <h2>
            ${this.escape(
              game.name
            )}
          </h2>

          <p style="
            opacity:.6;
            margin:10px 0 20px;
          ">
            ${this.escape(
              game.description
            )}
          </p>

          <button
            id="vortexStartMiniGame"
            style="
              border:0;
              padding:14px 28px;
              border-radius:20px;
              background:
                linear-gradient(
                  135deg,
                  #00d9ff,
                  #8b4dff
                );
              color:white;
              font-weight:800;
            "
          >
            START GAME
          </button>

        </div>

      </div>

    `;

    document
      .getElementById(
        "vortexGameBack"
      )
      .onclick = () => {

        screen.remove();

      };

    document
      .getElementById(
        "vortexStartMiniGame"
      )
      .onclick = () => {

        this.startDemoGame(
          game
        );

      };

  },

  /* =======================================================
     DEMO GAME ENGINE
     ======================================================= */

  startDemoGame(
    game
  ) {

    const canvas =
      document.getElementById(
        "vortexGameCanvas"
      );

    if (!canvas) {

      return;

    }

    let score =
      0;

    let time =
      30;

    canvas.innerHTML = `

      <div style="
        width:100%;
        max-width:500px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:20px;
        ">

          <b>
            SCORE:
            <span id="vxScore">
              0
            </span>
          </b>

          <b>
            TIME:
            <span id="vxTime">
              30
            </span>
          </b>

        </div>

        <button
          id="vxTarget"
          style="
            width:150px;
            height:150px;
            border-radius:50%;
            border:2px solid
              rgba(0,217,255,.7);
            background:
              radial-gradient(
                circle,
                #00d9ff,
                #8b4dff,
                #050712
              );
            box-shadow:
              0 0 40px
              rgba(0,217,255,.6);
            font-size:35px;
          "
        >
          👁️
        </button>

        <p style="
          opacity:.6;
          margin-top:20px;
        ">
          Tap the VORTEX target!
        </p>

      </div>

    `;

    const target =
      document.getElementById(
        "vxTarget"
      );

    const scoreElement =
      document.getElementById(
        "vxScore"
      );

    const timeElement =
      document.getElementById(
        "vxTime"
      );

    target.onclick = () => {

      score += 10;

      scoreElement.textContent =
        score;

      target.style.transform =
        `translate(
          ${Math.random()*100-50}px,
          ${Math.random()*100-50}px
        )`;

    };

    const timer =
      setInterval(
        () => {

          time--;

          timeElement.textContent =
            time;

          if (
            time <= 0
          ) {

            clearInterval(
              timer
            );

            this.finishGame(
              game.id,
              score
            );

          }

        },
        1000
      );

  },

  /* =======================================================
     FINISH GAME
     ======================================================= */

  finishGame(
    gameId,
    score
  ) {

    const userId =
      this.getUserId();

    if (
      !this.scores.has(
        gameId
      )
    ) {

      this.scores.set(
        gameId,
        []
      );

    }

    const list =
      this.scores.get(
        gameId
      );

    const existing =
      list.find(
        item =>
          item.userId ===
          userId
      );

    if (
      existing
    ) {

      if (
        score >
        existing.score
      ) {

        existing.score =
          score;

        existing.updatedAt =
          new Date().toISOString();

      }

    } else {

      list.push({

        userId,

        name:
          this.getUser().name ||
          "VORTEX Player",

        avatar:
          this.getUser().avatar ||
          "",

        score,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()

      });

    }

    list.sort(
      (
        a,
        b
      ) =>
        b.score -
        a.score
    );

    this.save();

    const xp =
      Math.max(
        5,
        Math.floor(
          score / 10
        )
      );

    this.addPoints(
      xp
    );

    this.checkAchievements(
      gameId,
      score
    );

    this.emit(
      "gameFinished",
      {
        gameId,
        score,
        xp
      }
    );

    const screen =
      document.getElementById(
        "vortexGameScreen"
      );

    if (screen) {

      const canvas =
        document.getElementById(
          "vortexGameCanvas"
        );

      canvas.innerHTML = `

        <div style="
          text-align:center;
        ">

          <div style="
            font-size:70px;
          ">
            🏆
          </div>

          <h1>
            GAME OVER
          </h1>

          <h2 style="
            color:#00d9ff;
            margin:15px;
          ">
            ${score} POINTS
          </h2>

          <p style="
            opacity:.7;
            margin-bottom:20px;
          ">
            +${xp} VORTEX XP
          </p>

          <button
            onclick="VortexGames.launch('${gameId}')"
            style="
              border:0;
              padding:13px 24px;
              border-radius:18px;
              background:#00d9ff;
              color:#001018;
              font-weight:800;
            "
          >
            PLAY AGAIN
          </button>

        </div>

      `;

    }

  },

  /* =======================================================
     SCOREBOARD
     ======================================================= */

  leaderboard(
    gameId,
    limit = 55
  ) {

    const list =
      this.scores.get(
        gameId
      ) ||
      [];

    return [
      ...list
    ]
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      )
      .slice(
        0,
        limit
      );

  },

  /* =======================================================
     PERSONAL BEST
     ======================================================= */

  personalBest(
    gameId
  ) {

    const userId =
      this.getUserId();

    const list =
      this.scores.get(
        gameId
      ) ||
      [];

    const item =
      list.find(
        score =>
          score.userId ===
          userId
      );

    return (
      item?.score ||
      0
    );

  },

  /* =======================================================
     POINTS
     ======================================================= */

  getPoints() {

    return Number(
      localStorage.getItem(
        "vortex_points"
      ) ||
      0
    );

  },

  addPoints(
    amount
  ) {

    amount =
      Math.max(
        0,
        Number(
          amount ||
          0
        )
      );

    const total =
      this.getPoints() +
      amount;

    localStorage.setItem(
      "vortex_points",
      String(
        total
      )
    );

    this.emit(
      "pointsChanged",
      {
        amount,
        total
      }
    );

    return total;

  },

  /* =======================================================
     ACHIEVEMENTS
     ======================================================= */

  checkAchievements(
    gameId,
    score
  ) {

    const userId =
      this.getUserId();

    const key =
      userId +
      "_" +
      gameId;

    let achievement =
      this.achievements.get(
        key
      );

    if (!achievement) {

      achievement = {

        userId,

        gameId,

        gamesPlayed: 1,

        highestScore:
          score,

        unlocked: []

      };

      this.achievements.set(
        key,
        achievement
      );

    } else {

      achievement.gamesPlayed++;

      achievement.highestScore =
        Math.max(
          achievement.highestScore,
          score
        );

    }

    if (
      achievement.gamesPlayed >=
      1 &&
      !achievement.unlocked.includes(
        "first-game"
      )
    ) {

      achievement.unlocked.push(
        "first-game"
      );

      this.addPoints(
        10
      );

      this.emit(
        "achievementUnlocked",
        {
          id:
            "first-game",
          gameId
        }
      );

    }

    if (
      achievement.gamesPlayed >=
      10 &&
      !achievement.unlocked.includes(
        "ten-games"
      )
    ) {

      achievement.unlocked.push(
        "ten-games"
      );

      this.addPoints(
        50
      );

      this.emit(
        "achievementUnlocked",
        {
          id:
            "ten-games",
          gameId
        }
      );

    }

    if (
      score >=
      500 &&
      !achievement.unlocked.includes(
        "high-score"
      )
    ) {

      achievement.unlocked.push(
        "high-score"
      );

      this.addPoints(
        100
      );

      this.emit(
        "achievementUnlocked",
        {
          id:
            "high-score",
          gameId
        }
      );

    }

    this.save();

  },

  /* =======================================================
     GET CATEGORIES
     ======================================================= */

  categories() {

    return [
      ...new Set(
        this.getAll().map(
          game =>
            game.category
        )
      )
    ];

  },

  /* =======================================================
     RENDER GAME CARD
     ======================================================= */

  renderCard(
    game
  ) {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "vortex-game-card";

    card.style.cssText = `

      position:relative;
      overflow:hidden;
      border-radius:20px;
      padding:18px;
      min-height:190px;
      background:
        linear-gradient(
          145deg,
          rgba(0,217,255,.12),
          rgba(139,77,255,.12)
        );
      border:
        1px solid
        rgba(0,217,255,.2);
      box-shadow:
        0 10px 35px
        rgba(0,0,0,.25);

    `;

    const best =
      this.personalBest(
        game.id
      );

    card.innerHTML = `

      <div style="
        font-size:45px;
      ">
        ${this.escape(
          game.icon
        )}
      </div>

      <h3 style="
        margin-top:8px;
      ">
        ${this.escape(
          game.name
        )}
      </h3>

      <p style="
        opacity:.6;
        font-size:12px;
        margin:6px 0;
      ">
        ${this.escape(
          game.description
        )}
      </p>

      <div style="
        display:flex;
        gap:6px;
        flex-wrap:wrap;
        font-size:10px;
        opacity:.65;
        margin:8px 0;
      ">

        <span>
          👥 ${this.escape(
            game.players
          )}
        </span>

        ${
          game.offline
            ? "<span>📴 Offline</span>"
            : ""
        }

        ${
          game.multiplayer
            ? "<span>🌐 Multiplayer</span>"
            : ""
        }

      </div>

      <div style="
        font-size:10px;
        opacity:.6;
        margin-bottom:8px;
      ">
        Personal best:
        ${best}
      </div>

      <button
        data-game-id="${this.escape(
          game.id
        )}"
        style="
          width:100%;
          border:0;
          padding:10px;
          border-radius:14px;
          background:
            linear-gradient(
              135deg,
              #00d9ff,
              #8b4dff
            );
          color:white;
          font-weight:800;
        "
      >
        PLAY
      </button>

    `;

    card
      .querySelector(
        "button"
      )
      .onclick = () => {

        this.launch(
          game.id
        );

      };

    return card;

  },

  /* =======================================================
     RENDER GAME LIBRARY
     ======================================================= */

  renderLibrary(
    container,
    options = {}
  ) {

    if (
      typeof container ===
      "string"
    ) {

      container =
        document.querySelector(
          container
        );

    }

    if (!container) {

      return;

    }

    container.innerHTML =
      "";

    const games =
      this.getAll(
        options
      );

    if (!games.length) {

      container.innerHTML = `

        <div style="
          text-align:center;
          padding:30px;
          opacity:.6;
        ">
          🎮 No games found.
        </div>

      `;

      return;

    }

    games.forEach(
      game => {

        container.appendChild(
          this.renderCard(
            game
          )
        );

      }
    );

  },

  /* =======================================================
     SAVE
     ======================================================= */

  save() {

    try {

      localStorage.setItem(
        "vortex_games",
        JSON.stringify(
          Object.fromEntries(
            this.games
          )
        )
      );

      localStorage.setItem(
        "vortex_game_scores",
        JSON.stringify(
          Object.fromEntries(
            this.scores
          )
        )
      );

      localStorage.setItem(
        "vortex_game_achievements",
        JSON.stringify(
          Object.fromEntries(
            this.achievements
          )
        )
      );

    } catch (
      error
    ) {

      console.warn(
        "VORTEX games save error:",
        error
      );

    }

  },

  /* =======================================================
     LOAD
     ======================================================= */

  load() {

    try {

      const games =
        JSON.parse(
          localStorage.getItem(
            "vortex_games"
          ) ||
          "{}"
        );

      Object.entries(
        games
      ).forEach(
        ([
          id,
          game
        ]) => {

          this.games.set(
            id,
            game
          );

        }
      );

      const scores =
        JSON.parse(
          localStorage.getItem(
            "vortex_game_scores"
          ) ||
          "{}"
        );

      Object.entries(
        scores
      ).forEach(
        ([
          id,
          list
        ]) => {

          this.scores.set(
            id,
            list
          );

        }
      );

      const achievements =
        JSON.parse(
          localStorage.getItem(
            "vortex_game_achievements"
          ) ||
          "{}"
        );

      Object.entries(
        achievements
      ).forEach(
        ([
          id,
          achievement
        ]) => {

          this.achievements.set(
            id,
            achievement
          );

        }
      );

    } catch (
      error
    ) {

      console.warn(
        "VORTEX games load error:",
        error
      );

    }

  },

  /* =======================================================
     ESCAPE HTML
     ======================================================= */

  escape(
    value
  ) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      String(
        value ??
        ""
      );

    return div.innerHTML;

  },

  /* =======================================================
     EVENTS
     ======================================================= */

  on(
    event,
    callback
  ) {

    if (
      !this.listeners[event]
    ) {

      this.listeners[event] =
        [];

    }

    this.listeners[event].push(
      callback
    );

    return () => {

      this.listeners[event] =
        this.listeners[event].filter(
          fn =>
            fn !==
            callback
        );

    };

  },

  emit(
    event,
    data
  ) {

    (
      this.listeners[event] ||
      []
    ).forEach(
      callback => {

        try {

          callback(
            data
          );

        } catch (
          error
        ) {

          console.error(
            "VORTEX Games event error:",
            error
          );

        }

      }
    );

  }

};


/* =========================================================
   GLOBAL
   ========================================================= */

window.VortexGames =
  VortexGames;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexGames.init();

  }
);
