const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

let razorpayInstance = null;
if (keyId && keySecret) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('⚡ Razorpay initialized successfully with real API credentials.');
  } catch (err) {
    console.error('❌ Failed to initialize Razorpay instance:', err.message);
  }
}

// ── POST /api/wallet/razorpay/order — Create Razorpay order ───────────────────
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum deposit amount is ₹100' });
    }

    const amountInPaise = Math.round(amount * 100);

    if (razorpayInstance) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_dep_${Date.now()}_${req.user.id.slice(-4)}`
      };
      
      const order = await razorpayInstance.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        isMock: false
      });
    } else {
      console.log(`[Razorpay-Mock] Simulating order creation for ₹${amount}`);
      return res.json({
        success: true,
        orderId: `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: amountInPaise,
        currency: 'INR',
        isMock: true
      });
    }
  } catch (err) {
    console.error('createRazorpayOrder error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/wallet/deposit — Complete deposit of funds ──────────────────────
const depositFunds = async (req, res) => {
  try {
    const { amount, method, upiId, note, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 100) {
      return res.status(400).json({ error: 'Minimum deposit is ₹100' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let paymentVerified = true;
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      if (razorpayInstance && !razorpay_order_id.startsWith('mock_order_')) {
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const generated_signature = crypto
          .createHmac('sha256', keySecret)
          .update(text)
          .digest('hex');

        if (generated_signature !== razorpay_signature) {
          paymentVerified = false;
          console.warn('[Razorpay] Signature verification failed!');
        }
      } else {
        console.log('[Razorpay-Mock] Verified mock signature successfully.');
      }
    }

    if (!paymentVerified) {
      await Transaction.create({
        user: user._id,
        type: 'DEPOSIT',
        amount: amt,
        method: method || 'RAZORPAY',
        status: 'FAILED',
        referenceId: razorpay_payment_id || upiId || 'FAILED_TXN',
        note: note || 'Razorpay payment signature verification failed',
      });
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    user.balance = parseFloat((user.balance + amt).toFixed(2));
    await user.save();

    const txn = await Transaction.create({
      user: user._id,
      type: 'DEPOSIT',
      amount: amt,
      method: method || 'RAZORPAY',
      status: 'COMPLETED',
      referenceId: razorpay_payment_id || upiId || `txn_${Date.now()}`,
      note: note || `Deposit of ₹${amt} via ${method || 'RAZORPAY'}`,
    });

    res.json({
      success: true,
      message: `Successfully credited ₹${amt} to your wallet.`,
      newBalance: user.balance,
      transaction: txn
    });
  } catch (err) {
    console.error('depositFunds error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/wallet/withdraw — Withdraw funds from wallet ────────────────────
const withdrawFunds = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal is ₹100' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < amt) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    user.balance = parseFloat((user.balance - amt).toFixed(2));
    await user.save();

    const txn = await Transaction.create({
      user: user._id,
      type: 'WITHDRAW',
      amount: amt,
      method: method || 'BANK',
      status: 'COMPLETED',
      referenceId: `wd_${Date.now()}`,
      note: `Withdrawal of ₹${amt} to Bank Account`,
    });

    res.json({
      success: true,
      message: `Successfully withdrawn ₹${amt}. Funds will be credited to your bank account soon.`,
      newBalance: user.balance,
      transaction: txn
    });
  } catch (err) {
    console.error('withdrawFunds error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/wallet — Get wallet balance & transaction history ────────────────
const getWalletDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      balance: user.balance,
      transactions
    });
  } catch (err) {
    console.error('getWalletDetails error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  depositFunds,
  withdrawFunds,
  getWalletDetails
};
