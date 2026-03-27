const express = require('express');
const { getFunds, getFundById, calculateSIP } = require('../controllers/sipController');
const { protect } = require('../middleware/auth');
const r = express.Router();
r.get('/funds', protect, getFunds);
r.get('/funds/:id', protect, getFundById);
r.get('/calculate', protect, calculateSIP);
module.exports = r;
