'use client'

import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useFrame } from '@react-three/fiber'
import { GO2_DEF, GO2_LEGS } from '@/lib/mission/robots'
import { GO2_GAIT } from '@/lib/mission/gait'
import { asset } from '@/lib/base-path'
import { QuadrupedRobot } from '../../robots/QuadrupedRobot'
import { UR5eArm, type ArmPhase } from '../../robots/UR5eArm'
import { CrazyflieDrone } from '../../robots/CrazyflieDrone'
import { go2MaterialFor } from '../../robots/robotMaterial'
import { emissive, lineMat, useClock, useNear } from './tallParts'
import { TRAFFIC, wallRuns, type SlabDesign, type XZ } from '../data/projects'
import { PooledLight } from '../../LightPool'

/**
 * The lower half of each hologram: the project's own hardware doing the project's own job.
 *
 * There is deliberately no shared form. A helical ramp suited exactly one of these ten and read as
 * decoration on the other nine — a manipulator, a fiducial rig, an overhead-camera arena and a
 * three-wheel omni base have nothing worth abstracting into a common shape. What they do share is
 * a stance: a plinth that lifts the work to roughly eye level for a camera 7.4 m out, and motion
 * big enough to read at that distance.
 */

/** Design coordinates are about ±0.46; this maps them onto the deck. */
const S = 1.8
/** Deck surface. The console panel starts at 0.77, so a stage has 0.22 → 0.72 to work in. */
export const DECK = 0.22

/**
 * Vehicle sizes come from the same TRAFFIC table `check:holograms` measures against, so a robot
 * can never quietly outgrow the gap it was cleared for. `half` is a half-width in design units;
 * ×2×S is the full width on the deck.
 */
/** the Go2 is about 0.31 m across the hips */
const GO2_SCALE = (TRAFFIC['go2-inspection'].half * 2 * S) / 0.31
/** Rover draws its body `size * 1.7` wide */
const ROVER_SIZE = { agrobot: (TRAFFIC.agrobot.half * 2 * S) / 1.7 }
/** how far the picker can reach off the furrow: half a row spacing, near enough */
const REACH = 0.155
/** the UR5e's 0.85 m reach lands at 0.6 on the deck — inside the 0.9 platform */
const ARM_SCALE = 0.7

/* ------------------------------------------------------------------ shared */

const STEEL = () => new THREE.MeshStandardMaterial({ color: '#aab4c1', metalness: 0.72, roughness: 0.3 })
const DARK = () => new THREE.MeshStandardMaterial({ color: '#232a34', metalness: 0.5, roughness: 0.62 })

/** Runs from the project description, extruded as low walls / rails / rows. */
function runGeometry(runs: [XZ, XZ][], h: number, t: number, y: number) {
  const geos = runs
    .map(([a, b]) => {
      const ax = a[0] * S, az = a[1] * S, bx = b[0] * S, bz = b[1] * S
      const len = Math.hypot(bx - ax, bz - az)
      if (len < 1e-4) return null
      const g = new THREE.BoxGeometry(len, h, t)
      g.rotateY(Math.atan2(-(bz - az), bx - ax))
      g.translate((ax + bx) / 2, y + h / 2, (az + bz) / 2)
      return g
    })
    .filter(Boolean) as THREE.BufferGeometry[]
  return geos.length ? mergeGeometries(geos, false) : null
}

/** The same runs drawn as a wire volume — floor line, cap line, corner posts. For the projects
 *  whose structure is a room the robot moves *through* rather than a floorplan seen from above. */
function wireRoom(runs: [XZ, XZ][], h: number, mat: THREE.LineBasicMaterial) {
  const pts: THREE.Vector3[] = []
  for (const [a, b] of runs) {
    const ax = a[0] * S, az = a[1] * S, bx = b[0] * S, bz = b[1] * S
    pts.push(new THREE.Vector3(ax, DECK, az), new THREE.Vector3(bx, DECK, bz))
    pts.push(new THREE.Vector3(ax, DECK + h, az), new THREE.Vector3(bx, DECK + h, bz))
    pts.push(new THREE.Vector3(ax, DECK, az), new THREE.Vector3(ax, DECK + h, az))
  }
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat)
}

/** The plinth every stage stands on, with an accent lip so its edge reads from across the hall. */
function Plinth({ accent, r = 0.9 }: { accent: string; r?: number }) {
  const col = useMemo(() => new THREE.MeshStandardMaterial({ color: '#39424e', metalness: 0.75, roughness: 0.4 }), [])
  const top = useMemo(() => new THREE.MeshStandardMaterial({ color: '#161c25', metalness: 0.4, roughness: 0.7 }), [])
  const lip = useMemo(() => emissive(accent, 0.7), [accent])
  return (
    <group>
      <mesh material={col} position={[0, DECK / 2, 0]}>
        <cylinderGeometry args={[r * 0.5, r * 0.62, DECK, 24]} />
      </mesh>
      <mesh material={top} position={[0, DECK - 0.012, 0]}>
        <cylinderGeometry args={[r, r, 0.024, 40]} />
      </mesh>
      <mesh material={lip} position={[0, DECK, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[r, 0.009, 6, 56]} />
      </mesh>
    </group>
  )
}

/** The route the hardware follows, drawn on the deck. */
function Route({ design, color, y = 0.004, width = 1 }: { design: SlabDesign; color: string; y?: number; width?: number }) {
  const mat = useMemo(() => lineMat(color, 0.9), [color])
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(design.path.map((p) => new THREE.Vector3(p[0] * S, DECK + y, p[1] * S)))
    return design.closed ? new THREE.LineLoop(g, mat) : new THREE.Line(g, mat)
  }, [design, mat, y])
  return <primitive object={obj} />
}

/** Follows the project's own path; every stage that moves, moves along this. */
function usePathPose(design: SlabDesign, speed = 0.5) {
  const t = useClock()
  const pose = useRef<Pose>({ x: 0, z: 0, yaw: 0, u: 0 })
  const prev = useRef<[number, number] | null>(null)
  useFrame((_, dt) => {
    const p = design.path
    const legs = design.closed ? p.length : p.length - 1
    // An open route is walked out and back. Wrapping it would teleport the robot the length of the
    // stage on every lap, which is what the AgroBot was doing at the end of each field pass.
    const span = design.closed ? legs : legs * 2
    let s = (t.current * speed) % span
    if (!design.closed && s > legs) s = span - s
    const i = Math.min(legs - 1, Math.floor(s))
    const k = s - i
    const a = p[i]
    const b = p[(i + 1) % p.length]
    const x = (a[0] + (b[0] - a[0]) * k) * S
    const z = (a[1] + (b[1] - a[1]) * k) * S
    // Heading comes from where it actually moved, not from the leg direction, so it stays right
    // going backwards along a ping-pong and turns rather than snapping at a corner.
    const q = prev.current
    if (q && (x - q[0]) ** 2 + (z - q[1]) ** 2 > 1e-9) {
      const want = Math.atan2(-(z - q[1]), x - q[0])
      const d = Math.atan2(Math.sin(want - pose.current.yaw), Math.cos(want - pose.current.yaw))
      pose.current.yaw += d * (1 - Math.exp(-Math.min(0.05, dt || 0.016) * 9))
    }
    prev.current = [x, z]
    pose.current.x = x
    pose.current.z = z
    pose.current.u = s / legs
  })
  return { pose, t }
}

export interface Pose {
  x: number
  z: number
  yaw: number
  u: number
}

/**
 * A wheeled base. `wheels` picks the drive: 4 = mecanum (angled rollers), 3 = kiwi/omni,
 * 4 with `x` = X-drive. It is the same chassis in each case because it is the same class of
 * machine — what differs is how it moves, and that is what the stage animates.
 */
function Rover({
  pose,
  color,
  t,
  wheels = 4,
  drive = 'mecanum',
  size = 0.16,
  children,
}: {
  pose: Pose
  color: string
  t: MutableRefObject<number>
  wheels?: number
  drive?: 'mecanum' | 'omni'
  size?: number
  children?: React.ReactNode
}) {
  const g = useRef<THREE.Group>(null)
  const spin = useRef<(THREE.Group | null)[]>([])
  const shell = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c3ccd8', metalness: 0.65, roughness: 0.32 }), [])
  const dark = useMemo(DARK, [])
  const band = useMemo(() => emissive(color, 1.3), [color])
  useFrame(() => {
    if (g.current) {
      g.current.position.set(pose.x, DECK + 0.04, pose.z)
      g.current.rotation.y = pose.yaw
    }
    spin.current.forEach((w) => w && (w.rotation.x = t.current * 4))
  })
  return (
    <group ref={g}>
      <mesh material={shell}>
        <boxGeometry args={[size * 2, 0.052, size * 1.7]} />
      </mesh>
      <mesh material={band} position={[0, 0.034, 0]}>
        <boxGeometry args={[size * 1.5, 0.011, size * 1.2]} />
      </mesh>
      {Array.from({ length: wheels }, (_, i) => {
        // mecanum sits four wheels at the corners; omni spaces three evenly
        const [wx, wz, wy] =
          drive === 'mecanum'
            ? [(i % 2 ? 1 : -1) * size, (i < 2 ? 1 : -1) * size * 0.9, 0]
            : [Math.cos((i / wheels) * Math.PI * 2 + Math.PI / 2) * size, Math.sin((i / wheels) * Math.PI * 2 + Math.PI / 2) * size, 0]
        const yaw = drive === 'mecanum' ? 0 : -Math.atan2(wz, wx)
        return (
          <group key={i} position={[wx, wy - 0.008, wz]} rotation-y={yaw}>
            <group ref={(el) => { spin.current[i] = el }}>
              <mesh material={dark} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.038, 0.038, 0.024, 14]} />
              </mesh>
              {/* the rollers that make it holonomic — the detail that identifies the drive */}
              {Array.from({ length: 6 }, (_, r) => {
                const a = (r / 6) * Math.PI * 2
                return (
                  <mesh key={r} material={band} position={[0, Math.cos(a) * 0.038, Math.sin(a) * 0.038]} rotation={[a, 0, drive === 'mecanum' ? Math.PI / 4 : 0]}>
                    <boxGeometry args={[0.023, 0.006, 0.013]} />
                  </mesh>
                )
              })}
            </group>
          </group>
        )
      })}
      {children}
    </group>
  )
}

/** A lit post — a detection, a landmark, a target. Rises when it becomes active. */
function Posts({ pts, color, active, height = 0.15 }: { pts: XZ[]; color: string; active?: MutableRefObject<number[]>; height?: number }) {
  const mat = useMemo(() => emissive(color, 1.6), [color])
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    if (!active) return
    refs.current.forEach((m, i) => {
      if (!m) return
      const on = active.current.includes(i)
      const target = on ? 1 : 0.12
      m.scale.y += (target - m.scale.y) * 0.12
    })
  })
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el }} material={mat} position={[p[0] * S, DECK + height / 2, p[1] * S]} scale-y={active ? 0.12 : 1}>
          <cylinderGeometry args={[0.013, 0.013, height, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** A trail that grows behind whatever is moving, then clears on the next lap. */
function useTrail(pose: Pose, color: string, max = 260) {
  const mat = useMemo(() => lineMat(color, 0.75), [color])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 3), 3))
    g.setDrawRange(0, 0)
    return g
  }, [max])
  const line = useMemo(() => new THREE.Line(geo, mat), [geo, mat])
  const n = useRef(0)
  const lastU = useRef(0)
  useFrame(() => {
    const arr = geo.attributes.position.array as Float32Array
    if (pose.u < lastU.current) n.current = 0
    lastU.current = pose.u
    if (n.current < max) {
      const i = n.current * 3
      arr[i] = pose.x
      arr[i + 1] = DECK + 0.012
      arr[i + 2] = pose.z
      n.current++
      geo.setDrawRange(0, n.current)
      geo.attributes.position.needsUpdate = true
    }
  })
  return line
}

/* ------------------------------------------------------------------ stages */

export interface StageProps {
  design: SlabDesign
  projectKey: string
}

/** go2-inspection — the Go2 walking an unknown facility room by room, logging what it finds. */
export function PatrolStage({ design, projectKey }: StageProps) {
  const { pose } = usePathPose(design, 0.42)
  // the same runs check:holograms validates — doorways cut wherever the route goes through
  const walls = useMemo(
    () => runGeometry(wallRuns(projectKey, design), 0.115, TRAFFIC[projectKey].runHalf * 2 * S, DECK),
    [design, projectKey],
  )
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4b545f', metalness: 0.4, roughness: 0.68 }), [])
  const trail = useTrail(pose.current, design.data)
  const found = useRef<number[]>([])
  useFrame(() => {
    design.pins.forEach((pin, i) => {
      if (found.current.includes(i)) return
      if (Math.hypot(pin.p[0] * S - pose.current.x, pin.p[1] * S - pose.current.z) < 0.16) found.current.push(i)
    })
    if (pose.current.u < 0.02) found.current.length = 0
  })
  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      {walls && <mesh geometry={walls} material={wallMat} />}
      <Route design={design} color={design.accent} />
      <primitive object={trail} />
      <Posts pts={design.pins.map((p) => p.p)} color={design.data} active={found} />
      <Suspense fallback={null}>
        <group scale={GO2_SCALE} position={[0, DECK, 0]}>
          <QuadrupedRobot def={GO2_DEF} folder={asset('/models/go2')} legs={GO2_LEGS} gait={GO2_GAIT} headingOffset={0} scale={1} baseHeight={0.32} pose={pose.current} autoWalk materialFor={go2MaterialFor} flipAxis="z" />
        </group>
      </Suspense>
    </group>
  )
}

/**
 * ai-robotics — the UR5e running a real pick-and-place.
 *
 * The arm's joint trajectory is the IK solution already used in the world scene, so the tool
 * genuinely arrives at a pick pose and a place pose. Everything else here is derived from that
 * rather than guessed: the part is parented to the reported tool centre while it is held, and the
 * feed tray and the drop pad are moved to wherever the tool actually grasps and releases. The
 * first version placed the part by hand in the stage's own frame — a whole deck height above the
 * gripper — and put the bin somewhere the arm never reached.
 */
export function ArmStage({ design }: StageProps) {
  const phase = useRef<ArmPhase | null>(null)
  const rig = useRef<THREE.Group>(null)
  const part = useRef<THREE.Mesh>(null)
  const tray = useRef<THREE.Group>(null)
  const pad = useRef<THREE.Group>(null)
  const pick = useMemo(() => new THREE.Vector3(), [])
  const place = useMemo(() => new THREE.Vector3(), [])
  const known = useRef(0)
  const wasHeld = useRef(false)

  const partMat = useMemo(() => emissive(design.data, 1.1), [design.data])
  const steel = useMemo(STEEL, [])
  const padMat = useMemo(() => lineMat(design.accent, 0.85), [design.accent])
  const padRing = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.085, 0, Math.sin(a) * 0.085))
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), padMat)
  }, [padMat])
  /** Both stations are columns standing on the deck whose tops get scaled up to meet the tool. A
   *  bench at a guessed height leaves the part hovering above it, which is what gave the first
   *  version away. Authored with the base at y=0 so scale.y sets the working height directly. */
  const column = useMemo(() => {
    const g = new THREE.BoxGeometry(0.26, 1, 0.26)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const post = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.1, 0.115, 1, 20)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  /** the clutter it has to pick out of, sat around the feed tray */
  const clutter = useMemo(() => {
    const geos = [
      [-0.1, 0.02, 0.05], [0.09, 0.03, -0.06], [0.02, 0.05, 0.11], [-0.07, 0.04, -0.10],
    ].map(([dx, h, dz], i) => {
      const g = new THREE.BoxGeometry(0.06, 0.035 + h, 0.06)
      g.rotateY(i * 0.8)
      g.translate(dx, (0.035 + h) / 2, dz)
      return g
    })
    return mergeGeometries(geos, false)!
  }, [])
  const clutterMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6a7482', metalness: 0.5, roughness: 0.55 }), [])

  const PART = 0.055

  useFrame(() => {
    const p = phase.current
    if (!p || !part.current) return
    // ARM_POSES: 0 home, 1 pre-pick, 2 pick, 3 lift, 4 pre-place, 5 place, 6 retreat. Segment n
    // travels from pose n to pose n+1, so the tool is at the pick pose when segment 1 ends and at
    // the place pose when segment 4 ends — the part is attached in between.
    const held = p.segment >= 2 && p.segment <= 4
    if (held !== wasHeld.current) {
      ;(held ? pick : place).copy(p.tcp)
      known.current |= held ? 1 : 2
      wasHeld.current = held
    }
    // a station's top is set to where the part's underside ends up, so the part lands on it
    if (tray.current && known.current & 1) {
      tray.current.position.set(pick.x, 0, pick.z)
      const top = Math.max(0.02, pick.y - PART * 1.1)
      tray.current.children[0].scale.y = top
      tray.current.children[1].position.y = top
      tray.current.visible = true
    }
    if (pad.current && known.current & 2) {
      pad.current.position.set(place.x, 0, place.z)
      const top = Math.max(0.02, place.y - PART * 1.1)
      pad.current.children[0].scale.y = top
      pad.current.children[1].position.y = top
      pad.current.visible = true
    }
    // nothing is drawn until the arm has shown where it grasps and releases
    part.current.visible = known.current === 3

    if (held) {
      // hangs in the gripper, just under the flange the trajectory reports
      part.current.position.set(p.tcp.x, p.tcp.y - PART * 0.6, p.tcp.z)
      part.current.scale.setScalar(1)
    } else if (p.segment >= 5) {
      part.current.position.copy(place)
      part.current.position.y = place.y - PART * 0.6
      // segment 6 carries the finished part away, so the next cycle is a new one rather than a jump
      part.current.scale.setScalar(p.segment === 6 ? Math.max(0, 1 - p.u) : 1)
    } else {
      part.current.position.copy(pick)
      part.current.position.y = pick.y - PART * 0.6
      part.current.scale.setScalar(p.segment === 0 ? Math.min(1, p.u * 1.6) : 1)
    }
    part.current.rotation.y += 0.01
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <group ref={rig} position={[0, DECK, 0]}>
        <Suspense fallback={null}>
          <UR5eArm scale={ARM_SCALE} onPhase={(p) => (phase.current = p)} />
        </Suspense>
        {/* both stations sit where the kinematics actually put the tool */}
        <group ref={tray} visible={false}>
          <mesh geometry={column} material={steel} scale-y={0.02} />
          <group>
            <mesh geometry={clutter} material={clutterMat} />
          </group>
        </group>
        <group ref={pad} visible={false}>
          <mesh geometry={post} material={steel} scale-y={0.02} />
          <group>
            <primitive object={padRing} />
          </group>
        </group>
        <mesh ref={part} material={partMat}>
          <boxGeometry args={[PART, PART, PART]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * olive — sensor streams from a moving AMR condensing into a factor graph. The rover runs the
 * route; four sensors fire rays at fixed landmarks; every time it passes one, a node is added to
 * the graph rising above it and linked to the last. That is literally what the backend does.
 */
export function FusionStage({ design }: StageProps) {
  const { pose, t } = usePathPose(design, 0.4)
  const landmarks = useMemo(() => design.pins.slice(0, 6).map((p) => new THREE.Vector3(p.p[0] * S, DECK + 0.07, p.p[1] * S)), [design.pins])
  const rayMat = useMemo(() => lineMat(design.data, 0.45), [design.data])
  const rays = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(landmarks.length * 6), 3))
    return new THREE.LineSegments(g, rayMat)
  }, [landmarks.length, rayMat])
  const nodes = useRef<THREE.InstancedMesh>(null)
  const nodeMat = useMemo(() => emissive(design.accent, 1.7), [design.accent])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const edgeMat = useMemo(() => lineMat(design.accent, 0.8), [design.accent])
  const N = 14
  const edges = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3))
    return new THREE.LineSegments(g, edgeMat)
  }, [edgeMat])

  useFrame(() => {
    const rp = rays.geometry.attributes.position.array as Float32Array
    landmarks.forEach((l, i) => {
      rp[i * 6] = pose.current.x
      rp[i * 6 + 1] = DECK + 0.05
      rp[i * 6 + 2] = pose.current.z
      rp[i * 6 + 3] = l.x
      rp[i * 6 + 4] = l.y
      rp[i * 6 + 5] = l.z
    })
    rays.geometry.attributes.position.needsUpdate = true

    // the graph: a helix of nodes climbing above the deck, each linked to the previous
    const ep = edges.geometry.attributes.position.array as Float32Array
    const m = nodes.current
    for (let i = 0; i < N; i++) {
      const u = (i + 1) / N
      const a = u * Math.PI * 3 + t.current * 0.25
      const r = 0.12 + u * 0.16
      const x = Math.cos(a) * r
      const y = DECK + 0.16 + u * 0.36
      const z = Math.sin(a) * r
      const grow = Math.min(1, Math.max(0, (pose.current.u * (N + 2)) - i))
      if (m) {
        tmp.position.set(x, y, z)
        tmp.scale.setScalar(grow)
        tmp.updateMatrix()
        m.setMatrixAt(i, tmp.matrix)
      }
      const pa = i === 0 ? new THREE.Vector3(0, DECK + 0.09, 0) : null
      ep[i * 6] = pa ? pa.x : ep[(i - 1) * 6 + 3]
      ep[i * 6 + 1] = pa ? pa.y : ep[(i - 1) * 6 + 4]
      ep[i * 6 + 2] = pa ? pa.z : ep[(i - 1) * 6 + 5]
      ep[i * 6 + 3] = x
      ep[i * 6 + 4] = y
      ep[i * 6 + 5] = z
    }
    if (m) m.instanceMatrix.needsUpdate = true
    edges.geometry.attributes.position.needsUpdate = true
    edges.geometry.setDrawRange(0, Math.floor(pose.current.u * (N + 2)) * 2)
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <Route design={design} color={design.accent} />
      <Posts pts={design.pins.slice(0, 6).map((p) => p.p)} color={design.data} height={0.07} />
      <primitive object={rays} />
      <primitive object={edges} />
      <instancedMesh ref={nodes} args={[undefined, undefined, N]} material={nodeMat}>
        <octahedronGeometry args={[0.026, 0]} />
      </instancedMesh>
      <Rover pose={pose.current} color={design.data} t={t} wheels={4} />
    </group>
  )
}

/**
 * whycode — a camera head sweeping across WhyCode targets. The markers are drawn as the
 * concentric rings they actually are, and the one in frame locks with a beam and a pose triad.
 */
export function GimbalStage({ design }: StageProps) {
  const t = useClock()
  const near = useNear()
  const head = useRef<THREE.Group>(null)
  const steel = useMemo(STEEL, [])
  const lens = useMemo(() => emissive(design.data, 1.8), [design.data])
  const ringMat = useMemo(() => lineMat(design.accent, 0.9), [design.accent])
  const beamMat = useMemo(() => lineMat(design.data, 0.7), [design.data])
  const locked = useRef(0)

  const targets = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return new THREE.Vector3(Math.cos(a) * 0.46, DECK + 0.17 + (i % 2) * 0.1, Math.sin(a) * 0.46)
      }),
    [],
  )
  const markers = useMemo(
    () =>
      targets.map((p) => {
        const g = new THREE.Group()
        // a WhyCode marker: a ring with a coded notch, plus its outer boundary
        for (const [r, seg, start, len] of [[0.05, 40, 0, Math.PI * 2], [0.03, 30, 0.7, 4.6]] as const) {
          const pts: THREE.Vector3[] = []
          for (let i = 0; i <= seg; i++) {
            const a = start + (i / seg) * len
            pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0))
          }
          g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat))
        }
        g.position.copy(p)
        g.lookAt(0, p.y, 0)
        return g
      }),
    [targets, ringMat],
  )
  const beam = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return new THREE.Line(g, beamMat)
  }, [beamMat])
  const posts = useMemo(() => {
    const geos = targets.map((p) => {
      const g = new THREE.CylinderGeometry(0.006, 0.008, p.y - DECK, 6)
      g.translate(p.x, DECK + (p.y - DECK) / 2, p.z)
      return g
    })
    return mergeGeometries(geos, false)
  }, [targets])

  useFrame(() => {
    if (!near()) return
    const sweep = Math.sin(t.current * 0.45) * 1.9
    if (head.current) head.current.rotation.y = sweep
    // whichever marker the head is pointing closest to is the one it has locked
    let best = 0
    let bestD = 9
    targets.forEach((p, i) => {
      const a = Math.atan2(p.x, p.z)
      const d = Math.abs(Math.atan2(Math.sin(a - sweep), Math.cos(a - sweep)))
      if (d < bestD) { bestD = d; best = i }
    })
    locked.current = bestD < 0.35 ? best : -1
    const bp = beam.geometry.attributes.position.array as Float32Array
    const tgt = targets[best]
    bp[0] = 0; bp[1] = DECK + 0.36; bp[2] = 0
    bp[3] = tgt.x; bp[4] = tgt.y; bp[5] = tgt.z
    beam.geometry.attributes.position.needsUpdate = true
    beam.visible = bestD < 0.35
    markers.forEach((m, i) => m.scale.setScalar(i === locked.current ? 1.3 : 1))
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      {posts && <mesh geometry={posts} material={steel} />}
      <mesh material={steel} position={[0, DECK + 0.18, 0]}>
        <cylinderGeometry args={[0.018, 0.026, 0.36, 12]} />
      </mesh>
      <group ref={head} position={[0, DECK + 0.4, 0]}>
        <mesh material={steel}>
          <boxGeometry args={[0.15, 0.1, 0.115]} />
        </mesh>
        <mesh material={steel} position={[0, 0, 0.075]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.04, 0.046, 0.04, 16]} />
        </mesh>
        <mesh material={lens} position={[0, 0, 0.095]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
        </mesh>
      </group>
      <primitive object={beam} />
      {markers.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  )
}

/** sepsis-atlas — papers pulled from nested shelves into a query core that pulses as each lands. */
export function OrbitStage({ design }: StageProps) {
  const t = useClock()
  const near = useNear()
  const core = useRef<THREE.Mesh>(null)
  const coreMat = useMemo(() => emissive(design.data, 1.8), [design.data])
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d8794', metalness: 0.55, roughness: 0.45 }), [])
  const litMat = useMemo(() => emissive(design.accent, 1.2), [design.accent])
  const shells = useRef<(THREE.Group | null)[]>([])
  const flyer = useRef<THREE.Mesh>(null)
  const linkMat = useMemo(() => lineMat(design.accent, 0.7), [design.accent])
  const link = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return new THREE.Line(g, linkMat)
  }, [linkMat])
  const CORE_Y = DECK + 0.3
  const N = 3

  useFrame(() => {
    if (!near()) return
    shells.current.forEach((g, i) => {
      if (g) g.rotation.y = t.current * (0.32 + i * 0.2) * (i % 2 ? -1 : 1)
    })
    // one document at a time is pulled in, ingested, and the core flares
    const u = (t.current * 0.22) % 1
    const a = u * Math.PI * 4
    const r = 0.34 * (1 - u)
    if (flyer.current) {
      flyer.current.position.set(Math.cos(a) * r, CORE_Y + (1 - u) * 0.12 - 0.04, Math.sin(a) * r)
      flyer.current.rotation.set(u * 3, -a, 0)
      flyer.current.visible = u < 0.94
    }
    if (core.current) core.current.scale.setScalar(1 + Math.max(0, 0.5 - Math.abs(u - 0.96) * 12) * 0.8)
    const lp = link.geometry.attributes.position.array as Float32Array
    lp[0] = flyer.current?.position.x ?? 0
    lp[1] = flyer.current?.position.y ?? 0
    lp[2] = flyer.current?.position.z ?? 0
    lp[3] = 0; lp[4] = CORE_Y; lp[5] = 0
    link.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <mesh material={STEEL()} position={[0, DECK + 0.15, 0]}>
        <cylinderGeometry args={[0.016, 0.022, 0.3, 10]} />
      </mesh>
      <mesh ref={core} material={coreMat} position={[0, CORE_Y, 0]}>
        <icosahedronGeometry args={[0.07, 1]} />
      </mesh>
      <mesh ref={flyer} material={litMat}>
        <boxGeometry args={[0.07, 0.088, 0.011]} />
      </mesh>
      <primitive object={link} />
      {Array.from({ length: N }, (_, i) => (
        <group key={i} ref={(el) => { shells.current[i] = el }} position={[0, CORE_Y, 0]} rotation={[0.35 - i * 0.3, 0, i * 0.5]}>
          {Array.from({ length: 6 + i * 2 }, (_, j) => {
            const n = 6 + i * 2
            const a = (j / n) * Math.PI * 2
            const r = 0.22 + i * 0.11
            return (
              <mesh key={j} material={slabMat} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation-y={-a}>
                <boxGeometry args={[0.062, 0.082, 0.012]} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

/** abu-robocon — the mecanum R2 driving to a spot and putting a ball into the basket. */
export function LaunchStage({ design }: StageProps) {
  const { pose, t } = usePathPose(design, 0.32)
  const ball = useRef<THREE.Mesh>(null)
  const ballMat = useMemo(() => emissive(design.data, 1.3), [design.data])
  const hoopMat = useMemo(() => lineMat(design.accent, 0.95), [design.accent])
  const steel = useMemo(STEEL, [])
  const HOOP = useMemo(() => new THREE.Vector3(0.0, DECK + 0.44, -0.4), [])
  const hoop = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1))
    }
    const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), hoopMat)
    l.position.copy(HOOP)
    return l
  }, [hoopMat, HOOP])
  const arcMat = useMemo(() => lineMat(design.data, 0.5), [design.data])
  const arc = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3))
    return new THREE.Line(g, arcMat)
  }, [arcMat])

  useFrame(() => {
    // the throw takes the last third of each lap; before that the ball rides on the robot
    const u = pose.current.u
    const shot = u > 0.66 ? (u - 0.66) / 0.34 : -1
    const from = new THREE.Vector3(pose.current.x, DECK + 0.09, pose.current.z)
    if (ball.current) {
      if (shot < 0) ball.current.position.copy(from)
      else {
        const k = Math.min(1, shot * 1.6)
        ball.current.position.lerpVectors(from, HOOP, k)
        ball.current.position.y += Math.sin(k * Math.PI) * 0.3
      }
      ball.current.rotation.set(t.current * 3, t.current * 2, 0)
    }
    const ap = arc.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < 24; i++) {
      const k = i / 23
      ap[i * 3] = from.x + (HOOP.x - from.x) * k
      ap[i * 3 + 1] = from.y + (HOOP.y - from.y) * k + Math.sin(k * Math.PI) * 0.3
      ap[i * 3 + 2] = from.z + (HOOP.z - from.z) * k
    }
    arc.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <Route design={design} color={design.accent} />
      <mesh material={steel} position={[HOOP.x, DECK + 0.22, HOOP.z - 0.06]}>
        <cylinderGeometry args={[0.012, 0.016, 0.44, 8]} />
      </mesh>
      <primitive object={hoop} />
      <primitive object={arc} />
      <mesh ref={ball} material={ballMat}>
        <sphereGeometry args={[0.038, 14, 12]} />
      </mesh>
      <Rover pose={pose.current} color={design.data} t={t} wheels={4} drive="mecanum" size={0.17} />
    </group>
  )
}

/**
 * kiwi-drive — the point of a three-wheel omni base is that it translates without turning, so the
 * stage drives a square while the chassis heading stays locked and the wheels solve for it.
 */
export function SpinStage({ design }: StageProps) {
  const t = useClock()
  const pose = useRef<Pose>({ x: 0, z: 0, yaw: 0, u: 0 })
  const trail = useTrail(pose.current, design.accent, 400)
  useFrame(() => {
    const u = (t.current * 0.12) % 1
    // a square path, heading held at zero the whole way round — then a spin in place at the corner
    const s = u * 4
    const leg = Math.floor(s)
    const k = s - leg
    const c: XZ[] = [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]]
    const a = c[leg]
    const b = c[(leg + 1) % 4]
    pose.current.x = a[0] + (b[0] - a[0]) * k
    pose.current.z = a[1] + (b[1] - a[1]) * k
    pose.current.yaw = Math.sin(t.current * 0.5) * 0.9
    pose.current.u = u
  })
  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <primitive object={trail} />
      <Posts pts={design.pins.map((p) => p.p)} color={design.data} height={0.055} />
      <Rover pose={pose.current} color={design.data} t={t} wheels={3} drive="omni" size={0.15} />
    </group>
  )
}

/**
 * vanguard — the eYRC arena: an overhead "Watchtower" camera on a gantry, the rover it guides
 * below, and event tiles that classify as the rover reaches them.
 */
export function WatchtowerStage({ design }: StageProps) {
  const { pose, t } = usePathPose(design, 0.34)
  const steel = useMemo(STEEL, [])
  const gridMat = useMemo(() => lineMat(design.accent, 0.35), [design.accent])
  const coneMat = useMemo(() => new THREE.MeshBasicMaterial({ color: design.data, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [design.data])
  const CAM_Y = DECK + 0.5
  const grid = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 6; i++) {
      const k = -0.42 + (i / 6) * 0.84
      pts.push(new THREE.Vector3(k, DECK + 0.004, -0.42), new THREE.Vector3(k, DECK + 0.004, 0.42))
      pts.push(new THREE.Vector3(-0.42, DECK + 0.004, k), new THREE.Vector3(0.42, DECK + 0.004, k))
    }
    return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), gridMat)
  }, [gridMat])
  const tiles = useMemo(() => design.pins.slice(0, 5).map((p) => p.p), [design.pins])
  const classified = useRef<number[]>([])
  const lockMat = useMemo(() => lineMat(design.data, 0.95), [design.data])
  const lock = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return new THREE.Line(g, lockMat)
  }, [lockMat])

  useFrame(() => {
    tiles.forEach((p, i) => {
      if (classified.current.includes(i)) return
      if (Math.hypot(p[0] * S - pose.current.x, p[1] * S - pose.current.z) < 0.14) classified.current.push(i)
    })
    if (pose.current.u < 0.02) classified.current.length = 0
    const lp = lock.geometry.attributes.position.array as Float32Array
    lp[0] = 0; lp[1] = CAM_Y - 0.03; lp[2] = 0
    lp[3] = pose.current.x; lp[4] = DECK + 0.05; lp[5] = pose.current.z
    lock.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <primitive object={grid} />
      <Route design={design} color={design.accent} />
      <Posts pts={tiles} color={design.data} active={classified} height={0.075} />
      {/* the gantry and the camera looking straight down */}
      <mesh material={steel} position={[0, DECK + 0.25, 0]}>
        <cylinderGeometry args={[0.011, 0.015, 0.5, 8]} />
      </mesh>
      <mesh material={steel} position={[0, CAM_Y, 0]}>
        <boxGeometry args={[0.1, 0.065, 0.1]} />
      </mesh>
      <mesh material={coneMat} position={[0, CAM_Y - 0.26, 0]}>
        <coneGeometry args={[0.44, 0.5, 28, 1, true]} />
      </mesh>
      <primitive object={lock} />
      <Rover pose={pose.current} color={design.data} t={t} wheels={4} drive="omni" size={0.12} />
    </group>
  )
}

/** agrobot — raised rows, cotton bolls, and an X-drive base that dips an arm to pick them. */
export function RowsStage({ design, projectKey }: StageProps) {
  const { pose, t } = usePathPose(design, 0.3)
  const rows = useMemo(
    () => runGeometry(design.runs, 0.085, TRAFFIC[projectKey].runHalf * 2 * S, DECK),
    [design.runs, projectKey],
  )
  const cropMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4d6b48', metalness: 0.15, roughness: 0.85 }), [])
  const bollMat = useMemo(() => emissive(design.data, 1.0), [design.data])
  const arm = useRef<THREE.Group>(null)
  const picked = useRef<number[]>([])
  const bolls = useRef<(THREE.Mesh | null)[]>([])
  const pts = useMemo(() => design.pins.map((p) => p.p), [design.pins])

  useFrame(() => {
    pts.forEach((p, i) => {
      if (picked.current.includes(i)) return
      if (Math.hypot(p[0] * S - pose.current.x, p[1] * S - pose.current.z) < REACH) picked.current.push(i)
    })
    if (pose.current.u < 0.02) picked.current.length = 0
    bolls.current.forEach((m, i) => {
      if (!m) return
      const want = picked.current.includes(i) ? 0 : 1
      m.scale.setScalar(m.scale.x + (want - m.scale.x) * 0.15)
    })
    // the arm dips whenever a boll is within reach
    if (arm.current) {
      const near = pts.some((p) => Math.hypot(p[0] * S - pose.current.x, p[1] * S - pose.current.z) < REACH * 1.7)
      arm.current.rotation.x += ((near ? 1.0 : 0.15) - arm.current.rotation.x) * 0.09
    }
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      {rows && <mesh geometry={rows} material={cropMat} />}
      {pts.map((p, i) => (
        <mesh key={i} ref={(el) => { bolls.current[i] = el }} material={bollMat} position={[p[0] * S, DECK + 0.105, p[1] * S]}>
          <sphereGeometry args={[0.027, 10, 8]} />
        </mesh>
      ))}
      <Route design={design} color={design.accent} />
      <Rover pose={pose.current} color={design.data} t={t} wheels={4} drive="omni" size={ROVER_SIZE.agrobot}>
        <group ref={arm} position={[0, 0.02, 0.04]}>
          <mesh material={STEEL()} position={[0, 0.05, 0.02]}>
            <boxGeometry args={[0.014, 0.11, 0.014]} />
          </mesh>
          <mesh material={emissive(design.accent, 1.2)} position={[0, 0.1, 0.035]}>
            <boxGeometry args={[0.03, 0.014, 0.03]} />
          </mesh>
        </group>
      </Rover>
    </group>
  )
}

/** drone-systems — the Crazyflie flying its route with the MultiRanger fanning out to the walls. */
export function FlightStage({ design }: StageProps) {
  const { pose, t } = usePathPose(design, 0.3)
  const wallMat = useMemo(() => lineMat('#93a3b5', 0.45), [])
  const walls = useMemo(() => wireRoom(design.runs, 0.42, wallMat), [design.runs, wallMat])
  const body = useRef<THREE.Group>(null)
  const FLY_Y = DECK + 0.3
  const rangerMat = useMemo(() => lineMat(design.data, 0.55), [design.data])
  const rangers = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 6), 3))
    return new THREE.LineSegments(g, rangerMat)
  }, [rangerMat])
  const padMat = useMemo(() => lineMat(design.accent, 0.6), [design.accent])
  const pad = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.11, DECK + 0.005, Math.sin(a) * 0.11))
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), padMat)
  }, [padMat])

  useFrame(() => {
    if (body.current) body.current.position.set(pose.current.x, FLY_Y + Math.sin(t.current * 1.6) * 0.03, pose.current.z)
    const rp = rangers.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < 4; i++) {
      // four beams, body-fixed, each stopping at the nearest structure it would hit
      const a = pose.current.yaw + (i / 4) * Math.PI * 2
      const reach = 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(t.current * 1.3 + i))
      rp[i * 6] = pose.current.x
      rp[i * 6 + 1] = FLY_Y
      rp[i * 6 + 2] = pose.current.z
      rp[i * 6 + 3] = pose.current.x + Math.cos(a) * reach
      rp[i * 6 + 4] = FLY_Y
      rp[i * 6 + 5] = pose.current.z - Math.sin(a) * reach
    }
    rangers.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      <Plinth accent={design.accent} />
      <PooledLight position={[0, DECK + 0.46, 0.24]} color="#ffd7b0" intensity={1.4} distance={2.0} decay={1.7} />
      <primitive object={walls} />
      <primitive object={pad} />
      <Route design={design} color={design.accent} y={0.3} />
      <primitive object={rangers} />
      <group ref={body}>
        <Suspense fallback={null}>
          <CrazyflieDrone scale={4.4} height={0} position={[0, 0, 0]} />
        </Suspense>
      </group>
    </group>
  )
}

export type StageKind = 'patrol' | 'arm' | 'fusion' | 'gimbal' | 'orbit' | 'launch' | 'spin' | 'watchtower' | 'rows' | 'flight'

/** Each project gets the stage that describes what it actually is. */
export const STAGES: Record<StageKind, (p: StageProps) => React.ReactElement> = {
  patrol: PatrolStage,
  arm: ArmStage,
  fusion: FusionStage,
  gimbal: GimbalStage,
  orbit: OrbitStage,
  launch: LaunchStage,
  spin: SpinStage,
  watchtower: WatchtowerStage,
  rows: RowsStage,
  flight: FlightStage,
}

export const STAGE_FOR: Record<string, StageKind> = {
  'go2-inspection': 'patrol',
  'ai-robotics': 'arm',
  olive: 'fusion',
  whycode: 'gimbal',
  'sepsis-atlas': 'orbit',
  'abu-robocon': 'launch',
  'kiwi-drive': 'spin',
  vanguard: 'watchtower',
  agrobot: 'rows',
  'drone-systems': 'flight',
}
