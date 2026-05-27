import { NextResponse } from "next/server";
import { updateCastmapState } from "@/lib/serverState";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const deviceId = String(body.deviceId || body.deviceCode || "").trim();
  const now = new Date().toISOString();

  await updateCastmapState((state) => {
    state.devices = state.devices.map((device) => {
      const matches = device.id === deviceId || device.deviceId === deviceId;
      if (!matches) return device;

      return {
        ...device,
        status: body.status === "error" ? "error" : "online",
        signal: Number(body.signal ?? body.internetSignal ?? device.signal ?? 90),
        storage: Number(body.storage ?? body.storageUsedPercent ?? device.storage ?? 0),
        ram: Number(body.ram ?? body.ramUsage ?? device.ram ?? 0),
        cpu: Number(body.cpu ?? body.cpuUsage ?? device.cpu ?? 0),
        apkVersion: body.appVersion || body.apkVersion || device.apkVersion,
        lastSeen: "Hozir",
        lastHeartbeat: now,
        currentMediaId: body.currentMediaId || device.currentMediaId,
      };
    });
  });

  return NextResponse.json({
    ok: true,
    schema: "castmap.player.heartbeat.v2",
    receivedAt: now,
    deviceId: deviceId || "unknown",
    commandPollAfterSeconds: 10,
  });
}
