import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, FileText, Calculator, User, StickyNote, ListChecks, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useDB, formatINR, type QuotationItem } from "@/lib/store";
import { toast } from "sonner";
import { downloadQuotationPDF } from "@/lib/pdf";

export const Route = createFileRoute("/quotations/new")({
  head: () => ({ meta: [{ title: "New Quotation — Indux" }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><NewQuotation /></AppShell>,
});

function NewQuotation() {
  const db = useDB();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [billing, setBilling] = useState({ companyName: "", gstNumber: "", display: "Print Person Name" });
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState<string[]>(["100% secure payment", "No warranty"]);
  const [newTerm, setNewTerm] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickQ, setPickQ] = useState("");
  const [followUp, setFollowUp] = useState<string>("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setPickQ("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const totals = useMemo(() => {
    const sub = items.reduce((s, it) => s + it.quantity * it.price, 0);
    const tax = items.reduce((s, it) => s + (it.quantity * it.price * it.tax) / 100, 0);
    return { sub, tax, grand: sub + tax };
  }, [items]);

  const addItem = (id: string) => {
    const found = db.inventory.find((i) => i.id === id);
    if (!found) return;
    if (items.some((it) => it.itemId === id)) { toast.message("Already added"); return; }
    setItems((p) => [...p, { itemId: id, name: found.name, price: found.price, quantity: 1, tax: 18 }]);
    setPickerOpen(false); setPickQ("");
  };

  const updateItem = (id: string, patch: Partial<QuotationItem>) => setItems((p) => p.map((it) => it.itemId === id ? { ...it, ...patch } : it));
  const removeItem = (id: string) => setItems((p) => p.filter((it) => it.itemId !== id));

  const addTerm = () => { if (!newTerm.trim()) return; setTerms((p) => [...p, newTerm.trim()]); setNewTerm(""); };

  const save = (alsoDownload = false) => {
    if (!customer.name) { toast.error("Customer name is required"); return; }
    if (!items.length) { toast.error("Add at least one item"); return; }
    const q = store.addQuotation({
      customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone,
      companyName: billing.companyName, gstNumber: billing.gstNumber,
      notes, terms, items, status: "Draft", followUpDate: followUp || undefined,
    });
    toast.success(`Quotation ${q.number} created`);
    if (alsoDownload) downloadQuotationPDF(q);
    navigate({ to: "/dashboard" });
  };

  const pickerResults = db.inventory.filter((i) => !pickQ || i.name.toLowerCase().includes(pickQ.toLowerCase()) || i.sku.toLowerCase().includes(pickQ.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">New Quotation</h1>
          <p className="text-muted-foreground text-sm mt-1">Build a polished quote in minutes — pick items, set taxes, export PDF.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(false)} className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-medium text-sm">Save as draft</button>
          <button onClick={() => save(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm">
            <FileText className="w-4 h-4" /> Generate & download
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Section icon={<User className="w-5 h-5" />} title="Customer Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Customer Name *"><input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={input} placeholder="John Doe" /></Field>
              <Field label="Email"><input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className={input} placeholder="john@company.com" /></Field>
              <Field label="Phone"><input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={input} placeholder="+91 98XXXXXXXX" /></Field>
              <Field label="Follow-up Date"><input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className={input} /></Field>
            </div>
          </Section>

          {/* Billing */}
          <Section icon={<Calculator className="w-5 h-5" />} title="Billing Preferences">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company Name"><input value={billing.companyName} onChange={(e) => setBilling({ ...billing, companyName: e.target.value })} className={input} placeholder="Enter Company Name" /></Field>
              <Field label="GST Number"><input value={billing.gstNumber} onChange={(e) => setBilling({ ...billing, gstNumber: e.target.value })} className={input} placeholder="27AAAPL1234C1Z5" /></Field>
              <Field label="Display Preference">
                <select value={billing.display} onChange={(e) => setBilling({ ...billing, display: e.target.value })} className={input}>
                  <option>Print Person Name</option><option>Print Company Name</option><option>Both</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Items */}
          <Section icon={<ListChecks className="w-5 h-5" />} title="Items" right={
            <div ref={pickerRef} className="relative">
              <button onClick={() => setPickerOpen((o) => !o)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant"><Plus className="w-4 h-4" /> Add Item</button>
              {pickerOpen && (
                <div className="absolute right-0 mt-2 w-[min(92vw,360px)] rounded-2xl border border-border bg-popover shadow-elegant p-3 z-20">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={pickQ} onChange={(e) => setPickQ(e.target.value)} placeholder="Search inventory..." className={`${input} pl-10`} />
                  </div>
                  <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-border">
                    {pickerResults.map((it) => (
                      <button key={it.id} onClick={() => addItem(it.id)} className="w-full flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg text-left">
                        <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden grid place-items-center">
                          {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{it.name.slice(0, 2)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{it.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{it.sku} • {formatINR(it.price)}</div>
                        </div>
                      </button>
                    ))}
                    {!pickerResults.length && <div className="p-4 text-center text-sm text-muted-foreground">No items.</div>}
                  </div>
                </div>
              )}
            </div>
          }>
            {items.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
                No items yet — click <span className="font-medium text-foreground">Add Item</span> to pick from your inventory.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div key={it.itemId} className="rounded-xl border border-border p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
                    <div className="col-span-2 sm:col-span-5">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">Unit price {formatINR(it.price)}</div>
                    </div>
                    <Field className="sm:col-span-2" label="Qty">
                      <input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(it.itemId, { quantity: Math.max(1, +e.target.value || 1) })} className={input} />
                    </Field>
                    <Field className="sm:col-span-2" label="Price">
                      <input type="number" min={0} value={it.price} onChange={(e) => updateItem(it.itemId, { price: Math.max(0, +e.target.value || 0) })} className={input} />
                    </Field>
                    <Field className="sm:col-span-2" label="Tax %">
                      <input type="number" min={0} max={100} value={it.tax} onChange={(e) => updateItem(it.itemId, { tax: Math.min(100, Math.max(0, +e.target.value || 0)) })} className={input} />
                    </Field>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <button onClick={() => removeItem(it.itemId)} className="w-9 h-9 rounded-lg border border-border hover:bg-muted grid place-items-center" aria-label="Remove"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          {/* Notes */}
          <Section icon={<StickyNote className="w-5 h-5" />} title="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add any additional notes..." className={`${input} resize-none`} />
          </Section>

          {/* Terms */}
          <Section title="Terms & Conditions">
            <div className="space-y-2">
              {terms.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm flex-1">{t}</span>
                  <button onClick={() => setTerms((p) => p.filter((_, j) => j !== i))} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input value={newTerm} onChange={(e) => setNewTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTerm())} placeholder="Add new term..." className={input} />
                <button onClick={addTerm} className="px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
            </div>
          </Section>

          {/* Totals */}
          <Section title="Summary">
            <dl className="text-sm space-y-2">
              <Row label="Subtotal" value={formatINR(totals.sub)} />
              <Row label="Tax" value={formatINR(totals.tax)} />
              <div className="border-t border-border my-2" />
              <Row label={<span className="font-semibold">Grand Total</span>} value={<span className="font-display text-xl font-semibold">{formatINR(totals.grand)}</span>} />
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

const input = "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

function Section({ title, icon, right, children }: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground">{icon}</div>}
          <h2 className="font-display font-semibold text-lg">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>;
}
