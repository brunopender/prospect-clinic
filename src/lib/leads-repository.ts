import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import type { Lead, LeadsStore } from "@/types/lead";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database column names are all lowercase (PostgreSQL default)
// TypeScript uses camelCase — these helpers convert between formats

type DbRow = {
  id: string;
  name: string;
  profileurl: string;
  platform: string;
  bio: string;
  followerscount: number;
  status: string;
  message: string | null;
  createdat: string;
};

function dbRowToLead(row: DbRow): Lead {
  return {
    id: row.id,
    name: row.name,
    profileUrl: row.profileurl,
    platform: row.platform as Lead["platform"],
    bio: row.bio,
    followersCount: row.followerscount,
    status: row.status as Lead["status"],
    message: row.message,
    createdAt: row.createdat,
  };
}

function leadToDbRow(lead: Lead): DbRow {
  return {
    id: lead.id,
    name: lead.name,
    profileurl: lead.profileUrl,
    platform: lead.platform,
    bio: lead.bio,
    followerscount: lead.followersCount,
    status: lead.status,
    message: lead.message,
    createdat: lead.createdAt,
  };
}

/**
 * Ensure leads table exists in Supabase
 */
async function ensureTable(): Promise<void> {
  try {
    const { error } = await supabase
      .from("leads")
      .select("id")
      .limit(1);

    if (error?.code === "PGRST204" || error?.message?.includes("does not exist")) {
      throw new Error(
        "Leads table not found. Please create it in Supabase dashboard."
      );
    }
  } catch (error: any) {
    if (error?.code === "42501") {
      return;
    }
    throw error;
  }
}

/**
 * Leads repository - singleton for managing lead data with Supabase
 */
export const leadsRepository = {
  /**
   * Get all leads, optionally filtered by platform and/or status
   */
  getAll: async (
    filters?: Partial<Pick<Lead, "platform" | "status">>
  ): Promise<Lead[]> => {
    await ensureTable();

    let query = supabase.from("leads").select("*");

    if (filters?.platform) {
      query = query.eq("platform", filters.platform);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("createdat", {
      ascending: false,
    });

    if (error) {
      console.error("[leadsRepository.getAll]", error);
      throw error;
    }

    return (data || []).map((row: any) => dbRowToLead(row));
  },

  /**
   * Get a single lead by ID
   */
  getById: async (id: string): Promise<Lead | null> => {
    await ensureTable();

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error?.code === "PGRST116") {
      return null;
    }

    if (error) {
      console.error("[leadsRepository.getById]", error);
      throw error;
    }

    return data ? dbRowToLead(data as any) : null;
  },

  /**
   * Insert or skip lead if duplicate (by profileUrl)
   */
  upsert: async (
    partial: Omit<Lead, "id" | "status" | "message" | "createdAt">
  ): Promise<{ inserted: boolean }> => {
    await ensureTable();

    // Check if lead with same profileUrl already exists
    const { data: existing, error: checkError } = await supabase
      .from("leads")
      .select("id")
      .eq("profileurl", partial.profileUrl)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[leadsRepository.upsert] Duplicate check error:", checkError);
      throw checkError;
    }

    if (existing) {
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

    const dbRow = leadToDbRow(newLead);

    const { error } = await supabase
      .from("leads")
      .insert([dbRow]);

    if (error) {
      console.error("[leadsRepository.upsert] Insert error:", error.message);
      throw error;
    }

    return { inserted: true };
  },

  /**
   * Update a lead by ID
   */
  updateById: async (
    id: string,
    patch: Partial<Omit<Lead, "id" | "createdAt">>
  ): Promise<Lead | null> => {
    await ensureTable();

    // Convert camelCase patch to lowercase db columns
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.profileUrl !== undefined) dbPatch.profileurl = patch.profileUrl;
    if (patch.platform !== undefined) dbPatch.platform = patch.platform;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.followersCount !== undefined) dbPatch.followerscount = patch.followersCount;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.message !== undefined) dbPatch.message = patch.message;

    const { data, error } = await supabase
      .from("leads")
      .update(dbPatch)
      .eq("id", id)
      .select()
      .single();

    if (error?.code === "PGRST116") {
      return null;
    }

    if (error) {
      console.error("[leadsRepository.updateById]", error);
      throw error;
    }

    return data ? dbRowToLead(data as any) : null;
  },

  /**
   * Delete a lead by ID
   */
  deleteById: async (id: string): Promise<boolean> => {
    await ensureTable();

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[leadsRepository.deleteById]", error);
      throw error;
    }

    return true;
  },
};
