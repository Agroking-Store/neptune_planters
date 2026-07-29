import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveImageUrl(url?: string): string {
  if (!url) return "";
  // If it's an absolute URL or already prefixed with /api, return as is
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/api/")) {
    return url;
  }
  // If it starts with /uploads, prefix it with /api so production proxies route it to the backend
  if (url.startsWith("/uploads/")) {
    return `/api${url}`;
  }
  return url;
}
