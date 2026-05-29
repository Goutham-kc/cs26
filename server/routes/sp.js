const express   = require('express');
const auth      = require('../middleware/auth');
const User      = require('../models/User');
const SPLedger  = require('../models/SPLedger');
const router    = express.Router();

// GET /api/sp/wallet
// Returns current SP balance + aggregate stats for the logged-in intern
router.get('/wallet', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, stats, totalInterns, winCounts] = await Promise.all([
      User.findById(userId).select('name email role sp joinDate'),
      SPLedger.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 },
            total: { $sum: '$delta' }
          }
        }
      ]),
      User.countDocuments({ role: 'intern' }),
      SPLedger.countDocuments({ userId, event: 'FCFS_WIN' })
    ]);

    const rankData = await User.countDocuments({ role: 'intern', sp: { $gt: user.sp } });
    const rank = rankData + 1;

    const top50Threshold = await User.findOne({ role: 'intern' })
      .sort({ sp: -1 })
      .skip(49)
      .select('sp')
      .then(u => u?.sp || 0);
    const spToTop50 = Math.max(0, top50Threshold - user.sp + 1);
    const spToTop10 = await User.findOne({ role: 'intern' })
      .sort({ sp: -1 })
      .skip(9)
      .select('sp')
      .then(u => u?.sp || 0);
    const spToTop10Val = Math.max(0, spToTop10 - user.sp + 1);

    const breakdown = { FCFS_WIN: 0, QUERY_BONUS: 0, ESCALATION_BONUS: 0, PENALTY: 0 };
    stats.forEach(s => { breakdown[s._id] = s.total; });

    const wins = (breakdown.FCFS_WIN || 0) / 50;
    const badges = [];
    if (wins >= 1) badges.push({ label: 'First Win', color: '#0D9488' });
    if (wins >= 5) badges.push({ label: 'Prolific Resolver', color: '#1E40AF' });
    if (user.sp >= 100) badges.push({ label: 'Centurion', color: '#7C3AED' });
    if (wins >= 10) badges.push({ label: 'Top 10 Contender', color: '#B45309' });

    const trend = await SPLedger.aggregate([
      { $match: { userId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, daily: { $sum: '$delta' } } },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    res.json({
      user,
      breakdown,
      totalInterns,
      rank,
      spToTop50,
      spToTop10: spToTop10Val,
      top50Threshold,
      badges,
      trend,
      fcfsWins: winCounts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sp/ledger?page=1&limit=20&event=FCFS_WIN
// Paginated SP history for the logged-in intern
router.get('/ledger', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, event } = req.query;
    const filter = { userId: req.user._id };
    if (event) filter.event = event;

    const [entries, total] = await Promise.all([
      SPLedger.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('issueId', 'queryText categoryTag issueId'),
      SPLedger.countDocuments(filter)
    ]);

    res.json({ entries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sp/leaderboard?limit=10
// Top SP holders across all interns
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const board = await User.find({ role: 'intern' })
      .sort({ sp: -1 })
      .limit(limit)
      .select('name sp joinDate');

    // Annotate FCFS win count per user
    const userIds   = board.map(u => u._id);
    const winCounts = await SPLedger.aggregate([
      { $match: { userId: { $in: userIds }, event: 'FCFS_WIN' } },
      { $group: { _id: '$userId', wins: { $sum: 1 } } }
    ]);
    const winMap = Object.fromEntries(winCounts.map(w => [w._id.toString(), w.wins]));

    const ranked = board.map((u, i) => ({
      rank:   i + 1,
      _id:    u._id,
      name:   u.name,
      sp:     u.sp,
      wins:   winMap[u._id.toString()] || 0,
      isYou:  u._id.toString() === req.user._id.toString()
    }));

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
