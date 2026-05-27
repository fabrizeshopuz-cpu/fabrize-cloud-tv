import { NextResponse } from "next/server";
import { buildV2PlaylistPayload } from "@/lib/player-v2";
import { publicRequestOrigin } from "@/lib/playerMedia";
import { readCastmapState } from "@/lib/serverState";

function tokenDeviceId(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (token.startsWith("device:")) return token.slice("device:".length);
  return "";
}

export async function GET(request: Request) {
  const origin = publicRequestOrigin(request);
  const url = new URL(request.url);
  const deviceId = url.searchParams.get("deviceId") || tokenDeviceId(request);
  const state = await readCastmapState();

  return NextResponse.json(buildV2PlaylistPayload(state, origin, deviceId || undefined));
}
