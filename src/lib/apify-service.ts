import { ApifyClient } from "apify-client";
import type { ScrapeRequest } from "@/types/scrape";
import type { Lead } from "@/types/lead";

// Actor IDs for each platform
const ACTORS: Record<string, string> = {
  instagram: "apify/instagram-profile-scraper",
  linkedin: "apify/linkedin-profile-scraper",
};

// Initialize Apify client with token from environment
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

/**
 * Scrape prospects from Instagram or LinkedIn using Apify Actors
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
    // Call the Actor with the search term and result limit
    const run = await client.actor(actorId).call({
      searchTerms: [request.keyword],
      maxItems: request.limit,
    });

    // Fetch results from the default dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Normalize the results to match our Lead interface
    return items.map((item: Record<string, unknown>) => ({
      name: (item.fullName as string) ?? (item.name as string) ?? "",
      profileUrl: (item.url as string) ?? (item.profileUrl as string) ?? "",
      platform: request.platform,
      bio: (item.biography as string) ?? (item.summary as string) ?? "",
      followersCount:
        (item.followersCount as number) ?? (item.connectionsCount as number) ?? 0,
    }));
  } catch (error) {
    // Re-throw with context for debugging
    if (error instanceof Error) {
      throw new Error(`Apify scraping failed: ${error.message}`);
    }
    throw error;
  }
}
