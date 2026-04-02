import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { leadsRepository } from "@/lib/leads-repository";
import { rm } from "fs/promises";
import { existsSync } from "fs";

const DATA_PATH = "data/leads.json";

describe("LeadsRepository", () => {
  beforeEach(async () => {
    // Clean up real data file before each test to isolate tests
    if (existsSync(DATA_PATH)) {
      await rm(DATA_PATH);
    }
  });

  afterEach(async () => {
    // Clean up real data file after each test
    if (existsSync(DATA_PATH)) {
      await rm(DATA_PATH);
    }
  });

  it("should return empty store when file does not exist", async () => {
    const leads = await leadsRepository.getAll();
    expect(leads).toEqual([]);
  });

  it("should insert a new lead via upsert", async () => {
    const newLead = {
      name: "Clínica Sorrir Bem",
      profileUrl: "https://instagram.com/clinicasorrirbe",
      platform: "instagram" as const,
      bio: "Professional dental clinic",
      followersCount: 3420,
    };

    const result = await leadsRepository.upsert(newLead);
    expect(result.inserted).toBe(true);

    // Verify the lead was saved
    const allLeads = await leadsRepository.getAll();
    expect(allLeads).toHaveLength(1);
    expect(allLeads[0]).toMatchObject({
      name: newLead.name,
      profileUrl: newLead.profileUrl,
      platform: newLead.platform,
      status: "novo",
      message: null,
    });
    expect(allLeads[0].id).toBeDefined();
    expect(allLeads[0].createdAt).toBeDefined();
  });

  it("should skip duplicate leads by profileUrl", async () => {
    const lead1 = {
      name: "Clínica A",
      profileUrl: "https://instagram.com/clinica-a",
      platform: "instagram" as const,
      bio: "Clinic A",
      followersCount: 1000,
    };

    const lead2 = {
      name: "Clínica A - Updated",
      profileUrl: "https://instagram.com/clinica-a", // Same URL
      platform: "instagram" as const,
      bio: "Updated info",
      followersCount: 2000,
    };

    const result1 = await leadsRepository.upsert(lead1);
    expect(result1.inserted).toBe(true);

    const result2 = await leadsRepository.upsert(lead2);
    expect(result2.inserted).toBe(false);

    // Verify only one lead exists with original data
    const allLeads = await leadsRepository.getAll();
    expect(allLeads).toHaveLength(1);
    expect(allLeads[0].name).toBe("Clínica A");
    expect(allLeads[0].followersCount).toBe(1000);
  });

  it("should filter leads by platform", async () => {
    const instaLead = {
      name: "Instagram Lead",
      profileUrl: "https://instagram.com/test",
      platform: "instagram" as const,
      bio: "Test",
      followersCount: 100,
    };

    const linkedinLead = {
      name: "LinkedIn Lead",
      profileUrl: "https://linkedin.com/in/test",
      platform: "linkedin" as const,
      bio: "Test",
      followersCount: 200,
    };

    await leadsRepository.upsert(instaLead);
    await leadsRepository.upsert(linkedinLead);

    const instaLeads = await leadsRepository.getAll({ platform: "instagram" });
    expect(instaLeads).toHaveLength(1);
    expect(instaLeads[0].platform).toBe("instagram");

    const linkedinLeads = await leadsRepository.getAll({
      platform: "linkedin",
    });
    expect(linkedinLeads).toHaveLength(1);
    expect(linkedinLeads[0].platform).toBe("linkedin");
  });

  it("should filter leads by status", async () => {
    const lead = {
      name: "Test Lead",
      profileUrl: "https://instagram.com/test",
      platform: "instagram" as const,
      bio: "Test",
      followersCount: 100,
    };

    await leadsRepository.upsert(lead);

    // New leads should have status "novo"
    const newLeads = await leadsRepository.getAll({ status: "novo" });
    expect(newLeads).toHaveLength(1);

    // No leads with other statuses
    const contactedLeads = await leadsRepository.getAll({
      status: "contatado",
    });
    expect(contactedLeads).toHaveLength(0);
  });

  it("should get lead by ID", async () => {
    const lead = {
      name: "Test Lead",
      profileUrl: "https://instagram.com/test",
      platform: "instagram" as const,
      bio: "Test",
      followersCount: 100,
    };

    await leadsRepository.upsert(lead);

    const allLeads = await leadsRepository.getAll();
    const leadId = allLeads[0].id;

    const foundLead = await leadsRepository.getById(leadId);
    expect(foundLead).not.toBeNull();
    expect(foundLead?.id).toBe(leadId);
    expect(foundLead?.name).toBe("Test Lead");
  });

  it("should return null when getting non-existent lead by ID", async () => {
    const foundLead = await leadsRepository.getById("non-existent-id");
    expect(foundLead).toBeNull();
  });

  it("should update a lead", async () => {
    const lead = {
      name: "Original Name",
      profileUrl: "https://instagram.com/test",
      platform: "instagram" as const,
      bio: "Original bio",
      followersCount: 100,
    };

    await leadsRepository.upsert(lead);
    const allLeads = await leadsRepository.getAll();
    const leadId = allLeads[0].id;

    // Update the lead
    const updated = await leadsRepository.update(leadId, {
      status: "contatado",
      message: "Test message",
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("contatado");
    expect(updated?.message).toBe("Test message");
    expect(updated?.name).toBe("Original Name"); // Original field preserved
  });

  it("should return null when updating non-existent lead", async () => {
    const updated = await leadsRepository.update("non-existent-id", {
      status: "contatado",
    });
    expect(updated).toBeNull();
  });

  it("should store all lead fields correctly", async () => {
    const lead = {
      name: "Full Test Lead",
      profileUrl: "https://instagram.com/fulltest",
      platform: "instagram" as const,
      bio: "This is a comprehensive bio",
      followersCount: 5000,
    };

    await leadsRepository.upsert(lead);
    const allLeads = await leadsRepository.getAll();
    const storedLead = allLeads[0];

    // Verify all required fields
    expect(storedLead.id).toBeDefined();
    expect(typeof storedLead.id).toBe("string");
    expect(storedLead.id.length).toBeGreaterThan(0);

    expect(storedLead.name).toBe(lead.name);
    expect(storedLead.profileUrl).toBe(lead.profileUrl);
    expect(storedLead.platform).toBe(lead.platform);
    expect(storedLead.bio).toBe(lead.bio);
    expect(storedLead.followersCount).toBe(lead.followersCount);

    expect(storedLead.status).toBe("novo");
    expect(storedLead.message).toBeNull();

    expect(storedLead.createdAt).toBeDefined();
    expect(typeof storedLead.createdAt).toBe("string");
  });

  it("should handle multiple leads in sequence", async () => {
    const leads = [
      {
        name: "Lead 1",
        profileUrl: "https://instagram.com/lead1",
        platform: "instagram" as const,
        bio: "Bio 1",
        followersCount: 100,
      },
      {
        name: "Lead 2",
        profileUrl: "https://instagram.com/lead2",
        platform: "instagram" as const,
        bio: "Bio 2",
        followersCount: 200,
      },
      {
        name: "Lead 3",
        profileUrl: "https://linkedin.com/in/lead3",
        platform: "linkedin" as const,
        bio: "Bio 3",
        followersCount: 300,
      },
    ];

    // Insert all leads
    for (const lead of leads) {
      const result = await leadsRepository.upsert(lead);
      expect(result.inserted).toBe(true);
    }

    // Verify all were saved
    const allLeads = await leadsRepository.getAll();
    expect(allLeads).toHaveLength(3);

    // Verify filtering
    const instaLeads = await leadsRepository.getAll({ platform: "instagram" });
    expect(instaLeads).toHaveLength(2);

    const linkedinLeads = await leadsRepository.getAll({
      platform: "linkedin",
    });
    expect(linkedinLeads).toHaveLength(1);
  });
});
