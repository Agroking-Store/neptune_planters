import { Customer } from '../models/Customer.model';
import { ApiError } from '../utils/ApiError';
import type { CreateCustomerInput } from '../validators/customer.validator';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// Get all customers
// ─────────────────────────────────────────────
export async function getCustomers(filters?: {
  search?: string;
}) {
  const query: Record<string, unknown> = {};
  if (filters?.search) {
    const regex = new RegExp(filters.search, 'i');
    query['$or'] = [
      { customerName: regex },
      { customerCode: regex },
      { email: regex },
      { phoneNumber: regex },
    ];
  }

  return Customer.find(query)
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

// ─────────────────────────────────────────────
// Get customer by ID
// ─────────────────────────────────────────────
export async function getCustomerById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid customer ID');
  }
  const customer = await Customer.findById(id).exec();
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
}

// ─────────────────────────────────────────────
// Create a customer
// ─────────────────────────────────────────────
export async function createCustomer(
  data: CreateCustomerInput,
  userId: string
): Promise<InstanceType<typeof Customer>> {
  // Check for duplicate customer name
  const existing = await Customer.findOne({ customerName: data.customerName.trim() }).exec();
  if (existing) throw ApiError.conflict(`Customer "${data.customerName}" already exists`);

  const customer = new Customer({
    ...data,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await customer.save();
  console.log(`[Customer] Created: ${customer.customerCode} — ${customer.customerName}`);
  return customer;
}

// ─────────────────────────────────────────────
// Update a customer
// ─────────────────────────────────────────────
export async function updateCustomer(
  id: string,
  data: CreateCustomerInput,
  _userId: string
): Promise<InstanceType<typeof Customer>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid customer ID');
  }

  const customer = await Customer.findById(id).exec();
  if (!customer) throw ApiError.notFound('Customer not found');

  customer.customerName = data.customerName;
  customer.email = data.email;
  customer.phoneNumber = data.phoneNumber;
  customer.address = data.address;

  await customer.save();
  return customer;
}

// ─────────────────────────────────────────────
// Delete a customer
// ─────────────────────────────────────────────
export async function deleteCustomer(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid customer ID');
  }
  const result = await Customer.findByIdAndDelete(id).exec();
  if (!result) throw ApiError.notFound('Customer not found');
  return result;
}
