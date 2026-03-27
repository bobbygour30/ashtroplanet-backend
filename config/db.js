const mongoose = require("mongoose");

// Global cache (important for Vercel serverless)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  // ✅ Check env variable
  const MONGO_URI = process.env.MONGODB_URI;

  if (!MONGO_URI) {
    throw new Error("❌ MONGODB_URI is not defined in environment variables");
  }

  // ✅ If already connected, reuse it
  if (cached.conn) {
    console.log("⚡ Using existing MongoDB connection");
    return cached.conn;
  }

  // ✅ If no connection promise, create one
  if (!cached.promise) {
    console.log("📡 Connecting to MongoDB...");

    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000, // fail fast if DB not reachable
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        cached.promise = null; // reset so it can retry
        throw err;
      });
  }

  // ✅ Await connection
  cached.conn = await cached.promise;

  return cached.conn;
};

module.exports = connectDB;