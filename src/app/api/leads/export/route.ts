import { NextRequest, NextResponse } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";
import { leadsToCSV } from "@/lib/csv-exporter";
import type { LeadStatus, Platform } from "@/types/lead";

/**
 * GET /api/leads/export - Exporta leads como CSV
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as Platform | null;
    const status = searchParams.get("status") as LeadStatus | null;

    const leads = await leadsRepository.getAll({
      ...(platform && { platform }),
      ...(status && { status }),
    });

    const csv = leadsToCSV(leads);
    const now = new Date().toISOString().split("T")[0];
    const filename = `leads-${now}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/leads/export]", error);
    return NextResponse.json(
      { error: "Falha ao exportar" },
      { status: 500 }
    );
  }
}
