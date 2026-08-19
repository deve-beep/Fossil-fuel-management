const mongoose = require('mongoose');

const CrisisReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['price_volatility', 'supply_shock', 'geopolitical', 'infrastructure_failure', 'natural_disaster', 'other'], required: true },
    fuelType: { type: String, enum: ['coal', 'crude_oil', 'natural_gas', 'multiple'], required: true },
    severity: { type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true, default: 'moderate' },
    affectedRegions: [{ type: String, trim: true }],
    description: { type: String, required: true, trim: true },
    impactSummary: { type: String, trim: true, default: '' },
    mitigationActions: [{ type: String, trim: true }],
    status: { type: String, enum: ['open', 'monitoring', 'mitigated', 'closed'], default: 'open' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CrisisReport', CrisisReportSchema);
