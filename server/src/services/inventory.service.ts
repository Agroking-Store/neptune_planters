import { Product } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import type { CreateProductInput } from '../validators/inventory.validator';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// Create a product
// ─────────────────────────────────────────────
export async function createProduct(
  data: CreateProductInput,
  userId: string
): Promise<InstanceType<typeof Product>> {
  // Build and save product
  const product = new Product({
    ...data,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await product.save();
  return product;
}

// ─────────────────────────────────────────────
// Get all products
// ─────────────────────────────────────────────
export async function getProducts(filters?: {
  status?: string;
  search?: string;
}) {
  const query: Record<string, unknown> = {};

  if (filters?.status) {
    query['status'] = filters.status;
  }
  if (filters?.search) {
    const regex = new RegExp(filters.search, 'i');
    query['$or'] = [{ productName: regex }, { hsnNumber: regex }];
  }

  return Product.find(query)
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

// ─────────────────────────────────────────────
// Get product by ID
// ─────────────────────────────────────────────
export async function getProductById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid product ID');
  }
  const product = await Product.findById(id).exec();
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

// ─────────────────────────────────────────────
// Update an existing product
// ─────────────────────────────────────────────
export async function updateProduct(
  id: string,
  data: CreateProductInput
): Promise<InstanceType<typeof Product>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid product ID');
  }

  const product = await Product.findById(id).exec();
  if (!product) throw ApiError.notFound('Product not found');

  // Update fields
  product.productName = data.productName;
  product.hsnNumber = data.hsnNumber;
  product.description = data.description;
  product.unitPrice = data.unitPrice;
  product.sizes = data.sizes;
  product.status = data.status;
  product.productImages = data.productImages;

  await product.save();
  return product;
}

// ─────────────────────────────────────────────
// Delete a product
// ─────────────────────────────────────────────
export async function deleteProduct(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid product ID');
  }
  const result = await Product.findByIdAndDelete(id).exec();
  if (!result) throw ApiError.notFound('Product not found');
  return result;
}
