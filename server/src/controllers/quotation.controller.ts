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
import { generateQuotationPdf, generateQuotationHtml } from '../services/pdf.service';
import { createQuotationSchema } from '../validators/quotation.validator';
import { Quotation } from '../models/Quotation.model';
import { Sale } from '../models/Sale.model';

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
  const quotation = await getQuotationById(id as any);
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

  const quotation = await updateQuotation(id as any, result.data, req.user.userId);

  // Sync Sales Tracking if the quotation is Accepted
  if (quotation.status === 'Accepted') {
    const existingSales = await Sale.find({ quotationId: quotation._id });
    const saleDate = existingSales.length > 0 ? existingSales[0].saleDate : new Date();
    const month = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    const year = saleDate.getFullYear();

    await Sale.deleteMany({ quotationId: quotation._id });

    const sales = quotation.items.map((it: any) => ({
      productId: it.productId,
      quotationId: quotation._id,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalAmount: it.total,
      selectedSize: it.selectedSize,
      selectedTexture: it.selectedTexture,
      saleDate,
      month,
      year
    }));
    
    if (sales.length > 0) {
      await Sale.insertMany(sales);
    }
  } else {
    await Sale.deleteMany({ quotationId: quotation._id });
  }

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
  await deleteQuotation(id as any);
  await Sale.deleteMany({ quotationId: id });
  res.status(200).json(
    ApiResponse.success('Quotation deleted successfully').toJSON()
  );
});

// ─────────────────────────────────────────────
// PATCH /api/quotations/:id/status
// ─────────────────────────────────────────────
export const patchQuotationStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  const { status } = req.body;

  if (!['Draft', 'Sent', 'Accepted', 'Rejected'].includes(status)) {
    throw ApiError.badRequest('Invalid status value');
  }

  const quotation = await Quotation.findById(id).exec();
  if (!quotation) throw ApiError.notFound('Quotation not found');

  const oldStatus = quotation.status;
  quotation.status = status as any;
  await quotation.save();

  // Manage Sales Tracking
  if (oldStatus !== 'Accepted' && status === 'Accepted') {
    const date = new Date();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const year = date.getFullYear();

    const sales = quotation.items.map((it: any) => ({
      productId: it.productId,
      quotationId: quotation._id,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalAmount: it.total,
      selectedSize: it.selectedSize,
      selectedTexture: it.selectedTexture,
      saleDate: date,
      month,
      year
    }));
    
    if (sales.length > 0) {
      await Sale.insertMany(sales);
    }
  } else if (oldStatus === 'Accepted' && status !== 'Accepted') {
    await Sale.deleteMany({ quotationId: quotation._id });
  }

  res.status(200).json(
    ApiResponse.success('Quotation status updated successfully', quotation.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/quotations/:id/pdf
// ─────────────────────────────────────────────
export const getQuotationPdfHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;

  // Optional query param ?html=true for debugging
  if (req.query.html === 'true') {
    const html = await generateQuotationHtml(id as any);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  const pdfBuffer = await generateQuotationPdf(id as any);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Quotation-${id}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  
  return res.status(200).end(pdfBuffer);
});

