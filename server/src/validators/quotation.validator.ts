import { z } from 'zod';

// ─────────────────────────────────────────────
// Quotation Item schema
// ─────────────────────────────────────────────
const quotationItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .min(1, 'Product ID is required'),

  // Snapshot is optional in the request — server will populate it from the product record
  productSnapshot: z
    .object({
      productName: z.string().default(''),
      sku: z.string().default(''),
      hsnNumber: z.string().default(''),
      size: z.string().default(''),
      uom: z.string().default(''),
    })
    .optional(),

  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int()
    .min(1, 'Quantity must be at least 1'),

  unitPrice: z
    .number({ required_error: 'Unit price is required' })
    .min(0, 'Price cannot be negative'),

  discount: z.number().min(0).default(0),

  tax: z.number().min(0).default(0),

  total: z.number().min(0).default(0),
});

// ─────────────────────────────────────────────
// Create Quotation schema
// ─────────────────────────────────────────────
export const createQuotationSchema = z.object({
  customerId: z
    .string({ required_error: 'Customer is required' })
    .min(1, 'Customer is required'),

  followUpDate: z.string().optional().or(z.literal('')).default(''),

  status: z
    .enum(['Draft', 'Sent', 'Accepted', 'Rejected'])
    .default('Draft'),

  displayPreference: z
    .enum(['Customer Name', 'Company Name', 'Both'])
    .default('Both'),

  termsAndConditions: z.array(z.string()).default([]),

  notes: z.string().trim().optional().default(''),

  // Overall billing values
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),

  items: z
    .array(quotationItemSchema)
    .min(1, 'At least one item is required'),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
