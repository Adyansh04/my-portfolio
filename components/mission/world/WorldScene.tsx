'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Floor } from './Floor'
import { Walls } from './Walls'
import { Sky } from './Sky'
import { CameraLight } from './CameraLight'
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

export function WorldScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: capturing() }}
      camera={{ fov: 50, near: 0.1, far: 160, position: [1.0, 1.05, 7.2] }}
      frameloop="always"
    >
      <PerformanceMonitor flipflops={3} />
      <PosterCapture />
      <DebugHook />
      <AdaptiveDpr pixelated />
      <color attach="background" args={['#0b0f14']} />
      <fogExp2 attach="fog" args={['#0d1219', 0.016]} />
      <Sky />
      <hemisphereLight args={['#324766', '#0b0f14', 0.9]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 18, 6]} intensity={0.9} color="#dbe7ff" />
      <CameraLight />
      <MissionDriver />
      <CameraRig />
      <Floor />
      <Walls />
      <Zone1Profile />
      <Zone2Experience />
      <Zone4Hackathons />
      <Zone5Credentials />
      <Zone6Dock />
      <PointCloud />
      <LidarSweep />
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
