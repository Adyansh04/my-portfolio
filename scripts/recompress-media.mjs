#!/usr/bin/env node
/**
 * Recompresses the heavy videos at the same resolution and frame rate.
 *
 *   node scripts/recompress-media.mjs [--apply] [--crf 20]
 *
 * Unlike `reencode-media.mjs`, which only changed containers and codecs that could not lose
 * anything, this genuinely re-encodes. It is worth doing because the sources are wildly
 * over-bitrate for what they contain: a 1080p30 clip at 18 Mb/s is roughly six times what that
 * resolution needs, and the 4K captures are phone footage straight off the device.
 *
 * Every output is measured against its source with SSIM and rejected if it drops below the
 * threshold, so "the quality is fine" is a number here rather than an opinion. Resolution, frame
 * rate, frame count and duration are all required to come out identical, and audio is stream-
 * copied rather than re-encoded.
 */
import { execFileSync } from 'node:child_process'
import { statSync, unlinkSync, renameSync, existsSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')
const CRF = process.argv.includes('--crf') ? process.argv[process.argv.indexOf('--crf') + 1] : '20'
/** below this the file is not worth the encode time */
const MIN_MB = 25
/** structural similarity floor; 0.98+ is indistinguishable in side-by-side viewing */
const MIN_SSIM = 0.97

const MB = (n) => (n / 1048576).toFixed(1).padStart(6) + ' MB'
const probe = (f, entries, stream) =>
  execFileSync('ffprobe', ['-v', 'error', ...(stream ? ['-select_streams', stream] : []), '-show_entries', entries, '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim()

function shape(f) {
  const [w, h] = probe(f, 'stream=width,height', 'v:0').split(/[,\n]/).map(Number)
  const dur = Number(probe(f, 'format=duration'))
  const frames = Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim())
  return { w, h, dur, frames, size: statSync(f).size }
}

/** Mean SSIM of the encode against its source, straight from ffmpeg. */
function ssim(a, b) {
  const out = execFileSync('ffmpeg', ['-v', 'error', '-i', b, '-i', a, '-lavfi', 'ssim=stats_file=-', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 })
  const alls = [...out.matchAll(/All:([0-9.]+)/g)].map((m) => Number(m[1]))
  return alls.length ? alls.reduce((s, v) => s + v, 0) / alls.length : NaN
}

const targets = execFileSync('bash', ['-c', `find public/projects -type f -iname '*.mp4' -size +${MIN_MB}M | sort`], { encoding: 'utf8' })
  .split('\n').filter(Boolean)

let before = 0, after = 0
for (const src of targets) {
  const a = shape(src)
  before += a.size
  const name = src.split('/').slice(-2).join('/')
  const fps = (a.frames / a.dur).toFixed(2)
  if (!APPLY) { console.log(`  ${name}  ${a.w}x${a.h} ${fps}fps ${MB(a.size)}`); continue }

  const tmp = src.replace(/\.mp4$/i, '.recompress.mp4')
  const hasAudio = probe(src, 'stream=codec_type', 'a:0').length > 0
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', src,
    '-fps_mode', 'passthrough',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p',
    ...(hasAudio ? ['-c:a', 'copy'] : ['-an']),
    '-movflags', '+faststart', tmp,
  ], { stdio: 'inherit' })

  const b = shape(tmp)
  const q = ssim(src, tmp)
  const geometryOk = b.w === a.w && b.h === a.h && b.frames === a.frames && Math.abs(b.dur - a.dur) < 0.05
  const ok = geometryOk && q >= MIN_SSIM && b.size < a.size

  console.log(
    `  ${ok ? 'OK  ' : 'KEEP'}  ${name}  ${a.w}x${a.h} ${fps}fps  ${MB(a.size)} ->${MB(b.size)}  ` +
    `SSIM ${q.toFixed(4)}${geometryOk ? '' : '  GEOMETRY CHANGED'}`,
  )
  if (!ok) { unlinkSync(tmp); after += a.size; continue }
  unlinkSync(src); renameSync(tmp, src)
  after += b.size
}
console.log(APPLY ? `\ntotal ${MB(before)} -> ${MB(after)}  (saved ${MB(before - after)})` : `\n${targets.length} files over ${MIN_MB} MB; pass --apply`)
