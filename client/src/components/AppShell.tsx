import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FileText, Package, LogOut, Plus, Menu, X, Sparkles, PackagePlus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useDB } from "@/lib/store";
import { useLogout, useMe } from "@/lib/auth";

const nav = [
    { to: "/dashboard", label: "Quotations", icon: FileText, exactPaths: ["/dashboard"], prefixPaths: ["/quotations/edit"] },
    { to: "/quotations/new", label: "Add Quotation", icon: Plus, exactPaths: ["/quotations/new"], prefixPaths: [] },
    { to: "/inventory", label: "Inventory", icon: Package, exactPaths: ["/inventory"], prefixPaths: ["/inventory/edit"] },
    { to: "/inventory/new", label: "Add Inventory", icon: PackagePlus, exactPaths: ["/inventory/new"], prefixPaths: [] },
    { to: "/settings", label: "Settings", icon: Settings, exactPaths: ["/settings"], prefixPaths: [] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
    const db = useDB();
    const navigate = useNavigate();
    const { location } = useRouterState();
    const [open, setOpen] = useState(false);
    const logoutMutation = useLogout();
    const { data: user } = useMe();

    const handleLogout = () => {
        console.log("[Logout] User logged out");
        logoutMutation.mutate(undefined, {
            onSettled: () => navigate({ to: "/login" }),
        });
    };

    useEffect(() => { 
        setOpen(false); 
        
        // Dynamically update title
        let pageTitle = "Panel";
        const path = location.pathname;
        if (path.startsWith("/dashboard")) pageTitle = "Quotations";
        else if (path.startsWith("/quotations/new")) pageTitle = "Add Quotation";
        else if (path.startsWith("/quotations/edit")) pageTitle = "Edit Quotation";
        else if (path.startsWith("/inventory/new")) pageTitle = "Add Inventory";
        else if (path.startsWith("/inventory/edit")) pageTitle = "Edit Inventory";
        else if (path.startsWith("/inventory")) pageTitle = "Inventory";
        else if (path.startsWith("/settings")) pageTitle = "Settings";
        
        document.title = `Neptune | ${pageTitle}`;
    }, [location.pathname]);

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
                        <img src="/logo.png" alt="Neptune Planters" className="h-13 w-auto object-contain" />
                    </Link>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-xs">
                                S
                            </div>
                            <div className="min-w-0 hidden md:block">
                                <div className="text-xs font-medium truncate max-w-[140px]">Sudarshan Sharma</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">connect@shopneptune.in</div>
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
                    <img src="/logo.png" alt="Neptune Planters" className="h-15 w-auto object-contain" />
                    <button className="ml-auto p-2 rounded-lg hover:bg-sidebar-accent" onClick={() => setOpen(false)} aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {nav.map(({ to, label, icon: Icon, exactPaths, prefixPaths }) => {
                        const active = exactPaths.some(p => location.pathname === p) ||
                            prefixPaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
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
                            S
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">Sudarshan Sharma</div>
                            <div className="text-xs text-muted-foreground truncate">connect@shopneptune.in</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-60"
                    >
                        <LogOut className="w-4 h-4" /> {logoutMutation.isPending ? "Signing out..." : "Logout"}
                    </button>
                </div>
            </aside>

            <main className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[1400px] mx-auto">
                {children}
            </main>
        </div>
    );
}
