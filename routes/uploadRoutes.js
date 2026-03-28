const express = require('express');
const router = express.Router();
const { 
  uploadSingleImage, 
  uploadMultipleImages, 
  deleteImage,
  upload 
} = require('../controllers/uploadController');
const { protectAdmin } = require('../middleware/adminAuth');

// Admin only routes
router.post('/single', protectAdmin, upload.single('image'), uploadSingleImage);
router.post('/multiple', protectAdmin, upload.array('images', 10), uploadMultipleImages);
router.delete('/image', protectAdmin, deleteImage);

module.exports = router;