const mongoose = require('mongoose');
const { Schema, Types: { ObjectId } } = mongoose;

// Every SP credit or debit produces one ledger document.
// The user's sp field on User is the running total; this is the audit trail.
const SPLedgerSchema = new Schema({
  userId:  { type: ObjectId, ref: 'User',     required: true },
  delta:   { type: Number,   required: true },          // +50, +10, +5, -20
  reason:  { type: String,   required: true },
  issueId: { type: ObjectId, ref: 'OAQIssue', default: null },
  event:   {
    type: String,
    enum: ['FCFS_WIN', 'PENALTY', 'QUERY_BONUS', 'ESCALATION_BONUS'],
    required: true
  }
}, { timestamps: true });

SPLedgerSchema.index({ userId: 1, createdAt: -1 });   // fast per-user ledger fetch

module.exports = mongoose.model('SPLedger', SPLedgerSchema);
