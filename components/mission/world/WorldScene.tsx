'use client'

import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Floor } from './Floor'
import { Walls } from './Walls'
import { Ceiling } from './Ceiling'
import { Sky } from './Sky'
import { CameraLight } from './CameraLight'
import { LightPool } from './LightPool'
import { Ambience } from './Ambience'
import { PostFx } from './PostFx'
import { MissionDriver } from './MissionDriver'
import { CameraRig } from './CameraRig'
import { RobotProxy } from './RobotProxy'
import { TrakrRobot } from './robots/TrakrRobot'
import { R1Humanoid } from './robots/R1Humanoid'
import { Zone3Projects } from './zones/Zone3Projects'
import { Zone1Profile } from './zones/Zone1Profile'
import { Zone2Experience } from './zones/Zone2Experience'
import { Zone4Hackathons } from './zones/Zone4Hackathons'
import { Zone5Credentials } from './zones/Zone5Credentials'
import { Zone6Dock } from './zones/Zone6Dock'
import { PosterCapture, capturing } from './PosterCapture'
import { DebugHook } from './DebugHook'
import { PointCloud } from './PointCloud'
import { LidarSweep } from './LidarSweep'
import { AmbientLife } from './ambient'

const DPR: [number, number] = [1, 1.5]

/**
 * Compiles every material before the camera gets to it, in parallel where the driver allows, so a
 * zone's first appearance doesn't stall on shader compiles. It re-runs whenever the scene grows,
 * since models and zone content keep mounting after boot, and stops watching after two minutes.
 */
function Precompile() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let seen = -1
    let checks = 0
    const id = window.setInterval(() => {
      let n = 0
      scene.traverse(() => void n++)
      if (n !== seen) void gl.compileAsync(scene, camera)
      seen = n
      if (++checks >= 120) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
  }, [gl, scene, camera])
  return null
}

/**
 * Drops to 1× pixel density when the frame rate can't hold 40 fps, and back up once it can. After
 * a second decline it stays down, so a borderline GPU doesn't flip resolution every few seconds.
 */
function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr)
  const low = useRef(false)
  const declines = useRef(0)
  const to = (next: boolean) => {
    if (low.current === next) return
    low.current = next
    setDpr(next ? 1 : DPR)
  }
  return (
    <PerformanceMonitor
      onDecline={() => {
        declines.current++
        to(true)
      }}
      onIncline={() => declines.current < 2 && to(false)}
    />
  )
}

export function WorldScene() {
  return (
    <Canvas
      dpr={DPR}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        preserveDrawingBuffer: capturing(),
        // Khronos PBR Neutral instead of the ACES default: ACES crushes everything below mid-grey,
        // which is exactly where this facility lives, so the walls read as black under it.
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1.15,
      }}
      camera={{ fov: 50, near: 0.1, far: 160, position: [1.0, 1.05, 7.2] }}
      frameloop="always"
    >
      <AdaptiveResolution />
      <Precompile />
      <PostFx />
      <PosterCapture />
      <DebugHook />
      <color attach="background" args={['#0b0f14']} />
      <fogExp2 attach="fog" args={['#101722', 0.0125]} />
      <Sky />
      <Ambience />
      <hemisphereLight args={['#5a7396', '#161e2a', 1.45]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 18, 6]} intensity={0.85} color="#dbe7ff" />
      <directionalLight position={[-14, 10, 34]} intensity={0.3} color="#8fb4ff" />
      <CameraLight />
      <LightPool />
      <MissionDriver />
      <CameraRig />
      <Floor />
      <Walls />
      <Ceiling />
      <Zone1Profile />
      <Zone2Experience />
      <Zone4Hackathons />
      <Zone5Credentials />
      <Zone6Dock />
      <PointCloud />
      <LidarSweep />
      <AmbientLife />
      <Suspense fallback={<RobotProxy />}>
        <TrakrRobot />
      </Suspense>
      <Suspense fallback={null}>
        <R1Humanoid position={[19.2, 0, 9.6]} facing={2.0} /> {/* faces back down the corridor toward the trailing camera; head still tracks Trakr */}
      </Suspense>
      <Zone3Projects />
    </Canvas>
  )
}
