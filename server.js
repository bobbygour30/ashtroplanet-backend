const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { initializeDefaultAdmin } = require('./controllers/adminController');

dotenv.config();

const app = express();

// FORCE CORS HEADERS - Place this BEFORE any other middleware
app.use((req, res, next) => {
  // Allow all origins for now (you can restrict later)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global connection variable
let dbConnected = false;

// Middleware to ensure DB connection with retry
const ensureDbConnection = async (req, res, next) => {
  try {
    if (!dbConnected || mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to database...');
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected successfully');
      
      // Initialize admin only once
      await initializeDefaultAdmin();
    }
    next();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    res.status(503).json({ 
      msg: 'Database connection error. Please try again.',
      error: error.message
    });
  }
};

// Health check endpoint (no DB connection required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    headers: req.headers
  });
});

// Apply DB connection middleware to all API routes
app.use('/api/auth', ensureDbConnection, require('./routes/authRoutes'));
app.use('/api/admin', ensureDbConnection, require('./routes/adminRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AstroPlanets Auth API is running',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    msg: err.message || 'Something went wrong!'
  });
});

// Export for Vercel
module.exports = app;

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`✅ CORS enabled for all origins`);
    
    // Connect to DB for local development
    try {
      await connectDB();
      await initializeDefaultAdmin();
      console.log('✅ Database ready for local development');
    } catch (error) {
      console.error('❌ Could not connect to database locally:', error.message);
    }
  });
}