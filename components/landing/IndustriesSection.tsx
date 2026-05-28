"use client";

import { Building2, Dumbbell, Hotel, Pill, ShoppingBag, Utensils } from "lucide-react";
import { Reveal, TiltCard } from "@/components/landing/Reveal";

const industries = [
  { icon: ShoppingBag, title: "Supermarketlar", text: "Aksiya, narx taklifi va brend kampaniyalarini filiallar bo'yicha yuriting." },
  { icon: Utensils, title: "Restoranlar", text: "Menu board, combo taklif va vaqtli promolarni avtomatik jadvalga qo'ying." },
  { icon: Pill, title: "Dorixonalar", text: "Mahsulot reklamalari, tavsiya va navbat zonasidagi media kontentni boshqaring." },
  { icon: Dumbbell, title: "Fitness klublar", text: "Abonement, trener va ichki e'lonlarni zal ekranlariga chiqaring." },
  { icon: Hotel, title: "Mehmonxonalar", text: "Lobby, konferensiya va lift ekranlari uchun brendlangan kontent ishlating." },
  { icon: Building2, title: "Savdo markazlari", text: "Tenant reklamalari, navigatsiya va indoor media paketlarni nazorat qiling." },
];

export function IndustriesSection() {
  return (
    <section id="hamkorlik" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Sohalar</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">CASTMAP kimlar uchun?</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Reveal delay={index * 0.05} key={industry.title}>
                <TiltCard className="rounded-lg border border-white/[0.08] bg-[#111111]/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-black text-white">{industry.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#A1A1AA]">{industry.text}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
