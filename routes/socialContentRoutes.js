const express = require('express');
const router = express.Router();
const {
  getAllContent,
  getContentByType,
  createContent,
  updateContent,
  deleteContent,
  incrementViews,
  incrementLikes,
} = require('../controllers/socialContentController');
const { protectAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/', getAllContent);
router.get('/type/:type', getContentByType);
router.put('/:id/view', incrementViews);
router.put('/:id/like', incrementLikes);

// Admin routes
router.post('/admin', protectAdmin, createContent);
router.put('/admin/:id', protectAdmin, updateContent);
router.delete('/admin/:id', protectAdmin, deleteContent);

module.exports = router;