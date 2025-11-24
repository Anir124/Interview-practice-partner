# AI Interview Studio — Frontend (Lovable Edition)

Comprehensive README for the frontend of *AI Interview Studio (Lovable Edition)*. This README contains setup instructions, architecture notes, and design decisions tailored to the codebase uploaded at `/mnt/data/loveable-interview-coach-main.zip`.

---

## Live Preview

You can access the live preview here: [https://ask-me-anything-183.lovable.app/](https://ask-me-anything-183.lovable.app/)

## Table of contents

1. Project overview
2. System requirements
3. Quick setup (local dev)
4. Build & preview
5. Project structure
6. Key components & responsibilities
7. Architecture notes
8. Design decisions
9. Backend integration (contract & endpoints)
10. Testing & quality
11. Deployment notes
12. Troubleshooting
13. Contributing
14. License

---

## 1 — Project overview

This repository implements the frontend portion of an AI-powered interview practice platform. It aims to provide:

* Real-time voice interview simulation (speech-to-text, silence detection)
* On-page coding environment with run/test capability
* Camera-based engagement signals (eye/head tracking / camera preview)
* Transcript display, waveform, and microphone controls
* Mock mode so the frontend can be developed without a backend

The stack is Vite + React (TypeScript) + Tailwind + shadcn-style UI primitives. The project is intentionally frontend-first so backend functionality can be added later behind clear API contracts.

---

## 2 — System requirements

* Node.js **18.x** or newer (LTS recommended)
* npm (or `pnpm` / `yarn`) — examples below use `npm`
* Recommended editor: VS Code with TypeScript tooling
* For camera / microphone features: a modern browser (Chrome / Edge / Firefox). Allow camera/mic permissions.

> The project is present in the uploaded zip: `/mnt/data/loveable-interview-coach-main.zip`.

---

## 3 — Quick setup (local dev)

1. Unzip the uploaded archive (if you haven't already):

```bash
unzip /mnt/data/loveable-interview-coach-main.zip -d ~/projects/
cd ~/projects/loveable-interview-coach-main
```

2. Install dependencies

```bash
# using npm
npm install

# or pnpm
# pnpm install
```

3. Start dev server (Vite)

```bash
npm run dev
```

4. Open the app in a browser at the address Vite prints (usually `http://localhost:5173`).

5. If you want a production build for testing locally:

```bash
npm run build
npm run preview
```

---

## 4 — Build & preview

* `npm run build` — creates a production build in `dist/`.
* `npm run preview` — serves the built assets locally for final verification.

---

## 5 — Project structure (high level)

```
loveable-interview-coach-main/
├─ public/                 # static assets
├─ src/
│  ├─ components/          # UI components (CameraPreview, Waveform, QuestionCard, etc.)
│  ├─ components/ui/       # shadcn or primitive-like UI building blocks
│  ├─ App.tsx              # root React app
│  ├─ main.tsx             # app bootstrap (vite)
│  └─ styles/              # Tailwind / global styles
├─ package.json
└─ vite.config.ts
```

> See `src/components/` for the primary UI pieces used by the app.

---

## 6 — Key components & responsibilities

* `CameraPreview.tsx` — captures camera feed and may provide simple engagement heuristics.
* `MicControl.tsx` — microphone on/off and level detection.
* `TranscriptList.tsx` — displays transcribed speech events.
* `CodingEnvironment.tsx` — Monaco editor wrapper and UI to run code/test cases.
* `QuestionCard.tsx` — UI for interview question prompts and state.
* `Waveform.tsx` — visual audio waveform / VAD display.

These are intentionally modular so you can add or swap implementations (different STT provider, richer camera analytics, etc.).

---

## 7 — Architecture notes

### Frontend-only approach (Mock mode)

The frontend ships with a "mock mode" idea that lets the UI run without a live backend. This is useful for rapid frontend development and usability testing.

### Extensible API contract

The app expects a small set of backend endpoints to enable full features (code run, transcripts storage, model orchestration). The README below includes suggested endpoint contracts in the **Backend integration** section.

### State management

The app relies on local React state and lightweight contexts. For larger scale or multi-tab collaboration consider adding a global store (Zustand / Redux) and persist critical session state to localStorage or a session backend.

### Media handling

* Camera & mic are accessed with standard browser APIs (`getUserMedia`).
* For STT (speech-to-text) you can integrate cloud providers (AssemblyAI, OpenAI Speech, Whisper server, etc.) or a custom WebSocket streaming STT service.

---

## 8 — Design decisions (why things are the way they are)

**Vite + React + TypeScript**

* Vite gives fast dev reloads and small config. TypeScript reduces runtime surprises and improves DX with typed props.

**Tailwind + component primitives (shadcn-like)**

* Utility-first styling provides quick iteration and consistent layouts while keeping bundle size small.

**Monaco for code editing**

* Monaco is the de-facto web code editor (used in VS Code) and supports in-editor testing, multi-language, and intellisense.

**Mock-first UX**

* Developing the frontend without a full backend allows designers and frontend devs to iterate faster and define stable API contracts for later backend teams.

**Accessibility & Permissions**

* Camera/mic features require careful permission flows; components are designed to degrade gracefully when access is denied.

**No opinionated backend**

* Backend is intentionally left out; the frontend is designed to integrate with many backends (serverless functions, a Node/Express API, or cloud endpoints).

---

## 9 — Backend integration (suggested contract)

> The frontend includes sample fetch calls and expects the following JSON APIs. Adjust to your preferred backend.

### `POST /api/transcripts` — save a transcript entry

**Request**

```json
{ "transcript": "text", "confidence": 0.95, "questionId": "q123", "timestamp": "2025-11-23T...Z" }
```

**Response**

```json
{ "id": "tx123", "status": "ok" }
```

### `POST /api/run` — run user code (fast sandbox)

**Request**

```json
{ "problemId": "prob-1", "language": "python", "code": "print('hi')", "stdin": "" }
```

**Response**

```json
{ "stdout": "hi\n", "stderr": "", "exitCode": 0, "tests": [{"name":"sample","passed":true}] }
```

### `GET /api/problems` — fetch available problems/questions

**Response**

```json
[ {"id":"prob-1","title":"Sum two numbers","difficulty":"easy"} ]
```

**Notes**: Run endpoints must be sandboxed and rate-limited. Consider using serverless functions + a containerized sandbox (or third-party code-run services) to avoid executing arbitrary user code on your production servers.

---

## 10 — Testing & quality

* Add unit tests for pure UI logic (React Testing Library + Jest).
* Add end-to-end tests (Playwright) to cover permission flows (allow/deny camera & mic) and basic interview flows.
* Linting is configured (`eslint`) — run `npm run lint`.

---

## 11 — Deployment notes

* Build static assets with `npm run build`.
* Host on static hosts (Netlify, Vercel) or S3 + CloudFront. If the app needs serverless APIs, consider Vercel Functions, Netlify Functions, or AWS Lambda.
* For camera and microphone features be sure to serve the app over HTTPS (browser restrictions for getUserMedia).

