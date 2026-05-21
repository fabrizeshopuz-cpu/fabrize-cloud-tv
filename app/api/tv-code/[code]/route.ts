import { NextResponse } from "next/server";
import { readCastmapState } from "@/lib/serverState";
import type { CommandType, DeviceCommand } from "@/types";
import type { MediaAsset } from "@/types/media";

function cleanCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function mediaKind(asset?: MediaAsset) {
  if (!asset) return "Video";
  if (asset.type === "image") return "Rasm";
  if (asset.type === "video") return "Video";
  if (asset.type === "web") return "Web";
  if (asset.type === "html") return "HTML";
  return asset.type.toUpperCase();
}

function mime(asset?: MediaAsset) {
  if (!asset) return "video/mp4";
  if (asset.type === "image") return "image/jpeg";
  if (asset.type === "video") return "video/mp4";
  if (asset.type === "web" || asset.type === "html") return "text/html";
  return "application/octet-stream";
}

function commandForPlayer(command: DeviceCommand) {
  const map: Partial<Record<CommandType, string>> = {
    FORCE_SYNC: "refresh",
    RESTART_APP: "restart",
    CLEAR_CACHE: "refresh",
    UPDATE_APK: "update",
    REBOOT_DEVICE: "restart",
    STOP_PLAYBACK: "refresh",
    RESUME_PLAYBACK: "refresh",
    TAKE_SCREENSHOT: "refresh",
    SHOW_EMERGENCY_MESSAGE: "refresh",
  };
  return {
    id: command.id,
    command: map[command.type] || "refresh",
    type: command.type,
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const state = await readCastmapState();
  const normalizedCode = cleanCode(code);
  const device = state.devices.find((item) => cleanCode(item.deviceId).endsWith(normalizedCode));

  if (!device) {
    return NextResponse.json({
      paired: false,
      code,
      message: "Bu kod hali admin panelda lokatsiyaga ulanmagan.",
      weather: { city: "Toshkent", temperature: 26, description: "Ochiq" },
      media: [],
    });
  }

  const branch = state.branches.find((item) => item.id === device.branchId);
  const playlist = state.playlists.find((item) => item.deviceIds?.includes(device.id) && item.status === "published")
    || state.playlists.find((item) => item.branchId === device.branchId && item.status === "published")
    || state.playlists.find((item) => item.name === device.playlist)
    || state.playlists.find((item) => item.target === device.branch && item.status === "published")
    || state.playlists.find((item) => item.status === "published")
    || state.playlists[0];
  const pendingCommand = state.commands.find((command) =>
    (command.deviceId === device.id || command.deviceId === device.deviceId)
    && (command.status === "queued" || command.status === "running")
  );
  const latestApk = state.apkVersions.find((version) => version.status === "latest") || state.apkVersions[0];

  return NextResponse.json({
    paired: true,
    code,
    device: {
      id: device.id,
      name: device.name,
      deviceId: device.deviceId,
      branch: device.branch,
      volume: (device as { volume?: number }).volume ?? 75,
      rotation: (device as { rotation?: number }).rotation ?? 0,
      workSchedule: `${branch?.workStart || "00:00"}-${branch?.workEnd || "23:59"}`,
      pendingCommand: pendingCommand ? commandForPlayer(pendingCommand) : null,
      latestApk: latestApk ? {
        name: latestApk.fileName,
        version: latestApk.version,
        url: `/downloads/${latestApk.fileName}`,
      } : null,
    },
    weather: {
      city: branch?.city || "Toshkent",
      temperature: 26,
      description: "Ochiq",
    },
    media: playlist ? playlist.items.map((item) => {
      const asset = state.media.find((mediaItem) => mediaItem.id === item.mediaId);
      return {
        id: asset?.id || item.mediaId,
        name: asset?.name || "Kontent",
        type: mediaKind(asset),
        mime: mime(asset),
        url: asset?.fileUrl || "",
        duration: `00:00:${String(Math.max(5, item.duration)).padStart(2, "0")}`,
      };
    }).filter((item) => item.url) : [],
  });
}
