# OAQ & Threads System — Vicharanashala
**Once Asked Questions · Threaded discussions · SP & Wallet System · MERN Stack · v2.0**

Every query the team answers once becomes a permanent asset. Subsequent interns get that answer in under three seconds without human involvement.

---

## Design Philosophy & Theme
- **Strict Monochrome**: Sleek, premium dark/light mode styled entirely with CSS custom properties (variables) under WCAG AA compliance.
- **Micro-animations**: Enhanced transition states, real-time Socket.io state synchronization, and audio voice playback (en-IN accent adapter pattern).

---

## Quick Start (Unified Flow)

### Prerequisites
- **Node.js 20 LTS** or higher
- **MongoDB 7** running locally or via Atlas connection URI

### Setup & Startup
Initialize the entire project with a single command from the root directory:

```bash
# 1. Install all dependencies for both client and server
npm run install:all

# 2. Seed baseline sections, FAQ entries, and superadmin/mentor/intern accounts
npm run seed

# 3. Spin up both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

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
│   │   ├── sections.js           # Sections management
│   │   └── admin.js              # Stats overview, user adjustment, and activity logs
│   ├── services/
│   │   ├── yaksha.js             # Yaksha-mini atomic code auditor stub
│   │   └── escalation.js         # Event-driven priority escalation trigger
│   ├── middleware/auth.js        # JWT gatekeeper and role-based guards
│   ├── scripts/seed.js           # Baseline database seeder
│   └── server.js                 # Express + Socket.io gateway endpoint
│
└── client/                       # React frontend
    └── src/
        ├── context/
        │   ├── AuthContext.jsx   # JWT state management
        │   ├── SocketContext.jsx # Real-time Socket.io pub/sub provider
        │   ├── ToastContext.jsx  # Notification stack alerts
        │   └── ThemeContext.jsx  # Light/Dark mode dynamic variable provider
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
        │   └── RecommendationRail.jsx# Collaborative search results (People Also Asked)
        └── pages/
            ├── HomePage.jsx      # OAQ main portal
            ├── TrackerPage.jsx   # Active FCFS board table
            └── AdminPage.jsx     # Moderation queues, stats, and SP adjustment
```

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

### 3. Section Categories (`/api/sections`)
- `GET /api/sections` - Retrieve all category sections.
- `POST /api/sections` - Create a new dynamic category section (Admin/Superadmin only).

### 4. Admin & Moderation Operations (`/api/admin`)
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
