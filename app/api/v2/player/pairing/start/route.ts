import { NextResponse } from "next/server";
import { publicRequestOrigin } from "@/lib/playerMedia";
import { readCastmapState } from "@/lib/serverState";

function pairingCodeFromDevice(deviceId: string | undefined) {
  const code = String(deviceId || "CM-PAIR-SETUP").toUpperCase().replace(/^CM-PAIR-/, "");
  return `CM-PAIR-${code}`;
}

export async function POST(request: Request) {
  const origin = publicRequestOrigin(request);
  const state = await readCastmapState();
  const firstDevice = state.devices[0];
  const pairingCode = pairingCodeFromDevice(firstDevice?.deviceId);

  return NextResponse.json({
    schema: "castmap.player.pairing.v2",
    pairingCode,
    temporaryDeviceId: firstDevice?.id || "temp-castmap-player",
    qrUrl: `${origin}/browse?pair=${encodeURIComponent(pairingCode)}`,
    playlistUrl: `${origin}/api/v2/player/playlist/${encodeURIComponent(pairingCode)}`,
    expiresIn: 300,
  });
}
