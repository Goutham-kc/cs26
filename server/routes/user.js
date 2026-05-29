const express  = require('express');
const auth     = require('../middleware/auth');
const User     = require('../models/User');
const SPLedger = require('../models/SPLedger');
const router   = express.Router();

// GET /api/users/me  — full profile + SP stats
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/stats  — public SP stats for any intern
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name sp role joinDate');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stats = await SPLedger.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$event', count: { $sum: 1 }, total: { $sum: '$delta' } } }
    ]);

    const breakdown = { FCFS_WIN: 0, QUERY_BONUS: 0, ESCALATION_BONUS: 0, PENALTY: 0 };
    stats.forEach(s => { breakdown[s._id] = s.total; });

    res.json({ user, breakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
