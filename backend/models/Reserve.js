const mongoose = require('mongoose');

const ReserveSchema = new mongoose.Schema(
  {
    fuelType: { type: String, enum: ['coal', 'crude_oil', 'natural_gas'], required: true, index: true },
    facilityName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    daysOfCoverEstimate: { type: Number, min: 0 },
    status: { type: String, enum: ['critical', 'low', 'adequate', 'surplus'], default: 'adequate' },
    lastAudited: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ReserveSchema.pre('save', function (next) {
  const pct = this.capacity > 0 ? (this.currentStock / this.capacity) * 100 : 0;
  if (pct < 20) this.status = 'critical';
  else if (pct < 45) this.status = 'low';
  else if (pct < 85) this.status = 'adequate';
  else this.status = 'surplus';
  next();
});

module.exports = mongoose.model('Reserve', ReserveSchema);
