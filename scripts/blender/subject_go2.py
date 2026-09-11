"""Go2 autonomous inspection: a small facility, the patrol it walks, what it found."""
import math
ROOMS = [
    ('zone_1', -0.30, -0.18, 0.38, 0.30, 3),
    ('zone_2',  0.22, -0.18, 0.50, 0.30, 5),
    ('zone_3', -0.30,  0.22, 0.38, 0.34, 2),
    ('zone_4',  0.22,  0.22, 0.50, 0.34, 4),
]
def walls():
    out, gap = [], 0.09
    for _, x, z, w, d, _ in ROOMS:
        x0, x1, z0, z1 = x - w / 2, x + w / 2, z - d / 2, z + d / 2
        zm = (z0 + z1) / 2
        out += [((x0, z0), (x1, z0)), ((x0, z1), (x1, z1))]
        out += [((x0, z0), (x0, zm - gap)), ((x0, zm + gap), (x0, z1))]
        out += [((x1, z0), (x1, zm - gap)), ((x1, zm + gap), (x1, z1))]
    return out
PATROL = [(-0.30, -0.18), (0.02, -0.18), (0.22, -0.18), (0.40, 0.02),
          (0.22, 0.22), (-0.02, 0.22), (-0.30, 0.22), (-0.46, 0.02), (-0.30, -0.18)]
DETECTIONS = [(-0.34, -0.24, 0.085, 'fire extinguisher'), (0.31, -0.26, 0.12, 'pallet stack'),
              (0.10, -0.13, 0.095, 'office chair'), (-0.26, 0.28, 0.075, 'toolbox'),
              (0.33, 0.28, 0.14, 'shelving unit'), (0.09, 0.16, 0.065, 'cable drum')]
