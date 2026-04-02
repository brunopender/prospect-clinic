import type { Lead, Platform } from "./lead";

/**
 * Request body for scraping prospects from social media platforms
 */
export interface ScrapeRequest {
  /** Social media platform: "instagram" or "linkedin" */
  platform: Platform;
  /** Search keyword/term (e.g., "clínica odontológica") */
  keyword: string;
  /** Number of results to fetch (10-100) */
  limit: number;
}

/**
 * Response from the scraping API endpoint
 */
export interface ScrapeResult {
  /** Number of leads successfully imported */
  imported: number;
  /** Number of leads skipped (duplicates, invalid data) */
  skipped: number;
  /** Number of leads that failed to import */
  errors: number;
  /** Array of imported Lead objects */
  leads: Lead[];
}
