const mongoose = require('mongoose');
const s = new mongoose.Schema({
  symbol:          { type: String, required: true, unique: true },
  name:            String,
  exchange:        String,
  currentValue:    Number,
  previousClose:   Number,
  change:          Number,
  changePercent:   Number,
  high:            Number,
  low:             Number,
  high52:          Number,
  low52:           Number,
  candlestickData: [{ date: String, open: Number, high: Number, low: Number, close: Number, volume: Number }],
  lastUpdated:     { type: Date, default: Date.now },
});
module.exports = mongoose.model('MarketIndex', s);
