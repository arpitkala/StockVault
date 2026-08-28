const mongoose = require('mongoose');

const fundInvestmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fund: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fund',
    required: true,
  },
  fundName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['SIP', 'LUMPSUM'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 100,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'CANCELLED', 'REDEEMED'],
    default: 'ACTIVE',
  },
  units: {
    type: Number,
    default: 0,
  },
  totalInvested: {
    type: Number,
    default: 0,
  },
  nextInstallmentDate: {
    type: Date,
  },
  transactions: [
    {
      amount: Number,
      units: Number,
      nav: Number,
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ['BUY', 'SELL'] }
    }
  ],
  startDate: {
    type: Date,
    default: Date.now,
  },
  lastInstallmentDate: {
    type: Date,
    default: Date.now,
  }
});

fundInvestmentSchema.index({ user: 1, fund: 1, type: 1, status: 1 });

module.exports = mongoose.model('FundInvestment', fundInvestmentSchema);
