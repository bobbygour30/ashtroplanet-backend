const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  getActiveCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/active', getActiveCoupons);
router.post('/validate', protect, validateCoupon);

// Admin routes
router.get('/admin', protectAdmin, getAllCoupons);
router.post('/admin', protectAdmin, createCoupon);
router.put('/admin/:id', protectAdmin, updateCoupon);
router.delete('/admin/:id', protectAdmin, deleteCoupon);
router.patch('/admin/:id/toggle', protectAdmin, toggleCouponStatus);

module.exports = router;