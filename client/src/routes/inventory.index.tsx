import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { resolveImageUrl } from "@/lib/utils";
import { Boxes, Plus, Search, Pencil, Trash2, Loader2, ShoppingCart, TrendingUp, Wallet, FileText, Download, X, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/store";
import { toast } from "sonner";
import { api } from "@/lib/api";
import ExcelJS from "exceljs";

export const Route = createFileRoute("/inventory/")({
  head: () => ({ meta: [{ title: "Inventory — Indux" }, { name: "description", content: "Manage your product inventory." }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><Inventory /></AppShell>,
});

function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [analytics, setAnalytics] = useState({
    soldQuantities: 0,
    soldProductsValue: 0,
    thisMonthSale: 0,
    topSelling: [] as { name: string; value: number; pct: number }[]
  });

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const prodRes = await api.get<any[]>("/inventory/products");
      setProducts(prodRes ?? []);
    } catch (err) {
      toast.error("Failed to load products from server");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const analyticsRes = await api.get<any>("/analytics/sales");
      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  };

  useEffect(() => {
    void fetchProducts();
    void fetchAnalytics();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setProducts((prev) => prev.filter((p) => p._id !== id));
    
    try {
      await api.delete(`/inventory/products/${id}`);
      toast.success("Product deleted successfully");
      void fetchAnalytics();
    } catch (err) {
      toast.error("Failed to delete product");
      void fetchProducts();
    }
  };

  const getProductImage = (i: any) => {
    if (i.productImages && i.productImages.length > 0) {
      const prodImg = i.productImages.find((img: any) => img.type === "product");
      if (prodImg) return prodImg.url;
      return i.productImages[0].url;
    }
    return undefined;
  };

  const filtered = useMemo(() => {
    return products.filter((i) => {
      if (!q) return true;
      const lower = q.toLowerCase();
      return (
        (i.productName || "").toLowerCase().includes(lower) ||
        (i.hsnNumber || "").includes(q) ||
        (i.description || "").toLowerCase().includes(lower) ||
        String(i.unitPrice || "").includes(q)
      );
    });
  }, [products, q]);

  const { soldQuantities, thisMonthSale, soldProductsValue, topSelling } = analytics;

  const palette = ["bg-primary", "bg-violet", "bg-success", "bg-warning", "bg-destructive"];

  // Helper: convert a base64 data URI or fetch a URL into a Uint8Array + extension
  const resolveImage = async (src: string): Promise<{ buf: Uint8Array; ext: "png" | "jpeg" } | null> => {
    try {
      if (src.startsWith("data:")) {
        const match = src.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
        if (!match) return null;
        const ext = match[1].toLowerCase().startsWith("png") ? "png" as const : "jpeg" as const;
        const raw = atob(match[2]);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return { buf: arr, ext };
      } else {
        const res = await fetch(src);
        if (!res.ok) return null;
        const ct = res.headers.get("content-type") || "";
        const ext = ct.includes("png") ? "png" as const : "jpeg" as const;
        const arrayBuf = await res.arrayBuffer();
        return { buf: new Uint8Array(arrayBuf), ext };
      }
    } catch {
      return null;
    }
  };

  const handleDownloadReport = async () => {
    if (!reportFrom || !reportTo) {
      toast.error("Please select both From and To dates");
      return;
    }
    if (new Date(reportFrom) > new Date(reportTo)) {
      toast.error("From date cannot be after To date");
      return;
    }
    setReportLoading(true);
    try {
      const data = await api.get<any>(`/analytics/report?from=${reportFrom}&to=${reportTo}`);
      const rows: any[] = data.rows ?? [];
      const grandTotal: number = data.grandTotal ?? 0;

      if (rows.length === 0) {
        toast.info("No sales found in the selected date range");
        setReportLoading(false);
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Sales Report");

      ws.columns = [
        { header: "#",               key: "num",      width: 5  },
        { header: "Product Image",   key: "img",      width: 14 },
        { header: "Product Name",    key: "name",     width: 30 },
        { header: "Texture",         key: "texture",  width: 14 },
        { header: "Size Variant",    key: "size",     width: 16 },
        { header: "Qty Sold",        key: "qty",      width: 12 },
        { header: "Revenue (INR)",   key: "revenue",  width: 18 },
        { header: "HSN Number",      key: "hsn",      width: 14 },
      ];

      // Style header row
      const headerRow = ws.getRow(1);
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.height = 24;
      headerRow.eachCell((cell) => { cell.alignment = { vertical: "middle", horizontal: "center" }; });

      const ROW_HEIGHT = 55;
      let totalQtySold = 0;

      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx];
        const rowNum = idx + 2;
        const exRow = ws.getRow(rowNum);
        exRow.height = ROW_HEIGHT;

        totalQtySold += r.quantitySold || 0;

        exRow.getCell("num").value     = idx + 1;
        exRow.getCell("name").value    = r.productName || "";
        exRow.getCell("size").value    = r.selectedSize || "-";
        exRow.getCell("qty").value     = r.quantitySold;
        exRow.getCell("revenue").value = r.totalRevenue;
        exRow.getCell("hsn").value     = r.hsnNumber || "-";

        // For texture: if it looks like an image, embed it; otherwise show text
        const texVal = r.selectedTexture;
        const isTexImage = texVal && (texVal.startsWith("data:image") || texVal.startsWith("http"));
        if (!isTexImage) {
          exRow.getCell("texture").value = texVal || "-";
        }

        // Vertical align all cells
        ["num", "img", "name", "texture", "size", "qty", "revenue", "hsn"].forEach((k) => {
          exRow.getCell(k).alignment = { vertical: "middle", wrapText: true };
        });
        // Zebra stripe
        if (idx % 2 === 1) {
          ["num", "img", "name", "texture", "size", "qty", "revenue", "hsn"].forEach((k) => {
            exRow.getCell(k).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          });
        }

        // Embed product image (col B, index 1)
        if (r.productImage) {
          const imgData = await resolveImage(r.productImage);
          if (imgData) {
            const imgId = wb.addImage({ buffer: imgData.buf as any, extension: imgData.ext });
            ws.addImage(imgId, {
              tl: { col: 1.1, row: rowNum - 0.9 },
              ext: { width: 65, height: 65 },
            });
          }
        }

        // Embed texture image (col D, index 3)
        if (isTexImage) {
          const texData = await resolveImage(texVal);
          if (texData) {
            const texImgId = wb.addImage({ buffer: texData.buf as any, extension: texData.ext });
            ws.addImage(texImgId, {
              tl: { col: 3.1, row: rowNum - 0.9 },
              ext: { width: 65, height: 65 },
            });
          }
        }

        exRow.commit();
      }

      // Grand Total row
      const totalRowNum = rows.length + 3;
      const totalRow = ws.getRow(totalRowNum);
      totalRow.getCell("size").value = "GRAND TOTAL";
      totalRow.getCell("size").font = { bold: true, size: 12 };
      totalRow.getCell("qty").value = totalQtySold;
      totalRow.getCell("qty").font = { bold: true, size: 12 };
      totalRow.getCell("revenue").value = grandTotal;
      totalRow.getCell("revenue").font = { bold: true, size: 12 };
      totalRow.height = 24;
      ["size", "qty", "revenue"].forEach((k) => {
        totalRow.getCell(k).alignment = { vertical: "middle" };
        totalRow.getCell(k).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      });
      totalRow.commit();

      // Write to buffer and trigger download
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Report_${reportFrom}_to_${reportTo}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Report downloaded!");
      setShowReportModal(false);
    } catch (err: any) {
      console.error("[Report] Error:", err);
      toast.error(err?.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-muted rounded-xl animate-pulse"></div>
            <div className="h-5 w-64 bg-muted rounded-xl animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-40 bg-muted rounded-xl animate-pulse"></div>
            <div className="h-11 w-32 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 h-32 animate-pulse flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-muted"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
              </div>
              <div className="w-24 h-8 bg-muted rounded mt-2"></div>
            </div>
          ))}
        </div>
        
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden flex flex-col">
          <div className="p-3 sm:p-4 border-b border-border bg-muted/20 flex items-center gap-3">
            <div className="h-11 flex-1 bg-muted rounded-xl animate-pulse"></div>
            <div className="h-11 w-11 bg-muted rounded-xl animate-pulse"></div>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-6 h-4 bg-muted rounded animate-pulse"></div>
                <div className="w-10 h-10 bg-muted rounded-lg animate-pulse shrink-0"></div>
                <div className="flex-1 h-6 bg-muted rounded animate-pulse"></div>
                <div className="w-24 h-6 bg-muted rounded animate-pulse hidden md:block"></div>
                <div className="w-16 h-6 bg-muted rounded animate-pulse hidden md:block"></div>
                <div className="w-16 h-8 bg-muted rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">A live source of truth for everything you sell.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground font-medium shadow-sm hover:bg-muted transition-colors">
            <FileText className="w-4 h-4" /> Manage Quotations
          </Link>
          <Link to="/inventory/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95">
            <Plus className="w-4 h-4" /> Add Item
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={<Boxes className="w-5 h-5" />} label="Total Products" value={String(products.length)} sub="All items in stock" />
        <Stat icon={<ShoppingCart className="w-5 h-5" />} label="Sold Quantities" value={String(soldQuantities)} sub="Total items sold" tone="success" />
        <Stat icon={<TrendingUp className="w-5 h-5" />} label="This Month Sale" value={formatINR(thisMonthSale).replace(/\.00$/, "")} sub="Revenue this month" tone="violet" />
        <Stat icon={<Wallet className="w-5 h-5" />} label="Sold Products Value" value={formatINR(soldProductsValue).replace(/\.00$/, "")} sub="Total revenue generated" tone="warning" />
      </div>

      {/* Top Selling Distribution */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-semibold">Top Selling Products</div>
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Sales Report</span>
          </button>
        </div>
        <div className="space-y-3">
          {topSelling.map((d, i) => (
            <div key={d.name}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${palette[i % palette.length]}`} /><span className="font-medium truncate max-w-xs">{d.name}</span></div>
                <div className="text-muted-foreground"><span className="font-medium text-foreground">{d.value} sold</span> ({d.pct}%)</div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${palette[i % palette.length]} transition-all`} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
          {!topSelling.length && <div className="text-sm text-muted-foreground py-6 text-center">No sales data yet.</div>}
        </div>
      </div>

      {/* Combined Search and List Card */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="p-3 sm:p-4 border-b border-border bg-muted/20 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, HSN, description or price..." className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm shadow-sm" />
          </div>
          <Link to="/inventory/new" className="ml-auto shrink-0 w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 flex items-center justify-center" title="Add New Item">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
        
        {/* Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {["#", "Product", "Description", "Price", "HSN", "Sizes", "Textures", "Actions"].map((h) => (
                  <th key={h} className={`font-medium px-4 py-3 whitespace-nowrap ${["Sizes", "Textures"].includes(h) ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i, idx) => {
                const sizesCount = Array.isArray(i.sizes) ? i.sizes.length : 0;
                const texturesCount = Array.isArray(i.productImages) ? i.productImages.filter((img: any) => img.type === "texture").length : 0;
                
                return (
                  <tr key={i._id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden grid place-items-center shrink-0">
                          {getProductImage(i) ? <img src={resolveImageUrl(getProductImage(i))} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{(i.productName || "").slice(0, 2)}</span>}
                        </div>
                        <div className="font-medium truncate max-w-[200px]">{i.productName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="truncate max-w-[250px]">{i.description || "-"}</div>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{formatINR(i.unitPrice)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.hsnNumber || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-medium">{sizesCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-medium">{texturesCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/inventory/edit/${i._id}`} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center" aria-label="Edit"><Pencil className="w-4 h-4 text-primary" /></Link>
                        <button onClick={() => handleDelete(i._id)} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center" aria-label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-sm">No items found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((i) => (
            <div key={i._id} className="p-4 flex gap-3">
              <div className="w-14 h-14 rounded-xl bg-accent overflow-hidden grid place-items-center shrink-0">
                {getProductImage(i) ? <img src={resolveImageUrl(getProductImage(i))} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{(i.productName || "").slice(0, 2)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.productName}</div>
                    <div className="text-xs text-muted-foreground truncate">{i.description || (i.hsnNumber ? `HSN: ${i.hsnNumber}` : "")}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{formatINR(i.unitPrice)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link to={`/inventory/edit/${i._id}`} className="text-xs px-3 py-1.5 rounded-lg border border-border text-primary font-medium hover:bg-muted">Edit</Link>
                  <button onClick={() => handleDelete(i._id)} className="text-xs px-3 py-1.5 rounded-lg border border-border text-destructive">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="p-10 text-center text-muted-foreground text-sm">No items found.</div>}
        </div>
      </div>

      {/* Sales Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-elegant animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-base">Download Sales Report</h2>
                  <p className="text-xs text-muted-foreground">Select a date range to export</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="w-8 h-8 rounded-lg border border-border hover:bg-muted grid place-items-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> From</label>
                <input
                  type="date"
                  value={reportFrom}
                  onChange={(e) => setReportFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> To</label>
                <input
                  type="date"
                  value={reportTo}
                  onChange={(e) => setReportTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={reportLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reportLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Download Excel</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, sub, tone = "primary" }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "primary" | "success" | "violet" | "warning" }) {
  const toneCls = tone === "success" ? "bg-success/15 text-success" : tone === "violet" ? "bg-violet/15 text-violet" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent text-accent-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${toneCls}`}>{icon}</div>
        <div className="text-xs text-muted-foreground text-right">{label}</div>
      </div>
      <div className="mt-4 font-display text-2xl sm:text-3xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
