# UATX Concordia — Social Club

Backend (Node/Express) and React frontend for the club site.

## How to run (one server)

You only need **one** server: the Node app. It serves both the API and the React frontend.

**Simplest:** from the project root run
```bash
npm run build-and-start
```
Then open **http://localhost:3000**. This builds the React app and starts the server. (Use this if you’re not sure whether you built the client.)

**Or in two steps:**
1. `npm run build:client` — build the React app (do this after changing frontend code).
2. `npm start` — start the server.
3. Open **http://localhost:3000**.

That’s it. The same server handles the site and all API requests (events, polls, newsletters, etc.).

---

### Optional: dev mode with hot reload

The **Vite dev server** is only for development. It gives you instant refresh when you edit React code, but it does **not** run the API. So you’d run two processes:

- Terminal 1: `npm start` (API + fallback frontend)
- Terminal 2: `npm run dev:client` (Vite; open http://localhost:5173 and use that while coding)

You can ignore this and always use **build + npm start** if you prefer.

### Sending newsletters by email

To send a published newsletter to all subscribers from the admin **Send to subscribers** button, set SMTP environment variables and restart the server:

- `SMTP_HOST` — e.g. `smtp.gmail.com` or your provider’s host
- `SMTP_PORT` — usually `587` (or `465` for SSL)
- `SMTP_USER` — your SMTP username/email
- `SMTP_PASS` — your SMTP password or app password
- `SMTP_SECURE` — set to `true` or `1` for port 465
- `MAIL_FROM` (optional) — from address; defaults to `SMTP_USER`

If these are not set, the button will report that email is not configured.
