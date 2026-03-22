const mongoose = require('mongoose');
const s = new mongoose.Schema({
  symbol:          { type: String, required: true, unique: true, uppercase: true },
  name:            String,
  sector:          String,
  industry:        String,
  exchange:        { type: String, default: 'NSE' },
  currentPrice:    Number,
  previousClose:   Number,
  change:          Number,
  changePercent:   Number,
  open:            Number,
  high:            Number,
  low:             Number,
  high52:          Number,
  low52:           Number,
  volume:          Number,
  avgVolume:       Number,
  marketCap:       Number,
  pe:              Number,
  eps:             Number,
  lotSize:         { type: Number, default: 1 },
  candlestickData: [{ date: String, open: Number, high: Number, low: Number, close: Number, volume: Number }],
  priceHistory:    [{ price: Number, timestamp: Date }],
  lastUpdated:     { type: Date, default: Date.now },
});
s.index({ symbol: 1 });
s.index({ sector: 1 });
s.index({ marketCap: -1 });
module.exports = mongoose.model('Stock', s);
