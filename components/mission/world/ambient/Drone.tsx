'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { DronePath } from '@/lib/mission/traffic'

const CYAN = '#4fd1ff'
const CULL = 46

const ARMS = [0.62, 2.52, 3.76, 5.66] // rad, X layout

/**
 * A quadrotor flying a closed patrol loop: banks into its turns, blurs its rotors, blinks nav
 * lights, and (for the indoor units) drops a scan cone onto the floor as it passes.
 */
export function Drone({ path }: { path: DronePath }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path.pts.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.4), [path])
  const length = useMemo(() => curve.getLength(), [curve])
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: '#232b36', metalness: 0.4, roughness: 0.5 }), [])
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ccd4de', metalness: 0.45, roughness: 0.35 }), [])
  const rotor = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [])
  const cone = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.012, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }), [])
  const spot = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const led = useMemo(() => [new THREE.MeshBasicMaterial({ color: '#37f08a', toneMapped: false }), new THREE.MeshBasicMaterial({ color: '#ff3b30', toneMapped: false })], [])

  const root = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const props = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Group>(null)
  const u = useRef(Math.random())
  const yaw = useRef(0)
  const roll = useRef(0)
  const clock = useRef(Math.random() * 20)
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3() }), [])

  useFrame(({ camera }, dt) => {
    const d = Math.min(0.05, dt || 0.016)
    const g = root.current
    if (!g) return
    clock.current += d
    u.current = (u.current + (path.speed * d) / length) % 1

    curve.getPointAt(u.current, tmp.p)
    curve.getTangentAt(u.current, tmp.t)
    // small idle bob on top of the path
    const bob = Math.sin(clock.current * 1.7 + path.pts.length) * 0.045
    g.position.set(tmp.p.x, tmp.p.y + bob, tmp.p.z)

    // drones are the only things that can fly into the lens: cull far away, and also point blank
    const view = camera.position.distanceTo(g.position)
    const near = view < CULL && view > 2.2
    g.visible = near
    if (!near) return

    const want = Math.atan2(-tmp.t.z, tmp.t.x)
    let dy = want - yaw.current
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    yaw.current += dy * (1 - Math.exp(-d * 5))
    g.rotation.y = yaw.current
    // bank into the turn, nose down with airspeed
    roll.current += (THREE.MathUtils.clamp((dy / d) * 0.12, -0.26, 0.26) - roll.current) * (1 - Math.exp(-d * 2.2))
    if (tilt.current) {
      tilt.current.rotation.z = roll.current
      tilt.current.rotation.x = -0.09 + Math.sin(clock.current * 2.3) * 0.02
    }
    if (props.current) props.current.children.forEach((p, i) => (p.rotation.y += d * (34 + i * 3)))
    if (beam.current) {
      const h = Math.max(0.4, g.position.y - 0.02)
      beam.current.scale.set(1, h, 1)
      beam.current.position.y = -h
    }
    const b = Math.sin(clock.current * 4) > 0.4 ? 1 : 0.12
    led[0].color.setHex(0x37f08a).multiplyScalar(b)
    led[1].color.setHex(0xff3b30).multiplyScalar(1.05 - b)
  })

  return (
    <group ref={root}>
      <group ref={tilt}>
        <RoundedBox args={[0.3, 0.085, 0.2]} radius={0.03} smoothness={2} material={body} />
        <mesh material={trim} position={[0, 0.055, 0]}>
          <boxGeometry args={[0.17, 0.035, 0.13]} />
        </mesh>
        {/* camera gimbal ball under the nose */}
        <mesh material={body} position={[0.11, -0.06, 0]}>
          <sphereGeometry args={[0.045, 10, 8]} />
        </mesh>
        <group ref={props}>
          {ARMS.map((a, i) => {
            const x = Math.cos(a) * 0.21
            const z = Math.sin(a) * 0.21
            return (
              <group key={a} position={[x, 0.03, z]}>
                <mesh material={rotor} rotation-x={-Math.PI / 2}>
                  <circleGeometry args={[0.13, 16]} />
                </mesh>
                <mesh material={trim} position={[0, -0.02, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.05, 8]} />
                </mesh>
                <mesh material={body} position={[-x / 2, -0.02, -z / 2]} rotation-y={-Math.atan2(z, x)}>
                  <boxGeometry args={[0.21, 0.018, 0.032]} />
                </mesh>
                {i < 2 && (
                  <mesh material={led[i]} position={[0, -0.045, 0]}>
                    <sphereGeometry args={[0.017, 6, 5]} />
                  </mesh>
                )}
              </group>
            )
          })}
        </group>
      </group>
      {path.scan && (
        <group ref={beam}>
          <mesh material={cone} position={[0, 0.5, 0]}>
            <coneGeometry args={[0.34, 1, 18, 1, true]} />
          </mesh>
          <mesh material={spot} position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.34, 20]} />
          </mesh>
        </group>
      )}
    </group>
  )
}
