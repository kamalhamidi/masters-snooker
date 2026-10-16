# Master's Snooker & Billiards Club — Complete Platform Documentation 🎱

A comprehensive, production-grade reference manual detailing the architecture, database schema, game mechanics, user roles, APIs, pages, and operational workflows of the **Master's Snooker** web platform.

---

## 1. Executive Summary

**Master's Snooker** is a full-stack, mobile-first web application designed for a modern snooker and billiards club. The platform digitizes club operations and elevates player engagement through competitive matchmaking, tournament management, automated ranking, gamification, table booking, and real-time staff operations.

### Key Highlights
- **Role-Based Experience**: Tailored interfaces for **Players**, **Employees (Staff)**, and the **Chef (Club Owner/Admin)**.
- **Elo-Inspired Competitive Engine**: Dynamic skill ratings with weighted K-factors based on match importance, coupled with independent XP progression and level curves.
- **Tournament Automation**: End-to-end tournament lifecycle including bracket management, Stripe payment checkout (with demo fallback), and trust-based entry approval.
- **Table Booking & Asset Management**: Real-time reservation slots with conflict detection, pricing tier calculations, and table category management (12ft Snooker, 9ft Pool, 7ft English Pool, Carom).
- **Physical-to-Digital Bridge**: Downloadable player QR codes scanned by staff devices using native camera barcode detection for attendance check-ins.
- **Tiered Loyalty & Rewards**: Automated points accrual from matches, check-ins, and reservations, unlocking Bronze/Silver/Gold/Elite tiers and a digital rewards redemption catalog.
- **Live Match Broadcasting**: Integrated responsive live-stream embeds (YouTube/Twitch) controllable from the owner dashboard.
- **Trilingual Localization**: Complete native support for **English**, **Français**, and **العربية (RTL)** with locale-aware dates, currencies, and Arabic-compatible typography.

---

## 2. Technology Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Next.js 16 App Router                         │
│   (React 19, Server Components, Route Handlers, Server-side Middleware) │
├───────────────────────────────────┬────────────────────────────────────┤
│           Client Layer            │            Server Layer            │
│  - Tailwind CSS v4                │  - NextAuth v5 (Auth.js) JWT       │
│  - Framer Motion Micro-animations │  - Prisma ORM v6                   │
│  - Recharts Performance Graphs    │  - PostgreSQL 16                   │
│  - Native BarcodeDetector API     │  - Stripe API (Checkout & Webhooks)│
│  - Canvas Confetti & Sonner Toast │  - Elo Scoring & Badging Engine    │
└───────────────────────────────────┴────────────────────────────────────┘
```

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.10 | Core framework, Server Components, and REST API route handlers |
| **Runtime / Language** | Node.js / TypeScript | Node 20+, TS 5 | Type-safe backend and frontend execution |
| **Database** | PostgreSQL | 14+ (16 Recommended) | Relational database storage |
| **ORM** | Prisma ORM | 6.19.3 | Type-safe queries, relational migrations, schema modeling |
| **Authentication** | NextAuth.js (Auth.js) | 5.0.0-beta.32 | Credentials provider, JWT session tokens, role middleware |
| **Styling** | Tailwind CSS v4 + PostCSS | v4 | Utility-first CSS, dark felt-green (`#06281e` / `#0b4d37`) & gold palette |
| **Animations** | Framer Motion | 12.42.2 | Page transitions, badge unlocks, interactive dialogs |
| **Charts** | Recharts | 3.10.0 | Rating history sparklines, win-loss breakdown, revenue charts |
| **QR Code** | `qrcode` | 1.5.4 | Generating SVG / PNG QR tokens for player check-in cards |
| **Payments** | Stripe Node SDK | 22.3.2 | Tournament entry fee checkout sessions |
| **Validation** | Zod | 4.4.3 | Strict request body and parameter validation across all APIs |
| **Internationalization** | Custom Cookie-Based i18n | Built-in | Zero-dependency high-performance translation engine with RTL |

---

## 3. User Roles & Permission Matrix

The platform enforces strict role-based access control (RBAC) configured via [`src/middleware.ts`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/src/middleware.ts) and verified in API route handlers:

| Capability | Player (`PLAYER`) | Employee (`EMPLOYEE`) | Chef / Owner (`CHEF`) |
|---|:---:|:---:|:---:|
| **View Public Pages & Live Stream** | ✅ | ✅ | ✅ |
| **Personal Dashboard & Profile** | ✅ | ✅ | ✅ |
| **View Leaderboards & Match History** | ✅ | ✅ | ✅ |
| **Book Table Reservations** | ✅ | ✅ | ✅ |
| **Register & Pay for Tournaments** | ✅ | ✅ | ✅ |
| **Download Personal Check-In QR** | ✅ | ✅ | ✅ |
| **Redeem Loyalty Points for Rewards** | ✅ | ✅ | ✅ |
| **Rate Matches & Club Experience** | ✅ | ✅ | ✅ |
| **Access Staff Desk (`/staff`)** | ❌ | ✅ | ✅ |
| **Scan Player QR Codes (`/staff/scan`)** | ❌ | ✅ | ✅ |
| **Create Manual Matches on the Floor** | ❌ | ✅ | ✅ |
| **Enter & Finalize Match Scores** | ❌ | ✅ | ✅ |
| **Access Admin Console (`/admin`)** | ❌ | ❌ | ✅ |
| **Create & Manage Tournaments** | ❌ | ❌ | ✅ |
| **Approve / Reject Tournament Applications** | ❌ | ❌ | ✅ |
| **Grant / Revoke Player Trust Badges** | ❌ | ❌ | ✅ |
| **Add / Edit / Remove Staff Accounts** | ❌ | ❌ | ✅ |
| **Configure Tables & Hourly Rates** | ❌ | ❌ | ✅ |
| **Update Live Stream & Loyalty Point Multipliers** | ❌ | ❌ | ✅ |

---

## 4. In-Depth Platform Subsystems

### 4.1. Competitive Elo & XP Progression Engine ([`src/lib/points.ts`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/src/lib/points.ts))

The ranking system blends chess-style Elo rating calculation with RPG-style experience progression.

#### A. Rating System (Points)
- **Starting Base**: Every new player starts at **1,000 Points**.
- **Expected Outcome Formula**:
  $$\text{Expected}(A, B) = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$
- **Rating Exchange Formula**:
  $$\Delta = \max\left(1, \text{round}\left(K \times (1 - \text{Expected}_{\text{winner}})\right)\right)$$
  - Winner receives $+\Delta$
  - Loser deducts $-\Delta$
- **K-Factor Multipliers**:
  - `FRIENDLY`: **0** *(Zero rating impact — purely for casual play)*
  - `RANKED`: **24** *(Standard competitive match)*
  - `TOURNAMENT`: **32** *(Bracket & stage matches)*
  - `CHAMPIONSHIP`: **40** *(Highest-stakes premier finals)*

#### B. XP & Level Curve
- Players earn **XP** from every match played, whether they win or lose.
- **Base XP**:
  - Win: **100 XP** $\times$ Match Multiplier (`FRIENDLY`: 0.5x, `RANKED`: 1.0x, `TOURNAMENT`: 1.5x, `CHAMPIONSHIP`: 2.0x).
  - Loss: **30 XP** $\times$ Match Multiplier.
- **Upset Bonus**: Beating a player of a higher level awards bonus XP:
  $$\text{Upset Bonus} = (\text{Opponent Level} - \text{Own Level}) \times 25 \text{ XP}$$
- **Level Calculation**:
  $$\text{Level} = \left\lfloor \sqrt{\frac{\text{XP}}{150}} \right\rfloor + 1$$
- Cumulative XP needed for level $n$:
  $$\text{XP}(n) = 150 \times (n - 1)^2$$

---

### 4.2. Gamification & Achievement Badges ([`src/lib/badges.ts`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/src/lib/badges.ts))

When any match is finalized or a player checks in, the system runs `evaluateBadges(playerId)` in a transaction. Unlocked badges trigger in-app notifications and client-side celebration effects.

| Code | Name | Description | Category | Reward |
|---|---|---|---|---|
| `first_victory` | **First Victory** | Win your first match | Milestone | +100 XP |
| `wins_10` | **Ten Wins** | Win 10 matches | Milestone | +200 XP |
| `wins_50` | **Half Century** | Win 50 matches | Milestone | +500 XP |
| `matches_100` | **Centurion** | Play 100 matches | Milestone | +500 XP |
| `streak_5` | **On Fire** | Win 5 matches in a row | Streak | +300 XP |
| `giant_slayer` | **Giant Slayer** | Beat a player 3+ levels above you | Skill | +400 XP |
| `champion` | **Champion** | Win a tournament | Tournament | +1000 XP |
| `regular` | **Club Regular** | Check in at the club 20 times | Loyalty | +200 XP |
| `night_owl` | **Night Owl** | Play a match after 10:00 PM | Fun | +100 XP |
| `socialite` | **Socialite** | Play against 10 different opponents | Fun | +250 XP |

---

### 4.3. Loyalty Program & Reward Shop

- **Points Accrual**:
  - Matches played: Default **10 pts** (Configurable in Admin Settings)
  - Physical club visits: Default **5 pts**
  - Table reservations: Default **15 pts**
- **Tier Structure**:
  - 🥉 **Bronze** (0+ lifetime pts): Member pricing on table time.
  - 🥈 **Silver** (500+ lifetime pts): 5% off reservations + priority booking window.
  - 🥇 **Gold** (1,500+ lifetime pts): 10% off + free cue rental + monthly guest passes.
  - 💎 **Elite** (4,000+ lifetime pts): 15% off + reserved locker + invitation to VIP events.
- **Redemption**: Instant points deduction at `/loyalty` for physical and digital rewards (e.g. *1 Hour Free Table Time*, *Pro Cue Rental*, *Club Merch*, *Coaching Sessions*).

---

### 4.4. Tournaments & Registration Flow

1. **Creation**: The Chef creates a tournament via the wizard at `/admin/tournaments` (specifying format, max players, entry fee in cents, prize pool, date, and banner).
2. **Registration**: Players apply at `/tournaments/[slug]`.
   - **Trusted Players** (those with `trustBadge: true` granted by Chef): Automatically approved upon entry fee payment or registration.
   - **Standard Players**: Placed into `PENDING` status in the `/admin/applications` queue for Chef review.
3. **Payment Modes**:
   - If `STRIPE_SECRET_KEY` is configured: Redirects to Stripe Checkout for secure credit card processing.
   - If Stripe keys are omitted: Operates in instant demo-checkout mode, allowing testing without payment friction.
4. **Execution**: Matches are scheduled, populated into the bracket/group tables, and officiated by employees. Completing the final match crowns the tournament winner and awards the `champion` badge (+1000 XP).

---

### 4.5. Table Management & Real-Time Reservations

- **Asset Modeling**: Supports distinct table types with unique descriptions and cushion/cloth specs:
  - *Snooker 12ft* (Standard & VIP Championship tables)
  - *American Pool 9ft*
  - *English Pool 7ft*
  - *Carom / 3-Cushion*
- **Dynamic Pricing**: Each table has an independent `hourlyRate` in cents (e.g., $15.00/hr standard, $30.00/hr VIP table 6).
- **Slot Engine ([`src/lib/reservation-slots.ts`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/src/lib/reservation-slots.ts))**: Validates operating hours, calculates non-overlapping time slots, and prevents double bookings across matches and active reservations.

---

### 4.6. Staff Operations & Hardware-Assisted QR Check-In

- **Player QR**: Every player profile generates a permanent, cryptographically unique `qrToken` displayed at `/checkin`. Players can save it to their phone gallery or Apple/Google Wallet.
- **Staff Scanner (`/staff/scan`)**:
  - Uses the modern browser `BarcodeDetector` API to scan directly from mobile and tablet cameras.
  - Includes an instant manual code fallback for laser barcode scanners or manual typing.
- **Execution Effect**:
  - Updates player's `checkedInAt` timestamp.
  - Records a `CheckIn` entity linked to the scanning employee.
  - Awards loyalty visit points.
  - Advances the `Club Regular` achievement counter.

---

### 4.7. Live Streaming Integration

- The club owner can broadcast feature matches (e.g. from table 6) directly onto the public landing page and `/live` page.
- Configurable via `/admin/settings`:
  - Toggle `isLive` on/off.
  - Support for **YouTube** (`https://www.youtube.com/embed/...`) and **Twitch** channels.
  - Customizable broadcast title and status indicator banner.

---

### 4.8. Multilingual Architecture (i18n)

- **Languages Supported**:
  - 🇬🇧 English (`en`) — Default
  - 🇫🇷 Français (`fr`)
  - 🇸🇦 العربية (`ar`) — Fully mirrored RTL layout with customized Arabic font rendering.
- **Mechanism**:
  - Persisted for 365 days via the `cuehub-locale` cookie.
  - Server components use `await getI18n()` for zero-CLS server-rendered text.
  - Client components use the `useI18n()` hook.
  - Source dictionary centralized in [`src/lib/i18n/messages.json`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/src/lib/i18n/messages.json).

---

## 5. Database Schema & Data Models

The PostgreSQL database is managed via Prisma ORM ([`prisma/schema.prisma`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/prisma/schema.prisma)):

```mermaid
erDiagram
    User ||--o| Player : "profile"
    User ||--o| Employee : "staff record"
    User ||--o{ Notification : "receives"
    
    Player ||--o{ Match : "participates (P1/P2)"
    Player ||--o{ TournamentEntry : "registers"
    Player ||--o{ Reservation : "books"
    Player ||--o{ PlayerBadge : "unlocks"
    Player ||--o{ PointsHistory : "rating log"
    Player ||--o{ CheckIn : "checks in"
    Player ||--o{ LoyaltyTransaction : "points ledger"
    Player ||--o{ RewardRedemption : "redeems"

    Employee ||--o{ Match : "referees"
    Employee ||--o{ CheckIn : "verifies"
    Employee ||--o{ Reservation : "manages"

    TableType ||--o{ Table : "categorizes"
    Table ||--o{ Match : "hosts"
    Table ||--o{ Reservation : "allocated to"

    Tournament ||--o{ TournamentEntry : "contains"
    Tournament ||--o{ Match : "schedules"
    Badge ||--o{ PlayerBadge : "awarded to"
    Reward ||--o{ RewardRedemption : "claimed in"
```

### Key Models Summary

1. **`User`**: Core authentication record (email, phone, bcrypt passwordHash, name, avatar, role: `PLAYER` | `EMPLOYEE` | `CHEF`).
2. **`Player`**: Competitive profile (Elo `points`, `xp`, `level`, `trustBadge`, `qrToken`, `loyaltyPoints`, `loyaltyTier`).
3. **`Employee`**: Staff profile (position title, hire date, performance links).
4. **`Table` & `TableType`**: Physical club assets with hourly pricing, specifications, and availability flags.
5. **`Match`**: Head-to-head snooker/pool contest with frames, scores, status, type, and officiating staff.
6. **`PointsHistory`**: Immutable audit log of every Elo and XP change per player.
7. **`Tournament` & `TournamentEntry`**: Competition metadata, prize purse, entry fees, and registration approval states.
8. **`Reservation`**: Slot booking connecting players, tables, and time ranges.
9. **`Badge` & `PlayerBadge`**: Achievement catalog and player unlock timestamps.
10. **`Rating`**: Post-match player feedback on club service and table quality (1-5 stars).
11. **`LoyaltyTransaction` & `RewardRedemption`**: Ledger of points earned and spent in exchange for rewards.
12. **`CheckIn`**: Physical attendance records verified by staff.
13. **`ClubSettings`**: Global singleton for streaming toggles and loyalty point reward values.

---

## 6. Complete API Route Reference

All API routes are located under [`src/app/api`](file:///Users/mac/Desktop/KAMAL/CODE/Masters/masters-snooker/src/app/api):

### Authentication & Profile
- `POST /api/register` — Creates a new player user account and associated player profile.
- `GET /api/profile` — Retrieves the authenticated user's profile and game statistics.
- `PUT /api/profile` — Updates user bio, phone number, name, or avatar.

### Matches & Scoring
- `GET /api/matches` — Lists active, live, and completed matches with filtering.
- `POST /api/matches` — Creates a new match or finalizes scores (calculates Elo, XP, and badges).

### Reservations & Check-Ins
- `GET /api/reservations` — Retrieves available slots or user's active table bookings.
- `POST /api/reservations` — Creates a new table booking (verifies slot availability).
- `POST /api/checkin` — Verifies player `qrToken`, records attendance, and awards loyalty points.

### Loyalty & Rewards
- `POST /api/loyalty/redeem` — Deducts points to redeem a reward from the club catalog.

### Tournaments
- `POST /api/tournaments/register` — Submits a tournament entry and initializes Stripe checkout or direct entry.

### Ratings & Feedback
- `POST /api/ratings` — Submits post-match 5-star ratings for table cloth quality and staff service.

### Notifications
- `GET /api/notifications` — Fetches user's unread notifications.
- `PATCH /api/notifications` — Marks notifications as read.

### Chef / Admin Endpoints (`/api/admin/*`) — *Requires `CHEF` role*
- `GET|POST|PUT|PATCH|DELETE /api/admin/tables` — Full CRUD for physical tables and hourly rates.
- `GET|POST|PUT|DELETE /api/admin/table-types` — Management of table categories and cloth specs.
- `GET|POST|PUT /api/admin/tournaments` — Tournament creation and bracket status manipulation.
- `GET|POST /api/admin/entries` — Approving or rejecting pending tournament applications.
- `POST /api/admin/trust-badge` — Toggling verified trust badges for players.
- `GET|POST|DELETE /api/admin/staff` — Onboarding and managing employee accounts.
- `GET|PUT /api/admin/settings` — Configuring live stream URL, platform, and loyalty point rates.

---

## 7. Frontend Pages & Navigation Directory

```
src/app/
├── (public)/                      # Unauthenticated Landing & Auth
│   ├── page.tsx                   # Public homepage (Hero, Features, Live Stream, Pricing)
│   ├── login/page.tsx             # NextAuth credentials login
│   └── register/page.tsx          # New member registration
│
├── (app)/                         # Authenticated App Shell
│   ├── dashboard/page.tsx         # Player cockpit (Rating, recent matches, quick links)
│   ├── leaderboard/page.tsx       # Club ranking ladder (Elo points, win streaks, levels)
│   ├── matches/page.tsx           # Match browser & historical results
│   ├── tournaments/               # Public & player tournament views
│   │   ├── page.tsx               # Active & upcoming tournaments list
│   │   └── [slug]/page.tsx        # Tournament details, bracket, registration button
│   ├── reservations/page.tsx      # Interactive table reservation calendar
│   ├── checkin/page.tsx           # Player personal QR card with download button
│   ├── loyalty/page.tsx           # Loyalty tier progress & rewards shop
│   ├── achievements/page.tsx      # Badge wall (Unlocked & locked achievements)
│   ├── live/page.tsx              # Full-screen live match stream
│   ├── notifications/page.tsx     # Player notification center
│   ├── profile/page.tsx           # Player profile editor & break records
│   │
│   ├── staff/                     # Staff Desk (EMPLOYEE or CHEF)
│   │   ├── page.tsx               # Active floor tables, ongoing matches, pending check-ins
│   │   ├── scan/page.tsx          # Real-time camera barcode scanner for player QRs
│   │   └── matches/page.tsx       # Scorekeeper interface to record frame scores
│   │
│   └── admin/                     # Chef / Owner Console (CHEF only)
│       ├── page.tsx               # Club analytics (Revenue, bookings, active players)
│       ├── applications/page.tsx  # Tournament entry approval queue
│       ├── staff/page.tsx         # Staff management & trust badge assignments
│       ├── tables/page.tsx        # Table inventory & hourly rate management
│       ├── tournaments/page.tsx   # Tournament creation wizard
│       └── settings/page.tsx      # Stream links, loyalty multipliers, club toggles
```

---

## 8. Environment Variables Reference

Copy `.env.example` to `.env` or `.env.local`:

```ini
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/masters_snooker"

# NextAuth secret key (Generate with `openssl rand -base64 32`)
AUTH_SECRET="your-secure-random-auth-secret-here"
AUTH_TRUST_HOST=true

# Public application base URL (Used for Stripe return URLs and QR links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Stripe payment processing (Leave blank to use instant demo-payment mode)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Optional image upload provider
CLOUDINARY_URL=""
```

---

## 9. Local Development & Deployment

### 1. Start Database (Docker)
```bash
docker run -d --name masters-snooker-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=masters_snooker \
  -p 5433:5432 postgres:16-alpine
```

### 2. Install & Seed
```bash
npm install
npx prisma db push
npx prisma db seed
```
*The seed command populates 14 realistic players, 90 days of matches, table types, active bookings, tournaments, and demo accounts.*

### 3. Run Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Run Smoke Tests & Verification
```bash
npx tsx scripts/smoke-test.ts
npm run lint
npm run build
```

---

## 10. Default Demo Accounts

All pre-seeded demo accounts share the password: **`password123`**

| Role | Email | Password | Primary Use Case |
|---|---|---|---|
| **Player** | `ronnie@demo.club` | `password123` | View dashboard, Elo rating history, book tables, test personal QR card, view loyalty tier |
| **Player (Alternative)** | `karim@demo.club` | `password123` | Challenge other players, register for tournaments |
| **Employee (Staff)** | `sara@masters.club` | `password123` | Floor management, scoring matches, scanning player QR check-ins with camera |
| **Chef (Owner / Admin)** | `chef@masters.club` | `password123` | Full administrative control, tournament approval, trust badge management, table config, live stream control |

---

*Documentation maintained for Master's Snooker & Billiards Club codebase.*
