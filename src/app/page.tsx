"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadSheet } from "@/components/leads/LeadSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { ScrapeModal } from "@/components/leads/ScrapeModal";
import type { Lead, LeadStatus, Platform } from "@/types/lead";

/**
 * Página principal - Dashboard de leads
 */
export default function Home() {
  const [filters, setFilters] = useState<{
    platform?: Platform;
    status?: LeadStatus;
  }>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);

  const { leads, loading, error } = useLeads(filters);

  // Calcular contadores
  const totalLeads = leads.length;
  const leadsWithMessage = leads.filter((l) => l.message !== null).length;
  const statusCounts: Record<LeadStatus, number> = {
    novo: 0,
    contatado: 0,
    respondeu: 0,
    fechado: 0,
    descartado: 0,
  };

  leads.forEach((lead) => {
    statusCounts[lead.status]++;
  });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleFilterChange = (key: "platform" | "status", value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value as Platform | LeadStatus | undefined,
    }));
  };

  const handleExportCSV = async () => {
    const params = new URLSearchParams();
    if (filters.platform) params.append("platform", filters.platform);
    if (filters.status) params.append("status", filters.status);

    const url = `/api/leads/export?${params.toString()}`;
    const link = document.createElement("a");
    link.href = url;
    link.click();
  };

  const handleScrapeComplete = () => {
    // Recarregar leads
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total de Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalLeads}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Com Mensagem</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{leadsWithMessage}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Status: Novo</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{statusCounts.novo}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Responderam</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{statusCounts.respondeu}</p>
          </div>
        </div>

        {/* Filtros e Ações */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-8">
          <div className="flex justify-between items-end gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filtros
              </label>
              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma
              </label>
              <Select
                value={filters.platform || ""}
                onValueChange={(value) =>
                  handleFilterChange("platform", value || null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  handleFilterChange("status", value || null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="respondeu">Respondeu</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setScrapeModalOpen(true)}>
                🔍 Nova Busca
              </Button>
              <Button onClick={handleExportCSV} variant="outline">
                📥 Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}
        <LeadsTable
          leads={leads}
          loading={loading}
          onLeadClick={handleLeadClick}
        />

        {/* Sheet lateral */}
        <LeadSheet
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onMessageGenerated={(newMessage) => {
            if (selectedLead) {
              setSelectedLead({ ...selectedLead, message: newMessage });
            }
          }}
        />

        {/* Modal de scraping */}
        <ScrapeModal
          open={scrapeModalOpen}
          onClose={() => setScrapeModalOpen(false)}
          onScrapeComplete={handleScrapeComplete}
        />
      </main>
    </div>
  );
}
