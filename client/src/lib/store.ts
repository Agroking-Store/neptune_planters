// Frontend-only data store backed by localStorage.
import { useEffect, useState, useSyncExternalStore } from "react";

export type InventoryItem = {
  id: string;
  // Media
  image?: string; // primary product image (data URL)
  referenceImage?: string;
  textureImage?: string;
  // Basics
  name: string;
  sku: string;
  hsn: string;
  description: string;
  department: string;
  category?: string;
  // Pricing
  price: number;
  discount?: number; // percent
  tax?: number; // percent
  // Stock
  quantity: number;
  unit: string; // UOM
  // Attributes
  brand?: string;
  batchNo?: string;
  color?: string;
  productN?: string;
  size?: string;
  dimensions: string;
  createdAt: string;
};

export type QuotationItem = {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  tax: number; // percent
};

export type Quotation = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  gstNumber: string;
  notes: string;
  terms: string[];
  items: QuotationItem[];
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  followUpDate?: string;
  createdAt: string;
};

type DB = {
  user: { name: string; email: string } | null;
  inventory: InventoryItem[];
  quotations: Quotation[];
};

const KEY = "indux_db_v1";

const seedInventory: InventoryItem[] = [
  { id: "inv_1", name: "Aluminum Ringlock Scaffold", sku: "RING-ALU-VS2M", department: "Industrial Access", hsn: "73084000", price: 14990, quantity: 240, unit: "pcs", dimensions: "2.0m x 1.0m", description: "Heavy-duty aluminum ringlock scaffolding section.", createdAt: new Date().toISOString() },
  { id: "inv_2", name: "Office Chair Executive", sku: "OFFICE-CHAIR-001", department: "Furniture", hsn: "94013000", price: 8499, quantity: 56, unit: "pcs", dimensions: "65 x 65 x 115 cm", description: "Mesh back executive chair with lumbar support.", createdAt: new Date().toISOString() },
  { id: "inv_3", name: "Wooden Office Desk", sku: "WOOD-DESK-120", department: "Furniture", hsn: "9403", price: 15750, quantity: 28, unit: "pcs", dimensions: "120 x 60 x 75 cm", description: "Engineered oak finish desk with cable management.", createdAt: new Date().toISOString() },
  { id: "inv_4", name: "LED Panel Light 40W", sku: "LED-PNL-40", department: "Electronics", hsn: "94054000", price: 1299, quantity: 1840, unit: "pcs", dimensions: "60 x 60 cm", description: "Flicker-free 4000K LED ceiling panel.", createdAt: new Date().toISOString() },
];

const seedQuotations: Quotation[] = [
  { id: "q_1", number: "QUO-0766", customerName: "Manish Kumar", customerEmail: "manish@example.com", customerPhone: "9876543210", companyName: "Kumar Industries", gstNumber: "27AAAPL1234C1Z5", notes: "Urgent delivery requested.", terms: ["100% secure payment", "Delivery in 7 days"], items: [{ itemId: "inv_2", name: "Office Chair Executive", quantity: 1, price: 8499, tax: 18 }, { itemId: "inv_3", name: "Wooden Office Desk", quantity: 1, price: 15750, tax: 18 }], status: "Draft", followUpDate: undefined, createdAt: new Date().toISOString() },
  { id: "q_2", number: "QUO-0765", customerName: "Manish Kumar", customerEmail: "manish@example.com", customerPhone: "9876543210", companyName: "Kumar Industries", gstNumber: "27AAAPL1234C1Z5", notes: "", terms: ["No warranty"], items: [{ itemId: "inv_1", name: "Aluminum Ringlock Scaffold", quantity: 4, price: 14990, tax: 18 }], status: "Sent", followUpDate: "2026-05-28", createdAt: new Date().toISOString() },
];

const defaultDB: DB = { user: null, inventory: seedInventory, quotations: seedQuotations };

let memory: DB = defaultDB;
const listeners = new Set<() => void>();

function load(): DB {
  if (typeof window === "undefined") return defaultDB;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDB;
    return { ...defaultDB, ...JSON.parse(raw) } as DB;
  } catch {
    return defaultDB;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch { }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function snapshot() {
  return memory;
}

// Hydrate on first import in browser
if (typeof window !== "undefined") {
  memory = load();
}

export function useDB(): DB {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    memory = load();
    setHydrated(true);
    listeners.forEach((l) => l());
  }, []);
  const data = useSyncExternalStore(subscribe, snapshot, () => defaultDB);
  return hydrated ? data : memory;
}

export const store = {
  login(email: string) {
    const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    memory = { ...memory, user: { name, email } };
    persist();
  },
  logout() {
    memory = { ...memory, user: null };
    persist();
  },
  isAuthed() {
    return !!memory.user;
  },
  addInventory(item: Omit<InventoryItem, "id" | "createdAt">) {
    const newItem: InventoryItem = { ...item, id: `inv_${Date.now()}`, createdAt: new Date().toISOString() };
    memory = { ...memory, inventory: [newItem, ...memory.inventory] };
    persist();
    return newItem;
  },
  updateInventory(id: string, patch: Partial<InventoryItem>) {
    memory = { ...memory, inventory: memory.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
    persist();
  },
  deleteInventory(id: string) {
    memory = { ...memory, inventory: memory.inventory.filter((i) => i.id !== id) };
    persist();
  },
  addQuotation(q: Omit<Quotation, "id" | "number" | "createdAt">) {
    const number = `QUO-${String(memory.quotations.length + 767).padStart(4, "0")}`;
    const newQ: Quotation = { ...q, id: `q_${Date.now()}`, number, createdAt: new Date().toISOString() };
    memory = { ...memory, quotations: [newQ, ...memory.quotations] };
    persist();
    return newQ;
  },
  deleteQuotation(id: string) {
    memory = { ...memory, quotations: memory.quotations.filter((q) => q.id !== id) };
    persist();
  },
};

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
