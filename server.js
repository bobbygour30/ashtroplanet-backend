const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { initializeDefaultAdmin } = require('./controllers/adminController');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'AstroPlanets Auth API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something went wrong!', error: err.message });
});

// Connect to database (non-blocking for Vercel)
let dbConnected = false;
const mongoose = require('mongoose');

const startDB = async () => {
  try {
    if (!dbConnected && mongoose.connection.readyState !== 1) {
      await connectDB();
      dbConnected = true;
      await initializeDefaultAdmin();
      console.log('✅ Database connected');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
};

// Start DB connection (don't await, let it run in background)
startDB();

// For Vercel, export the app
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}