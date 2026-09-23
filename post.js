/* VORTEX POSTS ENGINE
   Handles the main social feed,
   post creation, likes, saves,
   comments, reposts and sharing.
*/


/* =========================
   GET POSTS
========================= */

function getPosts() {

  let posts = get(
    STORE.posts,
    []
  );

  if (!Array.isArray(posts)) {
    posts = [];
  }

  return posts;
}


/* =========================
   CREATE POST
========================= */

function createPost() {

  const input =
    document.getElementById(
      "postText"
    );

  if (!input) return;

  const text =
    input.value.trim();


  if (!text) {

    toast(
      "Write something first."
    );

    input.focus();

    return;
  }


  if (text.length > 5000) {

    toast(
      "Your post is too long."
    );

    return;
  }


  const posts =
    getPosts();


  const newPost = {

    id: createId("post"),

    text,

    date:
      new Date()
        .toLocaleString(),

    timestamp:
      Date.now(),

    author:
      profile.name,

    username:
      profile.username,

    avatar:
      profile.avatar || "",

    likes: 0,

    comments: 0,

    reposts: 0

  };


  posts.unshift(
    newPost
  );


  set(
    STORE.posts,
    posts
  );


  input.value = "";


  /*
    Reset create-area counters
    if they exist.
  */

  updatePostCharacterCount();


  /*
    Notify the user locally.
  */

  if (
    typeof addNotification ===
    "function"
  ) {

    addNotification(
      "You published a new post.",
      "post",
      "🚀"
    );

  }


  renderPosts();

  renderProfilePosts();

  openPage("home");

  toast(
    "Post published 🚀"
  );
}


/* =========================
   CHARACTER COUNT
========================= */

function updatePostCharacterCount() {

  const input =
    document.getElementById(
      "postText"
    );

  const counter =
    document.getElementById(
      "postCharacterCount"
    );

  if (!input || !counter) {
    return;
  }

  counter.textContent =
    `${input.value.length}/5000`;

}


/* =========================
   CREATE TOOLS
========================= */

function insertCreate(text) {

  const input =
    document.getElementById(
      "postText"
    );

  if (!input) return;


  const current =
    input.value.trim();


  input.value =
    current
      ? `${current}\n${text}`
      : text;


  input.focus();

  updatePostCharacterCount();
}


/* =========================
   RENDER FEED
========================= */

function renderPosts() {

  const container =
    document.getElementById(
      "feed"
    );

  if (!container) return;


  const posts =
    getPosts();


  setText(
    "#postCount",
    formatNumber(posts.length)
  );


  if (!posts.length) {

    container.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          🚀
        </div>

        <h3>
          Welcome to VORTEX
        </h3>

        <p class="muted">
          Your feed is ready.
          Create the first post and
          start your VORTEX journey.
        </p>

        <button
          class="btn primary"
          onclick="openCreate()"
        >
          Create Post
        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    posts
      .map(postCard)
      .join("");
}


/* =========================
   POST CARD
========================= */

function postCard(post) {

  if (!post) return "";


  const likes =
    get(
      STORE.likes,
      {}
    );


  const saved =
    get(
      STORE.saved,
      []
    );


  const liked =
    Boolean(
      likes[post.id]
    );


  const isSaved =
    Array.isArray(saved) &&
    saved.includes(post.id);


  const author =
    post
