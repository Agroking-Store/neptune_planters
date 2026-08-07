import { PdfTemplateData, formatCurrency } from './pdf.service';
import fs from 'fs';
import path from 'path';

// Number to words helper (Indian Number System)
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    if (n === 0) return '';
    let result = '';
    if (n >= 100) {
      result += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      result += twoDigits[n - 10] + ' ';
    } else if (n >= 20 || n > 0) {
      result += tens[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) {
        result += singleDigits[n % 10] + ' ';
      }
    }
    return result;
  }

  let words = '';
  if (num >= 10000000) {
    words += convertLessThanOneThousand(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += convertLessThanOneThousand(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += convertLessThanOneThousand(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  words += convertLessThanOneThousand(num);
  return words.trim();
}

// Load template images and fonts as base64 data URIs
function getImageDataUri(relativePath: string): string {
  try {
    const imgPath = path.resolve(__dirname, '..', '..', 'assets', relativePath);
    const imgBuffer = fs.readFileSync(imgPath);
    const ext = path.extname(relativePath).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mime};base64,${imgBuffer.toString('base64')}`;
  } catch (error) {
    console.warn(`[PDF] Could not load fallback image: ${relativePath}`, error);
    return '';
  }
}

function getFontDataUri(relativePath: string): string {
  try {
    const fontPath = path.resolve(__dirname, '..', '..', 'assets', relativePath);
    const fontBuffer = fs.readFileSync(fontPath);
    return `data:font/ttf;base64,${fontBuffer.toString('base64')}`;
  } catch (error) {
    console.warn(`[PDF] Could not load fallback font: ${relativePath}`, error);
    return '';
  }
}

const logoDataUri = getImageDataUri('Quotation logo.png');
const potDataUri = getImageDataUri('planter img.png');
const sumoFontUri = getFontDataUri('fonts/GreatVibes-Regular.ttf');

export function buildQuotationHtml(data: PdfTemplateData): string {
  // Use settings if available, else fallback to hardcoded defaults
  const settings = data.settings || {} as any;
  const finalLogo = settings.logoImg || logoDataUri;
  const finalPlanter = settings.planterImg || (settings.hideDefaultPlanter ? '' : potDataUri);
  const cName = settings.companyName || 'Neptune Planters';
  const cAdd1 = settings.addressLine1 || 'Sr No 34/1, Holkarwadi,';
  const cAdd2 = settings.addressLine2 || 'Handewadi, Pune-412308';
  const cPhone = settings.phone || '+91 97652 76111';
  const cEmail = settings.email || 'connect@shopneptune.in';
  const cGst = settings.gstNo || '';
  const bName = settings.bankName || 'Punjab National Bank';
  const bAccName = settings.accountName || 'Neptune Inovations';
  const bAccNo = settings.accountNo || '1475202100000767';
  const bIfsc = settings.ifscCode || 'PUNB0147520';
  const bBranch = settings.branch || 'Market Yard, Pune';
  const bUpi = settings.upiId || 'neptuneinnovations@ibl';
  const prepBy = settings.preparedBy || 'Neptune Planters';
  const sigText = settings.signatureText || 'Sumo';
  const fMobile = settings.footerMobile || '+91 97652 76111';
  const fInsta = settings.footerInstagram || '@neptuneplanters';
  const fWeb = settings.footerWebsite || 'www.shopneptune.in';
  const fLoc = settings.footerLocation || 'Sr No 34/1, Holkarwadi, Handewadi, Pune-412308';

  // Generate Items HTML
  const itemsHtml = data.items.map(item => `
        <tr>
          <td class="td-sr">${item.index}</td>
          <td class="td-product">
            <div class="product-name">${item.productName}</div>
            ${item.dimensions ? `<div class="product-dims">${item.dimensions}</div>` : ''}
          </td>
          <td class="td-qty">
            <div>${item.quantity}</div>
            ${item.sizeName ? `<div class="discount-amount" style="text-transform: none; font-weight: normal;">(${item.sizeName})</div>` : ''}
          </td>
          <td class="td-price">${formatCurrency(item.unitPrice).replace('₹', '').trim()}</td>
          <td class="td-discount">
            <div>${item.discountPercent || 0}%</div>
            ${item.discountPercent ? `<div class="discount-amount">(₹${formatCurrency((item.unitPrice * item.quantity) * (item.discountPercent / 100)).replace('₹', '').trim()})</div>` : ''}
          </td>
          <td class="td-total">${formatCurrency(item.total).replace('₹', '').trim()}</td>
          <td class="td-img">
            <div class="img-cell">
              ${item.productImageUrl ? `<img src="${item.productImageUrl}" alt="${item.productName}" />` : ''}
            </div>
          </td>
          <td class="td-img">
            <div class="img-cell">
              ${item.referenceImageUrl ? `<img src="${item.referenceImageUrl}" alt="Reference" />` : ''}
            </div>
          </td>
          <td class="td-img">
            <div class="img-cell img-cell--texture">
              ${item.textureImageUrl ? `<img src="${item.textureImageUrl}" alt="Texture" />` : ''}
              ${item.textureName
      ? `<div style="font-size: 8px; margin-top: 4px; color: #555; text-align: center; line-height: 1.1;">${item.textureName}</div>`
      : (item.selectedTexture && !item.selectedTexture.startsWith('http') && !item.selectedTexture.startsWith('data:image')
        ? `<div style="font-size: 8px; margin-top: 4px; color: #555; text-align: center; line-height: 1.1;">${item.selectedTexture}</div>`
        : '')}
            </div>
          </td>
        </tr>
  `).join('');

  // Generate Terms & Conditions (Notes)
  const termsHtml = data.termsAndConditions && data.termsAndConditions.length > 0
    ? data.termsAndConditions.map(term => `
            <li><span class="bullet"></span><span>${term}</span></li>
    `).join('')
    : `
            <li><span class="bullet"></span><span>Transportation & installation extra as applicable.</span></li>
            <li><span class="bullet"></span><span>Goods once sold will not be taken back or exchanged.</span></li>
            <li><span class="bullet"></span><span>Delivery within 7-10 working days from the date of order.</span></li>
            <li><span class="bullet"></span><span>This quotation is valid for 15 days.</span></li>
      `;

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Neptune Premium Planters — Quotation</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=block"
    rel="stylesheet" />
  <!-- Material Symbols for icons -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
    rel="stylesheet" />

  <style>
    @font-face {
      font-family: 'Great Vibes';
      src: url('${sumoFontUri}') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    /* ═══════════════════════════════════════════
       RESET & BASE
       ═══════════════════════════════════════════ */
    *,
    *::before,
    *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --gold: #9D7E6C;
      --dark: #344450;
      --page: #F9F9F9;
      --table-row: #FFFFFF;
      --text-main: #1a1c1c;
      --text-muted: #43474b;
      --border-light: #e2e2e2;
      --cream-bg: #F9F7F5;
      --light-grey-bg: #F9F7F5;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f0f1f1;
      color: var(--text-main);
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* ═══════════════════════════════════════════
       PAGE CONTAINER (1000px wide)
       ═══════════════════════════════════════════ */
    .page {
      width: 1000px;
      min-height: 1414px;
      margin: 0 auto;
      background: var(--page);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      color: var(--text-main);
      position: relative;
    }

    /* ═══════════════════════════════════════════
       HEADER SECTION
       ═══════════════════════════════════════════ */
    .header {
      display: flex;
      position: relative;
      height: 300px;
    }

    .header__dark-panel {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 42%;
      background: var(--dark);
      clip-path: polygon(0 0, 100% 0, 70% 100%, 0 100%);
      z-index: 0;
    }

    .header__brand {
      width: 28%;
      color: var(--gold);
      padding: 40px 32px 40px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 10;
    }

    .header__logo-img {
      width: 280px;
      height: 110px;
      margin-bottom: 32px;
      object-fit: contain;
    }

    .header__tagline {
      text-align: center;
      font-family: 'Libre Caslon Text', serif;
      font-size: 13.5px;
      font-style: italic;
      color: var(--gold);
      line-height: 1.5;
    }

    /* Planter hero image - overlapping */
    .header__planter-img {
      position: absolute;
      left: 22%;
      top: 16px;
      z-index: 20;
      pointer-events: none;
      transform: scale(0.9);
    }

    .header__planter-img img {
      width: 240px;
      height: auto;
    }

    /* Right side of header */
    .header__right {
      width: 72%;
      display: flex;
      position: relative;
      z-index: 10;
    }

    .header__title-area {
      width: 55%;
      padding-top: 56px;
      padding-left: 120px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .header__title {
      font-family: 'Libre Caslon Text', serif;
      font-size: 28px; 
      color: var(--text-main);
      line-height: 1;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      font-weight: 400;
    }

    .header__title-accent {
      display: flex;
      align-items: center;
      width: 144px;
      margin-bottom: 24px;
    }

    .header__title-accent .line-left {
      width: 32px;
      height: 1px;
      background: var(--gold);
    }

    .header__title-accent .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--gold);
      margin: 0 4px;
    }

    .header__title-accent .line-right {
      flex: 1;
      height: 1px;
      background: var(--gold);
    }

    .header__greeting {
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-muted);
      max-width: 200px;
    }

    /* Meta info area */
    .header__meta {
      width: 45%;
      padding-top: 56px;
      padding-right: 48px;
      padding-left: 16px;
    }

    .header__meta-inner {
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-size: 11px;
      color: var(--text-main);
      border-left: 1px solid var(--border-light);
      padding-left: 32px;
      padding-top: 8px;
      padding-bottom: 8px;
      margin-top: 8px;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .detail-row__icon {
      color: var(--gold);
      font-size: 16px;
      margin-top: -1px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .detail-row__content {
      display: flex;
      flex: 1;
    }

    .detail-row__label {
      width: 112px;
      font-weight: 500;
      flex-shrink: 0;
    }

    .detail-row__value {
      white-space: nowrap;
      line-height: 1.3;
    }

    /* ═══════════════════════════════════════════
       BILL TO / SHIP TO SECTION
       ═══════════════════════════════════════════ */
    .addresses {
      padding: 0 40px;
      margin-top: 24px;
      margin-bottom: 32px;
      display: flex;
    }

    .address-col {
      width: 30%;
      padding-left: 8px;
    }

    .address-col--ship {
      width: 30%;
      padding-left: 32px;
      border-left: 1px solid var(--gold);
    }

    .address-col__header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .address-col__label {
      text-transform: uppercase;
      color: var(--gold);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      margin-right: 16px;
    }

    .address-col__line {
      width: 40px;
      height: 1.5px;
      background: var(--gold);
    }

    .address-col__name {
      font-weight: 600;
      font-size: 13px;
      color: #192C27;
      margin-bottom: 4px;
    }

    .address-col__text {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .address-col__gst {
      font-size: 11px;
      color: var(--text-main);
      margin-top: 16px;
      letter-spacing: 0.025em;
      font-weight: 500;
    }

    .address-col__gstin {
      font-size: 11px;
      color: var(--text-main);
      margin-top: 16px;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    /* Quote block */
    .quote-block {
      width: 40%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-left: 16px;
    }

    .quote-block__inner {
      text-align: center;
      width: 95%;
      background: var(--cream-bg);
      padding: 24px 24px 20px;
      border-radius: 2px;
    }

    .quote-block__mark {
      color: var(--gold);
      font-size: 40px;
      font-family: 'Libre Caslon Text', serif;
      line-height: 1;
      display: block;
      margin-bottom: 4px;
    }

    .quote-block__text {
      font-family: 'Libre Caslon Text', serif;
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-main);
    }

    .quote-block__divider {
      width: 24px;
      height: 1.5px;
      background: var(--gold);
      margin: 16px auto 0;
    }

    /* ═══════════════════════════════════════════
       PRODUCT TABLE
       ═══════════════════════════════════════════ */
    .table-section {
      padding: 0 32px;
      margin-bottom: 24px;
      margin-top: 8px;
    }

    .product-table {
      width: 100%;
      text-align: center;
      border-collapse: collapse;
      border-bottom: 1px solid var(--border-light);
    }

    .product-table thead th {
      background: var(--dark);
      color: var(--gold);
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 16px 8px;
    }

    .product-table thead th.w-sr { width: 6%; }
    .product-table thead th.w-product { width: 12%; }
    .product-table thead th.w-qty { width: 5%; }
    .product-table thead th.w-unit { width: 10%; }
    .product-table thead th.w-discount { width: 8%; }
    .product-table thead th.w-total { width: 10%; }
    .product-table thead th.w-pimg { width: 17%; }
    .product-table thead th.w-rimg { width: 16%; }
    .product-table thead th.w-texture { width: 16%; }

    .product-table tbody td {
      padding: 8px;
      vertical-align: middle;
      border-bottom: 1px solid var(--border-light);
      border-left: 1px solid var(--border-light);
      border-right: 1px solid var(--border-light);
      font-size: 14px;
      color: var(--text-main);
      background: var(--table-row);
    }

    .product-table tbody td.td-product {
      text-align: center;
    }

    .product-name {
      font-weight: 700;
      font-size: 13px;
      color: #192C27;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      line-height: 1.3;
      margin-bottom: 4px;
      margin-top: 4px;
    }

    .product-dims {
      color: #74777c;
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      padding-bottom: 4px;
    }

    .product-table tbody td.td-img {
      padding: 2px 8px;
    }

    .img-cell img {
      width: 100%;
      max-width: 160px;
      height: 95px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .img-cell--texture img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      max-width: none;
    }

    /* ═══════════════════════════════════════════
       SUMMARY SECTION (Notes + Bank + Totals)
       ═══════════════════════════════════════════ */
    .summary-section {
      padding: 0 32px;
      display: flex;
    }

    /* Notes column */
    .notes-col {
      width: 33%;
      padding-right: 16px;
      padding-bottom: 8px;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header__title {
      text-transform: uppercase;
      color: var(--gold);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      margin-right: 16px;
    }

    .section-header__line {
      width: 40px;
      height: 1.5px;
      background: var(--gold);
    }

    .notes-list {
      list-style: none;
      padding: 0;
    }

    .notes-list li {
      display: flex;
      align-items: flex-start;
      font-size: 11px;
      color: var(--text-main);
      line-height: 1.6;
      margin-bottom: 10px;
    }

    .notes-list .bullet {
      display: inline-block;
      margin-right: 8px;
      margin-top: 6px;
      width: 3px;
      height: 3px;
      background: var(--text-main);
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Bank Details column */
    .bank-col {
      width: 33%;
      padding-left: 32px;
      border-left: 1px solid var(--gold);
      padding-bottom: 8px;
    }

    .bank-details {
      font-size: 11px;
      color: var(--text-main);
    }

    .bank-row {
      display: flex;
      margin-bottom: 12px;
    }

    .bank-row__label {
      width: 75px;
      font-weight: 500;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .bank-row__sep {
      margin-right: 32px;
      color: var(--text-muted);
    }

    .bank-row__value {
      font-weight: 500;
      color: var(--text-main);
    }

    /* Totals column */
    .totals-col {
      width: 34%;
      margin-left: auto;
      display: flex;
      flex-direction: column;
    }

    .totals-row {
      display: flex;
      border: 1px solid var(--border-light);
      border-bottom: none;
      background: var(--light-grey-bg);
    }

    .totals-row__label {
      padding: 16px 20px;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      width: 50%;
      border-right: 1px solid var(--border-light);
    }

    .totals-row__value {
      padding: 16px 20px;
      text-align: right;
      width: 50%;
      font-size: 14px;
      font-weight: 500;
    }

    .grand-total-box {
      background: var(--dark);
      color: white;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .grand-total__label {
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.1em;
      color: var(--gold);
      margin-bottom: 4px;
    }

    .grand-total__amount {
      font-family: 'Libre Caslon Text', serif;
      font-size: 32px;
      color: var(--gold);
      letter-spacing: 0.05em;
      line-height: 1;
      margin-bottom: 8px;
    }

    .grand-total__words {
      font-size: 10px;
      color: #c3c7cb;
      line-height: 1.4;
    }

    /* ═══════════════════════════════════════════
       PRE-FOOTER (Signature + Thank You + QR)
       ═══════════════════════════════════════════ */
    .pre-footer {
      margin: auto 40px 32px;
      padding-top: 32px;
      border-top: 1px solid var(--border-light);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    /* Signature */
    .signature-area {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 25%;
      padding-left: 8px;
      position: relative;
    }

    .signature-area__prepared {
      font-size: 10.5px;
      color: #74777c;
      margin-bottom: 4px;
    }

    .product-dims {
      font-size: 10px;
      color: #74777c;
      margin-top: 4px;
    }

    .discount-amount {
      font-size: 10px;
      color: #74777c;
      margin-top: 4px;
    }

    .signature-area__name {
      font-size: 11.5px;
      color: var(--text-main);
      font-weight: 500;
      position: relative;
      z-index: 10;
      background: var(--page);
      padding-right: 8px;
    }

    .signature-area__sig {
      font-family: 'Great Vibes', cursive;
      font-size: 36px;
      color: var(--text-main);
      margin-top: 8px;
      margin-left: -8px;
      margin-bottom: -8px;
      position: relative;
      z-index: 10;
      transform: rotate(-2deg);
    }

    /* Thank you */
    .thank-you {
      text-align: center;
      width: 40%;
      padding-bottom: 14px;
    }

    .thank-you p {
      font-family: 'Libre Caslon Text', serif;
      font-size: 15px;
      color: var(--text-main);
      line-height: 1.6;
    }

    .thank-you__divider {
      width: 32px;
      height: 1.5px;
      background: var(--gold);
      margin: 16px auto 0;
    }

    /* QR section */
    .qr-section {
      width: 35%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding-right: 8px;
      padding-bottom: 8px;
    }

    .qr-section__line {
      height: 90px;
      width: 1.5px;
      background: var(--gold);
      margin-right: 20px;
      opacity: 0.4;
    }

    .qr-section__code {
      border: 2px solid var(--gold);
      padding: 6px;
      border-radius: 4px;
      margin-right: 20px;
      flex-shrink: 0;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .qr-section__code img {
      width: 80px;
      height: 80px;
      display: block;
    }

    .qr-section__text {
      display: flex;
      flex-direction: column;
      width: 130px;
      padding-top: 4px;
    }

    .qr-section__label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-main);
      line-height: 1.3;
    }

    .qr-section__arrow {
      width: 140px;
      height: 20px;
      margin-top: 8px;
      margin-left: -8px;
      color: var(--gold);
    }

    /* ═══════════════════════════════════════════
       BOTTOM CONTACT BAR
       ═══════════════════════════════════════════ */
    .contact-bar {
      background: var(--dark);
      color: var(--gold);
      padding: 14px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      letter-spacing: 0.05em;
    }

    .contact-bar__item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .contact-bar__item + .contact-bar__item {
      margin-left: 16px;
    }

    .contact-bar__icon {
      font-size: 14px;
      display: flex;
      align-items: center;
    }

    .contact-bar__address {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 240px;
      line-height: 1.3;
      font-size: 10px;
    }

    .contact-bar__address .contact-bar__icon {
      flex-shrink: 0;
    }

    @media print {
      body {
        background: white;
      }
      .page {
        box-shadow: none;
        margin: 0;
      }
      tr, .product-table tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .summary-section, .pre-footer, .addresses, .contact-bar, .header {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>

<body>

  <main class="page">

    <!-- ═══════════════ HEADER ═══════════════ -->
    <header class="header">
      <!-- Dark diagonal panel -->
      <div class="header__dark-panel"></div>

      <!-- Brand area (left) -->
      <div class="header__brand">
        ${finalLogo ? `<img src="${finalLogo}" alt="Logo" class="header__logo-img" />` : ''}
        <div class="header__tagline">
          <p>Crafted Spaces.</p>
          <p>Timeless Design.</p>
        </div>
      </div>

      <!-- Planter hero image -->
      <div class="header__planter-img">
        ${finalPlanter ? `<img src="${finalPlanter}" alt="Planter" />` : ''}
      </div>

      <!-- Right side -->
      <div class="header__right">
        <!-- Title area -->
        <div class="header__title-area">
          <h2 class="header__title">QUOTATION</h2>
          <div class="header__title-accent">
            <div class="line-left"></div>
            <div class="dot"></div>
            <div class="line-right"></div>
          </div>
          <p class="header__greeting">
            We are pleased to submit our quotation as per your requirements.            
          </p>
        </div>

        <!-- Meta info -->
        <div class="header__meta">
          <div class="header__meta-inner">
            <div class="detail-row">
              <span class="detail-row__icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></span>
              <div class="detail-row__content">
                <span class="detail-row__label">Quotation No.</span>
                <span class="detail-row__value">: &nbsp;${data.quotationId}</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-row__icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg></span>
              <div class="detail-row__content">
                <span class="detail-row__label">Date</span>
                <span class="detail-row__value">: &nbsp;${data.createdDate}</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-row__icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg></span>
              <div class="detail-row__content">
                <span class="detail-row__label">Valid Till</span>
                <span class="detail-row__value">: &nbsp;${data.validTillDate}</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-row__icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></span>
              <div class="detail-row__content">
                <span class="detail-row__label">Payment Terms</span>
                <span class="detail-row__value">: &nbsp;${data.advancePayment}% Advance</span>
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-row__icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 8h-3V4H3v13h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></span>
              <div class="detail-row__content">
                <span class="detail-row__label">Delivery</span>
                <span class="detail-row__value">: &nbsp;${data.deliveryTime} Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══════════════ BILL TO / SHIP TO ═══════════════ -->
    <section class="addresses">
      <div class="address-col">
        <div class="address-col__header">
          <h3 class="address-col__label">COMPANY DETAILS</h3>
          <div class="address-col__line"></div>
        </div>
        <h4 class="address-col__name">${cName}</h4>
        <p class="address-col__text">
          ${cAdd1}<br/>${cAdd2}<br/>
          Phone: ${cPhone}<br/>
          Email: ${cEmail}
        </p>
        ${cGst ? `<p class="address-col__gst">GSTIN: ${cGst}</p>` : ''}
      </div>

      <div class="address-col address-col--ship">
        <div class="address-col__header">
          <h3 class="address-col__label">CLIENT DETAILS</h3>
          <div class="address-col__line"></div>
        </div>
        <h4 class="address-col__name">${data.customerDisplayName}</h4>
        <p class="address-col__text">
          ${data.customerPhone ? `Phone: ${data.customerPhone}<br/>` : ''}
          ${data.customerEmail ? `Email: ${data.customerEmail}<br/>` : ''}
          ${data.customerAddress ? data.customerAddress.replace(/\n/g, '<br/>') : ''}
        </p>
        ${data.customerGst ? `<p class="address-col__gst">GSTIN: ${data.customerGst}</p>` : ''}
      </div>

      <div class="quote-block">
        <div class="quote-block__inner">
          <span class="quote-block__mark">\u201C</span>
          <p class="quote-block__text">
            We don't just make planters,<br>
            we craft spaces that<br>
            leave impressions.
          </p>
          <div class="quote-block__divider"></div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ PRODUCT TABLE ═══════════════ -->
    <section class="table-section">
      <table class="product-table">
        <thead>
          <tr>
            <th class="w-sr">SR. NO.</th>
            <th class="w-product">PRODUCT</th>
            <th class="w-qty">QTY</th>
            <th class="w-unit">UNIT PRICE (₹)</th>
            <th class="w-discount">DISC. %</th>
            <th class="w-total">TOTAL (₹)</th>
            <th class="w-pimg">PRODUCT IMG</th>
            <th class="w-rimg">REFERENCE IMG</th>
            <th class="w-texture">COLOUR</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </section>

    <!-- ═══════════════ SUMMARY (Notes + Bank + Totals) ═══════════════ -->
    <section class="summary-section">

      <div class="notes-col">
        <div class="section-header">
          <h3 class="section-header__title">TERMS & CONDITIONS</h3>
          <div class="section-header__line"></div>
        </div>
        <ul class="notes-list">
          ${termsHtml}
        </ul>
      </div>

      <!-- Bank Details - Mocked, not in current data model -->
      <div class="bank-col">
        <div class="section-header">
          <h3 class="section-header__title">BANK DETAILS</h3>
          <div class="section-header__line"></div>
        </div>
        <div class="bank-details">
          <div class="bank-row">
            <span class="bank-row__label">Bank Name</span>
            <span class="bank-row__sep">:</span>
            <span class="bank-row__value">${bName}</span>
          </div>
          <div class="bank-row">
            <span class="bank-row__label">A/C Name</span>
            <span class="bank-row__sep">:</span>
            <span class="bank-row__value">${bAccName}</span>
          </div>
          <div class="bank-row">
            <span class="bank-row__label">A/C No.</span>
            <span class="bank-row__sep">:</span>
            <span class="bank-row__value">${bAccNo}</span>
          </div>
          <div class="bank-row">
            <span class="bank-row__label">IFSC Code</span>
            <span class="bank-row__sep">:</span>
            <span class="bank-row__value">${bIfsc}</span>
          </div>
          <div class="bank-row">
            <span class="bank-row__label">Branch</span>
            <span class="bank-row__sep">:</span>
            <span class="bank-row__value">${bBranch}</span>
          </div>
          ${bUpi ? `
          <div class="bank-row">
            <span class="bank-row__label">UPI ID</span>
            <span class="bank-row__sep">:</span>
            <span class="bank-row__value">${bUpi}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- Totals -->
      <div class="totals-col">
        <div class="totals-row">
          <span class="totals-row__label">SUBTOTAL</span>
          <span class="totals-row__value">${formatCurrency(data.summary.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span class="totals-row__label">DISCOUNT (${data.summary.discountPercent}%)</span>
          <span class="totals-row__value">- ${formatCurrency(data.summary.discountAmount)}</span>
        </div>
        ${data.transportationCharges > 0 ? `
        <div class="totals-row">
          <span class="totals-row__label">TRANSPORTATION CHARGES</span>
          <span class="totals-row__value">+ ${formatCurrency(data.transportationCharges)}</span>
        </div>` : ''}
        <div class="grand-total-box">
          <span class="grand-total__label">GRAND TOTAL</span>
          <span class="grand-total__amount">${formatCurrency(data.grandTotal)}</span>
          <p class="grand-total__words">
            (Rupees ${numberToWords(Math.round(data.grandTotal))} Only)
          </p>
        </div>
      </div>
    </section>

    <!-- ═══════════════ PRE-FOOTER ═══════════════ -->
    <div class="pre-footer">

      <!-- Signature -->
      <div class="signature-area">
        <span class="signature-area__prepared">Prepared By</span>
        <span class="signature-area__name">${prepBy}</span>
        <div class="signature-area__sig">${sigText}</div>
      </div>

      <!-- Thank You -->
      <div class="thank-you">
        <p>
          Thank you for considering Neptune.<br/>
          We look forward to being a part of<br/>
          your beautiful journey.
        </p>
        <div class="thank-you__divider"></div>
      </div>

      <!-- QR Section -->
      <div class="qr-section">
        <div class="qr-section__line"></div>
        <div class="qr-section__code">
          <img src="${data.qrCodeDataUri || 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://shopneptune.in/&color=000&bgcolor=fff&margin=0'}" alt="QR Code" />
        </div>
        <div class="qr-section__text">
          <span class="qr-section__label">SCAN TO PAY</span>
          <span class="qr-section__label">EXACT AMOUNT</span>
          <svg class="qr-section__arrow" viewBox="0 0 140 20" fill="none" stroke="currentColor">
            <path d="M2 16 L125 16 Q135 16, 137 5 M132 8 L137 5 L140 10" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- ═══════════════ BOTTOM CONTACT BAR ═══════════════ -->
    <div class="contact-bar">
      <span class="contact-bar__item">
        <span class="contact-bar__icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></span>
        <span>${fMobile}</span>
      </span>
      <span class="contact-bar__item">
        <span class="contact-bar__icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </span>
        <span>${fInsta || '@neptuneplanters'}</span>
      </span>
      <span class="contact-bar__item">
        <span class="contact-bar__icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 013.9-3.56c-.6 1.11-1.06 2.31-1.38 3.56zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.34.16-2h4.68c.09.66.16 1.32.16 2s-.07 1.34-.16 2zm1.18 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg></span>
        <span>${fWeb}</span>
      </span>
      <span class="contact-bar__item">
        <span class="contact-bar__icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></span>
        <span>${fLoc}</span>
      </span>
    </div>

  </main>
</body>
</html>`;
}
