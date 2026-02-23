import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () =>
  logger.warn("MongoDB disconnected. Reconnecting...")
);
mongoose.connection.on("reconnected", () =>
  logger.info("MongoDB reconnected.")
);

export default connectDB;