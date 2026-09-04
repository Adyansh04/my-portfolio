'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import r1Json from '@/public/models/r1/robot.json'
import { asset } from '@/lib/base-path'
import type { RobotDef } from '@/lib/mission/robots'
import { CATCH, catchState } from '@/lib/mission/traffic'
import { ArticulatedRobot, type JointValues } from '../robots/ArticulatedRobot'
import { makeRobotMaterial, r1MaterialFor } from '../robots/robotMaterial'

const DEF = r1Json as RobotDef
const FOLDER = asset('/models/r1')
const PELVIS = 0.71
const CULL = 34
const ARC_POINTS = 22

/** One of the pair. Reads the shared throw clock, so both stay in sync without talking to each other. */
function Player({ side }: { side: 0 | 1 }) {
  const home = side === 0 ? CATCH.a : CATCH.b
  const facing = side === 0 ? 0 : Math.PI
  const joints = useRef<JointValues>({})
  const material = useMemo(() => makeRobotMaterial('#dfe3e8'), [])
  const outer = useRef<THREE.Group>(null)
  const head = useRef(0)

  useFrame(({ camera, clock }, dt) => {
    const g = outer.current
    if (!g) return
    const near = Math.hypot(camera.position.x - home[0], camera.position.z - home[1]) < CULL
    g.visible = near
    if (!near) return
    const d = Math.min(0.05, dt || 0.016)
    const t = clock.getElapsedTime()
    const st = catchState(t)
    const a = st.arm[side]
    const throwing = st.thrower === side
    const v = joints.current
    const breathe = Math.sin(t * 1.4 + side) * 0.02

    // track the ball with the head
    const bx = st.ball[0] - home[0]
    const bz = st.ball[2] - home[1]
    const fwd = bx * Math.cos(facing) - bz * Math.sin(facing)
    const left = -(bx * Math.sin(facing) + bz * Math.cos(facing))
    const want = THREE.MathUtils.clamp(Math.atan2(left, fwd), -1, 1)
    head.current += (want - head.current) * (1 - Math.exp(-d * 6))
    v.head_yaw_joint = head.current
    v.head_pitch_joint = -0.1 - 0.25 * Math.max(0, st.ball[1] - 1.3)

    if (throwing) {
      // right arm winds back (a < 0) and whips through (a > 0); the left arm counterweights
      v.right_shoulder_pitch_joint = -1.35 * a
      v.right_shoulder_roll_joint = -0.2 - 0.28 * Math.max(0, -a)
      v.right_shoulder_yaw_joint = 0.18 * a
      v.right_elbow_joint = 0.4 + 0.8 * Math.max(0, -a)
      v.left_shoulder_pitch_joint = 0.5 * a + breathe
      v.left_shoulder_roll_joint = 0.3
      v.left_elbow_joint = 0.45
      v.waist_yaw_joint = -0.34 * a
      v.waist_roll_joint = breathe * 0.5
      v.left_hip_pitch_joint = -0.08 - 0.14 * a
      v.right_hip_pitch_joint = -0.08 - 0.1 * a
    } else {
      // both hands up to receive, then absorb the impact
      v.right_shoulder_pitch_joint = -1.15 * a + breathe
      v.left_shoulder_pitch_joint = -1.15 * a + breathe
      v.right_shoulder_roll_joint = -0.24 - 0.12 * a
      v.left_shoulder_roll_joint = 0.24 + 0.12 * a
      v.right_shoulder_yaw_joint = 0
      v.right_elbow_joint = 0.5 + 0.55 * a
      v.left_elbow_joint = 0.5 + 0.55 * a
      v.waist_yaw_joint = 0
      v.waist_roll_joint = breathe * 0.5
      v.left_hip_pitch_joint = -0.08 - 0.06 * a
      v.right_hip_pitch_joint = -0.08 - 0.06 * a
    }
    v.left_knee_joint = 0.2 + 0.12 * Math.abs(a)
    v.right_knee_joint = 0.2 + 0.12 * Math.abs(a)
    v.left_ankle_pitch_joint = -0.12
    v.right_ankle_pitch_joint = -0.12
    g.position.y = PELVIS + breathe * 0.3 - 0.05 * Math.abs(a)
  })

  return (
    <group ref={outer} position={[home[0], PELVIS, home[1]]} rotation={[0, facing, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <ArticulatedRobot def={DEF} folder={FOLDER} joints={joints} material={material} materialFor={r1MaterialFor} />
      </group>
    </group>
  )
}

/** The ball plus the predicted arc — the same overlay a tracking system would draw. */
function Ball() {
  const core = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const arcMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#4fd1ff', transparent: true, opacity: 0 }), [])
  const arc = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_POINTS * 3), 3))
    return new THREE.Line(g, arcMat)
  }, [arcMat])
  const ballMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff7a1a', emissiveIntensity: 0.8, roughness: 0.5 }), [])
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }), [])

  useFrame(({ camera, clock }) => {
    const mid = (CATCH.a[0] + CATCH.b[0]) / 2
    const near = Math.hypot(camera.position.x - mid, camera.position.z - CATCH.a[1]) < CULL
    arc.visible = near
    if (core.current) core.current.visible = near
    if (halo.current) halo.current.visible = near
    if (!near) return
    const t = clock.getElapsedTime()
    const st = catchState(t)
    core.current?.position.set(...st.ball)
    halo.current?.position.set(...st.ball)
    core.current?.rotateOnAxis(new THREE.Vector3(0, 0, 1), 0.14)

    // the arc the ball is on right now, sampled straight from the same model
    const pos = arc.geometry.attributes.position as THREE.BufferAttribute
    const cycle = Math.floor(t / CATCH.period)
    const base = cycle * CATCH.period + CATCH.windup
    for (let i = 0; i < ARC_POINTS; i++) {
      const p = catchState(base + (i / (ARC_POINTS - 1)) * CATCH.flight * 0.99).ball
      pos.setXYZ(i, p[0], p[1], p[2])
    }
    pos.needsUpdate = true
    arcMat.opacity += ((st.flying ? 0.35 : 0.06) - arcMat.opacity) * 0.08
  })

  return (
    <group>
      <primitive object={arc} />
      <mesh ref={core} material={ballMat}>
        <icosahedronGeometry args={[0.1, 1]} />
      </mesh>
      <mesh ref={halo} material={haloMat}>
        <sphereGeometry args={[0.18, 12, 10]} />
      </mesh>
    </group>
  )
}

/** Two humanoids running a throw-and-catch loop in the south strip of the project hall. */
export function CatchPair() {
  return (
    <group>
      <Player side={0} />
      <Player side={1} />
      <Ball />
    </group>
  )
}
