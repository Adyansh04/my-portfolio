'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GradeShader } from './shaders/grade'

/** `?nofx=1` renders straight to the canvas — useful when comparing, and the escape hatch if a GPU struggles. */
const disabled = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nofx') === '1'

/**
 * Bloom over the whole frame, built from three's own postprocessing passes so it costs no extra
 * dependency. Everything that is meant to read as light — the wall strips, hologram volumes, lamp
 * bars, LiDAR returns, robot status LEDs — is emissive, and without a bleed those all sit flat on
 * the surface they are painted on. The scene renders into a multisampled half-float target, so the
 * canvas `antialias` flag (which does nothing once a composer is in the path) is replaced here.
 */
// Threshold is deliberately high: below ~0.9 the robots' white shells start blooming too and they
// read as light sources rather than painted metal. Only things that are actually emissive pass it.
export function PostFx({ strength = 0.58, radius = 0.5, threshold = 0.95 }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const enabled = !disabled() && size.width >= 900

  const composer = useMemo(() => {
    if (!enabled) return null
    const target = new THREE.WebGLRenderTarget(size.width, size.height, { type: THREE.HalfFloatType, samples: 4 })
    const c = new EffectComposer(gl, target)
    c.addPass(new RenderPass(scene, camera))
    // Ground-truth ambient occlusion. Image-based lighting arrives from every direction at once,
    // so without it nothing sits *in* anything: a crate on the floor, a rack against a wall and a
    // pedestal in the open all get the same fill and read as stickers. This is the single change
    // that stops the world looking like flat-shaded blocks.
    const gtao = new GTAOPass(scene, camera, size.width, size.height)
    gtao.updateGtaoMaterial({
      radius: 0.6, // metres — the scale of the contacts that matter here
      distanceExponent: 1.4,
      thickness: 1.2,
      scale: 1.1,
      samples: 12,
      screenSpaceRadius: false,
    })
    gtao.blendIntensity = 0.9
    c.addPass(gtao)
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold))
    c.addPass(new OutputPass())
    // after the tone map, so the vignette and grain land on display values rather than on HDR
    c.addPass(new ShaderPass(GradeShader))
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, gl, scene, camera, strength, radius, threshold])

  useEffect(() => {
    if (!composer) return
    composer.setSize(size.width, size.height)
    composer.setPixelRatio(dpr)
  }, [composer, size.width, size.height, dpr])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __composer?: unknown }).__composer = composer
    return () => composer?.dispose()
  }, [composer])

  // priority > 0 takes rendering away from R3F's default loop
  useFrame(({ clock }) => {
    if (!composer) return
    GradeShader.uniforms.uTime.value = clock.elapsedTime
    composer.render()
  }, composer ? 1 : 0)
  return null
}
