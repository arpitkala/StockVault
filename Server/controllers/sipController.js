const Fund = require('../models/Fund');

const getFunds = async (req, res) => {
  try {
    const { category, sort = 'returns1y', limit = 20 } = req.query;
    const q = category ? { category } : {};
    const funds = await Fund.find(q)
      .select('-navHistory')
      .sort({ [sort]: -1 })
      .limit(+limit);
    res.json({ success: true, funds });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getFundById = async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) return res.status(404).json({ error: 'Fund not found' });
    res.json({ success: true, fund });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// SIP calculator
const calculateSIP = (req, res) => {
  const { monthly, years, expectedReturn } = req.query;
  const r = (+expectedReturn / 100) / 12;
  const n = +years * 12;
  const P = +monthly;
  const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const totalInvested = P * n;
  const gains = futureValue - totalInvested;
  const wealthRatio = futureValue / totalInvested;

  // Month-by-month data for chart
  const monthlyData = [];
  let invested = 0, value = 0;
  for (let i = 1; i <= n; i++) {
    invested += P;
    value = (value + P) * (1 + r);
    if (i % 12 === 0) {
      monthlyData.push({
        year: i / 12,
        invested: +invested.toFixed(0),
        value: +value.toFixed(0),
      });
    }
  }

  res.json({
    success: true,
    result: {
      futureValue: +futureValue.toFixed(0),
      totalInvested: +totalInvested.toFixed(0),
      gains: +gains.toFixed(0),
      wealthRatio: +wealthRatio.toFixed(2),
      monthlyData,
    },
  });
};

module.exports = { getFunds, getFundById, calculateSIP };
