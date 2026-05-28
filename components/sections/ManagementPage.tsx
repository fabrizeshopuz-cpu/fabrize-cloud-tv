"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Eye,
  FilePlus2,
  GalleryVerticalEnd,
  LayoutGrid,
  Monitor,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Smartphone,
  Trash2,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { LivePreview } from "@/components/live/LivePreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { UZBEK_REGIONS } from "@/lib/constants";
import { useCastmapStore } from "@/lib/store";
import type { Alert, ApkVersion, Branch, Campaign, CommandType, Device, Playlist, Schedule } from "@/types";

type SectionKey =
  | "locations"
  | "screens"
  | "playlists"
  | "schedules"
  | "campaigns"
  | "analytics"
  | "live-monitoring"
  | "apk-management"
  | "alerts"
  | "widgets"
  | "users"
  | "billing"
  | "settings";

const sectionConfig: Record<SectionKey, { active: string; kicker: string; title: string; subtitle: string; action: string; icon: typeof LayoutGrid }> = {
  locations: { active: "Lokatsiyalar", kicker: "LOCATION MANAGEMENT", title: "Lokatsiyalar", subtitle: "Filial va manzillarni yaratish, tahrirlash, ishlash vaqtini belgilash", action: "Lokatsiya qo'shish", icon: Monitor },
  screens: { active: "Ekranlar", kicker: "SCREEN INVENTORY", title: "Ekranlar", subtitle: "Filiallar bo'yicha ekran joylashuvi va holatini boshqarish", action: "Ekran qo'shish", icon: Monitor },
  playlists: { active: "Playlistlar", kicker: "PLAYLIST BUILDER", title: "Playlistlar", subtitle: "Media fayllarni tartiblash, publish qilish va targetlash", action: "Playlist yaratish", icon: GalleryVerticalEnd },
  schedules: { active: "Jadval", kicker: "SCHEDULING ENGINE", title: "Jadval", subtitle: "Playlistlarni kun, vaqt va filial bo'yicha rejalashtirish", action: "Jadval qo'shish", icon: CalendarClock },
  campaigns: { active: "Kampaniyalar", kicker: "CAMPAIGN OPS", title: "Kampaniyalar", subtitle: "Retail media kampaniyalarini yaratish va natijani kuzatish", action: "Kampaniya yaratish", icon: Radio },
  analytics: { active: "Analitika", kicker: "ANALYTICS", title: "Analitika", subtitle: "Ko'rsatishlar, uptime va kampaniya samaradorligini tahlil qilish", action: "Hisobot olish", icon: BarChart3 },
  "live-monitoring": { active: "Jonli monitoring", kicker: "LIVE MONITORING", title: "Jonli monitoring", subtitle: "Barcha TV ekranlardan screenshot va playback holatini ko'rish", action: "Hammasini yangilash", icon: Eye },
  "apk-management": { active: "APK boshqaruvi", kicker: "PLAYER RELEASES", title: "APK boshqaruvi", subtitle: "Player versiyalari, rollout, rollback va qurilmalar bo'yicha versiyalar", action: "APK yuklash", icon: Smartphone },
  alerts: { active: "Ogohlantirishlar", kicker: "ALERT CENTER", title: "Ogohlantirishlar", subtitle: "Offline, xatolik, storage va heartbeat muammolarini boshqarish", action: "Tekshirish", icon: AlertTriangle },
  widgets: { active: "Ilovalar va Widgetlar", kicker: "WIDGET MARKET", title: "Ilovalar va Widgetlar", subtitle: "Ob-havo, soat, QR, YouTube va boshqa modullar", action: "Widget qo'shish", icon: Wrench },
  users: { active: "Foydalanuvchilar", kicker: "ACCESS CONTROL", title: "Foydalanuvchilar", subtitle: "Rol, filial huquqi va operatorlarni boshqarish", action: "User yaratish", icon: UsersRound },
  billing: { active: "Tarif va billing", kicker: "BILLING", title: "Tarif va billing", subtitle: "Tariflar, limitlar, invoice va upgrade jarayoni", action: "Tarifni yangilash", icon: CreditCard },
  settings: { active: "Sozlamalar", kicker: "SYSTEM SETTINGS", title: "Sozlamalar", subtitle: "Kompaniya, brand, xavfsizlik, API va webhook sozlamalari", action: "Saqlash", icon: Settings },
};

export function ManagementPage({ section }: { section: SectionKey }) {
  const store = useCastmapStore();
  const config = sectionConfig[section];
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [modal, setModal] = useState("");
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerBody, setDrawerBody] = useState<string[]>([]);

  const openDrawer = (title: string, rows: string[]) => {
    setDrawerTitle(title);
    setDrawerBody(rows);
  };

  const doPrimaryAction = () => {
    if (section === "locations") store.addBranch({ name: `Yangi lokatsiya ${store.branches.length + 1}`, city: "Toshkent", workStart: "09:00", workEnd: "22:00" });
    else if (section === "playlists") store.addPlaylist();
    else if (section === "schedules") store.addSchedule();
    else if (section === "campaigns") store.addCampaign();
    else if (section === "users") store.addUser();
    else if (section === "apk-management") store.uploadApk();
    else if (section === "billing") setModal("billing");
    else if (section === "alerts") store.pushToast("Ogohlantirishlar qayta tekshirildi.", "info");
    else if (section === "live-monitoring") store.pushToast("Screenshot grid yangilandi.", "info");
    else if (section === "settings") store.pushToast("Sozlamalar saqlandi.");
    else setModal(section);
  };

  return (
    <main className="flex min-h-screen bg-castBg text-castText max-lg:flex-col">
      <Sidebar activeLabel={config.active} />
      <section className="min-w-0 flex-1">
        <Topbar />
        <div className="grid gap-5 p-7 max-sm:p-4">
          <PageHeader kicker={config.kicker} title={config.title} subtitle={config.subtitle} icon={config.icon} actionLabel={config.action} onAction={doPrimaryAction} />
          <Toolbar query={query} onQuery={setQuery} tab={tab} onTab={setTab} />
          {section === "locations" && <LocationsContent query={query} openDrawer={openDrawer} />}
          {section === "screens" && <ScreensContent query={query} openDrawer={openDrawer} />}
          {section === "playlists" && <PlaylistsContent query={query} openDrawer={openDrawer} />}
          {section === "schedules" && <SchedulesContent query={query} openDrawer={openDrawer} />}
          {section === "campaigns" && <CampaignsContent query={query} openDrawer={openDrawer} />}
          {section === "analytics" && <AnalyticsContent />}
          {section === "live-monitoring" && <MonitoringContent query={query} openDrawer={openDrawer} />}
          {section === "apk-management" && <ApkContent openDrawer={openDrawer} />}
          {section === "alerts" && <AlertsContent query={query} openDrawer={openDrawer} />}
          {section === "widgets" && <WidgetsContent />}
          {section === "users" && <UsersContent query={query} openDrawer={openDrawer} />}
          {section === "billing" && <BillingContent />}
          {section === "settings" && <SettingsContent />}
        </div>
      </section>
      <Drawer open={!!drawerTitle} title={drawerTitle} onClose={() => setDrawerTitle("")}>
        <div className="grid gap-3">
          {drawerBody.map((row) => <div key={row} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-castMuted">{row}</div>)}
        </div>
      </Drawer>
      <MockModal title={config.title} open={!!modal} onClose={() => setModal("")} />
    </main>
  );
}

function Toolbar({ query, onQuery, tab, onTab }: { query: string; onQuery: (value: string) => void; tab: string; onTab: (value: string) => void }) {
  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-castMuted" />
          <Input className="pl-11" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Nom, filial, ID yoki status bo'yicha qidirish" />
        </label>
        <Select defaultValue="all">
          <option value="all">Barcha filiallar</option>
          <option>Makro Andijon</option>
          <option>Korzinka Chilonzor</option>
          <option>Toshkent City</option>
        </Select>
        <Select defaultValue="latest">
          <option value="latest">Eng yangi</option>
          <option value="status">Status bo'yicha</option>
          <option value="name">Nomi A-Z</option>
        </Select>
        <Button onClick={() => onQuery("")}>Filtrni tozalash</Button>
      </div>
      <Tabs
        active={tab}
        onChange={onTab}
        items={[
          { id: "all", label: "Barchasi" },
          { id: "active", label: "Faol" },
          { id: "draft", label: "Draft" },
          { id: "warning", label: "E'tibor kerak" },
        ]}
      />
    </Card>
  );
}

function filterText(query: string, ...values: string[]) {
  const search = query.trim().toLowerCase();
  return !search || values.some((value) => value.toLowerCase().includes(search));
}

function MetricGrid() {
  const store = useCastmapStore();
  const online = store.devices.filter((item) => item.status === "online").length;
  const offline = store.devices.filter((item) => item.status === "offline").length;
  return (
    <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
      <Metric title="Jami ekranlar" value={String(store.devices.length)} helper="Ro'yxatdan o'tgan TV va boxlar" tone="gold" />
      <Metric title="Onlayn" value={String(online)} helper="Heartbeat kelmoqda" tone="green" />
      <Metric title="Offline" value={String(offline)} helper="Tekshiruv talab qiladi" tone="red" />
      <Metric title="Media oqimi" value={String(store.media.length)} helper="Kutubxonadagi fayllar" tone="blue" />
    </section>
  );
}

function Metric({ title, value, helper, tone }: { title: string; value: string; helper: string; tone: "gold" | "green" | "red" | "blue" }) {
  const toneClass = tone === "green" ? "text-green-300" : tone === "red" ? "text-red-300" : tone === "blue" ? "text-blue-300" : "text-castGold";
  return (
    <Card>
      <p className="text-sm text-castMuted">{title}</p>
      <strong className={`mt-3 block text-3xl ${toneClass}`}>{value}</strong>
      <span className="mt-2 block text-xs text-castMuted">{helper}</span>
    </Card>
  );
}

function LocationsContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const [editingId, setEditingId] = useState("");
  const branches = store.branches.filter((branch) => filterText(query, branch.name, branch.city, branch.address));
  const deviceCount = (branchId: string) => store.devices.filter((device) => device.branchId === branchId).length;
  const onlineCount = (branchId: string) => store.devices.filter((device) => device.branchId === branchId && device.status === "online").length;

  return (
    <>
      <LocationCreateCard />
      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <Metric title="Lokatsiyalar" value={String(store.branches.length)} helper="Barcha filiallar" tone="gold" />
        <Metric title="TV ekranlar" value={String(store.devices.length)} helper="Lokatsiyalarga bog'langan" tone="blue" />
        <Metric title="Onlayn" value={String(store.devices.filter((device) => device.status === "online").length)} helper="Hozir faol" tone="green" />
        <Metric title="Offline" value={String(store.devices.filter((device) => device.status === "offline").length)} helper="Tekshirish kerak" tone="red" />
      </section>
      <Table headers={["Lokatsiya", "Viloyat", "Kampaniya", "Ish vaqti", "TV soni", "Holat", "Amallar"]}>
        {branches.map((branch) => (
          <LocationRow
            key={branch.id}
            branch={branch}
            editing={editingId === branch.id}
            onEdit={() => setEditingId(branch.id)}
            onCancel={() => setEditingId("")}
            onDetail={() => openDrawer(branch.name, [
              `Shahar: ${branch.city}`,
              `Manzil: ${branch.address}`,
              `Kampaniya: ${store.campaigns.find((campaign) => campaign.id === branch.campaignId)?.name || "Biriktirilmagan"}`,
              `Ish vaqti: ${branch.workStart} - ${branch.workEnd}`,
              `TV soni: ${deviceCount(branch.id)}`,
              `Onlayn TV: ${onlineCount(branch.id)}`,
            ])}
            deviceCount={deviceCount(branch.id)}
            onlineCount={onlineCount(branch.id)}
          />
        ))}
      </Table>
    </>
  );
}

function LocationRow({ branch, editing, onEdit, onCancel, onDetail, deviceCount, onlineCount }: { branch: Branch; editing: boolean; onEdit: () => void; onCancel: () => void; onDetail: () => void; deviceCount: number; onlineCount: number }) {
  const store = useCastmapStore();
  const [draft, setDraft] = useState(branch);
  const update = (key: keyof Branch, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const campaignName = store.campaigns.find((campaign) => campaign.id === branch.campaignId)?.name || "Kampaniya tanlanmagan";

  if (editing) {
    return (
      <tr className="bg-castGold/5">
        <td className="px-4 py-3"><Input value={draft.name} onChange={(event) => update("name", event.target.value)} /></td>
        <td className="px-4 py-3"><RegionSelect value={draft.city} onChange={(value) => update("city", value)} /></td>
        <td className="px-4 py-3">
          <Select value={draft.campaignId || ""} onChange={(event) => update("campaignId", event.target.value)}>
            <option value="">Kampaniya tanlanmagan</option>
            {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </Select>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <Input type="time" value={draft.workStart} onChange={(event) => update("workStart", event.target.value)} />
            <Input type="time" value={draft.workEnd} onChange={(event) => update("workEnd", event.target.value)} />
          </div>
        </td>
        <td className="px-4 py-3 text-castMuted">{deviceCount}</td>
        <td className="px-4 py-3"><StatusSummary onlineCount={onlineCount} deviceCount={deviceCount} /></td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="gold" onClick={() => { store.updateBranch(branch.id, draft); onCancel(); }}>Saqlash</Button>
            <Button onClick={() => { setDraft(branch); onCancel(); }}>Bekor</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-white/[0.03]">
      <td className="px-4 py-3 font-bold text-white">{branch.name}<span className="block text-xs text-castMuted">{branch.address}</span></td>
      <td className="px-4 py-3 text-castMuted">{branch.city}</td>
      <td className="px-4 py-3 text-castMuted">{campaignName}</td>
      <td className="px-4 py-3 text-castMuted">{branch.workStart} - {branch.workEnd}</td>
      <td className="px-4 py-3 text-castMuted">{deviceCount}</td>
      <td className="px-4 py-3"><StatusSummary onlineCount={onlineCount} deviceCount={deviceCount} /></td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onDetail}>Batafsil</Button>
          <Button onClick={onEdit}>Tahrirlash</Button>
          <Button variant="danger" onClick={() => store.deleteBranch(branch.id)}>O'chirish</Button>
        </div>
      </td>
    </tr>
  );
}

function StatusSummary({ onlineCount, deviceCount }: { onlineCount: number; deviceCount: number }) {
  if (!deviceCount) return <Badge>Nofaol</Badge>;
  if (onlineCount === deviceCount) return <Badge tone="green">Ishlamoqda</Badge>;
  if (onlineCount > 0) return <Badge tone="orange">{`${onlineCount}/${deviceCount} ishlamoqda`}</Badge>;
  return <Badge tone="red">Ishlamayapti</Badge>;
}

function RegionSelect({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <Select className={className} value={value} onChange={(event) => onChange(event.target.value)}>
      {UZBEK_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
    </Select>
  );
}

function ScreensContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const devices = store.devices.filter((device) => filterText(query, device.name, device.branch, device.deviceId));
  return (
    <>
      <LocationCreateCard />
      <MetricGrid />
      <Table headers={["Ekran", "Filial", "Status", "Joriy kontent", "APK", "Amallar"]}>
        {devices.map((device) => (
          <tr key={device.id} className="hover:bg-white/[0.03]">
            <td className="px-4 py-3 font-bold text-white">{device.name}<span className="block text-xs text-castMuted">{device.deviceId}</span></td>
            <td className="px-4 py-3 text-castMuted">{device.branch}</td>
            <td className="px-4 py-3"><StatusBadge status={device.status} /></td>
            <td className="px-4 py-3 text-castMuted">{device.playlist}</td>
            <td className="px-4 py-3 text-castMuted">{device.apkVersion}</td>
            <td className="px-4 py-3 flex gap-2"><Button onClick={() => openDrawer(device.name, deviceRows(device))}>Batafsil</Button><Button variant="danger" onClick={() => store.deleteDevice(device.id)}>O'chirish</Button></td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function LocationCreateCard() {
  const store = useCastmapStore();
  const [form, setForm] = useState({
    name: "",
    city: "Toshkent",
    address: "",
    campaignId: "",
    workStart: "09:00",
    workEnd: "22:00",
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card className="border-castGold/20">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <h3 className="text-lg font-black text-white">Yangi lokatsiya qo'shish</h3>
          <p className="mt-1 text-sm text-castMuted">Keyin shu lokatsiyaga TV qurilma ulash va kontent biriktirish mumkin.</p>
        </div>
        <Input className="w-56" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Lokatsiya nomi" />
        <RegionSelect className="w-44" value={form.city} onChange={(value) => update("city", value)} />
        <Input className="w-56" value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Manzil" />
        <Select className="w-60" value={form.campaignId} onChange={(event) => update("campaignId", event.target.value)}>
          <option value="">Avval saqlangan kampaniyani tanlang</option>
          {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
        </Select>
        <Input className="w-32" type="time" value={form.workStart} onChange={(event) => update("workStart", event.target.value)} />
        <Input className="w-32" type="time" value={form.workEnd} onChange={(event) => update("workEnd", event.target.value)} />
        <Button
          variant="gold"
          onClick={() => {
            store.addBranch(form);
            setForm({ name: "", city: form.city, address: "", campaignId: form.campaignId, workStart: form.workStart, workEnd: form.workEnd });
          }}
        >
          Qo'shish
        </Button>
      </div>
    </Card>
  );
}

function PlaylistsContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const [editingId, setEditingId] = useState("");
  const items = store.playlists.filter((playlist) => filterText(query, playlist.name, playlist.target, playlist.status));
  return (
    <>
      <PlaylistCreateCard />
      <section className="grid gap-4 xl:grid-cols-3">
        {items.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} editing={editingId === playlist.id} onEdit={() => setEditingId(playlist.id)} onCancel={() => setEditingId("")} openDrawer={openDrawer} />
        ))}
      </section>
    </>
  );
}

function PlaylistCreateCard() {
  const store = useCastmapStore();
  const [form, setForm] = useState({
    name: "",
    description: "",
    campaignId: store.campaigns[0]?.id || "",
    branchId: store.branches[0]?.id || "",
  });
  const branchDevices = store.devices.filter((device) => !form.branchId || device.branchId === form.branchId);
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const toggle = (list: string[], id: string, setter: (next: string[]) => void) => setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

  return (
    <Card className="border-castGold/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">Yangi playlist yaratish</h3>
          <p className="mt-1 text-sm text-castMuted">Media qaysi kampaniya, lokatsiya va TVlarda chiqishini aniq tanlang.</p>
        </div>
        <Button
          variant="gold"
          onClick={() => {
            store.createPlaylist({ ...form, deviceIds, mediaIds });
            setForm({ ...form, name: "", description: "" });
            setDeviceIds([]);
            setMediaIds([]);
          }}
        >
          Playlist yaratish
        </Button>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-4 md:grid-cols-2">
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Playlist nomi" />
        <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tavsif" />
        <Select value={form.campaignId} onChange={(event) => setForm({ ...form, campaignId: event.target.value })}>
          <option value="">Kampaniya tanlanmagan</option>
          {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
        </Select>
        <Select value={form.branchId} onChange={(event) => { setForm({ ...form, branchId: event.target.value }); setDeviceIds([]); }}>
          <option value="">Barcha lokatsiyalar</option>
          {store.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>)}
        </Select>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Checklist title="TV qurilmalar" empty="Bu lokatsiyada TV yo'q" items={branchDevices.map((device) => ({ id: device.id, label: `${device.name} - ${device.branch}`, sub: `${device.deviceId} / ${device.status}` }))} selected={deviceIds} onToggle={(id) => toggle(deviceIds, id, setDeviceIds)} />
        <Checklist title="Media fayllar" empty="Media kutubxona bo'sh" items={store.media.map((asset) => ({ id: asset.id, label: asset.name, sub: `${asset.type} / ${asset.status}` }))} selected={mediaIds} onToggle={(id) => toggle(mediaIds, id, setMediaIds)} />
      </div>
    </Card>
  );
}

function Checklist({ title, empty, items, selected, onToggle }: { title: string; empty: string; items: Array<{ id: string; label: string; sub: string }>; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <b className="text-sm text-white">{title}</b>
      <div className="mt-3 grid max-h-48 gap-2 overflow-auto pr-1">
        {items.length ? items.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-2 text-sm hover:border-castGold/30">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            <span className="min-w-0">
              <span className="block truncate font-bold text-white">{item.label}</span>
              <span className="block truncate text-xs text-castMuted">{item.sub}</span>
            </span>
          </label>
        )) : <p className="text-sm text-castMuted">{empty}</p>}
      </div>
    </div>
  );
}

function PlaylistCard({ playlist, editing, onEdit, onCancel, openDrawer }: { playlist: Playlist; editing: boolean; onEdit: () => void; onCancel: () => void; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const [draft, setDraft] = useState(playlist);
  const campaignName = playlist.campaignId ? store.campaigns.find((campaign) => campaign.id === playlist.campaignId)?.name : "";
  const branchName = playlist.branchId ? store.branches.find((branch) => branch.id === playlist.branchId)?.name : "";
  const tvNames = playlist.deviceIds?.map((id) => store.devices.find((device) => device.id === id)?.name || id) || [];
  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid gap-2">
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              <Input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              <Select value={draft.campaignId || ""} onChange={(event) => setDraft({ ...draft, campaignId: event.target.value || undefined })}>
                <option value="">Kampaniya tanlanmagan</option>
                {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              </Select>
              <Select value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value })}>
                {store.branches.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
              </Select>
            </div>
          ) : (
            <>
              <h3 className="truncate text-lg font-black text-white">{playlist.name}</h3>
              <p className="mt-1 text-sm text-castMuted">{playlist.description}</p>
            </>
          )}
        </div>
        <Badge tone={playlist.status === "published" ? "green" : "gray"}>{playlist.status}</Badge>
      </div>
      <div className="text-sm text-castMuted">Target: {playlist.target}</div>
      <div className="text-sm text-castMuted">Kampaniya: {campaignName || "tanlanmagan"} / Lokatsiya: {branchName || "barcha"}</div>
      <div className="text-sm text-castMuted">TVlar: {tvNames.length ? tvNames.join(", ") : "barcha yoki keyin tanlanadi"}</div>
      <div className="text-sm text-castMuted">Media: {playlist.items.length} ta, loop: {playlist.loop ? "yoqilgan" : "o'chirilgan"}</div>
      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button variant="gold" onClick={() => { store.updatePlaylist(playlist.id, draft); onCancel(); }}>Saqlash</Button>
            <Button onClick={() => { setDraft(playlist); onCancel(); }}>Bekor</Button>
          </>
        ) : (
          <Button onClick={onEdit}>Tahrirlash</Button>
        )}
        <Button variant="gold" onClick={() => store.publishPlaylist(playlist.id)}>Publish</Button>
        <Button onClick={() => openDrawer(playlist.name, playlist.items.length ? playlist.items.map((item) => `${item.order}. ${item.mediaId} - ${item.duration}s`) : ["Media biriktirilmagan"])}>Preview</Button>
        <Button onClick={() => store.duplicatePlaylist(playlist.id)}>Nusxalash</Button>
        <Button variant="danger" onClick={() => store.deletePlaylist(playlist.id)}>O'chirish</Button>
      </div>
    </Card>
  );
}

function SchedulesContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const items = store.schedules.filter((schedule) => filterText(query, schedule.name, schedule.type, schedule.status));
  return (
    <Table headers={["Nomi", "Playlist", "Filial", "Vaqt", "Kunlar", "Status", "Amallar"]}>
      {items.map((schedule) => (
        <tr key={schedule.id} className="hover:bg-white/[0.03]">
          <td className="px-4 py-3 font-bold text-white">{schedule.name}</td>
          <td className="px-4 py-3 text-castMuted">{store.playlists.find((playlist) => playlist.id === schedule.playlistId)?.name}</td>
          <td className="px-4 py-3 text-castMuted">{store.branches.find((branch) => branch.id === schedule.branchId)?.name}</td>
          <td className="px-4 py-3 text-castMuted">{schedule.startTime} - {schedule.endTime}</td>
          <td className="px-4 py-3 text-castMuted">{schedule.days.join(", ")}</td>
          <td className="px-4 py-3"><Badge tone={schedule.status === "active" ? "green" : "orange"}>{schedule.status}</Badge></td>
          <td className="px-4 py-3 flex gap-2"><Button onClick={() => store.toggleSchedule(schedule.id)}>Pause/Start</Button><Button onClick={() => openDrawer(schedule.name, [`Turi: ${schedule.type}`, `Priority: ${schedule.priority}`])}>Ko'rish</Button><Button variant="danger" onClick={() => store.deleteSchedule(schedule.id)}>O'chirish</Button></td>
        </tr>
      ))}
    </Table>
  );
}

function CampaignsContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const [form, setForm] = useState({ name: "", startDate: "2026-05-21", endDate: "2026-06-21", branchId: store.branches[0]?.id || "", playlistId: store.playlists[0]?.id || "", budget: "0 so'm" });
  const items = store.campaigns.filter((campaign) => filterText(query, campaign.name, campaign.status));
  return (
    <>
      <Card className="border-castGold/20">
        <div className="grid gap-3 xl:grid-cols-[1.3fr_150px_150px_1fr_1fr_150px_auto]">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Kampaniya nomi" />
          <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
          <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
          <Select value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}>
            {store.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </Select>
          <Select value={form.playlistId} onChange={(event) => setForm({ ...form, playlistId: event.target.value })}>
            {store.playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
          </Select>
          <Input value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} placeholder="Budget" />
          <Button
            variant="gold"
            onClick={() => {
              store.createCampaign({
                name: form.name,
                startDate: form.startDate,
                endDate: form.endDate,
                targetBranches: form.branchId ? [form.branchId] : [],
                assignedPlaylists: form.playlistId ? [form.playlistId] : [],
                budget: form.budget,
              });
              setForm({ ...form, name: "" });
            }}
          >
            Qo'shish
          </Button>
        </div>
      </Card>
      <section className="grid gap-4 xl:grid-cols-2">
        {items.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} openDrawer={openDrawer} />)}
      </section>
    </>
  );
}

function CampaignCard({ campaign, openDrawer }: { campaign: Campaign; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(campaign);
  const campaignBranches = store.branches.filter((branch) => branch.campaignId === campaign.id || campaign.targetBranches.includes(branch.id));
  const campaignDevices = store.devices.filter((device) => campaignBranches.some((branch) => branch.id === device.branchId));
  const onlineDevices = campaignDevices.filter((device) => device.status === "online").length;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          {editing ? (
            <div className="grid gap-2">
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
                <Input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-black text-white">{campaign.name}</h3>
              <p className="mt-1 text-sm text-castMuted">{campaign.startDate} - {campaign.endDate}</p>
            </>
          )}
        </div>
        <Badge tone={campaign.status === "active" ? "green" : campaign.status === "paused" ? "orange" : "gray"}>{campaign.status}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label="Budget" value={campaign.budget} />
        <MiniStat label="Lokatsiya" value={String(campaignBranches.length)} />
        <MiniStat label="TV holati" value={campaignDevices.length ? `${onlineDevices}/${campaignDevices.length}` : "0"} />
      </div>
      <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <b className="text-sm text-white">Kampaniyaga bog'langan lokatsiya va TVlar</b>
        {campaignBranches.length ? campaignBranches.map((branch) => {
          const devices = campaignDevices.filter((device) => device.branchId === branch.id);
          const online = devices.filter((device) => device.status === "online").length;
          return (
            <div key={branch.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">{branch.name}</span>
                <StatusSummary onlineCount={online} deviceCount={devices.length} />
              </div>
              <p className="mt-1 text-xs text-castMuted">{branch.city} - {devices.length ? devices.map((device) => `${device.name} (${device.status})`).join(", ") : "TV ulanmagan"}</p>
            </div>
          );
        }) : <p className="text-sm text-castMuted">Bu kampaniyaga lokatsiya biriktirilmagan.</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button variant="gold" onClick={() => { store.updateCampaign(campaign.id, draft); setEditing(false); }}>Saqlash</Button>
            <Button onClick={() => { setDraft(campaign); setEditing(false); }}>Bekor</Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)}>Tahrirlash</Button>
        )}
        <Button variant="gold" onClick={() => store.setCampaignStatus(campaign.id, "active")}>Start</Button>
        <Button onClick={() => store.setCampaignStatus(campaign.id, "paused")}>Pause</Button>
        <Button onClick={() => openDrawer(campaign.name, [
          `Lokatsiyalar: ${campaignBranches.map((branch) => branch.name).join(", ") || "yo'q"}`,
          `TV qurilmalar: ${campaignDevices.map((device) => `${device.name} - ${device.status}`).join(", ") || "yo'q"}`,
          `Playlistlar: ${campaign.assignedPlaylists.map((id) => store.playlists.find((playlist) => playlist.id === id)?.name || id).join(", ") || "yo'q"}`,
          `Proof of play: ${campaign.playbackCount}`,
        ])}>Analitika</Button>
        <Button variant="danger" onClick={() => store.deleteCampaign(campaign.id)}>O'chirish</Button>
      </div>
    </Card>
  );
}

function AnalyticsContent() {
  const store = useCastmapStore();
  const totalDuration = store.playbackLogs.reduce((sum, log) => sum + log.durationSeconds, 0);
  const onlineDevices = store.devices.filter((device) => device.status === "online").length;
  const uptime = store.devices.length ? `${Math.round((onlineDevices / store.devices.length) * 100)}%` : "0%";
  return (
    <>
      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <Metric title="Total impressions" value="0" helper="Hisobotlar tozalangan" tone="gold" />
        <Metric title="Playback count" value={String(store.playbackLogs.length)} helper="Playback log yo'q" tone="blue" />
        <Metric title="Uptime" value={uptime} helper="Device heartbeat asosida" tone="green" />
        <Metric title="Offline time" value="0 soat" helper="Filiallar kesimida" tone="red" />
      </section>
      <Card>
        <h3 className="text-lg font-black text-white">Ko'rsatishlar statistikasi</h3>
        <div className="mt-5 grid h-72 grid-cols-7 items-end gap-3 border-b border-l border-white/10 p-4">
          {[0, 0, 0, 0, 0, 0, 0].map((height, index) => (
            <div key={`empty-chart-${index}`} className="flex h-full flex-col justify-end gap-2">
              <div className="min-h-1 rounded-t-xl bg-gradient-to-t from-castDeepGold to-[#FFE18A] shadow-gold" style={{ height: `${height}%` }} />
              <span className="text-center text-xs text-castMuted">{11 + index} May</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-castMuted">Jami ijro vaqti: {Math.round(totalDuration / 60)} daqiqa. Filterlar: sana, filial, device, campaign, media.</p>
      </Card>
    </>
  );
}

function MonitoringContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const devices = store.devices.filter((device) => filterText(query, device.name, device.branch));
  return (
    <section className="grid gap-4 2xl:grid-cols-4 xl:grid-cols-3 md:grid-cols-2">
      {devices.map((device) => {
        const playlistItem = store.playlists.flatMap((playlist) => playlist.items).find((item) => item.id === device.currentMediaId);
        const current = store.media.find((media) => media.id === device.currentMediaId || media.id === playlistItem?.mediaId);
        const previewUrl = device.screenshotUrl;
        return (
        <Card key={device.id} className="p-3">
          <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
            <LivePreview device={device} media={current} source={previewUrl} waitingClassName="text-castMuted" />
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <b className="text-white">{device.name}</b>
              <p className="text-xs text-castMuted">{current?.name || device.playlist}</p>
            </div>
            <StatusBadge status={device.status} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => store.sendCommand(device.id, "TAKE_SCREENSHOT")}>Screenshot</Button>
            <Button onClick={() => store.sendCommand(device.id, "FORCE_SYNC")}>Sync</Button>
            <Button onClick={() => openDrawer(device.name, deviceRows(device))}>Detail</Button>
          </div>
        </Card>
        );
      })}
    </section>
  );
}

function ApkContent({ openDrawer }: { openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Table headers={["Versiya", "Fayl", "Status", "Qurilmalar", "Yuklangan", "Amallar"]}>
        {store.apkVersions.map((version) => (
          <tr key={version.id} className="hover:bg-white/[0.03]">
            <td className="px-4 py-3 font-bold text-white">{version.version}<span className="block text-xs text-castMuted">{version.changelog}</span></td>
            <td className="px-4 py-3 text-castMuted">{version.fileName}<span className="block text-xs">{version.size}</span></td>
            <td className="px-4 py-3"><Badge tone={version.status === "latest" ? "green" : version.status === "staged" ? "orange" : "gray"}>{version.status}</Badge></td>
            <td className="px-4 py-3 text-castMuted">{version.installedDevices} installed, {version.failedDevices} failed</td>
            <td className="px-4 py-3 text-castMuted">{version.uploadedAt}</td>
            <td className="px-4 py-3 flex gap-2"><Button onClick={() => store.rolloutApk(version.id)}>Rollout</Button><Button onClick={() => store.rollbackApk(version.id)}>Rollback</Button><Button variant="danger" onClick={() => store.deleteApkVersion(version.id)}>O'chirish</Button></td>
          </tr>
        ))}
      </Table>
      <VersionPanel versions={store.apkVersions} openDrawer={openDrawer} />
    </section>
  );
}

function VersionPanel({ versions, openDrawer }: { versions: ApkVersion[]; openDrawer: (title: string, rows: string[]) => void }) {
  return (
    <Card>
      <h3 className="text-lg font-black text-white">Rollout holati</h3>
      <div className="mt-4 grid gap-3">
        {versions.map((version) => (
          <button key={version.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-castGold/30" type="button" onClick={() => openDrawer(version.version, [version.changelog, version.fileName, `Installed: ${version.installedDevices}`, `Failed: ${version.failedDevices}`])}>
            <b className="text-white">{version.version}</b>
            <p className="text-sm text-castMuted">{version.installedDevices} ta qurilmada</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

function AlertsContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const items = store.alerts.filter((alert) => filterText(query, alert.title, alert.type, alert.status));
  return (
    <Table headers={["Ogohlantirish", "Device", "Muhimlik", "Status", "Vaqt", "Amallar"]}>
      {items.map((alert) => (
        <tr key={alert.id} className="hover:bg-white/[0.03]">
          <td className="px-4 py-3 font-bold text-white">{alert.title}<span className="block text-xs text-castMuted">{alert.type}</span></td>
          <td className="px-4 py-3 text-castMuted">{store.devices.find((device) => device.id === alert.deviceId)?.name}</td>
          <td className="px-4 py-3"><Badge tone={alert.severity === "high" ? "red" : alert.severity === "medium" ? "orange" : "gray"}>{alert.severity}</Badge></td>
          <td className="px-4 py-3"><Badge tone={alert.status === "resolved" ? "green" : "gold"}>{alert.status}</Badge></td>
          <td className="px-4 py-3 text-castMuted">{alert.createdAt}</td>
          <td className="px-4 py-3 flex gap-2"><Button onClick={() => store.resolveAlert(alert.id)}>Resolve</Button><Button onClick={() => store.ignoreAlert(alert.id)}>Ignore</Button><Button onClick={() => openDrawer(alert.title, alertRows(alert))}>Detail</Button><Button variant="danger" onClick={() => store.deleteAlert(alert.id)}>O'chirish</Button></td>
        </tr>
      ))}
    </Table>
  );
}

function WidgetsContent() {
  const store = useCastmapStore();
  return (
    <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
      {store.widgets.map((widget) => (
        <Card key={widget.id}>
          <div className="flex items-start justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-castGold/10 text-castGold"><Rocket className="h-5 w-5" /></div>
            <Badge tone={widget.status === "active" ? "green" : "gray"}>{widget.status}</Badge>
          </div>
          <h3 className="mt-4 text-lg font-black text-white">{widget.name}</h3>
          <p className="mt-2 text-sm text-castMuted">{widget.preview}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="gold" onClick={() => store.addWidgetToPlaylist(widget.id)}>Qo'shish</Button>
            <Button variant="danger" onClick={() => store.deleteWidget(widget.id)}>O'chirish</Button>
          </div>
        </Card>
      ))}
    </section>
  );
}

function UsersContent({ query, openDrawer }: { query: string; openDrawer: (title: string, rows: string[]) => void }) {
  const store = useCastmapStore();
  const items = store.users.filter((user) => filterText(query, user.name, user.email, user.role));
  return (
    <Table headers={["Foydalanuvchi", "Rol", "Filial huquqi", "Status", "Oxirgi kirish", "Amallar"]}>
      {items.map((user) => (
        <tr key={user.id} className="hover:bg-white/[0.03]">
          <td className="px-4 py-3 font-bold text-white">{user.name}<span className="block text-xs text-castMuted">{user.email}</span></td>
          <td className="px-4 py-3 text-castMuted">{user.role}</td>
          <td className="px-4 py-3 text-castMuted">{user.branchAccess.length} filial</td>
          <td className="px-4 py-3"><Badge tone={user.status === "active" ? "green" : "gray"}>{user.status}</Badge></td>
          <td className="px-4 py-3 text-castMuted">{user.lastLogin}</td>
          <td className="px-4 py-3 flex gap-2"><Button onClick={() => store.toggleUserStatus(user.id)}>Active/Inactive</Button><Button onClick={() => openDrawer(user.name, [`Email: ${user.email}`, `Rol: ${user.role}`, `Ruxsatlar: media, device, analytics`])}>Huquqlar</Button><Button variant="danger" onClick={() => store.deleteUser(user.id)}>O'chirish</Button></td>
        </tr>
      ))}
    </Table>
  );
}

function BillingContent() {
  const store = useCastmapStore();
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <section className="grid gap-4 md:grid-cols-2">
        {store.billingPlans.map((plan) => (
          <Card key={plan.id} className={plan.current ? "border-castGold/35 shadow-gold" : ""}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-black text-white">{plan.name}</h3>
              {plan.current ? <Badge tone="gold">Joriy tarif</Badge> : null}
            </div>
            <p className="mt-4 text-3xl font-black text-castGold">{plan.price}</p>
            <p className="mt-3 text-sm text-castMuted">{plan.deviceLimit} device, {plan.storageLimitGb} GB storage</p>
            <Button className="mt-5 w-full" variant={plan.current ? "ghost" : "gold"} onClick={() => store.updatePlan(plan.id)}>{plan.current ? "Joriy" : "Tanlash"}</Button>
          </Card>
        ))}
      </section>
      <Card>
        <h3 className="text-lg font-black text-white">Billing tarixi</h3>
        <div className="mt-4 grid gap-3">
          {store.invoices.map((invoice) => <div key={invoice.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><b className="text-white">{invoice.id}</b><p className="text-sm text-castMuted">{invoice.plan} - {invoice.amount} - {invoice.status}</p></div>)}
        </div>
      </Card>
    </section>
  );
}

function SettingsContent() {
  const store = useCastmapStore();
  const [company, setCompany] = useState("CASTMAP Retail Media");
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="grid gap-4">
        <h3 className="text-lg font-black text-white">Kompaniya profili</h3>
        <Input value={company} onChange={(event) => setCompany(event.target.value)} />
        <Select defaultValue="uz">
          <option value="uz">O'zbek tili</option>
          <option value="ru">Rus tili</option>
          <option value="en">English</option>
        </Select>
        <Button variant="gold" onClick={() => store.pushToast("Kompaniya sozlamalari saqlandi.")}>Saqlash</Button>
      </Card>
      <Card className="grid gap-4">
        <h3 className="text-lg font-black text-white">API va webhook</h3>
        <Input readOnly value="pk_live_castmap_mock_2026" />
        <Input placeholder="Webhook URL" />
        <Button onClick={() => store.pushToast("API key yangilandi.", "info")}>API key yangilash</Button>
      </Card>
      <Card className="xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white">Lokatsiyalarni boshqarish</h3>
            <p className="mt-1 text-sm text-castMuted">Test lokatsiyalarni ommaviy tozalash yoki alohida lokatsiyani o'chirish mumkin. Lokatsiya o'chirilsa, unga bog'langan test qurilmalar va jadval ham tozalanadi.</p>
          </div>
          <Button variant="danger" onClick={store.clearTestBranches}>Test lokatsiyalarni tozalash</Button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {store.branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div>
                <b className="text-white">{branch.name}</b>
                <p className="text-sm text-castMuted">{branch.city} - {branch.screenCount} ekran - {branch.workStart}-{branch.workEnd}</p>
              </div>
              <Button variant="danger" onClick={() => store.deleteBranch(branch.id)}>O'chirish</Button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white">Shablonlarni tozalash</h3>
            <p className="mt-1 text-sm text-castMuted">Global mock state ichidagi template turidagi media fayllarni olib tashlaydi.</p>
          </div>
          <Button variant="danger" onClick={store.clearTemplates}>Barcha shablonlarni o'chirish</Button>
        </div>
      </Card>
      <Card className="xl:col-span-2 border-red-400/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white">Barcha test ma'lumotlarni tozalash</h3>
            <p className="mt-1 text-sm text-castMuted">Lokatsiya, ekran, media, playlist, jadval, kampaniya, hisobot, APK va ogohlantirishlar to'liq tozalanadi.</p>
          </div>
          <Button variant="danger" onClick={store.clearOperationalData}>Hammasini tozalash</Button>
        </div>
      </Card>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "online") return <Badge tone="green">Onlayn</Badge>;
  if (status === "offline") return <Badge tone="red">Offline</Badge>;
  if (status === "error") return <Badge tone="orange">Xatolik</Badge>;
  if (status === "update") return <Badge tone="blue">Yangilanish kerak</Badge>;
  return <Badge>Nofaol</Badge>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><span className="text-xs text-castMuted">{label}</span><b className="mt-1 block text-white">{value}</b></div>;
}

function deviceRows(device: Device) {
  return [
    `Device ID: ${device.deviceId}`,
    `Filial: ${device.branch}`,
    `IP: ${device.ipAddress}`,
    `MAC: ${device.macAddress}`,
    `Type: ${device.type}`,
    `APK: ${device.apkVersion}`,
    `Storage: ${device.storage}%`,
    `RAM: ${device.ram}%`,
    `CPU: ${device.cpu}%`,
    `Internet: ${device.signal}%`,
    `Uptime: ${device.uptime}`,
    `Last heartbeat: ${device.lastHeartbeat}`,
  ];
}

function alertRows(alert: Alert) {
  return [`Type: ${alert.type}`, `Severity: ${alert.severity}`, `Status: ${alert.status}`, `Yaratilgan: ${alert.createdAt}`];
}

function MockModal({ title, open, onClose }: { title: string; open: boolean; onClose: () => void }) {
  const store = useCastmapStore();
  return (
    <Modal open={open} title={`${title} - mock forma`} onClose={onClose}>
      <div className="grid gap-4">
        <Input placeholder="Nomi" />
        <Input placeholder="Tavsif yoki ID" />
        <Select defaultValue="active">
          <option value="active">Faol</option>
          <option value="draft">Draft</option>
        </Select>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button variant="gold" onClick={() => { store.pushToast("Mock forma saqlandi."); onClose(); }}>Saqlash</Button>
        </div>
      </div>
    </Modal>
  );
}
