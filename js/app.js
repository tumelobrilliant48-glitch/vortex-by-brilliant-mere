const stories = [
  { name: "Nova", tag: "new" },
  { name: "Zuri", tag: "live" },
  { name: "Maya", tag: "travel" },
  { name: "Ayo", tag: "music" },
  { name: "Kai", tag: "studio" }
];

const posts = [
  {
    author: "NovaWave",
    handle: "@novawave",
    time: "2h ago",
    content:
      "Woke up in the middle of the night and built this surreal concept for the next VORTEX story arc. The universe is alive and the community is the fuel.",
    media: true,
    likes: 812,
    comments: 124,
    shares: 58
  },
  {
    author: "Brilliant Mere",
    handle: "@brilliantmere",
    time: "5h ago",
    content:
      "We are building more than a social app. We are building a creator ecosystem where every story, reel, community, and idea can live inside one connected universe.",
    media: false,
    likes: 1240,
    comments: 236,
    shares: 97
  },
  {
    author: "Botho Beats",
    handle: "@bothobeats",
    time: "9h ago",
    content:
      "The VORTEX galaxy is giving me a brand-new way to create, share, and discover culture with my community. This is social media reimagined.",
    media: true,
    likes: 968,
    comments: 178,
    shares: 73
  }
];

const trending = [
  { topic: "#VORTEX", tag: "1.2M" },
  { topic: "Botswana Creators", tag: "420K" },
  { topic: "AI Studio", tag: "380K" },
  { topic: "Future Social", tag: "298K" }
];

const creators = [
  { name: "Luna Orbit", role: "Creator", initials: "LO" },
  { name: "Banda AI", role: "Designer", initials: "BA" },
  { name: "Sia Flux", role: "Community", initials: "SF" },
  { name: "Neo Studio", role: "Brand", initials: "NS" }
];

const storiesContainer = document.getElementById("storiesContainer");
const feedContainer = document.getElementById("feedContainer");
const trendingContainer = document.getElementById("trendingContainer");
const creatorsContainer = document.getElementById("creatorsContainer");
const postInput = document.getElementById("postInput");
const publishButton = document.getElementById("publishButton");
const createPostButton = document.getElementById("createPostButton");

function renderStories() {
  storiesContainer.innerHTML = stories
    .map(
      (story, index) => `
        <article class="story-card">
          <div class="story-ring">
            <div class="story-avatar">${story.name.slice(0, 2).toUpperCase()}</div>
          </div>
          <strong>${story.name}</strong>
          <span>${story.tag}</span>
        </article>
      `
    )
    .join("");
}

function renderFeed() {
  feedContainer.innerHTML = posts
    .map(
      (post) => `
        <article class="post-card">
          <div class="post-header">
            <div class="post-author">
              <div class="post-author-avatar">${post.author.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>${post.author}</strong>
                <small>${post.handle} · ${post.time}</small>
              </div>
            </div>
            <div class="post-meta">•••</div>
          </div>

          <p class="post-content">${post.content}</p>
          ${
            post.media
              ? '<div class="post-media" aria-label="Featured post image"></div>'
              : ""
          }

          <div class="post-actions">
            <button>❤️ ${post.likes}</button>
            <button>💬 ${post.comments}</button>
            <button>🔁 ${post.shares}</button>
            <button>🔖 Save</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTrending() {
  trendingContainer.innerHTML = trending
    .map(
      (item) => `
        <div class="trending-item">
          <strong>${item.topic}</strong>
          <span class="tag">${item.tag}</span>
        </div>
      `
    )
    .join("");
}

function renderCreators() {
  creatorsContainer.innerHTML = creators
    .map(
      (creator) => `
        <div class="creator-item">
          <div class="creator-avatar">${creator.initials}</div>
          <div class="creator-details">
            <strong>${creator.name}</strong>
            <small>${creator.role}</small>
          </div>
          <span class="tag">Follow</span>
        </div>
      `
    )
    .join("");
}

function updateTheme(theme) {
  document.body.setAttribute("data-theme", theme);

  document.querySelectorAll(".theme-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
}

function handlePublish() {
  const content = postInput.value.trim();
  if (!content) return;

  const newPost = {
    author: "Brilliant Mere",
    handle: "@brilliantmere",
    time: "just now",
    content,
    media: false,
    likes: 0,
    comments: 0,
    shares: 0
  };

  posts.unshift(newPost);
  renderFeed();
  postInput.value = "";
  postInput.focus();
}

renderStories();
renderFeed();
renderTrending();
renderCreators();

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelectorAll(".theme-btn").forEach((button) => {
  button.addEventListener("click", () => {
    updateTheme(button.dataset.theme);
  });
});

publishButton.addEventListener("click", handlePublish);
createPostButton.addEventListener("click", () => {
  document.getElementById("composerSection").scrollIntoView({ behavior: "smooth", block: "start" });
  postInput.focus();
});

postInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    handlePublish();
  }
});
