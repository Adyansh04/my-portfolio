"""Studio stage: pedestal matching the site, three-point lighting, camera, EEVEE settings."""
import bpy, math, sys

S = bpy.context.scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)

def coll(name):
    c = bpy.data.collections.new(name)
    S.collection.children.link(c)
    return c

STAGE, DESIGN = coll('STAGE'), coll('DESIGN')

def add(ob, c):
    for u in ob.users_collection:
        u.objects.unlink(ob)
    c.objects.link(ob)
    return ob

def mat(name, base, metallic=0.0, rough=0.5, emit=None, emit_str=0.0, alpha=1.0, transmission=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = base
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if 'Transmission Weight' in b.inputs:
        b.inputs['Transmission Weight'].default_value = transmission
    if emit is not None:
        b.inputs['Emission Color'].default_value = emit
        b.inputs['Emission Strength'].default_value = emit_str
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        m.surface_render_method = 'BLENDED'
    return m

ACCENT = (1.0, 0.30, 0.05, 1)
mat('PedestalShell', (0.035, 0.048, 0.065, 1), 0.25, 0.55)
mat('AccentRing', (0, 0, 0, 1), 0, 0.4, emit=ACCENT, emit_str=9.0)
mat('Floor', (0.045, 0.06, 0.08, 1), 0.35, 0.45)

bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.70, radius2=0.62, depth=0.90, location=(0, 0, 0.45))
ped = bpy.context.object; ped.name = 'Pedestal'
ped.data.materials.append(bpy.data.materials['PedestalShell'])
bpy.ops.object.shade_smooth()
bv = ped.modifiers.new('Bevel', 'BEVEL'); bv.width = 0.012; bv.segments = 3
add(ped, STAGE)

bpy.ops.mesh.primitive_torus_add(major_radius=0.56, minor_radius=0.012, major_segments=96, minor_segments=10, location=(0, 0, 0.902))
r = bpy.context.object; r.name = 'AccentRing'
r.data.materials.append(bpy.data.materials['AccentRing'])
bpy.ops.object.shade_smooth(); add(r, STAGE)

bpy.ops.mesh.primitive_plane_add(size=40)
f = bpy.context.object; f.name = 'Floor'
f.data.materials.append(bpy.data.materials['Floor']); add(f, STAGE)

def light(name, energy, loc, color, size, rot):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.color = color; d.size = size
    o = bpy.data.objects.new(name, d); o.location = loc; o.rotation_euler = rot
    add(o, STAGE)

light('Key', 260, (2.1, -2.4, 3.0), (1.0, 0.96, 0.92), 2.4, (math.radians(48), 0, math.radians(41)))
light('Rim', 180, (-2.6, 1.9, 2.2), (0.55, 0.72, 1.0), 2.2, (math.radians(62), 0, math.radians(-125)))
light('Fill', 45, (0, -3.2, 1.2), (0.7, 0.8, 1.0), 3.0, (math.radians(80), 0, 0))
light('Kick', 90, (0, 2.6, 1.35), (1.0, 0.45, 0.15), 1.6, (math.radians(100), 0, math.radians(180)))

W = bpy.data.worlds.get('Studio') or bpy.data.worlds.new('Studio')
S.world = W; W.use_nodes = True
W.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.018, 0.028, 1)

cd = bpy.data.cameras.new('Cam'); cd.lens = 62
cam = bpy.data.objects.new('Camera', cd)
cam.location = (1.55, -2.05, 1.85); add(cam, STAGE); S.camera = cam
tgt = bpy.data.objects.new('CamTarget', None); tgt.location = (0, 0, 1.28); add(tgt, STAGE)
tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'

R = S.render
R.engine = 'BLENDER_EEVEE'
R.resolution_x, R.resolution_y = 1600, 1000
R.image_settings.file_format = 'JPEG'
R.image_settings.quality = 92
E = S.eevee
E.taa_render_samples = 64
for a, v in (('use_raytracing', True), ('use_shadows', True), ('use_volumetric_shadows', True)):
    if hasattr(E, a): setattr(E, a, v)
S.view_settings.view_transform = 'AgX'
S.view_settings.look = 'AgX - Base Contrast'
S.view_settings.exposure = 0.35

out = sys.argv[-1]
bpy.ops.wm.save_as_mainfile(filepath=out)
print('SAVED', out)
