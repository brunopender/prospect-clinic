import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Lead, LeadsStore } from "@/types/lead";

const DATA_PATH = "data/leads.json";

/**
 * Read leads store from JSON file
 * @returns LeadsStore object with leads array and updatedAt timestamp
 */
async function read(): Promise<LeadsStore> {
  if (!existsSync(DATA_PATH)) {
    return { leads: [], updatedAt: new Date().toISOString() };
  }

  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as LeadsStore;
  } catch (error) {
    console.error("[leadsRepository.read]", error);
    // Return empty store if JSON is invalid
    return { leads: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Write leads store to JSON file
 * @param store LeadsStore object to persist
 */
async function write(store: LeadsStore): Promise<void> {
  try {
    // Create data directory if it doesn't exist
    await mkdir("data", { recursive: true });

    // Update the timestamp
    store.updatedAt = new Date().toISOString();

    // Write JSON with 2-space indentation for readability
    await writeFile(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("[leadsRepository.write]", error);
    throw error;
  }
}

/**
 * Leads repository - singleton for managing lead data
 */
export const leadsRepository = {
  /**
   * Get all leads, optionally filtered by platform and/or status
   */
  getAll: async (
    filters?: Partial<Pick<Lead, "platform" | "status">>
  ): Promise<Lead[]> => {
    const { leads } = await read();

    return leads.filter(
      (lead) =>
        (!filters?.platform || lead.platform === filters.platform) &&
        (!filters?.status || lead.status === filters.status)
    );
  },

  /**
   * Get a single lead by ID
   * @param id UUID of the lead
   * @returns Lead object or null if not found
   */
  getById: async (id: string): Promise<Lead | null> => {
    const { leads } = await read();
    return leads.find((l) => l.id === id) ?? null;
  },

  /**
   * Insert or skip lead if duplicate (by profileUrl)
   * @param partial Lead data without id, status, message, createdAt
   * @returns Object with inserted boolean flag
   */
  upsert: async (
    partial: Omit<Lead, "id" | "status" | "message" | "createdAt">
  ): Promise<{ inserted: boolean }> => {
    try {
      const store = await read();

      // Check if lead with same profileUrl already exists
      const exists = store.leads.find(
        (lead) => lead.profileUrl === partial.profileUrl
      );
      if (exists) {
        return { inserted: false };
      }

      // Create new lead with generated id and defaults
      const newLead: Lead = {
        ...partial,
        id: uuidv4(),
        status: "novo",
        message: null,
        createdAt: new Date().toISOString(),
      };

      store.leads.push(newLead);
      await write(store);

      return { inserted: true };
    } catch (error) {
      console.error("[leadsRepository.upsert]", error);
      throw error;
    }
  },

  /**
   * Update a lead by ID
   * @param id UUID of the lead
   * @param patch Partial lead object with fields to update
   * @returns Updated lead or null if not found
   */
  update: async (
    id: string,
    patch: Partial<Lead>
  ): Promise<Lead | null> => {
    try {
      const store = await read();

      const idx = store.leads.findIndex((l) => l.id === id);
      if (idx === -1) {
        return null;
      }

      store.leads[idx] = { ...store.leads[idx], ...patch };
      await write(store);

      return store.leads[idx];
    } catch (error) {
      console.error("[leadsRepository.update]", error);
      throw error;
    }
  },
};
