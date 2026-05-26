import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, FileText, Calculator, User, StickyNote, ListChecks, Search, X, Loader2, Check, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/store";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { downloadQuotationPDF } from "@/lib/pdf";

export const Route = createFileRoute("/quotations/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Quotation — Indux" }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><EditQuotation /></AppShell>,
});

// ── API type for customer ──────────────────────────────────────────────
interface CustomerRecord {
  _id: string;
  customerCode: string;
  customerName: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  gstNumber?: string;
  address?: string;
  notes?: string;
}

// ── API type for product (from inventory) ─────────────────────────────
interface ProductRecord {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  hsnNumber?: string;
  unitPrice: number;
  taxPercentage: number;
  defaultDiscount: number;
  size?: string;
  uom?: string;
  productImages?: { type: string; url: string }[];
}

// ── Local quotation item shape ────────────────────────────────────────
interface QuotationItemLocal {
  productId: string;  // MongoDB _id
  name: string;
  sku: string;
  hsnNumber: string;
  size: string;
  uom: string;
  quantity: number;
  price: number;
  discount: number;   // item-level discount amount
  tax: number;        // item-level tax %
  image?: string;
}

function EditQuotation() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  // ── Customer list from API ──────────────────────────────────────────
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await api.get<CustomerRecord[]>("/customers");
      setCustomers(res ?? []);
    } catch (err) {
      console.error("[Quotation] Failed to load customers:", err);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  // ── Products from backend ───────────────────────────────────────────
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get<ProductRecord[]>("/inventory/products");
      setProducts(res ?? []);
    } catch (err) {
      console.error("[Quotation] Failed to load products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  // ── Form state ──────────────────────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [billing, setBilling] = useState({ companyName: "", gstNumber: "", display: "Both", taxPercent: 0, discountPercent: 0 });
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState<string[]>(["100% secure payment", "No warranty"]);
  const [newTerm, setNewTerm] = useState("");
  const [items, setItems] = useState<QuotationItemLocal[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickQ, setPickQ] = useState("");
  const [followUp, setFollowUp] = useState<string>("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Add Customer Dialog state ──────────────────────────────────────
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [dialogPrefillName, setDialogPrefillName] = useState("");

  // Load existing quotation data
  useEffect(() => {
    const loadQuotation = async () => {
      try {
        const data = await api.get<any>(`/quotations/${id}`);
        if (data) {
          setSelectedCustomerId(data.customerId);
          setSelectedCustomerName(data.customerSnapshot?.customerName || "");
          setCustomer({
            name: data.customerSnapshot?.customerName || "",
            email: data.customerSnapshot?.email || "",
            phone: data.customerSnapshot?.phoneNumber || "",
          });
          setBilling({
            companyName: data.customerSnapshot?.companyName || "",
            gstNumber: data.customerSnapshot?.gstNumber || "",
            display: data.displayPreference || "Both",
            taxPercent: 0, 
            discountPercent: 0,
          });
          setNotes(data.notes || "");
          setTerms(data.termsAndConditions || []);
          if (data.followUpDate) {
            setFollowUp(new Date(data.followUpDate).toISOString().split("T")[0]);
          }
          setItems((data.items || []).map((it: any) => ({
            productId: it.productId,
            name: it.productSnapshot?.productName || "",
            sku: it.productSnapshot?.sku || "",
            hsnNumber: it.productSnapshot?.hsnNumber || "",
            size: it.productSnapshot?.size || "",
            uom: it.productSnapshot?.uom || "",
            quantity: it.quantity || 1,
            price: it.unitPrice || 0,
            discount: it.discount || 0,
            tax: it.tax || 0,
          })));
        }
      } catch (err) {
        console.error("Failed to load quotation", err);
        toast.error("Failed to load quotation for editing");
      } finally {
        setInitialLoading(false);
      }
    };
    loadQuotation();
  }, [id]);

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
    const itemTax = items.reduce((s, it) => s + (it.quantity * it.price * it.tax) / 100, 0);
    const itemDiscount = items.reduce((s, it) => s + (it.discount || 0), 0);
    const overallTaxAmount = (sub * billing.taxPercent) / 100;
    const overallDiscountAmount = (sub * billing.discountPercent) / 100;
    const totalTax = itemTax + overallTaxAmount;
    const totalDiscount = itemDiscount + overallDiscountAmount;
    const grand = sub + totalTax - totalDiscount;
    return { sub, tax: totalTax, discount: totalDiscount, grand: Math.max(0, grand) };
  }, [items, billing.taxPercent, billing.discountPercent]);

  const addItem = (productId: string) => {
    const found = products.find((i) => i._id === productId);
    if (!found) return;
    if (items.some((it) => it.productId === productId)) { toast.message("Already added"); return; }
    const img = found.productImages?.find((i) => i.type === "product")?.url || found.productImages?.[0]?.url;
    setItems((p) => [...p, {
      productId: productId,
      name: found.productName,
      sku: found.sku || "",
      hsnNumber: found.hsnNumber || "",
      size: found.size || "",
      uom: found.uom || "",
      quantity: 1,
      price: found.unitPrice,
      discount: 0,
      tax: found.taxPercentage ?? 18,
      image: img,
    }]);
    setPickerOpen(false); setPickQ("");
  };

  const updateItem = (productId: string, patch: Partial<QuotationItemLocal>) => setItems((p) => p.map((it) => it.productId === productId ? { ...it, ...patch } : it));
  const removeItem = (productId: string) => setItems((p) => p.filter((it) => it.productId !== productId));

  const addTerm = () => { if (!newTerm.trim()) return; setTerms((p) => [...p, newTerm.trim()]); setNewTerm(""); };

  const save = async (alsoDownload = false) => {
    if (!selectedCustomerId) { toast.error("Please select a customer"); return; }
    if (!items.length) { toast.error("Add at least one item"); return; }

    let displayPref: "Customer Name" | "Company Name" | "Both" = "Both";
    if (billing.display === "Print Person Name" || billing.display === "Customer Name") displayPref = "Customer Name";
    else if (billing.display === "Print Company Name" || billing.display === "Company Name") displayPref = "Company Name";
    else displayPref = "Both";

    const payload = {
      customerId: selectedCustomerId,
      followUpDate: followUp || "",
      displayPreference: displayPref,
      termsAndConditions: terms,
      notes,
      subtotal: totals.sub,
      tax: totals.tax,
      discount: totals.discount,
      totalAmount: totals.grand,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.price,
        discount: it.discount || 0,
        tax: it.tax,
        total: Math.round((it.quantity * it.price + (it.quantity * it.price * it.tax) / 100 - (it.discount || 0)) * 100) / 100,
      })),
    };

    setSaving(true);
    try {
      // Put request to update quotation
      const updated = await api.put<any>(`/quotations/${id}`, payload);
      toast.success(`Quotation updated successfully`);

      if (alsoDownload && updated) {
        try {
          const mappedForPdf = {
            id: updated._id || "",
            number: updated.quotationId || "QUO-0000",
            customerName: updated.customerSnapshot?.customerName || "",
            customerEmail: updated.customerSnapshot?.email || "",
            customerPhone: updated.customerSnapshot?.phoneNumber || "",
            companyName: updated.customerSnapshot?.companyName || "",
            gstNumber: updated.customerSnapshot?.gstNumber || "",
            notes: updated.notes || "",
            terms: updated.termsAndConditions || [],
            items: (updated.items || []).map((it: any) => ({
              itemId: it.productId,
              name: it.productSnapshot?.productName || "",
              quantity: it.quantity,
              price: it.unitPrice,
              tax: it.tax,
            })),
            status: updated.status || "Draft",
            followUpDate: updated.followUpDate ? new Date(updated.followUpDate).toISOString().split("T")[0] : undefined,
            createdAt: updated.createdAt || new Date().toISOString(),
          };
          downloadQuotationPDF(mappedForPdf);
          toast.success("PDF download triggered");
        } catch (pdfErr) {
          console.error("[Quotation] PDF download failed:", pdfErr);
          toast.error("Failed to generate PDF. You can download it from the dashboard.");
        }
      }

      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("[Quotation] Save failed:", err);
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save quotation. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onCustomerSelected = (cid: string, label: string) => {
    setSelectedCustomerId(cid);
    setSelectedCustomerName(label);
    const c = customers.find((cu) => cu._id === cid);
    if (c) {
      setCustomer({ name: c.customerName, email: c.email || "", phone: c.phoneNumber || "" });
      setBilling((prev) => ({
        ...prev,
        companyName: c.companyName || "",
        gstNumber: c.gstNumber || "",
      }));
    }
  };

  const onAddNewCustomer = (name: string) => {
    setDialogPrefillName(name);
    setShowCustomerDialog(true);
  };

  const onCustomerCreated = (c: CustomerRecord) => {
    setCustomers((prev) => [c, ...prev]);
    setSelectedCustomerId(c._id);
    setSelectedCustomerName(c.customerName);
    setCustomer({ name: c.customerName, email: c.email || "", phone: c.phoneNumber || "" });
    setBilling((prev) => ({
      ...prev,
      companyName: c.companyName || "",
      gstNumber: c.gstNumber || "",
    }));
    setShowCustomerDialog(false);
    setDialogPrefillName("");
  };

  const pickerResults = products.filter((i) => !pickQ || i.productName.toLowerCase().includes(pickQ.toLowerCase()) || i.sku.toLowerCase().includes(pickQ.toLowerCase()));

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">Loading quotation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Edit Quotation</h1>
          <p className="text-muted-foreground text-sm mt-1">Modify details and save your changes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(false)} disabled={saving} className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Saving...</> : "Save"}
          </button>
          <button onClick={() => save(true)} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            <FileText className="w-4 h-4" /> Save & download
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section icon={<User className="w-5 h-5" />} title="Customer Details" right={
            <button onClick={() => { setDialogPrefillName(""); setShowCustomerDialog(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant hover:opacity-95">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          }>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Select Customer *">
                <SearchableSelect
                  value={selectedCustomerName}
                  options={customers.map((c) => ({ id: c._id, label: c.customerName }))}
                  onChange={onCustomerSelected}
                  onAdd={onAddNewCustomer}
                  placeholder={customersLoading ? "Loading customers…" : "Search customer…"}
                  addLabel="Add customer"
                  disabled={customersLoading}
                />
              </Field>
              <Field label="Email"><input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className={input} placeholder="john@company.com" /></Field>
              <Field label="Phone"><input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={input} placeholder="+91 98XXXXXXXX" /></Field>
              <Field label="Follow-up Date"><input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className={input} /></Field>
            </div>
          </Section>

          <Section icon={<Calculator className="w-5 h-5" />} title="Billing Preferences">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company Name"><input value={billing.companyName} onChange={(e) => setBilling({ ...billing, companyName: e.target.value })} className={input} placeholder="Enter Company Name" /></Field>
              <Field label="GST Number"><input value={billing.gstNumber} onChange={(e) => setBilling({ ...billing, gstNumber: e.target.value })} className={input} placeholder="27AAAPL1234C1Z5" /></Field>
              <Field label="Display Preference">
                <select value={billing.display} onChange={(e) => setBilling({ ...billing, display: e.target.value })} className={input}>
                  <option value="Customer Name">Customer Name</option><option value="Company Name">Company Name</option><option value="Both">Both</option>
                </select>
              </Field>
              <Field label="Overall Tax %">
                <input type="number" min={0} max={100} value={billing.taxPercent} onChange={(e) => setBilling({ ...billing, taxPercent: Math.min(100, Math.max(0, +e.target.value || 0)) })} className={input} placeholder="0" />
              </Field>
              <Field label="Overall Discount %">
                <input type="number" min={0} max={100} value={billing.discountPercent} onChange={(e) => setBilling({ ...billing, discountPercent: Math.min(100, Math.max(0, +e.target.value || 0)) })} className={input} placeholder="0" />
              </Field>
            </div>
          </Section>

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
                    {productsLoading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Loading products…</div>}
                    {!productsLoading && pickerResults.map((it) => {
                      const img = it.productImages?.find((i) => i.type === "product")?.url || it.productImages?.[0]?.url;
                      return (
                      <button key={it._id} onClick={() => addItem(it._id)} className="w-full flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg text-left">
                        <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden grid place-items-center">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{it.productName.slice(0, 2)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{it.productName}</div>
                          <div className="text-xs text-muted-foreground truncate">{it.sku} • {formatINR(it.unitPrice)}</div>
                        </div>
                      </button>
                    );
                    })}
                    {!productsLoading && !pickerResults.length && <div className="p-4 text-center text-sm text-muted-foreground">No items.</div>}
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
                  <div key={it.productId} className="rounded-xl border border-border p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-12 gap-3 items-center">
                    <div className="col-span-2 sm:col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden grid place-items-center shrink-0">
                        {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-accent-foreground">{it.name.slice(0, 2)}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{it.sku}{it.uom ? ` • ${it.uom}` : ""}</div>
                      </div>
                    </div>
                    <Field className="sm:col-span-2" label="Qty">
                      <input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(it.productId, { quantity: Math.max(1, +e.target.value || 1) })} className={input} />
                    </Field>
                    <Field className="sm:col-span-2" label="Price">
                      <input type="number" min={0} value={it.price} onChange={(e) => updateItem(it.productId, { price: Math.max(0, +e.target.value || 0) })} className={input} />
                    </Field>
                    <Field className="sm:col-span-2" label="Tax %">
                      <input type="number" min={0} max={100} value={it.tax} onChange={(e) => updateItem(it.productId, { tax: Math.min(100, Math.max(0, +e.target.value || 0)) })} className={input} />
                    </Field>
                    <Field className="sm:col-span-2" label="Discount ₹">
                      <input type="number" min={0} value={it.discount} onChange={(e) => updateItem(it.productId, { discount: Math.max(0, +e.target.value || 0) })} className={input} />
                    </Field>
                    <div className="sm:col-span-1 flex sm:justify-end">
                      <button onClick={() => removeItem(it.productId)} className="w-9 h-9 rounded-lg border border-border hover:bg-muted grid place-items-center" aria-label="Remove"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section icon={<StickyNote className="w-5 h-5" />} title="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add any additional notes..." className={`${input} resize-none`} />
          </Section>

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

          <Section title="Summary">
            <dl className="text-sm space-y-2">
              <Row label="Subtotal" value={formatINR(totals.sub)} />
              <Row label="Tax" value={formatINR(totals.tax)} />
              <Row label="Discount" value={<span className="text-destructive">-{formatINR(totals.discount)}</span>} />
              <div className="border-t border-border my-2" />
              <Row label={<span className="font-semibold">Grand Total</span>} value={<span className="font-display text-xl font-semibold">{formatINR(totals.grand)}</span>} />
            </dl>
          </Section>
        </div>
      </div>

      {showCustomerDialog && (
        <AddCustomerDialog
          onClose={() => { setShowCustomerDialog(false); setDialogPrefillName(""); }}
          onCreated={onCustomerCreated}
          prefillName={dialogPrefillName}
        />
      )}
    </div>
  );
}

function AddCustomerDialog({
  onClose,
  onCreated,
  prefillName = "",
}: {
  onClose: () => void;
  onCreated: (c: CustomerRecord) => void;
  prefillName?: string;
}) {
  const [form, setForm] = useState({
    customerName: prefillName,
    email: "",
    phoneNumber: "",
    companyName: "",
    gstNumber: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.post<CustomerRecord>("/customers", form);
      toast.success(`Customer ${created?.customerCode || ""} created`);
      onCreated(created);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Internal server error. Contact admin.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-elegant animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-lg">Add New Customer</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border hover:bg-muted grid place-items-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Customer Name *">
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className={input} placeholder="John Doe" autoFocus />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="john@company.com" />
            </Field>
            <Field label="Phone Number">
              <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className={input} placeholder="+91 98XXXXXXXX" />
            </Field>
            <Field label="Company Name">
              <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={input} placeholder="Acme Industries Pvt Ltd" />
            </Field>
            <Field label="GST Number">
              <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className={input} placeholder="27AAAPL1234C1Z5" />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} placeholder="123 Main Street, Mumbai" />
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${input} resize-none`} placeholder="Any additional notes about this customer..." />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Create Customer</>}
            </button>
          </div>
        </form>
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

function SearchableSelect({
  value, options, onChange, onAdd, placeholder = "Search…", addLabel = "Add new", disabled = false,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string, label: string) => void;
  onAdd: (label: string) => void;
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = query.trim();
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const canAdd = q.length > 0 && !options.some((o) => o.label.toLowerCase() === q.toLowerCase());

  const pick = (opt: { id: string; label: string }) => { onChange(opt.id, opt.label); setOpen(false); setQuery(""); };
  const add  = () => { if (!canAdd) return; onAdd(q); setOpen(false); setQuery(""); };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`${input} flex items-center justify-between text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-border bg-popover shadow-elegant overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (canAdd) add(); else if (filtered[0]) pick(filtered[0]); } }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-auto py-1">
            {filtered.map((o) => (
              <button key={o.id} type="button" onClick={() => pick(o)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left">
                <span>{o.label}</span>
                {o.label === value && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
            {filtered.length === 0 && !canAdd && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No matches</div>
            )}
          </div>
          {canAdd && (
            <button type="button" onClick={add} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm border-t border-border bg-accent/40 hover:bg-accent text-left">
              <Plus className="w-4 h-4 text-primary" />
              <span className="font-medium">{addLabel}:</span>
              <span className="text-muted-foreground truncate">{q}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
