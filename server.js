const path = require("path");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory data stores (replace with a real database later)
const events = [
  {
    id: 1,
    title: "Welcome Social",
    date: "2026-04-05",
    time: "6:00 PM",
    location: "Student Union Hall",
    description: "Kick-off event to meet other members of the social club.",
    maxCapacity: null
  },
  {
    id: 2,
    title: "Progressive Dinner",
    date: "2026-04-12",
    time: "7:00 PM",
    location: "Campus residences (details after RSVP)",
    description: "A multi-course dinner that moves from one host to the next. Limited spots.",
    maxCapacity: 20
  },
  {
    id: 3,
    title: "Spring Mixer",
    date: "2026-04-20",
    time: "5:00 PM",
    location: "Student Lounge",
    description: "Casual mixer with music, snacks, and room to wander between conversations.",
    maxCapacity: null
  }
];

// RSVPs per event: { eventId: [ { name, email }, ... ] }
const eventRsvps = {};

const eventIdeas = [];

const polls = [
  {
    id: 1,
    question: "What type of event should we host next?",
    description: "We'll use the results to plan the next few weeks. Pick what you'd actually show up to.",
    closesAt: null,
    options: [
      { id: 1, label: "Game Night", votes: 5 },
      { id: 2, label: "Outdoor Picnic", votes: 3 },
      { id: 3, label: "Movie Marathon", votes: 2 }
    ]
  }
];

// One vote per person per poll: pollId -> { normalizedEmail -> optionId }
const pollVotes = { 1: {} };

// Newsletter: { id, title, date, masthead?, sections: [ { heading, body } ] }
// Legacy entries may have content instead of sections; normalized when read.
const newsletters = [
  {
    id: 1,
    title: "Early Spring Dispatch",
    date: "2026-03-01",
    masthead: "The Concordia",
    sections: [
      {
        heading: "From the common room fire",
        body:
`Welcome back to the common room. The chess set is missing one knight, the biscuit tin has somehow refilled itself again, and there are three different sign‑up sheets fighting for space on the mantle.

This term we are trying an experiment: fewer announcements scattered across group chats, more things written down properly in one place. Think of this as the notice board in newspaper form.`
      },
      {
        heading: "What actually happened last month",
        body:
`Game Night turned into a four‑hour tournament of Catan, Fleet, and increasingly dramatic charades when the card decks went missing. We discovered at least two secret card sharks and one person who can mime an entire Russian novel in under a minute.

The Progressive Supper wandered from the student kitchens through the quad and somehow finished with hot chocolate in the library stairwell. Nobody is entirely sure who first decided the third course should be eaten on the steps, but the consensus is that it should happen again.`
      },
      {
        heading: "Coming up on the notice board",
        body:
`• Debate & Dessert: a low‑stakes evening of arguing about questions that do not belong on exams (\"Is the common room more like a ship or a village?\"). Expect cake; bring an opinion.
• Night at the Museum: a small group trip downtown for the Thursday late‑opening, followed by coffee and debrief.
• Quiet Reading Hour: one hour, no phones, no small talk, just books and the occasional turning of pages.

RSVPs for each of these will appear on the Events page as they are confirmed. If you have an idea you would actually show up to, the Propose form is very much open.`
      },
      {
        heading: "How to be in the loop",
        body:
`If you are reading this on the website rather than in your inbox, you can add yourself to the newsletter list in the sidebar. We send only when there is something worth saying; no daily spam, no inspirational quotes, and absolutely no \"unsubscribe to confirm you are still interested\" emails.

If you have a short story from a past evening—something funny, something unexpectedly good, or simply something you would like remembered—you can send it in from the bottom of this page. We may tuck a few of them into the next Chronicle.`
      }
    ]
  }
];

const newsletterSubscribers = [];
const clubSignups = [];
const stories = [];

// Admin: single shared secret (set ADMIN_SECRET in production)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-change-me';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Admin access required.' });
  }
  next();
}

// Static frontend: serve React build (client/dist) and fall back to index.html for SPA routes.
// If the build is missing, log a clear warning so deployment issues are obvious.
const clientBuild = path.join(__dirname, "client", "dist");
if (require("fs").existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientBuild, "index.html"));
  });
} else {
  console.warn(
    "[startup] React build directory client/dist was not found. " +
      "Run `npm run build:client` before starting the server, and configure your host " +
      "to run the build step in production."
  );
}

// Helper: event with RSVP counts for display
function eventWithRsvpCount(event) {
  const rsvps = eventRsvps[event.id] || [];
  const rsvpCount = rsvps.length;
  const spotsLeft = event.maxCapacity != null ? Math.max(0, event.maxCapacity - rsvpCount) : null;
  const isFull = event.maxCapacity != null && rsvpCount >= event.maxCapacity;
  return { ...event, rsvpCount, spotsLeft, isFull };
}

// API routes
app.get("/api/events", (req, res) => {
  res.json(events.map(eventWithRsvpCount));
});

app.get("/api/events/:id", (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);
  if (!event) {
    return res.status(404).json({ error: "Event not found." });
  }
  res.json(eventWithRsvpCount(event));
});

app.post("/api/events/:id/rsvp", (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);
  if (!event) {
    return res.status(404).json({ error: "Event not found." });
  }
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }
  if (!eventRsvps[id]) eventRsvps[id] = [];
  const rsvps = eventRsvps[id];
  const atCapacity = event.maxCapacity != null && rsvps.length >= event.maxCapacity;
  if (atCapacity) {
    return res.status(400).json({ error: "This event is full." });
  }
  rsvps.push({ name, email });
  res.status(201).json(eventWithRsvpCount(event));
});

app.post("/api/events/ideas", (req, res) => {
  const { name, email, idea } = req.body;
  if (!idea) {
    return res.status(400).json({ error: "Event idea is required." });
  }
  const newIdea = {
    id: eventIdeas.length + 1,
    name: name || "Anonymous",
    email: email || null,
    idea
  };
  eventIdeas.push(newIdea);
  res.status(201).json(newIdea);
});

// Public poll response: no vote counts, only id/label per option
function publicPoll(poll, votedOptionId = null) {
  return {
    id: poll.id,
    question: poll.question,
    description: poll.description || null,
    closesAt: poll.closesAt || null,
    options: poll.options.map((o) => ({ id: o.id, label: o.label })),
    votedOptionId: votedOptionId ?? null
  };
}

app.get("/api/polls", (req, res) => {
  const email = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
  const result = polls.map((poll) => {
    const votedOptionId = email && pollVotes[poll.id] && pollVotes[poll.id][email] != null
      ? pollVotes[poll.id][email]
      : null;
    return publicPoll(poll, votedOptionId);
  });
  res.json(result);
});

app.post("/api/polls/:pollId/vote", (req, res) => {
  const pollId = Number(req.params.pollId);
  const { optionId, email } = req.body || {};

  const poll = polls.find((p) => p.id === pollId);
  if (!poll) {
    return res.status(404).json({ error: "Poll not found." });
  }

  if (!email || String(email).trim() === "") {
    return res.status(400).json({ error: "Email is required to vote (one vote per person per poll)." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!pollVotes[pollId]) pollVotes[pollId] = {};
  const existing = pollVotes[pollId][normalizedEmail];
  if (existing != null) {
    return res.status(400).json({
      error: "You have already voted in this poll.",
      votedOptionId: existing
    });
  }

  const optionIdNum = Number(optionId);
  if (Number.isNaN(optionIdNum)) {
    return res.status(400).json({ error: "Invalid option." });
  }
  const option = poll.options.find((o) => o.id === optionIdNum);
  if (!option) {
    return res.status(400).json({ error: "Invalid option." });
  }

  pollVotes[pollId][normalizedEmail] = optionIdNum;
  option.votes += 1;
  res.json(publicPoll(poll, optionIdNum));
});

function normalizeNewsletter(n) {
  const sections = n.sections && n.sections.length
    ? n.sections.map((s) => ({ heading: String(s.heading ?? "").trim(), body: String(s.body ?? "").trim() }))
    : [{ heading: "", body: String(n.content ?? "").trim() }];
  return {
    id: n.id,
    title: n.title,
    date: n.date,
    masthead: n.masthead != null ? String(n.masthead).trim() : null,
    sections
  };
}

app.get("/api/newsletters", (req, res) => {
  res.json(newsletters.map(normalizeNewsletter));
});

app.post("/api/newsletters/subscribe", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const existing = newsletterSubscribers.find((s) => s.email === email);
  if (existing) {
    return res.status(200).json({ message: "You are already subscribed." });
  }
  const subscriber = { id: newsletterSubscribers.length + 1, email };
  newsletterSubscribers.push(subscriber);
  res.status(201).json({ message: "Subscribed successfully.", subscriber });
});

app.post("/api/club-signups", (req, res) => {
  const { name, email, yearOfStudy } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }
  const signup = {
    id: clubSignups.length + 1,
    name,
    email,
    yearOfStudy: yearOfStudy || null
  };
  clubSignups.push(signup);
  res.status(201).json(signup);
});

app.post("/api/stories", (req, res) => {
  const { name, email, story } = req.body || {};
  if (!story || String(story).trim() === "") {
    return res.status(400).json({ error: "Your story is required." });
  }
  const entry = {
    id: stories.length + 1,
    name: name || "Anonymous",
    email: email || null,
    story: String(story).trim()
  };
  stories.push(entry);
  res.status(201).json({
    message: "Your tale has been sealed in the archives. The librarians are cackling. (We'll be in touch—maybe.)"
  });
});

// —— Admin API (protected by shared secret) ——
app.get('/api/admin/check', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

app.post('/api/admin/events', requireAdmin, (req, res) => {
  const { title, date, time, location, description, maxCapacity, imageUrl } = req.body || {};
  if (!title || !date || !location || !description) {
    return res.status(400).json({ error: 'Title, date, location, and description are required.' });
  }
  const id = events.length ? Math.max(...events.map((e) => e.id)) + 1 : 1;
  const event = {
    id,
    title: String(title).trim(),
    date: String(date).trim(),
    time: time ? String(time).trim() : null,
    location: String(location).trim(),
    description: String(description).trim(),
    maxCapacity: maxCapacity != null && maxCapacity !== '' ? Number(maxCapacity) : null,
    imageUrl: imageUrl != null && String(imageUrl).trim() !== '' ? String(imageUrl).trim() : null
  };
  events.push(event);
  eventRsvps[id] = [];
  res.status(201).json(eventWithRsvpCount(event));
});

app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const { title, date, time, location, description, maxCapacity, imageUrl } = req.body || {};
  if (title !== undefined) event.title = String(title).trim();
  if (date !== undefined) event.date = String(date).trim();
  if (time !== undefined) event.time = time ? String(time).trim() : null;
  if (location !== undefined) event.location = String(location).trim();
  if (description !== undefined) event.description = String(description).trim();
  if (maxCapacity !== undefined) event.maxCapacity = maxCapacity != null && maxCapacity !== '' ? Number(maxCapacity) : null;
  if (imageUrl !== undefined) {
    event.imageUrl = imageUrl != null && String(imageUrl).trim() !== '' ? String(imageUrl).trim() : null;
  }
  res.json(eventWithRsvpCount(event));
});

app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found.' });
  events.splice(idx, 1);
  delete eventRsvps[id];
  res.status(204).send();
});

function parseNewsletterBody(body) {
  const { title, content, masthead, sections: rawSections, date } = body || {};
  if (!title) return null;
  let sections;
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    sections = rawSections
      .filter((s) => s && (String(s.heading ?? "").trim() || String(s.body ?? "").trim()))
      .map((s) => ({ heading: String(s.heading ?? "").trim(), body: String(s.body ?? "").trim() }));
  }
  if (!sections || sections.length === 0) {
    const single = String(content ?? "").trim();
    if (!single) return null;
    sections = [{ heading: "", body: single }];
  }
  return {
    title: String(title).trim(),
    date: date != null && String(date).trim() ? String(date).trim() : new Date().toISOString().slice(0, 10),
    masthead: masthead != null && String(masthead).trim() ? String(masthead).trim() : null,
    sections
  };
}

async function sendNewsletterToSubscribers(newsletter) {
  const transporter = getMailTransporter();
  if (!transporter) {
    return { ok: false, error: "Email not configured." };
  }
  const emails = newsletterSubscribers.map((s) => s.email).filter(Boolean);
  if (emails.length === 0) {
    return { ok: false, error: "No subscribers to send to." };
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const html = newsletterToHtml(newsletter);
  await transporter.sendMail({
    from: `"The Concordian" <${from}>`,
    to: emails,
    subject: newsletter.title,
    html
  });
  return { ok: true, sent: emails.length };
}

app.post('/api/admin/newsletters', requireAdmin, async (req, res) => {
  const parsed = parseNewsletterBody(req.body);
  if (!parsed) return res.status(400).json({ error: 'Title and at least one section (or content) are required.' });
  const newsletter = {
    id: newsletters.length ? Math.max(...newsletters.map((n) => n.id)) + 1 : 1,
    ...parsed
  };
  newsletters.push(newsletter);
  // Try to email all subscribers with the latest issue, but don't fail creation if email sending breaks.
  sendNewsletterToSubscribers(newsletter).catch(() => {});
  res.status(201).json(normalizeNewsletter(newsletter));
});

app.put('/api/admin/newsletters/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const n = newsletters.find((x) => x.id === id);
  if (!n) return res.status(404).json({ error: 'Newsletter not found.' });
  const parsed = parseNewsletterBody(req.body);
  if (!parsed) return res.status(400).json({ error: 'Title and at least one section (or content) are required.' });
  n.title = parsed.title;
  n.date = parsed.date;
  n.masthead = parsed.masthead;
  n.sections = parsed.sections;
  res.json(normalizeNewsletter(n));
});

app.delete('/api/admin/newsletters/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = newsletters.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Newsletter not found.' });
  newsletters.splice(idx, 1);
  res.status(204).send();
});

// Admin: send newsletter by email to all subscribers (requires SMTP env vars)
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

function newsletterToHtml(nl) {
  const n = normalizeNewsletter(nl);
  const mast = n.masthead ? `<div class="masthead">${escapeHtml(n.masthead)}</div>` : "";
  const sections = n.sections
    .map(
      (s) =>
        `<section>${s.heading ? `<h3>${escapeHtml(s.heading)}</h3>` : ""}<div class="body">${escapeHtml(s.body).replace(/\n/g, "<br>")}</div></section>`
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 1rem; color: #1a1a1a; line-height: 1.6; }
  .masthead { font-size: 0.9rem; letter-spacing: 0.15em; text-transform: uppercase; color: #5c2a2e; margin-bottom: 0.5rem; }
  h2 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  .date { color: #4a4a4a; font-size: 0.9rem; margin-bottom: 1rem; }
  section { margin-bottom: 1.25rem; }
  section h3 { font-size: 1.1rem; margin: 0 0 0.35rem; border-bottom: 1px solid #d4cfc4; padding-bottom: 0.25rem; }
  .body { margin: 0; }
</style></head>
<body>
${mast}
<h2>${escapeHtml(n.title)}</h2>
<p class="date">${escapeHtml(n.date)}</p>
${sections}
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.post("/api/admin/newsletters/:id/send", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const newsletter = newsletters.find((n) => n.id === id);
  if (!newsletter) return res.status(404).json({ error: "Newsletter not found." });
  const transporter = getMailTransporter();
  if (!transporter) {
    return res.status(503).json({
      error: "Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (and optionally SMTP_PORT, SMTP_SECURE, MAIL_FROM) in the environment."
    });
  }
  const emails = newsletterSubscribers.map((s) => s.email).filter(Boolean);
  if (emails.length === 0) {
    return res.status(400).json({ error: "No subscribers to send to." });
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const html = newsletterToHtml(newsletter);
  try {
    await transporter.sendMail({
      from: `"UATX Concordia" <${from}>`,
      to: emails,
      subject: newsletter.title,
      html
    });
    res.json({ sent: emails.length, message: `Newsletter sent to ${emails.length} subscriber(s).` });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email.", details: err.message });
  }
});

// Admin: list event ideas
app.get('/api/admin/event-ideas', requireAdmin, (req, res) => {
  res.json(eventIdeas);
});

app.delete('/api/admin/event-ideas/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = eventIdeas.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Idea not found.' });
  eventIdeas.splice(idx, 1);
  res.status(204).send();
});

// Admin: list newsletter subscribers
app.get('/api/admin/subscribers', requireAdmin, (req, res) => {
  res.json(newsletterSubscribers);
});

// Admin: list club signups
app.get('/api/admin/club-signups', requireAdmin, (req, res) => {
  res.json(clubSignups);
});

// Admin: list and delete stories
app.get('/api/admin/stories', requireAdmin, (req, res) => {
  res.json(stories);
});

app.delete('/api/admin/stories/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = stories.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Story not found.' });
  stories.splice(idx, 1);
  res.status(204).send();
});

// Admin: list RSVPs for an event
app.get('/api/admin/events/:id/rsvps', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  res.json(eventRsvps[id] || []);
});

// Admin: full polls (with vote counts) – derive counts from pollVotes so they're always correct
app.get('/api/admin/polls', requireAdmin, (req, res) => {
  const list = polls.map((p) => {
    const votesByOption = {};
    p.options.forEach((o) => { votesByOption[o.id] = 0; });
    const votes = pollVotes[p.id] || {};
    Object.values(votes).forEach((optionId) => {
      if (votesByOption[optionId] !== undefined) votesByOption[optionId] += 1;
    });
    const totalVotes = Object.values(votesByOption).reduce((s, n) => s + n, 0);
    const options = p.options.map((o) => ({ id: o.id, label: o.label, votes: votesByOption[o.id] || 0 }));
    return {
      id: p.id,
      question: p.question,
      description: p.description,
      closesAt: p.closesAt,
      options,
      totalVotes
    };
  });
  res.json(list);
});

// Admin: polls CRUD
app.post('/api/admin/polls', requireAdmin, (req, res) => {
  const { question, options } = req.body || {};
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least two options are required.' });
  }
  const pollId = polls.length ? Math.max(...polls.map((p) => p.id)) + 1 : 1;
  let optionId = 0;
  const pollOptions = options
    .filter((l) => l != null && String(l).trim() !== '')
    .map((label) => ({ id: ++optionId, label: String(label).trim(), votes: 0 }));
  if (pollOptions.length < 2) {
    return res.status(400).json({ error: 'At least two non-empty options are required.' });
  }
  const description = req.body.description != null ? String(req.body.description).trim() || null : null;
  const closesAt = req.body.closesAt != null && String(req.body.closesAt).trim() !== '' ? String(req.body.closesAt).trim() : null;
  const poll = { id: pollId, question: String(question).trim(), description, closesAt, options: pollOptions };
  polls.push(poll);
  pollVotes[pollId] = {};
  res.status(201).json(poll);
});

app.put('/api/admin/polls/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const poll = polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found.' });
  const { question, options, description, closesAt } = req.body || {};
  if (question !== undefined) poll.question = String(question).trim();
  if (description !== undefined) poll.description = description != null && String(description).trim() !== '' ? String(description).trim() : null;
  if (closesAt !== undefined) poll.closesAt = closesAt != null && String(closesAt).trim() !== '' ? String(closesAt).trim() : null;
  if (Array.isArray(options) && options.length >= 2) {
    let optionId = Math.max(0, ...poll.options.map((o) => o.id));
    poll.options = options
      .filter((l) => l != null && String(l).trim() !== '')
      .map((label) => ({ id: ++optionId, label: String(label).trim(), votes: 0 }));
    if (poll.options.length < 2) return res.status(400).json({ error: 'At least two non-empty options required.' });
    pollVotes[id] = {};
  }
  res.json(poll);
});

// End poll now (set closesAt to current time so voting is closed)
app.patch('/api/admin/polls/:id/end', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const poll = polls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Poll not found.' });
  poll.closesAt = new Date().toISOString();
  res.json(poll);
});

app.delete('/api/admin/polls/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = polls.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Poll not found.' });
  polls.splice(idx, 1);
  delete pollVotes[id];
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Social club server running on http://localhost:${PORT}`);
});

