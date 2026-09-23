/* VORTEX MESSAGES ENGINE
   Handles chats, conversations,
   messages and unread states.
*/


/* =========================
   DEFAULT CHATS
========================= */

function defaultChats() {

  let chats =
    get(STORE.messages, null);

  if (Array.isArray(chats)) {
    return chats;
  }


  chats = [
    {
      id: createId("chat"),
      name: "VORTEX Team",
      message: "Welcome to VORTEX 🚀",
      unread: 1,
      messages: [
        {
          id: createId("message"),
          sender: "VORTEX Team",
          text: "Welcome to VORTEX 🚀",
          time: new Date().toLocaleTimeString()
        }
      ]
    },

    {
      id: createId("chat"),
      name: "Creative Hub",
      message: "Let's create something.",
      unread: 0,
      messages: [
        {
          id: createId("message"),
          sender: "Creative Hub",
          text: "Let's create something.",
          time: new Date().toLocaleTimeString()
        }
      ]
    },

    {
      id: createId("chat"),
      name: "Gaming",
      message: "New challenge available.",
      unread: 2,
      messages: [
        {
          id: createId("message"),
          sender: "Gaming",
          text: "New challenge available.",
          time: new Date().toLocaleTimeString()
        }
      ]
    }
  ];


  set(
    STORE.messages,
    chats
  );


  return chats;
}


/* =========================
   GET CHATS
========================= */

function getChats() {

  const chats =
    get(
      STORE.messages,
      []
    );


  return Array.isArray(chats)
    ? chats
    : defaultChats();
}


/* =========================
   RENDER CHAT LIST
========================= */

function renderChats(filter = "") {

  const box =
    document.getElementById(
      "chatList"
    );

  if (!box) return;


  let chats =
    getChats();


  if (filter) {

    const query =
      filter
        .toLowerCase()
        .trim();


    chats =
      chats.filter(chat =>
        String(chat.name)
          .toLowerCase()
          .includes(query)
      );

  }


  if (!chats.length) {

    box.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          💬
        </div>

        <h3>
          No conversations
        </h3>

        <p class="muted">
          Start a new VORTEX conversation.
        </p>

        <button
          class="btn primary"
          onclick="newChat()"
        >
          New Chat
        </button>

      </div>
    `;

    return;
  }


  box.innerHTML =
    chats
      .map(chatCard)
      .join("");
}


/* =========================
   CHAT CARD
========================= */

function chatCard(chat) {

  const initials =
    String(chat.name)
      .trim()
      .split(/\s+/)
      .map(word => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();


  return `
    <div
      class="card row chatCard"
      onclick="openChat('${escapeHTML(chat.id)}')"
    >

      <div class="avatar">
        ${escapeHTML(initials || "VX")}
      </div>

      <div class="grow">

        <strong>
          ${escapeHTML(chat.name)}
        </strong>

        <div class="muted">
          ${escapeHTML(
            chat.message ||
            "Start a conversation."
          )}
        </div>

      </div>

      ${
        safeNumber(chat.unread) > 0
          ? `
            <span
              class="notificationDot"
              title="${chat.unread} unread"
            ></span>
          `
          : ""
      }

    </div>
  `;
}


/* =========================
   SEARCH CHATS
========================= */

function searchChats(value) {

  renderChats(value);

}


/* =========================
   OPEN CHAT
========================= */

function openChat(id) {

  const chats =
    getChats();


  const chat =
    chats.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!chat) return;


  /*
    Opening a chat marks it
    as read.
  */

  chat.unread = 0;


  set(
    STORE.messages,
    chats
  );


  const messages =
    Array.isArray(chat.messages)
      ? chat.messages
      : [];


  showModal(
    chat.name,
    `
      <div class="chatWindow">

        <div
          id="chatMessages"
          class="chatMessages"
        >

          ${
            messages.length
              ? messages
                  .map(
                    messageBubble
                  )
                  .join("")
              : `
                <div class="emptyState">
                  <p class="muted">
                    No messages yet.
                  </p>
                </div>
              `
          }

        </div>


        <div class="chatComposer">

          <input
            id="chatInput"
            placeholder="Write a message..."
            maxlength="2000"
            onkeydown="handleChatKeydown(event, '${escapeHTML(chat.id)}')"
          >

          <button
            class="btn primary"
            onclick="sendChat('${escapeHTML(chat.id)}')"
          >
            Send
          </button>

        </div>

      </div>
    `
  );


  renderChats();

  scrollChatToBottom();
}


/* =========================
   MESSAGE BUBBLE
========================= */

function messageBubble(message) {

  const own =
    message.sender ===
    profile.username ||
    message.sender ===
    profile.name;


  return `
    <div
      class="chatBubble ${
        own
          ? "chatBubbleOwn"
          : "chatBubbleOther"
      }"
    >

      <div>
        ${escapeHTML(
          message.text || ""
        ).replace(/\n/g, "<br>")}
      </div>

      <small class="muted">
        ${escapeHTML(
          message.time || ""
        )}
      </small>

    </div>
  `;
}


/* =========================
   SEND CHAT
========================= */

function sendChat(id) {

  const input =
    document.getElementById(
      "chatInput"
    );

  if (!input) return;


  const text =
    input.value.trim();


  if (!text) return;


  const chats =
    getChats();


  const chat =
    chats.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!chat) return;


  if (!Array.isArray(chat.messages)) {
    chat.messages = [];
  }


  const message = {

    id:
      createId("message"),

    sender:
      profile.username ||
      profile.name,

    text,

    time:
      new Date()
        .toLocaleTimeString()

  };


  chat.messages.push(
    message
  );


  chat.message =
    text;


  chat.unread = 0;


  set(
    STORE.messages,
    chats
  );


  input.value = "";


  /*
    Re-render the open chat window.
  */

  const messagesBox =
    document.getElementById(
      "chatMessages"
    );


  if (messagesBox) {

    messagesBox.insertAdjacentHTML(
      "beforeend",
      messageBubble(message)
    );

  }


  scrollChatToBottom();

  renderChats();


  toast(
    "Message sent 💬"
  );
}


/* =========================
   ENTER TO SEND
========================= */

function handleChatKeydown(
  event,
  id
) {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendChat(id);

  }
}


/* =========================
   SCROLL CHAT
========================= */

function scrollChatToBottom() {

  const box =
    document.getElementById(
      "chatMessages"
    );

  if (!box) return;


  requestAnimationFrame(() => {

    box.scrollTop =
      box.scrollHeight;

  });
}


/* =========================
   NEW CHAT
========================= */

function newChat() {

  showModal(
    "New Chat",
    `
      <div class="newChatForm">

        <input
          id="newChatName"
          placeholder="Username or name"
          maxlength="60"
        >

        <button
          class="btn primary"
          onclick="createChat()"
        >
          Start Chat
        </button>

      </div>
    `
  );
}


/* =========================
   CREATE CHAT
========================= */

function createChat() {

  const input =
    document.getElementById(
      "newChatName"
    );


  if (!input) return;


  const name =
    input.value.trim();


  if (!name) {

    toast(
      "Enter a name."
    );

    input.focus();

    return;
  }


  const chats =
    getChats();


  const existing =
    chats.find(
      chat =>
        chat.name
          .toLowerCase() ===
        name.toLowerCase()
    );


  if (existing) {

    hideModal();

    openChat(
      existing.id
    );

    return;
  }


  const newChat = {

    id:
      createId("chat"),

    name,

    message:
      "New conversation",

    unread: 0,

    messages: []

  };


  chats.unshift(
    newChat
  );


  set(
    STORE.messages,
    chats
  );


  hideModal();

  renderChats();

  openChat(
    newChat.id
  );


  toast(
    "Chat created 💬"
  );
}


/* =========================
   DELETE CHAT
========================= */

function deleteChat(id) {

  const chats =
    getChats();


  const chat =
    chats.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!chat) return;


  showModal(
    "Delete Conversation",
    `
      <div class="emptyState">

        <div class="emptyIcon">
          🗑️
        </div>

        <h3>
          Delete this conversation?
        </h3>

        <p class="muted">
          Local conversation history
          will be removed from this device.
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
            onclick="confirmDeleteChat('${escapeHTML(id)}')"
          >
            Delete
          </button>

        </div>

      </div>
    `
  );
}


/* =========================
   CONFIRM DELETE CHAT
========================= */

function confirmDeleteChat(id) {

  let chats =
    getChats();


  chats =
    chats.filter(
      chat =>
        String(chat.id) !==
        String(id)
    );


  set(
    STORE.messages,
    chats
  );


  hideModal();

  renderChats();

  toast(
    "Conversation deleted."
  );
}


/* =========================
   UNREAD COUNT
========================= */

function getUnreadChatCount() {

  return getChats()
    .reduce(
      (total, chat) =>
        total +
        safeNumber(
          chat.unread
        ),
      0
    );
}


/* =========================
   MESSAGE BADGE
========================= */

function updateMessageBadge() {

  const count =
    getUnreadChatCount();


  const badges = [
    document.getElementById(
      "messageBadge"
    ),

    document.getElementById(
      "messageCount"
    ),

    ...document.querySelectorAll(
      "[data-message-badge]"
    )
  ];


  badges.forEach(
    badge => {

      if (!badge) return;


      if (count <= 0) {

        badge.textContent = "";

        badge.classList.remove(
          "show"
        );

      } else {

        badge.textContent =
          count > 99
            ? "99+"
            : String(count);

        badge.classList.add(
          "show"
        );

      }

    }
  );
}


/* =========================
   MESSAGE INITIALIZATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    defaultChats();

    renderChats();

    updateMessageBadge();

  }
);
