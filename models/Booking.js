const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['Natal Chart Reading', 'Numerology Report', 'Vastu Consultation', 'Tarot Reading', 'Astrology Consultation'],
      required: true,
    },
    serviceProvider: {
      type: String,
      default: 'Astrologer',
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    bookingTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 60, // minutes
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    specialRequests: {
      type: String,
      default: '',
    },
    paymentId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique booking ID
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `BK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;