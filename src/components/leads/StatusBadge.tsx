import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types/lead";

interface StatusBadgeProps {
  status: LeadStatus;
}

const statusVariants: Record<LeadStatus, "default" | "secondary" | "destructive" | "outline"> = {
  novo: "default",
  contatado: "secondary",
  respondeu: "outline",
  fechado: "destructive",
  descartado: "secondary",
};

const statusLabels: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  fechado: "Fechado",
  descartado: "Descartado",
};

/**
 * Badge visual para status de lead
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>;
}
