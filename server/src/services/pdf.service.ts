import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import { Quotation } from '../models/Quotation.model';
import { Customer } from '../models/Customer.model';
import { Product } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { buildQuotationHtml } from './pdf-template.service';

// ─────────────────────────────────────────────
// Types for PDF template data
// ─────────────────────────────────────────────
export interface PdfItemData {
  index: number;
  productName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  total: number;
  selectedTexture: string;
  productImageUrl: string;
  referenceImageUrl: string;
  textureImageUrl: string;
}

export interface PdfTemplateData {
  quotationId: string;
  createdDate: string;
  validTillDate: string;
  customerDisplayName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  companyDetails: {
    name: string;
    addressLine1: string;
    addressLine2: string;
  };
  summary: {
    subtotal: number;
    discountAmount: number;
    discountPercent: number;
    totalAmount: number;
  };
  items: PdfItemData[];
  termsAndConditions: string[];
}

// ─────────────────────────────────────────────
// Format currency in Indian locale
// ─────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────
// Build template data from quotation
// ─────────────────────────────────────────────
async function buildTemplateData(quotationId: string): Promise<PdfTemplateData> {
  if (!mongoose.Types.ObjectId.isValid(quotationId)) {
    throw ApiError.badRequest('Invalid quotation ID');
  }

  const quotation = await Quotation.findById(quotationId).lean().exec();
  if (!quotation) throw ApiError.notFound('Quotation not found');

  // Fetch full customer for address
  const customer = await Customer.findById(quotation.customerId).lean().exec();

  const customerDisplayName = quotation.customerSnapshot.customerName;

  // Build enriched items with product images
  const items: PdfItemData[] = [];
  let index = 1;
  for (const item of quotation.items) {
    let productImageUrl = '';
    let referenceImageUrl = '';
    let textureImageUrl = '';

    // Fetch product to get images
    try {
      const product = await Product.findById(item.productId).lean().exec();
      if (product && product.productImages) {
        const productImg = product.productImages.find((img: any) => img.type === 'product');
        const referenceImg = product.productImages.find((img: any) => img.type === 'reference');
        const textureImg = product.productImages.find((img: any) => img.type === 'texture');

        if (productImg) productImageUrl = productImg.url;
        if (referenceImg) referenceImageUrl = referenceImg.url;
        if (textureImg) textureImageUrl = textureImg.url;
      }
    } catch {
      // If product fetch fails, continue with empty images
      logger.warn(`[PDF] Could not fetch product images for ${item.productId}`);
    }

    items.push({
      index: index++,
      productName: item.productSnapshot.productName,
      size: item.selectedSize || item.productSnapshot.size || '',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discountPercent: item.discountPercent || 0,
      total: item.total,
      selectedTexture: item.selectedTexture || '',
      productImageUrl,
      referenceImageUrl,
      textureImageUrl: (item.selectedTexture && (item.selectedTexture.startsWith('http') || item.selectedTexture.startsWith('data:image'))) ? item.selectedTexture : textureImageUrl,
    });
  }

    // Calculate summary values
    const totalAmount = quotation.totalAmount;
    const totalDiscount = quotation.totalDiscount || 0;
    // Subtotal is totalAmount + totalDiscount (before discount)
    const subtotal = totalAmount + totalDiscount;
    const discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

  const createdDateObj = new Date(quotation.createdDate);
  const validTillDateObj = new Date(createdDateObj);
  validTillDateObj.setMonth(validTillDateObj.getMonth() + 1);

  return {
    quotationId: quotation.quotationId,
    createdDate: createdDateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    validTillDate: validTillDateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    customerDisplayName,
    customerPhone: customer?.phoneNumber || '',
    customerEmail: customer?.email || '',
    customerAddress: customer?.address || '',
    companyDetails: {
      name: 'NEPTUNE INNOVATIONS',
      addressLine1: 'Sr No 34/1, Holkarwadi, Tukaram Marg,',
      addressLine2: 'Handewadi, Tal.Haveli, Dist. Pune 412308',
    },
    summary: {
      subtotal,
      discountAmount: totalDiscount,
      discountPercent: Math.round(discountPercent * 100) / 100,
      totalAmount,
    },
    items,
    termsAndConditions: quotation.termsAndConditions || [],
  };
}

// ─────────────────────────────────────────────
// Generate PDF buffer from quotation ID
// ─────────────────────────────────────────────
export async function generateQuotationPdf(quotationId: string): Promise<Buffer> {
  const data = await buildTemplateData(quotationId);
  const html = buildQuotationHtml(data);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set viewport to match our 1000px template design
    await page.setViewport({ width: 1000, height: 900 });

    // Load HTML content
    await page.setContent(html, {
      waitUntil: 'load', // Wait for fonts & images to load
      timeout: 30000,
    });

    // Generate PDF formatted to A4 proportions (1000px width maintains layout, 1414px height gives A4 ratio)
    const pdfBuffer = await page.pdf({
      width: '1000px',
      height: '1414px', // 1000 * 1.4142 (A4 aspect ratio)
      printBackground: true, // Preserve backgrounds/colors
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    logger.info(`[PDF] Generated PDF for quotation ${data.quotationId}`);
    return Buffer.from(pdfBuffer);
  } catch (error) {
    logger.error(`[PDF] Failed to generate PDF: ${error}`);
    throw ApiError.internal('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ─────────────────────────────────────────────
// Generate HTML preview (for debugging)
// ─────────────────────────────────────────────
export async function generateQuotationHtml(quotationId: string): Promise<string> {
  const data = await buildTemplateData(quotationId);
  return buildQuotationHtml(data);
}
