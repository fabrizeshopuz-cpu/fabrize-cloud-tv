import { NextResponse } from "next/server";
import { createEmptyState, writeCastmapState } from "@/lib/serverState";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await writeCastmapState(createEmptyState());
  return NextResponse.json({
    ok: true,
    message: "CASTMAP server ma'lumotlari tozalandi.",
    state,
  });
}
