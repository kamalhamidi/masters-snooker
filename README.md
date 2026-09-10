# Master's Snooker 🎱

Full-stack web platform for a real-world snooker & billiards club: public landing
page, multi-role auth (Player / Employee / Chef), Elo-based ranking, tournaments
with online registration & payment, live streaming, table reservations, QR
check-in, achievements and a tiered loyalty program.

Dark, felt-green + gold design system. Mobile-first everywhere (sticky bottom
nav, card layouts, swipeable filters, 44px tap targets), with a light-mode toggle.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4, custom design tokens, Framer Motion |
| Database | PostgreSQL + Prisma ORM (v6) |
| Auth | NextAuth v5 (credentials, JWT) with role-based middleware |
| Charts | Recharts |
| QR | `qrcode` (generation) + BarcodeDetector API (camera scan) |
| Payments | Stripe Checkout (falls back to demo-payment mode without keys) |
| Live video | YouTube/Twitch iframe embeds, toggled from admin settings |

## Getting started

### 1. Prerequisites

- Node 20+
- Docker (for PostgreSQL) — or any Postgres 14+ instance

### 2. Database

```bash
docker run -d --name masters-snooker-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=masters_snooker -p 5433:5432 postgres:16-alpine
```

### 3. Environment

```bash
cp .env.example .env
# set AUTH_SECRET:  openssl rand -base64 32
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | NextAuth JWT signing secret |
| `NEXT_PUBLIC_APP_URL` | Base URL (Stripe redirects) |
| `STRIPE_SECRET_KEY` | Optional — enables real Stripe Checkout for entry fees |
| `CLOUDINARY_URL` | Optional — image hosting (avatar/banner URLs work without it) |

### 4. Install, migrate, seed, run

```bash
npm install
npx prisma db push      # create schema
npx prisma db seed      # 14 players, 90 days of matches, tournaments, bookings
npm run dev
```

Open http://localhost:3000.

### Demo accounts (password for all: `password123`)

| Role | Email | What to try |
|---|---|---|
| Player | `ronnie@demo.club` | Dashboard, matches, tournaments, QR, loyalty |
| Employee | `sara@masters.club` | Staff desk, create match, enter results, scan check-ins |
| Chef (owner) | `chef@masters.club` | Admin analytics, tournament wizard, applications, staff & trust badges, settings |

## Key concepts

### Scoring (Elo-inspired)

- Every player starts at **1000 points**. On a rated win, the winner takes
  points from the loser: `Δ = K × (1 − expected)`, where `expected` follows the
  standard Elo curve — so **beating a stronger player pays much more**.
- K-factor by match type: Friendly **0** · Ranked **24** · Tournament **32** ·
  Championship **40**.
- **XP & levels** are separate from rating: wins pay 100 XP × type multiplier,
  plus an upset bonus for beating higher-level players. Level = `⌊√(xp/150)⌋ + 1`.

### Match types

| Type | Ranking impact |
|---|---|
| Friendly | none |
| Ranked | rating exchange (K=24) |
| Tournament | rating exchange (K=32) + tournament progression |
| Championship | rating exchange (K=40), highest weight |

### Trust badge

Chef grants trust badges from **Admin → Staff & badges**. Trusted players are
auto-approved into tournaments after payment; everyone else lands in the
**Admin → Applications** queue.

### QR check-in

Each player has a personal QR (`/checkin`, downloadable). Staff scan it at
`/staff/scan` (camera via BarcodeDetector, manual fallback). A check-in marks
attendance, awards visit loyalty points and feeds the "Club Regular" badge.

### Loyalty

Points per match/visit/reservation (rates editable in admin settings). Lifetime
earnings set the tier: Bronze → Silver (500) → Gold (1500) → Elite (4000).
Rewards catalog at `/loyalty` with instant redemption.

## Project structure

```
prisma/            schema + seed (realistic 90-day history)
scripts/           smoke-test.ts — business-logic sanity checks
src/
  app/
    (public)/      landing, login, register
    (app)/         authenticated app (player + staff + admin pages)
    api/           route handlers (auth, matches, reservations, admin…)
  components/
    ui/            design-system primitives (button, card, dialog…)
    layout/        app shell, navs, theme toggle
    features/      match rows, badge wall, rating dialog
    charts/        recharts wrappers
  lib/             prisma, auth, points engine, badge engine, queries
  middleware.ts    role-based route protection
```

## Verifying

```bash
npx tsx scripts/smoke-test.ts   # Elo/XP formulas, match side-effects, seed integrity
npm run build                   # production build
```

## Languages

Use the language selector in the header to switch between **English**, **Français**,
and **العربية**. English is the default. The `cuehub-locale` cookie remembers the
selection for one year; no account is required. URLs and form/API values stay the
same across languages. Arabic pages use `lang="ar"`, right-to-left layout, and
Arabic-compatible typography. Dates, currency, and relative times use the selected
locale (the currency remains USD).

Translations live in `src/lib/i18n/messages.json`. The English source text is the
message key; French and Arabic must preserve all `{placeholder}` names. Server
components use `await getI18n()` and client components use `useI18n()`. Translate
labels at render time; never translate database enums, route names, form values,
or API payloads. Member names and custom club content are kept as entered. Known
built-in rewards, badges, and legacy notification templates are translated.

Run the localization and reservation checks with:

```bash
node --import tsx --test scripts/i18n.test.ts scripts/reservation-slots.test.ts
```

## Deploying to Vercel

The repository includes an initial Prisma migration and a Vercel build command.
Each deployment generates Prisma Client, applies pending migrations with
`prisma migrate deploy`, and builds Next.js.

1. Push the repository to GitHub, then import it from **Vercel → New Project**.
   Keep the detected **Next.js** framework preset and repository root.
2. In the Vercel project, open **Storage → Create Database** and provision a
   PostgreSQL database (for example Neon, Prisma Postgres, or Supabase). Connect
   it to this project and ensure its connection string is available as
   `DATABASE_URL` in Production. Use a separate database or database branch for
   Preview deployments; do not point untrusted preview branches at production.
3. Add these variables under **Settings → Environment Variables**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Production PostgreSQL connection string from the storage integration |
   | `AUTH_SECRET` | A private random value generated with `openssl rand -base64 32` |
   | `AUTH_TRUST_HOST` | `true` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` (replace with the custom domain later) |
   | `STRIPE_SECRET_KEY` | Optional; omit to keep demo tournament payments |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional; Stripe publishable key |
   | `CLOUDINARY_URL` | Optional; required only for Cloudinary uploads |

4. Deploy. The build applies `prisma/migrations` to the empty database. An
   initial deployment made before connecting the database may fail; after adding
   the variables, open **Deployments** and select **Redeploy**.

5. To add the three documented demo accounts without deleting users who
   registered on the deployed site, run:

   ```bash
   npx vercel link
   npx vercel env run -e production -- npm run seed:demo-accounts
   ```

   This command only creates missing demo accounts and preserves existing data.
   The full `npx prisma db seed` command clears the database first and is for
   disposable local/demo databases only. The demo credentials are public,
   including `chef@masters.club` / `password123`, so do not add these
   accounts to a real member database.

Environment variable changes only affect new deployments, so redeploy after
changing `NEXT_PUBLIC_APP_URL`, Stripe keys, or the database connection. Do not
copy the local `.env` to Vercel: its `localhost` database address cannot be
reached from Vercel and `.env*` is intentionally excluded from Git.
