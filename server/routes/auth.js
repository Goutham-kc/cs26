const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register — self-registration only for intern/mentor
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const allowedRole = ['intern', 'mentor'].includes(role) ? role : 'intern';
    const user  = await User.create({ name, email, password, role: allowedRole });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { _id: user._id, name, email, role: user.role, sp: 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email, role: user.role, sp: user.sp } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
