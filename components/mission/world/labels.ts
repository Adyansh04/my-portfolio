import * as THREE from 'three'

/** Text rendered to a canvas texture — the only way text enters the 3D world (no SDF font loading). */
export function makeLabelTexture(lines: { text: string; size?: number; color?: string; font?: string }[], opts: { w?: number; h?: number; bg?: string; pad?: number; align?: CanvasTextAlign } = {}) {
  const w = opts.w ?? 512
  const h = opts.h ?? 256
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = opts.bg ?? 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, w, h)
  const pad = opts.pad ?? 28
  const align = opts.align ?? 'left'
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  let y = pad
  for (const l of lines) {
    const size = l.size ?? 28
    ctx.font = `${l.font ?? '500'} ${size}px "IBM Plex Mono", ui-monospace, monospace`
    ctx.fillStyle = l.color ?? '#e9eef3'
    ctx.fillText(l.text, align === 'center' ? w / 2 : align === 'right' ? w - pad : pad, y)
    y += size * 1.35
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
