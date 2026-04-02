"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Página de configurações - credenciais de API
 */
export default function Settings() {
  const [apifyToken, setApifyToken] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [configured, setConfigured] = useState({
    apify: false,
    gemini: false,
  });

  useEffect(() => {
    // Verificar status das credenciais
    const checkConfig = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setConfigured({
          apify: data.apifyConfigured,
          gemini: data.geminiConfigured,
        });
      } catch {
        console.error("Falha ao verificar configurações");
      }
    };

    checkConfig();
  }, []);

  const handleSave = async () => {
    if (!apifyToken.trim() || !geminiApiKey.trim()) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apifyToken: apifyToken.trim(),
          geminiApiKey: geminiApiKey.trim(),
        }),
      });

      if (!res.ok) {
        const { error: errorMsg } = await res.json();
        setError(errorMsg ?? "Falha ao salvar");
        return;
      }

      setSuccess(true);
      setApifyToken("");
      setGeminiApiKey("");

      // Recarregar configuração
      const checkRes = await fetch("/api/settings");
      const checkData = await checkRes.json();
      setConfigured({
        apify: checkData.apifyConfigured,
        gemini: checkData.geminiConfigured,
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Falha de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Configurações
          </h1>

          {/* Status das credenciais */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Status das Credenciais
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Apify API</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    configured.apify
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {configured.apify ? "✓ Configurada" : "◯ Não configurada"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gemini API</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    configured.gemini
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {configured.gemini ? "✓ Configurada" : "◯ Não configurada"}
                </span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apify Token
              </label>
              <Input
                type="password"
                placeholder="Cole seu token da API Apify"
                value={apifyToken}
                onChange={(e) => setApifyToken(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtém em{" "}
                <a
                  href="https://console.apify.com/account/integrations/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  console.apify.com
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemini API Key
              </label>
              <Input
                type="password"
                placeholder="Cole sua API Key do Google AI Studio"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtém em{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  aistudio.google.com/app/apikey
                </a>
              </p>
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
                ✓ Configurações salvas com sucesso!
              </div>
            )}

            {/* Botão */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading || (!apifyToken.trim() && !geminiApiKey.trim())}
                className="w-full"
              >
                {loading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
