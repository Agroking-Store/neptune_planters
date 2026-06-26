import React, { useState } from "react";
import { X, Save, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileDialogProps {
  user: { name: string; email: string };
  onClose: () => void;
}

export function ProfileDialog({ user, onClose }: ProfileDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (name !== user.name) payload.name = name;
      if (email !== user.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save.");
        onClose();
        return;
      }

      await api.put("/auth/me", payload);
      toast.success("Profile updated successfully!");
      // Invalidate the 'me' query to refresh the user context
      queryClient.invalidateQueries({ queryKey: ["me"] });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-elegant border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div>
            <h2 className="font-display text-lg font-semibold">Your Profile</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your personal credentials.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-xl">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="text-base font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              New Password <span className="text-muted-foreground/60">(leave blank to keep current)</span>
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95 transition-all inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
