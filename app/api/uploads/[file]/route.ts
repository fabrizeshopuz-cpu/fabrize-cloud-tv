import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { NextResponse } from "next/server";
import { readUploadedFileFromDb, saveUploadedFileToDb } from "@/lib/serverDb";

const uploadDir = path.join(process.cwd(), "data", "uploads");
const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mimeByExt: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".html": "text/html; charset=utf-8",
};

type ParsedRange = { start: number; end: number; partial: boolean };

function parseRangeHeader(value: string | null, size: number): ParsedRange | null {
  if (!value) return { start: 0, end: Math.max(0, size - 1), partial: false };

  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  let start: number;
  let end: number;

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return { start, end: Math.min(end, size - 1), partial: true };
}

function uploadHeaders(mime: string, size: number, range: ParsedRange) {
  const length = range.end - range.start + 1;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(length),
    "Content-Type": mime,
  });

  if (range.partial) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  }

  return headers;
}

function rangeNotSatisfiable(size: number) {
  return new Response(null, {
    status: 416,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes */${size}`,
    },
  });
}

async function readUploadBuffer(safeFile: string) {
  const dbFile = await readUploadedFileFromDb(safeFile);
  if (dbFile) {
    return {
      data: Buffer.isBuffer(dbFile.data) ? dbFile.data : Buffer.from(dbFile.data),
      mime: dbFile.mime || mimeByExt[path.extname(safeFile).toLowerCase()] || "application/octet-stream",
    };
  }

  const filePath = path.join(uploadDir, safeFile);
  return {
    data: await readFile(filePath),
    mime: mimeByExt[path.extname(safeFile).toLowerCase()] || "application/octet-stream",
  };
}

async function uploadExists(safeFile: string) {
  if (await readUploadedFileFromDb(safeFile)) return true;
  try {
    await stat(path.join(uploadDir, safeFile));
    return true;
  } catch {
    return false;
  }
}

async function ensureMp4Preview(safeFile: string) {
  if (!/\.mov$/i.test(safeFile)) return safeFile;
  const previewFile = safeFile.replace(/\.mov$/i, ".preview.mp4");
  if (await uploadExists(previewFile)) return previewFile;
  if (!ffmpegPath) return safeFile;

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "castmap-preview-"));
  try {
    const source = await readUploadBuffer(safeFile);
    const inputPath = path.join(tempDir, safeFile);
    const outputPath = path.join(tempDir, previewFile);
    await writeFile(inputPath, source.data);
    await execFileAsync(ffmpegPath, [
      "-y",
      "-i", inputPath,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outputPath,
    ], { timeout: 120_000 });

    const preview = await readFile(outputPath);
    const savedToDb = await saveUploadedFileToDb({
      fileName: previewFile,
      originalName: previewFile,
      mime: "video/mp4",
      sizeBytes: preview.length,
      data: preview,
    });
    if (!savedToDb) {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, previewFile), preview);
    }

    return previewFile;
  } catch {
    return safeFile;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function uploadResponse(request: Request, params: Promise<{ file: string }>, headOnly = false) {
  const { file } = await params;
  let safeFile = path.basename(decodeURIComponent(file));
  const preview = new URL(request.url).searchParams.get("preview");
  if (preview === "mp4") safeFile = await ensureMp4Preview(safeFile);

  const dbFile = await readUploadedFileFromDb(safeFile);
  if (dbFile) {
    const data = Buffer.isBuffer(dbFile.data) ? dbFile.data : Buffer.from(dbFile.data);
    const size = data.length;
    const range = parseRangeHeader(request.headers.get("range"), size);
    if (!range) return rangeNotSatisfiable(size);

    const body = headOnly ? null : new Uint8Array(data.subarray(range.start, range.end + 1));
    return new Response(body, {
      status: range.partial ? 206 : 200,
      headers: uploadHeaders(dbFile.mime || mimeByExt[path.extname(safeFile).toLowerCase()] || "application/octet-stream", size, range),
    });
  }

  try {
    const filePath = path.join(uploadDir, safeFile);
    const fileStat = await stat(filePath);
    const range = parseRangeHeader(request.headers.get("range"), fileStat.size);
    if (!range) return rangeNotSatisfiable(fileStat.size);

    return new Response(headOnly ? null : Readable.toWeb(createReadStream(filePath, { start: range.start, end: range.end })) as BodyInit, {
      status: range.partial ? 206 : 200,
      headers: uploadHeaders(mimeByExt[path.extname(safeFile).toLowerCase()] || "application/octet-stream", fileStat.size, range),
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Fayl topilmadi" }, { status: 404 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  return uploadResponse(request, params);
}

export async function HEAD(request: Request, { params }: { params: Promise<{ file: string }> }) {
  return uploadResponse(request, params, true);
}
