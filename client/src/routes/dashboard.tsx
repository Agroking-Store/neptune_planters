import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, Plus, Search, Send, Target, TrendingUp, Trash2, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useDB, formatINR } from "@/lib/store";
import { downloadQuotationPDF } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Indux" }, { name: "description", content: "Manage and track all your generated quotations." }] }),
  component: Dashboard,
});

function Dashboard() {
  return <AppShell><DashboardInner /></AppShell>;
}

function DashboardInner() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");

  const stats = useMemo(() => {
    const total = db.quotations.length;
    const revenue = db.quotations.reduce((s, x) => s + x.items.reduce((a, it) => a + it.quantity * it.price * (1 + it.tax / 100), 0), 0);
    const accepted = db.quotations.filter((x) => x.status === "Accepted").length;
    const counts = { Draft: 0, Sent: 0, Accepted: 0, Rejected: 0 } as Record<string, number>;
    db.quotations.forEach((x) => { counts[x.status] = (counts[x.status] || 0) + 1; });
    return { total, revenue, accepted, conv: total ? Math.round((accepted / total) * 100) : 0, counts };
  }, [db.quotations]);

  const filtered = db.quotations.filter((x) => {
    const matches = !q || x.number.toLowerCase().includes(q.toLowerCase()) || x.customerName.toLowerCase().includes(q.toLowerCase());
    const sOk = status === "All" || x.status === status;
    return matches && sOk;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Quotations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track every quote, every status, every rupee.</p>
        </div>
        <Link to="/quotations/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95">
          <Plus className="w-4 h-4" /> New Quotation
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Total Quotations" value={String(stats.total)} sub={`${db.quotations.filter((q) => new Date(q.createdAt).getMonth() === new Date().getMonth()).length} this month`} />
        <StatCard icon={<Target className="w-5 h-5" />} label="Conversion Rate" value={`${stats.conv}%`} sub={`${stats.accepted} accepted`} tone="success" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Revenue" value={formatINR(stats.revenue).replace(/\.00$/, "")} sub={`Avg ${stats.total ? formatINR(stats.revenue / stats.total).replace(/\.00$/, "") : "—"}`} />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Follow-ups" value={String(db.quotations.filter((x) => x.followUpDate).length)} sub="due soon" tone="violet" />
      </div>

      {/* Distribution */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
        <div className="font-display font-semibold mb-4">Status Distribution</div>
        <div className="space-y-3">
          {(["Draft", "Sent", "Accepted", "Rejected"] as const).map((s) => {
            const v = stats.counts[s] || 0;
            const pct = stats.total ? Math.round((v / stats.total) * 100) : 0;
            const color = s === "Draft" ? "bg-warning" : s === "Sent" ? "bg-primary" : s === "Accepted" ? "bg-success" : "bg-destructive";
            return (
              <div key={s}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${color}`} /><span className="font-medium">{s}</span></div>
                  <div className="text-muted-foreground"><span className="font-medium text-foreground">{v}</span> ({pct}%)</div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-soft flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="Search by quotation number or customer..." />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm">
          {["All", "Draft", "Sent", "Accepted", "Rejected"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table / cards */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {["#", "Quotation", "Customer", "Created", "Total", "Follow-up", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const total = q.items.reduce((s, it) => s + it.quantity * it.price * (1 + it.tax / 100), 0);
                return (
                  <tr key={q.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{q.number}</td>
                    <td className="px-4 py-3">{q.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatINR(total)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{q.followUpDate ? new Date(q.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "N/A"}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconBtn onClick={() => { downloadQuotationPDF(q); toast.success("PDF downloaded"); }} label="Download PDF"><Download className="w-4 h-4" /></IconBtn>
                        <IconBtn onClick={() => toast.success(`${q.number} marked as sent`)} label="Send"><Send className="w-4 h-4 text-primary" /></IconBtn>
                        <IconBtn onClick={() => { store.deleteQuotation(q.id); toast.success("Deleted"); }} label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-sm">No quotations found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((q) => {
            const total = q.items.reduce((s, it) => s + it.quantity * it.price * (1 + it.tax / 100), 0);
            return (
              <div key={q.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{q.number}</div>
                    <div className="text-sm text-muted-foreground truncate">{q.customerName}</div>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString("en-IN")}</div>
                    <div className="font-semibold mt-0.5">{formatINR(total)}</div>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn onClick={() => { downloadQuotationPDF(q); toast.success("PDF downloaded"); }} label="Download"><Download className="w-4 h-4" /></IconBtn>
                    <IconBtn onClick={() => { store.deleteQuotation(q.id); toast.success("Deleted"); }} label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></IconBtn>
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && <div className="p-10 text-center text-muted-foreground text-sm">No quotations found.</div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone = "primary" }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "primary" | "success" | "violet" }) {
  const toneCls = tone === "success" ? "bg-success/15 text-success" : tone === "violet" ? "bg-violet/15 text-violet" : "bg-accent text-accent-foreground";
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

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Draft" ? "bg-warning/15 text-warning" : status === "Sent" ? "bg-primary/10 text-primary" : status === "Accepted" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive";
  return <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full ${cls}`}>{status}</span>;
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center transition-colors">{children}</button>
  );
}
