"use client";

import { AlertTriangle, EyeOff, Send } from "lucide-react";
import { Reveal, TiltCard } from "@/components/landing/Reveal";

const problems = [
  {
    icon: AlertTriangle,
    title: "Filiallardagi ekranlarni nazorat qilish qiyin",
    text: "Qaysi TV online, qaysi player ishlamay qolganini real vaqtda ko'rish uchun yagona panel yo'q.",
  },
  {
    icon: Send,
    title: "Kontentni USB yoki Telegram orqali yuborishga majbursiz",
    text: "Har bir filialga alohida fayl tashish vaqt oladi, versiyalar adashadi va reklama kechikadi.",
  },
  {
    icon: EyeOff,
    title: "Qaysi reklama ishlayotganini bilmaysiz",
    text: "Kampaniya, playlist va ko'rsatish statistikasi bo'lmasa, media savdo aniq isbotlanmaydi.",
  },
];

export function ProblemSection() {
  return (
    <section id="yechimlar" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Muammo</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Ekranlaringizni boshqarish hali ham qiyinmi?</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <Reveal delay={index * 0.08} key={problem.title}>
                <TiltCard className="h-full rounded-lg border border-white/[0.08] bg-[#111111]/90 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur">
                  <div className="grid h-12 w-12 place-items-center rounded-lg border border-red-300/20 bg-red-400/10 text-red-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-black leading-7 text-white">{problem.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#A1A1AA]">{problem.text}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
