const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const OAQIssue = require('../models/OAQIssue');
const User = require('../models/User');
const SPLedger = require('../models/SPLedger');
const Section = require('../models/Section');

const router = express.Router();

router.use(auth, requireRole('admin', 'superadmin'));

router.get('/stats', async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const since = range === '7d'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : range === '30d'
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : null;

    const baseFilter = since ? { createdAt: { $gte: since } } : {};

    const [
      totalIssues,
      openIssues,
      resolvedIssues,
      totalUsers,
      totalMentors,
      totalAdmins,
      pinnedIssues,
      featuredIssues,
      recentLedger
    ] = await Promise.all([
      OAQIssue.countDocuments(since ? { ...baseFilter } : {}),
      OAQIssue.countDocuments({ status: 'Open', ...(since ? { createdAt: { $gte: since } } : {}) }),
      OAQIssue.countDocuments({ status: 'Resolved', ...(since ? { createdAt: { $gte: since } } : {}) }),
      User.countDocuments(since ? { ...baseFilter } : {}),
      User.countDocuments({ role: 'mentor', ...(since ? { createdAt: { $gte: since } } : {}) }),
      User.countDocuments({ role: 'admin', ...(since ? { createdAt: { $gte: since } } : {}) }),
      OAQIssue.countDocuments({ isPinned: true, ...(since ? { createdAt: { $gte: since } } : {}) }),
      OAQIssue.countDocuments({ isFeatured: true, ...(since ? { createdAt: { $gte: since } } : {}) }),
      SPLedger.find(since ? { createdAt: { $gte: since } } : {}).sort({ createdAt: -1 }).limit(10)
        .populate('userId', 'name email').populate('issueId', 'queryText')
    ]);

    const topHolders = await User.find().sort({ sp: -1 }).limit(5).select('name email role sp');

    res.json({
      issues: { total: totalIssues, open: openIssues, resolved: resolvedIssues },
      users: { total: totalUsers, mentors: totalMentors, admins: totalAdmins },
      pinned: pinnedIssues,
      featured: featuredIssues,
      topHolders,
      recentActivity: recentLedger
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/issues', async (req, res) => {
  try {
    const { status, categoryTag, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (categoryTag) filter.categoryTag = categoryTag;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      OAQIssue.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip).limit(parseInt(limit))
        .populate('raisedBy', 'name email')
        .populate('resolvedBy', 'name email'),
      OAQIssue.countDocuments(filter)
    ]);
    res.json({ issues, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/issues/:id', async (req, res) => {
  try {
    const issue = await OAQIssue.findById(req.params.id)
      .populate('raisedBy', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('communityReplies.repliedBy', 'name role');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/issues', async (req, res) => {
  try {
    const { queryText, answer, categoryTag, isBaseline, priority } = req.body;
    if (!queryText || !categoryTag) {
      return res.status(400).json({ message: 'queryText and categoryTag required' });
    }

    const last = await OAQIssue.findOne().sort({ issueId: -1 }).select('issueId');
    const issueId = (last?.issueId || 0) + 1;

    const issue = await OAQIssue.create({
      issueId,
      queryText,
      answer: answer || '',
      categoryTag,
      status: answer ? 'Resolved' : 'Open',
      priority: priority || 'NORMAL',
      isBaseline: isBaseline || false,
      isPinned: false,
      isFeatured: false,
      upvoteCount: 1,
      raisedBy: req.user._id,
      resolvedBy: answer ? req.user._id : null,
      communityReplies: answer ? [{
        repliedBy: req.user._id,
        replyText: answer,
        isAcceptedFirst: true
      }] : []
    });

    const io = req.app.get('io');
    if (io) io.emit('issue:created', issue);

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id', async (req, res) => {
  try {
    const allowed = ['queryText', 'answer', 'categoryTag', 'status', 'priority', 'isPinned', 'isFeatured'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const issue = await OAQIssue.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('raisedBy', 'name email')
      .populate('resolvedBy', 'name email');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const io = req.app.get('io');
    if (updates.status === 'Resolved' && io) {
      io.emit('issue:resolved', { issueId: issue._id, queryText: issue.queryText });
    }

    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/pin', async (req, res) => {
  try {
    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.isPinned = !issue.isPinned;
    await issue.save();

    res.json({ issueId: issue._id, isPinned: issue.isPinned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/feature', async (req, res) => {
  try {
    const issue = await OAQIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.isFeatured = !issue.isFeatured;
    await issue.save();

    res.json({ issueId: issue._id, isFeatured: issue.isFeatured });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/resolve', async (req, res) => {
  try {
    const { answer } = req.body;
    const existing = await OAQIssue.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Issue not found' });

    const updates = {
      status: 'Resolved',
      answer: answer || existing.answer || 'Resolved by admin',
      resolvedBy: req.user._id
    };
    if (answer) {
      updates.$push = {
        communityReplies: {
          repliedBy: req.user._id,
          replyText: answer,
          isAcceptedFirst: true
        }
      };
    }

    const resolvedIssue = await OAQIssue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('raisedBy', 'name').populate('resolvedBy', 'name');

    const io = req.app.get('io');
    if (io) io.emit('issue:resolved', { issueId: resolvedIssue._id, queryText: resolvedIssue.queryText });

    res.json(resolvedIssue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/issues/:id', async (req, res) => {
  try {
    const issue = await OAQIssue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Issue deleted', issueId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ sp: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, sp } = req.body;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const updates = {};
    if (sp !== undefined) updates.sp = sp;

    if (role !== undefined) {
      const isSuperadmin = req.user.role === 'superadmin';
      const isSelf = req.user._id.equals(target._id);

      if (isSelf) return res.status(400).json({ message: 'Cannot modify your own role' });

      if (['superadmin'].includes(role)) {
        if (!isSuperadmin) return res.status(403).json({ message: 'Only superadmin can assign superadmin role' });
      } else if (role === 'admin') {
        if (!isSuperadmin) return res.status(403).json({ message: 'Only superadmin can assign admin role' });
      } else if (role === 'mentor') {
        if (!isSuperadmin && !['admin', 'mentor'].includes(target.role)) {
          return res.status(403).json({ message: 'Insufficient permissions to assign mentor role' });
        }
      }
      updates.role = role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can create users directly' });
    }
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, password required' });
    if (!['intern', 'mentor', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ _id: user._id, name, email, role, sp: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/:id/sp-history', async (req, res) => {
  try {
    const ledger = await SPLedger.find({ userId: req.params.id })
      .sort({ createdAt: -1 }).limit(50)
      .populate('issueId', 'queryText');
    res.json(ledger);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sections', async (req, res) => {
  try {
    const sections = await Section.find().sort({ order: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/sections', async (req, res) => {
  try {
    const { name, code, color, description, order } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'name and code required' });

    const exists = await Section.findOne({ code });
    if (exists) return res.status(409).json({ message: 'Section code already exists' });

    const section = await Section.create({ name, code, color, description, order: order || 0 });
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;