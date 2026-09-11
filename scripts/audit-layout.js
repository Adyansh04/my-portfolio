/**
 * Layout audit — paste into the browser console (or drive it from automation) on `?mode=world`.
 *
 *   window.__audit()             // audit whatever is on screen now
 *   await window.__auditZones()  // show each zone in turn and audit it — the useful one
 *
 * The first version of this reported 197 hits and every one of them had to be read by hand,
 * which is why nothing got fixed. The noise had two sources and both are excluded here rather
 * than triaged: full-height layout wrappers (they are not content, so they cannot be "cut off"),
 * and content inside a container that scrolls on that axis (the projects tag strip is meant to).
 * What is left is the thing actually worth knowing: visible content sitting outside the viewport,
 * or text clipped by its own box.
 */
;(() => {
  const TOL = 2

  const scrolls = (el, axis) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const o = getComputedStyle(p)[axis === 'x' ? 'overflowX' : 'overflowY']
      if (o === 'auto' || o === 'scroll') return true
    }
    return false
  }

  /** Content, as opposed to the boxes that arrange it. */
  const isContent = (el) => {
    if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT|IMG|SVG|CANVAS|VIDEO)$/.test(el.tagName)) return true
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true
    return false
  }

  const visible = (el) => {
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.05) return false
    // a zone that is not the active one is parked off-screen on purpose
    const zone = el.closest('[data-zone]')
    if (zone && zone.dataset.state && zone.dataset.state !== 'active') return false
    const r = el.getBoundingClientRect()
    return r.width > 1 && r.height > 1
  }

  const label = (el) => {
    const t = (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ')
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).slice(0, 2).join('.') : ''} "${t.slice(0, 40)}"`
  }

  window.__audit = () => {
    const vw = innerWidth
    const vh = innerHeight
    const hits = []
    for (const el of document.querySelectorAll('body *')) {
      if (!isContent(el) || !visible(el)) continue
      const r = el.getBoundingClientRect()
      const out = []
      if (r.left < -TOL && !scrolls(el, 'x')) out.push(`left ${Math.round(r.left)}`)
      if (r.right > vw + TOL && !scrolls(el, 'x')) out.push(`right +${Math.round(r.right - vw)}`)
      if (r.top < -TOL && !scrolls(el, 'y')) out.push(`top ${Math.round(r.top)}`)
      if (r.bottom > vh + TOL && !scrolls(el, 'y')) out.push(`bottom +${Math.round(r.bottom - vh)}`)
      // text cut off by its own box
      const s = getComputedStyle(el)
      if (s.overflow === 'hidden' || s.overflowX === 'hidden') {
        if (el.scrollWidth > el.clientWidth + TOL && el.clientWidth > 0 && s.textOverflow !== 'ellipsis') out.push(`clipped by ${el.scrollWidth - el.clientWidth}px`)
      }
      if (out.length) hits.push({ what: label(el), problems: out.join(', ') })
    }
    return hits
  }

  /**
   * Shows each zone in turn and audits it. Driving `data-state` directly rather than scrolling is
   * deliberate: the scroll position only reaches the DOM through GSAP's ticker, so a scroll-based
   * walk measures whatever the last frame happened to leave behind, and silently measures nothing
   * at all when the ticker is not running.
   */
  window.__auditZones = async () => {
    const zones = [...document.querySelectorAll('[data-zone]')]
    const saved = zones.map((z) => [z.dataset.state, z.style.getPropertyValue('--enter')])
    const found = []
    for (const target of zones) {
      zones.forEach((z) => {
        z.dataset.state = z === target ? 'active' : 'future'
        z.style.setProperty('--enter', z === target ? '1' : '0')
      })
      await new Promise((r) => setTimeout(r, 120))
      for (const h of window.__audit()) found.push({ zone: target.dataset.zone, ...h })
    }
    zones.forEach((z, i) => {
      if (saved[i][0]) z.dataset.state = saved[i][0]
      z.style.setProperty('--enter', saved[i][1])
    })
    return found
  }
  return 'audit ready'
})()
