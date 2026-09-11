#!/usr/bin/env python3
"""Raw meshes (STL/OBJ) -> one GLB per link in public/models/<robot>/  (trimesh, no Blender).

usage: convert.py trakr|go2|ur5e|crazyflie|r1|g1|all
Merges multi-part links, drops materials (the web restyles everything), fixes mm-unit STLs.
Run scripts/models/optimize.sh afterwards for Draco + simplification.
"""
import os, sys, json, glob
import numpy as np
import trimesh

SRC = 'assets-src'; OUT = 'public/models'
ROBOTS = {
    # per-link parts; None = one GLB per file in meshes/ (name = lowercase basename)
    'trakr': None,
    'r1': None,
    'g1': None,  # meshes copied from grove-g1's build (unitree_mujoco, BSD-3), fingers left out
    'go2': {'base': ['base_0','base_1','base_2','base_3','base_4'], 'hip': ['hip_0','hip_1'], 'thigh': ['thigh_0','thigh_1'],
            'thigh_mirror': ['thigh_mirror_0','thigh_mirror_1'], 'calf': ['calf_0','calf_1'], 'calf_mirror': ['calf_mirror_0','calf_mirror_1'], 'foot': ['foot']},
    'ur5e': {'base': ['base_0','base_1'], 'shoulder': ['shoulder_0','shoulder_1','shoulder_2'], 'upperarm': ['upperarm_0','upperarm_1','upperarm_2','upperarm_3'],
             'forearm': ['forearm_0','forearm_1','forearm_2','forearm_3'], 'wrist1': ['wrist1_0','wrist1_1','wrist1_2'], 'wrist2': ['wrist2_0','wrist2_1','wrist2_2'], 'wrist3': ['wrist3']},
    'crazyflie': {'body': [f'cf2_{i}' for i in range(7)]},
}

def load(path):
    m = trimesh.load(path, force='mesh', process=True)
    if isinstance(m, trimesh.Scene): m = trimesh.util.concatenate(list(m.geometry.values()))
    return m

def export(robot, link, parts):
    meshes = [load(p) for p in parts]
    mesh = trimesh.util.concatenate(meshes) if len(meshes) > 1 else meshes[0]
    ext = mesh.extents
    scale = 1.0
    if ext.max() > 5.0:  # a single robot link larger than 5 m means the STL is in millimetres
        scale = 0.001; mesh.apply_scale(scale)
    mesh.visual = trimesh.visual.ColorVisuals(mesh)  # drop materials/textures
    os.makedirs(f'{OUT}/{robot}', exist_ok=True)
    out = f'{OUT}/{robot}/{link}.glb'
    mesh.export(out, file_type='glb')
    return {'link': link, 'faces': int(len(mesh.faces)), 'bytes': os.path.getsize(out), 'extents': [round(float(x), 3) for x in mesh.extents], 'scale': scale}

def convert(robot):
    spec = ROBOTS[robot]; rows = []
    if spec is None:
        for f in sorted(glob.glob(f'{SRC}/{robot}/meshes/*')):
            link = os.path.splitext(os.path.basename(f))[0].lower()
            rows.append(export(robot, link, [f]))
    else:
        for link, parts in spec.items():
            rows.append(export(robot, link, [f'{SRC}/{robot}/assets/{p}.obj' for p in parts]))
    total = sum(r['bytes'] for r in rows)
    print(f'== {robot}: {len(rows)} links, {sum(r["faces"] for r in rows)} faces, {total/1e6:.1f} MB raw GLB')
    for r in rows: print(f"   {r['link']:28} {r['faces']:>8} faces {r['bytes']/1e3:>8.0f} KB  ext={r['extents']}{'  (mm→m)' if r['scale']!=1 else ''}")
    with open(f'{OUT}/{robot}/convert-report.json', 'w') as fh: json.dump(rows, fh, indent=1)

if __name__ == '__main__':
    which = sys.argv[1:] or ['all']
    for r in (ROBOTS.keys() if which == ['all'] else which): convert(r)
