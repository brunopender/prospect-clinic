import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Lead } from "@/types/lead";

// Initialize Google Generative AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Get the generative model - using gemini-1.5-flash for speed and cost efficiency
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Timeout in milliseconds (default: 10 seconds)
const TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS ?? "10000", 10);

/**
 * Build a prompt for Gemini to generate a personalized message for a lead
 * @param lead Lead object with name, bio, platform, and followersCount
 * @returns Formatted prompt string
 */
function buildPrompt(lead: Lead): string {
  return `Você é um especialista em prospecção B2B para clínicas de saúde e estética no Brasil.

Escreva uma mensagem de primeiro contato para o seguinte prospect no ${lead.platform}:
- Nome: ${lead.name}
- Bio: ${lead.bio}
- Seguidores: ${lead.followersCount}

A mensagem deve:
- Ter no máximo 150 palavras
- Ser pessoal e mencionar algo específico do perfil
- Apresentar brevemente soluções de IA para clínicas
- Ter um call-to-action para uma conversa de 15 minutos
- Soar natural, não robótica

Escreva apenas a mensagem, sem explicações.`;
}

/**
 * Generate a personalized message for a lead using Gemini API
 * @param lead Lead object with all required fields
 * @returns Generated message string
 * @throws Error if API fails or timeout occurs
 */
export async function generateMessage(lead: Lead): Promise<string> {
  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Create a timeout promise that rejects after TIMEOUT_MS
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini message generation timeout")), TIMEOUT_MS)
  );

  // Create the generation promise
  const generatePromise = model
    .generateContent(buildPrompt(lead))
    .then((response) => response.response.text());

  // Race the generation against the timeout
  try {
    return await Promise.race([generatePromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
    throw error;
  }
}
