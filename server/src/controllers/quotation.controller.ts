import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} from '../services/quotation.service';
import { createQuotationSchema } from '../validators/quotation.validator';

// ─────────────────────────────────────────────
// GET /api/quotations
// ─────────────────────────────────────────────
export const listQuotations = asyncHandler(async (req: Request, res: Response) => {
  const { search, status } = req.query as {
    search?: string;
    status?: string;
  };
  const quotations = await getQuotations({ search, status });
  res.status(200).json(
    ApiResponse.success('Quotations retrieved', quotations, { count: quotations.length }).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/quotations/:id
// ─────────────────────────────────────────────
export const getQuotationByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const quotation = await getQuotationById(id);
  res.status(200).json(
    ApiResponse.success('Quotation retrieved', quotation.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/quotations
// ─────────────────────────────────────────────
export const createQuotationHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const result = createQuotationSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw ApiError.badRequest('Validation failed', errors);
  }

  const quotation = await createQuotation(result.data, req.user.userId);
  res.status(201).json(
    ApiResponse.success('Quotation created successfully', quotation.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// PUT /api/quotations/:id
// ─────────────────────────────────────────────
export const updateQuotationHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;

  const result = createQuotationSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw ApiError.badRequest('Validation failed', errors);
  }

  const quotation = await updateQuotation(id, result.data, req.user.userId);
  res.status(200).json(
    ApiResponse.success('Quotation updated successfully', quotation.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// DELETE /api/quotations/:id
// ─────────────────────────────────────────────
export const deleteQuotationHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  await deleteQuotation(id);
  res.status(200).json(
    ApiResponse.success('Quotation deleted successfully').toJSON()
  );
});

// ─────────────────────────────────────────────
// PATCH /api/quotations/:id/status
// ─────────────────────────────────────────────
import { Quotation } from '../models/Quotation.model';

export const patchQuotationStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  const { status } = req.body;

  if (!['Draft', 'Sent', 'Accepted', 'Rejected'].includes(status)) {
    throw ApiError.badRequest('Invalid status value');
  }

  const quotation = await Quotation.findById(id).exec();
  if (!quotation) throw ApiError.notFound('Quotation not found');

  quotation.status = status;
  await quotation.save();

  res.status(200).json(
    ApiResponse.success('Quotation status updated successfully', quotation.toJSON()).toJSON()
  );
});
