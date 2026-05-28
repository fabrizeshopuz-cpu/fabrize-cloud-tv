import type { MediaAsset, MediaFolder, MediaMetric, UploadDraft } from "@/types/media";

export const defaultTags = [
  "Food",
  "Promo",
  "Drinks",
  "Retail",
  "Pharmacy",
  "Restaurant",
  "Fashion",
  "Seasonal",
  "Emergency",
  "Widget",
  "Menu",
  "Discount",
];

export const mediaFolders: MediaFolder[] = [
  { name: "Barcha fayllar", count: 8 },
  { name: "Promo", count: 2 },
  { name: "Food", count: 2 },
  { name: "Retail Ads", count: 2 },
  { name: "Pharmacy", count: 1 },
  { name: "Restaurant Menu", count: 1 },
  { name: "Seasonal", count: 0 },
  { name: "Emergency", count: 1 },
  { name: "Archive", count: 0 },
];

export const mediaMetrics: MediaMetric[] = [
  { title: "Jami media", value: "8", subtext: "Kutubxonadagi aktiv fayllar", tone: "violet" },
  { title: "Video fayllar", value: "3", subtext: "MP4, MOV, WEBM", tone: "green" },
  { title: "Rasmlar", value: "2", subtext: "JPG, PNG, WEBP, SVG", tone: "blue" },
  { title: "Storage ishlatilgan", value: "181 MB / 1 TB", subtext: "0.02% ishlatilgan", tone: "gold", progress: 0.02 },
];

const mediaTypeText = {
  video: "Video",
  image: "Rasm",
  web: "Web",
  html: "HTML",
  pdf: "PDF",
  template: "Template",
} as const;

const mediaStatusText = {
  active: "Aktiv",
  draft: "Qoralama",
  approval: "Tasdiq kutmoqda",
  archived: "Arxiv",
  expired: "Muddati tugagan",
  processing: "Qayta ishlanmoqda",
  failed: "Xatolik",
} as const;

export const typeText = (type: keyof typeof mediaTypeText) => mediaTypeText[type];

export const statusText = (status: keyof typeof mediaStatusText) => mediaStatusText[status];

export const mediaAssetsMock: MediaAsset[] = [
  {
    id: "media-burger-menu",
    name: "burger_menu_may.mp4",
    type: "video",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/burger_menu_may.mp4",
    size: "42.8 MB",
    sizeBytes: 44_901_120,
    duration: "00:15",
    resolution: "1920x1080",
    orientation: "landscape",
    format: "MP4",
    folder: "Food",
    tags: ["Food", "Promo"],
    uploadedBy: "Operator",
    uploadedAt: "2026-05-17 12:30",
    usedInPlaylists: 12,
    usedOnScreens: 8,
    lastPlayed: "2026-05-20 11:40",
    playbackCount: 248,
    cdnUrl: "https://cdn.castmap.uz/media/burger_menu_may.mp4",
  },
  {
    id: "media-coffee-banner",
    name: "coffee_time_banner.jpg",
    type: "image",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/coffee_time_banner.jpg",
    size: "4.2 MB",
    sizeBytes: 4_404_019,
    resolution: "1920x1080",
    orientation: "landscape",
    format: "JPG",
    folder: "Promo",
    tags: ["Coffee", "Morning"],
    uploadedBy: "Admin",
    uploadedAt: "2026-05-16 09:15",
    usedInPlaylists: 5,
    usedOnScreens: 4,
    lastPlayed: "2026-05-20 10:10",
    playbackCount: 96,
    cdnUrl: "https://cdn.castmap.uz/media/coffee_time_banner.jpg",
  },
  {
    id: "media-mega-sale",
    name: "mega_sale_70.png",
    type: "image",
    status: "approval",
    thumbnailUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/mega_sale_70.png",
    size: "3.8 MB",
    sizeBytes: 3_984_589,
    resolution: "1080x1920",
    orientation: "portrait",
    format: "PNG",
    folder: "Retail Ads",
    tags: ["Sale", "Retail"],
    uploadedBy: "Operator",
    uploadedAt: "2026-05-15 18:45",
    usedInPlaylists: 0,
    usedOnScreens: 0,
    playbackCount: 0,
    cdnUrl: "https://cdn.castmap.uz/media/mega_sale_70.png",
  },
  {
    id: "media-pharmacy-info",
    name: "pharmacy_info_screen.mp4",
    type: "video",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/pharmacy_info_screen.mp4",
    size: "85 MB",
    sizeBytes: 89_128_960,
    duration: "00:30",
    resolution: "3840x2160",
    orientation: "landscape",
    format: "MP4",
    folder: "Pharmacy",
    tags: ["Pharmacy", "Info"],
    uploadedBy: "Admin",
    uploadedAt: "2026-05-14 16:20",
    usedInPlaylists: 8,
    usedOnScreens: 12,
    lastPlayed: "2026-05-20 09:20",
    playbackCount: 184,
    cdnUrl: "https://cdn.castmap.uz/media/pharmacy_info_screen.mp4",
  },
  {
    id: "media-emergency",
    name: "emergency_message.html",
    type: "html",
    status: "draft",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/emergency_message.html",
    size: "280 KB",
    sizeBytes: 286_720,
    resolution: "Responsive",
    orientation: "responsive",
    format: "HTML",
    folder: "Emergency",
    tags: ["Emergency"],
    uploadedBy: "Super Admin",
    uploadedAt: "2026-05-13 13:05",
    usedInPlaylists: 0,
    usedOnScreens: 0,
    playbackCount: 0,
    cdnUrl: "https://cdn.castmap.uz/media/emergency_message.html",
  },
  {
    id: "media-weather-widget",
    name: "weather_widget_url",
    type: "web",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://weather.castmap.uz/widget",
    size: "URL",
    sizeBytes: 0,
    resolution: "Responsive",
    orientation: "responsive",
    format: "URL",
    folder: "Promo",
    tags: ["Widget", "Weather"],
    uploadedBy: "Admin",
    uploadedAt: "2026-05-12 08:40",
    usedInPlaylists: 18,
    usedOnScreens: 24,
    lastPlayed: "2026-05-20 11:55",
    playbackCount: 412,
    cdnUrl: "https://weather.castmap.uz/widget",
  },
  {
    id: "media-new-collection",
    name: "new_collection_ad.webm",
    type: "video",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/new_collection_ad.webm",
    size: "33 MB",
    sizeBytes: 34_603_008,
    duration: "00:20",
    resolution: "1920x1080",
    orientation: "landscape",
    format: "WEBM",
    folder: "Retail Ads",
    tags: ["Fashion", "Promo"],
    uploadedBy: "Operator",
    uploadedAt: "2026-05-11 17:40",
    usedInPlaylists: 7,
    usedOnScreens: 9,
    lastPlayed: "2026-05-20 08:30",
    playbackCount: 141,
    cdnUrl: "https://cdn.castmap.uz/media/new_collection_ad.webm",
  },
  {
    id: "media-offer-pdf",
    name: "retail_offer.pdf",
    type: "pdf",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
    fileUrl: "https://cdn.castmap.uz/media/retail_offer.pdf",
    size: "12 MB",
    sizeBytes: 12_582_912,
    resolution: "A4",
    orientation: "responsive",
    format: "PDF",
    folder: "Retail Ads",
    tags: ["Retail", "Offer"],
    uploadedBy: "Manager",
    uploadedAt: "2026-05-10 11:10",
    usedInPlaylists: 2,
    usedOnScreens: 2,
    lastPlayed: "2026-05-19 15:45",
    playbackCount: 38,
    cdnUrl: "https://cdn.castmap.uz/media/retail_offer.pdf",
  },
];

const delay = async () => new Promise((resolve) => window.setTimeout(resolve, 180));

export async function fetchMediaAssets() {
  await delay();
  return mediaAssetsMock;
}

export async function uploadMediaAsset(draft: UploadDraft): Promise<MediaAsset> {
  await delay();
  const webUrl = normalizeWebUrl(draft.webUrl);
  const streamType = draft.streamType || detectStreamType(webUrl);
  const fileUrl = webUrl || draft.uploadedFileUrl || `https://cdn.castmap.uz/media/${encodeURIComponent(draft.name || "yangi_media")}`;
  const sizeBytes = webUrl ? 0 : draft.uploadedSizeBytes || (draft.category === "video" ? 25_165_824 : 3_145_728);
  return {
    id: `media-${Date.now()}`,
    name: draft.name || webUrlToName(webUrl) || "yangi_media.mp4",
    type: draft.category,
    status: draft.approvalRequired ? "approval" : "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    fileUrl,
    size: webUrl ? "URL" : draft.category === "video" ? "24 MB" : "3 MB",
    sizeBytes,
    duration: draft.category === "video" ? "00:20" : undefined,
    resolution: draft.category === "html" || draft.category === "web" ? "Responsive" : "1920x1080",
    orientation: draft.category === "html" || draft.category === "web" ? "responsive" : "landscape",
    format: webUrl ? streamFormat(streamType) : draft.category.toUpperCase(),
    folder: draft.folder,
    tags: draft.tags,
    uploadedBy: "Super Admin",
    uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    usedInPlaylists: draft.addToPlaylist ? 1 : 0,
    usedOnScreens: 0,
    playbackCount: 0,
    cdnUrl: fileUrl,
    streamType,
  };
}

export async function deleteMediaAsset(_id: string) {
  await delay();
  return { ok: true };
}

export async function updateMediaMetadata(asset: MediaAsset) {
  await delay();
  return asset;
}

export async function approveMediaAsset(asset: MediaAsset) {
  return updateMediaMetadata({ ...asset, status: "active" });
}

export async function rejectMediaAsset(asset: MediaAsset, _reason: string) {
  return updateMediaMetadata({ ...asset, status: "draft" });
}

export async function moveMediaToFolder(asset: MediaAsset, folder: string) {
  return updateMediaMetadata({ ...asset, folder });
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
