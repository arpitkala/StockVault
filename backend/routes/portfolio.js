// routes/portfolio.js
const express = require('express');
const { getPortfolio, getPortfolioSummary, getHoldingDetail } = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/',            protect, getPortfolio);
router.get('/summary',     protect, getPortfolioSummary);
router.get('/:symbol',     protect, getHoldingDetail);

module.exports = router;
