"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function DemoModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 px-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.form
            className="w-full max-w-xl rounded-lg border border-white/10 bg-[#111111] p-5 shadow-[0_0_80px_rgba(212,175,55,0.20)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">Demo so'rovi</p>
                <h2 className="mt-2 text-2xl font-black text-white">CASTMAP mutaxassisi bilan gaplashing</h2>
                <p className="mt-2 text-sm text-[#A1A1AA]">Ekranlaringiz soni, filiallaringiz va reklama jarayoningizga mos yechimni ko'rsatamiz.</p>
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white" type="button" onClick={onClose} aria-label="Modalni yopish">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Field label="Ism" name="name" placeholder="Ismingiz" />
              <Field label="Telefon" name="phone" placeholder="+998 ..." />
              <Field label="Kompaniya" name="company" placeholder="Kompaniya nomi" />
              <Field label="Ekranlar soni" name="screens" placeholder="Masalan: 25" />
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-[#A1A1AA]">Izoh</span>
                <textarea className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]/60" name="message" placeholder="Qaysi turdagi ekranlar va filiallar bor?" />
              </label>
            </div>
            <Button className="mt-5 w-full" variant="gold" type="submit">So'rov yuborish</Button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <label>
      <span className="text-xs font-bold text-[#A1A1AA]">{label}</span>
      <input className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-[#D4AF37]/60" name={name} placeholder={placeholder} required />
    </label>
  );
}
