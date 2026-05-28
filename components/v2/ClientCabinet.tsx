"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Clapperboard, GalleryVerticalEnd, MapPin, Monitor, Pause, Play, Plus, RefreshCw, Search, Trash2, Zap } from "lucide-react";
import { MediaUploadModal } from "@/components/media/MediaUploadModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { V2AppShell, V2MetricCard, V2Status } from "@/components/v2/V2Shell";
import { clientNav } from "@/lib/castmap-v2";
import { useCastmapStore } from "@/lib/store";
import type { Branch, Campaign, Device, Playlist } from "@/types";

type CabinetTab = "overview" | "campaigns" | "locations" | "devices" | "playlists" | "media" | "billing";

const tabLabels: Record<CabinetTab, string> = {
  overview: "Overview",
  campaigns: "Kampaniyalar",
  locations: "Lokatsiyalar",
  devices: "TV qurilmalar",
  playlists: "Playlistlar",
  media: "Media",
  billing: "Billing",
};

export function ClientCabinet() {
  const store = useCastmapStore();
  const [tab, setTab] = useState<CabinetTab>("overview");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("tab") as CabinetTab | null;
    if (value && value in tabLabels) setTab(value);
  }, []);

  const metrics = useMemo(() => {
    const online = store.devices.filter((device) => device.status === "online").length;
    const published = store.playlists.filter((playlist) => playlist.status === "published").length;
    const activeCampaigns = store.campaigns.filter((campaign) => campaign.status === "active").length;
    return [
      { label: "TV qurilmalar", value: String(store.devices.length), detail: `${online} online`, tone: online ? "green" as const : "gold" as const },
      { label: "Lokatsiyalar", value: String(store.branches.length), detail: "Filial va ekran nuqtalari", tone: "blue" as const },
      { label: "Kampaniyalar", value: String(store.campaigns.length), detail: `${activeCampaigns} active`, tone: activeCampaigns ? "green" as const : "gold" as const },
      { label: "Playlistlar", value: String(store.playlists.length), detail: `${published} published`, tone: published ? "green" as const : "gold" as const },
    ];
  }, [store.branches.length, store.campaigns, store.devices, store.playlists]);

  const visibleTab = tabLabels[tab];

  return (
    <V2AppShell title="Client cabinet" subtitle="Fabrize workspace" active={visibleTab} nav={clientNav}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <V2MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="rounded-lg border border-white/10 bg-[#111] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(tabLabels) as CabinetTab[]).map((item) => (
            <button
              key={item}
              className={`min-h-10 rounded-lg px-3 text-sm font-black transition ${tab === item ? "bg-castGold text-black" : "border border-white/10 bg-white/[0.04] text-castMuted hover:text-white"}`}
              type="button"
              onClick={() => setTab(item)}
            >
              {tabLabels[item]}
            </button>
          ))}
          <label className="relative ml-auto min-w-64 max-w-full flex-1 md:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-castMuted" />
            <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Qidirish" />
          </label>
        </div>
      </section>

      {tab === "overview" && <OverviewPanel query={query} setTab={setTab} />}
      {tab === "campaigns" && <CampaignsPanel query={query} />}
      {tab === "locations" && <LocationsPanel query={query} />}
      {tab === "devices" && <DevicesPanel query={query} />}
      {tab === "playlists" && <PlaylistsPanel query={query} />}
      {tab === "media" && <MediaPanel query={query} />}
      {tab === "billing" && <BillingPanel />}
    </V2AppShell>
  );
}

function OverviewPanel({ query, setTab }: { query: string; setTab: (tab: CabinetTab) => void }) {
  const store = useCastmapStore();
  const filteredDevices = filterDevices(store.devices, query);
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="grid gap-5">
        <QuickSetup />
        <WorkflowGrid setTab={setTab} />
        <section className="rounded-lg border border-white/10 bg-[#111]">
          <PanelHeader icon={Monitor} title="TV qurilmalar" action="TV ulash" onAction={() => setTab("devices")} />
          <DeviceRows devices={filteredDevices.slice(0, 5)} />
        </section>
      </div>
      <aside className="grid content-start gap-5">
        <PublishedPlaylistCard />
        <CampaignHealth />
      </aside>
    </section>
  );
}

function WorkflowGrid({ setTab }: { setTab: (tab: CabinetTab) => void }) {
  const items = [
    { title: "Kampaniya", detail: "Nomi, muddat, budget, playlist", icon: Activity, tab: "campaigns" as CabinetTab },
    { title: "Lokatsiya", detail: "Filial, shahar, ish vaqti", icon: MapPin, tab: "locations" as CabinetTab },
    { title: "TV ulash", detail: "Pairing code, filial, APK status", icon: Monitor, tab: "devices" as CabinetTab },
    { title: "Playlist", detail: "Media tartibi va publish", icon: GalleryVerticalEnd, tab: "playlists" as CabinetTab },
  ];
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.title} className="rounded-lg border border-white/10 bg-[#111] p-4 text-left transition hover:border-castGold/35" type="button" onClick={() => setTab(item.tab)}>
            <Icon className="h-6 w-6 text-castGold" />
            <b className="mt-4 block text-white">{item.title}</b>
            <span className="mt-2 block text-sm text-castMuted">{item.detail}</span>
          </button>
        );
      })}
    </section>
  );
}

function QuickSetup() {
  const store = useCastmapStore();
  const [form, setForm] = useState({
    branchName: "Bunyodkor Market",
    city: "Toshkent",
    screenName: "Bunyodkor TV 01",
    campaignName: "Start promo",
    pairingCode: "CSWGYK3Y",
    workStart: "00:00",
    workEnd: "23:59",
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <section className="rounded-lg border border-castGold/25 bg-castGold/10 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <div className="flex items-center gap-2 text-castGold">
            <Zap className="h-5 w-5" />
            <h2 className="text-xl font-black text-white">Tez setup</h2>
          </div>
          <p className="mt-1 text-sm text-castMuted">Lokatsiya, kampaniya, playlist va TV qurilma bitta zanjirda yaratiladi.</p>
        </div>
        <Input className="w-48" value={form.campaignName} onChange={(event) => update("campaignName", event.target.value)} placeholder="Kampaniya" />
        <Input className="w-48" value={form.branchName} onChange={(event) => update("branchName", event.target.value)} placeholder="Lokatsiya" />
        <Input className="w-44" value={form.screenName} onChange={(event) => update("screenName", event.target.value)} placeholder="TV nomi" />
        <Input className="w-36" value={form.pairingCode} onChange={(event) => update("pairingCode", event.target.value)} placeholder="TV kodi" />
        <Button variant="gold" onClick={() => store.createTestChain(form)}>Yaratish</Button>
      </div>
    </section>
  );
}

function CampaignsPanel({ query }: { query: string }) {
  const store = useCastmapStore();
  const campaigns = store.campaigns.filter((campaign) => includes(query, campaign.name, campaign.status, campaign.budget));
  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <CampaignForm />
      <div className="grid content-start gap-4">
        {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
      </div>
    </section>
  );
}

function CampaignForm() {
  const store = useCastmapStore();
  const [form, setForm] = useState({
    name: "Yangi reklama kampaniyasi",
    branchId: store.branches[0]?.id || "",
    playlistId: store.playlists[0]?.id || "",
    budget: "0 so'm",
    startDate: "2026-05-27",
    endDate: "2026-06-27",
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      branchId: current.branchId || store.branches[0]?.id || "",
      playlistId: current.playlistId || store.playlists[0]?.id || "",
    }));
  }, [store.branches, store.playlists]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const create = () => {
    const campaign = store.createCampaign({
      name: form.name,
      status: "active",
      startDate: form.startDate,
      endDate: form.endDate,
      targetBranches: form.branchId ? [form.branchId] : [],
      assignedPlaylists: form.playlistId ? [form.playlistId] : [],
      budget: form.budget,
      impressionsTarget: 1000,
    });
    if (form.branchId) store.updateBranch(form.branchId, { campaignId: campaign.id });
  };

  return (
    <section className="rounded-lg border border-white/10 bg-[#111] p-4">
      <FormTitle icon={Activity} title="Kampaniya yaratish" />
      <div className="mt-4 grid gap-3">
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Kampaniya nomi" />
        <Select value={form.branchId} onChange={(event) => update("branchId", event.target.value)}>
          <option value="">Lokatsiya tanlanmagan</option>
          {store.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </Select>
        <Select value={form.playlistId} onChange={(event) => update("playlistId", event.target.value)}>
          <option value="">Playlist tanlanmagan</option>
          {store.playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
        </Select>
        <Input value={form.budget} onChange={(event) => update("budget", event.target.value)} placeholder="Budget" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} />
          <Input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} />
        </div>
        <Button variant="gold" onClick={create}><Plus className="mr-2 inline h-4 w-4" />Kampaniya qo'shish</Button>
      </div>
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const store = useCastmapStore();
  const branches = campaign.targetBranches.map((id) => store.branches.find((branch) => branch.id === id)).filter(Boolean) as Branch[];
  const devices = store.devices.filter((device) => campaign.targetBranches.includes(device.branchId));
  const playlists = campaign.assignedPlaylists.map((id) => store.playlists.find((playlist) => playlist.id === id)).filter(Boolean) as Playlist[];
  return (
    <article className="rounded-lg border border-white/10 bg-[#111] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">{campaign.name}</h3>
          <p className="mt-1 text-sm text-castMuted">{campaign.startDate} - {campaign.endDate} / {campaign.budget}</p>
        </div>
        <V2Status value={campaign.status} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniStat label="Lokatsiya" value={branches.map((branch) => branch.name).join(", ") || "0"} />
        <MiniStat label="TV" value={String(devices.length)} />
        <MiniStat label="Playlist" value={playlists.map((playlist) => playlist.name).join(", ") || "0"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="gold" onClick={() => store.setCampaignStatus(campaign.id, "active")}><Play className="mr-2 inline h-4 w-4" />Start</Button>
        <Button onClick={() => store.setCampaignStatus(campaign.id, "paused")}><Pause className="mr-2 inline h-4 w-4" />Pause</Button>
        <Button variant="danger" onClick={() => store.deleteCampaign(campaign.id)}><Trash2 className="mr-2 inline h-4 w-4" />O'chirish</Button>
      </div>
    </article>
  );
}

function LocationsPanel({ query }: { query: string }) {
  const store = useCastmapStore();
  const branches = store.branches.filter((branch) => includes(query, branch.name, branch.city, branch.address));
  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <LocationForm />
      <div className="rounded-lg border border-white/10 bg-[#111]">
        <PanelHeader icon={MapPin} title="Lokatsiyalar" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-castMuted">
              <tr><th className="px-4 py-3">Lokatsiya</th><th className="px-4 py-3">Shahar</th><th className="px-4 py-3">Ish vaqti</th><th className="px-4 py-3">TV</th><th className="px-4 py-3">Kampaniya</th><th className="px-4 py-3">Amal</th></tr>
            </thead>
            <tbody>
              {branches.map((branch) => {
                const devices = store.devices.filter((device) => device.branchId === branch.id);
                const campaign = store.campaigns.find((item) => item.id === branch.campaignId);
                return (
                  <tr key={branch.id} className="border-t border-white/10">
                    <td className="px-4 py-4 font-bold text-white">{branch.name}<span className="block text-xs text-castMuted">{branch.address}</span></td>
                    <td className="px-4 py-4 text-castMuted">{branch.city}</td>
                    <td className="px-4 py-4 text-castMuted">{branch.workStart} - {branch.workEnd}</td>
                    <td className="px-4 py-4 text-castMuted">{devices.filter((device) => device.status === "online").length}/{devices.length}</td>
                    <td className="px-4 py-4 text-castMuted">{campaign?.name || "Biriktirilmagan"}</td>
                    <td className="px-4 py-4"><Button variant="danger" onClick={() => store.deleteBranch(branch.id)}>O'chirish</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function LocationForm() {
  const store = useCastmapStore();
  const [form, setForm] = useState({ name: "Yangi lokatsiya", city: "Toshkent", address: "Toshkent", campaignId: "", workStart: "09:00", workEnd: "22:00" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="rounded-lg border border-white/10 bg-[#111] p-4">
      <FormTitle icon={MapPin} title="Lokatsiya qo'shish" />
      <div className="mt-4 grid gap-3">
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Lokatsiya nomi" />
        <Input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Shahar" />
        <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Manzil" />
        <Select value={form.campaignId} onChange={(event) => update("campaignId", event.target.value)}>
          <option value="">Kampaniya tanlanmagan</option>
          {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
        </Select>
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="time" value={form.workStart} onChange={(event) => update("workStart", event.target.value)} />
          <Input type="time" value={form.workEnd} onChange={(event) => update("workEnd", event.target.value)} />
        </div>
        <Button variant="gold" onClick={() => store.addBranch(form)}><Plus className="mr-2 inline h-4 w-4" />Lokatsiya qo'shish</Button>
      </div>
    </section>
  );
}

function DevicesPanel({ query }: { query: string }) {
  const store = useCastmapStore();
  const devices = filterDevices(store.devices, query);
  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <PairDeviceForm />
      <section className="rounded-lg border border-white/10 bg-[#111]">
        <PanelHeader icon={Monitor} title="TV qurilmalar" />
        <DeviceRows devices={devices} />
      </section>
    </section>
  );
}

function PairDeviceForm() {
  const store = useCastmapStore();
  const [form, setForm] = useState({ code: "CSWGYK3Y", name: "CASTMAP Player 01", branchId: store.branches[0]?.id || "" });
  useEffect(() => {
    setForm((current) => ({ ...current, branchId: current.branchId || store.branches[0]?.id || "" }));
  }, [store.branches]);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="rounded-lg border border-white/10 bg-[#111] p-4">
      <FormTitle icon={Monitor} title="TV qurilma ulash" />
      <div className="mt-4 grid gap-3">
        <Input value={form.code} onChange={(event) => update("code", event.target.value)} placeholder="TV pairing code" />
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Qurilma nomi" />
        <Select value={form.branchId} onChange={(event) => update("branchId", event.target.value)}>
          <option value="">Lokatsiya tanlanmagan</option>
          {store.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </Select>
        <Button variant="gold" disabled={!form.branchId} onClick={() => store.pairDevice(form.code, form.name, form.branchId)}><Plus className="mr-2 inline h-4 w-4" />TV ulash</Button>
      </div>
    </section>
  );
}

function DeviceRows({ devices }: { devices: Device[] }) {
  const store = useCastmapStore();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs uppercase text-castMuted">
          <tr><th className="px-4 py-3">TV</th><th className="px-4 py-3">Lokatsiya</th><th className="px-4 py-3">Playlist</th><th className="px-4 py-3">APK</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Amal</th></tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className="border-t border-white/10">
              <td className="px-4 py-4 font-bold text-white">{device.name}<span className="block text-xs text-castMuted">{device.deviceId}</span></td>
              <td className="px-4 py-4 text-castMuted">{device.branch}</td>
              <td className="px-4 py-4 text-castMuted">{device.playlist}</td>
              <td className="px-4 py-4 text-castMuted">{device.apkVersion}</td>
              <td className="px-4 py-4"><V2Status value={device.status} /></td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => store.sendCommand(device.id, "FORCE_SYNC")}><RefreshCw className="mr-2 inline h-4 w-4" />Sync</Button>
                  <Button variant="danger" onClick={() => store.deleteDevice(device.id)}>O'chirish</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlaylistsPanel({ query }: { query: string }) {
  const store = useCastmapStore();
  const playlists = store.playlists.filter((playlist) => includes(query, playlist.name, playlist.target, playlist.status));
  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <PlaylistForm />
      <div className="grid content-start gap-4">
        {playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}
      </div>
    </section>
  );
}

function PlaylistForm() {
  const store = useCastmapStore();
  const [form, setForm] = useState({
    name: "TV uchun playlist",
    campaignId: store.campaigns[0]?.id || "",
    branchId: store.branches[0]?.id || "",
    deviceId: store.devices[0]?.id || "",
    mediaId: store.media[0]?.id || "",
  });
  useEffect(() => {
    setForm((current) => ({
      ...current,
      campaignId: current.campaignId || store.campaigns[0]?.id || "",
      branchId: current.branchId || store.branches[0]?.id || "",
      deviceId: current.deviceId || store.devices[0]?.id || "",
      mediaId: current.mediaId || store.media[0]?.id || "",
    }));
  }, [store.branches, store.campaigns, store.devices, store.media]);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const create = () => {
    const playlist = store.createPlaylist({
      name: form.name,
      campaignId: form.campaignId || undefined,
      branchId: form.branchId || undefined,
      deviceIds: form.deviceId ? [form.deviceId] : [],
      mediaIds: form.mediaId ? [form.mediaId] : [],
    });
    store.publishPlaylist(playlist.id);
  };
  return (
    <section className="rounded-lg border border-white/10 bg-[#111] p-4">
      <FormTitle icon={GalleryVerticalEnd} title="Playlist yaratish" />
      <div className="mt-4 grid gap-3">
        <Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Playlist nomi" />
        <Select value={form.mediaId} onChange={(event) => update("mediaId", event.target.value)}>
          <option value="">Media tanlanmagan</option>
          {store.media.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
        </Select>
        <Select value={form.branchId} onChange={(event) => update("branchId", event.target.value)}>
          <option value="">Lokatsiya tanlanmagan</option>
          {store.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </Select>
        <Select value={form.deviceId} onChange={(event) => update("deviceId", event.target.value)}>
          <option value="">TV tanlanmagan</option>
          {store.devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
        </Select>
        <Select value={form.campaignId} onChange={(event) => update("campaignId", event.target.value)}>
          <option value="">Kampaniya tanlanmagan</option>
          {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
        </Select>
        <Button variant="gold" onClick={create}><CheckCircle2 className="mr-2 inline h-4 w-4" />Publish qilish</Button>
      </div>
    </section>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const store = useCastmapStore();
  const branch = store.branches.find((item) => item.id === playlist.branchId);
  const devices = store.devices.filter((device) => playlist.deviceIds?.includes(device.id));
  return (
    <article className="rounded-lg border border-white/10 bg-[#111] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">{playlist.name}</h3>
          <p className="mt-1 text-sm text-castMuted">{branch?.name || playlist.target} / {playlist.updatedAt}</p>
        </div>
        <V2Status value={playlist.status} />
      </div>
      <ol className="mt-4 grid gap-2 text-sm text-white">
        {playlist.items.map((item, index) => {
          const media = store.media.find((asset) => asset.id === item.mediaId);
          return <li key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-2">{index + 1}. {media?.name || item.mediaId}</li>;
        })}
      </ol>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniStat label="TV" value={devices.map((device) => device.name).join(", ") || "Barcha TV"} />
        <MiniStat label="Loop" value={playlist.loop ? "Yoqilgan" : "O'chirilgan"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="gold" onClick={() => store.publishPlaylist(playlist.id)}>Publish</Button>
        <Button onClick={() => store.duplicatePlaylist(playlist.id)}>Nusxa</Button>
        <Button variant="danger" onClick={() => store.deletePlaylist(playlist.id)}>O'chirish</Button>
      </div>
    </article>
  );
}

function MediaPanel({ query }: { query: string }) {
  const store = useCastmapStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "stream">("file");
  const media = store.media.filter((asset) => includes(query, asset.name, asset.type, asset.folder));
  const targetPlaylist = store.playlists.find((playlist) => playlist.status === "published") || store.playlists[0];
  const openUpload = (mode: "file" | "stream") => {
    setUploadMode(mode);
    setUploadOpen(true);
  };
  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Video", "MP4, MOV, WEBM yoki HLS/MP4 URL", "file"],
          ["Rasm", "JPG, PNG, WEBP, SVG", "file"],
          ["Stream URL", "HLS, DASH, RTSP yoki MP4 live URL", "stream"],
        ].map(([title, detail, mode]) => (
          <button key={title} className="rounded-lg border border-white/10 bg-[#111] p-4 text-left transition hover:border-castGold/35" type="button" onClick={() => openUpload(mode as "file" | "stream")}>
            <Clapperboard className="h-5 w-5 text-castGold" />
            <b className="mt-4 block text-white">{title}</b>
            <span className="mt-2 block text-sm text-castMuted">{detail}</span>
          </button>
        ))}
      </section>

      <section className="rounded-lg border border-white/10 bg-[#111]">
        <PanelHeader icon={Clapperboard} title="Media kutubxona" action="Media qo'shish" onAction={() => openUpload("file")} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-castMuted">
              <tr><th className="px-4 py-3">Media</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Format</th><th className="px-4 py-3">Folder</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Playlist</th><th className="px-4 py-3">Amal</th></tr>
            </thead>
            <tbody>
              {media.map((asset) => (
                <tr key={asset.id} className="border-t border-white/10">
                  <td className="max-w-[360px] truncate px-4 py-4 font-bold text-white">{asset.name}<span className="block text-xs text-castMuted">{asset.duration || asset.size}</span></td>
                  <td className="px-4 py-4 text-castMuted">{asset.type}</td>
                  <td className="px-4 py-4 text-castMuted">{asset.format}</td>
                  <td className="px-4 py-4 text-castMuted">{asset.folder}</td>
                  <td className="px-4 py-4"><V2Status value={asset.status} /></td>
                  <td className="px-4 py-4 text-castMuted">{asset.usedInPlaylists} playlist</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={!targetPlaylist} onClick={() => targetPlaylist && store.addMediaToPlaylist(asset.id, targetPlaylist.id)}>Playlistga qo'shish</Button>
                      <Button variant="danger" onClick={() => store.deleteMediaAsset(asset.id)}>O'chirish</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <MediaUploadModal
        open={uploadOpen}
        mode={uploadMode}
        onClose={() => setUploadOpen(false)}
        onUpload={async (draft) => store.createMediaFromDraft({ ...draft, approvalRequired: false })}
      />
    </>
  );
}

function BillingPanel() {
  const store = useCastmapStore();
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {store.billingPlans.map((plan) => (
        <article key={plan.id} className={`rounded-lg border bg-[#111] p-4 ${plan.current ? "border-castGold/40" : "border-white/10"}`}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-white">{plan.name}</h3>
            {plan.current ? <V2Status value="current" /> : null}
          </div>
          <p className="mt-4 text-2xl font-black text-castGold">{plan.price}</p>
          <p className="mt-2 text-sm text-castMuted">{plan.deviceLimit} TV / {plan.storageLimitGb} GB</p>
          <Button className="mt-5 w-full" variant={plan.current ? "ghost" : "gold"} onClick={() => store.updatePlan(plan.id)}>{plan.current ? "Joriy" : "Tanlash"}</Button>
        </article>
      ))}
    </section>
  );
}

function PublishedPlaylistCard() {
  const store = useCastmapStore();
  const playlist = store.playlists.find((item) => item.status === "published") || store.playlists[0];
  if (!playlist) return null;
  return (
    <section className="rounded-lg border border-white/10 bg-[#111] p-4">
      <h2 className="text-lg font-black text-white">Published playlist</h2>
      <p className="mt-2 text-sm text-castMuted">{playlist.name}</p>
      <ol className="mt-4 grid gap-2 text-sm text-white">
        {playlist.items.slice(0, 5).map((item, index) => {
          const asset = store.media.find((media) => media.id === item.mediaId);
          return <li key={item.id}>{index + 1}. {asset?.name || item.mediaId}</li>;
        })}
      </ol>
    </section>
  );
}

function CampaignHealth() {
  const store = useCastmapStore();
  return (
    <section className="rounded-lg border border-white/10 bg-[#111] p-4">
      <h2 className="text-lg font-black text-white">Kampaniya holati</h2>
      <div className="mt-4 grid gap-3">
        {store.campaigns.slice(0, 4).map((campaign) => (
          <div key={campaign.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between gap-3">
              <b className="text-white">{campaign.name}</b>
              <V2Status value={campaign.status} />
            </div>
            <p className="mt-1 text-sm text-castMuted">{campaign.targetBranches.length} lokatsiya / {campaign.assignedPlaylists.length} playlist</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PanelHeader({ icon: Icon, title, action, onAction }: { icon: typeof Monitor; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-castGold" />
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      {action ? <Button variant="gold" onClick={onAction}>{action}</Button> : null}
    </div>
  );
}

function FormTitle({ icon: Icon, title }: { icon: typeof Monitor; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-castGold" />
      <h2 className="text-xl font-black text-white">{title}</h2>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <span className="text-xs text-castMuted">{label}</span>
      <b className="mt-1 block truncate text-white">{value}</b>
    </div>
  );
}

function includes(query: string, ...values: Array<string | undefined>) {
  const search = query.trim().toLowerCase();
  return !search || values.some((value) => String(value || "").toLowerCase().includes(search));
}

function filterDevices(devices: Device[], query: string) {
  return devices.filter((device) => includes(query, device.name, device.deviceId, device.branch, device.status, device.playlist));
}
