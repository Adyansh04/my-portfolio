'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { computeReveal } from '@/lib/mission/reveal'
import { missionT } from '@/lib/mission/path'
import { mission } from '@/lib/mission/store'
import { DRIFT_VECTOR, driftAmount } from '@/lib/mission/drift'
import { pointsFrag, pointsVert } from './shaders/points'

/** Every wall return the robot has recorded so far, one draw call. */
export function PointCloud() {
  const dpr = useThree((s) => s.viewport.dpr)
  const reveal = useMemo(() => computeReveal(), [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(reveal.points.position, 3))
    g.setAttribute('aSeenAt', new THREE.BufferAttribute(reveal.points.seenAt, 1))
    g.setAttribute('aRand', new THREE.BufferAttribute(reveal.points.rand, 1))
    g.computeBoundingSphere()
    return g
  }, [reveal])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uT: { value: 0 },
            uDrift: { value: new THREE.Vector3() },
            uSize: { value: 3.4 },
            uPixelRatio: { value: 1 },
            uAccent: { value: new THREE.Color('#ff7a1a') },
          },
        ]),
        vertexShader: pointsVert,
        fragmentShader: pointsFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: true,
      }),
    [],
  )

  useFrame(() => {
    material.uniforms.uT.value = missionT(mission.zone, mission.beat, mission.beatT)
    material.uniforms.uPixelRatio.value = dpr
    const k = driftAmount()
    material.uniforms.uDrift.value.set(DRIFT_VECTOR[0] * k, DRIFT_VECTOR[1] * k, DRIFT_VECTOR[2] * k)
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
