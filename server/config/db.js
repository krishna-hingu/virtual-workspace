// module.exports = connectDB;
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if DB not reachable
    });

    console.log(`MongoDB Connected: ${conn.connection.name} ✅`);

    // 🔥 Drop bad geospatial index if it exists
    try {
      const messageCollection = mongoose.connection.collection("messages");
      await messageCollection.dropIndex("position_2dsphere");
      console.log("Dropped old 2dsphere index ✅");
    } catch (err) {
      // Index doesn't exist or already dropped - that's fine
      if (!err.message.includes("index not found")) {
        console.log("Index cleanup: No old index to drop");
      }
    }

    // 🔥 Connection Events (VERY IMPORTANT)

    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB Error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB Disconnected ⚠️");
    });

    // 🔥 Graceful shutdown (VERY IMPORTANT)
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("DB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
