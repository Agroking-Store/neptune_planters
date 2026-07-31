import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/api/")) {
    return url;
  }
  
  let normalizedUrl = url;
  if (normalizedUrl.startsWith("uploads/")) {
    normalizedUrl = `/${normalizedUrl}`;
  }

  if (normalizedUrl.startsWith("/uploads/")) {
    const backendUrl = import.meta.env?.VITE_API_URL;
    if (backendUrl) {
      return `${backendUrl.replace(/\/$/, "")}${normalizedUrl}`;
    }
    return `/api${normalizedUrl}`;
  }
  
  return normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
}
