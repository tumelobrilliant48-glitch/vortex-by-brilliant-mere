/* =========================================================
   VORTEX EVENTS ENGINE
   File: events.js

   Handles:
   - Event creation
   - Public/private events
   - RSVPs
   - Invitations
   - Attendees
   - Event discovery
   - Event statistics
   - Event reminders
   ========================================================= */

(function () {
  "use strict";

  const EVENTS_KEY = "vortex_events";
  const INVITES_KEY = "vortex_event_invites";

  const EVENT_NAME = "vortex:events-change";

  /* -------------------------------------------------------
     Storage
     ------------------------------------------------------- */

  function readEvents() {
    try {
      const data = JSON.parse(
        localStorage.getItem(EVENTS_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveEvents(events) {
    localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify(events)
    );

    emitChange();
  }

  function readInvites() {
    try {
      const data = JSON.parse(
        localStorage.getItem(INVITES_KEY)
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveInvites(invites) {
    localStorage.setItem(
      INVITES_KEY,
      JSON.stringify(invites)
    );

    emitChange();
  }

  /* -------------------------------------------------------
     Helpers
     ------------------------------------------------------- */

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function normalize(value) {
    return clean(value).toLowerCase();
  }

  function parseDate(value) {
    const result = new Date(value);

    return Number.isNaN(result.getTime())
      ? null
      : result;
  }

  function emitChange() {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: {
          events: readEvents()
        }
      })
    );
  }

  /* -------------------------------------------------------
     Create event
     ------------------------------------------------------- */

  function createEvent(data = {}) {
    const creatorId = clean(data.creatorId);
    const title = clean(data.title);

    if (!creatorId || !title) {
      return null;
    }

    const startDate = parseDate(
      data.startDate
    );

    if (!startDate) {
      return null;
    }

    const endDate = data.endDate
      ? parseDate(data.endDate)
      : null;

    if (
      endDate &&
      endDate < startDate
    ) {
      return null;
    }

    const event = {
      id:
        data.id ||
        generateId("event"),

      creatorId,

      title,

      description:
        clean(data.description),

      category:
        clean(data.category) ||
        "General",

      privacy:
        data.privacy === "private"
          ? "private"
          : "public",

      cover:
        data.cover || null,

      location: {
        name:
          clean(
            data.location?.name
          ),

        address:
          clean(
            data.location?.address
          ),

        online:
          Boolean(
            data.location?.online
          ),

        link:
          data.location?.link ||
          null
      },

      startDate:
        startDate.toISOString(),

      endDate:
        endDate
          ? endDate.toISOString()
          : null,

      timezone:
        data.timezone ||
        Intl.DateTimeFormat().resolvedOptions()
          .timeZone,

      capacity:
        Number(data.capacity) > 0
          ? Number(data.capacity)
          : null,

      attendees: [],

      interested: [],

      declined: [],

      tags: Array.isArray(data.tags)
        ? data.tags
        : [],

      cancelled: false,

      createdAt:
        new Date().toISOString(),

      metadata:
        data.metadata || {}
    };

    const events = readEvents();

    events.push(event);

    saveEvents(events);

    return event;
  }

  /* -------------------------------------------------------
     Get event
     ------------------------------------------------------- */

  function getEvent(eventId) {
    return (
      readEvents().find(
        event => event.id === eventId
      ) || null
    );
  }

  /* -------------------------------------------------------
     Update event
     ------------------------------------------------------- */

  function updateEvent(
    eventId,
    updates = {},
    userId
  ) {
    const events = readEvents();

    const index = events.findIndex(
      event => event.id === eventId
    );

    if (index === -1) {
      return null;
    }

    const event = events[index];

    if (
      userId &&
      event.creatorId !== userId
    ) {
      return null;
    }

    const updated = {
      ...event,
      ...updates
    };

    if (
      updates.startDate
    ) {
      const start =
        parseDate(
          updates.startDate
        );

      if (!start) {
        return null;
      }

      updated.startDate =
        start.toISOString();
    }

    if (
      updates.endDate
    ) {
      const end =
        parseDate(
          updates.endDate
        );

      if (!end) {
        return null;
      }

      updated.endDate =
        end.toISOString();
    }

    events[index] = updated;

    saveEvents(events);

    return updated;
  }

  /* -------------------------------------------------------
     Delete event
     ------------------------------------------------------- */

  function deleteEvent(
    eventId,
    userId
  ) {
    const event = getEvent(eventId);

    if (!event) {
      return false;
    }

    if (
      event.creatorId !== userId
    ) {
      return false;
    }

    const events =
      readEvents().filter(
        item =>
          item.id !== eventId
      );

    saveEvents(events);

    const invites =
      readInvites().filter(
        invite =>
          invite.eventId !== eventId
      );

    saveInvites(invites);

    return true;
  }

  /* -------------------------------------------------------
     Cancel event
     ------------------------------------------------------- */

  function cancelEvent(
    eventId,
    userId
  ) {
    const event = getEvent(eventId);

    if (!event) {
      return false;
    }

    if (
      event.creatorId !== userId
    ) {
      return false;
    }

    return Boolean(
      updateEvent(
        eventId,
        {
          cancelled: true
        },
        userId
      )
    );
  }

  /* -------------------------------------------------------
     RSVP
