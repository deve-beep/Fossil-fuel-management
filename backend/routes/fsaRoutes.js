const express = require('express');
const { body, validationResult } = require('express-validator');
const FSA = require('../models/FSA');
const { protect, checkPermission } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join(', ') });
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: 'Only government administrators can perform this action.' });
  }
  next();
};

router.get('/', protect, checkPermission('fsa', 'read'), async (req, res, next) => {
  try {
    const { fuelType, status, consumerSector } = req.query;
    const filter = {};
    if (fuelType) filter.fuelType = fuelType;
    if (status) filter.status = status;
    if (consumerSector) filter.consumerSector = consumerSector;
    if (req.user.role === ROLES.STAKEHOLDER && req.user.organization) {
      filter.consumer = req.user.organization;
    }
    const records = await FSA.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, checkPermission('fsa', 'read'), async (req, res, next) => {
  try {
    const record = await FSA.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Agreement not found' });
    if (req.user.role === ROLES.STAKEHOLDER && record.consumer !== req.user.organization) {
      return res.status(403).json({ success: false, message: "Forbidden. Not your organization's agreement." });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  checkPermission('fsa', 'write'),
  [
    body('agreementCode').notEmpty(),
    body('fuelType').isIn(['coal', 'crude_oil', 'natural_gas']),
    body('supplier').notEmpty(),
    body('consumer').notEmpty(),
    body('consumerSector').isIn(['power', 'steel', 'cement', 'fertilizer', 'city_gas', 'refining', 'other']),
    body('annualContractedQuantity').isFloat({ min: 0 }),
    body('unit').notEmpty(),
    body('tenureStart').isISO8601(),
    body('tenureEnd').isISO8601()
  ],
  validate,
  async (req, res, next) => {
    try {
      const payload = { ...req.body, proposedBy: req.user._id };
      if (req.user.role === ROLES.STAKEHOLDER) {
        payload.status = 'pending_approval';
        payload.consumer = req.user.organization || req.body.consumer;
      }
      const record = await FSA.create(payload);
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id/approve', protect, adminOnly, async (req, res, next) => {
  try {
    const record = await FSA.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Agreement not found' });
    record.status = 'active';
    record.approvedBy = req.user._id;
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, checkPermission('fsa', 'write'), async (req, res, next) => {
  try {
    const record = await FSA.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Agreement not found' });
    if (req.user.role === ROLES.STAKEHOLDER && record.consumer !== req.user.organization) {
      return res.status(403).json({ success: false, message: "Forbidden. Not your organization's agreement." });
    }
    Object.assign(record, req.body);
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const record = await FSA.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Agreement not found' });
    res.json({ success: true, message: 'Agreement deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
