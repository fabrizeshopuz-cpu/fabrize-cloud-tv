"use client";

import { ArrowRight, MessageCircle, Power, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/landing/Reveal";

export function FinalCTA({ onDemo }: { onDemo: () => void }) {
  return (
    <section id="aloqa" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-lg border border-[#D4AF37]/20 bg-[#111111]/90 p-6 shadow-[0_0_80px_rgba(212,175,55,0.18)] backdrop-blur sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-12">
        <Reveal>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Demo</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">Ekranlaringizni professional darajaga olib chiqing</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#A1A1AA]">
            CASTMAP sizga reklama ekranlarini sotuvga yo'naltirilgan, nazorat qilinadigan va isbotlanadigan media tarmoqqa aylantirishga yordam beradi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 rounded-lg px-6" type="button" variant="gold" onClick={onDemo}>
              Demo so'rash
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button className="h-12 rounded-lg px-6" type="button" variant="ghost" onClick={onDemo}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Bog'lanish
            </Button>
          </div>
        </Reveal>

        <Reveal className="relative min-h-[360px] [perspective:1200px]">
          <div className="absolute inset-x-12 bottom-4 h-20 rounded-full bg-[#D4AF37]/25 blur-3xl" />
          <motion.div
            className="absolute left-1/2 top-12 w-[min(420px,82vw)] -translate-x-1/2 rounded-[24px] border border-white/[0.10] bg-[#080808] p-7 shadow-[0_45px_100px_rgba(0,0,0,0.55),0_0_70px_rgba(212,175,55,0.18)] lg:[transform:perspective(1200px)_rotateX(14deg)_rotateY(-12deg)]"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="grid h-16 w-16 place-items-center rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-xl font-black text-[#D4AF37]">CM</div>
                <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-[#D4AF37]">CASTMAP BOX</p>
              </div>
              <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            </div>
            <div className="mt-10 grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <span className="h-1.5 rounded-full bg-white/10" key={index} />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="absolute bottom-10 right-4 w-24 rounded-[28px] border border-white/[0.10] bg-[#070707] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:right-20"
            animate={{ y: [0, 8, 0], rotate: [8, 5, 8] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="grid gap-3">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#D4AF37] text-black">
                <Power className="h-4 w-4" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span className="h-6 rounded-md bg-white/[0.08]" key={index} />
                ))}
              </div>
              <div className="grid h-8 place-items-center rounded-md bg-white/[0.08] text-[#D4AF37]">
                <Volume2 className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
