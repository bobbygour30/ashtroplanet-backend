const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  createAdmin,
  getAllUsers,
  updateUserStatus,
  getDashboardStats,
  getCurrentAdmin,
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminAuth');

// Public admin login
router.post('/login', loginAdmin);

// Protected admin routes
router.get('/me', protectAdmin, getCurrentAdmin);
router.post('/create', protectAdmin, createAdmin);
router.get('/users', protectAdmin, getAllUsers);
router.put('/users/:id', protectAdmin, updateUserStatus);
router.get('/stats', protectAdmin, getDashboardStats);

module.exports = router;