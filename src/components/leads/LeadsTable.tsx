"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import type { Lead } from "@/types/lead";

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  onLeadClick: (lead: Lead) => void;
}

/**
 * Tabela para exibição de leads
 */
export function LeadsTable({ leads, loading, onLeadClick }: LeadsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Carregando leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Nenhum lead encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data de Captura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell>{lead.name}</TableCell>
              <TableCell className="capitalize">{lead.platform}</TableCell>
              <TableCell>
                <StatusBadge status={lead.status} />
              </TableCell>
              <TableCell>{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
