const express = require('express');
const { getIndices, getIndexChart, getMarketMovers } = require('../controllers/marketController');
const { protect } = require('../middleware/auth');
const r = express.Router();
r.get('/indices', protect, getIndices);
r.get('/indices/:symbol/chart', protect, getIndexChart);
r.get('/movers', protect, getMarketMovers);
module.exports = r;
