import { turboGlsl } from '@/lib/mission/turbo'

/** LiDAR returns on the walls, coloured by height with turbo (RViz "axis" colour transformer). */
export const pointsVert = /* glsl */ `
attribute float aSeenAt;
attribute float aRand;
uniform float uT;
uniform vec3 uDrift;
uniform float uSize;
uniform float uPixelRatio;
varying float vSeen;
varying float vRand;
varying float vH;
#include <fog_pars_vertex>
void main() {
  vSeen = aSeenAt;
  vRand = aRand;
  vH = position.y;
  vec4 mvPosition = modelViewMatrix * vec4(position + uDrift, 1.0);
  float visible = step(aSeenAt, uT);
  gl_PointSize = visible * uSize * uPixelRatio * (0.8 + 0.6 * aRand) * clamp(7.0 / -mvPosition.z, 0.35, 2.5);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`

export const pointsFrag = /* glsl */ `
uniform float uT;
uniform vec3 uAccent;
varying float vSeen;
varying float vRand;
varying float vH;
#include <fog_pars_fragment>
${turboGlsl}
void main() {
  if (vSeen > uT) discard;
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  vec3 col = vH < 0.08 ? vec3(0.55, 0.62, 0.75) : turbo(clamp(vH / 2.6, 0.0, 1.0));
  // returns from the very first scan (spawn room) start settled, like the floor
  float fresh = (1.0 - smoothstep(0.0, 0.02, uT - vSeen)) * step(0.004, vSeen);
  col = mix(col, uAccent, fresh * 0.85);
  float a = 0.5 + 0.45 * vRand + fresh * 0.4;
  gl_FragColor = vec4(col * a, a);
  #include <fog_fragment>
}
`
