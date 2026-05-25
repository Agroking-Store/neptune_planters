import { useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { tokenStore } from "./lib/api";

const router = getRouter();

function App() {
  // ── Silent session restore on every page load ──
  // Attempts to get a new access token using the HttpOnly refresh cookie.
  // If the user was previously logged in, this keeps them logged in
  // across page refreshes without showing a login screen.
  useEffect(() => {
    const restoreSession = async () => {
      console.log("[App] Attempting silent session restore...");
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include", // sends the HttpOnly refresh cookie
        });

        if (res.ok) {
          const data = (await res.json()) as { data?: { accessToken?: string } };
          const token = data?.data?.accessToken;
          if (token) {
            tokenStore.set(token);
            console.log("[App] Session restored — user is logged in");
          }
        } else {
          console.log("[App] No active session — user must log in");
        }
      } catch (err) {
        console.error("[App] Session restore failed (server may be down):", err);
      }
    };

    void restoreSession();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;