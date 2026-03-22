const mongoose = require('mongoose');
const s = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    String,
  amc:         String,
  nav:         Number,
  returns1y:   Number,
  returns3y:   Number,
  returns5y:   Number,
  minSip:      Number,
  riskLevel:   String,
  rating:      Number,
  aum:         Number, // in crores
  navHistory:  [{ nav: Number, date: Date }],
  createdAt:   { type: Date, default: Date.now },
});
module.exports = mongoose.model('Fund', s);
