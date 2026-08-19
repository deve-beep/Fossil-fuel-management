const express = require('express');
const User = require('../models/User');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, checkPermission('users', 'read'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/deactivate', protect, checkPermission('users', 'write'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reactivate', protect, checkPermission('users', 'write'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = true;
    await user.save();
    res.json({ success: true, message: 'User reactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
