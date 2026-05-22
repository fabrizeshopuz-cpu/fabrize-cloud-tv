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
  id: "apk-1-0-1-20260522",
  version: "v1.0.1",
  changelog: "Video stream Range support va castmap.uz production API bilan yangi player build",
  fileName: "castmap-player-1.0.1.apk",
  size: "1.6 MB",
  status: "latest",
  installedDevices: 0,
  failedDevices: 0,
  uploadedAt: "2026-05-22 12:22",
}];

export function createEmptyState(): PersistedCastmapState {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    devices: [],
    media: [],
    playlists: [],
    schedules: [],
    campaigns: [],
    alerts: [],
    users: [],
    branches: [],
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
  return {
    ...fallback,
    ...input,
    updatedAt: input.updatedAt || fallback.updatedAt,
    devices: Array.isArray(input.devices) ? input.devices : [],
    media: Array.isArray(input.media) ? input.media : [],
    playlists: Array.isArray(input.playlists) ? input.playlists : [],
    schedules: Array.isArray(input.schedules) ? input.schedules : [],
    campaigns: Array.isArray(input.campaigns) ? input.campaigns : [],
    alerts: Array.isArray(input.alerts) ? input.alerts : [],
    users: Array.isArray(input.users) ? input.users : [],
    branches: Array.isArray(input.branches) ? input.branches : [],
    billingPlans: Array.isArray(input.billingPlans) ? input.billingPlans : fallback.billingPlans,
    apkVersions: Array.isArray(input.apkVersions) && input.apkVersions.length ? input.apkVersions : defaultApkVersions,
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
