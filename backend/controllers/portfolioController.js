const Portfolio = require('../models/Portfolio');
const Stock = require('../models/Stock');
const User = require('../models/User');

// @desc    Get user portfolio with live P&L
// @route   GET /api/portfolio
const getPortfolio = async (req, res) => {
  try {
    const holdings = await Portfolio.find({ user: req.user.id });
    const user = await User.findById(req.user.id);

    if (holdings.length === 0) {
      return res.json({
        success: true,
        holdings: [],
        summary: {
          totalInvested: 0,
          currentValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          cashBalance: user.balance,
          totalPortfolioValue: user.balance,
        },
      });
    }

    // Get live prices for all holdings
    const symbols = holdings.map((h) => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } }).select('symbol currentPrice changePercent change');

    const stockMap = {};
    stocks.forEach((s) => {
      stockMap[s.symbol] = s;
    });

    let totalInvested = 0;
    let currentValue = 0;

    const holdingsWithPnL = holdings.map((holding) => {
      const stock = stockMap[holding.symbol];
      const livePrice = stock ? stock.currentPrice : holding.avgBuyPrice;
      const holdingValue = livePrice * holding.quantity;
      const pnl = holdingValue - holding.totalInvested;
      const pnlPercent = ((pnl / holding.totalInvested) * 100);

      totalInvested += holding.totalInvested;
      currentValue += holdingValue;

      return {
        ...holding.toObject(),
        currentPrice: livePrice,
        currentValue: parseFloat(holdingValue.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        dayChange: stock ? stock.change : 0,
        dayChangePercent: stock ? stock.changePercent : 0,
      };
    });

    const totalPnL = currentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    res.json({
      success: true,
      holdings: holdingsWithPnL,
      summary: {
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        totalPnLPercent: parseFloat(totalPnLPercent.toFixed(2)),
        cashBalance: user.balance,
        totalPortfolioValue: parseFloat((currentValue + user.balance).toFixed(2)),
      },
    });
  } catch (error) {
    console.error('getPortfolio error:', error);
    res.status(500).json({ error: 'Error fetching portfolio.' });
  }
};

// @desc    Get lightweight portfolio summary
// @route   GET /api/portfolio/summary
const getPortfolioSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const holdings = await Portfolio.find({ user: req.user.id });

    if (holdings.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalInvested: 0,
          currentValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          cashBalance: user.balance,
          totalPortfolioValue: user.balance,
          holdingCount: 0,
        },
      });
    }

    const symbols = holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } }).select('symbol currentPrice');
    const priceMap = {};
    stocks.forEach(s => { priceMap[s.symbol] = s.currentPrice; });

    let totalInvested = 0;
    let currentValue = 0;
    holdings.forEach(h => {
      totalInvested += h.totalInvested;
      currentValue += (priceMap[h.symbol] || h.avgBuyPrice) * h.quantity;
    });

    const totalPnL = currentValue - totalInvested;

    res.json({
      success: true,
      summary: {
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        totalPnLPercent: totalInvested > 0 ? parseFloat(((totalPnL / totalInvested) * 100).toFixed(2)) : 0,
        cashBalance: user.balance,
        totalPortfolioValue: parseFloat((currentValue + user.balance).toFixed(2)),
        holdingCount: holdings.length,
      },
    });
  } catch (error) {
    console.error('getPortfolioSummary error:', error);
    res.status(500).json({ error: 'Error fetching portfolio summary.' });
  }
};

// @desc    Get single holding detail
// @route   GET /api/portfolio/:symbol
const getHoldingDetail = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const holding = await Portfolio.findOne({ user: req.user.id, symbol });

    if (!holding) {
      return res.status(404).json({ error: `No holding found for ${symbol}` });
    }

    const stock = await Stock.findOne({ symbol }).select('symbol name currentPrice change changePercent high low volume priceHistory');
    const livePrice = stock ? stock.currentPrice : holding.avgBuyPrice;
    const holdingValue = livePrice * holding.quantity;
    const pnl = holdingValue - holding.totalInvested;
    const pnlPercent = (pnl / holding.totalInvested) * 100;

    // Get order history for this holding
    const Order = require('../models/Order');
    const orders = await Order.find({
      user: req.user.id,
      symbol,
    }).sort({ createdAt: -1 }).limit(20);

    res.json({
      success: true,
      holding: {
        ...holding.toObject(),
        currentPrice: livePrice,
        currentValue: parseFloat(holdingValue.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        dayChange: stock ? stock.change : 0,
        dayChangePercent: stock ? stock.changePercent : 0,
      },
      stock: stock || null,
      recentOrders: orders,
    });
  } catch (error) {
    console.error('getHoldingDetail error:', error);
    res.status(500).json({ error: 'Error fetching holding detail.' });
  }
};

module.exports = { getPortfolio, getPortfolioSummary, getHoldingDetail };
