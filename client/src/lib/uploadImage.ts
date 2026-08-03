import imageCompression from 'browser-image-compression';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Allowed MIME types for image uploads
// ─────────────────────────────────────────────
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// Also check by extension (iPhones sometimes report HEIC as application/octet-stream)
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB after compression

// The accept string for <input type="file"> elements
export const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';

/**
 * Validates file type, compresses the image, validates the compressed size,
 * uploads to the server, and returns the URL.
 *
 * @returns The uploaded image URL, or `undefined` if validation/upload failed.
 */
export async function uploadImage(file: File): Promise<string | undefined> {
  // ── Step 1: Validate file type ────────────────────────────
  const mimeAllowed = ALLOWED_TYPES.has(file.type.toLowerCase());
  const extMatch = file.name.match(/\.[^.]+$/);
  const extAllowed = extMatch ? ALLOWED_EXTENSIONS.has(extMatch[0].toLowerCase()) : false;

  if (!mimeAllowed && !extAllowed) {
    toast.error('Invalid file type. Only JPG, PNG, WebP, and HEIC images are allowed.');
    return undefined;
  }

  // ── Step 2: Compress the image ────────────────────────────
  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  } catch (err) {
    console.error('[uploadImage] Compression failed:', err);
    toast.error('Failed to compress image. Please try a different file.');
    return undefined;
  }

  // ── Step 3: Validate size after compression ───────────────
  if (compressed.size > MAX_FILE_SIZE) {
    toast.error(`Image is too large (${(compressed.size / 1024 / 1024).toFixed(1)}MB). Max allowed is 10MB.`);
    return undefined;
  }

  // ── Step 4: Upload to server ──────────────────────────────
  try {
    const fd = new FormData();
    fd.append('images', compressed);
    const res = await api.post<{ urls: string[] }>('/upload', fd);
    if (res?.urls?.[0]) {
      return res.urls[0];
    }
    throw new Error('No URL returned from server');
  } catch (err) {
    console.error('[uploadImage] Upload failed:', err);
    toast.error('Failed to upload image to server.');
    return undefined;
  }
}
