# CASTMAP Admin Platform

CASTMAP - retail media ekranlari, Android TV Box va Smart TV playerlarni markazdan boshqarish uchun premium cloud admin panel.

## Ishga tushirish

Dependencylarni o'rnatish:

```bash
npm install
```

Development server:

```bash
npm run dev:next
```

Local manzil:

```text
http://localhost:3000/dashboard
```

Windowsda PowerShell `npm`ni bloklasa:

```powershell
npm.cmd run dev:next
```

Yoki:

```bat
start-server.bat
```

## Production build

```bash
npm run build:next
npm start
```

Render deploy uchun:

```text
buildCommand: npm install && npm run build:next
startCommand: npm start
```

Public URL:

```text
https://castmap.uz
```

Deploy yangilanganini tekshirish:

```text
https://castmap.uz/api/health
```

Javob ichida `app: "CASTMAP"` chiqishi kerak. Agar `castmap.uz` eski legacy sahifani ochsa, domen eski Render servicega ulangan yoki yangi commit hali deploy bo'lmagan bo'ladi.

## Asosiy sahifalar

- `/dashboard` - umumiy monitoring va KPI
- `/devices` - TV qurilmalar boshqaruvi
- `/media-library` - media yuklash va boshqarish
- `/playlists` - playlistlar
- `/schedules` - jadval va rejalashtirish
- `/campaigns` - kampaniyalar
- `/analytics` - analitika
- `/live-monitoring` - jonli monitoring
- `/apk-management` - APK versiyalarini boshqarish
- `/alerts` - ogohlantirishlar
- `/widgets` - ilovalar va widgetlar
- `/users` - foydalanuvchilar
- `/billing` - tarif va billing
- `/settings` - sozlamalar

## Ma'lumot saqlanishi

Next admin panel ma'lumotlarni ikki joyga yozadi:

- brauzer `localStorage`
- serverdagi `data/castmap-state.json`

Bir xil server URL orqali telefon yoki boshqa kompyuterdan kirilganda ma'lumotlar umumiy ko'rinadi. Render free instance restart yoki redeploy bo'lsa diskdagi JSON yo'qolishi mumkin. To'liq production uchun PostgreSQL + Prisma ulash kerak.

## APK player

APK manba kodi:

```text
castmap-player-apk/
```

Server URL:

```text
https://castmap-admin.onrender.com
```

APK build qilinganda `castmap-player-apk/app/build.gradle` ichidagi `SERVER_BASE_URL` qiymati real server URL bilan bir xil bo'lishi kerak.

## Server data reset

Test ma'lumotlarini tozalash uchun:

```powershell
Invoke-WebRequest -Uri https://castmap.uz/api/admin/state/reset -Method POST
```

Bu endpoint serverdagi runtime JSON state'ni bo'sh CASTMAP holatiga qaytaradi. Productionda bu endpointni login/parol yoki admin token bilan himoyalash kerak.

## GitHub va deploy

Kod GitHub'ga push qilingandan keyin Render repo'ga ulangan bo'lsa avtomatik build/deploy boshlaydi. GitHub faqat kod hosting; admin panelni internetda ishlatish uchun Render, VPS yoki boshqa Node hosting kerak.
