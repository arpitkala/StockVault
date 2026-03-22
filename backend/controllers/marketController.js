const MarketIndex = require('../models/MarketIndex');
const Stock = require('../models/Stock');

const getIndices = async (req, res) => {
  try {
    const indices = await MarketIndex.find({}).select('-candlestickData');
    res.json({ success: true, indices });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getIndexChart = async (req, res) => {
  try {
    const idx = await MarketIndex.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!idx) return res.status(404).json({ error: 'Index not found' });
    const { period = '1M' } = req.query;
    const slices = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const n = slices[period] || 30;
    const data = idx.candlestickData.slice(-n);
    res.json({ success: true, data, index: { ...idx.toObject(), candlestickData: undefined } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

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

module.exports = { getIndices, getIndexChart, getMarketMovers };
