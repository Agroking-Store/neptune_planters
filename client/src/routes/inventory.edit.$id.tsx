import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Package, Save, Image as ImageIcon, Tag, Palette, Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";
import { uploadImage, IMAGE_ACCEPT } from "@/lib/uploadImage";

export const Route = createFileRoute("/inventory/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Inventory Item — Indux" }] }),
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <AppShell><EditItem /></AppShell>,
});

function EditItem() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const productImgRef = useRef<HTMLInputElement>(null);
  const refImgRef     = useRef<HTMLInputElement>(null);
  const textureImgRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Form state ────────────────────────────────────────────────────────
  const [image, setImage]               = useState<string | undefined>();
  const [referenceImage, setRefImage]   = useState<string | undefined>();
  
  interface IVariantState {
    texture: string;
    productImage: string;
    referenceImage: string;
  }
  const [variants, setVariants] = useState<IVariantState[]>([]);
  const [globalTextures, setGlobalTextures] = useState<{name: string, url: string}[]>([]);

  const [form, setForm] = useState({
    productName: "", hsnNumber: "", description: "",
    unitPrice: 0,
  });

  const [sizes, setSizes] = useState<{ name: string; dimensions: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch product to edit on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        try {
          const settingsRes = await api.get<any>("/settings");
          if (settingsRes?.textures) {
            setGlobalTextures(settingsRes.textures);
          }
        } catch {}

        const product = await api.get<any>(`/inventory/products/${id}`);

        if (product) {
          setForm({
            productName: product.productName || "",
            hsnNumber: product.hsnNumber || "",
            description: product.description || "",
            unitPrice: product.unitPrice || 0,
          });

          if (Array.isArray(product.sizes)) {
            setSizes(product.sizes);
          } else if (product.sizes && typeof product.sizes === 'object') {
            const mappedSizes = [];
            if (product.sizes.large) mappedSizes.push({ name: 'Large', dimensions: product.sizes.large, price: 0 });
            if (product.sizes.medium) mappedSizes.push({ name: 'Medium', dimensions: product.sizes.medium, price: 0 });
            if (product.sizes.small) mappedSizes.push({ name: 'Small', dimensions: product.sizes.small, price: 0 });
            setSizes(mappedSizes);
          } else {
            setSizes([]);
          }

          // Pre-fill image fields
          if (product.productImages && Array.isArray(product.productImages)) {
            const prodImg = product.productImages.find((img: any) => img.type === "product");
            const refImg  = product.productImages.find((img: any) => img.type === "reference");
            if (prodImg) setImage(prodImg.url);
            if (refImg) setRefImage(refImg.url);
          }

          if (product.variants && Array.isArray(product.variants)) {
            setVariants(product.variants);
          }
        }
      } catch (err) {
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [id]);

  const handleFileUpload = async (f: File, setter: (s: string) => void) => {
    const toastId = toast.loading("Uploading image...");
    const url = await uploadImage(f);
    if (url) {
      setter(url);
      toast.success("Image uploaded", { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  };

  const handleVariantFile = async (idx: number, f: File, type: 'product' | 'reference') => {
    const toastId = toast.loading("Uploading variant image...");
    const url = await uploadImage(f);
    if (url) {
      setVariants(prev => {
        const newVariants = [...prev];
        if (type === 'product') {
          newVariants[idx].productImage = url;
        } else if (type === 'reference') {
          newVariants[idx].referenceImage = url;
        }
        return newVariants;
      });
      toast.success("Image uploaded", { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  };

  const addVariantSlot = () => {
    setVariants([...variants, { texture: globalTextures[0]?.name || "", productImage: "", referenceImage: "" }]);
  };

  const removeVariantSlot = (idx: number) => {
    const newVariants = [...variants];
    newVariants.splice(idx, 1);
    setVariants(newVariants);
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
      image         && { type: "product",   url: image,         publicId: "" },
      referenceImage && { type: "reference", url: referenceImage, publicId: "" },
    ].filter(Boolean);

    const payload = {
      ...form,
      unitPrice: Number(form.unitPrice),
      sizes,
      productImages,
      variants,
    };

    try {
      await api.put(`/inventory/products/${id}`, payload);
      toast.success("Product updated successfully");
      navigate({ to: "/inventory" });
    } catch (err) {
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
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors -ml-2 shrink-0" title="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Edit Inventory Item</h1>
          <p className="text-muted-foreground text-sm mt-1">Update product details across each section, then save your changes.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Product Info */}
        <Section icon={<Package className="w-5 h-5" />} title="Product Info" subtitle="The essentials: name, description and price.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product Name *">
              <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className={input} placeholder="Office Chair Executive" />
            </Field>
            <Field label="HSN Number">
              <input value={form.hsnNumber} onChange={(e) => setForm({ ...form, hsnNumber: e.target.value })} className={input} placeholder="94013000" />
            </Field>
            <Field className="sm:col-span-2" label="Product Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${input} resize-none`} placeholder="Short description shown on quotations…" />
            </Field>
          </div>
        </Section>

        {/* Media */}
        <Section icon={<ImageIcon className="w-5 h-5" />} title="Product Media" subtitle="Primary product and reference imagery.">
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <ImageDrop label="Product Image"   value={image}          onPick={() => productImgRef.current?.click()} onClear={() => setImage(undefined)}    inputRef={productImgRef} onFile={(f) => handleFileUpload(f, setImage)} />
            </div>
            <div className="w-40">
              <ImageDrop label="Reference Image" value={referenceImage} onPick={() => refImgRef.current?.click()}     onClear={() => setRefImage(undefined)}  inputRef={refImgRef}     onFile={(f) => handleFileUpload(f, setRefImage)} />
            </div>
          </div>
        </Section>

        {/* Attributes */}
        <Section icon={<Palette className="w-5 h-5" />} title="Attributes" subtitle="Visual descriptors, textures, and dimensions.">
          <div className="space-y-6">
            {/* Dynamic Dimensions */}
            <div>
              <div className="flex items-center justify-between mb-3 block">
                <div>
                  <label className="text-sm font-medium">Dimensions</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add any number of custom sizes for this product (e.g., "Large", "Extra Small").
                  </p>
                </div>
                <button type="button" onClick={() => setSizes([...sizes, { name: "", dimensions: "", price: 0 }])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add Size
                </button>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sizes.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl text-center sm:col-span-2 lg:col-span-3">No sizes added. Click 'Add Size' to begin.</div>
                ) : sizes.map((s, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-card p-4 relative group">
                    <div className="flex flex-col gap-3">
                      <Field label="Size Name">
                        <input
                          value={s.name}
                          onChange={(e) => {
                            const newSizes = [...sizes];
                            newSizes[idx].name = e.target.value;
                            setSizes(newSizes);
                          }}
                          className={input}
                          placeholder="e.g. Large, 50cm"
                        />
                      </Field>
                      <Field label="Dimensions">
                        <input
                          value={s.dimensions}
                          onChange={(e) => {
                            const newSizes = [...sizes];
                            newSizes[idx].dimensions = e.target.value;
                            setSizes(newSizes);
                          }}
                          className={input}
                          placeholder="e.g. 100x100x100"
                        />
                      </Field>
                      <Field label="Price (₹)">
                        <input
                          type="number"
                          min={0}
                          value={s.price || 0}
                          onChange={(e) => {
                            const newSizes = [...sizes];
                            newSizes[idx].price = +e.target.value || 0;
                            setSizes(newSizes);
                          }}
                          className={input}
                          placeholder="e.g. 1000"
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Variants (Textures)</label>
                <button type="button" onClick={addVariantSlot} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              </div>
              {variants.length === 0 ? (
                 <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl text-center">No variants added. Click 'Add Variant' to begin.</div>
              ) : (
                <div className="space-y-4">
                  {variants.map((v, i) => (
                    <div key={i} className="relative group p-4 border border-border rounded-xl bg-card">
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="w-56">
                          <Field label="Texture">
                            <div className="flex items-center gap-2">
                              {v.texture && globalTextures.some(gt => gt.name === v.texture) && (
                                <img 
                                  src={resolveImageUrl(globalTextures.find(gt => gt.name === v.texture)?.url)} 
                                  alt="Preview"
                                  className="w-10 h-10 rounded-lg border border-border object-cover shrink-0" 
                                />
                              )}
                              <select
                                value={v.texture}
                                onChange={(e) => {
                                  const newVariants = [...variants];
                                  newVariants[i].texture = e.target.value;
                                  setVariants(newVariants);
                                }}
                                className={input}
                              >
                                {globalTextures.length === 0 && <option value="">No global textures</option>}
                                {globalTextures.map((gt) => (
                                  <option key={gt.name} value={gt.name}>{gt.name}</option>
                                ))}
                              </select>
                            </div>
                          </Field>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="w-40">
                          <ImageDrop 
                            label={`Variant Product Img`} 
                            value={v.productImage} 
                            onPick={() => textureImgRefs.current[i * 2]?.click()} 
                            onClear={() => {
                              const newVariants = [...variants];
                              newVariants[i].productImage = "";
                              setVariants(newVariants);
                            }} 
                            inputRef={(el) => { textureImgRefs.current[i * 2] = el; }} 
                            onFile={(f) => handleVariantFile(i, f, 'product')} 
                          />
                        </div>
                        <div className="w-40">
                          <ImageDrop
                            label={`Variant Ref Img`}
                            value={v.referenceImage}
                            onPick={() => textureImgRefs.current[i * 2 + 1]?.click()}
                            onClear={() => {
                              const newVariants = [...variants];
                              newVariants[i].referenceImage = "";
                              setVariants(newVariants);
                            }}
                            inputRef={(el) => { textureImgRefs.current[i * 2 + 1] = el; }}
                            onFile={(f) => handleVariantFile(i, f, 'reference')}
                          />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeVariantSlot(i)}
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
  inputRef: React.Ref<HTMLInputElement | null>; onFile: (f: File) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><Tag className="w-3 h-3" /> {label}</div>
      <button type="button" onClick={onPick} className="w-full aspect-square rounded-2xl border-2 border-dashed border-border grid place-items-center text-center overflow-hidden bg-gradient-soft hover:bg-muted transition-colors">
        {value ? (
          <img src={resolveImageUrl(value)} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="p-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mx-auto mb-2 shadow-elegant"><Upload className="w-4 h-4" /></div>
            <div className="font-medium text-sm">Click to upload</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, HEIC up to 10MB</div>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {value && onClear && <button type="button" onClick={onClear} className="mt-2 text-xs text-destructive hover:underline">Remove</button>}
    </div>
  );
}
