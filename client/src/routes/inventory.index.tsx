import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Boxes, Layers, IndianRupee, Building2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useDB, formatINR } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/")({
  head: () => ({ meta: [{ title: "Inventory — Indux" }, { name: "description", content: "Manage your product inventory, SKUs, HSN codes and stock levels." }] }),
  beforeLoad: () => {
    if (!store.isAuthed()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><Inventory /></AppShell>,
});

function Inventory() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");

  const departments = useMemo(() => Array.from(new Set(db.inventory.map((i) => i.department))), [db.inventory]);
  const filtered = db.inventory.filter((i) => (!q || i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()) || i.hsn.includes(q)) && (dept === "All" || i.department === dept));

  const totalQty = db.inventory.reduce((s, i) => s + i.quantity, 0);
  const inventoryValue = db.inventory.reduce((s, i) => s + i.quantity * i.price, 0);

  const distribution = useMemo(() => {
    const map = new Map<string, number>();
    db.inventory.forEach((i) => map.set(i.department, (map.get(i.department) || 0) + 1));
    const total = db.inventory.length || 1;
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, value: v, pct: Math.round((v / total) * 100) })).sort((a, b) => b.value - a.value);
  }, [db.inventory]);

  const palette = ["bg-primary", "bg-violet", "bg-success", "bg-warning", "bg-destructive"];

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
        <Stat icon={<Boxes className="w-5 h-5" />} label="Total Products" value={String(db.inventory.length)} sub="All items in stock" />
        <Stat icon={<Layers className="w-5 h-5" />} label="Total Quantity" value={totalQty >= 1000 ? `${(totalQty / 1000).toFixed(2)} K` : String(totalQty)} sub="Across all categories" tone="success" />
        <Stat icon={<IndianRupee className="w-5 h-5" />} label="Inventory Value" value={formatINR(inventoryValue).replace(/\.00$/, "")} sub="Total asset value" tone="violet" />
        <Stat icon={<Building2 className="w-5 h-5" />} label="Departments" value={String(departments.length)} sub="Active departments" tone="warning" />
      </div>

      {/* Distribution */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
        <div className="font-display font-semibold mb-4">Department Distribution</div>
        <div className="space-y-3">
          {distribution.map((d, i) => (
            <div key={d.name}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${palette[i % palette.length]}`} /><span className="font-medium">{d.name}</span></div>
                <div className="text-muted-foreground"><span className="font-medium text-foreground">{d.value}</span> ({d.pct}%)</div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${palette[i % palette.length]} transition-all`} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
          {!distribution.length && <div className="text-sm text-muted-foreground py-6 text-center">No items yet.</div>}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-soft flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU or HSN..." className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm">
          <option>All</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>{["#", "Product", "Department", "SKU", "HSN", "Price", "Qty", "Actions"].map((h) => <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((i, idx) => (
                <tr key={i.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden grid place-items-center shrink-0">
                        {i.image ? <img src={i.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{i.name.slice(0, 2)}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{i.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{i.dimensions}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{i.department}</td>
                  <td className="px-4 py-3 font-mono text-xs">{i.sku}</td>
                  <td className="px-4 py-3 font-mono text-xs">{i.hsn}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{formatINR(i.price)}</td>
                  <td className="px-4 py-3">{i.quantity} {i.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toast.info("Edit coming soon")} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center" aria-label="Edit"><Pencil className="w-4 h-4 text-primary" /></button>
                      <button onClick={() => { store.deleteInventory(i.id); toast.success("Item removed"); }} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center" aria-label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-sm">No items found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {filtered.map((i) => (
            <div key={i.id} className="p-4 flex gap-3">
              <div className="w-14 h-14 rounded-xl bg-accent overflow-hidden grid place-items-center shrink-0">
                {i.image ? <img src={i.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{i.name.slice(0, 2)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{i.department} • {i.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatINR(i.price)}</div>
                    <div className="text-xs text-muted-foreground">{i.quantity} {i.unit}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { store.deleteInventory(i.id); toast.success("Removed"); }} className="text-xs px-3 py-1.5 rounded-lg border border-border text-destructive">Delete</button>
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
