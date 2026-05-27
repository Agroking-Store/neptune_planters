import { z } from 'zod';

// ─────────────────────────────────────────────
// Create Customer schema
// ─────────────────────────────────────────────
export const createCustomerSchema = z.object({
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(1, 'Customer name is required')
    .max(200, 'Customer name too long'),

  email: z.string().trim().email('Invalid email').optional().or(z.literal('')).default(''),

  phoneNumber: z.string().trim().optional().default(''),

  address: z.string().trim().optional().default(''),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
