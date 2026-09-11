# Adding a role or a project

Everything the site shows about your work comes from the files in this folder. Adding an entry is
the whole job: the 3D corridor and hall, the robot's route, the scroll length, the timeline and
the cards all size themselves from these lists.

After any edit, run:

```bash
npm run check:content && npm run check:traffic && npx tsc --noEmit
```

`check:content` makes sure nothing that was on the site before has been lost (adding is always
fine). `check:traffic` tells you if the corridor or the hall has become too full.

## A new role (`experience.ts`)

1. Copy an existing entry and put it where it belongs in time. **Newest first**: array order is
   the order of the cards, the timeline, and the placards the robot walks past.
2. Give it the next free `id`. Ids only need to be unique.
3. Fill in the fields:

   | field | what it is |
   | --- | --- |
   | `title`, `company`, `location`, `period` | shown on the card, the timeline and the placard; keep `period` in the same style as the others, e.g. `Sept 2026 - Present` |
   | `gist` | one sentence: what the role was |
   | `points` | two or three short claims |
   | `highlights` | exactly two `{ metric, label }` pairs, e.g. `{ "metric": "ROS", "label": "Robotics Stack" }` |
   | `badges` | skills, shown as chips |
   | `description` | the full paragraph; nothing on the site is lost if it lives here |
   | `icon` | one of the names in `IconName` in `types.ts` (`Bot`, `Cpu`, `Code`, `Rocket`, ...) |
   | `logo` (optional) | a file in `public/logos/`, e.g. `"wzl.png"`. Without one the placard shows the company's initials |
   | `logoOnDark` (optional) | `true` if the logo is white on transparent and needs a dark plate |

**Capacity:** the corridor holds 11 roles. At 12, `check:traffic` fails. Past that point the
corridor needs a second row or more length, not tighter spacing.

## A new project (`projects.ts`)

1. Copy an existing entry. Array order is the order of the cards and the pedestals in the hall.
2. Give it the next free `id`. `award` is required: a string like `"1st Place"`, or `null`.
3. `details.mediaFolder` is the project's key. Make a folder with that name in
   `public/projects/` and put its images and videos there. Files are sorted by name, so prefix them
   `00-`, `01-`, ...; the prefix is dropped and the rest becomes the title
   (`01-frontier-exploration.mp4` becomes "Frontier Exploration"). The list of files is rebuilt on
   `npm run build`. In development, run `node scripts/generate-media-manifest.mjs` to see new
   media. No folder at all is fine: the sheet simply has no gallery.

That is enough for the project to appear everywhere. In the hall it gets a generic console: an
orbiting-data model under a screen showing its code, title and tags. Two optional extras make it
look like its own project:

- **Line-art glyph** (the animated drawing on the sheet and on the hologram screen): add a
  component to `components/glyphs/` and register it in `GLYPHS` in `components/glyphs/index.tsx`
  under the project's `mediaFolder`.
- **Custom hologram**: add a design under the same key to `SLAB_DESIGNS` in
  `components/mission/world/holograms/data/projects.ts`, and pick a stage for it in `STAGE_FOR` in
  `components/mission/world/holograms/tall/stages.tsx`. The `patrol` and `rows` stages also need
  an entry in `TRAFFIC` in the same data file; the others don't. `npm run check:holograms`
  validates it, and `/lab/tall` (under `npm run dev`) shows every console up close.

**Capacity:** the hall holds 15 projects. At 16, `check:traffic` fails.

## Not automatic

- **The AI assistant** answers from its own prompt in the Cloudflare Worker, which lives outside
  this repo. Tell it about new roles and projects there.
- **Static-mode posters** (`public/posters/zone-*.jpg`) are snapshots of the 3D world, used as the
  background on phones and for reduced-motion visitors. They show the placards and pedestals as
  they were when taken, blurred on phones. Re-take them with `npm run posters:shots` if the layout
  changes a lot.
- **Hackathons and credentials** still have a fixed number of places in the 3D world (three
  podiums, three archive rows), so a fourth hackathon needs a podium added first.
