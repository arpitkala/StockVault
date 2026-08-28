const Fund = require('../models/Fund');
const User = require('../models/User');
const FundInvestment = require('../models/FundInvestment');

// ── GET /api/sip/funds — Get all mutual funds ──────────────────────────────────
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

// ── GET /api/sip/funds/:id — Get mutual fund detail by ID ──────────────────────
const getFundById = async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) return res.status(404).json({ error: 'Fund not found' });
    res.json({ success: true, fund });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── GET /api/sip/calculate — SIP calculator ───────────────────────────────────
const calculateSIP = (req, res) => {
  const { monthly, years, expectedReturn } = req.query;
  const r = (+expectedReturn / 100) / 12;
  const n = +years * 12;
  const P = +monthly;
  const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const totalInvested = P * n;
  const gains = futureValue - totalInvested;
  const wealthRatio = futureValue / totalInvested;

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

// ── POST /api/sip/invest — Place mutual fund SIP/Lumpsum order ─────────────────
const investInFund = async (req, res) => {
  try {
    const { fundId, type, amount } = req.body;
    if (!fundId || !type || !amount || amount <= 0) {
      return res.status(400).json({ error: 'All fields (fundId, type, amount) are required' });
    }

    const fund = await Fund.findById(fundId);
    if (!fund) return res.status(404).json({ error: 'Fund not found' });

    if (type === 'SIP' && fund.minSip && amount < fund.minSip) {
      return res.status(400).json({ error: `Minimum SIP amount is ₹${fund.minSip}` });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < amount) {
      return res.status(400).json({
        error: `Insufficient balance. Required: ₹${amount}, Available: ₹${user.balance}`,
      });
    }

    // Deduct cash balance
    user.balance = parseFloat((user.balance - amount).toFixed(2));
    await user.save();

    const nav = fund.nav || 10.0;
    const unitsAllocated = parseFloat((amount / nav).toFixed(4));

    let investment;
    if (type === 'SIP') {
      // Find existing active SIP for the same fund
      investment = await FundInvestment.findOne({
        user: user._id,
        fund: fund._id,
        type: 'SIP',
        status: 'ACTIVE'
      });
    }

    if (investment) {
      investment.units = parseFloat((investment.units + unitsAllocated).toFixed(4));
      investment.totalInvested += amount;
      investment.lastInstallmentDate = new Date();
      
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);
      investment.nextInstallmentDate = nextDate;
      
      investment.transactions.push({
        amount,
        units: unitsAllocated,
        nav,
        date: new Date(),
        type: 'BUY'
      });
      await investment.save();
    } else {
      const nextDate = new Date();
      if (type === 'SIP') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      investment = await FundInvestment.create({
        user: user._id,
        fund: fund._id,
        fundName: fund.name,
        type,
        amount,
        units: unitsAllocated,
        totalInvested: amount,
        nextInstallmentDate: type === 'SIP' ? nextDate : null,
        transactions: [{
          amount,
          units: unitsAllocated,
          nav,
          date: new Date(),
          type: 'BUY'
        }],
        startDate: new Date(),
        lastInstallmentDate: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully invested ₹${amount} in ${fund.name} via ${type}`,
      investment,
      newBalance: user.balance
    });
  } catch (e) {
    console.error('investInFund error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── GET /api/sip/investments — Get user's mutual fund holdings ─────────────────
const getInvestments = async (req, res) => {
  try {
    const investments = await FundInvestment.find({ user: req.user.id })
      .populate('fund')
      .sort({ startDate: -1 });

    const holdings = investments.map(inv => {
      const currentNav = inv.fund?.nav || inv.transactions[inv.transactions.length - 1]?.nav || 10.0;
      const currentValue = parseFloat((inv.units * currentNav).toFixed(2));
      const returns = parseFloat((currentValue - inv.totalInvested).toFixed(2));
      const returnsPercent = inv.totalInvested > 0 ? parseFloat(((returns / inv.totalInvested) * 100).toFixed(2)) : 0.0;

      return {
        _id: inv._id,
        fundName: inv.fundName,
        fund: inv.fund,
        type: inv.type,
        amount: inv.amount,
        status: inv.status,
        units: inv.units,
        totalInvested: inv.totalInvested,
        currentValue,
        returns,
        returnsPercent,
        nextInstallmentDate: inv.nextInstallmentDate,
        startDate: inv.startDate,
        lastInstallmentDate: inv.lastInstallmentDate,
        transactions: inv.transactions
      };
    });

    res.json({
      success: true,
      investments: holdings
    });
  } catch (e) {
    console.error('getInvestments error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── POST /api/sip/investments/:id/action — Cancel SIP / Redeem mutual fund units ─
const cancelOrRedeem = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const investment = await FundInvestment.findOne({
      _id: id,
      user: req.user.id
    }).populate('fund');

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (action === 'CANCEL') {
      if (investment.type !== 'SIP') {
        return res.status(400).json({ error: 'Only SIP investments can be cancelled' });
      }
      if (investment.status !== 'ACTIVE') {
        return res.status(400).json({ error: `SIP is already ${investment.status.toLowerCase()}` });
      }

      investment.status = 'CANCELLED';
      investment.nextInstallmentDate = null;
      await investment.save();

      return res.json({
        success: true,
        message: `SIP for ${investment.fundName} has been cancelled successfully. Your existing units will remain invested.`,
        investment
      });
    }

    if (action === 'REDEEM') {
      if (investment.units <= 0) {
        return res.status(400).json({ error: 'No units available to redeem' });
      }

      const currentNav = investment.fund?.nav || 10.0;
      const redemptionValue = parseFloat((investment.units * currentNav).toFixed(2));

      const user = await User.findById(req.user.id);
      user.balance = parseFloat((user.balance + redemptionValue).toFixed(2));
      await user.save();

      investment.transactions.push({
        amount: redemptionValue,
        units: investment.units,
        nav: currentNav,
        date: new Date(),
        type: 'SELL'
      });

      investment.units = 0;
      investment.status = 'REDEEMED';
      investment.nextInstallmentDate = null;
      await investment.save();

      return res.json({
        success: true,
        message: `Redeemed all units in ${investment.fundName} for ₹${redemptionValue.toLocaleString('en-IN')}. Funds added to your balance.`,
        investment,
        newBalance: user.balance
      });
    }

    res.status(400).json({ error: "Invalid action. Choose 'CANCEL' or 'REDEEM'" });
  } catch (e) {
    console.error('cancelOrRedeem error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getFunds,
  getFundById,
  calculateSIP,
  investInFund,
  getInvestments,
  cancelOrRedeem
};
