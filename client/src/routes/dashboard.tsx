import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useMemo, useState, useEffect } from "react";
import { Download, FileText, Plus, Search, Send, Target, TrendingUp, Trash2, Calendar, Copy, Edit, ChevronDown, CheckCircle, Package, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useDB, formatINR, store } from "@/lib/store";
import { downloadQuotationPDF } from "@/lib/pdf";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Neptune" }, { name: "description", content: "Manage and track all your generated quotations." }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: Dashboard,
});

function Dashboard() {
  return <AppShell><DashboardInner /></AppShell>;
}

function DashboardInner() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const [shareQuotationId, setShareQuotationId] = useState<string | null>(null);

  const fetchQuotations = async () => {
    try {
      const res = await api.get<any[]>("/quotations");
      if (res && Array.isArray(res)) {
        setQuotations(res);
      } else {
        setQuotations(db.quotations);
      }
    } catch (err) {
      console.warn("[Dashboard] Failed to fetch from API, using local DB:", err);
      setQuotations(db.quotations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuotations();
  }, [db.quotations]);

  const updateLocalQuotationStatus = (id: string, newStatus: string) => {
    try {
      const raw = localStorage.getItem("indux_db_v1");
      if (raw) {
        const dbVal = JSON.parse(raw);
        dbVal.quotations = dbVal.quotations.map((item: any) => item.id === id ? { ...item, status: newStatus } : item);
        localStorage.setItem("indux_db_v1", JSON.stringify(dbVal));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status: newStatus });
      toast.success(`Quotation status updated to ${newStatus}`);
      void fetchQuotations();
    } catch (err) {
      console.warn("[Dashboard] Backend update failed, saving locally:", err);
      updateLocalQuotationStatus(id, newStatus);
      setQuotations((prev) => prev.map((item) => (item._id === id || item.id === id) ? { ...item, status: newStatus } : item));
      toast.success(`Quotation status updated to ${newStatus} (local)`);
    } finally {
      setActiveStatusMenuId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/quotations/${id}`);
      toast.success("Quotation deleted");
      void fetchQuotations();
    } catch (err) {
      console.warn("[Dashboard] Backend delete failed, deleting locally:", err);
      store.deleteQuotation(id);
      setQuotations((prev) => prev.filter((item) => item._id !== id && item.id !== id));
      toast.success("Deleted (local)");
    }
  };

  const handleCopy = (item: any) => {
    const number = item.quotationId || item.number;
    const name = item.customerSnapshot?.customerName || item.customerName;
    const total = item.totalAmount !== undefined ? item.totalAmount : item.items.reduce((s: number, it: any) => s + it.quantity * (it.price || it.unitPrice), 0);
    const textToCopy = `Quotation: ${number}\nCustomer: ${name}\nAmount: ${formatINR(total)}`;

    navigator.clipboard.writeText(textToCopy);
    toast.success("Quotation summary copied to clipboard!");
  };

  const getStatusOutlineClass = (s: string) => {
    switch (s) {
      case "Draft": 
      case "Sent": 
        return "border-amber-500/80 text-amber-600 bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20";
      case "Accepted": return "border-emerald-500/80 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20";
      case "Rejected": return "border-rose-500/80 text-rose-600 bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20";
      default: return "border-border text-muted-foreground";
    }
  };

  const mapToPdf = (q: any) => ({
    id: q._id || q.id,
    number: q.quotationId || q.number || "QUO-0000",
    customerName: q.customerSnapshot?.customerName || q.customerName,
    email: q.customerSnapshot?.email || "",
    phoneNumber: q.customerSnapshot?.phoneNumber || "",
    terms: q.termsAndConditions || [],
    items: (q.items || []).map((it: any) => ({
      itemId: it.productId,
      name: it.productSnapshot?.productName || it.name,
      quantity: it.quantity,
      price: it.unitPrice || it.price,
      selectedSize: it.selectedSize,
      selectedTexture: it.selectedTexture,
    })),
  });

  const handleSendWhatsapp = async (q: any) => {
    const mapped = mapToPdf(q);
    await downloadQuotationPDF(mapped as any);

    if (mapped.phoneNumber) {
      const cleanPhone = mapped.phoneNumber.replace(/\D/g, "");
      const msg = encodeURIComponent(`Hello! Here is your quotation: ${mapped.number}. The PDF has been downloaded to your device.`);
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
      toast.success("Quotation sent");
    } else {
      toast.info("No phone number found. PDF downloaded.");
    }

    if (q.status !== "Sent" && q.status !== "Accepted" && q.status !== "Rejected") {
      handleUpdateStatus(q._id || q.id, "Sent");
    }
  };

  const handleDownload = async (q: any) => {
    toast.success("Download triggered");
    const mapped = mapToPdf(q);
    await downloadQuotationPDF(mapped as any);
  };

  const stats = useMemo(() => {
    const total = quotations.length;
    const revenue = quotations.reduce((s, x) => s + (x.totalAmount !== undefined ? x.totalAmount : x.items.reduce((a: number, it: any) => a + it.quantity * (it.price || it.unitPrice), 0)), 0);
    const accepted = quotations.filter((x) => x.status === "Accepted").length;
    const counts = { Draft: 0, Sent: 0, Accepted: 0, Rejected: 0 } as Record<string, number>;
    quotations.forEach((x) => { counts[x.status] = (counts[x.status] || 0) + 1; });
    return { total, revenue, accepted, conv: total ? Math.round((accepted / total) * 100) : 0, counts };
  }, [quotations]);

  const filtered = quotations.filter((x) => {
    const number = x.quotationId || x.number || "";
    const name = x.customerSnapshot?.customerName || x.customerName || "";
    const matches = !q || number.toLowerCase().includes(q.toLowerCase()) || name.toLowerCase().includes(q.toLowerCase());
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
        <div className="flex items-center gap-3">
          <Link to="/inventory" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground font-medium shadow-sm hover:bg-muted transition-colors">
            <Package className="w-4 h-4" /> Manage Inventory
          </Link>
          <Link to="/quotations/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95">
            <Plus className="w-4 h-4" /> New Quotation
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Total Quotations" value={String(stats.total)} sub={`${quotations.filter((q) => new Date(q.createdAt).getMonth() === new Date().getMonth()).length} this month`} />
        <StatCard icon={<Target className="w-5 h-5" />} label="Conversion Rate" value={`${stats.conv}%`} sub={`${stats.accepted} accepted`} tone="success" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Revenue" value={formatINR(stats.revenue).replace(/\.00$/, "")} sub={`Avg ${stats.total ? formatINR(stats.revenue / stats.total).replace(/\.00$/, "") : "—"}`} />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Follow-ups" value={String(quotations.filter((x) => x.followUpDate).length)} sub="due soon" tone="violet" />
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
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" placeholder="Search by quotation number or customer..." />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none">
          {["All", "Draft", "Sent", "Accepted", "Rejected"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <Link
          to="/quotations/new"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-elegant hover:scale-105 active:scale-95 transition-all shrink-0"
          title="Create New Quotation"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Table / cards */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto max-h-125 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10 shadow-sm">
              <tr>
                {["#", "Quotation", "Customer", "Created", "Total", "Follow-up", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const total = q.totalAmount !== undefined ? q.totalAmount : q.items.reduce((s: number, it: any) => s + it.quantity * (it.price || it.unitPrice), 0);
                const qId = q._id || q.id;
                const qNumber = q.quotationId || q.number;
                const qCustomerName = q.customerSnapshot?.customerName || q.customerName;

                return (
                  <tr key={qId} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{qNumber}</td>
                    <td className="px-4 py-3">{qCustomerName}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatINR(total)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{q.followUpDate ? new Date(q.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "N/A"}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <IconBtn onClick={() => handleSendWhatsapp(q)} label="Send WhatsApp"><Send className="w-4 h-4 text-blue-600" /></IconBtn>
                        <IconBtn onClick={() => handleDownload(q)} label="Download PDF"><Download className="w-4 h-4 text-emerald-600" /></IconBtn>
                        <Link to={`/quotations/new?copyFrom=${qId}`} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center transition-colors focus:outline-none"><Copy className="w-4 h-4" /></Link>
                        <Link to={`/quotations/edit/${qId}`} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center transition-colors focus:outline-none"><Edit className="w-4 h-4 text-primary" /></Link>
                        <IconBtn onClick={() => handleDelete(qId)} label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></IconBtn>
                        <div className="relative">
                          <button
                            onClick={() => setActiveStatusMenuId(activeStatusMenuId === qId ? null : qId)}
                            className={`w-9 h-9 rounded-lg border transition-all flex items-center justify-center focus:outline-none ${getStatusOutlineClass(q.status)}`}
                            title={`Status: ${q.status}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          {activeStatusMenuId === qId && (
                            <div className="absolute right-0 mt-1 w-32 rounded-xl border border-border bg-popover shadow-elegant py-1 z-30">
                              {(["Accepted", "Rejected"] as const).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleUpdateStatus(qId, s)}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-medium transition-colors focus:outline-none"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {loading && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-sm">Loading quotations...</td></tr>}
              {!loading && !filtered.length && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground text-sm">No quotations found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((q) => {
            const total = q.totalAmount !== undefined ? q.totalAmount : q.items.reduce((s: number, it: any) => s + it.quantity * (it.price || it.unitPrice), 0);
            const qId = q._id || q.id;
            const qNumber = q.quotationId || q.number;
            const qCustomerName = q.customerSnapshot?.customerName || q.customerName;

            return (
              <div key={qId} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{qCustomerName}</div>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString("en-IN")}</div>
                    <div className="font-semibold mt-0.5">{formatINR(total)}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Send WhatsApp */}
                    <IconBtn onClick={() => handleSendWhatsapp(q)} label="Send WhatsApp"><Send className="w-4 h-4 text-blue-600" /></IconBtn>
                    {/* Download */}
                    <IconBtn onClick={() => handleDownload(q)} label="Download PDF"><Download className="w-4 h-4 text-emerald-600" /></IconBtn>
                    {/* Copy */}
                    <Link to={`/quotations/new?copyFrom=${qId}`} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center transition-colors focus:outline-none"><Copy className="w-4 h-4" /></Link>
                    {/* Edit */}
                    <Link to={`/quotations/edit/${qId}`} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center transition-colors focus:outline-none"><Edit className="w-4 h-4 text-primary" /></Link>
                    {/* Delete */}
                    <IconBtn onClick={() => handleDelete(qId)} label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></IconBtn>
                    {/* Status */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveStatusMenuId(activeStatusMenuId === qId ? null : qId)}
                        className={`w-9 h-9 rounded-lg border transition-all flex items-center justify-center focus:outline-none ${getStatusOutlineClass(q.status)}`}
                        title={`Status: ${q.status}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      {activeStatusMenuId === qId && (
                        <div className="absolute right-0 bottom-full mb-1 w-32 rounded-xl border border-border bg-popover shadow-elegant py-1 z-30">
                          {(["Accepted", "Rejected"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleUpdateStatus(qId, s)}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-medium transition-colors focus:outline-none"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {loading && <div className="p-10 text-center text-muted-foreground text-sm">Loading quotations...</div>}
          {!loading && !filtered.length && <div className="p-10 text-center text-muted-foreground text-sm">No quotations found.</div>}
        </div>
      </div>

      {shareQuotationId && (
        <ShareDialog
          quotationId={shareQuotationId}
          onClose={() => setShareQuotationId(null)}
          onSend={(id, markSent) => {
            if (markSent) handleUpdateStatus(id, "Sent");
            setShareQuotationId(null);
            toast.success("Quotation shared successfully");
          }}
        />
      )}
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
    <button onClick={onClick} aria-label={label} className="w-9 h-9 rounded-lg border border-border bg-background hover:bg-muted grid place-items-center transition-colors focus:outline-none">{children}</button>
  );
}

function ShareDialog({ quotationId, onClose, onSend }: { quotationId: string; onClose: () => void; onSend: (id: string, markSent: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [markSent, setMarkSent] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-elegant animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Share Quotation</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border hover:bg-muted grid place-items-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Recipient Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@company.com" className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" autoFocus />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={markSent} onChange={(e) => setMarkSent(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="text-sm font-medium">Mark quotation as Sent</span>
          </label>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 bg-muted/20 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">Cancel</button>
          <button onClick={() => { if (!email) { toast.error("Enter an email"); return; } onSend(quotationId, markSent); }} className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant hover:opacity-95 transition-opacity">Send Email</button>
        </div>
      </div>
    </div>
  );
}
