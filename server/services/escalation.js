// services/escalation.js — event-driven threshold trigger (spec §7)

const EventEmitter = require('events');
const User         = require('../models/User');
const OAQIssue     = require('../models/OAQIssue');
const SPLedger     = require('../models/SPLedger');

const escalationBus        = new EventEmitter();
const ESCALATION_UPVOTES   = 5;
const ESCALATION_WINDOW_MS = 7_200_000; // 2 hours

escalationBus.on('issue:upvoted', async (issue, io) => {
  try {
    const ageMs = Date.now() - new Date(issue.createdAt).getTime();
    if (
      issue.upvoteCount >= ESCALATION_UPVOTES &&
      ageMs           <= ESCALATION_WINDOW_MS &&
      !issue.escalated
    ) {
      await OAQIssue.findByIdAndUpdate(issue._id, {
        escalated: true,
        priority:  'HIGH'
      });

      // +5 SP escalation bonus to the query author
      await User.findByIdAndUpdate(issue.raisedBy, { $inc: { sp: 5 } });
      await SPLedger.create({
        userId:  issue.raisedBy,
        delta:   5,
        reason:  `Escalation bonus: Issue #${issue.issueId} reached priority threshold`,
        issueId: issue._id,
        event:   'ESCALATION_BONUS'
      });

      // Notify mentors via Socket.io
      if (io) io.to('mentors').emit('issue:escalated', { issueId: issue._id });

      console.log(`[ESCALATION] Issue #${issue.issueId} escalated to HIGH priority`);
    }
  } catch (err) {
    console.error('[ESCALATION] error:', err.message);
  }
});

module.exports = escalationBus;
