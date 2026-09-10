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
- **Vercel Analytics** is mounted in production, exactly as on `main`. It does nothing on GitHub
  Pages — it needs Vercel hosting — but that was already true, so it is not a regression.
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

## Still in the way

1. **The published site is 553 MB against GitHub Pages' 1 GB limit.** Better than 782 MB, but the
   remaining weight is real video that was never going to compress for free.
2. **`Tello object detect flip.mp4` is 89.7 MB**, still close to GitHub's 100 MB per-file hard
   limit. It is a 4096x2560 capture at 120 fps. Re-encoding it at CRF 18 would very likely halve
   it with no visible change, and dropping it to 60 fps or 1440p would take far more, but both are
   quality decisions rather than free wins, so neither was done.
3. **Four more videos are 43 to 67 MB** (`3-wheel-omni`, `demo_1` to `demo_3`), several at 4K 60.
   Same trade as above.
4. **`/lab/tall` ships to production.** It is the hologram design tool. Harmless, but it is an
   internal page at a public URL.
5. `.git` is still 765 MB because the history holds every old copy. `out/` is now gitignored so it
   stops growing, but shrinking it needs a history rewrite, which is not worth doing on a repo
   with a live remote unless the clone size becomes a real problem.

## To deploy

1. Merge `redesign-3d` into `main`.
2. The workflow does the rest. Watch the Actions run; the artifact upload is the slow part.
