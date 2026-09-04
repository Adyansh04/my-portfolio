import { ArrowRight, Mail } from 'lucide-react'
import { site } from '@/content/site'
import { IconByName } from '../ui/IconByName'

const BOOT_LINES = ['sensors ok', 'lidar ok', 'map empty', 'awaiting operator']

export function HeroSection() {
  return (
    <div className="hero-frame mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pb-24 pt-20 sm:px-10 lg:justify-start lg:pb-56 lg:pt-28">
      {/* boot log: runs once on load, not scroll-driven */}
      <ol className="boot-log mb-8 hidden font-mono text-[0.6875rem] leading-5 tracking-[0.12em] text-muted sm:block" aria-hidden>
        {BOOT_LINES.map((l, i) => (
          <li key={l} style={{ animationDelay: `${0.15 + i * 0.22}s` }}>
            <span className="text-accent">▸</span> {l}
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-accent">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        {site.status}
      </div>

      <h1 className="font-display mt-5 text-[clamp(64px,11vw,190px)] font-extrabold uppercase leading-[0.86] tracking-[0.005em] text-text">
        {site.name.split(' ').map((w) => (
          <span key={w} className="block">
            {w}
          </span>
        ))}
      </h1>

      <p className="mt-6 max-w-[26ch] text-[clamp(22px,2.6vw,38px)] font-medium leading-[1.1] tracking-tight text-text">
        {site.headline[0]} <span className="text-accent">{site.headline[1]}</span>
      </p>
      <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-muted sm:text-lg">{site.tagline}</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a href="#projects" className="group inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-[#141414] transition hover:brightness-110">
          {site.ctas.projects}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
        <a href="#contact" className="inline-flex items-center gap-2 rounded-md border border-grid px-5 py-2.5 text-sm font-medium text-text transition hover:border-muted">
          {site.ctas.contact}
          <Mail className="h-4 w-4" />
        </a>
        <div className="ml-2 flex items-center gap-4">
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              aria-label={s.label}
              className="text-muted transition-colors hover:text-accent"
            >
              <IconByName name={s.icon} className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>

      <div className="scroll-hint absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-3 font-mono text-[0.6875rem] tracking-[0.14em] text-muted">
        <span className="block h-px w-10 bg-grid" />
        scroll to explore
      </div>
    </div>
  )
}
