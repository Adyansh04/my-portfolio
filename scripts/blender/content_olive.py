import bpy, bmesh, math, sys, os
sys.path.append(os.path.dirname(__file__))
from lib import *
import subject_olive as O

def build(coll, P, z=0.0, scale=1.0, holo=False, flat=False, layer=0, solid=False, centred=False, relief=False):
    S = scale
    EM = {k: mat('O_E_' + k, (0, 0, 0, 1), 0, 0.4, emit=c, emit_str=15.0) for k, c in O.COLORS.items()}
    SOL = {k: mat('O_S_' + k, tuple(v * 0.5 for v in c[:3]) + (1,), 0.75, 0.32) for k, c in O.COLORS.items()}
    pos = lambda i: (O.KF[i][0] * S, O.KF[i][1] * S) if isinstance(i, int) else (O.LANDMARKS[int(str(i)[1:])][0] * S, O.LANDMARKS[int(str(i)[1:])][1] * S)
    LAYER_Z = {'encoder': 0.05, 'imu': 0.10, 'vision': 0.15, 'lidar': 0.20, 'fiducial': 0.13, 'loop': 0.26}
    if centred: z = z - 0.13 * S

    def nodes(mats, r=0.014, lift=0.0):
        ob = new_mesh('O_N', coll, mats)
        bm = bmesh.new()
        for k in O.KF:
            m = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r * S)
            bmesh.ops.translate(bm, vec=(k[0] * S, k[1] * S, z + lift), verts=m['verts'])
        bm_to(ob, bm); shade(ob)
        return ob

    def traj(r, m, lift=0.0):
        return tube_from_points('O_T', [(k[0] * S, k[1] * S, z + lift) for k in O.KF], r, coll, m, closed=True)

    def edges(kinds, mats, stacked=True, r=0.0035):
        for kind in kinds:
            pts = []
            ob = new_mesh('O_E_' + kind, coll, (mats[kind],))
            bm = bmesh.new()
            zz = z + (LAYER_Z[kind] * S if stacked else 0.012 * S)
            for (a, b, k) in O.FACTORS:
                if k != kind: continue
                ax, ay = pos(a); bx, by = pos(b)
                ln = math.hypot(bx - ax, by - ay)
                if ln < 1e-5: continue
                cyl(bm, r * S, ln, ((ax + bx) / 2, (ay + by) / 2, zz), seg=6,
                    rot=(0, math.pi / 2, math.atan2(by - ay, bx - ax)))
            bm_to(ob, bm); shade(ob)

    def marks(m, h=0.2):
        ob = new_mesh('O_L', coll, (m,))
        bm = bmesh.new()
        for (lx, ly) in O.LANDMARKS:
            cyl(bm, 0.0035 * S, h * S, (lx * S, ly * S, z + h * S / 2), seg=8)
            for rr in (0.026, 0.014):
                torus(bm, rr * S, 0.004 * S, (lx * S, ly * S, z + 0.13 * S), seg=28, mseg=6)
        bm_to(ob, bm); shade(ob)

    if flat:
        if layer == 0:
            traj(0.006 * S, P['emit_w'], 0.004); nodes([P['steel']], 0.012, 0.004)
        elif layer == 1:
            edges(['encoder', 'imu'], EM, stacked=False)
        elif layer == 2:
            edges(['vision', 'lidar'], EM, stacked=False)
        else:
            edges(['fiducial', 'loop'], EM, stacked=False); marks(EM['fiducial'], 0.05)
        return

    if relief:
        traj(0.009 * S, P['emit_a'], 0.004)
        nodes([P['alu']], 0.016, 0.004)
        edges(O.KINDS, SOL, stacked=False, r=0.0045)
        marks(P['steel'], 0.06)
        return

    if solid:
        traj(0.007 * S, P['steel'], 0.012)
        nodes([P['alu']], 0.015, 0.012)
        edges(O.KINDS, SOL, stacked=True, r=0.003)
        marks(P['emit_v'], 0.18)
        return

    traj(0.006 * S, P['emit_w'], 0.006)
    nodes([P['emit_w']], 0.013, 0.006)
    edges(O.KINDS + ['fiducial', 'loop'], EM, stacked=True)
    marks(EM['fiducial'], 0.28)
