/* VORTEX PROFILE ENGINE
   Handles profile data, profile UI,
   editing, statistics and profile posts.
*/


/* =========================
   DEFAULT PROFILE
========================= */

let profile = get(STORE.profile, {
  name: "Tumelo Brilliant",
  username: "tumelo",
  bio: "Building VORTEX. Connect. Create. Discover. 🚀",
  avatar: "",
  followers: 0,
  following: 0
});


/* =========================
   PROFILE DATA SAFETY
========================= */

function normalizeProfile() {

  if (!profile || typeof profile !== "object") {
    profile = {
      name: "Tumelo Brilliant",
      username: "tumelo",
      bio: "Building VORTEX. Connect. Create. Discover. 🚀",
      avatar: "",
      followers: 0,
      following: 0
    };
  }

  profile.name =
    profile.name || "Tumelo Brilliant";

  profile.username =
    profile.username || "tumelo";

  profile.bio =
    profile.bio ||
    "Building VORTEX. Connect. Create. Discover. 🚀";

  profile.avatar =
    profile.avatar || "";

  profile.followers =
    safeNumber(profile.followers);

  profile.following =
    safeNumber(profile.following);
}


normalizeProfile();


/* =========================
   PROFILE INITIALS
========================= */

function getProfileInitials(name = profile.name) {

  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "VX";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}


/* =========================
   PROFILE AVATAR HTML
========================= */

function profileAvatarHTML(size = "") {

  const className =
    size
      ? `avatar ${size}`
      : "avatar";

  if (profile.avatar) {

    return `
      <div class="${className} avatarImage">
        <img
          src="${escapeHTML(profile.avatar)}"
          alt="${escapeHTML(profile.name)}"
          loading="lazy"
        >
      </div>
    `;

  }

  return `
    <div class="${className}">
      ${escapeHTML(getProfileInitials())}
    </div>
  `;
}


/* =========================
   UPDATE PROFILE UI
========================= */

function updateProfileUI() {

  normalizeProfile();

  setText(
    "#profileName",
    profile.name
  );

  setText(
    "#profileBio",
    profile.bio
  );

  setText(
    "#profileUsername",
    "@" + profile.username
  );

  const firstName =
    profile.name
      .trim()
      .split(/\s+/)[0] ||
      "there";

  setText(
    "#homeGreeting",
    `Hello ${firstName} 👋`
  );


  /*
    Update visible avatar containers.
  */

  document
    .querySelectorAll("[data-profile-avatar]")
    .forEach(element => {

      element.innerHTML =
        profile.avatar
          ? `
            <img
              src="${escapeHTML(profile.avatar)}"
              alt="${escapeHTML(profile.name)}"
              loading="lazy"
            >
          `
          : escapeHTML(
              getProfileInitials()
            );

    });


  /*
    If the main profile avatar exists,
    update it as well.
  */

  const mainAvatar =
    document.getElementById("profileAvatar");

  if (mainAvatar) {

    if (profile.avatar) {

      mainAvatar.innerHTML = `
        <img
          src="${escapeHTML(profile.avatar)}"
          alt="${escapeHTML(profile.name)}"
        >
      `;

    } else {

      mainAvatar.textContent =
        getProfileInitials();

    }

  }


  updateProfileStats();
}


/* =========================
   PROFILE STATISTICS
========================= */

function updateProfileStats() {

  const posts =
    typeof getPosts === "function"
      ? getPosts()
      : [];

  const followers =
    safeNumber(profile.followers);

  const following =
    safeNumber(profile.following);


  setText(
    "#profilePostCount",
    formatNumber(posts.length)
  );

  setText(
    "#profileFollowers",
    formatNumber(followers)
  );

  setText(
    "#profileFollowing",
    formatNumber(following)
  );

  setText(
    "#postCount",
    formatNumber(posts.length)
  );
}


/* =========================
   EDIT PROFILE
========================= */

function editProfile() {

  showModal(
    "Edit Profile",
    `
      <div class="profileEditForm">

        <div class="profileEditPreview">
          ${profileAvatarHTML("large")}
        </div>

        <label class="fieldLabel">
          Display name
        </label>

        <input
          id="editName"
          value="${escapeHTML(profile.name)}"
          placeholder="Your name"
          maxlength="60"
        >

        <label class="fieldLabel">
          Username
        </label>

        <input
          id="editUsername"
          value="${escapeHTML(profile.username)}"
          placeholder="Username"
          maxlength="30"
        >

        <label class="fieldLabel">
          Bio
        </label>

        <textarea
          id="editBio"
          placeholder="Tell people about yourself..."
          maxlength="160"
        >${escapeHTML(profile.bio)}</textarea>

        <label class="fieldLabel">
          Profile image URL
        </label>

        <input
          id="editAvatar"
          value="${escapeHTML(profile.avatar)}"
          placeholder="https://..."
          type="url"
        >

        <div class="row" style="margin-top:18px">

          <button
            class="btn"
            onclick="hideModal()"
          >
            Cancel
          </button>

          <button
            class="btn primary"
            onclick="saveProfile()"
          >
            Save Profile
          </button>

        </div>

      </div>
    `
  );
}


/* =========================
   SAVE PROFILE
========================= */

function saveProfile() {

  const name =
    document.getElementById("editName")
      ?.value
      .trim();

  const username =
    document.getElementById("editUsername")
      ?.value
      .trim();

  const bio =
    document.getElementById("editBio")
      ?.value
      .trim();

  const avatar =
    document.getElementById("editAvatar")
      ?.value
      .trim();


  if (name) {
    profile.name = name;
  }

  if (username) {

    profile.username =
      username
        .replace(/^@/, "")
        .replace(/\s+/g, "")
        .toLowerCase();

  }

  if (bio) {
    profile.bio = bio;
  }

  profile.avatar = avatar || "";


  set(
    STORE.profile,
    profile
  );


  updateProfileUI();

  hideModal();

  toast("Profile updated ✓");


  /*
    Refresh posts because the profile
    information may appear on them.
  */

  if (typeof renderPosts === "function") {
    renderPosts();
  }

  if (
    typeof renderProfilePosts === "function"
  ) {
    renderProfilePosts();
  }
}


/* =========================
   PROFILE POSTS
========================= */

function renderProfilePosts() {

  const box =
    document.getElementById(
      "profilePosts"
    );

  if (!box) return;


  const posts =
    typeof getPosts === "function"
      ? getPosts()
      : [];


  /*
    Only show the user's own posts
    when author information is available.
  */

  const ownPosts =
    posts.filter(post => {

      if (!post) return false;

      if (!post.username) {
        return true;
      }

      return (
        post.username ===
        profile.username
      );

    });


  if (!ownPosts.length) {

    box.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          ✨
        </div>

        <h3>
          Your VORTEX starts here
        </h3>

        <p class="muted">
          Create your first post and
          share something with your world.
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


  box.innerHTML =
    ownPosts
      .map(post => {

       
