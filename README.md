# OAQ System — Vicharanashala
**Once Asked Questions** · MERN Stack · v2.0

> SP & Wallet system excluded (already implemented separately)

---

## Quick Start

### Prerequisites
- Node.js 20 LTS
- MongoDB 7 running locally (or Atlas URI)

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET

npm install
npm run seed      # Seeds 13 baseline sections + FAQ entries + demo users
npm run dev       # Starts on http://localhost:5000
```

**Demo accounts seeded:**
| Email | Password | Role |
|---|---|---|
| intern@demo.com | demo1234 | intern |
| mentor@demo.com | demo1234 | mentor |

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on http://localhost:5173
```

---

## Architecture

```
oaq-system/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/
│   │   ├── OAQIssue.js           # Core tracker model + text indexes
│   │   ├── User.js               # Auth (no SP — use your existing system)
│   │   ├── Section.js            # 13 baseline + dynamic sections
│   │   └── CoOccurrence.js       # Recommendation co-occurrence graph
│   ├── routes/
│   │   ├── auth.js               # Register / Login → JWT
│   │   ├── oaq.js                # All OAQ routes (see below)
│   │   └── sections.js           # Section registry CRUD
│   ├── services/
│   │   ├── yaksha.js             # Yaksha-mini audit engine (v1 stub)
│   │   └── escalation.js        # Event-driven auto-escalation
│   ├── middleware/auth.js        # JWT guard + role check
│   ├── scripts/seed.js           # DB seeder
│   └── server.js                 # Express + Socket.io entrypoint
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx    # JWT auth state
        │   ├── SocketContext.jsx  # Socket.io connection
        │   └── ToastContext.jsx   # Toast notifications
        ├── services/
        │   ├── api.js             # Fetch wrapper
        │   └── audioController.js # Web Speech API (en-IN)
        ├── components/
        │   ├── Topbar.jsx
        │   ├── BaselineOAQ.jsx    # 13 locked FAQ accordions
        │   ├── TrendingFeed.jsx   # RSS Top-15 (auto-refresh 5min)
        │   ├── SectionFilter.jsx  # Multi-select predicate pushdown
        │   ├── AccordionDrawer.jsx # Voice + upvote + rec rail
        │   ├── RecommendationRail.jsx # People Also Asked
        │   ├── YakshaViewport.jsx # Audit status display
        │   ├── RaiseQueryModal.jsx
        │   └── ResolveModal.jsx   # FCFS submission + Yaksha preview
        └── pages/
            ├── HomePage.jsx       # Search + baseline + trending
            ├── TrackerPage.jsx    # FCFS tracker table
            └── AuthPage.jsx
```

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | /api/oaq/baseline | — | 13 locked baseline FAQs |
| GET | /api/oaq/trending | — | Top-15 by upvote (RSS feed) |
| GET | /api/oaq/search?q=&sections= | — | Full-text search + section filter |
| GET | /api/oaq/tracker | — | All non-baseline issues |
| GET | /api/oaq/:id/related | — | Recommendation rail (co-occurrence) |
| POST | /api/oaq | intern | Raise new query |
| POST | /api/oaq/issues/:id/resolve | intern | FCFS atomic resolve |
| POST | /api/oaq/issues/:id/reply | intern | Community reply |
| POST | /api/oaq/:id/view | intern | Record co-occurrence |
| PATCH | /api/oaq/issues/:id/upvote | intern | Upvote (triggers escalation check) |
| PATCH | /api/oaq/issues/:id/mentor-signoff | mentor/admin | Sign off resolution |
| GET | /api/sections | — | All sections for filter bar |
| POST | /api/sections | admin | Add new section |
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login → JWT |

---

## Integrating Your SP/Wallet System

The OAQ routes intentionally omit SP minting. To wire in your existing system:

1. **FCFS Win** — In `routes/oaq.js`, find the `POST /issues/:id/resolve` handler.
   After the `findOneAndUpdate` succeeds, call your SP mint function:
   ```js
   // Your SP system call here
   await yourSPService.mint(req.user._id, 50, 'FCFS_WIN', issue._id);
   ```

2. **Yaksha Penalty** — In the same route, after `YAKSHA_REJECT`:
   ```js
   await yourSPService.deduct(req.user._id, 20, 'YAKSHA_PENALTY', req.params.id);
   ```

3. **Escalation Bonus** — In `services/escalation.js`, after priority update:
   ```js
   await yourSPService.mint(issue.raisedBy, 5, 'ESCALATION_BONUS', issue._id);
   ```

4. **Query Bonus** — In `routes/oaq.js`, `POST /oaq` (raise query):
   ```js
   await yourSPService.mint(req.user._id, 10, 'QUERY_BONUS', issue._id);
   ```

---

## Features Implemented

| Feature | CS Concept | Status |
|---|---|---|
| 13 Locked Baseline OAQ | Hash map + text index | ✓ Active |
| Inline Accordion Drawers | Stateful toggle | ✓ Active |
| FCFS Atomic Resolution | Optimistic concurrency control | ✓ Active |
| Yaksha-mini Audit Engine | Content classifier stub | ✓ Active |
| RSS Top-15 Trending Feed | Frequency-sorted priority queue | ✓ Active |
| Section Filter (13 + dynamic) | Predicate pushdown | ✓ Active |
| Recommendation Rail | Item-based collaborative filtering | ✓ Active |
| Auto-Escalation | Event-driven threshold trigger | ✓ Active |
| Voice Playback (en-IN) | Web Speech API | ✓ Active |
| Socket.io Real-time | Pub/sub events | ✓ Active |
| Translation Layer | Adapter pattern | Placeholder |
| SP / Wallet | (Your system) | Excluded |

---

## Design System
Strict monochrome — black, white, greys only. WCAG AA contrast.
Zero external CSS libraries — plain CSS with BEM conventions.
Font stack: Inter (UI) + JetBrains Mono (code/meta).
