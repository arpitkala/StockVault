const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company:     { type: String, required: true },
  symbol:      { type: String, required: true, uppercase: true },
  sector:      String,
  exchange:    { type: String, default: 'NSE' },
  issuePrice:  Number,
  currentPrice:Number,
  lotSize:     Number,
  openDate:    Date,
  closeDate:   Date,
  listingDate: Date,
  issueSize:   Number, // in crores
  subscribed:  Number, // times
  status:      { type: String, enum: ['Open','Upcoming','Listed','Closed'], default: 'Upcoming' },
  gmp:         { type: Number, default: 0 }, // Grey market premium
  rating:      { type: Number, min: 1, max: 5 },
  pros:        [String],
  cons:        [String],
  objects:     [String],
  createdAt:   { type: Date, default: Date.now },
});
module.exports = mongoose.model('IPO', s);
