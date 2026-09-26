/* =========================================
   VORTEX SOCIAL MEDIA
   Search.js
   Global Search Engine
   Users • Posts • Reels • Groups • Events
   Pages • Games • Hashtags • Marketplace
   ========================================= */

"use strict";

const VortexSearch = (() => {

  const VERSION = "1.0.0";
  const STORAGE_KEY = "vortex_search_history";
  const MAX_HISTORY = 30;

  const state = {
    initialized: false,
    query: "",
    loading: false,
    results: [],
    activeType: "all",
    lastSearch: null
  };

  const listeners = new Map();

  const TYPES = [
    "all",
    "users",
    "posts",
    "reels",
    "groups",
    "pages",
    "events",
    "games",
    "hashtags",
    "marketplace"
  ];

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
          "VortexSearch event error:",
          error
        );
      }
    });

    window.dispatchEvent(
      new CustomEvent(
        `vortex:search:${event}`,
        {
          detail: data
        }
      )
    );
  }

  /* =========================================
     HELPERS
     ========================================= */

  function clean(value) {
    return String(value ?? "").trim();
  }

  function normalize(value) {

    return clean(value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHTML(value) {

    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clone(value) {

    return JSON.parse(
      JSON.stringify(value)
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

  function createId() {

    return (
      "search_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );
  }

  /* =========================================
     STORAGE
     ========================================= */

  function loadHistory() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return [];
      }

      const history =
        JSON.parse(raw);

      return Array.isArray(history)
        ? history
        : [];

    } catch (error) {

      return [];
    }
  }

  function saveHistory(history) {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          history.slice(0, MAX_HISTORY)
        )
      );

    } catch (error) {

      console.error(
        "VortexSearch history error:",
        error
      );

    }
  }

  function addHistory(query) {

    query = clean(query);

    if (!query) {
      return;
    }

    let history =
      loadHistory();

    history =
      history.filter(
        item =>
          normalize(item) !==
          normalize(query)
      );

    history.unshift(query);

    saveHistory(history);
  }

  function removeHistory(query) {

    let history =
      loadHistory();

    history =
      history.filter(
        item =>
          normalize(item) !==
          normalize(query)
      );

    saveHistory(history);

    emit("historyChanged", {
      history
    });
  }

  function clearHistory() {

    saveHistory([]);

    emit("historyChanged", {
      history: []
    });
  }

  function getHistory() {
    return loadHistory();
  }

  /* =========================================
     INDEXING
     ========================================= */

  function getCollection(type) {

    switch (type) {

      case "users":

        return getUsers();

      case "posts":

        return getPosts();

      case "reels":

        return getReels();

      case "groups":

        return getGroups();

      case "pages":

        return getPages();

      case "events":

        return getEvents();

      case "games":

        return getGames();

      case "hashtags":

        return getHashtags();

      case "marketplace":

        return getMarketplace();

      default:

        return [];
    }
  }

  function getUsers() {

    try {

      if (
        window.VortexUser?.getAll
      ) {
        return window.VortexUser.getAll();
      }

    } catch (error) {}

    return [];
  }

  function getPosts() {

    const sources = [
      window.VortexPosts,
      window.VortexFeed
    ];

    for (const source of sources) {

      if (
        source?.getAll
      ) {

        try {
          const result =
            source.getAll();

          if (
            Array.isArray(result)
          ) {
            return result;
          }

        } catch (error) {}
      }

      if (
        source?.getPosts
      ) {

        try {
          const result =
            source.getPosts();

          if (
            Array.isArray(result)
          ) {
            return result;
          }

        } catch (error) {}
      }
    }

    return [];
  }

  function getReels() {

    const source =
      window.VortexReels;

    if (
      source?.getAll
    ) {

      try {

        const result =
          source.getAll();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    return [];
  }

  function getGroups() {

    const source =
      window.VortexGroups;

    if (
      source?.getAll
    ) {

      try {

        const result =
          source.getAll();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    return [];
  }

  function getPages() {

    const source =
      window.VortexPages;

    if (
      source?.getAll
    ) {

      try {

        const result =
          source.getAll();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    return [];
  }

  function getEvents() {

    const source =
      window.VortexEvents;

    if (
      source?.getAll
    ) {

      try {

        const result =
          source.getAll();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    if (
      source?.getUpcoming
    ) {

      try {

        const result =
          source.getUpcoming();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    return [];
  }

  function getGames() {

    const source =
      window.VortexGames;

    if (
      source?.getAll
    ) {

      try {

        const result =
          source.getAll();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    if (
      source?.search
    ) {
      return [];
    }

    return [];
  }

  function getMarketplace() {

    const source =
      window.VortexMarketplace;

    if (
      source?.getAll
    ) {

      try {

        const result =
          source.getAll();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    if (
      source?.getListings
    ) {

      try {

        const result =
          source.getListings();

        return Array.isArray(result)
          ? result
          : [];

      } catch (error) {}
    }

    return [];
  }

  /* =========================================
     HASHTAG INDEX
     ========================================= */

  function extractHashtags(text) {

    const matches =
      clean(text).match(
        /#[a-zA-Z0-9_]+/g
      );

    return matches
      ? matches.map(
          tag =>
            tag
              .slice(1)
              .toLowerCase()
        )
      : [];
  }

  function getHashtags() {

    const map =
      new Map();

    const sources = [
      ...getPosts(),
      ...getReels()
    ];

    sources.forEach(item => {

      const text = [
        item.text,
        item.caption,
        item.description,
        item.title
      ].join(" ");

      extractHashtags(
        text
      ).forEach(tag => {

        if (!map.has(tag)) {
          map.set(tag, {
            id: tag,
            name: tag,
            count: 0,
            type: "hashtag"
          });
        }

        map.get(tag).count++;
      });

    });

    return Array.from(
      map.values()
    );
  }

  /* =========================================
     SEARCH SCORING
     ========================================= */

  function scoreItem(
    item,
    query,
    type
  ) {

    const q =
      normalize(query);

    if (!q) {
      return 0;
    }

    const values = [];

    if (type === "users") {

      values.push(
        item.username,
        item.name,
        item.firstName,
        item.lastName,
        item.bio,
        item.location
      );

    } else if (
      type === "posts" ||
      type === "reels"
    ) {

      values.push(
        item.text,
        item.caption,
        item.description,
        item.title,
        item.username,
        item.authorName
      );

    } else {

      values.push(
        item.name,
        item.title,
        item.description,
        item.bio,
        item.location,
        item.category,
        item.username
      );
    }

    const text =
      values
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (!text.includes(q)) {
      return 0;
    }

    let score = 10;

    const name =
      normalize(
        item.name ||
        item.title ||
        item.username
      );

    const username =
      normalize(
        item.username
      );

    if (
      name === q
    ) {
      score += 100;
    }

    if (
      username === q
    ) {
      score += 120;
    }

    if (
      name.startsWith(q)
    ) {
      score += 60;
    }

    if (
      username.startsWith(q)
    ) {
      score += 70;
    }

    if (
      name.includes(q)
    ) {
      score += 35;
    }

    if (
      username.includes(q)
    ) {
      score += 40;
    }

    if (
      clean(item.verified) ===
      "true" ||
      item.verified === true
    ) {
      score += 5;
    }

    if (
      Number(item.likes) > 0
    ) {
      score += Math.min(
        10,
        Number(item.likes) / 100
      );
    }

    return score;
  }

  /* =========================================
     NORMALIZE RESULT
     ========================================= */

  function normalizeResult(
    item,
    type,
    score
  ) {

    return {

      id:
        item.id ||
        item._id ||
        createId(),

      type,

      score,

      title:
        item.name ||
        item.title ||
        item.username ||
        "VORTEX Result",

      username:
        item.username ||
        "",

      description:
        item.bio ||
        item.description ||
        item.caption ||
        item.text ||
        "",

      avatar:
        item.avatar ||
        item.image ||
        item.thumbnail ||
        "",

      cover:
        item.cover ||
        item.coverImage ||
        "",

      verified:
        Boolean(item.verified),

      online:
        Boolean(item.online),

      original:
        clone(item)
    };
  }

  /* =========================================
     SEARCH ONE TYPE
     ========================================= */

  function searchType(
    query,
    type,
    limit = 30
  ) {

    const collection =
      getCollection(type);

    const results = [];

    collection.forEach(item => {

      const score =
        scoreItem(
          item,
          query,
          type
        );

      if (score > 0) {

        results.push(
          normalizeResult(
            item,
            type,
            score
          )
        );
      }

    });

    return results
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, limit);
  }

  /* =========================================
     GLOBAL SEARCH
     ========================================= */

  function search(
    query,
    options = {}
  ) {

    init();

    query =
      clean(query);

    state.query =
      query;

    state.activeType =
      options.type ||
      "all";

    if (!query) {

      state.results = [];

      emit("cleared");

      return [];
    }

    state.loading = true;

    emit("searching", {
      query,
      type: state.activeType
    });

    const limit =
      Number(
        options.limit || 50
      );

    let results = [];

    if (
      state.activeType ===
      "all"
    ) {

      const perType =
        Math.max(
          5,
          Math.ceil(
            limit / 4
          )
        );

      TYPES
        .filter(
          type =>
            type !== "all"
        )
        .forEach(type => {

          results.push(
            ...searchType(
              query,
              type,
              perType
            )
          );

        });

    } else {

      results =
        searchType(
          query,
          state.activeType,
          limit
        );
    }

    results =
      results
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .slice(0, limit);

    state.results =
      results;

    state.loading =
      false;

    state.lastSearch =
      Date.now();

    addHistory(query);

    emit("results", {
      query,
      type: state.activeType,
      results:
        clone(results)
    });

    return clone(results);
  }

  /* =========================================
     SUGGESTIONS
     ========================================= */

  function suggestions(
    query = ""
  ) {

    query =
      normalize(query);

    if (!query) {

      return getHistory()
        .slice(0, 8)
        .map(item => ({
          type: "history",
          value: item
        }));
    }

    const suggestions = [];

    getUsers()
      .forEach(user => {

        const username =
          normalize(
            user.username
          );

        const name =
          normalize(
            user.name
          );

        if (
          username.startsWith(query) ||
          name.startsWith(query)
        ) {

          suggestions.push({
            type: "user",
            value:
              user.username,
            title:
              user.name,
            avatar:
              user.avatar || "",
            verified:
              Boolean(user.verified)
          });

        }

      });

    getHashtags()
      .filter(
        tag =>
          normalize(tag.name)
            .startsWith(query)
      )
      .slice(0, 10)
      .forEach(tag => {

        suggestions.push({
          type: "hashtag",
          value:
            `#${tag.name}`,
          title:
            `${tag.count} posts`
        });

      });

    return suggestions.slice(
      0,
      12
    );
  }

  /* =========================================
     TRENDING SEARCHES
     ========================================= */

  function trending() {

    const history =
      getHistory();

    const counts =
      new Map();

    history.forEach(query => {

      const key =
        normalize(query);

      counts.set(
        key,
        (counts.get(key) || 0) + 1
      );

    });

    return Array.from(
      counts.entries()
    )
      .map(
        ([query, count]) => ({
          query,
          count
        })
      )
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 10);
  }

  /* =========================================
     FILTER
     ========================================= */

  function filter(
    type
  ) {

    if (
      !TYPES.includes(type)
    ) {
      type = "all";
    }

    state.activeType =
      type;

    if (!state.query) {
      return [];
    }

    return search(
      state.query,
      {
        type
      }
    );
  }

  /* =========================================
     QUICK SEARCH
     ========================================= */

  function findUser(
    username
  ) {

    const user =
      window.VortexUser
        ?.getByUsername?.(
          username
        );

    return user || null;
  }

  function findHashtag(
    hashtag
  ) {

    const target =
      normalize(
        hashtag
          .replace(/^#/, "")
      );

    return getHashtags()
      .find(
        tag =>
          normalize(tag.name) ===
          target
      ) || null;
  }

  function find(
    query
  ) {

    return search(
      query,
      {
        type: "all",
        limit: 1
      }
    )[0] || null;
  }

  /* =========================================
     RECENT SEARCHES
     ========================================= */

  function recent(limit = 10) {

    return getHistory()
      .slice(0, limit);
  }

  /* =========================================
     RENDER RESULT
     ========================================= */

  function renderResult(
    result
  ) {

    if (!result) {
      return "";
    }

    let icon = "🔎";

    switch (result.type) {

      case "users":
        icon = "👤";
        break;

      case "posts":
        icon = "📝";
        break;

      case "reels":
        icon = "🎬";
        break;

      case "groups":
        icon = "👥";
        break;

      case "pages":
        icon = "📄";
        break;

      case "events":
        icon = "📅";
        break;

      case "games":
        icon = "🎮";
        break;

      case "hashtags":
        icon = "#";
        break;

      case "marketplace":
        icon = "🛍️";
        break;
    }

    const avatar =
      result.avatar
        ? `
          <img
            src="${escapeHTML(
              result.avatar
            )}"
            alt=""
            class="vortex-search-avatar"
          >
        `
        : `
          <div class="vortex-search-avatar vortex-search-icon">
            ${icon}
          </div>
        `;

    return `
      <article
        class="vortex-search-result"
        data-search-id="${escapeHTML(
          result.id
        )}"
        data-search-type="${escapeHTML(
          result.type
        )}"
      >

        ${avatar}

        <div class="vortex-search-result-info">

          <div class="vortex-search-result-title">

            <strong>
              ${escapeHTML(
                result.title
              )}
            </strong>

            ${
              result.verified
                ? `
                  <span
                    class="vortex-search-verified"
                  >
                    ✓
                  </span>
                `
                : ""
            }

          </div>

          ${
            result.username
              ? `
                <span
                  class="vortex-search-username"
                >
                  @${escapeHTML(
                    result.username
                  )}
                </span>
              `
              : ""
          }

          ${
            result.description
              ? `
                <p>
                  ${escapeHTML(
                    result.description
                  )}
                </p>
              `
              : ""
          }

        </div>

        <span class="vortex-search-type">
          ${escapeHTML(
            result.type
          )}
        </span>

      </article>
    `;
  }

  /* =========================================
     RENDER RESULTS
     ========================================= */

  function renderResults(
    results = state.results
  ) {

    if (!results.length) {

      return `
        <div class="vortex-search-empty">

          <div class="vortex-search-empty-icon">
            🔍
          </div>

          <strong>
            No results found
          </strong>

          <p>
            Try another name, username,
            hashtag or keyword.
          </p>

        </div>
      `;
    }

    return `
      <div class="vortex-search-results">

        ${results
          .map(renderResult)
          .join("")}

      </div>
    `;
  }

  /* =========================================
     RENDER SUGGESTIONS
     ========================================= */

  function renderSuggestions(
    query = ""
  ) {

    const list =
      suggestions(query);

    if (!list.length) {
      return "";
    }

    return `
      <div class="vortex-search-suggestions">

        ${list.map(item => {

          if (
            item.type ===
            "history"
          ) {

            return `
              <button
                type="button"
                class="vortex-search-suggestion"
                data-query="${escapeHTML(
                  item.value
                )}"
              >
                <span>🕘</span>
                <span>
                  ${escapeHTML(
                    item.value
                  )}
                </span>
              </button>
            `;
          }

          if (
            item.type ===
            "hashtag"
          ) {

            return `
              <button
                type="button"
                class="vortex-search-suggestion"
                data-query="${escapeHTML(
                  item.value
                )}"
              >
                <span>#</span>
                <span>
                  ${escapeHTML(
                    item.value
                  )}
                </span>
                <small>
                  ${escapeHTML(
                    item.title
                  )}
                </small>
              </button>
            `;
          }

          return `
            <button
              type="button"
              class="vortex-search-suggestion"
              data-query="${escapeHTML(
                item.value
              )}"
            >

              ${
                item.avatar
                  ? `
                    <img
                      src="${escapeHTML(
                        item.avatar
                      )}"
                      alt=""
                    >
                  `
                  : `<span>👤</span>`
              }

              <span>
                ${escapeHTML(
                  item.title ||
                  item.value
                )}
              </span>

              ${
                item.verified
                  ? `<b>✓</b>`
                  : ""
              }

            </button>
          `;

        }).join("")}

      </div>
    `;
  }

  /* =========================================
     SEARCH UI
     ========================================= */

  function render(
    container,
    options = {}
  ) {

    if (!container) {
      return false;
    }

    const placeholder =
      options.placeholder ||
      "Search VORTEX...";

    container.innerHTML = `

      <div class="vortex-search-box">

        <div class="vortex-search-input-wrap">

          <span class="vortex-search-icon-left">
            🔍
          </span>

          <input
            type="search"
            class="vortex-search-input"
            placeholder="${escapeHTML(
              placeholder
            )}"
            value="${escapeHTML(
              state.query
            )}"
            autocomplete="off"
          >

          <button
            type="button"
            class="vortex-search-clear"
            aria-label="Clear search"
          >
            ×
          </button>

        </div>

        <div class="vortex-search-tabs">

          ${TYPES.map(
            type => `
              <button
                type="button"
                class="
                  vortex-search-tab
                  ${
                    state.activeType ===
                    type
                      ? "active"
                      : ""
                  }
                "
                data-search-type="${type}"
              >
                ${formatType(
                  type
                )}
              </button>
            `
          ).join("")}

        </div>

        <div class="vortex-search-live"></div>

      </div>
    `;

    bind(container);

    updateRenderedResults(
      container
    );

    return true;
  }

  function bind(container) {

    const input =
      container.querySelector(
        ".vortex-search-input"
      );

    const clear =
      container.querySelector(
        ".vortex-search-clear"
      );

    const live =
      container.querySelector(
        ".vortex-search-live"
      );

    let timer;

    input?.addEventListener(
      "input",
      () => {

        clearTimeout(timer);

        const query =
          input.value;

        live.innerHTML =
          renderSuggestions(
            query
          );

        timer =
          setTimeout(
            () => {

              if (
                clean(query)
              ) {

                search(
                  query,
                  {
                    type:
                      state.activeType
                  }
                );

                updateRenderedResults(
                  container
                );

              }

            },
            250
          );

      }
    );

    input?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          search(
            input.value,
            {
              type:
                state.activeType
            }
          );

          updateRenderedResults(
            container
          );

        }

        if (
          event.key ===
          "Escape"
        ) {

          input.value = "";

          live.innerHTML = "";

        }

      }
    );

    clear?.addEventListener(
      "click",
      () => {

        input.value = "";

        state.query = "";

        state.results = [];

        live.innerHTML = "";

        updateRenderedResults(
          container
        );

        input.focus();

      }
    );

    container
      .querySelectorAll(
        ".vortex-search-tab"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const type =
              button.dataset
                .searchType;

            filter(type);

            container
              .querySelectorAll(
                ".vortex-search-tab"
              )
              .forEach(tab => {

                tab.classList.toggle(
                  "active",
                  tab === button
                );

              });

            updateRenderedResults(
              container
            );

          }
        );

      });

    container.addEventListener(
      "click",
      event => {

        const suggestion =
          event.target.closest(
            ".vortex-search-suggestion"
          );

        if (
          suggestion
        ) {

          const query =
            suggestion.dataset.query;

          input.value =
            query;

          search(
            query.replace(
              /^#/,
              ""
            ),
            {
              type:
                state.activeType
            }
          );

          live.innerHTML = "";

          updateRenderedResults(
            container
          );

          return;
        }

        const result =
          event.target.closest(
            ".vortex-search-result"
          );

        if (
          result
        ) {

          const resultId =
            result.dataset.searchId;

          const resultType =
            result.dataset.searchType;

          openResult(
            resultId,
            resultType
          );
        }

      }
    );
  }

  function updateRenderedResults(
    container
  ) {

    const target =
      container.querySelector(
        ".vortex-search-live"
      );

    if (!target) {
      return;
    }

    target.innerHTML =
      renderResults(
        state.results
      );
  }

  /* =========================================
     OPEN RESULT
     ========================================= */

  function openResult(
    id,
    type
  ) {

    const result =
      state.results.find(
        item =>
          String(item.id) ===
          String(id) &&
          item.type === type
      );

    if (!result) {
      return null;
    }

    emit("open", {
      result:
        clone(result)
    });

    window.dispatchEvent(
      new CustomEvent(
        "vortex:navigate",
        {
          detail: {
            type,
            id,
            data:
              clone(result.original)
          }
        }
      )
    );

    return result;
  }

  /* =========================================
     TYPE LABELS
     ========================================= */

  function formatType(type) {

    if (type === "all") {
      return "All";
    }

    return type
      .charAt(0)
      .toUpperCase() +
      type.slice(1);
  }

  /* =========================================
     INIT
     ========================================= */

  function init() {

    if (state.initialized) {
      return api;
    }

    state.initialized = true;

    emit("initialized");

    return api;
  }

  /* =========================================
     API
     ========================================= */

  const api = {

    VERSION,

    TYPES,

    state,

    on,

    emit,

    init,

    search,

    searchType,

    suggestions,

    trending,

    filter,

    find,

    findUser,

    findHashtag,

    recent,

    getHistory,

    addHistory,

    removeHistory,

    clearHistory,

    getUsers,

    getPosts,

    getReels,

    getGroups,

    getPages,

    getEvents,

    getGames,

    getMarketplace,

    getHashtags,

    extractHashtags,

    render,

    renderResult,

    renderResults,

    renderSuggestions,

    openResult
  };

  /* =========================================
     STARTUP
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

      },
      { once: true }
    );

  } else {

    init();
    injectStyles();

  }

  /* =========================================
     CSS
     ========================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "vortex-search-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "vortex-search-styles";

    style.textContent = `

      .vortex-search-box {
        width:100%;
        position:relative;
      }

      .vortex-search-input-wrap {
        position:relative;
        display:flex;
        align-items:center;
      }

      .vortex-search-input {
        width:100%;
        height:50px;
        padding:0 45px;
        border:1px solid
          rgba(255,255,255,.08);
        border-radius:16px;
        outline:none;
        color:#fff;
        background:
          rgba(255,255,255,.055);
        font-size:15px;
        transition:.2s ease;
        box-sizing:border-box;
      }

      .vortex-search-input:focus {
        border-color:
          rgba(0,217,255,.45);
        box-shadow:
          0 0 25px
          rgba(0,217,255,.08);
      }

      .vortex-search-icon-left {
        position:absolute;
        left:16px;
        z-index:2;
        pointer-events:none;
        opacity:.7;
      }

      .vortex-search-clear {
        position:absolute;
        right:9px;
        width:34px;
        height:34px;
        border:0;
        border-radius:50%;
        color:#a7b1bf;
        background:
          rgba(255,255,255,.06);
        cursor:pointer;
        font-size:20px;
      }

      .vortex-search-tabs {
        display:flex;
        gap:7px;
        overflow-x:auto;
        padding:12px 2px;
        scrollbar-width:none;
      }

      .vortex-search-tabs::-webkit-scrollbar {
        display:none;
      }

      .vortex-search-tab {
        flex:none;
        padding:8px 14px;
        border:1px solid
          rgba(255,255,255,.07);
        border-radius:999px;
        background:
          rgba(255,255,255,.035);
        color:#8e9aaa;
        cursor:pointer;
        transition:.2s ease;
      }

      .vortex-search-tab.active {
        color:#fff;
        border-color:
          rgba(0,217,255,.35);
        background:
          linear-gradient(
            135deg,
            rgba(0,217,255,.16),
            rgba(139,77,255,.15)
          );
        box-shadow:
          0 0 18px
          rgba(0,217,255,.08);
      }

      .vortex-search-suggestions {
        position:relative;
        z-index:20;
        padding:5px;
        margin-bottom:10px;
        border-radius:16px;
        background:#0a0e1b;
        border:1px solid
          rgba(255,255,255,.08);
        box-shadow:
          0 20px 50px
          rgba(0,0,0,.4);
      }

      .vortex-search-suggestion {
        width:100%;
        display:flex;
        align-items:center;
        gap:10px;
        padding:10px;
        border:0;
        border-radius:11px;
        background:transparent;
        color:#fff;
        text-align:left;
        cursor:pointer;
      }

      .vortex-search-suggestion:hover {
        background:
          rgba(255,255,255,.06);
      }

      .vortex-search-suggestion img {
        width:32px;
        height:32px;
        border-radius:50%;
        object-fit:cover;
      }

      .vortex-search-suggestion small {
        margin-left:auto;
        color:#6f7c8d;
      }

      .vortex-search-suggestion b {
        color:#00cfff;
      }

      .vortex-search-results {
        display:grid;
        gap:8px;
      }

      .vortex-search-result {
        display:flex;
        align-items:center;
        gap:12px;
        padding:13px;
        border-radius:17px;
        background:
          rgba(255,255,255,.035);
        border:1px solid
          rgba(255,255,255,.06);
        cursor:pointer;
        transition:.2s ease;
      }

      .vortex-search-result:hover {
        transform:translateY(-1px);
        border-color:
          rgba(0,217,255,.25);
        background:
          rgba(0,217,255,.045);
      }

      .vortex-search-avatar {
        width:48px;
        height:48px;
        flex:none;
        border-radius:15px;
        object-fit:cover;
      }

      .vortex-search-icon {
        display:flex;
        align-items:center;
        justify-content:center;
        background:
          linear-gradient(
            135deg,
            rgba(0,217,255,.16),
            rgba(139,77,255,.16)
          );
        font-size:20px;
      }

      .vortex-search-result-info {
        min-width:0;
        flex:1;
      }

      .vortex-search-result-title {
        display:flex;
        align-items:center;
        gap:6px;
      }

      .vortex-search-result-title strong {
        color:#fff;
        font-size:15px;
      }

      .vortex-search-verified {
        width:17px;
        height:17px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        color:#fff;
        background:#00bfff;
        font-size:10px;
        font-weight:900;
      }

      .vortex-search-username {
        display:block;
        margin-top:2px;
        color:#738094;
        font-size:12px;
      }

      .vortex-search-result p {
        margin:5px 0 0;
        color:#8c98a8;
        font-size:12px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      .vortex-search-type {
        flex:none;
        color:#647185;
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.7px;
      }

      .vortex-search-empty {
        padding:45px 20px;
        text-align:center;
        color:#8995a5;
      }

      .vortex-search-empty-icon {
        font-size:42px;
        margin-bottom:10px;
        opacity:.7;
      }

      .vortex-search-empty strong {
        display:block;
        color:#fff;
        font-size:16px;
      }

      .vortex-search-empty p {
        margin:7px 0 0;
        font-size:13px;
      }

      @media(max-width:600px) {

        .vortex-search-type {
          display:none;
        }

        .vortex-search-tab {
          padding:7px 11px;
          font-size:12px;
        }

      }

    `;

    document.head.appendChild(style);
  }

  return api;

})();

/* =========================================
   GLOBAL
   ========================================= */

window.VortexSearch =
  VortexSearch;
