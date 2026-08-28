const Order     = require('../models/Order');
const Portfolio = require('../models/Portfolio');
const Stock     = require('../models/Stock');
const User      = require('../models/User');

const placeOrder = async (req, res) => {
  try {
    const { symbol, type, quantity, orderType = 'MARKET', limitPrice } = req.body;

    if (!symbol || !type || !quantity)
      return res.status(400).json({ error: 'Symbol, type and quantity are required.' });
    if (!['BUY','SELL'].includes(type.toUpperCase()))
      return res.status(400).json({ error: 'Order type must be BUY or SELL.' });
    if (quantity < 1)
      return res.status(400).json({ error: 'Quantity must be at least 1.' });

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ error: 'Stock not found.' });

    const user           = await User.findById(req.user.id);
    const executionPrice = orderType === 'LIMIT' && limitPrice ? Number(limitPrice) : stock.currentPrice;
    const totalAmount    = parseFloat((executionPrice * Number(quantity)).toFixed(2));

    // ── BUY ──────────────────────────────────────────────────
    if (type.toUpperCase() === 'BUY') {
      if (user.balance < totalAmount) {
        return res.status(400).json({
          error: `Insufficient balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${user.balance.toFixed(2)}`,
        });
      }

      const balanceBefore = user.balance;
      const balanceAfter  = parseFloat((user.balance - totalAmount).toFixed(2));

      // 1. Save portfolio FIRST (before touching balance)
      const existing = await Portfolio.findOne({ user: user._id, symbol: stock.symbol });
      if (existing) {
        const newQty      = existing.quantity + Number(quantity);
        const newInvested = parseFloat((existing.totalInvested + totalAmount).toFixed(2));
        const newAvgPrice = parseFloat((newInvested / newQty).toFixed(2));
        await Portfolio.findByIdAndUpdate(existing._id, {
          quantity: newQty,
          avgBuyPrice: newAvgPrice,
          totalInvested: newInvested,
          updatedAt: new Date(),
        });
      } else {
        await Portfolio.create({
          user: user._id,
          symbol: stock.symbol,
          stockName: stock.name,
          quantity: Number(quantity),
          avgBuyPrice: executionPrice,
          totalInvested: totalAmount,
        });
      }

      // 2. Deduct balance AFTER portfolio is saved
      await User.findByIdAndUpdate(user._id, {
        balance: balanceAfter,
        $inc: { totalInvested: totalAmount },
      });

      // 3. Create order record
      const order = await Order.create({
        user: user._id,
        symbol: stock.symbol,
        stockName: stock.name,
        type: 'BUY',
        orderType,
        quantity: Number(quantity),
        price: executionPrice,
        limitPrice: orderType === 'LIMIT' ? limitPrice : undefined,
        totalAmount,
        status: 'EXECUTED',
        balanceBefore,
        balanceAfter,
      });

      return res.status(201).json({
        success: true,
        message: `Successfully bought ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.symbol} at ₹${executionPrice}`,
        order,
        newBalance: balanceAfter,
      });
    }

    // ── SELL ─────────────────────────────────────────────────
    if (type.toUpperCase() === 'SELL') {
      const holding = await Portfolio.findOne({ user: user._id, symbol: stock.symbol });

      if (!holding || holding.quantity < Number(quantity)) {
        return res.status(400).json({
          error: `Insufficient shares. You have ${holding?.quantity || 0} shares of ${symbol}.`,
        });
      }

      const balanceBefore   = user.balance;
      const balanceAfter    = parseFloat((user.balance + totalAmount).toFixed(2));
      const investedForSold = parseFloat((holding.avgBuyPrice * Number(quantity)).toFixed(2));
      const profitLoss      = parseFloat((totalAmount - investedForSold).toFixed(2));

      // 1. Update portfolio FIRST
      const newQty = holding.quantity - Number(quantity);
      if (newQty === 0) {
        await Portfolio.findByIdAndDelete(holding._id);
      } else {
        await Portfolio.findByIdAndUpdate(holding._id, {
          quantity: newQty,
          totalInvested: parseFloat((holding.avgBuyPrice * newQty).toFixed(2)),
          updatedAt: new Date(),
        });
      }

      // 2. Credit balance AFTER portfolio is updated
      await User.findByIdAndUpdate(user._id, {
        balance: balanceAfter,
        $inc: { totalInvested: -investedForSold },
      });

      // 3. Create order record
      const order = await Order.create({
        user: user._id,
        symbol: stock.symbol,
        stockName: stock.name,
        type: 'SELL',
        orderType,
        quantity: Number(quantity),
        price: executionPrice,
        totalAmount,
        status: 'EXECUTED',
        balanceBefore,
        balanceAfter,
      });

      return res.status(201).json({
        success: true,
        message: `Successfully sold ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.symbol} at ₹${executionPrice}`,
        order,
        newBalance: balanceAfter,
        profitLoss,
      });
    }

  } catch (error) {
    console.error('placeOrder error:', error);
    res.status(500).json({ error: error.message || 'Error processing order.' });
  }
};

// ── Get Orders (with pagination) ──────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const { symbol, type, status, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (symbol) query.symbol = symbol.toUpperCase();
    if (type)   query.type   = type.toUpperCase();
    if (status) query.status = status.toUpperCase();

    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), totalPages: Math.ceil(total / limit), orders });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders.' });
  }
};

// ── Get single order by ID ────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Get current stock price for P&L
    const stock = await Stock.findOne({ symbol: order.symbol });
    const currentPrice = stock ? stock.currentPrice : order.price;

    res.json({
      success: true,
      order: {
        ...order.toObject(),
        currentStockPrice: currentPrice,
        unrealizedPnL: order.type === 'BUY'
          ? parseFloat(((currentPrice - order.price) * order.quantity).toFixed(2))
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order.' });
  }
};

// ── Cancel a pending order ────────────────────────────────────────────────────
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot cancel order with status: ${order.status}` });
    }

    // Refund balance for BUY orders
    if (order.type === 'BUY') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { balance: order.totalAmount },
      });
    }

    order.status = 'CANCELLED';
    await order.save();

    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      message: `Order #${order._id} cancelled successfully.`,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ error: 'Error cancelling order.' });
  }
};

module.exports = { placeOrder, getOrders, getOrderById, cancelOrder };