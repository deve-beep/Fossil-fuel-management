const express = require('express');
const { body, validationResult } = require('express-validator');
const Logistics = require('../models/Logistics');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(', ') });
  next();
};

router.get('/', protect, checkPermission('logistics', 'read'), async (req, res, next) => {
  try {
    const { mode, fuelType, status } = req.query;
    const filter = {};
    if (mode) filter.mode = mode;
    if (fuelType) filter.fuelType = fuelType;
    if (status) filter.status = status;
    const records = await Logistics.find(filter).sort({ reportDate: -1 }).limit(500);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.get('/disruptions', protect, checkPermission('logistics', 'read'), async (req, res, next) => {
  try {
    const records = await Logistics.find({ status: { $in: ['delayed', 'disrupted'] } }).sort({ reportDate: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  checkPermission('logistics', 'write'),
  [
    body('mode').isIn(['rail_rake', 'pipeline', 'coastal_shipping', 'road']),
    body('fuelType').isIn(['coal', 'crude_oil', 'natural_gas', 'petroleum_products']),
    body('routeName').notEmpty(),
    body('origin').notEmpty(),
    body('destination').notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const record = await Logistics.create({ ...req.body, reportedBy: req.user._id });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', protect, checkPermission('logistics', 'write'), async (req, res, next) => {
  try {
    const record = await Logistics.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Movement record not found' });
    Object.assign(record, req.body);
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, checkPermission('logistics', 'write'), async (req, res, next) => {
  try {
    const record = await Logistics.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Movement record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
