import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLogin } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | Neptune" },
      {
        name: "description",
        content: "Sign in to manage your quotations and inventory.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!email.includes("@") || password.length < 8) {
      setErr("Enter a valid email and a password of at least 8 characters.");
      return;
    }

    console.log("[Login] Submitting login for:", email);

    try {
      await loginMutation.mutateAsync({ email, password, rememberMe });
      console.log("[Login] Login successful — redirecting to dashboard");
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("[Login] Error:", error);

      // Determine which of the two allowed error messages to show
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 401) {
        setErr("Invalid credentials.");
      } else {
        setErr("Internal server error. Please contact admin.");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isPending = loginMutation.isPending;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">
              Neptune Planters
            </span>
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your workspace to continue.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@company.com"
                  disabled={isPending}
                  autoComplete="email"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  disabled={isPending}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isPending}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground select-none">
                Remember me
              </span>
            </label>

            {err && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {err}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Visual */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft opacity-60" />
        <div className="relative max-w-md p-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border text-xs text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-primary" />{" "}
            Trusted by modern sales teams
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Every quotation, beautifully accounted for.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Inventory, pricing and PDFs in one streamlined workspace.
          </p>
          <div className="mt-10 rounded-2xl border border-border bg-card/80 backdrop-blur p-5 shadow-elegant text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>QUO-0766</span>
              <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                Draft
              </span>
            </div>
            <div className="mt-3 font-display text-2xl font-semibold">
              ₹1,12,089.00
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Kumar Industries • 2 items
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
