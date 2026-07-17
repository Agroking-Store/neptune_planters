import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Package, Save, Image as ImageIcon, Tag, Palette, Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";
import imageCompression from 'browser-image-compression';

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
    size: 'large' | 'medium' | 'small';
    texture: string;
    price: number;
    productImage: string;
    referenceImage: string;
  }
  const [variants, setVariants] = useState<IVariantState[]>([]);
  const [globalTextures, setGlobalTextures] = useState<{name: string, url: string}[]>([]);

  const [form, setForm] = useState({
    productName: "", hsnNumber: "", description: "",
    unitPrice: 0,
  });

  const [sizes, setSizes] = useState<{ large: string; medium: string; small: string }>({
    large: "", medium: "", small: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch product to edit on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings defaults first
        let defaultSizes = { large: "", medium: "", small: "" };
        try {
          const settingsRes = await api.get<any>("/settings");
          if (settingsRes?.inventorySizes) {
            defaultSizes = {
              large: settingsRes.inventorySizes.large || "",
              medium: settingsRes.inventorySizes.medium || "",
              small: settingsRes.inventorySizes.small || "",
            };
          }
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

          // Handle sizes: support new object format and fallback for old array format
          if (product.sizes && typeof product.sizes === 'object' && !Array.isArray(product.sizes)) {
            setSizes({
              large: product.sizes.large || defaultSizes.large,
              medium: product.sizes.medium || defaultSizes.medium,
              small: product.sizes.small || defaultSizes.small,
            });
          } else {
            // Old array format or no sizes — use defaults
            setSizes(defaultSizes);
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

  const readFile = async (f: File, setter: (s: string) => void) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(f, options);
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to compress image");
    }
  };

  const handleVariantFile = async (idx: number, f: File, type: 'product' | 'reference') => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(f, options);
      const reader = new FileReader();
      reader.onload = () => {
        setVariants(prev => {
          const newVariants = [...prev];
          if (type === 'product') {
            newVariants[idx].productImage = reader.result as string;
          } else if (type === 'reference') {
            newVariants[idx].referenceImage = reader.result as string;
          }
          return newVariants;
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Variant image compression error:", error);
      toast.error("Failed to compress image");
    }
  };

  const addVariantSlot = () => {
    setVariants([...variants, { size: "large", texture: globalTextures[0]?.name || "", price: form.unitPrice || 0, productImage: "", referenceImage: "" }]);
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

    if (form.unitPrice <= 0) {
      toast.error("Product price must be greater than 0");
      return;
    }
  
    if (isNaN(form.unitPrice) || form.unitPrice === null) {
      toast.error("Please enter a valid price");
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
        {/* Media */}
        <Section icon={<ImageIcon className="w-5 h-5" />} title="Product Media" subtitle="Primary product and reference imagery.">
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <ImageDrop label="Product Image"   value={image}          onPick={() => productImgRef.current?.click()} onClear={() => setImage(undefined)}    inputRef={productImgRef} onFile={(f) => readFile(f, setImage)} />
            </div>
            <div className="w-40">
              <ImageDrop label="Reference Image" value={referenceImage} onPick={() => refImgRef.current?.click()}     onClear={() => setRefImage(undefined)}  inputRef={refImgRef}     onFile={(f) => readFile(f, setRefImage)} />
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
            {/* Fixed Three Dimensions */}
            <div>
              <label className="text-sm font-medium mb-3 block">Dimensions</label>
              <p className="text-xs text-muted-foreground mb-4">
                Default values are loaded from global settings. Override per product if needed.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-600/25 grid place-items-center shrink-0">
                      <span className="text-xs font-bold text-emerald-600">L</span>
                    </div>
                    <span className="text-sm font-semibold">Large</span>
                  </div>
                  <input
                    value={sizes.large}
                    onChange={(e) => setSizes({ ...sizes, large: e.target.value })}
                    className={input}
                    placeholder="e.g. 100x100x100"
                  />
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/25 grid place-items-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">M</span>
                    </div>
                    <span className="text-sm font-semibold">Medium</span>
                  </div>
                  <input
                    value={sizes.medium}
                    onChange={(e) => setSizes({ ...sizes, medium: e.target.value })}
                    className={input}
                    placeholder="e.g. 65x65x65"
                  />
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/15 to-amber-600/25 grid place-items-center shrink-0">
                      <span className="text-xs font-bold text-amber-600">S</span>
                    </div>
                    <span className="text-sm font-semibold">Small</span>
                  </div>
                  <input
                    value={sizes.small}
                    onChange={(e) => setSizes({ ...sizes, small: e.target.value })}
                    className={input}
                    placeholder="e.g. 30x30x30"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Variants (Size + Texture)</label>
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
                        <div className="w-32">
                          <Field label="Size">
                            <select
                              value={v.size}
                              onChange={(e) => {
                                const newVariants = [...variants];
                                newVariants[i].size = e.target.value as any;
                                setVariants(newVariants);
                              }}
                              className={input}
                            >
                              <option value="large">Large</option>
                              <option value="medium">Medium</option>
                              <option value="small">Small</option>
                            </select>
                          </Field>
                        </div>
                        <div className="w-56">
                          <Field label="Texture">
                            <div className="flex items-center gap-2">
                              {v.texture && globalTextures.some(gt => gt.name === v.texture) && (
                                <img 
                                  src={globalTextures.find(gt => gt.name === v.texture)?.url} 
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
                        <div className="w-32">
                          <Field label="Price (₹)">
                            <input
                              type="number"
                              min={0}
                              value={v.price}
                              onChange={(e) => {
                                const newVariants = [...variants];
                                newVariants[i].price = +e.target.value || 0;
                                setVariants(newVariants);
                              }}
                              className={input}
                            />
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
