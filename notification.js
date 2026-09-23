/* VORTEX NOTIFICATIONS ENGINE
   Handles notification creation, rendering,
   unread state and notification actions.
*/


/* =========================
   GET NOTIFICATIONS
========================= */

function getNotifications() {

  let notifications =
    get(STORE.notifications, []);

  if (!Array.isArray(notifications)) {
    notifications = [];
  }

  return notifications;
}


/* =========================
   ADD NOTIFICATION
========================= */

function addNotification(
  text,
  type = "system",
  icon = "🔔"
) {

  if (!text) return;

  const notifications =
    getNotifications();

  notifications.unshift({
    id: createId("notification"),
    text: String(text),
    type,
    icon,
    read: false,
    date: new Date().toLocaleString()
  });

  /*
    Keep the notification database
    lightweight by storing only the
    newest 100 notifications.
  */

  set(
    STORE.notifications,
    notifications.slice(0, 100)
  );

  renderNotifications();

  updateNotificationBadge();
}


/* =========================
   RENDER NOTIFICATIONS
========================= */

function renderNotifications() {

  const box =
    document.getElementById(
      "notificationList"
    );

  if (!box) return;

  const notifications =
    getNotifications();


  if (!notifications.length) {

    box.innerHTML = `
      <div class="card emptyState">

        <div class="emptyIcon">
          ✨
        </div>

        <h3>
          You're all caught up
        </h3>

        <p class="muted">
          New VORTEX activity will appear here.
        </p>

      </div>
    `;

    updateNotificationBadge();

    return;
  }


  box.innerHTML =
    notifications
      .map(notificationCard)
      .join("");


  updateNotificationBadge();
}


/* =========================
   NOTIFICATION CARD
========================= */

function notificationCard(notification) {

  const readClass =
    notification.read
      ? "notificationRead"
      : "notificationUnread";


  return `
    <article
      class="card notificationCard ${readClass}"
      onclick="markNotificationRead('${escapeHTML(notification.id)}')"
    >

      <div class="row">

        <div class="avatar notificationIcon">
          ${escapeHTML(
            notification.icon || "🔔"
          )}
        </div>

        <div class="grow">

          <strong>
            ${escapeHTML(
              notification.text
            )}
          </strong>

          <small class="muted">
            ${escapeHTML(
              notification.date || ""
            )}
          </small>

        </div>

        ${
          notification.read
            ? ""
            : `
              <span
                class="notificationDot"
                aria-label="Unread"
              ></span>
            `
        }

      </div>

    </article>
  `;
}


/* =========================
   MARK ONE AS READ
========================= */

function markNotificationRead(id) {

  const notifications =
    getNotifications();

  const notification =
    notifications.find(
      item => item.id === id
    );

  if (!notification) return;

  notification.read = true;

  set(
    STORE.notifications,
    notifications
  );

  renderNotifications();
}


/* =========================
   MARK ALL AS READ
========================= */

function markAllRead() {

  const notifications =
    getNotifications();

  notifications.forEach(
    notification => {
      notification.read = true;
    }
  );

  set(
    STORE.notifications,
    notifications
  );

  renderNotifications();

  toast(
    "All notifications marked as read ✓"
  );
}


/* =========================
   UNREAD COUNT
========================= */

function getUnreadNotificationCount() {

  return getNotifications()
    .filter(
      notification
