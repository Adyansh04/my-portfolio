import bpy, bmesh, math, sys, os
sys.path.append(os.path.dirname(__file__))
from lib import *
import subject_go2 as G

def build(coll, P, z=0.0, scale=1.0, holo=False, flat=False, layer=0, solid=False, centred=False, relief=False):
    S = scale
    wall_h = (0.26 if (holo or centred) else 0.16) * S
    if centred: z = z - wall_h / 2

    def wall_mesh(name, h, mats, mat_i=0, thick=0.014):
        ob = new_mesh(name, coll, mats)
        bm = bmesh.new()
        for (a, b) in G.walls():
            dx, dy = (b[0] - a[0]) * S, (b[1] - a[1]) * S
            ln = math.hypot(dx, dy)
            box(bm, ln, thick * S, h, ((a[0] + b[0]) / 2 * S, (a[1] + b[1]) / 2 * S, z + h / 2),
                rot=(0, 0, math.atan2(dy, dx)), mat_index=mat_i)
        bm_to(ob, bm); bevel(ob, 0.0018, 2); shade(ob)
        return ob

    def floors(name, mats, lift=0.002, inset=0.02):
        ob = new_mesh(name, coll, mats)
        bm = bmesh.new()
        for i, (_, x, zz, w, d, _) in enumerate(G.ROOMS):
            box(bm, (w - inset) * S, (d - inset) * S, 0.004, (x * S, zz * S, z + lift), mat_index=i % len(mats))
        bm_to(ob, bm); shade(ob, False)
        return ob

    def patrol_tube(r, m, lift=0.012):
        pts = [(p[0] * S, p[1] * S, z + lift) for p in G.PATROL]
        return tube_from_points('G_Patrol', pts, r, coll, m, closed=True)

    def detections(mats, pin=True):
        ob = new_mesh('G_Det', coll, mats)
        bm = bmesh.new()
        for (x, y, h, _) in G.DETECTIONS:
            hh = h * S
            if pin:
                cyl(bm, 0.0035 * S, hh, (x * S, y * S, z + hh / 2), seg=8, mat_index=0)
                m2 = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.012 * S)
                bmesh.ops.translate(bm, vec=(x * S, y * S, z + hh), verts=m2['verts'])
                for f in {f for v in m2['verts'] for f in v.link_faces}: f.material_index = 1
            else:
                box(bm, 0.05 * S, 0.05 * S, hh, (x * S, y * S, z + hh / 2), mat_index=0)
        bm_to(ob, bm); shade(ob)
        return ob

    if flat:
        if layer == 0:
            floors('G_L0', [P['anod'], P['alu_dark']], 0.004, 0.03)
            tube_from_points('G_L0g', [(p[0] * S, p[1] * S, z + 0.006) for p in G.PATROL], 0.003, coll, P['emit_a'], True)
        elif layer == 1:
            wall_mesh('G_L1', 0.055 * S, [P['white']], thick=0.016)
        elif layer == 2:
            patrol_tube(0.006 * S, P['emit_a'], 0.008)
            ob = new_mesh('G_L2n', coll, (P['emit_c'],))
            bm = bmesh.new()
            for p in G.PATROL[:-1]:
                m2 = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.011 * S)
                bmesh.ops.translate(bm, vec=(p[0] * S, p[1] * S, z + 0.008), verts=m2['verts'])
            bm_to(ob, bm); shade(ob)
        else:
            detections([P['steel'], P['emit_c']])
        return

    if relief:
        wall_mesh('G_Relief', 0.05 * S, [P['alu']], thick=0.02)
        ch = new_mesh('G_Chan', coll, (P['anod'],))
        bm = bmesh.new()
        for i, (_, x, zz, w, d, _) in enumerate(G.ROOMS):
            box(bm, (w - 0.05) * S, (d - 0.05) * S, 0.008, (x * S, zz * S, z - 0.002))
        bm_to(ch, bm); shade(ch, False)
        patrol_tube(0.007 * S, P['emit_a'], 0.004)
        detections([P['steel'], P['emit_c']])
        return

    if solid:
        floors('G_F', [P['anod'], P['alu_dark'], P['anod'], P['alu_dark']], 0.003, 0.02)
        wall_mesh('G_W', wall_h, [P['white']])
        patrol_tube(0.005 * S, P['emit_a'])
        detections([P['steel'], P['emit_c']])
        return

    # holo: emissive shells with a bright floor plan and glowing detection volumes
    wall_mesh('G_HW', wall_h, [P['holo_a']])
    floors('G_HF', [P['holo_a']], 0.002, 0.03)
    patrol_tube(0.005 * S, P['emit_a'])
    ob = new_mesh('G_HD', coll, (P['holo_c'], P['emit_c']))
    bm = bmesh.new()
    for (x, y, h, _) in G.DETECTIONS:
        hh = h * S
        box(bm, 0.05 * S, 0.05 * S, hh, (x * S, y * S, z + hh / 2), mat_index=0)
        for e in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
            cyl(bm, 0.0022 * S, hh, (x * S + e[0] * 0.025 * S, y * S + e[1] * 0.025 * S, z + hh / 2), seg=6, mat_index=1)
    bm_to(ob, bm); shade(ob, False)
