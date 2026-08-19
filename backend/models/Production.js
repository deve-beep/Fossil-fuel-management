const mongoose = require('mongoose');

const ProductionSchema = new mongoose.Schema(
  {
    fuelType: { type: String, enum: ['coal', 'crude_oil', 'natural_gas'], required: true, index: true },
    state: { type: String, required: true, trim: true },
    period: { type: String, required: true },
    unit: { type: String, required: true },
    productionActual: { type: Number, required: true, min: 0 },
    productionTarget: { type: Number, required: true, min: 0 },
    consumption: { type: Number, required: true, min: 0 },
    imports: { type: Number, required: true, min: 0, default: 0 },
    importDependencyPct: { type: Number, min: 0, max: 100 },
    source: { type: String, default: 'Ministry Reporting' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ProductionSchema.pre('save', function (next) {
  const totalSupply = this.productionActual + this.imports;
  this.importDependencyPct = totalSupply > 0 ? +((this.imports / totalSupply) * 100).toFixed(2) : 0;
  next();
});

ProductionSchema.index({ fuelType: 1, period: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('Production', ProductionSchema);
