'use client'

import { Suspense } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
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

export function WorldScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
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
      <PerformanceMonitor flipflops={3} />
      <PostFx />
      <PosterCapture />
      <DebugHook />
      <AdaptiveDpr pixelated />
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
