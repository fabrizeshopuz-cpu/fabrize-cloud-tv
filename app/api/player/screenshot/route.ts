import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { updateCastmapState } from "@/lib/serverState";
import { saveUploadedFileToDb } from "@/lib/serverDb";

const uploadDir = path.join(process.cwd(), "data", "uploads");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanCode(value: unknown) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeBase64(value: unknown) {
  return String(value || "").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const imageBase64 = normalizeBase64(body.imageBase64 || body.image || body.dataUrl);
  if (!imageBase64) {
    return NextResponse.json({ ok: false, message: "Screenshot rasmi topilmadi" }, { status: 400 });
  }

  const commandId = String(body.commandId || "");
  const code = cleanCode(body.code || body.deviceCode);
  const rawDeviceId = String(body.deviceId || "").trim();
  const image = Buffer.from(imageBase64, "base64");
  const extension = String(body.mime || "").toLowerCase().includes("png") ? "png" : "jpg";
  const mime = extension === "png" ? "image/png" : "image/jpeg";
  const fileName = `screenshot-${cleanCode(rawDeviceId || code || "device").toLowerCase()}-${Date.now()}.${extension}`;
  const savedToDb = await saveUploadedFileToDb({
    fileName,
    originalName: fileName,
    mime,
    sizeBytes: image.length,
    data: image,
  });
  if (!savedToDb) {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), image);
  }

  const screenshotUrl = `/api/uploads/${encodeURIComponent(fileName)}`;
  const storedAt = new Date().toISOString();

  await updateCastmapState((state) => {
    const device = state.devices.find((item) =>
      item.id === rawDeviceId
      || item.deviceId === rawDeviceId
      || Boolean(code && cleanCode(item.deviceId).endsWith(code))
    );
    if (!device) return;

    state.devices = state.devices.map((item) => item.id === device.id ? {
      ...item,
      screenshotUrl,
      status: "online",
      lastSeen: "Hozir",
      lastHeartbeat: storedAt,
      apkVersion: body.appVersion ? `v${String(body.appVersion).replace(/^v/i, "")}` : item.apkVersion,
    } : item);

    state.commands = state.commands.map((command) => command.id === commandId ? {
      ...command,
      status: "success",
      message: "Screenshot olindi",
    } : command);
  });

  return NextResponse.json({
    ok: true,
    screenshotUrl,
    uploadedAt: storedAt,
    sizeBytes: image.length,
  });
}
