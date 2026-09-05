'use client'

import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { makeLabelTexture } from '../../labels'

export const ACCENT = '#ff7a1a'
export const CYAN = '#4fd1ff'
export const WHITE = '#e9eef3'
export const MUTED = '#8a94a6'
export const LIME = '#8ce563'
export const VIOLET = '#a98bff'
export type V3 = [number, number, number]

/** Independent clock — the lab has no HologramFrame context to borrow one from. */
export function useLabClock(speed = 1): MutableRefObject<number> {
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += Math.min(0.05, dt || 0.016) * speed
  })
  return t
}

export const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}

/* ------------------------------------------------------------ S1 · scale model */

/** Milled aluminium plate with a bevel, an etched grid and four countersunk screws. */
export function MachinedBase({ w = 1.5, d = 1.1, h = 0.07 }: { w?: number; d?: number; h?: number }) {
  const top = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const x = c.getContext('2d')!
    x.fillStyle = '#8f959d'
    x.fillRect(0, 0, 256, 256)
    x.strokeStyle = 'rgba(40,46,54,0.45)'
    x.lineWidth = 1
    for (let i = 0; i <= 256; i += 16) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke()
      x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke()
    }
    // brushed streaks
    for (let i = 0; i < 400; i++) {
      x.strokeStyle = `rgba(255,255,255,${Math.random() * 0.05})`
      const y = Math.random() * 256
      x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke()
    }
    const t = new THREE.CanvasTexture(c)
    t.anisotropy = 8
    return t
  }, [])
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={top} color="#c8ced6" metalness={0.85} roughness={0.34} />
      </mesh>
      <mesh position={[0, h + 0.004, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w - 0.06, d - 0.06]} />
        <meshStandardMaterial color="#171d25" metalness={0.3} roughness={0.75} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * (w - 0.07)) / 2, h + 0.002, (sz * (d - 0.07)) / 2]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.016, 12]} />
          <meshStandardMaterial color="#5c636d" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/** Thin glass case: a fresnel shell, not real transmission, so it stays cheap in a busy scene. */
export function GlassCase({ w = 1.42, d = 1.02, h = 0.72 }: { w?: number; d?: number; h?: number }) {
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: '#cfe2ff', transparent: true, opacity: 0.028, roughness: 0.06, metalness: 0, side: THREE.DoubleSide, depthWrite: false })
    m.onBeforeCompile = (s) => {
      s.fragmentShader = s.fragmentShader.replace(
        '#include <dithering_fragment>',
        `float f = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 2.5);
         gl_FragColor.rgb += vec3(0.42, 0.62, 0.95) * f * 0.5;
         gl_FragColor.a = max(gl_FragColor.a, f * 0.4);
         #include <dithering_fragment>`,
      )
    }
    m.customProgramCacheKey = () => 'lab-glass'
    return m
  }, [])
  return (
    <group position={[0, h / 2 + 0.07, 0]}>
      <mesh material={mat}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color="#7f9dc4" transparent opacity={0.45} />
      </lineSegments>
    </group>
  )
}

/* ------------------------------------------------------------ S2 · point cloud */

const dot = (() => {
  let tex: THREE.Texture | null = null
  return () => {
    if (tex) return tex
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const x = c.getContext('2d')!
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 32, 32)
    tex = new THREE.CanvasTexture(c)
    return tex
  }
})()

/**
 * A scanned point cloud with a reveal height: points above `uReveal` are not drawn, and the ones
 * just under it flare, so the subject materialises as the sweep climbs.
 */
export function PointField({ positions, colors, size = 0.014, reveal, sweeping }: { positions: Float32Array; colors: Float32Array; size?: number; reveal: MutableRefObject<number>; sweeping?: MutableRefObject<number> }) {
  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uReveal: { value: 0 }, uSweeping: { value: 1 }, uSize: { value: size }, uMap: { value: dot() } },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec3 color; uniform float uReveal; uniform float uSweeping; uniform float uSize;
        varying vec3 vC; varying float vFresh;
        void main() {
          vC = color;
          float d = uReveal - position.y;
          vFresh = (1.0 - smoothstep(0.0, 0.05, d)) * uSweeping;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (1.0 + vFresh * 1.2) * 620.0 / max(0.1, -mv.z);
          gl_Position = projectionMatrix * mv;
          if (d < 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; varying vec3 vC; varying float vFresh;
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a;
          if (a < 0.05) discard;
          // normal blending: additive stacks thousands of overlapping returns into a white glare
          gl_FragColor = vec4(mix(vC, vec3(1.0), vFresh * 0.7) * 1.15, a * 0.85);
        }`,
    })
    return m
  }, [size])
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [positions, colors])
  useFrame(() => {
    material.uniforms.uReveal.value = reveal.current
    material.uniforms.uSweeping.value = sweeping ? sweeping.current : 1
  })
  return <points geometry={geometry} material={material} />
}

/** Height ramp in the site's LiDAR language (deep blue → cyan → amber). */
export function heightColor(t: number): [number, number, number] {
  const c = new THREE.Color()
  if (t < 0.5) c.set('#2b6fd8').lerp(new THREE.Color('#4fd1ff'), t / 0.5)
  else c.set('#4fd1ff').lerp(new THREE.Color('#ff9d3a'), (t - 0.5) / 0.5)
  return [c.r, c.g, c.b]
}

/* ------------------------------------------------------------ S3 · blueprint */

/** Dark drawing sheet with a hairline border and a corner tick, like a plotted sheet. */
export function Sheet({ w, h, children }: { w: number; h: number; children?: ReactNode }) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#0a0f16" transparent opacity={0.94} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(w - 0.03, h - 0.03)]} />
        <lineBasicMaterial color={CYAN} transparent opacity={0.5} />
      </lineSegments>
      {children}
    </group>
  )
}

/** Dimension line: extension ticks at both ends and the measurement centred above it. */
export function DimLine({ from, to, label, offset = 0.05, color = CYAN }: { from: [number, number]; to: [number, number]; label: string; offset?: number; color?: string }) {
  const obj = useMemo(() => {
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const len = Math.hypot(dx, dy) || 1
    const nx = (-dy / len) * offset
    const ny = (dx / len) * offset
    const a = new THREE.Vector3(from[0] + nx, from[1] + ny, 0)
    const b = new THREE.Vector3(to[0] + nx, to[1] + ny, 0)
    const tick = 0.018
    const pts = [
      a, b,
      new THREE.Vector3(from[0], from[1], 0), a.clone(),
      new THREE.Vector3(to[0], to[1], 0), b.clone(),
      a.clone().add(new THREE.Vector3(-ny / offset * tick, nx / offset * tick, 0)), a.clone().add(new THREE.Vector3(ny / offset * tick, -nx / offset * tick, 0)),
      b.clone().add(new THREE.Vector3(-ny / offset * tick, nx / offset * tick, 0)), b.clone().add(new THREE.Vector3(ny / offset * tick, -nx / offset * tick, 0)),
    ]
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }))
  }, [from, to, offset, color])
  const mid: V3 = [(from[0] + to[0]) / 2 + (-(to[1] - from[1]) / (Math.hypot(to[0] - from[0], to[1] - from[1]) || 1)) * offset, (from[1] + to[1]) / 2 + ((to[0] - from[0]) / (Math.hypot(to[0] - from[0], to[1] - from[1]) || 1)) * offset + 0.028, 0.001]
  return (
    <group>
      <primitive object={obj} />
      <Tag text={label} position={mid} width={0.19} color={color} bg="rgba(10,15,22,0)" size={30} />
    </group>
  )
}

/* ------------------------------------------------------------ shared text */

/** Flat canvas-text plate. `bg` transparent gives bare text, opaque gives a chip. */
/** Monospace advance is ~0.6em, so a long string is shrunk to fit rather than clipped at the edge. */
export const fitSize = (text: string, want: number, canvas = 512, pad = 12) => Math.min(want, (canvas - pad * 2) / (0.62 * Math.max(1, text.length)))

export function Tag({ text, position, width = 0.26, color = WHITE, bg = 'rgba(10,15,22,0.86)', size = 34, rotation }: { text: string; position: V3; width?: number; color?: string; bg?: string; size?: number; rotation?: V3 }) {
  const mat = useMemo(() => {
    const tex = makeLabelTexture([{ text, size: fitSize(text, size), color, font: '600' }], { w: 512, h: 96, bg, pad: 12, align: 'center' })
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false })
  }, [text, color, bg, size])
  return (
    <mesh position={position} rotation={rotation} material={mat} renderOrder={4}>
      <planeGeometry args={[width, width * (96 / 512)]} />
    </mesh>
  )
}

/** Annotation card on a leader line, the way a HUD points at a thing in the world. */
export function Callout({ at, to, text, sub, color = CYAN }: { at: V3; to: V3; text: string; sub?: string; color?: string }) {
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...at), new THREE.Vector3(...to)])
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }))
  }, [at, to, color])
  const mat = useMemo(() => {
    const tex = makeLabelTexture(
      [{ text, size: fitSize(text, 34, 512, 14), color: WHITE, font: '700' }, ...(sub ? [{ text: sub, size: fitSize(sub, 26, 512, 14), color }] : [])],
      { w: 512, h: sub ? 150 : 96, bg: 'rgba(8,12,18,0.9)', pad: 14 },
    )
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  }, [text, sub, color])
  const h = sub ? 150 / 512 : 96 / 512
  return (
    <group>
      <primitive object={line} />
      <mesh position={[to[0], to[1] + 0.032, to[2]]} material={mat} renderOrder={5}>
        <planeGeometry args={[0.3, 0.3 * h]} />
      </mesh>
      <mesh position={at}>
        <sphereGeometry args={[0.011, 8, 6]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------ S5 · projection */

/** Emissive volume with interference scanlines, a colour fringe at grazing angles and a slow flicker. */
export function useProjectionMaterial(color = ACCENT, opacity = 0.55) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uOpacity: { value: opacity } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV; varying vec3 vW;
          void main() {
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = -mv.xyz; vW = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uTime; uniform float uOpacity;
          varying vec3 vN; varying vec3 vV; varying vec3 vW;
          void main() {
            float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
            float scan = 0.72 + 0.28 * sin(vW.y * 190.0 - uTime * 7.0);
            float band = smoothstep(0.35, 0.0, abs(fract(vW.y * 1.1 - uTime * 0.22) - 0.5));
            float flick = 0.94 + 0.06 * sin(uTime * 31.0) * sin(uTime * 7.3);
            vec3 c = uColor * (0.9 + 1.8 * fres) + vec3(0.15, 0.45, 0.9) * fres * fres * 0.9;
            float a = (0.22 + 0.9 * fres) * scan * flick * uOpacity * (1.0 + band * 0.6);
            gl_FragColor = vec4(c * flick, a);
          }`,
      }),
    [color, opacity],
  )
  const t = useLabClock()
  useFrame(() => {
    mat.uniforms.uTime.value = t.current
  })
  return mat
}

/** The light cone the projector throws, plus the pool it lands in. */
export function ProjectorCone({ radius = 0.62, height = 1.05, color = ACCENT }: { radius?: number; height?: number; color?: string }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }), [color])
  const pool = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }), [color])
  return (
    <group>
      <mesh material={mat} position={[0, height / 2, 0]}>
        <coneGeometry args={[radius, height, 40, 1, true]} />
      </mesh>
      <mesh material={pool} position={[0, 0.004, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[radius * 0.5, 32]} />
      </mesh>
    </group>
  )
}
