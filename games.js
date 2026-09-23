/* VORTEX GAMES ENGINE
   Handles games, XP, levels,
   game launching and rewards.
*/


/* =========================
   GAME DATA
========================= */

const VORTEX_GAMES = [
  {
    id: "chess",
    name: "Chess",
    icon: "♟️",
    category: "Strategy",
    description: "Challenge your mind with classic strategy.",
    xp: 20
  },

  {
    id: "snooker",
    name: "Snooker",
    icon: "🎱",
    category: "Sports",
    description: "Test your precision and control.",
    xp: 20
  },

  {
    id: "racing",
    name: "Vortex Racing",
    icon: "🏎️",
    category: "Racing",
    description: "Enter the VORTEX and race to the finish.",
    xp: 30
  },

  {
    id: "puzzle",
    name: "Puzzle",
    icon: "🧩",
    category: "Puzzle",
    description: "Solve challenging puzzles and earn XP.",
    xp: 15
  },

  {
    id: "arcade",
    name: "Vortex Arcade",
    icon: "🕹️",
    category: "Arcade",
    description: "Quick futuristic arcade challenges.",
    xp: 15
  },

  {
    id: "space",
    name: "Vortex Space",
    icon: "🚀",
    category: "Adventure",
    description: "Explore the beginning of the VORTEX galaxy.",
    xp: 30
  }
];


/* =========================
   GET GAME DATA
========================= */

function getGame(id) {

  return VORTEX_GAMES.find(
    game => game.id === id
  );

}


/* =========================
   RENDER GAMES
========================= */

function renderGames() {

  const box =
    document.getElementById(
      "gameList"
    );

  if (!box) return;


  box.innerHTML =
    VORTEX_GAMES
      .map(gameCard)
      .join("");

}


/* =========================
   GAME CARD
========================= */

function gameCard(game) {

  return `
    <article
      class="feature gameCard"
      data-game="${escapeHTML(game.id)}"
      data-search="${escapeHTML(
        `${game.name} ${game.category} ${game.description}`
      ).toLowerCase()}"
    >

      <div class="featureIcon">
        ${game.icon}
      </div>

      <div class="grow">

        <span class="eyebrow">
          ${escapeHTML(game.category)}
        </span>

        <h3>
          ${escapeHTML(game.name)}
        </h3>

        <p class="muted">
          ${escapeHTML(game.description)}
        </p>

      </div>

      <div class="gameReward">
        +${game.xp} XP
      </div>

      <button
        class="btn primary"
        onclick="launchGame('${escapeHTML(game.id)}')"
      >
        Play
      </button>

    </article>
  `;
}


/* =========================
   LAUNCH GAME
========================= */

function launchGame(id) {

  const game =
    getGame(id);

  if (!game) {

    /*
      Keep compatibility with older
      calls that may pass a game name.
    */

    const fallback =
      VORTEX_GAMES.find(
        item =>
          item.name.toLowerCase() ===
          String(id).toLowerCase()
      );

    if (fallback) {
      launchGame(fallback.id);
      return;
    }

    toast(
      "Game could not be opened."
    );

    return;
  }


  showModal(
    game.name,
    `
      <div class="gameLaunch">

        <div class="gameLaunchIcon">
          ${game.icon}
        </div>

        <span class="eyebrow">
          ${escapeHTML(game.category)}
        </span>

        <h2>
          ${escapeHTML(game.name)}
        </h2>

        <p class="muted">
          ${escapeHTML(game.description)}
        </p>

        <div class="gameRewardBox">

          <span>
            Reward
          </span>

          <strong>
            +${game.xp} XP
          </strong>

        </div>

        <button
          class="btn primary"
          onclick="gamePlay('${escapeHTML(game.id)}')"
        >
          Start Game
        </button>

      </div>
    `
  );

}


/* =========================
   START GAME
========================= */

function gamePlay(id) {

  const game =
    getGame(id);


  if (!game) return;


  /*
    For the MVP, the actual games can
    be integrated independently later.
    Starting a game currently gives XP
    and opens the game-ready state.
  */

  awardGameXP(
    game.xp
  );


  hideModal();


  toast(
    `${game.name} started! +${game.xp} XP 🎮`
  );


  /*
    Later this function can launch
    a real game engine, WebGL scene,
    multiplayer room, or external
    game module.
  */

}


/* =========================
   XP SYSTEM
========================= */

function getXP() {

  return safeNumber(
    get(
      STORE.xp,
      0
    )
  );

}


function setXP(value) {

  const xp =
    Math.max(
      0,
      safeNumber(value)
    );


  set(
    STORE.xp,
    xp
  );


  updateXP();

  updateGameLevel();

}


/* =========================
   AWARD XP
========================= */

function awardGameXP(amount) {

  const current =
    getXP();


  setXP(
    current +
    safeNumber(amount)
  );

}


/* =========================
   GAME LEVEL
========================= */

function getGameLevel() {

  return Math.floor(
    getXP() / 100
  ) + 1;

}


/* =========================
   LEVEL PROGRESS
========================= */

function getLevelProgress() {

  const xp =
    getXP();

  return xp % 100;

}


/* =========================
   UPDATE XP UI
========================= */

function updateXP() {

  const xp =
    getXP();


  const value =
    document.getElementById(
      "xpValue"
    );

  const bar =
    document.getElementById(
      "xpBar"
    );


  if (value) {

    value.textContent =
      formatNumber(xp);

  }


  if (bar) {

    bar.style.width =
      `${getLevelProgress()}%`;

  }

}


/* =========================
   UPDATE LEVEL UI
========================= */

function updateGameLevel() {

  const level =
    getGameLevel();


  const progress =
    getLevelProgress();


  setText(
    "#gameLevel",
    `Level ${level}`
  );


  setText(
    "#gameXP",
    `${progress}/100 XP`
  );


  const levelBar =
    document.getElementById(
      "gameLevelBar"
    );


  if (levelBar) {

    levelBar.style.width =
      `${progress}%`;

  }

}


/* =========================
   GAME FILTER
========================= */

function filterGames(value) {

  const query =
    String(value || "")
      .trim()
      .toLowerCase();


  document
    .querySelectorAll(
      ".gameCard"
    )
    .forEach(card => {

      const search =
        card.dataset.search ||
        "";


      card.style.display =
        !query ||
        search.includes(query)
          ? ""
          : "none";

    });

}


/* =========================
   GAME CATEGORY FILTER
========================= */

function filterGameCategory(category) {

  const selected =
    String(category || "")
      .trim()
      .toLowerCase();


  document
    .querySelectorAll(
      ".gameCard"
    )
    .forEach(card => {

      const game =
        getGame(
          card.dataset.game
        );


      if (!game) return;


      card.style.display =
        !selected ||
        game.category.toLowerCase() ===
          selected
          ? ""
          : "none";

    });

}


/* =========================
   RANDOM GAME
========================= */

function randomGame() {

  if (!VORTEX_GAMES.length) {
    return;
  }


  const index =
    Math.floor(
      Math.random() *
      VORTEX_GAMES.length
    );


  const game =
    VORTEX_GAMES[index];


  launchGame(
    game.id
  );

}


/* =========================
   GAME SEARCH MODAL
========================= */

function openGameSearch() {

  showModal(
    "Find a Game",
    `
      <div class="gameSearch">

        <input
          id="gameSearchInput"
          placeholder="Search games..."
          oninput="filterGameModal(this.value)"
          autofocus
        >

        <div
          id="gameSearchResults"
          class="featureGrid"
          style="margin-top:18px"
        >
          ${VORTEX_GAMES
            .map(gameCard)
            .join("")}
        </div>

      </div>
    `
  );

}


/* =========================
   MODAL GAME FILTER
