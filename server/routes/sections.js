const express = require('express');
const Section = require('../models/Section');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_SECTIONS = [
  ['01', 'ViBe Platform',   'ViBe platform and flows',                         'Learn how to access, navigate, and use the ViBe learning platform effectively.',        '#3b82f6'],
  ['02', 'NOC System',      'NOC system',                                       'Raising tickets, tracking issues, and getting help from the NOC team.',                  '#8b5cf6'],
  ['03', 'Team Formation',  'Team formation',                                   'How teams are formed, team lead assignments, and cohort grouping.',                      '#ec4899'],
  ['04', 'Onboarding',      'Onboarding',                                       'Documents required, NDA, IP agreement, HR portal setup, and first-day instructions.',   '#f59e0b'],
  ['05', 'Reports & Subs',  'Reports and submissions',                          'Weekly report format, deadlines, self-assessment scoring, and submission process.',       '#10b981'],
  ['06', 'Stipend & Finance','Stipend and finance',                             'Stipend bands, release schedule, deductions, payslips, and finance contacts.',           '#6366f1'],
  ['07', 'Schedule & Attend','Schedule and attendance',                         '75% minimum attendance, leave policy, log-in rules, and absence penalties.',              '#ef4444'],
  ['08', 'Lab Infrastructure','Lab infrastructure',                             'Lab access rules, facilities, workstation etiquette, and software restrictions.',          '#14b8a6'],
  ['09', 'Evaluation & Grading','Evaluation and grading',                      'Three-component evaluation, grading scale, mid-term and final demo requirements.',        '#f97316'],
  ['10', 'SP & Gamification','Skill points and gamification',                   'How SP is earned, spent, tracked, and how it affects your evaluation ranking.',           '#84cc16'],
  ['11', 'Yaksha-mini',     'Yaksha mini audit',                                'Content quality checks, what causes SP penalties, and how to write good answers.',       '#a855f7'],
  ['12', 'OAQ Tracker',     'OAQ tracker',                                      'Using the tracker, FCFS rules, upvoting, escalation triggers, and resolution flow.',    '#06b6d4'],
  ['13', 'General / Other', 'General questions',                                'Queries not covered elsewhere — where to ask, who to contact, and how to get help.',    '#6b7280'],
].map(([sectionId, label, scope, description, color]) => ({ sectionId, label, scope, description, color, locked: true }));

router.get('/', async (req, res) => {
  try {
    const sections = await Section.find().sort({ sectionId: 1 });
    res.json(sections.length ? sections : DEFAULT_SECTIONS);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { sectionId, label, scope, description, color } = req.body;
    const section = await Section.create({ sectionId, label, scope, description, color, locked: false });
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
