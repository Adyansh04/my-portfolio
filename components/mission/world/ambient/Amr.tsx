'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { mission } from '@/lib/mission/store'
import { buildTimeline, samplePose, type RouteDef } from '@/lib/mission/traffic'
import { makeLabelTexture } from '../labels'
import { ContactShadow } from '../ContactShadow'

const ACCENT = '#ff7a1a'
const CYAN = '#4fd1ff'
const CULL = 30

/** shared across the fleet — five units, one set of materials */
const shell = () => new THREE.MeshStandardMaterial({ color: '#98a3b2', metalness: 0.5, roughness: 0.42 })
const dark = () => new THREE.MeshStandardMaterial({ color: '#171d26', metalness: 0.3, roughness: 0.7 })
const deckMat = () => new THREE.MeshStandardMaterial({ color: '#2b3644', metalness: 0.4, roughness: 0.5 })
const toteMat = () => new THREE.MeshStandardMaterial({ color: '#4a5666', metalness: 0.15, roughness: 0.75 })

interface Props {
  route: RouteDef
  /** id painted on the flank */
  label: string
  /** seconds into the loop this unit starts */
  phase: number
  /** the hero robot is this close and in front → hold position */
  yieldRadius?: number
}

/**
 * A warehouse AMR running its route: drives, parks at a station, raises its deck to take a tote,
 * carries it to the far end and sets it down. It yields when the hero robot is in its way, which is
 * the only interaction the two have — the fleet is scenery with a job, not a puzzle.
 */
export function Amr({ route, label, phase, yieldRadius = 2.1 }: Props) {
  const tl = useMemo(() => buildTimeline(route), [route])
  const mats = useMemo(() => ({ shell: shell(), dark: dark(), deck: deckMat(), tote: toteMat() }), [])
  const status = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false }), [])
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const fanMat = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [])
  const plate = useMemo(() => {
    const tex = makeLabelTexture([{ text: label, size: 44, color: '#dfe6ef', font: '700' }], { w: 256, h: 72, bg: 'rgba(0,0,0,0)', pad: 12 })
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
  }, [label])

  const root = useRef<THREE.Group>(null)
  const deck = useRef<THREE.Group>(null)
  const post = useRef<THREE.Mesh>(null)
  const tote = useRef<THREE.Group>(null)
  const wheels = useRef<THREE.Group>(null)
  const fan = useRef<THREE.Mesh>(null)
  const s = useRef(phase)
  const yaw = useRef(0)
  const spin = useRef(0)
  const blocked = useRef(0)

  useFrame(({ camera }, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    const g = root.current
    if (!g) return

    const pose = samplePose(tl, s.current)
    const near = Math.hypot(camera.position.x - pose.x, camera.position.z - pose.z) < CULL
    g.visible = near

    // yield: hero robot close and roughly ahead of us
    const hx = mission.robot.x - pose.x
    const hz = mission.robot.z - pose.z
    const gap = Math.hypot(hx, hz)
    const ahead = (hx * Math.cos(yaw.current) - hz * Math.sin(yaw.current)) / (gap || 1)
    const yielding = gap < yieldRadius && ahead > -0.25
    blocked.current += ((yielding ? 1 : 0) - blocked.current) * (1 - Math.exp(-d * 6))
    if (!yielding) s.current += d

    g.position.set(pose.x, 0, pose.z)
    let dy = pose.yaw - yaw.current
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    yaw.current += dy * (1 - Math.exp(-d * 4))
    g.rotation.y = yaw.current
    if (!near) return

    // deck lift + telescoping post
    const lift = pose.load * 0.17
    if (deck.current) deck.current.position.y = 0.3 + lift
    if (post.current) {
      post.current.scale.y = 1 + pose.load * 1.9
      post.current.position.y = 0.21 + lift / 2
    }
    if (tote.current) {
      tote.current.visible = pose.load > 0.02
      tote.current.position.y = 0.55 + lift
    }
    // wheels roll with ground speed
    if (wheels.current) {
      spin.current += (pose.moving && !yielding ? route.speed : 0) * d / 0.11
      wheels.current.children.forEach((w) => (w.rotation.x = spin.current))
    }
    if (fan.current) fan.current.rotation.z -= d * 5.5

    // status colour: cyan in transit, amber while handling a tote, blinking red while yielding
    const blink = blocked.current > 0.5 ? (Math.sin(s.current * 12) > 0 ? 1 : 0.15) : 1
    const c = blocked.current > 0.5 ? '#ff3b30' : pose.action ? ACCENT : CYAN
    status.color.set(c).multiplyScalar(blink)
    glowMat.color.set(c)
    fanMat.opacity = 0.06 + 0.06 * (1 - blocked.current)
  })

  return (
    <group ref={root}>
      <ContactShadow radius={0.56} stretch={1.5} opacity={0.5} />
      {/* floor glow */}
      <mesh material={glowMat} position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.6, 24]} />
      </mesh>
      {/* bumper skirt + chassis */}
      <mesh material={mats.dark} position={[0, 0.075, 0]}>
        <boxGeometry args={[0.98, 0.11, 0.68]} />
      </mesh>
      <RoundedBox args={[0.9, 0.2, 0.6]} radius={0.045} smoothness={3} position={[0, 0.2, 0]} material={mats.shell} />
      {/* status strip wrapping the nose */}
      <mesh material={status} position={[0.452, 0.2, 0]}>
        <boxGeometry args={[0.012, 0.07, 0.5]} />
      </mesh>
      <mesh material={status} position={[-0.452, 0.2, 0]}>
        <boxGeometry args={[0.012, 0.07, 0.5]} />
      </mesh>
      {/* safety scanner: puck + rotating wedge */}
      <mesh material={mats.dark} position={[0.36, 0.335, -0.22]}>
        <cylinderGeometry args={[0.075, 0.08, 0.075, 14]} />
      </mesh>
      <mesh ref={fan} material={fanMat} position={[0.36, 0.335, -0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 20, 0, 0.9]} />
      </mesh>
      {/* drive wheels */}
      <group ref={wheels}>
        {[-0.31, 0.31].map((z) => (
          <mesh key={z} material={mats.dark} position={[0, 0.11, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.06, 14]} />
          </mesh>
        ))}
      </group>
      {/* lift column + deck + tote */}
      <mesh ref={post} material={mats.dark} position={[0, 0.21, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.16]} />
      </mesh>
      <group ref={deck} position={[0, 0.3, 0]}>
        <mesh material={mats.deck}>
          <boxGeometry args={[0.72, 0.05, 0.5]} />
        </mesh>
        <mesh material={status} position={[0, 0.028, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.2, 0.225, 20]} />
        </mesh>
      </group>
      <group ref={tote} position={[0, 0.55, 0]}>
        <RoundedBox args={[0.52, 0.4, 0.44]} radius={0.03} smoothness={2} material={mats.tote} />
        <mesh material={status} position={[0.262, 0.06, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.2, 0.06]} />
        </mesh>
      </group>
      {/* unit id on the flank */}
      <mesh material={plate} position={[-0.06, 0.235, 0.302]}>
        <planeGeometry args={[0.36, 0.1]} />
      </mesh>
      <mesh material={plate} position={[-0.06, 0.235, -0.302]} rotation-y={Math.PI}>
        <planeGeometry args={[0.36, 0.1]} />
      </mesh>
    </group>
  )
}
