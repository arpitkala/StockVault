const express = require('express');
const { getFunds, getFundById, calculateSIP, investInFund, getInvestments, cancelOrRedeem } = require('../controllers/sipController');
const { protect } = require('../middleware/auth');
const r = express.Router();

r.get('/funds', protect, getFunds);
r.get('/funds/:id', protect, getFundById);
r.get('/calculate', protect, calculateSIP);

r.post('/invest', protect, investInFund);
r.get('/investments', protect, getInvestments);
r.post('/investments/:id/action', protect, cancelOrRedeem);

module.exports = r;
