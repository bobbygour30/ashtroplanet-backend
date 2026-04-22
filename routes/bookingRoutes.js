const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking,
  getMyBookings,
  getBookingStats
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/adminAuth');

// User routes
router.get('/my-bookings', protect, getMyBookings);
router.post('/', protect, createBooking);

// Admin routes
router.get('/admin', protectAdmin, getAllBookings);
router.get('/admin/stats/dashboard', protectAdmin, getBookingStats);
router.get('/admin/:id', protectAdmin, getBookingById);
router.put('/admin/:id/status', protectAdmin, updateBookingStatus);
router.put('/admin/:id/payment', protectAdmin, updatePaymentStatus);
router.delete('/admin/:id', protectAdmin, deleteBooking);

module.exports = router;