const IPO  = require('../models/IPO');
const User = require('../models/User');

const getIPOs = async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const ipos = await IPO.find(q).sort({ openDate: -1 });
    res.json({ success: true, ipos });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getIPOBySymbol = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });
    res.json({ success: true, ipo });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const applyIPO = async (req, res) => {
  try {
    const { id } = req.params;
    const { lots = 1, bidPrice, upiId, investorType = 'Retail' } = req.body;

    const ipo = await IPO.findById(id);
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });
    if (ipo.status !== 'Open') return res.status(400).json({ error: 'IPO is not open for applications' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalShares = lots * (ipo.lotSize || 1);
    const totalAmount = totalShares * (bidPrice || ipo.issuePrice || 0);

    if (user.balance < totalAmount) {
      return res.status(400).json({ error: `Insufficient balance. Required: ₹${totalAmount.toLocaleString('en-IN')}` });
    }

    // Deduct balance
    user.balance -= totalAmount;
    await user.save();

    res.status(200).json({
      success:     true,
      message:     `IPO application submitted for ${ipo.company}`,
      company:     ipo.company,
      lots,
      totalShares,
      totalAmount,
      newBalance:  user.balance,
    });

  } catch (e) {
    console.error('IPO apply error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getIPOs, getIPOBySymbol, applyIPO };