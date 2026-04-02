import { useState } from "react";

/**
 * Hook para gerar mensagens de lead via API
 */
export function useGenerateMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMessage = async (leadId: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/generate-message`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error ?? "Falha ao gerar mensagem");
        return "";
      }
      const data: { message: string } = await res.json();
      return data.message;
    } catch {
      setError("Falha de conexão com o servidor");
      return "";
    } finally {
      setLoading(false);
    }
  };

  return { generateMessage, loading, error };
}
