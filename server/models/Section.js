const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  sectionId:  { type: String, required: true, unique: true },
  label:      { type: String, required: true },
  scope:      { type: String, default: '' },
  description:{ type: String, default: '' },
  color:      { type: String, default: '#6b7280' },
  locked:     { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Section', SectionSchema);
