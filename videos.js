/* VORTEX VIDEO ENGINE
   Reels, Watch and video interactions.
*/


/* =========================
   VIDEO DATA
========================= */

const vortexVideos = [
  {
    id: "video_1",
    icon: "🚀",
    title: "Building something amazing on VORTEX",
    category: "Technology"
  },

  {
    id: "video_2",
    icon: "🎮",
    title: "VORTEX Gaming",
    category: "Gaming"
  },

  {
    id: "video_3",
    icon: "🌍",
    title: "Discover Botswana",
    category: "Travel"
  },

  {
    id: "video_4",
    icon: "💡",
    title: "Creator tips",
    category: "Creators"
  }
];


/* =========================
   GET VIDEOS
========================= */

function getVideos() {
  return vortexVideos;
}


/* =========================
   VIDEO CARD
========================= */

function videoCard(video) {

  return `
    <article
      class="card videoCard"
      data-video-id="${escapeHTML(video.id)}"
    >

      <div
        class="postImage videoPreview"
        onclick="playVideo('${escapeHTML(video.id)}')"
      >
        <div class="videoPlayButton">
          ▶
        </div>

        <span class="videoIcon">
          ${escapeHTML(video.icon)}
        </span>
      </div>

      <div class="videoInfo">

        <span class="eyebrow">
          ${escapeHTML(video.category)}
        </span>

        <h3>
          ${escapeHTML(video.title)}
        </h3>

      </div>

      <div class="postActions">

        <button
          class="postAction"
          onclick="likeVideo('${escapeHTML(video.id)}')"
        >
          ❤️ Like
        </button>

        <button
          class="postAction"
          onclick="commentVideo('${escapeHTML(video.id)}')"
        >
          💬 Comment
        </button>

        <button
          class="postAction"
          onclick="shareVideo('${escapeHTML(video.id)}')"
        >
          ↗ Share
        </button>

      </div>

    </article>
  `;
}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos() {

  const reels =
    document.getElementById(
      "reelsList"
    );

  const watch =
    document.getElementById(
      "watchList"
    );


  const videos =
    getVideos();


  const html =
    videos
      .map(videoCard)
      .join("");


  if (reels) {
    reels.innerHTML = html;
  }


  if (watch) {
    watch.innerHTML = html;
  }
}


/* =========================
   PLAY VIDEO
========================= */

function playVideo(id) {

  const video =
    getVideos().find(
      item =>
        item.id === id
    );


  if (!video) return;


  showModal(
    video.title,
    `
      <div class="videoViewer">

        <div class="videoPlayerPlaceholder">

          <div class="videoLargeIcon">
            ${escapeHTML(video.icon)}
          </div>

          <div class="videoPlayLarge">
            ▶
          </div>

        </div>

        <h3>
          ${escapeHTML(video.title)}
        </h3>

        <p class="muted">
          ${escapeHTML(video.category)}
        </p>

        <p class="muted">
          Real video playback can be connected
          here to your future VORTEX video backend.
        </p>

        <button
          class="btn primary"
          onclick="hideModal()"
        >
          Close
        </button>

      </div>
    `
  );
}


/* =========================
   LIKE VIDEO
========================= */

function likeVideo(id) {

  const key =
    `vortex_video_like_${id}`;

  const liked =
    localStorage.getItem(key) === "1";


  if (liked) {

    localStorage.removeItem(key);

    toast(
      "Video like removed."
    );

  } else {

    localStorage.setItem(
      key,
      "1"
    );

    toast(
      "Video liked ❤️"
    );

  }
}


/* =========================
   COMMENT VIDEO
========================= */

function commentVideo(id) {

  const video =
    getVideos().find(
      item =>
        item.id === id
    );


  if (!video) return;


  showModal(
    "Video Comment",
    `
      <p class="muted">
        ${escapeHTML(video.title)}
      </p>

      <textarea
        id="videoComment"
        placeholder="Write a comment..."
        maxlength="500"
      ></textarea>

      <br>

      <button
        class="btn primary"
        onclick="submitVideoComment('${escapeHTML(id)}')"
      >
        Comment
      </button>
    `
  );
}


/* =========================
   SUBMIT COMMENT
========================= */

function submitVideoComment(id) {

  const input =
    document.getElementById(
      "videoComment"
    );


  const text =
    input?.value.trim();


  if (!text) {

    toast(
      "Write a comment first."
    );

    return;
  }


  hideModal();


  addNotification(
    "Your video comment was added.",
    "comment",
    "💬"
  );


  toast(
    "Comment added 💬"
  );
}


/* =========================
   SHARE VIDEO
========================= */

function shareVideo(id) {

  const video =
    getVideos().find(
      item =>
        item.id === id
    );


  if (!video) return;


  shareVortex({

    title:
      video.title,

    text:
      `Watch "${video.title}" on VORTEX.`,

    url:
      `${window.location.origin}${window.location.pathname}#video-${encodeURIComponent(id)}`

  });
}


/* =========================
   VIDEO SEARCH
========================= */

function searchVideos(query) {

  const q =
    String(query || "")
      .trim()
      .toLowerCase();


  const videos =
    getVideos().filter(video => {

      if (!q) return true;

      return (
        video.title
          .toLowerCase()
          .includes(q) ||

        video.category
          .toLowerCase()
          .includes(q)
      );

    });


  const html =
    videos.length
      ? videos.map(videoCard).join("")
      : `
        <div class="card emptyState">

          <div class="emptyIcon">
            🔎
          </div>

          <h3>
            No videos found
          </h3>

          <p class="muted">
            Try another search.
          </p>

        </div>
      `;


  const reels =
    document.getElementById(
      "reelsList"
    );

  const watch =
    document.getElementById(
      "watchList"
    );


  if (reels) {
    reels.innerHTML = html;
  }


  if (watch) {
    watch.innerHTML = html;
  }
}


/* =========================
   INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderVideos();

  }
);
