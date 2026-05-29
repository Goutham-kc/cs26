const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const OAQIssue = require('../models/OAQIssue');
const User = require('../models/User');
const SPLedger = require('../models/SPLedger');
const CoOccurrence = require('../models/CoOccurrence');
const { yakshaAudit } = require('../services/yaksha');
const escalationBus = require('../services/escalation');

const router = express.Router();

async function nextIssueId() {
  const last = await OAQIssue.findOne().sort({ issueId: -1 }).select('issueId');
  return last ? last.issueId + 1 : 1;
}

async function awardSP(userId, delta, reason, issueId, event) {
  await User.findByIdAndUpdate(userId, { $inc: { sp: delta } });
  await SPLedger.create({ userId, delta, reason, issueId, event });
}

async function promoteReply(issue, replyId) {
  const reply = issue.communityReplies.id(replyId);
  if (!reply) return null;
  await OAQIssue.findByIdAndUpdate(issue._id, {
    status: 'Resolved',
    answer: reply.replyText,
    resolvedBy: reply.repliedBy,
    bestReplyId: replyId,
    $set: { 'communityReplies.$[r].isPromoted': true, 'communityReplies.$[r].isAcceptedFirst': true } },
    { arrayFilters: [{ 'r._id': replyId }] }
  );
  await awardSP(
    reply.repliedBy, 50,
    `Reply promoted to answer: Issue #${issue.issueId} - ${issue.queryText.slice(0, 60)}`,
    issue._id, 'FCFS_WIN'
  );
  return reply;
}

async function checkAutoPromote(issue) {
  if (issue.status !== 'Open') return;
  for (const reply of issue.communityReplies) {
    if (reply.isPromoted || reply.isAcceptedFirst) continue;
    if (reply.upvotes >= 3) {
      await promoteReply(issue, reply._id);
      return true;
    }
  }
  return false;
}

router.get('/baseline', async (req, res) => {
  try {
    const entries = await OAQIssue.find({ isBaseline: true })
      .sort({ issueId: 1 })
      .populate('raisedBy', 'name role');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/seed-baseline', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    await OAQIssue.deleteMany({ isBaseline: true });

    const lastBaseline = await OAQIssue.findOne().sort({ issueId: -1 }).select('issueId');
    let nextId = Math.max(1000, (lastBaseline?.issueId || 0) + 1);

    const baselineData = [
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

    const created = await OAQIssue.insertMany(
      baselineData.map(e => ({
        issueId: nextId++,
        ...e,
        status: 'Resolved',
        isBaseline: true,
        isPinned: false,
        isFeatured: false,
        upvoteCount: Math.floor(Math.random() * 20) + 1,
        priority: 'NORMAL',
        raisedBy: req.user._id,
        resolvedBy: req.user._id,
        communityReplies: [{
          repliedBy: req.user._id,
          replyText: e.answer,
          isAcceptedFirst: true
        }]
      }))
    );

    res.status(201).json({ seeded: created.length, message: `${created.length} baseline entries created` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const top15 = await OAQIssue.aggregate([
      { $match: { status: 'Resolved' } },
      { $sort: { isPinned: -1, isFeatured: -1, upvoteCount: -1, createdAt: -1 } },
      { $limit: 15 },
      { $project: { queryText: 1, categoryTag: 1, upvoteCount: 1, answer: 1, resolvedBy: 1, isPinned: 1, isFeatured: 1 } }
    ]);
    res.json(top15);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, sections } = req.query;
    if (!q) return res.json([]);

    const filter = { $text: { $search: q } };
    if (sections) filter.categoryTag = { $in: sections.split(',').map(s => s.trim()) };

    const results = await OAQIssue.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .populate('raisedBy', 'name');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/open-queries', async (req, res) => {
  try {
    const issues = await OAQIssue.find({
      status: 'Open',
      'communityReplies.0': { $exists: true }
    })
      .sort({ updatedAt: -1 })
      .limit(30)
      .populate('raisedBy', 'name')
      .populate('communityReplies.repliedBy', 'name');
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/tracker', async (req, res) => {
  try {
    const issues = await OAQIssue.find({ isBaseline: false })
      .sort({ isPinned: -1, priority: -1, createdAt: -1 })
      .populate('raisedBy', 'name')
      .populate('resolvedBy', 'name');
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/mock-import', auth, requireRole('admin'), async (req, res) => {
  try {
    const { source = 'Mock Import', entries = [] } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'entries array required' });
    }

    let last = await OAQIssue.findOne().sort({ issueId: -1 }).select('issueId');
    let nextId = (last?.issueId || 0) + 1;
    let inserted = 0;
    let skipped = 0;

    for (const entry of entries) {
      const queryText = String(entry.queryText || '').trim();
      const answer = String(entry.answer || '').trim();
      const categoryTag = String(entry.categoryTag || '13').padStart(2, '0');
      if (!queryText || !answer) {
        skipped += 1;
        continue;
      }

      const exists = await OAQIssue.exists({ queryText });
      if (exists) {
        skipped += 1;
        continue;
      }

      await OAQIssue.create({
        issueId: nextId++,
        queryText,
        answer,
        categoryTag,
        status: 'Resolved',
        priority: 'NORMAL',
        isBaseline: false,
        upvoteCount: Number(entry.upvoteCount) || 1,
        raisedBy: req.user._id,
        resolvedBy: req.user._id,
        communityReplies: [{
          repliedBy: req.user._id,
          replyText: answer,
          isAcceptedFirst: true
        }]
      });
      inserted += 1;
    }

    res.status(201).json({ source, inserted, skipped, total: entries.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/related', async (req, res) => {
  try {
    const edges = await CoOccurrence.find({ issueA: req.params.id })
      .sort({ weight: -1 })
      .limit(5)
      .populate('issueB', 'queryText categoryTag upvoteCount');

    let related = edges.map(e => e.issueB).filter(Boolean);
    if (related.length === 0) {
      const issue = await OAQIssue.findById(req.params.id).select('categoryTag');
      if (issue) {
        related = await OAQIssue.find({
          categoryTag: issue.categoryTag,
          _id: { $ne: req.params.id }
        })
          .sort({ upvoteCount: -1 })
          .limit(3)
          .select('queryText categoryTag upvoteCount');
      }
    }

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/view', auth, async (req, res) => {
  try {
    const { sessionHistory = [] } = req.body;
    await Promise.all(sessionHistory.map(prevId =>
      CoOccurrence.findOneAndUpdate(
        { issueA: prevId, issueB: req.params.id },
        { $inc: { weight: 1 } },
        { upsert: true, new: true }
      )
    ));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { queryText, categoryTag } = req.body;
    if (!queryText || !categoryTag) {
      return res.status(400).json({ message: 'queryText and categoryTag required' });
    }

    const issueId = await nextIssueId();
    const issue = await OAQIssue.create({
      issueId,
      queryText,
      categoryTag,
      raisedBy: req.user._id
    });

    await awardSP(
      req.user._id,
      10,
      `Unique query submitted: Issue #${issueId} - ${queryText.slice(0, 60)}`,
      issue._id,
      'QUERY_BONUS'
    );

    const io = req.app.get('io');
    if (io) io.emit('issue:created', issue);
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/issues', auth, async (req, res) => {
  req.url = '/';
  router.handle(req, res);
});

router.post('/issues/:id/resolve', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { answer } = req.body;

    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status !== 'Open') return res.status(409).json({ code: 'ALREADY_RESOLVED', message: 'Issue already resolved' });

    const audit = await yakshaAudit(answer || '', { queryText: issue.queryText });
    if (!audit.passed) {
      await awardSP(req.user._id, -20, `Yaksha rejection: ${audit.reason}`, req.params.id, 'PENALTY');
      return res.status(400).json({ code: 'YAKSHA_REJECT', penalty: -20, reason: audit.reason });
    }

    const updatedIssue = await OAQIssue.findByIdAndUpdate(
      issue._id,
      {
        $push: { communityReplies: { repliedBy: req.user._id, replyText: answer, isAcceptedFirst: false } }
      },
      { new: true }
    );
    await awardSP(req.user._id, 5, `Reply submitted: Issue #${issue.issueId}`, issue._id, 'QUERY_BONUS');
    if (io) io.emit('issue:replied', { issueId: issue._id, queryText: issue.queryText });

    const promoted = await checkAutoPromote(updatedIssue);
    if (promoted) {
      if (io) io.emit('issue:resolved', { issueId: issue._id, queryText: issue.queryText });
      return res.json({ code: 'AUTO_PROMOTED', sp: 55, message: '3 upvotes reached — answer auto-promoted to resolved (+50 SP bonus)', issue: updatedIssue });
    }

    res.json({ code: 'SUBMITTED', sp: 5, message: 'Answer submitted — needs 3 upvotes to auto-resolve (+50 SP on promotion)', issue: updatedIssue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/issues/:id/reply', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { answer } = req.body;
    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status !== 'Resolved') return res.status(400).json({ message: 'Can only reply to resolved issues' });

    const audit = await yakshaAudit(answer || '');
    if (!audit.passed) {
      await awardSP(req.user._id, -20, `Yaksha rejection: ${audit.reason}`, req.params.id, 'PENALTY');
      return res.status(400).json({ code: 'YAKSHA_REJECT', penalty: -20, reason: audit.reason });
    }

    const updatedIssue = await OAQIssue.findByIdAndUpdate(
      req.params.id,
      { $push: { communityReplies: { repliedBy: req.user._id, replyText: answer, isAcceptedFirst: false } } },
      { new: true }
    ).populate('communityReplies.repliedBy', 'name role');

    if (io) io.emit('issue:replied', { issueId: issue._id, queryText: issue.queryText });
    res.json(updatedIssue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/replies/:replyId/vote', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { type } = req.body;
    if (!['up', 'down'].includes(type)) return res.status(400).json({ message: 'type must be up or down' });

    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const reply = issue.communityReplies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const inc = type === 'up' ? { upvotes: 1 } : { downvotes: 1 };
    await OAQIssue.updateOne(
      { _id: issue._id, 'communityReplies._id': reply._id },
      { $inc: inc }
    );

    const updatedIssue = await OAQIssue.findById(req.params.id);
    const updatedReply = updatedIssue.communityReplies.id(req.params.replyId);

    const promoted = await checkAutoPromote(updatedIssue);
    if (promoted) {
      const io = req.app.get('io');
      if (io) io.emit('issue:resolved', { issueId: issue._id, queryText: issue.queryText });
      return res.json({ code: 'AUTO_PROMOTED', message: 'Reply auto-promoted by community votes', issue: updatedIssue });
    }

    res.json({ reply: updatedReply, issue: updatedIssue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/issues/:id/community-reply', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { answer } = req.body;
    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status === 'Resolved') return res.status(400).json({ message: 'Issue already resolved' });

    const audit = await yakshaAudit(answer || '', { queryText: issue.queryText });
    if (!audit.passed) {
      await awardSP(req.user._id, -20, `Yaksha rejection: ${audit.reason}`, req.params.id, 'PENALTY');
      return res.status(400).json({ code: 'YAKSHA_REJECT', penalty: -20, reason: audit.reason });
    }

    const updatedIssue = await OAQIssue.findByIdAndUpdate(
      req.params.id,
      { $push: { communityReplies: { repliedBy: req.user._id, replyText: answer } } },
      { new: true }
    ).populate('communityReplies.repliedBy', 'name');

    await awardSP(req.user._id, 5, `Community reply on: Issue #${issue.issueId}`, req.params.id, 'QUERY_BONUS');
    if (io) io.emit('issue:replied', { issueId: req.params.id });

    const promoted = await checkAutoPromote(updatedIssue);
    if (promoted) {
      if (io) io.emit('issue:resolved', { issueId: issue._id, queryText: issue.queryText });
      return res.json({ code: 'AUTO_PROMOTED', sp: 55, message: '3 upvotes reached — answer auto-promoted', issue: updatedIssue });
    }

    res.json({ code: 'SUBMITTED', sp: 5, message: 'Answer submitted — 3 upvotes to auto-resolve', issue: updatedIssue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/replies/:replyId/flag', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  try {
    await OAQIssue.updateOne(
      { _id: req.params.id, 'communityReplies._id': req.params.replyId },
      { $set: { 'communityReplies.$.isFlagged': true, 'communityReplies.$.flaggedBy': req.user._id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/replies/:replyId/promote', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const reply = issue.communityReplies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const promoted = await promoteReply(issue, req.params.replyId);
    if (!promoted) return res.status(500).json({ message: 'Failed to promote reply' });

    const updatedIssue = await OAQIssue.findById(req.params.id);
    if (io) io.emit('issue:resolved', { issueId: issue._id, queryText: issue.queryText });

    res.json({ code: 'PROMOTED', message: 'Best reply promoted to answer', issue: updatedIssue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/moderation-queue', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  try {
    const flagged = await OAQIssue.find({
      'communityReplies.isFlagged': true,
      status: 'Open'
    })
      .select('queryText categoryTag communityReplies')
      .populate('raisedBy', 'name');

    const noAnswer = await OAQIssue.find({
      status: 'Open',
      'communityReplies.0': { $exists: false }
    }).select('queryText categoryTag raisedBy');

    const downvoted = await OAQIssue.find({
      status: 'Open',
      'communityReplies.downvotes': { $gte: 2 }
    }).select('queryText categoryTag communityReplies');

    res.json({ flagged, noAnswer, downvoted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/upvote', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const issue = await OAQIssue.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvoteCount: 1 } },
      { new: true }
    );
    escalationBus.emit('issue:upvoted', issue, io);
    if (io) io.emit('issue:upvoted', { issueId: issue._id, upvoteCount: issue.upvoteCount });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/upvote', auth, async (req, res) => {
  req.url = `/issues/${req.params.id}/upvote`;
  router.handle(req, res);
});

router.patch('/issues/:id/mentor-signoff', auth, requireRole('mentor', 'admin'), async (req, res) => {
  try {
    const issue = await OAQIssue.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved' },
      { new: true }
    );
    const io = req.app.get('io');
    if (io) io.emit('issue:resolved', { issueId: issue._id, queryText: issue.queryText });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const issue = await OAQIssue.findById(req.params.id)
      .populate('raisedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('communityReplies.repliedBy', 'name role');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
