/**
 * Static mode = no WebGL world, sections flow normally, every beat visible. Chosen for
 * reduced-motion users, narrow viewports, phones in either orientation (touch + a short side under
 * 600px), or `?mode=static`; `?mode=world` forces the world on, e.g. to test a phone with 3D.
 *
 * This runs inline in <head> (app/layout.tsx), before the first paint, and stamps the answer on
 * <html data-static>. Deciding it after hydration instead meant every phone first laid out the
 * world page, then collapsed the hero once JS arrived: a 0.28 layout shift on every load.
 * Kept in its own module, without 'use client', so the server layout can import the string.
 */
export const STATIC_MODE_SCRIPT = `(function () {
  var q = new URLSearchParams(location.search).get('mode')
  var m = function (s) { return matchMedia(s).matches }
  var isStatic = q === 'static' || (q !== 'world' && (m('(prefers-reduced-motion: reduce)') || innerWidth < 768 || (m('(pointer: coarse)') && Math.min(innerWidth, innerHeight) < 600)))
  document.documentElement.dataset.static = isStatic ? 'true' : 'false'
})()`
