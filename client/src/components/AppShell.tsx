import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FileText, Package, LogOut, Plus, Menu, X, Sparkles, PackagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { store, useDB } from "@/lib/store";

const nav = [
    { to: "/dashboard", label: "Quotations", icon: FileText },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/inventory/new", label: "Add Inventory", icon: PackagePlus },
];

export function AppShell({ children }: { children: React.ReactNode }) {
    const db = useDB();
    const navigate = useNavigate();
    const { location } = useRouterState();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && !store.isAuthed()) {
            navigate({ to: "/login" });
        }
    }, [navigate]);

    useEffect(() => { setOpen(false); }, [location.pathname]);

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar — always visible, holds the sidebar toggle */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
                <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="w-10 h-10 grid place-items-center rounded-xl border border-border bg-card hover:bg-muted transition-colors"
                        aria-label={open ? "Close menu" : "Open menu"}
                        aria-expanded={open}
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant shrink-0">
                            <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-display font-semibold text-sm leading-tight truncate">Indux</div>
                            <div className="text-[10px] text-muted-foreground truncate">Quotation suite</div>
                        </div>
                    </Link>

                    <div className="ml-auto flex items-center gap-2">
                        <Link
                            to="/quotations/new"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium shadow-elegant hover:opacity-95"
                        >
                            <Plus className="w-4 h-4" /> New Quotation
                        </Link>
                        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-xs">
                                {(db.user?.name || "U").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 hidden md:block">
                                <div className="text-xs font-medium truncate max-w-[140px]">{db.user?.name || "Guest"}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{db.user?.email || "—"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Overlay */}
            {open && (
                <button
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-foreground/40"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Off-canvas sidebar — closed by default on every breakpoint */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="px-5 py-4 flex items-center gap-2 border-b border-sidebar-border">
                    <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-elegant">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-display font-semibold text-base leading-tight">Indux</div>
                        <div className="text-xs text-muted-foreground">Quotation suite</div>
                    </div>
                    <button className="ml-auto p-2 rounded-lg hover:bg-sidebar-accent" onClick={() => setOpen(false)} aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <Link
                        to="/quotations/new"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> New Quotation
                    </Link>
                    <div className="h-2" />
                    {nav.map(({ to, label, icon: Icon }) => {
                        const active = location.pathname === to || (to !== "/inventory/new" && location.pathname.startsWith(to));
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"}`}
                            >
                                <Icon className="w-4 h-4" /> {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-sm">
                            {(db.user?.name || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{db.user?.name || "Guest"}</div>
                            <div className="text-xs text-muted-foreground truncate">{db.user?.email || "—"}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => { store.logout(); navigate({ to: "/login" }); }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </aside>

            <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[1400px] mx-auto">
                {children}
            </main>
        </div>
    );
}
