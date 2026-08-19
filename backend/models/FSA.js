const mongoose = require('mongoose');

const FSASchema = new mongoose.Schema(
  {
    agreementCode: { type: String, required: true, unique: true, trim: true },
    fuelType: { type: String, enum: ['coal', 'crude_oil', 'natural_gas'], required: true },
    supplier: { type: String, required: true, trim: true },
    consumer: { type: String, required: true, trim: true },
    consumerSector: { type: String, enum: ['power', 'steel', 'cement', 'fertilizer', 'city_gas', 'refining', 'other'], required: true },
    annualContractedQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    tenureStart: { type: Date, required: true },
    tenureEnd: { type: Date, required: true },
    pricingBasis: { type: String, trim: true, default: 'Notified/Index-linked' },
    suppliedTillDate: { type: Number, min: 0, default: 0 },
    complianceStatus: { type: String, enum: ['compliant', 'shortfall', 'under_review', 'terminated'], default: 'compliant' },
    status: { type: String, enum: ['draft', 'pending_approval', 'active', 'expired', 'cancelled'], default: 'draft' },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

FSASchema.virtual('fulfilmentPct').get(function () {
  return this.annualContractedQuantity > 0
    ? +((this.suppliedTillDate / this.annualContractedQuantity) * 100).toFixed(1)
    : 0;
});
FSASchema.set('toJSON', { virtuals: true });
FSASchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FSA', FSASchema);
