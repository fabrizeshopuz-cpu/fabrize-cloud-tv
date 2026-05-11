const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const configuredBaseUrl = String(process.env.PUBLIC_BASE_URL || "https://fabrize-cloud-tv.onrender.com").replace(/\/$/, "");
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const apkDir = path.join(uploadDir, "apks");
const dbPath = path.join(dataDir, "db.json");
const mailOutboxPath = path.join(dataDir, "mail-outbox.json");
const weatherCache = new Map();
const adminSessionHours = Number(process.env.ADMIN_SESSION_HOURS || 8);
const defaultAdminLogin = process.env.ADMIN_LOGIN || "admin";
const defaultAdminPassword = process.env.ADMIN_PASSWORD || "Fabrize2026!";
const defaultAdminEmail = process.env.ADMIN_EMAIL || "admin@fabrize.uz";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".apk": "application/vnd.android.package-archive",
};

ensureStorage();

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    serveStatic(request, url, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server xatosi." });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`FABRIZE Cloud TV: http://127.0.0.1:${port}`);
  getLocalAddresses().forEach((address) => console.log(`LAN browser: http://${address}:${port}`));
  console.log(`TV player demo: http://127.0.0.1:${port}/tv.html?device=50043`);
});

async function handleApi(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/admin-login") {
    await handleAdminLogin(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin-logout") {
    await handleAdminLogout(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin-session") {
    const db = readDb();
    const admin = currentAdmin(db, request);
    sendJson(response, admin ? 200 : 401, admin ? { user: publicAdmin(admin) } : { error: "Login kerak." });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin-register-request") {
    await handleAdminRegisterRequest(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin-forgot-password") {
    await handleAdminForgotPassword(request, response);
    return;
  }

  if (!isPublicApi(url)) {
    const db = readDb();
    if (!currentAdmin(db, request)) {
      sendJson(response, 401, { error: "Admin panelga kirish uchun login/parol kerak." });
      return;
    }
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    sendJson(response, 200, readDb());
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/tv-code/")) {
    const code = normalizeDeviceCode(decodeURIComponent(url.pathname.split("/")[3] || ""));
    if (!isCompleteDeviceCode(code)) {
      sendJson(response, 400, { paired: false, error: "TV serial kodi noto'g'ri." });
      return;
    }

    const db = readDb();
    const device = db.devices.find((item) => normalizeDeviceCode(item.code) === code);
    if (!device) {
      sendJson(response, 200, {
        paired: false,
        code,
        media: [],
        serverTime: new Date().toISOString(),
        message: "Bu TV hali admin paneldagi lokatsiyaga ulanmagan.",
      });
      return;
    }
    const license = deviceLicense(db, device);
    if (!license.active) {
      sendJson(response, 403, {
        paired: false,
        code,
        media: [],
        serverTime: new Date().toISOString(),
        message: "Bu TV uchun mijoz litsenziyasi o'chirilgan.",
      });
      return;
    }

    applyTvCheckIn(url, device);
    const media = device.playlist
      .map((id) => db.media.find((item) => item.id === id))
      .filter(Boolean);
    const weather = await getWeatherForCity(device.weatherCity || "Tashkent");

    recordTvActivity(db, device, media);
    writeDb(db);
    sendJson(response, 200, { paired: true, device, media, weather, serverTime: new Date().toISOString() });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-command-status") {
    const body = await readJsonBody(request);
    const db = readDb();
    const code = normalizeDeviceCode(body.code);
    const device = db.devices.find((item) => normalizeDeviceCode(item.code) === code) || db.devices.find((item) => Number(item.id) === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    const status = String(body.status || "Qurilma javob berdi").trim();
    device.updateStatus = status;
    device.last = formatDateTime(new Date());
    device.status = "Online";
    const appVersion = String(body.appVersion || "").trim();
    if (appVersion && !/^web/i.test(appVersion)) {
      device.apkVersion = appVersion;
      device.appVersion = appVersion;
    }
    if (body.commandId && device.pendingCommand && Number(device.pendingCommand.id) === Number(body.commandId)) {
      device.pendingCommand.status = status;
      device.pendingCommand.ackAt = formatDateTime(new Date());
    }
    device.lastCommand = {
      ...(device.lastCommand || {}),
      id: Number(body.commandId) || Date.now(),
      command: body.command || device.pendingCommand?.command || "update",
      status,
      date: formatDateTime(new Date()),
    };

    writeDb(db);
    sendJson(response, 200, { device });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/tv-now-playing") {
    const body = await readJsonBody(request);
    const db = readDb();
    const code = normalizeDeviceCode(body.code);
    const device = db.devices.find((item) => normalizeDeviceCode(item.code) === code) || db.devices.find((item) => Number(item.id) === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }
    const license = deviceLicense(db, device);
    if (!license.active) {
      sendJson(response, 403, { error: "Bu TV uchun mijoz litsenziyasi o'chirilgan." });
      return;
    }

    const media = db.media.find((item) => Number(item.id) === Number(body.mediaId));
    const now = new Date();
    device.currentMediaId = media ? media.id : Number(body.mediaId) || null;
    device.currentMediaName = media ? media.name : String(body.mediaName || "Kontent");
    device.currentMediaType = media ? media.type : String(body.mediaType || "");
    device.currentIndex = Number(body.index) || 0;
    device.currentStartedAt = formatDateTime(now);
    device.status = "Online";
    device.last = formatDateTime(now);
    const appVersion = String(body.appVersion || "").trim();
    if (appVersion && !/^web/i.test(appVersion)) {
      device.apkVersion = appVersion;
      device.appVersion = appVersion;
    }
    recordTvActivity(db, device, media ? [media] : []);
    writeDb(db);
    sendJson(response, 200, { device });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/tv/")) {
    const deviceId = Number(url.pathname.split("/")[3]);
    const db = readDb();
    const device = db.devices.find((item) => item.id === deviceId);
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }
    const license = deviceLicense(db, device);
    if (!license.active) {
      sendJson(response, 403, { error: "Bu TV uchun mijoz litsenziyasi o'chirilgan.", device, media: [] });
      return;
    }

    const media = device.playlist
      .map((id) => db.media.find((item) => item.id === id))
      .filter(Boolean);
    const weather = await getWeatherForCity(device.weatherCity || "Tashkent");

    recordTvActivity(db, device, media);
    writeDb(db);
    sendJson(response, 200, { device, media, weather, serverTime: new Date().toISOString() });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-settings") {
    const body = await readJsonBody(request);
    const db = readDb();
    const device = db.devices.find((item) => item.id === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    applyDeviceSettings(device, body);
    writeDb(db);
    sendJson(response, 200, { device });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/client-login") {
    const body = await readJsonBody(request);
    const db = readDb();
    const login = String(body.login || "").trim();
    const password = String(body.password || "").trim();
    const sale = db.sales.find((item) => item.adminLogin === login && item.adminPassword === password);
    if (!sale) {
      sendJson(response, 401, { error: "Login yoki parol noto'g'ri." });
      return;
    }
    if (sale.accessStatus !== "Dostup berildi") {
      sendJson(response, 403, { error: "Bu mijoz uchun dostup hali aktiv emas." });
      return;
    }

    sale.clientToken ||= createToken();
    sale.lastLoginAt = formatDateTime(new Date());
    sale.lastClientSignalAt = formatDateTime(new Date());
    writeDb(db);
    sendJson(response, 200, { token: sale.clientToken, account: publicSale(sale), sections: sale.allowedSections });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/client-state") {
    const db = readDb();
    const sale = saleByToken(db, url.searchParams.get("token"));
    if (!sale) {
      sendJson(response, 401, { error: "Client sessiyasi topilmadi." });
      return;
    }
    if (sale.accessStatus !== "Dostup berildi") {
      sendJson(response, 403, { error: "Bu mijoz litsenziyasi faol emas." });
      return;
    }
    sale.lastClientSignalAt = formatDateTime(new Date());
    writeDb(db);
    sendJson(response, 200, clientState(db, sale));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/client-device") {
    const body = await readJsonBody(request);
    const db = readDb();
    const sale = saleByToken(db, body.token);
    if (!sale) {
      sendJson(response, 401, { error: "Client sessiyasi topilmadi." });
      return;
    }
    if (!hasClientSection(sale, "devices")) {
      sendJson(response, 403, { error: "Qurilmalar bo'limiga ruxsat yo'q." });
      return;
    }

    const clientDevices = db.devices.filter((device) => Number(device.clientId) === Number(sale.id));
    if (clientDevices.length >= Number(sale.tvs || 1)) {
      sendJson(response, 403, { error: `Tarif bo'yicha ${sale.tvs} ta TV limiti bor.` });
      return;
    }

    const requestedCode = normalizeDeviceCode(body.code);
    if (!requestedCode || !isCompleteDeviceCode(requestedCode)) {
      sendJson(response, 400, { error: "TV serial kodi kerak. Masalan: A1B2-C3D4." });
      return;
    }
    if (db.devices.some((item) => normalizeDeviceCode(item.code) === requestedCode)) {
      sendJson(response, 409, { error: "Bu TV serial kodi allaqachon ulangan." });
      return;
    }

    const device = {
      id: nextId(db.devices),
      clientId: sale.id,
      name: String(body.name || "").trim() || `TV ${clientDevices.length + 1}`,
      code: requestedCode,
      status: "Offline",
      last: "-",
      group: sale.customer,
      lastUploaded: "-",
      appVersion: "1.6.0",
      apkVersion: "1.6.0",
      os: "android",
      workSchedule: body.workSchedule || "09:00-22:00",
      volume: 75,
      rotation: 0,
      weatherCity: "Tashkent",
      showLogo: false,
      playlist: [],
    };
    db.devices.unshift(device);
    writeDb(db);
    sendJson(response, 201, { device });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/client-media") {
    const body = await readJsonBody(request, 260 * 1024 * 1024);
    const db = readDb();
    const sale = saleByToken(db, body.token);
    if (!sale) {
      sendJson(response, 401, { error: "Client sessiyasi topilmadi." });
      return;
    }
    if (!hasClientSection(sale, "content")) {
      sendJson(response, 403, { error: "Kontent bo'limiga ruxsat yo'q." });
      return;
    }

    const device = db.devices.find((item) => Number(item.id) === Number(body.deviceId) && Number(item.clientId) === Number(sale.id));
    if (!device) {
      sendJson(response, 404, { error: "Client TV topilmadi." });
      return;
    }

    const uploaded = body.youtubeUrl ? saveYoutube(body) : saveMedia(body);
    uploaded.clientId = sale.id;
    uploaded.deviceId = device.id;
    uploaded.deviceName = device.name;
    db.media.unshift(uploaded);
    if (!device.playlist.includes(uploaded.id)) device.playlist.unshift(uploaded.id);
    device.lastUploaded = formatDateTime(new Date());
    writeDb(db);
    sendJson(response, 201, { media: uploaded });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-logo") {
    const body = await readJsonBody(request, 15 * 1024 * 1024);
    const db = readDb();
    const device = db.devices.find((item) => item.id === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    const logo = saveDeviceLogo(body);
    device.logoUrl = logo.url;
    device.logoName = logo.name;
    device.showLogo = true;
    device.updatedAt = formatDateTime(new Date());
    writeDb(db);
    sendJson(response, 201, { device, logo });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/media") {
    const body = await readJsonBody(request, 260 * 1024 * 1024);
    const db = readDb();
    const targetDevice = db.devices.find((device) => device.id === Number(body.deviceId)) || db.devices.find((device) => device.status === "Online") || db.devices[0];
    const uploaded = body.youtubeUrl ? saveYoutube(body) : saveMedia(body);
    if (targetDevice) {
      uploaded.deviceId = targetDevice.id;
      uploaded.deviceName = targetDevice.name;
    }
    db.media.unshift(uploaded);

    if (targetDevice && !targetDevice.playlist.includes(uploaded.id)) {
      targetDevice.playlist.unshift(uploaded.id);
      targetDevice.lastUploaded = formatDateTime(new Date());
    }

    writeDb(db);
    sendJson(response, 201, { media: uploaded, assignedDevice: targetDevice?.id || null });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-playlist") {
    const body = await readJsonBody(request);
    const db = readDb();
    const device = db.devices.find((item) => item.id === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    const mediaIds = [...new Set((body.mediaIds || []).map(Number))].filter((id) => db.media.some((item) => item.id === id));
    device.playlist = mediaIds;
    device.lastUploaded = formatDateTime(new Date());
    writeDb(db);
    sendJson(response, 200, { device });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device") {
    const body = await readJsonBody(request);
    const db = readDb();
    const requestedCode = normalizeDeviceCode(body.code);
    if (requestedCode && !isCompleteDeviceCode(requestedCode)) {
      sendJson(response, 400, { error: "TV serial kodi 8 ta belgi bo'lishi kerak. Masalan: A1B2-C3D4." });
      return;
    }
    if (requestedCode && db.devices.some((item) => normalizeDeviceCode(item.code) === requestedCode)) {
      sendJson(response, 409, { error: "Bu TV serial kodi allaqachon boshqa lokatsiyaga ulangan." });
      return;
    }

    const device = {
      id: nextId(db.devices),
      name: body.name || `Yangi ekran ${db.devices.length + 1}`,
      code: requestedCode || createDeviceCode(),
      status: "Offline",
      last: "-",
      group: body.group || body.name || "Standart",
      lastUploaded: "-",
      appVersion: "1.2.0",
      os: "android",
      workSchedule: body.workSchedule || "09:00-22:00",
      volume: 75,
      rotation: 0,
      weatherCity: "Tashkent",
      showLogo: false,
      playlist: [],
    };
    db.devices.unshift(device);
    if (!db.groups.some((group) => group.name === device.group)) {
      db.groups.unshift({
        id: nextId(db.groups),
        name: device.group,
        descriptions: "",
        content: 0,
        devices: 1,
      });
    }
    writeDb(db);
    sendJson(response, 201, { device });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sale") {
    const body = await readJsonBody(request);
    const db = readDb();
    const saleId = Date.now();
    const tariff = String(body.tariff || "business");
    const monthlyTotal = Number(body.monthlyTotal) || salePrice(tariff, body.tvs);
    const sale = {
      id: saleId,
      customer: String(body.customer || "").trim() || "Yangi mijoz",
      phone: String(body.phone || "").trim(),
      email: String(body.email || "").trim(),
      locations: clamp(Number(body.locations) || 1, 1, 999),
      tvs: clamp(Number(body.tvs) || 1, 1, 9999),
      tariff,
      paymentMethod: String(body.paymentMethod || "naqd"),
      allowedSections: normalizeClientSections(body.allowedSections),
      status: "Zayavka qabul qilindi",
      accessStatus: "Dostup kutilmoqda",
      invoiceId: `INV-${saleId}`,
      paymentUrl: `/pay/${saleId}`,
      monthlyTotal,
      cabinetUrl: `${requestBaseUrl(request)}/client.html`,
      adminLogin: "",
      adminPassword: "",
      createdAt: formatDateTime(new Date()),
    };
    db.sales.unshift(sale);
    writeDb(db);
    sendJson(response, 201, { sale });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sale-access") {
    const body = await readJsonBody(request);
    const db = readDb();
    const sale = db.sales.find((item) => Number(item.id) === Number(body.saleId));
    if (!sale) {
      sendJson(response, 404, { error: "Sotuv arizasi topilmadi." });
      return;
    }

    createSaleAccess(sale, requestBaseUrl(request));
    writeDb(db);
    sendJson(response, 200, { sale });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sale-access-update") {
    const body = await readJsonBody(request);
    const db = readDb();
    const sale = db.sales.find((item) => Number(item.id) === Number(body.saleId));
    if (!sale) {
      sendJson(response, 404, { error: "Sotuv arizasi topilmadi." });
      return;
    }

    sale.allowedSections = normalizeClientSections(body.allowedSections);
    if (sale.adminLogin && sale.accessStatus !== "Litsenziya o'chirilgan") {
      sale.status = "Mijoz aktiv";
      sale.accessStatus = "Dostup berildi";
    }
    sale.updatedAt = formatDateTime(new Date());
    writeDb(db);
    sendJson(response, 200, { sale });
    return;
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/api/sale-license/")) {
    const saleId = Number(url.pathname.split("/")[3]);
    const db = readDb();
    const sale = db.sales.find((item) => Number(item.id) === saleId);
    if (!sale) {
      sendJson(response, 404, { error: "Sotuv arizasi topilmadi." });
      return;
    }

    revokeSaleLicense(sale);
    db.devices.forEach((device) => {
      if (Number(device.clientId) === saleId) {
        device.status = "Offline";
        device.currentMediaName = "Litsenziya o'chirilgan";
        device.currentMediaType = "";
        device.updatedAt = formatDateTime(new Date());
      }
    });
    writeDb(db);
    sendJson(response, 200, { sale });
    return;
  }

  if (request.method === "PATCH" && url.pathname.startsWith("/api/device/")) {
    const deviceId = Number(url.pathname.split("/")[3]);
    const body = await readJsonBody(request);
    const db = readDb();
    const device = db.devices.find((item) => item.id === deviceId);
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    const name = String(body.name || "").trim();
    if (!name) {
      sendJson(response, 400, { error: "Lokatsiya nomi kerak." });
      return;
    }

    const oldName = device.name;
    device.name = name;
    device.group = name;
    device.updatedAt = formatDateTime(new Date());

    db.media.forEach((item) => {
      if (Number(item.deviceId) === deviceId) item.deviceName = name;
    });
    db.activityLogs.forEach((item) => {
      if (Number(item.deviceId) === deviceId) {
        item.deviceName = name;
        item.group = name;
      }
    });
    db.apkFiles.forEach((item) => {
      if (Number(item.deviceId) === deviceId) item.deviceName = name;
    });
    if (device.latestApk) device.latestApk.deviceName = name;

    if (!db.groups.some((group) => group.name === name)) {
      db.groups.unshift({
        id: nextId(db.groups),
        name,
        descriptions: "",
        content: 0,
        devices: 1,
      });
    }
    db.groups = db.groups.map((group) => group.name === oldName ? { ...group, name } : group);

    writeDb(db);
    sendJson(response, 200, { device });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-command") {
    const body = await readJsonBody(request);
    const db = readDb();
    const device = db.devices.find((item) => item.id === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    const command = String(body.command || "").trim();
    if (!["refresh", "restart", "update"].includes(command)) {
      sendJson(response, 400, { error: "Buyruq noto'g'ri." });
      return;
    }

    const item = {
      id: Date.now(),
      deviceId: device.id,
      command,
      status: "Yuborildi",
      date: formatDateTime(new Date()),
    };
    db.deviceCommands.unshift(item);
    device.pendingCommand = item;
    device.lastCommand = item;
    if (command === "update" && device.latestApk) {
      device.updateStatus = "APK yangilash yuborildi";
    }
    writeDb(db);
    sendJson(response, 200, { device, command: item });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-apk") {
    const body = await readJsonBody(request, 320 * 1024 * 1024);
    const db = readDb();
    const device = db.devices.find((item) => item.id === Number(body.deviceId));
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    const apk = saveApk(body);
    apk.deviceId = device.id;
    apk.deviceName = device.name;
    db.apkFiles.unshift(apk);
    device.latestApk = apk;
    device.targetApkVersion = apk.version;
    device.updateStatus = "Yangi APK tayyor";
    const command = {
      id: Date.now(),
      deviceId: device.id,
      command: "update",
      status: "Yangi APK yuborildi",
      date: formatDateTime(new Date()),
      apkId: apk.id,
    };
    db.deviceCommands.unshift(command);
    device.pendingCommand = command;
    device.lastCommand = command;
    writeDb(db);
    sendJson(response, 201, { device, apk });
    return;
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/api/device/")) {
    const deviceId = Number(url.pathname.split("/")[3]);
    const db = readDb();
    const device = db.devices.find((item) => item.id === deviceId);
    if (!device) {
      sendJson(response, 404, { error: "Qurilma topilmadi." });
      return;
    }

    db.devices = db.devices.filter((item) => item.id !== deviceId);
    db.activityLogs = db.activityLogs.filter((item) => Number(item.deviceId) !== deviceId);
    db.deviceCommands = db.deviceCommands.filter((item) => Number(item.deviceId) !== deviceId);
    db.apkFiles = db.apkFiles.filter((item) => Number(item.deviceId) !== deviceId);
    db.media.forEach((item) => {
      if (Number(item.deviceId) === deviceId) {
        delete item.deviceId;
        delete item.deviceName;
      }
    });
    writeDb(db);
    sendJson(response, 200, { ok: true, deleted: deviceId });
    return;
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/api/media/")) {
    const mediaId = Number(url.pathname.split("/")[3]);
    const db = readDb();
    const media = db.media.find((item) => item.id === mediaId);
    db.media = db.media.filter((item) => item.id !== mediaId);
    db.devices.forEach((device) => {
      device.playlist = device.playlist.filter((id) => id !== mediaId);
    });
    writeDb(db);
    if (media) fs.rm(path.join(root, media.url), { force: true }, () => {});
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "API topilmadi." });
}

function serveStatic(request, url, response) {
  const requestedPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const filePath = path.resolve(root, requestedPath);

  if (!filePath.startsWith(root) || isBlockedStaticPath(url.pathname, filePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": url.pathname.startsWith("/uploads/") ? "public, max-age=3600" : "no-cache",
    };

    const range = request.headers.range;
    if (range && (ext === ".mp4" || ext === ".webm" || ext === ".mov")) {
      serveRange(filePath, stats, range, headers, response);
      return;
    }

    response.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(response);
  });
}

function isBlockedStaticPath(pathname, filePath) {
  const normalized = pathname.replace(/\\/g, "/").toLowerCase();
  const lowerFile = filePath.toLowerCase();
  return normalized.startsWith("/data/")
    || normalized.startsWith("/.git")
    || normalized.includes("/.git/")
    || lowerFile.endsWith(".env")
    || lowerFile.endsWith(".log")
    || lowerFile.endsWith("local.properties");
}

function serveRange(filePath, stats, range, headers, response) {
  const [startText, endText] = range.replace(/bytes=/, "").split("-");
  const start = Number(startText);
  const end = endText ? Number(endText) : stats.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    response.writeHead(416);
    response.end();
    return;
  }

  response.writeHead(206, {
    ...headers,
    "Accept-Ranges": "bytes",
    "Content-Range": `bytes ${start}-${end}/${stats.size}`,
    "Content-Length": end - start + 1,
  });
  fs.createReadStream(filePath, { start, end }).pipe(response);
}

function isPublicApi(url) {
  return url.pathname === "/api/admin-login"
    || url.pathname === "/api/admin-logout"
    || url.pathname === "/api/admin-session"
    || url.pathname === "/api/admin-register-request"
    || url.pathname === "/api/admin-forgot-password"
    || url.pathname === "/api/client-login"
    || url.pathname === "/api/client-state"
    || url.pathname === "/api/client-device"
    || url.pathname === "/api/client-media"
    || url.pathname === "/api/device-command-status"
    || url.pathname === "/api/tv-now-playing"
    || url.pathname.startsWith("/api/tv-code/")
    || url.pathname.startsWith("/api/tv/");
}

function requestBaseUrl(request) {
  if (process.env.PUBLIC_BASE_URL) return configuredBaseUrl;
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = String(forwardedHost || request.headers.host || `127.0.0.1:${port}`).split(",")[0].trim();
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  return `${forwardedProto}://${host}`.replace(/\/$/, "");
}

async function handleAdminLogin(request, response) {
  const body = await readJsonBody(request);
  const db = readDb();
  const login = String(body.login || "").trim();
  const password = String(body.password || "");
  const admin = db.admins.find((item) => item.login === login || item.email === login);

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    sendJson(response, 401, { error: "Login yoki parol noto'g'ri." });
    return;
  }

  const token = createToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + adminSessionHours * 60 * 60 * 1000);
  db.adminSessions.push({
    token,
    adminId: admin.id,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: request.headers["user-agent"] || "",
  });
  admin.lastLoginAt = formatDateTime(now);
  writeDb(db);

  sendJson(response, 200, { user: publicAdmin(admin) }, {
    "Set-Cookie": adminCookie(token, Math.round((expiresAt - now) / 1000)),
  });
}

async function handleAdminLogout(request, response) {
  const db = readDb();
  const token = cookieValue(request, "admin_session");
  db.adminSessions = db.adminSessions.filter((item) => item.token !== token);
  writeDb(db);
  sendJson(response, 200, { ok: true }, { "Set-Cookie": adminCookie("", 0) });
}

async function handleAdminRegisterRequest(request, response) {
  const body = await readJsonBody(request);
  const db = readDb();
  const item = {
    id: Date.now(),
    type: "registration",
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    message: String(body.message || "").trim(),
    status: "Yangi so'rov",
    createdAt: formatDateTime(new Date()),
  };
  if (!item.name || !item.email) {
    sendJson(response, 400, { error: "Ism va email kerak." });
    return;
  }

  db.emailRequests.unshift(item);
  writeDb(db);
  await sendSystemEmail({
    subject: "FABRIZE admin registratsiya so'rovi",
    text: `Yangi registratsiya so'rovi\n\nIsm: ${item.name}\nEmail: ${item.email}\nTelefon: ${item.phone || "-"}\nXabar: ${item.message || "-"}`,
    replyTo: item.email,
  });
  sendJson(response, 201, { ok: true, message: "So'rov emailingiz orqali adminga yuborildi." });
}

async function handleAdminForgotPassword(request, response) {
  const body = await readJsonBody(request);
  const db = readDb();
  const loginOrEmail = String(body.loginOrEmail || "").trim();
  if (!loginOrEmail) {
    sendJson(response, 400, { error: "Login yoki email kiriting." });
    return;
  }

  const admin = db.admins.find((item) => item.login === loginOrEmail || item.email === loginOrEmail);
  const item = {
    id: Date.now(),
    type: "forgot-password",
    loginOrEmail,
    matchedAdmin: admin ? admin.login : "",
    status: "Yangi so'rov",
    createdAt: formatDateTime(new Date()),
  };
  db.emailRequests.unshift(item);
  writeDb(db);
  await sendSystemEmail({
    subject: "FABRIZE admin parolni tiklash so'rovi",
    text: `Parolni tiklash so'rovi\n\nKiritilgan login/email: ${loginOrEmail}\nTopilgan admin: ${admin ? `${admin.login} (${admin.email})` : "Topilmadi"}\nVaqt: ${item.createdAt}`,
    replyTo: admin?.email || defaultAdminEmail,
  });
  sendJson(response, 201, { ok: true, message: "Parolni tiklash so'rovi email orqali yuborildi." });
}

function currentAdmin(db, request) {
  const token = cookieValue(request, "admin_session");
  if (!token) return null;
  const now = Date.now();
  db.adminSessions = (db.adminSessions || []).filter((item) => new Date(item.expiresAt).getTime() > now);
  const session = db.adminSessions.find((item) => item.token === token);
  if (!session) return null;
  return db.admins.find((item) => Number(item.id) === Number(session.adminId)) || null;
}

function publicAdmin(admin) {
  return {
    id: admin.id,
    name: admin.name,
    login: admin.login,
    email: admin.email,
    lastLoginAt: admin.lastLoginAt || "",
  };
}

function cookieValue(request, name) {
  const cookies = String(request.headers.cookie || "").split(";").map((item) => item.trim());
  const prefix = `${name}=`;
  const found = cookies.find((item) => item.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

function adminCookie(token, maxAge) {
  return `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Number(maxAge) || 0)}`;
}

async function sendSystemEmail(message) {
  const mail = {
    id: Date.now(),
    to: defaultAdminEmail,
    from: process.env.MAIL_FROM || defaultAdminEmail,
    replyTo: message.replyTo || "",
    subject: message.subject,
    text: message.text,
    createdAt: formatDateTime(new Date()),
    status: "outbox",
  };
  appendMailOutbox(mail);

  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mail),
      });
      mail.status = "sent-webhook";
      appendMailOutbox(mail);
    } catch (error) {
      mail.status = `webhook-error: ${error.message}`;
      appendMailOutbox(mail);
    }
  }

  console.log(`[MAIL] ${mail.subject} -> ${mail.to}`);
}

function appendMailOutbox(mail) {
  let items = [];
  try {
    items = JSON.parse(fs.readFileSync(mailOutboxPath, "utf8"));
    if (!Array.isArray(items)) items = [];
  } catch (error) {
    items = [];
  }
  items.unshift(mail);
  fs.writeFileSync(mailOutboxPath, JSON.stringify(items.slice(0, 200), null, 2));
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}

function saveMedia(body) {
  if (!body.dataUrl || !body.name) throw new Error("Fayl ma'lumoti yetarli emas.");

  const match = /^data:([^;]+);base64,(.+)$/.exec(body.dataUrl);
  if (!match) throw new Error("Fayl formati noto'g'ri.");

  const mime = match[1];
  const bytes = Buffer.from(match[2], "base64");
  const extension = extensionFromMime(mime, body.name);
  const id = Date.now();
  const safeName = slugify(path.basename(body.name, path.extname(body.name)));
  const fileName = `${id}-${safeName}${extension}`;
  const relativeUrl = path.join("uploads", fileName).replace(/\\/g, "/");

  fs.writeFileSync(path.join(uploadDir, fileName), bytes);

  return {
    id,
    name: body.title || path.basename(body.name, path.extname(body.name)),
    type: mediaTypeFromMime(mime),
    mime,
    size: formatBytes(bytes.length),
    duration: body.duration || (mime.startsWith("video/") ? "00:00:30" : "00:00:05"),
    date: formatDateTime(new Date()),
    url: relativeUrl,
  };
}

function saveYoutube(body) {
  if (!body.youtubeUrl || !body.title) throw new Error("YouTube nomi va linki kerak.");
  return {
    id: Date.now(),
    name: body.title,
    type: "YouTube",
    mime: "text/youtube",
    size: "-",
    duration: body.duration || "00:03:25",
    date: formatDateTime(new Date()),
    url: body.youtubeUrl,
  };
}

function saveApk(body) {
  if (!body.dataUrl || !body.name) throw new Error("APK fayl ma'lumoti yetarli emas.");

  const match = /^data:([^;]+);base64,(.+)$/.exec(body.dataUrl);
  if (!match) throw new Error("APK formati noto'g'ri.");

  const bytes = Buffer.from(match[2], "base64");
  const id = Date.now();
  const originalBase = path.basename(body.name, path.extname(body.name));
  const safeName = slugify(originalBase);
  const fileName = `${id}-${safeName}.apk`;
  const relativeUrl = path.join("uploads", "apks", fileName).replace(/\\/g, "/");

  fs.writeFileSync(path.join(apkDir, fileName), bytes);

  return {
    id,
    name: body.name,
    version: String(body.version || extractVersionFromName(body.name) || "1.0.0"),
    size: formatBytes(bytes.length),
    date: formatDateTime(new Date()),
    url: relativeUrl,
  };
}

function saveDeviceLogo(body) {
  if (!body.dataUrl || !body.name) throw new Error("Logo fayl ma'lumoti yetarli emas.");

  const match = /^data:([^;]+);base64,(.+)$/.exec(body.dataUrl);
  if (!match) throw new Error("Logo formati noto'g'ri.");

  const mime = match[1];
  if (!mime.startsWith("image/")) throw new Error("Logo faqat rasm bo'lishi kerak.");

  const bytes = Buffer.from(match[2], "base64");
  const extension = extensionFromMime(mime, body.name);
  const id = Date.now();
  const safeName = slugify(path.basename(body.name, path.extname(body.name)));
  const fileName = `${id}-${safeName}${extension}`;
  const relativeUrl = path.join("uploads", fileName).replace(/\\/g, "/");

  fs.writeFileSync(path.join(uploadDir, fileName), bytes);

  return {
    id,
    name: body.name,
    size: formatBytes(bytes.length),
    date: formatDateTime(new Date()),
    url: relativeUrl,
  };
}

function ensureStorage() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(apkDir, { recursive: true });

  if (!fs.existsSync(dbPath)) {
    writeDb({
      devices: [
        { id: 50706, name: "Bunyodkor Korzinka kirvurish", status: "Offline", last: "30.04.2026 14:34:39", group: "Bunyodkor korzinka reklama", lastUploaded: "30.04.2026 14:09:39", appVersion: "2.2.8", os: "android", playlist: [] },
        { id: 50043, name: "Yengi toshmi", status: "Online", last: "09.05.2026 18:42:58", group: "Yengi toshmi", lastUploaded: "09.05.2026 15:01:08", appVersion: "2.2.8", os: "android", playlist: [] },
        { id: 39186, name: "Bunyodkor zina 2 etaj", status: "Online", last: "09.05.2026 18:42:51", group: "Bunyodkor zina", lastUploaded: "09.05.2026 10:05:54", appVersion: "2.2.8", os: "android", playlist: [] },
      ],
      groups: [
        { id: 10031, name: "Yengi toshmi", descriptions: "", content: 0, devices: 1 },
        { id: 9478, name: "Bunyodkor zina", descriptions: "", content: 0, devices: 1 },
        { id: 9460, name: "Bunyodkor korzinka reklama", descriptions: "", content: 0, devices: 1 },
        { id: 9458, name: "Standart", descriptions: "", content: 0, devices: 0 },
      ],
      media: [],
      activityLogs: [],
      deviceCommands: [],
      apkFiles: [],
      sales: [],
    });
  }
}

function readDb() {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  db.devices ||= [];
  db.groups ||= [];
  db.media ||= [];
  db.activityLogs ||= [];
  db.deviceCommands ||= [];
  db.apkFiles ||= [];
  db.sales ||= [];
  db.admins ||= [];
  db.adminSessions ||= [];
  db.emailRequests ||= [];
  normalizeAdmins(db);
  normalizeDevices(db);
  refreshDeviceStatuses(db);
  return db;
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function normalizeAdmins(db) {
  if (!db.admins.length) {
    db.admins.push({
      id: 1,
      name: "FABRIZE Admin",
      login: defaultAdminLogin,
      email: defaultAdminEmail,
      passwordHash: hashPassword(defaultAdminPassword),
      createdAt: formatDateTime(new Date()),
    });
  }
  const now = Date.now();
  db.adminSessions = (db.adminSessions || []).filter((item) => new Date(item.expiresAt).getTime() > now);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const next = crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(next));
}

function readJsonBody(request, limit = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new Error("So'rov hajmi juda katta."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Noto'g'ri JSON so'rov."));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(payload));
}

function extensionFromMime(mime, originalName) {
  const fromName = path.extname(originalName || "");
  if (fromName) return fromName.toLowerCase();
  if (mime === "video/mp4") return ".mp4";
  if (mime === "video/webm") return ".webm";
  if (mime === "audio/mpeg") return ".mp3";
  if (mime === "audio/wav") return ".wav";
  if (mime === "audio/mp4") return ".m4a";
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  return ".bin";
}

function mediaTypeFromMime(mime) {
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "MP3";
  return "Rasm";
}

function normalizeDevices(db) {
  db.devices.forEach((device) => {
    device.code = normalizeDeviceCode(device.code) || createDeviceCode(device.id);
    device.appVersion ||= device.apkVersion || "2.2.8";
    device.apkVersion ||= device.appVersion;
    device.workSchedule ||= "09:00-22:00";
    device.volume = clamp(Number(device.volume ?? 75), 0, 100);
    device.rotation = normalizeRotation(device.rotation);
    device.weatherCity ||= "Tashkent";
    device.showLogo = Boolean(device.showLogo);
    device.os ||= "android";
    device.playlist ||= [];
  });
  db.sales.forEach((sale) => {
    sale.allowedSections = normalizeClientSections(sale.allowedSections);
    sale.status ||= "Zayavka qabul qilindi";
    sale.accessStatus ||= sale.adminLogin ? "Dostup berildi" : "Dostup kutilmoqda";
    sale.invoiceId ||= `INV-${sale.id}`;
    sale.paymentUrl ||= `/pay/${sale.id}`;
    if (!sale.cabinetUrl || /\/$/.test(String(sale.cabinetUrl))) {
      sale.cabinetUrl = `${configuredBaseUrl}/client.html`;
    }
    sale.monthlyTotal ||= salePrice(sale.tariff, sale.tvs);
  });
}

function normalizeClientSections(value) {
  const allowed = ["dashboard", "content", "devices", "live", "stats", "settings"];
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  const selected = list.map((item) => String(item).trim()).filter((item) => allowed.includes(item));
  return selected.length ? [...new Set(selected)] : ["dashboard", "content", "devices", "live", "stats"];
}

function hasClientSection(sale, section) {
  return normalizeClientSections(sale.allowedSections).includes(section);
}

function saleByToken(db, token) {
  const value = String(token || "").trim();
  if (!value) return null;
  return db.sales.find((sale) => sale.clientToken === value && sale.accessStatus === "Dostup berildi") || null;
}

function deviceLicense(db, device) {
  if (!device.clientId) return { active: true, sale: null };
  const sale = db.sales.find((item) => Number(item.id) === Number(device.clientId));
  if (!sale) return { active: false, sale: null };
  return { active: sale.accessStatus === "Dostup berildi", sale };
}

function clientState(db, sale) {
  const devices = db.devices.filter((device) => Number(device.clientId) === Number(sale.id));
  const deviceIds = new Set(devices.map((device) => Number(device.id)));
  const media = db.media.filter((item) => Number(item.clientId) === Number(sale.id) || deviceIds.has(Number(item.deviceId)));
  const activityLogs = db.activityLogs.filter((item) => deviceIds.has(Number(item.deviceId)));
  return {
    account: publicSale(sale),
    sections: normalizeClientSections(sale.allowedSections),
    devices,
    media,
    activityLogs,
  };
}

function publicSale(sale) {
  return {
    id: sale.id,
    customer: sale.customer,
    phone: sale.phone,
    email: sale.email,
    locations: sale.locations,
    tvs: sale.tvs,
    tariff: sale.tariff,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    accessStatus: sale.accessStatus,
    invoiceId: sale.invoiceId,
    paymentUrl: sale.paymentUrl,
    monthlyTotal: sale.monthlyTotal,
    cabinetUrl: sale.cabinetUrl,
    adminLogin: sale.adminLogin,
    adminPassword: sale.adminPassword,
    allowedSections: normalizeClientSections(sale.allowedSections),
    lastLoginAt: sale.lastLoginAt,
    lastClientSignalAt: sale.lastClientSignalAt,
    licenseDeletedAt: sale.licenseDeletedAt,
    createdAt: sale.createdAt,
    expiresAt: sale.expiresAt,
  };
}

function createSaleAccess(sale, baseUrl = configuredBaseUrl) {
  sale.adminLogin ||= `${slugify(sale.customer).replace(/-/g, ".") || "client"}.${sale.id}`.slice(0, 48);
  sale.adminPassword ||= createPassword();
  sale.clientToken ||= createToken();
  sale.cabinetUrl = `${String(baseUrl || configuredBaseUrl).replace(/\/$/, "")}/client.html`;
  sale.status = "Mijoz aktiv";
  sale.accessStatus = "Dostup berildi";
  sale.activatedAt = formatDateTime(new Date());
  sale.expiresAt = formatDateTime(addDays(new Date(), 30));
}

function revokeSaleLicense(sale) {
  sale.adminLogin = "";
  sale.adminPassword = "";
  sale.clientToken = "";
  sale.status = "Litsenziya o'chirildi";
  sale.accessStatus = "Litsenziya o'chirilgan";
  sale.licenseDeletedAt = formatDateTime(new Date());
}

function salePrice(tariff, tvs) {
  const prices = { start: 150000, business: 250000, premium: 450000 };
  return (prices[tariff] || prices.business) * clamp(Number(tvs) || 1, 1, 9999);
}

function createPassword() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function createToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function applyDeviceSettings(device, body) {
  if (body.workSchedule) device.workSchedule = String(body.workSchedule);
  if (body.volume !== undefined) device.volume = clamp(Number(body.volume), 0, 100);
  if (body.rotation !== undefined) device.rotation = normalizeRotation(body.rotation);
  if (body.weatherCity !== undefined) device.weatherCity = String(body.weatherCity || "Tashkent").trim() || "Tashkent";
  if (body.showLogo !== undefined) device.showLogo = Boolean(body.showLogo);
  device.updatedAt = formatDateTime(new Date());
}

function normalizeRotation(value) {
  const number = Number(value) || 0;
  return [0, 90, 180, 270].includes(number) ? number : 0;
}

function recordTvActivity(db, device, media) {
  const now = new Date();
  const dateKey = formatDateKey(now);
  const mediaList = media || [];
  const videoCount = mediaList.filter((item) => item.type === "Video" || String(item.mime || "").startsWith("video/")).length;
  const nowIso = now.toISOString();

  let log = db.activityLogs.find((item) => Number(item.deviceId) === Number(device.id) && item.date === dateKey);
  if (!log) {
    log = {
      id: `${device.id}-${dateKey}`,
      deviceId: device.id,
      deviceName: device.name,
      group: device.group || "Standart",
      date: dateKey,
      startedAt: nowIso,
      lastSeenAt: nowIso,
      videoSeconds: 0,
      videoCount,
      contentCount: mediaList.length,
    };
    db.activityLogs.push(log);
  } else {
    const previousSeenAt = new Date(log.lastSeenAt);
    const deltaSeconds = Number.isNaN(previousSeenAt.getTime()) ? 0 : Math.max(0, Math.min(120, Math.round((now - previousSeenAt) / 1000)));
    if (videoCount > 0) log.videoSeconds = Math.max(0, Number(log.videoSeconds || 0) + deltaSeconds);
    log.lastSeenAt = nowIso;
    log.videoCount = videoCount;
    log.contentCount = mediaList.length;
    log.deviceName = device.name;
    log.group = device.group || "Standart";
  }

  device.status = "Online";
  device.last = formatDateTime(now);
}

function refreshDeviceStatuses(db) {
  const now = Date.now();
  const onlineWindowMs = 60 * 1000;

  db.devices.forEach((device) => {
    const logs = db.activityLogs
      .filter((log) => Number(log.deviceId) === Number(device.id))
      .map((log) => ({ ...log, lastSeenDate: new Date(log.lastSeenAt) }))
      .filter((log) => !Number.isNaN(log.lastSeenDate.getTime()))
      .sort((a, b) => b.lastSeenDate - a.lastSeenDate);

    if (!logs.length) return;

    const latest = logs[0].lastSeenDate;
    device.status = now - latest.getTime() <= onlineWindowMs ? "Online" : "Offline";
    device.last = formatDateTime(latest);
  });
}

async function getWeatherForCity(city) {
  const normalizedCity = String(city || "Tashkent").trim() || "Tashkent";
  const cacheKey = normalizedCity.toLowerCase();
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < 10 * 60 * 1000) return cached.value;

  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedCity)}&count=1&language=uz&format=json`);
    const geo = await geoResponse.json();
    const place = geo.results?.[0];
    if (!place) throw new Error("Shahar topilmadi");

    const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`);
    const forecast = await forecastResponse.json();
    const current = forecast.current || {};
    const value = {
      city: place.name || normalizedCity,
      temperature: Math.round(Number(current.temperature_2m || 0)),
      description: weatherDescription(current.weather_code),
      updatedAt: new Date().toISOString(),
    };
    weatherCache.set(cacheKey, { savedAt: Date.now(), value });
    return value;
  } catch {
    return {
      city: normalizedCity,
      temperature: null,
      description: "Ob-havo olinmadi",
      updatedAt: new Date().toISOString(),
    };
  }
}

function weatherDescription(code) {
  const value = Number(code);
  if ([0].includes(value)) return "Ochiq";
  if ([1, 2, 3].includes(value)) return "Bulutli";
  if ([45, 48].includes(value)) return "Tuman";
  if ([51, 53, 55, 56, 57].includes(value)) return "Mayda yomg'ir";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(value)) return "Yomg'ir";
  if ([71, 73, 75, 77, 85, 86].includes(value)) return "Qor";
  if ([95, 96, 99].includes(value)) return "Momaqaldiroq";
  return "Ob-havo";
}

function applyTvCheckIn(url, device) {
  const appVersion = String(url.searchParams.get("appVersion") || "").trim();
  if (appVersion) {
    device.apkVersion = appVersion;
    device.appVersion = appVersion;
    if (device.latestApk && String(device.latestApk.version) === appVersion) {
      device.updateStatus = "APK yangilangan";
      if (device.pendingCommand?.command === "update") {
        device.pendingCommand.status = "O'rnatildi";
        device.pendingCommand.doneAt = formatDateTime(new Date());
        device.pendingCommand = null;
      }
    }
  }
}

function formatDateKey(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function createDeviceCode(seed = Date.now()) {
  const raw = Math.abs(Number(seed) || Date.now()).toString(36).toUpperCase().padStart(8, "0").slice(-8);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

function compactDeviceCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeDeviceCode(value) {
  const raw = compactDeviceCode(value);
  if (!raw) return "";
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

function isCompleteDeviceCode(value) {
  return compactDeviceCode(value).length === 8;
}

function extractVersionFromName(name) {
  return String(name || "").match(/(\d+\.\d+(?:\.\d+)?)/)?.[1];
}

function slugify(value) {
  return String(value || "media")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "media";
}

function nextId(items) {
  return Math.max(10000, ...items.map((item) => Number(item.id) || 0)) + 1;
}

function clamp(value, min, max) {
  const number = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, number));
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
