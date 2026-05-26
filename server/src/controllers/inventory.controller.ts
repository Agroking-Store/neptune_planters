import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../services/inventory.service';
import { createProductSchema } from '../validators/inventory.validator';

// ─────────────────────────────────────────────
// GET /api/inventory/products
// ─────────────────────────────────────────────
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { status, search } = req.query as {
    status?: string;
    search?: string;
  };

  const products = await getProducts({ status, search });
  res.status(200).json(
    ApiResponse.success('Products retrieved', products, { count: products.length }).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/inventory/products
// ─────────────────────────────────────────────
export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const body = req.body as Record<string, unknown>;

  // ── Validate payload ─────────────────
  const result = createProductSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw ApiError.badRequest('Validation failed', errors);
  }

  const product = await createProduct(result.data, req.user.userId);

  res.status(201).json(
    ApiResponse.success('Product created successfully', product.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/inventory/products/:id
// ─────────────────────────────────────────────
export const getProductByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await getProductById(id);
  res.status(200).json(
    ApiResponse.success('Product retrieved successfully', product.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// PUT /api/inventory/products/:id
// ─────────────────────────────────────────────
export const updateProductHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const result = createProductSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw ApiError.badRequest('Validation failed', errors);
  }

  const product = await updateProduct(id, result.data, req.user.userId);
  res.status(200).json(
    ApiResponse.success('Product updated successfully', product.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// DELETE /api/inventory/products/:id
// ─────────────────────────────────────────────
export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  await deleteProduct(id);
  res.status(200).json(
    ApiResponse.success('Product deleted successfully').toJSON()
  );
});
