import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Alert,
  ApkVersion,
  BillingPlan,
  Branch,
  Campaign,
  Device,
  DeviceCommand,
  PlaybackLog,
  Playlist,
  Schedule,
  Widget,
  PlatformUser,
} from "@/types";
import type { MediaAsset } from "@/types/media";
import { readStateFromDb, writeStateToDb } from "@/lib/serverDb";
import { STATE_SCHEMA_VERSION } from "@/lib/stateSchema";

export interface PersistedCastmapState {
  schemaVersion: number;
  updatedAt: string;
  devices: Device[];
  media: MediaAsset[];
  playlists: Playlist[];
  schedules: Schedule[];
  campaigns: Campaign[];
  alerts: Alert[];
  users: PlatformUser[];
  branches: Branch[];
  billingPlans: BillingPlan[];
  apkVersions: ApkVersion[];
  widgets: Widget[];
  playbackLogs: PlaybackLog[];
  commands: DeviceCommand[];
}

const dataDir = path.join(process.cwd(), "data");
const statePath = path.join(dataDir, "castmap-state.json");

const defaultApkVersions: ApkVersion[] = [{
  id: "apk-1-2-1-20260528",
  version: "v1.2.1",
  changelog: "Device-code playlist sync, HTTP/HLS/DASH/RTSP stream playback va stream upload mode",
  fileName: "castmap-player-1.2.1.apk",
  size: "6.2 MB",
  status: "latest",
  installedDevices: 0,
  failedDevices: 0,
  uploadedAt: "2026-05-28 00:00",
}];

const defaultBranches: Branch[] = [{
  id: "branch-bunyodkor",
  name: "Bunyodkor",
  city: "Toshkent",
  address: "Bunyodkor",
  screenCount: 1,
  onlineCount: 1,
  todayPlaybackHours: 0,
  workStart: "00:00",
  workEnd: "23:59",
}];

const defaultMedia: MediaAsset[] = [{
  id: "media-start-video-20260527",
  name: "a_cb_c_e_d_a_f_a_v_mp_.mp4",
  type: "video",
  status: "active",
  thumbnailUrl: "",
  fileUrl: "https://castmap.uz/api/uploads/a_cb_c_e_d_a_f_a_v_mp_-1779893774825.mp4",
  size: "2.1 MB",
  sizeBytes: 2200000,
  duration: "00:10",
  resolution: "1920x1080",
  orientation: "landscape",
  format: "MP4",
  folder: "Promo",
  tags: ["Promo"],
  uploadedBy: "Super Admin",
  uploadedAt: "2026-05-27 19:56",
  usedInPlaylists: 1,
  usedOnScreens: 1,
  playbackCount: 0,
}];

const defaultDevices: Device[] = [{
  id: "device-kj8aha-mpgpx88j",
  name: "CASTMAP Player 01",
  deviceId: "CM-PAIR-CSWGYK3Y",
  branch: "Bunyodkor",
  branchId: "branch-bunyodkor",
  location: "Bunyodkor",
  type: "Android TV",
  status: "online",
  signal: 95,
  storage: 1,
  ram: 12,
  cpu: 8,
  playlist: "Start playlist",
  lastSeen: "Hozir",
  lastHeartbeat: "2026-05-27T15:00:00.000Z",
  apkVersion: "v1.2.1",
  ipAddress: "192.168.0.101",
  macAddress: "00:00:00:00:00:00",
  uptime: "0d 0h",
  screenResolution: "1920x1080",
  currentMediaId: "media-start-video-20260527",
  screenshotUrl: "",
}];

const defaultPlaylists: Playlist[] = [{
  id: "playlist-start-20260527",
  name: "Start playlist",
  description: "TV ochilganda birinchi chiqadigan video",
  target: "Bunyodkor",
  branchId: "branch-bunyodkor",
  deviceIds: ["device-kj8aha-mpgpx88j"],
  status: "published",
  loop: true,
  items: [{
    id: "playlist-item-start-video",
    mediaId: "media-start-video-20260527",
    duration: 10,
    transition: "cut",
    order: 1,
    priority: 100,
    status: "active",
  }],
  updatedAt: "2026-05-27 19:56",
}];

function apkVersionScore(version: string) {
  return version
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0)
    .reduce((score, part) => (score * 1000) + part, 0);
}

function normalizeApkVersions(input: unknown): ApkVersion[] {
  const versions = Array.isArray(input) ? input as ApkVersion[] : [];
  const latestDefault = defaultApkVersions[0];
  const hasCurrentOrNewer = versions.some((version) => apkVersionScore(version.version) >= apkVersionScore(latestDefault.version));
  if (hasCurrentOrNewer) return versions;
  return [
    latestDefault,
    ...versions.map((version) => ({
      ...version,
      status: version.status === "latest" ? "active" as const : version.status,
    })),
  ];
}

export function createEmptyState(): PersistedCastmapState {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    devices: defaultDevices,
    media: defaultMedia,
    playlists: defaultPlaylists,
    schedules: [],
    campaigns: [],
    alerts: [],
    users: [],
    branches: defaultBranches,
    billingPlans: [
      { id: "basic", name: "Basic", deviceLimit: 10, storageLimitGb: 100, price: "299 000 so'm" },
      { id: "business", name: "Business", deviceLimit: 50, storageLimitGb: 500, price: "899 000 so'm" },
      { id: "professional", name: "Professional", deviceLimit: 250, storageLimitGb: 1024, price: "1 990 000 so'm", current: true },
      { id: "enterprise", name: "Enterprise", deviceLimit: 5000, storageLimitGb: 10240, price: "Kelishiladi" },
    ],
    apkVersions: defaultApkVersions,
    widgets: [],
    playbackLogs: [],
    commands: [],
  };
}

export function normalizeState(input: Partial<PersistedCastmapState> | null | undefined): PersistedCastmapState {
  const fallback = createEmptyState();
  if (!input || input.schemaVersion !== STATE_SCHEMA_VERSION) return fallback;
  const hasSetupContent = Boolean(
    input.devices?.length
    || input.media?.length
    || input.playlists?.length
    || input.branches?.length
  );
  return {
    ...fallback,
    ...input,
    updatedAt: input.updatedAt || fallback.updatedAt,
    devices: hasSetupContent && Array.isArray(input.devices) ? input.devices : fallback.devices,
    media: hasSetupContent && Array.isArray(input.media) ? input.media : fallback.media,
    playlists: hasSetupContent && Array.isArray(input.playlists) ? input.playlists : fallback.playlists,
    schedules: Array.isArray(input.schedules) ? input.schedules : [],
    campaigns: Array.isArray(input.campaigns) ? input.campaigns : [],
    alerts: Array.isArray(input.alerts) ? input.alerts : [],
    users: Array.isArray(input.users) ? input.users : [],
    branches: hasSetupContent && Array.isArray(input.branches) ? input.branches : fallback.branches,
    billingPlans: Array.isArray(input.billingPlans) ? input.billingPlans : fallback.billingPlans,
    apkVersions: normalizeApkVersions(input.apkVersions),
    widgets: Array.isArray(input.widgets) ? input.widgets : [],
    playbackLogs: Array.isArray(input.playbackLogs) ? input.playbackLogs : [],
    commands: Array.isArray(input.commands) ? input.commands : [],
  };
}

export async function readCastmapState(): Promise<PersistedCastmapState> {
  const dbState = await readStateFromDb();
  if (dbState) return normalizeState(dbState);

  try {
    const raw = await readFile(statePath, "utf8");
    const fileState = normalizeState(JSON.parse(raw) as Partial<PersistedCastmapState>);
    await writeStateToDb(fileState);
    return fileState;
  } catch {
    return createEmptyState();
  }
}

export async function writeCastmapState(state: PersistedCastmapState) {
  const nextState = normalizeState({ ...state, updatedAt: new Date().toISOString() });
  const dbState = await writeStateToDb(nextState);
  if (dbState) return dbState;

  await mkdir(dataDir, { recursive: true });
  await writeFile(statePath, JSON.stringify(nextState, null, 2), "utf8");
  return nextState;
}

export async function updateCastmapState(updater: (state: PersistedCastmapState) => PersistedCastmapState | void) {
  const state = await readCastmapState();
  const updated = updater(state) || state;
  return writeCastmapState(updated);
}
