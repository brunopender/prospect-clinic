import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ScrapeRequest } from "@/types/scrape";
import { scrapeProspects } from "@/lib/apify-service";

describe("ApifyService", () => {
  beforeEach(() => {
    delete process.env.APIFY_TOKEN;
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.APIFY_TOKEN;
    vi.restoreAllMocks();
  });

  it("should throw error when APIFY_TOKEN is not set", async () => {
    const request: ScrapeRequest = {
      platform: "instagram",
      keyword: "test",
      limit: 10,
    };

    await expect(scrapeProspects(request)).rejects.toThrow(
      "APIFY_TOKEN environment variable is not set"
    );
  });

  it("should throw error for unsupported platform", async () => {
    process.env.APIFY_TOKEN = "test-token";

    const request: ScrapeRequest = {
      platform: "tiktok" as unknown as "instagram" | "linkedin",
      keyword: "test",
      limit: 10,
    };

    await expect(scrapeProspects(request)).rejects.toThrow(
      "Unsupported platform: tiktok"
    );
  });

  it("should normalize Instagram data correctly", async () => {
    process.env.APIFY_TOKEN = "test-token";

    const mockInstagramData = [
      {
        fullName: "John Dentist",
        url: "https://instagram.com/johndentist",
        biography: "Professional dentist",
        followersCount: 5000,
      },
      {
        name: "Jane Clinic",
        profileUrl: "https://instagram.com/janeclinic",
        summary: "Aesthetic clinic",
        connectionsCount: 3000,
      },
    ];

    // Mock the run API call
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: "run-123", defaultDatasetId: "dataset-123", status: "SUCCEEDED" },
        }),
      })
      // Mock the status check
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { status: "SUCCEEDED" },
        }),
      })
      // Mock the items fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInstagramData,
      });

    const request: ScrapeRequest = {
      platform: "instagram",
      keyword: "clínica odontológica",
      limit: 10,
    };

    const results = await scrapeProspects(request);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      name: "John Dentist",
      profileUrl: "https://instagram.com/johndentist",
      platform: "instagram",
      bio: "Professional dentist",
      followersCount: 5000,
    });
    expect(results[1]).toEqual({
      name: "Jane Clinic",
      profileUrl: "https://instagram.com/janeclinic",
      platform: "instagram",
      bio: "Aesthetic clinic",
      followersCount: 3000,
    });
  });

  it("should normalize LinkedIn data correctly", async () => {
    process.env.APIFY_TOKEN = "test-token";

    const mockLinkedInData = [
      {
        fullName: "Dr. Silva",
        url: "https://linkedin.com/in/drsilva",
        summary: "Dental surgeon",
        connectionsCount: 500,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: "run-456", defaultDatasetId: "dataset-456", status: "SUCCEEDED" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { status: "SUCCEEDED" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLinkedInData,
      });

    const request: ScrapeRequest = {
      platform: "linkedin",
      keyword: "dentista",
      limit: 20,
    };

    const results = await scrapeProspects(request);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      name: "Dr. Silva",
      profileUrl: "https://linkedin.com/in/drsilva",
      platform: "linkedin",
      bio: "Dental surgeon",
      followersCount: 500,
    });
  });

  it("should handle fallback values for missing fields", async () => {
    process.env.APIFY_TOKEN = "test-token";

    const mockDataWithMissingFields = [
      {
        url: "https://instagram.com/user",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: "run-789", defaultDatasetId: "dataset-789", status: "SUCCEEDED" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { status: "SUCCEEDED" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataWithMissingFields,
      });

    const request: ScrapeRequest = {
      platform: "instagram",
      keyword: "test",
      limit: 10,
    };

    const results = await scrapeProspects(request);

    expect(results[0]).toEqual({
      name: "",
      profileUrl: "https://instagram.com/user",
      platform: "instagram",
      bio: "",
      followersCount: 0,
    });
  });

  it("should throw error when Apify API fails", async () => {
    process.env.APIFY_TOKEN = "test-token";

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    const request: ScrapeRequest = {
      platform: "instagram",
      keyword: "test",
      limit: 10,
    };

    await expect(scrapeProspects(request)).rejects.toThrow(
      "Apify scraping failed: Failed to start Actor run"
    );
  });
});
