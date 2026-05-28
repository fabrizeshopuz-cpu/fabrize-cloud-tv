"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  alerts as alertsSeed,
  apkVersions as apkSeed,
  billingPlans as billingSeed,
  branches as branchesSeed,
  campaigns as campaignsSeed,
  devices as devicesSeed,
  initialCommands,
  invoices as invoiceSeed,
  mediaAssets as mediaSeed,
  playbackLogs as playbackSeed,
  playlists as playlistSeed,
  schedules as scheduleSeed,
  users as userSeed,
  widgets as widgetSeed,
} from "@/lib/mockData";
import { STATE_SCHEMA_VERSION } from "@/lib/stateSchema";
import { formatDateTime, uid } from "@/lib/utils";
import type {
  Alert,
  ApkVersion,
  Branch,
  Campaign,
  CommandType,
  Device,
  DeviceCommand,
  Invoice,
  MediaAsset,
  PlatformUser,
  PlaybackLog,
  Playlist,
  Schedule,
  Widget,
  BillingPlan,
} from "@/types";
import type { UploadDraft } from "@/types/media";

export interface ToastMessage {
  id: string;
  text: string;
  tone: "success" | "warning" | "danger" | "info";
}

interface AddBranchInput {
  name: string;
  city?: string;
  address?: string;
  campaignId?: string;
  workStart?: string;
  workEnd?: string;
}

interface AddMediaInput {
  name: string;
  type?: MediaAsset["type"];
  folder?: string;
  duration?: string;
}

export interface TestChainInput {
  branchName: string;
  city: string;
  screenName: string;
  campaignName: string;
  pairingCode: string;
  workStart: string;
  workEnd: string;
}

interface CreatePlaylistInput {
  name: string;
  description?: string;
  campaignId?: string;
  branchId?: string;
  deviceIds?: string[];
  mediaIds?: string[];
}

interface CastmapState {
  devices: Device[];
  media: MediaAsset[];
  playlists: Playlist[];
  schedules: Schedule[];
  campaigns: Campaign[];
  alerts: Alert[];
  users: PlatformUser[];
  branches: Branch[];
  billingPlans: BillingPlan[];
  invoices: Invoice[];
  apkVersions: ApkVersion[];
  widgets: Widget[];
  playbackLogs: PlaybackLog[];
  commands: DeviceCommand[];
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: ToastMessage["tone"]) => void;
  addPlaylist: () => Playlist;
  createPlaylist: (input: CreatePlaylistInput) => Playlist;
  updatePlaylist: (id: string, patch: Partial<Playlist>) => void;
  publishPlaylist: (id: string) => void;
  duplicatePlaylist: (id: string) => void;
  deletePlaylist: (id: string) => void;
  addSchedule: () => void;
  toggleSchedule: (id: string) => void;
  deleteSchedule: (id: string) => void;
  addCampaign: () => void;
  createCampaign: (input: Partial<Campaign>) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  setCampaignStatus: (id: string, status: Campaign["status"]) => void;
  deleteCampaign: (id: string) => void;
  sendCommand: (deviceId: string, type: CommandType) => DeviceCommand;
  pairDevice: (code: string, name: string, branchId: string) => void;
  updateDevice: (id: string, patch: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  addBranch: (input: AddBranchInput) => Branch;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  addMediaAsset: (input: AddMediaInput) => MediaAsset;
  createMediaFromDraft: (draft: UploadDraft) => MediaAsset;
  updateMediaAsset: (asset: MediaAsset) => void;
  addMediaToPlaylist: (mediaId: string, playlistId: string) => void;
  deleteMediaAsset: (id: string) => void;
  createTestChain: (input: TestChainInput) => void;
  deleteBranch: (id: string) => void;
  clearTestBranches: () => void;
  clearTemplates: () => void;
  clearOperationalData: () => void;
  resolveAlert: (id: string) => void;
  ignoreAlert: (id: string) => void;
  deleteAlert: (id: string) => void;
  addUser: () => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;
  updatePlan: (id: string) => void;
  uploadApk: () => void;
  rolloutApk: (versionId: string) => void;
  rollbackApk: (versionId: string) => void;
  deleteApkVersion: (versionId: string) => void;
  addWidgetToPlaylist: (widgetId: string) => void;
  deleteWidget: (widgetId: string) => void;
}

interface PersistedCastmapState {
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

const STORAGE_KEY = "castmap-admin-state-v3";

const CastmapContext = createContext<CastmapState | null>(null);

export function CastmapProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(devicesSeed);
  const [media, setMedia] = useState<MediaAsset[]>(mediaSeed);
  const [playlists, setPlaylists] = useState<Playlist[]>(playlistSeed);
  const [schedules, setSchedules] = useState<Schedule[]>(scheduleSeed);
  const [campaigns, setCampaigns] = useState<Campaign[]>(campaignsSeed);
  const [alerts, setAlerts] = useState<Alert[]>(alertsSeed);
  const [users, setUsers] = useState<PlatformUser[]>(userSeed);
  const [branches, setBranches] = useState<Branch[]>(branchesSeed);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>(billingSeed);
  const [apkVersions, setApkVersions] = useState<ApkVersion[]>(apkSeed);
  const [widgets, setWidgets] = useState<Widget[]>(widgetSeed);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackLog[]>(playbackSeed);
  const [commands, setCommands] = useState<DeviceCommand[]>(initialCommands);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const pushToast = useCallback((text: string, tone: ToastMessage["tone"] = "success") => {
    const toast = { id: uid("toast"), text, tone };
    setToasts((current) => [toast, ...current].slice(0, 4));
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 2600);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applySavedState = (saved: Partial<PersistedCastmapState>) => {
      if (cancelled) return;
      if (saved.schemaVersion !== STATE_SCHEMA_VERSION) return;
      if (Array.isArray(saved.devices)) setDevices(saved.devices);
      if (Array.isArray(saved.media)) setMedia(saved.media);
      if (Array.isArray(saved.playlists)) setPlaylists(saved.playlists);
      if (Array.isArray(saved.schedules)) setSchedules(saved.schedules);
      if (Array.isArray(saved.campaigns)) setCampaigns(saved.campaigns);
      if (Array.isArray(saved.alerts)) setAlerts(saved.alerts);
      if (Array.isArray(saved.users)) setUsers(saved.users);
      if (Array.isArray(saved.branches)) setBranches(saved.branches);
      if (Array.isArray(saved.billingPlans)) setBillingPlans(saved.billingPlans);
      if (Array.isArray(saved.apkVersions)) setApkVersions(saved.apkVersions);
      if (Array.isArray(saved.widgets)) setWidgets(saved.widgets);
      if (Array.isArray(saved.playbackLogs)) setPlaybackLogs(saved.playbackLogs);
      if (Array.isArray(saved.commands)) setCommands(saved.commands);
    };

    const hydrate = async () => {
      try {
        window.localStorage.removeItem("castmap-admin-state-v1");
        window.localStorage.removeItem("castmap-admin-state-v2");
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) applySavedState(JSON.parse(raw) as Partial<PersistedCastmapState>);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }

      try {
        const response = await fetch("/api/admin/state", { cache: "no-store" });
        if (response.ok) {
          const payload = await response.json() as { state?: Partial<PersistedCastmapState> };
          if (payload.state) applySavedState(payload.state);
        }
      } catch {
        // Local storage still keeps the panel usable when the API is unavailable.
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const payload: PersistedCastmapState = {
      schemaVersion: STATE_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      devices,
      media,
      playlists,
      schedules,
      campaigns,
      alerts,
      users,
      branches,
      billingPlans,
      apkVersions,
      widgets,
      playbackLogs,
      commands,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    void fetch("/api/admin/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }, [alerts, apkVersions, billingPlans, branches, campaigns, commands, devices, isHydrated, media, playbackLogs, playlists, schedules, users, widgets]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCommands((current) =>
        current.map((command) => command.status === "running" ? { ...command, status: "success", message: "Buyruq bajarildi" } : command),
      );
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const addPlaylist = useCallback(() => {
    const playlist: Playlist = {
      id: uid("playlist"),
      name: `Yangi playlist ${playlists.length + 1}`,
      description: "Media kutubxonadan tanlangan kontentlar",
      target: branches[0]?.name || "Asosiy filial",
      status: "draft",
      loop: true,
      items: media.slice(0, 3).map((item, index) => ({
        id: uid("item"),
        mediaId: item.id,
        duration: item.type === "video" ? 20 : 10,
        transition: "fade",
        order: index + 1,
        priority: 1,
        status: "active",
      })),
      updatedAt: formatDateTime(),
    };
    setPlaylists((current) => [playlist, ...current]);
    pushToast("Yangi playlist yaratildi.");
    return playlist;
  }, [branches, media, playlists.length, pushToast]);

  const createPlaylist = useCallback((input: CreatePlaylistInput) => {
    const branch = branches.find((item) => item.id === input.branchId);
    const selectedMedia = input.mediaIds?.length
      ? media.filter((item) => input.mediaIds?.includes(item.id))
      : media.slice(0, 1);
    const playlist: Playlist = {
      id: uid("playlist"),
      name: input.name.trim() || `Yangi playlist ${playlists.length + 1}`,
      description: input.description?.trim() || "Kampaniya, lokatsiya va TV qurilmalarga biriktirilgan playlist",
      target: branch?.name || "Barcha TV qurilmalar",
      campaignId: input.campaignId,
      branchId: input.branchId,
      deviceIds: input.deviceIds || [],
      status: "draft",
      loop: true,
      items: selectedMedia.map((item, index) => ({
        id: uid("item"),
        mediaId: item.id,
        duration: item.type === "video" ? 20 : 10,
        transition: "fade",
        order: index + 1,
        priority: 1,
        status: "active",
      })),
      updatedAt: formatDateTime(),
    };
    setPlaylists((current) => [playlist, ...current]);
    if (input.deviceIds?.length) {
      setDevices((current) => current.map((device) => input.deviceIds?.includes(device.id) ? { ...device, playlist: playlist.name } : device));
    }
    pushToast("Playlist yaratildi va tanlangan TV/lokatsiyaga biriktirildi.");
    return playlist;
  }, [branches, media, playlists.length, pushToast]);

  const updatePlaylist = useCallback((id: string, patch: Partial<Playlist>) => {
    setPlaylists((current) => current.map((playlist) => playlist.id === id ? { ...playlist, ...patch, updatedAt: formatDateTime() } : playlist));
    const nextName = patch.name?.trim();
    if (nextName) {
      setDevices((current) => current.map((device) => device.playlist === playlists.find((playlist) => playlist.id === id)?.name ? { ...device, playlist: nextName } : device));
    }
    pushToast("Playlist tahrirlandi.");
  }, [playlists, pushToast]);

  const publishPlaylist = useCallback((id: string) => {
    setPlaylists((current) => current.map((playlist) => playlist.id === id ? { ...playlist, status: "published", updatedAt: formatDateTime() } : playlist));
    pushToast("Playlist publish qilindi.");
  }, [pushToast]);

  const duplicatePlaylist = useCallback((id: string) => {
    setPlaylists((current) => {
      const source = current.find((playlist) => playlist.id === id);
      if (!source) return current;
      return [{ ...source, id: uid("playlist"), name: `${source.name} nusxa`, status: "draft", updatedAt: formatDateTime() }, ...current];
    });
    pushToast("Playlist nusxalandi.");
  }, [pushToast]);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((current) => current.filter((playlist) => playlist.id !== id));
    pushToast("Playlist o'chirildi.", "warning");
  }, [pushToast]);

  const addSchedule = useCallback(() => {
    setSchedules((current) => [{
      id: uid("schedule"),
      name: "Yangi jadval",
      playlistId: playlists[0]?.id || "playlist-1",
      branchId: branches[0]?.id || "branch-main",
      type: "daily",
      startTime: "09:00",
      endTime: "22:00",
      days: ["Dush", "Sesh", "Chor", "Pay", "Jum"],
      priority: 1,
      status: "active",
    }, ...current]);
    pushToast("Jadval qo'shildi.");
  }, [branches, playlists, pushToast]);

  const toggleSchedule = useCallback((id: string) => {
    setSchedules((current) => current.map((schedule) => schedule.id === id ? { ...schedule, status: schedule.status === "active" ? "paused" : "active" } : schedule));
    pushToast("Jadval holati o'zgartirildi.");
  }, [pushToast]);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules((current) => current.filter((schedule) => schedule.id !== id));
    pushToast("Jadval o'chirildi.", "warning");
  }, [pushToast]);

  const addCampaign = useCallback(() => {
    setCampaigns((current) => [{
      id: uid("campaign"),
      name: `Yangi kampaniya ${current.length + 1}`,
      status: "draft",
      startDate: "2026-05-18",
      endDate: "2026-06-18",
      targetBranches: [branches[0]?.id || "branch-main"],
      assignedPlaylists: [playlists[0]?.id || "playlist-1"],
      budget: "5 000 000 so'm",
      impressionsTarget: 25000,
      playbackCount: 0,
    }, ...current]);
    pushToast("Kampaniya yaratildi.");
  }, [branches, playlists, pushToast]);

  const createCampaign = useCallback((input: Partial<Campaign>) => {
    const campaign: Campaign = {
      id: uid("campaign"),
      name: input.name?.trim() || `Yangi kampaniya ${campaigns.length + 1}`,
      status: input.status || "draft",
      startDate: input.startDate || "2026-05-21",
      endDate: input.endDate || "2026-06-21",
      targetBranches: input.targetBranches?.length ? input.targetBranches : [branches[0]?.id || "branch-main"],
      assignedPlaylists: input.assignedPlaylists?.length ? input.assignedPlaylists : [playlists[0]?.id || "playlist-main"],
      budget: input.budget || "0 so'm",
      impressionsTarget: input.impressionsTarget || 0,
      playbackCount: input.playbackCount || 0,
    };
    setCampaigns((current) => [campaign, ...current]);
    pushToast("Kampaniya qo'shildi.");
    return campaign;
  }, [branches, campaigns.length, playlists, pushToast]);

  const updateCampaign = useCallback((id: string, patch: Partial<Campaign>) => {
    setCampaigns((current) => current.map((campaign) => campaign.id === id ? { ...campaign, ...patch } : campaign));
    pushToast("Kampaniya tahrirlandi.");
  }, [pushToast]);

  const setCampaignStatus = useCallback((id: string, status: Campaign["status"]) => {
    setCampaigns((current) => current.map((campaign) => campaign.id === id ? { ...campaign, status } : campaign));
    pushToast("Kampaniya statusi yangilandi.");
  }, [pushToast]);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
    pushToast("Kampaniya o'chirildi.", "warning");
  }, [pushToast]);

  const sendCommand = useCallback((deviceId: string, type: CommandType) => {
    const command: DeviceCommand = { id: uid("cmd"), deviceId, type, status: "queued", message: "Buyruq navbatga qo'yildi", createdAt: formatDateTime() };
    setCommands((current) => [command, ...current]);
    pushToast("Qurilmaga buyruq yuborildi.");
    return command;
  }, [pushToast]);

  const addBranch = useCallback((input: AddBranchInput) => {
    const branch: Branch = {
      id: uid("branch"),
      name: input.name.trim() || `Yangi lokatsiya ${branches.length + 1}`,
      city: input.city?.trim() || "Toshkent",
      address: input.address?.trim() || input.name.trim() || "Yangi manzil",
      campaignId: input.campaignId || campaigns[0]?.id,
      screenCount: 0,
      onlineCount: 0,
      todayPlaybackHours: 0,
      workStart: input.workStart || "09:00",
      workEnd: input.workEnd || "22:00",
    };
    setBranches((current) => [branch, ...current]);
    pushToast("Lokatsiya qo'shildi.");
    return branch;
  }, [branches.length, campaigns, pushToast]);

  const updateBranch = useCallback((id: string, patch: Partial<Branch>) => {
    const oldBranch = branches.find((branch) => branch.id === id);
    const nextName = patch.name?.trim();
    setBranches((current) => current.map((branch) => branch.id === id ? { ...branch, ...patch, name: nextName || branch.name } : branch));
    if (oldBranch && nextName) {
      setDevices((current) => current.map((device) => device.branchId === id ? { ...device, branch: nextName, location: patch.address || device.location } : device));
      setPlaylists((current) => current.map((playlist) => playlist.target === oldBranch.name ? { ...playlist, target: nextName, updatedAt: formatDateTime() } : playlist));
    }
    pushToast("Lokatsiya tahrirlandi.");
  }, [branches, pushToast]);

  const addMediaAsset = useCallback((input: AddMediaInput) => {
    const type = input.type || "video";
    const now = formatDateTime();
    const asset: MediaAsset = {
      id: uid("media"),
      name: input.name.trim() || `Yangi media ${media.length + 1}`,
      type,
      status: "active",
      thumbnailUrl: type === "image"
        ? "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop"
        : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
      fileUrl: type === "image"
        ? "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1920&auto=format&fit=crop"
        : "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      size: type === "video" ? "42.8 MB" : "4.2 MB",
      sizeBytes: type === "video" ? 44879052 : 4404019,
      duration: type === "video" ? input.duration || "00:15" : undefined,
      resolution: "1920x1080",
      orientation: "landscape",
      format: type === "video" ? "MP4" : "JPG",
      folder: input.folder || "Test",
      tags: ["Test", "Kampaniya"],
      uploadedBy: "Super Admin",
      uploadedAt: now,
      usedInPlaylists: 0,
      usedOnScreens: 0,
      lastPlayed: now,
      playbackCount: 0,
      cdnUrl: "https://cdn.castmap.uz/mock/test-media",
    };
    setMedia((current) => [asset, ...current]);
    pushToast("Media qo'shildi.");
    return asset;
  }, [media.length, pushToast]);

  const createMediaFromDraft = useCallback((draft: UploadDraft) => {
    const type = draft.category || "video";
    const now = formatDateTime();
    const webUrl = normalizeWebUrl(draft.webUrl);
    const streamType = draft.streamType || detectStreamType(webUrl);
    const fileUrl = webUrl || draft.uploadedFileUrl;
    const fileName = draft.uploadedFileName || draft.name.trim() || webUrlToName(webUrl);
    const fileSize = webUrl ? 0 : draft.uploadedSizeBytes || (type === "video" ? 44_879_052 : 4_404_019);
    const format = webUrl ? streamFormat(streamType) : (draft.uploadedMime?.split("/")[1] || fileName.split(".").pop() || type).toUpperCase();
    const asset: MediaAsset = {
      id: uid("media"),
      name: draft.name.trim() || fileName || `castmap_${type}_asset`,
      type,
      status: draft.approvalRequired ? "approval" : "active",
      thumbnailUrl: type === "image" && fileUrl
        ? fileUrl
        : type === "image"
          ? "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
      fileUrl: fileUrl || (type === "image"
        ? "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1920&auto=format&fit=crop"
        : type === "web"
          ? "about:blank"
          : "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"),
      size: webUrl ? (streamType ? "Stream URL" : "URL") : formatBytes(fileSize),
      sizeBytes: fileSize,
      duration: type === "video" ? "00:15" : undefined,
      resolution: streamType ? "Adaptive stream" : type === "web" || type === "html" ? "Responsive" : "1920x1080",
      orientation: type === "web" || type === "html" ? "responsive" : "landscape",
      format,
      folder: draft.folder || "Promo",
      tags: streamType ? [...new Set([...(draft.tags.length ? draft.tags : ["Promo"]), "Stream"])] : draft.tags.length ? draft.tags : ["Promo"],
      uploadedBy: "Super Admin",
      uploadedAt: now,
      usedInPlaylists: draft.addToPlaylist ? 1 : 0,
      usedOnScreens: 0,
      lastPlayed: now,
      playbackCount: 0,
      cdnUrl: fileUrl || `https://cdn.castmap.uz/media/${encodeURIComponent(draft.name.trim() || `castmap_${type}_asset`)}`,
      streamType,
    };
    setMedia((current) => [asset, ...current]);
    if (draft.addToPlaylist) {
      setPlaylists((current) => {
        const playlistItem = {
          id: uid("item"),
          mediaId: asset.id,
          duration: asset.type === "video" ? 20 : 10,
          transition: "fade" as const,
          order: 1,
          priority: 1,
          status: "active" as const,
        };
        if (!current.length) {
          return [{
            id: uid("playlist"),
            name: "APK media playlist",
            description: "Media upload orqali avtomatik yaratilgan playlist",
            target: "Barcha TV qurilmalar",
            status: "published",
            loop: true,
            items: [playlistItem],
            updatedAt: now,
          }, ...current];
        }

        const targetIndex = current.findIndex((playlist) => playlist.status === "published");
        const index = targetIndex >= 0 ? targetIndex : 0;
        return current.map((playlist, playlistIndex) => {
          if (playlistIndex !== index || playlist.items.some((item) => item.mediaId === asset.id)) return playlist;
          return {
            ...playlist,
            items: [
              ...playlist.items,
              {
                ...playlistItem,
                order: playlist.items.length + 1,
              },
            ],
            updatedAt: now,
          };
        });
      });
    }
    pushToast("Media saqlandi.");
    return asset;
  }, [pushToast]);

  const updateMediaAsset = useCallback((asset: MediaAsset) => {
    setMedia((current) => current.map((item) => item.id === asset.id ? asset : item));
    pushToast("Media yangilandi.");
  }, [pushToast]);

  const addMediaToPlaylist = useCallback((mediaId: string, playlistId: string) => {
    const asset = media.find((item) => item.id === mediaId);
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!asset || !playlist) {
      pushToast("Media yoki playlist topilmadi.", "warning");
      return;
    }
    const alreadyIncluded = playlist.items.some((playlistItem) => playlistItem.mediaId === mediaId);
    if (alreadyIncluded) {
      pushToast(`${asset.name} bu playlistda allaqachon bor.`, "info");
      return;
    }
    setPlaylists((current) => current.map((item) => {
      if (item.id !== playlistId) return item;
      return {
        ...item,
        items: [
          ...item.items,
          {
            id: uid("item"),
            mediaId,
            duration: asset.type === "video" ? 20 : 10,
            transition: "fade",
            order: item.items.length + 1,
            priority: 1,
            status: "active",
          },
        ],
        updatedAt: formatDateTime(),
      };
    }));
    const nextUsage = playlists.filter((item) => item.items.some((entry) => entry.mediaId === mediaId)).length + 1;
    setMedia((current) => current.map((item) => item.id === mediaId ? { ...item, usedInPlaylists: Math.max(item.usedInPlaylists, nextUsage) } : item));
    pushToast(`${asset.name} "${playlist.name}" playlistiga qo'shildi.`);
  }, [media, playlists, pushToast]);

  const deleteMediaAsset = useCallback((id: string) => {
    setMedia((current) => current.filter((asset) => asset.id !== id));
    setPlaylists((current) => current.map((playlist) => ({
      ...playlist,
      items: playlist.items.filter((item) => item.mediaId !== id),
      updatedAt: formatDateTime(),
    })));
    setPlaybackLogs((current) => current.filter((log) => log.mediaId !== id));
    pushToast("Media o'chirildi.", "warning");
  }, [pushToast]);

  const pairDevice = useCallback((code: string, name: string, branchId: string) => {
    const branch = branches.find((item) => item.id === branchId) || branches[0];
    if (!branch) {
      pushToast("Avval lokatsiya yarating.", "warning");
      return;
    }
    const source = devices[0];
    const latestApkVersion = apkVersions.find((version) => version.status === "latest")?.version || source?.apkVersion || "v1.2.2";
    const cleanCode = code.trim().toUpperCase().replace(/^CM-PAIR-/i, "").replace(/^CMPAIR/i, "").replace(/[^A-Z0-9]/g, "");
    setDevices((current) => [{
      id: uid("device"),
      name: name || `CASTMAP Player ${code}`,
      deviceId: `CM-PAIR-${cleanCode || "482913"}`,
      branch: branch.name,
      branchId: branch.id,
      location: branch.address,
      type: source?.type || "CASTMAP Box",
      status: "online",
      signal: 95,
      storage: source?.storage || 8,
      ram: source?.ram || 18,
      cpu: source?.cpu || 9,
      playlist: playlists[0]?.name || "Playlist biriktirilmagan",
      lastSeen: "Hozir",
      apkVersion: latestApkVersion,
      ipAddress: source?.ipAddress || "192.168.0.120",
      macAddress: source?.macAddress || "00:CM:48:29:13:00",
      uptime: "0 kun 0 soat",
      screenResolution: source?.screenResolution || "1920 x 1080",
      lastHeartbeat: "Hozir",
      screenshotUrl: source?.screenshotUrl || "",
    }, ...current]);
    pushToast("Qurilma muvaffaqiyatli ulandi.");
  }, [apkVersions, branches, devices, playlists, pushToast]);

  const updateDevice = useCallback((id: string, patch: Partial<Device>) => {
    setDevices((current) => current.map((device) => {
      if (device.id !== id) return device;
      const nextBranch = patch.branchId ? branches.find((branch) => branch.id === patch.branchId) : undefined;
      return {
        ...device,
        ...patch,
        branch: nextBranch?.name || patch.branch || device.branch,
        location: nextBranch?.address || patch.location || device.location,
      };
    }));
    pushToast("Qurilma tahrirlandi.");
  }, [branches, pushToast]);

  const deleteDevice = useCallback((id: string) => {
    setDevices((current) => current.filter((device) => device.id !== id));
    setAlerts((current) => current.filter((alert) => alert.deviceId !== id));
    setCommands((current) => current.filter((command) => command.deviceId !== id));
    setPlaybackLogs((current) => current.filter((log) => log.deviceId !== id));
    pushToast("Qurilma o'chirildi.", "warning");
  }, [pushToast]);

  const createTestChain = useCallback((input: TestChainInput) => {
    const now = formatDateTime();
    const cleanPairingCode = input.pairingCode.trim().toUpperCase() || "482-913";
    const deviceSuffix = cleanPairingCode.replace(/[^A-Z0-9]/g, "").slice(0, 8) || String(Date.now()).slice(-6);
    const branch: Branch = {
      id: uid("branch"),
      name: input.branchName.trim() || `Test lokatsiya ${branches.length + 1}`,
      city: input.city.trim() || "Toshkent",
      address: input.branchName.trim() || "Test manzil",
      campaignId: undefined,
      screenCount: 1,
      onlineCount: 1,
      todayPlaybackHours: 1,
      workStart: input.workStart || "09:00",
      workEnd: input.workEnd || "22:00",
    };
    const mediaAsset: MediaAsset = {
      id: uid("media"),
      name: input.campaignName.trim() || "Test kampaniya",
      type: "video",
      status: "active",
      thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
      fileUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      size: "42.8 MB",
      sizeBytes: 44879052,
      duration: "00:15",
      resolution: "1920x1080",
      orientation: "landscape",
      format: "MP4",
      folder: "Test kampaniya",
      tags: ["Test", "Video"],
      uploadedBy: "Super Admin",
      uploadedAt: now,
      usedInPlaylists: 1,
      usedOnScreens: 1,
      lastPlayed: now,
      playbackCount: 1,
      cdnUrl: "https://cdn.castmap.uz/mock/test-video.mp4",
    };
    const playlist: Playlist = {
      id: uid("playlist"),
      name: `${branch.name} playlist`,
      description: "Test uchun avtomatik yaratilgan playlist",
      target: branch.name,
      status: "published",
      loop: true,
      items: [{
        id: uid("item"),
        mediaId: mediaAsset.id,
        duration: 15,
        transition: "fade",
        order: 1,
        priority: 1,
        status: "active",
      }],
      updatedAt: now,
    };
    const device: Device = {
      id: uid("device"),
      name: input.screenName.trim() || `${branch.name} TV 01`,
      deviceId: `CM-PAIR-${deviceSuffix}`,
      branch: branch.name,
      branchId: branch.id,
      location: branch.address,
      type: "CASTMAP Box",
      status: "online",
      signal: 96,
      storage: 12,
      ram: 22,
      cpu: 14,
      playlist: playlist.name,
      lastSeen: "Hozir",
      apkVersion: "v1.0.5",
      ipAddress: "192.168.0.120",
      macAddress: "00:CM:AA:BB:CC:01",
      uptime: "0 kun 1 soat",
      screenResolution: "1920 x 1080",
      currentMediaId: mediaAsset.id,
      lastHeartbeat: "Hozir",
      screenshotUrl: mediaAsset.thumbnailUrl,
    };
    const schedule: Schedule = {
      id: uid("schedule"),
      name: `${branch.name} ish grafigi`,
      playlistId: playlist.id,
      branchId: branch.id,
      type: "daily",
      startTime: branch.workStart,
      endTime: branch.workEnd,
      days: ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"],
      priority: 1,
      status: "active",
    };
    const campaign: Campaign = {
      id: uid("campaign"),
      name: input.campaignName.trim() || `${branch.name} test kampaniya`,
      status: "active",
      startDate: "2026-05-18",
      endDate: "2026-06-18",
      targetBranches: [branch.id],
      assignedPlaylists: [playlist.id],
      budget: "0 so'm",
      impressionsTarget: 1000,
      playbackCount: 1,
    };
    branch.campaignId = campaign.id;
    const log: PlaybackLog = {
      id: uid("log"),
      deviceId: device.id,
      mediaId: mediaAsset.id,
      playlistId: playlist.id,
      eventType: "start",
      timestamp: now,
      durationSeconds: 15,
    };
    setBranches((current) => [branch, ...current]);
    setMedia((current) => [mediaAsset, ...current]);
    setPlaylists((current) => [playlist, ...current]);
    setDevices((current) => [device, ...current]);
    setSchedules((current) => [schedule, ...current]);
    setCampaigns((current) => [campaign, ...current]);
    setPlaybackLogs((current) => [log, ...current]);
    pushToast(`APK kodi ${cleanPairingCode} bilan test lokatsiya, ekran, playlist, jadval va kampaniya yaratildi.`);
  }, [branches.length, pushToast]);

  const deleteBranch = useCallback((id: string) => {
    const branch = branches.find((item) => item.id === id);
    setBranches((current) => current.filter((item) => item.id !== id));
    setDevices((current) => current.filter((device) => device.branchId !== id));
    setSchedules((current) => current.filter((schedule) => schedule.branchId !== id));
    setCampaigns((current) => current.map((campaign) => ({ ...campaign, targetBranches: campaign.targetBranches.filter((branchId) => branchId !== id) })));
    setUsers((current) => current.map((user) => ({ ...user, branchAccess: user.branchAccess.filter((branchId) => branchId !== id) })));
    pushToast(`${branch?.name || "Lokatsiya"} o'chirildi. Unga bog'langan test device va jadval ham tozalandi.`, "warning");
  }, [branches, pushToast]);

  const clearTestBranches = useCallback(() => {
    const removableIds = new Set(branches.filter((branch) => /test|demo|namuna|sinov/i.test(`${branch.name} ${branch.city} ${branch.address || ""}`)).map((branch) => branch.id));
    if (!removableIds.size) {
      pushToast("Test lokatsiya topilmadi. Kerak bo'lsa lokatsiyani alohida o'chiring.", "info");
      return;
    }
    setBranches((current) => current.filter((branch) => !removableIds.has(branch.id)));
    setDevices((current) => current.filter((device) => !removableIds.has(device.branchId)));
    setSchedules((current) => current.filter((schedule) => !removableIds.has(schedule.branchId)));
    setCampaigns((current) => current.map((campaign) => ({ ...campaign, targetBranches: campaign.targetBranches.filter((id) => !removableIds.has(id)) })));
    setUsers((current) => current.map((user) => ({ ...user, branchAccess: user.branchAccess.filter((id) => !removableIds.has(id)) })));
    pushToast(`${removableIds.size} ta test lokatsiya tozalandi.`, "warning");
  }, [branches, pushToast]);

  const clearTemplates = useCallback(() => {
    const count = media.filter((asset) => asset.type === "template").length;
    setMedia((current) => current.filter((asset) => asset.type !== "template"));
    pushToast(count ? `${count} ta shablon media o'chirildi.` : "Shablon media fayl topilmadi.", count ? "warning" : "info");
  }, [media, pushToast]);

  const clearOperationalData = useCallback(() => {
    setDevices([]);
    setMedia([]);
    setPlaylists([]);
    setSchedules([]);
    setCampaigns([]);
    setAlerts([]);
    setUsers([]);
    setBranches([]);
    setApkVersions([]);
    setWidgets([]);
    setPlaybackLogs([]);
    setCommands([]);
    pushToast("Barcha test va operatsion ma'lumotlar tozalandi.", "warning");
  }, [pushToast]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, status: "resolved" } : alert));
    pushToast("Ogohlantirish yopildi.");
  }, [pushToast]);

  const ignoreAlert = useCallback((id: string) => {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, status: "ignored" } : alert));
    pushToast("Ogohlantirish e'tibordan chetlatildi.", "warning");
  }, [pushToast]);

  const deleteAlert = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
    pushToast("Ogohlantirish o'chirildi.", "warning");
  }, [pushToast]);

  const addUser = useCallback(() => {
    setUsers((current) => [{ id: uid("user"), name: `Yangi foydalanuvchi ${current.length + 1}`, email: `user${current.length + 1}@castmap.uz`, role: "Operator", branchAccess: [branches[0]?.id || "branch-main"], status: "active", lastLogin: "Hali kirmagan" }, ...current]);
    pushToast("Foydalanuvchi yaratildi.");
  }, [branches, pushToast]);

  const toggleUserStatus = useCallback((id: string) => {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, status: user.status === "active" ? "inactive" : "active" } : user));
    pushToast("Foydalanuvchi holati o'zgardi.");
  }, [pushToast]);

  const deleteUser = useCallback((id: string) => {
    setUsers((current) => current.filter((user) => user.id !== id));
    pushToast("Foydalanuvchi o'chirildi.", "warning");
  }, [pushToast]);

  const updatePlan = useCallback((id: string) => {
    setBillingPlans((current) => current.map((plan) => ({ ...plan, current: plan.id === id })));
    pushToast("Tarif rejasi yangilandi.");
  }, [pushToast]);

  const uploadApk = useCallback(() => {
    setApkVersions((current) => [{
      id: uid("apk"),
      version: "v1.2.2",
      changelog: "Auto update polling, live monitoring va admin rollout command",
      fileName: "castmap-player-1.2.2.apk",
      size: "6.3 MB",
      status: "staged",
      installedDevices: 0,
      failedDevices: 0,
      uploadedAt: formatDateTime(),
    }, ...current]);
    pushToast("Yangi APK versiya yuklandi.");
  }, [pushToast]);

  const rolloutApk = useCallback((versionId: string) => {
    const targetVersion = apkVersions.find((version) => version.id === versionId);
    setApkVersions((current) => current.map((version) => version.id === versionId ? { ...version, status: "latest" } : { ...version, status: version.status === "latest" ? "active" : version.status }));
    if (targetVersion) {
      const updateCommands = devices
        .filter((device) => device.apkVersion !== targetVersion.version)
        .map((device) => ({
          id: uid("cmd"),
          deviceId: device.id,
          type: "UPDATE_APK" as const,
          status: "queued" as const,
          message: `${targetVersion.version} versiyasiga yangilash navbatga qo'yildi`,
          createdAt: formatDateTime(),
        }));
      if (updateCommands.length) setCommands((current) => [...updateCommands, ...current]);
      setDevices((current) => current.map((device) => device.apkVersion !== targetVersion.version ? { ...device, status: "update" as const } : device));
    }
    pushToast("APK rollout boshlandi. Eski APKdagi TVlarga update command yuborildi.");
  }, [apkVersions, devices, pushToast]);

  const rollbackApk = useCallback((versionId: string) => {
    setApkVersions((current) => current.map((version) => version.id === versionId ? { ...version, status: "rollback" } : version));
    pushToast("Rollback belgilanib qo'yildi.", "warning");
  }, [pushToast]);

  const deleteApkVersion = useCallback((versionId: string) => {
    setApkVersions((current) => current.filter((version) => version.id !== versionId));
    pushToast("APK versiya o'chirildi.", "warning");
  }, [pushToast]);

  const addWidgetToPlaylist = useCallback((widgetId: string) => {
    setWidgets((current) => current.map((widget) => widget.id === widgetId ? { ...widget, status: "active" } : widget));
    pushToast("Widget playlistga qo'shildi.");
  }, [pushToast]);

  const deleteWidget = useCallback((widgetId: string) => {
    setWidgets((current) => current.filter((widget) => widget.id !== widgetId));
    pushToast("Widget o'chirildi.", "warning");
  }, [pushToast]);

  const value = useMemo<CastmapState>(() => ({
    devices,
    media,
    playlists,
    schedules,
    campaigns,
    alerts,
    users,
    branches,
    billingPlans,
    invoices: invoiceSeed,
    apkVersions,
    widgets,
    playbackLogs,
    commands,
    toasts,
    pushToast,
    addPlaylist,
    createPlaylist,
    updatePlaylist,
    publishPlaylist,
    duplicatePlaylist,
    deletePlaylist,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    addCampaign,
    createCampaign,
    updateCampaign,
    setCampaignStatus,
    deleteCampaign,
    sendCommand,
    pairDevice,
    updateDevice,
    deleteDevice,
    addBranch,
    updateBranch,
    addMediaAsset,
    createMediaFromDraft,
    updateMediaAsset,
    addMediaToPlaylist,
    deleteMediaAsset,
    createTestChain,
    deleteBranch,
    clearTestBranches,
    clearTemplates,
    clearOperationalData,
    resolveAlert,
    ignoreAlert,
    deleteAlert,
    addUser,
    toggleUserStatus,
    deleteUser,
    updatePlan,
    uploadApk,
    rolloutApk,
    rollbackApk,
    deleteApkVersion,
    addWidgetToPlaylist,
    deleteWidget,
  }), [addBranch, addCampaign, addMediaAsset, addMediaToPlaylist, addPlaylist, addSchedule, addUser, addWidgetToPlaylist, alerts, apkVersions, billingPlans, branches, campaigns, clearOperationalData, clearTemplates, clearTestBranches, commands, createCampaign, createMediaFromDraft, createPlaylist, createTestChain, deleteAlert, deleteApkVersion, deleteBranch, deleteCampaign, deleteDevice, deleteMediaAsset, deletePlaylist, deleteSchedule, deleteUser, deleteWidget, devices, duplicatePlaylist, ignoreAlert, media, pairDevice, playbackLogs, playlists, publishPlaylist, pushToast, resolveAlert, rollbackApk, rolloutApk, schedules, sendCommand, setCampaignStatus, toasts, toggleSchedule, toggleUserStatus, updateBranch, updateCampaign, updateDevice, updateMediaAsset, updatePlan, updatePlaylist, uploadApk, users, widgets]);

  return (
    <CastmapContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </CastmapContext.Provider>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function normalizeWebUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!["http:", "https:", "rtsp:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function detectStreamType(value?: string): MediaAsset["streamType"] | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("rtsp://")) return "rtsp";
  if (trimmed.includes(".m3u8") || trimmed.includes("m3u8")) return "hls";
  if (trimmed.includes(".mpd") || trimmed.includes("dash")) return "dash";
  if (/^https?:\/\//.test(trimmed)) return "progressive";
  return "stream";
}

function streamFormat(streamType: MediaAsset["streamType"] | undefined) {
  if (streamType === "hls") return "HLS";
  if (streamType === "dash") return "DASH";
  if (streamType === "rtsp") return "RTSP";
  if (streamType === "progressive") return "URL";
  return "STREAM";
}

function webUrlToName(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "") || "web_content";
  } catch {
    return "";
  }
}

export function useCastmapStore() {
  const context = useContext(CastmapContext);
  if (!context) throw new Error("useCastmapStore must be used inside CastmapProvider");
  return context;
}

function ToastViewport({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="fixed right-5 top-5 z-[80] grid w-[360px] max-w-[calc(100vw-32px)] gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-gold ${
            toast.tone === "danger"
              ? "border-red-400/30 bg-red-500/15 text-red-200"
              : toast.tone === "warning"
                ? "border-orange-400/30 bg-orange-500/15 text-orange-200"
                : toast.tone === "info"
                  ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
                  : "border-castGold/30 bg-castGold/15 text-castGold"
          }`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
