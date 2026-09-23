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
    post.author ||
    profile.name;


  const username =
    post.username ||
    profile.username;


  const avatar =
    post.avatar ||
    "";


  const initials =
    String(author)
      .trim()
      .split(/\s+/)
      .map(word => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();


  return `
    <article
      class="card postCard"
      id="post-${escapeHTML(post.id)}"
    >

      <div class="postHeader">

        ${
          avatar
            ? `
              <div class="avatar avatarImage">
                <img
                  src="${escapeHTML(avatar)}"
                  alt="${escapeHTML(author)}"
                  loading="lazy"
                >
              </div>
            `
            : `
              <div class="avatar">
                ${escapeHTML(initials || "VX")}
              </div>
            `
        }


        <div class="postMeta">

          <strong>
            ${escapeHTML(author)}
          </strong>

          <small>
            @${escapeHTML(username)}
            ·
            ${escapeHTML(
              post.date || "Just now"
            )}
          </small>

        </div>


        <button
          class="iconBtn"
          aria-label="Post options"
          onclick="postMenu('${escapeHTML(post.id)}')"
        >
          ⋮
        </button>

      </div>


      <div class="postText">
        ${escapeHTML(post.text)
          .replace(/\n/g, "<br>")}
      </div>


      <div class="postActions">

        <button
          class="postAction ${liked ? "liked" : ""}"
          onclick="likePost('${escapeHTML(post.id)}')"
        >
          ❤️
          ${liked ? "Liked" : "Like"}
        </button>


        <button
          class="postAction"
          onclick="commentPost('${escapeHTML(post.id)}')"
        >
          💬 Comment
        </button>


        <button
          class="postAction"
          onclick="sharePost('${escapeHTML(post.id)}')"
        >
          ↗ Share
        </button>


        <button
          class="postAction"
          onclick="repost('${escapeHTML(post.id)}')"
        >
          🔁 Repost
        </button>


        <button
          class="postAction ${isSaved ? "saved" : ""}"
          onclick="savePost('${escapeHTML(post.id)}')"
        >
          🔖
          ${isSaved ? "Saved" : "Save"}
        </button>

      </div>

    </article>
  `;
}


/* =========================
   LIKE POST
========================= */

function likePost(id) {

  const likes =
    get(
      STORE.likes,
      {}
    );


  const wasLiked =
    Boolean(likes[id]);


  likes[id] =
    !wasLiked;


  set(
    STORE.likes,
    likes
  );


  /*
    Update post's stored like count.
  */

  const posts =
    getPosts();

  const post =
    posts.find(
      item => String(item.id) === String(id)
    );


  if (post) {

    post.likes =
      Math.max(
        0,
        safeNumber(post.likes) +
        (likes[id] ? 1 : -1)
      );

    set(
      STORE.posts,
      posts
    );

  }


  renderPosts();

  renderProfilePosts();


  if (likes[id]) {

    toast(
      "Liked ❤️"
    );

  } else {

    toast(
      "Like removed"
    );

  }
}


/* =========================
   SAVE POST
========================= */

function savePost(id) {

  let saved =
    get(
      STORE.saved,
      []
    );


  if (!Array.isArray(saved)) {
    saved = [];
  }


  const numericId =
    id;


  if (
    saved.some(
      item => String(item) === String(numericId)
    )
  ) {

    saved =
      saved.filter(
        item =>
          String(item) !==
          String(numericId)
      );

    toast(
      "Removed from saved"
    );

  } else {

    saved.push(
      numericId
    );

    toast(
      "Post saved 🔖"
    );

  }


  set(
    STORE.saved,
    saved
  );


  renderPosts();

  renderSaved();
}


/* =========================
   SAVED POSTS
========================= */

function renderSaved() {

  const box =
    document.getElementById(
      "savedList"
    );

  if (!box) return;


  const saved =
    get(
      STORE.saved,
      []
    );


  const posts =
    getPosts()
      .filter(post =>
        saved.some(
          id =>
            String(id) ===
            String(post.id)
        )
      );


  if (!posts.length) {

    box.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          🔖
        </div>

        <h3>
          No saved posts
        </h3>

        <p class="muted">
          Save posts you want to
          revisit later.
        </p>

      </div>
    `;

    return;
  }


  box.innerHTML =
    posts
      .map(postCard)
      .join("");
}


/* =========================
   COMMENT MODAL
========================= */

function commentPost(id) {

  const post =
    getPosts().find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!post) return;


  showModal(
    "Comment",
    `
      <div class="commentComposer">

        <p class="muted">
          Comment on this VORTEX post.
        </p>

        <textarea
          id="commentText"
          placeholder="Write a comment..."
          maxlength="1000"
        ></textarea>

        <button
          class="btn primary"
          onclick="submitComment('${escapeHTML(id)}')"
        >
          Comment
        </button>

      </div>
    `
  );
}


/* =========================
   SUBMIT COMMENT
========================= */

function submitComment(id) {

  const input =
    document.getElementById(
      "commentText"
    );

  if (!input) return;


  const text =
    input.value.trim();


  if (!text) {

    toast(
      "Write a comment."
    );

    input.focus();

    return;
  }


  const posts =
    getPosts();


  const post =
    posts.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (post) {

    post.comments =
      safeNumber(post.comments) + 1;

    set(
      STORE.posts,
      posts
    );

  }


  hideModal();


  if (
    typeof addNotification ===
    "function"
  ) {

    addNotification(
      "Your comment was added.",
      "comment",
      "💬"
    );

  }


  renderPosts();

  renderProfilePosts();

  toast(
    "Comment added 💬"
  );
}


/* =========================
   SHARE POST
========================= */

function sharePost(id) {

  const post =
    getPosts().find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!post) return;


  const url =
    `${window.location.origin}${window.location.pathname}#post-${encodeURIComponent(id)}`;


  shareVortex({

    title: "VORTEX Post",

    text:
      post.text ||
      "Check out this VORTEX post.",

    url

  });
}


/* =========================
   REPOST
========================= */

function repost(id) {

  const original =
    getPosts().find(
      post =>
        String(post.id) ===
        String(id)
    );


  if (!original) return;


  const posts =
    getPosts();


  const reposted = {

    ...original,

    id:
      createId("post"),

    text:
      `🔁 Reposted\n\n${original.text}`,

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

    repostOf:
      original.id,

    likes: 0,

    comments: 0,

    reposts: 0

  };


  posts.unshift(
    reposted
  );


  set(
    STORE.posts,
    posts
  );


  renderPosts();

  renderProfilePosts();


  if (
    typeof addNotification ===
    "function"
  ) {

    addNotification(
      "You reposted a VORTEX post.",
      "repost",
      "🔁"
    );

  }


  toast(
    "Reposted 🔁"
  );
}


/* =========================
   POST MENU
========================= */

function postMenu(id) {

  showModal(
    "Post Options",
    `
      <div class="postMenu">

        <button
          class="btn"
          style="width:100%"
          onclick="sharePost('${escapeHTML(id)}');hideModal()"
        >
          ↗ Share
        </button>

        <br>

        <button
          class="btn"
          style="width:100%"
          onclick="copyPost('${escapeHTML(id)}')"
        >
          📋 Copy text
        </button>

        <br>

        <button
          class="btn danger"
          style="width:100%"
          onclick="reportPost('${escapeHTML(id)}')"
        >
          🚩 Report
        </button>

      </div>
    `
  );
}


/* =========================
   COPY POST
========================= */

async function copyPost(id) {

  const post =
    getPosts().find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!post) return;


  await copyText(
    post.text,
    "Post text copied ✓"
  );


  hideModal();
}


/* =========================
   REPORT POST
========================= */

function reportPost(id) {

  hideModal();


  if (
    typeof addNotification ===
    "function"
  ) {

    addNotification(
      "Report submitted for review.",
      "report",
      "🚩"
    );

  }


  toast(
    "Report submitted."
  );
}


/* =========================
   DELETE OWN POST
========================= */

function deletePost(id) {

  const posts =
    getPosts();


  const post =
    posts.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!post) return;


  if (
    post.username &&
    post.username !==
    profile.username
  ) {

    toast(
      "You can only delete your own posts."
    );

    return;
  }


  showModal(
    "Delete Post",
    `
      <div class="emptyState">

        <div class="emptyIcon">
          🗑️
        </div>

        <h3>
          Delete this post?
        </h3>

        <p class="muted">
          This action cannot be undone
          on this device.
        </p>

        <div class="row">

          <button
            class="btn"
            onclick="hideModal()"
          >
            Cancel
          </button>

          <button
            class="btn danger"
            onclick="confirmDeletePost('${escapeHTML(id)}')"
          >
            Delete
          </button>

        </div>

      </div>
    `
  );
}


/* =========================
   CONFIRM DELETE
========================= */

function confirmDeletePost(id) {

  let posts =
    getPosts();


  posts =
    posts.filter(
      post =>
        String(post.id) !==
        String(id)
    );


  set(
    STORE.posts,
    posts
  );


  /*
    Remove related like/save data.
  */

  const likes =
    get(
      STORE.likes,
      {}
    );

  delete likes[id];

  set(
    STORE.likes,
    likes
  );


  let saved =
    get(
      STORE.saved,
      []
    );

  saved =
    Array.isArray(saved)
      ? saved.filter(
          item =>
            String(item) !==
            String(id)
        )
      : [];

  set(
    STORE.saved,
    saved
  );


  hideModal();

  renderPosts();

  renderProfilePosts();

  renderSaved();

  updateProfileStats();

  toast(
    "Post deleted."
  );
}


/* =========================
   POST SEARCH
========================= */

function searchPosts(query) {

  const q =
    String(query || "")
      .trim()
      .toLowerCase();


  if (!q) {
    renderPosts();
    return;
  }


  const results =
    getPosts()
      .filter(post => {

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

        return (
          text.includes(q) ||
          author.includes(q) ||
          username.includes(q)
        );

      });


  const container =
    document.getElementById(
      "feed"
    );

  if (!container) return;


  if (!results.length) {

    container.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          🔎
        </div>

        <h3>
          No posts found
        </h3>

        <p class="muted">
          Try another search.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    results
      .map(postCard)
      .join("");
}


/* =========================
   POST INPUT EVENTS
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const input =
      document.getElementById(
        "postText"
      );


    if (!input) return;


    input.addEventListener(
      "input",
      updatePostCharacterCount
    );


    updatePostCharacterCount();

  }
);
