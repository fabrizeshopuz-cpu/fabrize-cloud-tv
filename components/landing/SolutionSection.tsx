"use client";

import { CalendarClock, Cloud, FolderKanban, Images, MonitorCheck, PackageCheck, PlaySquare, ShieldCheck } from "lucide-react";
import { Reveal, TiltCard } from "@/components/landing/Reveal";

const features = [
  { icon: Cloud, title: "Cloud Management", text: "Ekranlar, filiallar va kontentni bitta cloud kabinetdan boshqaring." },
  { icon: Images, title: "Media Library", text: "Video, rasm va web kontentlarni papka, tag va status bilan tartiblang." },
  { icon: PlaySquare, title: "Playlist Builder", text: "Kontent ketma-ketligi, davomiylik va target ekranlarni tez sozlang." },
  { icon: CalendarClock, title: "Smart Scheduling", text: "Kampaniyani sana, vaqt, filial yoki ekran guruhiga rejalashtiring." },
  { icon: MonitorCheck, title: "Live Monitoring", text: "TV online holati, heartbeat va ko'rsatilayotgan kontentni kuzating." },
  { icon: FolderKanban, title: "Offline Playback", text: "Internet uzilganda player oldindan yuklangan playlistni davom ettiradi." },
  { icon: ShieldCheck, title: "Screenshot Proof", text: "Admin paneldan so'rov berib, TV ekranidan real screenshot oling." },
  { icon: PackageCheck, title: "APK Auto Update", text: "Yangi player versiyasini paneldan chiqarib, TVlarga update yuboring." },
];

export function SolutionSection() {
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Yechim</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">CASTMAP hammasini avtomatlashtiradi</h2>
          <p className="mt-4 text-base leading-8 text-[#A1A1AA]">Kontent yuklashdan tortib ekran holatini isbotlashgacha bo'lgan jarayonlar bitta professional platformaga jamlanadi.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal delay={index * 0.04} key={feature.title}>
                <TiltCard className="group h-full rounded-lg border border-white/[0.08] bg-[#111111]/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur transition hover:border-[#D4AF37]/40 hover:shadow-[0_0_44px_rgba(212,175,55,0.14)]">
                  <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{feature.text}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
