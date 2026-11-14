import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import cloudinary from "cloudinary";
import requireUser from "../middleware/requireUser.js";

const uploadDir = path.resolve("uploads");
const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const receiveImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype))
      return callback(new Error("Choose a JPG, PNG, WebP, or AVIF image."));
    callback(null, true);
  },
});
const router = Router();
const cloudinaryReady = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );

function uploadToCloudinary(file) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "furniloop/listings",
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

router.post(
  "/",
  requireUser,
  (req, res, next) =>
    receiveImages.array("images", 8)(req, res, (error) => {
      if (error)
        return res
          .status(400)
          .json({
            message:
              error.code === "LIMIT_FILE_SIZE"
                ? "Each photo must be 5 MB or smaller."
                : error.message,
          });
      next();
    }),
  async (req, res) => {
    try {
      if (!req.files?.length)
        return res.status(400).json({ message: "Choose at least one photo." });
      if (process.env.NODE_ENV === "production" && !cloudinaryReady())
        return res
          .status(503)
          .json({
            message:
              "Configure Cloudinary before accepting production photo uploads.",
          });
      let images;
      if (cloudinaryReady()) {
        images = await Promise.all(req.files.map(uploadToCloudinary));
      } else {
        await mkdir(uploadDir, { recursive: true });
        const extByType = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
          "image/avif": ".avif",
        };
        const origin =
          process.env.SERVER_URL ||
          `http://localhost:${process.env.PORT || 5000}`;
        images = await Promise.all(
          req.files.map(async (file) => {
            const filename = `${randomUUID()}${extByType[file.mimetype]}`;
            await writeFile(path.join(uploadDir, filename), file.buffer, {
              flag: "wx",
            });
            return `${origin}/uploads/${filename}`;
          }),
        );
      }
      res
        .status(201)
        .json({ images, storage: cloudinaryReady() ? "cloudinary" : "local" });
    } catch (error) {
      console.error("Cloudinary upload error:", {
        message: error.message,
        http_code: error.http_code,
        name: error.name,
      });

      res.status(502).json({
        message:
          "Could not store these photos. Check the image storage configuration and try again.",
      });
    }
  },
);

export default router;
