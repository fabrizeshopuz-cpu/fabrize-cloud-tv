"use client";

import { useState } from "react";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const navItems = ["Mahsulot", "Yechimlar", "Narxlar", "Integratsiyalar", "Hamkorlik", "Aloqa"];

export function Navbar({ onDemo }: { onDemo: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a className="flex items-center gap-3" href="#" aria-label="CASTMAP bosh sahifa">
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-sm font-black text-[#D4AF37] shadow-[0_0_34px_rgba(212,175,55,0.22)]">
            CM
          </span>
          <span>
            <span className="block text-lg font-black tracking-[0.16em] text-white">CASTMAP</span>
            <span className="block text-xs font-bold text-[#A1A1AA]">Retail media cloud</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-bold text-[#A1A1AA] lg:flex" aria-label="Asosiy menyu">
          {navItems.map((item) => (
            <a className="transition hover:text-[#D4AF37]" href={`#${slug(item)}`} key={item}>
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button className="gap-2 rounded-lg px-4" type="button" variant="ghost" onClick={() => (window.location.href = "/browse")}>
            <LogIn className="h-4 w-4" />
            Kirish
          </Button>
          <Button className="gap-2 rounded-lg px-5" type="button" variant="gold" onClick={onDemo}>
            Demo so'rash
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <button
          className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white lg:hidden"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menyuni ochish"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/[0.08] bg-[#0A0A0A]/95 px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.48)] lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2 text-sm font-bold text-[#A1A1AA]" aria-label="Mobil menyu">
            {navItems.map((item) => (
              <a className="rounded-lg px-3 py-3 transition hover:bg-white/[0.04] hover:text-[#D4AF37]" href={`#${slug(item)}`} key={item} onClick={() => setOpen(false)}>
                {item}
              </a>
            ))}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button className="rounded-lg" type="button" variant="ghost" onClick={() => (window.location.href = "/browse")}>
                Kirish
              </Button>
              <Button
                className="rounded-lg"
                type="button"
                variant="gold"
                onClick={() => {
                  setOpen(false);
                  onDemo();
                }}
              >
                Demo so'rash
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-");
}
