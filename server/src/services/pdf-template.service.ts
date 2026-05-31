import { PdfTemplateData, formatCurrency } from './pdf.service';

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

export function buildQuotationHtml(data: PdfTemplateData): string {
  // Generate Items HTML
  const itemsHtml = data.items.map(item => `
        <tr>
          <td>${item.index}</td>
          <td>
            <div class="product-cell">
              <div class="product-cell__name">${item.productName}</div>
              <div class="product-cell__dims">${item.size}</div>
            </div>
          </td>
          <td>${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice).replace('₹', '').trim()}</td>
          <td class="text-right">${formatCurrency(item.total).replace('₹', '').trim()}</td>
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
              ${item.textureImageUrl
      ? `<img src="${item.textureImageUrl}" alt="Texture" />`
      : (item.selectedTexture ? `<span>${item.selectedTexture}</span>` : '')}
            </div>
          </td>
        </tr>
  `).join('');

  // Generate Terms & Conditions
  const termsHtml = data.termsAndConditions && data.termsAndConditions.length > 0
    ? data.termsAndConditions.map(term => `<li>${term}</li>`).join('')
    : `
        <li>Transportation & installation extra as applicable.</li>
        <li>Goods once sold will not be taken back or exchanged.</li>
        <li>Delivery within 7–10 working days from the date of order.</li>
        <li>This quotation is valid for 15 days.</li>
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
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
    rel="stylesheet" />
  <!-- Material Symbols for icons -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    rel="stylesheet" />

  <style>
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
      --dark: #171717;
      --gold: #C9A15D;
      --light-gold: #D8C29A;
      --cream: #F9F6F1;
      --light-grey: #F7F4F0;
      --white: #FFFFFF;
      --text: #333333;
      --text-light: #777777;
      --border: #E5E7EB;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #E8E8E8;
      color: var(--text);
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .serif {
      font-family: 'Playfair Display', serif;
    }

    .sans {
      font-family: 'Inter', sans-serif;
    }

    /* ═══════════════════════════════════════════
       PAGE CONTAINER (1200px wide "paper")
       ═══════════════════════════════════════════ */
    .page {
      max-width: 1200px;
      margin: 40px auto;
      background: var(--white);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    /* ═══════════════════════════════════════════
       HEADER — Trapezoid hero
       ═══════════════════════════════════════════ */
    .header {
      position: relative;
      display: flex;
      min-height: 310px;
      overflow: hidden;
    }

    .header__trapezoid-gold {
      position: absolute;
      top: 0;
      left: 0;
      width: 46%;
      height: 100%;
      clip-path: polygon(0 0, 100% 0, 72% 100%, 0% 100%);
      background: var(--gold);
      z-index: 1;
    }

    .header__trapezoid-dark {
      position: absolute;
      top: 0;
      left: 0;
      width: 45%;
      height: 100%;
      clip-path: polygon(0 0, 100% 0, 70% 100%, 0% 100%);
      background: var(--dark);
      z-index: 2;
    }

    .header__brand {
      position: relative;
      z-index: 10;
      width: 36%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
      color: var(--white);
    }

    .header__logo {
      font-family: 'Playfair Display', serif;
      font-size: 38px;
      font-weight: 400;
      letter-spacing: 0.45em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 6px;
    }

    .header__subtitle {
      font-size: 10px;
      letter-spacing: 0.22em;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
      text-transform: uppercase;
    }

    .header__divider {
      width: 80px;
      height: 1px;
      background: rgba(201, 161, 93, 0.45);
      margin: 28px 0 32px;
    }

    .header__tagline {
      font-family: 'Playfair Display', serif;
      font-size: 21px;
      font-weight: 300;
      color: var(--light-gold);
      line-height: 1.45;
      text-align: center;
    }

    .header__info {
      position: relative;
      z-index: 10;
      width: 64%;
      display: flex;
      padding: 40px 48px 40px 14%;
      gap: 32px;
    }

    .header__info-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .header__title {
      font-family: 'Playfair Display', serif;
      font-size: 38px;
      font-weight: 400;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--dark);
      line-height: 1;
      margin-bottom: 8px;
    }

    .header__title-accent {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 20px;
    }

    .header__title-accent::before,
    .header__title-accent::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(201, 161, 93, 0.5);
      max-width: 20px;
    }

    .header__title-accent .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--gold);
    }

    .header__greeting {
      font-size: 13px;
      font-weight: 600;
      color: var(--dark);
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }

    .header__greeting-sub {
      font-size: 11px;
      color: #999;
      font-weight: 400;
      line-height: 1.5;
    }

    .header__info-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .detail-row {
      display: flex;
      align-items: center;
      padding: 5px 0;
    }

    .detail-row__icon {
      width: 28px;
      flex-shrink: 0;
      color: var(--gold);
      font-size: 16px;
      display: flex;
      align-items: center;
    }

    .detail-row__label {
      width: 105px;
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #999;
    }

    .detail-row__sep {
      width: 16px;
      text-align: center;
      color: #ccc;
      font-size: 11px;
    }

    .detail-row__value {
      font-size: 12px;
      font-weight: 600;
      color: var(--dark);
    }

    /* ═══════════════════════════════════════════
       ADDRESS SECTION
       ═══════════════════════════════════════════ */
    .addresses {
      display: flex;
      border-bottom: 1px solid var(--border);
    }

    .address-col {
      flex: 1;
      padding: 36px 40px;
    }

    .address-col+.address-col {
      border-left: 1px solid var(--border);
    }

    .address-col__label {
      font-size: 11px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .address-col__name {
      font-size: 17px;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 8px;
    }

    .address-col__text {
      font-size: 13px;
      color: #666;
      line-height: 1.65;
    }

    .quote-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--cream);
      padding: 32px 36px;
      border-left: 1px solid var(--border);
    }

    .quote-block__mark {
      font-family: 'Playfair Display', serif;
      font-size: 72px;
      line-height: 0.5;
      color: var(--gold);
      opacity: 0.35;
      margin-bottom: 8px;
    }

    .quote-block__text {
      font-family: 'Playfair Display', serif;
      font-size: 17px;
      font-style: italic;
      color: var(--dark);
      line-height: 1.55;
      text-align: center;
    }

    /* ═══════════════════════════════════════════
       PRODUCT TABLE
       ═══════════════════════════════════════════ */
    .table-section {
      padding: 40px 40px 0;
    }

    .product-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .product-table thead th {
      background: var(--dark);
      color: var(--gold);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 14px 12px;
      text-align: center;
      border: none;
    }

    .product-table thead th:first-child {
      text-align: center;
    }

    .product-table thead th.text-right {
      text-align: right;
    }

    .product-table thead th.text-left {
      text-align: left;
    }

    .product-table tbody td {
      padding: 14px 12px;
      vertical-align: middle;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      text-align: center;
      font-size: 13px;
      color: var(--text);
    }

    .product-table tbody td.td-img {
      padding: 2px;
    }

    .product-table tbody td:last-child {
      border-right: none;
    }

    .product-table tbody td.text-right {
      text-align: right;
    }

    .product-table tbody td.text-left {
      text-align: left;
    }

    .product-table tbody tr:last-child td {
      border-bottom: 1px solid var(--border);
    }

    .product-cell {
      text-align: center;
    }

    .product-cell__name {
      font-weight: 600;
      color: var(--dark);
      font-size: 13px;
    }

    .product-cell__dims {
      font-size: 11px;
      color: #aaa;
      margin-top: 3px;
      font-weight: 400;
    }

    .img-cell img {
      width: 100%;
      height: 90px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .img-cell--texture img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
    }

    /* ═══════════════════════════════════════════
       NOTES + TOTALS
       ═══════════════════════════════════════════ */
    .notes-totals {
      display: flex;
      padding: 28px 40px 40px;
      gap: 32px;
    }

    .notes-col {
      flex: 2;
    }

    .notes-col h3 {
      font-size: 11px;
      font-weight: 700;
      color: var(--gold);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .notes-col ul {
      padding-left: 18px;
      list-style: disc;
    }

    .notes-col li {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 6px;
    }

    .totals-col {
      flex: 1;
    }

    .totals-box {
      background: var(--light-grey);
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid #D5D5D5;
    }

    .totals-row:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .grand-total {
      background: var(--dark);
      color: var(--white);
      padding: 28px 28px 24px;
      margin: 0 -28px -24px;
    }

    .grand-total__label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--gold);
      margin-bottom: 8px;
      font-weight: 600;
    }

    .grand-total__amount {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 600;
      color: var(--gold);
      margin-bottom: 6px;
    }

    .grand-total__words {
      font-size: 10px;
      font-style: italic;
      color: #999;
      line-height: 1.5;
    }

    /* ═══════════════════════════════════════════
       FOOTER — Signature + Thank you + QR
       ═══════════════════════════════════════════ */
    .footer-top {
      padding: 0 40px 40px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 32px;
      border-top: 1px solid var(--border);
    }

    .prepared-by__label {
      font-size: 12px;
      color: var(--gold);
      margin-bottom: 4px;
      font-weight: 500;
    }

    .prepared-by__name {
      font-size: 14px;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 16px;
    }

    .prepared-by__sig {
      width: 180px;
      height: 40px;
      border-bottom: 1px solid #ccc;
      position: relative;
    }

    .prepared-by__sig span {
      position: absolute;
      bottom: 2px;
      left: 0;
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-style: italic;
      color: #bbb;
    }

    .thank-you {
      text-align: center;
      padding: 0 24px;
    }

    .thank-you p {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-style: italic;
      color: var(--dark);
      line-height: 1.6;
    }

    .qr-box {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--border);
      padding: 8px 12px;
    }

    .qr-box__img {
      width: 56px;
      height: 56px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .qr-box__text {
      font-size: 11px;
      font-weight: 700;
      color: var(--dark);
      line-height: 1.4;
      text-transform: uppercase;
    }

    /* ═══════════════════════════════════════════
       CONTACT BAR
       ═══════════════════════════════════════════ */
    .contact-bar {
      background: var(--dark);
      color: var(--white);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 40px;
      font-size: 11px;
    }

    .contact-bar__left {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .contact-bar__item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .contact-bar__icon {
      color: var(--gold);
      font-size: 14px;
    }

    .contact-bar__right {
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: right;
    }

    @media print {
      body {
        background: white;
      }
      .page {
        box-shadow: none;
        margin: 0;
        max-width: none;
      }
      tr, .product-table tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .notes-totals, .footer-top, .addresses, .quote-block, .contact-bar, .header {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>

<body>

  <main class="page">

    <header class="header">
      <div class="header__trapezoid-gold"></div>
      <div class="header__trapezoid-dark"></div>

      <div class="header__brand">
        <h1 class="header__logo">Neptune</h1>
        <p class="header__subtitle">Premium Planters</p>
        <div class="header__divider"></div>
        <p class="header__tagline">Crafted Spaces.<br>Timeless Design.</p>
      </div>

      <div class="header__info">
        <div class="header__info-left">
          <h2 class="header__title">Quotation</h2>
          <div class="header__title-accent">
            <div class="dot"></div>
          </div>
          <p class="header__greeting">Thank you for considering Neptune.</p>
          <p class="header__greeting-sub">We are pleased to submit our quotation as per your requirements.</p>
        </div>

        <div class="header__info-right">
          <div class="detail-row">
            <span class="detail-row__icon"><span class="material-symbols-outlined" style="font-size:16px">description</span></span>
            <span class="detail-row__label">Quotation No.</span>
            <span class="detail-row__sep">:</span>
            <span class="detail-row__value">${data.quotationId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row__icon"><span class="material-symbols-outlined" style="font-size:16px">calendar_today</span></span>
            <span class="detail-row__label">Date</span>
            <span class="detail-row__sep">:</span>
            <span class="detail-row__value">${data.createdDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row__icon"><span class="material-symbols-outlined" style="font-size:16px">event_available</span></span>
            <span class="detail-row__label">Valid Till</span>
            <span class="detail-row__sep">:</span>
            <span class="detail-row__value">${data.validTillDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row__icon"><span class="material-symbols-outlined" style="font-size:16px">payments</span></span>
            <span class="detail-row__label">Payment Terms</span>
            <span class="detail-row__sep">:</span>
            <span class="detail-row__value">50% Advance, 50% Before Dispatch</span>
          </div>
          <div class="detail-row">
            <span class="detail-row__icon"><span class="material-symbols-outlined" style="font-size:16px">local_shipping</span></span>
            <span class="detail-row__label">Delivery</span>
            <span class="detail-row__sep">:</span>
            <span class="detail-row__value">7 – 10 Working Days</span>
          </div>
        </div>
      </div>
    </header>

    <section class="addresses">
      <div class="address-col">
        <p class="address-col__label">Bill To</p>
        <p class="address-col__name">${data.customerDisplayName}</p>
        <p class="address-col__text">
          ${data.customerEmail ? data.customerEmail + '<br>' : ''}
          ${data.customerPhone ? data.customerPhone + '<br>' : ''}
          ${data.customerAddress}
        </p>
      </div>
      <div class="address-col">
        <p class="address-col__label">Ship To</p>
        <p class="address-col__name">${data.customerDisplayName}</p>
        <p class="address-col__text">
          ${data.customerEmail ? data.customerEmail + '<br>' : ''}
          ${data.customerPhone ? data.customerPhone + '<br>' : ''}
          ${data.customerAddress}
        </p>
      </div>
      <div class="quote-block">
        <span class="quote-block__mark">"</span>
        <p class="quote-block__text">
          We don't just make planters,<br>
          we craft spaces that<br>
          leave impressions.
        </p>
      </div>
    </section>

    <section class="table-section">
      <table class="product-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Product</th>
            <th>Qty</th>
            <th class="text-right">Unit Price (₹)</th>
            <th class="text-right">Total (₹)</th>
            <th>Product Img</th>
            <th>Reference Img</th>
            <th>Stone Texture</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </section>

    <section class="notes-totals">
      <div class="notes-col">
        <h3>Terms & Conditions</h3>
        <ul>
          ${termsHtml}
        </ul>
      </div>
      <div class="totals-col">
        <div class="totals-box">
          <div class="totals-row">
            <span>SUBTOTAL</span>
            <span>${formatCurrency(data.summary.subtotal)}</span>
          </div>
          <div class="totals-row">
            <span>TAX @ 18%</span>
            <span>${formatCurrency(data.summary.taxAmount)}</span>
          </div>
          <div class="grand-total">
            <p class="grand-total__label">Grand Total</p>
            <p class="grand-total__amount">${formatCurrency(data.summary.totalAmount)}</p>
            <p class="grand-total__words">(Rupees ${numberToWords(Math.round(data.summary.totalAmount))} Only)</p>
          </div>
        </div>
      </div>
    </section>

    <div class="footer-top">
      <div class="footer-content">
        <div>
          <p class="prepared-by__label">Prepared By</p>
          <p class="prepared-by__name">Neptune Innovations</p>
          <div class="prepared-by__sig">
            <span>Signature</span>
          </div>
        </div>

        <div class="thank-you">
          <p>
            Thank you for your business.<br>
            We look forward to being a part of<br>
            your beautiful journey.
          </p>
        </div>

        <div class="qr-box">
          <img class="qr-box__img"
            src="https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=https://www.shopneptune.in"
            alt="QR Code" />
          <div class="qr-box__text">Scan to Visit<br>Our Collection</div>
        </div>
      </div>
    </div>

    <div class="contact-bar">
      <div class="contact-bar__left">
        <span class="contact-bar__item">
          <span class="contact-bar__icon">☎</span>
          <span>+91 97652 76111</span>
        </span>
        <span class="contact-bar__item">
          <span class="contact-bar__icon">✉</span>
          <span>connect@shopneptune.in</span>
        </span>
        <span class="contact-bar__item">
          <span class="contact-bar__icon">🌐</span>
          <span>www.shopneptune.in</span>
        </span>
      </div>
      <div class="contact-bar__right">
        <span class="contact-bar__icon">📍</span>
        <span>Holkarwadi, Handewadi,<br>Pune – 411028</span>
      </div>
    </div>

  </main>
</body>
</html>`;
}
