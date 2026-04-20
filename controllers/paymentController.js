const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create order and Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  const { shippingAddress } = req.body;
  
  try {
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ msg: 'Cart is empty' });
    }
    
    // Check stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          msg: `${item.name} is out of stock or insufficient quantity` 
        });
      }
    }
    
    // Generate unique order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Create Razorpay order
    const options = {
      amount: Math.round(cart.totalPrice * 100), // Amount in paise
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1,
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    // Create order in database
    const order = await Order.create({
      user: req.user._id,
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalAmount: cart.totalPrice,
      shippingAddress: shippingAddress,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });
    
    res.json({
      msg: 'Order created successfully',
      order: {
        id: order._id,
        orderId: order.orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: cart.totalPrice,
        currency: 'INR',
      },
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Verify payment and complete order
// @route   POST /api/payment/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;
  
  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({ msg: 'Invalid payment signature' });
    }
    
    // Find and update order
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // Update order with payment details
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'success';
    order.orderStatus = 'confirmed';
    await order.save();
    
    // Update product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        product.sold += item.quantity;
        product.inStock = product.stock > 0;
        await product.save();
      }
    }
    
    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalItems: 0, totalPrice: 0 }
    );
    
    res.json({
      msg: 'Payment verified successfully',
      order: order,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/payment/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price image');
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get single order details
// @route   GET /api/payment/order/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    }).populate('items.product', 'name price image');
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
};