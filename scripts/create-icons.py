"""Draw the original launch icon. Requires Pillow when regenerating assets."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

DESTINATION = Path(__file__).resolve().parents[1] / "public" / "icons"
SIZE = 768


def create():
    image = Image.new("RGB", (SIZE, SIZE))
    for y in range(SIZE):
        for x in range(SIZE):
            radius = ((x - SIZE * 0.54) ** 2 + (y - SIZE * 0.46) ** 2) ** 0.5
            glow = max(0.0, 1.0 - radius / (SIZE * 0.61)) ** 1.65
            image.putpixel((x, y), (int(10 + 42 * glow), int(12 + 36 * glow), int(28 + 94 * glow)))
    shape = ImageDraw.Draw(image)
    shape.ellipse((180, 180, 588, 588), outline="#6870b2", width=3)
    shape.ellipse((198, 198, 570, 570), outline="#424879", width=2)
    for x, y in [(189, 288), (564, 251), (575, 456), (265, 534), (286, 212)]:
        shape.line((x - 6, y, x + 6, y), "#9dcfff", width=2)
        shape.line((x, y - 6, x, y + 6), "#9dcfff", width=2)
    bloom = Image.new("RGBA", image.size)
    ImageDraw.Draw(bloom).polygon([(334, 374), (434, 374), (384, 552)], fill="#55aaffc0")
    image = Image.alpha_composite(image.convert("RGBA"), bloom.filter(ImageFilter.GaussianBlur(24)))
    shape = ImageDraw.Draw(image)
    shape.polygon([(353, 413), (415, 413), (384, 537)], fill="#536ef7")
    shape.polygon([(367, 415), (401, 415), (384, 503)], fill="#8fe9fc")
    shape.polygon([(384, 242), (415, 343), (508, 443), (503, 464), (433, 442),
                   (384, 458), (335, 442), (265, 464), (260, 443), (353, 343)],
                  fill="#333b73", outline="#acdcff", width=5)
    shape.polygon([(384, 257), (408, 352), (405, 416), (384, 430), (363, 416), (360, 352)],
                  fill="#838ecc", outline="#bfdcff", width=3)
    shape.polygon([(384, 313), (394, 350), (384, 379), (374, 350)], fill="#bff9ff")
    for x in (-1, 1):
        shape.line([(384 + x * 32, 369), (384 + x * 87, 424)], fill="#79d9ff", width=5)
    return image.convert("RGB")


if __name__ == "__main__":
    DESTINATION.mkdir(parents=True, exist_ok=True)
    icon = create()
    for size, name in [(180, "apple-touch-icon"), (192, "icon-192"), (512, "icon-512"), (512, "maskable-512")]:
        icon.resize((size, size), Image.Resampling.LANCZOS).save(DESTINATION / f"{name}.png", optimize=True)
