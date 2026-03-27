// routes/portfolio.js
const express = require('express');
const { getPortfolio } = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, getPortfolio);
module.exports = router;
