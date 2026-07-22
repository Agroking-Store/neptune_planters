import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────
// Multer Configuration (Memory Storage)
// ─────────────────────────────────────────────
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// ─────────────────────────────────────────────
// Ensure uploads directory exists
// ─────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─────────────────────────────────────────────
// POST /api/upload
// ─────────────────────────────────────────────
export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    throw ApiError.badRequest('No files uploaded');
  }

  const files = req.files as Express.Multer.File[];
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Compress using Sharp to WebP format, 80% quality
    await sharp(file.buffer)
      .webp({ quality: 80 })
      .toFile(filepath);

    // Store the relative path (so it can be served via /uploads in Express)
    uploadedUrls.push(`/uploads/products/${filename}`);
  }

  res.status(200).json(
    ApiResponse.success('Images uploaded successfully', { urls: uploadedUrls }).toJSON()
  );
});
