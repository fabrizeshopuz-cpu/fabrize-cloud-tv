# FABRIZE Cloud TV

FABRIZE uchun markaziy boshqaruvli TV kontent tizimi.

## Ishga tushirish

```bash
npm start
```

Windowsda `npm` bo'lmasa:

```bat
start-server.bat
```

Server `0.0.0.0:5173` da ishlaydi.

Shu kompyuterda:

```text
http://127.0.0.1:5173
```

Boshqa telefon, noutbuk yoki TV boxdan ochish uchun hamma qurilmalar bitta Wi-Fi/LAN tarmog'ida bo'lishi kerak:

```text
http://KOMPYUTER_IP:5173
```

Server ishga tushganda konsolda `LAN browser: http://...:5173` manzillarini ko'rsatadi.

## Muhim sozlamalar

Renderdagi hozirgi server:

```text
https://fabrize-cloud-tv.onrender.com
```

Public server yoki VPSda ishlatganda:

```bash
PUBLIC_BASE_URL=https://fabrize-cloud-tv.onrender.com npm start
```

Shunda sotuv bo'limida mijozga beriladigan cabinet linklari to'g'ri domain bilan chiqadi.

## Admin login

Default admin:

```text
Login: admin
Parol: Fabrize2026!
```

Ishga tushirishdan oldin o'zingizga mos login/parol berish tavsiya qilinadi:

```bash
ADMIN_LOGIN=admin ADMIN_PASSWORD=YangiKuchliParol ADMIN_EMAIL=owner@example.com npm start
```

Registratsiya va parol esdan chiqish so'rovlari `data/mail-outbox.json` fayliga yoziladi. Tashqi email servisga yuborish uchun `EMAIL_WEBHOOK_URL` beriladi:

```bash
EMAIL_WEBHOOK_URL=https://example.com/email-webhook npm start
```

## Sahifalar

- `/` - General admin panel
- `/client.html` - Mijoz cabinet
- `/tv.html?device=TV_ID` - Web TV player

## GitHub haqida

Bu loyiha Node.js server bilan ishlaydi. GitHub Pages faqat statik sayt ochadi, upload/API/APK monitoring ishlamaydi. To'liq ishlashi uchun loyiha VPS, Render, Railway yoki boshqa Node.js hostingda ishga tushiriladi.

## Gitga kiritilmaydigan fayllar

`data/db.json`, `uploads/`, Android build va local SDK sozlamalari `.gitignore` orqali chiqarib tashlangan. Bu mijoz fayllari, video/rasmlar va lokal maxfiy sozlamalar GitHubga chiqib ketmasligi uchun qilingan.
