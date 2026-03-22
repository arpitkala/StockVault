const express = require('express');
const { placeOrder, getOrders }           = require('../controllers/orderController');
const { getOptionsChain, placeFnOOrder }  = require('../controllers/fnoController');
const { protect }                         = require('../middleware/auth');

const router = express.Router();

router.post('/',           protect, placeOrder);
router.get('/',            protect, getOrders);
router.post('/fno',        protect, placeFnOOrder);
router.get('/fno/chain',   protect, getOptionsChain);

module.exports = router;