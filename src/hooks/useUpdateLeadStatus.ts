import { useState } from "react";
import type { LeadStatus } from "@/types/lead";

/**
 * Hook para atualizar status do lead
 */
export function useUpdateLeadStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    leadId: string,
    status: LeadStatus
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const { error: errorMsg } = await res.json();
        setError(errorMsg ?? "Falha ao atualizar status");
        return false;
      }

      return true;
    } catch {
      setError("Falha de conexão com o servidor");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}
