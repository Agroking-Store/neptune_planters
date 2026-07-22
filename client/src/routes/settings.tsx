import React, { useState, useEffect, useRef } from "react";
import { Save, Upload, Tag, RefreshCw, Loader2, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});



interface IGlobalTexture {
  name: string;
  url: string;
}

interface ISettings {
  logoImg: string;
  planterImg: string;
  hideDefaultPlanter: boolean;
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  gstNo: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  preparedBy: string;
  signatureText: string;
  footerMobile: string;
  footerInstagram: string;
  footerWebsite: string;
  footerLocation: string;

  textures: IGlobalTexture[];
}

const defaultSettings: ISettings = {
  logoImg: "",
  planterImg: "",
  hideDefaultPlanter: false,
  companyName: "Neptune Planters",
  addressLine1: "Sr No 34/1, Holkarwadi,",
  addressLine2: "Handewadi, Pune-412308",
  phone: "+91 97652 76111",
  email: "connect@shopneptune.in",
  gstNo: "",
  bankName: "Punjab National Bank",
  accountName: "Neptune Inovations",
  accountNo: "1475202100000767",
  ifscCode: "PUNB0147520",
  branch: "Market Yard, Pune",
  upiId: "neptuneinnovations@ibl",
  preparedBy: "Neptune Planters",
  signatureText: "Sumo",
  footerMobile: "+91 97652 76111",
  footerInstagram: "neptuneplanters",
  footerWebsite: "www.shopneptune.in",
  footerLocation: "Sr No 34/1, Holkarwadi, Handewadi, Pune-412308",

  textures: [],
};

type SettingsTab = "quotation" | "inventory";

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settings, setSettings] = useState<ISettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<SettingsTab>("quotation");

  const logoRef = useRef<HTMLInputElement>(null);
  const planterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<ISettings>("/settings");
        if (res) {
          setSettings({
            ...defaultSettings,
            ...res,

          });
        }
      } catch (err) {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: keyof ISettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };



  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      toast.success("Settings updated successfully.");
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all settings to defaults? This cannot be undone.")) return;
    setResetting(true);
    try {
      const res = await api.post<ISettings>("/settings/reset");
      if (res) {
        setSettings({
          ...defaultSettings,
          ...res,

        });
        toast.success("Settings reset to defaults.");
      }
    } catch (err) {
      toast.error("Failed to reset settings.");
    } finally {
      setResetting(false);
    }
  };

  const readFile = (f: File, field: keyof ISettings) => {
    const reader = new FileReader();
    reader.onload = () => handleChange(field, reader.result as string);
    reader.readAsDataURL(f);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

  return (
    <AppShell>
      <div className="space-y-10 max-w-5xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure global details used across your application.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={resetting || saving}
              className="px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors inline-flex items-center gap-2 border border-destructive/20"
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reset to Default
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || resetting}
              className="px-6 py-2.5 text-sm font-medium rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95 transition-all inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
        </div>

        {/* ── Tab Selector ──────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("quotation")}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all border ${
              activeTab === "quotation"
                ? "bg-gradient-primary text-primary-foreground shadow-elegant border-transparent"
                : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            Quotation Settings
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all border ${
              activeTab === "inventory"
                ? "bg-gradient-primary text-primary-foreground shadow-elegant border-transparent"
                : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Package className="w-4.5 h-4.5" />
            Inventory Settings
          </button>
        </div>

        {/* ── Quotation Settings Tab ───────────────────────────────────── */}
        {activeTab === "quotation" && (
          <div className="space-y-12">
            
            {/* Media Section */}
            <section>
              <h3 className="font-semibold text-xl mb-6 pb-3 border-b border-border">1. Media</h3>
              <div className="flex flex-wrap gap-8">
                <div className="w-56">
                  <ImageDrop
                    label="Logo Image"
                    value={settings.logoImg}
                    onPick={() => logoRef.current?.click()}
                    onClear={() => handleChange("logoImg", "")}
                    inputRef={logoRef}
                    onFile={(f) => readFile(f, "logoImg")}
                  />
                </div>
                <div className="w-56">
                  <ImageDrop
                    label="Planter Hero Image"
                    value={settings.planterImg}
                    onPick={() => planterRef.current?.click()}
                    onClear={() => handleChange("planterImg", "")}
                    inputRef={planterRef}
                    onFile={(f) => readFile(f, "planterImg")}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hideDefaultPlanter"
                  checked={settings.hideDefaultPlanter}
                  onChange={(e) => handleChange("hideDefaultPlanter", e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="hideDefaultPlanter" className="text-sm font-medium text-muted-foreground cursor-pointer">
                  Hide default planter image
                </label>
              </div>
            </section>

            {/* About Us Section */}
            <section>
              <h3 className="font-semibold text-xl mb-6 pb-3 border-b border-border">2. About Us</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field label="Company Name"><input value={settings.companyName} onChange={(e) => handleChange("companyName", e.target.value)} className={inputClass} /></Field>
                <Field label="Address Line 1"><input value={settings.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} className={inputClass} /></Field>
                <Field label="Address Line 2"><input value={settings.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} className={inputClass} /></Field>
                <Field label="Phone"><input value={settings.phone} onChange={(e) => handleChange("phone", e.target.value)} className={inputClass} /></Field>
                <Field label="Email"><input value={settings.email} onChange={(e) => handleChange("email", e.target.value)} className={inputClass} /></Field>
                <Field label="GST No"><input value={settings.gstNo} onChange={(e) => handleChange("gstNo", e.target.value)} className={inputClass} placeholder="Optional" /></Field>
              </div>
            </section>

            {/* Bank Details Section */}
            <section>
              <h3 className="font-semibold text-xl mb-6 pb-3 border-b border-border">3. Bank Details</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Field label="Bank Name"><input value={settings.bankName} onChange={(e) => handleChange("bankName", e.target.value)} className={inputClass} /></Field>
                <Field label="A/C Name"><input value={settings.accountName} onChange={(e) => handleChange("accountName", e.target.value)} className={inputClass} /></Field>
                <Field label="A/C No"><input value={settings.accountNo} onChange={(e) => handleChange("accountNo", e.target.value)} className={inputClass} /></Field>
                <Field label="IFSC Code"><input value={settings.ifscCode} onChange={(e) => handleChange("ifscCode", e.target.value)} className={inputClass} /></Field>
                <Field label="Branch"><input value={settings.branch} onChange={(e) => handleChange("branch", e.target.value)} className={inputClass} /></Field>
                <Field label="UPI ID"><input value={settings.upiId} onChange={(e) => handleChange("upiId", e.target.value)} className={inputClass} placeholder="Optional" /></Field>
              </div>
            </section>

            {/* Prepared By Section */}
            <section>
              <h3 className="font-semibold text-xl mb-6 pb-3 border-b border-border">4. Prepared By</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Prepared By"><input value={settings.preparedBy} onChange={(e) => handleChange("preparedBy", e.target.value)} className={inputClass} /></Field>
                <Field label="Signature Text"><input value={settings.signatureText} onChange={(e) => handleChange("signatureText", e.target.value)} className={inputClass} /></Field>
              </div>
            </section>

            {/* Footer Info Section */}
            <section>
              <h3 className="font-semibold text-xl mb-6 pb-3 border-b border-border">5. Footer Information</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Mobile Number"><input value={settings.footerMobile} onChange={(e) => handleChange("footerMobile", e.target.value)} className={inputClass} /></Field>
                <Field label="Instagram Handle"><input value={settings.footerInstagram} onChange={(e) => handleChange("footerInstagram", e.target.value)} className={inputClass} placeholder="@username" /></Field>
                <Field label="Website"><input value={settings.footerWebsite} onChange={(e) => handleChange("footerWebsite", e.target.value)} className={inputClass} /></Field>
                <Field label="Location"><input value={settings.footerLocation} onChange={(e) => handleChange("footerLocation", e.target.value)} className={inputClass} /></Field>
              </div>
            </section>

          </div>
        )}

        {/* ── Inventory Settings Tab ───────────────────────────────────── */}
        {activeTab === "inventory" && (
          <div className="space-y-12">

            {/* Global Textures Section */}
            <section>
              <h3 className="font-semibold text-xl mb-6 pb-3 border-b border-border">2. Global Textures</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define the textures that are available to all products.
              </p>
              
              <div className="space-y-4">
                {settings.textures?.map((texture, index) => (
                  <div key={index} className="rounded-xl border border-border bg-card p-5 flex items-start sm:items-center gap-5 flex-col sm:flex-row">
                    <div className="flex-1 w-full">
                      <label className="text-sm font-semibold text-foreground block mb-1.5">Texture Name</label>
                      <input
                        value={texture.name}
                        onChange={(e) => {
                          const newTextures = [...(settings.textures || [])];
                          newTextures[index].name = e.target.value;
                          setSettings({ ...settings, textures: newTextures });
                        }}
                        className={inputClass}
                        placeholder="e.g. Matte Black"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-sm font-semibold text-foreground block mb-1.5">Texture Image</label>
                      <div className="flex items-center gap-3">
                        {texture.url && (
                          <div className="w-10 h-10 rounded border border-border overflow-hidden shrink-0">
                            <img src={texture.url} alt="texture" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="text-xs max-w-[200px]"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const newTextures = [...(settings.textures || [])];
                                newTextures[index].url = reader.result as string;
                                setSettings({ ...settings, textures: newTextures });
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 pt-6 sm:pt-0">
                      <button
                        onClick={() => {
                          const newTextures = settings.textures.filter((_, i) => i !== index);
                          setSettings({ ...settings, textures: newTextures });
                        }}
                        className="text-sm text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    const newTextures = [...(settings.textures || []), { name: "", url: "" }];
                    setSettings({ ...settings, textures: newTextures });
                  }}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  + Add Global Texture
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Components ─────────────────────────────────────────────────────────────
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
      <button type="button" onClick={onPick} className="w-full aspect-video rounded-2xl border-2 border-dashed border-border grid place-items-center text-center overflow-hidden bg-gradient-soft hover:bg-muted transition-colors">
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-contain bg-black/5" />
        ) : (
          <div className="p-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mx-auto mb-2 shadow-elegant"><Upload className="w-4 h-4" /></div>
            <div className="font-medium text-sm">Upload</div>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {value && onClear && <button type="button" onClick={onClear} className="mt-2 text-xs text-destructive hover:underline block text-center w-full">Remove Image</button>}
    </div>
  );
}
