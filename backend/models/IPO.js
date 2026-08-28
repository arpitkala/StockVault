const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company:          { type: String, required: true },
  symbol:           { type: String, required: true, uppercase: true },
  sector:           String,
  exchange:         { type: String, default: 'NSE' },
  issuePrice:       Number,
  priceLow:         Number,    // Price band low
  priceHigh:        Number,    // Price band high
  currentPrice:     Number,
  lotSize:          Number,
  openDate:         Date,
  closeDate:        Date,
  listingDate:      Date,
  allotmentDate:    Date,
  refundDate:       Date,
  creditDate:       Date,
  issueSize:        Number,    // in crores
  subscribed:       Number,    // overall times
  retailSubscribed: Number,    // retail category subscription times
  hniSubscribed:    Number,    // HNI category
  qibSubscribed:    Number,    // QIB category
  retailQuota:      { type: Number, default: 35 },  // % for retail
  hniQuota:         { type: Number, default: 15 },   // % for HNI
  qibQuota:         { type: Number, default: 50 },   // % for QIB
  minBidLots:       { type: Number, default: 1 },
  maxBidLots:       { type: Number, default: 13 },
  status:           { type: String, enum: ['Open','Upcoming','Listed','Closed'], default: 'Upcoming' },
  gmp:              { type: Number, default: 0 },    // Grey market premium
  rating:           { type: Number, min: 1, max: 5 },
  about:            String,     // Company description
  registrar:        String,     // Registrar name
  leadManagers:     [String],   // Lead managers
  pros:             [String],
  cons:             [String],
  objects:          [String],   // Objects of the issue
  ipoType:         { type: String, enum: ['Mainboard', 'SME'], default: 'Mainboard' },
  faceValue:       { type: Number, default: 10 },
  createdAt:       { type: Date, default: Date.now },
});

s.index({ symbol: 1 }, { unique: true });
s.index({ status: 1, openDate: -1 });

module.exports = mongoose.model('IPO', s);
