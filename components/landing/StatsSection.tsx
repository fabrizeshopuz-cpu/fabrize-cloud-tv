"use client";

import { Headphones, MonitorUp, Signal, TrendingUp, Zap } from "lucide-react";
import { Reveal, TiltCard } from "@/components/landing/Reveal";

const stats = [
  { icon: TrendingUp, value: "2.4M+", label: "Jami ko'rsatishlar" },
  { icon: Signal, value: "98.7%", label: "Uptime" },
  { icon: MonitorUp, value: "1248+", label: "Faol ekranlar" },
  { icon: Zap, value: "24+", label: "Faol kampaniyalar" },
  { icon: Headphones, value: "24/7", label: "Qo'llab-quvvatlash" },
];

export function StatsSection() {
  return (
    <section id="narxlar" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Reveal delay={index * 0.05} key={stat.label}>
              <TiltCard className="rounded-lg border border-white/[0.08] bg-[#111111]/80 p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-3xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-sm font-bold text-[#A1A1AA]">{stat.label}</p>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
