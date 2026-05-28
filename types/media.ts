export type MediaType = "video" | "image" | "web" | "html" | "pdf" | "template";

export type MediaStatus = "active" | "draft" | "approval" | "archived" | "expired" | "processing" | "failed";

export type MediaOrientation = "landscape" | "portrait" | "square" | "responsive";

export type MediaRole = "Super Admin" | "Admin" | "Operator" | "Viewer";

export type MediaSortOption = "latest" | "oldest" | "name" | "size" | "usage" | "lastPlayed";

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  status: MediaStatus;
  thumbnailUrl: string;
  fileUrl: string;
  size: string;
  sizeBytes: number;
  duration?: string;
  resolution?: string;
  orientation: MediaOrientation;
  format: string;
  folder: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  usedInPlaylists: number;
  usedOnScreens: number;
  lastPlayed?: string;
  playbackCount: number;
  cdnUrl?: string;
  streamType?: "hls" | "dash" | "rtsp" | "progressive" | "stream";
}

export interface MediaFolder {
  name: string;
  count: number;
  description?: string;
  permission?: string;
}

export interface MediaMetric {
  title: string;
  value: string;
  subtext: string;
  tone: "violet" | "green" | "blue" | "gold";
  progress?: number;
}

export interface UploadDraft {
  name: string;
  folder: string;
  tags: string[];
  category: MediaType;
  expireDate: string;
  approvalRequired: boolean;
  addToPlaylist: boolean;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  uploadedMime?: string;
  uploadedSizeBytes?: number;
  webUrl?: string;
  sourceKind?: "file" | "stream" | "web";
  streamType?: "hls" | "dash" | "rtsp" | "progressive" | "stream";
}
