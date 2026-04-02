"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateMessage } from "@/hooks/useGenerateMessage";
import type { Lead } from "@/types/lead";

interface LeadSheetProps {
  lead: Lead | null;
  onClose: () => void;
  onMessageGenerated: (newMessage: string) => void;
}

/**
 * Sheet lateral para exibir detalhes do lead e gerar/copiar mensagem
 */
export function LeadSheet({
  lead,
  onClose,
  onMessageGenerated,
}: LeadSheetProps) {
  const { generateMessage, loading, error } = useGenerateMessage();
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const handleGenerate = async () => {
    const message = await generateMessage(lead.id);
    if (message) {
      onMessageGenerated(message);
    }
  };

  const handleCopy = async () => {
    if (lead.message) {
      try {
        await navigator.clipboard.writeText(lead.message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error("Falha ao copiar");
      }
    }
  };

  return (
    <Sheet open={!!lead} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lead.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Link para perfil */}
          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm block"
          >
            Ver perfil no {lead.platform} ↗
          </a>

          {/* Bio */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Bio</p>
            <p className="text-sm text-gray-600">{lead.bio}</p>
          </div>

          {/* Seguidores */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Seguidores
            </p>
            <p className="text-sm text-gray-600">
              {lead.followersCount.toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Plataforma
            </p>
            <p className="text-sm text-gray-600 capitalize">{lead.platform}</p>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Status</p>
            <p className="text-sm text-gray-600 capitalize">{lead.status}</p>
          </div>

          {/* Mensagem */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Mensagem Personalizada
            </p>

            {lead.message ? (
              <>
                <Textarea
                  value={lead.message}
                  readOnly
                  className="h-32 text-sm resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    variant={copied ? "outline" : "default"}
                  >
                    {copied ? "✓ Copiada!" : "Copiar"}
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    {loading ? "Regenerando..." : "Regenerar"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Nenhuma mensagem gerada ainda
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  size="sm"
                  className="w-full"
                >
                  {loading ? "Gerando..." : "Gerar Mensagem Agora"}
                </Button>
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
