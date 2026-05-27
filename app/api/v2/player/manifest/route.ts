import { NextResponse } from "next/server";
import { latestV2Apk } from "@/lib/player-v2";
import { publicRequestOrigin } from "@/lib/playerMedia";
import { readCastmapState } from "@/lib/serverState";

export async function GET(request: Request) {
  const origin = publicRequestOrigin(request);
  const state = await readCastmapState();
  const latestApk = latestV2Apk(state);

  return NextResponse.json({
    schema: "castmap.player.manifest.v2",
    serverTime: new Date().toISOString(),
    platform: {
      name: "CASTMAP",
      cabinetUrl: `${origin}/browse`,
      superAdminUrl: `${origin}/super-admin`,
    },
    endpoints: {
      pairingStart: `${origin}/api/v2/player/pairing/start`,
      playlist: `${origin}/api/v2/player/playlist/{deviceCode}`,
      heartbeat: `${origin}/api/v2/player/heartbeat`,
      commands: `${origin}/api/player/commands/{deviceId}`,
      logs: `${origin}/api/player/logs`,
    },
    latestApk: latestApk ? {
      version: latestApk.version,
      fileName: latestApk.fileName,
      changelog: latestApk.changelog,
      downloadUrl: `${origin}/downloads/${latestApk.fileName}`,
    } : null,
    playback: {
      supportedTypes: ["VIDEO", "IMAGE", "WEB_URL", "HTML"],
      cache: "offline-first",
      heartbeatSeconds: 30,
    },
  });
}
