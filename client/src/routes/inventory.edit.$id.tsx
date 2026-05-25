import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Package, Save, Image as ImageIcon, Tag, IndianRupee, Boxes, Palette, Check, ChevronDown, Plus, Search, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/inventory/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Inventory Item — Indux" }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><EditItem /></AppShell>,
});

// ── Predefined UOM values (matches backend enum exactly) ──────────────
const UOM_VALUES = ["pcs", "box", "kg", "ltr", "set", "mtr", "sqft"] as const;
type UOM = typeof UOM_VALUES[number];

// ── API types ──────────────────────────────────────────────────────────
interface Department { _id: string; name: string; description?: string; }
interface Category   { _id: string; name: string; departmentId: string; }
interface Brand      { _id: string; name: string; }

function EditItem() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const productImgRef = useRef<HTMLInputElement>(null);
  const refImgRef     = useRef<HTMLInputElement>(null);
  const textureImgRef = useRef<HTMLInputElement>(null);

  // ── Lookup & Product data state ─────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [brands, setBrands]           = useState<Brand[]>([]);
  const [loading, setLoading]         = useState(true);

  // ── Form state ────────────────────────────────────────────────────────
  const [image, setImage]               = useState<string | undefined>();
  const [referenceImage, setRefImage]   = useState<string | undefined>();
  const [textureImage, setTexImage]     = useState<string | undefined>();

  const [form, setForm] = useState({
    productName: "", sku: "", hsnNumber: "", description: "",
    departmentId: "", departmentName: "",
    categoryId: "",   categoryName: "",
    brandId: "",      brandName: "",
    productN: "",
    unitPrice: 0, defaultDiscount: 0, taxPercentage: 18,
    stockQuantity: 0, uom: "pcs" as UOM,
    batchNo: "", color: "", size: "", dimensions: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch departments, brands, and the product to edit on mount
  useEffect(() => {
    const loadData = async () => {
      console.log(`[Inventory Edit] Fetching lookups and product with ID: ${id}`);
      try {
        const [depts, brnds, product] = await Promise.all([
          api.get<Department[]>("/inventory/departments"),
          api.get<Brand[]>("/inventory/brands"),
          api.get<any>(`/inventory/products/${id}`),
        ]);
        setDepartments(depts ?? []);
        setBrands(brnds ?? []);

        if (product) {
          setForm({
            productName: product.productName || "",
            sku: product.sku || "",
            hsnNumber: product.hsnNumber || "",
            description: product.description || "",
            departmentId: product.departmentId?._id || "",
            departmentName: product.departmentId?.name || "",
            categoryId: product.categoryId?._id || "",
            categoryName: product.categoryId?.name || "",
            brandId: product.brandId?._id || "",
            brandName: product.brandId?.name || "",
            productN: product.productN || "",
            unitPrice: product.unitPrice || 0,
            defaultDiscount: product.defaultDiscount || 0,
            taxPercentage: product.taxPercentage || 18,
            stockQuantity: product.stockQuantity || 0,
            uom: product.uom || "pcs",
            batchNo: product.batchNo || "",
            color: product.color || "",
            size: product.size || "",
            dimensions: product.dimensions || "",
          });

          // Pre-fill image fields
          if (product.productImages && Array.isArray(product.productImages)) {
            const prodImg = product.productImages.find((img: any) => img.type === "product");
            const refImg  = product.productImages.find((img: any) => img.type === "reference");
            const texImg  = product.productImages.find((img: any) => img.type === "texture");

            if (prodImg) setImage(prodImg.url);
            if (refImg) setRefImage(refImg.url);
            if (texImg) setTexImage(texImg.url);
          }

          // If product had a department, load its categories
          if (product.departmentId?._id) {
            const cats = await api.get<Category[]>(`/inventory/categories?departmentId=${product.departmentId._id}`);
            setCategories(cats ?? []);
          }
        }
      } catch (err) {
        console.error("[Inventory Edit] Failed to load data:", err);
        toast.error("Failed to load inventory item or categories.");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [id]);

  // When department changes → fetch its categories
  const onDepartmentChange = async (deptId: string, deptName: string) => {
    setForm((f) => ({ ...f, departmentId: deptId, departmentName: deptName, categoryId: "", categoryName: "" }));
    setCategories([]);
    if (!deptId) return;
    console.log("[Inventory] Fetching categories for dept:", deptName);
    try {
      const cats = await api.get<Category[]>(`/inventory/categories?departmentId=${deptId}`);
      setCategories(cats ?? []);
    } catch (err) {
      console.error("[Inventory] Failed to load categories:", err);
    }
  };

  const readFile = (f: File, setter: (s: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(f);
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.sku.trim()) {
      toast.error("Product name and SKU are required");
      return;
    }
    if (!form.departmentId && !form.departmentName) {
      toast.error("Please select a department");
      return;
    }

    setSubmitting(true);
    console.log("[Inventory Edit] Submitting update for:", form.productName);

    // Build images array
    const productImages = [
      image         && { type: "product",   url: image,         publicId: "" },
      referenceImage && { type: "reference", url: referenceImage, publicId: "" },
      textureImage  && { type: "texture",   url: textureImage,  publicId: "" },
    ].filter(Boolean);

    const payload = {
      ...form,
      productImages,
    };

    try {
      await api.put(`/inventory/products/${id}`, payload);
      console.log("[Inventory Edit] Product updated successfully");
      toast.success("Product details updated successfully");
      navigate({ to: "/inventory" });
    } catch (err) {
      console.error("[Inventory Edit] Update failed:", err);
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update product. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Edit Inventory Item</h1>
        <p className="text-muted-foreground text-sm mt-1">Update product details across each section, then save your changes.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Media */}
        <Section icon={<ImageIcon className="w-5 h-5" />} title="Product Media" subtitle="Primary product, reference and texture imagery.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ImageDrop label="Product Image"   value={image}          onPick={() => productImgRef.current?.click()} onClear={() => setImage(undefined)}    inputRef={productImgRef} onFile={(f) => readFile(f, setImage)} />
            <ImageDrop label="Reference Image" value={referenceImage} onPick={() => refImgRef.current?.click()}     onClear={() => setRefImage(undefined)}  inputRef={refImgRef}     onFile={(f) => readFile(f, setRefImage)} />
            <ImageDrop label="Texture Image"   value={textureImage}   onPick={() => textureImgRef.current?.click()} onClear={() => setTexImage(undefined)}  inputRef={textureImgRef} onFile={(f) => readFile(f, setTexImage)} />
          </div>
        </Section>

        {/* Product Info */}
        <Section icon={<Package className="w-5 h-5" />} title="Product Info" subtitle="The essentials: name, codes and classification.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Product Name *">
              <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className={input} placeholder="Office Chair Executive" />
            </Field>
            <Field label="SKU *">
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} placeholder="OFFICE-CHAIR-001" />
            </Field>
            <Field label="HSN Number">
              <input value={form.hsnNumber} onChange={(e) => setForm({ ...form, hsnNumber: e.target.value })} className={input} placeholder="94013000" />
            </Field>

            {/* Department — from API */}
            <Field label="Department *">
              <SearchableSelect
                value={form.departmentName}
                options={departments.map((d) => ({ id: d._id, label: d.name }))}
                onChange={(id, label) => void onDepartmentChange(id, label)}
                onAdd={async (name) => {
                  setDepartments((prev) => [...prev, { _id: "", name }]);
                  setForm((f) => ({ ...f, departmentId: "", departmentName: name, categoryId: "", categoryName: "" }));
                  setCategories([]);
                }}
                placeholder="Search department…"
                addLabel="Add department"
              />
            </Field>

            {/* Category — dynamic, filtered by dept */}
            <Field label="Category">
              <SearchableSelect
                value={form.categoryName}
                options={categories.map((c) => ({ id: c._id, label: c.name }))}
                onChange={(id, label) => setForm((f) => ({ ...f, categoryId: id, categoryName: label }))}
                onAdd={(name) => {
                  setCategories((prev) => [...prev, { _id: "", name, departmentId: form.departmentId }]);
                  setForm((f) => ({ ...f, categoryId: "", categoryName: name }));
                }}
                placeholder={(form.departmentId || form.departmentName) ? "Search category…" : "Select department first"}
                addLabel="Add category"
                disabled={!form.departmentId && !form.departmentName}
              />
            </Field>

            <Field label="Product-N">
              <input value={form.productN} onChange={(e) => setForm({ ...form, productN: e.target.value })} className={input} placeholder="PN-00123" />
            </Field>

            <Field className="sm:col-span-2 lg:col-span-3" label="Product Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${input} resize-none`} placeholder="Short description shown on quotations…" />
            </Field>
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={<IndianRupee className="w-5 h-5" />} title="Pricing & Tax" subtitle="Unit price along with discount and tax percentages.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Unit Price (₹) *">
              <input type="number" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value || 0 })} className={input} />
            </Field>
            <Field label="Discount (%)">
              <input type="number" min={0} max={100} value={form.defaultDiscount} onChange={(e) => setForm({ ...form, defaultDiscount: +e.target.value || 0 })} className={input} />
            </Field>
            <Field label="Tax (%)">
              <input type="number" min={0} max={100} value={form.taxPercentage} onChange={(e) => setForm({ ...form, taxPercentage: +e.target.value || 0 })} className={input} />
            </Field>
          </div>
        </Section>

        {/* Stock */}
        <Section icon={<Boxes className="w-5 h-5" />} title="Stock & Units" subtitle="Quantity on hand and unit of measure.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Quantity">
              <input type="number" min={0} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: +e.target.value || 0 })} className={input} />
            </Field>
            {/* UOM — predefined dropdown */}
            <Field label="UOM (Unit of Measure) *">
              <select
                value={form.uom}
                onChange={(e) => setForm({ ...form, uom: e.target.value as UOM })}
                className={input}
              >
                {UOM_VALUES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label="Batch No">
              <input value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} className={input} placeholder="BATCH-2026-05" />
            </Field>
          </div>
        </Section>

        {/* Attributes */}
        <Section icon={<Palette className="w-5 h-5" />} title="Attributes" subtitle="Brand, dimensions and visual descriptors.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Brand — from API */}
            <Field label="Brand">
              <SearchableSelect
                value={form.brandName}
                options={brands.map((b) => ({ id: b._id, label: b.name }))}
                onChange={(id, label) => setForm((f) => ({ ...f, brandId: id, brandName: label }))}
                onAdd={(name) => {
                  setBrands((prev) => [...prev, { _id: "", name }]);
                  setForm((f) => ({ ...f, brandId: "", brandName: name }));
                }}
                placeholder="Search brand…"
                addLabel="Add brand"
              />
            </Field>
            <Field label="Color">
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={input} placeholder="Charcoal Grey" />
            </Field>
            <Field label="Size">
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={input} placeholder="L / 42 / XL" />
            </Field>
            <Field className="sm:col-span-2 lg:col-span-3" label="Dimensions">
              <input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className={input} placeholder="65 x 65 x 115 cm" />
            </Field>
          </div>
        </Section>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button type="button" onClick={() => navigate({ to: "/inventory" })} className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
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
  label: string; value?: string; onPick: () => void; onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>; onFile: (f: File) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><Tag className="w-3 h-3" /> {label}</div>
      <button type="button" onClick={onPick} className="w-full aspect-square rounded-2xl border-2 border-dashed border-border grid place-items-center text-center overflow-hidden bg-gradient-soft hover:bg-muted transition-colors">
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
