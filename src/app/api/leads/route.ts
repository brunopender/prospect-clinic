import { NextRequest, NextResponse } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";
import type { Lead } from "@/types/lead";

/**
 * GET /api/leads
 * Retrieve stored leads with optional filtering
 *
 * Query parameters:
 * - platform: "instagram" | "linkedin" (optional)
 * - status: "novo" | "contatado" | "respondeu" | "fechado" | "descartado" (optional)
 *
 * Response (200):
 * { "leads": Lead[] }
 *
 * Error response (500):
 * { "error": "error message" }
 */
export async function GET(request: NextRequest) {
  try {
    // Extract filter parameters from query string
    const platform = request.nextUrl.searchParams.get("platform");
    const status = request.nextUrl.searchParams.get("status");

    // Build filters object
    const filters: Partial<Pick<Lead, "platform" | "status">> = {};

    if (platform && ["instagram", "linkedin"].includes(platform)) {
      filters.platform = platform as "instagram" | "linkedin";
    }

    if (
      status &&
      [
        "novo",
        "contatado",
        "respondeu",
        "fechado",
        "descartado",
      ].includes(status)
    ) {
      filters.status = status as Lead["status"];
    }

    // Retrieve leads with optional filters
    const leads = await leadsRepository.getAll(filters);

    // Return leads array directly
    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    // Log error for debugging
    console.error("[GET /api/leads]", error);

    // Return error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to retrieve leads: ${errorMessage}` },
      { status: 500 }
    );
  }
}
