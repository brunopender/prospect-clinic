import { NextRequest, NextResponse } from "next/server";
import { scrapeProspects } from "@/lib/apify-service";
import { leadsRepository } from "@/lib/leads-repository";
import type { ScrapeRequest } from "@/types/scrape";

/**
 * POST /api/scrape
 * Scrapes prospects from Instagram or LinkedIn
 *
 * Request body:
 * {
 *   "platform": "instagram" | "linkedin",
 *   "keyword": "search term",
 *   "limit": number (10-100)
 * }
 *
 * Success response (200):
 * { "leads": [...], "count": number }
 *
 * Error response (400|500):
 * { "error": "error message" }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate platform
    if (!body.platform || !["instagram", "linkedin"].includes(body.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "instagram" or "linkedin"' },
        { status: 400 }
      );
    }

    // Validate keyword
    if (!body.keyword || typeof body.keyword !== "string" || body.keyword.trim() === "") {
      return NextResponse.json(
        { error: "Keyword must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate limit
    if (
      typeof body.limit !== "number" ||
      body.limit < 10 ||
      body.limit > 100
    ) {
      return NextResponse.json(
        { error: "Limit must be a number between 10 and 100" },
        { status: 400 }
      );
    }

    // Create request object
    const scrapeRequest: ScrapeRequest = {
      platform: body.platform,
      keyword: body.keyword.trim(),
      limit: body.limit,
    };

    // Call Apify service to get raw scraped leads
    const scrapedLeads = await scrapeProspects(scrapeRequest);

    // Save leads to repository and track import results
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const savedLeads = [];

    for (const lead of scrapedLeads) {
      try {
        // Validate platform is valid
        if (!lead.platform || !["instagram", "linkedin"].includes(lead.platform)) {
          errors++;
          continue;
        }

        // Ensure all required fields are present (cast to full Lead without id/status/message/createdAt)
        const leadForUpsert = {
          name: lead.name || "",
          profileUrl: lead.profileUrl || "",
          platform: lead.platform as "instagram" | "linkedin",
          bio: lead.bio || "",
          followersCount: lead.followersCount || 0,
        };

        const result = await leadsRepository.upsert(leadForUpsert);
        if (result.inserted) {
          imported++;
          // Get the full saved lead object
          const allLeads = await leadsRepository.getAll();
          const savedLead = allLeads.find(
            (l) => l.profileUrl === leadForUpsert.profileUrl
          );
          if (savedLead) {
            savedLeads.push(savedLead);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error("[POST /api/scrape] Lead save error:", error);
      }
    }

    // Return results with import statistics
    return NextResponse.json(
      {
        imported,
        skipped,
        errors,
        leads: savedLeads,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging
    console.error("[POST /api/scrape]", error);

    // Return error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Scraping failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
