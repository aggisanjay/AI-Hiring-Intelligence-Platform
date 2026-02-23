import { v2 as cloudinary } from "cloudinary";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  logger.warn("⚠️  Cloudinary not configured — resume uploads will fail in production");
}

export default cloudinary;