const Booking = require('../models/Booking');

// @desc    Get all bookings (admin)
// @route   GET /api/bookings/admin
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = {};
    
    if (status) {
      query.bookingStatus = status;
    }
    
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const bookings = await Booking.find(query)
      .populate('user', 'fullName email')
      .sort({ bookingDate: -1, createdAt: -1 });
    
    // Get statistics
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ bookingStatus: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });
    
    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      bookings,
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private/Admin
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName email');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Create a new booking (user)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const {
    serviceType,
    bookingDate,
    bookingTime,
    duration,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    notes,
    specialRequests,
  } = req.body;
  
  try {
    const booking = await Booking.create({
      user: req.user._id,
      serviceType,
      bookingDate: new Date(bookingDate),
      bookingTime,
      duration: duration || 60,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      notes: notes || '',
      specialRequests: specialRequests || '',
      bookingStatus: 'pending',
      paymentStatus: 'pending',
    });
    
    res.status(201).json({
      msg: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Update booking status (admin)
// @route   PUT /api/bookings/admin/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  const { bookingStatus } = req.body;
  
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    booking.bookingStatus = bookingStatus;
    await booking.save();
    
    res.json({ msg: 'Booking status updated', booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Update payment status (admin)
// @route   PUT /api/bookings/admin/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  const { paymentStatus } = req.body;
  
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    booking.paymentStatus = paymentStatus;
    await booking.save();
    
    res.json({ msg: 'Payment status updated', booking });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Delete booking (admin)
// @route   DELETE /api/bookings/admin/:id
// @access  Private/Admin
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    await booking.deleteOne();
    
    res.json({ msg: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ bookingDate: -1, createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get booking statistics (admin)
// @route   GET /api/bookings/admin/stats/dashboard
// @access  Private/Admin
const getBookingStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date();
    thisMonth.setDate(thisMonth.getDate() - 30);
    
    const todayBookings = await Booking.countDocuments({ createdAt: { $gte: today } });
    const weekBookings = await Booking.countDocuments({ createdAt: { $gte: thisWeek } });
    const monthBookings = await Booking.countDocuments({ createdAt: { $gte: thisMonth } });
    
    const todayRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const weekRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: thisWeek }, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const monthRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      todayBookings,
      weekBookings,
      monthBookings,
      todayRevenue: todayRevenue[0]?.total || 0,
      weekRevenue: weekRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking,
  getMyBookings,
  getBookingStats,
};