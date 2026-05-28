import { NextResponse } from "next/server";
import { normalizeState, readCastmapState, writeCastmapState } from "@/lib/serverState";
import { STATE_SCHEMA_VERSION } from "@/lib/stateSchema";
import type { PersistedCastmapState } from "@/lib/serverState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ state: await readCastmapState() });
}

export async function PUT(request: Request) {
  const payload = await request.json();
  if (payload?.schemaVersion !== STATE_SCHEMA_VERSION) {
    return NextResponse.json({ ok: false, error: "Unsupported state schema" }, { status: 409 });
  }
  const current = await readCastmapState();
  const state = mergeServerRuntimeState(normalizeState(payload), current);
  const saved = await writeCastmapState(state);
  return NextResponse.json({ ok: true, state: saved });
}

function mergeServerRuntimeState(incoming: PersistedCastmapState, current: PersistedCastmapState): PersistedCastmapState {
  const incomingCommandIds = new Set(incoming.commands.map((command) => command.id));
  const pendingServerCommands = current.commands.filter((command) =>
    (command.status === "queued" || command.status === "running") && !incomingCommandIds.has(command.id),
  );

  const currentDevices = new Map(current.devices.map((device) => [device.id, device]));
  const currentDevicesByCode = new Map(current.devices.map((device) => [device.deviceId, device]));
  const devices = incoming.devices.map((device) => {
    const serverDevice = currentDevices.get(device.id) || currentDevicesByCode.get(device.deviceId);
    if (!serverDevice) return device;

    const serverHeartbeat = Date.parse(serverDevice.lastHeartbeat || "");
    const incomingHeartbeat = Date.parse(device.lastHeartbeat || "");
    if (!Number.isFinite(serverHeartbeat) || serverHeartbeat <= incomingHeartbeat) return device;

    return {
      ...device,
      status: serverDevice.status,
      signal: serverDevice.signal,
      storage: serverDevice.storage,
      ram: serverDevice.ram,
      cpu: serverDevice.cpu,
      apkVersion: serverDevice.apkVersion,
      lastSeen: serverDevice.lastSeen,
      lastHeartbeat: serverDevice.lastHeartbeat,
      currentMediaId: serverDevice.currentMediaId,
      screenshotUrl: serverDevice.screenshotUrl,
    };
  });

  const logIds = new Set(incoming.playbackLogs.map((log) => log.id));
  const serverLogs = current.playbackLogs.filter((log) => !logIds.has(log.id));

  return {
    ...incoming,
    devices,
    commands: [...pendingServerCommands, ...incoming.commands],
    playbackLogs: [...serverLogs, ...incoming.playbackLogs].slice(0, 500),
  };
}
