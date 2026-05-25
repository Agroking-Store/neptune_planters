import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Package, Save, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/new")({
  head: () => ({ meta: [{ title: "Add Inventory Item — Indux" }] }),
  beforeLoad: () => {
    if (!store.isAuthed()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><NewItem /></AppShell>,
});

function NewItem() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | undefined>();
  const [form, setForm] = useState({
    name: "", sku: "", department: "Electronics", hsn: "", price: 0, quantity: 0, unit: "pcs",
    dimensions: "", description: "",
  });

  const onFile = (f: File) => {
    const MAX_BYTES = 500 * 1024; // 500 KB
    if (f.size > MAX_BYTES) {
      toast.error("Image must be under 500 KB — please compress it first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku) { toast.error("Name and SKU are required"); return; }
    store.addInventory({ ...form, image });
    toast.success("Item added to inventory");
    navigate({ to: "/inventory" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Add Inventory Item</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload a photo, set the basics, ship it to your catalogue.</p>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        {/* Image */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground"><ImageIcon className="w-5 h-5" /></div>
            <h2 className="font-display font-semibold text-lg">Photo</h2>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-square rounded-2xl border-2 border-dashed border-border grid place-items-center text-center overflow-hidden bg-gradient-soft hover:bg-muted transition-colors"
          >
            {image ? (
              <img src={image} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mx-auto mb-3 shadow-elegant"><Upload className="w-5 h-5" /></div>
                <div className="font-medium">Click to upload</div>
                <div className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</div>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          {image && <button type="button" onClick={() => setImage(undefined)} className="mt-3 text-xs text-destructive hover:underline">Remove photo</button>}
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground"><Package className="w-5 h-5" /></div>
            <h2 className="font-display font-semibold text-lg">Product Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product Name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Office Chair Executive" /></Field>
            <Field label="SKU *"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={input} placeholder="OFFICE-CHAIR-001" /></Field>
            <Field label="Department">
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={input}>
                {["Electronics", "Furniture", "Industrial Access", "Stationery", "Tools", "Lighting"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="HSN Code"><input value={form.hsn} onChange={(e) => setForm({ ...form, hsn: e.target.value })} className={input} placeholder="94013000" /></Field>
            <Field label="Unit Price (₹)"><input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value || 0 })} className={input} /></Field>
            <Field label="Quantity"><input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value || 0 })} className={input} /></Field>
            <Field label="Unit">
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input}>
                {["pcs", "box", "kg", "ltr", "set", "mtr"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Dimensions"><input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className={input} placeholder="65 x 65 x 115 cm" /></Field>
            <Field className="sm:col-span-2" label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={`${input} resize-none`} placeholder="Short description shown on quotations…" />
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
            <button type="button" onClick={() => navigate({ to: "/inventory" })} className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium">Cancel</button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm">
              <Save className="w-4 h-4" /> Save item
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

const input = "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
