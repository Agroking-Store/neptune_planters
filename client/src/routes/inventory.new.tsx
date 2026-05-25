import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Package, Save, Image as ImageIcon, Tag, IndianRupee, Boxes, Palette, Check, ChevronDown, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store } from "@/lib/store";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/inventory/new")({
  head: () => ({ meta: [{ title: "Add Inventory Item — Indux" }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><NewItem /></AppShell>,
});

const DEFAULT_DEPARTMENTS = ["Electronics", "Furniture", "Industrial Access", "Stationery", "Tools", "Lighting"];
const DEFAULT_CATEGORIES = ["General", "Premium", "Budget", "Industrial", "Consumer", "Specialty"];
const UOMS = ["pcs", "box", "kg", "ltr", "set", "mtr", "sqft"];

function NewItem() {
  const navigate = useNavigate();
  const productImgRef = useRef<HTMLInputElement>(null);
  const refImgRef = useRef<HTMLInputElement>(null);
  const textureImgRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("indux_departments") || "null") || DEFAULT_DEPARTMENTS; } catch { return DEFAULT_DEPARTMENTS; }
  });
  const [categories, setCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("indux_categories") || "null") || DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  useEffect(() => { localStorage.setItem("indux_departments", JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem("indux_categories", JSON.stringify(categories)); }, [categories]);

  const [image, setImage] = useState<string | undefined>();
  const [referenceImage, setReferenceImage] = useState<string | undefined>();
  const [textureImage, setTextureImage] = useState<string | undefined>();

  const [form, setForm] = useState({
    // Basics
    name: "", sku: "", hsn: "", description: "",
    department: "Electronics", category: "General",
    // Pricing
    price: 0, discount: 0, tax: 18,
    // Stock
    quantity: 0, unit: "pcs",
    // Attributes
    brand: "", batchNo: "", color: "", productN: "", size: "", dimensions: "",
  });

  const readFile = (f: File, setter: (s: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku) { toast.error("Product name and SKU are required"); return; }
    store.addInventory({ ...form, image, referenceImage, textureImage });
    toast.success("Item added to inventory");
    navigate({ to: "/inventory" });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Add Inventory Item</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in product details across each section, then save it to your catalogue.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Media */}
        <Section icon={<ImageIcon className="w-5 h-5" />} title="Product Media" subtitle="Primary product, reference and texture imagery.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ImageDrop label="Product Image" value={image} onPick={() => productImgRef.current?.click()} onClear={() => setImage(undefined)} inputRef={productImgRef} onFile={(f) => readFile(f, setImage)} />
            <ImageDrop label="Reference Image" value={referenceImage} onPick={() => refImgRef.current?.click()} onClear={() => setReferenceImage(undefined)} inputRef={refImgRef} onFile={(f) => readFile(f, setReferenceImage)} />
            <ImageDrop label="Texture Image" value={textureImage} onPick={() => textureImgRef.current?.click()} onClear={() => setTextureImage(undefined)} inputRef={textureImgRef} onFile={(f) => readFile(f, setTextureImage)} />
          </div>
        </Section>

        {/* Basics */}
        <Section icon={<Package className="w-5 h-5" />} title="Product Info" subtitle="The essentials: name, codes and classification.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Product Name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Office Chair Executive" /></Field>
            <Field label="SKU *"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} placeholder="OFFICE-CHAIR-001" /></Field>
            <Field label="HSN Number"><input value={form.hsn} onChange={(e) => setForm({ ...form, hsn: e.target.value })} className={input} placeholder="94013000" /></Field>
            <Field label="Department">
              <SearchableSelect
                value={form.department}
                options={departments}
                onChange={(v) => setForm({ ...form, department: v })}
                onAdd={(v) => setDepartments((prev) => prev.includes(v) ? prev : [...prev, v])}
                placeholder="Search department…"
                addLabel="Add department"
              />
            </Field>
            <Field label="Category">
              <SearchableSelect
                value={form.category}
                options={categories}
                onChange={(v) => setForm({ ...form, category: v })}
                onAdd={(v) => setCategories((prev) => prev.includes(v) ? prev : [...prev, v])}
                placeholder="Search category…"
                addLabel="Add category"
              />
            </Field>
            <Field label="Product-N"><input value={form.productN} onChange={(e) => setForm({ ...form, productN: e.target.value })} className={input} placeholder="PN-00123" /></Field>
            <Field className="sm:col-span-2 lg:col-span-3" label="Product Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${input} resize-none`} placeholder="Short description shown on quotations…" />
            </Field>
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={<IndianRupee className="w-5 h-5" />} title="Pricing & Tax" subtitle="Unit price along with discount and tax percentages.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Unit Price (₹)"><input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value || 0 })} className={input} /></Field>
            <Field label="Discount (%)"><input type="number" min={0} max={100} value={form.discount} onChange={(e) => setForm({ ...form, discount: +e.target.value || 0 })} className={input} /></Field>
            <Field label="Tax (%)"><input type="number" min={0} max={100} value={form.tax} onChange={(e) => setForm({ ...form, tax: +e.target.value || 0 })} className={input} /></Field>
          </div>
        </Section>

        {/* Stock */}
        <Section icon={<Boxes className="w-5 h-5" />} title="Stock & Units" subtitle="Quantity on hand and unit of measure.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Quantity"><input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value || 0 })} className={input} /></Field>
            <Field label="UOM (Unit)">
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input}>
                {UOMS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Batch No"><input value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} className={input} placeholder="BATCH-2026-05" /></Field>
          </div>
        </Section>

        {/* Attributes */}
        <Section icon={<Palette className="w-5 h-5" />} title="Attributes" subtitle="Brand, dimensions and visual descriptors.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Product Brand"><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={input} placeholder="Acme Co." /></Field>
            <Field label="Color"><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={input} placeholder="Charcoal Grey" /></Field>
            <Field label="Size"><input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={input} placeholder="L / 42 / XL" /></Field>
            <Field className="sm:col-span-2 lg:col-span-3" label="Dimensions"><input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className={input} placeholder="65 x 65 x 115 cm" /></Field>
          </div>

        </Section>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button type="button" onClick={() => navigate({ to: "/inventory" })} className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium">Cancel</button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm">
            <Save className="w-4 h-4" /> Save item
          </button>
        </div>
      </form>
    </div>
  );
}

const input = "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground shrink-0">{icon}</div>
        <div>
          <h2 className="font-display font-semibold text-lg leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
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

function ImageDrop({
  label, value, onPick, onClear, inputRef, onFile,
}: {
  label: string;
  value?: string;
  onPick: () => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><Tag className="w-3 h-3" /> {label}</div>
      <button
        type="button"
        onClick={onPick}
        className="w-full aspect-square rounded-2xl border-2 border-dashed border-border grid place-items-center text-center overflow-hidden bg-gradient-soft hover:bg-muted transition-colors"
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="p-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mx-auto mb-2 shadow-elegant"><Upload className="w-4 h-4" /></div>
            <div className="font-medium text-sm">Click to upload</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG up to 5MB</div>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {value && <button type="button" onClick={onClear} className="mt-2 text-xs text-destructive hover:underline">Remove</button>}
    </div>
  );
}

function SearchableSelect({
  value, options, onChange, onAdd, placeholder = "Search…", addLabel = "Add new",
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onAdd: (v: string) => void;
  placeholder?: string;
  addLabel?: string;
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
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  const canAdd = q.length > 0 && !options.some((o) => o.toLowerCase() === q.toLowerCase());

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery(""); };
  const add = () => { if (!canAdd) return; onAdd(q); onChange(q); setOpen(false); setQuery(""); };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${input} flex items-center justify-between text-left`}
      >
        <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      {open && (
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
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
              >
                <span>{o}</span>
                {o === value && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
            {filtered.length === 0 && !canAdd && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No matches</div>
            )}
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={add}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm border-t border-border bg-accent/40 hover:bg-accent text-left"
            >
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
