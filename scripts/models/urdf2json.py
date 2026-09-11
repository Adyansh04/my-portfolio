#!/usr/bin/env python3
"""URDF -> public/models/<robot>/robot.json  (link tree with joint frames; meshes referenced as <basename>.glb)

usage: urdf2json.py <robot.urdf> <out.json> [--drop REGEX]  (links matching REGEX keep their frame but no mesh)
"""
import json, re, sys, os
import xml.etree.ElementTree as ET

def floats(s, n, default):
    if s is None: return default
    v = [float(x) for x in s.split()]
    return v if len(v) == n else default

def main():
    src, out = sys.argv[1], sys.argv[2]
    drop = re.compile(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[3] == '--drop' else None
    root = ET.parse(src).getroot()
    links = {}
    for l in root.findall('link'):
        name = l.get('name'); vis = l.find('visual'); mesh = None; mxyz = [0,0,0]; mrpy = [0,0,0]; mscale = [1,1,1]
        if vis is not None:
            m = vis.find('geometry/mesh')
            if m is not None and not (drop and drop.search(name)):
                mesh = os.path.splitext(os.path.basename(m.get('filename')))[0].lower() + '.glb'
                mscale = floats(m.get('scale'), 3, [1,1,1])
            o = vis.find('origin')
            if o is not None:
                mxyz = floats(o.get('xyz'), 3, mxyz); mrpy = floats(o.get('rpy'), 3, mrpy)
        links[name] = {'name': name, 'parent': None, 'joint': None, 'mesh': mesh, 'meshXyz': mxyz, 'meshRpy': mrpy, 'meshScale': mscale}
    for j in root.findall('joint'):
        child = j.find('child').get('link'); parent = j.find('parent').get('link')
        o = j.find('origin'); ax = j.find('axis'); lim = j.find('limit')
        links[child]['parent'] = parent
        links[child]['joint'] = {
            'name': j.get('name'), 'type': j.get('type'),
            'xyz': floats(o.get('xyz') if o is not None else None, 3, [0,0,0]),
            'rpy': floats(o.get('rpy') if o is not None else None, 3, [0,0,0]),
            'axis': floats(ax.get('xyz') if ax is not None else None, 3, [1,0,0]),
            'lower': float(lim.get('lower')) if lim is not None and lim.get('lower') else None,
            'upper': float(lim.get('upper')) if lim is not None and lim.get('upper') else None,
        }
    roots = [n for n, l in links.items() if l['parent'] is None]
    # emit in tree order (parents before children)
    order = []
    def walk(n):
        order.append(links[n])
        for c in [m for m, l in links.items() if l['parent'] == n]: walk(c)
    for r in roots: walk(r)
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    with open(out, 'w') as f: json.dump({'name': root.get('name'), 'root': roots[0], 'links': order}, f, indent=1)
    rev = sum(1 for l in order if l['joint'] and l['joint']['type'] in ('revolute', 'continuous'))
    print(f"{out}: {len(order)} links, {rev} revolute joints, {sum(1 for l in order if l['mesh'])} meshes, root={roots[0]}")

if __name__ == '__main__': main()
