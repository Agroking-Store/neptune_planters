import React, { useState, useEffect, useRef } from "react";
import { X, Save, Upload, Tag, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ISettings {
  logoImg: string;
  planterImg: string;
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
}

const defaultSettings: ISettings = {
  logoImg: "",
  planterImg: "",
  companyName: "Neptune Planters",
  addressLine1: "Sr No 34/1, Holkarwadi,",
  addressLine2: "Handewadi, Pune-412308",
  phone: "+91 97652 76111",
  email: "connect@shopneptune.in",
  gstNo: "",
  bankName: "HDFC Bank",
  accountName: "Neptune Planters",
  accountNo: "50200067523491",
  ifscCode: "HDFC0001234",
  branch: "Hadapsar, Pune",
  upiId: "",
  preparedBy: "Neptune Planters",
  signatureText: "Sumo",
  footerMobile: "+91 97652 76111",
  footerInstagram: "",
  footerWebsite: "www.shopneptune.in",
  footerLocation: "Sr No 34/1, Holkarwadi, Handewadi, Pune-412308",
};

interface Props {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settings, setSettings] = useState<ISettings>(defaultSettings);

  const logoRef = useRef<HTMLInputElement>(null);
  const planterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<ISettings>("/settings");
        if (res) {
          setSettings(res);
        }
      } catch (err) {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: keyof ISettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      toast.success("Global quotation settings updated successfully.");
      onClose();
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
        setSettings(res);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-elegant border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div>
            <h2 className="font-display text-xl font-semibold">Quotation Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure global details used in all quotation PDFs.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Media Section */}
          <section>
            <h3 className="font-semibold text-base mb-4 border-b border-border pb-2">1. Media</h3>
            <div className="flex flex-wrap gap-6">
              <div className="w-48">
                <ImageDrop
                  label="Logo Image"
                  value={settings.logoImg}
                  onPick={() => logoRef.current?.click()}
                  onClear={() => handleChange("logoImg", "")}
                  inputRef={logoRef}
                  onFile={(f) => readFile(f, "logoImg")}
                />
              </div>
              <div className="w-48">
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
          </section>

          {/* About Us Section */}
          <section>
            <h3 className="font-semibold text-base mb-4 border-b border-border pb-2">2. About Us</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <h3 className="font-semibold text-base mb-4 border-b border-border pb-2">3. Bank Details</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <h3 className="font-semibold text-base mb-4 border-b border-border pb-2">4. Prepared By</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Prepared By"><input value={settings.preparedBy} onChange={(e) => handleChange("preparedBy", e.target.value)} className={inputClass} /></Field>
              <Field label="Signature Text"><input value={settings.signatureText} onChange={(e) => handleChange("signatureText", e.target.value)} className={inputClass} /></Field>
            </div>
          </section>

          {/* Footer Info Section */}
          <section>
            <h3 className="font-semibold text-base mb-4 border-b border-border pb-2">5. Footer Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Mobile Number"><input value={settings.footerMobile} onChange={(e) => handleChange("footerMobile", e.target.value)} className={inputClass} /></Field>
              <Field label="Instagram Handle"><input value={settings.footerInstagram} onChange={(e) => handleChange("footerInstagram", e.target.value)} className={inputClass} placeholder="@username" /></Field>
              <Field label="Website"><input value={settings.footerWebsite} onChange={(e) => handleChange("footerWebsite", e.target.value)} className={inputClass} /></Field>
              <Field label="Location"><input value={settings.footerLocation} onChange={(e) => handleChange("footerLocation", e.target.value)} className={inputClass} /></Field>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-border bg-muted/30 flex justify-between items-center">
          <button
            onClick={handleReset}
            disabled={resetting || saving}
            className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reset to Default
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted transition-colors"
            >
              Cancel
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
      </div>
    </div>
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
