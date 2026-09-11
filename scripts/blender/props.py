"""
Models the facility's prop kit and exports it as one Draco GLB.

    blender --background --factory-startup --python scripts/blender/props.py -- public/models/props

Textures fixed the surfaces; this fixes the silhouettes. A real industrial building is full of
things that are not the building — luminaires, bollards, cable tray, cabinets, railing, charge
docks — and a space without them reads as a rendering of a room rather than a room. Every one of
these is modelled rather than assembled from boxes in the browser for one reason: bevels. A
chamfered edge catches a highlight and that highlight is most of what tells you an object is solid.

Everything is authored with its origin on the floor, facing +Z, in metres, so the site can place
them by position and yaw alone. They come out as named objects in a single GLB — one fetch, then
instanced per placement.
"""

import sys
import bpy
import bmesh
from math import radians

OUT = (sys.argv[sys.argv.index("--") + 1:] or ["public/models/props"])[0]

STEEL = ("steel", (0.42, 0.45, 0.50, 1), 0.9, 0.38)
DARK = ("dark", (0.09, 0.11, 0.14, 1), 0.4, 0.72)
PAINT = ("paint", (0.83, 0.55, 0.09, 1), 0.05, 0.55)   # safety yellow
RED = ("red", (0.52, 0.07, 0.06, 1), 0.1, 0.45)
GLASS = ("lens", (0.85, 0.90, 1.00, 1), 0.0, 0.25)
LIT = ("lit", (1.0, 0.95, 0.88, 1), 0.0, 0.9)
ACCENT = ("accent", (1.0, 0.48, 0.10, 1), 0.0, 0.6)


def material(spec):
    name, col, metal, rough = spec
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    if name in ("lit", "accent"):
        bsdf.inputs["Emission Color"].default_value = col
        bsdf.inputs["Emission Strength"].default_value = 1.0
    return m


def box(w, h, d, x=0, y=0, z=0, bevel=0.008, mat=STEEL, rx=0.0, ry=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.scale = (w / 2, d / 2, h / 2)
    o.rotation_euler = (rx, 0, ry)
    o.location = (x, z, y)          # site is Y-up / Z-forward; Blender is Z-up
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    if bevel:
        chamfer(o, bevel)
    o.data.materials.append(material(mat))
    return o


def cyl(r, h, x=0, y=0, z=0, seg=24, bevel=0.004, mat=STEEL, rx=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg)
    o = bpy.context.object
    o.rotation_euler = (rx, 0, 0)
    o.location = (x, z, y)
    bpy.ops.object.transform_apply(rotation=True)
    if bevel:
        chamfer(o, bevel)
    o.data.materials.append(material(mat))
    return o


def chamfer(o, width, segments=2):
    """A bevel is not decoration here: it is the highlight that says the edge is real."""
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = radians(40)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)


def join(parts, name):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    # the mesh datablock name is what reaches glTF as the mesh name, and three derives the name of
    # every primitive from it — leave it as "Cylinder.002" and nothing downstream can tell the
    # parts of a bollard from the parts of a dock
    o.data.name = name
    return o


# --------------------------------------------------------------------------- the kit


def highbay():
    """Linear high-bay luminaire: extruded body, reflector wings, end caps, a lit lens."""
    p = [box(0.16, 0.10, 1.30, y=-0.05, mat=DARK)]
    for s in (-1, 1):
        p.append(box(0.02, 0.13, 1.30, x=s * 0.13, y=-0.10, ry=0, mat=STEEL, rx=0))
        p[-1].rotation_euler = (0, radians(s * 26), 0)
        bpy.ops.object.transform_apply(rotation=True)
    for s in (-1, 1):
        p.append(box(0.19, 0.12, 0.02, z=s * 0.66, y=-0.05, mat=STEEL))
    p.append(box(0.12, 0.02, 1.24, y=-0.105, bevel=0.003, mat=LIT))
    for s in (-1, 1):
        p.append(cyl(0.006, 0.30, x=s * 0.05, y=0.15, seg=8, bevel=0, mat=DARK))
    return join(p, "highbay")


def bollard():
    """Safety bollard — the thing that says a vehicle comes through here."""
    p = [
        cyl(0.16, 0.02, y=0.01, seg=20, mat=DARK),
        cyl(0.085, 0.86, y=0.44, seg=20, mat=PAINT),
        cyl(0.088, 0.06, y=0.62, seg=20, bevel=0.002, mat=DARK),
        cyl(0.088, 0.06, y=0.74, seg=20, bevel=0.002, mat=DARK),
        cyl(0.09, 0.02, y=0.87, seg=20, mat=DARK),
    ]
    for i in range(4):
        a = i * 1.5708
        p.append(cyl(0.008, 0.05, x=0.13 * (1 if i % 2 == 0 else -1) * (0 if i > 1 else 1),
                     y=0.025, z=0.13 * (1 if i > 1 else 0), seg=6, bevel=0, mat=STEEL))
    return join(p, "bollard")


def cabinet():
    """Control cabinet: recessed door, louvre stack, handle, conduit gland on the roof."""
    p = [
        box(0.72, 1.72, 0.34, y=0.86, bevel=0.012, mat=DARK),
        box(0.66, 1.58, 0.02, y=0.86, z=-0.175, bevel=0.006, mat=STEEL),
        box(0.04, 0.22, 0.03, x=0.26, y=0.92, z=-0.19, bevel=0.006, mat=STEEL),
    ]
    for i in range(7):
        p.append(box(0.34, 0.012, 0.012, x=-0.10, y=1.30 + i * 0.035, z=-0.185, bevel=0, mat=DARK))
    p.append(box(0.30, 0.10, 0.02, x=-0.10, y=0.55, z=-0.186, bevel=0.004, mat=ACCENT))
    p.append(cyl(0.035, 0.10, x=0.20, y=1.77, seg=12, mat=STEEL))
    p.append(cyl(0.024, 0.26, x=0.20, y=1.90, seg=12, mat=DARK))
    p.append(box(0.78, 0.05, 0.40, y=0.025, bevel=0.006, mat=STEEL))
    return join(p, "cabinet")


def extinguisher():
    """Extinguisher on a wall bracket — small, red, and instantly legible as a real place."""
    p = [
        cyl(0.075, 0.42, y=0.24, seg=18, bevel=0.012, mat=RED),
        cyl(0.028, 0.07, y=0.48, seg=12, mat=DARK),
        cyl(0.016, 0.05, y=0.53, seg=10, mat=STEEL),
        box(0.10, 0.02, 0.02, x=0.05, y=0.55, bevel=0.003, mat=DARK),
        cyl(0.030, 0.09, x=0.10, y=0.52, seg=10, rx=radians(70), mat=DARK),
        box(0.14, 0.14, 0.02, y=0.30, z=0.085, bevel=0.004, mat=STEEL),
    ]
    return join(p, "extinguisher")


def cabletray():
    """A 2 m ladder tray with its rungs and hangers — reads as services, not decoration."""
    p = [box(0.02, 0.09, 2.0, x=-0.19, bevel=0.003, mat=STEEL),
         box(0.02, 0.09, 2.0, x=0.19, bevel=0.003, mat=STEEL)]
    for i in range(9):
        p.append(box(0.40, 0.012, 0.03, y=-0.03, z=-0.9 + i * 0.225, bevel=0.002, mat=STEEL))
    for s in (-1, 1):
        p.append(box(0.30, 0.012, 0.012, y=0.09, z=s * 0.8, bevel=0, mat=DARK))
        p.append(cyl(0.006, 0.28, y=0.23, z=s * 0.8, seg=6, bevel=0, mat=DARK))
    p.append(cyl(0.030, 1.94, y=0.02, seg=12, bevel=0.004, rx=radians(90), mat=DARK))
    return join(p, "cabletray")


def railing():
    """2 m of guard rail: posts, two rails, a kick plate."""
    p = []
    for s in (-1, 1):
        p.append(cyl(0.028, 1.05, y=0.53, z=s * 0.95, seg=14, mat=PAINT))
        p.append(box(0.12, 0.012, 0.12, y=0.01, z=s * 0.95, bevel=0.003, mat=STEEL))
    p.append(cyl(0.026, 1.94, y=1.03, seg=14, rx=radians(90), mat=PAINT))
    p.append(cyl(0.022, 1.94, y=0.58, seg=12, rx=radians(90), mat=PAINT))
    p.append(box(0.014, 0.16, 1.94, y=0.09, bevel=0.003, mat=STEEL))
    return join(p, "railing")


def dock():
    """AMR charging dock — where the fleet goes when it is not working."""
    p = [
        box(0.62, 0.10, 0.44, y=0.05, bevel=0.008, mat=DARK),
        box(0.56, 0.52, 0.10, y=0.36, z=0.16, bevel=0.008, mat=STEEL),
        box(0.44, 0.30, 0.02, y=0.36, z=0.10, bevel=0.004, mat=DARK),
    ]
    for s in (-1, 1):
        p.append(box(0.05, 0.14, 0.02, x=s * 0.13, y=0.22, z=0.09, bevel=0.003, mat=ACCENT))
    p.append(box(0.30, 0.03, 0.02, y=0.58, z=0.10, bevel=0.004, mat=ACCENT))
    p.append(box(0.66, 0.02, 0.48, y=0.005, bevel=0.003, mat=ACCENT))
    return join(p, "dock")


KIT = [highbay, bollard, cabinet, extinguisher, cabletray, railing, dock]


if __name__ == "__main__":
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for build in KIT:
        o = build()
        # flat shading everywhere: these are machined parts, and every bevel is there to give a
        # hard edge two distinct facets to catch light across (use_auto_smooth left with 4.1)
        for poly in o.data.polygons:
            poly.use_smooth = False
        print("built", o.name, len(o.data.polygons), "tris-ish")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        export_yup=True,
    )
    print("exported ->", OUT + ".glb")
