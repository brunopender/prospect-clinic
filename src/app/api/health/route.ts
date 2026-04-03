import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Test Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("[health] Testing Supabase...", {
      urlPresent: !!supabaseUrl,
      keyPresent: !!supabaseAnonKey,
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        status: "error",
        timestamp: new Date().toISOString(),
        version: "rest-api-v2",
        supabase: {
          status: "error",
          error: "Missing Supabase credentials",
          urlPresent: !!supabaseUrl,
          keyPresent: !!supabaseAnonKey,
        },
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to query the leads table
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .limit(1);

    console.log("[health] Supabase test result:", {
      success: !error,
      error: error ? { code: error.code, message: error.message } : null,
      dataCount: data ? data.length : 0,
    });

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "rest-api-v2",
      apify_mode: "direct-rest",
      supabase: {
        status: error ? "error" : "connected",
        error: error ? {
          code: error.code,
          message: error.message,
        } : null,
        leadsTableExists: !error || error.code !== "42P01",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[health] Error:", errorMsg);

    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: errorMsg,
    }, { status: 500 });
  }
}
