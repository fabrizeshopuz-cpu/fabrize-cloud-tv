import { superAdminNav, tenantRows, v2Devices, v2Metrics } from "@/lib/castmap-v2";
import { V2AppShell, V2MetricCard, V2Status } from "@/components/v2/V2Shell";

const auditRows = [
  ["2026-05-27 19:56", "Fabrize", "Playlist order updated", "media-start-video-20260527 first"],
  ["2026-05-28 15:30", "System", "APK release", "castmap-player-1.2.1.apk latest"],
  ["2026-05-22 14:40", "Player", "Playback contract", "Range streaming verified"],
];

export default function SuperAdminPage() {
  return (
    <V2AppShell title="Glavniy admin" subtitle="Platform owner console" active="Tenants" nav={superAdminNav}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {v2Metrics.map((metric) => <V2MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-white/10 bg-[#111]">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="text-xl font-black text-white">Tenants</h2>
              <p className="mt-1 text-sm text-castMuted">Mijozlar, tariflar, ekran limitlari va platform holati</p>
            </div>
            <button className="rounded-lg bg-castGold px-4 py-2 text-sm font-black text-black" type="button">Tenant yaratish</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-castMuted">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Screens</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Storage</th>
                </tr>
              </thead>
              <tbody>
                {tenantRows.map(([tenant, screens, plan, status, storage]) => (
                  <tr key={tenant} className="border-t border-white/10">
                    <td className="px-4 py-4 font-bold text-white">{tenant}</td>
                    <td className="px-4 py-4 text-castMuted">{screens}</td>
                    <td className="px-4 py-4 text-castMuted">{plan}</td>
                    <td className="px-4 py-4"><V2Status value={status} /></td>
                    <td className="px-4 py-4 text-castMuted">{storage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-white/10 bg-[#111] p-4">
            <h2 className="text-lg font-black text-white">Player fleet</h2>
            <div className="mt-4 grid gap-3">
              {v2Devices.map((device) => (
                <article key={device.id} className="rounded-lg border border-white/10 bg-black/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-white">{device.name}</b>
                    <V2Status value={device.status} />
                  </div>
                  <p className="mt-2 text-sm text-castMuted">{device.branch} / {device.code}</p>
                  <p className="mt-1 text-sm text-castMuted">APK latest target: v1.2.1</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#111] p-4">
            <h2 className="text-lg font-black text-white">Audit log</h2>
            <div className="mt-4 grid gap-3">
              {auditRows.map(([time, actor, action, detail]) => (
                <article key={`${time}-${action}`} className="rounded-lg border border-white/10 bg-black/35 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <b className="text-white">{action}</b>
                    <span className="text-castMuted">{time}</span>
                  </div>
                  <p className="mt-2 text-sm text-castMuted">{actor}: {detail}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </V2AppShell>
  );
}
