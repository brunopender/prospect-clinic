import { NextRequest, NextResponse } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";
import { generateMessage } from "@/lib/gemini-service";

/**
 * POST /api/leads/[id]/generate-message
 * Generate a personalized message for a lead using Gemini API
 *
 * Path parameters:
 * - id: UUID of the lead
 *
 * Response (200):
 * { "message": "generated message text" }
 *
 * Error responses:
 * - 404: { "error": "Lead não encontrado" }
 * - 500: { "error": "error message" }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 16+)
    const { id } = await params;

    // Get lead by ID
    const lead = await leadsRepository.getById(id);

    // Return 404 if lead not found
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Generate message using Gemini API
    const message = await generateMessage(lead);

    // Save message to lead
    await leadsRepository.updateById(id, { message });

    // Return generated message
    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    // Log error for debugging
    console.error("[POST /api/leads/[id]/generate-message]", error);

    // Return error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to generate message: ${errorMessage}` },
      { status: 500 }
    );
  }
}
