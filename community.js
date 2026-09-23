/* VORTEX COMMUNITY ENGINE
   Groups, Pages, Events, Jobs,
   Fundraisers, Dating and community tools.
*/


/* =========================
   GROUPS
========================= */

function getGroups() {

  let groups = get(
    STORE.groups,
    null
  );

  if (Array.isArray(groups)) {
    return groups;
  }

  groups = [
    {
      id: createId("group"),
      name: "VORTEX Creators",
      members: 1240,
      joined: false,
      description:
        "Creators building together."
    },

    {
      id: createId("group"),
      name: "Gaming Zone",
      members: 870,
      joined: false,
      description:
        "Games, challenges and competitions."
    },

    {
      id: createId("group"),
      name: "Students Hub",
      members: 530,
      joined: false,
      description:
        "Learning, revision and ideas."
    }
  ];

  set(
    STORE.groups,
    groups
  );

  return groups;
}


function renderGroups() {

  const box =
    document.getElementById(
      "groupList"
    );

  if (!box) return;

  const groups =
    getGroups();

  box.innerHTML =
    groups.map(group => `

      <div class="card groupCard">

        <div class="row">

          <div class="avatar">
            👥
          </div>

          <div class="grow">

            <strong>
              ${escapeHTML(group.name)}
            </strong>

            <div class="muted">
              ${formatNumber(group.members)}
              members
            </div>

          </div>

          <button
            class="btn small"
            onclick="toggleGroup('${escapeHTML(group.id)}')"
          >
            ${group.joined ? "Leave" : "Join"}
          </button>

        </div>

        <p class="muted">
          ${escapeHTML(group.description)}
        </p>

      </div>

    `).join("");
}


function toggleGroup(id) {

  const groups =
    getGroups();

  const group =
    groups.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!group) return;

  group.joined =
    !group.joined;

  group.members =
    Math.max(
      0,
      safeNumber(group.members) +
      (group.joined ? 1 : -1)
    );

  set(
    STORE.groups,
    groups
  );

  renderGroups();

  if (group.joined) {

    addNotification(
      `You joined ${group.name}.`,
      "group",
      "👥"
    );

    toast(
      "Joined group ✓"
    );

  } else {

    toast(
      "Left group."
    );

  }
}


function createGroup() {

  showModal(
    "Create Group",
    `
      <input
        id="groupName"
        placeholder="Group name"
        maxlength="60"
      >

      <br><br>

      <textarea
        id="groupDesc"
        placeholder="Describe your group..."
        maxlength="300"
      ></textarea>

      <br>

      <button
        class="btn primary"
        onclick="saveGroup()"
      >
        Create Group
      </button>
    `
  );
}


function saveGroup() {

  const name =
    document.getElementById(
      "groupName"
    )?.value.trim();

  const description =
    document.getElementById(
      "groupDesc"
    )?.value.trim();


  if (!name) {

    toast(
      "Enter a group name."
    );

    return;
  }


  const groups =
    getGroups();


  groups.unshift({

    id:
      createId("group"),

    name,

    members: 1,

    joined: true,

    description:
      description ||
      "A new VORTEX community."

  });


  set(
    STORE.groups,
    groups
  );


  hideModal();

  renderGroups();

  toast(
    "Group created 👥"
  );
}


/* =========================
   PAGES
========================= */

function renderPages() {

  const box =
    document.getElementById(
      "pageList"
    );

  if (!box) return;


  const pages = [

    [
      "🚀",
      "VORTEX Official",
      "Technology & community"
    ],

    [
      "🎮",
      "VORTEX Gaming",
      "Games & competitions"
    ],

    [
      "🎨",
      "VORTEX Creators",
      "Creative community"
    ],

    [
      "📚",
      "VORTEX Learning",
      "Education & knowledge"
    ]

  ];


  box.innerHTML =
    pages.map(page => `

      <div class="card row">

        <div class="avatar">
          ${page[0]}
        </div>

        <div class="grow">

          <strong>
            ${escapeHTML(page[1])}
          </strong>

          <div class="muted">
            ${escapeHTML(page[2])}
          </div>

        </div>

        <button
          class="btn small"
          onclick="followPage('${escapeHTML(page[1])}')"
        >
          Follow
        </button>

      </div>

    `).join("");
}


function followPage(name) {

  addNotification(
    `You followed ${name}.`,
    "page",
    "📄"
  );

  toast(
    "Page followed ✓"
  );
}


function createPage() {

  showModal(
    "Create Page",
    `
      <input
        id="pageName"
        placeholder="Page name"
        maxlength="60"
      >

      <br><br>

      <textarea
        id="pageDesc"
        placeholder="Page description"
        maxlength="300"
      ></textarea>

      <br>

      <button
        class="btn primary"
        onclick="savePage()"
      >
        Create Page
      </button>
    `
  );
}


function savePage() {

  const name =
    document.getElementById(
      "pageName"
    )?.value.trim();


  if (!name) {

    toast(
      "Enter a page name."
    );

    return;
  }


  hideModal();

  toast(
    "Page created 📄"
  );
}


/* =========================
   EVENTS
========================= */

function getEvents() {

  let events =
    get(
      STORE.events,
      null
    );

  if (Array.isArray(events)) {
    return events;
  }


  events = [

    {
      id: createId("event"),
      name: "VORTEX Creator Meetup",
      date: "Saturday",
      location: "Gaborone",
      interested: false
    },

    {
      id: createId("event"),
      name: "VORTEX Gaming Challenge",
      date: "Sunday",
      location: "Online",
      interested: false
    }

  ];


  set(
    STORE.events,
    events
  );


  return events;
}


function renderEvents() {

  const box =
    document.getElementById(
      "eventList"
    );

  if (!box) return;


  const events =
    getEvents();


  box.innerHTML =
    events.map(event => `

      <div class="card">

        <h3>
          📅 ${escapeHTML(event.name)}
        </h3>

        <p class="muted">
          ${escapeHTML(event.date)}
          ·
          ${escapeHTML(event.location)}
        </p>

        <button
          class="btn primary"
          onclick="joinEvent('${escapeHTML(event.id)}')"
        >
          ${event.interested
            ? "Interested ✓"
            : "Interested"}
        </button>

      </div>

    `).join("");
}


function joinEvent(id) {

  const events =
    getEvents();

  const event =
    events.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!event) return;


  event.interested =
    !event.interested;


  set(
    STORE.events,
    events
  );


  renderEvents();


  if (event.interested) {

    addNotification(
      `You are interested in ${event.name}.`,
      "event",
      "📅"
    );

    toast(
      "Event saved 📅"
    );

  } else {

    toast(
      "Event removed."
    );

  }
}


function createEvent() {

  showModal(
    "Create Event",
    `
      <input
        id="eventName"
        placeholder="Event name"
      >

      <br><br>

      <input
        id="eventDate"
        placeholder="Date"
      >

      <br><br>

      <input
        id="eventLocation"
        placeholder="Location"
      >

      <br><br>

      <textarea
        id="eventDescription"
        placeholder="Description"
      ></textarea>

      <br>

      <button
        class="btn primary"
        onclick="saveEvent()"
      >
        Create Event
      </button>
    `
  );
}


function saveEvent() {

  const name =
    document.getElementById(
      "eventName"
    )?.value.trim();

  if (!name) {

    toast(
      "Enter an event name."
    );

    return;
  }


  const events =
    getEvents();


  events.unshift({

    id:
      createId("event"),

    name,

    date:
      document.getElementById(
        "eventDate"
      )?.value.trim() ||
      "Date to be announced",

    location:
      document.getElementById(
        "eventLocation"
      )?.value.trim() ||
      "Online",

    interested: false

  });


  set(
    STORE.events,
    events
  );


  hideModal();

  renderEvents();

  toast(
    "Event created 📅"
  );
}


/* =========================
   JOBS
========================= */

function getJobs() {

  let jobs =
    get(
      STORE.jobs,
      null
    );

  if (Array.isArray(jobs)) {
    return jobs;
  }


  jobs = [

    {
      id: createId("job"),
      title: "Frontend Developer",
      company: "VORTEX Labs",
      category: "Technology",
      location: "Gaborone"
    },

    {
      id: createId("job"),
      title: "Graphic Designer",
      company: "Creative Studio",
      category: "Creative",
      location: "Remote"
    },

    {
      id: createId("job"),
      title: "Social Media Manager",
      company: "VORTEX",
      category: "Marketing",
      location: "Botswana"
    },

    {
      id: createId("job"),
      title: "Game Developer",
      company: "VORTEX Gamers",
      category: "Gaming",
      location: "Remote"
    }

  ];


  set(
    STORE.jobs,
    jobs
  );


  return jobs;
}


function renderJobs() {

  const box =
    document.getElementById(
      "jobList"
    );

  if (!box) return;


  const jobs =
    getJobs();


  box.innerHTML =
    jobs.map(job => `

      <div class="card jobCard">

        <h3>
          💼 ${escapeHTML(job.title)}
        </h3>

        <p>
          <strong>
            ${escapeHTML(job.company)}
          </strong>
        </p>

        <p class="muted">
          ${escapeHTML(job.category)}
          ·
          ${escapeHTML(job.location)}
        </p>

        <button
          class="btn primary"
          onclick="applyJob('${escapeHTML(job.id)}')"
        >
          Apply
        </button>

      </div>

    `).join("");
}


function applyJob(id) {

  const job =
    getJobs().find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!job) return;


  showModal(
    "Job Application",
    `
      <h3>
        ${escapeHTML(job.title)}
      </h3>

      <p class="muted">
        ${escapeHTML(job.company)}
        ·
        ${escapeHTML(job.location)}
      </p>

      <textarea
        id="jobApplication"
        placeholder="Tell the employer about yourself..."
      ></textarea>

      <br>

      <button
        class="btn primary"
        onclick="submitJobApplication('${escapeHTML(job.id)}')"
      >
        Submit Application
      </button>
    `
  );
}


function submitJobApplication(id) {

  const application =
    document.getElementById(
      "jobApplication"
    )?.value.trim();


  if (!application) {

    toast(
      "Write a short application."
    );

    return;
  }


  hideModal();

  toast(
    "Application submitted 💼"
  );
}


function createJob() {

  showModal(
    "Post a Job",
    `
      <input
        id="jobName"
        placeholder="Job title"
      >

      <br><br>

      <input
        id="jobCompany"
        placeholder="Company"
      >

      <br><br>

      <input
        id="jobLocation"
        placeholder="Location"
      >

      <br><br>

      <textarea
        id="jobDescription"
        placeholder="Job description"
      ></textarea>

      <br>

      <button
        class="btn primary"
        onclick="saveJob()"
      >
        Post Job
      </button>
    `
  );
}


function saveJob() {

  const title =
    document.getElementById(
      "jobName"
    )?.value.trim();


  if (!title) {

    toast(
      "Enter a job title."
    );

    return;
  }


  const jobs =
    getJobs();


  jobs.unshift({

    id:
      createId("job"),

    title,

    company:
      document.getElementById(
        "jobCompany"
      )?.value.trim() ||
      "VORTEX Community",

    category:
      "Community",

    location:
      document.getElementById(
        "jobLocation"
      )?.value.trim() ||
      "Remote"

  });


  set(
    STORE.jobs,
    jobs
  );


  hideModal();

  renderJobs();

  toast(
    "Job posted 💼"
  );
}


/* =========================
   FUNDRAISERS
========================= */

function getFundraisers() {

  let data =
    get(
      STORE.fundraisers,
      null
    );

  if (Array.isArray(data)) {
    return data;
  }


  data = [

    {
      id: createId("fundraiser"),
      title: "Help a Community Project",
      goal: 10000,
      raised: 3200
    },

    {
      id: createId("fundraiser"),
      title: "Education Support",
      goal: 5000,
      raised: 2100
    }

  ];


  set(
    STORE.fundraisers,
    data
  );


  return data;
}


function renderFundraisers() {

  const box =
    document.getElementById(
      "fundraiserList"
    );

  if (!box) return;


  const data =
    getFundraisers();


  box.innerHTML =
    data.map(item => {

      const goal =
        safeNumber(item.goal);

      const raised =
        safeNumber(item.raised);

      const percent =
        goal > 0
          ? Math.min(
              100,
              Math.round(
                (raised / goal) * 100
              )
            )
          : 0;


      return `

        <div class="card">

          <h3>
            🤝 ${escapeHTML(item.title)}
          </h3>

          <p>
            P${raised.toLocaleString()}
            raised of
            P${goal.toLocaleString()}
          </p>

          <div class="progress">

            <div
              class="progressBar"
              style="width:${percent}%"
            ></div>

          </div>

          <br>

          <button
            class="btn primary"
            onclick="supportFundraiser('${escapeHTML(item.id)}')"
          >
            Support
