import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ForceDarkTheme } from "@/components/landing/ForceDarkTheme";

export const metadata: Metadata = {
  title: "CASTMAP Promo Video | Premium cinematic retail media presentation",
  description: "CASTMAP uchun 45 soniyalik premium cinematic SaaS promo video.",
};

export default function PromoVideoPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-8 text-white sm:px-6 lg:px-8">
      <ForceDarkTheme />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.18),transparent_54%),linear-gradient(180deg,rgba(17,24,39,0),#0F172A)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-[#D4AF37] transition hover:text-white" href="/">
            <ArrowLeft className="h-4 w-4" />
            Landingga qaytish
          </Link>
          <a href="/videos/castmap-promo.mp4" download>
            <Button className="rounded-lg" variant="gold" type="button">
              <Download className="h-4 w-4" />
              MP4 yuklab olish
            </Button>
          </a>
        </div>

        <section className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#111827]/80 shadow-[0_0_90px_rgba(212,175,55,0.16)] backdrop-blur">
          <div className="border-b border-white/[0.08] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Premium cinematic promo</p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">CASTMAP Promo Video</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#A1A1AA] sm:text-base">
              45 soniyalik dark navy + gold uslubidagi retail media infrastructure presentation.
            </p>
          </div>

          <div className="relative bg-black">
            <video className="aspect-video w-full" controls poster="/videos/castmap-promo-poster.png" preload="metadata">
              <source src="/videos/castmap-promo.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-black/55 px-3 py-2 text-xs font-black text-[#D4AF37] backdrop-blur">
              <Play className="h-4 w-4" />
              45s cinematic cut
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
