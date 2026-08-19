const express = require('express');
const { body, validationResult } = require('express-validator');
const CrisisReport = require('../models/CrisisReport');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(', ') });
  next();
};

router.get('/', protect, checkPermission('crisis', 'read'), async (req, res, next) => {
  try {
    const { severity, status, category, fuelType } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (fuelType) filter.fuelType = fuelType;
    const records = await CrisisReport.find(filter).sort({ createdAt: -1 }).limit(200).populate('reportedBy', 'name role organization');
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, checkPermission('crisis', 'read'), async (req, res, next) => {
  try {
    const record = await CrisisReport.findById(req.params.id).populate('reportedBy', 'name role organization');
    if (!record) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  checkPermission('crisis', 'write'),
  [
    body('title').notEmpty(),
    body('category').isIn(['price_volatility', 'supply_shock', 'geopolitical', 'infrastructure_failure', 'natural_disaster', 'other']),
    body('fuelType').isIn(['coal', 'crude_oil', 'natural_gas', 'multiple']),
    body('severity').isIn(['low', 'moderate', 'high', 'critical']),
    body('description').notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const record = await CrisisReport.create({ ...req.body, reportedBy: req.user._id });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', protect, checkPermission('crisis', 'write'), async (req, res, next) => {
  try {
    const record = await CrisisReport.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Report not found' });
    Object.assign(record, req.body);
    if (req.body.status === 'closed' || req.body.status === 'mitigated') {
      record.resolvedAt = record.resolvedAt || new Date();
    }
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, checkPermission('crisis', 'write'), async (req, res, next) => {
  try {
    const record = await CrisisReport.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
