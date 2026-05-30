# LLM Context Guide: Vicharanashala OAQ & Threads
**Conceptual Product Specification & Feature Reference Document for AI Coding Assistants**

This document serves as the absolute conceptual reference for the **Vicharanashala OAQ & Threads** platform. It describes the core product idea, user experience, features, rules, and gamified mechanics from a user and product perspective, omitting all underlying technical implementation details.

---

## 1. Project Concept & Mission

### What is Vicharanashala OAQ?
**Vicharanashala** is an onboarding and learning ecosystem for internships. **OAQ (Once Asked Questions)** is its core knowledge-sharing and query-tracking portal.

* **The Problem**: Interns frequently hit blocking technical or administrative issues, leading to redundant queries for mentors and slow onboarding.
* **The Solution**: A gamified, peer-to-peer query resolution system. Interns are incentivized to help resolve each other's blocking queries. The system ensures a question only needs to be asked and answered **once**—once resolved, it joins a searchable baseline knowledge base.

---

## 2. Roster of Roles & Access Ranks

Features are partitioned based on user responsibilities in the cohort:
1. **Public / Cohort Member**: Can search baseline FAQs, read trending feeds, and browse resolved queries.
2. **Intern**: Can raise dynamic queries, answer open FCFS queries, submit replies on resolved queries, raise forum threads, and vote on community replies.
3. **Mentor**: Cohort moderator. Can flag low-quality replies, lock/unlock threaded discussions to halt comment sections, shift priority ranks, and assign threads to specific administrators.
4. **Admin**: Cohort manager. Can manage user records, provision dynamic sections, manually override FCFS queries, and adjust SP wallet balances.
5. **Superadmin**: Cohort director. Holds all manager controls and has exclusive authority to register/provision new Admins and trigger database seeder tools.

---

## 3. Product Features & How They Work (User Perspective)

Below is the complete list of all 13 features in the codebase, detailing their **Core Feature Idea** and **How it Works conceptually**.

---

### 1. 13 Locked Onboarding FAQ Baseline Accordions
* **Core Feature Idea**: An instantly accessible, read-only onboarding FAQ center representing static categories to prevent common, basic administrative queries from cluttering the open query tracker board.
* **How it Works**: Displays 13 onboarding topics (covering attendance, stipend release schedules, onboarding documents, weekly report formats, lab rules, evaluations, etc.). Users click a category to slide open the accordion card and read the verified answer.

---

### 2. First-Come, First-Served (FCFS) Query Resolution Tracker
* **Core Feature Idea**: Gamify query resolution by creating a dynamic tracking board where interns compete to solve active technical roadblocks raised by their peers.
* **How it Works**: Lists all unresolved queries in a public tracking table grid. The first intern to submit a response "claims" the FCFS resolution. If two users attempt to resolve the same query simultaneously, the slower request is rejected with a collision alert to prevent double-resolutions. Once successfully submitted, the proposed answer enters a pending state awaiting community votes.

---

### 3. Automated Content Quality Auditor (Yaksha-mini)
* **Core Feature Idea**: An automated content gate checking submitted answers in real-time to protect the knowledge base from keyboard mashing, spam, copy-paste blocks, or low-quality one-liners.
* **How it Works**: Runs automatically during resolutions and reply submissions. It checks that the answer is at least 20 characters long, has at least 3 words, is not repetitive keyboard gibberish, and has a high percentage of meaningful words. If a submission fails, it is rejected and a penalty deduction is applied to the resolver's points ledger.

---

### 4. Community Auto-Promotion System
* **Core Feature Idea**: Peer-driven validation of knowledge, allowing the collective community of interns to verify and approve answers.
* **How it Works**: When an intern submits an answer to an open FCFS query, it remains in a pending review queue. Other interns review the proposed solution and can upvote or downvote it. Once the proposed resolution gains 3 net community upvotes, the answer is auto-promoted to "Resolved" and locks in as the master answer, rewarding the resolver with points.

---

### 5. Auto-Escalation Threshold Hook
* **Core Feature Idea**: Ensure high-severity roadblocks or queries of broad interest are automatically highlighted for mentor attention.
* **How it Works**: Tracks upvotes on open tracker questions. If an unresolved query reaches 5 upvotes in a 2-hour window, the system automatically elevates its priority status from Normal to High to alert mentors.

---

### 6. Collaborative Recommendation Rail (People Also Asked)
* **Core Feature Idea**: Suggest contextually related, highly relevant queries based on the collective search and browsing habits of the cohort.
* **How it Works**: The system learns which questions are frequently viewed together during search sessions and displays the top related questions alongside the active query as "People Also Asked" recommendations.

---

### 7. RSS Trending Feed
* **Core Feature Idea**: Keep interns updated with the cohort's most relevant resolved issues and trending announcements.
* **How it Works**: Displays the top 15 resolved issues across all categories, sorted by upvote counts and timestamps, as a trending RSS feed on the homepage that refreshes automatically.

---

### 8. Voice Search & Speech Playback
* **Core Feature Idea**: Enhance accessibility and interactive engagement by offering voice-controlled search and auditory answer playback.
* **How it Works**: Users can speak to search baseline FAQs, and click an audio speaker icon to hear titles read aloud in a natural, local voice accent.

---

### 9. Gamified Skill Points (SP) & Wallet Subsystem
* **Core Feature Idea**: Motivate cohort interns to actively participate and support peers by providing gamified metrics, progress visualizers, and milestones.
* **How it Works**: 
  - **Counter**: Animates the user's active points total on load.
  - **Statement Ledger**: A detailed credit/debit ledger showing reasons for every change.
  - **Cohort Scale**: A dynamic bar chart comparing all active intern balances relative to the highest earner.
  - **SP Trend Chart**: A transactional bar chart. Scales negative penalty trend bars beautifully inside visual bounds.
  - **Milestone Badges**: Automatically unlocks dynamic visual badges based on win counts and points milestones.

---

### 10. Collaborative Nested Thread Discussions
* **Core Feature Idea**: Provide a nested discussion forum to handle complex, deep-dive technical conversations that extend beyond standard Q&A accordions.
* **How it Works**:
  - **Nested Tree Layout**: Renders replies in indented conversation trees similar to forum message boards.
  - **Visual Indents**: Indent styles paired with vertical connecting lines visually outline nested trees.
  - **OP Tags**: The thread creator is labeled with an "OP" badge in discussions to denote the original author.
  - **Interactive Actions**: Users upvote/downvote replies, and reply nested inline.
  - **Thread Lock/Unlock (Mentor+)**: Mentors can lock a thread to halt any incoming replies, and unlock it to reopen the discussion.
  - **Mark Thread Resolved (OP/Creator)**: The original thread creator can mark their own thread as resolved conceptually to indicate they are satisfied. This is a simple action that does not award SP.
  - **Dynamic Resolution SP Award (Admin and Superadmin only)**: When an Admin or Superadmin marks a thread as resolved, a modal popup lets them award a custom amount of Skill Points (SP) to a selected thread participant. The Admin or Superadmin can choose the recipient from a dropdown of everyone who participated in the thread (the original thread creator + all resolvers who posted a reply), defaulting to the thread creator.
  - **Best Reply Promotion (Mentor+)**: Mentors can accept any specific reply as the best answer. This automatically marks the thread as resolved, highlights the reply as "Accepted," and credits the resolver.

---

### 11. Dynamic Section Filters
* **Core Feature Idea**: Allow users to filter large sets of questions based on specific categories or dynamic topics.
* **How it Works**: Users select one or more categories in a filter bar, immediately refining the visible queries on the homepage or tracker boards to only matching categories.

---

### 12. Admin Moderation & Dynamic Management Panel
* **Core Feature Idea**: Provide administrative overseers with a consolidated dashboard to organize categories, manage cohort rosters, and review flagged items.
* **How it Works**:
  - **Mod Queues**: Displays distinct queues for flagged replies, downvoted issues, and unanswered queries.
  - **Roster Edits & Secure Promotion Hierarchy**: Allows admins to modify cohort profiles and SP balances. Protects role assignments; a user can never change their own role, and only Superadmins hold the exclusive authority to assign the Admin or Superadmin role. Admins can only assign the Mentor role if the target is already a Mentor or Admin.
  - **Dynamic Sections**: Offers full CRUD operations over category lists.
  - **Seeder Gates**: Houses master seeder triggers to clear and re-initialize baseline onboarding collections.

---

### 13. Real-Time Sync Broadcaster
* **Core Feature Idea**: Ensure all online participant sessions are instantly synchronized when events occur in the cohort, without manual refreshes.
* **How it Works**: When actions occur (queries raised, answers proposed, auto-resolutions reached, threads locked/escalated), the updates are instantly synced across all active users' screens in real-time.

---

## 4. Gamification & System Rules

* **Proposing an FCFS Answer (Reply Deposit)**: `+5 SP` (awarded immediately upon submitting a valid answer to an open query)
* **Resolving an Open Query (FCFS Win)**: `+50 SP` (awarded when your proposed answer is auto-promoted or manually accepted)
* **Submitting a Unique Query (Query Bonus)**: `+10 SP`
* **Auto-Escalating to HIGH (Escalation Bonus)**: `+5 SP` (awarded to original author)
* **Failing automated quality audits (Yaksha Penalty)**: `-20 SP`