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

module.exports = { getPortfolio };
