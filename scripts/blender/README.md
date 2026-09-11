# Hologram style study — Blender pipeline

Procedural R3F geometry could not carry the detail the project holograms needed (bevels,
machined fasteners, heat fins, milled reliefs), so the designs are modelled in Blender and
rendered headlessly. Nothing here runs in the site; it produces design previews, and the
geometry of whichever style is chosen gets exported to GLB for the web build.

Everything runs against a fresh background Blender, so it never touches an open GUI session:

```bash
blender --background --factory-startup --python scripts/blender/stage.py -- /tmp/stage.blend
blender --background /tmp/stage.blend --python scripts/blender/build_one.py -- d1 go2 /tmp/go2-d1
```

`stage.py` builds the studio: the site's pedestal (r 0.62/0.70, h 0.90), three-point lighting,
a dark world and EEVEE Next settings. `build_one.py <style> <project> <out>` clears the DESIGN
collection, builds one style, lifts it onto the pedestal top, frames the camera from the exact
evaluated vertex bounds and renders.

- `lib.py` — modelling helpers. Every one exists to make edges that catch light: `bevel`,
  `machined_disc` (bolt ring + milled vents), `torus`, `tube_from_points`, `ring_of`.
- `styles.py` — the five styles: d1 emitter rig, d2 exploded assembly, d3 instrument case,
  d4 gimbal rig, d5 terrain slab.
- `subject_*.py` — the data each style renders (facility plan / factor graph).
- `content_*.py` — how a subject is realised per style (holo, flat layer, solid, relief).

Gotchas that cost time:
- `object.bound_box` is wrong for curve objects with a bevel, which threw the auto-framing far
  out. Frame from evaluated mesh vertices instead.
- EEVEE transmission needs sample counts a preview can't afford and speckles; a low-alpha
  blended pane reads as glass without the noise.
- Blender 5 moved the compositor to `scene.compositing_node_group`, and Glare settings are
  input sockets, not properties. Setting that group to `None` while compositing is enabled
  crashes Blender.
