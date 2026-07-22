import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import { Quotation } from '../models/Quotation.model';
import { Customer } from '../models/Customer.model';
import { Product } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { buildQuotationHtml } from './pdf-template.service';
import { Settings, ISettings } from '../models/Settings.model';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────
// Helper to convert local images to base64 for PDF
// ─────────────────────────────────────────────
function getLocalImageBase64(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  
  if (url.startsWith('/uploads/')) {
    try {
      const filePath = path.join(__dirname, '../..', url);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
        const buffer = fs.readFileSync(filePath);
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      logger.warn(`Failed to convert local image to base64: ${url}`);
    }
  }
  
  return url;
}

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
  textureName: string;
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
  customerGst: string;
  advancePayment: number;
  deliveryTime: number;
  transportationCharges: number;
  grandTotal: number;
  qrCodeDataUri: string;
  items: PdfItemData[];
  termsAndConditions: string[];
  settings: ISettings | null;
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
    let textureName = item.selectedTexture || '';
    
    // Resolve the dimension string from the product's sizes object
    let resolvedSize = item.selectedSize || '';
    
    let product: any = null;

    // Fetch product to get images and variants
    try {
      product = await Product.findById(item.productId).lean().exec();
      if (product) {
        if (product.sizes && typeof product.sizes === 'object' && !Array.isArray(product.sizes)) {
          const sizeKey = (item.selectedSize || '').toLowerCase() as 'large' | 'medium' | 'small';
          if (sizeKey && (product.sizes as any)[sizeKey]) {
            resolvedSize = (product.sizes as any)[sizeKey];
          }
        }

        // Base image fallback
        if (product.productImages) {
          const productImg = product.productImages.find((img: any) => img.type === 'product');
          const referenceImg = product.productImages.find((img: any) => img.type === 'reference');
          
          if (productImg) productImageUrl = productImg.url;
          if (referenceImg) referenceImageUrl = referenceImg.url;
          
          // Legacy support for older products that might not have variants but use linked images
          if (item.selectedTexture) {
            const selectedTexImg = product.productImages.find((img: any) => img.type === 'texture' && img.url === item.selectedTexture);
            if (selectedTexImg) {
              if (selectedTexImg.name) textureName = selectedTexImg.name;
              if (selectedTexImg.linkedUrl) productImageUrl = selectedTexImg.linkedUrl;
              if (selectedTexImg.linkedReferenceUrl) referenceImageUrl = selectedTexImg.linkedReferenceUrl;
            }
          }
        }
        
        // Variant overrides
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find((v: any) => v.size === item.selectedSize && v.texture === item.selectedTexture);
          if (variant) {
            if (variant.productImage) productImageUrl = variant.productImage;
            if (variant.referenceImage) referenceImageUrl = variant.referenceImage;
            textureName = variant.texture;
          }
        }
      }
    } catch {
      // If product fetch fails, continue with empty images
      logger.warn(`[PDF] Could not fetch product images for ${item.productId}`);
    }

    // Attempt to lookup texture URL from Global Settings
    try {
      const settings = await Settings.findOne().lean().exec();
      if (settings && settings.textures && item.selectedTexture) {
        // If selectedTexture matches a name, use its URL.
        const gt = settings.textures.find((t: any) => t.name === item.selectedTexture);
        if (gt && gt.url) {
          textureImageUrl = gt.url;
        }
      }
    } catch {
       logger.warn(`[PDF] Could not fetch global settings for textures`);
    }

    items.push({
      index: index++,
      productName: item.productSnapshot.productName,
      size: resolvedSize || item.productSnapshot.size || '',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discountPercent: item.discountPercent || 0,
      total: item.total,
      selectedTexture: item.selectedTexture || '',
      textureName,
      productImageUrl: getLocalImageBase64(productImageUrl),
      referenceImageUrl: getLocalImageBase64(referenceImageUrl),
      textureImageUrl: getLocalImageBase64((item.selectedTexture && (item.selectedTexture.startsWith('http') || item.selectedTexture.startsWith('data:image'))) ? item.selectedTexture : textureImageUrl),
    });
  }

    // Calculate summary values
    const totalAmount = quotation.totalAmount;
    const totalDiscount = quotation.totalDiscount || 0;
    // Subtotal is totalAmount + totalDiscount (before discount)
    const subtotal = totalAmount + totalDiscount;
    const discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

  const settings = await Settings.findOne().lean();

  const createdDateObj = new Date(quotation.updatedAt || quotation.createdAt || quotation.createdDate);
  const validTillDateObj = new Date(createdDateObj);
  if (quotation.validTill) {
    validTillDateObj.setDate(validTillDateObj.getDate() + (quotation.validTill.days || 0));
    validTillDateObj.setMonth(validTillDateObj.getMonth() + (quotation.validTill.months || 0));
  } else {
    validTillDateObj.setMonth(validTillDateObj.getMonth() + 1);
  }

  // Transportation + 18%
  const transportationCharges = (quotation.transportationCharges || 0) * 1.18;
  const grandTotal = totalAmount + transportationCharges;

  // Generate QR Code URI
  const upiId = settings?.upiId || '';
  let qrCodeDataUri = '';
  if (upiId) {
    const amountStr = grandTotal.toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(settings?.companyName || 'Neptune Planters')}&am=${amountStr}&cu=INR`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;
    try {
      const resp = await fetch(qrApiUrl);
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        qrCodeDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      // console.error('Failed to fetch QR code from api.qrserver.com', e);
    }
  }

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
    customerGst: (customer as any)?.gstNumber || '',
    advancePayment: quotation.advancePayment || 0,
    deliveryTime: quotation.deliveryTime || 0,
    transportationCharges,
    grandTotal,
    qrCodeDataUri,
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
    settings: settings as any,
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
      waitUntil: 'networkidle0', // Wait for fonts & images to load completely
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
