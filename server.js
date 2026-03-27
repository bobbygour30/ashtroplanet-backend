const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { initializeDefaultAdmin } = require("./controllers/adminController");

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  "https://ashtro-seven.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, server-to-server, health checks)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true,
  })
);

// Handle preflight
app.options("*", cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Test CORS endpoint
app.get("/api/test-cors", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin || null,
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "AstroPlanets Auth API is running",
    version: "1.0.0",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      msg: "CORS error: Origin not allowed",
    });
  }

  res.status(err.status || 500).json({
    msg: err.message || "Something went wrong!",
  });
});

// Connect DB once
const initializeApp = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");

    await initializeDefaultAdmin();
    console.log("✅ Default admin initialized successfully");
  } catch (error) {
    console.error("❌ App initialization failed:", error.message);
  }
};

// Initialize app
initializeApp();

// Export for Vercel
module.exports = app;

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
}