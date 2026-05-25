// ─────────────────────────────────────────────
// Auth React Query hooks
// ─────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, tokenStore, ApiClientError } from "./api";

// ── Types ─────────────────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  accessToken: string;
}

// ── Query Keys ────────────────────────────────────────────────────
export const authKeys = {
  me: ["auth", "me"] as const,
};

// ─────────────────────────────────────────────
// useMe — fetch the currently logged-in user
// Only runs when an access token is present
// ─────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api.get<AuthUser>("/auth/me"),
    enabled: !!tokenStore.get(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─────────────────────────────────────────────
// useLogin — POST /api/auth/login
// ─────────────────────────────────────────────
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const data = await api.post<LoginResponse>("/auth/login", payload);
      if (!data?.accessToken) throw new Error("No access token in response");
      return data;
    },
    onSuccess: (data) => {
      tokenStore.set(data.accessToken);
      // Invalidate so useMe re-fetches the user profile
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

// ─────────────────────────────────────────────
// useLogout — POST /api/auth/logout
// ─────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      // Always clear local state even if the request fails
      tokenStore.clear();
      queryClient.setQueryData(authKeys.me, null);
      queryClient.clear();
    },
  });
}

// ─────────────────────────────────────────────
// isAuthenticated — sync check from token store
// Use this in route guards (beforeLoad)
// ─────────────────────────────────────────────
export function isAuthenticated(): boolean {
  return !!tokenStore.get();
}

// ─────────────────────────────────────────────
// getErrorMessage — extract readable message
// ─────────────────────────────────────────────
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
