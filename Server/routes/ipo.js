// routes/ipo.js
const express = require('express');
const { getIPOs, getIPOBySymbol, applyIPO } = require('../controllers/ipoController');
const { protect } = require('../middleware/auth');
const r = express.Router();
r.get('/', protect, getIPOs);
r.get('/:symbol', protect, getIPOBySymbol);
r.post('/apply/:id', protect, applyIPO);
module.exports = r;
