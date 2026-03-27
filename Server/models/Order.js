const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  stockName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL', 'BUY_CE', 'SELL_CE', 'BUY_PE', 'SELL_PE'],
    required: true,
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT'],
    default: 'MARKET',
  },
  // ── Segment ──────────────────────────────
  segment: {
    type: String,
    enum: ['CNC', 'MIS', 'NRML'],
    default: 'CNC',
  },
  // ── F&O Fields ───────────────────────────
  isFnO: {
    type: Boolean,
    default: false,
  },
  optionType: {
    type: String,
    enum: ['CE', 'PE', null],
    default: null,
  },
  strikePrice: {
    type: Number,
    default: null,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  lotSize: {
    type: Number,
    default: 1,
  },
  premium: {
    type: Number,
    default: null,
  },
  // ─────────────────────────────────────────
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
  },
  limitPrice: {
    type: Number,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'FAILED'],
    default: 'EXECUTED',
  },
  balanceBefore: Number,
  balanceAfter:  Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, symbol: 1 });

module.exports = mongoose.model('Order', orderSchema);