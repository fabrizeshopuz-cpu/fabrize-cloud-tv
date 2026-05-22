"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, FolderPlus, LayoutGrid, List, Plus, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { MediaAction } from "@/components/media/MediaActionMenu";
import { MediaCategoryTabs, type MediaTab } from "@/components/media/MediaCategoryTabs";
import { MediaDetailDrawer } from "@/components/media/MediaDetailDrawer";
import { MediaEmptyState } from "@/components/media/MediaEmptyState";
import { MediaFilters, type MediaFilterState } from "@/components/media/MediaFilters";
import { MediaFolderPanel } from "@/components/media/MediaFolderPanel";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaListView } from "@/components/media/MediaListView";
import { MediaMetricCard } from "@/components/media/MediaMetricCard";
import { MediaPreviewModal } from "@/components/media/MediaPreviewModal";
import { MediaSkeleton } from "@/components/media/MediaSkeleton";
import { MediaUploadModal } from "@/components/media/MediaUploadModal";
import { StorageAnalytics } from "@/components/media/StorageAnalytics";
import { defaultTags, mediaFolders, mediaMetrics } from "@/lib/mediaData";
import { useCastmapStore } from "@/lib/store";
import type { Branch, Campaign, Playlist } from "@/types";
import type { MediaAsset, MediaFolder, MediaOrientation, MediaRole, MediaSortOption, MediaStatus, UploadDraft } from "@/types/media";

const emptyFilters: MediaFilterState = {
  type: "all",
  status: "all",
  tag: "all",
  uploader: "all",
  orientation: "all",
  usage: "all",
};

export default function MediaLibraryPage() {
  const store = useCastmapStore();
  const assets = store.media;
  const [folders, setFolders] = useState<MediaFolder[]>(mediaFolders);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<MediaTab>("all");
  const [activeFolder, setActiveFolder] = useState("Barcha fayllar");
  const [filters, setFilters] = useState<MediaFilterState>(emptyFilters);
  const [sort, setSort] = useState<MediaSortOption>("latest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [role, setRole] = useState<MediaRole>("Super Admin");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MediaAsset | null>(null);
  const [playlistTarget, setPlaylistTarget] = useState<MediaAsset | null>(null);
  const [editTarget, setEditTarget] = useState<MediaAsset | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<MediaAsset | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: "", description: "", permission: "Admin" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSelected((current) => current && assets.some((asset) => asset.id === current.id) ? current : assets[0] || null);
  }, [assets]);

  const tags = useMemo(() => [...new Set([...defaultTags, ...assets.flatMap((asset) => asset.tags)])].sort(), [assets]);
  const uploaders = useMemo(() => [...new Set(assets.map((asset) => asset.uploadedBy))].sort(), [assets]);

  const filteredAssets = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = assets.filter((asset) => {
      const matchesSearch = !search
        || asset.name.toLowerCase().includes(search)
        || asset.tags.some((tag) => tag.toLowerCase().includes(search))
        || asset.uploadedBy.toLowerCase().includes(search)
        || asset.folder.toLowerCase().includes(search)
        || asset.type.toLowerCase().includes(search)
        || String(asset.usedInPlaylists).includes(search);
      const matchesTab = tab === "all"
        || asset.type === tab
        || (tab === "archive" && asset.status === "archived")
        || (tab === "approval" && asset.status === "approval");
      const matchesFolder = activeFolder === "Barcha fayllar" || asset.folder === activeFolder;
      const matchesType = filters.type === "all" || asset.type === filters.type;
      const matchesStatus = filters.status === "all" || asset.status === filters.status;
      const matchesTag = filters.tag === "all" || asset.tags.includes(filters.tag);
      const matchesUploader = filters.uploader === "all" || asset.uploadedBy === filters.uploader;
      const matchesOrientation = filters.orientation === "all" || asset.orientation === filters.orientation;
      const matchesUsage = filters.usage === "all"
        || (filters.usage === "used" && asset.usedInPlaylists > 0)
        || (filters.usage === "unused" && asset.usedInPlaylists === 0);
      return matchesSearch && matchesTab && matchesFolder && matchesType && matchesStatus && matchesTag && matchesUploader && matchesOrientation && matchesUsage;
    });

    return filtered.sort((a, b) => {
      if (sort === "oldest") return a.uploadedAt.localeCompare(b.uploadedAt);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return b.sizeBytes - a.sizeBytes;
      if (sort === "usage") return b.usedInPlaylists - a.usedInPlaylists;
      if (sort === "lastPlayed") return String(b.lastPlayed || "").localeCompare(String(a.lastPlayed || ""));
      return b.uploadedAt.localeCompare(a.uploadedAt);
    });
  }, [activeFolder, assets, filters, query, sort, tab]);

  const canMutate = role !== "Viewer";
  const canApprove = role === "Admin" || role === "Super Admin";
  const canDelete = role === "Admin" || role === "Super Admin";

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const handleUpload = async (draft: UploadDraft) => {
    const uploaded = store.createMediaFromDraft(draft);
    setSelected(uploaded);
    showNotice("Media yuklandi va kutubxonaga qo'shildi.");
    return uploaded;
  };

  const handleApprove = (asset: MediaAsset) => {
    if (!canApprove) return showNotice("Bu rol tasdiqlash huquqiga ega emas.");
    const updated = { ...asset, status: "active" as const };
    updateAsset(updated);
    showNotice("Media tasdiqlandi.");
  };

  const handleReject = (asset: MediaAsset) => {
    if (!canApprove) return showNotice("Bu rol rad etish huquqiga ega emas.");
    setRejectTarget(asset);
  };

  const confirmReject = (reason: string) => {
    if (!rejectTarget) return;
    const updated = { ...rejectTarget, status: "draft" as const, tags: [...new Set([...rejectTarget.tags, reason ? "Rad etilgan" : "Tekshirish kerak"])] };
    updateAsset(updated);
    setRejectTarget(null);
    showNotice("Media rad etildi.");
  };

  const updateAsset = (asset: MediaAsset) => {
    store.updateMediaAsset(asset);
    setSelected((current) => current?.id === asset.id ? asset : current);
  };

  const handleAction = async (asset: MediaAsset, action: MediaAction) => {
    setOpenActionId("");
    setSelected(asset);
    if (!canMutate && action !== "preview" && action !== "download" && action !== "copy") {
      showNotice("Viewer roli faqat ko'rish huquqiga ega.");
      return;
    }
    if (action === "preview") return setPreview(asset);
    if (action === "approve") return handleApprove(asset);
    if (action === "reject") return handleReject(asset);
    if (action === "delete") {
      if (!canDelete) return showNotice("Bu rol o'chirish huquqiga ega emas.");
      setDeleteTarget(asset);
      return;
    }
    if (action === "archive") {
      const updated = { ...asset, status: "archived" as const };
      updateAsset(updated);
      showNotice("Media arxivlandi.");
      return;
    }
    if (action === "playlist") {
      setPlaylistTarget(asset);
      return;
    }
    if (action === "edit") {
      setEditTarget(asset);
      return;
    }
    if (action === "replace") {
      setReplaceTarget(asset);
      return;
    }
    if (action === "download") {
      downloadAsset(asset);
      return;
    }
    if (action === "move") {
      const nextFolder = asset.folder === "Promo" ? "Retail Ads" : "Promo";
      const updated = { ...asset, folder: nextFolder };
      updateAsset(updated);
      showNotice(`Media ${nextFolder} papkasiga ko'chirildi.`);
      return;
    }
    if (action === "copy") {
      await navigator.clipboard?.writeText(asset.cdnUrl || asset.fileUrl);
      showNotice("URL nusxalandi.");
      return;
    }
    showNotice(`${asset.name}: ${action} amali bajarildi.`);
  };

  const downloadAsset = (asset: MediaAsset) => {
    const href = asset.cdnUrl || asset.fileUrl;
    if (!href) {
      showNotice("Yuklab olish uchun URL topilmadi.");
      return;
    }
    const link = document.createElement("a");
    link.href = href;
    link.download = asset.name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotice("Yuklab olish boshlandi.");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    store.deleteMediaAsset(deleteTarget.id);
    setSelected((current) => current?.id === deleteTarget.id ? null : current);
    setDeleteTarget(null);
    showNotice("Media o'chirildi.");
  };

  const createFolder = () => {
    if (!newFolder.name.trim()) return;
    setFolders((current) => [{ name: newFolder.name.trim(), count: 0, description: newFolder.description, permission: newFolder.permission }, ...current]);
    setActiveFolder(newFolder.name.trim());
    setNewFolder({ name: "", description: "", permission: "Admin" });
    setFolderModalOpen(false);
    showNotice("Yangi papka yaratildi.");
  };

  const clearTemplateAssets = () => {
    const count = assets.filter((asset) => asset.type === "template").length;
    store.clearTemplates();
    setSelected((current) => current?.type === "template" ? null : current);
    setPreview((current) => current?.type === "template" ? null : current);
    setTab((current) => current === "template" ? "all" : current);
    setActiveFolder((current) => current === "Template" ? "Barcha fayllar" : current);
    showNotice(count ? `${count} ta shablon o'chirildi.` : "Shablon fayl topilmadi.");
  };

  return (
    <main className="flex min-h-screen bg-castBg text-castText max-lg:flex-col">
      <Sidebar activeLabel="Media kutubxona" />
      <section className="min-w-0 flex-1">
        <Topbar />
        <div className="grid gap-5 p-7 max-sm:p-4">
          <header className="flex items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 max-2xl:flex-col">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-castGold">MEDIA LIBRARY</p>
              <h1 className="mt-1 text-3xl font-black text-white">Media kutubxona</h1>
              <span className="mt-1 block text-castMuted">Video, rasm, banner va web kontentlarni boshqarish</span>
            </div>
            <div className="flex flex-wrap justify-end gap-3 max-2xl:w-full max-2xl:justify-start">
              <label className="relative w-[430px] max-w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-castMuted" />
                <input
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-castMuted"
                  value={query}
                  placeholder="Media nomi, tag yoki uploader bo'yicha qidirish"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <button className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-5 font-black text-black" type="button" onClick={() => setUploadOpen(true)}>
                <Plus className="h-4 w-4" /> Media yuklash
              </button>
              <button className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white" type="button" onClick={() => setFolderModalOpen(true)}>
                <FolderPlus className="h-4 w-4 text-castGold" /> Yangi papka
              </button>
              <button className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white" type="button">
                <Filter className="h-4 w-4 text-castGold" /> Filter
              </button>
              <select className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none" value={sort} onChange={(event) => setSort(event.target.value as MediaSortOption)}>
                <option value="latest">Eng yangi</option>
                <option value="oldest">Eng eski</option>
                <option value="name">Nomi A-Z</option>
                <option value="size">Hajmi katta</option>
                <option value="usage">Eng ko'p ishlatilgan</option>
                <option value="lastPlayed">Oxirgi ijro qilingan</option>
              </select>
              <select className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none" value={role} onChange={(event) => setRole(event.target.value as MediaRole)}>
                <option>Super Admin</option>
                <option>Admin</option>
                <option>Operator</option>
                <option>Viewer</option>
              </select>
              <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
                <button className={`grid h-9 w-10 place-items-center rounded-lg ${view === "grid" ? "bg-castGold text-black" : "text-castMuted"}`} type="button" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></button>
                <button className={`grid h-9 w-10 place-items-center rounded-lg ${view === "list" ? "bg-castGold text-black" : "text-castMuted"}`} type="button" onClick={() => setView("list")}><List className="h-4 w-4" /></button>
              </div>
            </div>
          </header>

          {notice ? <div className="rounded-xl border border-castGold/25 bg-castGold/10 px-4 py-3 text-sm font-bold text-castGold">{notice}</div> : null}

          {loading ? (
            <MediaSkeleton />
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
                {mediaMetrics.map((metric) => <MediaMetricCard key={metric.title} {...metric} />)}
              </section>

              <MediaCategoryTabs active={tab} assets={assets} onChange={setTab} />

              <MediaFilters filters={filters} tags={tags} uploaders={uploaders} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />

              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
                <div>
                  <b className="text-orange-200">Test shablonlarni tozalash</b>
                  <p className="mt-1 text-sm text-castMuted">Template turidagi test dizaynlar media kutubxonadan o'chiriladi.</p>
                </div>
                <button className="min-h-10 rounded-xl border border-orange-400/30 px-4 text-sm font-black text-orange-200 hover:bg-orange-500/10" type="button" onClick={clearTemplateAssets}>
                  Shablonlarni o'chirish
                </button>
              </section>

              <section className="grid min-w-0 items-start gap-4 2xl:grid-cols-[240px_minmax(0,1fr)_390px] xl:grid-cols-[220px_minmax(0,1fr)]">
                <div className="grid min-w-0 gap-4 self-start">
                  <MediaFolderPanel folders={folders} activeFolder={activeFolder} onChange={setActiveFolder} onCreate={() => setFolderModalOpen(true)} />
                  <StorageAnalytics assets={assets} />
                </div>

                <div className="min-w-0">
                  {filteredAssets.length ? (
                    view === "grid" ? (
                      <MediaGrid assets={filteredAssets} openActionId={openActionId} onToggleActions={(id) => setOpenActionId((current) => current === id ? "" : id)} onSelect={setSelected} onPreview={setPreview} onAction={handleAction} />
                    ) : (
                      <MediaListView assets={filteredAssets} openActionId={openActionId} onToggleActions={(id) => setOpenActionId((current) => current === id ? "" : id)} onSelect={setSelected} onAction={handleAction} />
                    )
                  ) : (
                    <MediaEmptyState onUpload={() => setUploadOpen(true)} />
                  )}
                </div>

                <div className="min-w-0 max-2xl:col-span-2 max-xl:col-span-1">
                  {selected ? (
                    <MediaDetailDrawer asset={selected} onClose={() => setSelected(null)} onAction={handleAction} onApprove={handleApprove} onReject={handleReject} />
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-castCard p-5 text-castMuted">Media tanlang.</div>
                  )}
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
                {[
                  ["Duplicate detection", "O'xshash fayl yo'q"],
                  ["Auto thumbnail generated", "Thumbnail yaratish navbati bo'sh"],
                  ["Auto tag suggestion", "Tavsiya qilinadigan tag yo'q"],
                  ["Warnings", "Ogohlantirish yo'q"],
                ].map(([title, text]) => (
                  <article key={title} className="rounded-2xl border border-white/10 bg-castCard p-5">
                    <b className="text-white">{title}</b>
                    <p className="mt-2 text-sm text-castMuted">{text}</p>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>

      <MediaUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      <MediaPreviewModal asset={preview} onClose={() => setPreview(null)} />
      <DeleteConfirm asset={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      <RejectReason asset={rejectTarget} onCancel={() => setRejectTarget(null)} onConfirm={confirmReject} />
      <MetadataEditModal
        asset={editTarget}
        folders={folders}
        onCancel={() => setEditTarget(null)}
        onSave={(asset) => {
          updateAsset(asset);
          setEditTarget(null);
          showNotice("Media metadata yangilandi.");
        }}
      />
      <ReplaceFileModal
        asset={replaceTarget}
        onCancel={() => setReplaceTarget(null)}
        onReplace={(asset) => {
          updateAsset(asset);
          setReplaceTarget(null);
          showNotice("Media fayli almashtirildi.");
        }}
      />
      <PlaylistAssignModal
        asset={playlistTarget}
        playlists={store.playlists}
        campaigns={store.campaigns}
        branches={store.branches}
        onCancel={() => setPlaylistTarget(null)}
        onAssign={(playlistId) => {
          if (!playlistTarget) return;
          store.addMediaToPlaylist(playlistTarget.id, playlistId);
          setPlaylistTarget(null);
          showNotice("Media playlistga biriktirildi.");
        }}
      />
      <FolderModal open={folderModalOpen} value={newFolder} onChange={setNewFolder} onCancel={() => setFolderModalOpen(false)} onConfirm={createFolder} />
    </main>
  );
}

function MetadataEditModal({
  asset,
  folders,
  onCancel,
  onSave,
}: {
  asset: MediaAsset | null;
  folders: MediaFolder[];
  onCancel: () => void;
  onSave: (asset: MediaAsset) => void;
}) {
  const [draft, setDraft] = useState<MediaAsset | null>(asset);
  const [tags, setTags] = useState(asset?.tags.join(", ") || "");

  useEffect(() => {
    setDraft(asset);
    setTags(asset?.tags.join(", ") || "");
  }, [asset]);

  if (!asset || !draft) return null;

  const save = () => {
    const nextTags = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    onSave({ ...draft, tags: [...new Set(nextTags)] });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-castCard p-5">
        <h2 className="text-xl font-black text-white">Metadata tahrirlash</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-castMuted">
            Media nomi
            <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm text-castMuted">
            Papka
            <select className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.folder} onChange={(event) => setDraft({ ...draft, folder: event.target.value })}>
              {[...new Set([draft.folder, ...folders.map((folder) => folder.name)])].map((folder) => <option key={folder}>{folder}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-castMuted">
            Status
            <select className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as MediaStatus })}>
              {["active", "draft", "approval", "archived", "expired", "processing", "failed"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-castMuted">
            Orientation
            <select className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.orientation} onChange={(event) => setDraft({ ...draft, orientation: event.target.value as MediaOrientation })}>
              {["landscape", "portrait", "square", "responsive"].map((orientation) => <option key={orientation} value={orientation}>{orientation}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-castMuted">
            Davomiyligi
            <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.duration || ""} placeholder="00:00:20" onChange={(event) => setDraft({ ...draft, duration: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm text-castMuted">
            Rezolyutsiya
            <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={draft.resolution || ""} placeholder="1920x1080" onChange={(event) => setDraft({ ...draft, resolution: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm text-castMuted md:col-span-2">
            Taglar
            <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={tags} placeholder="Promo, Food" onChange={(event) => setTags(event.target.value)} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-xl border border-white/10 px-4 py-2 text-white" type="button" onClick={onCancel}>Bekor qilish</button>
          <button className="rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-4 py-2 font-black text-black" type="button" onClick={save}>Saqlash</button>
        </div>
      </section>
    </div>
  );
}

function ReplaceFileModal({
  asset,
  onCancel,
  onReplace,
}: {
  asset: MediaAsset | null;
  onCancel: () => void;
  onReplace: (asset: MediaAsset) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFile(null);
    setError("");
    setUploading(false);
  }, [asset]);

  if (!asset) return null;

  const submit = async () => {
    if (!file) {
      setError("Yangi fayl tanlanmagan.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Fayl serverga yuklanmadi");
      const payload = await response.json() as { url: string; fileName: string; mime: string; sizeBytes: number };
      const nextType = payload.mime.startsWith("image/") ? "image" : payload.mime.startsWith("video/") ? "video" : asset.type;
      const extension = payload.mime.split("/")[1] || payload.fileName.split(".").pop() || asset.format;
      onReplace({
        ...asset,
        name: payload.fileName || file.name,
        type: nextType,
        fileUrl: payload.url,
        cdnUrl: payload.url,
        thumbnailUrl: nextType === "image" ? payload.url : asset.thumbnailUrl,
        size: formatBytes(payload.sizeBytes),
        sizeBytes: payload.sizeBytes,
        format: extension.toUpperCase(),
        status: "active",
      });
    } catch (replaceError) {
      setError(replaceError instanceof Error ? replaceError.message : "Fayl almashtirishda xatolik");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-castCard p-5">
        <h2 className="text-xl font-black text-white">Faylni almashtirish</h2>
        <p className="mt-2 text-sm text-castMuted">{asset.name}</p>
        <label className="mt-4 grid gap-2 text-sm text-castMuted">
          Yangi fayl
          <input className="rounded-xl border border-white/10 bg-[#0D0D0D] p-3 text-white outline-none" type="file" accept="video/*,image/*,.html,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        {file ? <p className="mt-3 rounded-xl border border-castGold/20 bg-castGold/10 px-3 py-2 text-sm text-castGold">{file.name} / {formatBytes(file.size)}</p> : null}
        {error ? <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-xl border border-white/10 px-4 py-2 text-white" type="button" onClick={onCancel} disabled={uploading}>Bekor qilish</button>
          <button className="rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-4 py-2 font-black text-black disabled:opacity-50" type="button" onClick={submit} disabled={uploading}>
            {uploading ? "Yuklanmoqda..." : "Almashtirish"}
          </button>
        </div>
      </section>
    </div>
  );
}

function PlaylistAssignModal({
  asset,
  playlists,
  campaigns,
  branches,
  onCancel,
  onAssign,
}: {
  asset: MediaAsset | null;
  playlists: Playlist[];
  campaigns: Campaign[];
  branches: Branch[];
  onCancel: () => void;
  onAssign: (playlistId: string) => void;
}) {
  if (!asset) return null;
  const sortedPlaylists = [...playlists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5">
      <section className="w-full max-w-2xl rounded-2xl border border-castGold/25 bg-castCard p-5 shadow-2xl shadow-castGold/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-castGold">Playlist tanlash</p>
            <h2 className="mt-1 text-xl font-black text-white">Media qaysi playlistda ko'rsatilsin?</h2>
            <p className="mt-2 text-sm text-castMuted">{asset.name}</p>
          </div>
          <button className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/10" type="button" onClick={onCancel}>
            Yopish
          </button>
        </div>

        <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {sortedPlaylists.length ? sortedPlaylists.map((playlist) => {
            const included = playlist.items.some((item) => item.mediaId === asset.id);
            const campaign = playlist.campaignId ? campaigns.find((item) => item.id === playlist.campaignId) : null;
            const branch = playlist.branchId ? branches.find((item) => item.id === playlist.branchId) : null;

            return (
              <article key={playlist.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-castGold/30 max-sm:flex-col max-sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-white">{playlist.name}</b>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${playlist.status === "published" ? "bg-green-500/15 text-green-300" : "bg-white/10 text-castMuted"}`}>
                      {playlist.status === "published" ? "E'lon qilingan" : playlist.status === "draft" ? "Qoralama" : "Arxiv"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-castMuted">
                    Kampaniya: <span className="text-white">{campaign?.name || "Tanlanmagan"}</span>
                    {" · "}
                    Lokatsiya: <span className="text-white">{branch?.name || playlist.target || "Umumiy"}</span>
                  </p>
                  <p className="mt-1 text-xs text-castMuted">{playlist.items.length} ta media · Yangilangan: {playlist.updatedAt}</p>
                </div>
                <button
                  className={`min-h-10 rounded-xl px-4 text-sm font-black transition ${included ? "cursor-not-allowed border border-white/10 bg-white/5 text-castMuted" : "bg-gradient-to-r from-[#FFE18A] to-castDeepGold text-black hover:shadow-lg hover:shadow-castGold/20"}`}
                  type="button"
                  disabled={included}
                  onClick={() => onAssign(playlist.id)}
                >
                  {included ? "Allaqachon bor" : "Tanlash"}
                </button>
              </article>
            );
          }) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
              <b className="text-white">Playlist yo'q</b>
              <p className="mt-2 text-sm text-castMuted">Avval Playlistlar bo'limida playlist yarating, keyin media biriktirasiz.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DeleteConfirm({ asset, onCancel, onConfirm }: { asset: MediaAsset | null; onCancel: () => void; onConfirm: () => void }) {
  if (!asset) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5">
      <section className="max-w-md rounded-2xl border border-red-400/25 bg-castCard p-5">
        <h2 className="text-xl font-black text-white">Bu media faylni o'chirishni tasdiqlaysizmi?</h2>
        <p className="mt-3 text-castMuted">Bu media {asset.usedInPlaylists} ta playlistda ishlatilmoqda. O'chirish playlistlarga ta'sir qiladi.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-xl border border-white/10 px-4 py-2 text-white" type="button" onClick={onCancel}>Bekor qilish</button>
          <button className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2 font-bold text-red-300" type="button" onClick={onConfirm}>O'chirish</button>
        </div>
      </section>
    </div>
  );
}

function RejectReason({ asset, onCancel, onConfirm }: { asset: MediaAsset | null; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  if (!asset) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5">
      <section className="w-full max-w-md rounded-2xl border border-orange-400/25 bg-castCard p-5">
        <h2 className="text-xl font-black text-white">Reject reason</h2>
        <p className="mt-2 text-sm text-castMuted">{asset.name} uchun rad etish sababini yozing.</p>
        <textarea className="mt-4 min-h-28 w-full rounded-xl border border-white/10 bg-[#0D0D0D] p-3 text-white outline-none" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Masalan: rezolyutsiya juda past." />
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-xl border border-white/10 px-4 py-2 text-white" type="button" onClick={onCancel}>Bekor qilish</button>
          <button className="rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-2 font-bold text-orange-300" type="button" onClick={() => onConfirm(reason || "Standart sifat talabiga javob bermaydi")}>Rad etish</button>
        </div>
      </section>
    </div>
  );
}

function FolderModal({
  open,
  value,
  onChange,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  value: { name: string; description: string; permission: string };
  onChange: (value: { name: string; description: string; permission: string }) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-castCard p-5">
        <h2 className="text-xl font-black text-white">Yangi papka yaratish</h2>
        <div className="mt-4 grid gap-3">
          <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={value.name} placeholder="Folder name" onChange={(event) => onChange({ ...value, name: event.target.value })} />
          <input className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={value.description} placeholder="Description" onChange={(event) => onChange({ ...value, description: event.target.value })} />
          <select className="h-11 rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-white outline-none" value={value.permission} onChange={(event) => onChange({ ...value, permission: event.target.value })}>
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Operator</option>
            <option>Viewer</option>
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-xl border border-white/10 px-4 py-2 text-white" type="button" onClick={onCancel}>Bekor qilish</button>
          <button className="rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-4 py-2 font-black text-black" type="button" onClick={onConfirm}>Yaratish</button>
        </div>
      </section>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
