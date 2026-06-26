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
  FileText,
  Leaf,
  Users,
  TrendingUp,
  ShieldCheck,
  CloudDownload,
  Zap,
} from "lucide-react";
import { useLogin } from "@/lib/auth";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";

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
  const [showForgotModal, setShowForgotModal] = useState(false);

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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
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
              
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm font-medium text-primary hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

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
      <div className="hidden lg:flex relative flex-col items-center justify-center overflow-hidden bg-[#F9F8FD]">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-[800px] p-12 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-border text-sm font-medium text-muted-foreground mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />{" "}
            Built for plant businesses like yours
          </div>

          {/* Heading */}
          <h2 className="font-display text-5xl font-bold leading-tight text-foreground tracking-tight max-w-2xl">
            Create professional quotations <span className="text-primary">in minutes.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Generate accurate quotes, manage customers, track accepted orders, and grow your plant business.
          </p>

          {/* 4 Feature Columns */}
          <div className="grid grid-cols-4 gap-6 mt-12 w-full max-w-4xl text-left">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Smart Quotations</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Create, customize and send quotes in seconds</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Plant Catalogue</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Organize plants with prices & details</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Customer Management</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Keep all your customer information in one place</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Sales Insights</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Track accepted quotes and top selling plants</p>
            </div>
          </div>

          {/* Footer Highlights */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border/60 w-full text-left">
            <div className="flex gap-4">
              <ShieldCheck className="w-8 h-8 text-primary shrink-0 opacity-80" />
              <div>
                <h5 className="font-semibold text-primary mb-1">Secure & Private</h5>
                <p className="text-xs text-muted-foreground">Your data is safe with us</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CloudDownload className="w-8 h-8 text-primary shrink-0 opacity-80" />
              <div>
                <h5 className="font-semibold text-primary mb-1">PDF Ready</h5>
                <p className="text-xs text-muted-foreground">Download & share instantly</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Zap className="w-8 h-8 text-primary shrink-0 opacity-80" />
              <div>
                <h5 className="font-semibold text-primary mb-1">Made for Speed</h5>
                <p className="text-xs text-muted-foreground">Fast, simple & efficient</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
}
