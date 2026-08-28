const mongoose = require('mongoose');

const ipoApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ipo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IPO',
    required: true,
  },
  ipoSymbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  ipoCompany: {
    type: String,
    required: true,
  },
  lots: {
    type: Number,
    required: true,
    min: 1,
  },
  lotSize: {
    type: Number,
    required: true,
  },
  totalShares: {
    type: Number,
    required: true,
  },
  bidPrice: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  investorType: {
    type: String,
    enum: ['Retail', 'HNI', 'Employee', 'Shareholder'],
    default: 'Retail',
  },
  upiId: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['PENDING', 'ALLOTTED', 'NOT_ALLOTTED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
  },
  allotmentResult: {
    sharesAllotted: { type: Number, default: 0 },
    refundAmount:   { type: Number, default: 0 },
    allottedAt:     Date,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  cancelledAt: Date,
});

// One user can apply only once per IPO per investor type
ipoApplicationSchema.index({ user: 1, ipo: 1, investorType: 1 }, { unique: true });
ipoApplicationSchema.index({ user: 1, appliedAt: -1 });
ipoApplicationSchema.index({ ipo: 1, status: 1 });

module.exports = mongoose.model('IPOApplication', ipoApplicationSchema);
