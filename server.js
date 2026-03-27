const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { initializeDefaultAdmin } = require('./controllers/adminController');

// Load env vars
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://ashtro-seven.vercel.app',
  'https://ashtroplanet-backend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Origin not allowed:', origin);
      return callback(null, true); // Allow anyway for now
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection state
let dbConnection = null;

// Middleware to ensure DB connection
const ensureDbConnection = async (req, res, next) => {
  try {
    if (!dbConnection || mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      dbConnection = await connectDB();
      await initializeDefaultAdmin();
    }
    next();
  } catch (error) {
    console.error('DB Connection error:', error);
    res.status(503).json({ 
      msg: 'Database connection error', 
      error: error.message 
    });
  }
};

// Apply DB connection middleware to all routes
app.use('/api', ensureDbConnection);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    mongodbState: mongoose.connection.readyState
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AstroPlanets Auth API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: `Route ${req.method} ${req.url} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    msg: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
    // Connect to DB on startup for local development
    try {
      await connectDB();
      await initializeDefaultAdmin();
      console.log('✅ Database initialized for local development');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
    }
  });
}