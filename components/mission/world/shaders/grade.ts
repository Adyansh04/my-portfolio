import * as THREE from 'three'

/**
 * The final grade: vignette, a filmic contrast roll, and grain.
 *
 * A render that is mathematically correct still looks like a render, because a real image is taken
 * through a lens and onto a sensor. The vignette is what a lens does at the edges, the S-curve is
 * what film does to the shoulder and toe, and the grain is what stops large flat areas — a wall, a
 * floor in fog — from banding into visible steps. Together they cost one full-screen pass and do
 * more for "this looks photographed" than any amount of extra geometry.
 */
export const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 0.5 },
    uContrast: { value: 1.04 },
    uGrain: { value: 0.024 },
    uLift: { value: new THREE.Color('#111b2b') },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uContrast;
    uniform float uGrain;
    uniform vec3 uLift;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;

      // lens falloff, squared so the corners go rather than the whole frame dimming
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.92);
      float v = 1.0 - dot(d, d) * uVignette;
      c *= clamp(v * v, 0.0, 1.0);

      // a shoulder and a toe: pull the midtones apart without clipping either end
      c = mix(vec3(0.5), c, uContrast);
      c = max(c, vec3(0.0));
      // a cold lift in the deepest shadows, so black is a colour rather than an absence
      c += uLift * (1.0 - smoothstep(0.0, 0.16, dot(c, vec3(0.333))));

      // grain, animated so it reads as sensor noise instead of a dirty lens
      float g = hash(vUv * 1024.0 + fract(uTime) * 91.7) - 0.5;
      c += g * uGrain;

      gl_FragColor = vec4(c, 1.0);
    }
  `,
}
