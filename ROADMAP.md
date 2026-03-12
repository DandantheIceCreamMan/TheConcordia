# UATX Concordia — Roadmap to a Standout Site

This document plans the next steps to make the website **very good**: a clear differentiator, consistent design, then focused improvements on each part of the site.

---

## Phase 1: Choose a Unique Function (Your Differentiator)

**Goal:** One thing that makes Concordia’s site clearly different from generic event planners.

Pick **one** (or combine a couple) to build first:

| Option | What it is | Why it stands out |
|--------|------------|--------------------|
| **A. “Add to calendar” for every event** | Each event has an “Add to Google Calendar” / “Add to Apple Calendar” link that pre-fills date, time, place, description. | Students actually show up; no other club site usually does this well. |
| **B. Interest-based “For you”** | Students mark interests (Dinners, Parties, Museums, Outings). The site highlights “events you might like” or sends newsletter digests by interest. | Feels personal; matches how people discover events elsewhere. |
| **C. RSVP + capacity** | Events can have a max capacity and RSVP. Students see “12/20 spots” and sign up; you get a list and can plan (dinners, museum tickets). | Turns the site into the single place to commit, not just “see what’s on.” |
| **D. Event recaps + stories** | After each event, add a short recap (and optional photos) linked from the newsletter archive. “Last month’s dinner” becomes a readable story. | Builds memory and tradition; feels like a real society, not just a calendar. |
| **E. “Bring a friend” / share link** | Each event has a shareable link (e.g. `concordia.edu/events/123`). Students can text it to a friend; the friend sees that one event and a one-click “I’m interested” or signup. | Growth and inclusion without heavy signup friction. |

**Recommendation:** Start with **A (Add to calendar)** and **C (RSVP + capacity)**. They’re high impact, understandable, and work with the events you already list. Add **D (recaps)** when you’re ready to enrich the newsletter.

**Next step after choosing:** Write 2–3 sentences that describe “What makes Concordia’s site different” and put them on the homepage (e.g. under “What We Do” or in the mission).

---

## Phase 2: Universal Design, Structure & Style

**Goal:** One clear system so every page feels like the same product.

### 2.1 Design system (single source of truth)

- **Colors** — Already in `styles.css` as CSS variables (`:root`). Keep using them everywhere; add new ones only when needed (e.g. `--color-success`, `--color-error` for forms).
- **Typography** — Cormorant Garamond (headings), Lora (body). Use the same scale: no random font sizes; use variables or a small set (e.g. `1rem`, `1.125rem`, `1.25rem`, `1.5rem`, `1.75rem`, `2rem`).
- **Spacing** — Use the same spacing variables (`--space-unit`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`) on every page. No one-off `margin: 17px`.
- **Ornaments** — Same rules everywhere: double gold line + ◆ under header; ornament lines next to section titles when appropriate; same footer treatment.

**Checklist:**

- [ ] All pages use the same `<header>`, nav, and footer pattern (or the same components if you later use a template/JS).
- [ ] All pages link to the same `styles.css` (and no extra stylesheets that override the system).
- [ ] Buttons, inputs, cards, and links look identical across Events, Propose, Polls, Newsletter, Join.
- [ ] Mobile: one breakpoint (e.g. 720px) used consistently; header, nav, and content stack the same way on every page.

### 2.2 Structure (layout rules)

- **Header** — Always: logo/title + tagline, then nav. Same height and padding on every page.
- **Main content** — One main column inside `.container`; max-width 960px; same horizontal padding.
- **Footer** — Home: “Join Concordia” block (signup + founder/contact). Inner pages: simple bar with copyright + “Home” + “Join & Contact”.
- **URLs** — Consistent: `index.html`, `events.html`, `propose.html`, `polls.html`, `newsletter.html`, `index.html#join`.

### 2.3 Style (tone and visuals)

- **Tone** — Liberal arts, Oxford/Hogwarts-inspired but modern: warm, inviting, a bit formal. Copy should match (e.g. “Society & events at the heart of campus”).
- **Imagery** — Replace placeholders with real photos of your events (dinners, parties, museum, outings). Same treatment: full-bleed where used, overlay + label for event-type bands.
- **Ornaments** — Use the same set (double line, ◆, ❧, short lines) so the site feels cohesive, not random.

**Deliverable:** A short “Design & structure” section in this doc or a separate `DESIGN.md` that states: “We use these colors, these fonts, these spacing rules, this header/footer, these ornaments.”

---

## Phase 3: Improve Each Part of the Site (Page by Page)

Go through in this order so the homepage and core flows are strong first.

### 3.1 Homepage (`index.html`)

- [ ] **Hero “What We Do”** — Short, clear copy; one sentence that hints at your unique function (e.g. “RSVP here, add events to your calendar, and never miss a dinner.”).
- [ ] **Event-type bands** — Replace placeholder images with real photos; keep Progressive Dinners, Parties, Museum Visits, Outings; ensure labels are readable and links go to `events.html` (or filtered view if you add that later).
- [ ] **Mission** — Align with “Concordia” and your differentiator; optional: add a single “Why this site is different” line.
- [ ] **Join Concordia** — Real founder name, email, meeting place; consider a short “What happens when I join?” line.
- [ ] **Accessibility** — Check heading order (one h1 per page), nav has `aria-label`, images have `alt` when you add real photos.

### 3.2 Upcoming Events (`events.html`)

- [ ] **List** — Each event shows: title, date, time (if you add it), location, short description; same card style as in your design system.
- [ ] **Unique function** — If you chose “Add to calendar”: add a button/link per event. If you chose “RSVP + capacity”: show “X/Y spots” and an RSVP button; backend stores RSVPs.
- [ ] **Empty state** — Friendly message when there are no events (“Next term’s calendar coming soon,” etc.).
- [ ] **Filter by type** (optional) — If you have many events, filter by Dinners / Parties / Museum / Outings using the same categories as the homepage bands.

### 3.3 Propose an Event (`propose.html`)

- [ ] **Form** — Name (optional), Email (optional), Event idea (required). Optional: “Event type” dropdown (Dinners, Parties, Museum, Outings) so you can sort ideas.
- [ ] **Success** — Clear “Thank you” message; optional: “We’ll consider it for the next calendar.”
- [ ] **Tone** — One line that encourages ideas (“We read every one” or “Some of our best events started as a suggestion.”).

### 3.4 Polls (`polls.html`)

- [ ] **Display** — One poll per card; question + options with vote counts; “Vote” updates count and shows a brief “Thanks for voting” (and maybe disables voting for that poll if you add simple tracking).
- [ ] **Empty state** — “No active polls right now. Check back later.”
- [ ] **Optional** — Show “Polls close on [date]” if you add end dates to polls in the backend.

### 3.5 Newsletter (`newsletter.html`)

- [ ] **Subscribe** — Email only; clear success message; optional: “We send one email per month / before big events.”
- [ ] **Archive** — List of past newsletters: title, date, and either short excerpt or “Read more” that expands or links to full content. Same card style as events.
- [ ] **Unique function** — If you chose “Recaps”: make it clear that newsletters include event recaps and stories.

### 3.6 Join & Contact (footer on `index.html`)

- [ ] **Signup form** — Name, Email, Year (optional). Success message and, if you want, “We’ll add you to the list and send details for the first meeting.”
- [ ] **Founder & contact** — Real name, email, meeting place; optional: “Office hours” or “Reply within 48 hours.”
- [ ] **Consistency** — Same ornament and title style as in Phase 2.

### 3.7 Backend and data

- [ ] **Events** — Add fields you need: e.g. `time`, `type` (dinner/party/museum/outing), `maxCapacity`, `calendarLink` or generated “Add to calendar” URL.
- [ ] **Polls** — Optional: `endDate`; optional: simple “has this user voted?” so you can disable voting or show “You voted.”
- [ ] **Newsletters** — Optional: store full HTML or Markdown for archive; optional: `excerpt` for list view.
- [ ] **Persistence** — When ready, move from in-memory arrays to a real store (e.g. SQLite, JSON file, or a small database) so data survives server restarts.

---

## Order of work (summary)

1. **Decide** your unique function(s) and add a line about it on the site.
2. **Lock** universal design: same header, footer, colors, type, spacing, ornaments on every page.
3. **Improve** in order: Homepage → Events → Propose → Polls → Newsletter → Join/Contact → Backend.

You can do Phase 2 in parallel with Phase 3 (e.g. fix header spacing on all pages, then improve Events content and features). Use this doc as a checklist and update the boxes as you go.
