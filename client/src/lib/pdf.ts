import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Quotation } from "./store";
import { formatINR } from "./store";

export function downloadQuotationPDF(q: Quotation) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Indux Technology", 40, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Quotation", 40, 68);
  doc.setFontSize(11);
  doc.text(`#${q.number}`, W - 40, 45, { align: "right" });
  doc.text(new Date(q.createdAt).toLocaleDateString("en-IN"), W - 40, 62, { align: "right" });
  doc.text(`Status: ${q.status}`, W - 40, 79, { align: "right" });

  // Customer
  doc.setTextColor(20, 20, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", 40, 125);
  doc.setFont("helvetica", "normal");
  doc.text(q.customerName || "—", 40, 142);
  if (q.companyName) doc.text(q.companyName, 40, 157);
  if (q.customerEmail) doc.text(q.customerEmail, 40, 172);
  if (q.customerPhone) doc.text(q.customerPhone, 40, 187);
  if (q.gstNumber) doc.text(`GST: ${q.gstNumber}`, 40, 202);

  // Items table
  const rows = q.items.map((it, idx) => {
    const subtotal = it.quantity * it.price;
    const taxAmt = (subtotal * it.tax) / 100;
    return [
      String(idx + 1),
      it.name,
      String(it.quantity),
      formatINR(it.price),
      `${it.tax}%`,
      formatINR(subtotal + taxAmt),
    ];
  });

  const subtotal = q.items.reduce((s, it) => s + it.quantity * it.price, 0);
  const totalTax = q.items.reduce((s, it) => s + (it.quantity * it.price * it.tax) / 100, 0);
  const grand = subtotal + totalTax;

  autoTable(doc, {
    startY: 230,
    head: [["#", "Item", "Qty", "Unit Price", "Tax", "Total"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 8 },
    columnStyles: { 0: { cellWidth: 30 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  const labelX = W - 220;
  const valX = W - 40;
  doc.setFontSize(11);
  doc.text("Subtotal", labelX, y);
  doc.text(formatINR(subtotal), valX, y, { align: "right" });
  y += 18;
  doc.text("Tax", labelX, y);
  doc.text(formatINR(totalTax), valX, y, { align: "right" });
  y += 18;
  doc.setDrawColor(220);
  doc.line(labelX, y, valX, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Grand Total", labelX, y);
  doc.text(formatINR(grand), valX, y, { align: "right" });
  doc.setFont("helvetica", "normal");

  // Notes & terms
  y += 36;
  if (q.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 40, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(q.notes, W - 80);
    doc.text(lines, 40, y + 16);
    y += 16 + lines.length * 14;
  }
  if (q.terms.length) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 40, y);
    doc.setFont("helvetica", "normal");
    q.terms.forEach((t, i) => {
      doc.text(`• ${t}`, 40, y + 18 + i * 14);
    });
  }

  doc.save(`${q.number}.pdf`);
}
