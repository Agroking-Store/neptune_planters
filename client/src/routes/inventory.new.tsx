import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Package, Save, Image as ImageIcon, Tag, Palette, Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/inventory/new")({
  head: () => ({ meta: [{ title: "Add Inventory Item — Indux" }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><NewItem /></AppShell>,
});

function NewItem() {
  const navigate = useNavigate();
  const productImgRef = useRef<HTMLInputElement>(null);
  const refImgRef = useRef<HTMLInputElement>(null);
  const textureImgRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Form state ────────────────────────────────────────────────────────
  const [image, setImage] = useState<string | undefined>();
  const [referenceImage, setRefImage] = useState<string | undefined>();
  const [textureImages, setTextureImages] = useState<{ url: string, linkedUrl: string, linkedReferenceUrl: string }[]>([]);

  const [form, setForm] = useState({
    productName: "", hsnNumber: "", description: "",
    unitPrice: 0,
  });

  const [sizes, setSizes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const readFile = (f: File, setter: (s: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleTextureFile = (idx: number, f: File, type: 'texture' | 'product' | 'reference' = 'texture') => {
    const reader = new FileReader();
    reader.onload = () => {
      const newTextures = [...textureImages];
      if (type === 'product') {
        newTextures[idx].linkedUrl = reader.result as string;
      } else if (type === 'reference') {
        newTextures[idx].linkedReferenceUrl = reader.result as string;
      } else {
        newTextures[idx].url = reader.result as string;
      }
      setTextureImages(newTextures);
    };
    reader.readAsDataURL(f);
  };

  const addTextureSlot = () => {
    setTextureImages([...textureImages, { url: "", linkedUrl: "", linkedReferenceUrl: "" }]);
  };

  const removeTextureSlot = (idx: number) => {
    const newTextures = [...textureImages];
    newTextures.splice(idx, 1);
    setTextureImages(newTextures);
  };

  const addSizeSlot = () => {
    setSizes([...sizes, ""]);
  };

  const updateSize = (idx: number, val: string) => {
    const newSizes = [...sizes];
    newSizes[idx] = val;
    setSizes(newSizes);
  };

  const removeSizeSlot = (idx: number) => {
    const newSizes = [...sizes];
    newSizes.splice(idx, 1);
    setSizes(newSizes);
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    setSubmitting(true);

    // Build images array
    const productImages = [
      image && { type: "product", url: image, publicId: "" },
      referenceImage && { type: "reference", url: referenceImage, publicId: "" },
      ...textureImages.filter(t => t.url).map(t => ({ type: "texture", url: t.url, publicId: "", linkedUrl: t.linkedUrl, linkedReferenceUrl: t.linkedReferenceUrl }))
    ].filter(Boolean);

    const payload = {
      ...form,
      sizes: sizes.filter(s => s.trim() !== ""),
      productImages,
    };

    try {
      await api.post("/inventory/products", payload);
      toast.success("Product added to inventory");
      navigate({ to: "/inventory" });
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save product. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors -ml-2 shrink-0" title="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Add Inventory Item</h1>
          <p className="text-muted-foreground text-sm mt-1">Fill in product details across each section, then save it to your catalogue.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Media */}
        <Section icon={<ImageIcon className="w-5 h-5" />} title="Product Media" subtitle="Primary product and reference imagery.">
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <ImageDrop label="Product Image" value={image} onPick={() => productImgRef.current?.click()} onClear={() => setImage(undefined)} inputRef={productImgRef} onFile={(f) => readFile(f, setImage)} />
            </div>
            <div className="w-40">
              <ImageDrop label="Reference Image" value={referenceImage} onPick={() => refImgRef.current?.click()} onClear={() => setRefImage(undefined)} inputRef={refImgRef} onFile={(f) => readFile(f, setRefImage)} />
            </div>
          </div>
        </Section>

        {/* Product Info */}
        <Section icon={<Package className="w-5 h-5" />} title="Product Info" subtitle="The essentials: name, description and price.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Product Name *">
              <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className={input} placeholder="Office Chair Executive" />
            </Field>
            <Field label="Product Price (₹) *">
              <input type="number" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value || 0 })} className={input} />
            </Field>
            <Field label="HSN Number">
              <input value={form.hsnNumber} onChange={(e) => setForm({ ...form, hsnNumber: e.target.value })} className={input} placeholder="94013000" />
            </Field>
            <Field className="sm:col-span-2 lg:col-span-3" label="Product Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${input} resize-none`} placeholder="Short description shown on quotations…" />
            </Field>
          </div>
        </Section>

        {/* Attributes */}
        <Section icon={<Palette className="w-5 h-5" />} title="Attributes" subtitle="Visual descriptors, textures, and dimensions.">
          <div className="space-y-6">
            {/* Multiple Dimensions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Dimensions</label>
                <button type="button" onClick={addSizeSlot} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Dimension
                </button>
              </div>
              {sizes.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl text-center">No dimensions added. Click 'Add Dimension' to begin.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-xl px-2 py-1.5">
                      <input
                        value={s}
                        onChange={(e) => updateSize(i, e.target.value)}
                        className="bg-transparent text-sm w-32 focus:outline-none placeholder:text-muted-foreground/50"
                        placeholder="65x65x65"
                      />
                      <button type="button" onClick={() => removeSizeSlot(i)} className="p-1 rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Unlimited Textures */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Texture Photos</label>
                <button type="button" onClick={addTextureSlot} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Texture
                </button>
              </div>
              {textureImages.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl text-center">No texture slots added. Click 'Add Texture' to begin.</div>
              ) : (
                <div className="space-y-4">
                  {textureImages.map((img, i) => (
                    <div key={i} className="relative group p-4 border border-border rounded-xl bg-card">
                      <div className="flex flex-wrap gap-4">
                        <div className="w-40">
                          <ImageDrop
                            label={`Texture Image ${i + 1}`}
                            value={img.url}
                            onPick={() => textureImgRefs.current[i * 3]?.click()}
                            onClear={() => {
                              const newTextures = [...textureImages];
                              newTextures[i].url = "";
                              setTextureImages(newTextures);
                            }}
                            inputRef={(el) => { textureImgRefs.current[i * 3] = el; }}
                            onFile={(f) => handleTextureFile(i, f, 'texture')}
                          />
                        </div>
                        <div className="w-40">
                          <ImageDrop
                            label={`Product Img for Texture ${i + 1}`}
                            value={img.linkedUrl}
                            onPick={() => textureImgRefs.current[i * 3 + 1]?.click()}
                            onClear={() => {
                              const newTextures = [...textureImages];
                              newTextures[i].linkedUrl = "";
                              setTextureImages(newTextures);
                            }}
                            inputRef={(el) => { textureImgRefs.current[i * 3 + 1] = el; }}
                            onFile={(f) => handleTextureFile(i, f, 'product')}
                          />
                        </div>
                        <div className="w-40">
                          <ImageDrop
                            label={`Ref Img for Texture ${i + 1}`}
                            value={img.linkedReferenceUrl}
                            onPick={() => textureImgRefs.current[i * 3 + 2]?.click()}
                            onClear={() => {
                              const newTextures = [...textureImages];
                              newTextures[i].linkedReferenceUrl = "";
                              setTextureImages(newTextures);
                            }}
                            inputRef={(el) => { textureImgRefs.current[i * 3 + 2] = el; }}
                            onFile={(f) => handleTextureFile(i, f, 'reference')}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTextureSlot(i)}
                        className="absolute top-2 right-2 px-2 py-1 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      >
                        Remove Slot
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save item</>}
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
  inputRef: React.Ref<HTMLInputElement | null>; onFile: (f: File) => void;
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
      {value && onClear && <button type="button" onClick={onClear} className="mt-2 text-xs text-destructive hover:underline">Remove</button>}
    </div>
  );
}
