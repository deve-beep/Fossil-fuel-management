const express = require('express');
const { body, validationResult } = require('express-validator');
const Production = require('../models/Production');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(', ') });
  next();
};

router.get('/', protect, checkPermission('production', 'read'), async (req, res, next) => {
  try {
    const { fuelType, state, from, to } = req.query;
    const filter = {};
    if (fuelType) filter.fuelType = fuelType;
    if (state) filter.state = state;
    if (from || to) {
      filter.period = {};
      if (from) filter.period.$gte = from;
      if (to) filter.period.$lte = to;
    }
    const records = await Production.find(filter).sort({ period: 1 }).limit(500);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', protect, checkPermission('production', 'read'), async (req, res, next) => {
  try {
    const fuels = ['coal', 'crude_oil', 'natural_gas'];
    const summary = {};
    for (const fuel of fuels) {
      const latest = await Production.find({ fuelType: fuel, state: 'National' }).sort({ period: -1 }).limit(1);
      summary[fuel] = latest[0] || null;
    }
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  checkPermission('production', 'write'),
  [
    body('fuelType').isIn(['coal', 'crude_oil', 'natural_gas']),
    body('state').notEmpty(),
    body('period').matches(/^\d{4}-\d{2}$/).withMessage('period must be YYYY-MM'),
    body('unit').notEmpty(),
    body('productionActual').isFloat({ min: 0 }),
    body('productionTarget').isFloat({ min: 0 }),
    body('consumption').isFloat({ min: 0 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const record = await Production.create({ ...req.body, createdBy: req.user._id });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', protect, checkPermission('production', 'write'), async (req, res, next) => {
  try {
    const record = await Production.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    Object.assign(record, req.body);
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, checkPermission('production', 'write'), async (req, res, next) => {
  try {
    const record = await Production.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
