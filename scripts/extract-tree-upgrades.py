from pathlib import Path
from PIL import Image

src = Path("public/assets/upgrade-tree-sheet-alpha.png")
out = Path("public/assets/upgrades/tree")
out.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")

names = [
    "dart-rapid", "dart-pierce", "dart-range",
    "cannon-blast", "cannon-heavy", "cannon-reload",
    "super-rapid", "super-beam", "super-aura",
]

size = img.size[0]
cell = size // 3
pad = 40

for index, name in enumerate(names):
    col = index % 3
    row = index // 3
    box = (
        col * cell + pad,
        row * cell + pad,
        (col + 1) * cell - pad,
        (row + 1) * cell - pad,
    )
    img.crop(box).save(out / f"{name}.png")

print(f"Wrote {len(names)} tree upgrade icons to {out}")
