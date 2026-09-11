# Mission Log — detailed build plan

Canonical plan for the portfolio redesign (Direction A, "Mission Log", with two borrowings). Written 2026-09-03. Rendered copy: https://claude.ai/code/artifact/fb031e06-2047-4fc3-8c11-806ba4c8c37c (re-render from this file after edits).
**Follow this file phase by phase. After every phase: run the verification list, then update `HANDOFF.md` (work log + next steps).**
Ground rules live in `HANDOFF.md` §1 (branch `redesign-3d`, never push, content frozen, chat is the only kept element).

---

## 0. Locked decisions

| Topic | Decision |
|---|---|
| Direction | **A · Mission Log** + from C: tech-tag filter and turbo-coloured point clouds; from B: title-block treatment on project sheets |
| Robot geometry | Open-source only (no personal CAD). **Hero quadruped = Addverb Trakr** (`HumanoidAddverb/trakr_legged_rl`, URDF + STL). Adyansh worked at Addverb and confirmed on 2026-09-03 that using these meshes is fine (the repo itself has no license file; note his confirmation in `LICENSES.md`). **Go2** (Menagerie, BSD-3) in the Go2-inspection hologram. **Unitree R1 humanoid** (`unitree_ros/r1_description`, BSD-3) standing at the Robotics Collective placard in Zone 02. UR5e assumed for the RWTH arm until Adyansh names the real one |
| Keep from old site | AI chat assistant (Cloudflare Worker call), the SVG project glyphs (reused on project sheets), `media-carousel.tsx` (restyled) |
| Drop | Spline hero + runtime, five-colour theme switcher, glitch/typewriter/scramble text, floating dots, parallax layers, cursor trail, old section components |
| Theme | Dark only, by design (single visual world). No light mode |
| Media | **Deferred.** Leave `public/projects` untouched; carousel keeps working with current files. Notes in §15 |
| Deployment | **Deferred.** Keep `basePath: '/my-portfolio'` + `output: 'export'` as they are; do not touch the workflow. Notes in §15 |
| Goal of this plan | Site runs locally at http://localhost:3000/my-portfolio, complete, fast, all content verified |

---

## 1. Design system

### Tokens (`app/globals.css`, Tailwind v4 `@theme`)
| Token | Value | Use |
|---|---|---|
| `--ground` | `#0B0F14` | page + world background, fog colour |
| `--panel` | `#141A22` | HUD panels, cards, pedestal bodies |
| `--panel-2` | `#1B222C` | seen-free floor cells, raised surfaces |
| `--grid` | `#2A3340` | grid lines, borders, unknown-but-framed structure |
| `--text` | `#E9EEF3` | primary text, seen walls |
| `--muted` | `#8A94A6` | secondary text, telemetry labels |
| `--accent` | `#FF7A1A` | ONE accent: robot LEDs, LiDAR sweep, active states, links, focus ring |
| `--accent-soft` | `rgba(255,122,26,.18)` | accent fills |
| `--good` / `--warn` | `#5FD39A` / `#F2C94C` | semantic only (status OK, medals) — never decorative |
| turbo ramp | GLSL polynomial | **only** for sensor data: point-cloud height/intensity, depth in holograms |

Rules: colour means data. UI gets one accent. No gradients on panels. Borders 1px `--grid`. Radius 4px (HUD), 8px (cards). Corner brackets allowed only on the HUD frame (once), not on every card.

### Type (`app/layout.tsx` via `next/font/google`)
| Role | Family | next/font import | Notes |
|---|---|---|---|
| Display | **Big Shoulders** (variable, `opsz` axis) | `Big_Shoulders({ subsets:['latin'], axes:['opsz'], weight:'variable', variable:'--font-display' })` | Zone titles, hero name, PRJ ids at large size. Uppercase, tracking `.01em`. (Old "Big Shoulders Display" is not in next/font — use this.) |
| Body | **IBM Plex Sans** | `IBM_Plex_Sans({ subsets:['latin'], weight:['400','500','600'], variable:'--font-sans' })` | All running text, 16–18px, max 65ch |
| Mono | **IBM Plex Mono** | `IBM_Plex_Mono({ subsets:['latin'], weight:['400','500'], variable:'--font-mono' })` | HUD, telemetry, tags, title blocks |

Type scale: 12 / 13 / 15 / 17 / 22 / 32 / 48 / 72 / clamp(96px, 12vw, 200px) for the hero name.

### Motion principles
- Scroll drives the world; time drives ambient life (gait idle, sweep rotation, hologram loops). Nothing else auto-animates.
- One orchestrated moment per zone (the "beat"), everything around it quiet.
- Every effect has a robotics reason (sweep = LiDAR, snap = loop closure, dim = out of sensor range).
- `prefers-reduced-motion`: static mode (§11). No boot sequence, no sweep, minimap static.

---

## 2. World specification

Units = metres. three.js Y-up. Facility lies on the XZ plane. World origin = spawn corner. Minimap: X → right, Z → down.

### 2.1 Facility layout (all walls 2.6 m high, 0.25 m thick; doors 1.8 m wide)
| Zone | id | Footprint x × z | Doors | Dressing |
|---|---|---|---|---|
| 0 Boot / Hero | `spawn` | [0,8] × [0,8] | east wall → zone 1 at z 4; west wall → zone 6 at z 4 (**loop-closure door**, initially "unknown") | empty room, spawn pad ring at (4, 0, 4) |
| 1 Profile | `profile` | [8,20] × [0,8] | west (from 0); south wall at x 18 → corridor | display wall = north wall (z=0): emissive panel 8 × 2 m at x [10,18] |
| 2 Experience | `experience` | [16,20] × [8,30] corridor | north (from 1); south at z 30 → hall | 6 placards alternating east/west walls at z = 10.5, 13.8, 17.1, 20.4, 23.7, 27.0; emissive strip along both walls at 2.2 m |
| 3 Projects | `projects` | [0,34] × [30,46] hall | north at x 18 (from 2); west wall at z 38 → alcove | 10 pedestals, zig-zag: x = 30,27,24,21,18,15,12,9,6,3; odd (1,3,5,7,9) at z 34.5, even at z 41.5; aisle z 38 |
| 4 Hackathons | `hackathons` | [-8,0] × [34,42] alcove | east (from 3); north at x -5 → archive | 3 podiums at x -5.5/-4/-2.5, z 38, heights 0.9/0.7/0.55 (1st/2nd/best-technical) |
| 5 Credentials | `credentials` | [-8,-2] × [8,34] corridor | south (from 4); north at z 8 → dock | 6 rack units (3 per wall), archive drawers instanced |
| 6 Dock | `dock` | [-8,0] × [0,8] | south (from 5); east at z 4 → spawn (loop closure) | dock pad ring at (-4, 0, 4), LED bar, charging post |

Wall segments and door gaps are declared once in `lib/mission/facility.ts` as `{a:[x,z], b:[x,z], doors?: [{at:number, width:1.8}]}` and drive: 3D walls, ray-casting for reveal, minimap outline, zone bounds.

### 2.2 Robot path (`lib/mission/path.ts`)
Waypoints (x,z): spawn (4,4) → (7.5,4) door → (12,4) → (14,2.5) look at wall → (18,6.5) → (18,9) corridor → placard stops at z 10.5 … 27 (alternating lateral offset ±0.8) → (18,30) → (30,38) → aisle stops at x 30,27,…,3 (lateral nudge ±1.2 toward the active pedestal) → (0.5,38) door → (-4,38) alcove centre → (-5,34) → (-5,20) → (-5,9) → (-4,5) dock approach → (-4,4) dock.
`robotPose(t)`: arc-length parameterised CatmullRom over the waypoints; per-zone remapping so the robot *pauses* at beats (ease-in-out plateaus). Heading = smoothed tangent. Speed = d(arc)/dt for gait phase.

### 2.3 Scroll mapping (`lib/mission/zones.ts`)
Each zone is a DOM `<section>` with `height: <scrollVh>vh` and a `position: sticky; top:0; height:100vh` inner frame.
| Zone | scrollVh | beats |
|---|---|---|
| 0 hero | 220 | boot (0–.3), name reveal (.3–.7), sweep starts (.7–1) |
| 1 profile | 260 | mission quote → education → inventory |
| 2 experience | 6 × 90 = 540 | one beat per role |
| 3 projects | 10 × 85 = 850 | one beat per project |
| 4 hackathons | 240 | 3 podiums light in sequence |
| 5 credentials | 300 | 3 groups |
| 6 dock | 260 | loop closure (0–.35) → dock (.35–.7) → contact (.7–1) |
Global `t` = master ScrollTrigger progress over `main`. `zone` and `zoneT` derive from cumulative `scrollVh` (single source of truth; no per-section trigger needed). Beat index = `floor(zoneT × beats)`.

### 2.4 Reveal mechanic ("seen-at")
Precompute once on the client (`lib/mission/reveal.ts`, ~150 ms, memoised; move to a build-time `public/data/mission.bin` only if it measures > 300 ms):
1. Sample `robotPose(t)` at N = 720 steps.
2. At each step cast 360 horizontal rays (range 12 m) + 5 elevation rings (−0.2, 0.3, 0.9, 1.6, 2.3 m for a 4D-LiDAR look) against the wall segments (2D segment intersection; doors pass through).
3. Floor cells (0.5 m grid, 84 × 92 = 7 728 cells) along each ray get `seenAt = min(seenAt, t)`.
4. Each wall hit becomes one point `{x, y, z, seenAt, intensity}` with slight jitter → point cloud (~150k points; cap 220k; mobile draw range 80k).
Shaders compare `aSeenAt < uT` (grid: discard unseen; points: discard unseen, band-glow for `|aSeenAt − uT| < 0.004` = "just scanned").
Loop closure: when `t` enters zone 6 beat 1 the whole revealed map gets `uDrift = (0.35, 0, −0.2)` that lerps to 0 over 0.8 s; HUD prints `loop closure · 1 constraint · correction 0.41 m`.

### 2.5 Rendering
- Floor: one `InstancedMesh` of 0.48 × 0.48 planes (7 728 instances), custom `ShaderMaterial` (aSeenAt, aCost) → seen-free `--panel-2` with 1px `--grid` edge, cells on the robot path slightly lighter (costmap), unseen discarded. Radial fade around camera for the hero.
- Walls: merged `BoxGeometry` per segment (dark `MeshStandardMaterial`, roughness .9) + `LineSegments` top edge (`--grid`) + the same `aSeenAt` discard via a `onBeforeCompile` chunk so walls appear only when scanned.
- Point cloud: one `THREE.Points`, custom shader, size 2.5 px × dpr (clamp 64), additive blending, turbo(y / 2.6) colour, `uSweepAngle` beam brightening (`exp(-k·Δθ)`), `setDrawRange` for LOD.
- LiDAR sweep: floor-hugging wedge (plane 24 × 24 m, radial+angular gradient shader, accent) rotating at 1.2 rad/s about the robot + a thin expanding ring pulse every 2 s. Off in static mode.
- Light: `ambientLight 0.25`, one `directionalLight` (cool, 0.6) for form, one accent `pointLight` parented to the robot (intensity 3, distance 8). No shadows. `fogExp2(--ground, 0.035)`.
- No postprocessing. Glow = additive materials + emissive.
- Camera: `PerspectiveCamera fov 42`, near .1, far 120.

### 2.6 Camera rig (`lib/mission/camera.ts` + `CameraRig.tsx`)
Per zone a list of keyframes `{ zt, pos:[x,y,z], look:[x,y,z] | 'robot', followWeight }`; between keyframes smoothstep. `look:'robot'` targets robot base + (0,0.3,0). Add hand-held noise `0.02·simplex(t)` (off in static/reduced). Zone plans:
| Zone | Shot |
|---|---|
| 0 | start (2.5,1.1,9.5) → (4,3.2,11) looking at robot; the sweep reveals the room around it |
| 1 | dolly (14,2.4,7.6) looking at display wall centre (14,1.5,0.25); robot in frame lower-left |
| 2 | follow from behind-above: robot + (0.6·side, 2.3, 3.4) in robot frame; look at active placard |
| 3 | glide along aisle at (x_robot + 2.5, 2.1, 38 ± 2.6 toward active pedestal) looking at pedestal top |
| 4 | 40° orbit around (-4,0.8,38) at radius 6.5, height 2.4 |
| 5 | tracking shot (-5, 2.2, z_robot + 4) looking at active rack |
| 6 | wide high (-2, 7, 12) looking at (-3,0,4) for loop closure → settle to low hero angle (-6.5,0.9,7.5) looking at docked robot |

---

## 3. Robots

### 3.0 One generic articulated-robot component, data-driven
Every real robot (Trakr, Go2, R1, UR5e) is described by a JSON link tree generated at build time and rendered by **one** component:
- `scripts/models/urdf2json.py` — parses a URDF (`xml.etree`), emits `public/models/<robot>/robot.json`: `{ links:[{ name, parent, joint:{ type, axis:[x,y,z], xyz:[..], rpy:[..], lower, upper }, mesh:'<link>.glb'|null, meshXyz, meshRpy, meshScale }] }`. For MJCF sources (Go2, UR5e) the same JSON is hand-written from the body/joint tables already extracted (below).
- `components/mission/world/robots/ArticulatedRobot.tsx` — builds nested `<group>`s from the JSON (joint frame = xyz + rpy, then a child group rotated about the joint axis by `joints.current[name]`), loads each link's GLB with `useGLTF`, applies the shared stylised material + fresnel rim. Whole robot sits in `<group rotation={[-Math.PI/2,0,0]}>` (URDF/MJCF are Z-up). Props: `robot`, `jointsRef`, `material`, `scale`.
- `QuadrupedRobot.tsx` — wraps `ArticulatedRobot` with `gait.ts`, given a joint-name map `{ FL:{abd,hip,knee}, FR:…, RL:…, RR:… }` and the robot's default standing angles. Works for Trakr and Go2 unchanged.

### 3.1 Addverb Trakr (hero robot) — `HumanoidAddverb/trakr_legged_rl`, `resources/robots/trakr/urdf/robot.urdf` + 17 STL (≈ 20 MB raw)
Joint tree from the URDF (all revolute axes are Z in their own joint frames — the joint `rpy` values orient them; `urdf2json.py` must keep `rpy`):
```
base (base_link.STL, visual origin y +0.008) ─ neck (fixed) → head (no mesh)
├ FL_adduction  xyz(-0.055,  0.171, 0.057) axis  z  [-0.785, 0.785] → FL_hip   (FL_hip.STL)
│ └ FL_hip      xyz( 0.090,  0,     0.0565) axis z  [-1.0, 0.8]     → FL_thigh (FL_thigh.STL)
│   └ FL_knee   xyz( 0.20077, 0, 0)        axis z  [-1.10, 0.70]    → FL_shank (FL_shank.STL) ─ FL_toe fixed xyz(0.20917,0,0) (FL_toe.STL)
├ FR_adduction  xyz( 0.055,  0.171, 0.057) axis -z → FR_hip xyz(-0.090, 0, -0.0565) → FR_knee (same lengths)
├ RL_adduction  xyz(-0.055, -0.171, 0.057) axis  z → RL_hip xyz( 0.090, 0, -0.0565) → RL_knee
└ RR_adduction  xyz( 0.055, -0.171, 0.057) axis -z → RR_hip xyz(-0.090, 0,  0.0565) → RR_knee
```
Y is forward (head at y +0.351), X lateral, Z up; thigh 0.201 m, shank 0.209 m. **The URDF zero pose is not the standing pose** (SolidWorks export): take default standing angles from the repo's legged_gym config (`default_joint_angles` in `trakr_config.py`) at P2, and confirm STL units (mm vs m) on first load.
**License note:** the repository carries no LICENSE file; Adyansh (ex-Addverb) confirmed on 2026-09-03 that use is fine. Record that in `public/models/LICENSES.md`. Go2 stays a drop-in fallback through the same `QuadrupedRobot` component.

### 3.2 Unitree Go2 — MuJoCo Menagerie `unitree_go2` (BSD-3), meshes OBJ
Role: a 0.35-scale walking Go2 inside hologram #1 (its own project); also the fallback hero. Build in **MuJoCo frame** (x fwd, y left, z up). Link tree (positions from `go2.xml`):
```
base (7 sub-meshes merged → base.glb)
├ FL_hip  pos ( 0.1934,  0.0465, 0)  joint FL_hip_joint   axis x  range [-1.05, 1.05]   mesh hip.glb
│ └ FL_thigh pos (0, 0.0955, 0)     joint FL_thigh_joint axis y  range [-1.57, 3.49]   mesh thigh.glb
│   └ FL_calf  pos (0, 0, -0.213)   joint FL_calf_joint  axis y  range [-2.72, -0.84]  mesh calf.glb + foot.glb at (0,0,-0.213)
├ FR_hip  pos ( 0.1934, -0.0465, 0)  hip mesh rotated 180° about x; thigh_mirror.glb, calf_mirror.glb
├ RL_hip  pos (-0.1934,  0.0465, 0)  hip mesh rotated 180° about y; thigh.glb, calf.glb;  thigh range [-0.52, 4.54]
└ RR_hip  pos (-0.1934, -0.0465, 0)  hip mesh rotated 180° about z; thigh_mirror.glb, calf_mirror.glb
```
Standing height: base z ≈ 0.32 with thigh 0.8 rad, calf −1.5 rad. Materials: one stylised `MeshStandardMaterial` per link group (graphite `#1A2028`, metalness .3, roughness .55) + `onBeforeCompile` fresnel rim in accent; LED strip on the head (small emissive box) blinks with HUD status.
GLB budget: base ≤ 350 KB, each leg part ≤ 120 KB → total ≤ 900 KB after Draco.

**Gait (`lib/mission/gait.ts`)** — trot, diagonal pairs (FL+RR phase φ, FR+RL phase φ+π). Constants below are Go2's; Trakr gets its own set (same formulas, offsets from its default standing angles, amplitudes scaled by leg length 0.41 vs 0.43 m):
```
phase advance  dφ = 2π · ds / 0.36           (ds = robot arc-length travelled this frame)
thigh(φ) = 0.80 + 0.28·sin(φ)
calf(φ)  = -1.50 - 0.55·max(0, sin(φ + 0.35))          (lift only in swing)
hip(φ)   = 0.04·sin(φ/2)                                (lateral sway)
body bob = 0.012·sin(2φ);  pitch = 0.02·speed
idle (speed≈0): φ frozen, thigh += 0.015·sin(time·1.4) (breathing), head LED slow pulse
```
Turning: yaw follows heading with critically-damped smoothing (τ 0.25 s).

### 3.3 Unitree R1 humanoid (Zone 02, Robotics Collective placard) — `unitree_ros/robots/r1_description` (BSD-3), `R1.urdf` + 43 STL (22.7 MB raw)
26 revolute joints (legs 2×6, waist 2, arms 2×5, head 2), 40 visual meshes. Generated by `urdf2json.py`; small ankle rods/constraint links (< 120 KB STL each) are dropped from visuals. Pose: fixed standing pose (legs slightly bent, arms relaxed) + a scripted loop when the camera is within 10 m: right arm raises (shoulder_pitch/roll, elbow) as a teleop wave, head_yaw tracks the robot Trakr/Go2 as it passes, a speech-waveform bar (thin instanced boxes) pulses above the head — literal to the teleoperation + speech-recognition work. Budget ≤ 900 KB after Draco (decimate hard: `--simplify-error 0.003`).

### 3.4 UR5e (RWTH hackathon hologram) — Menagerie `universal_robots_ur5e` (BSD-3)
Chain from `ur5e.xml` (build in MuJoCo frame, same −90° X group): base(quat 180° z) → shoulder_link pos(0,0,0.163) axis z → upper_arm_link pos(0,0.138,0) quat(90° y) axis y → forearm_link pos(0,−0.131,0.425) axis y → wrist_1 pos(0,0,0.392) quat(90° y) axis y → wrist_2 pos(0,0.127,0) axis z → wrist_3 pos(0,0,0.1) axis y. Merge sub-meshes per link → 7 GLBs ≤ 600 KB total. Animation: 3 keyframed poses (home → pre-grasp → place) looped with easing; no IK.

### 3.5 Crazyflie 2 — Menagerie `bitcraze_crazyflie_2` (MIT), `cf2_0..6.obj` merged → `crazyflie.glb` ≤ 120 KB.

### 3.6 Procedural (no downloads): mecanum base (R2), X-drive base + 3-DOF arm (AgroBot), kiwi 3-omni base (Kiwi), Tello quad (cross + 4 discs). Built from primitives in code; wheels get roller detail via `TorusGeometry` segments.

---

## 4. Holograms (Zone 3) — one per project, literal to the work
Shared: `HologramFrame.tsx` = pedestal (cylinder r .55 h .9, `--panel`, accent emissive top ring) + scan-line cylinder (transparent shader, moving bands) + 1.6 m content cube. Content uses `HologramMaterial` (accent tint, additive, fresnel, `uActive`) except GLB robots (own materials + rim). Hologram `useFrame` runs only when `distance(camera) < 14`; group `visible` only for zone ±1.
| # | Project | Hologram |
|---|---|---|
| 1 | Go2 Autonomous Inspection | Mini facility grid (instanced cells) exploring itself: frontier cells blink, watershed zone colouring floods rooms one by one, a 0.35-scale **Go2 GLB** walks the route (same `QuadrupedRobot`), per-zone "report" ticks |
| 2 | AI+Robotics Hackathon | UR5e GLB doing pick-and-place over a table of instanced voxel cubes (NvBlox mesh); target cube has a 3D bounding box; voxels inside it fade out = mesh subtraction |
| 3 | OLIVE | Factor graph: keyframe nodes along a 56 m loop (scaled), odometry edges, 3 landmark nodes with observation edges; two trajectories overlaid: jumpy map-frame (snaps at loop closure) vs smooth local (never jumps) |
| 4 | WhyCode | 3 WhyCode markers (CanvasTexture discs: black ring, white centre, code teeth) + camera frustum + rays + per-marker 6-DOF axis gizmo; CPU bar animates 180% → 15% |
| 5 | Sepsis Atlas | Stack of paper sheets → chunks fly into a 3D embedding cloud (points, 3 clusters); one highlighted chunk keeps a line back to its source sheet (source grounding) |
| 6 | R2 Robocon | Procedural mecanum base strafing a figure-8 on a mini arena; YOLO boxes pop on 3 balls and a silo; TF-Luna beam to the silo |
| 7 | Kiwi Drive | Procedural 3-omni base; the three wheel velocity vectors drawn as arrows summing to body velocity while it drives a circle; EKF ellipse shrinks as it fuses |
| 8 | Vanguard | Arena grid under an overhead camera frustum ("Watchtower"); 5 event markers classify (label flips); A* path re-plans as danger zones toggle; tiny bot follows |
| 9 | AgroBot | Procedural X-drive + 3-DOF arm; 4 cotton bolls (white spheres on green stems) get detection boxes; arm picks the nearest; depth-camera frustum |
| 10 | Drone Systems | Crazyflie GLB hovering with 4 multiranger rays and a growing SLAM grid below; Tello (procedural) orbiting with an ArUco-tag "inventory" scan |
Tag filter link (from C): `store.activeTag` set by the chip bar → matching pedestals' rings go full accent, others dim to 35%.

---

## 5. Scroll and state architecture
- **GSAP** `gsap@^3.15` + `@gsap/react@^2.1` (`useGSAP` = StrictMode-safe cleanup). One `ScrollTrigger` on `main` (`scrub: true`, `onUpdate: s => store.set(s.progress)`). Never GSAP-`pin` the canvas. `ScrollTrigger.refresh()` after fonts load (`document.fonts.ready`).
- **Store** `lib/mission/store.ts`: mutable singleton `{ t, zone, zoneT, beat, robot:{x,y,z,yaw,speed}, seenFraction, activeTag, mode:'explore'|'inspect'|'dock', staticMode }` + `subscribe(fn)` (HUD listeners, throttled to 20 Hz) + `set(t)` that derives zone/zoneT/beat from `zones.ts`. R3F components read it in `useFrame` — **no React state per frame**.
- **DOM beats without React re-renders**: on update, each `<section>` gets `style.setProperty('--zt', zoneT)`; children compute visibility with CSS: `opacity: clamp(0, 1 - abs(var(--zt)*N - i - .5)*2.2, 1)` style expressions, `translateY` likewise. Framer Motion only for discrete UI (dialog, hover).
- **Canvas** mounted via `next/dynamic(() => import('./WorldCanvas'), { ssr:false, loading: () => <Poster/> })` inside a `'use client'` file. `position: fixed; inset:0; z-index:0`. `frameloop="always"`; Phase 5 adds idle throttling (30 fps when no scroll for 2 s; pause when `document.hidden`).
- **Zone nav** clicks → `section.scrollIntoView({behavior:'smooth'})` (native; no ScrollTo plugin). Hash sync: `history.replaceState(null,'',`#${zone.id}`)` on zone change (throttled); on load with a hash → scroll to it after `ScrollTrigger.refresh()`.
- **Hydration safety**: anything reading `window` lives in effects; HUD renders deterministic initial values.

---

## 6. HUD (`components/mission/hud/*`, `position: fixed`, `pointer-events: none` except controls)
| Part | Where | Content |
|---|---|---|
| `MissionStatus` | top-left | `MODE EXPLORE / INSPECT / DOCK` · `zone_3 · PROJECTS` · `mapped 43%` · `T+00:42` (derived from t) · SIM badge (tooltip: "telemetry simulated from scroll") |
| `Minimap` | bottom-left, 220 × 240 px `<canvas>` | facility outline, seen cells (from reveal data, 2 px per cell), zone labels, robot dot + heading, camera wedge; click a zone → scroll. 20 Hz from store |
| `TopicTicker` | bottom, full width, mono 12px | `/scan 10 Hz · /tf 100 Hz · /odom 50 Hz · frontiers 3 · zones 7` — values derived from t so they change meaningfully (frontiers ↓ as mapped ↑) |
| `ZoneNav` | right edge | 7 buttons (dot + label on hover/focus), active state, `aria-current` |
| `ConsoleButton` | top-right | opens `ChatConsole` slide-over from any zone |
| Frame | viewport corners | one set of corner brackets, 1px `--grid`; accent on the active corner when scanning |
HUD hides while a project sheet dialog is open. Static mode: minimap static, ticker static, no T+ clock.

---

## 7. DOM sections (`components/mission/sections/*`) — content verbatim from `content/*`
| Zone | Layout & beats | Content |
|---|---|---|
| 0 Hero | Boot sequence once (CSS keyframes, 1.6 s): HUD corners draw, status lines type in (`sensors ok · lidar ok · map empty`). Name in Big Shoulders at `clamp(96px,12vw,200px)`; headline; tagline; status; CTAs; socials; "scroll to explore" with a LiDAR tick glyph | `site.ts` |
| 1 Profile | Left: eyebrow `ZONE 01 · PROFILE`, mission quote (large), education timeline (2). Right: tech-stack inventory, 28 mono chips in a 4-col grid with `28 ITEMS` count. Beats fade groups in | `site.ts`, `education.ts`, `techStack.ts` |
| 2 Experience | Left rail: 6 door nodes with company + period; right: one role card at a time (title, company, location, period, description, 2 highlights, badges), crossfade per beat. Order = old order (Robotics Collective first). In 3D the **R1 humanoid** stands at placard 1 and waves as the hero quadruped passes; placard 2 (Addverb) carries a WhyCode marker; placard 4 (Avignon) a hovering Crazyflie | `experience.ts` |
| 3 Projects | Top: tag chip bar (all unique tags, hover/click → `activeTag`). Card per beat: `PRJ-001`, title, venue, year, award, short description, tags, `Open sheet` → dialog. Beat matches the pedestal the camera is at | `projects.ts` |
| Project sheet (dialog) | Radix `Dialog` (existing `components/ui/dialog.tsx`). Title block (B borrowing): `SHEET 01 / 10 · <venue> · <year> · <award?> · PRJ-001`. Left: the project's SVG glyph (reused, accent constant). Media: `MediaCarousel` (unchanged behaviour). Overview = description + fullDescription. Tech stack list. Key challenges. Links (GitHub / demo when not `#`) | `projects.ts` + `glyphs/*` |
| 4 Hackathons | 3 cards side by side, rank badge coloured gold `#fbbf24` / silver `#d4d4d8` / accent; organizer, date, description, tags; podiums light in sync | `hackathons.ts` |
| 5 Credentials | 3 groups as beats (Publications 1, Patents 2, Certifications 3): item title, id, year, status, description, highlights, link | `credentials.ts` |
| 6 Dock | Beat 1: `LOOP CLOSED · MISSION COMPLETE · 100% MAPPED`. Beat 2: contact "commands" (3 exact strings + outputs as links), résumé download (`/my-portfolio/resume.pdf`, `download="Adyansh_Gupta_Resume.pdf"`). Beat 3: embedded `ChatConsole` ("mission control"), footer | `contact.ts`, `ChatConsole.tsx` |

`ChatConsole.tsx` = the `AIChatTerminal` logic lifted from `hero-section.tsx` unchanged (worker URL, retry/backoff, Gemini `contents` payload, initial greeting text), restyled to tokens.

---

## 8. Content module + verification
`content/types.ts` (Project, Experience, Hackathon, CredentialGroup, Education, Site, ContactCommand) · `content/site.ts` · `content/education.ts` · `content/tech-stack.ts` · `content/experience.ts` · `content/projects.ts` · `content/hackathons.ts` · `content/credentials.ts` · `content/contact.ts` · `content/index.ts`.
Icons become string names (`'Bot' | 'Rocket' | 'Cpu' | 'Code' | 'GraduationCap' | 'Briefcase' | 'Trophy' | 'Medal' | 'Award' | 'FileText' | 'BadgeCheck'`) mapped to lucide in UI.
`scripts/check-content.mjs`: `git show main:components/<old>.tsx` for the 6 old data files → extract every quoted string literal ≥ 24 chars inside the data arrays → assert each appears verbatim in the concatenated `content/*.ts` → also assert counts 10 / 6 / 3 / (1,2,3) / 2 / 28 / 3. Exit 1 on any miss. Wire as `npm run check:content`.

---

## 9. Asset pipeline (`scripts/models/`)
- `fetch.mjs`: download to `assets-src/` (gitignored):
  - Menagerie (`https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/main/`): `unitree_go2/assets/*.obj` + `LICENSE`, `universal_robots_ur5e/assets/*.obj` + `LICENSE`, `bitcraze_crazyflie_2/assets/cf2_[0-6].obj` + `LICENSE`.
  - Unitree R1: `https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/r1_description/R1.urdf` + `meshes/*.STL` (43 files) + repo `LICENSE` (BSD-3).
  - Trakr: `https://raw.githubusercontent.com/HumanoidAddverb/trakr_legged_rl/main/resources/robots/trakr/urdf/robot.urdf` + `meshes/*.STL` (17 files); record Adyansh's permission in `LICENSES.md`.
- `urdf2json.py`: URDF → `robot.json` (§3.0), resolving `../meshes/x.STL` → `x.glb`.
- `convert.py` (python3 + **trimesh 4.12 already installed**, reads OBJ and STL): per link, load its parts, `trimesh.util.concatenate`, drop materials, fix units if the STL is in mm (bbox sanity check: a leg link must be < 1 m), export `.glb` → `public/models/<robot>/<link>.glb`. Link maps: go2 {base:[base_0..4], hip:[hip_0,1], thigh:[thigh_0,1], thigh_mirror, calf:[calf_0,1], calf_mirror, foot}; ur5e {base, shoulder, upperarm, forearm, wrist1, wrist2, wrist3}; crazyflie {body:[cf2_0..6]}; trakr and r1: one GLB per URDF visual mesh.
- `npx @gltf-transform/cli@4 optimize <in> <out> --compress draco --simplify --simplify-error 0.0015` (verify flag names with `--help` at run time), then `inspect` to confirm sizes against the budgets in §3.
- Copy Draco decoder: `node_modules/three/examples/jsm/libs/draco/gltf/*` → `public/draco/`; `useGLTF.setDecoderPath(asset('/draco/'))`.
- `public/models/LICENSES.md`: BSD-3 (Unitree, Universal Robots / ROS-Industrial via Menagerie), MIT (Bitcraze) full texts + source URLs. Required by the licences.
- `useGLTF.preload()` for the hero quadruped's links at module scope; R1 when zone 2 is within ±1; ur5e + crazyflie + Go2-mini when zone 3 is within ±1. Budgets after Draco: hero quadruped ≤ 900 KB, R1 ≤ 900 KB, UR5e ≤ 600 KB, Go2-mini shares the Go2 files, Crazyflie ≤ 120 KB → ≤ 3.5 MB of 3D total (budget in §11 raised accordingly).

---

## 10. Base path
`lib/base-path.ts`: `export const BASE = '/my-portfolio'; export const asset = (p) => `${BASE}${p}``. Use for every loader URL (GLB, Draco, posters, resume). Next only prefixes `Link`/`Image`/router; loaders and `fetch` are not prefixed.

---

## 11. Performance, fallbacks, accessibility
- Budgets: JS ≤ 450 KB gz on first load incl. three/R3F/drei/gsap (Spline removal pays for it); 3D ≤ 3.5 MB total, only the hero robot on the critical path; 60 fps at 1440p on this machine; ≥ 40 fps on a mid-range laptop iGPU at dpr 1.
- `dpr={[1,1.5]}`, `antialias:false`, `powerPreference:'high-performance'`, `<PerformanceMonitor onDecline>` → dpr 1 + point draw range 80k + holograms limited to ±0 zone, `<AdaptiveDpr/>`.
- Zone groups `visible` only for zone ±1; hologram `useFrame` gated by distance; single draw calls for floor / points / walls.
- **Static mode** (`lib/mission/static-mode.ts`): `prefers-reduced-motion` OR `useDetectGPU().tier === 0` OR viewport < 768 px OR `?mode=static` → no canvas; each section shows its poster (`public/posters/zone-<k>.jpg`, generated in Phase 5 by screenshotting the world) as a fixed background crossfading per zone; minimap static; DOM content identical.
- Poster `<img>` for the hero in prerendered HTML (canvas is never an LCP candidate); canvas fades in when the first frame renders.
- a11y: all content is DOM; canvas `aria-hidden`; ZoneNav are buttons with labels; dialog = Radix (focus trap, Esc); visible focus ring in accent; contrast checked (`--text` on `--ground` 15:1; `--muted` 6.4:1; accent on ground 7.9:1 for labels).
- Analytics unchanged (PostHog/Umami/Vercel providers stay in `layout.tsx`).

---

## 12. File tree

### New
```
content/                          (§8)
lib/base-path.ts
lib/mission/zones.ts              zone ids, labels, bounds, scrollVh, beats, camera keyframes
lib/mission/facility.ts           wall segments + doors, grid dims, pedestal/placard/podium/rack positions
lib/mission/path.ts               waypoints, arc-length curve, robotPose(t), beat plateaus
lib/mission/reveal.ts             seen-at precompute (grid + point cloud), loop-closure drift
lib/mission/gait.ts               trot gait → 12 joint angles
lib/mission/camera.ts             keyframe interpolation helpers
lib/mission/store.ts              mutable store + subscribe
lib/mission/static-mode.ts        detection of static mode
lib/mission/turbo.ts              turbo colormap (JS + GLSL string)
components/mission/MissionPage.tsx           client root: sections + canvas + HUD + GSAP master trigger
components/mission/WorldCanvas.tsx           next/dynamic import of the Canvas; Poster fallback
components/mission/world/World.tsx           lights, fog, zone groups, Preload
components/mission/world/CameraRig.tsx
components/mission/world/Floor.tsx           instanced grid + shader
components/mission/world/Walls.tsx
components/mission/world/PointCloud.tsx
components/mission/world/LidarSweep.tsx
components/mission/world/robots/ArticulatedRobot.tsx   generic JSON-driven link tree (§3.0)
components/mission/world/robots/QuadrupedRobot.tsx     ArticulatedRobot + gait + joint map (Trakr / Go2)
components/mission/world/robots/R1Humanoid.tsx         ArticulatedRobot + scripted wave/head-track
components/mission/world/zones/Zone0Spawn.tsx … Zone6Dock.tsx
components/mission/world/holograms/HologramFrame.tsx, HologramMaterial.ts, + 10 hologram files (§4)
components/mission/world/robots/UR5e.tsx, Crazyflie.tsx, MecanumBase.tsx, XDriveBase.tsx, KiwiBase.tsx, TelloQuad.tsx
public/models/<robot>/robot.json                      generated link trees (trakr, go2, r1, ur5e)
components/mission/world/shaders/*.ts        GLSL as template strings (grid, points, sweep, hologram)
components/mission/hud/Hud.tsx, MissionStatus.tsx, Minimap.tsx, TopicTicker.tsx, ZoneNav.tsx, ConsoleButton.tsx, HudFrame.tsx
components/mission/sections/HeroSection.tsx, ProfileSection.tsx, ExperienceSection.tsx, ProjectsSection.tsx, ProjectSheet.tsx, TagFilter.tsx, HackathonsSection.tsx, CredentialsSection.tsx, DockSection.tsx, ChatConsole.tsx
components/mission/ui/Eyebrow.tsx, TitleBlock.tsx, Chip.tsx, IconByName.tsx
scripts/check-content.mjs
scripts/models/fetch.mjs, scripts/models/convert.py, scripts/models/urdf2json.py
public/models/**, public/draco/**, public/posters/**, public/models/LICENSES.md
```
### Modified
`app/page.tsx` (renders `<MissionPage/>`), `app/layout.tsx` (fonts, `<html class="dark">`, remove Space Grotesk/JetBrains), `app/globals.css` (tokens, base, HUD utilities, beat CSS), `components/media-carousel.tsx` (tokens only), `components/glyphs/*.tsx` (replace `useColorTheme` with an `accent` prop defaulting to `#FF7A1A`; `glyphs/index.tsx` keeps the folder → glyph map), `package.json` (deps + `check:content` script), `.gitignore` (`assets-src/`).
### Deleted
`components/hero-section.tsx, bento-grid.tsx, experience-timeline.tsx, projects-grid.tsx, hackathons-section.tsx, credentials-accordion.tsx, contact-terminal.tsx, perception-hud.tsx, media-collage.tsx, color-theme-provider.tsx, color-theme-switcher.tsx, theme-provider.tsx (if unused), animations/**, ui/spline-scene.tsx, ui/spotlight.tsx`; docs `LOCAL_MEDIA_SETUP.md, QUICK_MEDIA_GUIDE.md, MEDIA_GUIDE.md, MEDIA_SETUP_GUIDE.md, UPDATE_SUMMARY.md, PROJECTS_COMPLETE.md` are stale v0 notes → move the still-true parts into `docs/redesign/HANDOFF.md` §2 and delete. Keep `components/ui/*` (shadcn) for now; prune unused later.
### Dependencies
Add `gsap@^3.15.0`, `@gsap/react@^2.1.2`. Bump `@react-three/fiber@^9.7.0`, `@react-three/drei@^10.7.8`. Remove `@splinetool/react-spline`, `@splinetool/runtime`. Keep `three@0.184.0`, `framer-motion@12`. No `urdf-loader` (robots are hand-assembled from GLB links). No postprocessing. Dev via `npx`: `@gltf-transform/cli@4`.

---

## 13. Phases, checkpoints, verification
Each phase ends with: `npx tsc --noEmit` clean · `npm run lint` clean · dev server check in the browser at http://localhost:3000/my-portfolio · no console errors · `HANDOFF.md` updated.

**P0 · Foundation (content, tokens, skeleton)**
1. `npm i gsap @gsap/react && npm i @react-three/fiber@^9.7.0 @react-three/drei@^10.7.8 && npm rm @splinetool/react-spline @splinetool/runtime`.
2. Create `content/*` verbatim from the old arrays; `scripts/check-content.mjs`; `npm run check:content` passes.
3. `layout.tsx` fonts + `globals.css` tokens; `lib/base-path.ts`.
4. `MissionPage.tsx` with the 7 sections rendering all content as plain DOM (no canvas yet) using the new type; `page.tsx` swapped; old components deleted; glyphs refactored.
Checkpoint: every fact visible on one scrolling page in the new type; check script green.

**P1 · World skeleton + scroll rig**
1. `zones.ts`, `facility.ts`, `path.ts`, `store.ts`, `camera.ts`.
2. `WorldCanvas` + `World` with `Floor` (all cells visible for now), `Walls`, `CameraRig`; master ScrollTrigger; sections get `scrollVh` heights + sticky frames + `--zt`.
3. HUD: `MissionStatus`, `Minimap`, `ZoneNav`, `HudFrame`.
Checkpoint: scrolling moves the camera through all 7 zones; minimap and status track; nav jumps work; hash sync works.

**P2 · Robot, LiDAR, reveal**
1. `scripts/models/fetch.mjs` + `urdf2json.py` + `convert.py` → Trakr GLBs + `robot.json` within budget, plus Go2 GLBs for hologram #1; `LICENSES.md`; Draco decoder copied.
2. `ArticulatedRobot` + `QuadrupedRobot` + `gait.ts`; robot walks the path with the scroll, pauses at beats. Trakr: default standing angles from `trakr_config.py`.
3. `reveal.ts` precompute; `Floor`/`Walls`/`PointCloud` shaders with `aSeenAt`; `LidarSweep`; loop-closure drift at zone 6.
Checkpoint: the map reveals itself as you scroll; measured reveal precompute time noted in HANDOFF; 60 fps at 1440p.

**P3 · Zone dressing + holograms**
1. R1 humanoid (`R1Humanoid.tsx`, Zone 02), UR5e + Crazyflie GLBs; procedural bases.
2. Zone 1 display wall, zone 2 placards + strips, zone 3 pedestals + 10 holograms, zone 4 podiums, zone 5 racks, zone 6 dock.
3. Tag filter ↔ pedestal ring linkage.
Checkpoint: every zone has its 3D scene; holograms animate only when near; draw calls < 120.

**P4 · DOM polish + interactions**
1. Hero boot sequence; beats CSS for experience/projects/credentials; hackathon podium sync.
2. `ProjectSheet` dialog with title block, glyph, carousel, overview, stack, challenges, links.
3. `ChatConsole` slide-over + dock embed; contact commands; résumé link; footer.
Checkpoint: complete site locally; keyboard walkthrough; dialog focus trap; chat round-trip works.

**P5 · Performance, fallbacks, a11y**
1. Posters (screenshot the world per zone → `public/posters/`), hero poster in HTML, canvas fade-in.
2. Static mode + reduced motion + `?mode=static`; mobile layout pass at 390 px.
3. Idle frame throttling; `PerformanceMonitor`; DPR clamp; measure with Chrome performance panel; Lighthouse ≥ 85 perf locally (desktop).
4. `npm run build` once to catch static-export/SSR errors (deploy still deferred).
Checkpoint: definition of done (§16).

---

## 14. Risks and mitigations
| Risk | Mitigation |
|---|---|
| URDF zero pose ≠ standing pose (Trakr, R1) | Default angles from the RL config / a hand-tuned pose file `public/models/<robot>/pose.json`; `?debug=joints` sliders |
| STL units in mm | bbox sanity check in `convert.py`, scale 0.001 when needed |
| GLB conversion quality (trimesh drops materials, normals) | We restyle materials anyway; recompute normals on import (`geometry.computeVertexNormals()` if missing); fall back to `npx obj2gltf` per part |
| Gait looks wrong | Tune the 5 constants in `gait.ts` live with a dev-only leva-free `?debug=gait` query that exposes sliders via `<input type=range>` in a corner |
| Scroll jank | scrub value 0.4–0.8; no React state per frame; instanced geometry; check with the FPS overlay in `?debug=perf` |
| Hydration mismatch | canvas + HUD client-only via `next/dynamic` / mount guards |
| next/font axes | `Big_Shoulders` needs `axes:['opsz']` and `weight:'variable'`; verify build |
| Reveal precompute too slow on mobile | mobile is static mode anyway; desktop measured; move to build-time binary if > 300 ms |
| Turbopack + GLSL | shaders as TS template strings, no loader config |

## 15. Deferred (notes only — do not act until Adyansh says so)
**Media (769 MB in `public/projects`)**: convert GIF/MKV/MP4 → H.264 MP4 (CRF 26–28, ≤ 1080p, `-movflags +faststart`) + WebM VP9 + poster JPG per file; update `scripts/generate-media-manifest.mjs` to prefer MP4 and emit `poster`; remove sources from git after backup; replace 0-byte `abu-robocon/Robocon 1.mp4`. ffmpeg 6.1 is installed.
**Deployment**: GitHub Pages workflow + `basePath` unchanged; before shipping run `npm run build`, serve `out/` locally under `/my-portfolio`, check GLB/Draco/poster paths, check total size < 1 GB, consider moving media to a CDN if a custom domain is chosen.

## 16. Definition of done (local)
- All 7 zones render with their 3D scenes and DOM content; `npm run check:content` passes; 10 project sheets open with media.
- 60 fps at 1440p on this machine; no console errors; `tsc` and `lint` clean; `npm run build` succeeds.
- Static mode, reduced motion, keyboard navigation, and chat all work.
- `HANDOFF.md` reflects the final state.
