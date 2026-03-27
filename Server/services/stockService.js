const axios = require('axios');
const Stock = require('../models/Stock');

// Popular Indian + US stocks for the app
const STOCK_LIST = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', basePrice: 2450 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', basePrice: 3680 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', basePrice: 1620 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', basePrice: 1480 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', basePrice: 980 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', basePrice: 2560 },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', basePrice: 425 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', basePrice: 620 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', basePrice: 1180 },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', basePrice: 540 },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', basePrice: 1050 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', basePrice: 10200 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', basePrice: 820 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', basePrice: 1240 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance', basePrice: 6800 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', basePrice: 1780 },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure', basePrice: 3500 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', basePrice: 1350 },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer', basePrice: 3250 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer', basePrice: 2800 },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', basePrice: 2400 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Utilities', basePrice: 280 },
  { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Utilities', basePrice: 360 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', basePrice: 270 },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', basePrice: 1150 },
];

// Simulate realistic price movement (±3% max per update)
const simulatePriceChange = (currentPrice) => {
  const change = (Math.random() - 0.48) * 0.03; // slight upward bias
  return Math.max(1, currentPrice * (1 + change));
};

// Seed database with initial stock data
const seedStocks = async () => {
  try {
    const count = await Stock.countDocuments();
    if (count >= STOCK_LIST.length) {
      console.log('✅ Stocks already seeded');
      return;
    }

    console.log('🌱 Seeding stocks...');
    for (const stock of STOCK_LIST) {
      const price = stock.basePrice;
      const prevClose = price * (1 + (Math.random() - 0.5) * 0.02);
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;

      await Stock.findOneAndUpdate(
        { symbol: stock.symbol },
        {
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          exchange: 'NSE',
          currentPrice: parseFloat(price.toFixed(2)),
          previousClose: parseFloat(prevClose.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          high: parseFloat((price * 1.02).toFixed(2)),
          low: parseFloat((price * 0.98).toFixed(2)),
          open: parseFloat((price * 1.001).toFixed(2)),
          volume: Math.floor(Math.random() * 5000000) + 500000,
          marketCap: Math.floor(price * (Math.random() * 1e9 + 1e8)),
          pe: parseFloat((Math.random() * 40 + 10).toFixed(1)),
          priceHistory: Array.from({ length: 30 }, (_, i) => ({
            price: parseFloat((price * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
            timestamp: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
          })),
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${STOCK_LIST.length} stocks`);
  } catch (error) {
    console.error('Seed error:', error);
  }
};

// Update stock prices (called by cron job)
const updateStockPrices = async () => {
  try {
    const stocks = await Stock.find({});
    if (stocks.length === 0) {
      await seedStocks();
      return [];
    }

    const updates = [];
    for (const stock of stocks) {
      const newPrice = parseFloat(simulatePriceChange(stock.currentPrice).toFixed(2));
      const change = parseFloat((newPrice - stock.previousClose).toFixed(2));
      const changePercent = parseFloat(((change / stock.previousClose) * 100).toFixed(2));

      // Maintain rolling 30-point history
      const history = [...(stock.priceHistory || []), { price: newPrice, timestamp: new Date() }];
      if (history.length > 60) history.splice(0, history.length - 60);

      await Stock.findByIdAndUpdate(stock._id, {
        currentPrice: newPrice,
        change,
        changePercent,
        high: Math.max(stock.high || newPrice, newPrice),
        low: Math.min(stock.low || newPrice, newPrice),
        volume: stock.volume + Math.floor(Math.random() * 10000),
        priceHistory: history,
        lastUpdated: new Date(),
      });

      updates.push({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: newPrice,
        change,
        changePercent,
      });
    }

    return updates;
  } catch (error) {
    console.error('updateStockPrices error:', error);
    return [];
  }
};

// Try to fetch from Finnhub API (free tier)
const fetchFromFinnhub = async (symbol) => {
  try {
    if (!process.env.FINNHUB_API_KEY) return null;
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol, token: process.env.FINNHUB_API_KEY },
      timeout: 5000,
    });
    return response.data;
  } catch {
    return null;
  }
};

// Generate historical OHLC data for charts
const generateCandlestickData = (basePrice, days = 30) => {
  const data = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * 0.04;
    const close = parseFloat((open * (1 + change)).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.02)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.02)).toFixed(2));
    const volume = Math.floor(Math.random() * 3000000 + 500000);

    data.push({
      date: new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return data;
};

module.exports = { seedStocks, updateStockPrices, fetchFromFinnhub, generateCandlestickData, STOCK_LIST };
