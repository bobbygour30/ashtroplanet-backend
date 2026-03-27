const Admin = require('../models/Admin');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Admin login attempt:', email);
    
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(401).json({ msg: 'Invalid admin credentials' });
    }

    console.log('Admin found, comparing password...');
    const isPasswordValid = await admin.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ msg: 'Invalid admin credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ msg: 'Admin account is disabled' });
    }

    const token = generateToken(admin._id);
    console.log('Admin login successful, token generated');

    res.json({
      msg: 'Admin login successful',
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
      token: token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Create a new admin (only super admin)
// @route   POST /api/admin/create
// @access  Private (Admin only)
const createAdmin = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    // Check if admin exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ msg: 'Admin already exists' });
    }

    // Create admin
    const admin = await Admin.create({
      fullName,
      email,
      password,
      role: role || 'admin',
      createdBy: req.admin?._id || null,
    });

    res.status(201).json({
      msg: 'Admin created successfully',
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update user status (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({ msg: 'User status updated', user: { _id: user._id, isActive: user.isActive } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalAdmins = await Admin.countDocuments();

    res.json({
      totalUsers,
      activeUsers,
      totalAdmins,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/me
// @access  Private (Admin only)
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json(admin);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Initialize default admin (run on server start)
// @access  Internal
const initializeDefaultAdmin = async () => {
  try {
    const defaultAdminEmail = 'admin@astroplanet.com';
    const defaultPassword = 'ashtro#admin@123';
    
    // Check if admin exists
    let existingAdmin = await Admin.findOne({ email: defaultAdminEmail });
    
    if (!existingAdmin) {
      console.log('Creating default admin...');
      
      // Create admin with proper password hashing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      const defaultAdmin = new Admin({
        fullName: 'Super Admin',
        email: defaultAdminEmail,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin created successfully!');
      console.log('Email:', defaultAdminEmail);
      console.log('Password:', defaultPassword);
    } else {
      console.log('✅ Default admin already exists');
      
      // Optional: Update password if needed (for testing)
      // Uncomment this to reset password if you're having issues
      /*
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin password reset successfully');
      */
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

module.exports = {
  loginAdmin,
  createAdmin,
  getAllUsers,
  updateUserStatus,
  getDashboardStats,
  getCurrentAdmin,
  initializeDefaultAdmin,
};