import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import {
  getDepartments,
  getCategories,
  getBrands,
  createProduct,
  getProducts,
  findOrCreateDepartment,
  findOrCreateCategory,
  findOrCreateBrand,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../services/inventory.service';
import { createProductSchema } from '../validators/inventory.validator';

// ─────────────────────────────────────────────
// GET /api/inventory/departments
// ─────────────────────────────────────────────
export const listDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await getDepartments();
  res.status(200).json(
    ApiResponse.success('Departments retrieved', departments).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/inventory/categories?departmentId=xxx
// ─────────────────────────────────────────────
export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId } = req.query as { departmentId?: string };
  const categories = await getCategories(departmentId);
  res.status(200).json(
    ApiResponse.success('Categories retrieved', categories).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/inventory/brands
// ─────────────────────────────────────────────
export const listBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await getBrands();
  res.status(200).json(
    ApiResponse.success('Brands retrieved', brands).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/inventory/products
// ─────────────────────────────────────────────
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, status, search } = req.query as {
    departmentId?: string;
    status?: string;
    search?: string;
  };

  const products = await getProducts({ departmentId, status, search });
  res.status(200).json(
    ApiResponse.success('Products retrieved', products, { count: products.length }).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/inventory/products
// Handles "find or create" for dept/category/brand
// when the user types a new one in the frontend
// ─────────────────────────────────────────────
export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const body = req.body as Record<string, unknown>;

  // ── Resolve departmentId ──────────────────
  // Frontend can send either an ObjectId string OR a plain name (new dept)
  let departmentId: string = body['departmentId'] as string ?? '';
  if (!departmentId && body['departmentName']) {
    departmentId = await findOrCreateDepartment(body['departmentName'] as string);
  }

  // ── Resolve categoryId ────────────────────
  let categoryId: string | undefined = body['categoryId'] as string | undefined;
  if (!categoryId && body['categoryName'] && departmentId) {
    categoryId = await findOrCreateCategory(body['categoryName'] as string, departmentId);
  }

  // ── Resolve brandId ───────────────────────
  let brandId: string | undefined = body['brandId'] as string | undefined;
  if (!brandId && body['brandName']) {
    brandId = await findOrCreateBrand(body['brandName'] as string);
  }

  // ── Validate full payload ─────────────────
  const result = createProductSchema.safeParse({
    ...body,
    departmentId,
    categoryId,
    brandId,
  });

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

  // Resolve departmentId, categoryId, brandId
  let departmentId: string = body['departmentId'] as string ?? '';
  if (!departmentId && body['departmentName']) {
    departmentId = await findOrCreateDepartment(body['departmentName'] as string);
  }

  let categoryId: string | undefined = body['categoryId'] as string | undefined;
  if (!categoryId && body['categoryName'] && departmentId) {
    categoryId = await findOrCreateCategory(body['categoryName'] as string, departmentId);
  }

  let brandId: string | undefined = body['brandId'] as string | undefined;
  if (!brandId && body['brandName']) {
    brandId = await findOrCreateBrand(body['brandName'] as string);
  }

  const result = createProductSchema.safeParse({
    ...body,
    departmentId,
    categoryId,
    brandId,
  });

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

