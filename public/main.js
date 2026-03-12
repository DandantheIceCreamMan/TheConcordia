async function fetchJSON(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  return response.json();
}

function getEventShareUrl(eventId) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
  return `${base}event.html?id=${eventId}`;
}

function renderEvents(events) {
  const list = document.getElementById("events-list");
  if (!list) return;

  list.innerHTML = "";

  if (!events.length) {
    const li = document.createElement("li");
    li.className = "event-item";
    li.textContent = "No events scheduled yet. Check back soon!";
    list.appendChild(li);
    return;
  }

  events.forEach((event) => {
    const capacityText =
      event.maxCapacity != null
        ? `${event.rsvpCount}/${event.maxCapacity} spots`
        : "Open";
    const isFull = event.isFull;
    const timeLine = event.time ? ` <strong>Time:</strong> ${event.time}` : "";
    const li = document.createElement("li");
    li.className = "event-item";
    li.innerHTML = `
      <h3>${event.title}</h3>
      <p><strong>Date:</strong> ${event.date}${timeLine}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p class="event-capacity ${isFull ? "event-capacity--full" : ""}">${capacityText}${isFull ? " (full)" : ""}</p>
      <p>${event.description}</p>
      <div class="event-card-actions">
        <a href="event.html?id=${event.id}" class="btn btn-rsvp ${isFull ? "btn--disabled" : ""}">${isFull ? "Full" : "RSVP"}</a>
        <button type="button" class="btn btn-share" data-event-id="${event.id}">Share</button>
      </div>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll(".btn-share").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-event-id");
      const url = getEventShareUrl(id);
      navigator.clipboard.writeText(url).then(
        () => {
          const label = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => { btn.textContent = label; }, 2000);
        },
        () => {
          prompt("Copy this link:", url);
        }
      );
    });
  });
}

async function loadEvents() {
  try {
    const events = await fetchJSON("/api/events");
    renderEvents(events);
  } catch (error) {
    console.error("Failed to load events", error);
  }
}

function renderPolls(polls) {
  const container = document.getElementById("polls-container");
  if (!container) return;

  container.innerHTML = "";

  if (!polls.length) {
    container.textContent = "No active polls right now.";
    return;
  }

  polls.forEach((poll) => {
    const pollEl = document.createElement("div");
    pollEl.className = "poll";

    const optionsHtml = poll.options
      .map(
        (opt) => `
        <button type="button" data-poll-id="${poll.id}" data-option-id="${opt.id}">
          ${opt.label} (${opt.votes})
        </button>
      `
      )
      .join("");

    pollEl.innerHTML = `
      <h3>${poll.question}</h3>
      <div class="poll-options">
        ${optionsHtml}
      </div>
    `;

    container.appendChild(pollEl);
  });

  container.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const pollId = Number(target.getAttribute("data-poll-id"));
    const optionId = Number(target.getAttribute("data-option-id"));
    if (!pollId || !optionId) return;

    try {
      await fetchJSON(`/api/polls/${pollId}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId })
      });
      await loadPolls();
    } catch (error) {
      console.error("Failed to submit vote", error);
    }
  });
}

async function loadPolls() {
  try {
    const polls = await fetchJSON("/api/polls");
    renderPolls(polls);
  } catch (error) {
    console.error("Failed to load polls", error);
  }
}

function renderNewsletters(newsletters) {
  const list = document.getElementById("newsletter-list");
  if (!list) return;

  list.innerHTML = "";

  if (!newsletters.length) {
    const li = document.createElement("li");
    li.textContent = "No newsletters published yet.";
    list.appendChild(li);
    return;
  }

  newsletters.forEach((newsletter) => {
    const li = document.createElement("li");
    li.className = "newsletter-item";
    li.innerHTML = `
      <h4>${newsletter.title}</h4>
      <p class="newsletter-date">${newsletter.date}</p>
      <p>${newsletter.content}</p>
    `;
    list.appendChild(li);
  });
}

async function loadNewsletters() {
  try {
    const newsletters = await fetchJSON("/api/newsletters");
    renderNewsletters(newsletters);
  } catch (error) {
    console.error("Failed to load newsletters", error);
  }
}

function setupForms() {
  const ideaForm = document.getElementById("event-idea-form");
  const ideaMessage = document.getElementById("event-idea-message");
  if (ideaForm && ideaMessage) {
    ideaForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      ideaMessage.textContent = "";

      const formData = new FormData(ideaForm);
      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        idea: formData.get("idea")
      };

      try {
        await fetchJSON("/api/events/ideas", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        ideaMessage.textContent = "Thank you! Your idea has been submitted.";
        ideaForm.reset();
      } catch (error) {
        console.error("Failed to submit idea", error);
        ideaMessage.textContent = "Something went wrong. Please try again.";
      }
    });
  }

  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterMessage = document.getElementById("newsletter-message");
  if (newsletterForm && newsletterMessage) {
    newsletterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      newsletterMessage.textContent = "";

      const formData = new FormData(newsletterForm);
      const payload = {
        email: formData.get("email")
      };

      try {
        const result = await fetchJSON("/api/newsletters/subscribe", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        newsletterMessage.textContent = result.message || "Subscribed!";
        newsletterForm.reset();
      } catch (error) {
        console.error("Failed to subscribe", error);
        newsletterMessage.textContent = "Something went wrong. Please try again.";
      }
    });
  }

  const signupForm = document.getElementById("club-signup-form");
  const signupMessage = document.getElementById("signup-message");
  if (signupForm && signupMessage) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      signupMessage.textContent = "";

      const formData = new FormData(signupForm);
      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        yearOfStudy: formData.get("yearOfStudy")
      };

      try {
        await fetchJSON("/api/club-signups", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        signupMessage.textContent =
          "Thanks for joining! We'll be in touch with more details.";
        signupForm.reset();
      } catch (error) {
        console.error("Failed to sign up", error);
        signupMessage.textContent = "Something went wrong. Please try again.";
      }
    });
  }
}

function setFooterYear() {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }
}

function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? Number(id) : null;
}

async function initSingleEventPage() {
  const detailEl = document.getElementById("event-detail");
  const rsvpArea = document.getElementById("event-rsvp-area");
  const shareArea = document.getElementById("event-share-area");
  const shareInput = document.getElementById("share-url");
  const copyBtn = document.getElementById("copy-share-btn");
  if (!detailEl) return;

  const eventId = getQueryId();
  if (!eventId) {
    window.location.href = "events.html";
    return;
  }

  try {
    const event = await fetchJSON(`/api/events/${eventId}`);
    const timeLine = event.time ? ` <strong>Time:</strong> ${event.time}` : "";
    const capacityText =
      event.maxCapacity != null
        ? `${event.rsvpCount}/${event.maxCapacity} spots`
        : "Open";
    detailEl.innerHTML = `
      <article class="event-single">
        <h2>${event.title}</h2>
        <p><strong>Date:</strong> ${event.date}${timeLine}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p class="event-capacity ${event.isFull ? "event-capacity--full" : ""}">${capacityText}${event.isFull ? " (full)" : ""}</p>
        <p>${event.description}</p>
      </article>
    `;

    if (!event.isFull) {
      rsvpArea.hidden = false;
    }
    shareArea.hidden = false;
    const shareUrl = getEventShareUrl(event.id);
    if (shareInput) shareInput.value = shareUrl;
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        shareInput.select();
        navigator.clipboard.writeText(shareUrl).then(
          () => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => { copyBtn.textContent = "Copy link"; }, 2000);
          },
          () => copyBtn.textContent = "Copy link"
        );
      });
    }

    const form = document.getElementById("rsvp-form");
    const messageEl = document.getElementById("rsvp-message");
    if (form && messageEl) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        messageEl.textContent = "";
        const formData = new FormData(form);
        const payload = { name: formData.get("name"), email: formData.get("email") };
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          messageEl.textContent = data.error || "Something went wrong. Try again.";
          return;
        }
        messageEl.textContent = "You're on the list! We'll see you there.";
        form.reset();
        const capEl = detailEl.querySelector(".event-capacity");
        if (capEl) capEl.textContent = data.maxCapacity != null
          ? `${data.rsvpCount}/${data.maxCapacity} spots`
          : `${data.rsvpCount} going`;
        form.hidden = true;
      });
    }
  } catch (err) {
    console.error(err);
    detailEl.innerHTML = "<p>Event not found.</p>";
    setTimeout(() => { window.location.href = "events.html"; }, 1500);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setFooterYear();
  setupForms();

  if (document.getElementById("event-detail")) {
    await initSingleEventPage();
    return;
  }
  if (document.getElementById("events-list")) await loadEvents();
  if (document.getElementById("polls-container")) await loadPolls();
  if (document.getElementById("newsletter-list")) await loadNewsletters();
});
