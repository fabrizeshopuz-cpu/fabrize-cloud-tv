"use client";

const columns = [
  {
    title: "Mahsulot",
    links: [
      { label: "Cloud dashboard", href: "#mahsulot" },
      { label: "Media library", href: "#yechimlar" },
      { label: "Player APK", href: "#integratsiyalar" },
      { label: "Live monitoring", href: "#integratsiyalar" },
    ],
  },
  {
    title: "Kompaniya",
    links: [
      { label: "CASTMAP haqida", href: "#mahsulot" },
      { label: "Hamkorlik", href: "#hamkorlik" },
      { label: "Karyera", href: "#aloqa" },
      { label: "Kontakt", href: "#aloqa" },
    ],
  },
  {
    title: "Resurslar",
    links: [
      { label: "Qo'llanma", href: "#start" },
      { label: "API", href: "#integratsiyalar" },
      { label: "Integratsiyalar", href: "#integratsiyalar" },
      { label: "Status", href: "#narxlar" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-sm font-black text-[#D4AF37]">CM</span>
            <span>
              <span className="block text-lg font-black tracking-[0.16em] text-white">CASTMAP</span>
              <span className="block text-xs font-bold text-[#A1A1AA]">Retail media cloud</span>
            </span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#A1A1AA]">Supermarket, restoran, retail va indoor reklama tarmoqlari uchun cloud signage boshqaruv platformasi.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-black text-white">{column.title}</h3>
              <div className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <a className="text-sm font-bold text-[#A1A1AA] transition hover:text-[#D4AF37]" href={link.href} key={link.label}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-black text-white">Kontakt</h3>
            <div className="mt-4 grid gap-3 text-sm font-bold text-[#A1A1AA]">
              <a className="transition hover:text-[#D4AF37]" href="mailto:info@castmap.uz">info@castmap.uz</a>
              <a className="transition hover:text-[#D4AF37]" href="tel:+998901234567">+998 90 123 45 67</a>
              <span>Toshkent, O'zbekiston</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs font-bold text-[#A1A1AA] sm:flex-row sm:items-center sm:justify-between">
        <span>(c) 2026 CASTMAP. Barcha huquqlar himoyalangan.</span>
        <span>Cloud signage, monitoring va retail media OS.</span>
      </div>
    </footer>
  );
}
