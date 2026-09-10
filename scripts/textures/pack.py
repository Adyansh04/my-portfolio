"""
Turns the channels Blender rendered into the maps three.js actually wants.

    python3 scripts/textures/pack.py /tmp/tex public/textures

Blender writes albedo / height / roughness as sRGB-encoded PNGs (view transform Standard). The
data channels are linearised back here, then:

  <name>_albedo.webp  colour, as rendered
  <name>_normal.webp  tangent-space normal, Sobel of the height field with wrapped edges
  <name>_orm.webp     R = ambient occlusion, G = roughness, B = metalness

ORM packing is the glTF convention and it is what `aoMap`/`roughnessMap`/`metalnessMap` read out of
a single texture in three, so one fetch feeds three channels instead of three fetches feeding one
each. AO is a cavity map: how far below its own local average a texel sits, which is what actually
darkens the inside of a groove before any real occlusion is computed.

Every gradient is taken with np.roll, so the maps stay seamless — the whole point of baking them on
a 4D torus is lost if the packing puts a seam back in.
"""

import sys
import numpy as np
from PIL import Image, ImageFilter

SRC, DST = (sys.argv[1:3] + ["/tmp/tex", "public/textures"])[:2]

# how much relief each material should claim, and how far the AO reaches
SETTINGS = {
    "concrete": dict(normal=1.4, ao=3.0, size=1024),
    "panel": dict(normal=1.0, ao=2.5, size=1024),
    "deck": dict(normal=2.6, ao=5.0, size=1024),
    "steel": dict(normal=1.1, ao=2.5, size=1024),
    "crate": dict(normal=2.2, ao=4.0, size=512),
    "rubber": dict(normal=1.6, ao=3.0, size=512),
}


def to_linear(a):
    """Undo the sRGB OETF Blender's Standard view transform applied."""
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def load(path, linear):
    a = np.asarray(Image.open(path).convert("L"), dtype=np.float32) / 255.0
    return to_linear(a) if linear else a


def normal_from_height(h, strength):
    # central differences with wrapped edges keep the map tileable
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    n = np.dstack([-dx * strength * h.shape[1] / 64.0, dy * strength * h.shape[0] / 64.0, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return (n * 0.5 + 0.5)


def cavity(h, radius):
    """Local average minus the texel: positive inside dents, negative on ridges."""
    pad = int(radius * 3) + 1
    wide = np.pad(h, pad, mode="wrap")
    blur = np.asarray(Image.fromarray((wide * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius)),
                      dtype=np.float32) / 255.0
    blur = blur[pad:-pad, pad:-pad]
    return np.clip(1.0 - (blur - h) * 2.2, 0.25, 1.0)


def main():
    import os

    os.makedirs(DST, exist_ok=True)
    for name, cfg in SETTINGS.items():
        alb = Image.open(f"{SRC}/{name}_albedo.png").convert("RGB")
        h = load(f"{SRC}/{name}_height.png", linear=True)
        r = load(f"{SRC}/{name}_rough.png", linear=True)
        metal = float(open(f"{SRC}/{name}_metal.txt").read())

        nrm = normal_from_height(h, cfg["normal"])
        ao = cavity(h, cfg["ao"])
        orm = np.dstack([ao, np.clip(r, 0.02, 1.0), np.full_like(ao, metal)])

        size = cfg["size"]
        out = {
            "albedo": alb,
            "normal": Image.fromarray((nrm * 255).astype(np.uint8), "RGB"),
            "orm": Image.fromarray((orm * 255).astype(np.uint8), "RGB"),
        }
        for k, im in out.items():
            if im.size[0] != size:
                im = im.resize((size, size), Image.LANCZOS)
            # normals suffer badly from chroma subsampling; keep their quality high
            im.save(f"{DST}/{name}_{k}.webp", quality=95 if k == "normal" else 86, method=6)
        print(f"{name:9} normal x{cfg['normal']}  ao r{cfg['ao']}  metal {metal}  {size}px")


if __name__ == "__main__":
    main()
