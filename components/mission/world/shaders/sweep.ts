/** Floor-hugging LiDAR sweep: a beam with a trailing glow, rotating around the robot. */
export const sweepVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const sweepFrag = /* glsl */ `
uniform float uAngle;
uniform vec3 uAccent;
uniform float uOn;
varying vec2 vUv;
const float TAU = 6.28318530718;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float da = mod(uAngle - a + TAU, TAU);
  float beam = exp(-da * 5.5);
  float fall = (1.0 - r) * (0.35 + 0.65 * smoothstep(0.0, 0.08, r));
  float ring = exp(-abs(r - fract(uAngle / TAU)) * 40.0) * 0.25;
  float alpha = (beam * fall * 0.55 + ring * fall) * uOn;
  gl_FragColor = vec4(uAccent * alpha, alpha);
}
`
