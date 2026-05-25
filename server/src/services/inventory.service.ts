import { Department } from '../models/Department.model';
import { Category } from '../models/Category.model';
import { Brand } from '../models/Brand.model';
import { Product } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import type { CreateProductInput } from '../validators/inventory.validator';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// Get all departments
// ─────────────────────────────────────────────
export async function getDepartments() {
  return Department.find().sort({ name: 1 }).lean().exec();
}

// ─────────────────────────────────────────────
// Get categories (optionally filtered by dept)
// ─────────────────────────────────────────────
export async function getCategories(departmentId?: string) {
  const filter = departmentId ? { departmentId: new mongoose.Types.ObjectId(departmentId) } : {};
  return Category.find(filter).sort({ name: 1 }).lean().exec();
}

// ─────────────────────────────────────────────
// Get all brands
// ─────────────────────────────────────────────
export async function getBrands() {
  return Brand.find().sort({ name: 1 }).lean().exec();
}

// ─────────────────────────────────────────────
// Create a product
// ─────────────────────────────────────────────
export async function createProduct(
  data: CreateProductInput,
  userId: string
): Promise<InstanceType<typeof Product>> {
  // 1. Validate departmentId exists
  const dept = await Department.findById(data.departmentId).exec();
  if (!dept) throw ApiError.badRequest('Department not found');

  // 2. Validate categoryId if provided
  if (data.categoryId) {
    const cat = await Category.findById(data.categoryId).exec();
    if (!cat) throw ApiError.badRequest('Category not found');
  }

  // 3. Validate brandId if provided
  if (data.brandId) {
    const brand = await Brand.findById(data.brandId).exec();
    if (!brand) throw ApiError.badRequest('Brand not found');
  }

  // 4. Check SKU uniqueness
  const existing = await Product.findOne({ sku: data.sku.toUpperCase() }).exec();
  if (existing) throw ApiError.conflict(`SKU "${data.sku}" already exists`);

  // 5. Build and save product
  const product = new Product({
    ...data,
    departmentId: new mongoose.Types.ObjectId(data.departmentId),
    categoryId: data.categoryId ? new mongoose.Types.ObjectId(data.categoryId) : undefined,
    brandId: data.brandId ? new mongoose.Types.ObjectId(data.brandId) : undefined,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await product.save();
  return product;
}

// ─────────────────────────────────────────────
// Get all products (with populated refs)
// ─────────────────────────────────────────────
export async function getProducts(filters?: {
  departmentId?: string;
  status?: string;
  search?: string;
}) {
  const query: Record<string, unknown> = {};

  if (filters?.departmentId) {
    query['departmentId'] = new mongoose.Types.ObjectId(filters.departmentId);
  }
  if (filters?.status) {
    query['status'] = filters.status;
  }
  if (filters?.search) {
    const regex = new RegExp(filters.search, 'i');
    query['$or'] = [{ productName: regex }, { sku: regex }, { hsnNumber: regex }];
  }

  return Product.find(query)
    .populate('departmentId', 'name')
    .populate('categoryId', 'name')
    .populate('brandId', 'name')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

// ─────────────────────────────────────────────
// Find or create a department by name
// (used when frontend adds a new dept on the fly)
// ─────────────────────────────────────────────
export async function findOrCreateDepartment(name: string): Promise<string> {
  const trimmed = name.trim();
  let dept = await Department.findOne({ name: trimmed }).exec();
  if (!dept) {
    dept = await new Department({ name: trimmed }).save();
  }
  return (dept._id as mongoose.Types.ObjectId).toString();
}

// ─────────────────────────────────────────────
// Find or create a category by name + dept
// ─────────────────────────────────────────────
export async function findOrCreateCategory(
  name: string,
  departmentId: string
): Promise<string> {
  const trimmed = name.trim();
  const deptObjId = new mongoose.Types.ObjectId(departmentId);
  let cat = await Category.findOne({ name: trimmed, departmentId: deptObjId }).exec();
  if (!cat) {
    cat = await new Category({ name: trimmed, departmentId: deptObjId }).save();
  }
  return (cat._id as mongoose.Types.ObjectId).toString();
}

// ─────────────────────────────────────────────
// Find or create a brand by name
// ─────────────────────────────────────────────
export async function findOrCreateBrand(name: string): Promise<string> {
  const trimmed = name.trim();
  let brand = await Brand.findOne({ name: trimmed }).exec();
  if (!brand) {
    brand = await new Brand({ name: trimmed }).save();
  }
  return (brand._id as mongoose.Types.ObjectId).toString();
}
