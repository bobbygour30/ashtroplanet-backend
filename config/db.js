const mongoose = require("mongoose");

let isConnected = false; // global cache

const connectDB = async () => {
  if (isConnected) {
    console.log("⚡ Using existing DB connection");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;