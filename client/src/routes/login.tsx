import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Sparkles, Mail, Lock } from "lucide-react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Indux" }, { name: "description", content: "Sign in to manage your quotations and inventory." }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("manish@indux.app");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) { setErr("Enter a valid email and a 6+ char password."); return; }
    store.login(email);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">Indux</span>
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your workspace to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@company.com"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </label>
            {err && <div className="text-sm text-destructive">{err}</div>}
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 cursor-pointer">
              Sign in <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-muted-foreground text-center">Demo mode — any email and 6+ char password works.</p>
          </form>
        </div>
      </div>

      {/* Visual */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft opacity-60" />
        <div className="relative max-w-md p-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/70 backdrop-blur border border-border text-xs text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-primary" /> Trusted by modern sales teams
          </div>
          <h2 className="font-display text-4xl font-semibold leading-tight">Every quotation, beautifully accounted for.</h2>
          <p className="mt-4 text-muted-foreground">Inventory, pricing and PDFs in one streamlined workspace.</p>
          <div className="mt-10 rounded-2xl border border-border bg-card/80 backdrop-blur p-5 shadow-elegant text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>QUO-0766</span><span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning">Draft</span></div>
            <div className="mt-3 font-display text-2xl font-semibold">₹1,12,089.00</div>
            <div className="mt-1 text-sm text-muted-foreground">Kumar Industries • 2 items</div>
          </div>
        </div>
      </div>
    </div>
  );
}
