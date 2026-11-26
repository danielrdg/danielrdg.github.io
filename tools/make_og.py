import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
LACQUER, GOLD = (0x3A, 0x13, 0x0F), (0xD9, 0xA4, 0x41)
LIGHT, PINK, CREAM = (0xFF, 0xD4, 0x5C), (0xFF, 0x5F, 0xA2), (0xF3, 0xE6, 0xCF)


def main(out):
    img = Image.new("RGB", (W, H), LACQUER)
    d = ImageDraw.Draw(img)
    lattice = tuple(c * 55 // 100 + l * 45 // 100 for c, l in zip(LACQUER, GOLD))
    for x in range(0, W, 50):
        d.line([(x, 0), (x, H)], fill=lattice, width=1)
    for y in range(0, H, 50):
        d.line([(0, y), (W, y)], fill=lattice, width=1)

    avatar = Image.open(ROOT / "assets/img/avatar-480.png").convert("RGBA")
    ax, ay = 60, (H - avatar.height) // 2
    d.rectangle([ax - 10, ay - 10, ax + avatar.width + 9, ay + avatar.height + 9], fill=GOLD)
    img.paste(avatar, (ax, ay), avatar)

    fonts = ROOT / "assets/fonts"
    name_font = ImageFont.truetype(str(fonts / "PixelifySans[wght].ttf"), 84)
    try:
        name_font.set_variation_by_axes([700])
    except Exception:
        pass
    tag_font = ImageFont.truetype(str(fonts / "Silkscreen-Regular.ttf"), 24)
    url_font = ImageFont.truetype(str(fonts / "Silkscreen-Regular.ttf"), 22)

    tx = ax + avatar.width + 60
    d.text((tx, 215), "Daniel", font=name_font, fill=LIGHT)
    d.text((tx, 305), "Rodrigues", font=name_font, fill=LIGHT)
    d.text((tx, 425), "Multi-agent orchestration", font=tag_font, fill=PINK)
    d.text((tx, 460), "& AI harness", font=tag_font, fill=PINK)
    d.text((tx, 535), "danielrdg.github.io", font=url_font, fill=CREAM)

    img.save(out, optimize=True)


if __name__ == "__main__":
    main(sys.argv[1])
