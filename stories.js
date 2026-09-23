/* VORTEX STORIES ENGINE
   Handles story creation, story display,
   story viewing and story interactions.
*/


/* =========================
   STORY STORAGE
========================= */

const STORY_STORE_KEY =
  "vortex_v15_stories";


/* =========================
   DEFAULT STORIES
========================= */

const defaultStories = [
  {
    id: "story_default_1",
    name: "Your Story",
    icon: "＋",
    type: "create",
    text: "",
    author: "you"
  },
  {
    id: "story_default_2",
    name: "Trending",
    icon: "🔥",
    type: "demo",
    text: "Discover what's trending on VORTEX.",
    author: "VORTEX"
  },
  {
    id: "story_default_3",
    name: "Gaming",
    icon: "🎮",
    type: "demo",
    text: "Enter the VORTEX Gaming universe.",
    author: "VORTEX Gaming"
  },
  {
    id: "story_default_4",
    name: "Music",
    icon: "🎵",
    type: "demo",
    text: "Share the sound of your world.",
    author: "VORTEX Music"
  },
  {
    id: "story_default_5",
    name: "Learning",
    icon: "📚",
    type: "demo",
    text: "Learn. Create. Discover.",
    author: "VORTEX Learning"
  },
  {
    id: "story_default_6",
    name: "VORTEX",
    icon: "🚀",
    type: "demo",
    text: "Your world. Your people. Your Vortex.",
    author: "VORTEX"
  }
];


/* =========================
   GET STORIES
========================= */

function getStories() {

  const saved =
    get(
      STORY_STORE_KEY,
      null
    );


  if (
    Array.isArray(saved) &&
    saved.length
  ) {
    return saved;
  }


  return [
    ...defaultStories
  ];
}


/* =========================
   SAVE STORIES
========================= */

function saveStories(stories) {

  return set(
    STORY_STORE_KEY,
    stories
  );
}


/* =========================
   CLEAN EXPIRED STORIES
========================= */

function cleanExpiredStories() {

  const stories =
    getStories();


  const now =
    Date.now();


  const active =
    stories.filter(story => {

      /*
        Demo/default stories don't expire.
      */

      if (
        !story.createdAt ||
        !story.expiresAt
      ) {
        return true;
      }


      return (
        story.expiresAt > now
      );

    });


  if (
    active.length !==
    stories.length
  ) {

    saveStories(active);

  }


  return active;
}


/* =========================
   RENDER STORIES
========================= */

function renderStories() {

  const row =
    document.getElementById(
      "storiesRow"
    );


  if (!row) return;


  const stories =
    cleanExpiredStories();


  row.innerHTML =
    stories
      .map(storyCard)
      .join("");
}


/* =========================
   STORY CARD
========================= */

function storyCard(story) {

  const isOwn =
    story.author === "you" ||
    story.type === "create";


  const icon =
    story.icon ||
    "✨";


  return `
    <div
      class="story"
      data-story-id="${escapeHTML(story.id)}"
      onclick="openStory('${escapeHTML(story.id)}')"
    >

      <div
        class="storyCircle ${
          isOwn
            ? "storyOwn"
            : "storyActive"
        }"
      >

        ${
          story.image
            ? `
              <img
                src="${escapeHTML(story.image)}"
                alt="${escapeHTML(story.name)}"
                loading="lazy"
              >
            `
            : `
              ${escapeHTML(icon)}
            `
        }

      </div>

      <small>
        ${escapeHTML(story.name)}
      </small>

    </div>
  `;
}


/* =========================
   OPEN STORY
========================= */

function openStory(id) {

  const stories =
    cleanExpiredStories();


  const story =
    stories.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!story) return;


  /*
    "Your Story" opens the creation
    interface instead of a viewer.
  */

  if (
    story.type === "create"
  ) {

    createStory();

    return;
  }


  showStoryViewer(
    story
  );
}


/* =========================
   STORY VIEWER
========================= */

function showStoryViewer(story) {

  const stories =
    cleanExpiredStories();


  const currentIndex =
    stories.findIndex(
      item =>
        item.id === story.id
    );


  showModal(
    story.name || "VORTEX Story",
    `
      <div
        class="storyViewer"
        data-story-viewer="true"
      >

        <div class="storyProgress">

          <span
            class="storyProgressBar"
            style="width:100%"
          ></span>

        </div>


        ${
          story.image
            ? `
              <div class="storyMedia">
                <img
                  src="${escapeHTML(story.image)}"
                  alt="${escapeHTML(story.name)}"
                >
              </div>
            `
            : `
              <div class="storyHero">

                <div class="storyHeroIcon">
                  ${escapeHTML(
                    story.icon || "✨"
                  )}
                </div>

                <h2>
                  ${escapeHTML(
                    story.name
                  )}
                </h2>

                <p>
                  ${escapeHTML(
                    story.text ||
                    "Welcome to VORTEX Stories."
                  )}
                </p>

              </div>
            `
        }


        <div class="storyViewerActions">

          ${
            currentIndex > 0
              ? `
                <button
                  class="btn"
                  onclick="viewPreviousStory('${escapeHTML(story.id)}')"
                >
                  ← Previous
                </button>
              `
              : ""
          }


          ${
            currentIndex <
            stories.length - 1
              ? `
                <button
                  class="btn primary"
                  onclick="viewNextStory('${escapeHTML(story.id)}')"
                >
                  Next →
                </button>
              `
              : `
                <button
                  class="btn primary"
                  onclick="hideModal()"
                >
                  Close
                </button>
              `
          }

        </div>

      </div>
    `
  );
}


/* =========================
   NEXT STORY
========================= */

function viewNextStory(id) {

  const stories =
    cleanExpiredStories();


  const index =
    stories.findIndex(
      story =>
        story.id === id
    );


  if (
    index < 0 ||
    index >= stories.length - 1
  ) {

    hideModal();

    return;
  }


  showStoryViewer(
    stories[index + 1]
  );
}


/* =========================
   PREVIOUS STORY
========================= */

function viewPreviousStory(id) {

  const stories =
    cleanExpiredStories();


  const index =
    stories.findIndex(
      story =>
        story.id === id
    );


  if (index <= 0) {

    return;
  }


  showStoryViewer(
    stories[index - 1]
  );
}


/* =========================
   CREATE STORY
========================= */

function createStory() {

  showModal(
    "Create Story",
    `
      <div class="storyCreate">

        <div class="storyCreatePreview">
          ✨
        </div>

        <input
          id="storyText"
          placeholder="What's happening?"
          maxlength="280"
        >

        <input
          id="storyIcon"
          placeholder="Emoji or icon"
          maxlength="4"
        >

        <input
          id="storyImage"
          type="url"
          placeholder="Optional image URL"
        >

        <p class="muted">
          Stories are stored locally for this VORTEX MVP.
        </p>

        <button
          class="btn primary"
          onclick="saveStory()"
        >
          Publish Story
        </button>

      </div>
    `
  );
}


/* =========================
   SAVE STORY
========================= */

function saveStory() {

  const text =
    document.getElementById(
      "storyText"
    )?.value
      .trim();


  const icon =
    document.getElementById(
      "storyIcon"
    )?.value
      .trim() ||
    "✨";


  const image =
    document.getElementById(
      "storyImage"
    )?.value
      .trim() ||
    "";


  if (!text && !image) {

    toast(
      "Add text or an image first."
    );

    return;
  }


  const now =
    Date.now();


  const story = {

    id:
      createId("story"),

    name:
      profile.name,

    author:
      "you",

    icon,

    text,

    image,

    type:
      "user",

    createdAt:
      now,

    /*
      Stories remain available
      for 24 hours.
    */

    expiresAt:
      now + 24 * 60 * 60 * 1000

  };


  let stories =
    getStories();


  /*
    Remove the temporary
    "Your Story" placeholder.
  */

  stories =
    stories.filter(
      item =>
        item.type !== "create"
    );


  stories.unshift(
    story
  );


  saveStories(
    stories
  );


  hideModal();

  renderStories();


  if (
    typeof addNotification ===
    "function"
  ) {

    addNotification(
      "Your story was published.",
      "story",
      "✨"
    );

  }


  toast(
    "Story published ✨"
  );
}


/* =========================
   DELETE STORY
========================= */

function deleteStory(id) {

  let stories =
    getStories();


  const story =
    stories.find(
      item =>
        item.id === id
    );


  if (!story) return;


  if (
    story.author !== "you"
  ) {

    toast(
      "You can only remove your own story."
    );

    return;
  }


  stories =
    stories.filter(
      item =>
        item.id !== id
    );


  saveStories(
    stories
  );


  hideModal();

  renderStories();

  toast(
    "Story removed."
  );
}


/* =========================
   STORY SHARING
========================= */

function shareStory(id) {

  const story =
    getStories().find(
      item =>
        item.id === id
    );


  if (!story) return;


  shareVortex({

    title:
      `${story.name} on VORTEX`,

    text:
      story.text ||
      "Check out this VORTEX Story.",

    url:
      `${window.location.href}#story-${encodeURIComponent(id)}`

  });
}


/* =========================
   INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderStories();

  }
);
