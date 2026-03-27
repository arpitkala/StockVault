const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const REFERRAL_BONUS = 599;

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, referralCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists.' });

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    const user = await User.create({
      name, email, password,
      balance: Number(process.env.INITIAL_BALANCE) || 100000,
      referredBy: referrer ? referrer._id : null,
    });

    user.referralCode = 'SV' + user._id.toString().slice(-6).toUpperCase();
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true, token,
      user: {
        id: user._id, name: user.name, email: user.email,
        balance: user.balance, referralCode: user.referralCode, createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = generateToken(user._id);

    res.json({
      success: true, token,
      user: {
        id: user._id, name: user.name, email: user.email,
        balance: user.balance, watchlist: user.watchlist,
        referralCode: user.referralCode, referralCount: user.referralCount,
        referralEarnings: user.referralEarnings, kycCompleted: user.kycCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id, name: user.name, email: user.email,
        balance: user.balance, totalInvested: user.totalInvested,
        watchlist: user.watchlist, referralCode: user.referralCode,
        referralCount: user.referralCount, referralEarnings: user.referralEarnings,
        kycCompleted: user.kycCompleted, createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true, runValidators: true });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, balance: user.balance } });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile.' });
  }
};

const completeKYC = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.kycCompleted) return res.status(400).json({ error: 'KYC already completed.' });

    user.kycCompleted = true;
    await user.save();

    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        referrer.balance          += REFERRAL_BONUS;
        referrer.referralCount    += 1;
        referrer.referralEarnings += REFERRAL_BONUS;
        await referrer.save();
      }
    }

    res.json({ success: true, message: 'KYC completed successfully!' });
  } catch (error) {
    console.error('KYC error:', error);
    res.status(500).json({ error: 'Error completing KYC.' });
  }
};

const getReferralStats = async (req, res) => {
  try {
    let user = await User.findById(req.user.id);

    // Generate referral code if missing (for existing users)
    if (!user.referralCode) {
      user.referralCode = 'SV' + user._id.toString().slice(-6).toUpperCase();
      await user.save();
    }
    const referredUsers = await User.find({ referredBy: req.user.id })
      .select('name createdAt kycCompleted')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referralCode:     user.referralCode,
      referralCount:    user.referralCount,
      referralEarnings: user.referralEarnings,
      referredUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching referral stats.' });
  }
};

module.exports = { register, login, getMe, updateProfile, completeKYC, getReferralStats };