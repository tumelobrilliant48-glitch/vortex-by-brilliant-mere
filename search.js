/* VORTEX SEARCH ENGINE
   Handles global search, Explore
   filtering and search result rendering.
*/


/* =========================
   FEATURE SEARCH INDEX
========================= */

const VORTEX_SEARCH_FEATURES = [

  {
    icon: "👤",
    name: "Profile",
    keywords: "profile people user account",
    page: "profile"
  },

  {
    icon: "👥",
    name: "VORTEX Groups",
    keywords: "groups community communities",
    page: "groups"
  },

  {
    icon: "📄",
    name: "VORTEX Pages",
    keywords: "pages creators brands",
    page: "pages"
  },

  {
    icon: "🎮",
    name: "VORTEX Games",
    keywords: "games gaming play gamers",
    page: "games"
  },

  {
    icon: "🏆",
    name: "Challenges",
    keywords: "challenge challenges competition",
    page: "challenges"
  },

  {
    icon: "📅",
    name: "Events",
    keywords: "event events meetup",
    page: "events"
  },

  {
    icon: "🛍️",
    name: "Marketplace",
    keywords: "market marketplace products shopping buy sell",
    page: "marketplace"
  },

  {
    icon: "🤖",
    name: "Vortex AI",
    keywords: "ai artificial intelligence assistant",
    page: "ai"
  },

  {
    icon: "💼",
    name: "Jobs",
    keywords: "job jobs work career careers",
    page: "jobs"
  },

  {
    icon: "🎬",
    name: "VORTEX Reels",
    keywords: "reels videos short video",
    page: "reels"
  },

  {
    icon: "📺",
    name: "VORTEX Watch",
    keywords: "watch videos entertainment",
    page: "watch"
  },

  {
    icon: "🔴",
    name: "VORTEX Live",
    keywords: "live livestream streaming broadcast",
    page: "live"
  },

  {
    icon: "💎",
    name: "VORTEX Premium",
    keywords: "premium subscription vip",
    page: "premium"
  },

  {
    icon: "🔖",
    name: "Saved",
    keywords: "saved bookmarks posts",
    page: "saved"
  },

  {
    icon: "🧠",
    name: "Memories",
    keywords: "memories memory history",
    page: "memories"
  },

  {
    icon: "🤝",
    name: "Fundraisers",
    keywords: "fundraiser fundraising donations support",
    page: "fundraisers"
  },

  {
    icon: "❤️",
    name: "Dating",
    keywords: "dating connections people",
    page: "dating"
  },

  {
    icon: "🌤️",
    name: "Weather",
    keywords: "weather temperature forecast",
    page: "weather"
  },

  {
    icon: "⚙️",
    name: "Settings",
    keywords: "settings preferences account",
    page: "settings"
  }

];


/* =========================
   GLOBAL SEARCH
========================= */

function globalSearch() {

  const input =
    document.getElementById(
      "globalSearch"
    );

  const box =
    document.getElementById(
      "searchResults"
    );


  if (!input || !box) {
    return;
  }


  const query =
    input.value
      .trim()
      .toLowerCase();


  if (!query) {

    renderSearchEmptyState(box);

    return;
  }


  const results = [];


  /*
    Search posts.
  */

  getPosts()
    .forEach(post => {

      const text =
        String(
          post.text || ""
        ).toLowerCase();

      const author =
        String(
          post.author || ""
        ).toLowerCase();

      const username =
        String(
          post.username || ""
        ).toLowerCase();


      if (
        text.includes(query) ||
        author.includes(query) ||
        username.includes(query)
      ) {

        results.push({
          type: "post",
          data: post
        });

      }

    });


  /*
    Search VORTEX features.
  */

  VORTEX_SEARCH_FEATURES
    .forEach(feature => {

      const searchable =
        `${feature.name} ${feature.keywords}`
          .toLowerCase();


      if (
        searchable.includes(query)
      ) {

        results.push({
          type: "feature",
          data: feature
        });

      }

    });


  /*
    Search Marketplace.
  */

  if (
    typeof getMarketplace ===
    "function"
  ) {

    getMarketplace()
      .forEach(item => {

        const searchable =
          `${item.name} ${item.category} ${item.location}`
            .toLowerCase();


        if (
          searchable.includes(query)
        ) {

          results.push({
            type: "market",
            data: item
          });

        }

      });

  }


  renderSearchResults(
    box,
    results
  );
}


/* =========================
   EMPTY SEARCH
========================= */

function renderSearchEmptyState(
  box
) {

  box.innerHTML = `
    <div class="card emptyState">

      <div class="emptyIcon">
        🔎
      </div>

      <h3>
        Explore VORTEX
      </h3>

      <p class="muted">
        Search people, posts, groups,
        games, events, Marketplace
        and more.
      </p>

    </div>
  `;
}


/* =========================
   SEARCH RESULTS
========================= */

function renderSearchResults(
  box,
  results
) {

  if (!results.length) {

    box.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          🔎
        </div>

        <h3>
          No results found
        </h3>

        <p class="muted">
          Try another search term.
        </p>

      </div>
    `;

    return;
  }


  /*
    Limit the initial results so
    very large local databases don't
    make the interface heavy.
  */

  const visible =
    results.slice(0, 50);


  box.innerHTML =
    visible
      .map(searchResultCard)
      .join("");
}


/* =========================
   RESULT CARD
========================= */

function searchResultCard(
  result
) {

  if (result.type === "post") {

    const post =
      result.data;


    return `
      <div class="card searchResult">

        <div class="row">

          <div class="avatar">
            📝
          </div>

          <div class="grow">

            <strong>
              Post
            </strong>

            <small class="muted">
              ${escapeHTML(
                post.author ||
                "VORTEX user"
              )}
            </small>

          </div>

        </div>

        <p>
          ${escapeHTML(
            post.text || ""
          )}
        </p>

        <button
          class="btn small"
          onclick="openSearchPost('${escapeHTML(post.id)}')"
        >
          Open Post
        </button>

      </div>
    `;
  }


  if (result.type === "feature") {

    const feature =
      result.data;


    return `
      <div class="card searchResult">

        <div class="row">

          <div
            class="avatar"
            style="font-size:24px"
          >
            ${escapeHTML(
              feature.icon
            )}
          </div>

          <div class="grow">

            <strong>
              ${escapeHTML(
                feature.name
              )}
            </strong>

            <small class="muted">
              VORTEX feature
            </small>

          </div>

          <button
            class="btn small"
            onclick="openPage('${escapeHTML(feature.page)}')"
          >
            Open
          </button>

        </div>

      </div>
    `;
  }


  if (result.type === "market") {

    const item =
      result.data;


    return `
      <div class="card searchResult">

        <div class="row">

          <div
            class="avatar"
            style="font-size:24px"
          >
            🛍️
          </div>

          <div class="grow">

            <strong>
              ${escapeHTML(
                item.name
              )}
            </strong>

            <small class="muted">
              ${escapeHTML(
                item.category || "Other"
              )}
              ·
              ${escapeHTML(
                item.location || "VORTEX"
              )}
            </small>

          </div>

          <strong>
            ${escapeHTML(
              item.price || "Contact"
            )}
          </strong>

        </div>

        <button
          class="btn small"
          onclick="openPage('marketplace')"
        >
          View Marketplace
        </button>

      </div>
    `;
  }


  return "";
}


/* =========================
   OPEN SEARCH POST
========================= */

function openSearchPost(id) {

  openPage("home");


  /*
    Give the feed a moment to render.
  */

  setTimeout(() => {

    const post =
      document.getElementById(
        `post-${CSS.escape(String(id))}`
      );


    if (post) {

      post.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });


      post.classList.add(
        "searchHighlight"
      );


      setTimeout(() => {

        post.classList.remove(
          "searchHighlight"
        );

      }, 1800);

    } else {

      toast(
        "Post could not be displayed."
      );

    }

  }, 80);
}


/* =========================
   EXPLORE SEARCH
========================= */

function filterExplore() {

  const input =
    document.getElementById(
      "exploreSearch"
    );


  if (!input) return;


  const query =
    input.value
      .trim()
      .toLowerCase();


  document
    .querySelectorAll(
      "#exploreGrid .feature"
    )
    .forEach(card => {

      const searchable =
        `${card.dataset.search || ""} ${card.textContent || ""}`
          .toLowerCase();


      const visible =
        !query ||
        searchable.includes(query);


      card.style.display =
        visible
          ? ""
          : "none";

    });
}


/* =========================
   SEARCH PAGE
========================= */

function openSearch() {

  openPage("search");


  setTimeout(() => {

    const input =
      document.getElementById(
        "globalSearch"
      );


    if (input) {
      input.focus();
    }

  }, 100);
}


/* =========================
   CLEAR SEARCH
========================= */

function clearSearch() {

  const input =
    document.getElementById(
      "globalSearch"
    );


  if (input) {
    input.value = "";
  }


  const box =
    document.getElementById(
      "searchResults"
    );


  if (box) {
    renderSearchEmptyState(
      box
    );
  }

}


/* =========================
   SEARCH KEYBOARD
========================= */

function handleSearchKeydown(
  event
) {

  if (
    event.key === "Enter"
  ) {

    event.preventDefault();

    globalSearch();

  }

}


/* =========================
   SEARCH INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const input =
      document.getElementById(
        "globalSearch"
      );


    if (input) {

      input.addEventListener(
        "keydown",
        handleSearchKeydown
      );

      input.addEventListener(
        "input",
        debounce(
          globalSearch,
          250
        )
      );

    }


    const explore =
      document.getElementById(
        "exploreSearch"
      );


    if (explore) {

      explore.addEventListener(
        "input",
        debounce(
          filterExplore,
          150
        )
      );

    }

  }
);
