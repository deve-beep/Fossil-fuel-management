const express = require('express');
const { body, validationResult } = require('express-validator');
const Reserve = require('../models/Reserve');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(', ') });
  next();
};

router.get('/', protect, checkPermission('reserves', 'read'), async (req, res, next) => {
  try {
    const { fuelType, status } = req.query;
    const filter = {};
    if (fuelType) filter.fuelType = fuelType;
    if (status) filter.status = status;
    const records = await Reserve.find(filter).sort({ fuelType: 1, facilityName: 1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', protect, checkPermission('reserves', 'read'), async (req, res, next) => {
  try {
    const alerts = await Reserve.find({ status: { $in: ['critical', 'low'] } });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  checkPermission('reserves', 'write'),
  [
    body('fuelType').isIn(['coal', 'crude_oil', 'natural_gas']),
    body('facilityName').notEmpty(),
    body('location').notEmpty(),
    body('capacity').isFloat({ min: 0 }),
    body('currentStock').isFloat({ min: 0 }),
    body('unit').notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const record = await Reserve.create({ ...req.body, updatedBy: req.user._id });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', protect, checkPermission('reserves', 'write'), async (req, res, next) => {
  try {
    const record = await Reserve.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Facility not found' });
    Object.assign(record, req.body, { updatedBy: req.user._id, lastAudited: new Date() });
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, checkPermission('reserves', 'write'), async (req, res, next) => {
  try {
    const record = await Reserve.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Facility not found' });
    res.json({ success: true, message: 'Facility record deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
