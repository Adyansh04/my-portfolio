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

## In the way

Everything below is inherited from `main`, not introduced by the redesign. It is listed because it
is what will bite on the next deploy.

1. **The published site is ~782 MB against GitHub Pages' 1 GB limit.** `public/projects` alone is
   769 MB, effectively identical to `main`'s 768 MB. Every deploy uploads that as an artifact.
2. **Two files sit just under GitHub's 100 MB per-file hard limit:** `whycode/demo2.gif` at 91 MB
   and `drone-systems/Tello object detect flip.mkv` at 94 MB. They are already committed so they
   passed, but there is no headroom left.
3. **Two `.mkv` files are in the media manifest and no browser can play Matroska** —
   `Aruco Warehouse.mkv` (43 MB) and `Tello object detect flip.mkv` (94 MB). They download and
   fail.
4. **`abu-robocon/Robocon 1.mp4` is zero bytes.** The carousel lists it and it cannot play.
5. **Nine GIFs are used where video belongs**, including 91 MB, 84 MB and 62 MB files. A GIF that
   size is minutes of loading for a visitor on anything but a desk connection.
6. **`out/` is committed on both branches**, so the 768 MB of media is stored twice and `.git` is
   765 MB. The workflow rebuilds and uploads its own `out/`, so the committed copy is never used.
   Adding `out/` to `.gitignore` costs nothing and roughly halves what a clone pulls.
7. **`/lab/tall` ships to production.** It is the hologram design tool. Harmless, but it is an
   internal page at a public URL.

Items 1 to 5 are the media re-encode that has been deferred since 2026-09-03. It is now the only
thing standing between this and a deploy that is comfortable rather than lucky.

## To deploy

1. Decide on the media (at minimum: re-encode the two `.mkv` files to MP4, replace the large GIFs
   with MP4, and remove or replace the zero-byte `Robocon 1.mp4`).
2. Merge `redesign-3d` into `main`.
3. The workflow does the rest. Watch the Actions run; the artifact upload is the slow part.
