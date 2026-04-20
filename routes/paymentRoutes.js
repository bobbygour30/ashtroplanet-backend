const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/orders', protect, getUserOrders);
router.get('/order/:id', protect, getOrderById);

module.exports = router;