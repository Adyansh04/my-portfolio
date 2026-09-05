"""Shared modelling helpers. The point of every one of these is edges that catch light —
bevels, chamfers, panel breaks, fasteners — which is exactly the detail hand-written
web geometry could not carry."""
import bpy, bmesh, math, random
from mathutils import Vector, Euler

ACCENT = (1.0, 0.30, 0.05, 1)
CYAN = (0.10, 0.62, 1.0, 1)
LIME = (0.35, 0.90, 0.30, 1)
VIOLET = (0.55, 0.40, 1.0, 1)
WHITE = (0.90, 0.93, 0.97, 1)

def mat(name, base=(0.5, 0.5, 0.5, 1), metallic=0.0, rough=0.5, emit=None, emit_str=0.0,
        alpha=1.0, transmission=0.0, ior=1.45):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = base
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if 'IOR' in b.inputs: b.inputs['IOR'].default_value = ior
    if 'Transmission Weight' in b.inputs: b.inputs['Transmission Weight'].default_value = transmission
    if emit is not None:
        b.inputs['Emission Color'].default_value = emit
        b.inputs['Emission Strength'].default_value = emit_str
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        m.surface_render_method = 'BLENDED'
    return m

def palette():
    return {
        'alu':      mat('P_Alu', (0.62, 0.65, 0.69, 1), 1.0, 0.28),
        'alu_dark': mat('P_AluDark', (0.16, 0.18, 0.21, 1), 1.0, 0.38),
        'anod':     mat('P_Anod', (0.10, 0.12, 0.15, 1), 0.85, 0.30),
        'steel':    mat('P_Steel', (0.44, 0.47, 0.52, 1), 1.0, 0.22),
        'rubber':   mat('P_Rubber', (0.035, 0.04, 0.05, 1), 0.0, 0.85),
        'white':    mat('P_White', (0.86, 0.88, 0.91, 1), 0.05, 0.36),
        'accent':   mat('P_Accent', (0.55, 0.16, 0.03, 1), 0.4, 0.35),
        'emit_a':   mat('P_EmitA', (0, 0, 0, 1), 0, 0.4, emit=ACCENT, emit_str=16.0),
        'emit_c':   mat('P_EmitC', (0, 0, 0, 1), 0, 0.4, emit=CYAN, emit_str=16.0),
        'emit_l':   mat('P_EmitL', (0, 0, 0, 1), 0, 0.4, emit=LIME, emit_str=14.0),
        'emit_v':   mat('P_EmitV', (0, 0, 0, 1), 0, 0.4, emit=VIOLET, emit_str=14.0),
        'emit_w':   mat('P_EmitW', (0, 0, 0, 1), 0, 0.4, emit=WHITE, emit_str=10.0),
        'glass':    mat('P_Glass', (0.80, 0.88, 1.0, 1), 0.10, 0.06, alpha=0.10),
        'holo_a':   mat('P_HoloA', (0, 0, 0, 1), 0, 0.5, emit=ACCENT, emit_str=5.0, alpha=0.30),
        'holo_c':   mat('P_HoloC', (0, 0, 0, 1), 0, 0.5, emit=CYAN, emit_str=5.0, alpha=0.30),
    }

def put(ob, collection):
    for c in ob.users_collection:
        c.objects.unlink(ob)
    collection.objects.link(ob)
    return ob

def bevel(ob, width=0.004, segments=3, angle=50):
    m = ob.modifiers.new('Bevel', 'BEVEL')
    m.width = width; m.segments = segments
    m.limit_method = 'ANGLE'; m.angle_limit = math.radians(angle)
    m.harden_normals = True
    return m

def shade(ob, smooth=True, angle=40):
    for p in ob.data.polygons:
        p.use_smooth = smooth
    if smooth and hasattr(ob.data, 'set_sharp_from_angle'):
        try: ob.data.set_sharp_from_angle(angle=math.radians(angle))
        except Exception: pass

def new_mesh(name, coll, mats=()):
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    for m in mats: me.materials.append(m)
    put(ob, coll)
    return ob

def bm_to(ob, bm):
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def box(bm, sx, sy, sz, loc=(0, 0, 0), rot=None, mat_index=0):
    m = bmesh.ops.create_cube(bm, size=1)
    verts = m['verts']
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=verts)
    if rot:
        bmesh.ops.rotate(bm, verts=verts, cent=(0, 0, 0), matrix=Euler(rot).to_matrix())
    bmesh.ops.translate(bm, vec=loc, verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = mat_index
    return verts

def cyl(bm, r, depth, loc=(0, 0, 0), seg=32, rot=None, mat_index=0, cap=True):
    m = bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg,
                              radius1=r, radius2=r, depth=depth)
    verts = m['verts']
    if rot:
        bmesh.ops.rotate(bm, verts=verts, cent=(0, 0, 0), matrix=Euler(rot).to_matrix())
    bmesh.ops.translate(bm, vec=loc, verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = mat_index
    return verts

def cone(bm, r1, r2, depth, loc=(0, 0, 0), seg=32, rot=None, mat_index=0, cap=True):
    m = bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg,
                              radius1=r1, radius2=r2, depth=depth)
    verts = m['verts']
    if rot:
        bmesh.ops.rotate(bm, verts=verts, cent=(0, 0, 0), matrix=Euler(rot).to_matrix())
    bmesh.ops.translate(bm, vec=loc, verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = mat_index
    return verts

def torus(bm, major, minor, loc=(0, 0, 0), seg=64, mseg=12, rot=None, mat_index=0):
    verts = []
    for i in range(seg):
        a = i / seg * math.tau
        c = Vector((math.cos(a) * major, math.sin(a) * major, 0))
        ring = []
        for j in range(mseg):
            b = j / mseg * math.tau
            n = Vector((math.cos(a), math.sin(a), 0))
            p = c + n * (math.cos(b) * minor) + Vector((0, 0, math.sin(b) * minor))
            ring.append(bm.verts.new(p))
        verts.append(ring)
    bm.verts.ensure_lookup_table()
    for i in range(seg):
        for j in range(mseg):
            a1, a2 = verts[i][j], verts[i][(j + 1) % mseg]
            b1, b2 = verts[(i + 1) % seg][j], verts[(i + 1) % seg][(j + 1) % mseg]
            f = bm.faces.new((a1, a2, b2, b1))
            f.material_index = mat_index
    flat = [v for r in verts for v in r]
    if rot:
        bmesh.ops.rotate(bm, verts=flat, cent=(0, 0, 0), matrix=Euler(rot).to_matrix())
    bmesh.ops.translate(bm, vec=loc, verts=flat)
    return flat

def ring_of(fn, count, radius, z=0.0, phase=0.0, **kw):
    """Place `count` copies of fn(x, y, angle) evenly round a circle — bolt rings, vents, fins."""
    for i in range(count):
        a = phase + i / count * math.tau
        fn(math.cos(a) * radius, math.sin(a) * radius, a, z, **kw)

def tube_from_points(name, pts, radius, coll, material, closed=False, res=6, smooth=True):
    """A poly curve with a round bevel — cables, trajectories, conduit."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, cu)
    cu.materials.append(material)
    put(ob, coll)
    return ob

def text3d(name, body, coll, material, size=0.03, loc=(0, 0, 0), rot=(0, 0, 0), extrude=0.0015, align='CENTER'):
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align
    cu.align_y = 'CENTER'
    ob = bpy.data.objects.new(name, cu)
    ob.location = loc; ob.rotation_euler = rot
    cu.materials.append(material)
    put(ob, coll)
    return ob

def machined_disc(name, coll, P, r=0.44, h=0.055, bolts=12, vents=24):
    """Chamfered plate with a bolt ring and milled vent slots — the base every design stands on."""
    ob = new_mesh(name, coll, (P['alu'], P['alu_dark'], P['emit_a']))
    bm = bmesh.new()
    cone(bm, r, r * 0.97, h, (0, 0, h / 2), seg=72, mat_index=0)
    cyl(bm, r * 0.86, h * 0.35, (0, 0, h + h * 0.16), seg=72, mat_index=1)
    def bolt(x, y, a, z):
        cyl(bm, 0.008, 0.012, (x, y, h + 0.004), seg=8, mat_index=1)
    ring_of(bolt, bolts, r * 0.93, 0)
    def vent(x, y, a, z):
        box(bm, 0.05, 0.012, 0.02, (x, y, h * 0.45), rot=(0, 0, a), mat_index=1)
    ring_of(vent, vents, r * 0.995, 0)
    torus(bm, r * 0.80, 0.004, (0, 0, h + h * 0.34), seg=80, mseg=8, mat_index=2)
    bm_to(ob, bm)
    bevel(ob, 0.0025, 2)
    shade(ob)
    return ob
