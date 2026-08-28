import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post("/", protect, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
      api_key: process.env.CLOUDINARY_API_KEY || "123456789012345",
      api_secret: process.env.CLOUDINARY_API_SECRET || "secret",
    });

    // If no valid Cloudinary credentials, fallback to data URI so testing works smoothly
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === "demo"
    ) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      return res.status(200).json({
        url: dataURI,
        public_id: `local_${Date.now()}`,
        message: "Image uploaded successfully (Dev Fallback)",
      });
    }

    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "inventory_pro" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });

    const result = await uploadStream();
    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
      message: "Image uploaded successfully to Cloudinary",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
