import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { Boxes, Plus, Search, Pencil, Trash2, Loader2, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/store";
import { toast } from "sonner";
import { api } from "@/lib/api";

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

  const fetchProducts = async () => {
    try {
      const res = await api.get<any[]>("/inventory/products");
      setProducts(res ?? []);
    } catch (err) {
      toast.error("Failed to load products from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/inventory/products/${id}`);
      toast.success("Product deleted successfully");
      void fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product");
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
      return !q ||
        (i.productName || "").toLowerCase().includes(q.toLowerCase()) ||
        (i.hsnNumber || "").includes(q);
    });
  }, [products, q]);

  // Placeholder stats (To be connected to sales/quotations data later)
  const soldQuantities = 0;
  const thisMonthSale = 0;
  const soldProductsValue = 0;

  // Placeholder top selling distribution (To be connected to sales/quotations data later)
  const topSelling = useMemo(() => {
    if (!products.length) return [];
    // Mocking top selling based on first few products for visual feedback
    const mockSales = products.slice(0, 5).map((p, i) => ({
      name: p.productName,
      value: Math.max(10, 100 - i * 20),
    }));
    const total = mockSales.reduce((acc, curr) => acc + curr.value, 0) || 1;
    return mockSales.map(m => ({ ...m, pct: Math.round((m.value / total) * 100) })).sort((a, b) => b.value - a.value);
  }, [products]);

  const palette = ["bg-primary", "bg-violet", "bg-success", "bg-warning", "bg-destructive"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading products...</span>
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
        <Link to="/inventory/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95">
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={<Boxes className="w-5 h-5" />} label="Total Products" value={String(products.length)} sub="All items in stock" />
        <Stat icon={<ShoppingCart className="w-5 h-5" />} label="Sold Quantities" value={String(soldQuantities)} sub="Total items sold" tone="success" />
        <Stat icon={<TrendingUp className="w-5 h-5" />} label="This Month Sale" value={formatINR(thisMonthSale).replace(/\.00$/, "")} sub="Revenue this month" tone="violet" />
        <Stat icon={<Wallet className="w-5 h-5" />} label="Sold Products Value" value={formatINR(soldProductsValue).replace(/\.00$/, "")} sub="Total revenue generated" tone="warning" />
      </div>

      {/* Top Selling Distribution */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
        <div className="font-display font-semibold mb-4">Top Selling Products</div>
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
        <div className="p-3 sm:p-4 border-b border-border bg-muted/20">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or HSN..." className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm shadow-sm" />
          </div>
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
                          {getProductImage(i) ? <img src={getProductImage(i)} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{(i.productName || "").slice(0, 2)}</span>}
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
                {getProductImage(i) ? <img src={getProductImage(i)} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{(i.productName || "").slice(0, 2)}</span>}
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
