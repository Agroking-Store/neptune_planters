import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Redirect root path to login page
    throw redirect({
      to: "/login",
    });
  },
  component: () => null, 
});



// import { createFileRoute, Link } from "@tanstack/react-router";
// import { ArrowRight, FileText, Package, Zap, Shield, BarChart3, Sparkles } from "lucide-react";

// export const Route = createFileRoute("/")({
//   head: () => ({
//     meta: [
//       { title: "Indux — Quotation & Inventory Suite" },
//       { name: "description", content: "Generate professional quotations and manage inventory in one beautifully simple workspace." },
//       { property: "og:title", content: "Indux — Quotation & Inventory Suite" },
//       { property: "og:description", content: "Generate professional quotations and manage inventory in one beautifully simple workspace." },
//     ],
//   }),
//   component: Landing,
// });

// function Landing() {
//   return (
//     <div className="min-h-screen bg-background bg-gradient-hero">
//       {/* Nav */}
//       <header className="px-4 sm:px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
//         <Link to="/" className="flex items-center gap-2">
//           <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
//             <Sparkles className="w-5 h-5 text-primary-foreground" />
//           </div>
//           <span className="font-display font-semibold text-lg">Indux</span>
//         </Link>
//         <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
//           <a href="#features" className="hover:text-foreground">Features</a>
//           <a href="#workflow" className="hover:text-foreground">Workflow</a>
//         </nav>
//         <Link
//           to="/login"
//           className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant hover:opacity-95"
//         >
//           Sign in <ArrowRight className="w-4 h-4" />
//         </Link>
//       </header>

//       {/* Hero */}
//       <section className="px-4 sm:px-8 pt-12 pb-20 max-w-7xl mx-auto text-center">
//         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur text-xs text-muted-foreground mb-8">
//           <span className="w-1.5 h-1.5 rounded-full bg-gradient-primary" />
//           New • PDF export, multi-currency, GST ready
//         </div>
//         <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight max-w-4xl mx-auto leading-[1.05]">
//           Quotations that <span className="text-gradient">close deals</span>, inventory that runs itself.
//         </h1>
//         <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
//           A frictionless workspace for sales teams to draft, send and track quotations — wired directly to a live inventory you actually trust.
//         </p>
//         <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
//           <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95">
//             Get started <ArrowRight className="w-4 h-4" />
//           </Link>
//           <a href="#features" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/60 backdrop-blur font-medium hover:bg-card">
//             Explore features
//           </a>
//         </div>

//         {/* Mock preview */}
//         <div className="mt-16 relative max-w-5xl mx-auto">
//           <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
//           <div className="relative rounded-2xl border border-border bg-card shadow-elegant overflow-hidden text-left">
//             <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-muted/40">
//               <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive/60" /><span className="w-2.5 h-2.5 rounded-full bg-warning/70" /><span className="w-2.5 h-2.5 rounded-full bg-success/70" /></div>
//               <div className="ml-3 text-xs text-muted-foreground">indux.app / dashboard</div>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-soft">
//               {[
//                 { label: "Total Quotations", value: "728", sub: "+47 this month" },
//                 { label: "Total Revenue", value: "₹108.5Cr", sub: "Avg ₹14.9L" },
//                 { label: "Conversion", value: "12%", sub: "+3% vs last" },
//               ].map((s) => (
//                 <div key={s.label} className="rounded-xl bg-card border border-border p-5 shadow-soft">
//                   <div className="text-xs text-muted-foreground">{s.label}</div>
//                   <div className="font-display text-2xl font-semibold mt-1">{s.value}</div>
//                   <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section id="features" className="px-4 sm:px-8 py-20 max-w-7xl mx-auto">
//         <div className="text-center max-w-2xl mx-auto mb-14">
//           <h2 className="font-display text-3xl sm:text-4xl font-semibold">Built for the way deals actually move</h2>
//           <p className="mt-3 text-muted-foreground">Three surfaces, one source of truth — keep pricing, stock and approvals in lock-step.</p>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           {[
//             { icon: FileText, title: "Smart quotations", body: "Pick items from your live inventory, auto-apply GST, export polished PDFs in a click." },
//             { icon: Package, title: "Inventory you trust", body: "Photos, dimensions, SKUs, HSN — everything in one place, searchable and filterable." },
//             { icon: BarChart3, title: "Pipeline at a glance", body: "Track drafts, sent, accepted and follow-ups across every customer in real time." },
//             { icon: Zap, title: "Instant PDF export", body: "Branded quotation PDFs with itemised pricing, taxes and terms — ready to send." },
//             { icon: Shield, title: "GST & compliance ready", body: "Capture GSTIN, HSN and tax breakdowns the way Indian buyers expect." },
//             { icon: Sparkles, title: "Beautiful by default", body: "A clean, focused UI that your team will actually want to open every morning." },
//           ].map(({ icon: Icon, title, body }) => (
//             <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant transition-shadow">
//               <div className="w-11 h-11 rounded-xl bg-accent grid place-items-center text-accent-foreground mb-4 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-colors">
//                 <Icon className="w-5 h-5" />
//               </div>
//               <h3 className="font-display font-semibold text-lg">{title}</h3>
//               <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Workflow */}
//       <section id="workflow" className="px-4 sm:px-8 py-20 max-w-7xl mx-auto">
//         <div className="grid lg:grid-cols-2 gap-12 items-center">
//           <div>
//             <h2 className="font-display text-3xl sm:text-4xl font-semibold">From inventory to invoice in minutes</h2>
//             <p className="mt-3 text-muted-foreground">A flow designed around how sales reps already think — not how databases want them to.</p>
//             <ol className="mt-8 space-y-5">
//               {[
//                 ["Add to inventory", "Upload a photo, set the price, dimensions and HSN code."],
//                 ["Create quotation", "Pick items, choose tax & terms, add a personal note."],
//                 ["Send & track", "Download the PDF, mark it sent, watch it convert."],
//               ].map(([t, b], i) => (
//                 <li key={t} className="flex gap-4">
//                   <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground font-semibold shadow-elegant">{i + 1}</div>
//                   <div>
//                     <div className="font-medium">{t}</div>
//                     <div className="text-sm text-muted-foreground">{b}</div>
//                   </div>
//                 </li>
//               ))}
//             </ol>
//           </div>
//           <div className="rounded-2xl border border-border bg-card shadow-elegant p-6 bg-gradient-soft">
//             <div className="space-y-3">
//               {[
//                 { n: "QUO-0766", c: "Kumar Industries", v: "₹1,12,089", s: "Draft" },
//                 { n: "QUO-0765", c: "Tata Steel", v: "₹6,54,120", s: "Sent" },
//                 { n: "QUO-0764", c: "Reliance Retail", v: "₹2,18,990", s: "Accepted" },
//               ].map((r) => (
//                 <div key={r.n} className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
//                   <div className="w-10 h-10 rounded-lg bg-accent grid place-items-center"><FileText className="w-4 h-4 text-accent-foreground" /></div>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-sm font-medium">{r.n}</div>
//                     <div className="text-xs text-muted-foreground truncate">{r.c}</div>
//                   </div>
//                   <div className="text-sm font-semibold">{r.v}</div>
//                   <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${r.s === "Draft" ? "bg-warning/15 text-warning" : r.s === "Sent" ? "bg-primary/10 text-primary" : "bg-success/15 text-success"}`}>{r.s}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
//         © {new Date().getFullYear()} Indux Technology. Crafted for modern sales teams.
//       </footer>
//     </div>
//   );
// }
