import { fallbackDurationSeconds, mediaMime, mediaPublicUrl, playableMediaAssets, playerMediaType, playlistDurationMs } from "@/lib/playerMedia";
import type { PersistedCastmapState } from "@/lib/serverState";
import type { Device, Playlist } from "@/types";
import type { MediaAsset } from "@/types/media";

export function cleanPlayerCode(value: string | undefined) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function findV2PlayerDevice(state: PersistedCastmapState, rawDeviceId?: string) {
  const requested = String(rawDeviceId || "").trim();
  const normalized = cleanPlayerCode(requested);
  if (!requested) return state.devices[0];

  return state.devices.find((device) =>
    device.id === requested
    || device.deviceId === requested
    || cleanPlayerCode(device.id).endsWith(normalized)
    || cleanPlayerCode(device.deviceId).endsWith(normalized)
  );
}

export function selectV2Playlist(state: PersistedCastmapState, device: Device | undefined) {
  return state.playlists.find((playlist) => device && playlist.deviceIds?.includes(device.id) && playlist.status === "published")
    || state.playlists.find((playlist) => device && playlist.branchId === device.branchId && playlist.status === "published")
    || state.playlists.find((playlist) => playlist.name === device?.playlist)
    || state.playlists.find((playlist) => playlist.target === device?.branch && playlist.status === "published")
    || state.playlists.find((playlist) => playlist.status === "published")
    || state.playlists[0];
}

export function latestV2Apk(state: PersistedCastmapState) {
  return state.apkVersions.find((version) => version.status === "latest") || state.apkVersions[0] || null;
}

function playlistAssetItem(media: MediaAsset | undefined, origin: string, item: Playlist["items"][number], index: number, updatedAt: string) {
  const url = mediaPublicUrl(media, origin);
  if (!url) return null;

  const duration = playlistDurationMs(item.duration);
  return {
    id: item.id,
    mediaId: media?.id || item.mediaId,
    title: media?.name || "Kontent",
    type: playerMediaType(media),
    mime: mediaMime(media),
    url,
    duration,
    durationMs: duration,
    order: Number.isFinite(item.order) ? item.order : index + 1,
    priority: item.priority,
    checksum: `castmap-v2-${media?.id || item.mediaId}-${updatedAt}`,
    cacheKey: `castmap-v2-${media?.id || item.mediaId}`,
  };
}

function fallbackAssetItem(media: MediaAsset, origin: string, index: number, updatedAt: string) {
  const duration = playlistDurationMs(fallbackDurationSeconds(media));
  return {
    id: `fallback-${media.id}`,
    mediaId: media.id,
    title: media.name,
    type: playerMediaType(media),
    mime: mediaMime(media),
    url: mediaPublicUrl(media, origin),
    duration,
    durationMs: duration,
    order: index + 1,
    priority: Math.max(1, 100 - index),
    checksum: `castmap-v2-${media.id}-${updatedAt}`,
    cacheKey: `castmap-v2-${media.id}`,
  };
}

export function buildV2PlaylistPayload(state: PersistedCastmapState, origin: string, rawDeviceId?: string) {
  const device = findV2PlayerDevice(state, rawDeviceId);
  const playlist = selectV2Playlist(state, device);
  const version = Date.parse(state.updatedAt) || Date.now();
  const orderedItems = playlist
    ? [...playlist.items].sort((a, b) => (a.order - b.order) || (b.priority - a.priority))
    : [];
  const playlistItems = orderedItems
    .map((item, index) => playlistAssetItem(state.media.find((asset) => asset.id === item.mediaId), origin, item, index, state.updatedAt))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const fallbackItems = playlistItems.length ? [] : playableMediaAssets(state.media)
    .map((media, index) => fallbackAssetItem(media, origin, index, state.updatedAt))
    .filter((item) => item.url);

  return {
    schema: "castmap.player.playlist.v2",
    serverTime: new Date().toISOString(),
    paired: Boolean(device),
    device: device ? {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      branch: device.branch,
      branchId: device.branchId,
      status: device.status,
      apkVersion: device.apkVersion,
    } : null,
    playlist: playlist ? {
      id: playlist.id,
      name: playlist.name,
      status: playlist.status,
      loop: playlist.loop,
      updatedAt: playlist.updatedAt,
    } : null,
    version,
    items: playlistItems.length ? playlistItems : fallbackItems,
    sync: {
      pollAfterSeconds: 15,
      offlineCache: true,
      requireFullScreenPlayback: true,
    },
  };
}
