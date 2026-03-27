// routes/watchlist.js
const express = require('express');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/', protect, getWatchlist);
router.post('/:symbol', protect, addToWatchlist);
router.delete('/:symbol', protect, removeFromWatchlist);
module.exports = router;
