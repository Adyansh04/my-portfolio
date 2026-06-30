import HeroSection from "@/components/hero-section"
import { BentoGrid } from "@/components/bento-grid"
import { ExperienceTimeline } from "@/components/experience-timeline"
import { ProjectsGrid } from "@/components/projects-grid"
import { HackathonsSection } from "@/components/hackathons-section"
import { CredentialsAccordion } from "@/components/credentials-accordion"
import { ContactTerminal } from "@/components/contact-terminal"
import { ColorThemeProvider } from "@/components/color-theme-provider"
import { ColorThemeSwitcher } from "@/components/color-theme-switcher"
import { CursorEffectsProvider } from "@/components/animations"

export default function Page() {
  return (
    <ColorThemeProvider>
      <CursorEffectsProvider>
        <main>
          <HeroSection />
          <BentoGrid />
          <ExperienceTimeline />
          <ProjectsGrid />
          <HackathonsSection />
          <CredentialsAccordion />
          <ContactTerminal />
        </main>
        <ColorThemeSwitcher />
      </CursorEffectsProvider>
    </ColorThemeProvider>
  )
}
