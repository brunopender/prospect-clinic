import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ScrapeRequest } from "@/types/scrape";

// Mock the apify-client module - must be before import
const mockListItems = vi.fn();
const mockCall = vi.fn();

vi.mock("apify-client", () => {
  return {
    ApifyClient: vi.fn(function mockApifyClient() {
      return {
        actor: vi.fn(() => ({
          call: mockCall,
        })),
        dataset: vi.fn(() => ({
          listItems: mockListItems,
        })),
      };
    }),
  };
});

// Import after mocking
import { scrapeProspects } from "@/lib/apify-service";

describe("ApifyService", () => {
  beforeEach(() => {
    // Clear environment variable before each test
    delete process.env.APIFY_TOKEN;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.APIFY_TOKEN;
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

    mockCall.mockResolvedValue({
      defaultDatasetId: "dataset-123",
    });

    mockListItems.mockResolvedValue({ items: mockInstagramData });

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

    mockCall.mockResolvedValue({
      defaultDatasetId: "dataset-456",
    });

    mockListItems.mockResolvedValue({ items: mockLinkedInData });

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
        // Missing fullName and name - should use ""
        url: "https://instagram.com/user",
        // Missing biography and summary - should use ""
        // Missing followersCount and connectionsCount - should use 0
      },
    ];

    mockCall.mockResolvedValue({
      defaultDatasetId: "dataset-789",
    });

    mockListItems.mockResolvedValue({ items: mockDataWithMissingFields });

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

    mockCall.mockRejectedValue(new Error("API rate limit exceeded"));

    const request: ScrapeRequest = {
      platform: "instagram",
      keyword: "test",
      limit: 10,
    };

    await expect(scrapeProspects(request)).rejects.toThrow(
      "Apify scraping failed: API rate limit exceeded"
    );
  });
});
