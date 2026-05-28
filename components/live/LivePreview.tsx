"use client";

import { useEffect, useRef } from "react";
import type { Device, MediaAsset } from "@/types";

interface LivePreviewProps {
  device: Device;
  media?: MediaAsset;
  source?: string;
  waitingClassName?: string;
}

export function LivePreview({ device, media, source, waitingClassName = "text-sm font-bold text-castMuted" }: LivePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = media?.type === "video";
  const playableSource = isVideo ? browserPreviewSource(source, media) : source;
  const isImageSource = Boolean(source && /(?:^data:image\/|[.](?:png|jpe?g|webp)(?:$|[?#]))/i.test(source));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playableSource || !isVideo) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.load();

    const play = () => {
      void video.play().catch(() => undefined);
    };

    play();
    const retry = window.setTimeout(play, 350);
    video.addEventListener("canplay", play);
    video.addEventListener("loadeddata", play);

    return () => {
      window.clearTimeout(retry);
      video.removeEventListener("canplay", play);
      video.removeEventListener("loadeddata", play);
    };
  }, [isVideo, media?.id, playableSource]);

  if (source && isImageSource) {
    return <img className="h-full w-full object-contain" src={source} alt={media?.name || device.name} />;
  }

  if (isVideo && playableSource) {
    return (
      <video
        key={`${device.id}-${device.currentMediaId}-${playableSource}`}
        ref={videoRef}
        className="h-full w-full object-contain"
        src={playableSource}
        muted
        autoPlay
        loop
        controls
        playsInline
        preload="auto"
      />
    );
  }

  if (media?.type === "web" && source) {
    return <iframe key={`${device.id}-${device.currentMediaId}-${source}`} className="h-full w-full border-0 bg-white" src={source} title={media.name} />;
  }

  if (source) {
    return <img className="h-full w-full object-contain" src={source} alt={media?.name || device.name} />;
  }

  return <div className={`grid h-full place-items-center ${waitingClassName}`}>Live preview kutilmoqda</div>;
}

function browserPreviewSource(source: string | undefined, media: MediaAsset | undefined) {
  if (!source) return source;
  const isQuickTime = /\.mov(?:$|[?#])/i.test(source) || /quicktime/i.test(media?.format || "");
  if (!isQuickTime) return source;
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}preview=mp4`;
}
