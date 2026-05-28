import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "CASTMAP | Retail media ekranlarini cloud orqali boshqarish",
  description: "CASTMAP supermarket, restoran, retail va indoor reklama ekranlari uchun premium cloud boshqaruv platformasi.",
  openGraph: {
    title: "CASTMAP | Barcha ekranlaringizni bitta platformadan boshqaring",
    description: "Media kutubxona, playlist, jadval, live monitoring va APK auto update bir platformada.",
    url: "https://castmap.uz",
    siteName: "CASTMAP",
    locale: "uz_UZ",
    type: "website",
  },
  keywords: ["CASTMAP", "digital signage", "retail media", "indoor reklama", "Android TV reklama", "ekran boshqaruvi"],
};

export default function HomePage() {
  return <LandingPage />;
}
