#!/usr/bin/env node
/**
 * Re-encodes the project media without touching quality, resolution or frame rate.
 *
 *   node scripts/reencode-media.mjs [--apply]
 *
 * Two conversions, both chosen because they cost nothing visually:
 *
 * GIF to MP4. GIF is a 256-colour format with no motion compensation, which is why a 17-second
 * screen capture ended up at 91 MB. H.264 at CRF 18 is visually lossless and, on a palettised
 * source, is closer to the original than the GIF was to the recording. Timestamps are passed
 * through rather than resampled, so the frame count and duration come out identical. The one
 * unavoidable change: 4:2:0 chroma needs even dimensions, so a source with an odd width or height
 * loses a single row or column. That is a crop, not a rescale, so every remaining pixel is
 * untouched.
 *
 * MKV to MP4. Both files are already H.264 High plus AAC LC, which MP4 carries natively, so this
 * is a container swap with `-c copy`. The streams are bit-identical. No browser plays Matroska,
 * which is the actual bug being fixed here.
 *
 * Every output is verified against its source for dimensions, frame count and duration before the
 * original is removed.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/projects'
const APPLY = process.argv.includes('--apply')
const MB = (n) => (n / 1048576).toFixed(1).padStart(6) + ' MB'

const probe = (f, entries, stream = 'v:0') =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', stream, '-show_entries', entries, '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim()

/** Frame count and duration, counted rather than trusted: GIF headers lie about both. */
function shape(f) {
  const [w, h] = probe(f, 'stream=width,height').split(/[,\n]/).map(Number)
  const n = Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim())
  const d = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim())
  return { w, h, frames: n, dur: d, fps: n / d, size: statSync(f).size }
}

const jobs = []
for (const project of readdirSync(ROOT)) {
  const dir = join(ROOT, project)
  if (!statSync(dir).isDirectory()) continue
  for (const name of readdirSync(dir)) {
    const src = join(dir, name)
    const lower = name.toLowerCase()
    if (statSync(src).size === 0) { jobs.push({ kind: 'drop', src }); continue }
    if (lower.endsWith('.gif')) jobs.push({ kind: 'gif', src, out: src.replace(/\.gif$/i, '.mp4') })
    else if (lower.endsWith('.mkv')) jobs.push({ kind: 'mkv', src, out: src.replace(/\.mkv$/i, '.mp4') })
  }
}

let before = 0, after = 0
for (const job of jobs) {
  const name = job.src.split('/').slice(-2).join('/')
  if (job.kind === 'drop') {
    before += 0
    console.log(`  DROP     ${name}  (zero bytes, unplayable)`)
    if (APPLY) unlinkSync(job.src)
    continue
  }
  const a = shape(job.src)
  before += a.size
  if (!APPLY) { console.log(`  ${job.kind.toUpperCase().padEnd(8)} ${name}  ${a.w}x${a.h} ${a.frames}f ${a.fps.toFixed(2)}fps ${MB(a.size)}`); continue }

  const args = job.kind === 'gif'
    ? ['-y', '-v', 'error', '-i', job.src,
       // keep the source timestamps: -r would resample the frame rate
       '-fps_mode', 'passthrough',
       // 4:2:0 needs even dimensions; crop leaves every remaining pixel untouched, scale would not
       '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
       '-movflags', '+faststart', '-an', job.out]
    : ['-y', '-v', 'error', '-i', job.src, '-c', 'copy', '-movflags', '+faststart', job.out]

  execFileSync('ffmpeg', args, { stdio: 'inherit' })
  const b = shape(job.out)
  after += b.size

  const cropped = (a.w - b.w) + (a.h - b.h)
  const ok = b.frames === a.frames && Math.abs(b.dur - a.dur) < 0.05 && cropped <= 2 && a.w - b.w <= 1 && a.h - b.h <= 1
  console.log(
    `  ${ok ? 'OK  ' : 'FAIL'}  ${name}  ${a.w}x${a.h}->${b.w}x${b.h}  ${a.frames}->${b.frames}f  ` +
    `${a.fps.toFixed(2)}->${b.fps.toFixed(2)}fps  ${MB(a.size)} ->${MB(b.size)}`,
  )
  if (!ok) { console.error('    refusing to delete the source: output does not match'); continue }
  unlinkSync(job.src)
}

if (APPLY) console.log(`\ntotal ${MB(before)} -> ${MB(after)}  (saved ${MB(before - after)})`)
else console.log('\ndry run; pass --apply to convert')
