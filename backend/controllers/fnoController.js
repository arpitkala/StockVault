const User  = require('../models/User');
const Stock = require('../models/Stock');
const Order = require('../models/Order');

const LOT_SIZES = {
  NIFTY: 50,  NIFTY50: 50, BANKNIFTY: 15, RELIANCE: 250, TCS: 150,
  HDFCBANK: 550, ICICIBANK: 700, INFY: 300, SBIN: 1500,
  BAJFINANCE: 125, WIPRO: 400, AXISBANK: 625, KOTAKBANK: 200,
  MARUTI: 9, TATAMOTORS: 900, SUNPHARMA: 350, DEFAULT: 100,
};

// ── Get Options Chain ──────────────────────────────────────────────────────
const MarketIndex = require('../models/MarketIndex');

const getOptionsChain = async (req, res) => {
  try {
    const { symbol, expiry } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const sym = symbol.toUpperCase();

    // Check stocks first, then indices
    let spot = null;
    let name = sym;

    const stock = await Stock.findOne({ symbol: sym });
    if (stock) {
      spot = stock.currentPrice;
      name = stock.name;
    } else {
      const index = await MarketIndex.findOne({ symbol: sym });
      if (index) {
        spot = index.currentValue;
        name = index.name;
      }
    }

    if (!spot) return res.status(404).json({ error: `${sym} not found in stocks or indices` });
    const lotSize = LOT_SIZES[symbol.toUpperCase()] || LOT_SIZES.DEFAULT;

    const expiries       = generateExpiries();
    const selectedExpiry = expiry || expiries[0];
    const strikes        = generateStrikes(spot);

    const chain = strikes.map(strike => {
      const dte      = getDTE(selectedExpiry);
      const callPrem = calcPremium(spot, strike, dte, 'CALL');
      const putPrem  = calcPremium(spot, strike, dte, 'PUT');
      const callIV   = calcIV(spot, strike, 'CALL');
      const putIV    = calcIV(spot, strike, 'PUT');
      const isATM    = Math.abs(strike - spot) < spot * 0.01;

      return {
        strike,
        isATM,
        call: {
          premium: +callPrem.toFixed(2),
          iv:      +callIV.toFixed(2),
          change:  +(Math.random() * 20 - 5).toFixed(2),
          volume:  Math.floor(Math.random() * 50000 + 500),
          oi:      Math.floor(Math.random() * 200000 + 10000),
        },
        put: {
          premium: +putPrem.toFixed(2),
          iv:      +putIV.toFixed(2),
          change:  +(Math.random() * 20 - 5).toFixed(2),
          volume:  Math.floor(Math.random() * 50000 + 500),
          oi:      Math.floor(Math.random() * 200000 + 10000),
        },
      };
    });

    res.json({
      success: true,
      symbol:  symbol.toUpperCase(),
      name,
      spot,
      lotSize,
      expiries,
      selectedExpiry,
      chain,
    });
  } catch (e) {
    console.error('getOptionsChain error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── Place F&O Order ────────────────────────────────────────────────────────
const placeFnOOrder = async (req, res) => {
  try {
    const {
      symbol, optionType, strikePrice, expiry,
      action, lots, premium, segment = 'NRML',
    } = req.body;

    if (!symbol || !optionType || !strikePrice || !expiry || !action || !lots || !premium)
      return res.status(400).json({ error: 'All fields are required' });

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    const user    = await User.findById(req.user.id);
    const lotSize = LOT_SIZES[symbol.toUpperCase()] || LOT_SIZES.DEFAULT;
    const qty     = Number(lots) * lotSize;
    const totalAmount = +(Number(premium) * qty).toFixed(2);

    if (user.balance < totalAmount) {
      return res.status(400).json({
        error: `Insufficient balance. Required: ₹${totalAmount.toLocaleString('en-IN')}, Available: ₹${user.balance.toLocaleString('en-IN')}`,
      });
    }

    const balanceBefore = user.balance;
    const balanceAfter  = +(user.balance - totalAmount).toFixed(2);

    await User.findByIdAndUpdate(user._id, { balance: balanceAfter });

    const order = await Order.create({
      user:         user._id,
      symbol:       symbol.toUpperCase(),
      stockName:    stock.name,
      type:         `${action}_${optionType}`,
      segment,
      quantity:     qty,
      price:        Number(premium),
      totalAmount,
      status:       'EXECUTED',
      isFnO:        true,
      optionType,
      strikePrice:  Number(strikePrice),
      expiryDate:   new Date(expiry),
      lotSize,
      premium:      Number(premium),
      balanceBefore,
      balanceAfter,
    });

    res.status(201).json({
      success:    true,
      message:    `${action} ${lots} lot(s) of ${symbol} ${strikePrice} ${optionType} @ ₹${premium}`,
      order,
      newBalance: balanceAfter,
    });
  } catch (e) {
    console.error('placeFnOOrder error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
function generateExpiries() {
  const expiries = [];
  const now = new Date();
  // Next 6 Thursdays (weekly expiry)
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    const daysUntilThursday = (4 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilThursday + i * 7);
    expiries.push(d.toISOString().slice(0, 10));
  }
  // Add monthly expiries (last Thursday of month)
  const monthly = [];
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m + 1, 0);
    while (d.getDay() !== 4) d.setDate(d.getDate() - 1);
    monthly.push(d.toISOString().slice(0, 10));
  }
  return [...new Set([...expiries.slice(0, 6), ...monthly])].sort().slice(0, 8);
}

function generateStrikes(spot) {
  const interval = spot < 100 ? 5 : spot < 500 ? 10 : spot < 2000 ? 50 : spot < 5000 ? 100 : 200;
  const atm      = Math.round(spot / interval) * interval;
  return Array.from({ length: 21 }, (_, i) => +(atm + (i - 10) * interval).toFixed(0));
}

function getDTE(expiryStr) {
  return Math.max(1, Math.ceil((new Date(expiryStr) - new Date()) / 86400000));
}

function calcPremium(spot, strike, dte, type) {
  const t  = dte / 365;
  const iv = 0.18 + Math.random() * 0.12;
  const r  = 0.065;
  const d1 = (Math.log(spot / strike) + (r + iv * iv / 2) * t) / (iv * Math.sqrt(t));
  const d2 = d1 - iv * Math.sqrt(t);
  if (type === 'CALL') {
    return Math.max(0.05, spot * N(d1) - strike * Math.exp(-r * t) * N(d2));
  }
  return Math.max(0.05, strike * Math.exp(-r * t) * N(-d2) - spot * N(-d1));
}

function calcIV(spot, strike, type) {
  const base   = 16 + Math.random() * 10;
  const moneyness = spot / strike;
  const skew   = type === 'PUT'
    ? (moneyness > 1.02 ? 4 : moneyness < 0.98 ? -2 : 0)
    : (moneyness < 0.98 ? 4 : moneyness > 1.02 ? -2 : 0);
  return Math.max(8, base + skew + Math.random() * 3);
}

function N(x) {
  const a = [0.2316419, 0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const t = 1 / (1 + a[0] * Math.abs(x));
  const p = t * (a[1] + t * (a[2] + t * (a[3] + t * (a[4] + t * a[5]))));
  const pdf = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * p;
  return x >= 0 ? cdf : 1 - cdf;
}

module.exports = { getOptionsChain, placeFnOOrder };