"use client";

import { Cable, Clapperboard, MonitorDown } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const steps = [
  { icon: MonitorDown, title: "TV yoki TV Box'ga CASTMAP Player o'rnating", text: "Android TV, box yoki signage playerga CASTMAP APK ni o'rnatasiz." },
  { icon: Cable, title: "Pairing code orqali ulab qo'ying", text: "Kabinetdagi filial va ekran guruhiga playerni bir necha soniyada bog'laysiz." },
  { icon: Clapperboard, title: "Kontent yuklang va reklama boshlang", text: "Video, rasm yoki web kontentdan playlist tuzib, jadvalga chiqarasiz." },
];

export function HowItWorks() {
  return (
    <section id="start" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Start</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">3 qadamda ishga tushiring</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal delay={index * 0.08} key={step.title}>
                <div className="relative h-full rounded-lg border border-white/[0.08] bg-[#111111]/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-5xl font-black text-white/10">0{index + 1}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-black leading-7 text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#A1A1AA]">{step.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
