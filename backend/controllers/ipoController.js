const IPO            = require('../models/IPO');
const IPOApplication = require('../models/IPOApplication');
const User           = require('../models/User');

// ── GET /api/ipo — List all IPOs (with filters & pagination) ──────────────────
const getIPOs = async (req, res) => {
  try {
    const { status, sector, sort = '-openDate', page = 1, limit = 20 } = req.query;
    const q = {};
    if (status && status !== 'All') q.status = status;
    if (sector) q.sector = sector;

    const total = await IPO.countDocuments(q);
    const ipos = await IPO.find(q)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      ipos,
    });
  } catch (e) {
    console.error('getIPOs error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── GET /api/ipo/stats — IPO dashboard stats ──────────────────────────────────
const getIPOStats = async (req, res) => {
  try {
    const [openCount, upcomingCount, listedCount, closedCount] = await Promise.all([
      IPO.countDocuments({ status: 'Open' }),
      IPO.countDocuments({ status: 'Upcoming' }),
      IPO.countDocuments({ status: 'Listed' }),
      IPO.countDocuments({ status: 'Closed' }),
    ]);

    // User's application stats
    let userStats = { totalApplied: 0, totalInvested: 0, allotted: 0, pending: 0 };
    if (req.user) {
      const apps = await IPOApplication.find({ user: req.user.id });
      userStats.totalApplied = apps.length;
      userStats.totalInvested = apps.reduce((sum, a) => sum + a.totalAmount, 0);
      userStats.allotted = apps.filter(a => a.status === 'ALLOTTED').length;
      userStats.pending = apps.filter(a => a.status === 'PENDING').length;
    }

    // Top performing listed IPOs
    const topListedIPOs = await IPO.find({
      status: 'Listed',
      issuePrice: { $gt: 0 },
      currentPrice: { $gt: 0 },
    }).sort({ currentPrice: -1 }).limit(5).lean();

    const topPerformers = topListedIPOs.map(ipo => ({
      company: ipo.company,
      symbol: ipo.symbol,
      issuePrice: ipo.issuePrice,
      currentPrice: ipo.currentPrice,
      listingGain: parseFloat((((ipo.currentPrice - ipo.issuePrice) / ipo.issuePrice) * 100).toFixed(2)),
    }));

    res.json({
      success: true,
      stats: {
        open: openCount,
        upcoming: upcomingCount,
        listed: listedCount,
        closed: closedCount,
        total: openCount + upcomingCount + listedCount + closedCount,
      },
      userStats,
      topPerformers,
    });
  } catch (e) {
    console.error('getIPOStats error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── GET /api/ipo/my-applications — User's IPO application history ─────────────
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const q = { user: req.user.id };
    if (status) q.status = status;

    const total = await IPOApplication.countDocuments(q);
    const applications = await IPOApplication.find(q)
      .populate('ipo', 'company symbol sector exchange issuePrice currentPrice status openDate closeDate listingDate gmp')
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      applications,
    });
  } catch (e) {
    console.error('getMyApplications error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── GET /api/ipo/:symbol — Single IPO detail ─────────────────────────────────
const getIPOBySymbol = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });

    // Get application count for this IPO
    const applicationCount = await IPOApplication.countDocuments({ ipo: ipo._id });

    // Check if current user has applied
    let userApplication = null;
    if (req.user) {
      userApplication = await IPOApplication.findOne({ user: req.user.id, ipo: ipo._id });
    }

    res.json({
      success: true,
      ipo,
      applicationCount,
      userApplication,
    });
  } catch (e) {
    console.error('getIPOBySymbol error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── GET /api/ipo/:symbol/subscription — Subscription status ───────────────────
const getIPOSubscriptionStatus = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });

    // Get application counts by investor type
    const [retailApps, hniApps, totalApps] = await Promise.all([
      IPOApplication.countDocuments({ ipo: ipo._id, investorType: 'Retail', status: { $ne: 'CANCELLED' } }),
      IPOApplication.countDocuments({ ipo: ipo._id, investorType: 'HNI', status: { $ne: 'CANCELLED' } }),
      IPOApplication.countDocuments({ ipo: ipo._id, status: { $ne: 'CANCELLED' } }),
    ]);

    res.json({
      success: true,
      symbol: ipo.symbol,
      company: ipo.company,
      subscription: {
        overall: ipo.subscribed || 0,
        retail: {
          subscribed: ipo.retailSubscribed || 0,
          quota: ipo.retailQuota || 35,
          applications: retailApps,
        },
        hni: {
          subscribed: ipo.hniSubscribed || 0,
          quota: ipo.hniQuota || 15,
          applications: hniApps,
        },
        qib: {
          subscribed: ipo.qibSubscribed || 0,
          quota: ipo.qibQuota || 50,
        },
        totalApplications: totalApps,
      },
    });
  } catch (e) {
    console.error('getIPOSubscriptionStatus error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── GET /api/ipo/:symbol/timeline — Key dates timeline ────────────────────────
const getIPOTimeline = async (req, res) => {
  try {
    const ipo = await IPO.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });

    const now = new Date();
    const timeline = [];

    const addEvent = (label, date, description) => {
      if (date) {
        const d = new Date(date);
        timeline.push({
          label,
          date: d.toISOString(),
          dateFormatted: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
          isPast: d < now,
          isToday: d.toDateString() === now.toDateString(),
          description,
        });
      }
    };

    addEvent('IPO Opens',           ipo.openDate,      'Bidding starts for all investor categories');
    addEvent('IPO Closes',          ipo.closeDate,     'Last day to submit application');
    addEvent('Allotment Date',      ipo.allotmentDate, 'Allotment finalization');
    addEvent('Refund Initiation',   ipo.refundDate,    'Refund credited to unsuccessful applicants');
    addEvent('Credit to Demat',     ipo.creditDate,    'Shares credited to successful applicants');
    addEvent('Listing Date',        ipo.listingDate,   'Stock starts trading on exchange');

    res.json({
      success: true,
      symbol: ipo.symbol,
      company: ipo.company,
      timeline,
    });
  } catch (e) {
    console.error('getIPOTimeline error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── POST /api/ipo/apply/:id — Apply for IPO ──────────────────────────────────
const applyIPO = async (req, res) => {
  try {
    const { id } = req.params;
    const { lots = 1, bidPrice, upiId, investorType = 'Retail' } = req.body;

    const ipo = await IPO.findById(id);
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });
    if (ipo.status !== 'Open') return res.status(400).json({ error: 'IPO is not open for applications' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validate lots
    const lotCount = parseInt(lots);
    if (lotCount < (ipo.minBidLots || 1)) {
      return res.status(400).json({ error: `Minimum ${ipo.minBidLots || 1} lot(s) required` });
    }
    if (lotCount > (ipo.maxBidLots || 13)) {
      return res.status(400).json({ error: `Maximum ${ipo.maxBidLots || 13} lot(s) allowed for ${investorType}` });
    }

    // Check for duplicate application
    const existingApp = await IPOApplication.findOne({
      user: user._id,
      ipo: ipo._id,
      investorType,
      status: { $ne: 'CANCELLED' },
    });
    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied for this IPO in this category' });
    }

    const totalShares = lotCount * (ipo.lotSize || 1);
    const effectiveBidPrice = Number(bidPrice) || ipo.issuePrice || ipo.priceHigh || 0;
    const totalAmount = parseFloat((totalShares * effectiveBidPrice).toFixed(2));

    if (user.balance < totalAmount) {
      return res.status(400).json({
        error: `Insufficient balance. Required: ₹${totalAmount.toLocaleString('en-IN')}, Available: ₹${user.balance.toLocaleString('en-IN')}`,
      });
    }

    // Deduct balance (blocked for mandate)
    user.balance = parseFloat((user.balance - totalAmount).toFixed(2));
    await user.save();

    // Create application record
    const application = await IPOApplication.create({
      user: user._id,
      ipo: ipo._id,
      ipoSymbol: ipo.symbol,
      ipoCompany: ipo.company,
      lots: lotCount,
      lotSize: ipo.lotSize || 1,
      totalShares,
      bidPrice: effectiveBidPrice,
      totalAmount,
      investorType,
      upiId: upiId || '',
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: `IPO application submitted for ${ipo.company}`,
      application: {
        id: application._id,
        company: ipo.company,
        symbol: ipo.symbol,
        lots: lotCount,
        totalShares,
        bidPrice: effectiveBidPrice,
        totalAmount,
        investorType,
        status: 'PENDING',
      },
      newBalance: user.balance,
    });
  } catch (e) {
    // Handle duplicate key error (race condition)
    if (e.code === 11000) {
      return res.status(400).json({ error: 'You have already applied for this IPO in this category' });
    }
    console.error('IPO apply error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ── DELETE /api/ipo/cancel/:applicationId — Cancel IPO application ────────────
const cancelIPOApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await IPOApplication.findOne({
      _id: applicationId,
      user: req.user.id,
    }).populate('ipo', 'closeDate status');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot cancel application with status: ${application.status}` });
    }

    // Check if IPO close date has passed
    if (application.ipo && new Date(application.ipo.closeDate) < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel — IPO bidding period has ended' });
    }

    // Refund the blocked amount
    const user = await User.findById(req.user.id);
    user.balance = parseFloat((user.balance + application.totalAmount).toFixed(2));
    await user.save();

    // Update application status
    application.status = 'CANCELLED';
    application.cancelledAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: `IPO application for ${application.ipoCompany} has been cancelled. ₹${application.totalAmount.toLocaleString('en-IN')} refunded.`,
      refundedAmount: application.totalAmount,
      newBalance: user.balance,
    });
  } catch (e) {
    console.error('cancelIPOApplication error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getIPOs,
  getIPOStats,
  getMyApplications,
  getIPOBySymbol,
  getIPOSubscriptionStatus,
  getIPOTimeline,
  applyIPO,
  cancelIPOApplication,
};