// ─────────────────────────────────────────────
// In-memory access token store (XSS-safe)
// Never stored in localStorage or sessionStorage
// ─────────────────────────────────────────────
let _accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string): void => {
    _accessToken = token;
    console.log("[tokenStore] Access token stored");
  },
  clear: (): void => {
    _accessToken = null;
    console.log("[tokenStore] Access token cleared");
  },
};

// ─────────────────────────────────────────────
// Custom API error class
// ─────────────────────────────────────────────
export class ApiClientError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
  }
}

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────
const BASE_URL = "/api";

// Shared promise to prevent concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

export function silentRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (refreshRes) => {
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData?.data?.accessToken;
          if (newToken) {
            tokenStore.set(newToken);
            return newToken;
          }
        }
        return null;
      })
      .catch((err) => {
        console.error("[api] Token refresh failed:", err);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = tokenStore.get();

  const headers: Record<string, string> = {};
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`[api] ${method} ${url}`, body ?? "");

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include", // Sends HttpOnly refresh token cookie
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  console.log(`[api] ${method} ${url} → ${res.status}`);

  // ── 401: attempt silent token refresh once ──
  if (res.status === 401 && !isRetry) {
    console.log("[api] 401 received — attempting token refresh");

    const newToken = await silentRefresh();
    if (newToken) {
      console.log("[api] Token refreshed — retrying original request");
      return request<T>(method, path, body, true); // Retry once
    } else {
      tokenStore.clear();
      throw new ApiClientError(401, "Session expired. Please log in again.");
    }
  }

  // ── Parse JSON response ──────────────────────
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiClientError(res.status, "Invalid server response");
  }

  if (!res.ok) {
    const data = json as { message?: string };
    const msg = data?.message ?? `Request failed with status ${res.status}`;
    console.error(`[api] Error ${res.status}:`, msg);
    throw new ApiClientError(res.status, msg);
  }

  // Backend wraps all responses in { success, message, data }
  const wrapper = json as { data?: T };
  return (wrapper.data ?? json) as T;
}

// ─────────────────────────────────────────────
// Typed API methods
// ─────────────────────────────────────────────
export const api = {
  get: <T>(path: string): Promise<T> => request<T>("GET", path),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("PATCH", path, body),
  delete: <T>(path: string): Promise<T> => request<T>("DELETE", path),
};
