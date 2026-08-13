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
