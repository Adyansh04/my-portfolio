/** Occupancy-grid floor: instanced 0.5 m cells that only exist once the robot has scanned them. */
export const floorVert = /* glsl */ `
attribute float aSeenAt;
attribute float aRoom;
uniform vec3 uDrift;
varying vec2 vUv;
varying float vSeen;
varying float vRoom;
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vSeen = aSeenAt;
  vRoom = aRoom;
  vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
  worldPosition.xyz += uDrift;
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`

export const floorFrag = /* glsl */ `
uniform float uT;
uniform vec3 uAccent;
uniform vec3 uCell;
uniform vec3 uGrid;
varying vec2 vUv;
varying float vSeen;
varying float vRoom;
#include <fog_pars_fragment>
void main() {
  if (vRoom < 0.5 || vSeen > uT) discard;
  float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float line = smoothstep(0.0, 0.09, e);
  vec3 col = mix(uGrid, uCell, line);
  // cells scanned a moment ago glow in the accent, then settle (the spawn room starts settled)
  float fresh = (1.0 - smoothstep(0.0, 0.025, uT - vSeen)) * step(0.004, vSeen);
  col += uAccent * fresh * 0.4;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`
