import { PdfTemplateData, formatCurrency } from './pdf.service';

export function buildQuotationHtml(data: PdfTemplateData): string {
  // Build product cards HTML
  const itemsHtml = data.items.map(item => `
    <article class="no-break bg-surface-container-lowest rounded-xl shadow-[0_2px_16px_rgba(58,48,42,0.04)] border border-outline-variant/40 overflow-hidden">
      <div class="p-5 flex flex-col gap-5">
        <!-- Title row -->
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-outline uppercase tracking-[0.12em] block">Item ${item.index}</span>
          <div class="flex items-baseline justify-between">
            <h2 class="font-headline text-[26px] font-bold text-on-background leading-tight">${item.productName}</h2>
            <p class="price-highlight font-bold text-xl">${formatCurrency(item.total)}</p>
          </div>
          <p class="text-[12.5px] text-on-surface-variant">${item.size}</p>
        </div>

        <!-- Image grid -->
        <div class="grid grid-cols-2 gap-3.5">
          <!-- Product image -->
          <div class="aspect-square bg-surface-container rounded-lg overflow-hidden flex items-center justify-center p-2">
            ${item.productImageUrl ? `<img alt="${item.productName} Planter" class="w-full h-full object-contain mix-blend-multiply" src="${item.productImageUrl}">` : ''}
          </div>
          <!-- Reference image -->
          <div class="aspect-square bg-surface-container rounded-lg overflow-hidden">
            ${item.referenceImageUrl ? `<img alt="${item.productName} Reference" class="w-full h-full object-cover" src="${item.referenceImageUrl}">` : ''}
          </div>
        </div>

        <!-- Texture & Qty row -->
        <div class="flex items-center justify-between pt-4 border-t border-outline-variant/40">
          <div class="flex items-center gap-2.5">
            <span class="text-[12.5px] text-on-surface-variant">Texture:</span>
            ${item.textureImageUrl ? `<img src="${item.textureImageUrl}" alt="Texture" class="w-8 h-8 rounded-full shadow-sm object-cover border border-outline-variant/30">` : `<span class="text-[12.5px] text-on-background">${item.selectedTexture}</span>`}
          </div>
          <span class="text-[13px] font-semibold text-on-background">Qty: ${item.quantity}</span>
        </div>
      </div>
    </article>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Quotation ${data.quotationId}</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            "background": "#faf5ee",
            "primary": "#c2652a",
            "on-primary": "#ffffff",
            "primary-container": "#e08850",
            "surface": "#faf5ee",
            "surface-container-lowest": "#ffffff",
            "surface-container-low": "#f6f0e8",
            "surface-container": "#f2ece4",
            "surface-container-high": "#ece6dc",
            "surface-container-highest": "#e6e0d6",
            "surface-variant": "#ece6dc",
            "surface-dim": "#dcd6cc",
            "on-background": "#3a302a",
            "on-surface": "#3a302a",
            "on-surface-variant": "#605850",
            "outline": "#9a9088",
            "outline-variant": "#d8d0c8",
            "secondary": "#78706a",
            "tertiary": "#8c3c3c",
            "inverse-surface": "#3a302a",
            "inverse-on-surface": "#faf5ee",
          },
          fontFamily: {
            "headline": ['"EB Garamond"', "serif"],
            "display": ['"EB Garamond"', "serif"],
            "body": ['"Manrope"', "sans-serif"],
            "label": ['"Manrope"', "sans-serif"],
          },
        },
      },
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    h1, h2, h3, h4, h5, h6, .font-headline, .font-display {
      font-family: 'EB Garamond', serif;
    }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { width: 430px; margin: 0 auto; }
      @page { size: 430px auto; margin: 0; }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
    }
    .divider-thin {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #d8d0c899 20%, #d8d0c8 50%, #d8d0c899 80%, transparent 100%);
    }
    .price-highlight {
      color: #c2652a;
      font-family: 'EB Garamond', serif;
    }
  </style>
</head>
<body class="bg-background text-on-background" style="max-width: 430px; margin: 0 auto;">

  <!-- HEADER -->
  <header class="bg-surface-container-low">
    <div class="pt-10 pb-6 flex flex-col items-center text-center">
      <h1 class="font-display text-5xl font-bold text-primary tracking-tight italic">Neptune</h1>
      <p class="mt-2 text-[10px] tracking-[0.25em] text-on-surface-variant uppercase font-semibold">where green meets serene</p>
    </div>
    <div class="divider-thin mx-6"></div>
    <div class="px-6 py-6 space-y-5">
      <div class="space-y-0.5">
        <p class="text-[13px] font-bold text-on-background tracking-wide">${data.companyDetails.name}</p>
        <p class="text-[12px] text-on-surface-variant leading-relaxed">${data.companyDetails.addressLine1}</p>
        <p class="text-[12px] text-on-surface-variant leading-relaxed">${data.companyDetails.addressLine2}</p>
      </div>
      <div class="space-y-0.5 pt-4 border-t border-outline-variant/40">
        <p class="text-[13px] font-bold text-on-background">Client Details:</p>
        <p class="text-[12px] text-on-surface-variant leading-relaxed">${data.customerDisplayName}</p>
        ${data.customerAddress ? `<p class="text-[12px] text-on-surface-variant leading-relaxed">Address: ${data.customerAddress}</p>` : ''}
      </div>
    </div>
  </header>

  <!-- QUOTATION SUMMARY -->
  <section class="bg-surface-container-low border-t border-outline-variant/60">
    <div class="px-6 py-7 space-y-4">
      <div class="border-b border-outline-variant/40 pb-2">
        <h3 class="font-headline text-xl font-bold text-on-background">Quotation Summary</h3>
      </div>
      <div class="space-y-2.5 pt-1">
        <div class="flex justify-between items-center text-sm">
          <span class="text-secondary font-medium">Subtotal</span>
          <span class="font-semibold text-primary">${formatCurrency(data.summary.subtotal)}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-secondary font-medium">Tax (18%)</span>
          <span class="font-semibold text-primary">${formatCurrency(data.summary.taxAmount)}</span>
        </div>
      </div>
      <div class="flex justify-between items-center pt-4 border-t border-outline-variant/40">
        <span class="font-bold text-on-background text-[16px]">Total Amount</span>
        <span class="price-highlight text-3xl font-bold">${formatCurrency(data.summary.totalAmount)}</span>
      </div>
    </div>
  </section>

  <!-- PRODUCT CARDS -->
  <main class="px-4 py-8 space-y-7">
    ${itemsHtml}
  </main>

  <!-- FOOTER -->
  <footer class="bg-surface-container-low border-t border-outline-variant/60 pb-10 px-6">
    <div class="pt-8 text-center space-y-1">
      <p class="text-[11px] text-outline leading-relaxed">Quotation generated for ${data.customerDisplayName}.</p>
      <p class="text-[11px] text-outline leading-relaxed">Prices are subject to change. Terms and conditions apply.</p>
    </div>
  </footer>

</body>
</html>
  `;
}
