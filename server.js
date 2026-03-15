const path = require("path");
const express = require("express");
const cors = require("cors");

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
    date: "2026-02-14",
    time: "5:00 PM",
    location: "Student Lounge",
    description: "A past event: casual mixer with snacks and music.",
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

const newsletters = [
  {
    id: 1,
    title: "March Newsletter",
    date: "2026-03-01",
    content: "Welcome to the social club! This is where we'll share recaps and upcoming events."
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

// Static frontend: prefer React build if present, else legacy public/
const clientBuild = path.join(__dirname, "client", "dist");
const publicDir = path.join(__dirname, "public");
if (require("fs").existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientBuild, "index.html"));
  });
} else {
  app.use(express.static(publicDir));
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

app.get("/api/newsletters", (req, res) => {
  res.json(newsletters);
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
  const { title, date, time, location, description, maxCapacity } = req.body || {};
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
    maxCapacity: maxCapacity != null && maxCapacity !== '' ? Number(maxCapacity) : null
  };
  events.push(event);
  eventRsvps[id] = [];
  res.status(201).json(eventWithRsvpCount(event));
});

app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((e) => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const { title, date, time, location, description, maxCapacity } = req.body || {};
  if (title !== undefined) event.title = String(title).trim();
  if (date !== undefined) event.date = String(date).trim();
  if (time !== undefined) event.time = time ? String(time).trim() : null;
  if (location !== undefined) event.location = String(location).trim();
  if (description !== undefined) event.description = String(description).trim();
  if (maxCapacity !== undefined) event.maxCapacity = maxCapacity != null && maxCapacity !== '' ? Number(maxCapacity) : null;
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

app.post('/api/admin/newsletters', requireAdmin, (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }
  const date = new Date().toISOString().slice(0, 10);
  const newsletter = {
    id: newsletters.length ? Math.max(...newsletters.map((n) => n.id)) + 1 : 1,
    title: String(title).trim(),
    date,
    content: String(content).trim()
  };
  newsletters.push(newsletter);
  res.status(201).json(newsletter);
});

app.put('/api/admin/newsletters/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const n = newsletters.find((x) => x.id === id);
  if (!n) return res.status(404).json({ error: 'Newsletter not found.' });
  const { title, content, date } = req.body || {};
  if (title !== undefined) n.title = String(title).trim();
  if (content !== undefined) n.content = String(content).trim();
  if (date !== undefined) n.date = String(date).trim();
  res.json(n);
});

app.delete('/api/admin/newsletters/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const idx = newsletters.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Newsletter not found.' });
  newsletters.splice(idx, 1);
  res.status(204).send();
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

