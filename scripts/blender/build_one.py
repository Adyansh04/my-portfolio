"""blender -b stage.blend -P build_one.py -- <style> <project> <outpath>"""
import bpy, sys, os, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
style_id, project, out = argv[0], argv[1], argv[2]
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from lib import palette
import styles as ST
import content_go2, content_olive

S = bpy.context.scene
DESIGN = bpy.data.collections['DESIGN']
for ob in list(DESIGN.objects):
    bpy.data.objects.remove(ob, do_unlink=True)

P = palette()
content = (content_go2 if project == 'go2' else content_olive).build
focus_z = ST.STYLES[style_id](DESIGN, P, content)

# everything is modelled from its own zero; lift the whole design onto the pedestal top
TOP = 0.90
for ob in DESIGN.objects:
    ob.location.z += TOP

# Frame from the real bounding box rather than per-style constants — every hand-tuned
# guess cropped the top off something.
dg = bpy.context.evaluated_depsgraph_get()
lo = [1e9, 1e9, 1e9]
hi = [-1e9, -1e9, -1e9]
per_obj = {}
for ob in list(DESIGN.objects):
    # bound_box on curves and volume meshes lies; walk the evaluated vertices instead
    try:
        me = ob.evaluated_get(dg).to_mesh()
    except Exception:
        continue
    if me is None:
        continue
    mw = ob.matrix_world
    olo = [1e9] * 3; ohi = [-1e9] * 3
    for v in me.vertices:
        w = mw @ v.co
        for i in range(3):
            olo[i] = min(olo[i], w[i]); ohi[i] = max(ohi[i], w[i])
    ob.evaluated_get(dg).to_mesh_clear()
    if olo[0] > 1e8:
        continue
    per_obj[ob.name] = (round(ohi[0] - olo[0], 2), round(ohi[2] - olo[2], 2))
    for i in range(3):
        lo[i] = min(lo[i], olo[i]); hi[i] = max(hi[i], ohi[i])

cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
cz = (lo[2] + hi[2]) / 2
# fit each axis against its own field of view, then take whichever needs more room
half_h = (hi[2] - lo[2]) * 0.5 * 1.12
half_w = max(hi[0] - lo[0], hi[1] - lo[1]) * 0.5 * 1.06
cam = S.camera
sensor = 36.0
fov_h = 2 * math.atan(sensor * 0.5 / cam.data.lens)
fov_v = 2 * math.atan(sensor * 0.5 * (S.render.resolution_y / S.render.resolution_x) / cam.data.lens)
dist = max(half_w / math.tan(fov_h * 0.5), half_h / math.tan(fov_v * 0.5)) * 1.10
tgt = bpy.data.objects['CamTarget']
tgt.location = (cx, cy, cz)
ang = math.radians(-54)
elev = math.radians(19)
cam.location = (cx + math.cos(ang) * dist * math.cos(elev),
                cy + math.sin(ang) * dist * math.cos(elev),
                cz + dist * math.sin(elev))

S.render.filepath = out
bpy.ops.render.render(write_still=True)
print('OK', style_id, project, out)
