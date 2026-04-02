import { NextRequest, NextResponse } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";
import type { LeadStatus } from "@/types/lead";

const VALID_STATUSES: LeadStatus[] = [
  "novo",
  "contatado",
  "respondeu",
  "fechado",
  "descartado",
];

/**
 * PATCH /api/leads/[id] - Atualiza status do lead
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    const updated = await leadsRepository.update(id, {
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/leads/[id]]", error);
    return NextResponse.json(
      { error: "Falha ao atualizar" },
      { status: 500 }
    );
  }
}
