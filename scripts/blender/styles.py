"""Five hologram styles. Each returns the camera target height it wants framed."""
import bpy, bmesh, math, sys, os
sys.path.append(os.path.dirname(__file__))
from lib import *
import subject_go2 as G
import subject_olive as O

# ------------------------------------------------------------------ D1 emitter rig
def d1_emitter(coll, P, subject):
    """A machined projector head on a yoke throwing a real volumetric cone."""
    machined_disc('D1_Base', coll, P, r=0.46, h=0.05)
    # yoke arms + projector head, the hardware is the hero
    ob = new_mesh('D1_Rig', coll, (P['alu'], P['anod'], P['steel'], P['emit_c']))
    bm = bmesh.new()
    for s in (-1, 1):
        box(bm, 0.035, 0.05, 0.46, (s * 0.30, 0, 0.28), mat_index=0)
        cyl(bm, 0.045, 0.05, (s * 0.30, 0, 0.50), seg=24, rot=(0, math.pi / 2, 0), mat_index=2)
        cyl(bm, 0.016, 0.07, (s * 0.30, 0, 0.50), seg=12, rot=(0, math.pi / 2, 0), mat_index=1)
    # head: body, heat fins, lens barrel
    cone(bm, 0.115, 0.135, 0.20, (0, 0, 0.50), seg=40, rot=(math.pi / 2, 0, 0), mat_index=1)
    for i in range(7):
        torus(bm, 0.138 - i * 0.001, 0.006, (0, -0.02 + i * 0.022, 0.50), seg=40, mseg=6,
              rot=(math.pi / 2, 0, 0), mat_index=0)
    cyl(bm, 0.085, 0.06, (0, 0, 0.50), seg=40, rot=(math.pi / 2, 0, 0), mat_index=2)
    for r_ in (0.075, 0.058, 0.041):
        torus(bm, r_, 0.005, (0, -0.115, 0.50), seg=40, mseg=6, rot=(math.pi / 2, 0, 0), mat_index=0)
    cyl(bm, 0.034, 0.012, (0, -0.122, 0.50), seg=32, rot=(math.pi / 2, 0, 0), mat_index=3)
    def port(x, y, a, z):
        cyl(bm, 0.009, 0.02, (x, y, 0.09), seg=8, mat_index=1)
    ring_of(port, 8, 0.40, 0)
    bm_to(ob, bm); bevel(ob, 0.002, 2); shade(ob)
    # cable conduit from the base to the head
    tube_from_points('D1_Cable', [(-0.34, 0.02, 0.06), (-0.36, 0.10, 0.22), (-0.30, 0.06, 0.42), (-0.22, 0.0, 0.50)],
                     0.012, coll, P['rubber'])
    # the projected volume
    volm = bpy.data.materials.get('D1_Vol') or bpy.data.materials.new('D1_Vol')
    volm.use_nodes = True
    nt = volm.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    pv = nt.nodes.new('ShaderNodeVolumePrincipled')
    pv.inputs['Color'].default_value = ACCENT
    pv.inputs['Density'].default_value = 0.55
    if 'Emission Strength' in pv.inputs:
        pv.inputs['Emission Strength'].default_value = 0.25
        pv.inputs['Emission Color'].default_value = ACCENT
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(pv.outputs[0], outn.inputs['Volume'])
    beam = new_mesh('D1_Beam', coll, (volm,))
    bm = bmesh.new(); cone(bm, 0.09, 0.52, 0.44, (0, 0, 0.28), seg=48, rot=(math.pi, 0, 0)); bm_to(beam, bm)
    subject(coll, P, z=0.10, scale=0.82, holo=True)
    return 0.42

# ------------------------------------------------------------------ D2 exploded assembly
def d2_exploded(coll, P, subject):
    """Machined layers lifted apart on guide rods, each a real plate with chamfers."""
    machined_disc('D2_Base', coll, P, r=0.46, h=0.05, bolts=8, vents=16)
    ob = new_mesh('D2_Rods', coll, (P['steel'], P['anod']))
    bm = bmesh.new()
    for s in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        cyl(bm, 0.008, 0.62, (s[0] * 0.33, s[1] * 0.24, 0.36), seg=12, mat_index=0)
        cyl(bm, 0.016, 0.02, (s[0] * 0.33, s[1] * 0.24, 0.67), seg=12, mat_index=1)
    bm_to(ob, bm); bevel(ob, 0.0015, 2); shade(ob)
    # four plates, each carrying one layer of the story
    for i, (zz, sc) in enumerate(((0.13, 1.0), (0.27, 1.0), (0.41, 1.0), (0.55, 1.0))):
        pl = new_mesh('D2_Plate%d' % i, coll, (P['anod'], P['alu']))
        bm = bmesh.new()
        box(bm, 0.78, 0.60, 0.012, (0, 0, zz), mat_index=0)
        for s in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
            cyl(bm, 0.020, 0.024, (s[0] * 0.33, s[1] * 0.24, zz), seg=12, mat_index=1)
        bm_to(pl, bm); bevel(pl, 0.002, 2); shade(pl)
        subject(coll, P, z=zz + 0.008, scale=sc, layer=i, flat=True)
    return 0.40

# ------------------------------------------------------------------ D3 instrument case
def d3_case(coll, P, subject):
    """A precision vitrine: chamfered frame, corner brackets, glass, data plate."""
    machined_disc('D3_Base', coll, P, r=0.50, h=0.05, bolts=16, vents=32)
    W, D, H = 0.86, 0.66, 0.44
    ob = new_mesh('D3_Frame', coll, (P['alu'], P['anod'], P['steel']))
    bm = bmesh.new()
    box(bm, W + 0.05, D + 0.05, 0.03, (0, 0, 0.065), mat_index=1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(bm, 0.011, H, (sx * W / 2, sy * D / 2, 0.08 + H / 2), seg=16, mat_index=0)
            for zz in (0.09, 0.08 + H):
                box(bm, 0.05, 0.05, 0.016, (sx * W / 2, sy * D / 2, zz), mat_index=2)
    for sx in (-1, 1):
        box(bm, 0.016, D, 0.016, (sx * W / 2, 0, 0.08 + H), mat_index=0)
    for sy in (-1, 1):
        box(bm, W, 0.016, 0.016, (0, sy * D / 2, 0.08 + H), mat_index=0)
    box(bm, 0.26, 0.02, 0.05, (0, -D / 2 - 0.012, 0.10), mat_index=1)
    bm_to(ob, bm); bevel(ob, 0.0022, 3); shade(ob)
    gl = new_mesh('D3_Glass', coll, (P['glass'],))
    bm = bmesh.new()
    inset = 0.014
    for sx in (-1, 1): box(bm, 0.003, D - inset, H - inset, (sx * (W / 2 - inset), 0, 0.08 + H / 2))
    for sy in (-1, 1): box(bm, W - inset, 0.003, H - inset, (0, sy * (D / 2 - inset), 0.08 + H / 2))
    box(bm, W - inset, D - inset, 0.003, (0, 0, 0.08 + H - inset / 2))
    bm_to(gl, bm); shade(gl, False)
    subject(coll, P, z=0.082, scale=0.86, solid=True)
    return 0.30

# ------------------------------------------------------------------ D4 gimbal rig
def d4_gimbal(coll, P, subject):
    """Concentric machined rings on a heavy yoke, graduations milled into the outer band."""
    machined_disc('D4_Base', coll, P, r=0.44, h=0.05, bolts=10, vents=20)
    ob = new_mesh('D4_Rings', coll, (P['alu'], P['anod'], P['steel'], P['emit_a']))
    bm = bmesh.new()
    C = (0, 0, 0.46)
    for s in (-1, 1):
        box(bm, 0.05, 0.05, 0.40, (s * 0.34, 0, 0.25), mat_index=1)
        cyl(bm, 0.035, 0.06, (s * 0.34, 0, 0.46), seg=20, rot=(0, math.pi / 2, 0), mat_index=2)
    specs = ((0.335, 0.016, (0, 0, 0)), (0.285, 0.013, (math.radians(72), 0, 0)), (0.235, 0.011, (0, math.radians(64), 0)))
    for i, (R, t, rot) in enumerate(specs):
        verts = torus(bm, R, t, C, seg=88, mseg=10, rot=rot, mat_index=0)
        if i == 0:
            for k in range(48):
                a = k / 48 * math.tau
                box(bm, 0.004, 0.004, 0.016 if k % 4 else 0.026,
                    (math.cos(a) * R, math.sin(a) * R, 0.46 + t), rot=(0, 0, a), mat_index=1)
    torus(bm, 0.185, 0.005, C, seg=72, mseg=6, mat_index=3)
    bm_to(ob, bm); bevel(ob, 0.0018, 2); shade(ob)
    subject(coll, P, z=0.46, scale=0.62, centred=True, holo=True)
    return 0.46

# ------------------------------------------------------------------ D5 terrain slab
def d5_slab(coll, P, subject):
    """The project milled into a solid metal relief, with routed channels lit from within."""
    ob = new_mesh('D5_Slab', coll, (P['alu_dark'], P['alu'], P['anod']))
    bm = bmesh.new()
    box(bm, 1.02, 0.78, 0.075, (0, 0, 0.038), mat_index=0)
    box(bm, 0.96, 0.72, 0.012, (0, 0, 0.079), mat_index=1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(bm, 0.013, 0.02, (sx * 0.46, sy * 0.34, 0.078), seg=10, mat_index=2)
    for sy in (-1, 1):
        box(bm, 1.02, 0.02, 0.03, (0, sy * 0.39, 0.02), mat_index=2)
    bm_to(ob, bm); bevel(ob, 0.003, 3); shade(ob)
    subject(coll, P, z=0.085, scale=0.92, relief=True)
    return 0.24

STYLES = {'d1': d1_emitter, 'd2': d2_exploded, 'd3': d3_case, 'd4': d4_gimbal, 'd5': d5_slab}
