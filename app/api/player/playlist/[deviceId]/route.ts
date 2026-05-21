import { NextResponse } from "next/server";
import { readCastmapState } from "@/lib/serverState";

export async function GET(_: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const state = await readCastmapState();
  const device = state.devices.find((item) => item.id === deviceId || item.deviceId === deviceId);
  const playlist = state.playlists.find((item) => device && item.deviceIds?.includes(device.id) && item.status === "published")
    || state.playlists.find((item) => device && item.branchId === device.branchId && item.status === "published")
    || state.playlists.find((item) => item.name === device?.playlist)
    || state.playlists.find((item) => item.target === device?.branch && item.status === "published")
    || state.playlists.find((item) => item.status === "published")
    || state.playlists[0];
  if (!playlist) {
    return NextResponse.json({
      deviceId,
      playlistId: null,
      version: "empty",
      items: [],
      message: "Kontent biriktirilmagan",
    });
  }
  return NextResponse.json({
    deviceId: device?.deviceId || deviceId,
    playlistId: playlist.id,
    version: state.updatedAt,
    items: playlist.items.map((item) => {
      const media = state.media.find((asset) => asset.id === item.mediaId) || state.media[0];
      return {
        id: item.id,
        mediaId: media?.id || item.mediaId,
        type: media?.type || "video",
        url: media?.fileUrl || "",
        localPath: null,
        duration: item.duration,
        priority: item.priority,
        startAt: null,
        endAt: null,
        scheduleRules: [],
        checksum: `castmap-${media?.id || item.mediaId}-${state.updatedAt}`,
        version: 1,
      };
    }),
  });
}
