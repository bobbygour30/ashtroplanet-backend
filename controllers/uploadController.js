const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astroplanets/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Upload single image
const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    res.json({
      msg: 'Image uploaded successfully',
      url: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ msg: 'Upload failed', error: error.message });
  }
};

// Upload multiple images
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files uploaded' });
    }
    
    const images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));
    
    res.json({
      msg: 'Images uploaded successfully',
      images: images
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ msg: 'Upload failed', error: error.message });
  }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ msg: 'Public ID is required' });
    }
    
    await cloudinary.uploader.destroy(publicId);
    
    res.json({ msg: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ msg: 'Delete failed', error: error.message });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  upload
};