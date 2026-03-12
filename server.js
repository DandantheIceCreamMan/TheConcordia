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
    options: [
      { id: 1, label: "Game Night", votes: 5 },
      { id: 2, label: "Outdoor Picnic", votes: 3 },
      { id: 3, label: "Movie Marathon", votes: 2 }
    ]
  }
];

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

// Static frontend
app.use(express.static(path.join(__dirname, "public")));

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

app.get("/api/polls", (req, res) => {
  res.json(polls);
});

app.post("/api/polls/:pollId/vote", (req, res) => {
  const pollId = Number(req.params.pollId);
  const { optionId } = req.body;

  const poll = polls.find((p) => p.id === pollId);
  if (!poll) {
    return res.status(404).json({ error: "Poll not found." });
  }

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) {
    return res.status(400).json({ error: "Invalid option." });
  }

  option.votes += 1;
  res.json(poll);
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

app.listen(PORT, () => {
  console.log(`Social club server running on http://localhost:${PORT}`);
});

