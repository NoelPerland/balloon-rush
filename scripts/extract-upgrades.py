from pathlib import Path
from PIL import Image

src = Path("public/assets/upgrade-sheet-alpha.png")
out = Path("public/assets/upgrades")
out.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
crops = {
    "upgrade-dart.png": (35, 370, 410, 880),
    "upgrade-cannon.png": (445, 370, 825, 880),
    "upgrade-super.png": (850, 370, 1230, 880),
}

for name, box in crops.items():
    img.crop(box).save(out / name)

print(f"Wrote {len(crops)} upgrade icons to {out}")
