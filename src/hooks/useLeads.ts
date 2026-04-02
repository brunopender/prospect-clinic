import { useState, useEffect } from "react";
import type { Lead, LeadStatus, Platform } from "@/types/lead";

interface Filters {
  platform?: Platform;
  status?: LeadStatus;
}

/**
 * Hook para carregar e gerenciar leads com filtros opcionais
 */
export function useLeads(filters?: Filters) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters ?? {}).filter(
            ([, v]) => v != null
          ) as [string, string][]
        )
      );
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error ?? "Erro ao carregar leads");
        return;
      }
      const data: Lead[] = await res.json();
      // Ordenar por createdAt decrescente
      setLeads(
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setError("Falha de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters?.platform, filters?.status]);

  return { leads, loading, error, refetch: fetchLeads };
}
