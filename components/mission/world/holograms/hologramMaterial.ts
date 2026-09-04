import * as THREE from 'three'

/** Additive, scan-lined, edge-lit material for procedural hologram content. */
export function makeHologramMaterial(color = '#ff7a1a', opacity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uActive: { value: 0.6 }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = -mv.xyz;
        vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime; uniform float uActive; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() {
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        float scan = 0.85 + 0.15 * sin(vW.y * 70.0 - uTime * 5.0);
        float a = (0.3 + 0.85 * fres) * scan * uOpacity * (0.5 + 0.5 * uActive);
        gl_FragColor = vec4(uColor * (1.05 + 1.7 * fres), a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
}

/** Thin accent lines (graphs, frustums, paths). */
export function makeLineMaterial(color = '#ff7a1a', opacity = 0.7) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
}
