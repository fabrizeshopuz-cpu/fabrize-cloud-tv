import { ChevronRight, Command, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import type { V2NavItem } from "@/lib/castmap-v2";

export function V2AppShell({
  title,
  subtitle,
  active,
  nav,
  children,
}: {
  title: string;
  subtitle: string;
  active: string;
  nav: V2NavItem[];
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#080808] text-castText">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-black/80 p-5 xl:block">
        <a className="flex items-center gap-3" href="/uz">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-castGold/30 bg-castGold/10 text-castGold">
            <Command className="h-5 w-5" />
          </span>
          <span>
            <b className="block text-lg text-white">CASTMAP</b>
            <small className="text-castMuted">Retail media OS</small>
          </span>
        </a>
        <nav className="mt-8 grid gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const selected = item.label === active;
            return (
              <a
                key={item.label}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${selected ? "border border-castGold/35 bg-castGold/10 text-castGold" : "text-castMuted hover:bg-white/[0.05] hover:text-white"}`}
                href={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 xl:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/10 bg-[#080808]/92 px-5 backdrop-blur md:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-castGold">
              CASTMAP <ChevronRight className="h-3 w-3" /> {active}
            </div>
            <h1 className="mt-1 truncate text-xl font-black text-white md:text-2xl">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm text-castMuted md:block">{subtitle}</span>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-castMuted" type="button">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="grid gap-5 p-5 md:p-8">{children}</div>
      </section>
    </main>
  );
}

export function V2MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "gold" | "green" | "blue" | "red" }) {
  const toneClass = {
    gold: "text-castGold border-castGold/25 bg-castGold/10",
    green: "text-emerald-300 border-emerald-400/25 bg-emerald-400/10",
    blue: "text-sky-300 border-sky-400/25 bg-sky-400/10",
    red: "text-red-300 border-red-400/25 bg-red-400/10",
  }[tone];
  return (
    <article className="rounded-lg border border-white/10 bg-[#111] p-4">
      <span className="text-sm text-castMuted">{label}</span>
      <strong className="mt-2 block text-3xl text-white">{value}</strong>
      <span className={`mt-4 inline-flex rounded-md border px-2 py-1 text-xs font-bold ${toneClass}`}>{detail}</span>
    </article>
  );
}

export function V2Status({ value }: { value: string }) {
  const ok = ["online", "published", "ready", "latest"].includes(value.toLowerCase());
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-black uppercase ${ok ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-castGold/25 bg-castGold/10 text-castGold"}`}>
      {value}
    </span>
  );
}
