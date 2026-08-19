const mongoose = require('mongoose');

const LogisticsSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ['rail_rake', 'pipeline', 'coastal_shipping', 'road'], required: true, index: true },
    fuelType: { type: String, enum: ['coal', 'crude_oil', 'natural_gas', 'petroleum_products'], required: true },
    routeName: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    rakesPlanned: { type: Number, min: 0, default: 0 },
    rakesDispatched: { type: Number, min: 0, default: 0 },
    pipelineCapacity: { type: Number, min: 0, default: 0 },
    pipelineThroughput: { type: Number, min: 0, default: 0 },
    utilizationPct: { type: Number, min: 0, max: 100 },
    status: { type: String, enum: ['on_schedule', 'delayed', 'disrupted', 'maintenance'], default: 'on_schedule' },
    delayReason: { type: String, trim: true, default: '' },
    reportDate: { type: Date, required: true, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

LogisticsSchema.pre('save', function (next) {
  if (this.mode === 'rail_rake' && this.rakesPlanned > 0) {
    this.utilizationPct = +((this.rakesDispatched / this.rakesPlanned) * 100).toFixed(1);
  } else if (this.pipelineCapacity > 0) {
    this.utilizationPct = +((this.pipelineThroughput / this.pipelineCapacity) * 100).toFixed(1);
  }
  next();
});

module.exports = mongoose.model('Logistics', LogisticsSchema);
