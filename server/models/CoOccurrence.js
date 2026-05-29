const mongoose = require('mongoose');
const { Types: { ObjectId } } = mongoose;

const CoOccurrenceSchema = new mongoose.Schema({
  issueA: { type: ObjectId, ref: 'OAQIssue', required: true },
  issueB: { type: ObjectId, ref: 'OAQIssue', required: true },
  weight: { type: Number, default: 1 }
});

CoOccurrenceSchema.index({ issueA: 1, weight: -1 });
CoOccurrenceSchema.index({ issueA: 1, issueB: 1 }, { unique: true });

module.exports = mongoose.model('CoOccurrence', CoOccurrenceSchema);
