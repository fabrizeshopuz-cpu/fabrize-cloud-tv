"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, MonitorPlay, Rocket } from "lucide-react";
import { useCastmapStore } from "@/lib/store";
import { UZBEK_REGIONS } from "@/lib/constants";

const initialForm = {
  branchName: "Test lokatsiya",
  city: "Toshkent",
  screenName: "Test TV 01",
  campaignName: "Test kampaniya",
  pairingCode: "482-913",
  workStart: "09:00",
  workEnd: "22:00",
};

export function TestSetupWizard() {
  const store = useCastmapStore();
  const [form, setForm] = useState(initialForm);

  const update = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const create = () => {
    store.createTestChain(form);
  };

  const latestBranch = store.branches[0];
  const latestDevice = store.devices[0];
  const latestPlaylist = store.playlists[0];
  const latestCampaign = store.campaigns[0];

  return (
    <section className="mt-4 rounded-2xl border border-castGold/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.03))] p-5 shadow-gold">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-castGold">TEST SETUP</p>
          <h2 className="mt-1 text-xl font-black text-white">Yangi lokatsiya, ekran, APK kodi va kampaniya yaratish</h2>
          <p className="mt-1 text-sm text-castMuted">APK player ekranida chiqqan kodni kiriting. Qurilma shu kod orqali adashmasdan lokatsiyaga bog'lanadi.</p>
        </div>
        <button
          className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFE18A] to-castDeepGold px-5 font-black text-black"
          type="button"
          onClick={create}
        >
          <Rocket className="h-4 w-4" />
          Test zanjir yaratish
        </button>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-6 md:grid-cols-3">
        <Field label="Lokatsiya" value={form.branchName} onChange={(value) => update("branchName", value)} />
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-castMuted">
          Viloyat
          <select
            className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition hover:border-castGold/30 focus:border-castGold/60"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
          >
            {UZBEK_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
        <Field label="Ekran nomi" value={form.screenName} onChange={(value) => update("screenName", value)} />
        <Field label="Kampaniya" value={form.campaignName} onChange={(value) => update("campaignName", value)} />
        <Field label="APK kodi" value={form.pairingCode} onChange={(value) => update("pairingCode", value.toUpperCase())} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Boshlash" value={form.workStart} type="time" onChange={(value) => update("workStart", value)} />
          <Field label="Tugatish" value={form.workEnd} type="time" onChange={(value) => update("workEnd", value)} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-4 md:grid-cols-2">
        <SummaryCard icon={<MonitorPlay className="h-5 w-5" />} title="Lokatsiya va ekran" text={latestBranch ? `${latestBranch.name} - ${latestDevice?.name || "Ekran yo'q"}` : "Hali yaratilmagan"} />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} title="Playlist" text={latestPlaylist ? `${latestPlaylist.name} - ${latestPlaylist.items.length} media` : "Hali yaratilmagan"} />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} title="Kampaniya" text={latestCampaign ? `${latestCampaign.name} - ${latestCampaign.status}` : "Hali yaratilmagan"} />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} title="APK ulanishi" text={latestDevice ? `${latestDevice.deviceId} - ${latestDevice.apkVersion}` : "Kod kiritilmagan"} />
      </div>
    </section>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-castMuted">
      {label}
      <input
        className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition hover:border-castGold/30 focus:border-castGold/60"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SummaryCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center gap-2 text-castGold">{icon}<span className="text-sm font-black text-white">{title}</span></div>
      <p className="mt-2 text-sm text-castMuted">{text}</p>
    </article>
  );
}
