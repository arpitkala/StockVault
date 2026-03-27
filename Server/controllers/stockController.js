const Stock = require('../models/Stock');
const { seedStocks, generateCandlestickData } = require('../services/stockService');

// @desc    Get all stocks (with optional search)
// @route   GET /api/stocks
const getAllStocks = async (req, res) => {
  try {
    await seedStocks(); // Ensure data exists

    const { search, sector, limit = 50 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (sector) {
      query.sector = sector;
    }

    const stocks = await Stock.find(query)
      .select('-priceHistory')
      .limit(parseInt(limit))
      .sort({ marketCap: -1 });

    res.json({ success: true, count: stocks.length, stocks });
  } catch (error) {
    console.error('getAllStocks error:', error);
    res.status(500).json({ error: 'Error fetching stocks.' });
  }
};

// @desc    Get single stock by symbol
// @route   GET /api/stocks/:symbol
const getStockBySymbol = async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    // Generate candlestick data for chart
    const candlestickData = generateCandlestickData(stock.currentPrice, 365);

    res.json({
      success: true,
      stock: {
        ...stock.toObject(),
        candlestickData,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stock.' });
  }
};

// @desc    Get top gainers and losers
// @route   GET /api/stocks/market/movers
const getMarketMovers = async (req, res) => {
  try {
    const gainers = await Stock.find({ changePercent: { $gt: 0 } })
      .select('symbol name currentPrice change changePercent sector')
      .sort({ changePercent: -1 })
      .limit(5);

    const losers = await Stock.find({ changePercent: { $lt: 0 } })
      .select('symbol name currentPrice change changePercent sector')
      .sort({ changePercent: 1 })
      .limit(5);

    const mostActive = await Stock.find()
      .select('symbol name currentPrice change changePercent volume')
      .sort({ volume: -1 })
      .limit(5);

    res.json({ success: true, gainers, losers, mostActive });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching market movers.' });
  }
};

// @desc    Get stocks by sector
// @route   GET /api/stocks/sectors/list
const getSectors = async (req, res) => {
  try {
    const sectors = await Stock.distinct('sector');
    res.json({ success: true, sectors });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sectors.' });
  }
};

module.exports = { getAllStocks, getStockBySymbol, getMarketMovers, getSectors };
