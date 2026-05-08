from dataclasses import dataclass
from pathlib import Path

from PIL import Image


SRC = Path("public/assets/ai-sprite-sheet-alpha.png")
OUT = Path("public/assets/sprites")
ALPHA_THRESHOLD = 8


@dataclass(frozen=True)
class SpriteSpec:
    box: tuple[int, int, int, int]
    padding: int
    target_aspect: float | None = None


SPRITES = {
    # Target aspects match the display sizes in src/main.ts so Phaser does not
    # non-uniformly scale the artwork at runtime.
    "map.png": SpriteSpec((45, 58, 590, 810), 0, 960 / 468),
    "tower-dart.png": SpriteSpec((638, 76, 902, 394), 10, 58 / 68),
    "tower-cannon.png": SpriteSpec((928, 88, 1226, 396), 10, 58 / 68),
    "tower-super.png": SpriteSpec((630, 438, 928, 824), 10, 66 / 78),
    "enemy-red.png": SpriteSpec((50, 884, 270, 1146), 8, 34 / 42),
    "enemy-blue.png": SpriteSpec((342, 864, 612, 1142), 8, 38 / 42),
    "enemy-purple.png": SpriteSpec((625, 888, 932, 1146), 8, 34 / 42),
    "fx-pop.png": SpriteSpec((946, 884, 1242, 1124), 8),
    "coin.png": SpriteSpec((966, 486, 1204, 704), 8, 1),
    "upgrade.png": SpriteSpec((970, 646, 1216, 890), 8, 1),
}


def trim_alpha(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    bounds = mask.getbbox()
    return image.crop(bounds) if bounds else image


def with_padding(image: Image.Image, padding: int) -> Image.Image:
    if padding <= 0:
        return image

    canvas = Image.new("RGBA", (image.width + padding * 2, image.height + padding * 2))
    canvas.paste(image, (padding, padding))
    return canvas


def pad_to_aspect(image: Image.Image, target_aspect: float | None) -> Image.Image:
    if not target_aspect:
        return image

    current_aspect = image.width / image.height
    width, height = image.size
    if current_aspect < target_aspect:
        width = round(height * target_aspect)
    elif current_aspect > target_aspect:
        height = round(width / target_aspect)
    else:
        return image

    canvas = Image.new("RGBA", (width, height))
    canvas.paste(image, ((width - image.width) // 2, (height - image.height) // 2))
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SRC).convert("RGBA")

    for name, spec in SPRITES.items():
        sprite = trim_alpha(sheet.crop(spec.box))
        sprite = with_padding(sprite, spec.padding)
        sprite = pad_to_aspect(sprite, spec.target_aspect)
        sprite.save(OUT / name)
        print(f"{name}: {sprite.width}x{sprite.height}")

    print(f"Wrote {len(SPRITES)} sprites to {OUT}")


if __name__ == "__main__":
    main()
