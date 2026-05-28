"use client";

import { BarChart3, CheckCircle2, Eye, MapPinned, MonitorPlay, PieChart, ScanSearch } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/landing/Reveal";

const checks = ["Device online/offline holati", "Screenshot preview", "Analytics va statistika", "Filiallar va guruhlar", "Kampaniya statistikasi"];

const screens = [
  { title: "Yunusobod Market", status: "Online", color: "bg-emerald-400", content: "Summer Sale 25%" },
  { title: "Food Court 02", status: "Online", color: "bg-emerald-400", content: "Lunch Combo" },
  { title: "Pharmacy A1", status: "Sync", color: "bg-[#D4AF37]", content: "Vitamin promo" },
  { title: "Hotel Lobby", status: "Online", color: "bg-emerald-400", content: "Welcome screen" },
];

export function DashboardSection() {
  return (
    <section id="integratsiyalar" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
        <Reveal>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Live nazorat</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Real-time nazorat paneli</h2>
          <p className="mt-5 text-base leading-8 text-[#A1A1AA]">
            Filiallaringizdagi har bir ekran holati, ko'rsatilayotgan playlist va reklama isboti boshqaruv panelida yangilanib turadi.
          </p>
          <div className="mt-8 grid gap-4">
            {checks.map((check) => (
              <div className="flex items-center gap-3 text-sm font-bold text-[#F5F5F5]" key={check}>
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                {check}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="relative [perspective:1200px]">
          <div className="absolute -inset-4 rounded-[28px] bg-[#D4AF37]/10 blur-3xl" />
          <motion.div
            className="relative rounded-lg border border-white/[0.10] bg-[#111111]/90 p-4 shadow-[0_0_80px_rgba(212,175,55,0.20)] backdrop-blur lg:[transform:perspective(1200px)_rotateX(4deg)_rotateY(8deg)]"
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">Monitoring grid</p>
                <h3 className="mt-2 text-xl font-black text-white">Live ekranlar</h3>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200">
                <MonitorPlay className="h-4 w-4" />
                4 online
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {screens.map((screen) => (
                <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-black/40" key={screen.title}>
                  <div className="relative aspect-video bg-[#070707] p-4">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.20),transparent_42%),linear-gradient(315deg,rgba(52,211,153,0.12),transparent_40%)]" />
                    <div className="relative flex h-full flex-col justify-between rounded-md border border-white/10 bg-black/40 p-4">
                      <div className="flex items-center justify-between text-[11px] font-black text-white">
                        <span>CASTMAP PLAYER</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${screen.color}`} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-white">{screen.content}</p>
                        <p className="mt-1 text-xs font-bold text-[#D4AF37]">Screenshot proof tayyor</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 p-3 text-xs font-bold text-[#A1A1AA]">
                    <div className="flex items-center justify-between">
                      <span>{screen.title}</span>
                      <span className="text-emerald-300">{screen.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MiniStat icon={Eye} label="Preview" value="32" />
              <MiniStat icon={BarChart3} label="Impressions" value="2.4M" />
              <MiniStat icon={MapPinned} label="Filiallar" value="186" />
              <MiniStat icon={PieChart} label="Campaigns" value="24" />
            </div>
          </motion.div>
          <div className="absolute -bottom-5 -left-3 hidden rounded-lg border border-[#D4AF37]/25 bg-[#111111]/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur md:block">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <ScanSearch className="h-4 w-4 text-[#D4AF37]" />
              Screenshot received
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/40 p-3">
      <Icon className="h-4 w-4 text-[#D4AF37]" />
      <p className="mt-3 text-[11px] font-bold text-[#A1A1AA]">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
