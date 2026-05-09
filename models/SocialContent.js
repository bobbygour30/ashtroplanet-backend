const mongoose = require('mongoose');

const socialContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['youtube', 'instagram'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    embedId: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

const SocialContent = mongoose.model('SocialContent', socialContentSchema);
module.exports = SocialContent;