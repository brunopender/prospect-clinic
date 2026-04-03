import { NextRequest, NextResponse } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";
import { generateMessage } from "@/lib/gemini-service";
import type {
  BatchGenerateRequest,
  BatchGenerateResult,
} from "@/types/messages";

/**
 * POST /api/leads/generate-messages
 * Generate personalized messages for multiple leads in batch
 *
 * Request body:
 * {
 *   "ids": ["id1", "id2"] (optional),
 *   "all": true (optional - process all without messages),
 *   "force": true (optional - regenerate even if message exists)
 * }
 *
 * Response (200):
 * {
 *   "processed": number,
 *   "errors": number,
 *   "details": [{ "leadId": string, "success": boolean, "error"?: string }]
 * }
 *
 * Error responses:
 * - 400: { "error": "Forneça 'ids' ou 'all: true'" }
 * - 500: { "error": "error message" }
 */
export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerateRequest = await request.json();

    // Validate that either ids or all is provided
    if (!body.ids && !body.all) {
      return NextResponse.json(
        { error: "Forneça 'ids' ou 'all: true'" },
        { status: 400 }
      );
    }

    // Fetch leads to process
    let leads: Awaited<ReturnType<typeof leadsRepository.getAll>> = [];

    if (body.all) {
      // Get all leads
      leads = await leadsRepository.getAll();
    } else if (body.ids && body.ids.length > 0) {
      // Get leads by IDs
      const leadResults = [];
      for (const id of body.ids) {
        const lead = await leadsRepository.getById(id);
        if (lead) {
          leadResults.push(lead);
        }
      }
      leads = leadResults;
    }

    // Filter out leads that already have messages (unless force: true)
    if (!body.force) {
      leads = leads.filter((lead) => lead.message === null);
    }

    // Process leads sequentially to respect Gemini rate limit (15 RPM)
    const result: BatchGenerateResult = { processed: 0, errors: 0, details: [] };

    for (const lead of leads) {
      try {
        // Generate message
        const message = await generateMessage(lead);

        // Save message to lead
        await leadsRepository.updateById(lead.id, { message });

        // Record success
        result.processed++;
        result.details.push({ leadId: lead.id, success: true });
      } catch (error) {
        // Record error
        result.errors++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        result.details.push({
          leadId: lead.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Log error for debugging
    console.error("[POST /api/leads/generate-messages]", error);

    // Return error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Batch generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
