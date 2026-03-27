const express = require('express');
const { getAllStocks, getStockBySymbol, getMarketMovers, getSectors } = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getAllStocks);
router.get('/market/movers', protect, getMarketMovers);
router.get('/sectors/list', protect, getSectors);
router.get('/:symbol', protect, getStockBySymbol);

module.exports = router;
