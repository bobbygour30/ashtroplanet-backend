const Coupon = require('../models/Coupon');
const Product = require('../models/Product');

// @desc    Get all coupons (admin)
// @route   GET /api/coupons/admin
// @access  Private/Admin
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    const stats = {
      total: await Coupon.countDocuments(),
      active: await Coupon.countDocuments({ isActive: true }),
      expired: await Coupon.countDocuments({ endDate: { $lt: new Date() } }),
      totalUsed: await Coupon.aggregate([{ $group: { _id: null, total: { $sum: '$usedCount' } } }]),
    };
    res.json({ coupons, stats });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get active coupons (public)
// @route   GET /api/coupons/active
// @access  Public
const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).select('code description discountType discountValue minOrderAmount');
    res.json(coupons);
  } catch (error) {
    console.error('Get active coupons error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Validate and apply coupon
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  const { code, orderAmount, productIds } = req.body;
  
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ msg: 'Invalid coupon code' });
    }
    
    if (!coupon.isValid()) {
      return res.status(400).json({ msg: 'Coupon has expired or is inactive' });
    }
    
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        msg: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
      });
    }
    
    // Check if products are applicable
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds?.some(id => 
        coupon.applicableProducts.includes(id)
      );
      if (!hasApplicableProduct) {
        return res.status(400).json({ msg: 'Coupon not applicable for these products' });
      }
    }
    
    const discount = coupon.calculateDiscount(orderAmount);
    
    res.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Create coupon (admin)
// @route   POST /api/coupons/admin
// @access  Private/Admin
const createCoupon = async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    startDate,
    endDate,
    usageLimit,
    perUserLimit,
    applicableProducts,
    applicableCategories,
  } = req.body;
  
  try {
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ msg: 'Coupon code already exists' });
    }
    
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: usageLimit || null,
      perUserLimit: perUserLimit || 1,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      createdBy: req.admin._id,
    });
    
    res.status(201).json({ msg: 'Coupon created successfully', coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Update coupon (admin)
// @route   PUT /api/coupons/admin/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
  const { id } = req.params;
  
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ msg: 'Coupon not found' });
    }
    
    const {
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      applicableProducts,
      applicableCategories,
      isActive,
    } = req.body;
    
    if (description !== undefined) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (startDate) coupon.startDate = new Date(startDate);
    if (endDate) coupon.endDate = new Date(endDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (applicableProducts) coupon.applicableProducts = applicableProducts;
    if (applicableCategories) coupon.applicableCategories = applicableCategories;
    if (isActive !== undefined) coupon.isActive = isActive;
    
    await coupon.save();
    
    res.json({ msg: 'Coupon updated successfully', coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/admin/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ msg: 'Coupon not found' });
    }
    
    await coupon.deleteOne();
    res.json({ msg: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Toggle coupon status (admin)
// @route   PATCH /api/coupons/admin/:id/toggle
// @access  Private/Admin
const toggleCouponStatus = async (req, res) => {
  const { id } = req.params;
  
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ msg: 'Coupon not found' });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    res.json({ msg: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, coupon });
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllCoupons,
  getActiveCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
};