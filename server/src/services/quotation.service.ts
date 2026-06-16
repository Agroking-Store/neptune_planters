import mongoose from 'mongoose';
import { Quotation } from '../models/Quotation.model';
import { Customer } from '../models/Customer.model';
import { Product } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import type { CreateQuotationInput } from '../validators/quotation.validator';

// ─────────────────────────────────────────────
// Get all quotations
// ─────────────────────────────────────────────
export async function getQuotations(filters?: {
  search?: string;
  status?: string;
}) {
  const query: Record<string, unknown> = {};

  if (filters?.status && ['Draft', 'Sent', 'Accepted', 'Rejected'].includes(filters.status)) {
    query['status'] = filters.status;
  }
  if (filters?.search) {
    const regex = new RegExp(filters.search, 'i');
    query['$or'] = [
      { quotationId: regex },
      { 'customerSnapshot.customerName': regex },
      { 'customerSnapshot.email': regex },
    ];
  }

  return Quotation.find(query)
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

// ─────────────────────────────────────────────
// Get quotation by ID
// ─────────────────────────────────────────────
export async function getQuotationById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid quotation ID');
  }
  const quotation = await Quotation.findById(id).exec();
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return quotation;
}

// ─────────────────────────────────────────────
// Create a quotation
// ─────────────────────────────────────────────
export async function createQuotation(
  data: CreateQuotationInput,
  userId: string
): Promise<InstanceType<typeof Quotation>> {
  // 1. Validate customer exists and build snapshot
  if (!mongoose.Types.ObjectId.isValid(data.customerId)) {
    throw ApiError.badRequest('Invalid customer ID');
  }
  const customer = await Customer.findById(data.customerId).lean().exec();
  if (!customer) throw ApiError.notFound('Customer not found');

  const customerSnapshot = {
    customerName: customer.customerName,
    email: customer.email || '',
    phoneNumber: customer.phoneNumber || '',
    gstNumber: customer.gstNumber || '',
  };

  // 2. Build items with product snapshots
  const itemDocs = [];
  for (const item of data.items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw ApiError.badRequest(`Invalid product ID: ${item.productId}`);
    }
    const product = await Product.findById(item.productId).lean().exec();
    if (!product) {
      throw ApiError.notFound(`Product not found: ${item.productId}`);
    }

    const productSnapshot = {
      productName: product.productName,
      hsnNumber: product.hsnNumber || '',
      size: product.sizes?.join(', ') || '',
    };

    // Calculate item total: quantity * unitPrice * (1 - discountPercent/100)
    const discountPercent = item.discountPercent || 0;
    const lineTotal = item.quantity * item.unitPrice * (1 - discountPercent / 100);

    itemDocs.push({
      productId: new mongoose.Types.ObjectId(item.productId),
      productSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent,
      selectedSize: item.selectedSize || '',
      selectedTexture: item.selectedTexture || '',
      total: Math.round(lineTotal * 100) / 100,
    });
  }

  // 3. Parse follow-up date
  let followUpDate: Date | undefined = undefined;
  if (data.followUpDate && data.followUpDate.trim() !== '') {
    followUpDate = new Date(data.followUpDate);
    if (isNaN(followUpDate.getTime())) {
      followUpDate = undefined;
    }
  }
  const quotation = new Quotation({
    customerId: new mongoose.Types.ObjectId(data.customerId),
    customerSnapshot,
    createdDate: new Date(),
    followUpDate: followUpDate || null,
    status: data.status || 'Draft',
    termsAndConditions: data.termsAndConditions || [],
    validTill: data.validTill,
    advancePayment: data.advancePayment,
    deliveryTime: data.deliveryTime,
    transportationCharges: data.transportationCharges,
    totalAmount: data.totalAmount,
    totalDiscount: data.totalDiscount || 0,
    items: itemDocs,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await quotation.save();
  console.log(`[Quotation] Created: ${quotation.quotationId}`);
  return quotation;
}

// ─────────────────────────────────────────────
// Update a quotation
// ─────────────────────────────────────────────
export async function updateQuotation(
  id: string,
  data: CreateQuotationInput,
  _userId: string
): Promise<InstanceType<typeof Quotation>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid quotation ID');
  }

  const quotation = await Quotation.findById(id).exec();
  if (!quotation) throw ApiError.notFound('Quotation not found');

  // Re-fetch customer snapshot
  if (!mongoose.Types.ObjectId.isValid(data.customerId)) {
    throw ApiError.badRequest('Invalid customer ID');
  }
  const customer = await Customer.findById(data.customerId).lean().exec();
  if (!customer) throw ApiError.notFound('Customer not found');

  quotation.customerId = new mongoose.Types.ObjectId(data.customerId);
  quotation.customerSnapshot = {
    customerName: customer.customerName,
    email: customer.email || '',
    phoneNumber: customer.phoneNumber || '',
    gstNumber: customer.gstNumber || '',
  };

  // Re-build items with fresh product snapshots
  const itemDocs = [];
  for (const item of data.items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw ApiError.badRequest(`Invalid product ID: ${item.productId}`);
    }
    const product = await Product.findById(item.productId).lean().exec();
    if (!product) {
      throw ApiError.notFound(`Product not found: ${item.productId}`);
    }

    const discountPercent = item.discountPercent || 0;
    const lineTotal = item.quantity * item.unitPrice * (1 - discountPercent / 100);

    itemDocs.push({
      productId: new mongoose.Types.ObjectId(item.productId),
      productSnapshot: {
        productName: product.productName,
        hsnNumber: product.hsnNumber || '',
        size: product.sizes?.join(', ') || '',
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent,
      selectedSize: item.selectedSize || '',
      selectedTexture: item.selectedTexture || '',
      total: Math.round(lineTotal * 100) / 100,
    });
  }

  // Parse follow-up date
  let followUpDate: Date | null = null;
  if (data.followUpDate && data.followUpDate.trim() !== '') {
    const d = new Date(data.followUpDate);
    if (!isNaN(d.getTime())) followUpDate = d;
  }

  quotation.followUpDate = followUpDate as Date | undefined;
  quotation.status = data.status || 'Draft';
  quotation.termsAndConditions = data.termsAndConditions || [];
  quotation.validTill = data.validTill;
  quotation.advancePayment = data.advancePayment;
  quotation.deliveryTime = data.deliveryTime;
  quotation.transportationCharges = data.transportationCharges;
  quotation.totalAmount = data.totalAmount;
  quotation.totalDiscount = data.totalDiscount || 0;
  quotation.items = itemDocs as typeof quotation.items;

  await quotation.save();
  console.log(`[Quotation] Updated: ${quotation.quotationId}`);
  return quotation;
}

// ─────────────────────────────────────────────
// Delete a quotation
// ─────────────────────────────────────────────
export async function deleteQuotation(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid quotation ID');
  }
  const result = await Quotation.findByIdAndDelete(id).exec();
  if (!result) throw ApiError.notFound('Quotation not found');
  return result;
}
