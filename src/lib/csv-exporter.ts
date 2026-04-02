import type { Lead } from "@/types/lead";

/**
 * Escapa valores CSV com aspas duplas se necessário
 */
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converte array de leads para string CSV
 */
export function leadsToCSV(leads: Lead[]): string {
  const headers = ["Nome", "Plataforma", "URL", "Status", "Mensagem", "Data"];
  const rows = leads.map((lead) => [
    escapeCsvValue(lead.name),
    escapeCsvValue(lead.platform),
    escapeCsvValue(lead.profileUrl),
    escapeCsvValue(lead.status),
    escapeCsvValue(lead.message ?? ""),
    escapeCsvValue(lead.createdAt),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}
