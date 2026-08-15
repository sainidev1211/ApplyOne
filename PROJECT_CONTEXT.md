# ApplyOne — Project Context

> Last verified: 2026-08-01
> Codebase state: **Phase 2 — Dev/Demo Mode (local auth, live Groq AI, real Supabase DB)**

---

## Stack Overview

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6, TailwindCSS 4, Framer Motion, Zustand, React Router v7 |
| Backend | NestJS (Node.js), Prisma ORM, PostgreSQL via Supabase |
| Auth (current) | **DEV MODE** — bcrypt + JWT (custom, no Supabase Auth SDK used) |
| AI Provider | **Groq** (public chatbot via `POST /chat/public`) + **Gemini** (ATS / feature AI via `AiService`) |
| DB | Supabase PostgreSQL (connection string in `backend/.env`) |
| Queue | BullMQ + Redis (`redis://localhost:6379`) |
| File Uploads | Local disk (`./uploads`), NestJS Multer |
| Deployment | Docker / docker-compose (backend), Vite dev server (frontend) |

---

## 1. Environment Files

### `/.env` (frontend — Vite, git-tracked)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL — used ONLY for Supabase JS client init in `src/supabase/client.ts`. **Not** used for auth in dev mode. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key — paired with above. |
| `VITE_API_URL` | Base URL for the NestJS backend (`http://localhost:3000`). Used by `apiClient.ts` and `authService.ts` to build `API_BASE`. |

### `/backend/.env` (backend — git-ignored)

| Variable | Purpose |
|---|---|
| `BACKEND_PORT` | NestJS server port (3000) |
| `NODE_ENV` | Runtime environment (`development`) |
| `JWT_SECRET` | Secret for signing/verifying JWTs (dev value only) |
| `JWT_EXPIRES_IN` | JWT expiry (`7d`) |
| `GROQ_API_KEY` | **THE AI API KEY** — Groq API key used by `GroqAiAdapter` for the public chatbot. Provider: Groq / Llama 3.1. |
| `GROQ_MODEL` | Default Groq model (`llama-3.1-8b-instant`) |
| `UPLOAD_PATH` | Local upload directory (`./uploads`) |
| `MAX_UPLOAD_SIZE_MB` | Max upload file size (10 MB) |
| `DATABASE_URL` | Supabase PostgreSQL pooled connection string (Prisma `datasource`) |
| `SUPABASE_URL` | Supabase project URL (used by backend Supabase service-role client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role JWT — for backend admin DB operations |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `REDIS_URL` | Redis connection for BullMQ (`redis://localhost:6379`) |
| `DIRECT_URL` | Supabase direct (non-pooled) connection string (for Prisma migrations) |

---

## 2. AI Chatbot — Current Implementation

### Files

| File | Role |
|---|---|
| `src/components/shared/AIChatbox.tsx` | UI component — floating robot button + chat panel |
| `backend/src/chat/public-chat.controller.ts` | `POST /api/v1/chat/public` — public (no auth required) endpoint |
| `backend/src/ai/adapters/groq-ai.adapter.ts` | Groq HTTP adapter — calls Groq REST API |

### Call Chain
```
AIChatbox.tsx
  → fetch('http://localhost:3000/api/v1/chat/public', { messages })
    → PublicChatController.handlePublicChat()
      → GroqAiAdapter.chat()
        → https://api.groq.com/openai/v1/chat/completions
          (Authorization: Bearer GROQ_API_KEY from backend/.env)
```

### Authentication Pattern
- No frontend API key. Key lives in `backend/.env` as `GROQ_API_KEY`.
- Read by backend via `ConfigService.get('groq.apiKey')`.
- `Authorization: Bearer ${apiKey}` added in `GroqAiAdapter.callGroqApi()`.
- `/chat/public` endpoint has NO `JwtAuthGuard` — intentional for landing page.

### Status
WORKING — Backend is up (port 3000), Groq API key is set, endpoint is public.

---

## 3. Admin / Employee Panel

### Backend Only — No Dedicated Frontend Page Yet

All routes prefixed `admin/`, require JwtAuthGuard + admin role.

| Controller | Route prefix | Responsibility |
|---|---|---|
| `backend/src/admin/controllers/admin-dashboard.controller.ts` | `GET admin/dashboard` | Platform KPIs |
| `backend/src/admin/controllers/admin-users.controller.ts` | `admin/users/*` | CRUD on all users |
| `backend/src/admin/controllers/admin-employees.controller.ts` | `admin/employees/*` | Employee management |
| `backend/src/admin/controllers/admin-audit.controller.ts` | `admin/audit/*` | Audit log access |
| `backend/src/admin/controllers/admin-settings.controller.ts` | `admin/settings/*` | Platform settings |

Services mirror the controllers in `backend/src/admin/services/`.

NOTE: There is NO frontend /admin route in AppRoutes.tsx — backend only.

---

## 4. Auth Implementation

### Architecture (Dev Mode — bcrypt + JWT, NOT Supabase Auth)

Every auth file is annotated with DEV_ONLY and restoration instructions.

#### Frontend Auth Files

| File | Role |
|---|---|
| `src/store/authStore.ts` | Zustand store — holds user, profile, session. Reads/writes localStorage. |
| `src/services/supabase/authService.ts` | LocalAuthService — calls POST /api/v1/auth/login and signup. Stores JWT as `applyone_dev_session` in localStorage. |
| `src/services/supabase/client.ts` | Supabase JS client (initialized but unused for auth in dev) |
| `src/services/supabase/profileService.ts` | User profile API calls |
| `src/routes/guards.tsx` | ProtectedRoute + RoleGuard |
| `src/pages/Login.tsx` | Calls authStore.signIn() |
| `src/pages/Signup.tsx` | Calls authStore.signUp() |
| `src/pages/ForgotPassword.tsx` | Stub (dev mode — shows message) |
| `src/pages/ResetPassword.tsx` | Stub (dev mode) |
| `src/pages/VerifyEmail.tsx` | Shown if email_confirmed_at null; skipped in dev (always confirmed) |
| `src/pages/AuthCallback.tsx` | OAuth callback (unused in dev) |
| `src/services/api/apiClient.ts` | apiFetch() — injects Authorization: Bearer <token> from getStoredSession() |

#### Backend Auth Files

| File | Role |
|---|---|
| `backend/src/auth/auth.service.ts` | signup() → bcrypt+Prisma; login() → bcrypt compare + JWT sign |
| `backend/src/auth/auth.controller.ts` | POST /auth/signup, /auth/login, /auth/logout, /auth/change-password |
| `backend/src/auth/guards/jwt-auth.guard.ts` | NestJS guard — validates Bearer JWT on protected routes |
| `backend/src/auth/strategies/` | Passport JWT strategy |

#### Route Guard Logic (Frontend)
```
ProtectedRoute:
  if (!initialized) → spinner
  if (!user)        → /login
  if (!email_confirmed_at && !simulation) → /verify-email
  else              → render children
```

---

## 5. ATS Checker — Why It Is Broken

### What It Tries To Do
`src/pages/AtsChecker.tsx` POSTs to `POST /api/v1/ats/check` with a `resumeId`
and optional `jobDescription`, sending the stored Bearer JWT.

### Full Backend Call Chain
```
AtsChecker.tsx
  → fetch(`${API_BASE}/ats/check`, { Authorization: Bearer <JWT> })
    → AtsController.check() [JwtAuthGuard protected]
      → AtsService.runAtsCheck()
        → prisma.resume.findFirst()              ← needs real resume row in DB
        → resumeText = 'Extracted text...'       ← HARDCODED PLACEHOLDER
        → AiService.executeFeature('ATS_CHECK')
          → AiCreditValidationService.validateAndDeduct()  ← needs credits in DB
          → AiPromptsService.getTemplate('ATS_CHECK')      ← needs DB prompt row
          → GeminiProvider.generateContent()               ← NO GEMINI KEY SET
```

### Root Causes

| # | Issue | Severity |
|---|---|---|
| 1 | **Gemini API key missing** — AiService uses GeminiProvider, NOT GroqAiAdapter. No `GEMINI_API_KEY` in backend/.env. | FATAL |
| 2 | **Prompt template row missing** — AiPromptsService.getTemplate('ATS_CHECK') queries a DB table. If no row exists for 'ATS_CHECK', throws NotFoundException. | FATAL |
| 3 | **User credits likely zero** — AiCreditValidationService checks DB credits. Default users have 0 credits, throws before reaching AI. | FATAL |
| 4 | **Resume text is hardcoded** — ats.service.ts line 30: `'Extracted text from resume PDF...'` — no actual PDF parsing. | Functional gap |
| 5 | **Tier gate blocks Student accounts** — AtsChecker.tsx line 97: `isProfessionalTier = profile?.account_type === 'Student'`. Default signup creates STUDENT accounts → shows paywall lock screen instead of checker. | UX gate |
| 6 | **apiClient.ts endpoint mismatch** — `atsApi.analyze()` calls `/ats/analyze` but controller route is `/ats/check`. (AtsChecker.tsx bypasses atsApi and calls fetch directly, so this is cosmetic.) | Cosmetic |

---

## 6. Route Map (Frontend)

| Route | Page | Guard |
|---|---|---|
| `/` | LandingPage | None |
| `/privacy` | PrivacyPolicy | None |
| `/terms` | TermsOfService | None |
| `/login` | Login | None |
| `/signup` | Signup | None |
| `/verify-email` | VerifyEmail | None |
| `/forgot-password` | ForgotPassword | None |
| `/reset-password` | ResetPassword | None |
| `/auth/callback` | AuthCallback | None |
| `/dashboard` | Dashboard | ProtectedRoute |
| `/dashboard/subscriptions` | Subscriptions | ProtectedRoute |
| `/dashboard/ats-checker` | AtsChecker | ProtectedRoute |
| `/dashboard/settings` | Settings | ProtectedRoute |
| `*` | Redirect → `/` | — |

---

## 7. Phase 2 — Demo Mode Fix Plan (ATS Checker)

### Cleanest Path: Bypass AiService, Use GroqAiAdapter Directly

The existing public chatbot pattern is proven working. Replicate it for ATS:

1. Create `POST /ats/public-check` (or add to existing ATS controller) using `GroqAiAdapter` directly — bypasses Gemini, credits, and prompt DB tables entirely.
2. Accept resume text in the request body (paste from frontend) rather than a resumeId.
3. Return JSON matching AtsResult interface from AtsChecker.tsx.
4. Frontend already sends `Authorization: Bearer <JWT>` from `getStoredSession()` — reuse the existing pattern (AtsChecker.tsx lines 157–168).

### Groq Pattern to Replicate
```typescript
const response = await this.groqAiAdapter.chat({
  messages: [
    { role: 'system', content: ATS_SYSTEM_PROMPT },
    { role: 'user', content: resumeText },
  ],
});
// Parse JSON from response.content
```

### Tier Gate Fix
Change default `accountType` on signup from `'STUDENT'` to `'PROFESSIONAL'`,
or invert the tier check in AtsChecker.tsx line 97.

---

## 8. Key Files Reference

| File | Why Important |
|---|---|
| `src/store/authStore.ts` | Central auth state |
| `src/services/supabase/authService.ts` | DEV MODE — all backend auth calls |
| `src/services/api/apiClient.ts` | JWT injection, all API wrappers |
| `src/routes/guards.tsx` | Route protection |
| `backend/src/ai/adapters/groq-ai.adapter.ts` | Working AI path (Groq) |
| `backend/src/chat/public-chat.controller.ts` | Working chatbot endpoint |
| `backend/src/ats/ats.service.ts` | Broken ATS path (Gemini dep) |
| `backend/src/auth/auth.service.ts` | DEV MODE bcrypt+JWT backend |
| `backend/.env` | All secrets, GROQ_API_KEY lives here |
