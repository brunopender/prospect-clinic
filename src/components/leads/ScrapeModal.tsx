"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Platform } from "@/types/lead";

interface ScrapeModalProps {
  open: boolean;
  onClose: () => void;
  onScrapeComplete: () => void;
}

/**
 * Modal para acionar nova busca de prospects
 */
export function ScrapeModal({
  open,
  onClose,
  onScrapeComplete,
}: ScrapeModalProps) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleScrape = async () => {
    if (!keyword.trim()) {
      setError("Digite uma palavra-chave");
      return;
    }
    if (limit < 10 || limit > 100) {
      setError("Limite entre 10 e 100");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, keyword, limit }),
      });

      if (!res.ok) {
        const { error: errorMsg } = await res.json();
        setError(errorMsg ?? "Falha no scraping");
        return;
      }

      const result = await res.json();
      setSuccess(true);

      setTimeout(() => {
        onScrapeComplete();
        onClose();
      }, 2000);
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setKeyword("");
      setLimit(10);
      setError(null);
      setSuccess(false);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Busca de Prospects</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plataforma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plataforma
            </label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Palavra-chave / Nicho
            </label>
            <Input
              placeholder="ex: clínica odontológica, consultório estético"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade ({limit})
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Entre 10 e 100 prospects</p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
              ✓ Busca concluída! Atualizando lista...
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleScrape} disabled={loading || !keyword.trim()}>
              {loading ? "Buscando..." : "Buscar Prospects"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
