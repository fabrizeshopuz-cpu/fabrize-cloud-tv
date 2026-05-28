"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { defaultTags, mediaFolders } from "@/lib/mediaData";
import type { MediaAsset, MediaType, UploadDraft } from "@/types/media";

const initialDraft: UploadDraft = {
  name: "",
  folder: "Promo",
  tags: ["Promo"],
  category: "video",
  expireDate: "",
  approvalRequired: false,
  addToPlaylist: true,
  webUrl: "",
};

type UploadMode = "file" | "stream";

function initialDraftForMode(mode: UploadMode): UploadDraft {
  if (mode === "stream") {
    return {
      ...initialDraft,
      name: "Live stream",
      tags: ["Stream"],
      category: "video",
      sourceKind: "stream",
      streamType: "stream",
    };
  }
  return initialDraft;
}

export function MediaUploadModal({ open, mode = "file", onClose, onUpload }: { open: boolean; mode?: UploadMode; onClose: () => void; onUpload: (draft: UploadDraft) => Promise<MediaAsset> }) {
  const [draft, setDraft] = useState<UploadDraft>(() => initialDraftForMode(mode));
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "complete" | "failed">("idle");
  const [error, setError] = useState("");
  const [selectedTag, setSelectedTag] = useState("Promo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setDraft(initialDraftForMode(mode));
      setProgress(0);
      setStatus("idle");
      setError("");
      setSelectedTag("Promo");
      setSelectedFile(null);
    }
  }, [mode, open]);

  const statusText = useMemo(() => ({
    idle: selectedFile
      ? `${selectedFile.name} tanlandi (${formatBytes(selectedFile.size)})`
      : draft.webUrl?.trim()
        ? "URL tayyor"
        : "Fayl tanlang yoki stream URL kiriting",
    uploading: `Yuklanmoqda: ${progress}%`,
    complete: "Upload complete",
    failed: error || "Upload failed",
  }[status]), [draft.webUrl, error, progress, selectedFile, status]);

  const canSubmit = status !== "uploading" && (selectedFile || Boolean(draft.webUrl?.trim()));

  if (!open) return null;

  const pickFile = (file: File) => {
    setSelectedFile(file);
    const category = inferType(file);
    setError("");
    setDraft((current) => ({
      ...current,
      category,
      name: current.name || file.name,
      webUrl: "",
    }));
  };

  const changeCategory = (category: MediaType) => {
    setError("");
    if (category === "web") {
      setSelectedFile(null);
    }
    setDraft((current) => ({ ...current, category }));
  };

  const submit = async () => {
    const normalizedWebUrl = normalizeWebUrl(draft.webUrl);
    const isUrlUpload = !selectedFile && Boolean(draft.webUrl?.trim());
    const detectedStreamType = detectStreamType(normalizedWebUrl);
    if (!selectedFile && !normalizedWebUrl) {
      setError("To'g'ri fayl yoki URL kiriting.");
      setStatus("failed");
      return;
    }

    setStatus("uploading");
    setError("");
    setProgress(0);
    const timer = window.setInterval(() => setProgress((value) => Math.min(92, value + 8)), 120);
    try {
      let uploaded: Partial<UploadDraft> = {};
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Upload failed");
        const payload = await response.json() as { url: string; fileName: string; mime: string; sizeBytes: number };
        uploaded = {
          uploadedFileUrl: payload.url,
          uploadedFileName: payload.fileName,
          uploadedMime: payload.mime,
          uploadedSizeBytes: payload.sizeBytes,
        };
      } else if (isUrlUpload) {
        uploaded = { webUrl: normalizedWebUrl };
        await new Promise((resolve) => setTimeout(resolve, 300));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await onUpload({
        ...draft,
        ...uploaded,
        category: draft.category,
        sourceKind: isUrlUpload && (mode === "stream" || detectedStreamType) ? "stream" : draft.sourceKind,
        streamType: isUrlUpload ? detectedStreamType || draft.streamType : undefined,
        name: draft.name || selectedFile?.name || webUrlToName(normalizedWebUrl) || `castmap_${draft.category}_asset.${draft.category === "image" ? "jpg" : draft.category}`,
      });
      window.clearInterval(timer);
      setProgress(100);
      setStatus("complete");
      setTimeout(onClose, 500);
    } catch (uploadError) {
      window.clearInterval(timer);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      setStatus("failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur">
      <section className="w-full max-w-3xl rounded-2xl border border-white/10 bg-castCard p-5 shadow-2xl max-sm:h-full max-sm:overflow-y-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Media yuklash</h2>
            <p className="text-sm text-castMuted">Video, rasm, PDF, HTML package yoki web URL qo'shing.</p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-castMuted hover:text-white" type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-5 grid gap-4">
          <div
            className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-castGold/45 bg-castGold/10 p-6 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (mode === "file" && file) pickFile(file);
            }}
          >
            <Upload className="h-10 w-10 text-castGold" />
            <b className="mt-3 text-white">{statusText}</b>
            <span className="mt-1 text-sm text-castMuted">{mode === "stream" ? "HLS .m3u8, DASH .mpd, RTSP yoki to'g'ridan-to'g'ri MP4 URL" : "Supported: MP4, MOV, WEBM, JPG, PNG, WEBP, SVG, GIF, PDF, URL, HTML"}</span>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/svg+xml,image/gif,application/pdf,text/html"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) pickFile(file);
              }}
            />
            {mode === "file" ? (
              <button className="mt-4 rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-5 py-2 font-black text-black" type="button" onClick={() => fileInputRef.current?.click()}>
                Fayl tanlash
              </button>
            ) : null}
            {status !== "idle" ? (
              <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-castGold" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Media nomi" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} placeholder="burger_menu_may.mp4" />
            <label className="grid gap-1 text-sm text-castMuted">Papka tanlash
              <select className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.folder} onChange={(event) => setDraft({ ...draft, folder: event.target.value })}>
                {mediaFolders.filter((folder) => folder.name !== "Barcha fayllar").map((folder) => <option key={folder.name}>{folder.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-castMuted">Kategoriya
              <select className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none disabled:opacity-60" value={draft.category} disabled={mode === "stream"} onChange={(event) => changeCategory(event.target.value as MediaType)}>
                {["video", "image", "web", "html", "pdf", "template"].map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <Field label="Expire date" value={draft.expireDate} onChange={(value) => setDraft({ ...draft, expireDate: value })} placeholder="2026-06-01" />
            {!selectedFile ? (
              <div className="md:col-span-2">
                <Field label="URL / stream" type="url" value={draft.webUrl || ""} onChange={(value) => { setError(""); setDraft({ ...draft, webUrl: value, streamType: detectStreamType(value) || draft.streamType }); }} placeholder="https://example.com/live.m3u8 yoki rtsp://camera/live" />
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-castMuted">Taglar</span>
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((tag) => (
                <button key={tag} className="rounded-full border border-castGold/25 bg-castGold/10 px-3 py-1 text-sm font-bold text-castGold" type="button" onClick={() => setDraft({ ...draft, tags: draft.tags.filter((item) => item !== tag) })}>
                  {tag} x
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="h-10 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
                {defaultTags.map((tag) => <option key={tag}>{tag}</option>)}
              </select>
              <button className="rounded-xl border border-castGold/25 px-4 text-sm font-bold text-castGold" type="button" onClick={() => setDraft({ ...draft, tags: [...new Set([...draft.tags, selectedTag])] })}>Tag qo'shish</button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CheckLabel label="Approval kerak" checked={draft.approvalRequired} onChange={(checked) => setDraft({ ...draft, approvalRequired: checked })} />
            <CheckLabel label="Playlistga darhol qo'shish" checked={draft.addToPlaylist} onChange={(checked) => setDraft({ ...draft, addToPlaylist: checked })} />
          </div>

          <div className="flex justify-end gap-3">
            <button className="rounded-xl border border-white/10 px-5 py-3 font-bold text-white" type="button" onClick={onClose}>Bekor qilish</button>
            <button className="rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-5 py-3 font-black text-black disabled:opacity-60" type="button" disabled={!canSubmit} onClick={submit}>
              Yuklash
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, placeholder, type = "text", onChange }: { label: string; value: string; placeholder: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm text-castMuted">{label}
      <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none placeholder:text-castMuted" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CheckLabel({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function inferType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.includes("html")) return "html";
  return "video";
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

function detectStreamType(value?: string): UploadDraft["streamType"] | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("rtsp://")) return "rtsp";
  if (trimmed.includes(".m3u8") || trimmed.includes("m3u8")) return "hls";
  if (trimmed.includes(".mpd") || trimmed.includes("dash")) return "dash";
  if (/^https?:\/\//.test(trimmed)) return "progressive";
  return "stream";
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
