'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Night-shift sky over the facility: a deep blue gradient dome with a faint warm horizon and slow-drifting dust. */
export function Sky() {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uTop: { value: new THREE.Color('#162238') }, uBottom: { value: new THREE.Color('#0b0f14') }, uAccent: { value: new THREE.Color('#ff7a1a') } },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop, uBottom, uAccent; varying vec3 vP;
          void main(){
            float h = normalize(vP).y;
            vec3 c = mix(uBottom, uTop, smoothstep(-0.15, 0.85, h));
            c += uAccent * exp(-abs(h) * 10.0) * 0.06;
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [],
  )
  const dust = useMemo(() => {
    const n = 1400
    const pos = new Float32Array(n * 3)
    const rnd = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -20 + Math.random() * 70
      pos[i * 3 + 1] = 3 + Math.random() * 30
      pos[i * 3 + 2] = -10 + Math.random() * 66
      rnd[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aRand; uniform float uTime; varying float vA;
        void main(){
          vec3 p = position; p.y += sin(uTime * 0.15 + aRand * 6.28) * 0.6; p.x += cos(uTime * 0.1 + aRand * 3.1) * 0.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.5 + aRand * 2.0) * clamp(30.0 / -mv.z, 0.4, 2.0);
          vA = 0.25 + 0.5 * aRand;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard; gl_FragColor = vec4(vec3(0.55, 0.65, 0.85) * vA, vA); }`,
    })
    return { geometry: g, material: m }
  }, [])
  const ref = useRef<THREE.Points>(null)
  useFrame((_, dt) => {
    dust.material.uniforms.uTime.value += Math.min(0.05, dt || 0.016)
  })
  return (
    <group>
      <mesh material={dome} position={[13, 0, 23]} frustumCulled={false}>
        <sphereGeometry args={[110, 24, 16]} />
      </mesh>
      <points ref={ref} geometry={dust.geometry} material={dust.material} frustumCulled={false} />
    </group>
  )
}
