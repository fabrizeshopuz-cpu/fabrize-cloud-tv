import { NextResponse } from "next/server";
import { buildV2PlaylistPayload } from "@/lib/player-v2";
import { publicRequestOrigin } from "@/lib/playerMedia";
import { readCastmapState } from "@/lib/serverState";

export async function GET(request: Request, { params }: { params: Promise<{ deviceCode: string }> }) {
  const { deviceCode } = await params;
  const origin = publicRequestOrigin(request);
  const state = await readCastmapState();

  return NextResponse.json(buildV2PlaylistPayload(state, origin, deviceCode));
}
