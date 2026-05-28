"use client";

import { ArrowRight, CheckCircle2, Play, RadioTower, Tv } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const badges = ["Android TV", "Samsung Tizen", "LG WebOS", "CASTMAP BOX", "Offline playback", "Real-time monitoring"];

export function Hero({ onDemo }: { onDemo: () => void }) {
  return (
    <section id="mahsulot" className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
      <DigitalParticles />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative z-10">
          <motion.div
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <RadioTower className="h-4 w-4" />
            Retail media OS
          </motion.div>

          <motion.h1
            className="mt-7 max-w-4xl text-4xl font-black leading-[1.04] text-white sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.08 }}
          >
            Barcha ekranlaringizni bitta platformadan boshqaring
          </motion.h1>
          <motion.p
            className="mt-6 max-w-2xl text-base leading-8 text-[#A1A1AA] sm:text-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.16 }}
          >
            CASTMAP - supermarket, restoran, retail va indoor reklama ekranlarini cloud orqali boshqaruvchi zamonaviy retail media platformasi.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.24 }}
          >
            <Button className="h-12 rounded-lg px-6" type="button" variant="gold" onClick={onDemo}>
              <Play className="mr-2 h-4 w-4" />
              Demo ko'rish
            </Button>
            <Button className="h-12 rounded-lg px-6" type="button" variant="ghost" onClick={onDemo}>
              Bepul boshlash
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 grid gap-3 text-sm font-bold text-[#D8D8D8] sm:grid-cols-2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.32 }}
          >
            {["Kontent, jadval va monitoring bir joyda", "TV Player, APK update va screenshot proof tayyor"].map((item) => (
              <span className="flex items-center gap-2" key={item}>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="relative z-10 mx-auto w-full max-w-2xl [perspective:1200px]"
          initial={{ opacity: 0, y: 34, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.86, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <DashboardMockup />
        </motion.div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {badges.map((badge, index) => (
            <motion.div
              className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-4 py-4 text-center text-sm font-black text-[#F5F5F5] backdrop-blur"
              key={badge}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.45 }}
            >
              {badge}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  const bars = [74, 48, 88, 62, 92, 54, 78];

  return (
    <div className="relative">
      <div className="absolute -inset-5 rounded-[28px] bg-[#D4AF37]/20 blur-3xl" />
      <motion.div
        className="relative overflow-hidden rounded-lg border border-white/[0.10] bg-[#111111]/90 p-4 shadow-[0_0_80px_rgba(212,175,55,0.25)] backdrop-blur lg:[transform:perspective(1200px)_rotateX(5deg)_rotateY(-10deg)]"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">Live dashboard</p>
            <h2 className="mt-2 text-xl font-black text-white">CASTMAP Command</h2>
          </div>
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric title="Jami ekranlar" value="1,248" tone="gold" />
          <Metric title="Online ekranlar" value="1,216" tone="green" />
          <Metric title="Offline ekranlar" value="32" tone="red" />
          <Metric title="Joriy kampaniyalar" value="24" tone="blue" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-white/[0.08] bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white">Ko'rsatishlar grafigi</span>
              <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-black text-[#D4AF37]">+18%</span>
            </div>
            <div className="mt-6 flex h-44 items-end gap-3">
              {bars.map((height, index) => (
                <div className="flex flex-1 flex-col items-center gap-2" key={height}>
                  <motion.div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#B8860B] to-[#FFE18A] shadow-[0_0_24px_rgba(212,175,55,0.20)]"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: index * 0.05 }}
                  />
                  <span className="text-[10px] font-bold text-[#A1A1AA]">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-white/[0.08] bg-black/40 p-4">
              <span className="text-sm font-black text-white">Device status</span>
              <div className="mx-auto mt-5 grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#34d399_0_82%,#ef4444_82%_86%,#D4AF37_86%_100%)] p-3">
                <div className="grid h-full w-full place-items-center rounded-full bg-[#111111] text-center">
                  <span className="text-2xl font-black text-white">98.7%</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-black/40 p-4">
              <span className="text-sm font-black text-white">Activity</span>
              <div className="mt-3 grid gap-3">
                {["Promo playlist synced", "APK update scheduled", "Screenshot proof received"].map((item) => (
                  <div className="flex items-center gap-3 text-xs font-bold text-[#A1A1AA]" key={item}>
                    <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="absolute -left-3 top-28 hidden rounded-lg border border-[#D4AF37]/25 bg-[#111111]/90 px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur sm:block lg:[transform:translateZ(48px)]">
        <p className="text-xs font-bold text-[#A1A1AA]">Offline playback</p>
        <p className="mt-1 text-lg font-black text-white">12 soat cache</p>
      </div>
      <div className="absolute -right-2 bottom-16 hidden rounded-lg border border-emerald-300/25 bg-[#111111]/90 px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur sm:block">
        <p className="text-xs font-bold text-[#A1A1AA]">Online</p>
        <p className="mt-1 flex items-center gap-2 text-lg font-black text-white">
          <Tv className="h-4 w-4 text-emerald-300" />
          1,216 TV
        </p>
      </div>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: "gold" | "green" | "red" | "blue" }) {
  const tones = {
    gold: "text-[#D4AF37] bg-[#D4AF37]/10",
    green: "text-emerald-300 bg-emerald-400/10",
    red: "text-red-300 bg-red-400/10",
    blue: "text-sky-300 bg-sky-400/10",
  };

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/40 p-3">
      <p className="text-[11px] font-bold text-[#A1A1AA]">{title}</p>
      <p className={`mt-3 rounded-md px-2 py-2 text-xl font-black ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function DigitalParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          className="absolute h-1 w-1 rounded-full bg-[#D4AF37]/40 shadow-[0_0_18px_rgba(212,175,55,0.52)]"
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${18 + ((index * 23) % 64)}%`,
            opacity: 0.18 + ((index % 5) * 0.08),
          }}
        />
      ))}
      <div className="absolute right-0 top-28 h-64 w-[48rem] -rotate-12 bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.10),transparent)] blur-xl" />
    </div>
  );
}
