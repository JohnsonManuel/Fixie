# Fixie Frontend — CLAUDE.md

## Project Overview

React/TypeScript dashboard for the Fixie AI chat platform. Users chat with an AI assistant that can create support tickets, look up user info, and execute IT actions via integrations (Freshdesk, Zoho Desk, Jira, Linear, etc.).

**This is the frontend only.** The backend FastAPI service lives at:
`E:\FIXIE\Chat Backend - New\Fixie-backend-dev\smart-chat-v2`

---

## Repositories

| Repo | Path | Purpose |
|------|------|---------|
| Frontend (this repo) | `E:\FIXIE\JJAI` | React/TypeScript SPA, deployed to Firebase Hosting |
| Backend | `E:\FIXIE\Chat Backend - New\Fixie-backend-dev\smart-chat-v2` | FastAPI API, deployed to Cloud Run (`fixie-chat`) |

---

## Abandoned / Ignore

Anything else in `E:\FIXIE\` is dead code — do not reference it:

| Path | Status |
|------|--------|
| `E:\FIXIE\Fixie-Backend\fixie-langgraph` | Abandoned LangGraph prototype — **not used** |
| `E:\FIXIE\Fixie-Backend\langgraph-proxy` | Abandoned — **not used** |
| `E:\FIXIE\Chat Backend - New\Fixie-backend-dev\backup` | Old snapshots — **not used** |

---

## Stack

- **Framework**: React 18, TypeScript, Create React App
- **Styling**: Tailwind CSS
- **Auth**: Firebase JS SDK (client-side, Firebase project `jj-ai-platform`)
- **API**: `src/lib/fixie/api.ts` — attaches Firebase ID token as Bearer, hits `https://fixie-chat-308405783967.us-central1.run.app`
- **Deploy**: Firebase Hosting (`firebase deploy --only hosting`)

---

## Commands

```bash
# Local dev
npm start

# Production build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Type-check
node_modules/.bin/tsc --noEmit
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/fixie/api.ts` | Authenticated fetch + `apiStream` for SSE streaming |
| `src/lib/fixie/config.ts` | `API_BASE` URL, Firebase config |
| `src/contexts/FixieAppContext.tsx` | Global app state (user, org, current view, current conversation) |
| `src/components/fixie/layout/Sidebar.tsx` | Unified sidebar: nav + conversation list + admin shortcuts |
| `src/components/fixie/views/ChatView.tsx` | Main chat UI with streaming support |
| `src/components/fixie/views/McpView.tsx` | Integrations management |
| `src/components/fixie/views/ApprovalsView.tsx` | Admin approval queue |
| `src/components/fixie/views/TicketsView.tsx` | Ticket/execution history |
| `src/components/fixie/views/UsersView.tsx` | Org user management |
| `src/types/fixie.ts` | Shared TypeScript types |

---

## API Endpoints (backend)

All calls go to `API_BASE` (Cloud Run `fixie-chat`). Auth header: `Authorization: Bearer <firebase-id-token>`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/chat/stream` | **Primary chat endpoint** — SSE streaming, text/event-stream |
| POST | `/api/chat/message` | Non-streaming chat (used for tool confirmations) |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id` | Load conversation messages |
| DELETE | `/api/conversations/:id` | Delete conversation |
| GET | `/api/auth/me` | Current user + org info |

### Streaming event format (`/api/chat/stream`)

```
data: {"type": "text_delta", "text": "Hello "}
data: {"type": "text_delta", "text": "world"}
data: {"type": "done", "conversation_id": "...", "pending_confirmation": null}
data: {"type": "error", "message": "..."}
```

---

## Architecture Notes

- **Sidebar** (`Sidebar.tsx`): single unified sidebar. In chat view: New Chat CTA → conversation list → admin nav pinned at bottom. In admin views: back-to-chat link → admin nav.
- **Streaming**: `_doSend` in `ChatView.tsx` uses `apiStream()`. An empty assistant bubble is inserted immediately and updated token-by-token. `confirmTool` still uses `apiPost` (non-streaming, short responses).
- **Pending confirmation flow**: Claude returns `pending_confirmation` in the `done` event → `ConfirmCard` renders → user clicks Confirm → `confirmTool` calls `/api/chat/message` with `user_confirmed: true`.
- **Voice**: `useVoiceAgent` hook handles mic → Whisper transcription → TTS playback. Voice sends via `_doSend` same as text.

---

## GCP / Deployment

- GCP project: `jj-ai-platform`
- Firebase project: `jj-ai-platform`
- Backend Cloud Run service: `fixie-chat` (us-central1)
- Backend URL: `https://fixie-chat-308405783967.us-central1.run.app`
- TTS endpoint: `https://europe-west3-jj-ai-platform.cloudfunctions.net` (Firebase Function)
