const mongoose = require('mongoose');
const { Schema, Types: { ObjectId } } = mongoose;

const ThreadReplySchema = new Schema({
  repliedBy:         { type: ObjectId, ref: 'User' },
  replyText:         { type: String, required: true },
  isAcceptedFirst:   { type: Boolean, default: false },
  isPromoted:        { type: Boolean, default: false },
  upvotes:           { type: Number, default: 0 },
  downvotes:         { type: Number, default: 0 },
  upvotedBy:         [{ type: ObjectId, ref: 'User' }],
  downvotedBy:       [{ type: ObjectId, ref: 'User' }],
  isPendingModeration:{ type: Boolean, default: false },
  isFlagged:         { type: Boolean, default: false },
  flaggedBy:         { type: ObjectId, ref: 'User' },
  parentReplyId:     { type: ObjectId, default: null },
  mentions:          [{ type: String }],
  labels:            [{ type: String }],
  timestamp:         { type: Date, default: Date.now }
});

const ThreadSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  body:        { type: String, required: true },
  categoryTag: { type: String, required: true },
  status:      { type: String, enum: ['Open', 'Resolved', 'Locked'], default: 'Open' },
  priority:    { type: String, enum: ['NORMAL', 'HIGH'], default: 'NORMAL' },
  labels:      [{ type: String }],
  assignedTo:  { type: ObjectId, ref: 'User', default: null },
  isPinned:    { type: Boolean, default: false },
  isLocked:    { type: Boolean, default: false },
  upvoteCount: { type: Number, default: 1 },
  upvotedBy:   [{ type: ObjectId, ref: 'User' }],
  viewCount:   { type: Number, default: 0 },
  resolvedBy:  { type: ObjectId, ref: 'User', default: null },
  bestReplyId: { type: ObjectId, default: null },
  raisedBy:    { type: ObjectId, ref: 'User', required: true },
  threadReplies: [ThreadReplySchema]
}, { timestamps: true });

ThreadSchema.index({ title: 'text', body: 'text' });
ThreadSchema.index({ categoryTag: 1 });
ThreadSchema.index({ status: 1 });
ThreadSchema.index({ priority: -1 });
ThreadSchema.index({ upvoteCount: -1 });
ThreadSchema.index({ raisedBy: 1 });

module.exports = mongoose.model('Thread', ThreadSchema);