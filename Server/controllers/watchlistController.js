const User = require('../models/User');
const Stock = require('../models/Stock');

// @desc    Get user watchlist with live prices
// @route   GET /api/watchlist
const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.watchlist || user.watchlist.length === 0) {
      return res.json({ success: true, watchlist: [] });
    }

    const stocks = await Stock.find({ symbol: { $in: user.watchlist } })
      .select('symbol name currentPrice change changePercent high low volume sector');

    res.json({ success: true, watchlist: stocks });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching watchlist.' });
  }
};

// @desc    Add stock to watchlist
// @route   POST /api/watchlist/:symbol
const addToWatchlist = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    const user = await User.findById(req.user.id);
    if (user.watchlist.includes(symbol)) {
      return res.status(400).json({ error: 'Stock already in watchlist.' });
    }

    if (user.watchlist.length >= 20) {
      return res.status(400).json({ error: 'Watchlist limit reached (20 stocks max).' });
    }

    await User.findByIdAndUpdate(req.user.id, { $push: { watchlist: symbol } });

    res.json({ success: true, message: `${symbol} added to watchlist.` });
  } catch (error) {
    res.status(500).json({ error: 'Error adding to watchlist.' });
  }
};

// @desc    Remove stock from watchlist
// @route   DELETE /api/watchlist/:symbol
const removeFromWatchlist = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    await User.findByIdAndUpdate(req.user.id, { $pull: { watchlist: symbol } });

    res.json({ success: true, message: `${symbol} removed from watchlist.` });
  } catch (error) {
    res.status(500).json({ error: 'Error removing from watchlist.' });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
