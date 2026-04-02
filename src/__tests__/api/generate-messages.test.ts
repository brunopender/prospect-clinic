import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/leads-repository", () => ({
  leadsRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/gemini-service", () => ({
  generateMessage: vi.fn(),
}));

import { POST } from "@/app/api/leads/generate-messages/route";
import { NextRequest } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";
import { generateMessage } from "@/lib/gemini-service";
import type { Lead } from "@/types/lead";

const mockGetAll = leadsRepository.getAll as ReturnType<typeof vi.fn>;
const mockGetById = leadsRepository.getById as ReturnType<typeof vi.fn>;
const mockUpdate = leadsRepository.update as ReturnType<typeof vi.fn>;
const mockGenerateMessage = generateMessage as ReturnType<typeof vi.fn>;

describe("Batch Generate Messages", () => {
  beforeEach(() => {
    mockGetAll.mockClear();
    mockGetById.mockClear();
    mockUpdate.mockClear();
    mockGenerateMessage.mockClear();
  });

  it("should return error when neither ids nor all provided", async () => {
    const request = new NextRequest("http://localhost/api/leads/generate-messages", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("ids");
  });

  it("should process all leads when all: true", async () => {
    const testLeads: Lead[] = [
      {
        id: "1",
        name: "Lead 1",
        profileUrl: "https://instagram.com/lead1",
        platform: "instagram",
        bio: "Bio 1",
        followersCount: 100,
        status: "novo",
        message: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Lead 2",
        profileUrl: "https://instagram.com/lead2",
        platform: "instagram",
        bio: "Bio 2",
        followersCount: 200,
        status: "novo",
        message: null,
        createdAt: new Date().toISOString(),
      },
    ];

    mockGetAll.mockResolvedValue(testLeads);
    mockGenerateMessage.mockResolvedValue("Generated message");
    mockUpdate.mockResolvedValue({ message: "Generated message" });

    const request = new NextRequest("http://localhost/api/leads/generate-messages", {
      method: "POST",
      body: JSON.stringify({ all: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.processed).toBe(2);
    expect(data.errors).toBe(0);
    expect(data.details).toHaveLength(2);
  });

  it("should skip leads with existing messages unless force: true", async () => {
    const testLeads: Lead[] = [
      {
        id: "1",
        name: "Lead 1",
        profileUrl: "https://instagram.com/lead1",
        platform: "instagram",
        bio: "Bio 1",
        followersCount: 100,
        status: "novo",
        message: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Lead 2",
        profileUrl: "https://instagram.com/lead2",
        platform: "instagram",
        bio: "Bio 2",
        followersCount: 200,
        status: "novo",
        message: "Existing message",
        createdAt: new Date().toISOString(),
      },
    ];

    mockGetAll.mockResolvedValue(testLeads);
    mockGenerateMessage.mockResolvedValue("Generated message");

    const request = new NextRequest("http://localhost/api/leads/generate-messages", {
      method: "POST",
      body: JSON.stringify({ all: true }),
    });

    const response = await POST(request);

    const data = await response.json();
    expect(data.processed).toBe(1);
    expect(data.details).toHaveLength(1);
  });

  it("should handle errors gracefully", async () => {
    const testLeads: Lead[] = [
      {
        id: "1",
        name: "Lead 1",
        profileUrl: "https://instagram.com/lead1",
        platform: "instagram",
        bio: "Bio 1",
        followersCount: 100,
        status: "novo",
        message: null,
        createdAt: new Date().toISOString(),
      },
    ];

    mockGetAll.mockResolvedValue(testLeads);
    mockGenerateMessage.mockRejectedValue(new Error("API error"));

    const request = new NextRequest("http://localhost/api/leads/generate-messages", {
      method: "POST",
      body: JSON.stringify({ all: true }),
    });

    const response = await POST(request);

    const data = await response.json();
    expect(data.errors).toBe(1);
    expect(data.details[0].success).toBe(false);
  });

  it("should process specific leads when ids provided", async () => {
    const testLead: Lead = {
      id: "1",
      name: "Lead 1",
      profileUrl: "https://instagram.com/lead1",
      platform: "instagram",
      bio: "Bio 1",
      followersCount: 100,
      status: "novo",
      message: null,
      createdAt: new Date().toISOString(),
    };

    mockGetById.mockResolvedValue(testLead);
    mockGenerateMessage.mockResolvedValue("Generated message");

    const request = new NextRequest("http://localhost/api/leads/generate-messages", {
      method: "POST",
      body: JSON.stringify({ ids: ["1"] }),
    });

    const response = await POST(request);

    const data = await response.json();
    expect(data.processed).toBe(1);
  });
});
