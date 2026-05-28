import type { MediaAsset } from "@/types/media";

export function publicRequestOrigin(request: Request) {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || new URL(request.url).protocol.replace(":", "") || "https";
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  return new URL(request.url).origin.replace(/\/$/, "");
}

export function mediaPublicUrl(asset: MediaAsset | undefined, origin: string) {
  const url = asset?.fileUrl || asset?.cdnUrl || "";
  if (!url) return "";
  if (/^\/\//.test(url)) return `https:${url}`;
  if (/^(https?:|rtsp:|data:|about:)/i.test(url)) return url;
  return `${origin.replace(/\/$/, "")}/${url.replace(/^\/+/, "")}`;
}

export function playerMediaType(asset: MediaAsset | undefined) {
  if (asset?.type === "image") return "IMAGE";
  if (asset?.type === "web") return "WEB_URL";
  if (asset?.type === "html") return "HTML";
  return "VIDEO";
}

export function tvMediaKind(asset: MediaAsset | undefined) {
  if (asset?.type === "image") return "Rasm";
  if (asset?.type === "web") return "Web";
  if (asset?.type === "html") return "HTML";
  return "Video";
}

export function mediaMime(asset: MediaAsset | undefined) {
  const url = asset?.fileUrl || asset?.cdnUrl || "";
  const streamKind = mediaStreamKind(asset);
  if (streamKind === "rtsp") return "application/x-rtsp";
  if (streamKind === "hls") return "application/vnd.apple.mpegurl";
  if (streamKind === "dash") return "application/dash+xml";
  if (asset?.type === "image") return "image/jpeg";
  if (asset?.type === "web" || asset?.type === "html") return "text/html";
  return "video/mp4";
}

export function mediaStreamKind(asset: MediaAsset | undefined) {
  const url = asset?.fileUrl || asset?.cdnUrl || "";
  if (asset?.streamType) return asset.streamType;
  if (/^https?:\/\/[^?#]*\.m3u8(?:$|[?#/])/i.test(url) || /m3u8/i.test(new URLSearchParams(url.split("?")[1] || "").toString())) return "hls";
  if (/^https?:\/\/[^?#]*\.mpd(?:$|[?#/])/i.test(url) || /mpd/i.test(new URLSearchParams(url.split("?")[1] || "").toString())) return "dash";
  if (/^rtsp:\/\//i.test(url)) return "rtsp";
  if (/\.m3u8($|\?)/i.test(url)) return "hls";
  if (/\.mpd($|\?)/i.test(url)) return "dash";
  if (/^(https?:)?\/\//i.test(url) && ["URL", "STREAM", "HLS", "DASH", "RTSP"].includes(String(asset?.format || "").toUpperCase()) && asset?.type === "video") return "progressive";
  return "";
}

export function isStreamMedia(asset: MediaAsset | undefined) {
  return Boolean(mediaStreamKind(asset));
}

export function isCacheableMedia(asset: MediaAsset | undefined) {
  if (!asset) return false;
  if (isStreamMedia(asset)) return false;
  return asset.type === "video" || asset.type === "image";
}

export function playlistDurationMs(durationSeconds: number | undefined) {
  const seconds = Number.isFinite(durationSeconds) ? Number(durationSeconds) : 10;
  return Math.max(5, seconds) * 1000;
}

export function tvDuration(durationSeconds: number | undefined) {
  const seconds = Math.max(5, Number.isFinite(durationSeconds) ? Number(durationSeconds) : 10);
  return `00:00:${String(seconds).padStart(2, "0")}`;
}

export function playableMediaAssets(media: MediaAsset[]) {
  return [...media]
    .filter((asset) => asset.fileUrl && !["archived", "expired", "failed"].includes(asset.status))
    .sort((a, b) => String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || "")));
}

export function fallbackDurationSeconds(asset: MediaAsset | undefined) {
  if (asset?.type === "video") return 20;
  if (asset?.type === "web" || asset?.type === "html") return 30;
  return 10;
}
