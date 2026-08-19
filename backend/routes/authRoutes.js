const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' }
});

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(', ') });
  }
  next();
};

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('organization').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, organization, designation } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      const user = await User.create({ name, email, password, organization, designation, role: ROLES.STAKEHOLDER });
      const token = signToken(user);
      res.status(201).json({ success: true, token, user: user.toSafeObject() });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/provision',
  protect,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(Object.values(ROLES))
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ success: false, message: 'Only government administrators can provision accounts.' });
      }
      const { name, email, password, role, organization, designation } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      const user = await User.create({ name, email, password, role, organization, designation });
      res.status(201).json({ success: true, user: user.toSafeObject() });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.isActive || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
      user.lastLogin = new Date();
      await user.save();
      const token = signToken(user);
      res.json({ success: true, token, user: user.toSafeObject() });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = router;
