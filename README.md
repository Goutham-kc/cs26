# OAQ & Threads System — Vicharanashala
**Once Asked Questions · Threaded discussions · SP & Wallet System · MERN Stack · v2.0**

A premium, state-of-the-art Knowledge sharing and Query Tracking portal built with high visual standards (sleek Monochrome Light / Discord Blurple Dark theme) featuring automated content audits, gamified Skill Points (SP) allocation, real-time Socket.io pub/sub, and collaborative nested threads.

---

## Quick Start

### Prerequisites
- **Node.js**: 20 LTS or later
- **MongoDB**: 7.x or later running locally (or MongoDB Atlas URI)

### Setup & Installation
The project features a root-level task manager for simple, unified concurrent execution.

1. **Install Root and Workspace Dependencies:**
   ```bash
   npm install
   npm run install:all
   ```
   *This triggers high-speed installation in both `server/` and `client/` subfolders.*

2. **Configure Environment Variables:**
   Create a `.env` file inside the `server/` directory:
   ```bash
   cd server
   cp .env.example .env
   # Open .env and specify your PORT, MONGO_URI, and JWT_SECRET
   ```

3. **Initialize the Server Data:**
   *First-time database records and administrative roles are prepared via standard MERN schemas.*

4. **Launch the Application Concurrently:**
   From the root repository directory:
   ```bash
   npm run dev
   ```
   *Starts the Node/Express backend on `http://localhost:5000` and the modern Vite client on `http://localhost:5173` concurrently.*

---

## Directory Architecture

```
cs26/ (root)
├── package.json               # Concurrently setup & workspace script runner
├── server/                    # Express + Node.js API server
│   ├── index.js               # Entrypoint & Socket.io integration
│   ├── models/
│   │   ├── User.js            # Unified authentication, credentials, and SP counters
│   │   ├── OAQIssue.js        # Core query tracker & FCFS answer model
│   │   ├── Thread.js          # Nested forum conversations model
│   │   ├── SPLedger.js        # Audit ledger of all SP transactions
│   │   ├── Section.js         # Dynamic baseline category metadata
│   │   └── CoOccurrence.js    # Collaboration/Recommendation matrix
│   ├── routes/
│   │   ├── auth.js            # Register / login router (JWT generation)
│   │   ├── oaq.js             # FCFS tracker, upvoting, and Auto-Escalation
│   │   ├── threads.js         # Hybrid issue tracker + nested discussions router
│   │   ├── sp.js              # Wallet metrics, statement ledger, and leaderboards
│   │   ├── admin.js           # Admin CRUD, database seeding, and user control
│   │   └── user.js            # User profile and role lookups
│   ├── middleware/
│   │   └── auth.js            # Role-based guards (intern, mentor, admin, superadmin)
│   └── services/
│       ├── yaksha.js          # Automated content quality classifier (Yaksha-mini)
│       └── escalation.js      # Event-driven priority escalation hooks
│
└── client/                    # Vite + React.js SPA frontend
    ├── src/
    │   ├── App.jsx            # Dynamic client routing and view control
    │   ├── global.css         # Baseline monochrome styles and global animations
    │   ├── context/
    │   │   ├── ThemeContext.jsx   # Overwrites 28 dynamic CSS variables (Discord Dark mode)
    │   │   ├── AuthContext.jsx    # Session management & JWT token storage
    │   │   ├── SocketContext.jsx  # Event listeners for real-time notifications
    │   │   └── ToastContext.jsx   # Alert overlays
    │   ├── services/
    │   │   ├── api.js             # Unified Axios/Fetch API gateway wrapper
    │   │   └── audioController.js # Indian English (en-IN) Speech synthesis controls
    │   ├── components/
    │   │   ├── Topbar.jsx         # Global dynamic brand bar with theme switchers
    │   │   ├── LoginForm.jsx      # High-contrast accessible login form
    │   │   ├── BaselineOAQ.jsx    # 13 Locked baseline categories & accordions
    │   │   ├── TrendingFeed.jsx   # Top-15 RSS Trending Feed (5-minute polling)
    │   │   ├── SectionFilter.jsx  # Multi-select predicate pushdown filters
    │   │   ├── SPDashboard.jsx    # SP Statement wallet, Cohort chart, and history
    │   │   └── OpenQueryCard.jsx  # Live FCFS card with action hooks
    │   └── pages/
    │       ├── HomePage.jsx       # Voice search, category selectors, and feeds
    │       ├── TrackerPage.jsx    # Live FCFS tracker grid
    │       ├── ThreadsPage.jsx    # Nested discussion forum & community thread portal
    │       └── AdminPage.jsx      # Moderation queues, Section edits, and seeder buttons
```

---

## API Routes & Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Open | Create new account |
| POST | `/api/auth/login` | Open | Authenticate user & return JWT token |

### 📋 OAQ & FCFS Tracker (`/api/oaq`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/oaq/baseline` | Open | Fetch the 13 locked onboarding FAQs |
| GET | `/api/oaq/trending` | Open | Fetch top 15 resolved issues (RSS format) |
| GET | `/api/oaq/search` | Open | Full-text query with Section filters |
| GET | `/api/oaq/tracker` | Open | Retrieve FCFS tracking issues |
| POST | `/api/oaq` | Intern+ | Submit a new query (+10 SP query bonus) |
| POST | `/api/oaq/issues/:id/resolve` | Intern+ | Resolve query (Yaksha audit → FCFS Auto-promote) |
| POST | `/api/oaq/issues/:id/reply` | Intern+ | Post a reply on a resolved issue |
| PATCH | `/api/oaq/issues/:id/upvote` | Intern+ | Upvote issue (triggers escalation checks) |
| POST | `/api/oaq/seed-baseline` | Superadmin | Clears and seeds all 13 standard category records |

### 💬 Threaded Conversations (`/api/threads`)
*Supports collaborative nested replies, pinned threads, and voting.*
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/threads` | Open | List, search, and filter community threads |
| GET | `/api/threads/:id` | Open | Retrieve single thread with nested replies |
| POST | `/api/threads` | Intern+ | Raise a new thread |
| POST | `/api/threads/:id/reply` | Intern+ | Submit a reply (supports parent threading) |
| PATCH | `/api/threads/:id/reply/:replyId/vote` | Intern+ | Upvote/downvote replies (auto-resolves at 3 upvotes) |
| PATCH | `/api/threads/:id/reply/:replyId/accept` | Intern+ | Accept specific reply as the best answer |
| PATCH | `/api/threads/:id/lock` | Mentor+ | Prevent incoming replies |
| PATCH | `/api/threads/:id/assign` | Mentor+ | Assign thread to specific admin/mentor |

### 🪙 Gamified Wallet & SP (`/api/sp`)
*Fully active transaction tracking with automated seeder rules.*
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/sp/wallet` | Intern+ | Retrieve active SP balances, badges, and trends |
| GET | `/api/sp/ledger` | Intern+ | Paginated history of all delta statements |
| GET | `/api/sp/leaderboard` | Intern+ | Top-ranked cohort members with win ratios |

---

## Gamification & Audit Rules

### Skill Point (SP) Delta Operations
* **FCFS Win**: `+50 SP` awarded when an intern submits a reply that is accepted or upvoted 3+ times.
* **Query Bonus**: `+10 SP` awarded for submitting a unique query on the portal.
* **Escalation Bonus**: `+5 SP` awarded to the query author if their query gains 5+ upvotes within 2 hours.
* **Yaksha Penalty**: `-20 SP` deducted if a submission fails automated quality reviews.

### Yaksha-mini Content Quality Auditor
A strict content checker enforces professionalism during replies:
1. **Length**: Enforces a minimum of 20 characters.
2. **Word Count**: Enforces a minimum of 3 space-separated words.
3. **Gibberish Checks**: Rejects repetitive letters (e.g. `aaaaaa`) and simple digit strings.
4. **Relevance Ratio**: Enforces a minimum dictionary density threshold of 40%.

---

## Design System & Theme Specs

### ☀️ Monochrome Light Mode
A strict, premium, high-contrast monochrome layout matching WCAG AA color rules:
- **Body Background**: `#FFFFFF`
- **Surface Panels**: `#F2F2F2` / Hover: `#E8E8E8`
- **Text Color**: `#111111` / Secondary: `#6B7280`
- **Borders**: `#E5E7EB`

### 🌙 Discord-like Dark Mode
A vibrant, custom Dark Mode with Blurple highlights resembling modern development tools:
- **Body Background**: `#313338` (Discord primary)
- **Container Alt Background**: `#1e1f22` (Discord sidebar dark)
- **Surface Panels**: `#2b2d31` / Hover: `#35373c`
- **Active Accents**: `#5865f2` (Blurple)
- **Primary Text**: `#f2f3f5` / Secondary: `#b5bac1`
- **Borders**: `#3c3f46` / Strong Borders: `#4a4d55`
- **Teal Statuses**: `#23a55a` (Discord Green)
- **Red Alerts**: `#f23f43` (Discord Red)
- **Amber Highlights**: `#f0b232` (Discord Amber)
