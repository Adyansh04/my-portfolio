# Deploying the redesign

Nothing here has been pushed. This is the state of the deployment path as of 2026-09-11, what was
verified, and what is still in the way.

## How this site deploys

Unchanged from `main`, and `.github/workflows/deploy.yml` is byte-identical on both branches:

- GitHub Actions builds on every push to **`main`**, or on manual `workflow_dispatch`.
- `npm ci` → `npm run build` → `actions/upload-pages-artifact` with `path: out` →
  `actions/deploy-pages`.
- `next.config.mjs` is also identical: `output: 'export'`, `basePath` and `assetPrefix` of
  `/my-portfolio`, unoptimised images. The site is a static export served from a project page.
- Three public env vars are set **in the workflow**, not in a file. They are baked into the client
  bundle at build time, so a local `npm run build` produces an export with analytics disabled:

  | Variable | Value |
  | --- | --- |
  | `NEXT_PUBLIC_POSTHOG_KEY` | `phc_x6Dquo…NCAB` |
  | `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` |
  | `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | `896f1d0b-…e83d` |

**The redesign lives on `redesign-3d`, and the workflow only fires on `main`.** Deploying means
merging. That is a decision, not a step, so it has not been done.

## Verified working in the current design

Checked against a real production build (workflow env vars set) served from `out/` under
`/my-portfolio`, not against the dev server:

- **PostHog** initialises with the right project token, fetches its remote config from
  `eu.i.posthog.com`, and writes its persistence key. **Autocapture is on and session recording is
  on** — that is the recording you remembered. `app/providers.tsx` is byte-identical to `main`.
  Note: `window.posthog` is `undefined` even when it is working, because posthog-js imported as a
  module does not attach itself to `window` the way the snippet loader does. Check
  `window._POSTHOG_REMOTE_CONFIG` instead.
- **Umami** loads from `cloud.umami.is` with the right website id and defines `window.umami`.
- **Vercel Analytics is removed** (2026-09-11, Adyansh's call). It only works on Vercel's hosting,
  so on GitHub Pages it did nothing but 404 on `/_vercel/insights/script.js` on every load, as it
  does on `main`. PostHog and Umami are unaffected.
- **The chat worker** is the same Cloudflare Worker (`portfolio-chat.gupta-adyansh.workers.dev`),
  the request shape is unchanged, and the endpoint answers (405 to a GET, so it is alive and
  POST-only).
- Every asset class resolves under the base path: resume, models, Draco decoder, textures, posters,
  the media manifest.

Neither branch has any custom `posthog.capture` call, so no event was lost in the redesign. It also
means there is still no zone-level analytics on a site whose whole content *is* the scroll. Worth
adding, but it would be new behaviour rather than parity, so it has not been.

## Media, re-encoded 2026-09-11

`scripts/reencode-media.mjs` did this, and it verifies every output against its source before
deleting the original. Quality, resolution and frame rate were held fixed by request.

- **Seven GIFs became MP4.** GIF has 256 colours and no motion compensation, which is how a
  17-second screen capture reached 91 MB. H.264 at CRF 18 is visually lossless and, on a
  palettised source, is closer to the recording than the GIF was. **258.8 MB became 29.7 MB.**
  Frame counts and durations came out identical in every case; timestamps are passed through
  rather than resampled. The only geometric change is that 4:2:0 chroma needs even dimensions, so
  `demo1` lost one row (1751 to 1750) and `demo2` lost one (901 to 900). That is a crop, so every
  remaining pixel is untouched.
- **Two `.mkv` files became MP4** by container swap. Both were already H.264 High plus AAC LC, so
  `-c copy` moved the streams across bit-identically. No browser plays Matroska, which was the
  actual bug.
- **The zero-byte `Robocon 1.mp4` is gone** and no longer appears in the manifest.
- `public/projects` went from 769 MB to 540 MB; the published site from 782 MB to 553 MB.

The carousel now loops videos and plays them inline, because the seven clips that used to be GIFs
looped forever and would otherwise stop after one pass. Thumbnails show a still first frame rather
than animating, which is less decode work for the same information.

## Recompression, and where it stopped

`scripts/recompress-media.mjs` re-encodes at the same resolution and frame rate and measures every
output against its source with SSIM, refusing any result that drops below 0.97 or comes out larger.
Run against the eight files over 25 MB, exactly one was worth replacing:

| file | before | after | SSIM |
| --- | --- | --- | --- |
| `3-wheel-omni.mp4` 1080p30 | 67.2 MB | **10.1 MB** | 0.9942 |
| `demo_1.mp4` 4K60 | 43.0 MB | 73.8 MB, kept original | 0.9893 |
| `demo_2.mp4` 4K60 | 45.8 MB | 78.5 MB, kept original | 0.9902 |
| `demo_3.mp4` 4K60 | 66.3 MB | 118.1 MB, kept original | 0.9891 |
| `Aruco Warehouse.mp4` 4K120 | 41.0 MB | 58.7 MB, kept original | 0.9968 |
| `Tello object detect flip.mp4` 4K120 | 89.7 MB | 109.3 MB, kept original | 0.9938 |
| ↳ then at 60 fps, CRF 24 (Adyansh's call) | 89.7 MB | **71.1 MB** (74.6 MB decimal) | 0.9955 vs source at 60 fps |
| `uc1.mp4` | 30.2 MB | 32.8 MB, kept original | 0.9987 |
| `uc3.mp4` | 31.0 MB | 33.5 MB, kept original | 0.9987 |

The pattern is clear: `3-wheel-omni` was 1080p30 at 18 Mb/s, about six times what that resolution
needs, and everything else is already encoded at or below what CRF 20 targets. A visually lossless
pass over those is an upgrade, not a saving.

**Shrinking the rest is a quality decision, and none was taken.** The options, in order of how
little anyone would notice:

1. **Drop 4K120 to 4K60.** No display shows 120 fps here and no browser benefits. Roughly halves
   the temporal data with every still frame untouched. **Done for the Tello clip** (above);
   `Aruco Warehouse.mp4` is the other 4K120 file if it's ever wanted.
2. **Downscale to 1440p.** The carousel caps playback at 65vh, so on a 1440x900 screen a
   2560-tall source is already displayed at about 585 px, a quarter of its height.
3. **Raise the CRF to 24 to 26.** The first visible option, and the one to reach for last.

## Still in the way

1. **The published site is 474 MB against GitHub Pages' 1 GB limit**, down from 782 MB. The
   largest single file is now 71 MB, under GitHub's 100 MB per-file limit.
2. `.git` is still large because the history holds every old copy of the media. `out/` is
   gitignored so it stops growing, but shrinking it needs a history rewrite, which is not worth
   doing on a repo with a live remote unless the clone size becomes a real problem.

Fixed since the first version of this list: `/lab/tall` no longer ships (it's `page.dev.tsx`,
and `pageExtensions` only includes that outside production), the favicons now resolve under
`/my-portfolio` (they 404'd on `main` too), and Vercel Analytics, which 404'd on every load, is gone.

## Rendering

The first scroll after a load used to freeze for up to 2 s at a time as shaders recompiled (see
HANDOFF, sessions 3j-3k). The production bundle now holds 60 fps through a cold scroll of the whole
page on the RTX 4080, with a worst frame of 114 ms. GTAO is gone, point lights go through a pool
of four, every shader compiles during load, and pixel density drops to 1x on a GPU that can't keep up.

## First load

Measured on the built export, world mode, cold cache: **5.3 MB across 104 requests**, down from
7.6 MB. Textures are 2.7 MB of it, models and the Draco decoder 1.3 MB, JavaScript the rest.
Project media is 0 bytes on first load and only fetched when a sheet opens. Static mode, which is
what every phone gets, loads no three.js, no textures and no models at all.

## Phones

Audited 2026-09-11 on the production export with Chrome device emulation: 360x800, 375x667 and
390x844 portrait, 844x390 and 915x412 sideways, iPad 820x1180 both ways.

| | before | after |
| --- | --- | --- |
| experience entries visible | 2 of 6 (the project list covered the rest) | 6 of 6 |
| text under 12px | 24% | 0% |
| touch targets under 44px | 35 of 36 | 0 (phones, sideways phones, iPads) |
| sideways overflow | project sheet +28px, contact column +24px at 360px | none |
| layout shift on load | 0.284 | 0 |
| first paint, Slow 4G + 4x CPU | 4.3-4.8 s | 2.5 s |
| first-load transfer as served | ~1.0 MB | ~0.85 MB (3 posters instead of 7) |

Phones in either orientation get the static page (touch + short side under 600px). Tablets keep
the world at the desktop type scale, where about a quarter of the text is 11px mono. The timings
come from a local server that doesn't gzip; GitHub Pages does, so real phones will be faster than
the table.

## To deploy

1. Merge `redesign-3d` into `main`.
2. The workflow does the rest. Watch the Actions run; the artifact upload is the slow part.
