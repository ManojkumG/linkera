# SharkHire — Referral Marketplace

A platform that connects job seekers directly with **verified employees** willing to
provide referrals. Seekers build AI-enriched profiles, search referrers by company /
role / location, and submit paid referral requests that both sides track through a
full status workflow.

Built on the **T3 Stack**: Next.js 15 (App Router) · tRPC v11 · Drizzle ORM +
PostgreSQL · NextAuth v5 · Tailwind CSS v4 · TypeScript.

## What's in this MVP (the core referral loop)

- **Auth & roles** — email/password sign-up (NextAuth credentials, JWT sessions),
  optional Google OAuth, role-aware access (`seeker` / `employee` / `admin`).
- **Onboarding** — pick a role and seed a seeker or employee profile.
- **Employee verification** — company email / work-email OTP / LinkedIn (stubbed,
  auto-approves so the loop is exercisable).
- **Referral listings** — employees publish opportunities (company, role, price,
  monthly slot limits) and manage/pause them.
- **Search** — filter referrals by company, department, role, location, work mode,
  experience level, price, and availability.
- **Referral request workflow** — seekers attach a resume + cover letter and submit;
  status flows `Requested → Viewed → Under Review → Referred → Accepted → Rejected → Hired`
  with an audit timeline and slot accounting.
- **Dashboards** — role-specific stats, AI recommendations (seeker), and a review
  queue (employee).
- **Resume & ATS** — upload a resume, auto-extract skills, get an ATS score with
  suggestions, and apply parsed data to your profile.
- **Notifications** — in-app notifications for request activity and status changes.

### AI features

All AI lives behind the `AIService` interface in
[`src/server/services/ai`](src/server/services/ai). The current implementation is a
**deterministic mock** (resume parsing, ATS scoring, referral matching, cover-letter
generation, success prediction). Swap `ai` in
[`index.ts`](src/server/services/ai/index.ts) for a Claude/OpenAI-backed
implementation of the same interface — no routers or pages change.

### Deliberately stubbed for this MVP

Payments, SMS/email delivery, real identity verification, community/forums, and admin
tooling are scoped out. The schema, request `paid` flag, `notify()` service, and
verification states leave clean seams to add them.

## Getting started

### 1. Environment

Copy `.env.example` to `.env` and fill it in:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/sharkhire"
AUTH_SECRET="…"            # generate with: npx auth secret
# Optional — credentials login works without these:
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

### 2. Database

Start a local Postgres (the included script uses Docker/Podman):

```bash
./start-database.sh
```

…or point `DATABASE_URL` at any Postgres (e.g. Neon/Supabase). Then apply the schema:

```bash
pnpm db:migrate     # apply the generated migration in ./drizzle
# or, for rapid iteration:
pnpm db:push
```

### 3. Run

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Create a **job seeker** and an **employee** account (different emails), verify the
employee, publish a listing, then request a referral from the seeker account to see
the full loop.

## Useful scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start the dev server                         |
| `pnpm build`        | Production build                             |
| `pnpm typecheck`    | `tsc --noEmit`                               |
| `pnpm lint`         | ESLint                                       |
| `pnpm db:generate`  | Generate a migration from schema changes     |
| `pnpm db:migrate`   | Apply pending migrations                     |
| `pnpm db:studio`    | Drizzle Studio                               |

## Project layout

```
src/
  app/                     App Router pages + colocated client components
    _components/           Shared UI (ui.tsx, navbar, cards, inputs)
  server/
    api/routers/           tRPC routers (auth, profile, resume, listing, request, …)
    auth/                  NextAuth v5 config
    db/schema.ts           Drizzle schema (auth + domain tables)
    services/ai/           AIService interface + mock implementation
  lib/domain.ts            Shared enums, status machine, resume types
```
