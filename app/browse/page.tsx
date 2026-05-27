import { clientNav, v2Devices, v2Media, v2Metrics, v2Playlists } from "@/lib/castmap-v2";
import { V2AppShell, V2MetricCard, V2Status } from "@/components/v2/V2Shell";

export default function BrowsePage() {
  return (
    <V2AppShell title="Client cabinet" subtitle="Fabrize workspace" active="Overview" nav={clientNav}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {v2Metrics.map((metric) => <V2MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border border-white/10 bg-[#111]">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="text-xl font-black text-white">Media library</h2>
              <p className="mt-1 text-sm text-castMuted">Mijoz yuklagan kontent va approval holati</p>
            </div>
            <button className="rounded-lg bg-castGold px-4 py-2 text-sm font-black text-black" type="button">Upload</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-castMuted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {v2Media.map((asset) => (
                  <tr key={asset.id} className="border-t border-white/10">
                    <td className="max-w-[320px] truncate px-4 py-4 font-bold text-white">{asset.title}</td>
                    <td className="px-4 py-4 text-castMuted">{asset.type}</td>
                    <td className="px-4 py-4 text-castMuted">{asset.duration}</td>
                    <td className="px-4 py-4 text-castMuted">{asset.playlistCount} playlist</td>
                    <td className="px-4 py-4"><V2Status value={asset.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-white/10 bg-[#111] p-4">
            <h2 className="text-lg font-black text-white">Published playlist</h2>
            <div className="mt-4 grid gap-3">
              {v2Playlists.map((playlist) => (
                <article key={playlist.id} className="rounded-lg border border-white/10 bg-black/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-white">{playlist.title}</b>
                    <V2Status value={playlist.status} />
                  </div>
                  <p className="mt-2 text-sm text-castMuted">{playlist.branch} / {playlist.updatedAt}</p>
                  <ol className="mt-3 grid gap-2 text-sm text-white">
                    {playlist.items.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}
                  </ol>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#111] p-4">
            <h2 className="text-lg font-black text-white">TV devices</h2>
            <div className="mt-4 grid gap-3">
              {v2Devices.map((device) => (
                <article key={device.id} className="rounded-lg border border-white/10 bg-black/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-white">{device.name}</b>
                    <V2Status value={device.status} />
                  </div>
                  <p className="mt-2 text-sm text-castMuted">{device.code}</p>
                  <p className="mt-1 text-sm text-castMuted">Now: {device.current}</p>
                  <p className="mt-1 text-sm text-castMuted">APK: {device.apk}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </V2AppShell>
  );
}
