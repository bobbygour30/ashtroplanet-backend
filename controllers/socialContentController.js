const SocialContent = require('../models/SocialContent');

// Extract YouTube video ID from URL
const extractYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Extract Instagram Reel ID from URL
const extractInstagramId = (url) => {
  const regExp = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// @desc    Get all social content
// @route   GET /api/social-content
// @access  Public
const getAllContent = async (req, res) => {
  const { type, page = 1, limit = 12 } = req.query;
  
  try {
    let query = { isActive: true };
    if (type) query.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const content = await SocialContent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SocialContent.countDocuments(query);
    
    res.json({
      content,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get content by type
// @route   GET /api/social-content/type/:type
// @access  Public
const getContentByType = async (req, res) => {
  const { type } = req.params;
  const { page = 1, limit = 12 } = req.query;
  
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const content = await SocialContent.find({ type, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SocialContent.countDocuments({ type, isActive: true });
    
    res.json({
      content,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get content by type error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Create new social content (admin)
// @route   POST /api/social-content/admin
// @access  Private/Admin
const createContent = async (req, res) => {
  const { type, title, url, description } = req.body;
  
  try {
    let embedId = '';
    
    if (type === 'youtube') {
      embedId = extractYouTubeId(url);
      if (!embedId) {
        return res.status(400).json({ msg: 'Invalid YouTube URL' });
      }
    } else if (type === 'instagram') {
      embedId = extractInstagramId(url);
      if (!embedId) {
        return res.status(400).json({ msg: 'Invalid Instagram URL' });
      }
    }
    
    const content = await SocialContent.create({
      type,
      title,
      url,
      embedId,
      description: description || '',
      postedBy: req.admin._id,
    });
    
    res.status(201).json({ msg: 'Content created successfully', content });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Update social content (admin)
// @route   PUT /api/social-content/admin/:id
// @access  Private/Admin
const updateContent = async (req, res) => {
  const { id } = req.params;
  const { title, url, description, isActive } = req.body;
  
  try {
    const content = await SocialContent.findById(id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    
    if (title) content.title = title;
    if (description !== undefined) content.description = description;
    if (isActive !== undefined) content.isActive = isActive;
    
    if (url && url !== content.url) {
      let embedId = '';
      if (content.type === 'youtube') {
        embedId = extractYouTubeId(url);
        if (!embedId) {
          return res.status(400).json({ msg: 'Invalid YouTube URL' });
        }
      } else if (content.type === 'instagram') {
        embedId = extractInstagramId(url);
        if (!embedId) {
          return res.status(400).json({ msg: 'Invalid Instagram URL' });
        }
      }
      content.url = url;
      content.embedId = embedId;
    }
    
    await content.save();
    
    res.json({ msg: 'Content updated successfully', content });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Delete social content (admin)
// @route   DELETE /api/social-content/admin/:id
// @access  Private/Admin
const deleteContent = async (req, res) => {
  const { id } = req.params;
  
  try {
    const content = await SocialContent.findById(id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    
    await content.deleteOne();
    
    res.json({ msg: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Increment view count
// @route   PUT /api/social-content/:id/view
// @access  Public
const incrementViews = async (req, res) => {
  const { id } = req.params;
  
  try {
    const content = await SocialContent.findById(id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    
    content.views += 1;
    await content.save();
    
    res.json({ msg: 'View counted' });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Increment like count
// @route   PUT /api/social-content/:id/like
// @access  Public
const incrementLikes = async (req, res) => {
  const { id } = req.params;
  
  try {
    const content = await SocialContent.findById(id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    
    content.likes += 1;
    await content.save();
    
    res.json({ msg: 'Liked', likes: content.likes });
  } catch (error) {
    console.error('Increment likes error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllContent,
  getContentByType,
  createContent,
  updateContent,
  deleteContent,
  incrementViews,
  incrementLikes,
};