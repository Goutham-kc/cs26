# Threads Feature Documentation

## Overview
The Threads feature is a Q&A/Discussion system where users can create discussion threads, reply to them in a nested tree structure, upvote/downvote, and have mentors/admins moderate them.

---

## Thread List View (Full Page)
- Displays a paginated list of threads (15 per page)
- Filters: status (All/Open/Resolved/Locked), section category, priority
- Each thread card shows: category tag, badges (priority, status), title, author, timestamp, upvote count, reply count
- Clicking a thread navigates to the **full page detail view** (not a side panel)

---

## Thread Detail View (Full Page)
- Reached by clicking any thread from the list
- Shows "← Back to threads" button to return
- Thread header: category, status, priority, title, author info, timestamps
- Thread body with labels
- Action buttons (Lock/Unlock for mentors, Mark Resolved for admins, Upvote for all)
- Replies section with nested tree display
- Reply form at bottom (for non-locked threads)

---

## Reply Tree Rendering
- **Reddit/convo style** with proper nesting and indentation
- Each reply shows:
  - Avatar circle with user's first initial
  - Author name, timestamp
  - Reply text
  - Action buttons: Upvote/Downvote with score, Reply, Accept (for mentors)
- **Inline reply form** appears below a reply when "Reply" is clicked
- Nested replies are indented with a vertical connecting line

### Key Functions
- `buildReplyTree()` - Converts flat reply array into nested tree structure based on `parentReplyId`
- `Reply` component - Renders a single reply with optional nested children

---

## Voting System
### Reply Votes
- Users can upvote or downvote each reply (once per user per reply)
- `upvotedBy` and `downvotedBy` arrays track who voted
- Switching vote (up→down or down→up) is tracked properly
- Score displayed as `upvotes - downvotes`
- Error message shown if user tries to vote twice

### Thread Upvotes
- Users can upvote a thread once
- `upvotedBy` array prevents duplicate upvotes
- Error message shown if already upvoted

---

## Reply to Reply (Nested Replies)
- Each reply has a "Reply" button
- Clicking shows an inline reply form below that specific reply
- Submitting creates a reply with `parentReplyId` set
- Replies are nested based on `parentReplyId` in the tree structure
- Can reply to any level of nesting

---

## Admin/Moderator Features

### Lock/Unlock Thread (Mentor+)
- Lock prevents new replies
- Unlock reopens the thread

### Mark Thread Resolved (Admin/Superadmin only)
- Opens a modal with:
  - SP amount input (optional)
  - Dropdown of all users who participated (thread creator + everyone who replied)
  - Default selection: thread creator
- Submitting marks thread as Resolved and optionally awards SP

### Mark Thread Resolved (Thread Creator/OP)
- Original poster (OP) can mark their own thread as resolved
- Does NOT open SP award modal - simply marks thread as resolved
- Shows "✓ Mark Resolved" button next to Upvote button

### OP Tag
- When viewing a thread they created, the OP sees an "OP" badge next to their name
- The badge is styled with primary color background

### Accept Reply as Answer (Mentor+)
- Accepts a specific reply as the best answer
- Marks thread as Resolved
- Reply is marked with `isPromoted` flag and shown as "✓ Accepted"

---

## SP Award System
SP can be awarded in these thread-related events:
- `THREAD_CREATE` - When user creates a thread (handled elsewhere)
- `THREAD_RESOLVE` - When admin marks thread resolved with SP reward
- `THREAD_CLOSE` - When mentor closes thread with SP reward
- `THREAD_REPLY` - When user replies (handled elsewhere)

All SP transactions are logged in the SPLedger with:
- `userId` - Who received the SP
- `delta` - Amount (positive for credit, negative for debit)
- `reason` - Human-readable description
- `event` - Event type enum
- `threadId` - Reference to the thread (for THREAD_RESOLVE, THREAD_CLOSE)

---

## API Endpoints (Server)

### GET /api/threads
List threads with filters (status, priority, category, search, pagination)

### GET /api/threads/:id
Get single thread with full details and populated replies

### POST /api/threads
Create new thread

### POST /api/threads/:id/reply
Add reply to thread. Supports `parentReplyId` for nested replies

### PATCH /api/threads/:id/reply/:replyId/vote
Vote on a reply (up/down). Tracks voter in `upvotedBy`/`downvotedBy` arrays

### PATCH /api/threads/:id/reply/:replyId/accept
Accept reply as best answer (mentor+). Marks thread resolved

### PATCH /api/threads/:id/upvote
Upvote a thread (one per user, tracked in `upvotedBy`)

### PATCH /api/threads/:id/lock
Lock a thread (mentor+)

### PATCH /api/threads/:id/unlock
Unlock a thread (mentor+)

### PATCH /api/threads/:id/resolve
Mark thread as resolved (admin+). Optional SP reward with user selection

### PATCH /api/threads/:id/close
Close thread with optional SP reward (mentor+). Used for locking with SP

---

## Data Models

### ThreadReply Schema
```javascript
{
  repliedBy: ObjectId (ref: User),
  replyText: String,
  isAcceptedFirst: Boolean,
  isPromoted: Boolean,
  upvotes: Number,
  downvotes: Number,
  upvotedBy: [ObjectId] (ref: User),
  downvotedBy: [ObjectId] (ref: User),
  parentReplyId: ObjectId (for nested replies),
  timestamp: Date
}
```

### Thread Schema
```javascript
{
  title: String,
  body: String,
  categoryTag: String,
  status: 'Open' | 'Resolved' | 'Locked',
  priority: 'NORMAL' | 'HIGH',
  labels: [String],
  assignedTo: ObjectId (ref: User),
  isPinned: Boolean,
  isLocked: Boolean,
  upvoteCount: Number,
  upvotedBy: [ObjectId] (ref: User),
  viewCount: Number,
  resolvedBy: ObjectId (ref: User),
  bestReplyId: ObjectId,
  raisedBy: ObjectId (ref: User),
  threadReplies: [ThreadReply]
}
```

### SPLedger Schema
```javascript
{
  userId: ObjectId,
  delta: Number,
  reason: String,
  issueId: ObjectId (ref: OAQIssue),
  threadId: ObjectId (ref: Thread),
  event: 'FCFS_WIN' | 'PENALTY' | 'QUERY_BONUS' | 'ESCALATION_BONUS' | 'THREAD_CREATE' | 'THREAD_REPLY' | 'THREAD_RESOLVE' | 'THREAD_CLOSE'
}
```

---

## Client State (ThreadsPage.jsx)

```javascript
const [threadsList, setThreadsList] = useState([]);
const [loading, setLoading] = useState(true);
const [total, setTotal] = useState(0);
const [page, setPage] = useState(1);
const [threadDetail, setThreadDetail] = useState(null);  // Full page view
const [filter, setFilter] = useState({ status: '', priority: '', category: '' });
const [showCreate, setShowCreate] = useState(false);
const [createData, setCreateData] = useState({ title, body, categoryTag, labels });
const [replyText, setReplyText] = useState('');
const [replyingTo, setReplyingTo] = useState(null);  // Which reply we're inline-replying to
const [inlineReplyText, setInlineReplyText] = useState('');
const [showResolveModal, setShowResolveModal] = useState(false);
const [resolveThread, setResolveThread] = useState(null);
const [resolveSp, setResolveSp] = useState('');
const [resolveUserId, setResolveUserId] = useState('');
```

---

## Key Functions

- `load()` - Fetch thread list with current filters/pagination
- `handleOpenThread(threadId)` - Fetch and display full thread detail
- `handleBack()` - Return to thread list
- `handleReply(e)` - Submit top-level reply to thread
- `handleInlineReply(parentReplyId)` - Submit nested reply
- `handleVote(threadId, replyId, type)` - Vote on reply
- `handleAccept(threadId, replyId)` - Accept reply as best answer
- `handleUpvote(thread)` - Upvote a thread
- `handleLock(thread)` - Lock/unlock thread
- `handleResolve(thread)` - Open resolve modal
- `handleResolveSubmit()` - Submit resolve with SP award
- `getThreadParticipants()` - Get unique users who interacted with thread (for resolve dropdown)
- `buildReplyTree(replies, parentId)` - Build nested tree from flat replies
- `timeAgo(dateStr)` - Format timestamp as relative time

---

## Styling Conventions
- Inline styles using CSS variables for theming (`var(--color-*)`)
- Buttons have: background, border, borderRadius, padding, fontSize, cursor
- Action buttons grouped with `display: flex, gap`
- Reply nesting indicated by `marginLeft` and vertical connecting line