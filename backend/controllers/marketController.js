const MarketIndex = require('../models/MarketIndex');
const Stock = require('../models/Stock');
const { isMarketOpen, fetchHistoricalData } = require('../services/marketPriceService');

// ── Get all indices ───────────────────────────────────────────────────────────
const getIndices = async (req, res) => {
  try {
    const indices = await MarketIndex.find({}).select('-candlestickData');
    res.json({ success: true, indices });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Get index chart data ──────────────────────────────────────────────────────
const getIndexChart = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const idx = await MarketIndex.findOne({ symbol });
    if (!idx) return res.status(404).json({ error: 'Index not found' });

    // Check if we need to fetch/update real history
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const needsHistory = !idx.isRealHistory ||
                         !idx.candlestickData ||
                         idx.candlestickData.length === 0 ||
                         (Date.now() - new Date(idx.lastUpdated).getTime() > ONE_DAY_MS);

    if (needsHistory) {
      try {
        const realHistory = await fetchHistoricalData(symbol);
        if (realHistory && realHistory.length > 0) {
          idx.candlestickData = realHistory;
          idx.isRealHistory = true;
          idx.lastUpdated = new Date();
          await idx.save();
          console.log(`[Dynamic Index History] Loaded ${realHistory.length} real history data points for index ${symbol}.`);
        }
      } catch (err) {
        console.warn(`[IndexDetail] Failed to fetch real historical data for index ${symbol}:`, err.message);
      }
    }

    // Generate fallback dummy index history if completely empty
    if (!idx.candlestickData || idx.candlestickData.length === 0) {
      const dummyHistory = [];
      let price = idx.currentValue || idx.previousClose || 20000;
      const now = Date.now();
      for (let i = 365; i >= 0; i--) {
        const change = (Math.random() - 0.48) * 0.02;
        const open = price;
        const close = parseFloat((open * (1 + change)).toFixed(2));
        const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.01)).toFixed(2));
        const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.01)).toFixed(2));
        dummyHistory.push({
          date: new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open, high, low, close, volume: 0
        });
        price = close;
      }
      idx.candlestickData = dummyHistory;
      await idx.save();
    }

    const { period = '1M' } = req.query;
    const slices = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const n = slices[period] || 30;
    const data = idx.candlestickData.slice(-n);
    res.json({ success: true, data, index: { ...idx.toObject(), candlestickData: undefined } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Get market movers ─────────────────────────────────────────────────────────
const getMarketMovers = async (req, res) => {
  try {
    const gainers = await Stock.find({ changePercent: { $gt: 0 } })
      .select('symbol name currentPrice change changePercent sector volume marketCap')
      .sort({ changePercent: -1 }).limit(10);
    const losers = await Stock.find({ changePercent: { $lt: 0 } })
      .select('symbol name currentPrice change changePercent sector volume marketCap')
      .sort({ changePercent: 1 }).limit(10);
    const mostActive = await Stock.find()
      .select('symbol name currentPrice change changePercent volume sector')
      .sort({ volume: -1 }).limit(10);
    res.json({ success: true, gainers, losers, mostActive });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Get market status (open/closed) ───────────────────────────────────────────
const getMarketStatus = async (req, res) => {
  try {
    const open = isMarketOpen();

    // Get IST time
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const istDay = istTime.getUTCDay();
    const istHour = istTime.getUTCHours();
    const istMin = istTime.getUTCMinutes();

    let nextOpenTime = null;
    if (!open) {
      // Calculate next market open
      const next = new Date(istTime);
      if (istDay === 6) {
        // Saturday → Monday 9:15 AM
        next.setUTCDate(next.getUTCDate() + 2);
      } else if (istDay === 0) {
        // Sunday → Monday 9:15 AM
        next.setUTCDate(next.getUTCDate() + 1);
      } else if (istHour >= 15 && istMin >= 30) {
        // After 3:30 PM → next business day
        if (istDay === 5) {
          next.setUTCDate(next.getUTCDate() + 3); // Friday → Monday
        } else {
          next.setUTCDate(next.getUTCDate() + 1);
        }
      }
      next.setUTCHours(9, 15, 0, 0);
      nextOpenTime = new Date(next.getTime() - istOffset).toISOString();
    }

    res.json({
      success: true,
      market: {
        isOpen: open,
        status: open ? 'OPEN' : 'CLOSED',
        exchange: 'NSE',
        tradingHours: '9:15 AM - 3:30 PM IST',
        currentTimeIST: `${String(istHour).padStart(2, '0')}:${String(istMin).padStart(2, '0')}`,
        dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][istDay],
        nextOpen: nextOpenTime,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── Get sector performance ────────────────────────────────────────────────────
const getSectorPerformance = async (req, res) => {
  try {
    const sectors = await Stock.aggregate([
      {
        $group: {
          _id: '$sector',
          avgChangePercent: { $avg: '$changePercent' },
          stockCount: { $sum: 1 },
          totalVolume: { $sum: '$volume' },
          totalMarketCap: { $sum: '$marketCap' },
          topGainer: {
            $max: {
              changePercent: '$changePercent',
              symbol: '$symbol',
              name: '$name',
            },
          },
        },
      },
      { $sort: { avgChangePercent: -1 } },
    ]);

    const sectorData = sectors.map(s => ({
      sector: s._id,
      avgChangePercent: parseFloat((s.avgChangePercent || 0).toFixed(2)),
      stockCount: s.stockCount,
      totalVolume: s.totalVolume,
      totalMarketCap: s.totalMarketCap,
    }));

    res.json({ success: true, sectors: sectorData });
  } catch (e) {
    console.error('getSectorPerformance error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getIndices, getIndexChart, getMarketMovers, getMarketStatus, getSectorPerformance };
