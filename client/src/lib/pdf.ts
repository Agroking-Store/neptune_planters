import { jsPDF } from "jspdf";
import type { Quotation, InventoryItem } from "./store";

// ===== Neptune palette =====
const BG = [250, 245, 238] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const PRIMARY = [194, 101, 42] as [number, number, number];
const INK = [58, 48, 42] as [number, number, number];
const SECONDARY = [120, 112, 106] as [number, number, number];
const ON_SURFACE_VAR = [96, 88, 80] as [number, number, number];
const OUTLINE = [220, 210, 196] as [number, number, number];
const SURFACE_LOW = [246, 238, 226] as [number, number, number];
const IMG_BG = [238, 228, 212] as [number, number, number];
const TOTALS_BG = [251, 232, 216] as [number, number, number];
const SANDSTONE = [202, 168, 122] as [number, number, number];

// Dummy images — preloaded as data URLs
const DUMMY_HERO = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&q=80";
const DUMMY_THUMB_A = "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80";
const DUMMY_THUMB_B = "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80";

async function loadAsDataURL(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function inr(n: number) {
  return "Rs " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

function setFill(doc: jsPDF, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: [number, number, number]) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }

function drawImage(
  doc: jsPDF, x: number, y: number, w: number, h: number, label: string,
  src?: string, bg: [number, number, number] = IMG_BG,
) {
  setFill(doc, bg);
  doc.roundedRect(x, y, w, h, 6, 6, "F");
  if (src) {
    try {
      const fmt = src.includes("image/png") ? "PNG" : "JPEG";
      const pad = 4;
      doc.addImage(src, fmt, x + pad, y + pad, w - pad * 2, h - pad * 2, undefined, "FAST");
      return;
    } catch { /* fall through */ }
  }
  // Placeholder icon + label
  setText(doc, SECONDARY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(label.toUpperCase(), x + w / 2, y + h / 2 + 3, { align: "center" });
}

function drawSwatch(doc: jsPDF, x: number, y: number, w: number, h: number) {
  setFill(doc, SANDSTONE);
  doc.roundedRect(x, y, w, h, 6, 6, "F");
  setText(doc, [255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("TEXTURE", x + w / 2, y + h / 2 + 3, { align: "center" });
}

// ===== Layout constants =====
const M = 36;
const PAGE_W = 595; // A4 width pt
const HEADER_BLOCK = 52;
const QHEADER_H = 150 + 16;
const TOTALS_H = 120 + 24;
const ITEMS_HEADER_H = 24;
const ITEM_TOP_H = 280;
const ITEM_BOTTOM_H = 130;
const ITEM_H = ITEM_TOP_H + ITEM_BOTTOM_H;
const ITEM_GAP = 16;
const FOOTER_H = 90;

export async function downloadQuotationPDF(q: Quotation, inventory: InventoryItem[] = []) {
  // Preload dummy images
  const [heroImg, thumbA] = await Promise.all([
    loadAsDataURL(DUMMY_HERO),
    loadAsDataURL(DUMMY_THUMB_A),
    loadAsDataURL(DUMMY_THUMB_B),
  ]);

  // Compute total document height for a single long page
  const totalH =
    M +
    HEADER_BLOCK +
    QHEADER_H +
    TOTALS_H +
    ITEMS_HEADER_H +
    q.items.length * (ITEM_H + ITEM_GAP) +
    FOOTER_H +
    M;

  const doc = new jsPDF({ unit: "pt", format: [PAGE_W, Math.max(totalH, 800)] });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const invMap = new Map(inventory.map((i) => [i.id, i]));

  // Background
  setFill(doc, BG);
  doc.rect(0, 0, W, H, "F");

  // ===== HEADER =====
  let y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setText(doc, PRIMARY);
  doc.text("Neptune", M, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, SECONDARY);
  doc.text("WHERE GREEN MEETS SERENE", M, y + 26);
  setDraw(doc, OUTLINE);
  doc.setLineWidth(0.5);
  doc.line(M, y + 36, W - M, y + 36);
  y += HEADER_BLOCK;

  // ===== QUOTATION CARD =====
  const cardX = M, cardW = W - M * 2;
  const headerCardH = 150;
  setFill(doc, WHITE);
  setDraw(doc, OUTLINE);
  doc.roundedRect(cardX, y, cardW, headerCardH, 10, 10, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setText(doc, INK);
  doc.text("Quotation", cardX + 20, y + 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, SECONDARY);
  const dateStr = new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Date: ${dateStr}`, cardX + 20, y + 52);

  const innerY = y + 68;
  const innerH = 68;
  const innerGap = 12;
  const innerW = (cardW - 40 - innerGap) / 2;
  const renderInfo = (ix: number, label: string, title: string, lines: string[]) => {
    setFill(doc, SURFACE_LOW);
    setDraw(doc, OUTLINE);
    doc.roundedRect(ix, innerY, innerW, innerH, 8, 8, "FD");
    setText(doc, SECONDARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), ix + 12, innerY + 14);
    setText(doc, INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, ix + 12, innerY + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, ON_SURFACE_VAR);
    lines.forEach((ln, i) => doc.text(ln, ix + 12, innerY + 44 + i * 11));
  };
  renderInfo(
    cardX + 20,
    "Prepared For",
    q.customerName || "—",
    [q.companyName, q.customerPhone].filter(Boolean),
  );
  renderInfo(
    cardX + 20 + innerW + innerGap,
    "Company Details",
    "Neptune Innovations",
    ["Sr No 34/1, Holkarwadi, Tukaram Marg,", "Handewadi, Tal. Haveli, Dist. Pune-412308"],
  );
  y += headerCardH + 16;

  // ===== TOTALS =====
  const totals = (() => {
    const grand = q.items.reduce((s, it) => s + it.quantity * it.price, 0);
    const taxAmt = grand - (grand / 1.18);
    const sub = grand - taxAmt;
    return { grand, taxAmt, sub };
  })();

  const totH = 120;
  setFill(doc, TOTALS_BG);
  setDraw(doc, OUTLINE);
  doc.roundedRect(cardX, y, cardW, totH, 10, 10, "FD");

  const lx = cardX + 24;
  const rowsX2 = cardX + cardW / 2 - 24;
  const drawTotRow = (label: string, val: string, ry: number, valColor: [number, number, number] = INK) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setText(doc, SECONDARY);
    doc.text(label, lx, ry);
    setText(doc, valColor);
    doc.setFont("helvetica", "bold");
    doc.text(val, rowsX2, ry, { align: "right" });
  };
  drawTotRow("Subtotal", inr(totals.sub), y + 32);
  drawTotRow(`TAX (18%)`, inr(totals.taxAmt), y + 54);

  setDraw(doc, OUTLINE);
  doc.setLineWidth(0.5);
  doc.line(cardX + cardW / 2, y + 18, cardX + cardW / 2, y + totH - 18);

  const grx = cardX + cardW - 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, SECONDARY);
  doc.text("GRAND TOTAL", grx, y + 36, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setText(doc, PRIMARY);
  doc.text(inr(totals.grand), grx, y + 70, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, SECONDARY);
  doc.text("INCLUSIVE OF ALL TAXES", grx, y + 86, { align: "right" });

  y += totH + 24;

  // ===== PROPOSED ITEMS HEADER =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setText(doc, INK);
  doc.text("Proposed Items", M, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, SECONDARY);
  doc.text(`${q.items.length} ITEMS TOTAL`, W - M, y, { align: "right" });
  setDraw(doc, OUTLINE);
  doc.line(M, y + 8, W - M, y + 8);
  y += ITEMS_HEADER_H;

  // ===== ITEM CARDS (new layout matching reference) =====
  q.items.forEach((it) => {
    const inv = invMap.get(it.itemId);
    const unitAfter = it.price;
    const lineTotal = unitAfter * it.quantity;

    // Outer card (cream) — wraps top images and bottom white panel
    setFill(doc, SURFACE_LOW);
    setDraw(doc, OUTLINE);
    doc.setLineWidth(0.6);
    doc.roundedRect(M, y, cardW, ITEM_H, 14, 14, "FD");

    // ===== TOP: main image + 2 stacked side cells =====
    const pad = 16;
    const innerWtop = cardW - pad * 2;
    const gap = 12;
    const rightSq = (ITEM_TOP_H - pad * 2 - gap) / 2; // square side cell
    const rightW = rightSq;
    const leftW = innerWtop - rightW - gap;
    const leftH = ITEM_TOP_H - pad * 2;
    const topY = y + pad;

    // Left main image
    drawImage(
      doc,
      M + pad,
      topY,
      leftW,
      leftH,
      `${(it.name || inv?.name || "Item").toUpperCase()} IMAGE`,
      inv?.image || heroImg,
    );

    // Right top: REF
    const rightX = M + pad + leftW + gap;
    drawImage(
      doc,
      rightX,
      topY,
      rightW,
      rightSq,
      "REF",
      inv?.referenceImage || thumbA,
    );

    // Right bottom: TEXTURE (color swatch)
    drawSwatch(doc, rightX, topY + rightSq + gap, rightW, rightSq);

    // ===== BOTTOM: white details panel =====
    const bY = y + ITEM_TOP_H;
    const bH = ITEM_BOTTOM_H - pad; // leave inner bottom pad
    const bX = M + pad;
    const bW = cardW - pad * 2;
    setFill(doc, WHITE);
    setDraw(doc, OUTLINE);
    doc.setLineWidth(0.5);
    doc.roundedRect(bX, bY, bW, bH, 10, 10, "FD");

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setText(doc, INK);
    doc.text((it.name || inv?.name || "—").toUpperCase(), bX + 18, bY + 30);

    // Dimensions (Sizes)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setText(doc, ON_SURFACE_VAR);
    if (it.selectedSize) doc.text(it.selectedSize, bX + 18, bY + 48);

    // Color swatch + name
    const cYpos = bY + 66;
    setFill(doc, SANDSTONE);
    doc.circle(bX + 22, cYpos - 3, 4, "F");
    setText(doc, SECONDARY);
    doc.setFontSize(10);
    doc.text("Standard Finish", bX + 32, cYpos);

    // Right: prices
    const prX = bX + bW - 18;
    // " /ea" suffix
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setText(doc, SECONDARY);
    const eaTxt = " /ea";
    const eaW = doc.getTextWidth(eaTxt);
    // Draw price shifted left by eaW, then /ea at prX
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    setText(doc, PRIMARY);
    const priceTxt = inr(unitAfter);
    doc.text(priceTxt, prX - eaW, bY + 54, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setText(doc, SECONDARY);
    doc.text(eaTxt, prX, bY + 54, { align: "right" });

    // Divider
    setDraw(doc, OUTLINE);
    doc.setLineWidth(0.4);
    doc.line(bX + 18, bY + 80, bX + bW - 18, bY + 80);

    // Footer row: Qty pill (left), TOTAL (right)
    const footY = bY + 100;
    const qtyText = `Qty: ${it.quantity}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const qtyTw = doc.getTextWidth(qtyText);
    const qtyPadX = 14;
    const qtyW = qtyTw + qtyPadX * 2;
    const qtyH = 22;
    setFill(doc, SURFACE_LOW);
    doc.roundedRect(bX + 18, footY - 14, qtyW, qtyH, 6, 6, "F");
    setText(doc, INK);
    doc.text(qtyText, bX + 18 + qtyW / 2, footY + 1, { align: "center" });

    // TOTAL label + value
    setText(doc, SECONDARY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("TOTAL", prX, footY - 6, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    setText(doc, INK);
    doc.text(inr(lineTotal), prX, footY + 12, { align: "right" });

    y += ITEM_H + ITEM_GAP;
  });

  // ===== FOOTER =====
  const fY = H - M - 60;
  setDraw(doc, OUTLINE);
  doc.setLineWidth(0.5);
  doc.line(M, fY, W - M, fY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, PRIMARY);
  doc.text("Neptune", W / 2, fY + 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, SECONDARY);
  doc.text(
    `© ${new Date().getFullYear()} Neptune Landscapes & Planters. All rights reserved.`,
    W / 2,
    fY + 32,
    { align: "center" },
  );
  doc.text("Payment terms: Net 30", W / 2, fY + 44, { align: "center" });

  doc.save(`${q.number}.pdf`);
}
