const Stock = require('../models/Stock');
const { generateCandlestickData } = require('../services/stockService');
const { searchYahooFinance, fetchYahooQuote, fetchHistoricalData } = require('../services/marketPriceService');

// @desc    Get all stocks (with optional search)
// @route   GET /api/stocks
const getAllStocks = async (req, res) => {
  try {
    const { search, sector, limit = 50, page = 1, sort = '-marketCap' } = req.query;
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

    let total = await Stock.countDocuments(query);

    // 🔥 DYNAMIC DISCOVERY AND CREATION:
    // If the user searches for a stock and it doesn't exist in our database,
    // we query Yahoo Finance and dynamically seed it on-the-fly!
    if (total === 0 && search && search.trim().length >= 3) {
      try {
        console.log(`[Search-Discovery] Symbol/query "${search}" not found in DB. Querying Yahoo Finance...`);
        const yahooResults = await searchYahooFinance(search);
        
        for (const yr of yahooResults.slice(0, 3)) {
          const exists = await Stock.findOne({ symbol: yr.symbol });
          if (!exists) {
            const realData = await fetchYahooQuote(yr.symbol);
            if (realData) {
              await Stock.create({
                symbol: yr.symbol,
                name: yr.name,
                sector: yr.sector || 'Unknown',
                exchange: realData.exchange === 'BSE' ? 'BSE' : 'NSE',
                currentPrice: realData.currentPrice,
                previousClose: realData.previousClose,
                change: realData.change,
                changePercent: realData.changePercent,
                open: realData.open,
                high: realData.high,
                low: realData.low,
                volume: realData.volume,
                lastUpdated: new Date(),
              });
              console.log(`[Search-Discovery] Successfully added ${yr.symbol} (${yr.name}) to database.`);
            }
          }
        }
        total = await Stock.countDocuments(query);
      } catch (err) {
        console.error('[Search-Discovery] Failed to dynamically import stock:', err.message);
      }
    }

    const stocks = await Stock.find(query)
      .select('-priceHistory -candlestickData')
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .sort(sort);

    res.json({
      success: true,
      count: stocks.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stocks,
    });
  } catch (error) {
    console.error('getAllStocks error:', error);
    res.status(500).json({ error: 'Error fetching stocks.' });
  }
};

// @desc    Search stocks (dedicated fuzzy search)
// @route   GET /api/stocks/search
const searchStocks = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 1) {
      return res.json({ success: true, results: [] });
    }

    const localResults = await Stock.find({
      $or: [
        { symbol: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { sector: { $regex: q, $options: 'i' } },
      ],
    })
      .select('symbol name sector currentPrice change changePercent')
      .limit(parseInt(limit))
      .sort({ marketCap: -1 })
      .lean();

    // Concurrently search Yahoo Finance
    const yahooResults = await searchYahooFinance(q);

    // Merge and deduplicate by symbol
    const merged = [...localResults];
    const localSymbols = new Set(localResults.map(r => r.symbol));

    yahooResults.forEach(yr => {
      if (!localSymbols.has(yr.symbol)) {
        merged.push({
          symbol: yr.symbol,
          name: yr.name,
          sector: yr.sector,
          exchange: yr.exchange,
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          isNew: true, // flag for frontend if needed
        });
        localSymbols.add(yr.symbol);
      }
    });

    res.json({ success: true, results: merged.slice(0, parseInt(limit)) });
  } catch (error) {
    console.error('searchStocks error:', error);
    res.status(500).json({ error: 'Error searching stocks.' });
  }
};

// @desc    Get single stock by symbol
// @route   GET /api/stocks/:symbol
const getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let stock = await Stock.findOne({ symbol });

    if (!stock) {
      // Not in DB, try to fetch from Yahoo Finance and insert it
      const realData = await fetchYahooQuote(symbol);
      if (!realData) {
        return res.status(404).json({ error: 'Stock not found on exchange.' });
      }

      // Create new stock record
      stock = await Stock.create({
        symbol: symbol,
        name: symbol, // Will use symbol as name initially if search didn't provide it
        sector: 'Unknown',
        exchange: realData.exchange === 'BSE' ? 'BSE' : 'NSE',
        currentPrice: realData.currentPrice,
        previousClose: realData.previousClose,
        change: realData.change,
        changePercent: realData.changePercent,
        open: realData.open,
        high: realData.high,
        low: realData.low,
        volume: realData.volume,
        lastUpdated: new Date(),
      });
      console.log(`[Dynamic Insert] Added ${symbol} to tracking database.`);
    }

    // Check if we need to fetch/update real history
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const needsHistoryUpdate = !stock.isRealHistory ||
                               !stock.candlestickData ||
                               stock.candlestickData.length === 0 ||
                               (Date.now() - new Date(stock.lastUpdated).getTime() > ONE_DAY_MS);

    let candlestickData = stock.candlestickData || [];

    if (needsHistoryUpdate) {
      try {
        const realHistory = await fetchHistoricalData(symbol);
        if (realHistory && realHistory.length > 0) {
          stock.candlestickData = realHistory;
          stock.isRealHistory = true;
          stock.lastUpdated = new Date();
          await stock.save();
          candlestickData = realHistory;
          console.log(`[Dynamic History] Loaded ${realHistory.length} real history data points for ${symbol}.`);
        }
      } catch (err) {
        console.warn(`[StockDetail] Failed to fetch real historical data for ${symbol}:`, err.message);
      }
    }

    if (candlestickData.length === 0) {
      candlestickData = generateCandlestickData(stock.currentPrice, 365);
    }

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

module.exports = { getAllStocks, searchStocks, getStockBySymbol, getMarketMovers, getSectors };
