import { tokenStore, ApiClientError } from "./api";

export async function downloadQuotationPDF(q: any, inventory: any[] = []) {
  if (!q.id) {
    throw new Error("Invalid quotation ID. Cannot generate PDF.");
  }

  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Call our new backend PDF endpoint
    const res = await fetch(`/api/quotations/${q.id}/pdf`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (isJson) {
        const errorData = await res.json();
        throw new ApiClientError(res.status, errorData.message || "Failed to generate PDF");
      }
      throw new ApiClientError(res.status, "Failed to generate PDF");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${q.number || 'Quotation'}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[PDF] Failed to download PDF:", error);
    throw error;
  }
}
