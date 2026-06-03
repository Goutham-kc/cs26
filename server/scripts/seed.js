require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('../models/User');
require('../models/Section');
require('../models/OAQIssue');

const User   = mongoose.model('User');
const Section = mongoose.model('Section');
const OAQIssue = mongoose.model('OAQIssue');

const DEMO_USERS = [
  { name: 'Super Admin', email: 'superadmin@demo.com', password: 'demo1234', role: 'superadmin' },
  { name: 'Admin User',  email: 'admin@demo.com',      password: 'demo1234', role: 'admin' },
  { name: 'Mentor User', email: 'mentor@demo.com',     password: 'demo1234', role: 'mentor' },
  { name: 'Intern User', email: 'intern@demo.com',     password: 'demo1234', role: 'intern' },
];

const DEFAULT_SECTIONS = [
  { sectionId: '01', label: 'ViBe',       scope: 'Learning platform access & onboarding',    description: 'How to access the ViBe learning platform, first-time registration, email verification, and profile setup.', color: '#3b82f6', locked: true },
  { sectionId: '02', label: 'NOC',        scope: 'Network operations & ticket system',        description: 'Understanding the NOC system for raising and tracking internal tickets.', color: '#8b5cf6', locked: true },
  { sectionId: '03', label: 'Teams',      scope: 'Team formation & structure',                description: 'How teams are formed, team lead selection, and role distribution.', color: '#ec4899', locked: true },
  { sectionId: '04', label: 'Onboarding', scope: 'Documents & compliance',                    description: 'Required documents for onboarding, NDA, IP agreement, and compliance deadlines.', color: '#f59e0b', locked: true },
  { sectionId: '05', label: 'Reports',    scope: 'Weekly report submissions',                 description: 'Weekly report format, mandatory fields, submission deadline (Friday 6 PM IST), and self-assessment scoring.', color: '#10b981', locked: true },
  { sectionId: '06', label: 'Finance',    scope: 'Stipend & compensation',                    description: 'Stipend release schedule (last working day of month), band structure, deductions for late reports.', color: '#6366f1', locked: true },
  { sectionId: '07', label: 'Schedule',   scope: 'Attendance & leave policy',                 description: 'Minimum 75% attendance requirement, leave application process (48h advance notice), consequences of low attendance.', color: '#14b8a6', locked: true },
  { sectionId: '08', label: 'Lab',        scope: 'Lab facilities & rules',                    description: 'Lab Room 204 opening hours (Mon-Sat 9 AM-8 PM), workstation rules, no-food policy, data backup requirements.', color: '#f97316', locked: true },
  { sectionId: '09', label: 'Eval',       scope: 'Evaluation & grading system',               description: 'Evaluation breakdown: weekly reports 20%, mid-term project 30% (Week 8), final demo 50% (Week 16). Grading scale A-F.', color: '#a855f7', locked: true },
  { sectionId: '10', label: 'SP',         scope: 'Skill points & gamification',               description: 'FCFS resolution +50 SP, unique query +10 SP, escalation +5 SP, Yaksha penalty -20 SP. Non-monetary.', color: '#0ea5e9', locked: true },
  { sectionId: '11', label: 'Yaksha',     scope: 'Content quality auditor',                   description: 'Yaksha-mini enforces 20+ char answers, 3+ words, no keyboard gibberish, meaningful word ratio >40%.', color: '#64748b', locked: true },
  { sectionId: '12', label: 'Tracker',    scope: 'FCFS query resolution board',               description: 'Open issue tracker for FCFS resolution. First valid answer wins +50 SP. Auto-promotes at 3 net upvotes.', color: '#0d9488', locked: true },
  { sectionId: '13', label: 'General',    scope: 'Miscellaneous queries',                     description: 'General questions not covered by specific sections. Check Trending feed and NOC before raising new queries.', color: '#6b7280', locked: true },
];

const BASELINE_ISSUES = [
  { queryText: 'How do I access the ViBe learning platform for the first time?', answer: 'Visit vibeskills.com and register with your official email. Check your inbox for a verification link within 5 minutes. If you do not see it, check your spam folder. After verification, complete your profile — name, department, and employee ID are mandatory fields. Contact your mentor if the platform is unreachable after 30 minutes.', categoryTag: '01' },
  { queryText: 'What is the NOC system and how do I raise a ticket?', answer: 'The NOC (Network Operations Center) system is Vicharanashala\'s internal issue tracking platform. To raise a ticket: log into noc.vicharanashala.com, click "New Ticket", select the category (Technical / Finance / HR), describe your issue in detail, and attach screenshots if available. You will receive a ticket ID and estimated resolution time via email.', categoryTag: '02' },
  { queryText: 'How does team formation work for interns?', answer: 'Teams are formed at the start of each cohort (every quarter). Interns are grouped by skill complementarity — backend, frontend, and domain knowledge are balanced across teams. You will receive a team allocation email within the first week. Team leads are assigned by mentors based on prior experience.', categoryTag: '03' },
  { queryText: 'What documents are required during onboarding?', answer: 'Required documents: (1) Government-issued ID (Aadhaar or PAN), (2) Educational certificates, (3) Experience letters, (4) Passport-size photographs x 4, (5) Completed NDA and IP agreement. Submit via hr.vicharanashala.com within 3 business days of joining.', categoryTag: '04' },
  { queryText: 'How and when are weekly reports submitted?', answer: 'Weekly reports are submitted every Friday by 6:00 PM IST via the Reports tab on the Vicharanashala portal. Each report must include tasks completed, blockers, plan for next week, and a self-assessment score (1–10).', categoryTag: '05' },
  { queryText: 'When and how is the stipend released?', answer: 'Stipend is released on the last working day of each month via bank transfer. Band A: ₹25,000, Band B: ₹18,000, Band C: ₹12,000. Deductions apply for missed deadlines (₹500 per late report) and unapproved absences.', categoryTag: '06' },
  { queryText: 'What is the minimum attendance requirement?', answer: 'Minimum attendance is 75% per month. Falling below 60% for two consecutive months results in termination. Apply for approved leaves at least 48 hours in advance via the HR portal.', categoryTag: '07' },
  { queryText: 'What lab facilities are available?', answer: 'Lab (Room 204, Building C) is open Mon–Sat, 9 AM–8 PM. 40 workstations, 100 Mbps internet. Rules: no food inside, log at reception, save work on designated drives only — local drives are wiped weekly.', categoryTag: '08' },
  { queryText: 'How is the final evaluation structured?', answer: 'Evaluation: Weekly reports (20%), Mid-term project (30%, Week 8), Final demo (50%, Week 16). SP adds up to 10 bonus marks. Grading: A (90+), B (75–89), C (60–74), P (50–59), F (<50).', categoryTag: '09' },
  { queryText: 'How does the SP system work?', answer: 'SP: FCFS resolution (+50), unique query (+10), escalation contribution (+5). Lose SP: Yaksha rejection (−20). SP is tracked in your SP Ledger. Top holders appear on the public leaderboard. No monetary conversion.', categoryTag: '10' },
  { queryText: 'What is Yaksha-mini?', answer: 'Yaksha-mini is the automated content quality auditor for FCFS resolutions. It checks: 20+ chars, 3+ words, no keyboard patterns or numeric gibberish, meaningful word ratio >40%, and answer relevance. Failed answers result in −20 SP penalty.', categoryTag: '11' },
  { queryText: 'How do I use the OAQ Tracker?', answer: 'The OAQ Tracker shows all open issues sorted by priority then FCFS order. Filter by section, search by keyword, and upvote important issues. 5+ upvotes within 2 hours escalates to HIGH priority and notifies mentors.', categoryTag: '12' },
  { queryText: 'Who do I contact for general queries?', answer: 'For general queries, first check the Trending feed. If not answered, raise a new query via "Raise Query". Administrative queries (leave, finance) should go to the NOC system. For urgent technical blockers, contact the on-duty mentor via internal chat.', categoryTag: '13' },
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/oaq_db';
  console.log('[SEED] Connecting to:', mongoUri.split('@').pop());
  await mongoose.connect(mongoUri);
  console.log('[DB] Connected for seeding');
  console.log('[DB] Connection state:', mongoose.connection.readyState, '(1=connected)');

  // Users — delete all existing and recreate fresh
  await User.deleteMany({});
  for (const u of DEMO_USERS) {
    const user = new User(u);
    await user.save();
    console.log(`  Created user: ${u.email} (${u.role}), password: ${user.password.slice(0,20)}...`);
  }
  const countAfter = await User.countDocuments({ email: { $in: DEMO_USERS.map(u => u.email) } });
  console.log(`  Users now in DB: ${countAfter}`);

  // Sections
  for (const s of DEFAULT_SECTIONS) {
    const existing = await Section.findOne({ sectionId: s.sectionId });
    if (!existing) {
      await Section.create(s);
      console.log(`  Created section: ${s.sectionId} - ${s.label}`);
    } else {
      console.log(`  Section exists: ${s.sectionId}`);
    }
  }

  // Baseline issues
  let nextId = 1000;
  const last = await OAQIssue.findOne().sort({ issueId: -1 }).select('issueId');
  if (last) nextId = Math.max(1000, last.issueId + 1);

  const superadmin = await User.findOne({ email: 'superadmin@demo.com' });
  for (const issue of BASELINE_ISSUES) {
    const existing = await OAQIssue.findOne({ queryText: issue.queryText });
    if (!existing) {
      await OAQIssue.create({
        issueId: nextId++,
        ...issue,
        status: 'Resolved',
        isBaseline: true,
        isPinned: false,
        isFeatured: false,
        upvoteCount: 1,
        priority: 'NORMAL',
        raisedBy: superadmin._id,
        resolvedBy: superadmin._id,
        communityReplies: [{
          repliedBy: superadmin._id,
          replyText: issue.answer,
          isAcceptedFirst: true
        }]
      });
      console.log(`  Created baseline issue: ${issue.queryText.slice(0, 50)}...`);
    } else {
      console.log(`  Baseline exists: ${issue.queryText.slice(0, 50)}...`);
    }
  }

  console.log('\n[SEED] Done!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[SEED] Error:', err.message);
  process.exit(1);
});