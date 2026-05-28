import { Activity, Building2, Clapperboard, Cloud, CreditCard, Eye, GalleryVerticalEnd, LayoutDashboard, Monitor, PlayCircle, RadioTower, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type V2MediaType = "video" | "image" | "web";
export type V2DeviceStatus = "online" | "offline" | "error";

export interface V2Metric {
  label: string;
  value: string;
  detail: string;
  tone: "gold" | "green" | "blue" | "red";
}

export interface V2NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface V2MediaAsset {
  id: string;
  title: string;
  type: V2MediaType;
  duration: string;
  size: string;
  status: "ready" | "review" | "blocked";
  preview: string;
  playlistCount: number;
}

export interface V2Playlist {
  id: string;
  title: string;
  branch: string;
  status: "published" | "draft";
  items: string[];
  updatedAt: string;
}

export interface V2Device {
  id: string;
  name: string;
  code: string;
  branch: string;
  status: V2DeviceStatus;
  apk: string;
  current: string;
  heartbeat: string;
}

export const clientNav: V2NavItem[] = [
  { label: "Overview", href: "/browse?tab=overview", icon: LayoutDashboard },
  { label: "Kampaniyalar", href: "/browse?tab=campaigns", icon: RadioTower },
  { label: "Lokatsiyalar", href: "/browse?tab=locations", icon: Building2 },
  { label: "TV qurilmalar", href: "/browse?tab=devices", icon: Monitor },
  { label: "Playlistlar", href: "/browse?tab=playlists", icon: GalleryVerticalEnd },
  { label: "Media", href: "/browse?tab=media", icon: Clapperboard },
  { label: "Live", href: "/browse?tab=live", icon: Eye },
  { label: "APK", href: "/browse?tab=apk", icon: Smartphone },
  { label: "Billing", href: "/browse?tab=billing", icon: CreditCard },
];

export const superAdminNav: V2NavItem[] = [
  { label: "Tenants", href: "/super-admin", icon: Building2 },
  { label: "Screens", href: "/super-admin?view=screens", icon: Monitor },
  { label: "Storage", href: "/super-admin?view=storage", icon: Cloud },
  { label: "APK releases", href: "/super-admin?view=apk", icon: Smartphone },
  { label: "Audit", href: "/super-admin?view=audit", icon: ShieldCheck },
];

export const v2Metrics: V2Metric[] = [
  { label: "Active screens", value: "1", detail: "Bunyodkor TV online", tone: "green" },
  { label: "Media files", value: "2", detail: "2 video, 0 image", tone: "gold" },
  { label: "Playback health", value: "96%", detail: "Last 24 hours", tone: "blue" },
  { label: "Open alerts", value: "0", detail: "No blocking issue", tone: "green" },
];

export const v2Media: V2MediaAsset[] = [
  {
    id: "media-start-video-20260527",
    title: "a_cb_c_e_d_a_f_a_v_mp_.mp4",
    type: "video",
    duration: "00:10",
    size: "2.1 MB",
    status: "ready",
    preview: "https://castmap.uz/api/uploads/a_cb_c_e_d_a_f_a_v_mp_-1779893774825.mp4",
    playlistCount: 1,
  },
  {
    id: "media-legacy-promo",
    title: "SaveVid_Net promo.mp4",
    type: "video",
    duration: "00:20",
    size: "2.5 MB",
    status: "ready",
    preview: "https://castmap.uz/api/uploads/SaveVid_Net_AQP85iHmnkpY_93zfpf_EnTdI5im4Du3uerLdQzFy1R4TuVl3UzsNSMCYPpg8RBJ-1779432744271.mp4",
    playlistCount: 1,
  },
];

export const v2Playlists: V2Playlist[] = [
  {
    id: "playlist-a3hlv3-mpfic67j",
    title: "rek",
    branch: "Bunyodkor",
    status: "published",
    items: ["a_cb_c_e_d_a_f_a_v_mp_.mp4", "SaveVid_Net promo.mp4"],
    updatedAt: "2026-05-27 19:56",
  },
];

export const v2Devices: V2Device[] = [
  {
    id: "device-kj8aha-mpgpx88j",
    name: "CASTMAP Player 01",
    code: "CM-PAIR-CSWGYK3Y",
    branch: "Bunyodkor",
    status: "online",
    apk: "v1.2.2",
    current: "a_cb_c_e_d_a_f_a_v_mp_.mp4",
    heartbeat: "Hozir",
  },
];

export const platformModules = [
  { title: "Public site", text: "Mahsulot, tarif, demo so'rovi va hamkorlik sahifalari", icon: RadioTower },
  { title: "Client cabinet", text: "Media yuklash, playlist tuzish, ekranlarni ulash va billing", icon: UsersRound },
  { title: "Super admin", text: "Mijozlar, tenant limitlari, APK release va audit boshqaruvi", icon: ShieldCheck },
  { title: "TV player APK", text: "Pairing, playlist sync, offline cache va playback telemetry", icon: PlayCircle },
];

export const tenantRows = [
  ["Fabrize", "1 ekran", "Professional", "Online", "2.1 MB used"],
  ["Demo Retail", "0 ekran", "Trial", "Setup", "0 MB used"],
  ["Bunyodkor Market", "1 ekran", "Business", "Online", "4.6 MB used"],
];
