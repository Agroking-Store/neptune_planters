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
// Allowed MIME types and file extensions
// ─────────────────────────────────────────────
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
]);

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
    const mimeAllowed = ALLOWED_MIMES.has(file.mimetype.toLowerCase());
    const ext = path.extname(file.originalname).toLowerCase();
    const extAllowed = ALLOWED_EXTENSIONS.has(ext);

    // iPhones sometimes send HEIC files with mimetype 'application/octet-stream',
    // so we also check the file extension as a fallback.
    if (mimeAllowed || extAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed (JPG, PNG, WebP, HEIC). Got: ${file.mimetype}`));
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
    // Sharp supports HEIC/HEIF input natively via libvips
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
