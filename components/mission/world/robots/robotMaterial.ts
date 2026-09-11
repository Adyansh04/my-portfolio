import * as THREE from 'three'
import type { RobotLink } from '@/lib/mission/robots'

export interface RobotMaterialOptions {
  metalness?: number
  roughness?: number
  /** rim light colour (kept neutral so robots keep their real colours); '' disables */
  rim?: string
  rimStrength?: number
}

/** Solid PBR material for real robots. Neutral white rim only, so the palette reads as the real hardware. */
export function makeRobotMaterial(color = '#c9ced3', opts: RobotMaterialOptions = {}) {
  const { metalness = 0.45, roughness = 0.4, rim = '#ffffff', rimStrength = 0.16 } = opts
  const m = new THREE.MeshStandardMaterial({ color, metalness, roughness })
  if (rim) {
    const uRim = { value: new THREE.Color(rim).multiplyScalar(rimStrength) }
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uRim = uRim
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
        .replace(
          '#include <dithering_fragment>',
          `float rimK = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.0);
          gl_FragColor.rgb += uRim * rimK;
          #include <dithering_fragment>`,
        )
    }
    m.customProgramCacheKey = () => `robot-rim-${rim}-${rimStrength}`
  }
  return m
}

const cache = new Map<string, THREE.MeshStandardMaterial>()
const mat = (color: string, opts?: RobotMaterialOptions) => {
  const key = `${color}|${JSON.stringify(opts ?? {})}`
  let m = cache.get(key)
  if (!m) {
    m = makeRobotMaterial(color, opts)
    cache.set(key, m)
  }
  return m
}

/* ---------- real-world palettes ---------- */
// satin paint, not chrome: at 0.55 metalness the shell mirrored the environment map and clipped to white
const SILVER = () => mat('#c6cbd1', { metalness: 0.26, roughness: 0.52 })
const GRAPHITE = () => mat('#1a1d21', { metalness: 0.5, roughness: 0.45 })
const ADDVERB_ORANGE = () => mat('#f2531f', { metalness: 0.25, roughness: 0.45 })
const UNITREE_GREY = () => mat('#b9bec6', { metalness: 0.24, roughness: 0.52 })
const UNITREE_DARK = () => mat('#2a2e34', { metalness: 0.5, roughness: 0.45 })
const R1_WHITE = () => mat('#e3e7ec', { metalness: 0.12, roughness: 0.55, rimStrength: 0.08 })
const R1_FRAME = () => mat('#2c3550', { metalness: 0.35, roughness: 0.5 })
const UR_GREY = () => mat('#b4b9bf', { metalness: 0.25, roughness: 0.5 })
const UR_BLUE = () => mat('#3d7fc4', { metalness: 0.3, roughness: 0.45 })

/** Addverb Trakr: silver body, black hip motors, orange thigh covers, silver shanks, black feet (from the product photo). */
export const trakrMaterialFor = (link: RobotLink): THREE.Material => {
  const n = link.name
  if (/_hip$/.test(n) || /_toe$/.test(n)) return GRAPHITE()
  if (/_thigh$/.test(n)) return ADDVERB_ORANGE()
  if (/_shank$/.test(n)) return SILVER()
  return SILVER()
}
/** Unitree Go2: grey body, dark legs. */
export const go2MaterialFor = (link: RobotLink): THREE.Material => (link.name === 'base' ? UNITREE_GREY() : /_foot$/.test(link.name) ? GRAPHITE() : UNITREE_DARK())
/**
 * Unitree R1 (from the product photo): white outer shells — head, torso, thighs, shins, upper arms, forearms,
 * hands — over a dark blue-grey frame: pelvis, waist, hip/ankle/shoulder modules, neck, feet.
 */
const R1_SHELL = /^(head_yaw_link|waist_yaw_link|(left|right)_(hip_yaw|knee|shoulder_yaw|elbow|wrist_roll)_link)$/
export const r1MaterialFor = (link: RobotLink): THREE.Material => (R1_SHELL.test(link.name) ? R1_WHITE() : R1_FRAME())
/** Unitree G1: light shells on the torso, thighs and upper arms over the dark joint modules, so the
 *  silhouette still reads when the robot is 40 cm tall on a hologram deck. */
const G1_SHELL = /^(torso_link.*|head_link|(left|right)_(hip_yaw|knee|shoulder_roll|elbow)_link)$/
// a notch darker and rougher than the Go2's grey: the torso sits right under its stage lamp and bloomed to white
const G1_GREY = () => mat('#98a0aa', { metalness: 0.18, roughness: 0.62 })
export const g1MaterialFor = (link: RobotLink): THREE.Material => (G1_SHELL.test(link.name) ? G1_GREY() : UNITREE_DARK())
/** UR5e: light grey links, UR blue joint caps. */
export const ur5eMaterialFor = (link: RobotLink): THREE.Material => (/shoulder|wrist_1|wrist_2/.test(link.name) ? UR_BLUE() : UR_GREY())
export const crazyflieMaterial = () => mat('#23272d', { metalness: 0.35, roughness: 0.5 })
