const express = require('express');
const { getIndices, getIndexChart, getMarketMovers, getMarketStatus, getSectorPerformance } = require('../controllers/marketController');
const { protect } = require('../middleware/auth');
const r = express.Router();

r.get('/indices',                protect, getIndices);
r.get('/indices/:symbol/chart',  protect, getIndexChart);
r.get('/movers',                 protect, getMarketMovers);
r.get('/status',                 protect, getMarketStatus);
r.get('/sectors',                protect, getSectorPerformance);

module.exports = r;
