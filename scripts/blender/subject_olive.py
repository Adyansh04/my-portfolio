"""OLIVE: a 56 m circuit as a closed superellipse, its keyframes, factors and fiducials."""
import math
def keyframes(n=26, a=0.42, b=0.27, nn=3.4):
    p = lambda v: math.copysign(abs(v) ** (2 / nn), v)
    out = []
    for i in range(n):
        u = i / n
        th = u * math.tau
        g = u * u * 0.075
        out.append((a * p(math.cos(th)), b * p(math.sin(th)), u, (g * 0.9, -g * 0.6)))
    return out
KF = keyframes()
LANDMARKS = [(-0.20, -0.14), (0.27, 0.02), (-0.11, 0.18)]
KINDS = ['lidar', 'imu', 'encoder', 'vision']
def factors():
    out, n = [], len(KF)
    for i in range(n - 1):
        out.append((i, i + 1, 'lidar'))
        if i % 2 == 0: out.append((i, i + 1, 'imu'))
        if i % 3 == 0: out.append((i, i + 1, 'encoder'))
        if i % 5 == 2: out.append((i, min(i + 2, n - 1), 'vision'))
    for li in range(len(LANDMARKS)):
        for k in (2 + li * 8, 4 + li * 8):
            if k < n: out.append((k, 'L%d' % li, 'fiducial'))
    out.append((n - 1, 0, 'loop'))
    return out
FACTORS = factors()
COLORS = {'lidar': (0.10, 0.62, 1.0, 1), 'imu': (1.0, 0.30, 0.05, 1), 'encoder': (0.35, 0.90, 0.30, 1),
          'fiducial': (0.55, 0.40, 1.0, 1), 'vision': (0.95, 0.78, 0.25, 1), 'loop': (1.0, 0.18, 0.32, 1)}
