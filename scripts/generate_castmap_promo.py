from __future__ import annotations

import math
import subprocess
import sys
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "videos"
VIDEO_PATH = OUT_DIR / "castmap-promo.mp4"
POSTER_PATH = OUT_DIR / "castmap-promo-poster.png"
AUDIO_PATH = OUT_DIR / "castmap-promo-audio.wav"

WIDTH = 1280
HEIGHT = 720
FPS = 24
DURATION = 45
TOTAL_FRAMES = FPS * DURATION

NAVY = (15, 23, 42)
NAVY_2 = (17, 24, 39)
CARD = (15, 18, 27)
GOLD = (212, 175, 55)
DEEP_GOLD = (184, 134, 11)
BLUE = (59, 130, 246)
GREEN = (34, 197, 94)
WHITE = (245, 245, 245)
MUTED = (161, 161, 170)
RED = (239, 68, 68)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


F_TITLE = font(64, True)
F_HERO = font(46, True)
F_H2 = font(38, True)
F_H3 = font(28, True)
F_BODY = font(22)
F_SMALL = font(16, True)
F_TINY = font(13, True)


def clamp(value: float, low: float = 0, high: float = 1) -> float:
    return max(low, min(high, value))


def ease(value: float) -> float:
    value = clamp(value)
    return 1 - pow(1 - value, 3)


def ease_in_out(value: float) -> float:
    value = clamp(value)
    return value * value * (3 - 2 * value)


def scene_progress(t: float, start: float, end: float) -> float:
    return clamp((t - start) / (end - start))


def fade_scene(t: float, start: float, end: float, fade: float = 0.8) -> float:
    return min(scene_progress(t, start, start + fade), scene_progress(t, end, end - fade))


def mix(a: int, b: int, p: float) -> int:
    return int(a + (b - a) * p)


def with_alpha(color: tuple[int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return color[0], color[1], color[2], alpha


def draw_background(base: Image.Image, t: float) -> None:
    low_w, low_h = 160, 90
    low = Image.new("RGB", (low_w, low_h), NAVY)
    px = low.load()
    for y in range(low_h):
        v = y / low_h
        for x in range(low_w):
            u = x / low_w
            glow1 = math.exp(-((u - 0.28 - 0.04 * math.sin(t * 0.25)) ** 2 + (v - 0.22) ** 2) / 0.035)
            glow2 = math.exp(-((u - 0.78) ** 2 + (v - 0.68 - 0.05 * math.cos(t * 0.2)) ** 2) / 0.05)
            wave = 0.5 + 0.5 * math.sin((u * 7.5 + v * 2.2 + t * 0.12) * math.pi)
            p = 0.12 * glow1 + 0.1 * glow2 + 0.012 * wave
            px[x, y] = (
                min(255, mix(NAVY[0], DEEP_GOLD[0], p)),
                min(255, mix(NAVY[1], DEEP_GOLD[1], p)),
                min(255, mix(NAVY[2], DEEP_GOLD[2], p)),
            )
    base.paste(low.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC))


def add_glow(canvas: Image.Image, xy: tuple[int, int, int, int], color: tuple[int, int, int], radius: int, alpha: int) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(xy, radius=radius, fill=with_alpha(color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(radius))
    canvas.alpha_composite(layer)


def round_rect(
    d: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    radius: int = 18,
    fill: tuple[int, int, int, int] = with_alpha(CARD, 210),
    outline: tuple[int, int, int, int] = (255, 255, 255, 24),
    width: int = 1,
) -> None:
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def center_text(d: ImageDraw.ImageDraw, text: str, y: int, fnt: ImageFont.FreeTypeFont, fill: tuple[int, int, int, int], spacing: int = 0) -> None:
    bbox = d.textbbox((0, 0), text, font=fnt)
    x = (WIDTH - (bbox[2] - bbox[0])) // 2
    d.text((x, y), text, font=fnt, fill=fill)


def draw_particles(canvas: Image.Image, d: ImageDraw.ImageDraw, t: float, count: int = 72) -> None:
    for i in range(count):
        seed = i * 13.37
        x = (math.sin(seed) * 0.5 + 0.5) * WIDTH
        y = (math.cos(seed * 0.73) * 0.5 + 0.5) * HEIGHT
        x = (x + t * (7 + i % 9)) % WIDTH
        y = (y + math.sin(t * 0.4 + seed) * 20) % HEIGHT
        alpha = int(35 + 95 * (0.5 + 0.5 * math.sin(t * 1.5 + seed)))
        r = 1 + (i % 3)
        d.ellipse((x - r, y - r, x + r, y + r), fill=with_alpha(GOLD, alpha))


def draw_logo(d: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1, alpha: int = 255) -> None:
    size = int(106 * scale)
    xy = (cx - size // 2, cy - size // 2, cx + size // 2, cy + size // 2)
    d.rounded_rectangle(xy, radius=int(24 * scale), fill=(10, 10, 10, int(210 * alpha / 255)), outline=with_alpha(GOLD, alpha), width=max(1, int(2 * scale)))
    logo_font = font(int(42 * scale), True)
    bbox = d.textbbox((0, 0), "CM", font=logo_font)
    d.text((cx - (bbox[2] - bbox[0]) / 2, cy - (bbox[3] - bbox[1]) / 2 - int(4 * scale)), "CM", font=logo_font, fill=with_alpha(GOLD, alpha))


def draw_card(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, title: str, value: str, color: tuple[int, int, int] = GOLD, alpha: int = 230) -> None:
    round_rect(d, (x, y, x + w, y + h), 18, fill=(14, 17, 27, alpha), outline=(255, 255, 255, 28))
    d.text((x + 18, y + 17), title, font=F_TINY, fill=with_alpha(MUTED, alpha))
    d.text((x + 18, y + 46), value, font=F_H3, fill=with_alpha(color, alpha))


def draw_dashboard(canvas: Image.Image, d: ImageDraw.ImageDraw, x: int, y: int, scale: float, t: float, alpha: int = 245) -> None:
    w = int(670 * scale)
    h = int(380 * scale)
    add_glow(canvas, (x - 16, y - 16, x + w + 16, y + h + 16), GOLD, 32, int(80 * alpha / 255))
    round_rect(d, (x, y, x + w, y + h), 22, fill=(12, 14, 22, alpha), outline=(255, 255, 255, 36))
    d.text((x + 28, y + 22), "LIVE DASHBOARD", font=font(int(14 * scale), True), fill=with_alpha(GOLD, alpha))
    d.text((x + 28, y + 52), "CASTMAP Command", font=font(int(28 * scale), True), fill=with_alpha(WHITE, alpha))
    for i, c in enumerate([RED, GOLD, GREEN]):
        d.ellipse((x + w - 72 + i * 24, y + 38, x + w - 60 + i * 24, y + 50), fill=with_alpha(c, alpha))

    draw_card(d, x + 28, y + 100, int(140 * scale), int(86 * scale), "ONLINE", "1,216", GREEN, alpha)
    draw_card(d, x + 184, y + 100, int(140 * scale), int(86 * scale), "SCREENS", "1,248", GOLD, alpha)
    draw_card(d, x + 340, y + 100, int(140 * scale), int(86 * scale), "UPTIME", "98.7%", BLUE, alpha)
    draw_card(d, x + 496, y + 100, int(140 * scale), int(86 * scale), "CAMPAIGNS", "24", GOLD, alpha)

    chart_x = x + 32
    chart_y = y + 218
    chart_w = int(380 * scale)
    chart_h = int(120 * scale)
    round_rect(d, (chart_x, chart_y, chart_x + chart_w, chart_y + chart_h), 16, fill=(4, 7, 14, int(alpha * 0.75)), outline=(255, 255, 255, 18))
    points = []
    for i in range(9):
        px = chart_x + 26 + i * (chart_w - 52) / 8
        pulse = 0.5 + 0.5 * math.sin(t * 1.7 + i * 0.8)
        py = chart_y + chart_h - 28 - pulse * (chart_h - 58)
        points.append((px, py))
    for p1, p2 in zip(points, points[1:]):
        d.line((p1, p2), fill=with_alpha(GOLD, alpha), width=max(2, int(3 * scale)))
    for px, py in points:
        d.ellipse((px - 4, py - 4, px + 4, py + 4), fill=with_alpha(GOLD, alpha))

    donut_x = x + int(456 * scale)
    donut_y = y + int(222 * scale)
    d.ellipse((donut_x, donut_y, donut_x + int(92 * scale), donut_y + int(92 * scale)), outline=with_alpha(GREEN, alpha), width=int(12 * scale))
    d.arc((donut_x, donut_y, donut_x + int(92 * scale), donut_y + int(92 * scale)), -90, int(230 + 40 * math.sin(t)), fill=with_alpha(GOLD, alpha), width=int(12 * scale))
    d.text((donut_x + int(25 * scale), donut_y + int(35 * scale)), "98%", font=font(int(18 * scale), True), fill=with_alpha(WHITE, alpha))
    d.text((x + int(568 * scale), y + int(228 * scale)), "Realtime", font=font(int(16 * scale), True), fill=with_alpha(WHITE, alpha))
    for i, label in enumerate(["Sync OK", "Proof received", "APK ready"]):
        yy = y + int(260 * scale) + i * int(25 * scale)
        d.ellipse((x + int(570 * scale), yy + 5, x + int(580 * scale), yy + 15), fill=with_alpha(GREEN if i != 2 else GOLD, alpha))
        d.text((x + int(590 * scale), yy), label, font=font(int(13 * scale), True), fill=with_alpha(MUTED, alpha))


def draw_product(canvas: Image.Image, d: ImageDraw.ImageDraw, t: float, cx: int, cy: int, scale: float, alpha: int = 245) -> None:
    angle = math.sin(t * 1.1) * 0.35
    box_w = int(390 * scale)
    box_h = int(170 * scale)
    depth = int(52 * scale)
    x = cx - box_w // 2
    y = cy - box_h // 2
    add_glow(canvas, (x - 30, y - 40, x + box_w + 70, y + box_h + 70), GOLD, 44, int(95 * alpha / 255))
    top = [(x + depth, y - depth), (x + box_w + depth, y - depth), (x + box_w, y), (x, y)]
    side = [(x + box_w, y), (x + box_w + depth, y - depth), (x + box_w + depth, y + box_h - depth), (x + box_w, y + box_h)]
    d.polygon(top, fill=(25, 25, 25, alpha), outline=with_alpha(GOLD, 80))
    d.polygon(side, fill=(8, 8, 9, alpha), outline=(255, 255, 255, 28))
    d.rounded_rectangle((x, y, x + box_w, y + box_h), radius=int(28 * scale), fill=(6, 7, 9, alpha), outline=with_alpha(GOLD, 110), width=2)
    d.text((x + int(34 * scale), y + int(44 * scale)), "CM", font=font(int(50 * scale), True), fill=with_alpha(GOLD, alpha))
    d.text((x + int(34 * scale), y + int(105 * scale)), "CASTMAP BOX", font=font(int(22 * scale), True), fill=with_alpha(WHITE, alpha))
    d.ellipse((x + box_w - int(48 * scale), y + int(42 * scale), x + box_w - int(28 * scale), y + int(62 * scale)), fill=with_alpha(GREEN, alpha))
    remote_x = x + box_w + int(92 * scale)
    remote_y = y + int(24 * scale)
    d.rounded_rectangle((remote_x, remote_y, remote_x + int(72 * scale), remote_y + int(245 * scale)), radius=int(34 * scale), fill=(7, 8, 11, alpha), outline=(255, 255, 255, 36), width=2)
    d.ellipse((remote_x + int(18 * scale), remote_y + int(18 * scale), remote_x + int(54 * scale), remote_y + int(54 * scale)), fill=with_alpha(GOLD, alpha))
    for i in range(9):
        bx = remote_x + int(17 * scale) + (i % 3) * int(18 * scale)
        by = remote_y + int(78 * scale) + (i // 3) * int(25 * scale)
        d.rounded_rectangle((bx, by, bx + int(14 * scale), by + int(14 * scale)), radius=4, fill=(255, 255, 255, 34))
    d.ellipse((x - int(70 * scale), y + box_h + int(52 * scale), x + box_w + int(240 * scale), y + box_h + int(104 * scale)), fill=(212, 175, 55, 38))


def draw_monitoring_wall(canvas: Image.Image, d: ImageDraw.ImageDraw, t: float, p: float) -> None:
    start_x = int(120 - 80 * (1 - ease(p)))
    start_y = 120
    for row in range(2):
        for col in range(4):
            idx = row * 4 + col
            x = start_x + col * 270
            y = start_y + row * 190
            delay = idx * 0.045
            local = ease(clamp((p - delay) / 0.55))
            y += int((1 - local) * 70)
            alpha = int(235 * local)
            round_rect(d, (x, y, x + 230, y + 140), 16, fill=(8, 10, 17, alpha), outline=(255, 255, 255, int(36 * local)))
            d.rectangle((x + 12, y + 14, x + 218, y + 100), fill=(10, 20, 28, alpha))
            if idx % 3 == 0:
                d.rectangle((x + 12, y + 14, x + 218, y + 100), fill=(24, 34, 24, alpha))
                d.text((x + 34, y + 45), "PROMO", font=font(24, True), fill=with_alpha(GOLD, alpha))
            elif idx % 3 == 1:
                d.rectangle((x + 12, y + 14, x + 218, y + 100), fill=(15, 24, 43, alpha))
                d.line((x + 36, y + 78, x + 78, y + 48, x + 120, y + 66, x + 176, y + 32), fill=with_alpha(BLUE, alpha), width=3)
            else:
                d.rectangle((x + 12, y + 14, x + 218, y + 100), fill=(31, 23, 12, alpha))
                d.text((x + 42, y + 46), "MENU", font=font(24, True), fill=with_alpha(WHITE, alpha))
            status = GREEN if idx != 5 else RED
            d.ellipse((x + 16, y + 112, x + 28, y + 124), fill=with_alpha(status, alpha))
            d.text((x + 38, y + 108), "ONLINE" if idx != 5 else "OFFLINE", font=F_TINY, fill=with_alpha(status, alpha))


def draw_playlist(d: ImageDraw.ImageDraw, t: float, p: float) -> None:
    timeline = (360, 482, 930, 538)
    round_rect(d, timeline, 18, fill=(6, 8, 14, 230), outline=(255, 255, 255, 35))
    d.text((380, 453), "SMART SCHEDULE", font=F_SMALL, fill=with_alpha(GOLD, 240))
    for i in range(5):
        x = 380 + i * 104
        d.rounded_rectangle((x, 494, x + 82, 526), radius=10, fill=with_alpha(GOLD if i % 2 == 0 else BLUE, 190), outline=(255, 255, 255, 24))
    for i, label in enumerate(["Video", "Image", "Stream", "Promo"]):
        local = ease(clamp((p - i * 0.12) / 0.55))
        x = int(150 + i * 215 + (1 - local) * (-180 + i * 120))
        y = int(170 + math.sin(t * 1.2 + i) * 20 + (1 - local) * -80)
        round_rect(d, (x, y, x + 170, y + 210), 18, fill=(11, 14, 22, 235), outline=(255, 255, 255, 34))
        d.rectangle((x + 16, y + 18, x + 154, y + 110), fill=(20 + i * 8, 26, 42, 240))
        d.text((x + 22, y + 128), label, font=F_H3, fill=with_alpha(WHITE, 240))
        d.text((x + 22, y + 166), "00:15", font=F_SMALL, fill=with_alpha(GOLD, 240))


def draw_analytics(canvas: Image.Image, d: ImageDraw.ImageDraw, t: float, p: float) -> None:
    metrics = [("2.4M", "IMPRESSIONS", GOLD), ("98.7%", "UPTIME", GREEN), ("1248", "ACTIVE SCREENS", BLUE)]
    for i, (value, label, color) in enumerate(metrics):
        x = 115 + i * 360
        y = int(160 + (1 - ease(clamp((p - i * 0.08) / 0.5))) * 80)
        add_glow(canvas, (x - 10, y - 10, x + 300, y + 170), color, 26, 38)
        round_rect(d, (x, y, x + 300, y + 160), 20, fill=(10, 13, 21, 238), outline=(255, 255, 255, 34))
        d.text((x + 28, y + 32), value, font=F_TITLE, fill=with_alpha(color, 245))
        d.text((x + 30, y + 108), label, font=F_SMALL, fill=with_alpha(MUTED, 245))
    chart_x, chart_y = 170, 420
    round_rect(d, (chart_x, chart_y, chart_x + 940, chart_y + 170), 22, fill=(7, 9, 16, 235), outline=(255, 255, 255, 30))
    last = None
    for i in range(28):
        x = chart_x + 34 + i * 32
        wave = 0.5 + 0.5 * math.sin(i * 0.55 + t * 1.8)
        y = chart_y + 130 - wave * 92 * ease(p)
        if last:
            d.line((last[0], last[1], x, y), fill=with_alpha(GOLD, 230), width=4)
        last = (x, y)
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=with_alpha(GOLD, 230))


def render_frame(index: int) -> Image.Image:
    t = index / FPS
    base = Image.new("RGB", (WIDTH, HEIGHT), NAVY)
    draw_background(base, t)
    frame = base.convert("RGBA")
    d = ImageDraw.Draw(frame)
    draw_particles(frame, d, t)

    # subtle digital wave
    for i in range(12):
        y = int(120 + i * 42 + math.sin(t * 0.7 + i) * 9)
        d.line((0, y, WIDTH, y + int(math.sin(t + i) * 18)), fill=(212, 175, 55, 12), width=1)

    if t < 4:
        a = int(255 * fade_scene(t, 0, 4))
        scale = 0.85 + 0.12 * ease(scene_progress(t, 0, 4))
        add_glow(frame, (WIDTH // 2 - 130, HEIGHT // 2 - 150, WIDTH // 2 + 130, HEIGHT // 2 + 110), GOLD, 60, int(95 * a / 255))
        draw_logo(d, WIDTH // 2, 285, scale, a)
        center_text(d, "CASTMAP", 365, F_TITLE, with_alpha(WHITE, a))
        center_text(d, "CONTROL EVERY SCREEN", 446, F_H2, with_alpha(GOLD, a))

    if 3.4 <= t < 10.4:
        p = scene_progress(t, 4, 10)
        a = int(255 * fade_scene(t, 3.4, 10.4))
        x = int(315 + math.sin(t * 0.65) * 28)
        y = int(150 + (1 - ease(p)) * 90)
        draw_dashboard(frame, d, x, y, 0.92, t, a)
        d.text((88, 595), "Barcha ekranlaringizni bitta platformadan boshqaring", font=F_H2, fill=with_alpha(WHITE, a))

    if 10 <= t < 16.5:
        p = scene_progress(t, 10, 16)
        a = int(255 * fade_scene(t, 10, 16.5))
        draw_product(frame, d, t, WIDTH // 2 - 70, 328, 0.92, a)
        center_text(d, "Android TV  •  Samsung  •  LG  •  CASTMAP BOX", 590, F_H2, with_alpha(WHITE, a))
        for i in range(5):
            sx = 132 + i * 190
            sy = 112 + int(math.sin(t * 0.8 + i) * 8)
            round_rect(d, (sx, sy, sx + 120, sy + 68), 12, fill=(9, 13, 22, int(150 * p)), outline=(212, 175, 55, int(70 * p)))

    if 16 <= t < 24.5:
        p = scene_progress(t, 16, 24)
        a = int(255 * fade_scene(t, 16, 24.5))
        d.text((82, 62), "Real-time monitoring", font=F_TITLE, fill=with_alpha(WHITE, a))
        d.text((88, 136), "TV status, screenshots, heartbeat, campaign proof", font=F_BODY, fill=with_alpha(MUTED, a))
        draw_monitoring_wall(frame, d, t, p)

    if 24 <= t < 30.8:
        p = scene_progress(t, 24, 30)
        a = int(255 * fade_scene(t, 24, 30.8))
        d.text((94, 68), "Media Library  •  Smart Scheduling  •  Automation", font=F_H2, fill=with_alpha(WHITE, a))
        draw_playlist(d, t, p)

    if 30 <= t < 36.8:
        p = scene_progress(t, 30, 36)
        a = int(255 * fade_scene(t, 30, 36.8))
        d.text((96, 72), "Analytics that prove every campaign", font=F_H2, fill=with_alpha(WHITE, a))
        draw_analytics(frame, d, t, p)

    if t >= 36:
        p = scene_progress(t, 36, 45)
        a = int(255 * fade_scene(t, 36, 45, 1.2))
        x = int(110 - 60 * (1 - ease(p)))
        draw_dashboard(frame, d, x, 152, 0.72, t, a)
        draw_product(frame, d, t, 910, 328, 0.68, a)
        add_glow(frame, (430, 56, 850, 210), GOLD, 72, int(90 * p))
        center_text(d, "CASTMAP", 92, F_TITLE, with_alpha(WHITE, a))
        center_text(d, "Retail Media Infrastructure Platform", 174, F_H2, with_alpha(GOLD, a))
        d.rounded_rectangle((486, 592, 796, 652), radius=22, fill=with_alpha(GOLD, a), outline=with_alpha(WHITE, 32))
        cta = "Demo so'rash"
        bbox = d.textbbox((0, 0), cta, font=F_H3)
        d.text((641 - (bbox[2] - bbox[0]) / 2, 607), cta, font=F_H3, fill=(8, 8, 8, a))
        center_text(d, "castmap.uz", 665, F_BODY, with_alpha(WHITE, a))

    return frame.convert("RGB")


def generate_audio() -> None:
    rate = 44100
    samples = rate * DURATION
    hits = [0, 4, 10, 16, 24, 30, 36]
    with wave.open(str(AUDIO_PATH), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        frames = bytearray()
        for n in range(samples):
            t = n / rate
            pad = 0.12 * math.sin(2 * math.pi * 55 * t) + 0.05 * math.sin(2 * math.pi * 110 * t)
            shimmer = 0.025 * math.sin(2 * math.pi * (220 + 24 * math.sin(t * 0.2)) * t)
            pulse = 0.025 * math.sin(2 * math.pi * 330 * t) * (0.5 + 0.5 * math.sin(2 * math.pi * 0.5 * t))
            hit = 0.0
            for cut in hits:
                dt = t - cut
                if 0 <= dt <= 0.65:
                    hit += 0.55 * math.sin(2 * math.pi * 48 * dt) * math.exp(-6.0 * dt)
            value = max(-0.92, min(0.92, pad + shimmer + pulse + hit))
            s = int(value * 32767)
            frames += int(s).to_bytes(2, "little", signed=True)
            frames += int(s).to_bytes(2, "little", signed=True)
        wav.writeframes(frames)


def ffmpeg_path() -> str:
    try:
        result = subprocess.run(["node", "-e", "process.stdout.write(require('ffmpeg-static'))"], cwd=ROOT, check=True, capture_output=True, text=True)
        path = result.stdout.strip()
        if path:
            return path
    except Exception:
        pass
    return "ffmpeg"


def encode_video() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_audio()
    ffmpeg = ffmpeg_path()
    cmd = [
        ffmpeg,
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        str(AUDIO_PATH),
        "-vf",
        "scale=1920:1080:flags=lanczos",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-shortest",
        str(VIDEO_PATH),
    ]
    process = subprocess.Popen(cmd, cwd=ROOT, stdin=subprocess.PIPE)
    assert process.stdin is not None
    poster = None
    for i in range(TOTAL_FRAMES):
        frame = render_frame(i)
        if i == FPS * 37:
            poster = frame.copy()
        process.stdin.write(frame.tobytes())
        if i % FPS == 0:
            sys.stdout.write(f"\rRendering {i // FPS:02d}/{DURATION}s")
            sys.stdout.flush()
    process.stdin.close()
    code = process.wait()
    if code != 0:
        raise RuntimeError(f"ffmpeg exited with code {code}")
    if poster is None:
        poster = render_frame(FPS * 37)
    poster.resize((1920, 1080), Image.Resampling.LANCZOS).save(POSTER_PATH, quality=94)
    try:
        AUDIO_PATH.unlink()
    except OSError:
        pass
    print(f"\nSaved {VIDEO_PATH}")
    print(f"Saved {POSTER_PATH}")


if __name__ == "__main__":
    encode_video()
