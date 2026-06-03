const mongoose = require('mongoose');
const { Schema, Types: { ObjectId } } = mongoose;

const CommunityReplySchema = new Schema({
  repliedBy:         { type: ObjectId, ref: 'User' },
  replyText:         String,
  isAcceptedFirst:   { type: Boolean, default: false },
  isPromoted:        { type: Boolean, default: false },
  upvotes:           { type: Number, default: 0 },
  downvotes:         { type: Number, default: 0 },
  upvotedBy:         { type: [{ type: ObjectId, ref: 'User' }], default: [] },
  isPendingModeration:{ type: Boolean, default: false },
  isFlagged:         { type: Boolean, default: false },
  flaggedBy:         { type: ObjectId, ref: 'User' },
  timestamp:         { type: Date, default: Date.now }
});

const OAQIssueSchema = new Schema({
  issueId:      { type: Number, required: true, unique: true },
  queryText:    { type: String, required: true },
  answer:       { type: String, default: '' },
  bestReplyId:  { type: ObjectId, default: null },
  categoryTag:  { type: String, required: true },
  status:       { type: String, enum: ['Open', 'Resolved', 'Duplicate'], default: 'Open' },
  priority:     { type: String, enum: ['NORMAL', 'HIGH'], default: 'NORMAL' },
  escalated:    { type: Boolean, default: false },
  isBaseline:   { type: Boolean, default: false },
  isPinned:     { type: Boolean, default: false },
  isFeatured:   { type: Boolean, default: false },
  upvoteCount:  { type: Number, default: 1 },
  upvotedBy:    { type: [{ type: ObjectId, ref: 'User' }], default: [] },
  downvotedBy:  { type: [{ type: ObjectId, ref: 'User' }], default: [] },
  resolvedBy:   { type: ObjectId, ref: 'User', default: null },
  raisedBy:     { type: ObjectId, ref: 'User', required: true },
  lockedBy:     { type: ObjectId, ref: 'User', default: null },
  lockExpiry:   { type: Date, default: null },
  duplicateOf:  { type: ObjectId, ref: 'OAQIssue', default: null },
  communityReplies: [CommunityReplySchema]
}, { timestamps: true });

OAQIssueSchema.index({ queryText: 'text' });
OAQIssueSchema.index({ categoryTag: 1 });
OAQIssueSchema.index({ upvoteCount: -1 });
OAQIssueSchema.index({ isBaseline: 1 });

module.exports = mongoose.model('OAQIssue', OAQIssueSchema);
