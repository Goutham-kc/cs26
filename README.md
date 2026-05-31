# OAQ & Threads System — Vicharanashala
**Once Asked Questions · Threaded discussions · SP & Wallet System · MERN Stack · v2.0**

Every query the team answers once becomes a permanent asset. Subsequent interns get that answer in under three seconds without human involvement.

---

## What's New in v2.0

### React Router Navigation
- URL-based routing with proper browser back/forward support
- Routes: `/` (OAQ), `/threads`, `/tracker`, `/sp`, `/admin`
- Last visited route persisted in localStorage
- Shareable direct links to any page

### Dark Mode
- Fully implemented CSS variable-based theming
- Toggle with `☀️`/`🌙` button in Topbar
- WCAG AA compliant contrast ratios

---

## Design Philosophy & Theme
- **Strict Monochrome**: Sleek, premium dark/light mode styled entirely with CSS custom properties (variables) under WCAG AA compliance.
- **Micro-animations**: Enhanced transition states, real-time Socket.io state synchronization, and audio voice playback (en-IN accent adapter pattern).
- **Modal-based UI**: Consistent modal components replacing browser `prompt()` dialogs

---

## Quick Start (Unified Flow)

### Prerequisites
- **Node.js 20 LTS** or higher
- **MongoDB 7** running locally or via Atlas connection URI

### Setup & Startup
Initialize the entire project with a single command from the root directory:

```powershell
# 1. Install all dependencies for both client and server
npm run install:all

# 2. Seed baseline sections, FAQ entries, and superadmin/mentor/intern accounts
npm run seed

# 3. Spin up both backend (port 5001) and frontend (port 5173) concurrently
npm run dev
```

**Startup Issues?** See [STARTING.md](./STARTING.md) for troubleshooting.

**Demo accounts seeded by default:**
| Email | Password | Role | Access Level |
|---|---|---|---|
| superadmin@demo.com | demo1234 | superadmin | Complete moderation, adjustments, creation |
| admin@demo.com | demo1234 | admin | Seed baseline, adjust user SP, add sections |
| mentor@demo.com | demo1234 | mentor | Flag queries, promote answers, sign off resolution |
| intern@demo.com | demo1234 | intern | Raise queries, upvote, submit FCFS answers |

---

## Directory Architecture

```
oaq-system/
├── package.json                  # Root configurations and unified startup scripts
│
├── STARTING.md                   # Server startup guide and troubleshooting
├── ERROR.md                      # Known issues and resolutions
├── SUGGESTION.md                 # Planned feature enhancements
│
├── server/                       # Express + MongoDB backend
│   ├── config/db.js              # MongoDB database connection
│   ├── models/
│   │   ├── OAQIssue.js           # Core tracker + Full-text search index
│   │   ├── User.js               # Auth schema + role registry
│   │   ├── Section.js            # 13 locked and dynamic sections
│   │   └── CoOccurrence.js       # Collaborative recommendation graph
│   ├── routes/
│   │   ├── auth.js               # User registration, login, and superadmin creation
│   │   ├── oaq.js                # Search, upvoting, resolving, and flagging
│   │   ├── threads.js            # Threaded discussion management
│   │   ├── sections.js           # Sections management
│   │   └── admin.js              # Stats overview, user adjustment, and activity logs
│   ├── services/
│   │   ├── yaksha.js             # Yaksha-mini atomic code auditor stub
│   │   └── escalation.js         # Event-driven priority escalation trigger
│   ├── middleware/auth.js        # JWT gatekeeper and role-based guards
│   ├── scripts/seed.js           # Baseline database seeder
│   └── index.js                  # Express + Socket.io gateway endpoint
│
└── client/                       # React frontend (Vite)
    └── src/
        ├── context/
        │   ├── AuthContext.jsx   # JWT state management
        │   ├── SocketContext.jsx # Real-time Socket.io pub/sub provider
        │   ├── ToastContext.jsx  # Notification stack alerts
        │   └── ThemeContext.jsx  # Light/Dark mode dynamic variable provider
        ├── hooks/
        │   └── useModalCloser.js # Modal close event hook
        ├── services/
        │   ├── api.js            # Unified API fetch interface with interceptors
        │   └── audioController.js# Adaptation layer for en-IN Voice Synthesis
        ├── components/
        │   ├── Topbar.jsx        # Navigation + Dark Mode Toggle + role-based gates
        │   ├── LoginForm.jsx     # Contrasted and responsive credentials form
        │   ├── SPDashboard.jsx   # Ledger statements, top 50, and wallet charts
        │   ├── BaselineOAQ.jsx   # 13 locked static baseline FAQs accordions
        │   ├── TrendingFeed.jsx  # Top-15 query RSS feed with 5min auto-refresh
        │   ├── SectionFilter.jsx # Multi-select category predicate filters
        │   ├── AccordionDrawer.jsx# Inline drawers, upvotes, and recommendation rails
        │   ├── RecommendationRail.jsx# Collaborative search results (People Also Asked)
        │   ├── OpenQueryCard.jsx # FCFS query card with voting and answer submission
        │   ├── RaiseQueryModal.jsx# Modal for raising new queries
        │   ├── ResolveModal.jsx  # Resolution submission modal
        │   ├── SharedModals.jsx  # Reusable ConfirmModal, InputModal, SPAdjustModal, ThreadCloseModal
        │   └── YakshaViewport.jsx# Content quality audit display
        └── pages/
            ├── HomePage.jsx      # OAQ main portal with search and trending
            ├── TrackerPage.jsx   # Active FCFS board table
            ├── ThreadsPage.jsx   # Threaded discussions
            └── AdminPage.jsx     # Moderation queues, stats, and SP adjustment
```

---

## Features Implemented

### Core Features (13 Total)
1. **13 Locked Onboarding FAQ Baseline Accordions** — Read-only onboarding FAQ center
2. **FCFS Query Resolution Tracker** — Gamified dynamic tracking board
3. **Automated Content Quality Auditor (Yaksha-mini)** — Auto-checks answer quality
4. **Community Auto-Promotion System** — Peer-driven answer validation via upvotes
5. **Auto-Escalation Threshold Hook** — 5 upvotes in 2hrs → High priority
6. **Collaborative Recommendation Rail** — "People Also Asked" recommendations
7. **RSS Trending Feed** — Top 15 resolved issues sorted by upvotes
8. **Voice Search & Speech Playback** — Voice-controlled search and audio playback
9. **Gamified SP & Wallet Subsystem** — Points, ledger, leaderboard, badges
10. **Collaborative Nested Thread Discussions** — Forum-style threaded replies
11. **Dynamic Section Filters** — Multi-select category filtering
12. **Admin Moderation & Management Panel** — Dashboard for admins
13. **Real-Time Sync Broadcaster** — Socket.io instant synchronization

### Navigation & UI
- **React Router** — URL-based navigation with browser history support
- **Dark/Light Mode** — CSS variable-based theming
- **Modal System** — ConfirmModal, InputModal, SPAdjustModal, ThreadCloseModal
- **Toast Notifications** — In-app notification stack

---

## API Routes Documentation

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` - Create a new intern/mentor/admin account.
- `POST /api/auth/login` - Authenticate user credentials and return a signed JWT token.

### 2. Once Asked Questions (`/api/oaq`)
- `GET /api/oaq/baseline` - Fetch the 13 locked baseline FAQs.
- `GET /api/oaq/trending` - Retrieve top 15 trending queries sorted by upvote frequency.
- `GET /api/oaq/search?q=&sections=` - Full-text search with pushdown category filtering.
- `GET /api/oaq/tracker` - View all community-contributed tracker queries.
- `GET /api/oaq/:id/related` - Collaborative filtering "People Also Asked" recommendation.
- `POST /api/oaq` - Raise a new query (+10 SP).
- `POST /api/oaq/issues/:id/resolve` - Submit atomic FCFS query resolution (+50 SP, audited by Yaksha).
- `POST /api/oaq/issues/:id/reply` - Submit a community answer reply.
- `POST /api/oaq/:id/view` - Record an issue view to update the co-occurrence index.
- `PATCH /api/oaq/issues/:id/upvote` - Upvote a query (potentially triggers priority escalation).
- `PATCH /api/oaq/issues/:id/mentor-signoff` - Mentor approval signature for resolutions.

### 3. Threads (`/api/threads`)
- `GET /api/threads` - Fetch all threads.
- `POST /api/threads` - Create a new thread.
- `GET /api/threads/:id` - Fetch single thread with nested replies.
- `POST /api/threads/:id/reply` - Post a nested reply.
- `PATCH /api/threads/:id/lock` - Lock/unlock thread (Mentor+).
- `PATCH /api/threads/:id/resolve` - Mark thread resolved (OP or Mentor+).

### 4. Section Categories (`/api/sections`)
- `GET /api/sections` - Retrieve all category sections.
- `POST /api/sections` - Create a new dynamic category section (Admin/Superadmin only).

### 5. Admin & Moderation Operations (`/api/admin`)
- `GET /api/admin/stats` - Fetch overall metrics (total issues, top holders, activity log).
- `GET /api/admin/issues` - Paginated admin queries list with Pin/Feature/Delete triggers.
- `GET /api/admin/users` - List all system accounts.
- `POST /api/admin/users` - Direct creation of system accounts (Superadmin only).
- `PATCH /api/admin/users/:id` - Adjust SP bank ledger balances or roles (Superadmin only).

---

## Dynamic Theme Design System
Our client features custom CSS variable injection mapping dynamically across Light and Dark states:

```css
/* Tokens declared dynamically under ThemeContext */
--color-bg             /* Core workspace background */
--color-surface        /* Card & table cells background */
--color-surface-hover  /* Alternating row and button highlights */
--color-border         /* Layout dividing lines */
--color-text-primary   /* Headings and body readable contrast */
--color-text-secondary /* Detail and descriptive paragraphs */
--color-text-muted     /* Timestamps and indices placeholders */
--color-invert-bg      /* Dynamic inversion for prominent buttons */
--color-invert-text    /* High-contrast text on inverted backgrounds */
```

---

## Planned Features

See [SUGGESTION.md](./SUGGESTION.md) for the complete feature backlog including:
- Quick wins (under 30 min each)
- Tier 1 Critical fixes
- Tier 2 High priority improvements
- Tier 3 Moderately important additions
- Tier 4 Nice-to-have enhancements

---

## License

Private — Vicharanashala Internal Use Only