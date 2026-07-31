import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Calculator,
  User,
  StickyNote,
  ListChecks,
  Search,
  X,
  Loader2,
  Check,
  ChevronDown,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/store";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { downloadQuotationPDF } from "@/lib/pdf";

export const Route = createFileRoute("/quotations/new")({
  head: () => ({ meta: [{ title: "New Quotation — Indux" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      copyFrom: search.copyFrom as string | undefined,
    };
  },
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => (
    <AppShell>
      <NewQuotation />
    </AppShell>
  ),
});

// ── API type for customer ──────────────────────────────────────────────
interface CustomerRecord {
  _id: string;
  customerCode: string;
  customerName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  gstNumber?: string;
}

// ── API type for product (from inventory) ─────────────────────────────
interface ProductRecord {
  _id: string;
  productId: string;
  productName: string;
  hsnNumber?: string;
  unitPrice: number;
  size?: string;
  description?: string;
  sizes?: any;
  productImages?: { type: string; url: string; linkedUrl?: string; linkedReferenceUrl?: string; name?: string }[];
  variants?: { size: string; texture: string; price: number; productImage: string; referenceImage: string }[];
}

// ── Local quotation item shape ────────────────────────────────────────
interface QuotationItemLocal {
  id: string; // Unique frontend identifier
  productId: string; // MongoDB _id
  name: string;
  hsnNumber: string;
  description: string;
  quantity: number;
  price: number;
  discountPercent: number;
  selectedSize: string;
  selectedTexture: string;
  availableSizes: { name: string; price: number }[];
  availableTextures: { url: string; name: string }[];
  image?: string;
}

function NewQuotation() {
  const navigate = useNavigate();
  const { copyFrom } = Route.useSearch();

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

  const [globalTextures, setGlobalTextures] = useState<{name: string, url: string}[]>([]);

  const fetchSettings = async () => {
    try {
      const res = await api.get<any>("/settings");
      if (res?.textures) {
        setGlobalTextures(res.textures);
      }
    } catch (err) {
      console.error("[Quotation] Failed to load settings:", err);
    }
  };

  useEffect(() => {
    void fetchProducts();
    void fetchSettings();
  }, []);

  // ── Form state ──────────────────────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", gstNumber: "" });
  const [terms, setTerms] = useState<string[]>([
    "100% secure payment",
    "No warranty",
  ]);
  const [newTerm, setNewTerm] = useState("");
  const [items, setItems] = useState<QuotationItemLocal[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pickQ, setPickQ] = useState("");
  const [followUp, setFollowUp] = useState<string>("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const [initialLoading, setInitialLoading] = useState(!!copyFrom);

  const [defaultValues, setDefaultValues] = useState({
    validTill: { days: 0, months: 1 },
    advancePayment: 50,
    deliveryTime: 12,
    transportationCharges: 0,
  });

  // Load existing quotation data if copyFrom is provided
  useEffect(() => {
    if (!copyFrom) return;
    const loadCopy = async () => {
      try {
        const data = await api.get<any>(`/quotations/${copyFrom}`);
        if (data) {
          setSelectedCustomerId(data.customerId);
          setSelectedCustomerName(data.customerSnapshot?.customerName || "");
          setCustomer({
            name: data.customerSnapshot?.customerName || "",
            email: data.customerSnapshot?.email || "",
            phone: data.customerSnapshot?.phoneNumber || "",
            gstNumber: data.customerSnapshot?.gstNumber || "",
          });
          setTerms(data.termsAndConditions || []);
          setDefaultValues({
            validTill: data.validTill || "",
            advancePayment: data.advancePayment || "",
            deliveryTime: data.deliveryTime || "",
            transportationCharges: data.transportationCharges || "0",
          });
          if (data.followUpDate) {
            setFollowUp(
              new Date(data.followUpDate).toISOString().split("T")[0],
            );
          }
          setItems(
            (data.items || []).map((it: any) => {
              let availableSizes: {name: string, price: number}[] = [];
              if (it.productSnapshot?.sizes) {
                if (Array.isArray(it.productSnapshot.sizes)) {
                  availableSizes = it.productSnapshot.sizes.map((s: any) => ({ name: s.name, price: s.price || 0 }));
                } else if (typeof it.productSnapshot.sizes === 'object') {
                  availableSizes = Object.keys(it.productSnapshot.sizes).filter(k => (it.productSnapshot.sizes as any)[k]).map(k => ({ name: k, price: 0 }));
                }
              }
              return {
                id: crypto.randomUUID(),
                productId: it.productId,
                name: it.productSnapshot?.productName || "",
                hsnNumber: it.productSnapshot?.hsnNumber || "",
                description: it.productSnapshot?.description || "",
                quantity: it.quantity || 1,
                price: it.unitPrice || 0,
                discountPercent: it.discountPercent || 0,
                selectedSize: it.selectedSize || "",
                selectedTexture: it.selectedTexture || "",
                availableSizes: availableSizes,
                availableTextures: [],
              };
            }),
          );
        }
      } catch (err) {
        console.error("Failed to load quotation for copying", err);
        toast.error("Failed to load quotation for copying");
      } finally {
        setInitialLoading(false);
      }
    };
    loadCopy();
  }, [copyFrom]);

  // ── Add Customer Dialog state ──────────────────────────────────────
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  // Settings Dialog State (Removed)
  const [dialogPrefillName, setDialogPrefillName] = useState("");

  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);

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
    let subtotal = 0;
    let totalDiscount = 0;

    items.forEach((it) => {
      const lineSubtotal = it.quantity * it.price;
      const discount = lineSubtotal * ((it.discountPercent || 0) / 100);
      subtotal += lineSubtotal;
      totalDiscount += discount;
    });

    const transportation = defaultValues.transportationCharges || 0;
    const transportationTax = transportation * 0.18;
    const transportationWithTax = transportation + transportationTax;

    const grand = subtotal - totalDiscount + transportationWithTax;
    const discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

    return {
      grand: Math.max(0, grand),
      subtotal,
      totalDiscount,
      discountPercent,
      transportationWithTax
    };
  }, [items, defaultValues.transportationCharges]);

  const addItem = (id: string) => {
    const found = products.find((i) => i._id === id);
    if (!found) return;
    const img =
      found.productImages?.find((i) => i.type === "product")?.url ||
      found.productImages?.[0]?.url;
    
    // Default available sizes
    let sizes: { name: string; price: number }[] = [];
    if (Array.isArray(found.sizes)) {
      sizes = found.sizes.map(s => ({ name: s.name, price: s.price || 0 }));
    } else if (found.sizes && typeof found.sizes === 'object') {
      sizes = Object.keys(found.sizes).filter(k => (found.sizes as any)[k]).map(k => ({ name: k, price: 0 }));
    }
    
    // Show all global textures
    let textures = globalTextures.map(gt => ({ url: gt.url || "", name: gt.name }));
    if (textures.length === 0) {
      textures = found.productImages
          ?.filter((i) => i.type === "texture")
          .map((i) => ({ url: i.url, name: i.name || "" })) || [];
    }
    
    const selectedSize = sizes[0]?.name || "";
    const selectedTexture = textures[0]?.name || textures[0]?.url || img || "";
    let price = sizes[0]?.price || 0;
    let selectedImage = img;

    if (found.variants && found.variants.length > 0) {
      const variant = found.variants.find(v => v.texture === selectedTexture);
      if (variant) {
        selectedImage = variant.productImage || img;
      }
    }

    setItems((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        productId: id,
        name: found.productName,
        hsnNumber: found.hsnNumber || "",
        description: found.description || "",
        quantity: 1,
        price: price,
        discountPercent: 0,
        selectedSize: selectedSize,
        selectedTexture: selectedTexture,
        availableSizes: sizes,
        availableTextures: textures,
        image: selectedImage,
      },
    ]);
    setPickerOpen(false);
    setPickQ("");
  };

  const updateItem = (id: string, patch: Partial<QuotationItemLocal>) => {
    setItems((p) => p.map((it) => {
      if (it.id !== id) return it;
      const updatedIt = { ...it, ...patch };
      
      if (patch.selectedSize !== undefined) {
        const product = products.find(pr => pr._id === updatedIt.productId);
        if (product) {
          let sizes: { name: string; price: number }[] = [];
          if (Array.isArray(product.sizes)) {
            sizes = product.sizes.map(s => ({ name: s.name, price: s.price || 0 }));
          } else if (product.sizes && typeof product.sizes === 'object') {
            sizes = Object.keys(product.sizes).filter(k => (product.sizes as any)[k]).map(k => ({ name: k, price: 0 }));
          }
          const sizeObj = sizes.find(s => s.name === patch.selectedSize);
          if (sizeObj) {
            updatedIt.price = sizeObj.price;
          }
        }
      }

      if (patch.selectedTexture !== undefined) {
        const product = products.find(pr => pr._id === updatedIt.productId);
        if (product) {
          const fallbackImg = product.productImages?.find((i: any) => i.type === "product")?.url || product.productImages?.[0]?.url || "";
          if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => v.texture === updatedIt.selectedTexture);
            if (variant) {
              updatedIt.image = variant.productImage || fallbackImg;
            } else {
              updatedIt.image = fallbackImg;
            }
          } else {
             updatedIt.image = fallbackImg;
          }
        }
      }
      return updatedIt;
    }));
  };
  const removeItem = (id: string) =>
    setItems((p) => p.filter((it) => it.id !== id));

  const addTerm = () => {
    if (!newTerm.trim()) return;
    setTerms((p) => [...p, newTerm.trim()]);
    setNewTerm("");
  };

  const save = async (alsoDownload = false) => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!items.length) {
      toast.error("Add at least one item");
      return;
    }

    const payload = {
      customerId: selectedCustomerId,
      followUpDate: followUp || "",
      status: "Draft" as const,
      termsAndConditions: terms,
      validTill: defaultValues.validTill,
      advancePayment: defaultValues.advancePayment,
      deliveryTime: defaultValues.deliveryTime,
      transportationCharges: defaultValues.transportationCharges,
      totalAmount: totals.grand,
      totalDiscount: totals.totalDiscount,
      items: items.map((it) => {
        const p = products.find((pr) => pr._id === it.productId);
        const productImage =
          it.image ||
          p?.productImages?.find((i) => i.type === "product")?.url ||
          p?.productImages?.[0]?.url;
        let availableSizes: string[] = [];
        if (Array.isArray(p?.sizes)) {
          availableSizes = p.sizes.map((s: any) => s.name);
        } else if (p?.sizes && typeof p.sizes === 'object') {
          availableSizes = Object.keys(p.sizes).filter(k => (p.sizes as any)[k]);
        }
        const availableTextures = it.availableTextures?.length
          ? it.availableTextures
          : p?.productImages
            ?.filter((i) => i.type === "texture")
            .map((i) => ({ url: i.url, name: i.name || "" })) || [];
        return {
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.price,
          discountPercent: it.discountPercent || 0,
          selectedSize: it.selectedSize || availableSizes[0] || "",
          selectedTexture:
            it.selectedTexture || availableTextures[0]?.url || productImage || "",
          total: Math.round(it.quantity * it.price * 100) / 100,
        };
      }),
    };

    setSaving(true);
    try {
      const created = await api.post<any>("/quotations", payload);
      toast.success(
        `Quotation ${created?.quotationId || ""} created successfully`,
      );

      if (alsoDownload && created) {
        try {
          const mappedForPdf = {
            id: created._id || "",
            number: created.quotationId || "QUO-0000",
            customerName: created.customerSnapshot?.customerName || "",
            customerEmail: created.customerSnapshot?.email || "",
            customerPhone: created.customerSnapshot?.phoneNumber || "",
            companyName: created.customerSnapshot?.companyName || "",
            gstNumber: created.customerSnapshot?.gstNumber || "",
            address: created.address || "",
            terms: created.termsAndConditions || [],
            items: (created.items || []).map((it: any) => ({
              itemId: it.productId,
              name: it.productSnapshot?.productName || "",
              quantity: it.quantity,
              price: it.unitPrice,
              selectedSize: it.selectedSize,
              selectedTexture: it.selectedTexture,
            })),
            status: created.status || "Draft",
            followUpDate: created.followUpDate
              ? new Date(created.followUpDate).toISOString().split("T")[0]
              : undefined,
            createdAt: created.createdAt || new Date().toISOString(),
          };
          setIsDownloadingPdf(true);
          await downloadQuotationPDF(mappedForPdf);
          toast.success("PDF downloaded successfully");
        } catch (pdfErr) {
          console.error("[Quotation] PDF download failed:", pdfErr);
          toast.error(
            "Failed to generate PDF. You can download it from the dashboard.",
          );
        } finally {
          setIsDownloadingPdf(false);
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

  // ── When a customer is selected from the dropdown ───────────────────
  const onCustomerSelected = (id: string, label: string) => {
    setSelectedCustomerId(id);
    setSelectedCustomerName(label);
    const c = customers.find((cu) => cu._id === id);
    if (c) {
      setCustomer({
        name: c.customerName,
        email: c.email || "",
        phone: c.phoneNumber || "",
        gstNumber: c.gstNumber || "",
      });
    }
  };

  // ── When "Add new" is clicked in the SearchableSelect dropdown ──────
  const onAddNewCustomer = (name: string) => {
    setDialogPrefillName(name);
    setShowCustomerDialog(true);
  };

  const onCustomerCreated = (c: CustomerRecord) => {
    // Add to local customer list so the dropdown reflects it immediately
    setCustomers((prev) => [c, ...prev]);
    setSelectedCustomerId(c._id);
    setSelectedCustomerName(c.customerName);
    setCustomer({
      name: c.customerName,
      email: c.email || "",
      phone: c.phoneNumber || "",
      gstNumber: c.gstNumber || "",
    });
    setShowCustomerDialog(false);
    setDialogPrefillName("");
  };

  const handleDeleteCustomer = async (id: string, _label: string) => {
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter(c => c._id !== id));
      toast.success("Customer deleted");
      if (selectedCustomerId === id) {
        setSelectedCustomerId("");
        setSelectedCustomerName("");
        setCustomer({ name: "", email: "", phone: "", gstNumber: "" });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete customer");
      }
    }
  };

  const handleEditCustomer = (customer: CustomerRecord) => {
    setEditingCustomer(customer);
    setShowEditCustomerDialog(true);
  };

  const handleUpdateCustomer = async (updatedCustomer: CustomerRecord) => {
    try {
      // Refresh customer list
      await fetchCustomers();
      // Update selected customer if it's the same
      if (selectedCustomerId === updatedCustomer._id) {
        setSelectedCustomerName(updatedCustomer.customerName);
        setCustomer({
          name: updatedCustomer.customerName,
          email: updatedCustomer.email || "",
          phone: updatedCustomer.phoneNumber || "",
          gstNumber: updatedCustomer.gstNumber || "",
        });
      }
      setShowEditCustomerDialog(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Error refreshing customers:", err);
    }
  };

  const pickerResults = products.filter(
    (i) => !pickQ || i.productName.toLowerCase().includes(pickQ.toLowerCase()),
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">
          Loading quotation...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors -ml-2 shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold">
              New Quotation
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Build a polished quote in minutes — pick items, set taxes, export
              PDF.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">

          <button
            onClick={() => save(false)}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" />{" "}
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || isDownloadingPdf}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm transition-all overflow-hidden ${saving || isDownloadingPdf ? "cursor-not-allowed opacity-90" : ""}`}
          >
            {isDownloadingPdf ? (
              <>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                <span className="relative z-10">Crafting PDF...</span>
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 transition-transform group-hover:scale-110" /> Generate & download
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Section
            icon={<User className="w-5 h-5" />}
            title="Customer Details"
            right={
              <button
                onClick={() => {
                  setDialogPrefillName("");
                  setShowCustomerDialog(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant hover:opacity-95"
              >
                <Plus className="w-4 h-4" /> Add Customer
              </button>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Select Customer *">
                  <SearchableSelect
                    value={selectedCustomerName}
                    options={customers.map((c) => ({
                      id: c._id,
                      label: c.customerName,
                      data: c,
                    }))}
                    onChange={onCustomerSelected}
                    onAdd={onAddNewCustomer}
                    onEdit={handleEditCustomer}
                    onDelete={handleDeleteCustomer}
                    placeholder={
                      customersLoading ? "Loading customers…" : "Search customer…"
                    }
                    addLabel="Add customer"
                    disabled={customersLoading}
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={customer.email}
                    readOnly
                    disabled
                    className={`${input} bg-muted/50 cursor-not-allowed`}
                    placeholder="Select a customer first"
                  />
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Mobile Number">
                  <input
                    value={customer.phone}
                    readOnly
                    disabled
                    className={`${input} bg-muted/50 cursor-not-allowed`}
                    placeholder="Select a customer first"
                  />
                </Field>
                <Field label="GST No.">
                  <input
                    value={customer.gstNumber}
                    readOnly
                    disabled
                    className={`${input} bg-muted/50 cursor-not-allowed`}
                    placeholder="Select a customer first"
                  />
                </Field>
                <Field label="Follow-up Date">
                  <input
                    type="date"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    className={input}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Order Details */}
          <Section icon={<ListChecks className="w-5 h-5" />} title="Order Details" subtitle="Quotation conditions and logistics">
            <div className="flex flex-col lg:flex-row gap-4">

              <div className="flex-1 lg:flex-[1.4]">
                <Field label="Valid Till">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                      <input
                        type="number"
                        min={0}
                        value={defaultValues.validTill.days}
                        onChange={(e) => setDefaultValues({ ...defaultValues, validTill: { ...defaultValues.validTill, days: Number(e.target.value) } })}
                        className={`${input} pl-3 pr-11 font-medium`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-medium text-muted-foreground group-focus-within:text-primary transition-colors">
                        Days
                      </div>
                    </div>
                    <div className="relative flex-1 group">
                      <input
                        type="number"
                        min={0}
                        value={defaultValues.validTill.months}
                        onChange={(e) => setDefaultValues({ ...defaultValues, validTill: { ...defaultValues.validTill, months: Number(e.target.value) } })}
                        className={`${input} pl-3 pr-14 font-medium`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-medium text-muted-foreground group-focus-within:text-primary transition-colors">
                        Months
                      </div>
                    </div>
                  </div>
                </Field>
              </div>

              <div className="flex-1 lg:flex-[0.8]">
                <Field label="Advance Payment">
                  <div className="relative group">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={defaultValues.advancePayment}
                      onChange={(e) => setDefaultValues({ ...defaultValues, advancePayment: Number(e.target.value) })}
                      className={`${input} pl-3 pr-8 font-medium`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">
                      %
                    </div>
                  </div>
                </Field>
              </div>

              <div className="flex-1 lg:flex-[0.8]">
                <Field label="Delivery Time">
                  <div className="relative group">
                    <input
                      type="number"
                      min={0}
                      value={defaultValues.deliveryTime}
                      onChange={(e) => setDefaultValues({ ...defaultValues, deliveryTime: Number(e.target.value) })}
                      className={`${input} pl-3 pr-11 font-medium`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-medium text-muted-foreground group-focus-within:text-primary transition-colors">
                      Days
                    </div>
                  </div>
                </Field>
              </div>

              <div className="flex-1 lg:flex-[1.2]">
                <Field label="Transportation Charges">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground font-medium group-focus-within:text-primary transition-colors">
                      ₹
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={defaultValues.transportationCharges}
                      onChange={(e) => setDefaultValues({ ...defaultValues, transportationCharges: Number(e.target.value) })}
                      className={`${input} pl-8 font-medium`}
                      placeholder="0"
                    />
                  </div>
                </Field>
              </div>

            </div>
          </Section>

          {/* Items */}
          <Section
            icon={<ListChecks className="w-5 h-5" />}
            title="Items"
            right={
              <div ref={pickerRef} className="relative">
                <button
                  onClick={() => setPickerOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
                {pickerOpen && (
                  <div className="absolute right-0 mt-2 w-[min(92vw,420px)] rounded-2xl border border-border bg-popover shadow-elegant p-3 z-20">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={pickQ}
                        onChange={(e) => setPickQ(e.target.value)}
                        placeholder="Search inventory..."
                        className={`${input} pl-10`}
                      />
                    </div>
                    <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-border">
                      {productsLoading && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin inline mr-1" />{" "}
                          Loading products…
                        </div>
                      )}
                      {!productsLoading &&
                        pickerResults.map((it) => {
                          const img =
                            it.productImages?.find((i) => i.type === "product")
                              ?.url || it.productImages?.[0]?.url;
                          const sizesArray = Array.isArray(it.sizes) ? it.sizes : (it.sizes ? Object.values(it.sizes).filter(Boolean) : []);
                          const allSizes =
                            sizesArray.length > 0
                              ? sizesArray.slice(0, 2).map((s: any) => typeof s === "object" ? (s.name?.trim() || "") : (typeof s === 'string' ? s.trim() : s)).join(", ")
                              : "";
                          const moreSizes =
                            sizesArray.length > 2
                              ? `+${sizesArray.length - 2}`
                              : "";
                          const prices = sizesArray.map((s: any) => typeof s === "object" ? (Number(s.price) || 0) : 0);
                          let priceDisplay = formatINR(it.unitPrice);
                          if (prices.length > 0) {
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            priceDisplay = minPrice === maxPrice ? formatINR(minPrice) : `${formatINR(minPrice)} - ${formatINR(maxPrice)}`;
                          }
                          const textureCount =
                            it.productImages?.filter(
                              (i) => i.type === "texture",
                            ).length || 0;

                          return (
                            <button
                              key={it._id}
                              onClick={() => addItem(it._id)}
                              className="w-full p-3 hover:bg-muted rounded-lg text-left transition-all border-b border-border last:border-0 group relative"
                            >
                              <div className="flex items-start gap-3">
                                {/* Left: Image */}
                                <div className="w-14 h-14 rounded-lg bg-accent overflow-hidden grid place-items-center shrink-0 border border-border/50">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-accent-foreground uppercase">
                                      {it.productName.slice(0, 2)}
                                    </span>
                                  )}
                                </div>

                                {/* Right: Info */}
                                <div className="flex-1 min-w-0 py-0.5">
                                  <div className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                                    {it.productName}
                                  </div>
                                  <div className="font-bold text-[13px] text-primary mt-1">
                                    {priceDisplay}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {allSizes && (
                                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md border border-border/50">
                                        📏 {allSizes} {moreSizes}
                                      </span>
                                    )}
                                    {textureCount > 0 && (
                                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md border border-border/50">
                                        🎨 {textureCount} texture{textureCount !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                    {it.hsnNumber && (
                                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md border border-border/50">
                                        HSN: {it.hsnNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Description on hover */}
                              {it.description && (
                                <div className="absolute left-0 right-0 top-full mt-1 hidden group-hover:block bg-popover border border-border rounded-lg p-2 text-xs text-muted-foreground z-50 shadow-lg">
                                  📝 {it.description}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      {!productsLoading && !pickerResults.length && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No items.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
          >
            {items.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
                No items yet — click{" "}
                <span className="font-medium text-foreground">Add Item</span> to
                pick from your inventory.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const p = products.find((pr) => pr._id === it.productId);
                  let availableSizes = it.availableSizes?.length ? it.availableSizes : [];
                  if (availableSizes.length === 0 && p) {
                    if (Array.isArray(p.sizes)) {
                      availableSizes = p.sizes.map(s => ({ name: s.name, price: s.price || 0 }));
                    } else if (p.sizes && typeof p.sizes === 'object') {
                      availableSizes = Object.keys(p.sizes).filter(k => (p.sizes as any)[k]).map(k => ({ name: k, price: 0 }));
                    }
                  }
                  let availableTextures = it.availableTextures?.length ? it.availableTextures : [];
                  if (availableTextures.length === 0) {
                    availableTextures = globalTextures.map(gt => ({ url: gt.url || "", name: gt.name }));
                    if (availableTextures.length === 0 && p) {
                      availableTextures = p.productImages?.filter((i: any) => i.type === "texture").map((i: any) => ({ url: i.url, name: i.name || "" })) || [];
                    }
                  }
                  const currentTexture = it.selectedTexture || availableTextures[0]?.name || availableTextures[0]?.url || "";

                  const productImage = it.image || p?.productImages?.find((i: any) => i.type === "product")?.url || p?.productImages?.[0]?.url;

                  const productDescription =
                    it.description || p?.description || "";
                  return (
                    <div
                      key={it.id}
                      className="rounded-xl border border-border p-4"
                    >
                      {/* Row 1: Name and Remove button */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden grid place-items-center shrink-0">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">
                                {it.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {it.name}
                            </div>
                            {it.hsnNumber && (
                              <div className="text-[10px] text-muted-foreground">
                                HSN: {it.hsnNumber}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(it.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Row 2: Quantity, Price, Size, Texture - Left/Right layout */}
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-20">
                            <label className="text-[10px] text-muted-foreground">
                              Qty
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) =>
                                updateItem(it.id, {
                                  quantity: Math.max(1, +e.target.value || 1),
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-border text-sm"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] text-muted-foreground">
                              Price
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={it.price}
                              onChange={(e) =>
                                updateItem(it.id, {
                                  price: Math.max(0, +e.target.value || 0),
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-border text-sm"
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[10px] text-muted-foreground">
                              Disc. %
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={it.discountPercent}
                              onChange={(e) =>
                                updateItem(it.id, {
                                  discountPercent: Math.min(100, Math.max(0, +e.target.value || 0)),
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-border text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {availableSizes.length > 0 && (
                            <div className="w-28">
                              <label className="text-[10px] text-muted-foreground">
                                Size
                              </label>
                              <select
                                value={it.selectedSize}
                                onChange={(e) =>
                                  updateItem(it.id, {
                                    selectedSize: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 rounded border border-border text-sm"
                              >
                                {availableSizes.map((sz) => (
                                  <option key={sz.name} value={sz.name}>
                                    {sz.name.charAt(0).toUpperCase() + sz.name.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {availableTextures.length > 0 && (
                            <div className="w-16">
                              <label className="text-[10px] text-muted-foreground">
                                Texture
                              </label>
                              <TextureDropdown
                                textures={availableTextures}
                                value={currentTexture}
                                onChange={(val) =>
                                  updateItem(it.id, { selectedTexture: val })
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground">
                            Total
                          </div>
                          <div className="font-bold text-sm text-primary">
                            {formatINR(it.quantity * it.price * (1 - (it.discountPercent || 0) / 100))}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Description if exists */}
                      {productDescription && (
                        <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
                          📝 {productDescription}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          {/* Terms */}
          <Section title="Terms & Conditions">
            <div className="space-y-2">
              {terms.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm flex-1">{t}</span>
                  <button
                    onClick={() => setTerms((p) => p.filter((_, j) => j !== i))}
                    className="text-destructive p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTerm())
                  }
                  placeholder="Add new term..."
                  className={input}
                />
                <button
                  onClick={addTerm}
                  className="px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </Section>

          {/* Totals */}
          <Section title="Summary">
            <dl className="text-sm space-y-2">
              <Row
                label={<span className="text-muted-foreground">Subtotal</span>}
                value={
                  <span className="font-medium">
                    {formatINR(totals.subtotal)}
                  </span>
                }
              />
              <Row
                label={<span className="text-muted-foreground">Discount ({totals.discountPercent.toFixed(2)}%)</span>}
                value={
                  <span className="font-medium text-destructive">
                    - {formatINR(totals.totalDiscount)}
                  </span>
                }
              />
              {totals.transportationWithTax > 0 && (
                <Row
                  label={<span className="text-muted-foreground">Transportation + Tax</span>}
                  value={
                    <span className="font-medium">
                      + {formatINR(totals.transportationWithTax)}
                    </span>
                  }
                />
              )}
              <div className="pt-2 mt-2 border-t border-border">
                <Row
                  label={<span className="font-semibold">Grand Total</span>}
                  value={
                    <span className="font-display text-xl font-semibold">
                      {formatINR(totals.grand)}
                    </span>
                  }
                />
              </div>
            </dl>
          </Section>
        </div>
      </div>

      {/* ── Add Customer Dialog ─────────────────────────────────────── */}
      {showCustomerDialog && (
        <AddCustomerDialog
          onClose={() => {
            setShowCustomerDialog(false);
            setDialogPrefillName("");
          }}
          onCreated={onCustomerCreated}
          prefillName={dialogPrefillName}
        />
      )}

      {/* ── Edit Customer Dialog ────────────────────────────────────── */}
      {showEditCustomerDialog && editingCustomer && (
        <EditCustomerDialog
          customer={editingCustomer}
          onClose={() => {
            setShowEditCustomerDialog(false);
            setEditingCustomer(null);
          }}
          onUpdate={handleUpdateCustomer}
        />
      )}
    </div>
    </>
  );
}

// ── Add Customer Dialog ────────────────────────────────────────────────
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
    address: "",
    gstNumber: "",
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
    console.log("[Customer] Creating customer:", form.customerName);
    try {
      const created = await api.post<CustomerRecord>("/customers", form);
      console.log("[Customer] Created successfully:", created?.customerCode);
      toast.success(`Customer ${created?.customerCode || ""} created`);
      onCreated(created);
    } catch (err) {
      console.error("[Customer] Create failed:", err);
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-lg">
              Add New Customer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border hover:bg-muted grid place-items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Customer Name *">
              <input
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                className={input}
                placeholder="John Doe"
                autoFocus
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={input}
                placeholder="john@company.com"
              />
            </Field>
            <Field label="Phone Number">
              <input
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
                className={input}
                placeholder="+91 98XXXXXXXX"
              />
            </Field>
            <Field label="Address">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={input}
                placeholder="123 Main Street, Mumbai"
              />
            </Field>
            <Field label="GST No.">
              <input
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                className={input}
                placeholder="27AADCB2230M1Z2"
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Customer Dialog ────────────────────────────────────────────────
function EditCustomerDialog({
  customer,
  onClose,
  onUpdate,
}: {
  customer: CustomerRecord;
  onClose: () => void;
  onUpdate: (c: CustomerRecord) => void;
}) {
  const [form, setForm] = useState({
    customerName: customer.customerName,
    email: customer.email || "",
    phoneNumber: customer.phoneNumber || "",
    address: customer.address || "",
    gstNumber: customer.gstNumber || "",
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
      const updated = await api.put<CustomerRecord>(`/customers/${customer._id}`, form);
      toast.success("Customer updated successfully");
      onUpdate(updated);
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-lg">Edit Customer</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border hover:bg-muted grid place-items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Customer Name *">
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className={input}
                placeholder="John Doe"
                autoFocus
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={input}
                placeholder="john@company.com"
              />
            </Field>
            <Field label="Phone Number">
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className={input}
                placeholder="+91 98XXXXXXXX"
              />
            </Field>
            <Field label="Address">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={input}
                placeholder="123 Main Street, Mumbai"
              />
            </Field>
            <Field label="GST No.">
              <input
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                className={input}
                placeholder="27AADCB2230M1Z2"
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Update Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const input =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

function Section({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-accent grid place-items-center text-accent-foreground shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h2 className="font-display font-semibold text-lg leading-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`block ${className}`}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// ── SearchableSelect (same pattern as inventory dropdowns) ─────────────
function SearchableSelect({
  value,
  options,
  onChange,
  onAdd,
  onEdit,
  onDelete,
  placeholder = "Search…",
  addLabel = "Add new",
  disabled = false,
}: {
  value: string;
  options: { id: string; label: string; data?: any }[];
  onChange: (id: string, label: string) => void;
  onAdd: (label: string) => void;
  onEdit?: (data: any) => void;
  onDelete?: (id: string, label: string) => void;
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = query.trim();
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(q.toLowerCase()),
  );
  const canAdd =
    q.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === q.toLowerCase());

  const pick = (opt: { id: string; label: string }) => {
    onChange(opt.id, opt.label);
    setOpen(false);
    setQuery("");
  };
  const add = () => {
    if (!canAdd) return;
    onAdd(q);
    setOpen(false);
    setQuery("");
  };

  const handleEdit = (e: React.MouseEvent, data: any) => {
    e.stopPropagation();
    if (onEdit) onEdit(data);
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string, label: string) => {
    e.stopPropagation();
    if (confirm(`Delete customer "${label}"? This will affect existing quotations.`)) {
      if (onDelete) onDelete(id, label);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`${input} flex items-center justify-between text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canAdd) add();
                  else if (filtered[0]) pick(filtered[0]);
                }
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-auto py-1">
            {filtered.map((o) => (
              <div
                key={o.id}
                onClick={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted group cursor-pointer"
              >
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>{o.label}</span>
                  {o.label === value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                {o.data && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(e, o.data);
                        }}
                        className="p-1 rounded hover:bg-primary/10 text-primary"
                        title="Edit customer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(e, o.id, o.label);
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                        title="Delete customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && !canAdd && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                No matches
              </div>
            )}
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                add();
              }}
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

// ── TextureDropdown ────────────────────────────────────────────────────
function TextureDropdown({
  textures,
  value,
  onChange,
}: {
  textures: { url: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const currentObj = textures.find((t) => t.name === value || t.url === value);

  return (
    <div ref={wrapRef} className="relative w-max">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-12 h-12 rounded-lg border border-border bg-background overflow-hidden hover:opacity-80 transition-opacity grid place-items-center group"
      >
        {currentObj?.url || value ? (
          <>
            <img
              src={currentObj?.url || value}
              alt="Texture"
              className="w-full h-full object-cover"
            />
            {currentObj?.name && (
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] text-center truncate px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {currentObj.name}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-accent text-xs flex items-center justify-center text-muted-foreground">
            None
          </div>
        )}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 right-0 sm:left-0 sm:right-auto bg-popover border border-border rounded-xl shadow-elegant p-2 grid grid-cols-3 gap-2 w-max">
          {textures.map((tx) => {
            const txValue = tx.name || tx.url;
            return (
            <button
              key={txValue}
              type="button"
              onClick={() => {
                onChange(txValue);
                setOpen(false);
              }}
              className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors group ${value === txValue ? "border-primary" : "border-transparent hover:border-border"}`}
            >
              <img
                src={tx.url}
                alt={tx.name || "Texture"}
                className="w-full h-full object-cover"
              />
              {tx.name && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] text-center truncate px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tx.name}
                </div>
              )}
            </button>
          );})}
          {textures.length === 0 && (
            <span className="text-xs text-muted-foreground p-2 col-span-3">
              No textures
            </span>
          )}
        </div>
      )}
    </div>
  );
}
