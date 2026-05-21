import type { MediaAsset } from "@/types/media";
import type { Device as DeviceBase } from "@/types/devices";

export type DeviceStatus = "online" | "offline" | "error" | "inactive" | "update";
export type CommandType =
  | "FORCE_SYNC"
  | "RESTART_APP"
  | "CLEAR_CACHE"
  | "TAKE_SCREENSHOT"
  | "UPDATE_APK"
  | "REBOOT_DEVICE"
  | "STOP_PLAYBACK"
  | "RESUME_PLAYBACK"
  | "SHOW_EMERGENCY_MESSAGE";

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  campaignId?: string;
  screenCount: number;
  onlineCount: number;
  todayPlaybackHours: number;
  workStart: string;
  workEnd: string;
}

export interface Device extends DeviceBase {
  branchId: string;
  screenResolution: string;
  currentMediaId?: string;
  lastHeartbeat: string;
  screenshotUrl: string;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  duration: number;
  transition: "fade" | "cut" | "slide";
  order: number;
  priority: number;
  status: "active" | "draft";
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  target: string;
  campaignId?: string;
  branchId?: string;
  deviceIds?: string[];
  status: "draft" | "published" | "archived";
  loop: boolean;
  items: PlaylistItem[];
  updatedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  playlistId: string;
  branchId: string;
  type: "daily" | "weekly" | "date_range" | "one_time" | "repeating";
  startTime: string;
  endTime: string;
  days: string[];
  priority: number;
  status: "active" | "paused" | "expired";
}

export interface Campaign {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  startDate: string;
  endDate: string;
  targetBranches: string[];
  assignedPlaylists: string[];
  budget: string;
  impressionsTarget: number;
  playbackCount: number;
}

export interface PlaybackLog {
  id: string;
  deviceId: string;
  mediaId: string;
  playlistId: string;
  eventType: "start" | "complete" | "error";
  timestamp: string;
  durationSeconds: number;
}

export interface Alert {
  id: string;
  type: "offline" | "playback_error" | "low_storage" | "old_apk" | "no_heartbeat" | "black_screen";
  title: string;
  deviceId: string;
  severity: "low" | "medium" | "high";
  status: "open" | "assigned" | "resolved" | "ignored";
  createdAt: string;
}

export interface ApkVersion {
  id: string;
  version: string;
  changelog: string;
  fileName: string;
  size: string;
  status: "latest" | "active" | "staged" | "rollback";
  installedDevices: number;
  failedDevices: number;
  uploadedAt: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Manager" | "Operator" | "Viewer";
  branchAccess: string[];
  status: "active" | "inactive";
  lastLogin: string;
}

export interface BillingPlan {
  id: string;
  name: "Basic" | "Business" | "Professional" | "Enterprise";
  deviceLimit: number;
  storageLimitGb: number;
  price: string;
  current?: boolean;
}

export interface Invoice {
  id: string;
  plan: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "failed";
}

export interface Widget {
  id: string;
  name: string;
  type: "weather" | "currency" | "clock" | "rss" | "youtube" | "instagram" | "telegram" | "sheets" | "web" | "qr";
  status: "active" | "draft";
  preview: string;
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  type: CommandType;
  status: "queued" | "running" | "success" | "failed";
  message: string;
  createdAt: string;
}

export type { MediaAsset };
