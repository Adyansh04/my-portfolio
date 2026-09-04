'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CELL, GRID_COLS, GRID_ROWS, cellCenter } from '@/lib/mission/facility'
import { computeReveal } from '@/lib/mission/reveal'
import { missionT } from '@/lib/mission/path'
import { mission } from '@/lib/mission/store'
import { DRIFT_VECTOR, driftAmount } from '@/lib/mission/drift'
import { floorFrag, floorVert } from './shaders/floor'

const COUNT = GRID_COLS * GRID_ROWS

export function Floor() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const reveal = useMemo(() => computeReveal(), [])

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(CELL - 0.02, CELL - 0.02)
    g.rotateX(-Math.PI / 2)
    g.setAttribute('aSeenAt', new THREE.InstancedBufferAttribute(reveal.seenAt, 1))
    g.setAttribute('aRoom', new THREE.InstancedBufferAttribute(Float32Array.from(reveal.inRoom), 1))
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
            uAccent: { value: new THREE.Color('#ff7a1a') },
            uCell: { value: new THREE.Color('#222b37') },
            uGrid: { value: new THREE.Color('#3b4a63') },
          },
        ]),
        vertexShader: floorVert,
        fragmentShader: floorFrag,
        fog: true,
      }),
    [],
  )

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const mat = new THREE.Matrix4()
    for (let i = 0; i < COUNT; i++) {
      const [x, z] = cellCenter(i)
      mat.makeTranslation(x, 0, z)
      m.setMatrixAt(i, mat)
    }
    m.instanceMatrix.needsUpdate = true
    m.frustumCulled = false
  }, [])

  useFrame(() => {
    material.uniforms.uT.value = missionT(mission.zone, mission.beat, mission.beatT)
    const k = driftAmount()
    material.uniforms.uDrift.value.set(DRIFT_VECTOR[0] * k, DRIFT_VECTOR[1] * k, DRIFT_VECTOR[2] * k)
  })

  return <instancedMesh ref={ref} args={[geometry, material, COUNT]} />
}
