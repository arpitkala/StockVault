const express = require('express');
const { placeOrder, getOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/',              protect, placeOrder);
router.get('/',               protect, getOrders);
router.get('/:id',            protect, getOrderById);
router.put('/:id/cancel',     protect, cancelOrder);

module.exports = router;