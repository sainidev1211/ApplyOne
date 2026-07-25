# ApplyOne - Frontend SaaS Foundation

ApplyOne is a premium, enterprise-grade frontend foundation for a job application automation platform. It is engineered with React 19, Vite, TypeScript, Tailwind CSS v4, Zustand, and Supabase Auth.

---

## 1. Project Architecture & Folder Layout

The project follows a **Feature-Based clean architecture** layout. Business logic, authentication triggers, database queries, and external APIs are abstracted into service layer modules, decoupling them from UI rendering cards.

```
src/
 ├── assets/          # Static assets (images, vectors, fonts)
 ├── config/          # Centralized configuration (constants, navigation, pricing)
 ├── design-system/   # Custom Light/Dark/System theme context and variables
 ├── components/      # UI components (Design System core controls)
 │    ├── ui/         # Generic accessible components (Button, Input, Card, Badge, etc.)
 │    └── shared/     # Shared components (Navbar, Footer, SEO)
 ├── features/        # Business logic partitions (marketing landing, credentials)
 ├── layouts/         # Layout shells (MainLayout, AuthLayout, DashboardLayout)
 ├── routes/          # Centralized router paths and intercepting guards (ProtectedRoute)
 ├── services/        # Clean service wrappers (Logging, Analytics, Storage, Supabase)
 ├── store/           # Zustand state containers (authStore, toastStore)
 ├── types/           # Type declarations and database schemas
 ├── utils/           # Custom helper scripts (class-name merger `cn`, validation)
 └── supabase/        # Database triggers, indices, and tables definitions
```

---

## 2. Technology Stack & Key Libraries

- **Framework**: [React 19](https://react.dev) + [Vite](https://vite.dev) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (utility classes, direct @theme overrides, custom animations)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (centralized auth session, profile caching, toaster notifications)
- **Form Controls**: [React Hook Form](https://react-hook-form.com) (optimizes field rendering triggers)
- **Validation Schema**: [Zod](https://zod.dev) (strict client-side constraints validation)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (micro-interactions, fade-in reveals, slide-in toasts)
- **Auth & Database**: [Supabase JS SDK](https://supabase.com/docs) (RLS authorization schema)

---

## 3. SOLID Service Abstractions

To protect page components from direct API provider locks (DIP - Dependency Inversion Principle), all asynchronous operations are piped through clean service interfaces and return a standardized envelope format:

```typescript
export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string | null;
}
```

- **LoggingService**: Abstraction over APM tools (e.g. Sentry/OpenTelemetry).
- **AnalyticsService**: Integrations manager for analytics engines (e.g. Mixpanel, Clarity, Google Analytics).
- **StorageService**: File upload manager for resume PDFs and avatar uploads.
- **NotificationService**: Trigger pipeline for email, push feeds, SMS, and in-app updates.
- **AuthService / ProfileService**: Wrappers around Supabase Auth API calls and `public.profiles` database tables.

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation Steps

1. **Clone the repository and enter the directory**:
   ```bash
   cd ApplyOne
   ```

2. **Install dependency packages**:
   ```bash
   npm install
   ```

3. **Configure environment credentials**:
   Copy `.env.example` to `.env` and insert your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. **Initialize database schema**:
   Execute the query instructions inside [schema.sql](file:///e:/ApplyOne/src/supabase/schema.sql) within your Supabase SQL editor. This:
   - Sets up the `public.profiles` table.
   - Configures database triggers matching new sign-ups.
   - Applies strict Row Level Security (RLS) policies.

5. **Start the local development server**:
   ```bash
   npm run dev
   ```

---

## 5. Simulation Mode Fallback

If `VITE_SUPABASE_URL` is omitted or contains a `placeholder` value, **ApplyOne automatically transitions to Simulation Mode**.
- Registration, login, password recovery, profile editing, and verification updates are simulated locally.
- Session profiles are cached in `localStorage` to preserve login states on page refresh.
- To bypass the unverified email screen, sign in using password `verified123` or email `verified@applyone.com`.

---

## 6. Accessibility & Optimization Compliance

- **Accessibility (WCAG 2.1 AA)**: All inputs incorporate native labelling, custom layout boxes leverage `aria-describedby` error linkages, modal items handle overlay close triggers, and text values retain contrast boundaries.
- **Optimizations**: Heavy views (such as the Landing or Dashboard layouts) utilize dynamic imports via `React.lazy()` for route code splitting. Layout shifts are prevented using strict SVG heights, and buttons include standard loading triggers.
- **SEO Elements**: Every path mounts a custom `<SEO />` tag manager updating title banners, OpenGraph tags, and canonical links.
