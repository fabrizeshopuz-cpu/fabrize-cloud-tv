"use client";

import { useEffect, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

type ThemeMode = "dark" | "light";
type UiLanguage = "uz" | "ru" | "en";

const labels: Record<UiLanguage, { theme: string; night: string; day: string; lang: string }> = {
  uz: { theme: "Dizayn", night: "Kecha", day: "Kunduz", lang: "Til" },
  ru: { theme: "\u0414\u0438\u0437\u0430\u0439\u043d", night: "\u041d\u043e\u0447\u044c", day: "\u0414\u0435\u043d\u044c", lang: "\u042f\u0437\u044b\u043a" },
  en: { theme: "Design", night: "Night", day: "Day", lang: "Lang" },
};

function isLanguage(value: string | null): value is UiLanguage {
  return value === "uz" || value === "ru" || value === "en";
}

export function AppearanceControls() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [language, setLanguage] = useState<UiLanguage>("uz");

  useEffect(() => {
    if (pathname === "/") return;
    const savedTheme = window.localStorage.getItem("castmap-theme") === "light" ? "light" : "dark";
    const savedLanguage = window.localStorage.getItem("castmap-language");
    const nextLanguage = isLanguage(savedLanguage) ? savedLanguage : "uz";
    setTheme(savedTheme);
    setLanguage(nextLanguage);
    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.lang = nextLanguage;
    document.documentElement.lang = nextLanguage;
  }, [pathname]);

  const updateTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("castmap-theme", nextTheme);
  };

  const updateLanguage = (nextLanguage: UiLanguage) => {
    setLanguage(nextLanguage);
    document.documentElement.dataset.lang = nextLanguage;
    document.documentElement.lang = nextLanguage;
    window.localStorage.setItem("castmap-language", nextLanguage);
  };

  const text = labels[language];

  if (pathname === "/" || pathname === "/promo-video") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex max-w-[calc(100vw-32px)] flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/75 p-2 text-xs font-black text-white shadow-gold backdrop-blur-xl">
      <span className="hidden px-2 text-castMuted sm:inline">{text.theme}</span>
      <button
        className={`flex min-h-9 items-center gap-2 rounded-lg px-3 ${theme === "light" ? "bg-castGold text-black" : "border border-white/10 bg-white/[0.04] text-castMuted"}`}
        type="button"
        onClick={() => updateTheme("light")}
      >
        <Sun className="h-4 w-4" />
        {text.day}
      </button>
      <button
        className={`flex min-h-9 items-center gap-2 rounded-lg px-3 ${theme === "dark" ? "bg-castGold text-black" : "border border-white/10 bg-white/[0.04] text-castMuted"}`}
        type="button"
        onClick={() => updateTheme("dark")}
      >
        <Moon className="h-4 w-4" />
        {text.night}
      </button>
      <label className="flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-castMuted">
        <Languages className="h-4 w-4 text-castGold" />
        <span className="hidden sm:inline">{text.lang}</span>
        <select
          aria-label={text.lang}
          className="h-7 rounded-md border border-white/10 bg-[#0D0D0D] px-2 text-xs font-black text-white outline-none"
          value={language}
          onChange={(event) => updateLanguage(event.target.value as UiLanguage)}
        >
          <option value="uz">UZ</option>
          <option value="ru">RU</option>
          <option value="en">EN</option>
        </select>
      </label>
    </div>
  );
}
