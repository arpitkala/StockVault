// routes/fno.js — Futures & Options
const express = require('express');
const {
  getOptionsChain,
  placeFnOOrder,
  getFnOPositions,
  getExpiries,
  getLotSizes,
} = require('../controllers/fnoController');
const { protect } = require('../middleware/auth');

const r = express.Router();

r.get('/chain',      protect, getOptionsChain);
r.post('/order',     protect, placeFnOOrder);
r.get('/positions',  protect, getFnOPositions);
r.get('/expiries',   protect, getExpiries);
r.get('/lot-sizes',  protect, getLotSizes);

module.exports = r;
