const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats
} = require('../controllers/orderController');
const { protectAdmin } = require('../middleware/adminAuth');

// Admin routes
router.get('/admin', protectAdmin, getAllOrders);
router.get('/admin/stats/dashboard', protectAdmin, getOrderStats);
router.get('/admin/:id', protectAdmin, getOrderById);
router.put('/admin/:id/status', protectAdmin, updateOrderStatus);
router.put('/admin/:id/payment', protectAdmin, updatePaymentStatus);
router.delete('/admin/:id', protectAdmin, deleteOrder);

module.exports = router;