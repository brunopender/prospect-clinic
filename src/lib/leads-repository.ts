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

/**
 * Ensure leads table exists in Supabase
 */
async function ensureTable(): Promise<void> {
  try {
    // Try to read from the table to check if it exists
    const { error } = await supabase
      .from("leads")
      .select("id")
      .limit(1);

    // If table doesn't exist, create it
    if (error?.code === "PGRST204" || error?.message?.includes("does not exist")) {
      console.log("[leadsRepository] Creating leads table...");

      // Note: Table creation via API isn't directly possible
      // User must create via Supabase dashboard or we throw error
      throw new Error(
        "Leads table not found. Please create it in Supabase dashboard with columns: id (uuid), name (text), profileUrl (text unique), platform (text), bio (text), followersCount (int), status (text), message (text null), createdAt (timestamp)"
      );
    }
  } catch (error: any) {
    // If it's a permission error, table probably exists
    if (error?.code === "42501") {
      console.log("[leadsRepository] Table exists, permission error (expected)");
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

    const { data, error } = await query.order("createdAt", {
      ascending: false,
    });

    if (error) {
      console.error("[leadsRepository.getAll]", error);
      throw error;
    }

    return (data || []) as Lead[];
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
      // Row not found
      return null;
    }

    if (error) {
      console.error("[leadsRepository.getById]", error);
      throw error;
    }

    return (data as Lead) || null;
  },

  /**
   * Insert or skip lead if duplicate (by profileUrl)
   */
  upsert: async (
    partial: Omit<Lead, "id" | "status" | "message" | "createdAt">
  ): Promise<{ inserted: boolean }> => {
    await ensureTable();

    // Check if lead with same profileUrl already exists
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("profileUrl", partial.profileUrl)
      .single();

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

    const { error } = await supabase
      .from("leads")
      .insert([newLead]);

    if (error) {
      console.error("[leadsRepository.upsert]", error);
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

    const { data, error } = await supabase
      .from("leads")
      .update(patch)
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

    return (data as Lead) || null;
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
