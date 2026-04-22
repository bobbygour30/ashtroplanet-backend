const Order = require('../models/Order');

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    
    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      orders,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get single order by ID (admin)
// @route   GET /api/orders/admin/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email');
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { orderStatus } = req.body;
  
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    order.orderStatus = orderStatus;
    await order.save();
    
    res.json({ msg: 'Order status updated', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Update payment status (admin)
// @route   PUT /api/orders/admin/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  const { paymentStatus } = req.body;
  
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    order.paymentStatus = paymentStatus;
    await order.save();
    
    res.json({ msg: 'Payment status updated', order });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Delete order (admin)
// @route   DELETE /api/orders/admin/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    await order.deleteOne();
    
    res.json({ msg: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get order statistics (admin)
// @route   GET /api/orders/admin/stats/dashboard
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date();
    thisMonth.setDate(thisMonth.getDate() - 30);
    
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const weekOrders = await Order.countDocuments({ createdAt: { $gte: thisWeek } });
    const monthOrders = await Order.countDocuments({ createdAt: { $gte: thisMonth } });
    
    const todayRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const weekRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: thisWeek }, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const monthRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      todayOrders,
      weekOrders,
      monthOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      weekRevenue: weekRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats
};