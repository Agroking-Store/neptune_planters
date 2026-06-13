import { z } from 'zod';
import { PRODUCT_STATUS_VALUES } from '../utils/constants';

// ─────────────────────────────────────────────
// Product image sub-schema
// ─────────────────────────────────────────────
const productImageSchema = z.object({
  type: z.enum(['product', 'reference', 'texture']),
  url: z.string().min(1, 'Image URL is required'),
  publicId: z.string().default(''),
  linkedUrl: z.string().optional().default(''),
  linkedReferenceUrl: z.string().optional().default(''),
});

// ─────────────────────────────────────────────
// Create Product schema
// ─────────────────────────────────────────────
export const createProductSchema = z.object({
  productName: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name too long'),

  hsnNumber: z.string().trim().optional().default(''),

  description: z.string().trim().optional().default(''),

  unitPrice: z
    .number({ required_error: 'Unit price is required', invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative')
    .default(0),

  sizes: z.array(z.string().trim()).default([]),

  status: z.enum(PRODUCT_STATUS_VALUES).default('Active'),

  productImages: z.array(productImageSchema).default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
