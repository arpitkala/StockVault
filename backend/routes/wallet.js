const express = require('express');
const { createRazorpayOrder, depositFunds, withdrawFunds, getWalletDetails } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const r = express.Router();

r.get('/', protect, getWalletDetails);
r.post('/deposit', protect, depositFunds);
r.post('/withdraw', protect, withdrawFunds);
r.post('/razorpay/order', protect, createRazorpayOrder);

module.exports = r;
