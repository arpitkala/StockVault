// routes/ipo.js
const express = require('express');
const {
  getIPOs,
  getIPOStats,
  getMyApplications,
  getIPOBySymbol,
  getIPOSubscriptionStatus,
  getIPOTimeline,
  applyIPO,
  cancelIPOApplication,
} = require('../controllers/ipoController');
const { protect } = require('../middleware/auth');

const r = express.Router();

// ── List & Stats ──
r.get('/',                     protect, getIPOs);
r.get('/stats',                protect, getIPOStats);
r.get('/my-applications',      protect, getMyApplications);

// ── Single IPO ──
r.get('/:symbol',              protect, getIPOBySymbol);
r.get('/:symbol/subscription', protect, getIPOSubscriptionStatus);
r.get('/:symbol/timeline',     protect, getIPOTimeline);

// ── Actions ──
r.post('/apply/:id',           protect, applyIPO);
r.delete('/cancel/:applicationId', protect, cancelIPOApplication);

module.exports = r;
