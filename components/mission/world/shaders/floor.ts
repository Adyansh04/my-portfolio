/** Occupancy-grid floor: instanced 0.5 m cells that only exist once the robot has scanned them. */
export const floorVert = /* glsl */ `
attribute float aSeenAt;
attribute float aRoom;
uniform vec3 uDrift;
varying vec2 vUv;
varying float vSeen;
varying float vRoom;
varying vec3 vWorld;
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vSeen = aSeenAt;
  vRoom = aRoom;
  vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
  worldPosition.xyz += uDrift;
  vWorld = worldPosition.xyz;
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
uniform vec3 uFill;
uniform vec3 uSheen;
uniform sampler2D uMap;
uniform sampler2D uNrm;
uniform sampler2D uOrm;
uniform float uTile;
varying vec2 vUv;
varying float vSeen;
varying float vRoom;
varying vec3 vWorld;
#include <fog_pars_fragment>

float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  if (vRoom < 0.5 || vSeen > uT) discard;
  float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float line = smoothstep(0.0, 0.09, e);
  vec3 col = mix(uGrid, uCell, line);
  // per-tile shade variation so the floor is a laid surface, not one flat sheet
  col *= 0.9 + 0.2 * hash21(floor(vWorld.xz * 2.0));

  // the baked concrete set, sampled in world space so it runs continuously under the cell grid
  vec2 tuv = vWorld.xz / uTile;
  vec3 slab = texture2D(uMap, tuv).rgb;
  vec3 orm = texture2D(uOrm, tuv).rgb;
  col *= slab * 2.9;               // the map is a dark aggregate; lift it back to the cell value
  col *= mix(1.0, orm.r, 0.7);     // cavity occlusion between the stones

  // the floor is a plain shader, so it gets its light analytically: the fill light rides the camera,
  // which means the view and light vectors are the same and one dot product covers both lobes.
  vec3 V = cameraPosition - vWorld;
  float dist = length(V);
  V /= max(dist, 0.001);
  float att = 1.0 / (1.0 + dist * dist * 0.032);
  // relief from the normal map, in the tangent frame this projection implies (u->+x, v->+z)
  vec3 tn = texture2D(uNrm, tuv).xyz * 2.0 - 1.0;
  vec3 N = normalize(vec3(tn.x * 0.55, tn.z, tn.y * 0.55));
  float lambert = max(dot(N, V), 0.0);
  // rough patches scatter; the polished traffic lanes hold a tight highlight
  float gloss = 1.0 - orm.g;
  float spec = pow(lambert, 6.0 + 46.0 * gloss) * (0.35 + 1.5 * gloss);
  col *= 0.6 + 1.45 * lambert * att;
  col += uFill * (spec * att * 0.5 + lambert * att * 0.1);
  // grazing sheen so distant floor still reads as a plane instead of dissolving into the fog
  col += uSheen * pow(1.0 - lambert, 5.0) * 0.05;

  // cells scanned a moment ago glow in the accent, then settle (the spawn room starts settled)
  float fresh = (1.0 - smoothstep(0.0, 0.025, uT - vSeen)) * step(0.004, vSeen);
  col += uAccent * fresh * 0.4;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`
