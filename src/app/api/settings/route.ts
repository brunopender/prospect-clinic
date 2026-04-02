import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

const ENV_LOCAL_PATH = ".env.local";

/**
 * GET /api/settings - Retorna status das credenciais (mascaradas)
 */
export async function GET() {
  try {
    const hasApifyToken = !!process.env.APIFY_TOKEN;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
      apifyConfigured: hasApifyToken,
      geminiConfigured: hasGeminiKey,
    });
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json(
      { error: "Falha ao verificar configurações" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings - Salva credenciais em .env.local
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apifyToken, geminiApiKey } = body;

    if (!apifyToken || !geminiApiKey) {
      return NextResponse.json(
        { error: "Credenciais ausentes" },
        { status: 400 }
      );
    }

    // Ler arquivo existente ou criar novo
    let envContent = "";
    if (existsSync(ENV_LOCAL_PATH)) {
      envContent = await readFile(ENV_LOCAL_PATH, "utf-8");
    }

    // Atualizar variáveis (substituindo ou adicionando)
    const lines = envContent.split("\n").filter((line) => line.trim());

    const updateOrAdd = (key: string, value: string) => {
      let found = false;
      const newLines = lines.map((line) => {
        if (line.startsWith(`${key}=`)) {
          found = true;
          return `${key}=${value}`;
        }
        return line;
      });
      if (!found) {
        newLines.push(`${key}=${value}`);
      }
      return newLines;
    };

    let finalLines = lines;
    finalLines = updateOrAdd("APIFY_TOKEN", apifyToken);
    finalLines = updateOrAdd("GEMINI_API_KEY", geminiApiKey);

    // Escrever de volta
    await writeFile(ENV_LOCAL_PATH, finalLines.join("\n"), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso",
    });
  } catch (error) {
    console.error("[POST /api/settings]", error);
    return NextResponse.json(
      { error: "Falha ao salvar configurações" },
      { status: 500 }
    );
  }
}
