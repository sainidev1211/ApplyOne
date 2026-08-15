# ApplyOne — Demo Build & Testing Guide

Welcome to the ApplyOne Phase 2 Standalone Demo Build. This build is configured for testing without external database dependencies.

---

## 🔑 Demo Account Credentials

Use these credentials to log in on the [/login](http://localhost:5173/login) screen:

| Role | Email | Password | Landing Route |
|---|---|---|---|
| **User Candidate** | `user@applyone.test` | `User@1234` | `/dashboard` |
| **Administrator** | `admin@applyone.test` | `Admin@1234` | `/admin` |

---

## ⚡ Environment & AI Configuration

This build uses live AI features powered by the **Groq API** (`llama-3.1-8b-instant`).

- **Required `.env` Variable**: Set `GROQ_API_KEY` in `backend/.env` (e.g. `GROQ_API_KEY=gsk_...`).
- Both the **AIChatbox** and the **ATS Score Checker** depend on this key via the backend public route `POST /api/v1/chat/public`.

---

## ℹ️ Database & Auth Disconnection Note

> **Note**: Database connection and Supabase Auth SDK are intentionally disabled in this testing build to allow offline/standalone demonstration without DB dependencies.

- **Local Session Auth**: Auth is driven by local bcrypt/JWT and `localStorage` session state (`src/services/supabase/authService.ts`).
- **Restoration Points**:
  - To restore real Supabase Auth: Refer to instructions inside `src/services/supabase/authService.ts` and `src/store/authStore.ts`.
  - To restore database persistence for ATS Reports: Refer to the marked `SUPABASE PERSISTENCE RESTORATION POINT` comments in `src/services/ai/atsService.ts` and `src/pages/AtsChecker.tsx`.

---

## ⚠️ Known Limitations in This Demo Build

1. **In-Memory Admin Edits**: User details edited in the Admin Control Center (`/admin`) update local state in memory and will reset upon page refresh.
2. **Mock Notifications**: Dispatched notifications in `/admin` append to the session log table without sending external emails/SMS.
3. **Mock Billing Data**: Payment records and transactions in `/admin` and `/dashboard/subscriptions` are pre-populated mock records.
4. **ATS Score Reports**: ATS evaluations run in real-time using live Groq AI but are not saved to a persistent database table in demo mode.
