"""
Bakes the facility's tileable PBR texture library.

    blender --background --factory-startup --python scripts/blender/textures.py -- <outdir>

Everything in the world was a flat colour with a constant roughness, which is why it read as
plastic no matter how well it was lit. These are the real thing: procedural industrial materials
authored as Blender shader graphs and rendered out one channel at a time.

## Seamless tiling

Blender's noise is 3D and does not tile in UV. The fix is to wrap the UV square onto a torus and
sample 4D noise on it: u,v -> (cos a, sin a, cos b) + W = sin b. Opposite edges of the square are
then the same point in 4D, so every map tiles perfectly in both axes with no mirroring or blending.

## Why render rather than bake

`bpy.ops.object.bake` needs a bake target image, a UV layout and a lit scene, and fails in a dozen
quiet ways headlessly. An orthographic camera framing a UV-mapped plane through an Emission shader
is exact, noiseless at one sample, and cannot mis-register. Each channel is one render.

Channels come out sRGB-encoded (view transform Standard); `scripts/textures/pack.py` linearises the
data ones and assembles the normal and ORM maps.
"""

import sys
import bpy
from math import pi
from mathutils import Vector

OUT = (sys.argv[sys.argv.index("--") + 1:] or ["/tmp/textures"])[0]
RES = 1024


# --------------------------------------------------------------------------- scene


def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 1
    sc.cycles.use_denoising = False
    sc.cycles.device = "CPU"
    sc.render.resolution_x = sc.render.resolution_y = RES
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    # a unit plane in the XY square, and an ortho camera framing exactly that square
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0))
    plane = bpy.context.object
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 2.0
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (0, 0, 4)
    sc.collection.objects.link(cam)
    sc.camera = cam
    return plane


# --------------------------------------------------------------------------- nodes


class G:
    """Thin wrapper so a material graph reads like the maths it is."""

    def __init__(self, mat):
        self.n = mat.node_tree.nodes
        self.l = mat.node_tree.links
        self.n.clear()

    def new(self, kind, **kw):
        node = self.n.new(kind)
        for k, v in kw.items():
            if "." in k:
                a, b = k.split(".")
                getattr(node, a)[b].default_value = v
            else:
                setattr(node, k, v)
        return node

    def link(self, a, ao, b, bi):
        self.l.new(a.outputs[ao], b.inputs[bi])

    def math(self, op, a, b=None, clamp=False):
        m = self.new("ShaderNodeMath", operation=op, use_clamp=clamp)
        self._plug(a, m, 0)
        if b is not None:
            self._plug(b, m, 1)
        return m

    def _plug(self, v, node, idx):
        if isinstance(v, tuple) and hasattr(v[0], "outputs"):
            self.l.new(v[0].outputs[v[1]], node.inputs[idx])
        elif isinstance(v, tuple):
            node.inputs[idx].default_value = v if len(v) == 4 else (*v, 1.0)
        elif hasattr(v, "outputs"):
            self.l.new(v.outputs[0], node.inputs[idx])
        else:
            node.inputs[idx].default_value = v

    def mix(self, a, b, fac, kind="FLOAT"):
        m = self.new("ShaderNodeMix", data_type=kind)
        self._plug(fac, m, 0)
        off = 2 if kind == "FLOAT" else 6
        self._plug(a, m, off)
        self._plug(b, m, off + 1)
        return m

    def ramp(self, src, stops):
        r = self.new("ShaderNodeValToRGB")
        self._plug(src, r, 0)
        el = r.color_ramp.elements
        while len(el) > 1:
            el.remove(el[-1])
        el[0].position, el[0].color = stops[0][0], (*stops[0][1], 1)
        for pos, col in stops[1:]:
            e = el.new(pos)
            e.color = (*col, 1)
        return r

    def wrap(self, su, sv=None, rot=0.0):
        """UV square -> a torus in 4D, so noise sampled on it tiles in both axes.
        Separate u and v scales stretch the pattern — brushing, corrugation, wear direction."""
        sv = su if sv is None else sv
        uv = self.new("ShaderNodeTexCoord")
        sep = self.new("ShaderNodeSeparateXYZ")
        self.link(uv, "UV", sep, "Vector")
        a = self.math("MULTIPLY", (sep, 0), 2 * pi)
        b = self.math("MULTIPLY", (sep, 1), 2 * pi)
        if rot:
            a = self.math("ADD", a, rot)
        ca = self.math("MULTIPLY", self.math("COSINE", a), su)
        sa = self.math("MULTIPLY", self.math("SINE", a), su)
        cb = self.math("MULTIPLY", self.math("COSINE", b), sv)
        sb = self.math("MULTIPLY", self.math("SINE", b), sv)
        comb = self.new("ShaderNodeCombineXYZ")
        self._plug(ca, comb, 0)
        self._plug(sa, comb, 1)
        self._plug(cb, comb, 2)
        return comb, sb

    def noise(self, scale, detail=8.0, rough=0.55, distortion=0.0, rot=0.0, lacunarity=2.0, scale_v=None):
        vec, w = self.wrap(scale, scale_v, rot)
        n = self.new("ShaderNodeTexNoise", noise_dimensions="4D")
        self.l.new(vec.outputs[0], n.inputs["Vector"])
        self.l.new(w.outputs[0], n.inputs["W"])
        n.inputs["Scale"].default_value = 1.0
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = rough
        n.inputs["Lacunarity"].default_value = lacunarity
        n.inputs["Distortion"].default_value = distortion
        return n

    def voronoi(self, scale, feature="F1", randomness=1.0, rot=0.0, scale_v=None):
        vec, w = self.wrap(scale, scale_v, rot)
        v = self.new("ShaderNodeTexVoronoi", voronoi_dimensions="4D", feature=feature)
        self.l.new(vec.outputs[0], v.inputs["Vector"])
        self.l.new(w.outputs[0], v.inputs["W"])
        v.inputs["Scale"].default_value = 1.0
        v.inputs["Randomness"].default_value = randomness
        return v

    def stripes(self, count, axis=1, sharp=0.5):
        """A tileable bar pattern — ribs, brushing, corrugation."""
        uv = self.new("ShaderNodeTexCoord")
        sep = self.new("ShaderNodeSeparateXYZ")
        self.link(uv, "UV", sep, "Vector")
        s = self.math("MULTIPLY", (sep, axis), float(count))
        s = self.math("FRACT", s)
        s = self.math("SUBTRACT", s, 0.5)
        s = self.math("ABSOLUTE", s)
        return self.math("SMOOTH_MIN", s, sharp)


def emit(g, src, out_socket=0):
    """Point the material at one channel and nothing else."""
    e = g.new("ShaderNodeEmission")
    e.inputs["Strength"].default_value = 1.0
    if isinstance(src, tuple):
        g.l.new(src[0].outputs[src[1]], e.inputs["Color"])
    elif hasattr(src, "outputs"):
        g.l.new(src.outputs[out_socket], e.inputs["Color"])
    else:
        e.inputs["Color"].default_value = (*src, 1) if isinstance(src, tuple) else (src, src, src, 1)
    o = g.new("ShaderNodeOutputMaterial")
    g.l.new(e.outputs[0], o.inputs["Surface"])


# --------------------------------------------------------------------------- materials
#
# Each returns {channel: socket}. `albedo` is colour; the rest are scalar fields that
# pack.py turns into a normal map and an ORM (occlusion / roughness / metal) atlas.


def m_concrete(g):
    """Sealed warehouse floor: aggregate under a worn polish, with traffic paths."""
    agg = g.voronoi(180, feature="F1", randomness=0.9)          # exposed stone
    grain = g.noise(320, detail=2, rough=0.5)                   # cement grain
    blotch = g.noise(5, detail=6, rough=0.62)                   # pour variation / staining
    paths = g.noise(2.2, detail=3, rough=0.4, scale_v=7.0)      # stretched: where wheels run
    pits = g.voronoi(70, feature="F1", randomness=1.0)

    dark = g.ramp(blotch, [(0.32, (0.106, 0.125, 0.152)), (0.72, (0.163, 0.184, 0.212))])
    speck = g.mix(dark, g.ramp(agg, [(0.35, (0.20, 0.21, 0.23)), (0.62, (0.30, 0.31, 0.33))]),
                  g.math("MULTIPLY", g.math("SMOOTH_MAX", g.math("SUBTRACT", (agg, 0), 0.55), 0.0), 2.4), "RGBA")
    # polished traffic lanes read lighter and much smoother
    polish = g.ramp(paths, [(0.40, (0, 0, 0)), (0.62, (1, 1, 1))])
    lane = g.ramp(paths, [(0.40, (0.20, 0.22, 0.25)), (0.66, (0.30, 0.32, 0.35))])
    albedo = g.mix((speck, 2), (lane, 0), g.math("MULTIPLY", (polish, 0), 0.55), "RGBA")

    height = g.mix(g.math("MULTIPLY", (grain, 0), 0.25),
                   g.math("MULTIPLY", g.math("SUBTRACT", 1.0, (pits, 0)), 0.9), 0.35)
    rough = g.mix(g.math("ADD", g.math("MULTIPLY", (blotch, 0), 0.18), 0.70),
                  0.38, g.math("MULTIPLY", (polish, 0), 0.85))
    return {"albedo": albedo, "height": height, "rough": rough, "metal": 0.0}


def m_panel(g):
    """Painted steel wall panel: orange peel, a faint roll direction, scattered chipping."""
    peel = g.noise(140, detail=3, rough=0.5)
    roll = g.noise(24, detail=2, rough=0.4, scale_v=260.0)
    mottle = g.noise(9, detail=5, rough=0.55)
    chips = g.voronoi(46, feature="F1", randomness=1.0)
    chipmask = g.ramp(chips, [(0.03, (1, 1, 1)), (0.09, (0, 0, 0))])

    base = g.ramp(mottle, [(0.3, (0.128, 0.152, 0.190)), (0.75, (0.176, 0.203, 0.243))])
    albedo = g.mix(base, (0.36, 0.37, 0.38, 1), g.math("MULTIPLY", (chipmask, 0), 0.75, clamp=True), "RGBA")
    height = g.mix(g.math("MULTIPLY", (peel, 0), 0.55), g.math("MULTIPLY", (roll, 0), 0.2), 0.35)
    rough = g.mix(g.math("ADD", g.math("MULTIPLY", (peel, 0), 0.22), 0.34),
                  0.78, g.math("MULTIPLY", (chipmask, 0), 0.9, clamp=True))
    return {"albedo": albedo, "height": height, "rough": rough, "metal": 0.0}


def m_deck(g):
    """Ribbed metal roof deck seen from below, with dust settled in the flutes."""
    ribs = g.stripes(6, axis=1, sharp=0.12)
    fine = g.stripes(48, axis=1, sharp=0.02)
    dust = g.noise(11, detail=6, rough=0.6)
    streak = g.noise(4, detail=4, rough=0.5, scale_v=90.0)

    shade = g.ramp(ribs, [(0.0, (1, 1, 1)), (0.5, (0.34, 0.34, 0.34))])
    base = g.ramp(dust, [(0.3, (0.098, 0.113, 0.137)), (0.7, (0.145, 0.164, 0.196))])
    grimy = g.mix((base, 0), (0.06, 0.07, 0.09, 1), g.math("MULTIPLY", (streak, 0), 0.35), "RGBA")
    # the flutes sit in their own shadow even before any light reaches them
    albedo = g.mix((0.0, 0.0, 0.0, 1), (grimy, 2), (shade, 0), "RGBA")
    height = g.mix(g.math("MULTIPLY", (ribs, 0), 2.2, clamp=True), g.math("MULTIPLY", (fine, 0), 0.35), 0.2)
    rough = g.math("ADD", g.math("MULTIPLY", (dust, 0), 0.2), 0.62)
    return {"albedo": albedo, "height": height, "rough": rough, "metal": 0.35}


def m_steel(g):
    """Brushed / galvanised structural steel for racking, trim and gantries."""
    brush = g.noise(6, detail=2, rough=0.4, scale_v=520.0)
    spangle = g.voronoi(26, feature="F1", randomness=1.0)
    scratch = g.voronoi(90, feature="DISTANCE_TO_EDGE", randomness=1.0, scale_v=520.0)
    grime = g.noise(7, detail=6, rough=0.6)

    base = g.ramp(spangle, [(0.25, (0.34, 0.36, 0.39)), (0.8, (0.52, 0.55, 0.58))])
    albedo = g.mix(base, (0.17, 0.18, 0.20, 1), g.math("MULTIPLY", g.math("SUBTRACT", 1.0, (grime, 0)), 0.45), "RGBA")
    height = g.mix(g.math("MULTIPLY", (brush, 0), 0.35),
                   g.math("MULTIPLY", g.math("SUBTRACT", 1.0, (scratch, 0)), 0.6), 0.4)
    rough = g.mix(g.math("ADD", g.math("MULTIPLY", (brush, 0), 0.16), 0.22),
                  0.62, g.math("MULTIPLY", g.math("SUBTRACT", 1.0, (grime, 0)), 0.7, clamp=True))
    return {"albedo": albedo, "height": height, "rough": rough, "metal": 0.9}


def m_crate(g):
    """Moulded plastic tote: ribs, scuffed corners, a matte finish that has seen a forklift."""
    ribs = g.stripes(9, axis=0, sharp=0.06)
    cross = g.stripes(5, axis=1, sharp=0.05)
    scuff = g.voronoi(30, feature="F1", randomness=1.0)
    grain = g.noise(180, detail=2, rough=0.5)

    base = g.ramp(scuff, [(0.2, (0.30, 0.19, 0.09)), (0.75, (0.40, 0.25, 0.12))])
    albedo = g.mix(base, (0.46, 0.34, 0.22, 1), g.math("MULTIPLY", (grain, 0), 0.28), "RGBA")
    height = g.mix(g.math("MAXIMUM", g.math("MULTIPLY", (ribs, 0), 2.0, clamp=True),
                          g.math("MULTIPLY", (cross, 0), 1.6, clamp=True)),
                   g.math("MULTIPLY", (grain, 0), 0.3), 0.25)
    rough = g.math("ADD", g.math("MULTIPLY", (grain, 0), 0.18), 0.52)
    return {"albedo": albedo, "height": height, "rough": rough, "metal": 0.0}


def m_rubber(g):
    """Pebbled rubber: wheels, mats, the bumpers on everything that moves."""
    peb = g.voronoi(48, feature="F1", randomness=1.0)
    fine = g.noise(240, detail=2, rough=0.5)
    base = g.ramp(peb, [(0.15, (0.055, 0.060, 0.068)), (0.7, (0.088, 0.094, 0.104))])
    albedo = g.mix(base, (0.03, 0.03, 0.035, 1), g.math("MULTIPLY", (fine, 0), 0.25), "RGBA")
    height = g.mix(g.math("MULTIPLY", g.math("SUBTRACT", 1.0, (peb, 0)), 1.0),
                   g.math("MULTIPLY", (fine, 0), 0.3), 0.3)
    rough = g.math("SUBTRACT", 0.94, g.math("MULTIPLY", (peb, 0), 0.1))
    return {"albedo": albedo, "height": height, "rough": rough, "metal": 0.0}


MATERIALS = {
    "concrete": m_concrete,
    "panel": m_panel,
    "deck": m_deck,
    "steel": m_steel,
    "crate": m_crate,
    "rubber": m_rubber,
}


# --------------------------------------------------------------------------- render


def render(plane, name, build):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    g = G(mat)
    ch = build(g)
    out = g.new("ShaderNodeOutputMaterial")
    e = g.new("ShaderNodeEmission")
    e.inputs["Strength"].default_value = 1.0
    g.l.new(e.outputs[0], out.inputs["Surface"])
    plane.data.materials.clear()
    plane.data.materials.append(mat)

    for key in ("albedo", "height", "rough"):
        src = ch[key]
        for lk in list(e.inputs["Color"].links):
            g.l.remove(lk)
        if isinstance(src, (int, float)):
            e.inputs["Color"].default_value = (src, src, src, 1)
        else:
            # ShaderNodeMix carries one output per data type and only the matching one is
            # driven; taking Color from a Float mix silently emits white, which is exactly how
            # every height and roughness map came out flat the first time round
            idx = (2 if src.data_type == "RGBA" else 0) if src.bl_idname == "ShaderNodeMix" else 0
            g.l.new(src.outputs[idx], e.inputs["Color"])
        bpy.context.scene.render.filepath = f"{OUT}/{name}_{key}.png"
        bpy.ops.render.render(write_still=True)
        print(f"  {name}_{key}")

    with open(f"{OUT}/{name}_metal.txt", "w") as f:
        f.write(str(ch.get("metal", 0.0)))


if __name__ == "__main__":
    import os

    os.makedirs(OUT, exist_ok=True)
    for name, build in MATERIALS.items():
        plane = fresh()
        print(f"[{name}]")
        render(plane, name, build)
    print("done ->", OUT)
