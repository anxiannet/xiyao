#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import json
import math
import os
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "card_data.json"
FRONT_DIR = ROOT / "正面"
BACK_DIR = ROOT / "背面"
TEMPLATE_DIR = ROOT / "模板"
EXPORT_DIR = ROOT / "导出"

BLEED_W, BLEED_H = 815, 1110
TRIM_W, TRIM_H = 744, 1039
BLEED = round((BLEED_W - TRIM_W) / 2)
SAFE = BLEED + 34
DPI = (300, 300)

PAPER = (245, 235, 210)
INK = (54, 42, 32)
GOLD = (190, 150, 76)
DARK_GOLD = (105, 74, 38)
CREAM = (255, 248, 224)

TYPE_COLORS = {
    "minion": {
        "main": (144, 92, 46),
        "light": (216, 154, 83),
        "dark": (82, 50, 28),
        "panel": (238, 218, 184),
    },
    "elite": {
        "main": (150, 157, 156),
        "light": (224, 228, 220),
        "dark": (75, 82, 88),
        "panel": (232, 232, 220),
    },
    "leader": {
        "main": (185, 135, 54),
        "light": (248, 211, 115),
        "dark": (74, 48, 25),
        "panel": (240, 222, 179),
    },
    "artifact": {
        "main": (118, 62, 143),
        "light": (223, 174, 247),
        "dark": (66, 34, 82),
        "panel": (237, 219, 239),
    },
    "land": {
        "main": (152, 118, 58),
        "light": (230, 196, 115),
        "dark": (78, 58, 32),
        "panel": (238, 225, 192),
    },
}

LAND_COLORS = {
    "baiguling": ((205, 199, 186), (104, 105, 112)),
    "maigupo": ((190, 174, 136), (105, 91, 68)),
    "luanzanggang": ((143, 128, 170), (78, 67, 104)),
    "huoyanshan": ((220, 89, 42), (122, 45, 24)),
    "cuiyunshan": ((88, 157, 91), (40, 100, 60)),
    "bajiaodong": ((85, 150, 98), (35, 92, 64)),
    "shituoling": ((196, 150, 72), (103, 77, 40)),
    "shituodong": ((184, 131, 66), (89, 62, 36)),
    "shituoguo": ((184, 132, 68), (88, 62, 36)),
    "pansidong": ((144, 83, 155), (72, 45, 86)),
    "huanghuaguan": ((191, 157, 62), (91, 82, 40)),
    "zhuogouquan": ((94, 150, 150), (45, 88, 92)),
}


def ensure_dirs() -> None:
    for path in (FRONT_DIR, BACK_DIR, TEMPLATE_DIR, EXPORT_DIR):
        path.mkdir(parents=True, exist_ok=True)


def font_candidates() -> list[Path]:
    names = [
        "NotoSerifCJK-Regular.ttc",
        "NotoSerifCJKsc-Regular.otf",
        "NotoSansCJK-Regular.ttc",
        "SourceHanSerifSC-Regular.otf",
        "SourceHanSansSC-Regular.otf",
        "PingFang.ttc",
        "PingFang SC.ttf",
        "STHeiti Light.ttc",
        "STHeiti Medium.ttc",
        "SimHei.ttf",
        "WenQuanYi Micro Hei.ttf",
    ]
    dirs = [
        Path("/System/Library/Fonts"),
        Path("/System/Library/Fonts/Supplemental"),
        Path("/Library/Fonts"),
        Path.home() / "Library/Fonts",
        Path("/usr/share/fonts"),
        Path("/usr/local/share/fonts"),
    ]
    found: list[Path] = []
    for base in dirs:
        if not base.exists():
            continue
        for name in names:
            found.extend(base.rglob(name))
    return found


FONT_PATHS = font_candidates()


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_PATHS:
        try:
            return ImageFont.truetype(str(path), size)
        except Exception:
            continue
    if not getattr(font, "_warned", False):
        print("警告：未找到优先中文字体，使用默认字体，中文显示可能不完整。")
        setattr(font, "_warned", True)
    return ImageFont.load_default()


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_w: int, start: int, min_size: int) -> ImageFont.ImageFont:
    size = start
    while size >= min_size:
        fnt = font(size)
        w, _ = text_size(draw, text, fnt)
        if w <= max_w:
            return fnt
        size -= 2
    return font(min_size)


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    box: tuple[int, int, int, int],
    fnt: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    stroke_fill: tuple[int, int, int] | None = None,
    stroke_width: int = 0,
) -> None:
    x1, y1, x2, y2 = box
    w, h = text_size(draw, text, fnt)
    x = x1 + (x2 - x1 - w) / 2
    y = y1 + (y2 - y1 - h) / 2
    draw.text((x, y), text, font=fnt, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def star_points(cx: float, cy: float, outer: float, inner: float) -> list[tuple[float, float]]:
    pts = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        r = outer if i % 2 == 0 else inner
        pts.append((cx + math.cos(angle) * r, cy + math.sin(angle) * r))
    return pts


def draw_star(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int, fill: tuple[int, int, int], outline: tuple[int, int, int]) -> None:
    pts = star_points(cx, cy, size, size * 0.44)
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=outline, width=max(2, size // 8), joint="curve")
    draw.polygon(star_points(cx - size * 0.16, cy - size * 0.16, size * 0.32, size * 0.14), fill=(255, 244, 178))


def draw_pattern_border(draw: ImageDraw.ImageDraw, palette: dict, slug: str | None = None) -> None:
    main = palette["main"]
    light = palette["light"]
    dark = palette["dark"]

    draw.rounded_rectangle((8, 8, BLEED_W - 8, BLEED_H - 8), radius=44, fill=PAPER, outline=dark, width=8)
    draw.rounded_rectangle((BLEED - 12, BLEED - 12, BLEED_W - BLEED + 12, BLEED_H - BLEED + 12), radius=34, outline=main, width=10)
    draw.rounded_rectangle((SAFE - 12, SAFE - 12, BLEED_W - SAFE + 12, BLEED_H - SAFE + 12), radius=28, outline=light, width=3)

    step = 46
    for x in range(42, BLEED_W - 42, step):
        draw.arc((x - 18, 20, x + 18, 56), 0, 300, fill=main, width=3)
        draw.arc((x - 18, BLEED_H - 56, x + 18, BLEED_H - 20), 180, 480, fill=main, width=3)
    for y in range(70, BLEED_H - 70, step):
        draw.arc((20, y - 18, 56, y + 18), 90, 390, fill=main, width=3)
        draw.arc((BLEED_W - 56, y - 18, BLEED_W - 20, y + 18), 270, 570, fill=main, width=3)

    for x, y, sx, sy in [
        (54, 54, 1, 1),
        (BLEED_W - 54, 54, -1, 1),
        (54, BLEED_H - 54, 1, -1),
        (BLEED_W - 54, BLEED_H - 54, -1, -1),
    ]:
        draw.ellipse((x - 26, y - 26, x + 26, y + 26), fill=dark, outline=light, width=3)
        draw.polygon([(x, y - 20 * sy), (x + 18 * sx, y), (x, y + 20 * sy), (x - 18 * sx, y)], fill=main)
        draw.ellipse((x - 8, y - 8, x + 8, y + 8), fill=light)

    if slug in LAND_COLORS:
        land_main, land_dark = LAND_COLORS[slug]
        draw.rounded_rectangle((BLEED - 18, BLEED - 18, BLEED_W - BLEED + 18, BLEED_H - BLEED + 18), radius=34, outline=land_dark, width=7)
        draw.rounded_rectangle((BLEED - 4, BLEED - 4, BLEED_W - BLEED + 4, BLEED_H - BLEED + 4), radius=30, outline=land_main, width=5)


def gradient_background(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    pix = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(w):
            pix[x, y] = col
    return img


def load_art(card: dict, art_box: tuple[int, int, int, int]) -> tuple[Image.Image, bool]:
    art_path = (ROOT / card["art_path"]).resolve()
    x1, y1, x2, y2 = art_box
    target_w, target_h = x2 - x1, y2 - y1
    if art_path.exists():
        img = Image.open(art_path).convert("RGB")
        scale = max(target_w / img.width, target_h / img.height)
        new_size = (round(img.width * scale), round(img.height * scale))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        left = (img.width - target_w) // 2
        top = (img.height - target_h) // 2
        return img.crop((left, top, left + target_w, top + target_h)), False

    placeholder = gradient_background((target_w, target_h), (244, 235, 210), (215, 195, 156))
    d = ImageDraw.Draw(placeholder)
    d.rounded_rectangle((18, 18, target_w - 18, target_h - 18), radius=28, outline=(174, 139, 74), width=5)
    title_font = fit_font(d, card["name"], target_w - 80, 56, 24)
    draw_centered_text(d, card["name"], (30, target_h // 2 - 80, target_w - 30, target_h // 2 - 20), title_font, INK)
    note_font = font(28)
    draw_centered_text(d, "插画待补", (30, target_h // 2, target_w - 30, target_h // 2 + 60), note_font, (115, 82, 48))
    return placeholder, True


def mask_rounded(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def draw_badge(draw: ImageDraw.ImageDraw, text: str, box: tuple[int, int, int, int], palette: dict) -> None:
    draw.rounded_rectangle(box, radius=18, fill=palette["dark"], outline=palette["light"], width=3)
    fnt = fit_font(draw, text, box[2] - box[0] - 22, 30, 18)
    draw_centered_text(draw, text, box, fnt, CREAM)


def draw_stars(draw: ImageDraw.ImageDraw, stars: int, palette: dict) -> None:
    size = 26 if stars < 3 else 29
    gap = size * 2 + 10
    total = stars * size * 2 + (stars - 1) * 10
    start = (BLEED_W - total) / 2 + size
    cy = 70
    for i in range(stars):
        draw_star(draw, round(start + i * gap), cy, size, palette["light"], palette["dark"])


def draw_title(draw: ImageDraw.ImageDraw, name: str, palette: dict) -> None:
    panel = (90, 96, BLEED_W - 90, 158)
    draw.rounded_rectangle(panel, radius=20, fill=palette["panel"], outline=palette["main"], width=4)
    fnt = fit_font(draw, name, panel[2] - panel[0] - 34, 44, 26)
    draw_centered_text(draw, name, panel, fnt, INK)


def draw_skill(draw: ImageDraw.ImageDraw, text: str, palette: dict, card_type: str) -> None:
    panel = (80, 930, BLEED_W - 80, 1040)
    draw.rounded_rectangle(panel, radius=20, fill=(250, 241, 216), outline=palette["main"], width=4)
    if card_type == "land":
        draw_badge(draw, "地盘", (BLEED_W // 2 - 52, 957, BLEED_W // 2 + 52, 1013), palette)
        return
    display = text or "无技能"
    fnt = fit_font(draw, display, panel[2] - panel[0] - 36, 31, 20)
    draw_centered_text(draw, display, panel, fnt, INK)


def draw_front(card: dict) -> tuple[Image.Image, bool]:
    palette = TYPE_COLORS[card["type"]]
    img = gradient_background((BLEED_W, BLEED_H), (250, 242, 221), (224, 204, 166)).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_pattern_border(draw, palette, card["slug"] if card["type"] == "land" else None)

    if card["stars"]:
        draw_stars(draw, int(card["stars"]), palette)
    else:
        draw_badge(draw, card["display_type"], (BLEED_W // 2 - 64, 42, BLEED_W // 2 + 64, 88), palette)

    draw_title(draw, card["name"], palette)

    art_box = (82, 178, BLEED_W - 82, 902)
    art, missing = load_art(card, art_box)
    shadow = Image.new("RGBA", (art_box[2] - art_box[0], art_box[3] - art_box[1]), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((0, 0, shadow.width, shadow.height), radius=30, fill=(0, 0, 0, 130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    img.paste(shadow.convert("RGB"), (art_box[0] + 6, art_box[1] + 8), shadow)
    img.paste(art, (art_box[0], art_box[1]), mask_rounded(art.size, 30))
    draw.rounded_rectangle(art_box, radius=30, outline=palette["dark"], width=6)
    draw.rounded_rectangle((art_box[0] + 8, art_box[1] + 8, art_box[2] - 8, art_box[3] - 8), radius=24, outline=palette["light"], width=2)

    draw_skill(draw, card.get("skill_text", ""), palette, card["type"])
    return img, missing


def draw_card_back() -> Image.Image:
    img = gradient_background((BLEED_W, BLEED_H), (250, 242, 222), (225, 207, 172)).convert("RGB")
    draw = ImageDraw.Draw(img)
    palette = {"main": GOLD, "light": (232, 198, 116), "dark": DARK_GOLD, "panel": (242, 224, 185)}
    draw_pattern_border(draw, palette)

    center = (BLEED_W // 2, BLEED_H // 2)
    for r, col, width in [(260, (210, 170, 92), 5), (214, DARK_GOLD, 3), (160, (220, 190, 122), 3)]:
        draw.ellipse((center[0] - r, center[1] - r, center[0] + r, center[1] + r), outline=col, width=width)

    # Ancient scroll and mountain-cloud motif.
    draw.rounded_rectangle((190, 350, BLEED_W - 190, 760), radius=36, fill=(242, 226, 188), outline=DARK_GOLD, width=6)
    draw.arc((240, 410, 575, 780), 200, 340, fill=GOLD, width=14)
    draw.polygon([(250, 650), (330, 520), (405, 650)], fill=(180, 142, 76))
    draw.polygon([(360, 650), (460, 470), (570, 650)], fill=(154, 116, 61))
    draw.arc((210, 455, 610, 765), 200, 330, fill=(105, 74, 38), width=4)
    for x in (214, 600):
        draw.ellipse((x - 28, 338, x + 28, 394), fill=(230, 205, 148), outline=DARK_GOLD, width=4)
        draw.ellipse((x - 28, 716, x + 28, 772), fill=(230, 205, 148), outline=DARK_GOLD, width=4)

    title = "占山为王"
    title_font = font(72)
    draw_centered_text(draw, title, (120, 476, BLEED_W - 120, 574), title_font, DARK_GOLD, stroke_fill=(255, 248, 224), stroke_width=2)
    mark_font = font(34)
    draw_centered_text(draw, "夕妖", (120, 586, BLEED_W - 120, 640), mark_font, (126, 84, 42))
    return img


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, dpi=DPI)


def make_contact_sheet(files: Iterable[Path], out: Path) -> None:
    files = list(files)
    thumb_w, thumb_h = 159, 217
    label_h = 32
    cols = 6
    rows = math.ceil(len(files) / cols)
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "white")
    d = ImageDraw.Draw(sheet)
    label_font = font(12)
    for idx, path in enumerate(files):
        card = Image.open(path).convert("RGB")
        card.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = (idx % cols) * thumb_w + (thumb_w - card.width) // 2
        y = (idx // cols) * (thumb_h + label_h)
        sheet.paste(card, (x, y))
        d.text(((idx % cols) * thumb_w + 4, y + thumb_h + 2), path.stem.replace("xiyao_zhanshanweiwang_card_front_", "")[:24], font=label_font, fill=(0, 0, 0))
    save_png(sheet, out)


def main() -> None:
    ensure_dirs()
    cards = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    missing: list[str] = []
    generated: list[Path] = []

    for card in cards:
        front, is_missing = draw_front(card)
        out = FRONT_DIR / f"xiyao_zhanshanweiwang_card_front_{card['slug']}.png"
        save_png(front, out)
        generated.append(out)
        if is_missing:
            missing.append(card["name"])

    back = draw_card_back()
    save_png(back, BACK_DIR / "xiyao_zhanshanweiwang_card_back.png")

    preview_card = {
        "name": "模板预览",
        "slug": "template_preview",
        "type": "leader",
        "display_type": "3星首领",
        "stars": 3,
        "skill_text": "技能短文案显示区域",
        "art_path": "__missing_template_preview__.png",
    }
    preview, _ = draw_front(preview_card)
    save_png(preview, TEMPLATE_DIR / "card_front_template_preview.png")

    make_contact_sheet(generated, EXPORT_DIR / "all_cards_contact_sheet.png")

    report = {
        "front_cards": len(generated),
        "card_back": str(BACK_DIR / "xiyao_zhanshanweiwang_card_back.png"),
        "template_preview": str(TEMPLATE_DIR / "card_front_template_preview.png"),
        "missing_art": missing,
    }
    (EXPORT_DIR / "generation_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
