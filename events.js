/* =========================================================
   VORTEX OMNIVERSE
   EVENTS ENGINE
   ========================================================= */

"use strict";

const VortexEvents = {

  VERSION: "1.0.0",

  events: new Map(),
  attendees: new Map(),
  interested: new Map(),
  comments: new Map(),
  listeners: {},

  STORAGE_EVENTS: "vortex_events",
  STORAGE_ATTENDEES: "vortex_event_attendees",
  STORAGE_INTERESTED: "vortex_event_interested",
  STORAGE_COMMENTS: "vortex_event_comments",

  /* =======================================================
     INIT
     ======================================================= */

  init() {

    this.load();
    this.cleanupPastEvents();

    this.emit("ready", {
      count: this.events.size
    });

    console.log(
      "📅 VORTEX Events Engine ready."
    );

  },

  /* =======================================================
     USER
     ======================================================= */

  getUserId() {

    return (
      window.VortexAuth?.getUserId?.() ||
      window.VortexFriends?.getUserId?.() ||
      "guest"
    );

  },

  getUser() {

    return (
      window.VortexAuth?.getUser?.() ||
      window.VortexFriends?.getUser?.() ||
      {
        id: this.getUserId(),
        name: "VORTEX User",
        username: "vortexuser",
        avatar: ""
      }
    );

  },

  /* =======================================================
     ID
     ======================================================= */

  createId(prefix = "event") {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );

  },

  /* =======================================================
     CREATE EVENT
     ======================================================= */

  create(data = {}) {

    const user = this.getUser();

    const title =
      String(
        data.title ||
        ""
      ).trim();

    if (!title) {

      return {
        success: false,
        error: "Event title is required."
      };

    }

    const event = {

      id: this.createId(),

      creatorId: user.id,

      creator: {
        id: user.id,
        name:
          user.name ||
          "VORTEX User",
        username:
          user.username ||
          "",
        avatar:
          user.avatar ||
          ""
      },

      title,

      description:
        String(
          data.description ||
          ""
        ).trim(),

      category:
        data.category ||
        "general",

      cover:
        data.cover ||
        "",

      date:
        data.date ||
        null,

      startTime:
        data.startTime ||
        "",

      endTime:
        data.endTime ||
        "",

      timezone:
        data.timezone ||
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone,

      location:
        data.location ||
        "",

      latitude:
        data.latitude ??
        null,

      longitude:
        data.longitude ??
        null,

      online:
        Boolean(
          data.online
        ),

      onlineUrl:
        data.onlineUrl ||
        "",

      privacy:
        data.privacy ||
        "public",

      capacity:
        Number(
          data.capacity
        ) ||
        0,

      price:
        Number(
          data.price
        ) ||
        0,

      currency:
        data.currency ||
        "BWP",

      tags:
        Array.isArray(
          data.tags
        )
          ? data.tags
          : this.extractTags(
              `${title} ${data.description || ""}`
            ),

      attendees:
        0,

      interested:
        0,

      views:
        0,

      status:
        "upcoming",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    this.events.set(
      event.id,
      event
    );

    this.attendees.set(
      event.id,
      new Set()
    );

    this.interested.set(
      event.id,
      new Set()
    );

    this.save();

    this.emit(
      "created",
      event
    );

    return {
      success: true,
      event
    };

  },

  /* =======================================================
     GET EVENT
     ======================================================= */

  get(eventId) {

    return (
      this.events.get(
        eventId
      ) ||
      null
    );

  },

  /* =======================================================
     UPDATE EVENT
     ======================================================= */

  update(
    eventId,
    changes = {}
  ) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false,
        error: "Event not found."
      };

    }

    if (
      event.creatorId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error: "Only the creator can edit this event."
      };

    }

    const allowed = [

      "title",
      "description",
      "category",
      "cover",
      "date",
      "startTime",
      "endTime",
      "timezone",
      "location",
      "latitude",
      "longitude",
      "online",
      "onlineUrl",
      "privacy",
      "capacity",
      "price",
      "currency",
      "tags"

    ];

    allowed.forEach(
      key => {

        if (
          changes[key] !==
          undefined
        ) {

          event[key] =
            changes[key];

        }

      }
    );

    event.updatedAt =
      new Date().toISOString();

    this.save();

    this.emit(
      "updated",
      event
    );

    return {
      success: true,
      event
    };

  },

  /* =======================================================
     DELETE EVENT
     ======================================================= */

  delete(eventId) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false
      };

    }

    if (
      event.creatorId !==
      this.getUserId()
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    this.events.delete(
      eventId
    );

    this.attendees.delete(
      eventId
    );

    this.interested.delete(
      eventId
    );

    this.comments.delete(
      eventId
    );

    this.save();

    this.emit(
      "deleted",
      event
    );

    return {
      success: true
    };

  },

  /* =======================================================
     ATTEND EVENT
     ======================================================= */

  attend(eventId) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false,
        error: "Event not found."
      };

    }

    const userId =
      this.getUserId();

    if (
      event.capacity > 0 &&
      this.getAttendeeCount(
        eventId
      ) >= event.capacity
    ) {

      return {
        success: false,
        error: "Event is full."
      };

    }

    if (
      !this.attendees.has(
        eventId
      )
    ) {

      this.attendees.set(
        eventId,
        new Set()
      );

    }

    const set =
      this.attendees.get(
        eventId
      );

    if (
      set.has(
        userId
      )
    ) {

      return {
        success: false,
        error: "Already attending."
      };

    }

    set.add(
      userId
    );

    this.removeInterested(
      eventId,
      false
    );

    event.attendees =
      set.size;

    event.interested =
      this.getInterestedCount(
        eventId
      );

    this.save();

    this.notifyCreator(
      event,
      "attend"
    );

    this.emit(
      "attending",
      {
        event,
        userId
      }
    );

    return {
      success: true,
      event
    };

  },

  /* =======================================================
     LEAVE EVENT
     ======================================================= */

  leave(eventId) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false
      };

    }

    const userId =
      this.getUserId();

    const set =
      this.attendees.get(
        eventId
      );

    if (
      !set?.has(
        userId
      )
    ) {

      return {
        success: false,
        error: "You are not attending."
      };

    }

    set.delete(
      userId
    );

    event.attendees =
      set.size;

    this.save();

    this.emit(
      "left",
      {
        event,
        userId
      }
    );

    return {
      success: true
    };

  },

  /* =======================================================
     INTERESTED
     ======================================================= */

  markInterested(
    eventId
  ) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false
      };

    }

    const userId =
      this.getUserId();

    if (
      !this.interested.has(
        eventId
      )
    ) {

      this.interested.set(
        eventId,
        new Set()
      );

    }

    const set =
      this.interested.get(
        eventId
      );

    if (
      set.has(
        userId
      )
    ) {

      set.delete(
        userId
      );

      event.interested =
        set.size;

      this.save();

      return {
        success: true,
        interested: false
      };

    }

    set.add(
      userId
    );

    this.removeAttendee(
      eventId,
      false
    );

    event.interested =
      set.size;

    this.save();

    this.emit(
      "interested",
      {
        event,
        userId
      }
    );

    return {
      success: true,
      interested: true
    };

  },

  /* =======================================================
     REMOVE INTERESTED
     ======================================================= */

  removeInterested(
    eventId,
    save = true
  ) {

    const set =
      this.interested.get(
        eventId
      );

    if (!set) {

      return false;

    }

    const removed =
      set.delete(
        this.getUserId()
      );

    const event =
      this.get(
        eventId
      );

    if (event) {

      event.interested =
        set.size;

    }

    if (save) {

      this.save();

    }

    return removed;

  },

  /* =======================================================
     REMOVE ATTENDEE
     ======================================================= */

  removeAttendee(
    eventId,
    save = true
  ) {

    const set =
      this.attendees.get(
        eventId
      );

    if (!set) {

      return false;

    }

    const removed =
      set.delete(
        this.getUserId()
      );

    const event =
      this.get(
        eventId
      );

    if (event) {

      event.attendees =
        set.size;

    }

    if (save) {

      this.save();

    }

    return removed;

  },

  /* =======================================================
     CHECK STATUS
     ======================================================= */

  getMyStatus(eventId) {

    const userId =
      this.getUserId();

    if (
      this.attendees
        .get(eventId)
        ?.has(userId)
    ) {

      return "attending";

    }

    if (
      this.interested
        .get(eventId)
        ?.has(userId)
    ) {

      return "interested";

    }

    return "none";

  },

  /* =======================================================
     COUNTS
     ======================================================= */

  getAttendeeCount(eventId) {

    return (
      this.attendees
        .get(eventId)
        ?.size ||
      0
    );

  },

  getInterestedCount(eventId) {

    return (
      this.interested
        .get(eventId)
        ?.size ||
      0
    );

  },

  /* =======================================================
     GET ATTENDEES
     ======================================================= */

  getAttendees(eventId) {

    return [
      ...(
        this.attendees.get(
          eventId
        ) ||
        []
      )
    ];

  },

  /* =======================================================
     GET INTERESTED USERS
     ======================================================= */

  getInterested(eventId) {

    return [
      ...(
        this.interested.get(
          eventId
        ) ||
        []
      )
    ];

  },

  /* =======================================================
     ADD COMMENT
     ======================================================= */

  addComment(
    eventId,
    text
  ) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false
      };

    }

    text =
      String(
        text ||
        ""
      ).trim();

    if (!text) {

      return {
        success: false,
        error: "Comment cannot be empty."
      };

    }

    const user =
      this.getUser();

    const comment = {

      id:
        this.createId(
          "event_comment"
        ),

      eventId,

      userId:
        user.id,

      user: {

        id:
          user.id,

        name:
          user.name ||
          "VORTEX User",

        username:
          user.username ||
          "",

        avatar:
          user.avatar ||
          ""

      },

      text,

      createdAt:
        new Date().toISOString()

    };

    if (
      !this.comments.has(
        eventId
      )
    ) {

      this.comments.set(
        eventId,
        []
      );

    }

    this.comments
      .get(
        eventId
      )
      .push(
        comment
      );

    this.save();

    this.emit(
      "commentAdded",
      comment
    );

    return {
      success: true,
      comment
    };

  },

  /* =======================================================
     GET COMMENTS
     ======================================================= */

  getComments(eventId) {

    return (
      this.comments.get(
        eventId
      ) ||
      []
    );

  },

  /* =======================================================
     DELETE COMMENT
     ======================================================= */

  deleteComment(
    eventId,
    commentId
  ) {

    const list =
      this.comments.get(
        eventId
      ) ||
      [];

    const userId =
      this.getUserId();

    const comment =
      list.find(
        item =>
          item.id ===
          commentId
      );

    if (!comment) {

      return {
        success: false
      };

    }

    const event =
      this.get(
        eventId
      );

    if (
      comment.userId !==
        userId &&
      event?.creatorId !==
        userId
    ) {

      return {
        success: false,
        error: "Permission denied."
      };

    }

    this.comments.set(
      eventId,
      list.filter(
        item =>
          item.id !==
          commentId
      )
    );

    this.save();

    this.emit(
      "commentDeleted",
      comment
    );

    return {
      success: true
    };

  },

  /* =======================================================
     VIEW
     ======================================================= */

  view(eventId) {

    const event =
      this.get(
        eventId
      );

    if (!event) {

      return {
        success: false
      };

    }

    event.views =
      (
        event.views ||
        0
      ) + 1;

    this.save();

    this.emit(
      "viewed",
      event
    );

    return {
      success: true,
      views:
        event.views
    };

  },

  /* =======================================================
     UPCOMING EVENTS
     ======================================================= */

  getUpcoming(
    limit = 50
  ) {

    const now =
      Date.now();

    return [
      ...this.events.values()
    ]
      .filter(
        event =>
          event.date &&
          new Date(
            `${event.date}T${event.startTime || "00:00"}`
          ).getTime() >=
            now &&
          this.canView(
            event
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          this.eventTimestamp(
            a
          ) -
          this.eventTimestamp(
            b
          )
      )
      .slice(
        0,
        limit
      );

  },

  /* =======================================================
     TODAY
     ======================================================= */

  getToday() {

    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    return [
      ...this.events.values()
    ]
      .filter(
        event =>
          event.date ===
          today &&
          this.canView(
            event
          )
      )
      .sort(
        this.sortByTime.bind(
          this
        )
      );

  },

  /* =======================================================
     MY EVENTS
     ======================================================= */

  getMyEvents() {

    const userId =
      this.getUserId();

    return [
      ...this.events.values()
    ]
      .filter(
        event =>
          event.creatorId ===
            userId ||
          this.getMyStatus(
            event.id
          ) !== "none"
      )
      .sort(
        (
          a,
          b
        ) =>
          this.eventTimestamp(
            a
          ) -
          this.eventTimestamp(
            b
          )
      );

  },

  /* =======================================================
     CREATED EVENTS
     ======================================================= */

  getCreatedEvents() {

    const userId =
      this.getUserId();

    return [
      ...this.events.values()
    ]
      .filter(
        event =>
          event.creatorId ===
          userId
      )
      .sort(
        (
          a,
          b
        ) =>
          this.eventTimestamp(
            a
          ) -
          this.eventTimestamp(
            b
          )
      );

  },

  /* =======================================================
     CATEGORY
     ======================================================= */

  getByCategory(
    category
  ) {

    return [
      ...this.events.values()
    ]
      .filter(
        event =>
          event.category
            ?.toLowerCase() ===
          String(
            category
          )
            .toLowerCase()
      )
      .filter(
        event =>
          this.canView(
            event
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          this.eventTimestamp(
            a
          ) -
          this.eventTimestamp(
            b
          )
      );

  },

  /* =======================================================
     SEARCH
     ======================================================= */

  search(
    query
  ) {

    const q =
      String(
        query ||
        ""
      )
      .trim()
      .toLowerCase();

    if (!q) {

      return [];

    }

    return [
      ...this.events.values()
    ]
      .filter(
        event =>
          this.canView(
            event
          )
      )
      .filter(
        event =>

          event.title
            ?.toLowerCase()
            .includes(q) ||

          event.description
            ?.toLowerCase()
            .includes(q) ||

          event.location
            ?.toLowerCase()
            .includes(q) ||

          event.category
            ?.toLowerCase()
            .includes(q) ||

          event.tags?.some(
            tag =>
              tag
                .toLowerCase()
                .includes(q)
          )
      );

  },

  /* =======================================================
     DISCOVER
     ======================================================= */

  discover(
    options = {}
  ) {

    const limit =
      Number(
        options.limit
      ) ||
      30;

    let list =
      this.getUpcoming(
        500
      );

    if (
      options.category
    ) {

      list =
        list.filter(
          event =>
            event.category ===
            options.category
        );

    }

    if (
      options.online !==
      undefined
    ) {

      list =
        list.filter(
          event =>
            event.online ===
            Boolean(
              options.online
            )
        );

    }

    if (
      options.maxPrice !==
      undefined
    ) {

      list =
        list.filter(
          event =>
            event.price <=
            Number(
              options.maxPrice
            )
        );

    }

    return list
      .sort(
        (
          a,
          b
        ) =>
          this.discoveryScore(
            b
          ) -
          this.discoveryScore(
            a
          )
      )
      .slice(
        0,
        limit
      );

  },

  /* =======================================================
     DISCOVERY SCORE
     ======================================================= */

  discoveryScore(
    event
  ) {

    const now =
      Date.now();

    const time =
      this.eventTimestamp(
        event
      );

    const days =
      Math.max(
        0,
        (
          time -
          now
        ) /
        86400000
      );

    return (

      (event.attendees || 0) * 5 +

      (event.interested || 0) * 3 +

      (event.views || 0) * 0.1 +

      Math.max(
        0,
        50 - days
      )

    );

  },

  /* =======================================================
     VISIBILITY
     ======================================================= */

  canView(event) {

    const userId =
      this.getUserId();

    if (
      event.creatorId ===
      userId
    ) {

      return true;

    }

    if (
      event.privacy ===
      "public"
    ) {

      return true;

    }

    if (
      event.privacy ===
      "private"
    ) {

      return false;

    }

    if (
      event.privacy ===
      "friends"
    ) {

      return Boolean(
        window.VortexFriends
          ?.areFriends?.(
            userId,
            event.creatorId
          )
      );

    }

    return true;

  },

  /* =======================================================
     EVENT TIMESTAMP
     ======================================================= */

  eventTimestamp(
    event
  ) {

    if (!event.date) {

      return Infinity;

    }

    return new Date(
      `${event.date}T${
        event.startTime ||
        "00:00"
      }`
    ).getTime();

  },

  /* =======================================================
     SORT TIME
     ======================================================= */

  sortByTime(
    a,
    b
  ) {

    return (
      this.eventTimestamp(a) -
      this.eventTimestamp(b)
    );

  },

  /* =======================================================
     PAST EVENTS
     ======================================================= */

  cleanupPastEvents() {

    const now =
      Date.now();

    this.events.forEach(
      event => {

        const timestamp =
          this.eventTimestamp(
            event
          );

        if (
          timestamp !== Infinity &&
          timestamp < now
        ) {

          event.status =
            "past";

        }

      }
    );

    this.save();

  },

  /* =======================================================
     TAG EXTRACTION
     ======================================================= */

  extractTags(
    text
  ) {

    const matches =
      String(
        text ||
        ""
      ).match(
        /#[a-zA-Z0-9_]+/g
      ) ||
      [];

    return [
      ...new Set(
        matches.map(
          tag =>
            tag
              .slice(1)
              .toLowerCase()
        )
      )
    ];

  },

  /* =======================================================
     NOTIFICATION
     ======================================================= */

  notifyCreator(
    event,
    action
  ) {

    if (
      event.creatorId ===
      this.getUserId()
    ) {

      return;

    }

    let message =
      `${this.getUser().name} interacted with your event.`;

    if (
      action ===
      "attend"
    ) {

      message =
        `${this.getUser().name} is attending your event.`;

    }

    window.VortexNotifications
      ?.create?.({

        recipientId:
          event.creatorId,

        type:
          "event",

        title:
          "Event activity",

        message,

        eventId:
          event.id,

        fromUserId:
          this.getUserId()

      });

  },

  /* =======================================================
     RENDER CARD
     ======================================================= */

  renderCard(
    event,
    container
  ) {

    if (
      typeof container ===
      "string"
    ) {

      container =
        document.querySelector(
          container
        );

    }

    if (!container) {

      return;

    }

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "vortex-event-card";

    card.dataset.eventId =
      event.id;

    const status =
      this.getMyStatus(
        event.id
      );

    card.style.cssText = `

      background:
        rgba(10,15,30,.9);

      border:
        1px solid
        rgba(255,255,255,.08);

      border-radius:
        22px;

      overflow:hidden;

      margin-bottom:
        14px;

      color:white;

      box-shadow:
        0 15px 40px
        rgba(0,0,0,.2);

    `;

    card.innerHTML = `

      ${
        event.cover
          ? `
            <img
              src="${this.escape(
                event.cover
              )}"
              style="
                width:100%;
                height:170px;
                object-fit:cover;
                display:block;
              "
            >
          `
          : `
            <div style="
              height:170px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:50px;
              background:
                linear-gradient(
                  135deg,
                  #00d9ff,
                  #3478ff,
                  #8b4dff
                );
            ">
              📅
            </div>
          `
      }

      <div style="
        padding:16px;
      ">

        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          margin-bottom:8px;
        ">

          <span style="
            padding:5px 9px;
            border-radius:10px;
            font-size:10px;
            background:
              rgba(0,217,255,.12);
            color:#00d9ff;
          ">
            ${this.escape(
              event.category
            )}
          </span>

          ${
            event.online
              ? `
                <span style="
                  padding:5px 9px;
                  border-radius:10px;
                  font-size:10px;
                  background:
                    rgba(139,77,255,.14);
                  color:#b69cff;
                ">
                  ONLINE
                </span>
              `
              : ""
          }

        </div>

        <h3 style="
          margin:
            0 0 8px;
          font-size:19px;
        ">
          ${this.escape(
            event.title
          )}
        </h3>

        <p style="
          opacity:.65;
          font-size:13px;
          line-height:1.5;
          margin:
            0 0 12px;
        ">
          ${this.escape(
            event.description
              ?.slice(
                0,
                150
              ) ||
            "No description."
          )}
        </p>

        <div style="
          display:grid;
          gap:7px;
          font-size:12px;
          opacity:.75;
          margin-bottom:14px;
        ">

          <div>
            🗓️
            ${this.formatDate(
              event
            )}
          </div>

          ${
            event.location
              ? `
                <div>
                  📍
                  ${this.escape(
                    event.location
                  )}
                </div>
              `
              : ""
          }

          <div>
            👥
            ${event.attendees || 0}
            attending
            ·
            ${event.interested || 0}
            interested
          </div>

          ${
            event.price > 0
              ? `
                <div>
                  💰
                  ${event.price}
                  ${this.escape(
                    event.currency
                  )}
                </div>
              `
              : `
                <div>
                  🆓 Free
                </div>
              `
          }

        </div>

        <div style="
          display:grid;
          grid-template-columns:
            1fr 1fr;
          gap:8px;
        ">

          <button
            data-event-action="attend"
            style="
              border:0;
              border-radius:14px;
              padding:11px;
              background:
                ${
                  status ===
                  "attending"
                    ? "rgba(0,217,255,.2)"
                    : "linear-gradient(135deg,#00d9ff,#3478ff)"
                };
              color:white;
              font-weight:800;
            "
          >
            ${
              status ===
              "attending"
                ? "✓ Attending"
                : "Attend"
            }
          </button>

          <button
            data-event-action="interested"
            style="
              border:
                1px solid
                rgba(255,255,255,.1);
              border-radius:14px;
              padding:11px;
              background:
                ${
                  status ===
                  "interested"
                    ? "rgba(139,77,255,.2)"
                    : "rgba(255,255,255,.04)"
                };
              color:white;
            "
          >
            ${
              status ===
              "interested"
                ? "★ Interested"
                : "☆ Interested"
            }
          </button>

        </div>

        <button
          data-event-action="open"
          style="
            width:100%;
            margin-top:8px;
            border:0;
            background:
              transparent;
            color:
              rgba(255,255,255,.6);
            padding:8px;
          "
        >
          View event →
        </button>

      </div>

    `;

    card
      .querySelectorAll(
        "[data-event-action]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const action =
                button.dataset
                  .eventAction;

              if (
                action ===
                "attend"
              ) {

                if (
                  this.getMyStatus(
                    event.id
                  ) ===
                  "attending"
                ) {

                  this.leave(
                    event.id
                  );

                } else {

                  this.attend(
                    event.id
                  );

                }

                this.renderCard(
                  this.get(
                    event.id
                  ),
                  container
                );

              }

              if (
                action ===
                "interested"
              ) {

                this.markInterested(
                  event.id
                );

                this.renderCard(
                  this.get(
                    event.id
                  ),
                  container
                );

              }

              if (
                action ===
                "open"
              ) {

                this.emit(
                  "openRequested",
                  event
                );

              }

            }
          );

        }
      );

    container.appendChild(
      card
    );

  },

  /* =======================================================
     RENDER LIST
     ======================================================= */

  renderList(
    container,
    events =
      this.getUpcoming()
  ) {

    if (
      typeof container ===
      "string"
    ) {

      container =
        document.querySelector(
          container
        );

    }

    if (!container) {

      return;

    }

    container.innerHTML =
      "";

    if (
      !events.length
    ) {

      container.innerHTML = `

        <div style="
          padding:40px 20px;
          text-align:center;
          opacity:.55;
        ">
          <div style="
            font-size:42px;
            margin-bottom:10px;
          ">
            📅
          </div>

          No upcoming events yet.
        </div>

      `;

      return;

    }

    events.forEach(
      event =>
        this.renderCard(
          event,
          container
        )
    );

  },

  /* =======================================================
     FORMAT DATE
     ======================================================= */

  formatDate(
    event
  ) {

    if (!event.date) {

      return "Date not set";

    }

    const date =
      new Date(
        `${event.date}T${
          event.startTime ||
          "00:00"
        }`
      );

    const dateText =
      date.toLocaleDateString(
        undefined,
        {
          weekday:
            "short",
          day:
            "numeric",
          month:
            "short",
          year:
            "numeric"
        }
      );

    if (
      event.startTime
    ) {

      return (
        dateText +
        " · " +
        event.startTime
      );

    }

    return dateText;

  },

  /* =======================================================
     SAVE
     ======================================================= */

  save() {

    try {

      localStorage.setItem(
        this.STORAGE_EVENTS,
        JSON.stringify(
          Object.fromEntries(
            this.events
          )
        )
      );

      const attendees = {};

      this.attendees.forEach(
        (
          set,
          eventId
        ) => {

          attendees[eventId] =
            [
              ...set
            ];

        }
      );

      localStorage.setItem(
        this.STORAGE_ATTENDEES,
        JSON.stringify(
          attendees
        )
      );

      const interested = {};

      this.interested.forEach(
        (
          set,
          eventId
        ) => {

          interested[eventId] =
            [
              ...set
            ];

        }
      );

      localStorage.setItem(
        this.STORAGE_INTERESTED,
        JSON.stringify(
          interested
        )
      );

      localStorage.setItem(
        this.STORAGE_COMMENTS,
        JSON.stringify(
          Object.fromEntries(
            this.comments
          )
        )
      );

    } catch (
      error
    ) {

      console.warn(
        "VORTEX Events save error:",
        error
      );

    }

  },

  /* =======================================================
     LOAD
     ======================================================= */

  load() {

    try {

      const events =
        JSON.parse(
          localStorage.getItem(
            this.STORAGE_EVENTS
          ) ||
          "{}"
        );

      Object.entries(
        events
      ).forEach(
        ([
          id,
          event
        ]) => {

          this.events.set(
            id,
            event
          );

        }
      );

      const attendees =
        JSON.parse(
          localStorage.getItem(
            this.STORAGE_ATTENDEES
          ) ||
          "{}"
        );

      Object.entries(
        attendees
      ).forEach(
        ([
          id,
          users
        ]) => {

          this.attendees.set(
            id,
            new Set(
              users
            )
          );

        }
      );

      const interested =
        JSON.parse(
          localStorage.getItem(
            this.STORAGE_INTERESTED
          ) ||
          "{}"
        );

      Object.entries(
        interested
      ).forEach(
        ([
          id,
          users
        ]) => {

          this.interested.set(
            id,
            new Set(
              users
            )
          );

        }
      );

      const comments =
        JSON.parse(
          localStorage.getItem(
            this.STORAGE_COMMENTS
          ) ||
          "{}"
        );

      Object.entries(
        comments
      ).forEach(
        ([
          id,
          list
        ]) => {

          this.comments.set(
            id,
            list
          );

        }
      );

    } catch (
      error
    ) {

      console.warn(
        "VORTEX Events load error:",
        error
      );

    }

  },

  /* =======================================================
     EVENTS API
     ======================================================= */

  on(
    event,
    callback
  ) {

    if (
      !this.listeners[event]
    ) {

      this.listeners[event] =
        [];

    }

    this.listeners[event].push(
      callback
    );

    return () => {

      this.listeners[event] =
        this.listeners[event].filter(
          fn =>
            fn !==
            callback
        );

    };

  },

  emit(
    event,
    data
  ) {

    (
      this.listeners[event] ||
      []
    ).forEach(
      callback => {

        try {

          callback(
            data
          );

        } catch (
          error
        ) {

          console.error(
            "VORTEX Events listener error:",
            error
          );

        }

      }
    );

  },

  /* =======================================================
     ESCAPE
     ======================================================= */

  escape(
    value
  ) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      String(
        value ??
        ""
      );

    return div.innerHTML;

  }

};


/* =========================================================
   GLOBAL
   ========================================================= */

window.VortexEvents =
  VortexEvents;


/* =========================================================
   AUTO INIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    VortexEvents.init();

  }
);
