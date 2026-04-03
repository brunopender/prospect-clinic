import type { ScrapeRequest } from "@/types/scrape";
import type { Lead } from "@/types/lead";

// Actor IDs for each platform - using correct Apify syntax with tilde
const ACTORS: Record<string, string> = {
  instagram: "apify~instagram-profile-scraper",
  linkedin: "apify~linkedin-profile-scraper",
};

const APIFY_API_BASE = "https://api.apify.com/v2";

/**
 * Scrape prospects from Instagram or LinkedIn using Apify Actors
 * Uses Apify REST API directly to avoid bundler issues
 * @param request - ScrapeRequest with platform, keyword, and limit
 * @returns Array of normalized Lead objects with partial data
 * @throws Error if Apify API fails or token is missing
 */
export async function scrapeProspects(
  request: ScrapeRequest
): Promise<Partial<Lead>[]> {
  // Validate that API token exists
  if (!process.env.APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN environment variable is not set");
  }

  // Get the appropriate Actor ID for the requested platform
  const actorId = ACTORS[request.platform];
  if (!actorId) {
    throw new Error(`Unsupported platform: ${request.platform}`);
  }

  try {
    // Prepare input based on platform
    let inputPayload: Record<string, unknown>;

    if (request.platform === "instagram") {
      inputPayload = {
        usernames: [request.keyword],
        maxResults: request.limit,
      };
    } else {
      // LinkedIn
      inputPayload = {
        searchTerms: [request.keyword],
        maxResults: request.limit,
      };
    }

    // Start the Actor run using REST API
    const runResponse = await fetch(
      `${APIFY_API_BASE}/acts/${actorId}/runs?token=${process.env.APIFY_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputPayload),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(
        `Failed to start Actor run: ${runResponse.status} - ${errorText}`
      );
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;

    // Wait for the run to complete (with timeout)
    let isRunning = true;
    let attempts = 0;
    const maxAttempts = 360; // 30 minutes max with 5-second intervals

    while (isRunning && attempts < maxAttempts) {
      const statusResponse = await fetch(
        `${APIFY_API_BASE}/actor-runs/${runId}?token=${process.env.APIFY_TOKEN}`
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to check run status: ${statusResponse.status} ${statusResponse.statusText}`
        );
      }

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === "SUCCEEDED" || status === "FAILED") {
        isRunning = false;
        if (status === "FAILED") {
          throw new Error(`Actor run failed: ${statusData.data.error || "Unknown error"}`);
        }
      } else {
        // Wait 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    if (isRunning) {
      throw new Error("Actor run timed out after 30 minutes");
    }

    // Fetch results from the dataset
    const itemsResponse = await fetch(
      `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`
    );

    if (!itemsResponse.ok) {
      throw new Error(
        `Failed to fetch dataset items: ${itemsResponse.status} ${itemsResponse.statusText}`
      );
    }

    const items = await itemsResponse.json();

    // Normalize the results to match our Lead interface
    return items.map((item: Record<string, unknown>) => ({
      name: (item.fullName as string) ?? (item.name as string) ?? (item.title as string) ?? "",
      profileUrl: (item.url as string) ?? (item.profileUrl as string) ?? (item.link as string) ?? "",
      platform: request.platform,
      bio: (item.biography as string) ?? (item.summary as string) ?? (item.about as string) ?? "",
      followersCount:
        (item.followersCount as number) ?? (item.connectionsCount as number) ?? (item.followers as number) ?? 0,
    }));
  } catch (error) {
    // Re-throw with context for debugging
    if (error instanceof Error) {
      throw new Error(`Apify scraping failed: ${error.message}`);
    }
    throw error;
  }
}
