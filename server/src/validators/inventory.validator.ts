import { z } from 'zod';
import { UOM_VALUES, PRODUCT_STATUS_VALUES } from '../utils/constants';

// ─────────────────────────────────────────────
// Product image sub-schema
// ─────────────────────────────────────────────
const productImageSchema = z.object({
  type: z.enum(['product', 'reference', 'texture']),
  url: z.string().min(1, 'Image URL is required'),
  publicId: z.string().default(''),
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

  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .min(1, 'SKU is required')
    .max(100, 'SKU too long')
    .transform((v) => v.toUpperCase()),

  hsnNumber: z.string().trim().optional().default(''),

  description: z.string().trim().optional().default(''),

  departmentId: z
    .string({ required_error: 'Department is required' })
    .min(1, 'Department is required'),

  categoryId: z.string().optional(),

  brandId: z.string().optional(),

  unitPrice: z
    .number({ required_error: 'Unit price is required', invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative')
    .default(0),

  defaultDiscount: z
    .number({ invalid_type_error: 'Discount must be a number' })
    .min(0)
    .max(100)
    .default(0),

  taxPercentage: z
    .number({ invalid_type_error: 'Tax must be a number' })
    .min(0)
    .max(100)
    .default(18),

  stockQuantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .min(0, 'Stock cannot be negative')
    .default(0),

  // UOM — must be one of the predefined values
  uom: z.enum(UOM_VALUES, {
    errorMap: () => ({ message: `UOM must be one of: ${UOM_VALUES.join(', ')}` }),
  }).default('pcs'),

  batchNo: z.string().trim().optional().default(''),
  color: z.string().trim().optional().default(''),
  productN: z.string().trim().optional().default(''),
  size: z.string().trim().optional().default(''),
  dimensions: z.string().trim().optional().default(''),

  status: z.enum(PRODUCT_STATUS_VALUES).default('Active'),

  productImages: z.array(productImageSchema).default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
