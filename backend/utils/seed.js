require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log("🔥 file started");

// ✅ IMPORT DATA
const data = require('../data/seedData.js');

const STOCKS = data.STOCKS;
const IPOS = data.IPOS;
const MUTUAL_FUNDS = data.MUTUAL_FUNDS;
const INDICES = data.INDICES;

// ✅ IMPORT MODELS
const Stock  = require('../models/Stock');
const IPO    = require('../models/IPO');
const Fund   = require('../models/Fund');
const Index  = require('../models/MarketIndex');
const User   = require('../models/User');

// ✅ CONNECT DB (FIXED)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stockvault');
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB ERROR:', err);
    process.exit(1);
  }
};

// ✅ HISTORY GENERATOR
const genHistory = (base, days = 365) => {
  const pts = [];
  let p = base * 0.85;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const drift = (Math.random() - 0.47) * 0.025;
    p = Math.max(1, p * (1 + drift));

    const o = p;
    const c = p * (1 + (Math.random() - 0.5) * 0.02);
    const h = Math.max(o, c) * (1 + Math.random() * 0.015);
    const lo = Math.min(o, c) * (1 - Math.random() * 0.015);

    pts.push({
      date: new Date(now - i * 86400000).toISOString().slice(0, 10),
      open: +o.toFixed(2),
      high: +h.toFixed(2),
      low: +lo.toFixed(2),
      close: +c.toFixed(2),
      volume: Math.floor(Math.random() * 5e6 + 5e5),
    });

    p = c;
  }

  return pts;
};

// ✅ SEED FUNCTION
const seed = async () => {
  console.log("🚀 seeder started");

  await connectDB();

  console.log("📊 seeding stocks...");

  // ✅ STOCKS
  for (const s of STOCKS) {
    const exists = await Stock.findOne({ symbol: s.symbol });
    if (exists) continue;

    const price = s.basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const prev  = price * (1 + (Math.random() - 0.5) * 0.015);

    await Stock.create({
      ...s,
      currentPrice: +price.toFixed(2),
      previousClose: +prev.toFixed(2),
      change: +(price - prev).toFixed(2),
      changePercent: +(((price - prev) / prev) * 100).toFixed(2),
      candlestickData: genHistory(s.basePrice),
      lastUpdated: new Date(),
    });

    process.stdout.write('.');
  }

  // ✅ IPO
  for (const ipo of IPOS) {
    const exists = await IPO.findOne({ symbol: ipo.symbol });
    if (!exists) {
      await IPO.create({
        ...ipo,
        openDate: new Date(ipo.openDate),
        closeDate: new Date(ipo.closeDate),
        listingDate: new Date(ipo.listingDate),
      });
    }
  }

  // ✅ FUNDS
  for (const f of MUTUAL_FUNDS) {
    const exists = await Fund.findOne({ name: f.name });
    if (!exists) {
      await Fund.create(f);
    }
  }

  // ✅ INDICES
  for (const idx of INDICES) {
    const exists = await Index.findOne({ symbol: idx.symbol });
    if (!exists) {
      await Index.create(idx);
    }
  }

  // ✅ DEMO USER
  const demoEmail = 'demo@stockvault.in';
  const existingDemo = await User.findOne({ email: demoEmail });

  if (!existingDemo) {
    const hashedPassword = await bcrypt.hash('demo123', 10);

    await User.create({
      name: 'Demo User',
      email: demoEmail,
      password: hashedPassword,
      balance: 100000,
    });

    console.log('\n✅ Demo user created');
  } else {
    console.log('\nℹ️ Demo user already exists');
  }

  console.log('\n🎉 Safe seeding completed');
  process.exit(0);
};

// ✅ RUN
seed()
  .then(() => console.log("🎉 Seeder finished"))
  .catch((err) => {
    console.error("❌ Seeder failed:", err);
    process.exit(1);
  });