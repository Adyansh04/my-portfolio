'use client'

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { makeHologramMaterial, makeLineMaterial } from './hologramMaterial'
import { useHologram } from './HologramFrame'
import { makeLabelTexture } from '../labels'

export const ACCENT = '#ff7a1a'
export const WHITE = '#e9eef3'
export const MUTED = '#8a94a6'
/** second data colour for holograms only: detections, rays, sensors */
export const CYAN = '#4fd1ff'
export type V3 = [number, number, number]

/** Hologram surface material kept in sync with the frame's clock and highlight. */
export function useHoloMaterial(color = ACCENT, opacity = 1) {
  const holo = useHologram()
  const mat = useMemo(() => makeHologramMaterial(color, opacity), [color, opacity])
  useFrame(() => {
    if (!holo) return
    mat.uniforms.uTime.value = holo.time.current
    mat.uniforms.uActive.value = holo.active.current
  })
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

export function useLineMaterial(color = ACCENT, opacity = 0.7) {
  const mat = useMemo(() => makeLineMaterial(color, opacity), [color, opacity])
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

/** Local clock that only advances while the camera is near. */
export function useHoloClock(speed = 1): MutableRefObject<number> {
  const holo = useHologram()
  const t = useRef(Math.random() * 3)
  useFrame((_, dt) => {
    if (holo && !holo.near.current) return
    t.current += Math.min(0.05, dt || 0.016) * speed
  })
  return t
}

export function useNear() {
  const holo = useHologram()
  return () => !holo || holo.near.current
}

/** A polyline / closed loop / segment list as a three.js line object. */
export function useLineObject(points: V3[], color = ACCENT, opacity = 0.7, kind: 'line' | 'loop' | 'segments' = 'line') {
  const mat = useLineMaterial(color, opacity)
  return useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)))
    return kind === 'segments' ? new THREE.LineSegments(g, mat) : kind === 'loop' ? new THREE.LineLoop(g, mat) : new THREE.Line(g, mat)
  }, [points, mat, kind])
}

/** Flat grid of lines on the XZ plane. */
export function GridPlane({ w, h, step = 0.1, color = MUTED, opacity = 0.3, y = 0 }: { w: number; h: number; step?: number; color?: string; opacity?: number; y?: number }) {
  const points = useMemo(() => {
    const pts: V3[] = []
    for (let x = -w / 2; x <= w / 2 + 1e-6; x += step) pts.push([x, y, -h / 2], [x, y, h / 2])
    for (let z = -h / 2; z <= h / 2 + 1e-6; z += step) pts.push([-w / 2, y, z], [w / 2, y, z])
    return pts
  }, [w, h, step, y])
  const obj = useLineObject(points, color, opacity, 'segments')
  return <primitive object={obj} />
}

/** Wireframe box (detections, bounding boxes, zones). */
export function BoxLines({ size, position = [0, 0, 0], color = ACCENT, opacity = 0.8 }: { size: V3; position?: V3; color?: string; opacity?: number }) {
  const mat = useLineMaterial(color, opacity)
  const obj = useMemo(() => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), mat), [size, mat])
  return <primitive object={obj} position={position} />
}

/** Camera frustum lines: apex at the origin, looking down local -Z. */
export function Frustum({ fov = 55, aspect = 1.33, far = 0.7, color = WHITE, opacity = 0.55 }: { fov?: number; aspect?: number; far?: number; color?: string; opacity?: number }) {
  const points = useMemo(() => {
    const hh = Math.tan((fov * Math.PI) / 360) * far
    const hw = hh * aspect
    const c: V3[] = [
      [-hw, -hh, -far],
      [hw, -hh, -far],
      [hw, hh, -far],
      [-hw, hh, -far],
    ]
    const o: V3 = [0, 0, 0]
    return [o, c[0], o, c[1], o, c[2], o, c[3], c[0], c[1], c[1], c[2], c[2], c[3], c[3], c[0]]
  }, [fov, aspect, far])
  const obj = useLineObject(points, color, opacity, 'segments')
  return <primitive object={obj} />
}

/** Line with a small cone head. */
export function Arrow({ from, to, color = ACCENT }: { from: V3; to: V3; color?: string }) {
  const mat = useHoloMaterial(color)
  const line = useLineObject([from, to], color, 0.9)
  const dir = useMemo(() => new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]), [from, to])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()), [dir])
  return (
    <group>
      <primitive object={line} />
      <mesh position={to} quaternion={quat} material={mat}>
        <coneGeometry args={[0.02, 0.06, 8]} />
      </mesh>
    </group>
  )
}

/** Wheel with its axis along local X. */
export function Wheel({ radius = 0.06, width = 0.04, rollers = 'plain', color = ACCENT, spin }: { radius?: number; width?: number; rollers?: 'plain' | 'mecanum' | 'omni'; color?: string; spin?: MutableRefObject<number> }) {
  const mat = useHoloMaterial(color)
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current && spin) g.current.rotation.x = spin.current
  })
  const n = 8
  return (
    <group ref={g}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={mat}>
        <cylinderGeometry args={[radius, radius, width, 18, 1, true]} />
      </mesh>
      {rollers !== 'plain' &&
        Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2
          return (
            <mesh key={i} position={[0, Math.cos(a) * radius, Math.sin(a) * radius]} rotation={rollers === 'mecanum' ? [a, 0, Math.PI / 4] : [a, 0, 0]} material={mat}>
              {rollers === 'mecanum' ? <cylinderGeometry args={[radius * 0.18, radius * 0.18, width * 1.1, 6]} /> : <sphereGeometry args={[radius * 0.16, 6, 6]} />}
            </mesh>
          )
        })}
    </group>
  )
}

/** WhyCode-style circular fiducial as a canvas texture (black ring, white core, id teeth). */
export function fiducialTexture(id: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e9eef3'
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = '#0b0f14'
  ctx.beginPath()
  ctx.arc(64, 64, 58, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e9eef3'
  ctx.beginPath()
  ctx.arc(64, 64, 26, 0, Math.PI * 2)
  ctx.fill()
  // id teeth around the ring
  for (let i = 0; i < 12; i++) {
    if (((id >> i) & 1) === 0) continue
    const a0 = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(64, 64, 44, a0, a0 + 0.35)
    ctx.arc(64, 64, 34, a0 + 0.35, a0, true)
    ctx.closePath()
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}

/* ---------- richer building blocks ---------- */

/** Small text plate that always faces the camera (sprite). */
export function LabelPlate({ text, position, width = 0.3, color = WHITE, bg = 'rgba(13,17,23,0.82)', size = 40, visible = true }: { text: string; position: V3; width?: number; color?: string; bg?: string; size?: number; visible?: boolean }) {
  const mat = useMemo(() => {
    const tex = makeLabelTexture([{ text, size, color, font: '600' }], { w: 512, h: 112, bg, pad: 28, align: 'center' })
    return new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  }, [text, color, bg, size])
  useEffect(() => () => mat.dispose(), [mat])
  return <sprite material={mat} position={position} scale={[width, width * (112 / 512), 1]} visible={visible} />
}

/** Drifting motes inside the hologram volume. */
export function Sparkles({ count = 36, radius = 0.6, height = 1.5, color = ACCENT }: { count?: number; radius?: number; height?: number; color?: string }) {
  const t = useHoloClock()
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const rnd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * radius
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = Math.random() * height
      pos[i * 3 + 2] = Math.sin(a) * r
      rnd[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uHeight: { value: height } },
      vertexShader: /* glsl */ `
        attribute float aRand; uniform float uTime; uniform float uHeight; varying float vA;
        void main(){
          vec3 p = position; p.y = mod(p.y + uTime * (0.08 + 0.1 * aRand), uHeight);
          p.x += sin(uTime * 0.7 + aRand * 6.28) * 0.03;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (2.0 + aRand * 2.5) * clamp(6.0 / -mv.z, 0.3, 2.0);
          vA = (0.3 + 0.7 * aRand) * smoothstep(0.0, 0.15, p.y / uHeight) * (1.0 - smoothstep(0.85, 1.0, p.y / uHeight));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `uniform vec3 uColor; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard; gl_FragColor = vec4(uColor * vA, vA); }`,
    })
    return { geometry: g, material: m }
  }, [count, radius, height, color])
  useFrame(() => {
    material.uniforms.uTime.value = t.current
  })
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

/** Line that follows a moving object (odometry trail). */
export function MotionTrail({ target, length = 60, color = CYAN, opacity = 0.6, y = 0.015 }: { target: MutableRefObject<THREE.Object3D | null>; length?: number; color?: string; opacity?: number; y?: number }) {
  const mat = useLineMaterial(color, opacity)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(length * 3), 3))
    g.setDrawRange(0, 0)
    return g
  }, [length])
  const line = useMemo(() => new THREE.Line(geometry, mat), [geometry, mat])
  const pts = useRef<THREE.Vector3[]>([])
  const near = useNear()
  useFrame(() => {
    if (!near() || !target.current) return
    const p = target.current.position
    const arr = pts.current
    if (!arr.length || arr[arr.length - 1].distanceTo(p) > 0.012) {
      arr.push(p.clone())
      if (arr.length > length) arr.shift()
    }
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < arr.length; i++) pos.setXYZ(i, arr[i].x, y, arr[i].z)
    pos.needsUpdate = true
    geometry.setDrawRange(0, arr.length)
  })
  return <primitive object={line} />
}

/** Sensor beam: a faint line with a pulse travelling from `from` to `to`. */
export function Beam({ from, to, color = CYAN, speed = 1, opacity = 0.45 }: { from: V3; to: V3; color?: string; speed?: number; opacity?: number }) {
  const line = useLineObject([from, to], color, opacity, 'segments')
  const mat = useHoloMaterial(color, 1)
  const dot = useRef<THREE.Mesh>(null)
  const t = useHoloClock(speed)
  useFrame(() => {
    const u = t.current % 1
    if (dot.current) dot.current.position.set(from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u)
  })
  return (
    <group>
      <primitive object={line} />
      <mesh ref={dot} material={mat}>
        <sphereGeometry args={[0.014, 8, 8]} />
      </mesh>
    </group>
  )
}

/** Room / arena outline: floor rectangle plus short wall posts at the corners. */
export function Arena({ w, d, h = 0.3, color = MUTED, opacity = 0.6 }: { w: number; d: number; h?: number; color?: string; opacity?: number }) {
  const pts = useMemo<V3[]>(() => {
    const x = w / 2, z = d / 2
    const c: V3[] = [[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]]
    const out: V3[] = []
    for (let i = 0; i < 4; i++) {
      out.push(c[i], c[(i + 1) % 4])
      out.push(c[i], [c[i][0], h, c[i][2]])
      out.push([c[i][0], h, c[i][2]], [c[(i + 1) % 4][0], h, c[(i + 1) % 4][2]])
    }
    return out
  }, [w, d, h])
  const obj = useLineObject(pts, color, opacity, 'segments')
  return <primitive object={obj} />
}
