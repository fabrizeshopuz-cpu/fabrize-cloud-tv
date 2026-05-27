import { ArrowRight, CheckCircle2, MonitorPlay, PlayCircle, ShieldCheck } from "lucide-react";
import { platformModules } from "@/lib/castmap-v2";

const plans = [
  ["Start", "10 ekran", "Media kutubxona, playlist va oddiy scheduling"],
  ["Business", "50 ekran", "Filiallar, campaign, monitoring va APK update"],
  ["Enterprise", "500+ ekran", "White-label, SLA, API va dedicated support"],
];

export default function CastmapUzPage() {
  return (
    <main className="bg-[#080808] text-castText">
      <section
        className="relative min-h-[86vh] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,.88), rgba(0,0,0,.56), rgba(0,0,0,.36)), url('/castmap-logo.png')" }}
      >
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a className="text-xl font-black tracking-wide text-white" href="/uz">CASTMAP</a>
          <nav className="hidden items-center gap-6 text-sm font-bold text-castMuted md:flex">
            <a href="#platform">Platforma</a>
            <a href="#cabinet">Cabinet</a>
            <a href="#tariffs">Tariflar</a>
            <a href="/browse">Kirish</a>
          </nav>
          <a className="rounded-lg bg-castGold px-4 py-2 text-sm font-black text-black" href="/browse">Demo cabinet</a>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-24">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-castGold">Digital signage platform</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.02] text-white md:text-7xl">CASTMAP</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
              Reklama ekranlari, playlist, filial, APK player va billingni bitta tizimdan boshqaradigan retail media infratuzilma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-castGold px-5 font-black text-black" href="/browse">
                Cabinetni ochish <ArrowRight className="h-4 w-4" />
              </a>
              <a className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 font-black text-white" href="/super-admin">
                Super admin <ShieldCheck className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/55">
          <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 text-sm text-castMuted md:grid-cols-3">
            <span>TV APK pairing va auto-sync</span>
            <span>Client cabinet media + playlist</span>
            <span>Global tenant va billing control</span>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto grid max-w-7xl gap-5 px-5 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-castGold">Platform sxemasi</p>
          <h2 className="mt-3 text-3xl font-black text-white">Sayt, cabinet, super-admin va APK bitta kontraktda ishlaydi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platformModules.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-white/10 bg-[#111] p-5">
                <Icon className="h-6 w-6 text-castGold" />
                <h3 className="mt-5 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-castMuted">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="cabinet" className="border-y border-white/10 bg-[#0E0E0E]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-castGold">Client workflow</p>
            <h2 className="mt-3 text-3xl font-black text-white">Mijoz o'zi media yuklaydi, playlist tuzadi va TV'ga chiqaradi</h2>
            <div className="mt-8 grid gap-3">
              {["Media upload va approval", "Playlist builder va filial targeting", "TV pairing code va live status", "Playback report va storage limit"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/35 p-3">
                  <CheckCircle2 className="h-5 w-5 text-castGold" />
                  <span className="font-bold text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-start gap-3 rounded-lg border border-castGold/25 bg-castGold/10 p-5">
            <MonitorPlay className="h-9 w-9 text-castGold" />
            <b className="text-2xl text-white">APK player</b>
            <p className="text-sm leading-6 text-castMuted">Pairingdan keyin player `/api/v2/player/playlist` orqali kontent oladi, offline cache saqlaydi va playback telemetry yuboradi.</p>
            <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-castGold px-4 font-black text-black" href="/downloads/castmap-player-1.0.9.apk">
              APK yuklash <PlayCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="tariffs" className="mx-auto grid max-w-7xl gap-5 px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-castGold">Tariflar</p>
            <h2 className="mt-3 text-3xl font-black text-white">Ekran soniga qarab masshtablanadi</h2>
          </div>
          <a className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white" href="/browse?tab=billing">Billing cabinet</a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map(([name, limit, text]) => (
            <article key={name} className="rounded-lg border border-white/10 bg-[#111] p-5">
              <b className="text-xl text-white">{name}</b>
              <p className="mt-3 text-3xl font-black text-castGold">{limit}</p>
              <p className="mt-4 text-sm leading-6 text-castMuted">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
