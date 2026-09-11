/** The seven zones of the mission = the seven sections of the page. Single source of truth for scroll lengths. */
import { experiences } from '../../content/experience'
import { projects } from '../../content/projects'

export interface ZoneDef {
  id: 'hero' | 'profile' | 'experience' | 'projects' | 'hackathons' | 'credentials' | 'contact'
  index: number
  /** HUD label */
  label: string
  title: string
  /** Section height in vh. The sticky frame is pinned for (scrollVh - 100) vh of scrolling. */
  scrollVh: number
  /** Number of content beats inside the zone. */
  beats: number
}

export const ZONES: ZoneDef[] = [
  { id: 'hero', index: 0, label: 'BOOT', title: 'Spawn', scrollVh: 220, beats: 3 },
  { id: 'profile', index: 1, label: 'ZONE 01', title: 'Profile', scrollVh: 260, beats: 3 },
  // One beat per role / project, so these grow with the content: 100vh for the pinned frame plus
  // ~75vh of scroll per item (540 and 850 at the original 6 and 10).
  { id: 'experience', index: 2, label: 'ZONE 02', title: 'Experience', scrollVh: 100 + Math.round(experiences.length * 73.3), beats: experiences.length },
  { id: 'projects', index: 3, label: 'ZONE 03', title: 'Projects', scrollVh: 100 + projects.length * 75, beats: projects.length },
  { id: 'hackathons', index: 4, label: 'ZONE 04', title: 'Hackathons', scrollVh: 240, beats: 3 },
  { id: 'credentials', index: 5, label: 'ZONE 05', title: 'Credentials', scrollVh: 300, beats: 3 },
  { id: 'contact', index: 6, label: 'ZONE 06', title: 'Dock', scrollVh: 260, beats: 3 },
]

export const TOTAL_VH = ZONES.reduce((s, z) => s + z.scrollVh, 0)
/** Scrollable distance in vh: the last frame stays pinned until the page bottom. */
export const SCROLL_VH = TOTAL_VH - 100

const starts = ZONES.map((_, i) => ZONES.slice(0, i).reduce((s, z) => s + z.scrollVh, 0))

export interface Location {
  zone: number
  zoneT: number
  beat: number
  beatT: number
}

/** Map master progress t ∈ [0,1] (scrollY / SCROLL_VH) to zone-local progress. Continuous across zone borders. */
export function locate(t: number): Location {
  const x = Math.min(1, Math.max(0, t)) * SCROLL_VH
  let zone = ZONES.length - 1
  for (let i = 0; i < ZONES.length; i++) {
    const pinned = ZONES[i].scrollVh - 100
    if (x < starts[i] + pinned || i === ZONES.length - 1) {
      zone = i
      break
    }
  }
  const z = ZONES[zone]
  const zoneT = Math.min(1, Math.max(0, (x - starts[zone]) / (z.scrollVh - 100)))
  const raw = zoneT * z.beats
  const beat = Math.min(z.beats - 1, Math.floor(raw))
  return { zone, zoneT, beat, beatT: Math.min(1, raw - beat) }
}

export const zoneById = (id: ZoneDef['id']) => ZONES.find((z) => z.id === id)!
