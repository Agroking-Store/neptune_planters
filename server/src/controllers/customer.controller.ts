import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/customer.service';
import { createCustomerSchema } from '../validators/customer.validator';

// ─────────────────────────────────────────────
// GET /api/customers
// ─────────────────────────────────────────────
export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query as {
    search?: string;
  };
  const customers = await getCustomers({ search });
  res.status(200).json(
    ApiResponse.success('Customers retrieved', customers, { count: customers.length }).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/customers/:id
// ─────────────────────────────────────────────
export const getCustomerByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await getCustomerById(id as any);
  res.status(200).json(
    ApiResponse.success('Customer retrieved', customer.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/customers
// ─────────────────────────────────────────────
export const createCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const result = createCustomerSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw ApiError.badRequest('Validation failed', errors);
  }

  const customer = await createCustomer(result.data, req.user.userId);
  res.status(201).json(
    ApiResponse.success('Customer created successfully', customer.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// PUT /api/customers/:id
// ─────────────────────────────────────────────
export const updateCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;

  const result = createCustomerSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw ApiError.badRequest('Validation failed', errors);
  }

  const customer = await updateCustomer(id as any, result.data, req.user.userId);
  res.status(200).json(
    ApiResponse.success('Customer updated successfully', customer.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// DELETE /api/customers/:id
// ─────────────────────────────────────────────
export const deleteCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  await deleteCustomer(id as any);
  res.status(200).json(
    ApiResponse.success('Customer deleted successfully').toJSON()
  );
});
