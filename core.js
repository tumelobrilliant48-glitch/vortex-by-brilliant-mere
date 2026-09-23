/* VORTEX CORE ENGINE
   Shared navigation, modal, toast, and UI utilities.
*/

/* =========================
   PAGE NAVIGATION
========================= */

function openPage(id) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(id);

  if (!page) {
    toast("This VORTEX page is being prepared.");
    return;
  }

  page.classList.add("active");

  document.querySelectorAll(".navBtn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === id
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  /*
    Refresh page-specific content when opened.
    These functions are defined by other modules.
  */

  if (id === "home" && typeof renderPosts === "function") {
    renderPosts();
  }

  if (id === "profile" && typeof renderProfilePosts === "function") {
    renderProfilePosts();
  }

  if (id === "saved" && typeof renderSaved === "function") {
    renderSaved();
  }

  if (id === "messages" && typeof renderChats === "function") {
    renderChats();
  }

  if (
    id === "notifications" &&
    typeof renderNotifications === "function"
  ) {
    renderNotifications();
  }

  if (id === "groups" && typeof renderGroups === "function") {
    renderGroups();
  }

  if (
    id === "marketplace" &&
    typeof renderMarketplace === "function"
  ) {
    renderMarketplace();
  }

  if (id === "events" && typeof renderEvents === "function") {
    renderEvents();
  }

  if (id === "jobs" && typeof renderJobs === "function") {
    renderJobs();
  }

  if (
    id === "fundraisers" &&
    typeof renderFundraisers === "function"
  ) {
    renderFundraisers();
  }

  if (id === "dating" && typeof renderDating === "function") {
    renderDating();
  }

  if (
    id === "challenges" &&
    typeof renderChallenges === "function"
  ) {
    renderChallenges();
  }

  if (
    (id === "reels" || id === "watch") &&
    typeof renderVideos === "function"
  ) {
    renderVideos();
  }
}


/* =========================
   CREATE SHORTCUT
========================= */

function openCreate() {
  openPage("create");
}


/* =========================
   TOAST SYSTEM
========================= */

let toastTimer = null;

function toast(message, duration = 2300) {
  const element = document.getElementById("toast");

  if (!element) return;

  element.textContent = message;

  element.classList.remove("show");

  /*
    Force a tiny reflow so repeated notifications
    can restart their animation.
  */
  void element.offsetWidth;

  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, duration);
}


/* =========================
   MODAL SYSTEM
========================= */

function showModal(title, html) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");

  if (!modal || !modalTitle || !modalContent) {
    return;
  }

  modalTitle.textContent = title || "VORTEX";

  modalContent.innerHTML = html || "";

  modal.classList.add("show");

  document.body.classList.add("modalOpen");
}


function hideModal() {
  const modal = document.getElementById("modal");

  if (!modal) return;

  modal.classList.remove("show");

  document.body.classList.remove("modalOpen");
}


function closeModal(event) {
  if (!event) return;

  if (event.target.id === "modal") {
    hideModal();
  }
}


/* =========================
   ESCAPE KEY
========================= */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hideModal();
  }
});


/* =========================
   COPY TEXT
========================= */

async function copyText(text, successMessage = "Copied ✓") {
  if (!text) return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.select();
      document.execCommand("copy");

      textarea.remove();
    }

    toast(successMessage);

    return true;

  } catch (error) {
    toast("Copy failed.");
    return false;
  }
}


/* =========================
   SHARE SYSTEM
========================= */

async function shareVortex({
  title = "VORTEX",
  text = "Your world. Your people. Your Vortex.",
  url = window.location.href
} = {}) {

  try {

    if (navigator.share) {

      await navigator.share({
        title,
        text,
        url
      });

      return true;
    }

    await copyText(
      url,
      "VORTEX link copied ✓"
    );

    return true;

  } catch (error) {

    /*
      Closing the native share sheet is not an error
      that should be shown to the user.
    */

    return false;
  }
}


/* =========================
   DOM HELPERS
========================= */

function $(selector, parent = document) {
  return parent.querySelector(selector);
}


function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}


function setText(selector, value) {
  const element = $(selector);

  if (element) {
    element.textContent = value ?? "";
  }
}


function setHTML(selector, html) {
  const element = $(selector);

  if (element) {
    element.innerHTML = html ?? "";
  }
}


/* =========================
   BUTTON LOADING STATE
========================= */

function setButtonLoading(button, loading = true) {

  if (!button) return;

  if (loading) {

    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.disabled = true;

    button.innerHTML = `
      <span class="buttonSpinner"></span>
      <span>Working...</span>
    `;

  } else {

    button.disabled = false;

    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}


/* =========================
   SCROLL TO TOP
========================= */

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   SCROLL TO ELEMENT
========================= */

function scrollToElement(selector) {

  const element =
    typeof selector === "string"
      ? document.querySelector(selector)
      : selector;

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


/* =========================
   DEBOUNCE
========================= */

function debounce(callback, delay = 300) {

  let timer;

  return function (...args) {

    clearTimeout(timer);

    timer = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}


/* =========================
   SAFE NUMBER
========================= */

function safeNumber(value, fallback = 0) {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


/* =========================
   FORMAT NUMBERS
========================= */

function formatNumber(value) {

  const number = safeNumber(value);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
}


/* =========================
   MOBILE MENU SUPPORT
========================= */

function toggleMobileMenu() {

  document.body.classList.toggle("mobileMenuOpen");

}


/* =========================
   GLOBAL OUTSIDE CLICK
========================= */

document.addEventListener("click", event => {

  /*
    Close temporary dropdowns or menus later
    without interfering with VORTEX buttons.
  */

  if (
    !event.target.closest(".dropdown") &&
    !event.target.closest(".menuButton")
  ) {

    document
      .querySelectorAll(".dropdown.open")
      .forEach(menu => {
        menu.classList.remove("open");
      });

  }

});


/* =========================
   ONLINE / OFFLINE STATUS
========================= */

function updateConnectionStatus() {

  if (navigator.onLine) {
    document.body.classList.remove("offline");
  } else {
    document.body.classList.add("offline");
    toast("You're offline. Some VORTEX features may be limited.");
  }

}


window.addEventListener(
  "online",
  () => {
    document.body.classList.remove("offline");
    toast("Connection restored ✓");
  }
);


window.addEventListener(
  "offline",
  () => {
    document.body.classList.add("offline");
    toast("You're offline.");
  }
);


/* =========================
   INITIAL CORE SETUP
========================= */

document.addEventListener("DOMContentLoaded", () => {

  updateConnectionStatus();

  /*
    Prevent accidental form submission from
    reloading the entire application.
  */

  document.addEventListener("submit", event => {

    const form = event.target;

    if (
      form &&
      form.dataset.vortexNativeSubmit !== "true"
    ) {
      event.preventDefault();
    }

  });

});
