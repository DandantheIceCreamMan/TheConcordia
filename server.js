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
    location: "Student Union Hall",
    description: "Kick-off event to meet other members of the social club."
  }
];

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

// Static frontend
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.get("/api/events", (req, res) => {
  res.json(events);
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

app.listen(PORT, () => {
  console.log(`Social club server running on http://localhost:${PORT}`);
});

