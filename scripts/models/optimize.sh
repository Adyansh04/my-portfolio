#!/usr/bin/env bash
# Draco-compress + simplify every raw GLB written by convert.py, in place (4 files at a time).
# Usage: scripts/models/optimize.sh [robot ...]
set -euo pipefail
cd "$(dirname "$0")/../.."
robots=("$@"); [ ${#robots[@]} -eq 0 ] && robots=(trakr go2 ur5e crazyflie r1)
one() {
  f="$1"; tmp="${f%.glb}.opt.glb"
  # ratio 0.35 keeps enough silhouette for a stylised render; the error bound protects small parts
  npx --yes @gltf-transform/cli@4 optimize "$f" "$tmp" --compress draco --simplify true --simplify-ratio 0.35 --simplify-error 0.002 --weld true --texture-compress false --flatten true --join false >/dev/null 2>&1 \
    && mv "$tmp" "$f" || { rm -f "$tmp"; echo "FAILED $f"; }
}
export -f one
for r in "${robots[@]}"; do
  ls public/models/$r/*.glb | xargs -P 4 -I{} bash -c 'one "$@"' _ {}
  echo "$r: $(du -sk public/models/$r | cut -f1) KB total after optimize"
done
