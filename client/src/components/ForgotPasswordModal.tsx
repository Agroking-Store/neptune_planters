import React, { useState } from "react";
import { X, Send, KeyRound, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password");
      toast.success("OTP sent to admin email address.");
      setStep("reset");
    } catch (err: any) {
      toast.error(err?.message || "Failed to request OTP. Ensure SMTP is configured.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || newPassword.length < 8) {
      toast.error("Enter a valid 6-digit OTP and a password of at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { otp, newPassword });
      toast.success("Password has been reset successfully. You can now login.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password. Invalid or expired OTP.");
    } finally {
      setLoading(false);
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
            <h2 className="font-display text-lg font-semibold">Forgot Password</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === "request" ? "Request an OTP to reset password." : "Enter OTP and new password."}
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
        <div className="p-6">
          {step === "request" ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <KeyRound className="w-8 h-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click below to send a 6-digit OTP to the admin email address.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 disabled:opacity-60 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send OTP
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">6-Digit OTP</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="123456"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="••••••••"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 disabled:opacity-60 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
