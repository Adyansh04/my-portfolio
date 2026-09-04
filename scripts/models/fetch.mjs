#!/usr/bin/env node
// Downloads the raw robot sources into assets-src/ (gitignored). Idempotent: existing files are skipped.
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const MJ = 'https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/main/'
const UNITREE = 'https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/'
const TRAKR = 'https://raw.githubusercontent.com/HumanoidAddverb/trakr_legged_rl/main/resources/robots/trakr/'

const legs = ['FL', 'FR', 'RL', 'RR']
const r1Meshes = ['head_pitch_link','head_yaw_link','imu_in_pelvis_link','left_ankle_A_link','left_ankle_A_rod_link','left_ankle_B_link','left_ankle_B_rod_link','left_ankle_constraint_A_link','left_ankle_constraint_B_link','left_ankle_pitch_link','left_ankle_roll_link','left_elbow_link','left_hip_pitch_link','left_hip_roll_link','left_hip_yaw_link','left_knee_collision','left_knee_link','left_shoulder_pitch_link','left_shoulder_roll_link','left_shoulder_yaw_link','left_wrist_roll_link','pelvis_link','right_ankle_A_link','right_ankle_A_rod_link','right_ankle_B_link','right_ankle_B_rod_link','right_ankle_constraint_A_link','right_ankle_constraint_B_link','right_ankle_pitch_link','right_ankle_roll_link','right_elbow_link','right_hip_pitch_link','right_hip_roll_link','right_hip_yaw_link','right_knee_collision','right_knee_link','right_shoulder_pitch_link','right_shoulder_roll_link','right_shoulder_yaw_link','right_wrist_roll_link','waist_roll_link','waist_yaw_link']

const SETS = {
  trakr: [
    { url: TRAKR + 'urdf/robot.urdf', name: 'robot.urdf' },
    ...legs.flatMap((l) => ['hip', 'thigh', 'shank', 'toe'].map((p) => ({ url: `${TRAKR}meshes/${l}_${p}.STL`, name: `meshes/${l}_${p}.STL` }))),
    { url: TRAKR + 'meshes/base_link.STL', name: 'meshes/base_link.STL' },
  ],
  go2: [
    { url: MJ + 'unitree_go2/LICENSE', name: 'LICENSE' },
    { url: MJ + 'unitree_go2/go2.xml', name: 'go2.xml' },
    ...['base_0','base_1','base_2','base_3','base_4','hip_0','hip_1','thigh_0','thigh_1','thigh_mirror_0','thigh_mirror_1','calf_0','calf_1','calf_mirror_0','calf_mirror_1','foot'].map((n) => ({ url: `${MJ}unitree_go2/assets/${n}.obj`, name: `assets/${n}.obj` })),
  ],
  ur5e: [
    { url: MJ + 'universal_robots_ur5e/LICENSE', name: 'LICENSE' },
    { url: MJ + 'universal_robots_ur5e/ur5e.xml', name: 'ur5e.xml' },
    ...['base_0','base_1','shoulder_0','shoulder_1','shoulder_2','upperarm_0','upperarm_1','upperarm_2','upperarm_3','forearm_0','forearm_1','forearm_2','forearm_3','wrist1_0','wrist1_1','wrist1_2','wrist2_0','wrist2_1','wrist2_2','wrist3'].map((n) => ({ url: `${MJ}universal_robots_ur5e/assets/${n}.obj`, name: `assets/${n}.obj` })),
  ],
  crazyflie: [
    { url: MJ + 'bitcraze_crazyflie_2/LICENSE', name: 'LICENSE' },
    { url: MJ + 'bitcraze_crazyflie_2/cf2.xml', name: 'cf2.xml' },
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ url: `${MJ}bitcraze_crazyflie_2/assets/cf2_${i}.obj`, name: `assets/cf2_${i}.obj` })),
  ],
  r1: [
    { url: UNITREE + 'LICENSE', name: 'LICENSE' },
    { url: UNITREE + 'robots/r1_description/R1.urdf', name: 'R1.urdf' },
    ...r1Meshes.map((n) => ({ url: `${UNITREE}robots/r1_description/meshes/${n}.${n === 'torso_collision' ? 'stl' : 'STL'}`, name: `meshes/${n}.STL` })),
  ],
}

const only = process.argv.slice(2)
const jobs = Object.entries(SETS).filter(([k]) => !only.length || only.includes(k)).flatMap(([k, files]) => files.map((f) => ({ ...f, dir: join('assets-src', k) })))
let done = 0, skipped = 0, bytes = 0
async function run(job) {
  const path = join(job.dir, job.name)
  if (existsSync(path) && (await stat(path)).size > 0) { skipped++; return }
  const res = await fetch(job.url)
  if (!res.ok) throw new Error(`${res.status} ${job.url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(join(path, '..'), { recursive: true })
  await writeFile(path, buf)
  bytes += buf.length; done++
}
const queue = [...jobs]
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await run(queue.shift()) }))
console.log(`fetched ${done} files (${(bytes / 1e6).toFixed(1)} MB), skipped ${skipped} existing`)
