# AI Project

A concise, corrected README for this repository. This project is a full-stack AI call assistant with a React + TypeScript frontend and a TypeScript/Node backend (Express). It uses Clerk for authentication and Neon + Drizzle for database storage.

---

## Quick overview ✅

- Frontend: React + TypeScript (Vite)
- Backend: TypeScript / Node (Express, run with `tsx`)
- Auth: Clerk
- Database: Neon (PostgreSQL) + Drizzle ORM
- Purpose: a call assistant app with API routes, user sync, and audio/AI integrations

---

## Intro 🧭

This repository implements an AI-powered call assistant: it converts caller speech to text, uses a large language model to detect intent and generate responses, and produces spoken audio back to the caller. The app supports real-time call flows, conversation summarization, user sync, and audio generation for automated or assisted calling workflows.

## Integrations 🔌

- **Google Gemini** (via the `@google/generative-ai` client): used for intent detection, summarization, and generating assistant responses. Set `GEMINI_API_KEY` in your `.env`.
- **ElevenLabs**: used for speech-to-text (STT) and text-to-speech (TTS) to convert between audio and text. Set `ELEVENLABS_API_KEY` in your `.env`.
- **Clerk**: authentication and user management (set `VITE_CLERK_PUBLISHABLE_KEY`).
- **Neon + Drizzle**: persistent storage for users and call data (set `DATABASE_URL`).

See `SETUP_INSTRUCTIONS.md` for step-by-step key acquisition and configuration.

---

## Requirements 🔧

- Node.js 18+ and npm
- A Neon or PostgreSQL database (if using DB features)

---

## Local setup (fast) 🚀

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and fill required variables:

```bash
cp .env.example .env
# On Windows (PowerShell):
# Copy-Item .env.example .env
```

Required env vars (edit `.env`):
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `VITE_API_BASE_URL` — e.g. `http://localhost:8000`
- `DATABASE_URL` — Neon/Postgres connection string (if using DB)
- `CLERK_WEBHOOK_SECRET` — (optional) Clerk webhook signing secret

3. Run database migrations (if you use the DB):

```bash
npm run migrate
```

4. Start the backend (API):

```bash
npm run dev
```

By default the API runs on port 8000.

5. Start the frontend (client):

```bash
npm run dev:client
```

Vite serves the frontend at http://localhost:5173.

---

## Useful scripts 🔁

- `npm run dev` — Start the TypeScript backend server (development)
- `npm run dev:client` — Start the Vite frontend server
- `npm run migrate` — Run database migrations
- `npm run test:db` — Run DB test script
- `npm run test:sync` — Test user sync (creates a test user)
- `npm run build` — Build frontend and bundle server for production
- `npm run preview` — Preview a production build

---

## Notes / Troubleshooting ⚠️

- If the frontend cannot reach the API, check `VITE_API_BASE_URL` and that the backend is running on port 8000.
- For auth issues, verify Clerk keys and that the Clerk SDK is initialized in the app.
- If migrations fail, ensure `DATABASE_URL` is correct and accessible.

---

## Contributing 🤝

- Fork the repo, add a clear commit with tests or verification steps, and open a pull request.
- Keep changes focused and add documentation for new endpoints or env vars.

---

If you'd like, I can further tailor this README to include troubleshooting examples, developer workflows (VS Code tasks, debug config), or short descriptions of important files (e.g., `server/index.ts`, `src/`).

